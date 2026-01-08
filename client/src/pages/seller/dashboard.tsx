import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Plus, TrendingUp, DollarSign, ShoppingCart, LogOut, Trash2, Clock, Check, X, Truck, AlertCircle, Wallet, AlertTriangle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { Link } from "wouter";
import { createNotification } from "@/components/notifications";

interface Product {
    id: number;
    name: string;
    price: number;
    stock: number;
    images: string[] | null;
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
}

const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
    confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700" },
    denied: { label: "Denied", color: "bg-red-100 text-red-700" },
    processing: { label: "Processing", color: "bg-purple-100 text-purple-700" },
    shipped: { label: "Shipped", color: "bg-indigo-100 text-indigo-700" },
    delivered: { label: "Delivered", color: "bg-green-100 text-green-700" },
};

export default function SellerDashboard() {
    const { user, signOut } = useAuth();
    const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "orders" | "earnings">("dashboard");
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [sellerId, setSellerId] = useState<number | null>(null);
    const [stats, setStats] = useState<Stats>({ totalProducts: 0, pendingOrders: 0, confirmedOrders: 0, totalEarnings: 0, pendingEarnings: 0 });
    const [loading, setLoading] = useState(true);
    const [denyModal, setDenyModal] = useState<{ itemId: number; reason: string } | null>(null);

    // Termination State
    const [isTerminated, setIsTerminated] = useState(false);
    const [terminationReason, setTerminationReason] = useState("");
    const [appealText, setAppealText] = useState("");
    const [existingAppeal, setExistingAppeal] = useState("");
    const [submittingAppeal, setSubmittingAppeal] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data: profile } = await supabase.from("users").select("*").eq("email", user?.email).single();
        if (!profile) return;
        setSellerId(profile.id);

        // Check for termination
        if (profile.verification_status === "terminated") {
            setIsTerminated(true);
            setTerminationReason(profile.termination_reason || "Violation of policies");
            setExistingAppeal(profile.appeal_text || "");
            setLoading(false);
            return; // Stop fetching other data if terminated
        }

        // Fetch products
        const { data: productsData } = await supabase.from("products").select("*").eq("seller_id", profile.id).order("created_at", { ascending: false });
        if (productsData) {
            setProducts(productsData);
        }

        // Fetch orders containing seller's products
        const { data: ordersData } = await supabase
            .from("order_items")
            .select(`
        id, quantity, price_at_purchase, seller_earning, item_status, denial_reason,
        order:orders (id, status, phone, total_amount, shipping_address, created_at, buyer:users!buyer_id(id, username, email)),
        product:products (name)
      `)
            .eq("seller_id", profile.id)
            .order("id", { ascending: false });

        if (ordersData) {
            setOrders(ordersData as unknown as OrderItem[]);
            const pending = ordersData.filter(o => o.item_status === "pending" || !o.item_status);
            const confirmed = ordersData.filter(o => o.item_status === "confirmed");
            const delivered = ordersData.filter(o => (o as any).order?.status === "delivered");
            const totalEarnings = delivered.reduce((sum, o) => sum + (o.seller_earning || o.price_at_purchase * o.quantity), 0);
            const pendingEarnings = confirmed.reduce((sum, o) => sum + (o.seller_earning || o.price_at_purchase * o.quantity), 0);
            setStats({
                totalProducts: productsData?.length || 0,
                pendingOrders: pending.length,
                confirmedOrders: confirmed.length,
                totalEarnings,
                pendingEarnings,
            });
        }
        setLoading(false);
    };

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

        // Notify Buyer
        const orderItem = orders.find(o => o.id === itemId);
        if (orderItem?.order?.buyer) {
            // In a real app we'd need the buyer ID, but here `order.buyer` might only select username/email.
            // We need to ensure we have buyer ID in the fetch query if we want to notify them.
            // Let's assume we fetch fetch buyer ID in `fetchData`.
        }
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
    const completedOrders = orders.filter(o => ["shipped", "delivered"].includes(o.order?.status || ""));

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
                                <p className="text-red-700 mb-4">
                                    Your seller account has been terminated by the administration. You can no longer access the seller dashboard or list products.
                                </p>
                                <div className="bg-red-100 p-3 rounded-md border border-red-200">
                                    <p className="text-xs text-red-800 font-bold uppercase mb-1">Reason for Termination</p>
                                    <p className="text-red-900 font-medium">"{terminationReason}"</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Send className="h-5 w-5" /> Submit an Appeal</h2>
                        {existingAppeal ? (
                            <div className="bg-muted p-4 rounded-lg">
                                <p className="text-sm font-medium text-muted-foreground mb-2">Your Submitted Appeal:</p>
                                <p className="italic text-foreground">"{existingAppeal}"</p>
                                <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded">
                                    <Clock className="h-4 w-4" />
                                    <span>Appeal under review by administrators.</span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    If you believe this termination was a mistake, you can submit an appeal to the admins. Explain why your account should be reinstated.
                                </p>
                                <Textarea
                                    placeholder="Write your appeal here..."
                                    className="min-h-[150px]"
                                    value={appealText}
                                    onChange={e => setAppealText(e.target.value)}
                                />
                                <div className="flex justify-end gap-3">
                                    <Button variant="outline" onClick={signOut}>Logout</Button>
                                    <Button onClick={submitAppeal} disabled={submittingAppeal || !appealText.trim()}>
                                        {submittingAppeal ? "Submitting..." : "Submit Appeal"}
                                    </Button>
                                </div>
                            </div>
                        )}
                        {existingAppeal && (
                            <div className="mt-6 pt-6 border-t flex justify-end">
                                <Button variant="outline" onClick={signOut} className="gap-2"><LogOut className="h-4 w-4" /> Logout</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className="w-56 bg-card border-r border-border p-4 flex-shrink-0 hidden lg:flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                    <img src="/logo-en.png" alt="EcoHaat" className="h-10" />
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Seller</span>
                </div>
                <nav className="space-y-1 flex-1">
                    {[
                        { id: "dashboard", icon: TrendingUp, label: "Dashboard" },
                        { id: "orders", icon: ShoppingCart, label: "Orders", badge: stats.pendingOrders },
                        { id: "products", icon: Package, label: "Products" },
                        { id: "earnings", icon: Wallet, label: "Earnings" },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id as any)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${activeTab === t.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground"}`}
                        >
                            <t.icon className="h-4 w-4" /> {t.label}
                            {t.badge ? <span className="ml-auto bg-red-500 text-white text-xs px-1.5 rounded-full">{t.badge}</span> : null}
                        </button>
                    ))}
                </nav>
                <Link href="/seller/add-product"><Button className="w-full gap-2 mb-2"><Plus className="h-4 w-4" />Add Product</Button></Link>
                <Button variant="ghost" size="sm" onClick={signOut} className="justify-start gap-2"><LogOut className="h-4 w-4" />Logout</Button>
            </aside>

            {/* Main */}
            <main className="flex-1 p-6 overflow-auto">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-xl font-bold mb-1">Seller Dashboard</h1>
                    <p className="text-sm text-muted-foreground mb-6">Manage your products and orders</p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                        {[
                            { label: "Products", value: stats.totalProducts, icon: Package, color: "bg-primary/10 text-primary" },
                            { label: "Pending", value: stats.pendingOrders, icon: Clock, color: "bg-yellow-100 text-yellow-600" },
                            { label: "Active", value: stats.confirmedOrders, icon: Check, color: "bg-blue-100 text-blue-600" },
                            { label: "Earned", value: `৳${stats.totalEarnings}`, icon: DollarSign, color: "bg-green-100 text-green-600" },
                            { label: "Pending $", value: `৳${stats.pendingEarnings}`, icon: Wallet, color: "bg-purple-100 text-purple-600" },
                        ].map(s => (
                            <div key={s.label} className="bg-card rounded-xl border p-3 flex items-center gap-3">
                                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${s.color}`}><s.icon className="h-4 w-4" /></div>
                                <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-lg font-bold">{s.value}</p></div>
                            </div>
                        ))}
                    </div>

                    {/* Orders Tab */}
                    {activeTab === "orders" && (
                        <div className="space-y-6">
                            {/* Pending Orders */}
                            <div className="bg-card rounded-xl border overflow-hidden">
                                <div className="p-4 border-b bg-yellow-50"><h2 className="font-semibold text-yellow-800 flex items-center gap-2"><AlertCircle className="h-4 w-4" />Pending Approval ({pendingOrders.length})</h2></div>
                                {pendingOrders.length === 0 ? <div className="p-6 text-center text-muted-foreground">No pending orders</div> : (
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50"><tr><th className="text-left p-3">Order</th><th className="text-left p-3">Product</th><th className="text-left p-3">Customer</th><th className="text-left p-3">Earning</th><th className="p-3">Actions</th></tr></thead>
                                        <tbody>
                                            {pendingOrders.map(o => (
                                                <tr key={o.id} className="border-t">
                                                    <td className="p-3 font-mono">#{o.order?.id}</td>
                                                    <td className="p-3">{o.product?.name} × {o.quantity}</td>
                                                    <td className="p-3">{o.order?.buyer?.username}<br /><span className="text-xs text-muted-foreground">{o.order?.phone}</span></td>
                                                    <td className="p-3 font-medium text-green-600">৳{o.seller_earning || o.price_at_purchase * o.quantity}</td>
                                                    <td className="p-3 flex gap-2">
                                                        <Button size="sm" className="h-7 bg-green-600 hover:bg-green-700" onClick={() => acceptOrder(o.id)}><Check className="h-3 w-3 mr-1" />Accept</Button>
                                                        <Button size="sm" variant="outline" className="h-7 text-red-600 border-red-200" onClick={() => setDenyModal({ itemId: o.id, reason: "" })}><X className="h-3 w-3 mr-1" />Deny</Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Active Orders */}
                            <div className="bg-card rounded-xl border overflow-hidden">
                                <div className="p-4 border-b"><h2 className="font-semibold">Active Orders ({activeOrders.length})</h2></div>
                                {activeOrders.length === 0 ? <div className="p-6 text-center text-muted-foreground">No active orders</div> : (
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50"><tr><th className="text-left p-3">Order</th><th className="text-left p-3">Product</th><th className="text-left p-3">Status</th><th className="p-3">Actions</th></tr></thead>
                                        <tbody>
                                            {activeOrders.map(o => (
                                                <tr key={o.id} className="border-t">
                                                    <td className="p-3 font-mono">#{o.order?.id}</td>
                                                    <td className="p-3">{o.product?.name} × {o.quantity}</td>
                                                    <td className="p-3"><span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">Confirmed</span></td>
                                                    <td className="p-3"><Button size="sm" variant="outline" className="h-7" onClick={() => updateToShipped(o.id)}><Truck className="h-3 w-3 mr-1" />Mark Shipped</Button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Products Tab */}
                    {activeTab === "products" && (
                        <div className="bg-card rounded-xl border overflow-hidden">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h2 className="font-semibold">My Products ({products.length})</h2>
                                <Link href="/seller/add-product"><Button size="sm" className="gap-1"><Plus className="h-4 w-4" />Add</Button></Link>
                            </div>
                            {loading ? <div className="p-8 text-center text-muted-foreground">Loading...</div> : products.length === 0 ? (
                                <div className="p-8 text-center"><Package className="h-10 w-10 mx-auto text-muted-foreground mb-2" /><p className="text-muted-foreground">No products yet</p></div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50"><tr><th className="text-left p-3">Product</th><th className="text-left p-3">Price</th><th className="text-left p-3">Stock</th><th className="p-3"></th></tr></thead>
                                    <tbody>
                                        {products.map(p => (
                                            <tr key={p.id} className="border-t">
                                                <td className="p-3 font-medium">{p.name}</td>
                                                <td className="p-3">৳{p.price}</td>
                                                <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${p.stock > 10 ? "bg-green-100 text-green-700" : p.stock > 0 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{p.stock}</span></td>
                                                <td className="p-3"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteProduct(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* Earnings Tab */}
                    {activeTab === "earnings" && (
                        <div className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-card rounded-xl border p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center"><DollarSign className="h-6 w-6 text-green-600" /></div>
                                        <div><p className="text-sm text-muted-foreground">Total Earned</p><p className="text-2xl font-bold text-green-600">৳{stats.totalEarnings}</p></div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">From delivered orders</p>
                                </div>
                                <div className="bg-card rounded-xl border p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center"><Wallet className="h-6 w-6 text-purple-600" /></div>
                                        <div><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold text-purple-600">৳{stats.pendingEarnings}</p></div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">From confirmed/active orders</p>
                                </div>
                            </div>
                            <div className="bg-card rounded-xl border overflow-hidden">
                                <div className="p-4 border-b"><h2 className="font-semibold">Earnings History</h2></div>
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50"><tr><th className="text-left p-3">Order</th><th className="text-left p-3">Product</th><th className="text-left p-3">Status</th><th className="text-right p-3">Earning</th></tr></thead>
                                    <tbody>
                                        {orders.filter(o => o.item_status === "confirmed" || o.order?.status === "delivered").map(o => (
                                            <tr key={o.id} className="border-t">
                                                <td className="p-3 font-mono">#{o.order?.id}</td>
                                                <td className="p-3">{o.product?.name} × {o.quantity}</td>
                                                <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${statusConfig[o.order?.status || "pending"]?.color}`}>{statusConfig[o.order?.status || "pending"]?.label}</span></td>
                                                <td className="p-3 text-right font-medium text-green-600">৳{o.seller_earning || o.price_at_purchase * o.quantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Dashboard Tab */}
                    {activeTab === "dashboard" && (
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-card rounded-xl border p-4">
                                <h3 className="font-semibold mb-3">Pending Orders</h3>
                                {pendingOrders.length === 0 ? <p className="text-sm text-muted-foreground">No pending orders</p> : pendingOrders.slice(0, 5).map(o => (
                                    <div key={o.id} className="flex items-center justify-between py-2 border-t first:border-t-0">
                                        <span className="text-sm">{o.product?.name}</span>
                                        <div className="flex gap-2">
                                            <Button size="sm" className="h-6 text-xs bg-green-600" onClick={() => acceptOrder(o.id)}>Accept</Button>
                                            <Button size="sm" variant="ghost" className="h-6 text-xs text-red-600" onClick={() => setDenyModal({ itemId: o.id, reason: "" })}>Deny</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-card rounded-xl border p-4">
                                <h3 className="font-semibold mb-3">Earnings Overview</h3>
                                <div className="h-24 flex items-center justify-center text-center">
                                    <div>
                                        <p className="text-3xl font-bold text-green-600">৳{stats.totalEarnings}</p>
                                        <p className="text-xs text-muted-foreground">Total earned</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Deny Modal */}
            {denyModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-xl p-6 w-full max-w-md">
                        <h3 className="font-semibold mb-4">Deny Order</h3>
                        <p className="text-sm text-muted-foreground mb-4">Please provide a reason for denying this order. The customer will be notified.</p>
                        <textarea
                            value={denyModal.reason}
                            onChange={(e) => setDenyModal({ ...denyModal, reason: e.target.value })}
                            placeholder="e.g., Out of stock, Cannot deliver to this area..."
                            className="w-full h-24 px-3 py-2 border rounded-lg text-sm mb-4"
                        />
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setDenyModal(null)} className="flex-1">Cancel</Button>
                            <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={denyOrder} disabled={!denyModal.reason.trim()}>Deny Order</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
