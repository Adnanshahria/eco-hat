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

    const fixOrderSchema = async () => {
        setLoading(true);
        log("Checking ALL order columns (order_number, charges, etc)...");
        try {
            const { error: alterError } = await supabaseAdmin.rpc('exec_sql', {
                sql: `
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_charge INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cod_charge INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address JSONB DEFAULT '{}'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
NOTIFY pgrst, 'reload schema';
`
            }).single();

            if (alterError) {
                log(`RPC Error: ${alterError.message}`);
                log("Run this in SQL Editor:");
                log("ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT;");
                log("ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal INTEGER DEFAULT 0;");
                log("ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_charge INTEGER DEFAULT 0;");
                log("ALTER TABLE orders ADD COLUMN IF NOT EXISTS cod_charge INTEGER DEFAULT 0;");
                log("ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_history JSONB DEFAULT '[]'::jsonb;");
                log("ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address JSONB DEFAULT '{}'::jsonb;");
                await supabaseAdmin.rpc('exec_sql', { sql: `NOTIFY pgrst, 'reload schema';` });
            } else {
                log("Schema update command sent successfully for all columns.");
            }
        } catch (err: any) {
            log(`Fix error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fixOrderRLS = async () => {
        setLoading(true);
        log("Applying RLS policies for Orders...");
        try {
            const { error } = await supabaseAdmin.rpc('exec_sql', {
                sql: `
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;

CREATE POLICY "Users can view their own orders"
ON orders FOR SELECT
USING (
  buyer_id IN (
    SELECT id FROM users WHERE email = auth.jwt()->>'email'
  )
);

CREATE POLICY "Users can insert their own orders"
ON orders FOR INSERT
WITH CHECK (
  buyer_id IN (
    SELECT id FROM users WHERE email = auth.jwt()->>'email'
  )
);
NOTIFY pgrst, 'reload schema';
`
            });
            if (error) {
                log(`RLS Error: ${error.message}`);
                log("Run manually in SQL Editor:");
                log(`CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (buyer_id IN (SELECT id FROM users WHERE email = auth.jwt()->>'email'));`);
            } else {
                log("Order RLS policies applied.");
            }
        } catch (e: any) {
            log(e.message);
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
                        <Button onClick={fixOrderSchema} disabled={loading} variant="outline" className="w-full justify-start">
                            <CheckCircle className="mr-2 h-4 w-4" /> Fix Order Schema (Missing Columns)
                        </Button>
                        <Button onClick={fixOrderRLS} disabled={loading} variant="outline" className="w-full justify-start">
                            <CheckCircle className="mr-2 h-4 w-4" /> Fix Order Visibility (RLS)
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
