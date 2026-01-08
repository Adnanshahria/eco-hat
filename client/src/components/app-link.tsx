import { ComponentPropsWithoutRef } from "react";
import { useLocation } from "wouter";

interface AppLinkProps extends Omit<ComponentPropsWithoutRef<'a'>, 'href'> {
    href: string;
}

/**
 * Custom Link component that automatically prepends BASE_URL for GitHub Pages compatibility.
 * Use this instead of wouter's Link for all internal navigation.
 */
export function AppLink({ href, children, onClick, ...props }: AppLinkProps) {
    const [, setLocation] = useLocation();

    // For internal routes starting with /, prepend the base URL
    const resolvedHref = href.startsWith('/')
        ? `${import.meta.env.BASE_URL.replace(/\/$/, '')}${href}`
        : href;

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        // Only handle internal links with client-side navigation
        if (href.startsWith('/')) {
            e.preventDefault();
            setLocation(href); // wouter's setLocation handles base path via Router
            onClick?.(e);
        }
    };

    return (
        <a href={resolvedHref} onClick={handleClick} {...props}>
            {children}
        </a>
    );
}

// Alias for backward compatibility
export { AppLink as Link };
