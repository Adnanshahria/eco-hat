import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'bn' : 'en');
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="gap-2 font-medium"
            title={language === 'en' ? 'Switch to বাংলা' : 'Switch to English'}
        >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">
                {language === 'en' ? 'বাং' : 'EN'}
            </span>
        </Button>
    );
}
