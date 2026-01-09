import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, ArrowLeft, Truck, Check, Clock, X, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { AppLink as Link } from "@/components/app-link";

interface OrderItem {
    id: number;
    quantity: number;
    price_at_purchase: number;
    item_status: string;
    denial_reason: string | null;
    product: {
        name: string;
        images: string[] | null;
    };
}

interface Order {
    id: number;
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
    out_for_delivery: { label: "Out for Delivery", color: "bg-cyan-100 text-cyan-700", icon: Truck },
    delivered: { label: "Delivered", color: "bg-green-100 text-green-700", icon: Check },
    cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: X },
};

export default function CustomerOrders() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

    useEffect(() => { fetchOrders(); }, [user]);

    const fetchOrders = async () => {
        if (!user?.email) return;
        const { data: profile } = await supabase.from("users").select("id").eq("email", user.email).single();
        if (!profile) return;

        const { data } = await supabase
            .from("orders")
            .select(`
        *,
        order_items (
          id, quantity, price_at_purchase, item_status, denial_reason,
          product:products (name, images)
        )
      `)
            .eq("buyer_id", profile.id)
            .order("created_at", { ascending: false });

        if (data) setOrders(data as unknown as Order[]);
        setLoading(false);
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
                                                    <span className="font-mono font-bold">#{order.id}</span>
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
                                            <div className="mb-4">
                                                <Link href={`/track-order/${order.id}`}>
                                                    <Button variant="outline" className="w-full gap-2">
                                                        <Truck className="h-4 w-4" />
                                                        Track Order Status
                                                    </Button>
                                                </Link>
                                            </div>

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
        </div>
    );
}
