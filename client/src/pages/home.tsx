import { useState } from "react";
import { motion } from "framer-motion";
import {
  Leaf,
  Recycle,
  Heart,
  ShoppingBag,
  Search,
  Menu,
  X,
  TreeDeciduous,
  Droplets,
  Sun,
  ChevronRight,
  Star,
  Truck,
  Shield,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { NavBar } from "@/components/navbar";

const categories = [
  { id: 1, name: "Household", icon: TreeDeciduous, count: 45, color: "bg-emerald-100 text-emerald-700" },
  { id: 2, name: "Personal Care", icon: Droplets, count: 32, color: "bg-teal-100 text-teal-700" },
  { id: 3, name: "Kitchen", icon: Leaf, count: 28, color: "bg-lime-100 text-lime-700" },
  { id: 4, name: "Kids & Baby", icon: Heart, count: 19, color: "bg-green-100 text-green-700" },
  { id: 5, name: "Reusables", icon: Recycle, count: 56, color: "bg-emerald-100 text-emerald-700" },
  { id: 6, name: "Garden", icon: Sun, count: 24, color: "bg-yellow-100 text-yellow-700" },
];

const featuredProducts = [
  { id: 1, name: "Bamboo Toothbrush Set", price: 250, originalPrice: 350, rating: 4.8, reviews: 124, image: "🎋", tag: "Best Seller" },
  { id: 2, name: "Organic Cotton Bag", price: 180, originalPrice: null, rating: 4.9, reviews: 89, image: "👜", tag: "New" },
  { id: 3, name: "Natural Soap Bar", price: 120, originalPrice: 150, rating: 4.7, reviews: 203, image: "🧼", tag: "Popular" },
  { id: 4, name: "Jute Storage Basket", price: 450, originalPrice: 550, rating: 4.6, reviews: 67, image: "🧺", tag: null },
  { id: 5, name: "Coconut Bowl Set", price: 380, originalPrice: null, rating: 4.8, reviews: 156, image: "🥥", tag: "Trending" },
  { id: 6, name: "Eco Paper Tissues", price: 95, originalPrice: 120, rating: 4.5, reviews: 312, image: "🧻", tag: null },
];

const testimonials = [
  { id: 1, name: "Fatima Rahman", location: "Dhaka", text: "EcoHaat changed how I shop. Finally, a place where I can trust every product is truly eco-friendly!", avatar: "👩" },
  { id: 2, name: "Kamal Hossain", location: "Chittagong", text: "The quality is amazing and knowing I'm helping local artisans makes it even better.", avatar: "👨" },
  { id: 3, name: "Nusrat Jahan", location: "Sylhet", text: "My kids love the wooden toys! Safe, beautiful, and sustainable. Perfect!", avatar: "👩‍👧" },
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background grain-texture scroll-smooth-mobile safe-area-insets">
      <NavBar />

      <section className="relative overflow-hidden bg-gradient-natural leaf-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Leaf className="h-4 w-4" />
                100% Eco-Friendly Products
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                <span className="text-gradient-green">Sustainable</span> Products
                <br />
                <span className="text-foreground">for Everyday Life</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                Bangladesh's first curated eco-marketplace. Discover plastic-free,
                natural products from local artisans and ethical brands.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="~/shop">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 font-display font-semibold text-base px-8 w-full sm:w-auto" data-testid="button-shop-now">
                    Shop Now
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href={`${import.meta.env.BASE_URL}#contact`}>
                  <Button size="lg" variant="outline" className="font-display font-medium text-base w-full sm:w-auto" data-testid="button-learn-more">
                    Learn Our Story
                  </Button>
                </a>
              </div>
              <div className="flex items-center gap-8 mt-10 pt-8 border-t border-border/50">
                <div>
                  <p className="text-2xl font-bold font-display text-primary">500+</p>
                  <p className="text-sm text-muted-foreground">Eco Products</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-display text-primary">50+</p>
                  <p className="text-sm text-muted-foreground">Local Brands</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-display text-primary">10K+</p>
                  <p className="text-sm text-muted-foreground">Happy Customers</p>
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
                      <p className="font-display text-xl font-semibold text-primary">Eco Living</p>
                      <p className="text-sm text-muted-foreground mt-2">Starts Here</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-4 bg-card rounded-2xl shadow-xl p-4 border border-card-border">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Recycle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Plastic-Free</p>
                      <p className="text-xs text-muted-foreground">100% Guaranteed</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-card rounded-2xl shadow-xl p-4 border border-card-border">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Heart className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Made in BD</p>
                      <p className="text-xs text-muted-foreground">Local Artisans</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="categories" className="py-16 lg:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl lg:text-4xl font-bold mb-4">Shop by Category</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore our curated collection of sustainable products for every aspect of your life
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                <div className="bg-card rounded-2xl p-6 border border-card-border hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                  <div className={`h-14 w-14 rounded-xl ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <category.icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-display font-semibold mb-1">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.count} products</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <h2 className="font-display text-3xl lg:text-4xl font-bold mb-4">Featured Products</h2>
              <p className="text-muted-foreground">Handpicked sustainable essentials for conscious living</p>
            </div>
            <Button variant="outline" className="mt-4 md:mt-0" data-testid="button-view-all">
              View All Products
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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
                    <span className="text-4xl group-hover:scale-110 transition-transform duration-300">{product.image}</span>
                    {product.tag && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
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
                  <div className="p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">{product.rating}</span>
                    </div>
                    <h3 className="font-medium text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
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
      </section>

      <section id="contact" className="py-16 lg:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl lg:text-4xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The visionary minds behind EcoHaat, dedicated to bringing sustainable living to Bangladesh.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Founder */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card p-6 rounded-2xl border border-card-border text-center hover:shadow-lg transition-shadow">
              <div className="h-24 w-24 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-display font-bold text-lg">Abdur Rahman Talha</h3>
              <p className="text-primary font-medium text-sm mb-3">Founder</p>
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
              <p className="text-primary font-medium text-sm mb-3">Co-founder & CEO</p>
              <a href="https://wa.me/8801985011806" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                WhatsApp
              </a>
            </motion.div>

            {/* CTO */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-card p-6 rounded-2xl border border-card-border text-center hover:shadow-lg transition-shadow">
              <div className="h-24 w-24 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                <TreeDeciduous className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-display font-bold text-lg">Muhammad Nisar Uddin</h3>
              <p className="text-primary font-medium text-sm mb-3">Chief Technical Officer</p>
              <a href="https://wa.me/8801852903417" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                WhatsApp
              </a>
            </motion.div>

            {/* Technical Foundation */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="bg-card p-6 rounded-2xl border border-card-border text-center hover:shadow-lg transition-shadow">
              <div className="h-24 w-24 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Leaf className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-display font-bold text-lg">Adnan Shahria</h3>
              <p className="text-primary font-medium text-sm">Tech Foundation & Mgmt</p>
              <p className="text-muted-foreground text-xs mb-3">DevOps & Architecture</p>
              <a href="https://wa.me/8801853452264" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                WhatsApp
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl lg:text-4xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join thousands of eco-conscious shoppers making a difference
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
                <p className="text-foreground/80 mb-6 leading-relaxed">"{testimonial.text}"</p>
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
      </section>

      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-card rounded-3xl p-8 lg:p-12 border border-card-border shadow-xl">
            <Leaf className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="font-display text-3xl lg:text-4xl font-bold mb-4">Join the Green Movement</h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Subscribe to get exclusive offers, eco-tips, and be the first to know about new sustainable products
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-muted/50"
                data-testid="input-newsletter"
              />
              <Button className="bg-primary hover:bg-primary/90 font-display font-medium" data-testid="button-subscribe">
                Subscribe
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              We respect your privacy. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-foreground text-background py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="h-8 w-8 text-primary" />
                <span className="font-display text-xl font-bold">EcoHaat</span>
              </div>
              <p className="text-background/60 text-sm leading-relaxed">
                Bangladesh's trusted marketplace for sustainable, eco-friendly products. Making green living accessible.
              </p>
            </div>
            {[
              {
                title: "Shop",
                links: [
                  { label: "All Products", href: "~/shop" },
                  { label: "Categories", href: `${import.meta.env.BASE_URL}#categories` },
                  { label: "New Arrivals", href: "~/shop" },
                  { label: "Best Sellers", href: "~/shop" }
                ]
              },
              {
                title: "Company",
                links: [
                  { label: "Contact Us", href: `${import.meta.env.BASE_URL}#contact` },
                  { label: "Team", href: `${import.meta.env.BASE_URL}#contact` },
                  { label: "Blog", href: "#" },
                  { label: "Careers", href: "#" }
                ]
              },
              {
                title: "Support",
                links: [
                  { label: "Help Center", href: "#" },
                  { label: "FAQs", href: "#" },
                  { label: "Shipping", href: "#" },
                  { label: "Returns", href: "#" }
                ]
              },
            ].map((section) => (
              <div key={section.title}>
                <h4 className="font-display font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("/") && !link.href.includes("#") ? (
                        <Link href={link.href} className="text-background/60 hover:text-background text-sm transition-colors cursor-pointer">
                          {link.label}
                        </Link>
                      ) : (
                        <a href={link.href} className="text-background/60 hover:text-background text-sm transition-colors">
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-background/60 text-sm">
              © 2026 EcoHaat. All rights reserved. টেকসই পণ্য সর্বত্র...
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-background/60 hover:text-background text-sm">Privacy Policy</a>
              <a href="#" className="text-background/60 hover:text-background text-sm">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
