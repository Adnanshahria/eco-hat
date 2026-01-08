import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
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
                    await supabase.from("users").insert({
                        user_id: userId,
                        username: fullName, // Name as default username
                        full_name: fullName,
                        email,
                        role
                    });
                }
                redirectByRole(role);
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
            case "seller": setLocation("/seller"); break;
            default: setLocation("/shop");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-emerald-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
                <div className="bg-white rounded-2xl shadow-xl border p-6">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <img src="/logo-en.png" alt="EcoHaat" className="h-20" />
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex bg-muted rounded-lg p-1 mb-6">
                        {(["login", "register"] as const).map(m => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${mode === m ? "bg-white shadow text-foreground" : "text-muted-foreground"}`}
                            >
                                {m === "login" ? "Login" : "Register"}
                            </button>
                        ))}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === "register" && (
                            <div>
                                <Label htmlFor="fullName" className="text-sm">Your Name</Label>
                                <div className="relative mt-1">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="fullName" placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)} className="pl-9 h-10" required />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">This will be your display name (can change later)</p>
                            </div>
                        )}

                        <div>
                            <Label htmlFor="email" className="text-sm">Email</Label>
                            <div className="relative mt-1">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-9 h-10" required />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="password" className="text-sm">Password</Label>
                            <div className="relative mt-1">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-9 h-10" required minLength={6} />
                            </div>
                        </div>

                        {mode === "register" && (
                            <div>
                                <Label className="text-sm">I want to</Label>
                                <div className="flex gap-2 mt-1">
                                    {(["buyer", "seller"] as const).map(r => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setRole(r)}
                                            className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition ${role === r ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50"}`}
                                        >
                                            {r === "buyer" ? "🛒 Buy" : "🏪 Sell"} Products
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {error && <div className="p-2 rounded bg-destructive/10 text-destructive text-sm">{error}</div>}

                        <Button type="submit" className="w-full h-10 bg-primary hover:bg-primary/90 font-medium" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{mode === "login" ? "Sign In" : "Create Account"}<ArrowRight className="ml-2 h-4 w-4" /></>}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground mt-4">
                        {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                        <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="text-primary font-medium hover:underline">
                            {mode === "login" ? "Sign up" : "Sign in"}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
