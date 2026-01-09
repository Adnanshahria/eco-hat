import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, ArrowLeft, Truck, Check, Clock, X, ChevronDown, ChevronUp, AlertTriangle, Star, MapPin, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { AppLink as Link } from "@/components/app-link";

interface OrderItem {
    id: number;
    quantity: number;
    price_at_purchase: number;
    item_status: string;
    denial_reason: string | null;
    product_id: number;
    product: {
        id: number;
        name: string;
        images: string[] | null;
    };
}

interface Order {
    id: number;
    order_number: string;
    total_amount: number;
    subtotal: number;
    delivery_charge: number;
    cod_charge: number;
    status: string;
    denial_reason: string | null;
    phone: string;
    payment_method: string;
    shipping_address: {
        fullName: string;
        division: string;
        district: string;
        address: string;
    };
    tracking_history: Array<{ status: string; timestamp: string; note: string }>;
    created_at: string;
    order_items: OrderItem[];
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: "Pending Approval", color: "bg-yellow-100 text-yellow-700", icon: Clock },
    confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700", icon: Check },
    denied: { label: "Denied", color: "bg-red-100 text-red-700", icon: X },
    processing: { label: "Processing", color: "bg-purple-100 text-purple-700", icon: Package },
    shipped: { label: "Shipped", color: "bg-indigo-100 text-indigo-700", icon: Truck },
    at_station: { label: "At Delivery Station", color: "bg-cyan-100 text-cyan-700", icon: MapPin },
    reached_destination: { label: "Ready for Delivery", color: "bg-teal-100 text-teal-700", icon: Target },
    delivered: { label: "Delivered", color: "bg-green-100 text-green-700", icon: Check },
    cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: X },
};

export default function CustomerOrders() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
    const [reviewModal, setReviewModal] = useState<{ orderId: number; item: OrderItem } | null>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [buyerId, setBuyerId] = useState<number | null>(null);

    useEffect(() => { fetchOrders(); }, [user]);

    const fetchOrders = async () => {
        if (!user?.email) return;
        const { data: profile } = await supabase.from("users").select("id").eq("email", user.email).single();
        if (!profile) return;
        setBuyerId(profile.id);

        const { data, error } = await supabase
            .from("orders")
            .select(`
                *,
                order_items!order_id (
                    id, quantity, price_at_purchase, item_status, denial_reason, product_id,
                    product:products!product_id (id, name, images)
                )
            `)
            .eq("buyer_id", profile.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Orders fetch error:", error);
        }
        if (data) setOrders(data as unknown as Order[]);
        setLoading(false);
    };

    const markDelivered = async (orderId: number) => {
        // Update order status
        const { data: orderData } = await supabase.from("orders").select("tracking_history").eq("id", orderId).single();
        const history = orderData?.tracking_history || [];
        history.push({ status: "delivered", timestamp: new Date().toISOString(), note: "✅ Package received by buyer" });
        await supabase.from("orders").update({ status: "delivered", tracking_history: history }).eq("id", orderId);

        // Update all order items
        await supabase.from("order_items").update({ item_status: "delivered" }).eq("order_id", orderId);

        // Update local state
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: "delivered" } : o));
    };

    const cancelOrder = async (orderId: number) => {
        if (!confirm("Are you sure you want to cancel this order?")) return;

        // Update order status to cancelled
        const { data: orderData } = await supabase.from("orders").select("tracking_history").eq("id", orderId).single();
        const history = orderData?.tracking_history || [];
        history.push({ status: "cancelled", timestamp: new Date().toISOString(), note: "❌ Order cancelled by customer" });
        await supabase.from("orders").update({ status: "cancelled", tracking_history: history }).eq("id", orderId);

        // Update all order items
        await supabase.from("order_items").update({ item_status: "cancelled" }).eq("order_id", orderId);

        // Update local state
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: "cancelled" } : o));
    };

    const submitReview = async () => {
        if (!reviewModal || !buyerId) return;
        setSubmittingReview(true);

        await supabase.from("reviews").insert({
            order_item_id: reviewModal.item.id,
            product_id: (reviewModal.item.product as any).id || null,
            buyer_id: buyerId,
            rating: reviewRating,
            comment: reviewComment
        });

        setSubmittingReview(false);
        setReviewModal(null);
        setReviewComment("");
        setReviewRating(5);
        alert("Thank you for your review! 🎉");
    };

    return (
        <div className="min-h-screen bg-background touch-manipulation">
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/shop"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
                        <h1 className="text-xl font-bold font-display">My Orders</h1>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-16">
                        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
                        <p className="text-muted-foreground mb-6">Start shopping to see your orders here!</p>
                        <Link href="/shop"><Button className="bg-primary">Start Shopping</Button></Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const status = statusConfig[order.status] || statusConfig.pending;
                            const isExpanded = expandedOrder === order.id;
                            const hasItemDenied = order.order_items.some(item => item.item_status === "denied");

                            return (
                                <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border overflow-hidden">
                                    {/* Order Header */}
                                    <div className="p-4 cursor-pointer flex items-center justify-between" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                                        <div className="flex items-center gap-4">
                                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${status.color}`}><status.icon className="h-5 w-5" /></div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold">#{order.order_number || order.id}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                                                    {hasItemDenied && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Partial Denial</span>}
                                                </div>
                                                <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-primary">৳{order.total_amount}</span>
                                            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="border-t px-4 py-4 bg-muted/30">
                                            {/* Denial Notice */}
                                            {(order.denial_reason || hasItemDenied) && (
                                                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                                                    <div className="flex items-start gap-2">
                                                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm font-medium text-red-800">Order Issue</p>
                                                            {order.denial_reason && <p className="text-sm text-red-700">{order.denial_reason}</p>}
                                                            {order.order_items.filter(i => i.item_status === "denied").map(item => (
                                                                <p key={item.id} className="text-sm text-red-700">• {item.product?.name}: {item.denial_reason || "Denied by seller"}</p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Items */}
                                            <div className="mb-4">
                                                <p className="text-sm font-medium mb-2">Items</p>
                                                <div className="space-y-2">
                                                    {order.order_items.map((item) => (
                                                        <div key={item.id} className="flex items-center gap-3 text-sm">
                                                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                                                {item.product?.images?.[0] ? <img src={item.product.images[0]} className="h-full w-full object-cover rounded" /> : <span className="text-lg">🌿</span>}
                                                            </div>
                                                            <span className="flex-1">{item.product?.name}</span>
                                                            {item.item_status === "denied" && <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">Denied</span>}
                                                            {item.item_status === "confirmed" && <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">Confirmed</span>}
                                                            <span className="text-muted-foreground">×{item.quantity}</span>
                                                            <span className="font-medium">৳{item.price_at_purchase * item.quantity}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Price Breakdown */}
                                            <div className="mb-4 p-3 rounded-lg bg-muted/50 text-sm">
                                                <div className="flex justify-between mb-1"><span className="text-muted-foreground">Subtotal</span><span>৳{order.subtotal || (order.total_amount - (order.delivery_charge || 0) - (order.cod_charge || 0))}</span></div>
                                                <div className="flex justify-between mb-1"><span className="text-muted-foreground">Delivery</span><span>৳{order.delivery_charge || 60}</span></div>
                                                <div className="flex justify-between mb-1"><span className="text-muted-foreground">COD Charge</span><span>৳{order.cod_charge || 0}</span></div>
                                                <hr className="my-2" />
                                                <div className="flex justify-between font-bold"><span>Total</span><span className="text-primary">৳{order.total_amount}</span></div>
                                            </div>

                                            {/* Shipping */}
                                            <div className="mb-4">
                                                <p className="text-sm font-medium mb-1">Shipping to</p>
                                                <p className="text-sm text-muted-foreground">{order.shipping_address.fullName}, {order.shipping_address.address}, {order.shipping_address.district}, {order.shipping_address.division}</p>
                                                <p className="text-sm text-muted-foreground">{order.phone}</p>
                                            </div>

                                            {/* Tracking */}
                                            <div className="mb-4 flex gap-2">
                                                <Link href={`/track-order/${order.id}`}>
                                                    <Button variant="outline" className="gap-2">
                                                        <Truck className="h-4 w-4" />
                                                        Track Order
                                                    </Button>
                                                </Link>
                                                {order.status === "pending" && (
                                                    <Button variant="destructive" className="gap-2" onClick={() => cancelOrder(order.id)}>
                                                        <X className="h-4 w-4" />
                                                        Cancel Order
                                                    </Button>
                                                )}
                                                {order.status === "reached_destination" && (
                                                    <Button className="bg-green-600 hover:bg-green-700 gap-2" onClick={() => markDelivered(order.id)}>
                                                        <Check className="h-4 w-4" />
                                                        Mark as Delivered
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Review Items (after delivery) */}
                                            {order.status === "delivered" && (
                                                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                                    <p className="text-sm font-medium text-green-800 mb-2">✨ Order Delivered! Rate your items:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {order.order_items.map((item) => (
                                                            <Button key={item.id} size="sm" variant="outline" className="gap-1" onClick={() => setReviewModal({ orderId: order.id, item })}>
                                                                <Star className="h-3 w-3" /> Review {item.product?.name?.slice(0, 15)}...
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {order.tracking_history && order.tracking_history.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-medium mb-2">Tracking History</p>
                                                    <div className="space-y-2">
                                                        {order.tracking_history.map((track, i) => (
                                                            <div key={i} className="flex items-start gap-2 text-sm">
                                                                <div className={`h-2 w-2 rounded-full mt-1.5 ${track.status === "denied" ? "bg-red-500" : "bg-primary"}`} />
                                                                <div>
                                                                    <p className="font-medium capitalize">{track.status.replace(/_/g, " ")}</p>
                                                                    {track.note && <p className="text-xs text-muted-foreground">{track.note}</p>}
                                                                    <p className="text-xs text-muted-foreground">{new Date(track.timestamp).toLocaleString()}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {reviewModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-xl p-6 max-w-md w-full shadow-xl">
                        <h3 className="text-lg font-bold mb-4">Rate Your Purchase</h3>
                        <p className="text-sm text-muted-foreground mb-4">{reviewModal.item.product?.name}</p>

                        {/* Star Rating */}
                        <div className="flex gap-1 mb-4">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} onClick={() => setReviewRating(star)} className={`text-2xl ${star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                    ★
                                </button>
                            ))}
                        </div>

                        <Textarea
                            placeholder="Write your review (optional)..."
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            className="mb-4"
                        />

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setReviewModal(null)} className="flex-1">Cancel</Button>
                            <Button onClick={submitReview} disabled={submittingReview} className="flex-1 bg-primary">
                                {submittingReview ? "Submitting..." : "Submit Review"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
