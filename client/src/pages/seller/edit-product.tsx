import { useState, useEffect, useRef } from "react";
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
    Leaf,
    Image as ImageIcon,
    Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { AppLink as Link } from "@/components/app-link";
import { useLocation, useRoute } from "wouter";

interface Category {
    id: number;
    name: string;
    slug: string;
}

export default function EditProduct() {
    const { user, signOut } = useAuth();
    const [, setLocation] = useLocation();
    const [match, params] = useRoute("/seller/edit-product/:id");
    const productId = params?.id ? parseInt(params.id) : null;

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingProduct, setFetchingProduct] = useState(true);
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        originalPrice: "",
        stock: "",
        categoryId: "",
        tags: [] as string[],
        tagInput: "",
        ecoRating: 70,
    });

    useEffect(() => {
        fetchCategories();
        if (productId) fetchProduct();
    }, [productId]);

    const fetchProduct = async () => {
        if (!productId) return;
        setFetchingProduct(true);
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .eq("id", productId)
            .single();

        if (data) {
            setFormData({
                name: data.name || "",
                description: data.description || "",
                price: data.price?.toString() || "",
                originalPrice: data.original_price?.toString() || "",
                stock: data.stock?.toString() || "",
                categoryId: data.category_id?.toString() || "",
                tags: data.tags || [],
                tagInput: "",
                ecoRating: data.eco_rating || 70,
            });
            setExistingImages(data.images || []);
            setImagePreviews(data.images || []);
        }
        setFetchingProduct(false);
    };

    const fetchCategories = async () => {
        const { data } = await supabase.from("categories").select("*");
        if (data) setCategories(data);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + images.length + existingImages.length > 5) {
            alert("Maximum 5 images allowed");
            return;
        }
        const newImages = [...images, ...files];
        setImages(newImages);

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreviews(prev => [...prev, e.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        if (index < existingImages.length) {
            // Remove existing image
            setExistingImages(existingImages.filter((_, i) => i !== index));
            setImagePreviews(imagePreviews.filter((_, i) => i !== index));
        } else {
            // Remove new image
            const newIndex = index - existingImages.length;
            setImages(images.filter((_, i) => i !== newIndex));
            setImagePreviews(imagePreviews.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (imagePreviews.length === 0) {
            alert("Please keep at least one product image");
            return;
        }
        setLoading(true);

        try {
            const { data: profile } = await supabase.from("users").select("id").eq("email", user?.email).single();
            if (!profile) throw new Error("Seller profile not found");

            // Upload new images to Supabase Storage
            const newImageUrls: string[] = [];
            for (const image of images) {
                const fileName = `${Date.now()}-${image.name}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from("product-images")
                    .upload(`products/${profile.id}/${fileName}`, image);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from("product-images")
                    .getPublicUrl(`products/${profile.id}/${fileName}`);

                newImageUrls.push(urlData.publicUrl);
            }

            const allImages = [...existingImages, ...newImageUrls];

            const { error } = await supabase.from("products").update({
                name: formData.name,
                description: formData.description,
                price: parseInt(formData.price),
                original_price: formData.originalPrice ? parseInt(formData.originalPrice) : null,
                stock: parseInt(formData.stock),
                category_id: formData.categoryId ? parseInt(formData.categoryId) : null,
                tags: formData.tags,
                eco_rating: formData.ecoRating,
                image_url: allImages[0],
                images: allImages,
            }).eq("id", productId);

            if (error) throw error;
            setLocation("/seller/products");
        } catch (err: any) {
            alert(err.message || "Failed to update product");
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

    if (fetchingProduct) {
        return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border p-6 hidden lg:block">
                <div className="flex items-center gap-2 mb-8">
                    <span className="font-display text-xl font-bold text-primary">EcoHaat</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Seller</span>
                </div>
                <nav className="space-y-2">
                    <Link href="/seller" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><TrendingUp className="h-5 w-5" /> Dashboard</Link>
                    <Link href="/seller/products" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Package className="h-5 w-5" /> My Products</Link>
                    <Link href="/seller/orders" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><ShoppingCart className="h-5 w-5" /> Orders</Link>
                </nav>
                <div className="absolute bottom-6 left-6 right-6">
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={signOut}><LogOut className="h-4 w-4" /> Logout</Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-64 p-8">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/seller/products"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
                        <div>
                            <h1 className="text-2xl font-bold font-display">Edit Product</h1>
                            <p className="text-muted-foreground">Update your product details</p>
                        </div>
                    </div>

                    {/* Form */}
                    <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="bg-card rounded-2xl border border-card-border p-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Product Name *</Label>
                            <Input id="name" placeholder="e.g., Bamboo Toothbrush Set" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea id="description" placeholder="Describe your product..." rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-2">
                            <Label>Product Images * (Max 5)</Label>
                            <div className="border-2 border-dashed border-border rounded-xl p-4">
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageSelect} />
                                {imagePreviews.length > 0 && (
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                                        {imagePreviews.map((preview, index) => (
                                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                                                <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <Button type="button" variant="outline" className="w-full gap-2" onClick={() => fileInputRef.current?.click()} disabled={imagePreviews.length >= 5}>
                                    <ImageIcon className="h-4 w-4" />
                                    {imagePreviews.length > 0 ? `Add More (${imagePreviews.length}/5)` : "Upload Images"}
                                </Button>
                            </div>
                        </div>

                        {/* Eco-Friendliness Rating */}
                        <div className="space-y-3">
                            <Label className="flex items-center gap-2"><Leaf className="h-4 w-4 text-primary" /> Eco-Friendliness *</Label>
                            <div className="flex items-center gap-4">
                                <input type="range" min="10" max="100" step="5" value={formData.ecoRating} onChange={(e) => setFormData({ ...formData, ecoRating: parseInt(e.target.value) })} className="flex-1 h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary" />
                                <span className={`min-w-[60px] px-3 py-1 rounded-full text-sm font-medium text-center ${formData.ecoRating >= 80 ? "bg-green-100 text-green-700" : formData.ecoRating >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-orange-100 text-orange-700"}`}>{formData.ecoRating}%</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Price (৳) *</Label>
                                <Input id="price" type="number" placeholder="250" min="1" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="originalPrice">Original Price (৳)</Label>
                                <Input id="originalPrice" type="number" placeholder="350" min="1" value={formData.originalPrice} onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="stock">Stock Quantity *</Label>
                                <Input id="stock" type="number" placeholder="50" min="0" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <select id="category" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}>
                                    <option value="">Select category</option>
                                    {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Tags</Label>
                            <div className="flex gap-2">
                                <Input placeholder="Add a tag" value={formData.tagInput} onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })} onKeyPress={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} />
                                <Button type="button" variant="outline" onClick={addTag}><Plus className="h-4 w-4" /></Button>
                            </div>
                            {formData.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.tags.map((tag) => (
                                        <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                                            {tag}
                                            <button type="button" onClick={() => removeTag(tag)} className="hover:bg-primary/20 rounded-full p-0.5"><X className="h-3 w-3" /></button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-border">
                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading || imagePreviews.length === 0}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
                            </Button>
                        </div>
                    </motion.form>
                </div>
            </main>
        </div>
    );
}
