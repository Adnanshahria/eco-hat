import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Upload,
    Shield,
    ShieldCheck,
    Clock,
    AlertTriangle,
    FileText,
    X,
    Loader2,
    Send,
    CheckCircle2,
    Store,
    Save,
    ImagePlus,
    Plus,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { AppLink as Link } from "@/components/app-link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const shopTypes = ["Permanent Shop", "Pop-up Store", "Online Only", "Overseas Seller", "Home Business"];
const MAX_DOCUMENTS = 5;

export default function SellerVerification() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [appealMessage, setAppealMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    // Shop Details Form State
    const [shopForm, setShopForm] = useState({
        username: "",
        full_name: "",
        bio: "",
        phone: "",
        shop_location: "",
        shop_type: "Permanent Shop",
    });

    useEffect(() => {
        fetchProfile();
    }, [user]);

    const fetchProfile = async () => {
        if (!user?.email) return;
        const { data } = await supabase.from("users").select("*").eq("email", user.email).single();
        if (data) {
            setProfile(data);
            setAppealMessage(data.appeal_text || "");
            setShopForm({
                username: data.username || "",
                full_name: data.full_name || "",
                bio: data.bio || "",
                phone: data.phone || "",
                shop_location: data.shop_location || "",
                shop_type: data.shop_type || "Permanent Shop",
            });
            // Set existing logo preview
            if (data.avatar_url) {
                setLogoPreview(data.avatar_url);
            }
        }
        setLoading(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter(f => {
            if (f.size > 5 * 1024 * 1024) {
                alert(`File "${f.name}" is too large (max 5MB).`);
                return false;
            }
            return true;
        });

        const totalFiles = selectedFiles.length + validFiles.length;
        if (totalFiles > MAX_DOCUMENTS) {
            alert(`Maximum ${MAX_DOCUMENTS} documents allowed.`);
            return;
        }

        setSelectedFiles(prev => [...prev, ...validFiles]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert("Logo must be less than 2MB.");
                return;
            }
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const uploadLogo = async () => {
        if (!logoFile || !profile?.id) return null;

        setUploadingLogo(true);
        try {
            const fileExt = logoFile.name.split(".").pop();
            const fileName = `logo_${profile.user_id || profile.id}_${Date.now()}.${fileExt}`;

            await supabase.storage.from("product-images").upload(fileName, logoFile);
            const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);

            // Update avatar_url in database
            await supabase.from("users").update({ avatar_url: urlData.publicUrl }).eq("id", profile.id);

            return urlData.publicUrl;
        } catch (error) {
            console.error("Logo upload error:", error);
            return null;
        } finally {
            setUploadingLogo(false);
        }
    };

    const saveShopDetails = async () => {
        if (!profile?.id) return;
        setSavingProfile(true);
        try {
            // Upload logo if selected
            if (logoFile) {
                await uploadLogo();
            }

            const { error } = await supabase.from("users").update({
                username: shopForm.username,
                full_name: shopForm.full_name,
                bio: shopForm.bio,
                phone: shopForm.phone,
                shop_location: shopForm.shop_location,
                shop_type: shopForm.shop_type,
            }).eq("id", profile.id);

            if (error) throw error;
            alert("Shop details saved successfully!");
            setProfile((prev: any) => ({ ...prev, ...shopForm }));
            setLogoFile(null);
        } catch (error) {
            console.error(error);
            alert("Failed to save. Please try again.");
        } finally {
            setSavingProfile(false);
        }
    };

    const submitVerification = async () => {
        if (!profile?.id || selectedFiles.length === 0) {
            alert("Please upload at least one document.");
            return;
        }

        // Validate shop details before submitting
        if (!shopForm.username.trim() || !shopForm.full_name.trim() || !shopForm.phone.trim()) {
            alert("Please fill in all required shop details (Shop Name, Owner Name, Phone) before submitting for verification.");
            return;
        }

        setUploadingDoc(true);
        try {
            // Upload logo first if exists
            if (logoFile) {
                await uploadLogo();
            }

            // Upload all documents
            const documentUrls: string[] = [];
            for (const file of selectedFiles) {
                const fileExt = file.name.split(".").pop();
                const fileName = `${profile.user_id || profile.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                await supabase.storage.from("identity-documents").upload(fileName, file);
                const { data: urlData } = supabase.storage.from("identity-documents").getPublicUrl(fileName);
                documentUrls.push(urlData?.publicUrl || `document:${fileName}`);
            }

            // Save shop details and verification status together
            const { error } = await supabase.from("users").update({
                verification_status: "pending",
                identity_documents: documentUrls,
                username: shopForm.username,
                full_name: shopForm.full_name,
                bio: shopForm.bio,
                phone: shopForm.phone,
                shop_location: shopForm.shop_location,
                shop_type: shopForm.shop_type,
            }).eq("id", profile.id);

            if (error) throw error;

            alert("Verification request submitted! Admins will review your documents.");
            setSelectedFiles([]);
            setLogoFile(null);
            setProfile((prev: any) => ({ ...prev, verification_status: "pending", identity_documents: documentUrls, ...shopForm }));
        } catch (error) {
            console.error(error);
            alert("Upload failed. Please try again.");
        } finally {
            setUploadingDoc(false);
        }
    };

    const submitAppeal = async () => {
        if (!profile?.id || !appealMessage.trim()) return;
        setSubmitting(true);
        try {
            const { error } = await supabase.from("users").update({
                appeal_text: appealMessage,
                verification_status: "pending",
            }).eq("id", profile.id);

            if (error) throw error;

            alert("Appeal submitted successfully! Admins will review your request.");
            setProfile((prev: any) => ({ ...prev, appeal_text: appealMessage, verification_status: "pending" }));
        } catch (error) {
            console.error(error);
            alert("Failed to submit appeal. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-grass-pattern flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const verificationStatus = profile?.verification_status || "none";
    const isVerified = verificationStatus === "verified";
    const isPending = verificationStatus === "pending";
    const isRejected = verificationStatus === "rejected";

    return (
        <div className="min-h-screen bg-grass-pattern">
            <div className="max-w-3xl mx-auto p-6 lg:p-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/seller/dashboard">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            {t('common.back')}
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold font-display">{t('verification.title')}</h1>
                        <p className="text-muted-foreground">{t('verification.subtitle')}</p>
                    </div>
                </div>

                {/* Status Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl p-6 mb-6 border-2 ${isVerified ? "bg-emerald-50 border-emerald-200" :
                        isPending ? "bg-amber-50 border-amber-200" :
                            isRejected ? "bg-red-50 border-red-200" :
                                "bg-yellow-50 border-yellow-200"
                        }`}
                >
                    <div className="flex items-start gap-4">
                        <div className={`p-4 rounded-full ${isVerified ? "bg-emerald-100 text-emerald-600" :
                            isPending ? "bg-amber-100 text-amber-600" :
                                isRejected ? "bg-red-100 text-red-600" :
                                    "bg-yellow-100 text-yellow-600"
                            }`}>
                            {isVerified ? <ShieldCheck className="h-8 w-8" /> :
                                isPending ? <Clock className="h-8 w-8" /> :
                                    isRejected ? <AlertTriangle className="h-8 w-8" /> :
                                        <Shield className="h-8 w-8" />}
                        </div>
                        <div className="flex-1">
                            <h2 className={`text-xl font-bold mb-2 ${isVerified ? "text-emerald-800" :
                                isPending ? "text-amber-800" :
                                    isRejected ? "text-red-800" :
                                        "text-yellow-800"
                                }`}>
                                {isVerified ? "Account Verified ✓" :
                                    isPending ? "Verification Pending" :
                                        isRejected ? "Verification Rejected" :
                                            "Verification Required"}
                            </h2>
                            <p className={`${isVerified ? "text-emerald-700" :
                                isPending ? "text-amber-700" :
                                    isRejected ? "text-red-700" :
                                        "text-yellow-700"
                                }`}>
                                {isVerified ? "Congratulations! You have full access to all seller features." :
                                    isPending ? "Your documents are being reviewed. This usually takes 1-2 business days." :
                                        isRejected ? `Rejected: "${profile?.rejection_reason || 'Documents not valid'}"` :
                                            "Fill in your shop details and submit documents to start selling."}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Verified State */}
                {isVerified && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card rounded-2xl border p-6 text-center"
                    >
                        <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                        <h3 className="text-lg font-bold mb-2">You're All Set!</h3>
                        <p className="text-muted-foreground mb-6">Your account is fully verified. Start listing products now.</p>
                        <Link href="/seller/add-product">
                            <Button className="gap-2">Add Your First Product</Button>
                        </Link>
                    </motion.div>
                )}

                {/* Pending State */}
                {isPending && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card rounded-2xl border p-6"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Clock className="h-5 w-5 text-amber-600" />
                            <h3 className="font-bold">Documents Under Review</h3>
                        </div>
                        <p className="text-muted-foreground mb-4">
                            We're reviewing your submitted documents. You'll receive a notification once the review is complete.
                        </p>
                        <div className="bg-muted/50 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">
                                <strong>Estimated Time:</strong> 1-2 business days<br />
                                <strong>Submitted:</strong> {profile?.identity_documents?.[0] ? "Document uploaded" : "No document found"}
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Not Verified / Rejected States - Show Full Form */}
                {!isVerified && !isPending && (
                    <div className="space-y-6">
                        {/* Shop Details Form */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-card rounded-2xl border overflow-hidden"
                        >
                            <div className="p-4 border-b bg-muted/30">
                                <div className="flex items-center gap-2 mb-4">
                                    <Store className="h-5 w-5 text-primary" />
                                    <h2 className="text-xl font-semibold">{t('seller.shopDetails')}</h2>
                                </div>
                                <p className="text-sm text-muted-foreground">{t('seller.shopDetailsSubtitle')}</p>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <Label>{t('seller.shopName')}</Label>
                                            <Input
                                                value={shopForm.username}
                                                onChange={e => setShopForm({ ...shopForm, username: e.target.value })}
                                                placeholder={t('seller.shopNamePlaceholder')}
                                                disabled={profile?.role === "seller" || profile?.verification_status === "pending"}
                                            />
                                        </div>
                                        <div>
                                            <Label>{t('seller.ownerName')}</Label>
                                            <Input
                                                value={shopForm.full_name}
                                                onChange={e => setShopForm({ ...shopForm, full_name: e.target.value })}
                                                placeholder={t('seller.ownerNamePlaceholder')}
                                                disabled={profile?.role === "seller" || profile?.verification_status === "pending"}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{t('seller.bioDescription')}</Label>
                                        <Textarea
                                            value={shopForm.bio}
                                            onChange={e => setShopForm({ ...shopForm, bio: e.target.value })}
                                            placeholder={t('seller.bioDescriptionPlaceholder')}
                                            rows={3}
                                            disabled={profile?.role === "seller" || profile?.verification_status === "pending"}
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>{t('seller.phoneNumber')}</Label>
                                        <Input
                                            value={shopForm.phone}
                                            onChange={e => setShopForm({ ...shopForm, phone: e.target.value })}
                                            placeholder="+8801..."
                                            disabled={profile?.role === "seller" || profile?.verification_status === "pending"}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <Label>{t('seller.shopLocation')}</Label>
                                            <Input
                                                value={shopForm.shop_location}
                                                onChange={e => setShopForm({ ...shopForm, shop_location: e.target.value })}
                                                placeholder={t('seller.shopLocationPlaceholder')}
                                                disabled={profile?.role === "seller" || profile?.verification_status === "pending"}
                                            />
                                        </div>
                                        <div>
                                            <Label>{t('seller.businessType')}</Label>
                                            <select
                                                value={shopForm.shop_type}
                                                onChange={e => setShopForm({ ...shopForm, shop_type: e.target.value })}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                disabled={profile?.role === "seller" || profile?.verification_status === "pending"}
                                            >
                                                {shopTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 flex justify-end">
                                    <Button
                                        onClick={saveShopDetails}
                                        disabled={savingProfile || profile?.role === "seller" || profile?.verification_status === "pending"}
                                        className="mt-6"
                                    >
                                        {savingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                        {t('seller.saveDetails')}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Rejection Reason (if rejected) */}
                        {isRejected && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="bg-red-50 border border-red-200 rounded-xl p-4"
                            >
                                <h3 className="font-bold text-red-800 mb-2">Previous Rejection Reason:</h3>
                                <p className="text-red-700">{profile?.rejection_reason || "Documents were not valid"}</p>
                            </motion.div>
                        )}

                        {/* Document Upload */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-card rounded-2xl border p-6 space-y-6"
                        >
                            <div>
                                <div className="flex items-center gap-2 mb-6">
                                    <Shield className="h-5 w-5 text-primary" />
                                    <h2 className="text-xl font-semibold">{t('verification.submitDocuments')}</h2>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">{t('verification.submitDocumentsSubtitle')}</p>
                            </div>

                            {/* Shop Logo Upload */}
                            <div className="mb-6">
                                <Label className="text-sm font-semibold mb-2 block">Shop Logo (Optional)</Label>
                                <div className="flex items-center gap-4">
                                    {logoPreview ? (
                                        <div className="relative">
                                            <img src={logoPreview} alt="Logo" className="h-20 w-20 rounded-lg object-cover border" />
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute -top-2 -right-2 h-6 w-6"
                                                onClick={() => { setLogoFile(null); setLogoPreview(profile?.avatar_url || null); }}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div
                                            className="h-20 w-20 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/50"
                                            onClick={() => logoInputRef.current?.click()}
                                        >
                                            <ImagePlus className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={logoInputRef}
                                        className="hidden"
                                        accept=".jpg,.jpeg,.png,.webp"
                                        onChange={handleLogoSelect}
                                    />
                                    <div className="text-sm text-muted-foreground">
                                        <p>Your shop logo will be displayed publicly.</p>
                                        <p className="text-xs">Max 2MB • PNG, JPG, WebP</p>
                                    </div>
                                </div>
                            </div>

                            {/* Document Upload */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold">Identity Documents ({selectedFiles.length}/{MAX_DOCUMENTS})</Label>
                                    {selectedFiles.length < MAX_DOCUMENTS && (
                                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                            <Plus className="h-4 w-4 mr-1" /> Add Document
                                        </Button>
                                    )}
                                </div>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    multiple
                                    onChange={handleFileSelect}
                                />

                                {selectedFiles.length === 0 ? (
                                    <div
                                        className="border-2 border-dashed border-input rounded-xl p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Upload className="h-6 w-6 text-primary" />
                                        </div>
                                        <p className="font-medium text-foreground mb-1">{t('verification.uploadNID')}</p>
                                        <p className="text-sm text-muted-foreground mb-4">{t('verification.dragDrop')}</p>
                                        <p className="text-xs text-muted-foreground">JPG, PNG, PDF • Max 5MB each • Up to 5 files</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedFiles.map((file, index) => (
                                            <div key={index} className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg border">
                                                <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{file.name}</p>
                                                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeFile(index)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>


                            {/* Appeal Message for rejected users */}
                            {isRejected && (
                                <div>
                                    <Label className="text-sm font-semibold mb-2 block">Appeal Message (Optional)</Label>
                                    <Textarea
                                        value={appealMessage}
                                        onChange={(e) => setAppealMessage(e.target.value)}
                                        placeholder="Explain why your verification should be reconsidered..."
                                        rows={3}
                                    />
                                </div>
                            )}

                            <Button
                                className="w-full gap-2 h-12 text-base"
                                onClick={submitVerification}
                                disabled={uploadingDoc || selectedFiles.length === 0}
                            >
                                {uploadingDoc ? (
                                    <><Loader2 className="h-5 w-5 animate-spin" /> Uploading {selectedFiles.length} file(s)...</>
                                ) : (
                                    <><Send className="h-5 w-5" /> Submit for Verification</>
                                )}
                            </Button>

                            <p className="text-xs text-center text-muted-foreground">
                                Your documents will be securely stored and reviewed by our admin team.
                            </p>
                        </motion.div>
                    </div>
                )
                }

                {/* Help Section */}
                <div className="mt-8 text-center text-sm text-muted-foreground">
                    <p>Need help? Contact support at <span className="text-primary">support@ecohaat.com</span></p>
                </div>
            </div>
        </div>
    );
}

