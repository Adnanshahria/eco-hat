import { useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, KeyRound, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type AuthMode = "login" | "register";
type AuthStep = "form" | "otp" | "forgot_password" | "reset_password" | "otp_login";
type UserRole = "buyer" | "seller";

export default function Auth() {
    const [mode, setMode] = useState<AuthMode>("login");
    const [step, setStep] = useState<AuthStep>("form");
    const [role, setRole] = useState<UserRole>("buyer");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [otp, setOtp] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [resendTimer, setResendTimer] = useState(0);
    const [, setLocation] = useLocation();
    const { t } = useLanguage();

    // Register - Step 1: Sign up and trigger OTP
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Determine the actual role (seller becomes uv-seller)
            const actualRole = role === 'seller' ? 'uv-seller' : 'buyer';

            // Sign up with Supabase
            // Note: In Supabase dashboard, disable "Confirm email" if you want to skip this, 
            // BUT for OTP verification to work as a gate, we keep it enabled.
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName, role: actualRole }
                }
            });

            if (error) throw error;

            if (data.user && !data.session) {
                // User created, confirmation email sent
                setMessage("✅ Verification code sent to your email.");
                setStep("otp"); // Move to OTP entry
            } else if (data.session) {
                // Email confirmation is disabled - create user record immediately
                console.warn("Session created immediately - Email confirmation might be disabled in Supabase.");

                // Create user record in the database with correct role
                const userId = generateUserId(role);
                await supabase.from("users").upsert({
                    user_id: userId,
                    username: fullName,
                    full_name: fullName,
                    email,
                    role: actualRole
                }, { onConflict: 'email' });

                localStorage.setItem("userRole", actualRole);
                redirectByRole(actualRole);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Verify OTP for Registration
    const verifyRegisterOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'signup'
            });

            if (error) throw error;

            if (data.session) {
                // Success! Create user record in our table if needed (triggers usually handle this, but we can double check)
                const userId = generateUserId(role);
                const actualRole = role === 'seller' ? 'uv-seller' : 'buyer';

                await supabase.from("users").upsert({
                    user_id: userId,
                    username: fullName,
                    full_name: fullName,
                    email,
                    role: actualRole
                }, { onConflict: 'email' });

                localStorage.setItem("userRole", actualRole);
                redirectByRole(actualRole);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Login with Password
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            const { data: profile } = await supabase.from("users").select("role").eq("email", email).maybeSingle();
            if (profile) {
                localStorage.setItem("userRole", profile.role);
                redirectByRole(profile.role as UserRole);
            } else setLocation("/");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Start OTP Login
    const startOTPLogin = async () => {
        if (!email) return setError("Enter email first");
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({ email });
            if (error) throw error;
            setMessage("✅ OTP sent to your email");
            setStep("otp_login");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Verify Login OTP
    const verifyLoginOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'email' // 'email' for magic link/code login
            });
            if (error) throw error;
            if (data.session) {
                const { data: profile } = await supabase.from("users").select("role").eq("email", email).maybeSingle();
                if (profile) {
                    localStorage.setItem("userRole", profile.role);
                    redirectByRole(profile.role);
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Forgot Password - Step 1: Send OTP
    const startForgotPassword = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!email) {
            setError("Please enter your email first");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
            setMessage("✅ Password reset code sent to your email.");
            setStep("reset_password");
            // Start resend cooldown (60 seconds)
            setResendTimer(60);
            const interval = setInterval(() => {
                setResendTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Resend Password Reset Code
    const resendResetCode = async () => {
        if (resendTimer > 0) return;
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
            setMessage("✅ New code sent to your email.");
            setResendTimer(60);
            const interval = setInterval(() => {
                setResendTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Verify Password Reset OTP
    const verifyResetOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate password match
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'recovery'
            });
            if (error) throw error;

            if (data.session) {
                // Now update the password
                const { error: updateError } = await supabase.auth.updateUser({ password: password });
                if (updateError) throw updateError;

                setMessage("✅ Password updated successfully! Please sign in with your new password.");
                setPassword("");
                setConfirmPassword("");
                setOtp("");
                setStep("form");
                setMode("login");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const generateUserId = (role: UserRole): string => {
        const prefix = role === "seller" ? "SLR" : "USR";
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
        // Use timestamp milliseconds + random suffix for uniqueness (no DB query needed)
        const uniqueSuffix = now.getTime().toString(36).slice(-4) + Math.random().toString(36).slice(-3);
        return `${prefix}-${dateStr}-${uniqueSuffix.toUpperCase()}`;
    };

    const redirectByRole = (userRole: string) => {
        switch (userRole) {
            case "admin": setLocation("/admin"); break;
            case "seller":
            case "uv-seller": setLocation("/seller"); break;
            default: setLocation("/shop");
        }
    };

    // UI Helpers
    const resetFlow = () => { setStep("form"); setOtp(""); setError(null); setMessage(null); };

    // OTP Input Component
    const OTPInputField = () => (
        <div className="space-y-4">
            <div className="text-center mb-4">
                <div className="text-4xl mb-2">✉️</div>
                <h3 className="font-semibold">Enter 6-digit Code</h3>
                <p className="text-xs text-muted-foreground">Sent to {email}</p>
            </div>
            <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    maxLength={6}
                    className="pl-10 text-center text-xl tracking-widest font-mono"
                    placeholder="000000"
                    required
                />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen relative overflow-hidden bg-grass-pattern safe-area-insets flex items-center justify-center p-4">
            {/* Background & Animations omitted for brevity, keeping existing wrapper */}
            <div className="frosted-glass rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10">
                <AnimatePresence mode="wait">

                    {/* OTP ENTRY STEPS */}
                    {(step === "otp" || step === "otp_login" || step === "reset_password") && (
                        <motion.form
                            key="otp-form"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            onSubmit={
                                step === "otp" ? verifyRegisterOTP :
                                    step === "otp_login" ? verifyLoginOTP :
                                        verifyResetOTP
                            }
                            className="space-y-5"
                        >
                            <button type="button" onClick={resetFlow} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </button>

                            <OTPInputField />

                            {/* Resend Code Button */}
                            {(step === "otp" || step === "otp_login" || step === "reset_password") && (
                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={step === "reset_password" ? resendResetCode : startOTPLogin}
                                        disabled={resendTimer > 0 || loading}
                                        className={`text-sm flex items-center gap-1 mx-auto ${resendTimer > 0 ? "text-muted-foreground cursor-not-allowed" : "text-primary hover:underline cursor-pointer"}`}
                                    >
                                        <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                                        {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend code"}
                                    </button>
                                </div>
                            )}

                            {step === "reset_password" && (
                                <div className="space-y-3">
                                    <div>
                                        <Label>New Password</Label>
                                        <Input
                                            type="password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="Enter new password"
                                            required
                                            minLength={6}
                                            className="mt-2"
                                        />
                                    </div>
                                    <div>
                                        <Label>Confirm Password</Label>
                                        <Input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                            required
                                            minLength={6}
                                            className="mt-2"
                                        />
                                        {password && confirmPassword && password !== confirmPassword && (
                                            <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {error && <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg">{error}</div>}
                            {message && <div className="text-primary text-sm bg-primary/10 p-3 rounded-lg">{message}</div>}

                            <Button type="submit" className="w-full" disabled={loading || (step === "reset_password" && password !== confirmPassword)}>
                                {loading ? <Loader2 className="animate-spin" /> : (step === "reset_password" ? "Reset Password" : "Verify Code")}
                            </Button>
                        </motion.form>
                    )}

                    {/* FORGOT PASSWORD START */}
                    {step === "forgot_password" && (
                        <motion.form key="forgot" onSubmit={startForgotPassword} className="space-y-4" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                            <button type="button" onClick={resetFlow} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </button>
                            <h2 className="text-xl font-bold text-center">Reset Password</h2>
                            <div>
                                <Label>Email</Label>
                                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                            {message && <div className="text-primary text-sm bg-primary/10 p-3 rounded-lg">{message}</div>}
                            <Button type="submit" className="w-full" disabled={loading}>Send Code</Button>
                        </motion.form>
                    )}

                    {/* MAIN FORM */}
                    {step === "form" && (
                        <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="flex justify-center mb-6">
                                <img src={import.meta.env.BASE_URL + "logo-en.png"} alt="EcoHaat" className="h-20" />
                            </div>

                            <div className="flex bg-muted/50 rounded-xl p-1 mb-6">
                                {(["login", "register"] as const).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => { setMode(m); setError(null); }}
                                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === m ? "bg-white shadow text-primary" : "text-muted-foreground"}`}
                                    >
                                        {m === "login" ? "Login" : "Register"}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={mode === "register" ? handleRegister : handleLogin} className="space-y-4">
                                {mode === "register" && (
                                    <>
                                        <div>
                                            <Label>Full Name</Label>
                                            <Input value={fullName} onChange={e => setFullName(e.target.value)} required />
                                        </div>
                                        <div className="flex gap-2">
                                            {(["buyer", "seller"] as const).map(r => (
                                                <div key={r} onClick={() => setRole(r)} className={`flex-1 p-3 border rounded-xl cursor-pointer text-center text-sm ${role === r ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                                                    {r === "buyer" ? "🛒 Buyer" : "🏪 Seller"}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                <div>
                                    <Label>Email</Label>
                                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                                </div>

                                <div>
                                    <div className="flex justify-between">
                                        <Label>Password</Label>
                                        {mode === "login" && <span onClick={() => setStep("forgot_password")} className="text-xs text-primary cursor-pointer hover:underline">Forgot?</span>}
                                    </div>
                                    <div className="relative">
                                        <Input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-muted-foreground">
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {error && <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg">{error}</div>}
                                {message && <div className="text-primary text-sm bg-primary/10 p-3 rounded-lg">{message}</div>}

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin" /> : (mode === "login" ? "Sign In" : "Sign Up")}
                                </Button>

                                {mode === "login" && (
                                    <div className="text-center">
                                        <span onClick={startOTPLogin} className="text-xs text-muted-foreground cursor-pointer hover:text-primary">
                                            Login with OTP Code instead
                                        </span>
                                    </div>
                                )}
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
