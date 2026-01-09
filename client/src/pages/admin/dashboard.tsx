import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Package, ShoppingCart, TrendingUp, LogOut, Shield, AlertTriangle, Check, X, Crown, Clock, Truck, Home, Store, ExternalLink, MapPin, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { createNotification } from "@/components/notifications";
import { AppLink as Link } from "@/components/app-link";

interface User {
    id: number;
    username: string; // Shop Name for sellers
    email: string;
    role: string;
    is_super_admin: boolean;
    verification_status: string;
    shop_type: string;
    shop_location: string;
    identity_documents: string[];
    termination_reason: string;
    appeal_text: string;
    created_at: string;
}

interface Order {
    id: number;
    total_amount: number;
    status: string;
    phone: string;
    shipping_address: any;
    created_at: string;
    buyer: { username: string; email: string };
}

interface Stats {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalSellers: number;
    totalAdmins: number;
    pendingVerifications: number;
}

const statusConfig: Record<string, { label: string; color: string; next?: string }> = {
    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700", next: "confirmed" },
    confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700", next: "processing" },
    processing: { label: "Processing", color: "bg-purple-100 text-purple-700", next: "shipped" },
    shipped: { label: "Shipped", color: "bg-indigo-100 text-indigo-700", next: "out_for_delivery" },
    out_for_delivery: { label: "Out for Delivery", color: "bg-cyan-100 text-cyan-700", next: "delivered" },
    delivered: { label: "Delivered", color: "bg-green-100 text-green-700" },
    cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
};

export default function AdminDashboard() {
    const { user, signOut } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [pendingSellers, setPendingSellers] = useState<User[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalProducts: 0, totalOrders: 0, totalSellers: 0, totalAdmins: 0, pendingVerifications: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"users" | "admins" | "products" | "orders" | "verifications">("users");
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteMsg, setInviteMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isSuperAdmin = currentUser?.is_super_admin || false;

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        if (user?.email) {
            const { data: me } = await supabase.from("users").select("*").eq("email", user.email).single();
            if (me) setCurrentUser(me);
        }

        const { data: usersData } = await supabase.from("users").select("*").order("created_at", { ascending: false });
        if (usersData) {
            setUsers(usersData);
            const pending = usersData.filter((u: User) => u.verification_status === "pending");
            setPendingSellers(pending);

            setStats(s => ({
                ...s,
                totalUsers: usersData.length,
                totalSellers: usersData.filter((u: User) => u.role === "seller").length,
                totalAdmins: usersData.filter((u: User) => u.role === "admin").length,
                pendingVerifications: pending.length,
            }));
        }

        const { data: ordersData } = await supabase
            .from("orders")
            .select(`*, buyer:users!buyer_id(id, username, email)`)
            .order("created_at", { ascending: false });
        if (ordersData) setOrders(ordersData as unknown as Order[]);

        const { count: pCount } = await supabase.from("products").select("*", { count: "exact", head: true });
        const { count: oCount } = await supabase.from("orders").select("*", { count: "exact", head: true });
        setStats(s => ({ ...s, totalProducts: pCount || 0, totalOrders: oCount || 0 }));
        setLoading(false);
    };

    const updateRole = async (userId: number, newRole: string) => {
        await supabase.from("users").update({ role: newRole }).eq("id", userId);
        fetchData();
    };

    const updateOrderStatus = async (orderId: number, newStatus: string) => {
        await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

        // Notify Buyer
        const order = orders.find(o => o.id === orderId);
        // @ts-ignore
        const buyerId = order?.buyer?.id;

        if (buyerId) {
            await createNotification(
                buyerId,
                "Order Update",
                `Your order #${orderId} is now ${statusConfig[newStatus]?.label || newStatus}.`,
                "info"
            );
        }
    };

    // ... inside component ...

    const verifySeller = async (userId: number, approved: boolean) => {
        const status = approved ? "verified" : "rejected";
        await supabase.from("users").update({ verification_status: status }).eq("id", userId);

        // Notify Seller
        await createNotification(
            userId,
            approved ? "Seller Verification Approved" : "Seller Verification Rejected",
            approved
                ? "Congratulations! Your seller account has been approved. You can now list products."
                : "Your seller verification request was rejected. Please check your email or contact support for more details.",
            approved ? "success" : "error"
        );

        if (approved) {
            // Ensure role is seller
            await supabase.from("users").update({ role: "seller" }).eq("id", userId);
        }
        fetchData();
    };

    const terminateSeller = async (userId: number, reason: string) => {
        if (!confirm(`Terminate seller/user? Reason: ${reason}`)) return;
        await supabase.from("users").update({
            verification_status: "terminated",
            termination_reason: reason,
            role: "buyer"
        }).eq("id", userId);

        // Notify Seller of Termination
        await createNotification(
            userId,
            "Account Terminated",
            `Your account has been terminated. Reason: ${reason}`,
            "error"
        );

        fetchData();
    };

    const unbanSeller = async (userId: number) => {
        if (!confirm("Unban this user? They will be restored to Verified status.")) return;
        await supabase.from("users").update({
            verification_status: "verified",
            termination_reason: null,
            appeal_text: null,
            role: "seller"
        }).eq("id", userId);

        // Notify Seller of Unban
        await createNotification(
            userId,
            "Account Restored",
            "Your account has been restored. You can now access your dashboard again.",
            "success"
        );

        fetchData();
    };

    const promoteToAdmin = async (userId: number, name: string) => {
        if (!isSuperAdmin) return alert("Only Super Admins can promote users to admin");
        if (!confirm(`Make "${name}" an admin?`)) return;
        await updateRole(userId, "admin");
    };

    const demoteAdmin = async (userId: number, name: string) => {
        if (!isSuperAdmin) return alert("Only Super Admins can remove admins");
        if (!confirm(`Remove admin from "${name}"?`)) return;
        await updateRole(userId, "buyer");
    };

    const inviteAdmin = async () => {
        if (!isSuperAdmin) return alert("Only Super Admins can add admins");
        if (!inviteEmail.trim()) return;
        setInviteLoading(true);
        setInviteMsg(null);
        const { data: foundUser } = await supabase.from("users").select("*").eq("email", inviteEmail.trim()).single();
        if (foundUser) {
            await updateRole(foundUser.id, "admin");
            setInviteMsg({ ok: true, text: `${foundUser.username} promoted to admin!` });
            setInviteEmail("");
        } else {
            setInviteMsg({ ok: false, text: "User not found. They must register first." });
        }
        setInviteLoading(false);
    };

    const admins = users.filter(u => u.role === "admin");
    const nonAdmins = users.filter(u => u.role !== "admin");

    return (
        <div className="min-h-screen bg-background flex flex-col lg:flex-row">
            {/* Mobile Header - Logo only */}
            <header className="lg:hidden sticky top-0 z-50 bg-card border-b border-border p-3 flex items-center justify-center gap-2">
                <Link href="/"><img src={`${import.meta.env.BASE_URL}logo-en.png`} alt="EcoHaat" className="h-8 cursor-pointer" /></Link>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Admin</span>
                {isSuperAdmin && <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1 rounded">Super</span>}
            </header>

            {/* Desktop Sidebar */}
            <aside className="w-64 bg-card border-r border-border p-4 flex-shrink-0 hidden lg:flex flex-col">
                <div className="flex items-center gap-2 mb-8">
                    <Link href="/"><img src={`${import.meta.env.BASE_URL}logo-en.png`} alt="EcoHaat" className="h-10 cursor-pointer" /></Link>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg leading-tight">Admin</span>
                        {isSuperAdmin && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 rounded-full w-fit">Super Admin</span>}
                    </div>
                </div>
                <nav className="space-y-1 flex-1">
                    {[
                        { id: "verifications", icon: Shield, label: "Verifications", count: stats.pendingVerifications },
                        { id: "users", icon: Users, label: "Users" },
                        ...(isSuperAdmin ? [{ id: "admins", icon: Crown, label: "Manage Admins" }] : []),
                        { id: "products", icon: Package, label: "Products" },
                        { id: "orders", icon: ShoppingCart, label: "Orders" },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id as any)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition ${activeTab === t.id ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-muted-foreground"}`}
                        >
                            <div className="flex items-center gap-3">
                                <t.icon className="h-4 w-4" /> {t.label}
                            </div>
                            {t.count ? <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{t.count}</span> : null}
                        </button>
                    ))}
                </nav>
                <Button variant="ghost" size="sm" onClick={signOut} className="justify-start gap-2 mt-4 text-red-500 hover:text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" /> Logout</Button>
            </aside>

            {/* Main */}
            <main className="flex-1 p-4 lg:p-8 overflow-auto pb-20 lg:pb-8">
                <div className="max-w-6xl mx-auto">
                    <header className="mb-6 lg:mb-8">
                        <h1 className="text-2xl font-bold mb-2">Dashboard Overview</h1>
                        <p className="text-muted-foreground">Manage your marketplace, approve sellers, and track orders.</p>
                    </header>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: "Pending Verifications", value: stats.pendingVerifications, icon: Shield, color: "bg-orange-100 text-orange-600" },
                            { label: "Total Users", value: stats.totalUsers, icon: Users, color: "bg-blue-100 text-blue-600" },
                            { label: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, color: "bg-green-100 text-green-600" },
                            { label: "Active Products", value: stats.totalProducts, icon: Package, color: "bg-purple-100 text-purple-600" },
                        ].map((s, i) => (
                            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-xl border p-4">
                                <div className="flex items-center gap-4">
                                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${s.color}`}><s.icon className="h-5 w-5" /></div>
                                    <div><p className="text-sm text-muted-foreground">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Seller Verifications Tab */}
                    {activeTab === "verifications" && (
                        <div className="space-y-6">
                            {/* Banned / Terminated Sellers */}
                            {users.some(u => u.verification_status === "terminated") && (
                                <div className="space-y-4 mb-8">
                                    <h2 className="text-lg font-semibold flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" /> Banned / Terminated Sellers</h2>
                                    <div className="grid gap-4">
                                        {users.filter(u => u.verification_status === "terminated").map(user => (
                                            <div key={user.id} className="bg-red-50 rounded-xl border border-red-200 p-6">
                                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h3 className="font-bold text-lg text-red-900">{user.username}</h3>
                                                            <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">Terminated</span>
                                                        </div>
                                                        <p className="text-sm text-red-800 mb-1"><strong>Reason:</strong> {user.termination_reason}</p>
                                                        {user.appeal_text ? (
                                                            <div className="mt-3 bg-white p-3 rounded-lg border border-red-100">
                                                                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Appeal Message</p>
                                                                <p className="text-sm italic">"{user.appeal_text}"</p>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground mt-2 italic">No appeal submitted yet.</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-start">
                                                        <Button onClick={() => unbanSeller(user.id)} className="bg-red-600 hover:bg-red-700 text-white border-none shadow-sm gap-2">
                                                            <Check className="h-4 w-4" /> Restore Account
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <h2 className="text-lg font-semibold flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Pending Requests ({pendingSellers.length})</h2>
                            {pendingSellers.length === 0 ? (
                                <div className="p-12 text-center bg-card rounded-xl border border-dashed">
                                    <Check className="h-12 w-12 mx-auto text-green-500 mb-4" />
                                    <h3 className="font-semibold text-lg">All Caught Up!</h3>
                                    <p className="text-muted-foreground">No pending seller verifications.</p>
                                </div>
                            ) : (
                                <div className="grid gap-6">
                                    {pendingSellers.map(seller => (
                                        <div key={seller.id} className="bg-card rounded-xl border p-6 flex flex-col md:flex-row gap-6">
                                            <div className="flex-1 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl uppercase">
                                                        {seller.username.slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg">{seller.username}</h3>
                                                        <p className="text-sm text-muted-foreground">{seller.email}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
                                                    <div>
                                                        <span className="text-muted-foreground block text-xs">Owner Name</span>
                                                        <span className="font-medium">{seller.username} (Check ID)</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground block text-xs">Shop Type</span>
                                                        <span className="font-medium">{seller.shop_type || "N/A"}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground block text-xs">Location</span>
                                                        <span className="font-medium flex items-center gap-1"><MapPin className="h-3 w-3" /> {seller.shop_location || "N/A"}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground block text-xs">Submitted At</span>
                                                        <span className="font-medium">{new Date(seller.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                {seller.identity_documents && seller.identity_documents.length > 0 && (
                                                    <div className="flex gap-2 items-center text-sm">
                                                        <span className="text-muted-foreground">ID Document:</span>
                                                        <a href={seller.identity_documents[0]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                                                            View Document <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex md:flex-col justify-end gap-2 md:w-32">
                                                <Button onClick={() => verifySeller(seller.id, true)} className="bg-green-600 hover:bg-green-700 w-full">Approve</Button>
                                                <Button onClick={() => verifySeller(seller.id, false)} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 w-full">Reject</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Admin Management */}
                    {activeTab === "admins" && isSuperAdmin && (
                        <div className="space-y-6">
                            <div className="bg-card rounded-xl border p-6">
                                <h3 className="font-semibold mb-4 flex items-center gap-2"><Crown className="h-5 w-5 text-yellow-500" /> Invite New Admin</h3>
                                <div className="flex gap-4 max-w-md">
                                    <Input placeholder="Enter user's email address" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                                    <Button onClick={inviteAdmin} disabled={inviteLoading}>Promote User</Button>
                                </div>
                                {inviteMsg && <p className={`mt-3 text-sm ${inviteMsg.ok ? "text-green-600" : "text-red-600"}`}>{inviteMsg.text}</p>}
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-card rounded-xl border overflow-hidden">
                                    <div className="p-4 border-b bg-muted/40"><h3 className="font-semibold">Current Admins</h3></div>
                                    <div className="divide-y">
                                        {admins.map(a => (
                                            <div key={a.id} className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-xs">{a.username.slice(0, 1)}</div>
                                                    <div><p className="font-medium text-sm">{a.username}</p><p className="text-xs text-muted-foreground">{a.email}</p></div>
                                                </div>
                                                {!a.is_super_admin && <Button variant="ghost" size="sm" onClick={() => demoteAdmin(a.id, a.username)} className="text-red-600 h-8">Remove</Button>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-card rounded-xl border overflow-hidden">
                                    <div className="p-4 border-b bg-muted/40"><h3 className="font-semibold">Eligible Users</h3></div>
                                    <div className="divide-y max-h-80 overflow-auto">
                                        {nonAdmins.slice(0, 5).map(u => (
                                            <div key={u.id} className="p-4 flex items-center justify-between">
                                                <div><p className="font-medium text-sm">{u.username}</p><p className="text-xs text-muted-foreground">{u.role}</p></div>
                                                <Button variant="outline" size="sm" onClick={() => promoteToAdmin(u.id, u.username)} className="h-8">Make Admin</Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Users Tab */}
                    {activeTab === "users" && (
                        <div className="bg-card rounded-xl border overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 border-b"><tr><th className="p-4">User</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr></thead>
                                <tbody className="divide-y">
                                    {users.map(u => (
                                        <tr key={u.id} className="group hover:bg-muted/20 transition">
                                            <td className="p-4">
                                                <div className="font-medium">{u.username}</div>
                                                <div className="text-xs text-muted-foreground">{u.email}</div>
                                            </td>
                                            <td className="p-4 capitalize">{u.role}</td>
                                            <td className="p-4">
                                                {u.verification_status === "verified" ? <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Verified</span> :
                                                    u.verification_status === "pending" ? <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Pending</span> :
                                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Unverified</span>}
                                            </td>
                                            <td className="p-4 text-right">
                                                {u.role === "buyer" && <Button variant="ghost" size="sm" onClick={() => updateRole(u.id, "seller")}>Make Seller</Button>}
                                                {u.role === "seller" && <Button variant="ghost" size="sm" onClick={() => updateRole(u.id, "buyer")}>Make Buyer</Button>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Products Tab */}
                    {activeTab === "products" && <div className="bg-card rounded-xl border p-12 text-center text-muted-foreground">Product management interface coming soon.</div>}

                    {/* Orders Tab */}
                    {activeTab === "orders" && (
                        <div className="space-y-4">
                            {orders.map(o => (
                                <div key={o.id} className="bg-card rounded-xl border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono font-bold">#{o.id}</span>
                                            <span className="text-sm text-muted-foreground">• {new Date(o.created_at).toLocaleDateString()}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[o.status]?.color}`}>{statusConfig[o.status]?.label}</span>
                                        </div>
                                        <p className="text-sm">Buyer: <span className="font-medium">{o.buyer?.username}</span></p>
                                        <p className="text-sm">Total: <span className="font-bold">৳{o.total_amount}</span></p>
                                    </div>
                                    <div className="flex gap-2">
                                        {statusConfig[o.status]?.next && <Button size="sm" onClick={() => updateOrderStatus(o.id, statusConfig[o.status].next!)}>Mark {statusConfig[statusConfig[o.status].next!].label}</Button>}
                                        {o.status !== "cancelled" && <Button size="sm" variant="outline" className="text-red-600" onClick={() => updateOrderStatus(o.id, "cancelled")}>Cancel</Button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 safe-area-inset-bottom">
                <div className="flex items-center justify-around px-2 py-2">
                    {[
                        { id: "verifications", icon: Shield, label: "Verify", count: stats.pendingVerifications },
                        { id: "users", icon: Users, label: "Users" },
                        { id: "orders", icon: ShoppingCart, label: "Orders" },
                        { id: "products", icon: Package, label: "Products" },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id as any)}
                            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg touch-target relative ${activeTab === t.id ? "text-primary" : "text-muted-foreground"}`}
                        >
                            <t.icon className="h-5 w-5" />
                            <span className="text-xs font-medium">{t.label}</span>
                            {t.count ? <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full">{t.count}</span> : null}
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
}
