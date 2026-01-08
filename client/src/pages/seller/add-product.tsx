import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Upload,
    Plus,
    X,
    Loader2,
    Package,
    LogOut,
    TrendingUp,
    ShoppingCart,
    Store,
    Shield,
    AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { AppLink as Link } from "@/components/app-link";
import { useLocation } from "wouter";

interface Category {
    id: number;
    name: string;
    slug: string;
}

export default function AddProduct() {
    const { user, signOut } = useAuth();
    const [, setLocation] = useLocation();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [verificationStatus, setVerificationStatus] = useState<string>("none");
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        originalPrice: "",
        stock: "",
        categoryId: "",
        tags: [] as string[],
        tagInput: "",
    });

    useEffect(() => {
        checkVerification();
        fetchCategories();
    }, []);

    const checkVerification = async () => {
        if (!user?.email) return;
        const { data } = await supabase.from("users").select("verification_status").eq("email", user.email).single();
        if (data) setVerificationStatus(data.verification_status || "none");
        setCheckingStatus(false);
    };

    const fetchCategories = async () => {
        const { data } = await supabase.from("categories").select("*");
        if (data) setCategories(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: profile } = await supabase.from("users").select("id").eq("email", user?.email).single();
            if (!profile) throw new Error("Seller profile not found");

            const { error } = await supabase.from("products").insert({
                name: formData.name,
                description: formData.description,
                price: parseInt(formData.price),
                original_price: formData.originalPrice ? parseInt(formData.originalPrice) : null,
                stock: parseInt(formData.stock),
                category_id: formData.categoryId ? parseInt(formData.categoryId) : null,
                seller_id: profile.id,
                tags: formData.tags,
                is_eco_friendly: true,
            });

            if (error) throw error;
            setLocation("/seller");
        } catch (err: any) {
            alert(err.message || "Failed to add product");
        } finally {
            setLoading(false);
        }
    };

    const addTag = () => {
        if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
            setFormData({ ...formData, tags: [...formData.tags, formData.tagInput.trim()], tagInput: "" });
        }
    };

    const removeTag = (tag: string) => {
        setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
    };

    if (checkingStatus) {
        return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (verificationStatus !== "verified") {
        return (
            <div className="min-h-screen bg-background flex">
                <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border p-6 hidden lg:block">
                    {/* Simplified Sidebar for unverified state */}
                    <div className="flex items-center gap-2 mb-8">
                        <span className="font-display text-xl font-bold text-primary">EcoHaat</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Seller</span>
                    </div>
                    <nav className="space-y-2">
                        <Link href="/seller"><a className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><TrendingUp className="h-5 w-5" /> Dashboard</a></Link>
                    </nav>
                </aside>
                <main className="lg:ml-64 p-8 w-full flex items-center justify-center">
                    <div className="text-center max-w-md p-8 bg-card rounded-2xl border shadow-sm">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="h-8 w-8 text-yellow-600" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Verification Required</h2>
                        <p className="text-muted-foreground mb-6">
                            You must complete the verification process before listing products. This ensures a safe marketplace for everyone.
                        </p>
                        <Link href="/seller/profile">
                            <Button className="w-full gap-2">
                                <Store className="h-4 w-4" /> Go to Verification
                            </Button>
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border p-6 hidden lg:block">
                <div className="flex items-center gap-2 mb-8">
                    <span className="font-display text-xl font-bold text-primary">
                        EcoHaat
                    </span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Seller
                    </span>
                </div>

                <nav className="space-y-2">
                    <Link href="/seller">
                        <a className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <TrendingUp className="h-5 w-5" />
                            Dashboard
                        </a>
                    </Link>
                    <Link href="/seller/products">
                        <a className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <Package className="h-5 w-5" />
                            My Products
                        </a>
                    </Link>
                    <Link href="/seller/add-product">
                        <a className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-medium">
                            <Plus className="h-5 w-5" />
                            Add Product
                        </a>
                    </Link>
                    <Link href="/seller/orders">
                        <a className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <ShoppingCart className="h-5 w-5" />
                            Orders
                        </a>
                    </Link>
                </nav>

                <div className="absolute bottom-6 left-6 right-6">
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={signOut}
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-64 p-8">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/seller">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold font-display">Add New Product</h1>
                            <p className="text-muted-foreground">
                                List a new eco-friendly product in your store
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <motion.form
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={handleSubmit}
                        className="bg-card rounded-2xl border border-card-border p-6 space-y-6"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="name">Product Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Bamboo Toothbrush Set"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe your product, its eco-friendly features, and benefits..."
                                rows={4}
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Price (৳) *</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    placeholder="250"
                                    min="1"
                                    value={formData.price}
                                    onChange={(e) =>
                                        setFormData({ ...formData, price: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="originalPrice">Original Price (৳)</Label>
                                <Input
                                    id="originalPrice"
                                    type="number"
                                    placeholder="350 (optional)"
                                    min="1"
                                    value={formData.originalPrice}
                                    onChange={(e) =>
                                        setFormData({ ...formData, originalPrice: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="stock">Stock Quantity *</Label>
                                <Input
                                    id="stock"
                                    type="number"
                                    placeholder="50"
                                    min="0"
                                    value={formData.stock}
                                    onChange={(e) =>
                                        setFormData({ ...formData, stock: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <select
                                    id="category"
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                    value={formData.categoryId}
                                    onChange={(e) =>
                                        setFormData({ ...formData, categoryId: e.target.value })
                                    }
                                >
                                    <option value="">Select category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Tags</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add a tag (e.g., plastic-free)"
                                    value={formData.tagInput}
                                    onChange={(e) =>
                                        setFormData({ ...formData, tagInput: e.target.value })
                                    }
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            addTag();
                                        }
                                    }}
                                />
                                <Button type="button" variant="outline" onClick={addTag}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {formData.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="hover:bg-primary/20 rounded-full p-0.5"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-border">
                            <Button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Package className="h-4 w-4 mr-2" />
                                        Add Product
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.form>
                </div>
            </main>
        </div>
    );
}
