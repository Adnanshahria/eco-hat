import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, MapPin, CreditCard, Truck, Check, Info, Leaf, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { Link, useLocation } from "wouter";

const divisions = ["Dhaka", "Chittagong", "Rajshahi", "Khulna", "Barisal", "Sylhet", "Rangpur", "Mymensingh"];

interface SavedAddress {
    id: string;
    label: string;
    fullName: string;
    phone: string;
    division: string;
    district: string;
    address: string;
    isDefault: boolean;
}

export default function Checkout() {
    const { items, total, clearCart } = useCart();
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [form, setForm] = useState({
        fullName: "",
        phone: "",
        division: "Dhaka",
        district: "",
        address: "",
    });

    // Load saved addresses on mount
    useEffect(() => {
        const loadProfile = async () => {
            if (!user?.email) return;
            const { data: profile } = await supabase
                .from("users")
                .select("full_name, phone, saved_addresses")
                .eq("email", user.email)
                .single();

            if (profile) {
                const addresses = profile.saved_addresses || [];
                setSavedAddresses(addresses);

                // Auto-select default address or first
                const defaultAddr = addresses.find((a: SavedAddress) => a.isDefault) || addresses[0];
                if (defaultAddr) {
                    setSelectedAddressId(defaultAddr.id);
                    setForm({
                        fullName: defaultAddr.fullName,
                        phone: defaultAddr.phone,
                        division: defaultAddr.division,
                        district: defaultAddr.district,
                        address: defaultAddr.address,
                    });
                } else if (profile.full_name || profile.phone) {
                    setForm(prev => ({
                        ...prev,
                        fullName: profile.full_name || "",
                        phone: profile.phone || "",
                    }));
                }
            }
        };
        loadProfile();
    }, [user]);

    // Pricing
    const deliveryCharge = form.division === "Dhaka" ? 60 : 120;
    const subtotalWithDelivery = total + deliveryCharge;
    const codCharge = Math.ceil(subtotalWithDelivery * 0.01);
    const grandTotal = subtotalWithDelivery + codCharge;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setSelectedAddressId(null);
    };

    const selectAddress = (addr: SavedAddress) => {
        setSelectedAddressId(addr.id);
        setForm({
            fullName: addr.fullName,
            phone: addr.phone,
            division: addr.division,
            district: addr.district,
            address: addr.address,
        });
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { data: profile } = await supabase.from("users").select("id, email").eq("email", user?.email).single();
            if (!profile) throw new Error("User not found");

            const today = new Date();
            const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
            const { count } = await supabase.from("orders").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString().slice(0, 10));
            const sequence = String((count || 0) + 1).padStart(3, "0");
            const orderNumber = `EH-${dateStr}-${sequence}`;

            const { data: order, error: orderError } = await supabase
                .from("orders")
                .insert({
                    order_number: orderNumber,
                    buyer_id: profile.id,
                    total_amount: grandTotal,
                    subtotal: total,
                    delivery_charge: deliveryCharge,
                    cod_charge: codCharge,
                    phone: form.phone,
                    payment_method: "cod",
                    shipping_address: {
                        fullName: form.fullName,
                        division: form.division,
                        district: form.district,
                        address: form.address,
                        email: profile.email,
                    },
                    tracking_history: [{ status: "pending", timestamp: new Date().toISOString(), note: "Order placed. Waiting for seller confirmation." }],
                })
                .select()
                .single();

            if (orderError) throw orderError;

            const orderItems = items.map((item) => ({
                order_id: order.id,
                product_id: item.product_id,
                seller_id: item.product.seller_id,
                quantity: item.quantity,
                price_at_purchase: item.product.price,
                seller_earning: item.product.price * item.quantity,
            }));

            await supabase.from("order_items").insert(orderItems);
            await clearCart();
            setLocation(`/shop/order-confirmation/${order.id}`);
        } catch (err) {
            console.error("Checkout error:", err);
            alert("Failed to place order. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <Leaf className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                    <h2 className="text-xl font-semibold text-emerald-800 mb-2">Your cart is empty</h2>
                    <Link href="/shop"><Button className="bg-emerald-500 hover:bg-emerald-600">Go Shopping</Button></Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-emerald-100">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/shop/cart"><Button variant="ghost" size="icon" className="hover:bg-emerald-100"><ArrowLeft className="h-5 w-5 text-emerald-700" /></Button></Link>
                        <div className="flex items-center gap-2">
                            <Leaf className="h-5 w-5 text-emerald-600" />
                            <h1 className="text-xl font-bold text-emerald-800">Checkout</h1>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium ${step >= s ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-400"}`}>
                                {step > s ? <Check className="h-5 w-5" /> : s}
                            </div>
                            {s < 3 && <div className={`w-16 h-1 rounded ${step > s ? "bg-emerald-500" : "bg-emerald-100"}`} />}
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        {/* Step 1: Shipping */}
                        {step === 1 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-emerald-500" /> Shipping Information
                                </h2>

                                {/* Saved Addresses */}
                                {savedAddresses.length > 0 && (
                                    <div className="mb-6">
                                        <p className="text-sm text-emerald-700 mb-3">Your saved addresses:</p>
                                        <div className="grid gap-3">
                                            {savedAddresses.map(addr => (
                                                <div
                                                    key={addr.id}
                                                    onClick={() => selectAddress(addr)}
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition ${selectedAddressId === addr.id ? "border-emerald-500 bg-emerald-50" : "border-emerald-100 hover:border-emerald-300"}`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${selectedAddressId === addr.id ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-600"}`}>
                                                            <Home className="h-4 w-4" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-emerald-900">{addr.label}</span>
                                                                {addr.isDefault && <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">Default</span>}
                                                            </div>
                                                            <p className="text-sm text-gray-600">{addr.fullName} • {addr.phone}</p>
                                                            <p className="text-sm text-gray-500">{addr.address}, {addr.district}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-emerald-600 mt-3 text-center">— or enter a new address below —</p>
                                    </div>
                                )}

                                {/* Address Form */}
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="fullName" className="text-emerald-700">Full Name</Label>
                                        <Input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Recipient name" className="border-emerald-200 focus:border-emerald-400" />
                                    </div>
                                    <div>
                                        <Label htmlFor="phone" className="text-emerald-700">Phone Number</Label>
                                        <Input id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="01XXXXXXXXX" className="border-emerald-200 focus:border-emerald-400" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="division" className="text-emerald-700">Division</Label>
                                            <select id="division" name="division" value={form.division} onChange={handleChange} className="w-full h-10 px-3 rounded-lg border border-emerald-200 bg-white">
                                                {divisions.map((d) => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <Label htmlFor="district" className="text-emerald-700">District</Label>
                                            <Input id="district" name="district" value={form.district} onChange={handleChange} placeholder="District" className="border-emerald-200 focus:border-emerald-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="address" className="text-emerald-700">Full Address</Label>
                                        <textarea id="address" name="address" value={form.address} onChange={handleChange} placeholder="House, Road, Area" className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-emerald-200 bg-white resize-none focus:border-emerald-400" />
                                    </div>
                                </div>
                                <Button className="w-full mt-6 bg-emerald-500 hover:bg-emerald-600 gap-2" onClick={() => setStep(2)} disabled={!form.fullName || !form.phone || !form.district || !form.address}>
                                    Continue <ArrowRight className="h-4 w-4" />
                                </Button>
                            </motion.div>
                        )}

                        {/* Step 2: Payment */}
                        {step === 2 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-emerald-500" /> Payment Method
                                </h2>
                                <div className="space-y-3">
                                    <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50">
                                        <div className="flex items-center gap-3">
                                            <div className="h-5 w-5 rounded-full border-2 border-emerald-500 flex items-center justify-center"><div className="h-2.5 w-2.5 rounded-full bg-emerald-500" /></div>
                                            <div>
                                                <p className="font-medium text-emerald-800">Cash On Delivery</p>
                                                <p className="text-sm text-emerald-600">Pay when you receive (+1% COD charge)</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl border border-emerald-100 opacity-50">
                                        <div className="flex items-center gap-3">
                                            <div className="h-5 w-5 rounded-full border-2 border-emerald-200" />
                                            <div>
                                                <p className="font-medium text-gray-400">bKash / Nagad</p>
                                                <p className="text-xs text-gray-400">Coming soon</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <Button variant="outline" onClick={() => setStep(1)} className="border-emerald-200">Back</Button>
                                    <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 gap-2" onClick={() => setStep(3)}>Continue <ArrowRight className="h-4 w-4" /></Button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Review */}
                        {step === 3 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                                    <Truck className="h-5 w-5 text-emerald-500" /> Review Order
                                </h2>
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                                        <p className="text-sm text-emerald-600 mb-1">Shipping to</p>
                                        <p className="font-medium text-emerald-900">{form.fullName}</p>
                                        <p className="text-sm text-emerald-700">{form.phone}</p>
                                        <p className="text-sm text-emerald-700">{form.address}, {form.district}, {form.division}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                                        <p className="text-sm text-emerald-600 mb-1">Payment</p>
                                        <p className="font-medium text-emerald-900">Cash On Delivery</p>
                                    </div>
                                    <div className="border-t pt-4">
                                        <p className="text-sm text-emerald-600 mb-2">Items ({items.length})</p>
                                        {items.map((item) => (
                                            <div key={item.id} className="flex justify-between text-sm py-1">
                                                <span className="text-emerald-800">{item.product.name} × {item.quantity}</span>
                                                <span className="text-emerald-900 font-medium">৳{item.product.price * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex gap-2 text-sm">
                                        <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-amber-800">After placing your order, sellers will review and confirm. You'll be notified.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <Button variant="outline" onClick={() => setStep(2)} className="border-emerald-200">Back</Button>
                                    <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600" onClick={handleSubmit} disabled={loading}>
                                        {loading ? "Placing Order..." : `🌱 Place Order • ৳${grandTotal}`}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6 sticky top-24">
                            <h3 className="font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                                <Leaf className="h-4 w-4 text-emerald-500" /> Order Summary
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="text-emerald-800">৳{total}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Delivery ({form.division})</span>
                                    <span className="text-emerald-800">৳{deliveryCharge}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">COD Charge (1%)</span>
                                    <span className="text-emerald-800">৳{codCharge}</span>
                                </div>
                                <hr className="border-emerald-100" />
                                <div className="flex justify-between font-bold text-base">
                                    <span className="text-emerald-800">Total</span>
                                    <span className="text-emerald-600">৳{grandTotal}</span>
                                </div>
                            </div>
                            <div className="mt-4 p-3 rounded-xl bg-emerald-50 text-center">
                                <p className="text-xs text-emerald-600">🌿 Thank you for shopping eco-friendly!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
