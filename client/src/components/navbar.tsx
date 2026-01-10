import { useState } from "react";
import { AppLink as Link } from "@/components/app-link";
import {
    Menu, X, Search, ShoppingCart, Leaf, User as UserIcon, LogOut, LayoutDashboard, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { NotificationCenter } from "./notifications";
import { useCart } from "@/lib/cart-context";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n/LanguageContext";
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
    const { user, userRole, signOut } = useAuth();
    const { items } = useCart();
    const { t } = useLanguage();
    const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (onSearch) onSearch(query);
    };

    return (
        <header className="sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="frosted-glass rounded-2xl px-4 lg:px-6">
                    <div className="flex items-center justify-between h-16 lg:h-18">
                        <Link href="/" className="flex items-center gap-3 border border-border rounded-lg p-1 hover:border-primary/30 transition-all">
                            <img src={import.meta.env.BASE_URL + "logo-en.png"} alt="EcoHaat" className="h-12 lg:h-14 w-auto" />
                        </Link>

                        <nav className="hidden lg:flex items-center gap-2">
                            <Link href="/shop" className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-primary border border-border rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-all">{t('nav.products')}</Link>
                            <Link href="/track-order" className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-primary border border-border rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-all">{t('orders.trackOrder')}</Link>
                            <a href={`${import.meta.env.BASE_URL}#our-story`} className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-primary border border-border rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-all">{t('landing.whyChooseUs')}</a>
                        </nav>

                        <div className="hidden md:flex items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder={t('nav.search')}
                                    className="pl-10 w-64 bg-muted/50 border-0 focus-visible:ring-primary/30"
                                    value={searchQuery}
                                    onChange={handleSearch}
                                />
                            </div>

                            <div className="border border-border rounded-lg">
                                <LanguageSwitcher />
                            </div>

                            {user && <NotificationCenter />}

                            <Link href="/shop/cart">
                                <Button variant="ghost" size="icon" className="relative border border-border rounded-lg hover:border-primary/30 hover:bg-primary/5">
                                    <ShoppingCart className="h-5 w-5" />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                                            {cartCount > 99 ? '99+' : cartCount}
                                        </span>
                                    )}
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
                                        <DropdownMenuLabel>{t('nav.profile')}</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <Link href={
                                            userRole?.toLowerCase() === 'admin' ? "/admin"
                                                : userRole?.toLowerCase() === 'seller' || userRole?.toLowerCase() === 'uv-seller' ? "/seller"
                                                    : "/profile"
                                        }>
                                            <DropdownMenuItem className="cursor-pointer">
                                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                                <span>{
                                                    userRole?.toLowerCase() === 'admin' ? t('nav.adminDashboard')
                                                        : userRole?.toLowerCase() === 'seller' || userRole?.toLowerCase() === 'uv-seller' ? t('nav.sellerDashboard')
                                                            : t('nav.profile')
                                                }</span>
                                            </DropdownMenuItem>
                                        </Link>
                                        <Link href="/orders">
                                            <DropdownMenuItem className="cursor-pointer">
                                                <Package className="mr-2 h-4 w-4" />
                                                <span>{t('nav.orders')}</span>
                                            </DropdownMenuItem>
                                        </Link>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={() => { console.log("Logout clicked"); signOut(); }} className="cursor-pointer text-destructive focus:text-destructive">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>{t('nav.logout')}</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Link href="/auth">
                                    <Button className="bg-primary hover:bg-primary/90 font-display font-medium">
                                        {t('nav.login')}
                                    </Button>
                                </Link>
                            )}
                        </div>

                        <div className="lg:hidden flex items-center gap-1">
                            <button onClick={() => setMobileMenuOpen(true)} className="p-2 border border-border rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-all">
                                <Search className="h-5 w-5 text-muted-foreground" />
                            </button>

                            <Link href="/shop/cart">
                                <Button variant="ghost" size="icon" className="relative border border-border rounded-lg hover:border-primary/30 hover:bg-primary/5">
                                    <ShoppingCart className="h-5 w-5" />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
                                            {cartCount > 99 ? '99+' : cartCount}
                                        </span>
                                    )}
                                </Button>
                            </Link>

                            {user && <NotificationCenter />}

                            <div className="border border-border rounded-lg">
                                <LanguageSwitcher />
                            </div>

                            <button
                                className="p-2 border border-border rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-all"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {mobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:hidden border-t border-border bg-background p-4"
                >
                    <div className="flex flex-col gap-3">
                        <Input
                            type="search"
                            placeholder={t('nav.search')}
                            className="bg-muted/50 touch-target border border-border rounded-lg"
                        />

                        {/* Navigation Links */}
                        <Link href="/shop" className="py-3 px-4 font-medium touch-manipulation touch-target flex items-center rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all">{t('nav.products')}</Link>

                        <Link href="/track-order" className="py-3 px-4 font-medium touch-manipulation touch-target flex items-center rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all">{t('orders.trackOrder')}</Link>

                        <a href={`${import.meta.env.BASE_URL}#our-story`} className="py-3 px-4 font-medium touch-manipulation touch-target flex items-center rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all">{t('landing.whyChooseUs')}</a>

                        {/* Auth Section */}
                        {user ? (
                            <div className="space-y-3">
                                <Link href={
                                    userRole?.toLowerCase() === 'admin' ? "/admin"
                                        : userRole?.toLowerCase() === 'seller' || userRole?.toLowerCase() === 'uv-seller' ? "/seller"
                                            : "/profile"
                                }>
                                    <Button className="w-full bg-primary">
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        {userRole?.toLowerCase() === 'admin' ? t('nav.adminDashboard')
                                            : userRole?.toLowerCase() === 'seller' || userRole?.toLowerCase() === 'uv-seller' ? t('seller.dashboard')
                                                : t('nav.profile')}
                                    </Button>
                                </Link>
                                <Button variant="outline" className="w-full text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => signOut()}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    {t('nav.logout')}
                                </Button>
                            </div>
                        ) : (
                            <Link href="/auth"><Button className="w-full bg-primary">{t('nav.login')}</Button></Link>
                        )}
                    </div>
                </motion.div>
            )}
        </header>
    );
}

