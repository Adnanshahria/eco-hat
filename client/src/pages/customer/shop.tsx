import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, ShoppingBag, Heart, Star, LogOut, Package, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-provider";
import { useCart } from "@/lib/cart-context";
import { supabase } from "@/lib/supabase";
import { AppLink as Link } from "@/components/app-link";
import { NavBar } from "@/components/navbar";

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    original_price: number | null;
    stock: number;
    images: string[] | null;
    category_id: number | null;
    seller_id: number;
}

interface Category {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
}

export default function CustomerShop() {
    const { user, signOut } = useAuth();
    const { addToCart, itemCount } = useCart();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [addingProduct, setAddingProduct] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data: categoriesData } = await supabase.from("categories").select("*");
        if (categoriesData) setCategories(categoriesData);

        const { data: productsData } = await supabase
            .from("products")
            .select("*")
            .order("created_at", { ascending: false });
        if (productsData) setProducts(productsData);
        setLoading(false);
    };

    const handleAddToCart = async (product: Product) => {
        setAddingProduct(product.id);
        await addToCart(product.id);
        setTimeout(() => setAddingProduct(null), 500);
    };

    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory ? product.category_id === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
            {/* Header */}
            <NavBar onSearch={setSearchQuery} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Banner - Glassmorphism */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-3xl p-8 mb-10"
                >
                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-emerald-200/30 to-teal-200/20"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>

                    {/* Decorative Elements */}
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
                    <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-emerald-300/20 rounded-full blur-2xl"></div>

                    <div className="relative flex items-center justify-between">
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-3xl font-bold font-display mb-2 text-foreground"
                            >
                                Welcome back! 🌿
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-muted-foreground text-lg"
                            >
                                Discover sustainable products for everyday life
                            </motion.p>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Link href="/shop/orders">
                                <Button variant="outline" className="gap-2 bg-white/60 backdrop-blur border-white/40 hover:bg-white/80 shadow-lg">
                                    <Package className="h-4 w-4" />
                                    My Orders
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Categories - Pill Style with Animation */}
                <section className="mb-10">
                    <h2 className="text-xl font-bold font-display mb-5">Shop by Category</h2>
                    <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedCategory(null)}
                            className={`px-6 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-300 shadow-sm ${selectedCategory === null
                                ? "bg-gradient-to-r from-primary to-emerald-600 text-white shadow-lg shadow-primary/25"
                                : "bg-white/70 backdrop-blur border border-white/40 hover:bg-white hover:shadow-md"
                                }`}
                        >
                            ✨ All Products
                        </motion.button>
                        {categories.map((category, index) => (
                            <motion.button
                                key={category.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedCategory(category.id)}
                                className={`px-6 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-300 shadow-sm ${selectedCategory === category.id
                                    ? "bg-gradient-to-r from-primary to-emerald-600 text-white shadow-lg shadow-primary/25"
                                    : "bg-white/70 backdrop-blur border border-white/40 hover:bg-white hover:shadow-md"
                                    }`}
                            >
                                {category.icon && <span className="mr-1">{category.icon}</span>}
                                {category.name}
                            </motion.button>
                        ))}
                    </div>
                </section>

                {/* Products Grid */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold font-display">
                            {selectedCategory ? categories.find((c) => c.id === selectedCategory)?.name : "All Products"}
                        </h2>
                        <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                            {filteredProducts.length} products
                        </span>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="rounded-2xl overflow-hidden">
                                    <div className="aspect-square animate-shimmer rounded-t-2xl"></div>
                                    <div className="p-4 bg-white/50">
                                        <div className="h-4 w-3/4 animate-shimmer rounded mb-2"></div>
                                        <div className="h-4 w-1/2 animate-shimmer rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-20 bg-white/50 backdrop-blur rounded-3xl border border-white/40"
                        >
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                                <Package className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">No products found</h3>
                            <p className="text-muted-foreground">
                                {searchQuery ? "Try a different search term" : "Check back later for new arrivals!"}
                            </p>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
                            {filteredProducts.map((product, index) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03, duration: 0.4 }}
                                    className="group"
                                >
                                    <div className="bg-white/70 backdrop-blur rounded-2xl overflow-hidden border border-white/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 card-shine">
                                        <div className="relative aspect-square bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center overflow-hidden">
                                            {product.images?.[0] ? (
                                                <img
                                                    src={product.images[0]}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <span className="text-5xl group-hover:scale-110 transition-transform duration-300">🌿</span>
                                            )}

                                            {/* Eco Badge */}
                                            <div className="absolute top-3 left-3">
                                                <span className="eco-badge">Eco</span>
                                            </div>

                                            {/* Wishlist Button */}
                                            <Button
                                                size="icon"
                                                variant="secondary"
                                                className="absolute top-3 right-3 h-9 w-9 rounded-xl bg-white/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:text-red-500 shadow-lg"
                                            >
                                                <Heart className="h-4 w-4" />
                                            </Button>

                                            {/* Discount Badge */}
                                            {product.original_price && (
                                                <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-red-500 text-white text-xs font-bold">
                                                    -{Math.round((1 - product.price / product.original_price) * 100)}%
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4">
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <div className="flex items-center gap-0.5">
                                                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                                    <Star className="h-3.5 w-3.5 fill-amber-200 text-amber-200" />
                                                </div>
                                                <span className="text-xs font-medium text-muted-foreground">(4.8)</span>
                                            </div>

                                            <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                                                {product.name}
                                            </h3>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-lg font-bold text-primary">৳{product.price}</span>
                                                    {product.original_price && (
                                                        <span className="text-xs text-muted-foreground line-through ml-1.5">৳{product.original_price}</span>
                                                    )}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className={`h-9 px-4 rounded-xl font-semibold transition-all duration-300 ${addingProduct === product.id
                                                        ? "bg-green-500 shadow-lg shadow-green-500/25"
                                                        : "bg-gradient-to-r from-primary to-emerald-600 shadow-lg shadow-primary/20 hover:shadow-primary/30"
                                                        }`}
                                                    onClick={() => handleAddToCart(product)}
                                                    disabled={addingProduct === product.id || product.stock === 0}
                                                >
                                                    {addingProduct === product.id ? (
                                                        <Check className="h-4 w-4" />
                                                    ) : (
                                                        <ShoppingBag className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
