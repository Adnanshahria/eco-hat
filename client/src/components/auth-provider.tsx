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

    const fetchUserRole = async (email: string, isMounted: () => boolean) => {
        try {
            const { data, error } = await supabase.from("users").select("role").eq("email", email).single();
            if (!isMounted()) return;

            if (data) {
                setUserRole(data.role);
            } else if (error && error.code === "PGRST116") {
                // User doesn't exist in table - create one (self-healing for Auth-only users)
                const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
                const userId = `USR-${dateStr}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;

                const { data: created } = await supabase.from("users").insert({
                    user_id: userId,
                    username: email.split("@")[0],
                    full_name: email.split("@")[0],
                    email: email,
                    role: "buyer",
                    saved_addresses: []
                }).select("role").single();

                if (!isMounted()) return;
                if (created) setUserRole(created.role);
                else setUserRole("buyer"); // Default fallback
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
            setUser(null);
            setSession(null);
            setUserRole(null);
        } catch (error) {
            console.error("Sign out error:", error);
        }
        // Always reload to homepage after sign out
        window.location.href = window.location.origin + (import.meta.env.BASE_URL || '/');
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
