import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/components/auth-provider";
import { AppLink as Link } from "@/components/app-link";

export default function Cart() {
    const { items, loading, removeFromCart, updateQuantity, total, itemCount } = useCart();
    const { userRole } = useAuth();
    const [showRestrictionPopup, setShowRestrictionPopup] = useState(false);

    const deliveryCharge = total >= 500 ? 0 : 60;
    const grandTotal = total + deliveryCharge;

    // Check if user can checkout (only buyers can checkout)
    const isRestrictedRole = userRole && ['seller', 'uv-seller', 'admin'].includes(userRole.toLowerCase());

    const handleCheckout = () => {
        if (isRestrictedRole) {
            setShowRestrictionPopup(true);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-grass-pattern flex items-center justify-center">
                <p className="text-muted-foreground">Loading cart...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-grass-pattern">
            {/* Restriction Popup */}
            {showRestrictionPopup && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card rounded-xl p-6 w-full max-w-md shadow-2xl border"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Cannot Place Order</h3>
                                <p className="text-sm text-muted-foreground">Account restriction</p>
                            </div>
                        </div>
                        <p className="text-muted-foreground mb-6">
                            You can't order from a <strong className="text-foreground">{userRole}</strong> account.
                            Please create a normal buyer account to purchase products.
                        </p>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setShowRestrictionPopup(false)}>
                                Close
                            </Button>
                            <Link href="/auth" className="flex-1">
                                <Button className="w-full bg-primary">Create Buyer Account</Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/shop">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <h1 className="text-xl font-bold font-display">Your Cart</h1>
                        <span className="text-sm text-muted-foreground">({itemCount} items)</span>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {items.length === 0 ? (
                    <div className="text-center py-16">
                        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
                        <p className="text-muted-foreground mb-6">Add some eco-friendly products to get started!</p>
                        <Link href="/shop">
                            <Button className="bg-primary hover:bg-primary/90">
                                Continue Shopping
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {items.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-card rounded-xl border border-card-border p-4 flex gap-4"
                                >
                                    {/* Product Image */}
                                    <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                        {item.product.images?.[0] ? (
                                            <img src={item.product.images[0]} alt={item.product.name} className="h-full w-full object-cover rounded-lg" />
                                        ) : (
                                            <span className="text-3xl">🌿</span>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium truncate">{item.product.name}</h3>
                                        <p className="text-lg font-bold text-primary">৳{item.product.price}</p>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                                disabled={item.quantity >= item.product.stock}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Subtotal & Remove */}
                                    <div className="flex flex-col items-end justify-between">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive"
                                            onClick={() => removeFromCart(item.product_id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <p className="text-sm font-semibold">৳{item.product.price * item.quantity}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-card rounded-xl border border-card-border p-4 lg:p-6 lg:sticky lg:top-24">
                                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span className="font-medium">৳{total}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Delivery</span>
                                        <span className="font-medium">
                                            {deliveryCharge === 0 ? (
                                                <span className="text-green-600">Free</span>
                                            ) : (
                                                `৳${deliveryCharge}`
                                            )}
                                        </span>
                                    </div>
                                    {deliveryCharge > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            Add ৳{500 - total} more for free delivery
                                        </p>
                                    )}
                                    <hr className="border-border" />
                                    <div className="flex justify-between text-base font-bold">
                                        <span>Total</span>
                                        <span className="text-primary">৳{grandTotal}</span>
                                    </div>
                                </div>

                                {/* Checkout Button - conditional based on role */}
                                {isRestrictedRole ? (
                                    <Button
                                        className="w-full mt-6 bg-primary hover:bg-primary/90 gap-2"
                                        onClick={handleCheckout}
                                    >
                                        Proceed to Checkout
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Link href="/shop/checkout">
                                        <Button className="w-full mt-6 bg-primary hover:bg-primary/90 gap-2">
                                            Proceed to Checkout
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                )}

                                <Link href="/shop">
                                    <Button variant="ghost" className="w-full mt-2">
                                        Continue Shopping
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

