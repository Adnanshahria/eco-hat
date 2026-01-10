import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import { Shield, Check, X, ArrowLeft, MapPin, Store, Mail, AlertTriangle, ExternalLink, Calendar, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { createNotification } from "@/components/notifications";
import { NavBar } from "@/components/navbar";

interface User {
    id: number;
    username: string; // Shop Name for sellers
    email: string;
    description: string;
    role: string;
    verification_status: string;
    shop_type: string;
    shop_location: string;
    identity_documents: string[];
    created_at: string;
    full_name: string;
    phone: string;
    bio: string;
}

export default function SellerVerificationDetail() {
    const { id } = useParams<{ id: string }>();
    const [, setLocation] = useLocation();
    const [seller, setSeller] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalAction, setModalAction] = useState<'approve' | 'reject' | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    useEffect(() => {
        if (id) fetchSeller();
    }, [id]);

    const fetchSeller = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            console.error(error);
        } else {
            setSeller(data);
        }
        setLoading(false);
    };

    const openModal = (action: 'approve' | 'reject') => {
        setModalAction(action);
        setRejectionReason("");
        setShowModal(true);
    };

    const confirmAction = async () => {
        if (!seller || !modalAction) return;

        setProcessing(true);
        setShowModal(false);

        const approved = modalAction === 'approve';
        const status = approved ? "verified" : "rejected";
        const reason = rejectionReason || "Documents did not match requirements.";

        const updateData: any = { verification_status: status };
        if (!approved) updateData.rejection_reason = reason;

        const { error } = await supabase.from("users").update(updateData).eq("id", seller.id);

        if (error) {
            console.error("Error updating status:", error);
            setProcessing(false);
            return;
        }

        // Notify Seller
        await createNotification(
            seller.id,
            approved ? "Seller Verification Approved" : "Seller Verification Rejected",
            approved
                ? "Congratulations! Your seller account has been approved. You can now list products."
                : `Your seller verification request was rejected. Reason: ${reason}`,
            approved ? "success" : "error"
        );

        if (approved) {
            // Ensure role is seller
            await supabase.from("users").update({ role: "seller" }).eq("id", seller.id);
        }

        setProcessing(false);
        setLocation("/admin"); // Return to dashboard
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!seller) return <div className="min-h-screen flex items-center justify-center">Seller not found</div>;

    return (
        <div className="min-h-screen bg-grass-pattern pb-20">
            <NavBar />

            <div className="max-w-4xl mx-auto px-4 py-8">
                <Button variant="ghost" className="mb-6 gap-2" onClick={() => setLocation("/admin")}>
                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Button>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold font-display text-emerald-950">Seller Verification Request</h1>
                        <p className="text-muted-foreground mt-1">Review the details below carefully before approving.</p>
                    </div>
                    <div className="flex bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> Pending Action
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Left Col: Shop Details */}
                    <div className="space-y-6">
                        <section className="bg-card border rounded-xl p-6 shadow-sm">
                            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2 border-b pb-2">
                                <Store className="h-5 w-5 text-emerald-600" /> Shop Overview
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase font-bold">Shop Name / Username</label>
                                    <p className="text-xl font-medium">{seller.username}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-muted-foreground uppercase font-bold">Category</label>
                                        <p className="font-medium bg-muted inline-block px-2 py-1 rounded text-sm mt-1">{seller.shop_type || "N/A"}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground uppercase font-bold">Registered</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>{new Date(seller.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase font-bold">Location</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span>{seller.shop_location || "Not provided"}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase font-bold">Bio</label>
                                    <p className="text-sm mt-1 italic text-muted-foreground">{seller.bio || "No bio info provided."}</p>
                                </div>
                            </div>
                        </section>

                        <section className="bg-card border rounded-xl p-6 shadow-sm">
                            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2 border-b pb-2">
                                <FileText className="h-5 w-5 text-emerald-600" /> Identity Documents
                            </h2>
                            {seller.identity_documents && seller.identity_documents.length > 0 ? (
                                <div className="space-y-4">
                                    {seller.identity_documents.map((doc, idx) => (
                                        <div key={idx} className="bg-muted/20 p-4 rounded-lg border flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-red-100 p-2 rounded text-red-600">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">Document {idx + 1}</p>
                                                    <p className="text-xs text-muted-foreground">Click to view original</p>
                                                </div>
                                            </div>
                                            <a href={doc} target="_blank" rel="noopener noreferrer">
                                                <Button size="sm" variant="outline" className="gap-2">
                                                    View <ExternalLink className="h-3 w-3" />
                                                </Button>
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-muted/20 rounded border border-dashed text-muted-foreground">
                                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    No documents uploaded
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right Col: Personal Info & Actions */}
                    <div className="space-y-6">
                        <section className="bg-card border rounded-xl p-6 shadow-sm">
                            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2 border-b pb-2">
                                <Shield className="h-5 w-5 text-emerald-600" /> Owner Information
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase font-bold">Full Name (Legal)</label>
                                    <p className="font-medium">{seller.full_name || seller.username}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase font-bold">Email Address</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <a href={`mailto:${seller.email}`} className="text-emerald-600 hover:universe">{seller.email}</a>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase font-bold">Phone</label>
                                    <p className="font-medium">{seller.phone || "N/A"}</p>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white border-2 border-emerald-100 rounded-xl p-6 shadow-lg sticky top-6">
                            <h3 className="font-bold text-lg mb-2">Verification Decision</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Please review all documents before performing an action. This will notify the user immediately.
                            </p>

                            <div className="flex flex-col gap-3">
                                <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={() => openModal('approve')} disabled={processing}>
                                    {processing && modalAction === 'approve' ? <Loader2 className="animate-spin" /> : <Check className="h-5 w-5" />}
                                    Approve Seller
                                </Button>
                                <Button size="lg" variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 gap-2" onClick={() => openModal('reject')} disabled={processing}>
                                    {processing && modalAction === 'reject' ? <Loader2 className="animate-spin" /> : <X className="h-5 w-5" />}
                                    Reject Application
                                </Button>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
                    >
                        <h3 className="text-lg font-bold mb-2">
                            {modalAction === 'approve' ? '✅ Approve Seller?' : '❌ Reject Application?'}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {modalAction === 'approve'
                                ? 'This will allow the seller to list products on the marketplace.'
                                : 'Please provide a reason for rejection. The seller will be notified.'}
                        </p>

                        {modalAction === 'reject' && (
                            <textarea
                                className="w-full border rounded-lg p-3 text-sm mb-4 focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Reason for rejection..."
                                rows={3}
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                        )}

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                className={`flex-1 ${modalAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
                                onClick={confirmAction}
                            >
                                {modalAction === 'approve' ? 'Approve' : 'Reject'}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
