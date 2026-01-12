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

    const fetchUserRole = async (email: string, isMounted: () => boolean, retryCount = 0, forceRefresh = false) => {
        const cachedRole = localStorage.getItem("userRole");

        // Only use cached role if NOT force refresh and we have a cached value
        if (cachedRole && retryCount === 0 && !forceRefresh) {
            setUserRole(cachedRole);
        }

        try {
            // Check localStorage again - concurrent registration might have set it while we were waiting
            const warmRole = localStorage.getItem("userRole");
            if (warmRole && !userRole) {
                setUserRole(warmRole);
            }

            // Fetch fresh role from database using maybeSingle() to avoid 406 errors
            const queryPromise = supabase.from("users").select("role").eq("email", email).maybeSingle();
            const timeoutPromise = new Promise<{ data: null; error: { code: string; message: string }; status: number }>((resolve) =>
                setTimeout(() => resolve({ data: null, error: { code: "TIMEOUT", message: "Query timeout" }, status: 408 }), 8000)
            );

            const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
            if (!isMounted()) return;

            if (data && data.role) {
                // ALWAYS update with fresh role from database
                setUserRole(data.role);
                localStorage.setItem("userRole", data.role);
                console.log("Role fetched from DB:", data.role);
            } else if (!data || (error && (error as any).code === "PGRST116")) {
                // User doesn't exist in DB yet or query failed gracefully
                console.log("User not found in DB, retrying... Attempt:", retryCount + 1);

                // Check localStorage one more time before deciding to retry
                const lateRole = localStorage.getItem("userRole");
                if (lateRole) {
                    setUserRole(lateRole);
                    return;
                }

                if (retryCount < 8) { // Increased retries to ~8 seconds
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    if (isMounted()) {
                        return fetchUserRole(email, isMounted, retryCount + 1, forceRefresh);
                    }
                } else {
                    // After retries, clear cache and set null
                    localStorage.removeItem("userRole");
                    setUserRole(null);
                }
            } else if (error) {
                console.warn("Error fetching role:", error);
                if (!cachedRole) setUserRole(null);
            }
        } catch (err) {
            console.error("Role fetch exception:", err);
            if (isMounted() && !cachedRole) setUserRole(null);
        }
    };

    useEffect(() => {
        let mounted = true;
        const isMounted = () => mounted;

        // Check active sessions and sets the user
        supabase.auth.getSession().then(async ({ data: { session }, error }) => {
            if (!mounted) return;

            // Handle invalid refresh token error
            if (error) {
                console.warn("Session error:", error.message);
                if (error.message?.includes("Refresh Token") || error.message?.includes("refresh_token")) {
                    console.log("🔄 Invalid refresh token detected. Clearing session...");
                    // Clear corrupted auth data from localStorage
                    for (const key of Object.keys(localStorage)) {
                        if (key.startsWith('sb-') && key.includes('-auth')) {
                            localStorage.removeItem(key);
                        }
                    }
                    localStorage.removeItem("userRole");
                    setSession(null);
                    setUser(null);
                    setUserRole(null);
                    if (mounted) setLoading(false);
                    return;
                }
            }

            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user?.email) {
                await fetchUserRole(session.user.email, isMounted);
            }
            if (mounted) setLoading(false);
        }).catch((err) => {
            console.error("GetSession failed:", err);
            // Clear potentially corrupted session on any auth error
            for (const key of Object.keys(localStorage)) {
                if (key.startsWith('sb-') && key.includes('-auth')) {
                    localStorage.removeItem(key);
                }
            }
            localStorage.removeItem("userRole");
            setSession(null);
            setUser(null);
            setUserRole(null);
            if (mounted) setLoading(false);
        });

        // Listen for changes on auth state (logged in, signed out, etc.)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            // Handle token refresh failure
            if (event === 'TOKEN_REFRESHED' && !session) {
                console.log("🔄 Token refresh failed. Clearing session...");
                for (const key of Object.keys(localStorage)) {
                    if (key.startsWith('sb-') && key.includes('-auth')) {
                        localStorage.removeItem(key);
                    }
                }
                localStorage.removeItem("userRole");
                setSession(null);
                setUser(null);
                setUserRole(null);
                if (mounted) setLoading(false);
                return;
            }

            // Handle sign out
            if (event === 'SIGNED_OUT') {
                setSession(null);
                setUser(null);
                setUserRole(null);
                localStorage.removeItem("userRole");
                if (mounted) setLoading(false);
                return;
            }

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
