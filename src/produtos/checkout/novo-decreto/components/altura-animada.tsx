import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { SMART_ANIMATE } from "../utils/transicao";

/**
 * Anima a altura do conteúdo quando ele muda (o "resize" do Smart Animate). O que vem
 * abaixo acompanha o movimento quadro a quadro, sem salto e sem mexer na rolagem.
 */
export function AlturaAnimada({ children, className }: { children: ReactNode; className?: string }) {
    const conteudo = useRef<HTMLDivElement>(null);
    const [altura, setAltura] = useState<number | "auto">("auto");

    useLayoutEffect(() => {
        const el = conteudo.current;
        if (!el) return;
        const medir = () => setAltura(el.offsetHeight);
        medir();
        const ro = new ResizeObserver(medir);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    return (
        <motion.div initial={false} animate={{ height: altura }} transition={SMART_ANIMATE} className={className} style={{ overflow: "hidden" }}>
            <div ref={conteudo}>{children}</div>
        </motion.div>
    );
}
