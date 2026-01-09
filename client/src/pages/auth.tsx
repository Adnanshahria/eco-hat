import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";

type AuthMode = "login" | "register";
type UserRole = "buyer" | "seller";

// Generate user ID: USR/SLR/ADM-YYYYMMDD-XXX
const generateUserId = async (role: UserRole): Promise<string> => {
    const prefix = role === "seller" ? "SLR" : "USR";
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

    // Count users created today
    const { count } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString().slice(0, 10));

    const sequence = String((count || 0) + 1).padStart(3, "0");
    return `${prefix}-${dateStr}-${sequence}`;
};

export default function Auth() {
    const [mode, setMode] = useState<AuthMode>("login");
    const [role, setRole] = useState<UserRole>("buyer");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState(""); // Changed from username to fullName
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [, setLocation] = useLocation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === "register") {
                const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
                if (authError) throw authError;
                if (authData.user) {
                    // Generate formatted user ID
                    const userId = await generateUserId(role);

                    // Use full name as default username
                    // Sellers start as uv-seller until verified
                    const actualRole = role === 'seller' ? 'uv-seller' : role;
                    await supabase.from("users").insert({
                        user_id: userId,
                        username: fullName, // Name as default username
                        full_name: fullName,
                        email,
                        role: actualRole
                    });
                }
                // Redirect to seller dashboard for uv-seller too
                const redirectRole = role === 'seller' ? 'uv-seller' : role;
                redirectByRole(redirectRole);
            } else {
                const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
                if (authError) throw authError;
                const { data: profile } = await supabase.from("users").select("role").eq("email", email).single();
                if (profile) redirectByRole(profile.role as UserRole);
                else setLocation("/");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const redirectByRole = (userRole: string) => {
        switch (userRole) {
            case "admin": setLocation("/admin"); break;
            case "seller":
            case "uv-seller": setLocation("/seller"); break;
            default: setLocation("/shop");
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 safe-area-insets flex items-center justify-center p-4">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Floating Leaves */}
                <motion.div
                    animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-20 left-10 text-6xl opacity-20"
                >🌿</motion.div>
                <motion.div
                    animate={{ y: [0, 15, 0], rotate: [0, -8, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute top-40 right-20 text-5xl opacity-15"
                >🍃</motion.div>
                <motion.div
                    animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute bottom-32 left-20 text-4xl opacity-20"
                >🌱</motion.div>
                <motion.div
                    animate={{ y: [0, 18, 0], rotate: [0, -12, 0] }}
                    transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute bottom-20 right-10 text-5xl opacity-15"
                >🌿</motion.div>

                {/* Gradient Orbs */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-green-300/30 to-emerald-400/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-teal-300/25 to-cyan-400/15 rounded-full blur-3xl"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                {/* Glassmorphism Card */}
                <div className="glass rounded-3xl shadow-2xl p-8 border border-white/40">
                    {/* Logo with Glow */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="flex justify-center mb-8"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150"></div>
                            <img src={import.meta.env.BASE_URL + "logo-en.png"} alt="EcoHaat" className="h-24 relative z-10" />
                        </div>
                    </motion.div>

                    {/* Welcome Text */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-center mb-6"
                    >
                        <h1 className="font-display text-2xl font-bold text-foreground mb-1">
                            {mode === "login" ? "Welcome Back!" : "Join EcoHaat"}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {mode === "login" ? "Sign in to continue your eco journey" : "Start your sustainable shopping journey"}
                        </p>
                    </motion.div>

                    {/* Mode Toggle */}
                    <div className="flex bg-muted/50 rounded-xl p-1.5 mb-6">
                        {(["login", "register"] as const).map(m => (
                            <motion.button
                                key={m}
                                onClick={() => setMode(m)}
                                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${mode === m ? "bg-white shadow-md text-primary" : "text-muted-foreground hover:text-foreground"}`}
                                whileTap={{ scale: 0.98 }}
                            >
                                {m === "login" ? "Sign In" : "Create Account"}
                            </motion.button>
                        ))}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {mode === "register" && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <Label htmlFor="fullName" className="text-sm font-medium">Your Name</Label>
                                <div className="relative mt-1.5">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="fullName"
                                        placeholder="Your full name"
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        className="pl-10 h-12 rounded-xl bg-white/50 border-white/60 focus:bg-white focus:border-primary/40 transition-all"
                                        required
                                    />
                                </div>
                            </motion.div>
                        )}

                        <div>
                            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                            <div className="relative mt-1.5">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="pl-10 h-12 rounded-xl bg-white/50 border-white/60 focus:bg-white focus:border-primary/40 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                            <div className="relative mt-1.5">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="pl-10 pr-10 h-12 rounded-xl bg-white/50 border-white/60 focus:bg-white focus:border-primary/40 transition-all"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {mode === "register" && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                <Label className="text-sm font-medium">I want to</Label>
                                <div className="flex gap-3 mt-2">
                                    {(["buyer", "seller"] as const).map(r => (
                                        <motion.button
                                            key={r}
                                            type="button"
                                            onClick={() => setRole(r)}
                                            className={`flex-1 py-3.5 rounded-xl border-2 text-sm font-semibold transition-all duration-300 ${role === r ? "border-primary bg-primary/10 text-primary shadow-md" : "border-border/50 bg-white/30 hover:border-primary/40 hover:bg-white/50"}`}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <span className="text-lg mr-1">{r === "buyer" ? "🛒" : "🏪"}</span> {r === "buyer" ? "Buy" : "Sell"} Products
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20"
                            >
                                {error}
                            </motion.div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 font-semibold text-base rounded-xl shadow-lg shadow-primary/25 transition-all duration-300"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    {mode === "login" ? "Sign In" : "Create Account"}
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground mt-6">
                        {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => setMode(mode === "login" ? "register" : "login")}
                            className="text-primary font-semibold hover:underline underline-offset-2"
                        >
                            {mode === "login" ? "Sign up" : "Sign in"}
                        </button>
                    </p>
                </div>

                {/* Eco Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-center mt-6"
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur text-sm text-muted-foreground">
                        <span className="text-lg">🌱</span> 100% Eco-Friendly Marketplace
                    </span>
                </motion.div>
            </motion.div>
        </div>
    );
}
