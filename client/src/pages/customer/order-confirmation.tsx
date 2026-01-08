import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Package, Truck, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Link, useParams } from "wouter";

interface Order {
    id: number;
    total_amount: number;
    status: string;
    phone: string;
    shipping_address: {
        fullName: string;
        division: string;
        district: string;
        address: string;
    };
    created_at: string;
}

export default function OrderConfirmation() {
    const params = useParams<{ id: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            const { data } = await supabase
                .from("orders")
                .select("*")
                .eq("id", params.id)
                .single();

            if (data) setOrder(data);
            setLoading(false);
        };

        if (params.id) fetchOrder();
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2">Order not found</h2>
                    <Link href="/shop">
                        <Button className="bg-primary">Go Shopping</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
            <div className="max-w-lg mx-auto px-4 py-16">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="text-center mb-8"
                >
                    <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <Check className="h-10 w-10 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold font-display mb-2">Order Confirmed!</h1>
                    <p className="text-muted-foreground">
                        Thank you for shopping eco-friendly 🌿
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card rounded-xl border p-6 mb-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-muted-foreground">Order ID</span>
                        <span className="font-mono font-bold">#{order.id}</span>
                    </div>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Amount</span>
                            <span className="font-bold text-primary">৳{order.total_amount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Payment</span>
                            <span>Cash On Delivery</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Estimated Delivery</span>
                            <span>3-5 business days</span>
                        </div>
                    </div>

                    <hr className="my-4" />

                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Shipping to</p>
                        <p className="font-medium">{order.shipping_address.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                            {order.shipping_address.address}, {order.shipping_address.district}, {order.shipping_address.division}
                        </p>
                        <p className="text-sm text-muted-foreground">{order.phone}</p>
                    </div>
                </motion.div>

                {/* Order Status Timeline */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card rounded-xl border p-6 mb-6"
                >
                    <h3 className="font-semibold mb-4">Order Status</h3>
                    <div className="space-y-4">
                        {[
                            { status: "pending", label: "Order Placed", icon: Package, active: true },
                            { status: "confirmed", label: "Confirmed", icon: Check, active: false },
                            { status: "shipped", label: "Shipped", icon: Truck, active: false },
                            { status: "delivered", label: "Delivered", icon: Home, active: false },
                        ].map((step, index) => (
                            <div key={step.status} className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step.active ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                                    <step.icon className="h-4 w-4" />
                                </div>
                                <span className={step.active ? "font-medium" : "text-muted-foreground"}>{step.label}</span>
                                {step.active && <span className="text-xs text-primary ml-auto">Current</span>}
                            </div>
                        ))}
                    </div>
                </motion.div>

                <div className="flex flex-col gap-3">
                    <Link href="/shop/orders">
                        <Button variant="outline" className="w-full gap-2">
                            View All Orders
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href="/shop">
                        <Button className="w-full bg-primary hover:bg-primary/90">
                            Continue Shopping
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
