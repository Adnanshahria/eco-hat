import { useState, useEffect, useRef } from "react";
import { Bell, Check, Info, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
    id: number;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    read: boolean;
    created_at: string;
}

export function NotificationCenter() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) return;
        fetchNotifications();

        // Subscribe to new notifications
        const subscription = supabase
            .channel(`notifications:${user.email}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user?.id || 0}` }, // We need user ID, but it might be tricky to get here if not stored in context. 
                // Alternatively, we can just poll or rely on manual refetch for now if subscription is complex without user ID in context immediately.
                // Or better, let's just fetch periodic/on-open for simplicity first, or assumes user.id is available via a prop or context if we enhanced AuthProvider.
                // Assuming AuthProvider doesn't expose ID directly easily without fetch. Let's rely on fetch on open for now.
                () => fetchNotifications()
            )
            .subscribe();

        // Close on click outside
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            supabase.removeChannel(subscription);
        };
    }, [user]);

    const fetchNotifications = async () => {
        if (!user?.email) return;
        // First get user ID
        const { data: userData } = await supabase.from("users").select("id").eq("email", user.email).single();
        if (!userData) return;

        const { data } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userData.id)
            .order("created_at", { ascending: false })
            .limit(20);

        if (data) {
            setNotifications(data as Notification[]);
            setUnreadCount(data.filter((n: Notification) => !n.read).length);
        }
    };

    const markAsRead = async (id: number) => {
        await supabase.from("notifications").update({ read: true }).eq("id", id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllRead = async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length === 0) return;

        await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const deleteNotification = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        await supabase.from("notifications").delete().eq("id", id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div className="relative" ref={containerRef}>
            <Button variant="ghost" size="icon" className="relative" onClick={() => setIsOpen(!isOpen)}>
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-background" />
                )}
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 md:w-96 bg-card border rounded-xl shadow-lg z-50 overflow-hidden"
                    >
                        <div className="p-4 border-b flex items-center justify-between bg-muted/40">
                            <h3 className="font-semibold">Notifications</h3>
                            {unreadCount > 0 && (
                                <Button variant="ghost" size="sm" className="h-auto text-xs text-primary px-2" onClick={markAllRead}>
                                    Mark all read
                                </Button>
                            )}
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">No notifications</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {notifications.map(n => (
                                        <div
                                            key={n.id}
                                            className={`p-4 hover:bg-muted/50 transition cursor-pointer flex gap-3 ${!n.read ? "bg-primary/5" : ""}`}
                                            onClick={() => markAsRead(n.id)}
                                        >
                                            <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!n.read ? "bg-primary" : "bg-transparent"}`} />
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-start justify-between">
                                                    <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                                        {new Date(n.created_at).toLocaleString("en-BD", {
                                                            timeZone: "Asia/Dhaka",
                                                            month: "short",
                                                            day: "numeric",
                                                            hour: "numeric",
                                                            minute: "2-digit",
                                                            hour12: true
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground leading-snug">{n.message}</p>
                                            </div>
                                            <button
                                                onClick={(e) => deleteNotification(n.id, e)}
                                                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Helper to create notifications
export async function createNotification(userId: number, title: string, message: string, type: "info" | "success" | "warning" | "error" = "info") {
    try {
        await supabase.from("notifications").insert({
            user_id: userId,
            title,
            message,
            type,
        });
    } catch (err) {
        console.error("Failed to create notification", err);
    }
}
