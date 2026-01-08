import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { Link } from "wouter";

export default function Cart() {
    const { items, loading, removeFromCart, updateQuantity, total, itemCount } = useCart();

    const deliveryCharge = total >= 500 ? 0 : 60;
    const grandTotal = total + deliveryCharge;

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-muted-foreground">Loading cart...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
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
                    <div className="grid lg:grid-cols-3 gap-8">
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
                            <div className="bg-card rounded-xl border border-card-border p-6 sticky top-24">
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

                                <Link href="/shop/checkout">
                                    <Button className="w-full mt-6 bg-primary hover:bg-primary/90 gap-2">
                                        Proceed to Checkout
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>

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
