import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, Mail, Phone, MapPin, Save, Loader2, Check, Edit2, Plus, Trash2, Leaf, Home, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { Link } from "wouter";

interface SavedAddress {
    id: string;
    label: string;
    fullName: string;
    phone: string;
    division: string;
    district: string;
    address: string;
    isDefault: boolean;
}

interface UserProfile {
    id: number;
    user_id: string;
    username: string;
    full_name: string;
    email: string;
    phone: string | null;
    role: string;
    is_super_admin?: boolean;
    bio: string | null;
    avatar_url: string | null;
    saved_addresses: SavedAddress[];
    created_at: string;
}

const divisions = ["Dhaka", "Chittagong", "Rajshahi", "Khulna", "Barisal", "Sylhet", "Rangpur", "Mymensingh"];

export default function Profile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<"profile" | "addresses">("profile");
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);

    const [form, setForm] = useState({
        username: "",
        full_name: "",
        phone: "",
        bio: "",
    });

    const [addressForm, setAddressForm] = useState<Omit<SavedAddress, "id">>({
        label: "Home",
        fullName: "",
        phone: "",
        division: "Dhaka",
        district: "",
        address: "",
        isDefault: false,
    });

    useEffect(() => { fetchProfile(); }, [user]);

    const fetchProfile = async () => {
        console.log("Fetching profile for user:", user);
        if (!user?.email) {
            console.log("No user email found");
            return;
        }
        const { data, error } = await supabase.from("users").select("*").eq("email", user.email).single();
        console.log("Profile fetch result:", { data, error });

        if (data) {
            setProfile(data);
            setForm({
                username: data.username || "",
                full_name: data.full_name || "",
                phone: data.phone || "",
                bio: data.bio || "",
            });
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!profile) return;
        setSaving(true);
        try {
            await supabase.from("users").update({
                username: form.username,
                full_name: form.full_name,
                phone: form.phone,
                bio: form.bio,
            }).eq("id", profile.id);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            fetchProfile();
        } catch (err) {
            console.error("Save error:", err);
        } finally {
            setSaving(false);
        }
    };

    const saveAddress = async () => {
        if (!profile) return;
        setSaving(true);

        let addresses = [...(profile.saved_addresses || [])];

        if (editingAddress) {
            addresses = addresses.map(a => a.id === editingAddress.id ? { ...addressForm, id: editingAddress.id } : a);
        } else {
            const newAddress = { ...addressForm, id: Date.now().toString() };
            if (newAddress.isDefault) {
                addresses = addresses.map(a => ({ ...a, isDefault: false }));
            }
            addresses.push(newAddress);
        }

        if (addressForm.isDefault) {
            addresses = addresses.map(a => ({ ...a, isDefault: a.id === (editingAddress?.id || addresses[addresses.length - 1]?.id) }));
        }

        await supabase.from("users").update({ saved_addresses: addresses }).eq("id", profile.id);
        setShowAddressForm(false);
        setEditingAddress(null);
        setAddressForm({ label: "Home", fullName: form.full_name, phone: form.phone, division: "Dhaka", district: "", address: "", isDefault: false });
        fetchProfile();
        setSaving(false);
    };

    const deleteAddress = async (id: string) => {
        if (!profile || !confirm("Delete this address?")) return;
        const addresses = profile.saved_addresses.filter(a => a.id !== id);
        await supabase.from("users").update({ saved_addresses: addresses }).eq("id", profile.id);
        fetchProfile();
    };

    const setDefaultAddress = async (id: string) => {
        if (!profile) return;
        const addresses = profile.saved_addresses.map(a => ({ ...a, isDefault: a.id === id }));
        await supabase.from("users").update({ saved_addresses: addresses }).eq("id", profile.id);
        fetchProfile();
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "admin": return { label: "Admin", color: "bg-purple-100 text-purple-700" };
            case "seller": return { label: "Seller", color: "bg-emerald-100 text-emerald-700" };
            default: return { label: "Eco Shopper", color: "bg-green-100 text-green-700" };
        }
    };

    const createProfile = async () => {
        setSaving(true);
        try {
            // Generate ID logic (simplified)
            const prefix = "USR";
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
            const newUserId = `${prefix}-${dateStr}-${random}`;

            const newProfile = {
                user_id: newUserId,
                username: form.username || user?.email?.split("@")[0] || "User",
                full_name: form.full_name || "New User",
                email: user!.email!,
                phone: form.phone,
                bio: form.bio,
                role: "buyer"
            };

            const { data, error } = await supabase.from("users").insert(newProfile).select().single();

            if (error) throw error;
            if (data) {
                setProfile(data);
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            }
        } catch (err: any) {
            console.error("Create profile error:", err);
            alert("Failed to create profile: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center">
                <div className="text-center">
                    <Leaf className="h-12 w-12 animate-pulse text-emerald-500 mx-auto mb-2" />
                    <p className="text-emerald-600">Loading your profile...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-8 max-w-md w-full">
                    <div className="text-center mb-6">
                        <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-emerald-900">Complete Your Profile</h2>
                        <p className="text-muted-foreground mt-2">It looks like your profile details are missing. Please let us know a bit about you to continue.</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Label>Full Name</Label>
                            <Input
                                placeholder="Your Name"
                                value={form.full_name}
                                onChange={e => setForm({ ...form, full_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Username</Label>
                            <Input
                                placeholder="Username"
                                value={form.username}
                                onChange={e => setForm({ ...form, username: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Phone</Label>
                            <Input
                                placeholder="Phone Number"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                            />
                        </div>
                        <Button onClick={createProfile} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700">
                            {saving ? <Loader2 className="animate-spin" /> : "Create Profile"}
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    const roleBadge = getRoleBadge(profile.role);

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-emerald-100">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="~/shop"><Button variant="ghost" size="icon" className="hover:bg-emerald-100"><ArrowLeft className="h-5 w-5 text-emerald-700" /></Button></Link>
                        <div className="flex items-center gap-2">
                            <Leaf className="h-5 w-5 text-emerald-600" />
                            <h1 className="text-xl font-bold text-emerald-800">My Profile</h1>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Profile Header Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6 mb-4">
                    <div className="flex items-start gap-4">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                            {form.username?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-xl font-bold text-emerald-900">{form.username}</h2>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${roleBadge.color}`}>{roleBadge.label}</span>
                            </div>
                            <p className="text-sm text-emerald-600 font-mono">{profile.user_id}</p>
                            <p className="text-sm text-gray-500">{profile.email}</p>
                        </div>
                    </div>
                </motion.div>



                {/* Tabs */}
                <div className="flex bg-white rounded-xl p-1 mb-4 border border-emerald-100">
                    {(["profile", "addresses"] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${activeTab === tab ? "bg-emerald-500 text-white shadow" : "text-emerald-700 hover:bg-emerald-50"}`}
                        >
                            {tab === "profile" ? <User className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                            {tab === "profile" ? "Profile" : "Addresses"}
                        </button>
                    ))}
                </div>

                {/* Profile Tab */}
                <AnimatePresence mode="wait">
                    {activeTab === "profile" && (
                        <motion.div
                            key="profile"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6"
                        >
                            <h3 className="font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                                <User className="h-4 w-4" /> Personal Information
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-sm text-emerald-700">Display Name</Label>
                                    <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="border-emerald-200 focus:border-emerald-400" />
                                    <p className="text-xs text-gray-500 mt-1">How others will see you on EcoHaat</p>
                                </div>
                                <div>
                                    <Label className="text-sm text-emerald-700">Full Name</Label>
                                    <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="border-emerald-200 focus:border-emerald-400" />
                                </div>
                                <div>
                                    <Label className="text-sm text-emerald-700">Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                                        <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" className="pl-9 border-emerald-200 focus:border-emerald-400" />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-sm text-emerald-700">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                                        <Input value={profile.email} disabled className="pl-9 bg-emerald-50 border-emerald-200" />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-sm text-emerald-700">Bio</Label>
                                    <textarea
                                        value={form.bio}
                                        onChange={e => setForm({ ...form, bio: e.target.value })}
                                        placeholder="Tell us about yourself and your eco journey..."
                                        className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-emerald-200 focus:border-emerald-400 bg-white resize-none text-sm"
                                    />
                                </div>
                                <Button onClick={handleSave} disabled={saving} className="w-full bg-emerald-500 hover:bg-emerald-600 gap-2">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <><Check className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Changes</>}
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Addresses Tab */}
                    {activeTab === "addresses" && (
                        <motion.div
                            key="addresses"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {/* Saved Addresses */}
                            {(profile.saved_addresses || []).length > 0 && (
                                <div className="space-y-3">
                                    {profile.saved_addresses.map(addr => (
                                        <div key={addr.id} className={`bg-white rounded-xl border p-4 ${addr.isDefault ? "border-emerald-400 ring-2 ring-emerald-100" : "border-emerald-100"}`}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${addr.isDefault ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-600"}`}>
                                                        <Home className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-emerald-900">{addr.label}</span>
                                                            {addr.isDefault && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Default</span>}
                                                        </div>
                                                        <p className="text-sm text-gray-600">{addr.fullName}</p>
                                                        <p className="text-sm text-gray-500">{addr.phone}</p>
                                                        <p className="text-sm text-gray-500">{addr.address}, {addr.district}, {addr.division}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    {!addr.isDefault && (
                                                        <Button size="sm" variant="ghost" className="h-8 text-xs text-emerald-600 hover:bg-emerald-50" onClick={() => setDefaultAddress(addr.id)}>Set Default</Button>
                                                    )}
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => deleteAddress(addr.id)}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add Address Button */}
                            {!showAddressForm && (
                                <Button onClick={() => { setAddressForm({ label: "Home", fullName: form.full_name, phone: form.phone, division: "Dhaka", district: "", address: "", isDefault: (profile.saved_addresses || []).length === 0 }); setShowAddressForm(true); }} variant="outline" className="w-full border-dashed border-emerald-300 text-emerald-600 hover:bg-emerald-50 gap-2">
                                    <Plus className="h-4 w-4" /> Add New Address
                                </Button>
                            )}

                            {/* Address Form */}
                            {showAddressForm && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-emerald-100 p-5">
                                    <h3 className="font-semibold text-emerald-800 mb-4">Add Delivery Address</h3>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-sm text-emerald-700">Label</Label>
                                                <select value={addressForm.label} onChange={e => setAddressForm({ ...addressForm, label: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-emerald-200 bg-white">
                                                    <option>Home</option>
                                                    <option>Work</option>
                                                    <option>Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <Label className="text-sm text-emerald-700">Recipient Name</Label>
                                                <Input value={addressForm.fullName} onChange={e => setAddressForm({ ...addressForm, fullName: e.target.value })} className="border-emerald-200" />
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-sm text-emerald-700">Phone</Label>
                                            <Input value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} placeholder="01XXXXXXXXX" className="border-emerald-200" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-sm text-emerald-700">Division</Label>
                                                <select value={addressForm.division} onChange={e => setAddressForm({ ...addressForm, division: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-emerald-200 bg-white">
                                                    {divisions.map(d => <option key={d}>{d}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <Label className="text-sm text-emerald-700">District</Label>
                                                <Input value={addressForm.district} onChange={e => setAddressForm({ ...addressForm, district: e.target.value })} className="border-emerald-200" />
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-sm text-emerald-700">Full Address</Label>
                                            <textarea value={addressForm.address} onChange={e => setAddressForm({ ...addressForm, address: e.target.value })} placeholder="House, Road, Area" className="w-full min-h-[70px] px-3 py-2 rounded-lg border border-emerald-200 bg-white resize-none text-sm" />
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={addressForm.isDefault} onChange={e => setAddressForm({ ...addressForm, isDefault: e.target.checked })} className="rounded border-emerald-300 text-emerald-500" />
                                            <span className="text-sm text-emerald-700">Set as default address</span>
                                        </label>
                                        <div className="flex gap-3">
                                            <Button variant="outline" onClick={() => setShowAddressForm(false)} className="flex-1 border-emerald-200">Cancel</Button>
                                            <Button onClick={saveAddress} disabled={saving || !addressForm.fullName || !addressForm.phone || !addressForm.district || !addressForm.address} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Address"}
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Empty State */}
                            {(profile.saved_addresses || []).length === 0 && !showAddressForm && (
                                <div className="bg-white rounded-xl border border-emerald-100 p-8 text-center">
                                    <MapPin className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
                                    <p className="text-emerald-800 font-medium mb-1">No saved addresses</p>
                                    <p className="text-sm text-gray-500 mb-4">Add an address for faster checkout</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Eco Badge */}
                <div className="mb-6 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl p-4 text-white text-center">
                    <Leaf className="h-8 w-8 mx-auto mb-2 opacity-80" />
                    <p className="font-medium">You're part of the EcoHaat family! 🌱</p>
                    <p className="text-sm opacity-80">Every purchase supports sustainable living</p>
                </div>

                {/* Admin Access Panel - Moved to Bottom */}
                <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${profile.role === 'admin' || profile.is_super_admin ? 'bg-purple-50 border-purple-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 grayscale blur-[1px] select-none pointer-events-none'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${profile.role === 'admin' || profile.is_super_admin ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-400'}`}>
                            <LayoutDashboard className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">Admin Dashboard</h3>
                            <p className="text-xs text-muted-foreground">{profile.role === 'admin' || profile.is_super_admin ? "Manage users, products & orders" : "Restricted Access"}</p>
                        </div>
                    </div>
                    {/* Link logic */}
                    {profile.role === 'admin' || profile.is_super_admin ? (
                        <Link href="~/admin">
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                                Enter Panel <ArrowLeft className="h-4 w-4 rotate-180" />
                            </Button>
                        </Link>
                    ) : (
                        <Button size="sm" variant="outline" disabled className="gap-2">
                            Locked <ArrowLeft className="h-4 w-4 rotate-180" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
