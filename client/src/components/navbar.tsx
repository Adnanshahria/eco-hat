import { useState } from "react";
import { Link } from "wouter";
import {
    Menu, X, Search, ShoppingBag, Leaf, User as UserIcon, LogOut, LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { NotificationCenter } from "./notifications";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavBarProps {
    onSearch?: (query: string) => void;
}

export function NavBar({ onSearch }: NavBarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const { user, signOut } = useAuth(); // Get signOut

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (onSearch) onSearch(query);
    };

    return (
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 lg:h-20">
                    <Link href="/" className="flex items-center gap-3">
                        <img src={import.meta.env.BASE_URL + "logo-en.png"} alt="EcoHaat" className="h-14 lg:h-16 w-auto" />
                    </Link>

                    <nav className="hidden lg:flex items-center gap-6">
                        <Link href="/shop" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">Shop</Link>
                        <a href={`${import.meta.env.BASE_URL}#categories`} className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">Categories</a>
                        <a href={`${import.meta.env.BASE_URL}#contact`} className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">Contact Us</a>
                    </nav>

                    <div className="hidden md:flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search eco products..."
                                className="pl-10 w-64 bg-muted/50 border-0 focus-visible:ring-primary/30"
                                value={searchQuery}
                                onChange={handleSearch}
                            />
                        </div>

                        {user && <NotificationCenter />}

                        <Link href="/shop/cart">
                            <Button variant="ghost" size="icon" className="relative">
                                <ShoppingBag className="h-5 w-5" />
                                {/* Cart Badge - can be connected to context */}
                                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                                    3
                                </span>
                            </Button>
                        </Link>

                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10">
                                        <UserIcon className="h-4 w-4" />
                                        <span className="hidden lg:inline">{user.email?.split('@')[0]}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <Link href={user.role === 'admin' ? "/admin" : user.role === 'seller' ? "/seller" : "/profile"}>
                                        <DropdownMenuItem className="cursor-pointer">
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            <span>{user.role === 'admin' ? "Admin Panel" : user.role === 'seller' ? "Seller Dashboard" : "Profile"}</span>
                                        </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-destructive focus:text-destructive">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Link href="/auth">
                                <Button className="bg-primary hover:bg-primary/90 font-display font-medium">
                                    Sign In
                                </Button>
                            </Link>
                        )}
                    </div>

                    <button
                        className="lg:hidden p-2"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {mobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:hidden border-t border-border bg-background p-4"
                >
                    <div className="flex flex-col gap-4">
                        <Input
                            type="search"
                            placeholder="Search eco products..."
                            className="bg-muted/50 touch-target"
                        />
                        <Link href="/shop" className="py-3 font-medium touch-manipulation touch-target flex items-center">Shop</Link>
                        <a href={`${import.meta.env.BASE_URL}#categories`} className="py-3 font-medium touch-manipulation touch-target flex items-center">Categories</a>
                        <a href={`${import.meta.env.BASE_URL}#contact`} className="py-3 font-medium touch-manipulation touch-target flex items-center">Contact Us</a>
                        {user && (
                            <div className="py-2 flex items-center justify-between">
                                <span className="font-medium">Notifications</span>
                                <NotificationCenter />
                            </div>
                        )}
                        {user ? (
                            <>
                                <Link href={user.role === 'admin' ? "/admin" : user.role === 'seller' ? "/seller" : "/profile"}>
                                    <Button className="w-full bg-primary mb-2">
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        {user.role === 'admin' ? "Admin Panel" : user.role === 'seller' ? "Dashboard" : "Profile"}
                                    </Button>
                                </Link>
                                <Button variant="outline" className="w-full text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => signOut()}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log out
                                </Button>
                            </>
                        ) : (
                            <Link href="/auth"><Button className="w-full bg-primary">Sign In</Button></Link>
                        )}
                    </div>
                </motion.div>
            )}
        </header>
    );
}
