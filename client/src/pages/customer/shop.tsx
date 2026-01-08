import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, ShoppingBag, Heart, Star, LogOut, Package, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-provider";
import { useCart } from "@/lib/cart-context";
import { supabase } from "@/lib/supabase";
import { Link } from "wouter";
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
        <div className="min-h-screen bg-background">
            {/* Header */}
            <NavBar onSearch={setSearchQuery} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-primary/10 to-emerald-100 rounded-2xl p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold font-display mb-2">Welcome back! 🌿</h1>
                            <p className="text-muted-foreground">Discover sustainable products for everyday life</p>
                        </div>
                        <Link href="/shop/orders">
                            <Button variant="outline" className="gap-2">
                                <Package className="h-4 w-4" />
                                My Orders
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Categories */}
                <section className="mb-8">
                    <h2 className="text-lg font-semibold mb-4">Categories</h2>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === null ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                                }`}
                        >
                            All Products
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === category.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                                    }`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Products Grid */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">
                            {selectedCategory ? categories.find((c) => c.id === selectedCategory)?.name : "All Products"}
                        </h2>
                        <span className="text-sm text-muted-foreground">{filteredProducts.length} products</span>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="bg-muted rounded-xl h-64 animate-pulse" />
                            ))}
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-16">
                            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No products found</h3>
                            <p className="text-muted-foreground">
                                {searchQuery ? "Try a different search term" : "Check back later for new arrivals!"}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            {filteredProducts.map((product, index) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="group"
                                >
                                    <div className="bg-card rounded-xl overflow-hidden border border-card-border hover:shadow-lg transition-all">
                                        <div className="relative aspect-square bg-muted flex items-center justify-center">
                                            {product.images?.[0] ? (
                                                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-4xl">🌿</span>
                                            )}
                                            <Button
                                                size="icon"
                                                variant="secondary"
                                                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Heart className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="p-3">
                                            <div className="flex items-center gap-1 mb-1">
                                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                <span className="text-xs font-medium">4.8</span>
                                            </div>
                                            <h3 className="font-medium text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                                                {product.name}
                                            </h3>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-sm font-bold text-primary">৳{product.price}</span>
                                                    {product.original_price && (
                                                        <span className="text-xs text-muted-foreground line-through ml-1">৳{product.original_price}</span>
                                                    )}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className={`h-8 px-3 ${addingProduct === product.id ? "bg-green-600" : "bg-primary hover:bg-primary/90"}`}
                                                    onClick={() => handleAddToCart(product)}
                                                    disabled={addingProduct === product.id || product.stock === 0}
                                                >
                                                    {addingProduct === product.id ? <Check className="h-4 w-4" /> : "Add"}
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
