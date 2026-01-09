import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Shield, Check, X, ArrowLeft, Package, Store, AlertTriangle, ExternalLink, Calendar, Loader2, Tag, Edit2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { createNotification } from "@/components/notifications";
import { NavBar } from "@/components/navbar";

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    original_price: number | null;
    category_id: number | null;
    images: string[];
    stock: number;
    tags: string[];
    eco_rating: number;
    is_eco_friendly: boolean;
    created_at: string;
    seller_id: number;
    status: string;
}

interface Seller {
    id: number;
    username: string;
    email: string;
    shop_location: string;
}

interface Category {
    id: number;
    name: string;
}

export default function ProductVerificationDetail() {
    // Use useRoute to get the ID from the URL
    const [match, params] = useRoute("/admin/verify-product/:id");
    const id = params?.id;

    const [, setLocation] = useLocation();
    const [product, setProduct] = useState<Product | null>(null);
    const [seller, setSeller] = useState<Seller | null>(null);
    const [category, setCategory] = useState<Category | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);

    // Edit form state
    const [editForm, setEditForm] = useState({
        name: "",
        description: "",
        price: 0,
        original_price: 0,
        stock: 0,
        category_id: 0,
        eco_rating: 5,
        tags: [] as string[],
    });

    // Modal state
    const [modal, setModal] = useState<{
        show: boolean;
        type: 'success' | 'error' | 'confirm' | 'input';
        title: string;
        message: string;
        onConfirm?: () => void;
        inputValue?: string;
    }>({ show: false, type: 'success', title: '', message: '' });
    const [inputValue, setInputValue] = useState("");

    useEffect(() => {
        if (id) {
            fetchProduct();
            fetchCategories();
        }
    }, [id]);

    const fetchCategories = async () => {
        const { data } = await supabase.from("categories").select("id, name");
        if (data) setCategories(data);
    };

    const fetchProduct = async () => {
        setLoading(true);
        console.log("Fetching product with ID:", id);

        // Fetch product
        const { data: productData, error: productError } = await supabase
            .from("products")
            .select("*")
            .eq("id", id)
            .single();

        if (productError) {
            console.error("Product fetch error:", productError);
            setLoading(false);
            return;
        }

        if (productData) {
            setProduct(productData);
            setEditForm({
                name: productData.name || "",
                description: productData.description || "",
                price: productData.price || 0,
                original_price: productData.original_price || 0,
                stock: productData.stock || 0,
                category_id: productData.category_id || 0,
                eco_rating: productData.eco_rating || 5,
                tags: productData.tags || [],
            });

            // Fetch seller
            if (productData.seller_id) {
                const { data: sellerData } = await supabase
                    .from("users")
                    .select("id, username, email, shop_location")
                    .eq("id", productData.seller_id)
                    .single();
                if (sellerData) setSeller(sellerData);
            }

            // Fetch category
            if (productData.category_id) {
                const { data: categoryData } = await supabase
                    .from("categories")
                    .select("id, name")
                    .eq("id", productData.category_id)
                    .single();
                if (categoryData) setCategory(categoryData);
            }
        }

        setLoading(false);
    };

    const handleSave = async () => {
        if (!product) return;
        setSaving(true);

        const { error } = await supabase
            .from("products")
            .update({
                name: editForm.name,
                description: editForm.description,
                price: editForm.price,
                original_price: editForm.original_price || null,
                stock: editForm.stock,
                category_id: editForm.category_id || null,
                eco_rating: editForm.eco_rating,
                tags: editForm.tags,
            })
            .eq("id", product.id);

        if (error) {
            setModal({ show: true, type: 'error', title: 'Error', message: "Failed to save changes: " + error.message });
        } else {
            setModal({ show: true, type: 'success', title: 'Success', message: "Product updated successfully!" });
            setEditMode(false);
            fetchProduct();
        }
        setSaving(false);
    };

    const showApproveConfirm = () => {
        setModal({
            show: true,
            type: 'confirm',
            title: 'Confirm Approval',
            message: `Are you sure you want to APPROVE "${product?.name}"?`,
            onConfirm: () => executeVerification(true, "")
        });
    };

    const showRejectInput = () => {
        setInputValue("");
        setModal({
            show: true,
            type: 'input',
            title: 'Reject Product',
            message: 'Please provide a reason for rejection:',
            onConfirm: () => executeVerification(false, inputValue || "Does not meet listing guidelines.")
        });
    };

    const executeVerification = async (approved: boolean, reason: string) => {
        if (!product) return;
        setModal({ ...modal, show: false });
        setProcessing(true);

        const status = approved ? "approved" : "rejected";
        const updateData: any = { status };
        if (!approved) updateData.rejection_reason = reason;

        const { error } = await supabase.from("products").update(updateData).eq("id", product.id);

        if (error) {
            setModal({ show: true, type: 'error', title: 'Error', message: "Error updating status" });
            setProcessing(false);
            return;
        }

        // Notify Seller
        await createNotification(
            product.seller_id,
            approved ? "Product Approved" : "Product Rejected",
            approved
                ? `Your product "${product.name}" has been approved and is now live.`
                : `Your product "${product.name}" was rejected. Reason: ${reason}`,
            approved ? "success" : "error"
        );

        setProcessing(false);
        setLocation("/admin");
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
    if (!product) return <div className="min-h-screen flex items-center justify-center text-lg">Product not found (ID: {id})</div>;

    return (
        <div className="min-h-screen bg-muted/10 pb-20">
            <NavBar />

            <div className="max-w-5xl mx-auto px-4 py-8">
                <Button variant="ghost" className="mb-6 gap-2" onClick={() => setLocation("/admin")}>
                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Button>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold font-display text-emerald-950">Product Verification</h1>
                        <p className="text-muted-foreground mt-1">Review and edit product details before approval.</p>
                    </div>
                    <div className="flex gap-2">
                        {!editMode ? (
                            <Button variant="outline" className="gap-2" onClick={() => setEditMode(true)}>
                                <Edit2 className="h-4 w-4" /> Edit Details
                            </Button>
                        ) : (
                            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
                            </Button>
                        )}
                        <div className="flex bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium items-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> {product.status === 'pending' ? 'Pending' : product.status}
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Left Col: Product Details (2 cols) */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Images */}
                        <section className="bg-card border rounded-xl overflow-hidden shadow-sm">
                            <div className="p-4 border-b bg-muted/30">
                                <h2 className="font-semibold flex items-center gap-2"><Package className="h-5 w-5 text-emerald-600" /> Product Images</h2>
                            </div>
                            <div className="p-4">
                                {product.images && product.images.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-3">
                                        {product.images.map((img, i) => (
                                            <div key={i} className="aspect-square bg-white rounded-lg border overflow-hidden relative group">
                                                <img src={img} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
                                                <a href={img} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-sm">
                                                    <ExternalLink className="h-4 w-4 mr-1" /> View
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded">No images</div>
                                )}
                            </div>
                        </section>

                        {/* Product Info */}
                        <section className="bg-card border rounded-xl overflow-hidden shadow-sm">
                            <div className="p-4 border-b bg-muted/30">
                                <h2 className="font-semibold flex items-center gap-2"><Tag className="h-5 w-5 text-emerald-600" /> Product Information</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                {editMode ? (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Product Name</Label>
                                            <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <textarea
                                                className="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                value={editForm.description}
                                                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Price (৳)</Label>
                                                <Input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: parseInt(e.target.value) || 0 })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Original Price (৳)</Label>
                                                <Input type="number" value={editForm.original_price || ""} onChange={e => setEditForm({ ...editForm, original_price: parseInt(e.target.value) || 0 })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Stock</Label>
                                                <Input type="number" value={editForm.stock} onChange={e => setEditForm({ ...editForm, stock: parseInt(e.target.value) || 0 })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Eco Rating (%)</Label>
                                                <Input type="number" min={0} max={100} value={editForm.eco_rating} onChange={e => setEditForm({ ...editForm, eco_rating: parseInt(e.target.value) || 0 })} placeholder="0-100" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Category</Label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                value={editForm.category_id}
                                                onChange={e => setEditForm({ ...editForm, category_id: parseInt(e.target.value) || 0 })}
                                            >
                                                <option value={0}>Select Category</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Tags (comma separated)</Label>
                                            <Input
                                                value={editForm.tags.join(", ")}
                                                onChange={e => setEditForm({ ...editForm, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                                                placeholder="organic, handmade, eco"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="text-xs text-muted-foreground uppercase font-bold">Product Name</label>
                                            <p className="text-2xl font-bold mt-1">{product.name}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground uppercase font-bold">Description</label>
                                            <p className="mt-1 whitespace-pre-wrap text-foreground/80">{product.description}</p>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                                            <div>
                                                <label className="text-xs text-muted-foreground uppercase font-bold">Price</label>
                                                <p className="text-xl font-bold text-emerald-700">৳{product.price}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted-foreground uppercase font-bold">Original</label>
                                                <p className="text-lg">{product.original_price ? `৳${product.original_price}` : "—"}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted-foreground uppercase font-bold">Stock</label>
                                                <p className="text-lg font-medium">{product.stock} units</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted-foreground uppercase font-bold">Eco Rating</label>
                                                <p className="text-lg font-medium">{product.eco_rating || 0}% 🌿</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-4 pt-4 border-t">
                                            <div>
                                                <label className="text-xs text-muted-foreground uppercase font-bold">Category</label>
                                                <p className="mt-1"><span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-sm">{category?.name || "Uncategorized"}</span></p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted-foreground uppercase font-bold">Tags</label>
                                                <div className="flex gap-1 mt-1 flex-wrap">
                                                    {product.tags?.length > 0 ? product.tags.map((t, i) => (
                                                        <span key={i} className="bg-muted px-2 py-0.5 rounded text-xs">{t}</span>
                                                    )) : <span className="text-muted-foreground text-sm">No tags</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t">
                                            <label className="text-xs text-muted-foreground uppercase font-bold">Listed On</label>
                                            <p className="flex items-center gap-2 mt-1"><Calendar className="h-4 w-4" /> {new Date(product.created_at).toLocaleString()}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Col: Seller & Actions */}
                    <div className="space-y-6">
                        <section className="bg-card border rounded-xl p-6 shadow-sm">
                            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2 border-b pb-2">
                                <Store className="h-5 w-5 text-emerald-600" /> Seller Information
                            </h2>
                            {seller ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-muted-foreground uppercase font-bold">Shop Name</label>
                                        <p className="font-medium">{seller.username}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground uppercase font-bold">Email</label>
                                        <p className="text-sm">{seller.email}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground uppercase font-bold">Location</label>
                                        <p className="text-sm">{seller.shop_location || "Not provided"}</p>
                                    </div>
                                    <div className="pt-2 text-xs text-muted-foreground border-t">Seller ID: {seller.id}</div>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Seller info unavailable</p>
                            )}
                        </section>

                        <section className="bg-white border-2 border-yellow-100 rounded-xl p-6 shadow-lg sticky top-6">
                            <h3 className="font-bold text-lg mb-2">Verification Decision</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Review all details carefully before making a decision.
                            </p>

                            <div className="flex flex-col gap-3">
                                <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={showApproveConfirm} disabled={processing || editMode}>
                                    {processing ? <Loader2 className="animate-spin" /> : <Check className="h-5 w-5" />}
                                    Approve Product
                                </Button>
                                <Button size="lg" variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 gap-2" onClick={showRejectInput} disabled={processing || editMode}>
                                    {processing ? <Loader2 className="animate-spin" /> : <X className="h-5 w-5" />}
                                    Reject Product
                                </Button>
                            </div>
                            {editMode && <p className="text-xs text-center text-muted-foreground mt-3">Save or cancel edit before verifying</p>}
                        </section>
                    </div>
                </div>
            </div>

            {/* Custom Modal */}
            {modal.show && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className={`p-4 ${modal.type === 'success' ? 'bg-emerald-500' : modal.type === 'error' ? 'bg-red-500' : 'bg-amber-500'} text-white`}>
                            <h3 className="font-bold text-lg">{modal.title}</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-foreground mb-4">{modal.message}</p>

                            {modal.type === 'input' && (
                                <textarea
                                    className="w-full border rounded-lg p-3 text-sm min-h-24 mb-4"
                                    placeholder="Enter reason..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    autoFocus
                                />
                            )}

                            <div className="flex gap-3 justify-end">
                                {(modal.type === 'confirm' || modal.type === 'input') && (
                                    <Button variant="outline" onClick={() => setModal({ ...modal, show: false })}>
                                        Cancel
                                    </Button>
                                )}
                                <Button
                                    className={modal.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' : modal.type === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}
                                    onClick={() => {
                                        if (modal.onConfirm) modal.onConfirm();
                                        else setModal({ ...modal, show: false });
                                    }}
                                >
                                    {modal.type === 'confirm' || modal.type === 'input' ? 'Confirm' : 'OK'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

