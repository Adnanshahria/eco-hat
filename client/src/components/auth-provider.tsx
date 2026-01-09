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
    const [userRole, setUserRole] = useState<string | null>(null);

    const fetchUserRole = async (email: string, isMounted: () => boolean, retryCount = 0) => {
        try {
            const { data, error } = await supabase.from("users").select("role").eq("email", email).single();
            if (!isMounted()) return;

            if (data) {
                console.log("User role fetched:", data.role);
                setUserRole(data.role);
            } else if (error && error.code === "PGRST116") {
                // User doesn't exist in table yet - this might be a race condition during registration
                // Retry a few times before falling back, as auth.tsx might still be creating the user
                if (retryCount < 3) {
                    console.log(`User not found, retrying in 500ms (attempt ${retryCount + 1}/3)...`);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    if (isMounted()) {
                        return fetchUserRole(email, isMounted, retryCount + 1);
                    }
                } else {
                    // After retries, default to buyer (user might need to complete registration)
                    console.log("User not found after retries, defaulting to buyer");
                    setUserRole("buyer");
                }
            } else if (error) {
                console.error("Error fetching user role:", error);
                setUserRole("buyer");
            }
        } catch (err) {
            console.error("Error fetching user role:", err);
            if (isMounted()) setUserRole("buyer");
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
            await supabase.auth.signOut();
            // Clear any local storage auth tokens manually as a fallback
            localStorage.removeItem(`sb-${import.meta.env.VITE_SUPABASE_URL?.split('//')[1].split('.')[0]}-auth-token`);
            // Also clear generic Supabase keys if any
            for (const key of Object.keys(localStorage)) {
                if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
                    localStorage.removeItem(key);
                }
            }

            setUser(null);
            setSession(null);
            setUserRole(null);
        } catch (error) {
            console.error("Sign out error:", error);
        }

        // Robust redirect to homepage
        const origin = window.location.origin;
        const base = import.meta.env.BASE_URL || '/';
        const target = origin + (base.endsWith('/') ? base : base + '/');

        console.log("Signing out and redirecting to:", target);
        window.location.href = target;
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
