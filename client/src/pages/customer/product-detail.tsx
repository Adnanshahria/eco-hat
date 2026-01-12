import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Star, Leaf, ShoppingCart, ShoppingBag, Truck, Shield, Package, Minus, Plus, Loader2, MapPin, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLink as Link } from "@/components/app-link";
import { useParams } from "wouter";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/lib/cart-context";
import { NavBar } from "@/components/navbar";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";

interface Review {
    id: number;
    rating: number;
    comment: string;
    created_at: string;
    user: { username: string; avatar_url: string | null } | null;
}

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    original_price: number | null;
    stock: number;
    images: string[] | null;
    image_url: string | null;
    tags: string[] | null;
    is_eco_friendly: boolean;
    eco_rating: number | null;
    sold_count: number;
    seller_id: number;
    seller: { username: string; shop_name: string; shop_location: string | null; shop_type: string | null } | null;
    category: { name: string } | null;
}

export default function ProductDetail() {
    const { id } = useParams<{ id: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [adding, setAdding] = useState(false);
    const { addToCart } = useCart();
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (id) {
            fetchProduct();
            fetchReviews();
        }
    }, [id]);

    const fetchProduct = async () => {
        setLoading(true);
        console.log("Fetching product with ID:", id);

        // Fetch product first
        const { data: productData, error } = await supabase
            .from("products")
            .select("*")
            .eq("id", parseInt(id!))
            .eq("status", "approved")
            .single();

        console.log("Product query result:", { productData, error });

        if (error) {
            console.error("Error fetching product:", error);
            setLoading(false);
            return;
        }

        if (productData) {
            console.log("Product data:", productData);
            console.log("Product seller_id:", productData.seller_id);

            // Fetch seller info separately
            let sellerInfo = null;
            if (productData.seller_id) {
                const { data: sellerData, error: sellerError } = await supabase
                    .from("users")
                    .select("id, username, shop_location, shop_type")
                    .eq("id", productData.seller_id)
                    .single();
                console.log("Seller fetch result:", { sellerData, sellerError });
                if (sellerData) {
                    sellerInfo = { ...sellerData, shop_name: sellerData.username };
                }
            }

            // Fetch category separately  
            let categoryInfo = null;
            if (productData.category_id) {
                const { data: categoryData } = await supabase
                    .from("categories")
                    .select("name")
                    .eq("id", productData.category_id)
                    .single();
                if (categoryData) categoryInfo = categoryData;
            }

            setProduct({ ...productData, seller: sellerInfo, category: categoryInfo });
        }

        setLoading(false);
    };

    const fetchReviews = async () => {
        // Fetch reviews without join to avoid 400 error
        const { data: reviewsData } = await supabase
            .from("reviews")
            .select("*")
            .eq("product_id", id)
            .order("created_at", { ascending: false });

        if (reviewsData && reviewsData.length > 0) {
            // Fetch user data for each review
            const userIds = [...new Set(reviewsData.map(r => r.buyer_id).filter(Boolean))];
            const { data: usersData } = await supabase
                .from("users")
                .select("id, username, avatar_url")
                .in("id", userIds);

            // Map users to reviews
            const reviewsWithUsers = reviewsData.map(review => ({
                ...review,
                user: usersData?.find(u => u.id === review.buyer_id) || null
            }));

            setReviews(reviewsWithUsers);
        } else {
            setReviews([]);
        }
    };

    const handleAddToCart = async () => {
        if (!user) {
            toast({
                title: "Login Required",
                description: "You must be logged in to add items to your cart.",
                variant: "destructive",
            });
            return;
        }

        if (!product) return;
        setAdding(true);

        try {
            await addToCart(product.id, quantity);
            toast({
                title: "Added to Cart",
                description: `${quantity} x ${product.name} added successfully.`,
                className: "bg-green-600 text-white border-green-600",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to add item to cart. Please try again.",
                variant: "destructive",
            });
        } finally {
            setAdding(false);
        }
    };

    const averageRating = reviews.length > 0
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        : 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-grass-pattern">
                <NavBar />
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-grass-pattern">
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

    const displayImage = product.image_url || product.images?.[0];

    return (
        <div className="min-h-screen bg-grass-pattern">
            <NavBar />

            <main className="max-w-6xl mx-auto px-4 py-4">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-4 text-xs">
                    <Link href="/shop" className="text-muted-foreground hover:text-primary">Shop</Link>
                    <span className="text-muted-foreground">/</span>
                    {product.category && (
                        <>
                            <span className="text-muted-foreground">{product.category.name}</span>
                            <span className="text-muted-foreground">/</span>
                        </>
                    )}
                    <span className="font-medium truncate max-w-[200px]">{product.name}</span>
                </div>

                <div className="grid lg:grid-cols-[400px_1fr] gap-6">
                    {/* Product Image Section */}
                    <div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="relative aspect-square bg-white rounded-2xl overflow-hidden border shadow-md"
                        >
                            {displayImage ? (
                                <img
                                    src={displayImage}
                                    alt={product.name}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover transition-opacity duration-300"
                                    style={{ contentVisibility: 'auto' }}
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-50">
                                    <Leaf className="h-20 w-20 text-emerald-200 mb-4" />
                                    <p className="text-muted-foreground font-medium">No Image Available</p>
                                </div>
                            )}

                            {/* Badges */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600/90 backdrop-blur-sm text-white text-sm font-semibold shadow-sm">
                                    <Leaf className="h-3.5 w-3.5" />
                                    {product.eco_rating || 80}% Eco-Friendly
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600/90 backdrop-blur-sm text-white text-xs font-semibold shadow-sm">
                                    <Shield className="h-3 w-3" />
                                    Admin Approved
                                </div>
                            </div>

                            {discount > 0 && (
                                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-red-500 text-white text-sm font-bold shadow-sm">
                                    -{discount}%
                                </div>
                            )}
                        </motion.div>

                        {/* Thumbnails (Placeholder for future) */}
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {product.images.map((img, i) => (
                                    <button key={i} className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 border-transparent focus:border-primary">
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col"
                    >
                        <h1 className="text-2xl font-bold leading-tight mb-2 text-foreground">
                            {product.name}
                        </h1>

                        {/* Rating & Stats row */}
                        <div className="flex flex-wrap items-center gap-3 mb-4 text-xs">
                            <div className="flex items-center gap-1">
                                <Star className={`h-5 w-5 ${averageRating > 0 ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                                <span className="font-semibold text-base">{averageRating.toFixed(1)}</span>
                                <span className="text-muted-foreground ml-1">({reviews.length} reviews)</span>
                            </div>
                            <div className="w-px h-4 bg-border"></div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <ShoppingBag className="h-4 w-4" />
                                {product.sold_count} sold
                            </div>
                            <div className="w-px h-4 bg-border"></div>
                            <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                                <Package className="h-4 w-4" />
                                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                            </div>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-3xl font-bold text-primary">৳{product.price}</span>
                            {product.original_price && (
                                <div className="flex flex-col">
                                    <span className="text-xl text-muted-foreground line-through">৳{product.original_price}</span>
                                    <span className="text-xs font-semibold text-red-500">Save ৳{product.original_price - product.price}</span>
                                </div>
                            )}
                        </div>

                        {/* Seller Card - LINKED */}
                        {product.seller && (
                            <Link href={`/shops/${product.seller_id}`}>
                                <div className="group flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors mb-4 cursor-pointer border border-transparent hover:border-primary/20">
                                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm border">
                                        <Store className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Sold by</p>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-lg leading-none group-hover:text-primary transition-colors">
                                                {product.seller.shop_name || product.seller.username}
                                            </p>
                                            {product.seller.shop_type && (
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${product.seller.shop_type.toLowerCase().includes('overseas')
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : product.seller.shop_type.toLowerCase().includes('popup')
                                                        ? 'bg-orange-100 text-orange-700'
                                                        : product.seller.shop_type.toLowerCase().includes('permanent')
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                    {product.seller.shop_type}
                                                </span>
                                            )}
                                        </div>
                                        {product.seller.shop_location && (
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                                <MapPin className="h-3 w-3" />
                                                {product.seller.shop_location}
                                            </div>
                                        )}
                                    </div>
                                    <Button variant="ghost" size="sm" className="hidden sm:flex group-hover:bg-primary group-hover:text-primary-foreground">
                                        Visit Shop
                                    </Button>
                                </div>
                            </Link>
                        )}

                        {/* Description */}
                        <div className="mb-4">
                            <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                                <Leaf className="h-3.5 w-3.5 text-primary" />
                                Description
                            </h3>
                            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-4">
                                {product.description}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-auto">
                            <div className="flex items-center border border-muted rounded-lg overflow-hidden bg-white">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    disabled={quantity <= 1}
                                    className="h-9 w-9 rounded-none hover:bg-muted"
                                >
                                    <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center font-semibold text-sm">{quantity}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                    disabled={quantity >= product.stock}
                                    className="h-9 w-9 rounded-none hover:bg-muted"
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>

                            <Button
                                className="h-9 px-6 text-sm font-semibold"
                                onClick={handleAddToCart}
                                disabled={adding || product.stock === 0}
                            >
                                {adding ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                                ) : (
                                    <ShoppingCart className="h-4 w-4 mr-1.5" />
                                )}
                                {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                            </Button>
                        </div>

                        {/* Guarantee Features */}
                        <div className="grid grid-cols-3 gap-2 mt-8 pt-8 border-t border-dashed">
                            <div className="flex flex-col items-center justify-center text-center p-2">
                                <Truck className="h-6 w-6 text-primary mb-2 opacity-80" />
                                <span className="text-xs font-semibold text-muted-foreground">Fast Delivery</span>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center p-2 border-l border-r border-dashed">
                                <Shield className="h-6 w-6 text-primary mb-2 opacity-80" />
                                <span className="text-xs font-semibold text-muted-foreground">Buyer Protection</span>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center p-2">
                                <Leaf className="h-6 w-6 text-primary mb-2 opacity-80" />
                                <span className="text-xs font-semibold text-muted-foreground">Certified Eco</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Reviews Section */}
                <div className="mt-20 border-t pt-10">
                    <h2 className="font-display text-2xl font-bold mb-8">Customer Reviews</h2>

                    {reviews.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {reviews.map((review) => (
                                <div key={review.id} className="bg-muted/20 p-6 rounded-2xl border border-border/50">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden">
                                                {review.user?.avatar_url ? (
                                                    <img src={review.user.avatar_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    review.user?.username?.[0]?.toUpperCase() || "U"
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">{review.user?.username || "Anonymous"}</p>
                                                <p className="text-xs text-muted-foreground">Verified Buyer</p>
                                            </div>
                                        </div>
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-4 w-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted/30'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-foreground/80 leading-relaxed text-sm">
                                        "{review.comment}"
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-4">
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed">
                            <Star className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground font-medium">No reviews yet.</p>
                            <p className="text-sm text-muted-foreground">Be the first to review this product!</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
