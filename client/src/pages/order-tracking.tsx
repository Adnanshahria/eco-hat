import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter"; // Fixed import
import { motion } from "framer-motion";
import { Search, Package, MapPin, CheckCircle, Clock, ArrowRight, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { NavBar } from "@/components/navbar";

const steps = [
    { key: "pending", label: "Order Placed", icon: Clock },
    { key: "confirmed", label: "Confirmed", icon: CheckCircle },
    { key: "processing", label: "Processing", icon: Package },
    { key: "shipped", label: "Shipped", icon: Truck },
    { key: "at_station", label: "At Station", icon: MapPin },
    { key: "reached_destination", label: "Near You", icon: CheckCircle },
    { key: "delivered", label: "Delivered", icon: CheckCircle },
];

export default function OrderTracking() {
    const [, params] = useRoute("/track-order/:id");
    const [location, setLocation] = useLocation();
    const [searchId, setSearchId] = useState("");
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Initialize searchId from URL params if present
    useEffect(() => {
        if (params?.id) {
            setSearchId(params.id);
            handleTrack(params.id);
        }
    }, [params?.id]);

    const handleTrack = async (id: string) => {
        if (!id) return;
        setLoading(true);
        setOrder(null);

        try {
            // Try fetching by ID first (numeric)
            let query = supabase
                .from("orders")
                .select(`
                    *,
                    order_items (
                        id, quantity, item_status,
                        product:products (name, images)
                    )
                `);

            // Check if input is numeric (ID) or string (Order Number)
            if (!isNaN(Number(id))) {
                query = query.eq("id", id);
            } else {
                query = query.eq("order_number", id);
            }

            const { data, error } = await query.single();

            if (error) throw error;
            if (data) {
                setOrder(data);
                // Update URL without reloading if searching manually
                if (!params?.id) {
                    // setLocation(`/track-order/${id}`); // Optional: update URL
                }
            }
        } catch (error) {
            console.error("Error fetching order:", error);
            toast({
                title: "Order not found",
                description: "Could not find an order with that ID.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleTrack(searchId);
    };

    const getCurrentStepIndex = (status: string) => {
        const orderStatus = status.toLowerCase();
        // Handle variations or mapping
        if (orderStatus === 'out_for_delivery') return 3; // Same as shipped step? Or add new step?
        const index = steps.findIndex(s => s.key === orderStatus);
        return index === -1 ? 0 : index;
    };

    return (
        <div className="min-h-screen bg-grass-pattern pb-20">
            {/* Navbar */}
            <NavBar />

            {/* Hero Section */}
            <div className="frosted-glass rounded-2xl mx-4 my-8 py-16 px-4">
                <div className="max-w-2xl mx-auto text-center space-y-6">
                    <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground">
                        Track Your Order
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Enter your Order ID to see real-time updates on your delivery.
                    </p>

                    <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto relative">
                        <Input
                            placeholder="Order ID (e.g. 123)"
                            className="h-12 pl-12 bg-background border-primary/20 focus:border-primary text-lg"
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                        />
                        <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                        <Button type="submit" size="lg" className="h-12 px-8" disabled={loading}>
                            {loading ? "Tracking..." : "Track"}
                        </Button>
                    </form>
                </div>
            </div>

            {/* Results Section */}
            {order && (
                <div className="max-w-3xl mx-auto px-4 mt-12 frosted-glass rounded-2xl p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-2xl font-bold">Order #{order.order_number || order.id}</h2>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider
                                    ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'}`}>
                                    {order.status.replace('_', ' ')}
                                </span>
                            </div>
                            <p className="text-muted-foreground">
                                Placed on {new Date(order.created_at).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total Amount</p>
                            <p className="text-xl font-bold text-primary">৳{order.total_amount}</p>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="relative mb-12 py-8">
                        {/* Progress Bar Background */}
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 rounded-full hidden md:block" />

                        {/* Active Progress Bar */}
                        <motion.div
                            className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full hidden md:block"
                            initial={{ width: "0%" }}
                            animate={{ width: `${(getCurrentStepIndex(order.status) / (steps.length - 1)) * 100}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        />

                        {/* Steps */}
                        <div className="relative flex flex-col md:flex-row justify-between gap-8 md:gap-0">
                            {steps.map((step, index) => {
                                const currentIndex = getCurrentStepIndex(order.status);
                                const isCompleted = index <= currentIndex;
                                const isCurrent = index === currentIndex;

                                return (
                                    <div key={step.key} className="flex md:flex-col items-center gap-4 md:gap-2 relative z-10 group">
                                        <div className={`
                                            h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center border-4 transition-all duration-300
                                            ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-muted text-muted-foreground'}
                                            ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}
                                        `}>
                                            <step.icon className="h-5 w-5 md:h-6 md:w-6" />
                                        </div>
                                        <div className="md:text-center md:absolute md:top-14 md:w-32 md:-left-10">
                                            <p className={`font-medium text-sm md:text-base ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                                            {isCurrent && <p className="text-xs text-primary font-medium animate-pulse hidden md:block">In Progress</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Detailed History */}
                    {order.tracking_history && order.tracking_history.length > 0 && (
                        <div className="bg-muted/30 rounded-xl p-6 border mb-8">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <Clock className="h-4 w-4" /> Tracking History
                            </h3>
                            <div className="space-y-6 relative border-l-2 border-muted ml-2 pl-6">
                                {order.tracking_history.map((event: any, i: number) => (
                                    <div key={i} className="relative">
                                        <div className="absolute -left-[29px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                                        <p className="font-medium text-sm">{event.status.replace(/_/g, " ")}</p>
                                        <p className="text-xs text-muted-foreground mb-1">
                                            {new Date(event.timestamp).toLocaleString()}
                                        </p>
                                        {event.note && <p className="text-sm text-foreground/80 bg-background p-2 rounded border inline-block mt-1">{event.note}</p>}
                                    </div>
                                )).reverse()}
                            </div>
                        </div>
                    )}

                    {/* Order Items Summary */}
                    <div>
                        <h3 className="font-semibold mb-4">Order Items</h3>
                        <div className="space-y-3">
                            {order.order_items.map((item: any) => (
                                <div key={item.id} className="flex gap-4 p-3 rounded-lg border bg-background/50">
                                    <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {item.product?.images?.[0] ?
                                            <img src={item.product.images[0]} alt={item.product.name} className="h-full w-full object-cover" />
                                            : <Package className="h-6 w-6 text-muted-foreground" />
                                        }
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium line-clamp-1">{item.product?.name || "Unknown Product"}</p>
                                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                                        <div className="mt-1">
                                            {item.item_status !== 'pending' && item.item_status !== 'processing' && (
                                                <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                                                    {item.item_status}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
