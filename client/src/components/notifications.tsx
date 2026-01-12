import { useState, useEffect, useRef } from "react";
import { Bell, X, Loader2 } from "lucide-react";
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
    const [loading, setLoading] = useState(true);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) return;
        fetchNotifications();

        const subscription = supabase
            .channel(`notifications:${user.email}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user?.id || 0}` },
                () => fetchNotifications()
            )
            .subscribe();

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
        setLoading(true);
        const { data: userData } = await supabase.from("users").select("id").eq("email", user.email).single();
        if (!userData) { setLoading(false); return; }

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
        setLoading(false);
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

    const openNotification = async (notif: Notification) => {
        if (!notif.read) {
            await markAsRead(notif.id);
        }
        setSelectedNotification(notif);
    };

    const formatTime = (createdAt: string) => {
        const date = new Date(createdAt);
        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "success": return <div className="h-2 w-2 rounded-full bg-green-500" />;
            case "warning": return <div className="h-2 w-2 rounded-full bg-yellow-500" />;
            case "error": return <div className="h-2 w-2 rounded-full bg-red-500" />;
            default: return <div className="h-2 w-2 rounded-full bg-blue-500" />;
        }
    };

    return (
        <>
            <div className="relative" ref={containerRef}>
                <Button variant="ghost" size="icon" className="relative border border-border rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-all" onClick={() => setIsOpen(!isOpen)}>
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-background" />
                    )}
                </Button>

                <AnimatePresence>
                    {isOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-40 bg-background/5 backdrop-blur-sm"
                                onClick={() => setIsOpen(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="fixed left-4 right-4 top-20 md:absolute md:left-auto md:right-0 md:top-auto md:mt-2 md:w-96 bg-card border rounded-xl shadow-lg z-50 overflow-hidden"
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
                                    {loading ? (
                                        <div className="p-8 text-center">
                                            <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" />
                                            <p className="text-sm text-muted-foreground mt-2">Loading...</p>
                                        </div>
                                    ) : notifications.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground">
                                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                            <p className="text-sm">No notifications</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y">
                                            {notifications.map(n => (
                                                <div
                                                    key={n.id}
                                                    className={`p-4 hover:bg-muted/50 cursor-pointer flex gap-3 transition ${!n.read ? "bg-primary/5" : ""}`}
                                                    onClick={() => openNotification(n)}
                                                >
                                                    <div className="mt-2">{getTypeIcon(n.type)}</div>
                                                    <div className="flex-1 space-y-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                                                                {formatTime(n.created_at)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                                            {n.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* Notification Detail Modal */}
            <AnimatePresence>
                {selectedNotification && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
                            onClick={() => setSelectedNotification(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-4 right-4 top-1/2 -translate-y-1/2 md:left-1/2 md:-translate-x-1/2 md:w-[480px] z-[70] bg-card border rounded-xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-4 border-b bg-muted/40 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {getTypeIcon(selectedNotification.type)}
                                    <h3 className="font-semibold">{selectedNotification.title}</h3>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedNotification(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="p-4">
                                <p className="text-sm text-muted-foreground mb-3">
                                    {formatTime(selectedNotification.created_at)}
                                </p>
                                <p className="text-sm whitespace-pre-wrap">{selectedNotification.message}</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
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
