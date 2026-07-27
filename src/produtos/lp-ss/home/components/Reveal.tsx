import { useEffect, useRef, useState, type ReactNode } from "react";

interface RevealProps {
    children: ReactNode;
    delay?: number;
    className?: string;
    /** "rise" = fade + sobe (ss-rise); "grow" = fade + cresce (ss-grow-in) */
    variant?: "rise" | "grow";
}

/** Anima a entrada do elemento (via @keyframes definidos na página) quando ele entra na viewport, uma única vez. */
export function Reveal({ children, delay = 0, className, variant = "rise" }: RevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.2 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const animationName = variant === "grow" ? "ss-grow-in" : "ss-rise";

    return (
        <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, animation: visible ? `${animationName} 0.6s ease-out ${delay}s both` : undefined }}>
            {children}
        </div>
    );
}
