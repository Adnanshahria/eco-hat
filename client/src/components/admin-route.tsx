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
            if (authLoading) return;

            if (!user?.email) {
                // Not logged in
                setLocation("/auth");
                return;
            }

            try {
                // Check user role in database
                const { data, error } = await supabase
                    .from("users")
                    .select("role, is_super_admin")
                    .eq("email", user.email)
                    .single();

                if (error || !data) {
                    console.error("Admin check failed:", error);
                    setIsAuthorized(false);
                    return;
                }

                // Check authorization
                if (data.role === "admin" || data.is_super_admin) {
                    setIsAuthorized(true);
                } else {
                    setIsAuthorized(false);
                }
            } catch (err) {
                console.error("Admin route error:", err);
                setIsAuthorized(false);
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
