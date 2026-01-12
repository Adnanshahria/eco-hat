import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Package, ShoppingCart, TrendingUp, LogOut, Shield, AlertTriangle, Check, X, Crown, Clock, Truck, Home, Store, ExternalLink, MapPin, Menu, LayoutDashboard, Bell, Send, Search, Loader2, Mail, Tag, Percent, Gift, Trash2, Plus, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { createNotification } from "@/components/notifications";
import { AppLink as Link } from "@/components/app-link";

// Send Notification Section Component
function SendNotificationSection({ users }: { users: User[] }) {
    const [mode, setMode] = useState<"single" | "batch">("single");
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [notifType, setNotifType] = useState<"info" | "success" | "warning" | "error">("info");
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

    const filteredUsers = users.filter(u => {
        const matchesRole = roleFilter === "all" || u.role === roleFilter;
        const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesRole && matchesSearch;
    });

    const selectedUser = users.find(u => u.id === selectedUserId);
    const batchTargets = roleFilter === "all" ? users : users.filter(u => u.role === roleFilter);

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            setResult({ ok: false, text: "Please fill in title & message" });
            return;
        }

        if (mode === "single" && !selectedUserId) {
            setResult({ ok: false, text: "Please select a user" });
            return;
        }

        setSending(true);
        setResult(null);

        try {
            if (mode === "single") {
                // Single user notification
                await createNotification(selectedUserId!, title, message, notifType);

                fetch("/api/notifications/admin/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: selectedUser?.email, title, message, type: notifType })
                }).catch(err => console.warn("Email failed:", err));

                setResult({ ok: true, text: `✅ Notification sent to ${selectedUser?.username}!` });
            } else {
                // Batch notification to all filtered users
                let successCount = 0;
                for (const user of batchTargets) {
                    try {
                        await createNotification(user.id, title, message, notifType);

                        fetch("/api/notifications/admin/send", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email: user.email, title, message, type: notifType })
                        }).catch(() => { });

                        successCount++;
                    } catch {
                        console.warn(`Failed for ${user.email}`);
                    }
                }
                setResult({ ok: true, text: `✅ Notification sent to ${successCount} users!` });
            }

            setTitle("");
            setMessage("");
            setSelectedUserId(null);
        } catch (err: any) {
            setResult({ ok: false, text: err.message || "Failed to send notification" });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="bg-card rounded-xl border p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" /> Send Notification
                </h3>
                <div className="flex gap-1 bg-muted rounded-lg p-1">
                    <button
                        onClick={() => setMode("single")}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition ${mode === "single" ? "bg-background shadow" : ""}`}
                    >
                        Single User
                    </button>
                    <button
                        onClick={() => setMode("batch")}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition ${mode === "batch" ? "bg-background shadow" : ""}`}
                    >
                        Batch Send
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* User Selection */}
                <div className="space-y-4">
                    {mode === "batch" && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                            <strong>Batch Mode:</strong> Send to {batchTargets.length} user{batchTargets.length !== 1 ? "s" : ""}
                            {roleFilter !== "all" ? ` (role: ${roleFilter})` : " (all roles)"}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9"
                                disabled={mode === "batch"}
                            />
                        </div>
                        <select
                            className="border rounded-lg px-3 py-2 text-sm bg-background"
                            value={roleFilter}
                            onChange={e => setRoleFilter(e.target.value)}
                        >
                            <option value="all">All Roles</option>
                            <option value="buyer">Buyers</option>
                            <option value="seller">Sellers</option>
                            <option value="uv-seller">Unverified Sellers</option>
                            <option value="admin">Admins</option>
                        </select>
                    </div>

                    {mode === "single" && (
                        <>
                            <div className="border rounded-lg max-h-48 overflow-auto">
                                {filteredUsers.length === 0 ? (
                                    <div className="p-4 text-center text-muted-foreground text-sm">No users found</div>
                                ) : filteredUsers.slice(0, 20).map(u => (
                                    <div
                                        key={u.id}
                                        onClick={() => setSelectedUserId(u.id)}
                                        className={`p-3 border-b last:border-b-0 cursor-pointer flex items-center justify-between transition ${selectedUserId === u.id ? "bg-primary/10" : "hover:bg-muted/50"}`}
                                    >
                                        <div>
                                            <p className="font-medium text-sm">{u.username}</p>
                                            <p className="text-xs text-muted-foreground">{u.email}</p>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-red-100 text-red-700' :
                                            u.role === 'seller' ? 'bg-blue-100 text-blue-700' :
                                                u.role === 'uv-seller' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-700'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {selectedUser && (
                                <div className="bg-primary/10 rounded-lg p-3 text-sm">
                                    <span className="text-muted-foreground">Sending to: </span>
                                    <span className="font-medium text-primary">{selectedUser.username}</span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Notification Form */}
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium block mb-1.5">Title</label>
                        <Input
                            placeholder="Notification title"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1.5">Message</label>
                        <textarea
                            placeholder="Write your message here..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            className="w-full border rounded-lg p-3 text-sm bg-background resize-none h-24"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1.5">Type</label>
                        <div className="flex gap-2">
                            {(["info", "success", "warning", "error"] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setNotifType(t)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition ${notifType === t
                                        ? t === "info" ? "bg-blue-500 text-white" :
                                            t === "success" ? "bg-green-500 text-white" :
                                                t === "warning" ? "bg-yellow-500 text-white" :
                                                    "bg-red-500 text-white"
                                        : "bg-muted hover:bg-muted/80"
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {result && (
                        <div className={`p-3 rounded-lg text-sm ${result.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                            {result.text}
                        </div>
                    )}

                    <Button
                        onClick={handleSend}
                        disabled={sending || !title || !message || (mode === "single" && !selectedUserId)}
                        className="w-full gap-2"
                    >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        {sending ? "Sending..." : mode === "batch" ? `Send to ${batchTargets.length} Users` : "Send Notification"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Newsletter Broadcast Section Component
function NewsletterBroadcastSection() {
    const [subject, setSubject] = useState("");
    const [content, setContent] = useState("");
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
    const [subscriberCount, setSubscriberCount] = useState<number | null>(null);

    useEffect(() => {
        // Fetch subscriber count
        fetch("/api/newsletter/subscribers/count")
            .then(res => res.json())
            .then(data => setSubscriberCount(data.count || 0))
            .catch(() => setSubscriberCount(0));
    }, []);

    const handleSend = async () => {
        if (!subject.trim() || !content.trim()) {
            setResult({ ok: false, text: "Please fill in subject and content" });
            return;
        }

        setSending(true);
        setResult(null);

        try {
            const res = await fetch("/api/newsletter/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject, content })
            });

            const data = await res.json();

            if (res.ok) {
                setResult({ ok: true, text: `✅ Newsletter sent to ${data.sent} subscriber${data.sent !== 1 ? 's' : ''}!` });
                setSubject("");
                setContent("");
            } else {
                setResult({ ok: false, text: data.error || "Failed to send newsletter" });
            }
        } catch (err: any) {
            setResult({ ok: false, text: err.message || "Failed to send newsletter" });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="bg-card rounded-xl border p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" /> Newsletter Broadcast
                </h3>
                <div className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                    {subscriberCount !== null ? `${subscriberCount} subscribers` : "Loading..."}
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium block mb-1.5">Subject</label>
                    <Input
                        id="newsletter-subject"
                        name="subject"
                        placeholder="e.g., 🎉 Special Offer - 20% Off All Eco Products!"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium block mb-1.5">Content</label>
                    <textarea
                        id="newsletter-content"
                        name="content"
                        placeholder="Write your newsletter content here...

You can use multiple paragraphs.

Include details about offers, new products, or announcements."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        className="w-full border rounded-lg p-3 text-sm bg-background resize-none h-32"
                    />
                </div>

                {result && (
                    <div className={`p-3 rounded-lg text-sm ${result.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {result.text}
                    </div>
                )}

                <Button
                    onClick={handleSend}
                    disabled={sending || !subject || !content || subscriberCount === 0}
                    className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    {sending ? "Sending..." : `Send to ${subscriberCount || 0} Subscribers`}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                    Emails will be sent to all newsletter subscribers with the Eco-Haat branding.
                </p>
            </div>
        </div>
    );
}

// Discount Code Interface
interface DiscountCode {
    id: number;
    code: string;
    description: string;
    discount_type: "percentage" | "fixed" | "free_shipping";
    discount_value: number;
    max_discount: number | null;
    min_order_amount: number;
    max_uses: number | null;
    uses_count: number;
    per_user_limit: number;
    valid_from: string;
    valid_until: string | null;
    is_active: boolean;
    created_at: string;
}

// Discount Management Section Component
function DiscountManagementSection() {
    const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<DiscountCode | null>(null);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        code: "",
        description: "",
        discount_type: "percentage" as "percentage" | "fixed" | "free_shipping",
        discount_value: 10,
        max_discount: "",
        min_order_amount: 0,
        max_uses: "",
        per_user_limit: 1,
        valid_until: "",
        is_active: true
    });

    useEffect(() => { fetchDiscounts(); }, []);

    const fetchDiscounts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("discount_codes")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            if (data) setDiscounts(data);
        } catch (err) {
            console.error("Failed to fetch discounts:", err);
        } finally {
            setLoading(false);
        }
    };

    const generateCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "ECO-";
        for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
        setFormData(f => ({ ...f, code }));
    };

    const resetForm = () => {
        setFormData({
            code: "", description: "", discount_type: "percentage", discount_value: 10,
            max_discount: "", min_order_amount: 0, max_uses: "", per_user_limit: 1, valid_until: "", is_active: true
        });
        setEditing(null);
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMsg(null);

        try {
            const payload = {
                code: formData.code.toUpperCase().trim(),
                description: formData.description,
                discount_type: formData.discount_type,
                discount_value: formData.discount_value || 0,
                max_discount: formData.max_discount ? Number(formData.max_discount) : null,
                min_order_amount: formData.min_order_amount || 0,
                max_uses: formData.max_uses ? Number(formData.max_uses) : null,
                per_user_limit: formData.per_user_limit || 1,
                valid_until: formData.valid_until || null,
                is_active: formData.is_active
            };

            if (editing) {
                const { error } = await supabase
                    .from("discount_codes")
                    .update(payload)
                    .eq("id", editing.id);
                if (error) throw error;
                setMsg({ ok: true, text: "Discount updated!" });
            } else {
                const { error } = await supabase
                    .from("discount_codes")
                    .insert(payload);
                if (error) {
                    if (error.code === "23505") {
                        throw new Error("A code with this name already exists");
                    }
                    throw error;
                }
                setMsg({ ok: true, text: "Discount created!" });
            }
            fetchDiscounts();
            resetForm();
        } catch (err: any) {
            setMsg({ ok: false, text: err.message || "Failed to save" });
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (d: DiscountCode) => {
        setEditing(d);
        setFormData({
            code: d.code,
            description: d.description || "",
            discount_type: d.discount_type,
            discount_value: d.discount_value,
            max_discount: d.max_discount?.toString() || "",
            min_order_amount: d.min_order_amount,
            max_uses: d.max_uses?.toString() || "",
            per_user_limit: d.per_user_limit,
            valid_until: d.valid_until ? d.valid_until.split("T")[0] : "",
            is_active: d.is_active
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this discount code?")) return;
        try {
            const { error } = await supabase.from("discount_codes").delete().eq("id", id);
            if (error) throw error;
            fetchDiscounts();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const toggleActive = async (d: DiscountCode) => {
        try {
            const { error } = await supabase
                .from("discount_codes")
                .update({ is_active: !d.is_active })
                .eq("id", d.id);
            if (error) throw error;
            fetchDiscounts();
        } catch (err) {
            console.error("Toggle failed:", err);
        }
    };

    return (
        <div className="bg-card rounded-xl border p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" /> Discount Codes
                </h3>
                <Button size="sm" onClick={() => { resetForm(); setShowForm(!showForm); }} className="gap-1">
                    <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "New Code"}
                </Button>
            </div>

            {/* Create/Edit Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-muted/50 rounded-lg p-4 mb-4 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs font-medium">Code</label>
                            <div className="flex gap-1">
                                <Input value={formData.code} onChange={e => setFormData(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="ECOFIRST10" required />
                                <Button type="button" size="sm" variant="outline" onClick={generateCode}>Gen</Button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium">Type</label>
                            <select value={formData.discount_type} onChange={e => setFormData(f => ({ ...f, discount_type: e.target.value as any }))} className="w-full border rounded-md h-9 px-2 bg-background text-sm">
                                <option value="percentage">Percentage %</option>
                                <option value="fixed">Fixed Amount ৳</option>
                                <option value="free_shipping">Free Shipping</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium">Value</label>
                            <Input type="number" value={formData.discount_value} onChange={e => setFormData(f => ({ ...f, discount_value: Number(e.target.value) }))} min={0} />
                        </div>
                        {formData.discount_type === "percentage" && (
                            <div>
                                <label className="text-xs font-medium">Max Discount ৳</label>
                                <Input type="number" value={formData.max_discount} onChange={e => setFormData(f => ({ ...f, max_discount: e.target.value }))} placeholder="e.g., 500" />
                            </div>
                        )}
                        <div>
                            <label className="text-xs font-medium">Min Order ৳</label>
                            <Input type="number" value={formData.min_order_amount} onChange={e => setFormData(f => ({ ...f, min_order_amount: Number(e.target.value) }))} min={0} />
                        </div>
                        <div>
                            <label className="text-xs font-medium">Max Uses</label>
                            <Input type="number" value={formData.max_uses} onChange={e => setFormData(f => ({ ...f, max_uses: e.target.value }))} placeholder="Unlimited" />
                        </div>
                        <div>
                            <label className="text-xs font-medium">Per User Limit</label>
                            <Input type="number" value={formData.per_user_limit} onChange={e => setFormData(f => ({ ...f, per_user_limit: Number(e.target.value) }))} min={1} />
                        </div>
                        <div>
                            <label className="text-xs font-medium">Expires</label>
                            <Input type="date" value={formData.valid_until} onChange={e => setFormData(f => ({ ...f, valid_until: e.target.value }))} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium">Description (internal)</label>
                        <Input value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} placeholder="e.g., Summer sale 2026" />
                    </div>
                    {msg && <div className={`text-sm p-2 rounded ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>}
                    <Button type="submit" disabled={saving} className="w-full">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editing ? "Update" : "Create")} Discount</Button>
                </form>
            )}

            {/* Discounts List */}
            {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : discounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No discount codes yet</div>
            ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {discounts.map(d => (
                        <div key={d.id} className={`flex items-center justify-between p-3 rounded-lg border ${d.is_active ? "bg-green-50/50" : "bg-muted/50 opacity-60"}`}>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <code className="font-bold text-primary">{d.code}</code>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                        {d.discount_type === "percentage" ? `${d.discount_value}%${d.max_discount ? ` max ৳${d.max_discount}` : ""}` :
                                            d.discount_type === "fixed" ? `৳${d.discount_value}` : "Free Shipping"}
                                    </span>
                                    {!d.is_active && <span className="text-xs text-red-500">Inactive</span>}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {d.min_order_amount > 0 && `Min ৳${d.min_order_amount} • `}
                                    Uses: {d.uses_count}{d.max_uses ? `/${d.max_uses}` : ""}
                                    {d.valid_until && ` • Expires: ${new Date(d.valid_until).toLocaleDateString()}`}
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => toggleActive(d)} className="h-8 w-8 p-0">{d.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}</Button>
                                <Button size="sm" variant="ghost" onClick={() => handleEdit(d)} className="h-8 w-8 p-0"><Edit className="h-4 w-4" /></Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDelete(d.id)} className="h-8 w-8 p-0 text-red-500"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

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
    pendingProductVerifications: number;
}

const statusConfig: Record<string, { label: string; color: string; next?: string }> = {
    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700", next: "confirmed" },
    confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700", next: "processing" },
    processing: { label: "Processing", color: "bg-purple-100 text-purple-700", next: "shipped" },
    shipped: { label: "Shipped", color: "bg-indigo-100 text-indigo-700", next: "at_station" },
    at_station: { label: "At Station", color: "bg-cyan-100 text-cyan-700", next: "reached_destination" },
    reached_destination: { label: "Reached Destination", color: "bg-teal-100 text-teal-700" },
    delivered: { label: "Delivered", color: "bg-green-100 text-green-700" },
    cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
    denied: { label: "Denied", color: "bg-red-100 text-red-700" },
};

export default function AdminDashboard() {
    const { user, signOut } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [pendingSellers, setPendingSellers] = useState<User[]>([]);
    const [pendingProducts, setPendingProducts] = useState<any[]>([]); // New state for products
    const [orders, setOrders] = useState<Order[]>([]);
    const [orderItems, setOrderItems] = useState<any[]>([]); // For tracking tab
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalProducts: 0, totalOrders: 0, totalSellers: 0, totalAdmins: 0, pendingVerifications: 0, pendingProductVerifications: 0 });
    const [loading, setLoading] = useState(true);

    // Check URL for specific routes
    const [, overviewMatch] = useRoute("/admin");
    const [, sellersMatch] = useRoute("/admin/sellers");
    const [, productsMatch] = useRoute("/admin/products");
    const [, usersMatch] = useRoute("/admin/users");
    const [, ordersMatch] = useRoute("/admin/orders");
    const [, adminsMatch] = useRoute("/admin/admins");

    type TabType = "overview" | "users" | "admins" | "products" | "orders" | "seller-verifications" | "product-verifications" | "tracking";

    const getActiveTab = (): TabType => {
        if (sellersMatch) return "seller-verifications";
        if (productsMatch) return "product-verifications";
        if (usersMatch) return "users";
        if (ordersMatch) return "tracking";
        if (adminsMatch) return "admins";
        return "overview";
    };

    const [activeTab, setActiveTab] = useState<TabType>(getActiveTab());

    useEffect(() => {
        setActiveTab(getActiveTab());
    }, [overviewMatch, sellersMatch, productsMatch, usersMatch, ordersMatch, adminsMatch]);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteMsg, setInviteMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");

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

            // Fetch Pending Products
            const { data: pendingProd } = await supabase.from("products").select("*").eq("status", "pending");
            if (pendingProd) setPendingProducts(pendingProd);

            setStats(s => ({
                ...s,
                totalUsers: usersData.length,
                totalSellers: usersData.filter((u: User) => u.role === "seller").length,
                totalAdmins: usersData.filter((u: User) => u.role === "admin").length,
                pendingVerifications: pending.length,
                pendingProductVerifications: pendingProd?.length || 0,
            }));
        }

        const { data: ordersData } = await supabase
            .from("orders")
            .select(`*, buyer:users!buyer_id(id, username, email)`)
            .order("created_at", { ascending: false });
        if (ordersData) setOrders(ordersData as unknown as Order[]);

        // Fetch order items with all related data for tracking
        const { data: itemsData } = await supabase
            .from("order_items")
            .select(`
                id, quantity, price_at_purchase, item_status, payment_received, payment_sent_to_seller,
                order:orders (id, order_number, status, phone, shipping_address, created_at, buyer:users!orders_buyer_id_fkey(id, username, email)),
                product:products (id, name, images),
                seller:users!order_items_seller_id_fkey (id, username, email, shop_location)
            `)
            .order("id", { ascending: false });
        if (itemsData) setOrderItems(itemsData);

        const { count: pCount } = await supabase.from("products").select("*", { count: "exact", head: true });
        const { count: oCount } = await supabase.from("orders").select("*", { count: "exact", head: true });
        setStats(s => ({ ...s, totalProducts: pCount || 0, totalOrders: oCount || 0 }));
        setLoading(false);
    };

    const verifyProduct = async (productId: number, approved: boolean, reason?: string) => {
        const updateData: any = { status: approved ? 'approved' : 'rejected' };
        if (!approved && reason) updateData.rejection_reason = reason;

        await supabase.from("products").update(updateData).eq("id", productId);

        // Notify Seller (Todo: Fetch product to get seller_id)
        // For now just update local state
        setPendingProducts(prev => prev.filter(p => p.id !== productId));
        setStats(s => ({ ...s, pendingProductVerifications: s.pendingProductVerifications - 1 }));

        // Optionally refetch
        // fetchData();
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
                `Your order #${orderId} is now ${newStatus}.`,
                "info"
            );
        }
    };

    const updateItemStatus = async (itemId: number, newStatus: string, orderId?: number) => {
        await supabase.from("order_items").update({ item_status: newStatus }).eq("id", itemId);
        setOrderItems(orderItems.map(i => i.id === itemId ? { ...i, item_status: newStatus } : i));

        // Update tracking history and notify buyer (in-app + email)
        if (orderId) {
            const { data: orderData } = await supabase.from("orders").select("tracking_history, buyer_id, order_number").eq("id", orderId).single();
            if (orderData) {
                const history = orderData.tracking_history || [];
                const statusMessages: Record<string, string> = {
                    at_station: "📍 Your package has arrived at the delivery station",
                    reached_destination: "🎉 Your package has reached your area and is ready for delivery!",
                    delivered: "✅ Order has been delivered successfully!",
                    cancelled: "❌ Order has been cancelled by admin",
                };
                const note = statusMessages[newStatus] || `Order status updated to ${newStatus}`;
                history.push({ status: newStatus, timestamp: new Date().toISOString(), note });
                await supabase.from("orders").update({ tracking_history: history, status: newStatus }).eq("id", orderId);

                // Notify buyer (in-app)
                if (orderData.buyer_id) {
                    await createNotification(
                        orderData.buyer_id,
                        `📦 Delivery Update`,
                        note,
                        "info"
                    );

                    // Send email to buyer
                    const { data: buyerData } = await supabase.from("users").select("email").eq("id", orderData.buyer_id).single();
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
            }
        }
    };

    // Payment tracking functions
    const markPaymentReceived = async (itemId: number) => {
        await supabase.from("order_items").update({ payment_received: true }).eq("id", itemId);
        setOrderItems(orderItems.map(i => i.id === itemId ? { ...i, payment_received: true } : i));
    };

    const markPaymentSentToSeller = async (itemId: number, sellerId: number, orderNumber: string, amount: number) => {
        await supabase.from("order_items").update({ payment_sent_to_seller: true }).eq("id", itemId);
        setOrderItems(orderItems.map(i => i.id === itemId ? { ...i, payment_sent_to_seller: true } : i));

        // Notify seller
        await createNotification(
            sellerId,
            "💰 Payment Received!",
            `Payment of ৳${amount.toFixed(0)} for order #${orderNumber} has been sent to your account.`,
            "success"
        );
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
        <div className="min-h-screen bg-grass-pattern flex flex-col lg:flex-row">
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
                        { id: "overview", route: "/admin", icon: LayoutDashboard, label: "Overview" },
                        { id: "seller-verifications", route: "/admin/sellers", icon: Users, label: "Seller Verifications", count: stats.pendingVerifications },
                        { id: "product-verifications", route: "/admin/products", icon: Shield, label: "Product Verifications", count: stats.pendingProductVerifications },
                        { id: "users", route: "/admin/users", icon: Users, label: "Users" },
                        ...(isSuperAdmin ? [{ id: "admins", route: "/admin/admins", icon: Crown, label: "Manage Admins" }] : []),
                        { id: "tracking", route: "/admin/orders", icon: ShoppingCart, label: "Orders" },
                    ].map(t => (
                        <Link key={t.id} href={t.route}>
                            <div className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition cursor-pointer ${activeTab === t.id || (t.id === "tracking" && activeTab === "orders") ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-muted-foreground"}`}>
                                <div className="flex items-center gap-3">
                                    <t.icon className="h-4 w-4" /> {t.label}
                                </div>
                                {t.count ? <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{t.count}</span> : null}
                            </div>
                        </Link>
                    ))}
                </nav>
                <Button variant="ghost" size="sm" onClick={signOut} className="justify-start gap-2 mt-4 text-red-500 hover:text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" /> Logout</Button>
            </aside>

            {/* Main */}
            <main className="flex-1 p-4 lg:p-8 overflow-auto pb-20 lg:pb-8">
                <div className="max-w-6xl mx-auto">
                    <header className="mb-6 lg:mb-8">
                        <h1 className="text-2xl font-bold mb-2">
                            {activeTab === "overview" && "Dashboard Overview"}
                            {activeTab === "seller-verifications" && "Seller Verifications"}
                            {activeTab === "product-verifications" && "Product Verifications"}
                            {activeTab === "users" && "User Management"}
                            {activeTab === "admins" && "Manage Admins"}
                            {activeTab === "tracking" && "Order Tracking"}
                        </h1>
                        <p className="text-muted-foreground">
                            {activeTab === "overview" && "Manage your marketplace, approve sellers, and track orders."}
                            {activeTab === "seller-verifications" && "Review and approve seller registration requests."}
                            {activeTab === "product-verifications" && "Review and approve new product listings."}
                            {activeTab === "users" && "View and manage all registered users."}
                            {activeTab === "admins" && "Add or remove admin privileges."}
                            {activeTab === "tracking" && "Track and manage all orders."}
                        </p>
                    </header>

                    {/* Stats - Only on Overview Tab */}
                    {activeTab === "overview" && (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                                {[
                                    { label: "Pending Sellers", value: stats.pendingVerifications, icon: Users, color: "bg-orange-100 text-orange-600" },
                                    { label: "Pending Products", value: stats.pendingProductVerifications, icon: Shield, color: "bg-yellow-100 text-yellow-600" },
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

                            {/* Send Notification Section */}
                            <SendNotificationSection users={users} />

                            {/* Newsletter Broadcast Section */}
                            <NewsletterBroadcastSection />

                            {/* Discount Codes Section */}
                            <DiscountManagementSection />
                        </>
                    )}

                    {/* Product Verifications Tab */}
                    {activeTab === "product-verifications" && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold flex items-center gap-2"><Shield className="h-5 w-5 text-yellow-500" /> Pending Products ({pendingProducts.length})</h2>
                            {pendingProducts.length === 0 ? (
                                <div className="p-12 text-center bg-card rounded-xl border border-dashed">
                                    <Check className="h-12 w-12 mx-auto text-green-500 mb-4" />
                                    <h3 className="font-semibold text-lg">No Pending Products</h3>
                                    <p className="text-muted-foreground">All products have been reviewed.</p>
                                </div>
                            ) : (
                                <div className="grid gap-6">
                                    {pendingProducts.map(product => (
                                        <div key={product.id} className="bg-card rounded-xl border p-6 flex flex-col md:flex-row gap-6">
                                            {product.images && product.images[0] && (
                                                <img src={product.images[0]} alt={product.name} className="w-24 h-24 object-cover rounded-lg border bg-white" />
                                            )}
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="font-bold text-lg">{product.name}</h3>
                                                        <p className="text-sm font-medium text-emerald-600">৳{product.price}</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                                                <div className="text-xs text-muted-foreground bg-muted p-2 rounded inline-block">
                                                    Stock: {product.stock} • ID: {product.id} • Seller ID: {product.seller_id}
                                                </div>
                                            </div>
                                            <div className="flex md:flex-col justify-end gap-2 md:w-36">
                                                <Link href={`/admin/verify-product/${product.id}`}>
                                                    <Button variant="outline" className="w-full gap-1 text-xs">View Details</Button>
                                                </Link>
                                                <Button onClick={() => verifyProduct(product.id, true)} className="bg-green-600 hover:bg-green-700 w-full text-xs">Approve</Button>
                                                <Button onClick={() => {
                                                    const reason = prompt("Reason for rejection:");
                                                    if (reason) verifyProduct(product.id, false, reason);
                                                }} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 w-full text-xs">Reject</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Order Tracking Tab */}
                    {activeTab === "tracking" && (() => {
                        const filteredItems = orderStatusFilter === "all"
                            ? orderItems
                            : orderItems.filter(i => (i.item_status || i.order?.status || "pending") === orderStatusFilter);

                        return (
                            <div className="space-y-6">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <h2 className="text-xl font-bold flex items-center gap-2"><Truck className="h-5 w-5" /> Order Tracking</h2>
                                    <div className="flex items-center gap-3">
                                        <select
                                            className="text-sm border rounded-lg px-3 py-2 bg-background"
                                            value={orderStatusFilter}
                                            onChange={(e) => setOrderStatusFilter(e.target.value)}
                                        >
                                            <option value="all">All Status ({orderItems.length})</option>
                                            <option value="pending">🕐 Pending</option>
                                            <option value="confirmed">✓ Confirmed</option>
                                            <option value="processing">⚙️ Processing</option>
                                            <option value="shipped">🚚 Shipped</option>
                                            <option value="at_station">📍 At Station</option>
                                            <option value="reached_destination">🎯 Reached Destination</option>
                                            <option value="delivered">✅ Delivered</option>
                                            <option value="cancelled">❌ Cancelled</option>
                                        </select>
                                        <span className="text-sm text-muted-foreground">{filteredItems.length} items</span>
                                    </div>
                                </div>

                                <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50 text-left">
                                                <tr>
                                                    <th className="p-3 font-medium text-muted-foreground">Order #</th>
                                                    <th className="p-3 font-medium text-muted-foreground">Product</th>
                                                    <th className="p-3 font-medium text-muted-foreground">Buyer</th>
                                                    <th className="p-3 font-medium text-muted-foreground">Seller</th>
                                                    <th className="p-3 font-medium text-muted-foreground">Earning</th>
                                                    <th className="p-3 font-medium text-muted-foreground">Status</th>
                                                    <th className="p-3 font-medium text-muted-foreground">Buyer Paid</th>
                                                    <th className="p-3 font-medium text-muted-foreground">Seller Paid</th>
                                                    <th className="p-3 font-medium text-muted-foreground">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orderItems.length === 0 ? (
                                                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No orders found</td></tr>
                                                ) : filteredItems.map((item: any) => {
                                                    const statusColors: Record<string, string> = {
                                                        pending: "bg-yellow-100 text-yellow-800",
                                                        confirmed: "bg-blue-100 text-blue-800",
                                                        processing: "bg-purple-100 text-purple-800",
                                                        shipped: "bg-indigo-100 text-indigo-800",
                                                        delivered: "bg-green-100 text-green-800",
                                                        denied: "bg-red-100 text-red-800",
                                                    };
                                                    const status = item.item_status || item.order?.status || "pending";
                                                    const address = item.order?.shipping_address;

                                                    return (
                                                        <tr key={item.id} className="border-t hover:bg-muted/20 transition">
                                                            <td className="p-3">
                                                                <div className="font-mono font-bold text-emerald-700">#{item.order?.order_number || item.order?.id}</div>
                                                                <div className="text-xs text-muted-foreground">Item #{item.id}</div>
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="flex items-center gap-2">
                                                                    {item.product?.images?.[0] && (
                                                                        <img src={item.product.images[0]} alt="" className="w-10 h-10 rounded object-cover" />
                                                                    )}
                                                                    <div>
                                                                        <div className="font-medium">{item.product?.name || "Unknown"}</div>
                                                                        <div className="text-xs text-muted-foreground">×{item.quantity}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="font-medium">{item.order?.buyer?.username || "—"}</div>
                                                                <div className="text-xs text-muted-foreground">{item.order?.phone}</div>
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="font-medium">{item.seller?.username || "—"}</div>
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="font-bold text-green-600">৳{item.price_at_purchase * item.quantity}</div>
                                                            </td>
                                                            <td className="p-3">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[status] || "bg-gray-100"}`}>
                                                                    {status.replace(/_/g, " ")}
                                                                </span>
                                                            </td>
                                                            <td className="p-3">
                                                                {item.payment_received ? (
                                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✓ Received</span>
                                                                ) : status === "delivered" ? (
                                                                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => markPaymentReceived(item.id)}>💵 Mark Received</Button>
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground">Pending</span>
                                                                )}
                                                            </td>
                                                            <td className="p-3">
                                                                {item.payment_sent_to_seller ? (
                                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✓ Paid</span>
                                                                ) : item.payment_received ? (
                                                                    <Button size="sm" variant="outline" className="h-7 text-xs bg-blue-50" onClick={() => markPaymentSentToSeller(item.id, item.seller?.id, item.order?.order_number || String(item.order?.id), item.price_at_purchase * item.quantity)}>💸 Pay Seller</Button>
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground">—</span>
                                                                )}
                                                            </td>
                                                            <td className="p-3">
                                                                <select
                                                                    className="text-xs border rounded px-2 py-1 bg-background"
                                                                    value={status}
                                                                    onChange={(e) => updateItemStatus(item.id, e.target.value, item.order?.id)}
                                                                >
                                                                    <option value={status}>{statusConfig[status]?.label || status}</option>
                                                                    {status === "shipped" && <option value="at_station">📍 At Station</option>}
                                                                    {(status === "shipped" || status === "at_station") && <option value="reached_destination">🎯 Reached Destination</option>}
                                                                    {(status === "reached_destination" || status === "at_station" || status === "shipped") && <option value="delivered">✅ Mark Delivered</option>}
                                                                    {status !== "cancelled" && status !== "delivered" && <option value="cancelled">❌ Cancel Order</option>}
                                                                </select>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Seller Verifications Tab */}
                    {activeTab === "seller-verifications" && (
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
                                                        <span className="font-medium">{seller.username}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground block text-xs">Submitted At</span>
                                                        <span className="font-medium">{new Date(seller.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex md:flex-col justify-end gap-2 md:w-32">
                                                <Link href={`/admin/verify-seller/${seller.id}`}>
                                                    <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                                                        View Details <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                </Link>
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
                                                {/* Role management removed */}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Products Tab - Not needed anymore since products are shown via verifications */}

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
            </main >

            {/* Mobile Bottom Navigation */}
            < nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 safe-area-inset-bottom" >
                <div className="flex items-center justify-around px-1 py-2">
                    {[
                        { id: "overview", route: "/admin", icon: LayoutDashboard, label: "Overview" },
                        { id: "seller-verifications", route: "/admin/sellers", icon: Store, label: "Sellers", count: stats.pendingVerifications },
                        { id: "product-verifications", route: "/admin/products", icon: Shield, label: "Products", count: stats.pendingProductVerifications },
                        { id: "users", route: "/admin/users", icon: Users, label: "Users" },
                        { id: "tracking", route: "/admin/orders", icon: ShoppingCart, label: "Orders" },
                    ].map(t => (
                        <Link key={t.id} href={t.route}>
                            <div className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg touch-target relative ${activeTab === t.id ? "text-primary" : "text-muted-foreground"}`}>
                                <t.icon className="h-5 w-5" />
                                <span className="text-[10px] font-medium">{t.label}</span>
                                {t.count ? <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] px-1 rounded-full">{t.count}</span> : null}
                            </div>
                        </Link>
                    ))}
                    <button
                        onClick={signOut}
                        className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg touch-target text-red-500"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="text-xs font-medium">Logout</span>
                    </button>
                </div>
            </nav >
        </div >
    );
}
