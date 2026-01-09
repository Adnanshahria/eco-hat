import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { useLocation } from "wouter";

interface PageTransitionProps {
    children: ReactNode;
}

const pageVariants = {
    initial: {
        opacity: 0,
        y: 8,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: "easeOut" as const,
        },
    },
    exit: {
        opacity: 0,
        y: -8,
        transition: {
            duration: 0.2,
            ease: "easeIn" as const,
        },
    },
};

export function PageTransition({ children }: PageTransitionProps) {
    const [location] = useLocation();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={location}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                style={{ width: "100%", height: "100%" }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}

// Simpler fade transition for content areas within pages
export function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.4,
                delay,
                ease: [0.25, 0.1, 0.25, 1]
            }}
        >
            {children}
        </motion.div>
    );
}

export default PageTransition;
