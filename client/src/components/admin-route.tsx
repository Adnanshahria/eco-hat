import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export function AdminRoute({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const [, setLocation] = useLocation();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAdminStatus = async () => {
            console.log("AdminRoute: checkAdminStatus running", { authLoading, userEmail: user?.email });
            if (authLoading) return;

            if (!user?.email) {
                console.log("AdminRoute: No user, redirecting to auth");
                setLocation("/auth");
                return;
            }

            try {
                // Increased timeout to 15 seconds to handle slow connections
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Admin check timeout")), 15000)
                );

                // Check user role in database - using * since specific column select might be behaving differently
                const dbPromise = supabase
                    .from("users")
                    .select("*")
                    .eq("email", user.email)
                    .single();

                console.log("AdminRoute: Querying DB for admin status...");
                const { data, error } = await Promise.race([dbPromise, timeoutPromise]) as any;
                console.log("AdminRoute: DB result:", { data, error });

                if (error || !data) {
                    console.error("Admin check failed or no data:", error);
                    // On timeout or error, show loading instead of redirecting away
                    // This prevents logout on slow connections
                    return;
                }

                // Check authorization
                const isAdmin = data.role === "admin" || data.is_super_admin === true;
                console.log("AdminRoute: Is admin?", isAdmin);
                setIsAuthorized(isAdmin);

            } catch (err) {
                console.error("Admin route error:", err);
                // Don't set isAuthorized to false on timeout - just keep loading
                // This prevents logout on slow connections
            }
        };

        checkAdminStatus();
    }, [user, authLoading, setLocation]);

    // Show loading while checking auth or db status
    if (authLoading || isAuthorized === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Verifying access...</p>
                </div>
            </div>
        );
    }

    // Redirect if not authorized (and verified as such)
    if (!isAuthorized) {
        // We use a useEffect or return null and redirect.
        // Since we are inside the render flow, it's better to render a redirect message or use useEffect to redirect.
        // But for safety, let's just push them home if they see this.
        setTimeout(() => setLocation("/"), 0);
        return null;
    }

    return <>{children}</>;
}
