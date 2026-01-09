import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import { MapPin, Store, Heart, Star, Package, Search, MessageCircle, ShoppingCart, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { NavBar } from "@/components/navbar";
import { AppLink as Link } from "@/components/app-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart-context";

interface ShopProfile {
    id: number;
    username: string;
    shop_location: string | null;
    shop_type: string | null;
    bio: string | null;
    avatar_url: string | null;
    created_at: string;
}

interface Product {
    id: number;
    name: string;
    price: number;
    original_price: number | null;
    image_url: string | null;
    images: string[] | null;
    eco_rating: number | null;
    sold_count: number;
}

export default function ShopProfile() {
    const { id } = useParams<{ id: string }>();
    const [shop, setShop] = useState<ShopProfile | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<'products' | 'about'>('products');
    const { addToCart } = useCart();
    const [addingProduct, setAddingProduct] = useState<number | null>(null);

    useEffect(() => {
        if (id) fetchShopProfile();
    }, [id]);

    const fetchShopProfile = async () => {
        setLoading(true);
        console.log("Fetching shop with ID:", id);

        // Try to fetch by ID (number or string)
        const { data: shopData, error: shopError } = await supabase
            .from("users")
            .select("id, username, shop_location, shop_type, bio, avatar_url, created_at")
            .eq("id", parseInt(id!) || id)
            .single();

        console.log("Shop query result:", { shopData, shopError });

        if (shopError) {
            console.error("Error fetching shop:", shopError);
            setLoading(false);
            return;
        }

        setShop(shopData);

        // Fetch products
        const { data: productData } = await supabase
            .from("products")
            .select("id, name, price, original_price, image_url, images, eco_rating, sold_count")
            .eq("seller_id", shopData.id)
            .eq("status", "approved");

        if (productData) setProducts(productData);
        setLoading(false);
    };

    const handleAddToCart = async (productId: number) => {
        setAddingProduct(productId);
        await addToCart(productId);
        setTimeout(() => setAddingProduct(null), 500);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getShopTypeBadge = (type: string) => {
        if (type.toLowerCase().includes('overseas')) return { color: 'bg-blue-500', icon: '🌍' };
        if (type.toLowerCase().includes('popup')) return { color: 'bg-orange-500', icon: '⚡' };
        if (type.toLowerCase().includes('permanent')) return { color: 'bg-emerald-500', icon: '🏪' };
        return { color: 'bg-purple-500', icon: '✨' };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <NavBar />
                <div className="flex justify-center items-center h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="min-h-screen bg-background">
                <NavBar />
                <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                    <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Shop Not Found</h1>
                    <p className="text-muted-foreground mb-6">This shop does not exist or has been removed.</p>
                    <Link href="/shop"><Button>Back to Marketplace</Button></Link>
                </div>
            </div>
        );
    }

    const shopBadge = shop.shop_type ? getShopTypeBadge(shop.shop_type) : null;

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar />

            {/* Shop Header - Daraz Style */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        {/* Shop Avatar */}
                        <div className="h-16 w-16 rounded-full border-2 border-primary/20 bg-emerald-100 flex items-center justify-center overflow-hidden shrink-0">
                            {shop.avatar_url ? (
                                <img src={shop.avatar_url} alt={shop.shop_name || shop.username} className="w-full h-full object-cover" />
                            ) : (
                                <Store className="h-8 w-8 text-primary" />
                            )}
                        </div>

                        {/* Shop Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl font-bold truncate">{shop.shop_name || shop.username}</h1>
                                {shopBadge && (
                                    <span className={`${shopBadge.color} text-white px-2 py-0.5 rounded text-xs font-medium`}>
                                        {shopBadge.icon} {shop.shop_type}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span>{products.length} Products</span>
                                {shop.shop_location && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" /> {shop.shop_location}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                            <Button variant="outline" size="sm" className="gap-1">
                                <MessageCircle className="h-4 w-4" /> Chat
                            </Button>
                            <Button size="sm" className="gap-1 bg-primary">
                                <Heart className="h-4 w-4" /> Follow
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs + Search */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between">
                        <div className="flex">
                            <button
                                onClick={() => setActiveTab('products')}
                                className={`px-6 py-3 text-sm font-medium border-b-2 transition ${activeTab === 'products'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Products
                            </button>
                            <button
                                onClick={() => setActiveTab('about')}
                                className={`px-6 py-3 text-sm font-medium border-b-2 transition ${activeTab === 'about'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                About
                            </button>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search in Store"
                                className="pl-9 h-9"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {activeTab === 'products' && (
                    <>
                        <h2 className="text-lg font-semibold mb-4">All Products ({filteredProducts.length})</h2>

                        {filteredProducts.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-lg border">
                                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                                <p className="text-muted-foreground">
                                    {searchQuery ? "No products match your search" : "This seller has no products yet"}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                {filteredProducts.map((product, i) => {
                                    const discount = product.original_price
                                        ? Math.round((1 - product.price / product.original_price) * 100)
                                        : 0;
                                    const displayImage = product.image_url || product.images?.[0];

                                    return (
                                        <motion.div
                                            key={product.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.02 }}
                                        >
                                            <Link href={`/shop/product/${product.id}`}>
                                                <div className="bg-white rounded-lg border hover:shadow-md transition overflow-hidden group">
                                                    {/* Image */}
                                                    <div className="aspect-square relative bg-gray-100">
                                                        {displayImage ? (
                                                            <img
                                                                src={displayImage}
                                                                alt={product.name}
                                                                loading="lazy"
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Package className="h-8 w-8 text-gray-300" />
                                                            </div>
                                                        )}
                                                        {discount > 0 && (
                                                            <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                                -{discount}%
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="p-2">
                                                        <h3 className="text-xs font-medium line-clamp-2 h-8 text-foreground">
                                                            {product.name}
                                                        </h3>
                                                        <div className="mt-1">
                                                            <span className="text-primary font-bold text-sm">৳{product.price}</span>
                                                            {product.original_price && (
                                                                <span className="text-muted-foreground text-[10px] line-through ml-1">
                                                                    ৳{product.original_price}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <div className="flex">
                                                                {[1, 2, 3, 4, 5].map(star => (
                                                                    <Star
                                                                        key={star}
                                                                        className={`h-2.5 w-2.5 ${star <= 4 ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <span className="text-[10px] text-muted-foreground">({product.sold_count || 0})</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'about' && (
                    <div className="bg-white rounded-lg border p-6 max-w-2xl">
                        <h2 className="text-lg font-semibold mb-4">About This Shop</h2>
                        <p className="text-muted-foreground mb-4">
                            {shop.bio || "This seller hasn't added a description yet."}
                        </p>
                        <div className="space-y-3 text-sm">
                            {shop.shop_location && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    <span>{shop.shop_location}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Store className="h-4 w-4 text-primary" />
                                <span>Member since {new Date(shop.created_at).getFullYear()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-primary" />
                                <span>{products.length} Products Listed</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
