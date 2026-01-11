import { ReactNode } from "react";
import { AppLink as Link } from "@/components/app-link";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import {
    Shield, ShoppingCart, Users, Package, LogOut, Menu, X
} from "lucide-react";
import { useState } from "react";

interface AdminLayoutProps {
    children: ReactNode;
    title: string;
}

const navItems = [
    { href: "/admin/sellers", label: "Seller Verifications", icon: Shield },
    { href: "/admin/products", label: "Product Verifications", icon: Package },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/orders", label: "Order Tracking", icon: ShoppingCart },
];

export default function AdminLayout({ children, title }: AdminLayoutProps) {
    const [location] = useLocation();
    const { signOut } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-card px-6 pb-4">
                    <div className="flex h-16 shrink-0 items-center gap-2">
                        <Shield className="h-6 w-6 text-primary" />
                        <span className="font-bold text-lg">Admin Panel</span>
                    </div>
                    <nav className="flex flex-1 flex-col">
                        <ul className="flex flex-1 flex-col gap-y-1">
                            {navItems.map((item) => {
                                const isActive = location === item.href || location.startsWith(item.href);
                                return (
                                    <li key={item.href}>
                                        <Link href={item.href}>
                                            <div className={`group flex gap-x-3 rounded-lg p-3 text-sm font-medium transition-colors cursor-pointer ${isActive
                                                    ? "bg-primary text-primary-foreground"
                                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                }`}>
                                                <item.icon className="h-5 w-5 shrink-0" />
                                                {item.label}
                                            </div>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                        <Link href="/shop">
                            <Button variant="outline" className="w-full justify-start gap-2 mb-2">
                                <ShoppingCart className="h-4 w-4" /> Back to Shop
                            </Button>
                        </Link>
                        <Button variant="ghost" onClick={signOut} className="justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </Button>
                    </nav>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="sticky top-0 z-40 flex items-center gap-x-4 border-b bg-card px-4 py-4 lg:hidden">
                <button onClick={() => setMobileOpen(true)} className="lg:hidden">
                    <Menu className="h-6 w-6" />
                </button>
                <div className="flex-1 text-sm font-semibold">{title}</div>
            </div>

            {/* Mobile Sidebar */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
                    <div className="fixed inset-y-0 left-0 w-64 bg-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <span className="font-bold text-lg flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" /> Admin Panel
                            </span>
                            <button onClick={() => setMobileOpen(false)}><X className="h-5 w-5" /></button>
                        </div>
                        <nav className="space-y-1">
                            {navItems.map((item) => {
                                const isActive = location === item.href;
                                return (
                                    <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                                        <div className={`flex items-center gap-3 rounded-lg p-3 text-sm font-medium ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                                            }`}>
                                            <item.icon className="h-5 w-5" />
                                            {item.label}
                                        </div>
                                    </Link>
                                );
                            })}
                        </nav>
                        <Button variant="ghost" onClick={signOut} className="mt-6 w-full justify-start gap-2 text-destructive">
                            <LogOut className="h-4 w-4" /> Sign Out
                        </Button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="lg:pl-64">
                <div className="px-4 py-6 lg:px-8">
                    <h1 className="text-2xl font-bold mb-6 hidden lg:block">{title}</h1>
                    {children}
                </div>
            </main>
        </div>
    );
}
