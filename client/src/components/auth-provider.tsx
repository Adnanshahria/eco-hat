import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    userRole: string | null;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(localStorage.getItem("userRole"));

    const fetchUserRole = async (email: string, isMounted: () => boolean, retryCount = 0) => {
        // Set cached role immediately for faster UI, but still fetch fresh
        const cachedRole = localStorage.getItem("userRole");
        if (cachedRole && retryCount === 0) {
            setUserRole(cachedRole);
            // Don't return - continue to fetch fresh role in background
        }

        try {
            // Reduced timeout from 15s to 5s for faster failure
            const queryPromise = supabase.from("users").select("role").eq("email", email).single();
            const timeoutPromise = new Promise<{ data: null; error: { code: string; message: string }; status: number }>((resolve) =>
                setTimeout(() => resolve({ data: null, error: { code: "TIMEOUT", message: "Query timeout" }, status: 408 }), 5000)
            );

            const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
            if (!isMounted()) return;

            if (data) {
                setUserRole(data.role);
                localStorage.setItem("userRole", data.role);
            } else if (error && error.code === "PGRST116") {
                // User doesn't exist in DB yet - this is normal during signup
                // Do NOT create user here. Let auth.tsx or profile.tsx handle it.
                // Just set a temporary client-side role.
                console.log("User not found in DB, waiting for signup flow to create...");
                if (retryCount < 3) {
                    // Retry a few times in case auth.tsx is still creating the record
                    await new Promise(resolve => setTimeout(resolve, 500));
                    if (isMounted()) {
                        return fetchUserRole(email, isMounted, retryCount + 1);
                    }
                } else {
                    // After retries, just set null - the app will redirect to profile or handle gracefully
                    setUserRole(null);
                }
            } else if (error) {
                // Use cached role or default to buyer
                setUserRole(cachedRole || "buyer");
            }
        } catch (err) {
            if (isMounted()) setUserRole(cachedRole || "buyer");
        }
    };

    useEffect(() => {
        let mounted = true;
        const isMounted = () => mounted;

        // Check active sessions and sets the user
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!mounted) return;
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user?.email) {
                await fetchUserRole(session.user.email, isMounted);
            }
            if (mounted) setLoading(false);
        }).catch(() => {
            if (mounted) setLoading(false);
        });

        // Listen for changes on auth state (logged in, signed out, etc.)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user?.email) {
                await fetchUserRole(session.user.email, isMounted);
            } else {
                setUserRole(null);
            }
            if (mounted) setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        try {
            localStorage.removeItem("userRole");
            setUserRole(null);

            // Add timeout to prevent hanging
            const signOutPromise = supabase.auth.signOut();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("SignOut timeout")), 3000)
            );

            await Promise.race([signOutPromise, timeoutPromise]).catch(err => {
                console.warn("SignOut issue:", err.message);
            });
        } catch (error) {
            console.error("Sign out error:", error);
        }

        // Always clear local state and storage regardless of Supabase response
        localStorage.removeItem("userRole"); // Clear cached role
        for (const key of Object.keys(localStorage)) {
            if (key.startsWith('sb-') && key.includes('-auth')) {
                localStorage.removeItem(key);
            }
        }

        setUser(null);
        setSession(null);
        setUserRole(null);

        // Redirect to homepage
        console.log("Redirecting to /");
        window.location.href = "/";
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, userRole, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
