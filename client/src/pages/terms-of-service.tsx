import { Leaf, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLink as Link } from "@/components/app-link";

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="touch-target">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Leaf className="h-6 w-6 text-primary" />
                        <span className="font-display font-bold">EcoHaat</span>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="font-display text-3xl font-bold mb-6">Terms of Service</h1>
                <p className="text-muted-foreground mb-6">Last updated: January 2026</p>

                <div className="prose prose-green max-w-none space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            By accessing and using EcoHaat, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">2. Account Registration</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You must provide accurate information when creating an account. You are responsible for maintaining the security of your account and all activities under it.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">3. Products & Orders</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            All products listed are subject to availability. We reserve the right to refuse or cancel orders at our discretion. Prices are in BDT and may change without notice.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">4. Seller Guidelines</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Sellers must ensure all products are eco-friendly and accurately described. Misleading product information may result in account suspension.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">5. Payment & Delivery</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We accept Cash on Delivery (COD). Delivery times vary by location. A delivery charge and COD fee may apply based on order details.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">6. Returns & Refunds</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Products may be returned within 7 days if damaged or defective. Refunds will be processed within 5-7 business days after inspection.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            EcoHaat is not liable for any indirect, incidental, or consequential damages arising from use of our platform or products purchased through it.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">8. Contact</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            For questions about these terms, contact us via WhatsApp or email at support@ecohaat.com.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
