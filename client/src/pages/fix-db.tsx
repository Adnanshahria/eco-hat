import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, Shield, Store, User } from "lucide-react";

// TEMPORARY: Service Role Key for Admin Operations
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWVkdnBzZWRqaG5jcGdsYmhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgzOTg2OSwiZXhwIjoyMDgzNDE1ODY5fQ.Pw0h22pPz9ldR-MjvDUdjwcZb37HbT-EK1RJELFwbh0";
const SUPABASE_URL = "https://pmqedvpsedjhncpglbhh.supabase.co";

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

export default function FixDatabase() {
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [targetEmail, setTargetEmail] = useState("");

    const log = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    const fixBucket = async () => {
        setLoading(true);
        log("Checking 'identity-documents' bucket...");
        try {
            const { data: buckets } = await supabaseAdmin.storage.listBuckets();
            const exists = buckets?.find(b => b.name === 'identity-documents');
            if (!exists) {
                log("Bucket missing. Creating 'identity-documents'...");
                await supabaseAdmin.storage.createBucket('identity-documents', {
                    public: true,
                    fileSizeLimit: 5242880,
                    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'image/gif']
                });
                log("Bucket created successfully!");
            } else {
                log("Bucket exists. Ensuring it's public...");
                if (!exists.public) await supabaseAdmin.storage.updateBucket('identity-documents', { public: true });
                log("Bucket is public.");
            }

            // Check product-images bucket
            const imagesExists = buckets?.find(b => b.name === 'product-images');
            if (!imagesExists) {
                log("Bucket 'product-images' missing. Creating...");
                await supabaseAdmin.storage.createBucket('product-images', {
                    public: true,
                    fileSizeLimit: 10485760, // 10MB
                    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
                });
                log("Bucket 'product-images' created!");
            } else {
                if (!imagesExists.public) await supabaseAdmin.storage.updateBucket('product-images', { public: true });
                log("Bucket 'product-images' checked.");
            }
        } catch (err: any) {
            log(`Bucket error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fixProductSchema = async () => {
        setLoading(true);
        log("Checking 'status' column on products table...");
        try {
            // Try to add the status column - Supabase will error if column exists, which is fine
            const { error: alterError } = await supabaseAdmin.rpc('exec_sql', {
                sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';`
            }).single();

            if (alterError) {
                // If RPC doesn't exist or fails, try a direct workaround
                log("RPC not available. Trying direct column check...");

                // Just update any products with null status to 'pending'
                const { error: updateError } = await supabaseAdmin
                    .from("products")
                    .update({ status: 'pending' })
                    .is("status", null);

                if (updateError && !updateError.message.includes("null")) {
                    log(`Note: ${updateError.message}`);
                } else {
                    log("Updated any NULL statuses to 'pending'.");
                }
            } else {
                log("Status column verified/added.");
            }

            // Check current pending products count
            const { data: pendingProducts, error: countError } = await supabaseAdmin
                .from("products")
                .select("id, name, status")
                .eq("status", "pending");

            if (countError) {
                log(`Query error: ${countError.message}`);
            } else {
                log(`Found ${pendingProducts?.length || 0} pending products.`);
                pendingProducts?.forEach(p => log(`  - ID ${p.id}: ${p.name}`));
            }

            log("Product schema fix complete!");
        } catch (err: any) {
            log(`Schema fix error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const updateUserRole = async (role: string) => {
        if (!targetEmail) return log("Please enter an email address.");
        setLoading(true);
        log(`Updating ${targetEmail} to '${role}'...`);
        try {
            const { data: users } = await supabaseAdmin.from("users").select("*").eq("email", targetEmail);
            if (users && users.length > 0) {
                const user = users[0];
                const { error } = await supabaseAdmin.from("users").update({ role }).eq("id", user.id);
                if (error) log(`Failed: ${error.message}`);
                else log(`Success! User is now a ${role}.`);
            } else {
                log("User not found in database. (Check exact email)");
            }
        } catch (err: any) {
            log(`Role update error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Database Repair & Role Manager</CardTitle>
                    <CardDescription>Fix storage buckets and manually assigning roles.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Bucket Fix */}
                    <div className="space-y-2 p-4 bg-white rounded-lg border">
                        <Label>System Health</Label>
                        <Button onClick={fixBucket} disabled={loading} variant="outline" className="w-full justify-start">
                            <CheckCircle className="mr-2 h-4 w-4" /> Ensure Storage Buckets Exist
                        </Button>
                        <Button onClick={fixProductSchema} disabled={loading} variant="outline" className="w-full justify-start">
                            <CheckCircle className="mr-2 h-4 w-4" /> Fix Product Schema & Visibility
                        </Button>
                    </div>

                    {/* Role Manager */}
                    <div className="space-y-4 p-4 bg-white rounded-lg border">
                        <Label>User Role Manager</Label>
                        <Input
                            placeholder="Enter user email (e.g., test-seller-3@gmail.com)"
                            value={targetEmail}
                            onChange={e => setTargetEmail(e.target.value)}
                        />
                        <div className="grid grid-cols-3 gap-2">
                            <Button onClick={() => updateUserRole("buyer")} disabled={loading} variant="secondary" className="text-xs">
                                <User className="mr-2 h-3 w-3" /> Make Buyer
                            </Button>
                            <Button onClick={() => updateUserRole("seller")} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white text-xs">
                                <Store className="mr-2 h-3 w-3" /> Make Seller
                            </Button>
                            <Button onClick={() => updateUserRole("admin")} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white text-xs">
                                <Shield className="mr-2 h-3 w-3" /> Make Admin
                            </Button>
                        </div>
                    </div>

                    <div className="bg-black/90 text-green-400 font-mono text-xs p-4 rounded-lg h-48 overflow-auto border border-green-900 shadow-inner">
                        {logs.length === 0 ? <span className="text-gray-500 opacity-50">Log output will appear here...</span> : logs.map((l, i) => <div key={i}>{l}</div>)}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
