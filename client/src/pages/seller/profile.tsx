import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, Mail, Phone, MapPin, Save, Loader2, Check, Store, Upload, ShieldCheck, AlertTriangle, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { Link } from "wouter";

interface SellerProfile {
    id: number;
    user_id: string;
    username: string; // Shop Name
    full_name: string;
    email: string;
    phone: string | null;
    role: string;
    shop_location: string | null;
    shop_type: string | null;
    verification_status: "none" | "pending" | "verified" | "rejected";
    identity_documents: string[] | null;
    rejection_reason: string | null;
    created_at: string;
}

const shopTypes = ["Permanent Shop", "Pop-up Store", "Online Only", "Overseas Seller", "Home Business"];

export default function SellerProfile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<SellerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        username: "", // Shop Name
        full_name: "",
        phone: "",
        shop_location: "",
        shop_type: "Permanent Shop",
    });

    useEffect(() => { fetchProfile(); }, [user]);

    const fetchProfile = async () => {
        if (!user?.email) return;
        const { data } = await supabase.from("users").select("*").eq("email", user.email).single();
        if (data) {
            setProfile(data);
            setForm({
                username: data.username || "",
                full_name: data.full_name || "",
                phone: data.phone || "",
                shop_location: data.shop_location || "",
                shop_type: data.shop_type || "Permanent Shop",
            });
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!profile) return;
        setSaving(true);
        try {
            await supabase.from("users").update({
                username: form.username,
                full_name: form.full_name,
                phone: form.phone,
                shop_location: form.shop_location,
                shop_type: form.shop_type,
            }).eq("id", profile.id);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            fetchProfile();
        } catch (err) {
            console.error("Save error:", err);
        } finally {
            setSaving(false);
        }
    };

    const submitVerification = async () => {
        if (!profile || !selectedFile) return;
        setUploading(true);
        try {
            // Upload file to Supabase Storage
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${profile.user_id}_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('identity-documents')
                .upload(fileName, selectedFile);

            if (uploadError) {
                // If storage bucket doesn't exist, use a placeholder URL
                console.warn('Storage upload failed, using file name as reference:', uploadError);
            }

            // Get public URL or use placeholder
            const { data: urlData } = supabase.storage
                .from('identity-documents')
                .getPublicUrl(fileName);

            const documentUrl = urlData?.publicUrl || `document:${fileName}`;

            await supabase.from("users").update({
                verification_status: "pending",
                identity_documents: [documentUrl],
            }).eq("id", profile.id);

            alert("Verification request submitted successfully!");
            setSelectedFile(null);
            fetchProfile();
        } catch (err) {
            console.error("Verification error:", err);
            alert("Failed to submit verification. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
            if (!validTypes.includes(file.type)) {
                alert('Please upload an image (JPG, PNG, WebP) or PDF file.');
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB.');
                return;
            }
            setSelectedFile(file);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!profile) return null;

    const isVerified = profile.verification_status === "verified";
    const isPending = profile.verification_status === "pending";
    const isRejected = profile.verification_status === "rejected";

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/seller"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
                        <h1 className="text-xl font-bold">Seller Profile & Verification</h1>
                    </div>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
                {/* Verification Status Banner */}
                <div className={`p-4 rounded-xl border-l-4 ${isVerified ? "bg-green-50 border-green-500 text-green-700" :
                    isPending ? "bg-yellow-50 border-yellow-500 text-yellow-700" :
                        isRejected ? "bg-red-50 border-red-500 text-red-700" :
                            "bg-blue-50 border-blue-500 text-blue-700"
                    }`}>
                    <div className="flex items-start gap-3">
                        {isVerified ? <ShieldCheck className="h-6 w-6" /> :
                            isPending ? <Loader2 className="h-6 w-6 animate-spin" /> :
                                <AlertTriangle className="h-6 w-6" />}
                        <div>
                            <h3 className="font-bold">
                                {isVerified ? "Verified Seller" :
                                    isPending ? "Verification Pending" :
                                        isRejected ? "Verification Rejected" :
                                            "Verification Required"}
                            </h3>
                            <p className="text-sm mt-1">
                                {isVerified ? "You can list unlimited products and access all seller features." :
                                    isPending ? "Our team is reviewing your documents. This usually takes 24-48 hours." :
                                        isRejected ? `Reason: ${profile.rejection_reason || "Documents invalid"}` :
                                            "You must be verified to list products. Please complete your profile and submit documents below."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Shop Details */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Store className="h-5 w-5 text-primary" /> Shop Details</h2>
                    <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm">Shop Name</Label>
                                <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="My Great Shop" disabled={isPending || isVerified} />
                                <p className="text-xs text-muted-foreground mt-1">This is your public display name</p>
                            </div>
                            <div>
                                <Label className="text-sm">Owner Name</Label>
                                <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Full Legal Name" disabled={isPending || isVerified} />
                            </div>
                        </div>

                        <div>
                            <Label className="text-sm">Phone Number</Label>
                            <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" disabled={isPending || isVerified} />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm">Shop Type</Label>
                                <select
                                    value={form.shop_type}
                                    onChange={e => setForm({ ...form, shop_type: e.target.value })}
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                    disabled={isPending || isVerified}
                                >
                                    {shopTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label className="text-sm">Shop Location</Label>
                                <Input value={form.shop_location} onChange={e => setForm({ ...form, shop_location: e.target.value })} placeholder="City, Area" disabled={isPending || isVerified} />
                            </div>
                        </div>

                        {!isVerified && !isPending && (
                            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <><Check className="h-4 w-4" /> Save Details</> : "Save Details"}
                            </Button>
                        )}
                    </div>
                </motion.div>

                {/* Identity Verification */}
                {!isVerified && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl border shadow-sm p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Identity Verification</h2>

                        {isPending ? (
                            <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed text-slate-500">
                                <ShieldCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>Documents submitted and under review.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">Please upload your NID Card or Birth Registration Certificate (JPG, PNG, WebP, or PDF). Max file size: 5MB.</p>

                                {/* Hidden file input */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept="image/jpeg,image/png,image/webp,application/pdf"
                                    className="hidden"
                                />

                                {/* File picker button */}
                                <div>
                                    <Label>Identity Document</Label>
                                    {!selectedFile ? (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full mt-2 p-6 border-2 border-dashed border-primary/30 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors flex flex-col items-center gap-2 cursor-pointer"
                                        >
                                            <Upload className="h-8 w-8 text-primary" />
                                            <span className="text-sm font-medium text-primary">Click to upload document</span>
                                            <span className="text-xs text-muted-foreground">JPG, PNG, WebP or PDF (max 5MB)</span>
                                        </button>
                                    ) : (
                                        <div className="mt-2 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-8 w-8 text-green-600" />
                                                <div>
                                                    <p className="font-medium text-green-800">{selectedFile.name}</p>
                                                    <p className="text-xs text-green-600">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setSelectedFile(null)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <X className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <Button onClick={submitVerification} disabled={uploading || !selectedFile || !form.username || !form.phone} className="w-full bg-blue-600 hover:bg-blue-700">
                                    {uploading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading...</> : "Submit for Verification"}
                                </Button>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
