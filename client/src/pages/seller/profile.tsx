import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, Mail, Phone, MapPin, Save, Loader2, Check, Store, Upload, ShieldCheck, AlertTriangle } from "lucide-react";
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
    const [idUrl, setIdUrl] = useState(""); // Simplified upload (URL input for now)

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
        if (!profile || !idUrl) return;
        setSaving(true);
        try {
            await supabase.from("users").update({
                verification_status: "pending",
                identity_documents: [idUrl], // In real app, this would be storage URLs
            }).eq("id", profile.id);
            alert("Verification request submitted!");
            fetchProfile();
        } catch (err) {
            console.error("Verification error:", err);
        } finally {
            setSaving(false);
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
                                <p className="text-sm text-muted-foreground">Please provide a link to your NIC Card or Birth Registration Certificate (Google Drive, Dropbox, etc.). In a production environment, you would upload files directly.</p>

                                <div>
                                    <Label>Document URL</Label>
                                    <div className="flex gap-2">
                                        <Input value={idUrl} onChange={e => setIdUrl(e.target.value)} placeholder="https://..." />
                                        <Button variant="outline" size="icon"><Upload className="h-4 w-4" /></Button>
                                    </div>
                                </div>

                                <Button onClick={submitVerification} disabled={saving || !idUrl || !form.username || !form.phone} className="w-full bg-blue-600 hover:bg-blue-700">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit for Verification"}
                                </Button>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
