import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Star, Leaf, ShoppingCart, Truck, Shield, Package, Minus, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLink as Link } from "@/components/app-link";
import { useParams } from "wouter";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/lib/cart-context";
import { NavBar } from "@/components/navbar";

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    original_price: number | null;
    stock: number;
    images: string[] | null;
    tags: string[] | null;
    is_eco_friendly: boolean;
    seller: { username: string; shop_name: string } | null;
    category: { name: string } | null;
}

export default function ProductDetail() {
    const { id } = useParams<{ id: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [adding, setAdding] = useState(false);
    const { addToCart } = useCart();

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        setLoading(true);
        const { data } = await supabase
            .from("products")
            .select(`
                *,
                seller:users!products_seller_id_fkey(username, shop_name),
                category:categories(name)
            `)
            .eq("id", id)
            .single();

        if (data) setProduct(data);
        setLoading(false);
    };

    const handleAddToCart = async () => {
        if (!product) return;
        setAdding(true);
        await addToCart(product.id, quantity);
        setAdding(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 to-white">
                <NavBar />
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 to-white">
                <NavBar />
                <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                    <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
                    <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist or has been removed.</p>
                    <Link href="/shop"><Button>Back to Shop</Button></Link>
                </div>
            </div>
        );
    }

    const discount = product.original_price
        ? Math.round((1 - product.price / product.original_price) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 to-white">
            <NavBar />

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-6 text-sm">
                    <Link href="/shop" className="text-muted-foreground hover:text-primary">Shop</Link>
                    <span className="text-muted-foreground">/</span>
                    {product.category && (
                        <>
                            <span className="text-muted-foreground">{product.category.name}</span>
                            <span className="text-muted-foreground">/</span>
                        </>
                    )}
                    <span className="font-medium">{product.name}</span>
                </div>

                <div className="grid lg:grid-cols-2 gap-10">
                    {/* Product Image */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative"
                    >
                        <div className="aspect-square bg-white rounded-3xl overflow-hidden border border-white/40 shadow-xl">
                            {product.images?.[0] ? (
                                <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-50">
                                    <span className="text-9xl">🌿</span>
                                </div>
                            )}
                        </div>

                        {/* Eco Badge */}
                        {product.is_eco_friendly && (
                            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-sm font-semibold">
                                <Leaf className="h-4 w-4" />
                                Eco-Friendly
                            </div>
                        )}

                        {/* Discount Badge */}
                        {discount > 0 && (
                            <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-red-500 text-white text-sm font-bold">
                                -{discount}% OFF
                            </div>
                        )}
                    </motion.div>

                    {/* Product Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col"
                    >
                        <h1 className="text-3xl font-bold font-display mb-4">{product.name}</h1>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <Star key={i} className={`h-5 w-5 ${i <= 4 ? 'fill-amber-400 text-amber-400' : 'fill-amber-200 text-amber-200'}`} />
                                ))}
                            </div>
                            <span className="text-muted-foreground">(4.8) • 128 reviews</span>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-3 mb-6">
                            <span className="text-4xl font-bold text-primary">৳{product.price}</span>
                            {product.original_price && (
                                <span className="text-xl text-muted-foreground line-through">৳{product.original_price}</span>
                            )}
                        </div>

                        {/* Description */}
                        <p className="text-muted-foreground mb-6 leading-relaxed">
                            {product.description || "A premium eco-friendly product sourced from sustainable materials. Perfect for conscious consumers who care about the environment."}
                        </p>

                        {/* Tags */}
                        {product.tags && product.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                                {product.tags.map(tag => (
                                    <span key={tag} className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Seller Info */}
                        {product.seller && (
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 mb-6">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-lg">🏪</span>
                                </div>
                                <div>
                                    <p className="font-medium">{product.seller.shop_name || product.seller.username}</p>
                                    <p className="text-sm text-muted-foreground">Verified Seller</p>
                                </div>
                            </div>
                        )}

                        {/* Quantity & Add to Cart */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center border rounded-xl overflow-hidden">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    disabled={quantity <= 1}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-12 text-center font-semibold">{quantity}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                    disabled={quantity >= product.stock}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                            </span>
                        </div>

                        <div className="flex gap-3 mb-8">
                            <Button
                                className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-primary to-emerald-600"
                                onClick={handleAddToCart}
                                disabled={adding || product.stock === 0}
                            >
                                {adding ? (
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                ) : (
                                    <ShoppingCart className="h-5 w-5 mr-2" />
                                )}
                                Add to Cart
                            </Button>
                            <Button variant="outline" size="icon" className="h-14 w-14">
                                <Heart className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-3 gap-4 pt-6 border-t">
                            <div className="text-center">
                                <Truck className="h-6 w-6 mx-auto mb-2 text-primary" />
                                <p className="text-sm font-medium">Free Delivery</p>
                                <p className="text-xs text-muted-foreground">Orders over ৳500</p>
                            </div>
                            <div className="text-center">
                                <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
                                <p className="text-sm font-medium">Secure Payment</p>
                                <p className="text-xs text-muted-foreground">100% Protected</p>
                            </div>
                            <div className="text-center">
                                <Leaf className="h-6 w-6 mx-auto mb-2 text-primary" />
                                <p className="text-sm font-medium">Eco Certified</p>
                                <p className="text-xs text-muted-foreground">Verified Green</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
