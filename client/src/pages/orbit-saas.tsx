import { motion } from "framer-motion";
import { ArrowLeft, Code, Crown, Globe, Rocket, Shield, Users } from "lucide-react";
import { AppLink as Link } from "@/components/app-link";
import { NavBar } from "@/components/navbar";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function OrbitSaas() {
    const { t } = useLanguage();

    const teamMembers = [
        {
            id: 1,
            name: "Muhammad Nisar Uddin",
            role: t('orbitSaas.founderCeo'),
            description: t('orbitSaas.founderCeoDesc'),
            whatsapp: "+8801852903417",
            icon: Crown,
            color: "bg-purple-100 text-purple-600",
        },
        {
            id: 2,
            name: "Adnan Shahria",
            role: t('orbitSaas.coFounderLead'),
            description: t('orbitSaas.coFounderLeadDesc'),
            whatsapp: "+8801853452264",
            icon: Code,
            color: "bg-blue-100 text-blue-600",
        },
        {
            id: 3,
            name: "Shamim",
            role: t('orbitSaas.seniorDev'),
            description: t('orbitSaas.seniorDevDesc'),
            whatsapp: "+8801705818105",
            icon: Globe,
            color: "bg-emerald-100 text-emerald-600",
        },
    ];

    const services = [
        { icon: Globe, title: t('orbitSaas.websiteDev'), desc: t('orbitSaas.websiteDevDesc') },
        { icon: Shield, title: t('orbitSaas.techOps'), desc: t('orbitSaas.techOpsDesc') },
        { icon: Rocket, title: t('orbitSaas.digitalTrans'), desc: t('orbitSaas.digitalTransDesc') },
        { icon: Users, title: t('orbitSaas.itConsulting'), desc: t('orbitSaas.itConsultingDesc') },
    ];

    return (
        <div className="min-h-screen bg-grass-pattern grain-texture">
            <NavBar />

            {/* Hero Section */}
            <section className="relative overflow-hidden py-8 lg:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-12"
                    >
                        {/* Back Link */}
                        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                            {t('orbitSaas.backToEcohaat')}
                        </Link>

                        {/* Logo */}
                        <div className="flex justify-center mb-6">
                            <div className="h-24 w-24 lg:h-32 lg:w-32 rounded-2xl overflow-hidden shadow-xl border-2 border-primary/20">
                                <img
                                    src="/orbit_saas_logo.png"
                                    alt="ORBIT SaaS Logo"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        <h1 className="font-display text-4xl lg:text-6xl font-bold mb-4">
                            <span className="text-gradient-green">ORBIT</span> SaaS
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            {t('orbitSaas.subtitle')}
                        </p>
                    </motion.div>

                    {/* Services Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="frosted-glass rounded-2xl p-6 lg:p-10 mb-16"
                    >
                        <h2 className="font-display text-2xl lg:text-3xl font-bold text-center mb-8">{t('orbitSaas.ourServices')}</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            {services.map((service, index) => (
                                <div
                                    key={index}
                                    className="bg-card rounded-xl p-4 lg:p-6 border border-card-border hover:border-primary/30 hover:shadow-lg transition-all text-center"
                                >
                                    <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                                        <service.icon className="h-6 w-6 lg:h-7 lg:w-7 text-primary" />
                                    </div>
                                    <h3 className="font-display font-semibold text-sm lg:text-base mb-1">{service.title}</h3>
                                    <p className="text-xs lg:text-sm text-muted-foreground">{service.desc}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Team Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="frosted-glass rounded-2xl p-6 lg:p-10"
                    >
                        <h2 className="font-display text-2xl lg:text-3xl font-bold text-center mb-3">{t('orbitSaas.meetTeam')}</h2>
                        <p className="text-muted-foreground text-center mb-10 max-w-xl mx-auto">
                            {t('orbitSaas.meetTeamDesc')}
                        </p>

                        <div className="grid md:grid-cols-3 gap-6">
                            {teamMembers.map((member, index) => (
                                <motion.div
                                    key={member.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-card rounded-2xl p-6 border border-card-border hover:shadow-xl hover:border-primary/30 transition-all"
                                >
                                    <div className={`h-16 w-16 ${member.color} rounded-full mx-auto mb-4 flex items-center justify-center`}>
                                        <member.icon className="h-8 w-8" />
                                    </div>
                                    <h3 className="font-display font-bold text-lg text-center">{member.name}</h3>
                                    <p className="text-primary font-medium text-sm text-center mb-2">{member.role}</p>
                                    <p className="text-muted-foreground text-xs text-center mb-4">{member.description}</p>

                                    <a
                                        href={`https://wa.me/${member.whatsapp.replace(/[^0-9]/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors w-full"
                                    >
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                        </svg>
                                        WhatsApp
                                    </a>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Partnership Note */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="mt-16 text-center"
                    >
                        <div className="frosted-glass inline-block rounded-2xl p-6 lg:p-8">
                            <div className="flex items-center justify-center gap-4 mb-4">
                                <img src="/orbit_saas_logo.png" alt="ORBIT SaaS" className="h-10 w-10 rounded-lg" />
                                <span className="text-2xl">🤝</span>
                                <img src="/logo-en.png" alt="EcoHaat" className="h-10 w-10 rounded-lg object-contain" />
                            </div>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                {t('orbitSaas.partnershipNote')}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-border/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-muted-foreground text-sm">
                        © {new Date().getFullYear()} {t('orbitSaas.copyright')}
                    </p>
                </div>
            </footer>
        </div>
    );
}
