import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  Droplets,
  Facebook,
  Heart,
  HelpCircle,
  Instagram,
  Leaf,
  Mail,
  MapPin,
  Menu,
  Package,
  Phone,
  Recycle,
  Search,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Star,
  Sun,
  TreeDeciduous,
  Truck,
  Twitter,
  Users,
  X
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLink as Link } from "@/components/app-link";
import { NavBar } from "@/components/navbar";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const categories = [
  { id: 1, name: "categories.household", icon: TreeDeciduous, count: 45, color: "bg-emerald-100 text-emerald-700" },
  { id: 2, name: "categories.personalCare", icon: Droplets, count: 32, color: "bg-teal-100 text-teal-700" },
  { id: 3, name: "categories.kitchen", icon: Leaf, count: 28, color: "bg-lime-100 text-lime-700" },
  { id: 4, name: "categories.kidsBaby", icon: Heart, count: 19, color: "bg-green-100 text-green-700" },
  { id: 5, name: "categories.reusables", icon: Recycle, count: 56, color: "bg-emerald-100 text-emerald-700" },
  { id: 6, name: "categories.garden", icon: Sun, count: 24, color: "bg-yellow-100 text-yellow-700" },
];

const featuredProducts = [
  { id: 1, name: "product.items.bambooToothbrush", price: 250, originalPrice: 350, rating: 4.8, reviews: 124, image: "🎋", tag: "product.tags.bestSeller" },
  { id: 2, name: "product.items.cottonBag", price: 180, originalPrice: null, rating: 4.9, reviews: 89, image: "👜", tag: "product.tags.new" },
  { id: 3, name: "product.items.soapBar", price: 120, originalPrice: 150, rating: 4.7, reviews: 203, image: "🧼", tag: "product.tags.popular" },
  { id: 4, name: "product.items.juteBasket", price: 450, originalPrice: 550, rating: 4.6, reviews: 67, image: "🧺", tag: null },
  { id: 5, name: "product.items.coconutBowl", price: 380, originalPrice: null, rating: 4.8, reviews: 156, image: "🥥", tag: "product.tags.trending" },
  { id: 6, name: "product.items.tissues", price: 95, originalPrice: 120, rating: 4.5, reviews: 312, image: "🧻", tag: null },
];

const testimonials = [
  { id: 1, name: "Fatima Rahman", location: "Dhaka", text: "testimonials.t1", avatar: "👩" },
  { id: 2, name: "Kamal Hossain", location: "Chittagong", text: "testimonials.t2", avatar: "👨" },
  { id: 3, name: "Nusrat Jahan", location: "Sylhet", text: "testimonials.t3", avatar: "👩‍👧" },
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeMsg, setSubscribeMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const { t } = useLanguage();

  const handleSubscribe = async () => {
    if (!email.trim() || !email.includes("@")) {
      setSubscribeMsg({ ok: false, text: t('landing.validEmail') });
      return;
    }
    setSubscribing(true);
    setSubscribeMsg(null);
    try {
      const { error } = await supabase.from("subscribers").insert({ email: email.trim().toLowerCase() });
      if (error) {
        if (error.code === "23505") {
          setSubscribeMsg({ ok: false, text: t('landing.alreadySubscribed') });
        } else {
          setSubscribeMsg({ ok: false, text: t('landing.subscribeError') });
        }
      } else {
        setSubscribeMsg({ ok: true, text: t('landing.subscribeSuccess') });
        setEmail("");
      }
    } catch {
      setSubscribeMsg({ ok: false, text: t('landing.subscribeError') });
    }
    setSubscribing(false);
  };

  return (
    <div className="min-h-screen bg-grass-pattern grain-texture scroll-smooth-mobile safe-area-insets">
      <NavBar />

      <section className="relative overflow-hidden bg-gradient-natural leaf-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left frosted-glass rounded-2xl p-4 lg:p-6 hover:border-primary/30 transition-colors"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
                <Leaf className="h-4 w-4" />
                {t('landing.freshOrganic')}
              </span>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
                <span className="text-gradient-green">{t('landing.heroTitle')}</span>
              </h1>
              <p className="text-base text-muted-foreground mb-6 max-w-lg mx-auto lg:mx-0">
                {t('landing.heroSubtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-center lg:items-start">
                <Link href="/shop">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 font-display font-semibold text-base px-8 w-full sm:w-auto" data-testid="button-shop-now">
                    {t('landing.shopNow')}
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href={`${import.meta.env.BASE_URL}#contact`}>
                  <Button size="lg" variant="outline" className="font-display font-medium text-base w-full sm:w-auto" data-testid="button-learn-more">
                    {t('landing.learnMore')}
                  </Button>
                </a>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-6 pt-4 sm:pt-6 border-t border-border/50">
                <div className="border border-border rounded-lg p-3 sm:p-4 text-center hover:border-primary/30 transition-colors">
                  <p className="text-xl sm:text-2xl font-bold font-display text-primary">500+</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('landing.stats.ecoProducts')}</p>
                </div>
                <div className="border border-border rounded-lg p-3 sm:p-4 text-center hover:border-primary/30 transition-colors">
                  <p className="text-xl sm:text-2xl font-bold font-display text-primary">50+</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('landing.stats.localBrands')}</p>
                </div>
                <div className="border border-border rounded-lg p-3 sm:p-4 text-center hover:border-primary/30 transition-colors">
                  <p className="text-xl sm:text-2xl font-bold font-display text-primary">10K+</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('landing.stats.happyCustomers')}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                <div className="absolute inset-0 bg-gradient-leaf rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute inset-8 bg-card rounded-3xl shadow-2xl overflow-hidden border border-card-border">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="text-8xl mb-4">🌿</div>
                      <p className="font-display text-xl font-semibold text-primary">{t('landing.ecoLiving')}</p>
                      <p className="text-sm text-muted-foreground mt-2">{t('landing.startsHere')}</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-4 bg-card rounded-2xl shadow-xl p-4 border border-card-border">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Recycle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t('landing.plasticFree')}</p>
                      <p className="text-xs text-muted-foreground">{t('landing.guaranteed')}</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-card rounded-2xl shadow-xl p-4 border border-card-border">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Heart className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t('landing.madeInBD')}</p>
                      <p className="text-xs text-muted-foreground">{t('landing.localArtisans')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="categories" className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Overall Boxy Container */}
          <div className="frosted-glass rounded-2xl p-6 lg:p-10 hover:border-primary/30 transition-colors">
            <div className="text-center mb-10">
              <h2 className="font-display text-3xl lg:text-4xl font-bold mb-3">{t('landing.categories')}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t('landing.heroSubtitle')}
              </p>
            </div>
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="group cursor-pointer touch-manipulation"
                  data-testid={`card-category-${category.id}`}
                >
                  <div className="bg-card rounded-xl p-3 sm:p-4 lg:p-5 border border-card-border hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                    <div className={`h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-lg ${category.color} flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform`}>
                      <category.icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
                    </div>
                    <h3 className="font-display font-semibold text-xs sm:text-sm lg:text-base mb-0.5">{t(category.name)}</h3>
                    <p className="text-xs text-muted-foreground">{category.count} {t('nav.products').toLowerCase()}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Overall Boxy Container */}
          <div className="frosted-glass rounded-2xl p-6 lg:p-10 hover:border-primary/30 transition-colors">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10">
              <div>
                <h2 className="font-display text-3xl lg:text-4xl font-bold mb-2">{t('landing.featuredProducts')}</h2>
                <p className="text-muted-foreground">{t('landing.heroSubtitle')}</p>
              </div>
              <Button variant="outline" className="mt-4 md:mt-0 border-border hover:border-primary/30" data-testid="button-view-all">
                View All Products
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="group touch-manipulation"
                  data-testid={`card-product-${product.id}`}
                >
                  <div className="bg-card rounded-xl overflow-hidden border border-card-border hover:shadow-lg transition-all duration-300">
                    <div className="relative aspect-square bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      <span className="text-2xl sm:text-3xl lg:text-4xl group-hover:scale-110 transition-transform duration-300">{product.image}</span>
                      {product.tag && (
                        <span className="absolute top-1 left-1 sm:top-2 sm:left-2 px-1.5 sm:px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[8px] sm:text-[10px] font-semibold">
                          {product.tag}
                        </span>
                      )}
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-wishlist-${product.id}`}
                      >
                        <Heart className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="p-2 sm:p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium">{product.rating}</span>
                      </div>
                      <h3 className="font-medium text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                        {t(product.name)}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-bold text-primary">৳{product.price}</span>
                          {product.originalPrice && (
                            <span className="text-xs text-muted-foreground line-through ml-1">৳{product.originalPrice}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section id="our-story" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Overall Boxy Container - includes header, story, and mission */}
          <div className="frosted-glass rounded-2xl p-6 lg:p-10 mb-16 hover:border-primary/30 transition-colors">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10 lg:mb-12"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-4">
                <Heart className="h-4 w-4" />
                {t('landing.ourStory.title')}
              </span>
              <h2 className="font-display text-3xl lg:text-5xl font-bold">{t('landing.ourStory.subtitle')}</h2>
            </motion.div>

            {/* Story Content */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <p className="text-lg text-foreground/80 leading-relaxed">
                  {t('landing.ourStory.para1')}
                </p>
                <p className="text-foreground/70 leading-relaxed">
                  {t('landing.ourStory.para2')}
                </p>
                <p className="text-foreground/70 leading-relaxed">
                  {t('landing.ourStory.para3')}
                </p>
                <p className="text-foreground/80 font-medium leading-relaxed">
                  {t('landing.ourStory.para4')}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 lg:p-8 border border-primary/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-full bg-primary/20">
                    <Leaf className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display text-2xl font-bold">{t('landing.ourStory.mission')}</h3>
                </div>
                <p className="text-lg text-foreground/80 leading-relaxed italic">
                  "{t('landing.ourStory.missionText')}"
                </p>
              </motion.div>
            </div>
          </div>

          {/* Values - Overall Boxy Container */}
          <div className="frosted-glass rounded-2xl p-6 lg:p-10 hover:border-primary/30 transition-colors">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h3 className="font-display text-2xl lg:text-3xl font-bold">{t('landing.ourStory.values.title')}</h3>
            </motion.div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
              {/* Box 1: Authenticity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-card border border-card-border rounded-xl p-3 sm:p-4 lg:p-6 hover:shadow-lg hover:border-primary/30 transition-all group"
              >
                <div className="p-2 sm:p-3 lg:p-4 rounded-xl bg-emerald-100 text-emerald-600 w-fit mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
                </div>
                <h4 className="font-display text-sm sm:text-base lg:text-xl font-bold mb-1 sm:mb-2">{t('landing.ourStory.values.authenticity')}</h4>
                <p className="text-muted-foreground text-xs sm:text-sm lg:text-base leading-relaxed">{t('landing.ourStory.values.authenticityDesc')}</p>
              </motion.div>

              {/* Box 2: Community */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-card-border rounded-xl p-3 sm:p-4 lg:p-6 hover:shadow-lg hover:border-primary/30 transition-all group"
              >
                <div className="p-2 sm:p-3 lg:p-4 rounded-xl bg-blue-100 text-blue-600 w-fit mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
                </div>
                <h4 className="font-display text-sm sm:text-base lg:text-xl font-bold mb-1 sm:mb-2">{t('landing.ourStory.values.community')}</h4>
                <p className="text-muted-foreground text-xs sm:text-sm lg:text-base leading-relaxed">{t('landing.ourStory.values.communityDesc')}</p>
              </motion.div>

              {/* Box 3: Planet Friendly */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="bg-card border border-card-border rounded-xl p-3 sm:p-4 lg:p-6 hover:shadow-lg hover:border-primary/30 transition-all group"
              >
                <div className="p-2 sm:p-3 lg:p-4 rounded-xl bg-green-100 text-green-600 w-fit mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                  <Recycle className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
                </div>
                <h4 className="font-display text-sm sm:text-base lg:text-xl font-bold mb-1 sm:mb-2">{t('landing.ourStory.values.planet')}</h4>
                <p className="text-muted-foreground text-xs sm:text-sm lg:text-base leading-relaxed">{t('landing.ourStory.values.planetDesc')}</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Overall Boxy Container */}
          <div className="frosted-glass rounded-2xl p-6 lg:p-10 hover:border-primary/30 transition-colors">
            <div className="text-center mb-10">
              <h2 className="font-display text-3xl lg:text-4xl font-bold mb-3">{t('landing.meetTeam')}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t('landing.meetTeamDesc')}
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {/* Founder */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card p-6 rounded-2xl border border-card-border text-center hover:shadow-lg transition-shadow">
                <div className="h-24 w-24 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-display font-bold text-lg">Abdur Rahman Talha</h3>
                <p className="text-primary font-medium text-sm mb-3">{t('team.founder')}</p>
                <a href="https://wa.me/8801909306441" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                  WhatsApp
                </a>
              </motion.div>

              {/* Co-founder & CEO */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-card p-6 rounded-2xl border border-card-border text-center hover:shadow-lg transition-shadow">
                <div className="h-24 w-24 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Shield className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-display font-bold text-lg">Azmine Tasik</h3>
                <p className="text-primary font-medium text-sm mb-3">{t('team.ceo')}</p>
                <a href="https://wa.me/8801985011806" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                  WhatsApp
                </a>
              </motion.div>

              {/* CTO */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-card p-3 sm:p-4 lg:p-6 rounded-xl border border-card-border text-center hover:shadow-lg transition-shadow relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="absolute top-3 right-3 p-1 rounded-full bg-muted hover:bg-primary/20 text-primary/70 hover:text-primary transition-colors">
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto max-w-[200px] p-3 text-sm">
                    <p>{t('team.ctoDesc')}</p>
                  </PopoverContent>
                </Popover>

                <div className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 bg-primary/10 rounded-full mx-auto mb-2 sm:mb-3 lg:mb-4 flex items-center justify-center">
                  <TreeDeciduous className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-primary" />
                </div>
                <h3 className="font-display font-bold text-sm sm:text-base lg:text-lg">Muhammad Nisar Uddin</h3>
                <p className="text-primary font-medium text-xs sm:text-sm mb-2 sm:mb-3">{t('team.cto')}</p>
                <a href="https://wa.me/8801852903417" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                  WhatsApp
                </a>
              </motion.div>

              {/* Technical Foundation */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="bg-card p-3 sm:p-4 lg:p-6 rounded-xl border border-card-border text-center hover:shadow-lg transition-shadow relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="absolute top-3 right-3 p-1 rounded-full bg-muted hover:bg-primary/20 text-primary/70 hover:text-primary transition-colors">
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto max-w-[200px] p-3 text-sm">
                    <p>{t('team.leadDesc')}</p>
                  </PopoverContent>
                </Popover>

                <div className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 bg-primary/10 rounded-full mx-auto mb-2 sm:mb-3 lg:mb-4 flex items-center justify-center">
                  <Leaf className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-primary" />
                </div>
                <h3 className="font-display font-bold text-sm sm:text-base lg:text-lg">Adnan Shahria</h3>
                <p className="text-primary font-medium text-xs sm:text-sm">{t('team.techMgmt')}</p>
                <p className="text-muted-foreground text-[10px] sm:text-xs mb-2 sm:mb-3">{t('team.devOps')}</p>
                <a href="https://wa.me/8801853452264" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                  WhatsApp
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Overall Boxy Container */}
          <div className="frosted-glass rounded-2xl p-6 lg:p-10 hover:border-primary/30 transition-colors">
            <div className="text-center mb-10">
              <h2 className="font-display text-3xl lg:text-4xl font-bold mb-3">{t('landing.testimonialsTitle')}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t('landing.testimonialsDesc')}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.15 }}
                  className="bg-card rounded-2xl p-6 border border-card-border touch-manipulation"
                  data-testid={`card-testimonial-${testimonial.id}`}
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-foreground/80 mb-6 leading-relaxed">"{t(testimonial.text)}"</p>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{testimonial.avatar}</span>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="frosted-glass rounded-3xl p-8 lg:p-12 shadow-xl">
            <Leaf className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="font-display text-3xl lg:text-4xl font-bold mb-4">{t('landing.joinMovement')}</h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              {t('landing.newsletterDesc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder={t('landing.enterEmail')}
                className="flex-1 bg-muted/50"
                data-testid="input-newsletter"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
              />
              <Button
                className="bg-primary hover:bg-primary/90 font-display font-medium"
                data-testid="button-subscribe"
                onClick={handleSubscribe}
                disabled={subscribing}
              >
                {subscribing ? t('landing.subscribing') : t('landing.subscribe')}
              </Button>
            </div>
            {subscribeMsg && (
              <p className={`text-sm mt-3 ${subscribeMsg.ok ? "text-green-600" : "text-red-600"}`}>
                {subscribeMsg.text}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              {t('landing.privacyNote')}
            </p>
          </div>
        </div>
      </section>

      <footer className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="frosted-glass rounded-2xl p-6 lg:p-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <Leaf className="h-8 w-8 text-primary" />
                  <span className="font-display text-xl font-bold">EcoHaat</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t('footer.desc')}
                </p>
              </div>
              {[
                {
                  title: t('footer.shop'),
                  links: [
                    { label: t('footer.allProducts'), href: "/shop" },
                    { label: t('footer.categories'), href: `${import.meta.env.BASE_URL}#categories` },
                  ]
                },
                {
                  title: t('footer.company'),
                  links: [
                    { label: t('footer.contactUs'), href: `${import.meta.env.BASE_URL}#contact` },
                    { label: t('footer.team'), href: `${import.meta.env.BASE_URL}#contact` },
                  ]
                },
              ].map((section) => (
                <div key={section.title}>
                  <h4 className="font-display font-semibold mb-4">{section.title}</h4>
                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        {link.href.startsWith("/") && !link.href.includes("#") ? (
                          <Link href={link.href} className="text-muted-foreground hover:text-primary text-sm transition-colors cursor-pointer">
                            {link.label}
                          </Link>
                        ) : (
                          <a href={link.href} className="text-muted-foreground hover:text-primary text-sm transition-colors">
                            {link.label}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-muted-foreground text-sm">
                {t('footer.copyright')}
              </p>
              <div className="flex items-center gap-4">
                <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary text-sm">{t('footer.privacyPolicy')}</Link>
                <Link href="/terms-of-service" className="text-muted-foreground hover:text-primary text-sm">{t('footer.termsOfService')}</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
