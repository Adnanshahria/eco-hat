import { Leaf, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLink as Link } from "@/components/app-link";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-grass-pattern">
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
                <h1 className="font-display text-3xl font-bold mb-6">Privacy Policy</h1>
                <p className="text-muted-foreground mb-6">Last updated: January 2026</p>

                <div className="prose prose-green max-w-none space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We collect information you provide directly to us, including your name, email address, phone number, shipping address, and payment information when you make a purchase. We also collect information about your browsing activity on our platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We use the information we collect to process orders, communicate with you, improve our services, and send you promotional offers (with your consent). We never sell your personal data to third parties.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">3. Data Security</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We implement industry-standard security measures to protect your personal information. All payment transactions are encrypted and processed securely.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">4. Cookies</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookie settings through your browser.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">5. Your Rights</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You have the right to access, update, or delete your personal information at any time. Contact us at privacy@ecohaat.com for any privacy-related requests.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">6. Contact Us</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            If you have questions about this Privacy Policy, please contact us via WhatsApp or email at support@ecohaat.com.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
