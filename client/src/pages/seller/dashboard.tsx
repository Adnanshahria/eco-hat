import { useState, useEffect, useRef } from "react";
import { Package, Plus, TrendingUp, DollarSign, ShoppingCart, LogOut, Trash2, Clock, Check, X, Truck, AlertCircle, Wallet, AlertTriangle, User, Store, ShieldCheck, FileText, Upload, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { AppLink as Link } from "@/components/app-link";

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
    totalEarnings: number;
    pendingEarnings: number;
    productStats: {
        approved: number;
        pending: number;
        rejected: number;
    };
}

const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
    confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700" },
    denied: { label: "Denied", color: "bg-red-100 text-red-700" },
    processing: { label: "Processing", color: "bg-purple-100 text-purple-700" },
    shipped: { label: "Shipped", color: "bg-indigo-100 text-indigo-700" },
    delivered: { label: "Delivered", color: "bg-green-100 text-green-700" },
};

const shopTypes = ["Permanent Shop", "Pop-up Store", "Online Only", "Overseas Seller", "Home Business"];

export default function SellerDashboard() {
    const { user, signOut } = useAuth();
    const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "orders" | "earnings" | "account">("dashboard");
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [sellerId, setSellerId] = useState<number | null>(null);
    const [stats, setStats] = useState<Stats>({
        totalProducts: 0, pendingOrders: 0, confirmedOrders: 0, totalEarnings: 0, pendingEarnings: 0,
        productStats: { approved: 0, pending: 0, rejected: 0 }
    });
    const [loading, setLoading] = useState(true);
    const [denyModal, setDenyModal] = useState<{ itemId: number; reason: string } | null>(null);
    const [productFilter, setProductFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");

    // Profile & Account State
    const [profile, setProfile] = useState<any>(null);
    const [accountForm, setAccountForm] = useState({
        username: "", // Shop Name
        full_name: "",
        phone: "",
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
        const { data: ordersData } = await supabase
            .from("order_items")
            .select(`
                id, quantity, price_at_purchase, seller_earning, item_status, denial_reason,
                order:orders (id, status, phone, total_amount, shipping_address, created_at),
                product:products (name)
            `)
            .eq("seller_id", profileData.id)
            .order("id", { ascending: false });

        let pendingOrdersCount = 0;
        let confirmedOrdersCount = 0;
        let totalEarnings = 0;
        let pendingEarnings = 0;

        if (ordersData) {
            setOrders(ordersData as unknown as OrderItem[]);
            const pending = ordersData.filter(o => o.item_status === "pending" || !o.item_status);
            const confirmed = ordersData.filter(o => o.item_status === "confirmed");
            const delivered = ordersData.filter(o => (o as any).order?.status === "delivered");
            totalEarnings = delivered.reduce((sum, o) => sum + (o.seller_earning || o.price_at_purchase * o.quantity), 0);
            pendingEarnings = confirmed.reduce((sum, o) => sum + (o.seller_earning || o.price_at_purchase * o.quantity), 0);
            pendingOrdersCount = pending.length;
            confirmedOrdersCount = confirmed.length;
        }

        // Product Stats - calculated from productsData (ALWAYS runs)
        const pStats = {
            approved: productsData?.filter(p => p.status === 'approved').length || 0,
            pending: productsData?.filter(p => p.status === 'pending').length || 0,
            rejected: productsData?.filter(p => p.status === 'rejected').length || 0,
        };

        setStats({
            totalProducts: productsData?.length || 0,
            pendingOrders: pendingOrdersCount,
            confirmedOrders: confirmedOrdersCount,
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

    // Other Actions (Orders, etc)
    const submitAppeal = async () => {
        if (!appealText.trim() || !sellerId) return;
        setSubmittingAppeal(true);
        await supabase.from("users").update({ appeal_text: appealText }).eq("id", sellerId);
        setExistingAppeal(appealText);
        setSubmittingAppeal(false);
        alert("Appeal submitted successfully! Admins will review your request.");
    };

    const acceptOrder = async (itemId: number) => {
        await supabase.from("order_items").update({ item_status: "confirmed" }).eq("id", itemId);
        setOrders(orders.map(o => o.id === itemId ? { ...o, item_status: "confirmed" } : o));
    };

    const denyOrder = async () => {
        if (!denyModal) return;
        await supabase.from("order_items").update({ item_status: "denied", denial_reason: denyModal.reason }).eq("id", denyModal.itemId);
        setOrders(orders.map(o => o.id === denyModal.itemId ? { ...o, item_status: "denied", denial_reason: denyModal.reason } : o));
        setDenyModal(null);
    };

    const updateToShipped = async (itemId: number) => {
        await supabase.from("order_items").update({ item_status: "shipped" }).eq("id", itemId);
        setOrders(orders.map(o => o.id === itemId ? { ...o, item_status: "shipped" } : o));
    };

    const deleteProduct = async (productId: number) => {
        if (!confirm("Delete this product?")) return;
        await supabase.from("products").delete().eq("id", productId);
        setProducts(products.filter(p => p.id !== productId));
    };

    const pendingOrders = orders.filter(o => o.item_status === "pending" || !o.item_status);
    const activeOrders = orders.filter(o => o.item_status === "confirmed");

    // Terminated View
    if (isTerminated) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center p-8">
                <div className="max-w-2xl w-full">
                    <div className="flex items-center gap-2 mb-8 justify-center">
                        <img src={`${import.meta.env.BASE_URL}logo-en.png`} alt="EcoHaat" className="h-12" />
                    </div>
                    <div className="bg-red-50 border-l-4 border-red-600 rounded-lg p-6 mb-6 shadow-sm">
                        <div className="flex items-start gap-4">
                            <AlertTriangle className="h-8 w-8 text-red-600 flex-shrink-0" />
                            <div>
                                <h1 className="text-xl font-bold text-red-800 mb-2">Account Terminated</h1>
                                <p className="text-red-700 mb-4">Your seller account has been terminated by the administration.</p>
                                <div className="bg-red-100 p-3 rounded-md border border-red-200">
                                    <p className="text-xs text-red-800 font-bold uppercase mb-1">Reason</p>
                                    <p className="text-red-900 font-medium">"{terminationReason}"</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Appeal Section UI (Keep existing) */}
                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                        {/* ... (Existing Appeal UI) ... */}
                        <div className="flex justify-end pt-4">
                            <Button variant="outline" onClick={signOut}>Logout</Button>
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
        <div className="min-h-screen bg-background flex flex-col lg:flex-row">
            {/* Mobile Header - Logo only */}
            <header className="lg:hidden sticky top-0 z-50 bg-card border-b border-border p-3 flex items-center justify-center gap-2">
                <Link href="/"><img src={`${import.meta.env.BASE_URL}logo-en.png`} alt="EcoHaat" className="h-8 cursor-pointer" /></Link>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Seller</span>
            </header>

            {/* Desktop Sidebar */}
            <aside className="w-64 bg-card border-r border-border p-4 flex-shrink-0 hidden lg:flex flex-col">
                <div className="flex items-center gap-2 mb-8 px-2">
                    <Link href="/"><img src={`${import.meta.env.BASE_URL}logo-en.png`} alt="EcoHaat" className="h-8 cursor-pointer" /></Link>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">Seller Portal</span>
                </div>
                <nav className="space-y-1 flex-1">
                    {[
                        { id: "dashboard", icon: TrendingUp, label: "Overview" },
                        { id: "orders", icon: ShoppingCart, label: "Orders", badge: stats.pendingOrders },
                        { id: "products", icon: Package, label: "My Products" },
                        { id: "earnings", icon: Wallet, label: "Earnings" },
                        { id: "account", icon: User, label: "Account & Verification" },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id as any)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === t.id ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
                        >
                            <t.icon className="h-4 w-4" /> {t.label}
                            {t.badge ? <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full">{t.badge}</span> : null}
                        </button>
                    ))}
                </nav>
                <div className="mt-auto pt-4 border-t">
                    <Link href="/seller/add-product"><Button className="w-full gap-2 mb-3 bg-emerald-600 hover:bg-emerald-700 text-white"><Plus className="h-4 w-4" />Add New Product</Button></Link>
                    <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"><LogOut className="h-4 w-4" />Logout</Button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 p-4 lg:p-8 overflow-auto pb-20 lg:pb-8 bg-muted/10">
                <div className="max-w-6xl mx-auto">
                    {/* Header Title */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold font-display capitalize">{activeTab === 'dashboard' ? 'Dashboard Overview' : activeTab}</h1>
                    </div>

                    {/* Account Tab */}
                    {activeTab === "account" && (
                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Left Column: Verification & Stats */}
                            <div className="space-y-6">
                                {/* Verification Status Card */}
                                <div className={`border rounded-xl p-5 ${isVerified ? "bg-emerald-50 border-emerald-200" : isPending ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"}`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-full ${isVerified ? "bg-emerald-100 text-emerald-600" : isPending ? "bg-yellow-100 text-yellow-600" : "bg-red-100 text-red-600"}`}>
                                            {isVerified ? <ShieldCheck className="h-6 w-6" /> : isPending ? <Clock className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                                        </div>
                                        <div>
                                            <h3 className={`font-bold ${isVerified ? "text-emerald-800" : isPending ? "text-yellow-800" : "text-red-800"}`}>
                                                {isVerified ? "Account Verified" : isPending ? "Verification Pending" : isRejected ? "Verification Failed" : "Verification Required"}
                                            </h3>
                                            <p className="text-sm mt-1 mb-4 opacity-90">
                                                {isVerified ? "You have full access to all seller features." : "Please submit valid documents to list products."}
                                                {isRejected && <span className="block mt-2 font-medium">Reason: {profile?.rejection_reason}</span>}
                                            </p>

                                            {!isVerified && !isPending && (
                                                <div className="bg-white/50 rounded-lg p-3 border border-black/5">
                                                    <Label className="text-xs font-semibold mb-2 block">Upload NID/Trade License</Label>
                                                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,.pdf" />

                                                    {!selectedFile ? (
                                                        <Button variant="outline" size="sm" className="w-full bg-white" onClick={() => fileInputRef.current?.click()}>
                                                            <Upload className="h-3 w-3 mr-2" /> Upload Document
                                                        </Button>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2 text-xs bg-white p-2 rounded border">
                                                                <FileText className="h-3 w-3" />
                                                                <span className="truncate flex-1">{selectedFile.name}</span>
                                                                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedFile(null)} />
                                                            </div>
                                                            <Button size="sm" className="w-full" onClick={submitVerification} disabled={uploadingDoc}>
                                                                {uploadingDoc ? "Uploading..." : "Submit for Review"}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Product Stats Card */}
                                <div className="bg-card border rounded-xl p-5 shadow-sm">
                                    <h3 className="font-semibold mb-4 flex items-center gap-2"><Package className="h-4 w-4" /> Product Status</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-2 rounded bg-emerald-50 text-emerald-900 border border-emerald-100">
                                            <span className="text-sm font-medium flex items-center gap-2"><Check className="h-3 w-3" /> Approved</span>
                                            <span className="font-bold">{stats.productStats.approved}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 rounded bg-yellow-50 text-yellow-900 border border-yellow-100">
                                            <span className="text-sm font-medium flex items-center gap-2"><Clock className="h-3 w-3" /> Pending</span>
                                            <span className="font-bold">{stats.productStats.pending}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 rounded bg-red-50 text-red-900 border border-red-100">
                                            <span className="text-sm font-medium flex items-center gap-2"><X className="h-3 w-3" /> Rejected</span>
                                            <span className="font-bold">{stats.productStats.rejected}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Edit Profile Form */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                                    <div className="p-4 border-b bg-muted/30">
                                        <h2 className="font-bold flex items-center gap-2"><Store className="h-5 w-5" /> Shop Details</h2>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Shop Name</Label>
                                                <Input
                                                    value={accountForm.username}
                                                    onChange={e => setAccountForm({ ...accountForm, username: e.target.value })}
                                                    placeholder="Enter your shop name"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Owner Full Name</Label>
                                                <Input
                                                    value={accountForm.full_name}
                                                    onChange={e => setAccountForm({ ...accountForm, full_name: e.target.value })}
                                                    placeholder="Legal owner name"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Bio / Description</Label>
                                            <Textarea
                                                value={accountForm.bio}
                                                onChange={e => setAccountForm({ ...accountForm, bio: e.target.value })}
                                                placeholder="Tell customers about your shop..."
                                                rows={3}
                                            />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Phone Number</Label>
                                                <Input
                                                    value={accountForm.phone}
                                                    onChange={e => setAccountForm({ ...accountForm, phone: e.target.value })}
                                                    placeholder="+8801..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Shop Location</Label>
                                                <Input
                                                    value={accountForm.shop_location}
                                                    onChange={e => setAccountForm({ ...accountForm, shop_location: e.target.value })}
                                                    placeholder="Address / City"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Business Type</Label>
                                            <select
                                                value={accountForm.shop_type}
                                                onChange={e => setAccountForm({ ...accountForm, shop_type: e.target.value })}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {shopTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <Button onClick={handleUpdateProfile} disabled={savingProfile} className="gap-2">
                                                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                Save Changes
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Dashboard Tab - Stats & Overview */}
                    {
                        activeTab === "dashboard" && (
                            <>
                                <p className="text-sm text-muted-foreground mb-6">Welcome back! Here's what's happening in your shop today.</p>

                                {/* Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                    {[
                                        { label: "Total Sales", value: `৳${stats.totalEarnings}`, icon: DollarSign, color: "bg-emerald-100 text-emerald-600" },
                                        { label: "Active Orders", value: stats.confirmedOrders, icon: ShoppingCart, color: "bg-blue-100 text-blue-600" },
                                        { label: "Pending Orders", value: stats.pendingOrders, icon: Clock, color: "bg-amber-100 text-amber-600" },
                                        { label: "Total Products", value: stats.totalProducts, icon: Package, color: "bg-purple-100 text-purple-600" },
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
                                        <h2 className="font-bold text-lg">Recent Orders</h2>
                                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('orders')}>View All</Button>
                                    </div>
                                    {activeOrders.length === 0 && pendingOrders.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground">No recent orders found.</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/30">
                                                    <tr>
                                                        <th className="text-left p-4 font-medium text-muted-foreground">Order ID</th>
                                                        <th className="text-left p-4 font-medium text-muted-foreground">Product</th>
                                                        <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                                                        <th className="text-right p-4 font-medium text-muted-foreground">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[...pendingOrders, ...activeOrders].slice(0, 5).map(o => (
                                                        <tr key={o.id} className="border-t hover:bg-muted/20 transition-colors">
                                                            <td className="p-4 font-mono">#{o.order?.id}</td>
                                                            <td className="p-4">{o.product?.name} <span className="text-muted-foreground">x{o.quantity}</span></td>
                                                            <td className="p-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[o.item_status || 'pending']?.color}`}>{statusConfig[o.item_status || 'pending']?.label}</span></td>
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
                                        <h2 className="font-semibold text-amber-900 flex items-center gap-2"><AlertCircle className="h-4 w-4" />Pending Approval ({pendingOrders.length})</h2>
                                    </div>
                                    {pendingOrders.length === 0 ? <div className="p-8 text-center text-muted-foreground">Great job! All orders processed.</div> : (
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50"><tr><th className="text-left p-3">Order</th><th className="text-left p-3">Product</th><th className="text-left p-3">Customer</th><th className="text-left p-3">Earning</th><th className="p-3">Actions</th></tr></thead>
                                            <tbody>
                                                {pendingOrders.map(o => (
                                                    <tr key={o.id} className="border-t">
                                                        <td className="p-3 font-mono">#{o.order?.id}</td>
                                                        <td className="p-3 font-medium">{o.product?.name} × {o.quantity}</td>
                                                        <td className="p-3">{o.order?.buyer?.username}<br /><span className="text-xs text-muted-foreground">{o.order?.phone}</span></td>
                                                        <td className="p-3 font-bold text-green-600">৳{o.seller_earning || o.price_at_purchase * o.quantity}</td>
                                                        <td className="p-3 flex gap-2">
                                                            <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700" onClick={() => acceptOrder(o.id)}><Check className="h-3 w-3 mr-1" />Accept</Button>
                                                            <Button size="sm" variant="outline" className="h-8 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDenyModal({ itemId: o.id, reason: "" })}><X className="h-3 w-3 mr-1" />Deny</Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                {/* Active Orders */}
                                <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
                                    <div className="p-4 border-b"><h2 className="font-semibold">Active Shipments ({activeOrders.length})</h2></div>
                                    {activeOrders.length === 0 ? <div className="p-8 text-center text-muted-foreground">No active shipments.</div> : (
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50"><tr><th className="text-left p-3">Order</th><th className="text-left p-3">Product</th><th className="text-left p-3">Status</th><th className="p-3">Actions</th></tr></thead>
                                            <tbody>
                                                {activeOrders.map(o => (
                                                    <tr key={o.id} className="border-t">
                                                        <td className="p-3 font-mono">#{o.order?.id}</td>
                                                        <td className="p-3">{o.product?.name} × {o.quantity}</td>
                                                        <td className="p-3"><span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 font-medium">Processing</span></td>
                                                        <td className="p-3"><Button size="sm" variant="outline" className="h-8" onClick={() => updateToShipped(o.id)}><Truck className="h-3 w-3 mr-1" />Mark Shipped</Button></td>
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
                                    <h2 className="font-semibold">My Inventory ({products.length})</h2>
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
                                                {filter}
                                                {filter !== 'all' && <span className="ml-1.5 opacity-70 text-[10px]">
                                                    {stats.productStats[filter as keyof typeof stats.productStats]}
                                                </span>}
                                            </button>
                                        ))}
                                    </div>
                                    <Link href="/seller/add-product"><Button size="sm" className="gap-1 bg-primary text-primary-foreground"><Plus className="h-4 w-4" />Add Product</Button></Link>
                                </div>

                                {loading ? <div className="p-8 text-center text-muted-foreground">Loading...</div> : products.length === 0 ? (
                                    <div className="p-12 text-center"><Package className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" /><p className="text-muted-foreground">You haven't listed any products yet.</p></div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50"><tr><th className="text-left p-3">Product</th><th className="text-left p-3">Price</th><th className="text-left p-3">Stock</th><th className="text-left p-3">Status</th><th className="p-3"></th></tr></thead>
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
                                                            <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${p.stock > 10 ? "bg-green-100 text-green-700" : p.stock > 0 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{p.stock} units</span></td>
                                                            <td className="p-3">
                                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.status === 'approved' ? "bg-green-100 text-green-700" : p.status === 'rejected' ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                                                                    {p.status || 'pending'}
                                                                </span>
                                                                {p.status === 'rejected' && <p className="text-[10px] text-red-600 mt-1 max-w-[150px] leading-tight">{p.rejection_reason}</p>}
                                                            </td>
                                                            <td className="p-3"><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600" onClick={() => deleteProduct(p.id)}><Trash2 className="h-4 w-4" /></Button></td>
                                                        </tr>
                                                    ))}
                                                {products.filter(p => productFilter === 'all' || (p.status || 'pending') === productFilter).length === 0 && (
                                                    <tr>
                                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                                            No {productFilter} products found.
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
                                            <div><p className="text-sm text-muted-foreground">Total Payout</p><p className="text-3xl font-bold text-green-600">৳{stats.totalEarnings}</p></div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Earnings from completed & delivered orders.</p>
                                    </div>
                                    <div className="bg-card rounded-xl border p-6 shadow-sm">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center"><Wallet className="h-6 w-6 text-purple-600" /></div>
                                            <div><p className="text-sm text-muted-foreground">Pending Earnings</p><p className="text-3xl font-bold text-purple-600">৳{stats.pendingEarnings}</p></div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Funds held for active orders.</p>
                                    </div>
                                </div>
                                <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
                                    <div className="p-4 border-b"><h2 className="font-semibold">Recent Transactions</h2></div>
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50"><tr><th className="text-left p-3">Order</th><th className="text-left p-3">Product</th><th className="text-left p-3">Status</th><th className="text-right p-3">Earning</th></tr></thead>
                                        <tbody>
                                            {orders.filter(o => o.item_status === "confirmed" || (o as any).order?.status === "delivered").map(o => (
                                                <tr key={o.id} className="border-t">
                                                    <td className="p-3 font-mono">#{o.order?.id}</td>
                                                    <td className="p-3">{o.product?.name} × {o.quantity}</td>
                                                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${statusConfig[(o as any).order?.status || "pending"]?.color}`}>{statusConfig[(o as any).order?.status || "pending"]?.label}</span></td>
                                                    <td className="p-3 text-right font-medium text-green-600">৳{o.seller_earning || o.price_at_purchase * o.quantity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    }
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

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 safe-area-inset-bottom shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-around px-2 py-2">
                    {[
                        { id: "dashboard", icon: TrendingUp, label: "Home" },
                        { id: "orders", icon: ShoppingCart, label: "Orders", badge: stats.pendingOrders },
                        { id: "products", icon: Package, label: "Products" },
                        { id: "earnings", icon: Wallet, label: "Earnings" },
                        { id: "account", icon: User, label: "Account" },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id as any)}
                            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg touch-target relative transition-colors ${activeTab === t.id ? "text-primary font-medium" : "text-muted-foreground hover:bg-muted/50"}`}
                        >
                            <t.icon className="h-5 w-5" />
                            <span className="text-[10px]">{t.label}</span>
                            {t.badge ? <span className="absolute top-1 right-2 bg-red-500 text-white text-[9px] px-1 h-3 min-w-[12px] flex items-center justify-center rounded-full shadow-sm">{t.badge}</span> : null}
                        </button>
                    ))}
                </div>
            </nav>
        </div >
    );
}
