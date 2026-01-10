import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Plus, TrendingUp, DollarSign, ShoppingCart, LogOut, Trash2, Clock, Check, X, Truck, AlertCircle, Wallet, AlertTriangle, User, Store, ShieldCheck, FileText, Upload, Save, Loader2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { createNotification } from "@/components/notifications";
import { AppLink as Link } from "@/components/app-link";
import SellerLayout from "@/components/seller-layout";

import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Product {
    id: number;
    name: string;
    price: number;
    stock: number;
    images: string[] | null;
    status: "approved" | "pending" | "rejected";
    rejection_reason?: string;
    created_at: string;
}

interface OrderItem {
    id: number;
    quantity: number;
    price_at_purchase: number;
    seller_earning: number;
    item_status: string;
    denial_reason: string | null;
    order: {
        id: number;
        order_number: string;
        status: string;
        phone: string;
        total_amount: number;
        shipping_address: any;
        created_at: string;
        buyer: { username: string; email: string };
    };
    product: { name: string };
}

interface Stats {
    totalProducts: number;
    pendingOrders: number;
    confirmedOrders: number;
    deliveredOrders: number;
    totalEarnings: number;
    pendingEarnings: number;
    productStats: {
        approved: number;
        pending: number;
        rejected: number;
    };
}

const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    denied: "bg-red-100 text-red-700",
    processing: "bg-purple-100 text-purple-700",
    shipped: "bg-indigo-100 text-indigo-700",
    at_station: "bg-cyan-100 text-cyan-700",
    reached_destination: "bg-teal-100 text-teal-700",
    delivered: "bg-green-100 text-green-700",
};

const shopTypes = ["Permanent Shop", "Pop-up Store", "Online Only", "Overseas Seller", "Home Business"];

type TabType = "dashboard" | "products" | "orders" | "earnings" | "account";

export default function SellerDashboard() {
    const { user, signOut } = useAuth();
    const { t } = useLanguage();

    // Check URL for specific routes - use the match boolean (first element), not params
    const [isOrdersRoute] = useRoute("/seller/orders");
    const [isProductsRoute] = useRoute("/seller/products");
    const [isEarningsRoute] = useRoute("/seller/earnings");
    const [isAccountRoute] = useRoute("/seller/account");

    // Determine active tab from URL using the match booleans
    const getActiveTab = (): TabType => {
        if (isOrdersRoute) return "orders";
        if (isProductsRoute) return "products";
        if (isEarningsRoute) return "earnings";
        if (isAccountRoute) return "account";
        return "dashboard";
    };

    // Use a computed value directly instead of useState to avoid stale state on initial render
    const activeTab = getActiveTab();

    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [sellerId, setSellerId] = useState<number | null>(null);
    const [stats, setStats] = useState<Stats>({
        totalProducts: 0, pendingOrders: 0, confirmedOrders: 0, deliveredOrders: 0, totalEarnings: 0, pendingEarnings: 0,
        productStats: { approved: 0, pending: 0, rejected: 0 }
    });
    const [loading, setLoading] = useState(true);
    const [denyModal, setDenyModal] = useState<{ itemId: number; reason: string } | null>(null);
    const [trackingModal, setTrackingModal] = useState<{ orderNumber: string; trackingHistory: Array<{ status: string; timestamp: string; note: string }> } | null>(null);
    const [productFilter, setProductFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");

    // Profile & Account State
    const [profile, setProfile] = useState<any>(null);
    const [accountForm, setAccountForm] = useState({
        username: "", // Shop Name
        full_name: "",
        phone: "",
        bio: "",
        shop_location: "",
        shop_type: "Permanent Shop",
    });
    const [savingProfile, setSavingProfile] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Termination State
    const [isTerminated, setIsTerminated] = useState(false);
    const [terminationReason, setTerminationReason] = useState("");
    const [appealText, setAppealText] = useState("");
    const [existingAppeal, setExistingAppeal] = useState("");
    const [submittingAppeal, setSubmittingAppeal] = useState(false);

    useEffect(() => { fetchData(); }, [user]);

    const fetchData = async () => {
        setLoading(true);
        const { data: profileData } = await supabase.from("users").select("*").eq("email", user?.email).single();
        if (!profileData) return;

        setSellerId(profileData.id);
        setProfile(profileData);
        setAccountForm({
            username: profileData.username || "",
            full_name: profileData.full_name || "",
            phone: profileData.phone || "",
            bio: profileData.bio || "",
            shop_location: profileData.shop_location || "",
            shop_type: profileData.shop_type || "Permanent Shop",
        });

        // Check for termination
        if (profileData.verification_status === "terminated") {
            setIsTerminated(true);
            setTerminationReason(profileData.termination_reason || "Violation of policies");
            setExistingAppeal(profileData.appeal_text || "");
            setLoading(false);
            return; // Stop fetching other data if terminated
        }

        // Fetch products
        const { data: productsData } = await supabase.from("products").select("*").eq("seller_id", profileData.id).order("created_at", { ascending: false });
        if (productsData) {
            setProducts(productsData as Product[]);
        }

        // Fetch orders containing seller's products
        const { data: ordersData, error: ordersError } = await supabase
            .from("order_items")
            .select(`
                id, quantity, price_at_purchase, seller_earning, item_status, denial_reason, payment_received, payment_sent_to_seller,
                order:orders!order_id (id, order_number, status, phone, total_amount, shipping_address, created_at),
                product:products!product_id (name)
            `)
            .eq("seller_id", profileData.id)
            .order("id", { ascending: false });

        if (ordersError) {
            console.error("Orders fetch error:", ordersError);
        }

        let pendingOrdersCount = 0;
        let confirmedOrdersCount = 0;
        let totalEarnings = 0;
        let pendingEarnings = 0;

        if (ordersData) {
            setOrders(ordersData as unknown as OrderItem[]);
            const pending = ordersData.filter((o: any) => o.item_status === "pending" || !o.item_status);
            const confirmed = ordersData.filter((o: any) => o.item_status === "confirmed");
            const delivered = ordersData.filter((o: any) => o.item_status === "delivered" || o.order?.status === "delivered");
            totalEarnings = delivered.reduce((sum: number, o: any) => sum + (o.seller_earning || (o.price_at_purchase || 0) * o.quantity), 0);
            pendingEarnings = confirmed.reduce((sum: number, o: any) => sum + (o.seller_earning || o.price_at_purchase * o.quantity), 0);
            pendingOrdersCount = pending.length;
            confirmedOrdersCount = confirmed.length;
        }

        // Count delivered orders
        const deliveredOrdersCount = ordersData?.filter((o: any) => o.item_status === "delivered" || o.order?.status === "delivered").length || 0;

        // Product Stats - calculated from productsData (ALWAYS runs)
        const pStats = {
            approved: productsData?.filter((p: Product) => p.status === 'approved').length || 0,
            pending: productsData?.filter((p: Product) => p.status === 'pending').length || 0,
            rejected: productsData?.filter((p: Product) => p.status === 'rejected').length || 0,
        };

        setStats({
            totalProducts: productsData?.length || 0,
            pendingOrders: pendingOrdersCount,
            confirmedOrders: confirmedOrdersCount,
            deliveredOrders: deliveredOrdersCount,
            totalEarnings,
            pendingEarnings,
            productStats: pStats
        });

        setLoading(false);
    };

    // Account Actions
    const handleUpdateProfile = async () => {
        if (!sellerId) return;
        setSavingProfile(true);
        const { error } = await supabase.from("users").update({
            username: accountForm.username,
            full_name: accountForm.full_name,
            phone: accountForm.phone,
            bio: accountForm.bio,
            shop_location: accountForm.shop_location,
            shop_type: accountForm.shop_type,
        }).eq("id", sellerId);

        if (!error) {
            alert("Profile updated successfully!");
            // Update local profile state
            setProfile((prev: any) => ({ ...prev, ...accountForm }));
        } else {
            alert("Failed to update profile.");
        }
        setSavingProfile(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB.');
                return;
            }
            setSelectedFile(file);
        }
    };

    const submitVerification = async () => {
        if (!sellerId || !selectedFile || !profile.user_id) return;
        setUploadingDoc(true);
        try {
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${profile.user_id}_${Date.now()}.${fileExt}`;
            await supabase.storage.from('identity-documents').upload(fileName, selectedFile);
            const { data: urlData } = supabase.storage.from('identity-documents').getPublicUrl(fileName);
            const documentUrl = urlData?.publicUrl || `document:${fileName}`;

            console.log("DEBUG: Submitting verification...", { sellerId });
            const { error: updateError } = await supabase.from("users").update({
                verification_status: "pending",
                role: "uv-seller", // Set role to unverified seller
                identity_documents: [documentUrl],
            }).eq("id", sellerId);

            if (updateError) {
                console.error("DEBUG: Update Error:", updateError);
                throw updateError;
            }

            console.log("DEBUG: Verification submitted successfully.");

            alert("Verification documents submitted!");
            setSelectedFile(null);
            setProfile((prev: any) => ({ ...prev, verification_status: "pending", role: "uv-seller", identity_documents: [documentUrl] }));
        } catch (error) {
            console.error(error);
            alert("Upload failed.");
        } finally {
            setUploadingDoc(false);
        }
    };

    // Helper: Update tracking history and notify buyer (in-app + email)
    const updateOrderTracking = async (orderId: number, newStatus: string, note: string, buyerId?: number) => {
        // Get current order to update tracking history
        const { data: orderData } = await supabase.from("orders").select("tracking_history, buyer_id, order_number").eq("id", orderId).single();
        if (orderData) {
            const history = orderData.tracking_history || [];
            history.push({ status: newStatus, timestamp: new Date().toISOString(), note });
            await supabase.from("orders").update({ tracking_history: history, status: newStatus }).eq("id", orderId);

            // Notify buyer (in-app)
            const bId = buyerId || orderData.buyer_id;
            if (bId) {
                await createNotification(
                    bId,
                    `📦 Order Update`,
                    note,
                    "info"
                );

                // Send email to buyer
                const { data: buyerData } = await supabase.from("users").select("email").eq("id", bId).single();
                if (buyerData?.email) {
                    fetch("/api/notifications/order-status", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: buyerData.email,
                            orderId,
                            orderNumber: orderData.order_number || orderId,
                            status: newStatus,
                            note
                        }),
                    }).catch(err => console.error("Failed to send buyer email:", err));
                }
            }

            // Notify Admin
            fetch("/api/notifications/admin/order-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderNumber: orderData.order_number || orderId,
                    status: newStatus,
                    note
                }),
            }).catch(err => console.error("Failed to send admin email:", err));

            // Notify Seller (in-app + email)
            if (sellerId) {
                await createNotification(
                    sellerId,
                    `📦 Order #${orderData.order_number || orderId} Update`,
                    `Status changed to ${newStatus.replace(/_/g, " ")}. ${note}`,
                    "info"
                );

                // Get seller email and send notification
                const { data: sellerData } = await supabase.from("users").select("email, username").eq("id", sellerId).single();
                if (sellerData?.email) {
                    fetch("/api/notifications/seller/order-status", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: sellerData.email,
                            orderNumber: orderData.order_number || orderId,
                            status: newStatus,
                            buyerName: "Customer"
                        }),
                    }).catch(err => console.error("Failed to send seller email:", err));
                }
            }
        }
    };

    const acceptOrder = async (itemId: number, orderId: number, buyerId?: number) => {
        await supabase.from("order_items").update({ item_status: "confirmed" }).eq("id", itemId);
        setOrders(orders.map(o => o.id === itemId ? { ...o, item_status: "confirmed" } : o));
        await updateOrderTracking(orderId, "confirmed", "Your order has been confirmed by the seller.");
    };

    const markProcessing = async (itemId: number, orderId: number) => {
        await supabase.from("order_items").update({ item_status: "processing" }).eq("id", itemId);
        setOrders(orders.map(o => o.id === itemId ? { ...o, item_status: "processing" } : o));
        await updateOrderTracking(orderId, "processing", "Your order is being processed and prepared for shipping.");
    };

    const denyOrder = async () => {
        if (!denyModal) return;
        const order = orders.find(o => o.id === denyModal.itemId);
        await supabase.from("order_items").update({ item_status: "denied", denial_reason: denyModal.reason }).eq("id", denyModal.itemId);
        setOrders(orders.map(o => o.id === denyModal.itemId ? { ...o, item_status: "denied", denial_reason: denyModal.reason } : o));
        if (order?.order?.id) {
            await updateOrderTracking(order.order.id, "denied", `Order denied by seller: ${denyModal.reason}`);
        }
        setDenyModal(null);
    };

    const updateToShipped = async (itemId: number, orderId: number) => {
        await supabase.from("order_items").update({ item_status: "shipped" }).eq("id", itemId);
        setOrders(orders.map(o => o.id === itemId ? { ...o, item_status: "shipped" } : o));
        await updateOrderTracking(orderId, "shipped", "Your order has been shipped and is on the way!");
    };

    const updateToAtStation = async (itemId: number, orderId: number) => {
        await supabase.from("order_items").update({ item_status: "at_station" }).eq("id", itemId);
        setOrders(orders.map(o => o.id === itemId ? { ...o, item_status: "at_station" } : o));
        await updateOrderTracking(orderId, "at_station", "Your order has arrived at the local delivery station.");
    };

    const updateToReachedDestination = async (itemId: number, orderId: number) => {
        await supabase.from("order_items").update({ item_status: "reached_destination" }).eq("id", itemId);
        setOrders(orders.map(o => o.id === itemId ? { ...o, item_status: "reached_destination" } : o));
        await updateOrderTracking(orderId, "reached_destination", "Your order is ready for delivery! Please confirm receipt when you receive it.");
    };

    const submitAppeal = async () => {
        if (!appealText.trim() || !sellerId) return;
        setSubmittingAppeal(true);
        await supabase.from("users").update({ appeal_text: appealText }).eq("id", sellerId);
        setExistingAppeal(appealText);
        setSubmittingAppeal(false);
        alert("Appeal submitted successfully! Admins will review your request.");
    };

    const deleteProduct = async (productId: number) => {
        if (!confirm("Delete this product?")) return;
        await supabase.from("products").delete().eq("id", productId);
        setProducts(products.filter(p => p.id !== productId));
    };

    const showTracking = async (orderId: number, orderNumber: string) => {
        const { data } = await supabase.from("orders").select("tracking_history").eq("id", orderId).single();
        if (data?.tracking_history) {
            setTrackingModal({ orderNumber, trackingHistory: data.tracking_history });
        } else {
            setTrackingModal({ orderNumber, trackingHistory: [] });
        }
    };

    const pendingOrders = orders.filter(o => o.item_status === "pending" || !o.item_status);
    const activeOrders = orders.filter(o => ["confirmed", "processing", "shipped", "at_station"].includes(o.item_status || ""));

    // Terminated View
    if (isTerminated) {
        return (
            <div className="min-h-screen bg-grass-pattern flex flex-col items-center p-8">
                <div className="max-w-2xl w-full">
                    <div className="flex items-center gap-2 mb-8 justify-center">
                        <img src={`${import.meta.env.BASE_URL}logo-en.png`} alt="EcoHaat" className="h-12" />
                    </div>
                    <div className="bg-red-50 border-l-4 border-red-600 rounded-lg p-6 mb-6 shadow-sm">
                        <div className="flex items-start gap-4">
                            <AlertTriangle className="h-8 w-8 text-red-600 flex-shrink-0" />
                            <div>
                                <h1 className="text-xl font-bold text-red-800 mb-2">{t('sellerDashboard.terminated.title')}</h1>
                                <p className="text-red-700 mb-4">{t('sellerDashboard.terminated.message')}</p>
                                <div className="bg-red-100 p-3 rounded-md border border-red-200">
                                    <p className="text-xs text-red-800 font-bold uppercase mb-1">{t('sellerDashboard.terminated.reason')}</p>
                                    <p className="text-red-900 font-medium">"{terminationReason}"</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Appeal Section UI (Keep existing) */}
                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                        {/* ... (Existing Appeal UI) ... */}
                        <div className="flex justify-end pt-4">
                            <Button variant="outline" onClick={signOut}>{t('sellerDashboard.logout')}</Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const verificationStatus = profile?.verification_status || "none";
    console.log("DEBUG: verificationStatus:", verificationStatus, "Profile:", profile);
    const isVerified = verificationStatus === "verified";
    const isPending = verificationStatus === "pending";
    const isRejected = verificationStatus === "rejected";

    return (
        <div className="min-h-screen bg-grass-pattern flex flex-col lg:flex-row">
            {/* Mobile Header - Logo only */}
            <header className="lg:hidden sticky top-0 z-50 bg-card border-b border-border p-3 flex items-center justify-center gap-2">
                <Link href="/"><img src={`${import.meta.env.BASE_URL}logo-en.png`} alt="EcoHaat" className="h-8 cursor-pointer" /></Link>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{t('footer.shop')}</span>
            </header>

            {/* Desktop Sidebar */}
            <aside className="w-64 bg-card border-r border-border p-4 flex-shrink-0 hidden lg:flex flex-col">
                <div className="flex items-center gap-2 mb-8 px-2">
                    <Link href="/"><img src={`${import.meta.env.BASE_URL}logo-en.png`} alt="EcoHaat" className="h-8 cursor-pointer" /></Link>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">Seller Portal</span>
                </div>
                <nav className="space-y-1 flex-1">
                    {[
                        { id: "dashboard", route: "/seller", icon: TrendingUp, label: t('sellerDashboard.overview') },
                        { id: "orders", route: "/seller/orders", icon: ShoppingCart, label: t('sellerDashboard.orders'), badge: stats.pendingOrders },
                        { id: "products", route: "/seller/products", icon: Package, label: t('sellerDashboard.products') },
                        { id: "earnings", route: "/seller/earnings", icon: Wallet, label: t('sellerDashboard.earnings') },
                        { id: "account", route: "/seller/account", icon: User, label: t('sellerDashboard.account') },
                        { id: "verification", route: "/seller/verification", icon: ShieldCheck, label: t('sellerDashboard.verifyAccount'), highlight: !isVerified },
                    ].map(tItem => (
                        <Link key={tItem.id} href={tItem.route}>
                            <div className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeTab === tItem.id ? "bg-primary text-primary-foreground shadow-md" : (tItem as any).highlight ? "hover:bg-yellow-50 text-yellow-700 border border-yellow-200" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}>
                                <tItem.icon className="h-4 w-4" /> {tItem.label}
                                {tItem.badge ? <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full">{tItem.badge}</span> : null}
                            </div>
                        </Link>
                    ))}
                </nav>
                <div className="mt-auto pt-4 border-t">
                    <Link href="/seller/add-product"><Button className="w-full gap-2 mb-3 bg-emerald-600 hover:bg-emerald-700 text-white"><Plus className="h-4 w-4" />{t('sellerDashboard.addNewProduct')}</Button></Link>
                    <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"><LogOut className="h-4 w-4" />{t('sellerDashboard.logout')}</Button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 p-3 lg:p-8 overflow-auto pb-24 lg:pb-8 bg-muted/10">
                <div className="max-w-6xl mx-auto">
                    {/* Header Title */}
                    <motion.div
                        key={activeTab + "-header"}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mb-4 lg:mb-6"
                    >
                        <h1 className="text-xl lg:text-2xl font-bold font-display capitalize">
                            {activeTab === 'dashboard' ? t('sellerDashboard.dashboardOverview') :
                                activeTab === 'orders' ? t('sellerDashboard.orders') :
                                    activeTab === 'products' ? t('sellerDashboard.products') :
                                        activeTab === 'earnings' ? t('sellerDashboard.earnings') :
                                            activeTab === 'account' ? t('sellerDashboard.account') :
                                                activeTab}
                        </h1>
                    </motion.div>

                    {/* Tab Content with Smooth Animations */}
                    <AnimatePresence mode="wait">
                        {/* Account Tab */}
                        {activeTab === "account" && (
                            <motion.div
                                key="account-tab"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="grid lg:grid-cols-3 gap-4 lg:gap-6"
                            >
                                {/* Left Column: Verification & Stats */}
                                <div className="space-y-6">
                                    {/* Verification Status Card - Simplified */}
                                    <div className={`border rounded-xl p-5 ${isVerified ? "bg-emerald-50 border-emerald-200" : isPending ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"}`}>
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-full ${isVerified ? "bg-emerald-100 text-emerald-600" : isPending ? "bg-yellow-100 text-yellow-600" : "bg-red-100 text-red-600"}`}>
                                                {isVerified ? <ShieldCheck className="h-6 w-6" /> : isPending ? <Clock className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className={`font-bold ${isVerified ? "text-emerald-800" : isPending ? "text-yellow-800" : "text-red-800"}`}>
                                                    {isVerified ? t('sellerDashboard.accountTab.accountVerified') : isPending ? t('sellerDashboard.accountTab.verificationPending') : isRejected ? t('sellerDashboard.accountTab.verificationFailed') : t('sellerDashboard.accountTab.verificationRequired')}
                                                </h3>
                                                <p className="text-sm mt-1 mb-3 opacity-90">
                                                    {isVerified ? t('sellerDashboard.accountTab.fullAccess') : isPending ? t('sellerDashboard.accountTab.docsReview') : t('sellerDashboard.accountTab.verifyToList')}
                                                </p>

                                                {/* Seller Info */}
                                                <div className="bg-white/60 rounded-lg p-3 border border-black/5 space-y-1 text-sm mb-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">{t('sellerDashboard.accountTab.sellerId')}:</span>
                                                        <span className="font-mono font-medium">{profile?.id || "-"}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">{t('sellerDashboard.accountTab.shopName')}:</span>
                                                        <span className="font-medium">{profile?.username || "-"}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">{t('sellerDashboard.accountTab.status')}:</span>
                                                        <span className={`font-medium ${isVerified ? "text-emerald-600" : isPending ? "text-yellow-600" : "text-red-600"}`}>
                                                            {isVerified ? t('sellerDashboard.accountTab.verified') : isPending ? t('sellerDashboard.accountTab.pendingReview') : t('sellerDashboard.accountTab.notVerified')}
                                                        </span>
                                                    </div>
                                                </div>

                                                {!isVerified && (
                                                    <Link href="/seller/verification">
                                                        <Button size="sm" className="w-full gap-2" variant={isPending ? "outline" : "default"}>
                                                            <ShieldCheck className="h-4 w-4" />
                                                            {isPending ? t('sellerDashboard.accountTab.viewStatus') : t('sellerDashboard.accountTab.goToVerification')}
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Product Stats Card */}
                                    <div className="bg-card border rounded-xl p-5 shadow-sm">
                                        <h3 className="font-semibold mb-4 flex items-center gap-2"><Package className="h-4 w-4" /> {t('sellerDashboard.accountTab.productStatus')}</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-2 rounded bg-emerald-50 text-emerald-900 border border-emerald-100">
                                                <span className="text-sm font-medium flex items-center gap-2"><Check className="h-3 w-3" /> {t('status.approved')}</span>
                                                <span className="font-bold">{stats.productStats.approved}</span>
                                            </div>
                                            <div className="flex items-center justify-between p-2 rounded bg-yellow-50 text-yellow-900 border border-yellow-100">
                                                <span className="text-sm font-medium flex items-center gap-2"><Clock className="h-3 w-3" /> {t('status.pending')}</span>
                                                <span className="font-bold">{stats.productStats.pending}</span>
                                            </div>
                                            <div className="flex items-center justify-between p-2 rounded bg-red-50 text-red-900 border border-red-100">
                                                <span className="text-sm font-medium flex items-center gap-2"><X className="h-3 w-3" /> {t('status.rejected')}</span>
                                                <span className="font-bold">{stats.productStats.rejected}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Read-Only Shop Details */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                                        <div className="p-4 border-b bg-muted/30">
                                            <h2 className="font-bold flex items-center gap-2"><Store className="h-5 w-5" /> {t('sellerDashboard.accountTab.shopDetails')}</h2>
                                        </div>
                                        <div className="p-6">
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('sellerDashboard.accountTab.shopName')}</p>
                                                        <p className="font-medium text-lg">{profile?.username || <span className="text-muted-foreground italic">{t('sellerDashboard.accountTab.notSet')}</span>}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('sellerDashboard.accountTab.ownerName')}</p>
                                                        <p className="font-medium">{profile?.full_name || <span className="text-muted-foreground italic">{t('sellerDashboard.accountTab.notSet')}</span>}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('sellerDashboard.accountTab.phoneNumber')}</p>
                                                        <p className="font-medium">{profile?.phone || <span className="text-muted-foreground italic">{t('sellerDashboard.accountTab.notSet')}</span>}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('sellerDashboard.accountTab.shopLocation')}</p>
                                                        <p className="font-medium">{profile?.shop_location || <span className="text-muted-foreground italic">{t('sellerDashboard.accountTab.notSet')}</span>}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('sellerDashboard.accountTab.businessType')}</p>
                                                        <p className="font-medium">{profile?.shop_type || "Permanent Shop"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('sellerDashboard.accountTab.email')}</p>
                                                        <p className="font-medium">{profile?.email || <span className="text-muted-foreground italic">{t('sellerDashboard.accountTab.notSet')}</span>}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            {profile?.bio && (
                                                <div className="mt-6 pt-4 border-t">
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">{t('sellerDashboard.accountTab.aboutShop')}</p>
                                                    <p className="text-muted-foreground">{profile.bio}</p>
                                                </div>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-6 pt-4 border-t">
                                                {t('sellerDashboard.accountTab.contactSupport')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Dashboard Tab - Stats & Overview */}
                        {
                            activeTab === "dashboard" && (
                                <>
                                    {/* Stats */}
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                                        {[
                                            { label: t('sellerDashboard.stats.totalSales'), value: `৳${stats.totalEarnings}`, icon: DollarSign, color: "bg-emerald-100 text-emerald-600" },
                                            { label: t('sellerDashboard.stats.delivered'), value: stats.deliveredOrders, icon: Check, color: "bg-green-100 text-green-600" },
                                            { label: t('sellerDashboard.stats.activeOrders'), value: stats.confirmedOrders, icon: ShoppingCart, color: "bg-blue-100 text-blue-600" },
                                            { label: t('sellerDashboard.stats.pending'), value: stats.pendingOrders, icon: Clock, color: "bg-amber-100 text-amber-600" },
                                            { label: t('sellerDashboard.stats.totalProducts'), value: stats.totalProducts, icon: Package, color: "bg-purple-100 text-purple-600" },
                                        ].map(s => (
                                            <div key={s.label} className="bg-card rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${s.color}`}><s.icon className="h-4 w-4" /></div>
                                                    <p className="text-sm text-muted-foreground font-medium">{s.label}</p>
                                                </div>
                                                <p className="text-2xl font-bold ml-1">{s.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Recent Activity / Pending Orders */}
                                    <div className="bg-card rounded-xl border shadow-sm">
                                        <div className="p-5 border-b flex justify-between items-center">
                                            <h2 className="font-bold text-lg">{t('sellerDashboard.recentOrders')}</h2>
                                            <Link href="/seller/orders"><Button variant="ghost" size="sm">{t('sellerDashboard.viewAll')}</Button></Link>
                                        </div>
                                        {activeOrders.length === 0 && pendingOrders.length === 0 ? (
                                            <div className="p-8 text-center text-muted-foreground">{t('sellerDashboard.noRecentOrders')}</div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-muted/30">
                                                        <tr>
                                                            <th className="text-left p-4 font-medium text-muted-foreground">{t('sellerDashboard.table.orderId')}</th>
                                                            <th className="text-left p-4 font-medium text-muted-foreground">{t('sellerDashboard.table.product')}</th>
                                                            <th className="text-left p-4 font-medium text-muted-foreground">{t('sellerDashboard.table.status')}</th>
                                                            <th className="text-right p-4 font-medium text-muted-foreground">{t('sellerDashboard.table.amount')}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {[...pendingOrders, ...activeOrders].slice(0, 5).map(o => (
                                                            <tr key={o.id} className="border-t hover:bg-muted/20 transition-colors">
                                                                <td className="p-4 font-mono">#{o.order?.order_number || o.order?.id}</td>
                                                                <td className="p-4">{o.product?.name} <span className="text-muted-foreground">x{o.quantity}</span></td>
                                                                <td className="p-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[o.item_status || 'pending']}`}>{t(`status.${o.item_status || 'pending'}`)}</span></td>
                                                                <td className="p-4 text-right">৳{o.seller_earning}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )
                        }

                        {/* Orders Tab */}
                        {
                            activeTab === "orders" && (
                                <div className="space-y-6">
                                    {/* Pending Orders */}
                                    <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
                                        <div className="p-4 border-b bg-amber-50/50 flex items-center justify-between">
                                            <h2 className="font-semibold text-amber-900 flex items-center gap-2"><AlertCircle className="h-4 w-4" />{t('sellerDashboard.ordersTab.pendingApproval')} ({pendingOrders.length})</h2>
                                        </div>
                                        {pendingOrders.length === 0 ? <div className="p-8 text-center text-muted-foreground">{t('sellerDashboard.ordersTab.allProcessed')}</div> : (
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/50"><tr><th className="text-left p-3">{t('sellerDashboard.table.orderId')}</th><th className="text-left p-3">{t('sellerDashboard.table.product')}</th><th className="text-left p-3">{t('sellerDashboard.table.customer')}</th><th className="text-left p-3">{t('sellerDashboard.table.earning')}</th><th className="p-3">{t('sellerDashboard.table.actions')}</th></tr></thead>
                                                <tbody>
                                                    {pendingOrders.map(o => (
                                                        <tr key={o.id} className="border-t">
                                                            <td className="p-3 font-mono">#{o.order?.order_number || o.order?.id}</td>
                                                            <td className="p-3 font-medium">{o.product?.name} × {o.quantity}</td>
                                                            <td className="p-3">{o.order?.buyer?.username}<br /><span className="text-xs text-muted-foreground">{o.order?.phone}</span></td>
                                                            <td className="p-3 font-bold text-green-600">৳{o.seller_earning || o.price_at_purchase * o.quantity}</td>
                                                            <td className="p-3 flex gap-2">
                                                                <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700" onClick={() => acceptOrder(o.id, o.order?.id)}>✓ {t('sellerDashboard.ordersTab.accept')}</Button>
                                                                <Button size="sm" variant="outline" className="h-8 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDenyModal({ itemId: o.id, reason: "" })}>✕ {t('sellerDashboard.ordersTab.deny')}</Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>

                                    {/* Active Orders */}
                                    <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
                                        <div className="p-4 border-b"><h2 className="font-semibold">{t('sellerDashboard.ordersTab.activeShipments')} ({activeOrders.length})</h2></div>
                                        {activeOrders.length === 0 ? <div className="p-8 text-center text-muted-foreground">{t('sellerDashboard.ordersTab.noActiveShipments')}</div> : (
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/50"><tr><th className="text-left p-3">{t('sellerDashboard.table.orderId')}</th><th className="text-left p-3">{t('sellerDashboard.table.product')}</th><th className="text-left p-3">{t('sellerDashboard.table.status')}</th><th className="p-3">{t('sellerDashboard.table.actions')}</th></tr></thead>
                                                <tbody>
                                                    {activeOrders.map(o => (
                                                        <tr key={o.id} className="border-t">
                                                            <td className="p-3 font-mono">#{o.order?.order_number || o.order?.id}</td>
                                                            <td className="p-3">{o.product?.name} × {o.quantity}</td>
                                                            <td className="p-3"><span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 font-medium">{t(`status.${o.item_status || 'processing'}`)}</span></td>
                                                            <td className="p-3 flex gap-2 flex-wrap">
                                                                {o.item_status === "confirmed" && (
                                                                    <Button size="sm" variant="outline" className="h-8" onClick={() => markProcessing(o.id, o.order?.id)}>📦 {t('sellerDashboard.ordersTab.processing')}</Button>
                                                                )}
                                                                {(o.item_status === "confirmed" || o.item_status === "processing") && (
                                                                    <Button size="sm" variant="default" className="h-8" onClick={() => updateToShipped(o.id, o.order?.id)}>🚚 {t('sellerDashboard.ordersTab.markShipped')}</Button>
                                                                )}
                                                                {o.item_status === "shipped" && (
                                                                    <Button size="sm" variant="default" className="h-8 bg-cyan-600 hover:bg-cyan-700" onClick={() => updateToAtStation(o.id, o.order?.id)}>📍 At Station</Button>
                                                                )}
                                                                {o.item_status === "at_station" && (
                                                                    <Button size="sm" variant="default" className="h-8 bg-teal-600 hover:bg-teal-700" onClick={() => updateToReachedDestination(o.id, o.order?.id)}>🎯 Ready for Delivery</Button>
                                                                )}
                                                                <Button size="sm" variant="ghost" className="h-8 text-muted-foreground" onClick={() => showTracking(o.order?.id, o.order?.order_number || String(o.order?.id))}>📋 View Tracking</Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            )
                        }



                        {/* Products Tab */}
                        {
                            activeTab === "products" && (
                                <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
                                    <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <h2 className="font-semibold">{t('sellerDashboard.productsTab.myInventory')} ({products.length})</h2>
                                        <div className="flex bg-muted/50 p-1 rounded-lg">
                                            {["all", "approved", "pending", "rejected"].map((filter) => (
                                                <button
                                                    key={filter}
                                                    onClick={() => setProductFilter(filter as any)}
                                                    className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${productFilter === filter
                                                        ? "bg-white text-foreground shadow-sm"
                                                        : "text-muted-foreground hover:text-foreground"
                                                        }`}
                                                >
                                                    {filter === 'all' ? t('sellerDashboard.viewAll') : t(`status.${filter}`)}
                                                    {filter !== 'all' && <span className="ml-1.5 opacity-70 text-[10px]">
                                                        {stats.productStats[filter as keyof typeof stats.productStats]}
                                                    </span>}
                                                </button>
                                            ))}
                                        </div>
                                        <Link href="/seller/add-product"><Button size="sm" className="gap-1 bg-primary text-primary-foreground"><Plus className="h-4 w-4" />{t('sellerDashboard.productsTab.addProduct')}</Button></Link>
                                    </div>

                                    {loading ? <div className="p-8 text-center text-muted-foreground">{t('sellerDashboard.productsTab.loading')}</div> : products.length === 0 ? (
                                        <div className="p-12 text-center"><Package className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" /><p className="text-muted-foreground">{t('sellerDashboard.productsTab.noProducts')}</p></div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/50"><tr><th className="text-left p-3">{t('sellerDashboard.table.product')}</th><th className="text-left p-3">{t('sellerDashboard.table.price')}</th><th className="text-left p-3">{t('sellerDashboard.table.stock')}</th><th className="text-left p-3">{t('sellerDashboard.table.status')}</th><th className="p-3"></th></tr></thead>
                                                <tbody>
                                                    {products
                                                        .filter(p => productFilter === 'all' || (p.status || 'pending') === productFilter)
                                                        .map(p => (
                                                            <tr key={p.id} className="border-t hover:bg-muted/20 transition-colors">
                                                                <td className="p-3 font-medium flex items-center gap-3 min-w-[200px]">
                                                                    {p.images?.[0] && <img src={p.images[0]} className="h-8 w-8 rounded object-cover border" alt="" />}
                                                                    <span className="truncate">{p.name}</span>
                                                                </td>
                                                                <td className="p-3">৳{p.price}</td>
                                                                <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${p.stock > 10 ? "bg-green-100 text-green-700" : p.stock > 0 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{p.stock} {t('sellerDashboard.productsTab.units')}</span></td>
                                                                <td className="p-3">
                                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.status === 'approved' ? "bg-green-100 text-green-700" : p.status === 'rejected' ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                                                                        {t(`status.${p.status || 'pending'}`)}
                                                                    </span>
                                                                    {p.status === 'rejected' && <p className="text-[10px] text-red-600 mt-1 max-w-[150px] leading-tight">{p.rejection_reason}</p>}
                                                                </td>
                                                                <td className="p-3 flex gap-1">
                                                                    <Link href={`/seller/edit-product/${p.id}`}><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"><Edit className="h-4 w-4" /></Button></Link>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600" onClick={() => deleteProduct(p.id)}><Trash2 className="h-4 w-4" /></Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    {products.filter(p => productFilter === 'all' || (p.status || 'pending') === productFilter).length === 0 && (
                                                        <tr>
                                                            <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                                                {t('sellerDashboard.productsTab.noFilteredProducts')}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )
                        }

                        {/* Earnings Tab */}
                        {
                            activeTab === "earnings" && (
                                <div className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="bg-card rounded-xl border p-6 shadow-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center"><DollarSign className="h-6 w-6 text-green-600" /></div>
                                                <div><p className="text-sm text-muted-foreground">{t('sellerDashboard.earningsTab.totalPayout')}</p><p className="text-3xl font-bold text-green-600">৳{stats.totalEarnings}</p></div>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{t('sellerDashboard.earningsTab.payoutDesc')}</p>
                                        </div>
                                        <div className="bg-card rounded-xl border p-6 shadow-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center"><Wallet className="h-6 w-6 text-purple-600" /></div>
                                                <div><p className="text-sm text-muted-foreground">{t('sellerDashboard.earningsTab.pendingEarnings')}</p><p className="text-3xl font-bold text-purple-600">৳{stats.pendingEarnings}</p></div>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{t('sellerDashboard.earningsTab.pendingDesc')}</p>
                                        </div>
                                    </div>
                                    <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
                                        <div className="p-4 border-b"><h2 className="font-semibold">{t('sellerDashboard.earningsTab.recentTransactions')}</h2></div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/50"><tr><th className="text-left p-3">{t('sellerDashboard.table.orderId')}</th><th className="text-left p-3">{t('sellerDashboard.table.product')}</th><th className="text-left p-3">{t('sellerDashboard.table.status')}</th><th className="text-left p-3">Payment</th><th className="text-right p-3">{t('sellerDashboard.table.earning')}</th></tr></thead>
                                                <tbody>
                                                    {orders.filter(o => o.item_status === "delivered" || o.item_status === "confirmed" || (o as any).order?.status === "delivered").map(o => (
                                                        <tr key={o.id} className="border-t">
                                                            <td className="p-3 font-mono">#{o.order?.order_number || o.order?.id}</td>
                                                            <td className="p-3">{o.product?.name} × {o.quantity}</td>
                                                            <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${statusColors[(o as any).order?.status || "pending"]}`}>{t(`status.${(o as any).order?.status || "pending"}`)}</span></td>
                                                            <td className="p-3">
                                                                {(o as any).payment_sent_to_seller ? (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">✓ Paid</span>
                                                                ) : (o as any).payment_received ? (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 font-medium">⏳ Processing</span>
                                                                ) : (o as any).item_status === "delivered" || (o as any).order?.status === "delivered" ? (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">📍 Awaiting COD</span>
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground">—</span>
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-right font-bold text-green-600">৳{o.seller_earning || o.price_at_purchase * o.quantity}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                    </AnimatePresence>
                </div >
            </main >

            {/* Deny Modal */}
            {
                denyModal && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-card rounded-xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
                            <h3 className="font-semibold mb-4 text-destructive flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Deny Order</h3>
                            <p className="text-sm text-muted-foreground mb-4">Please provide a reason for denying this order. The customer will be notified.</p>
                            <Textarea
                                value={denyModal.reason}
                                onChange={(e) => setDenyModal({ ...denyModal, reason: e.target.value })}
                                placeholder="e.g., Out of stock, Cannot deliver to this area..."
                                className="w-full h-24 mb-4 resize-none"
                            />
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setDenyModal(null)} className="flex-1">Cancel</Button>
                                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={denyOrder} disabled={!denyModal.reason.trim()}>Deny Order</Button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Tracking History Modal */}
            {trackingModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-card rounded-xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 max-h-[80vh] overflow-auto">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Truck className="h-5 w-5 text-primary" /> Tracking History
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">Order #{trackingModal.orderNumber}</p>

                        {trackingModal.trackingHistory.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No tracking history available.</p>
                        ) : (
                            <div className="space-y-4">
                                {trackingModal.trackingHistory.map((track, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className={`h-3 w-3 rounded-full ${i === trackingModal.trackingHistory.length - 1 ? "bg-primary ring-4 ring-primary/20" : "bg-muted-foreground/30"}`} />
                                            {i < trackingModal.trackingHistory.length - 1 && <div className="w-0.5 flex-1 bg-muted-foreground/20 mt-1" />}
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <p className="font-medium capitalize text-sm">{track.status.replace(/_/g, " ")}</p>
                                            {track.note && <p className="text-xs text-muted-foreground mt-1">{track.note}</p>}
                                            <p className="text-xs text-muted-foreground mt-1">{new Date(track.timestamp).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Button variant="outline" onClick={() => setTrackingModal(null)} className="w-full mt-4">Close</Button>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 safe-area-inset-bottom shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-around px-2 py-2">
                    {[
                        { id: "dashboard", route: "/seller", icon: TrendingUp, label: "Home" },
                        { id: "orders", route: "/seller/orders", icon: ShoppingCart, label: "Orders", badge: stats.pendingOrders },
                        { id: "products", route: "/seller/products", icon: Package, label: "Products" },
                        { id: "earnings", route: "/seller/earnings", icon: Wallet, label: "Earnings" },
                        { id: "account", route: "/seller/account", icon: User, label: "Account" },
                    ].map(t => (
                        <Link key={t.id} href={t.route}>
                            <div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg touch-target relative transition-colors ${activeTab === t.id ? "text-primary font-medium" : "text-muted-foreground hover:bg-muted/50"}`}>
                                <t.icon className="h-5 w-5" />
                                <span className="text-[10px]">{t.label}</span>
                                {t.badge ? <span className="absolute top-1 right-2 bg-red-500 text-white text-[9px] px-1 h-3 min-w-[12px] flex items-center justify-center rounded-full shadow-sm">{t.badge}</span> : null}
                            </div>
                        </Link>
                    ))}
                </div>
            </nav>
        </div >
    );
}
