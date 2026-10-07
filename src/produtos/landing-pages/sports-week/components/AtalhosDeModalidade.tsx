import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { cx } from "@/utils/cx";
import { MODALIDADES, type ModalidadeSlug } from "../data/modalidades";
import { eventosPorModalidade } from "../data/eventos";
import { EASE_OUT_EXPO, SPRING_POP, STAGGER } from "../utils/motion-tokens";
import { useSwMotion } from "../utils/use-sw-motion";
import { SwTag } from "./SwUi";

/* Atalhos de modalidade em cartões deitados.
   É o mesmo bloco de cor do mosaico da home, só que em fileira e em formato
   paisagem: quem vem de lá reconhece a peça na hora, e aqui ela cabe acima da
   grade sem virar um mosaico concorrendo com os cards de evento.

   Eles NAVEGAM para a página da modalidade, não filtram a lista: a listagem é a
   vitrine de tudo, e cada modalidade tem a própria página. */

export function AtalhosDeModalidade({
    onAbrir,
    className,
    excluir,
}: {
    onAbrir: (slug: ModalidadeSlug) => void;
    className?: string;
    /** Tira uma modalidade da fileira. Serve para a própria página não se listar. */
    excluir?: ModalidadeSlug;
}) {
    const { reduce } = useSwMotion();
    const grade = useRef<HTMLDivElement>(null);

    /* Mesma entrada do mosaico da home, e pela mesma razão: dois limiares. Abre
       quando 30% entra e só rearma quando a fileira sai inteira da tela, senão os
       blocos abririam e fechariam no meio do scroll. */
    const entrou = useInView(grade, { amount: 0.3 });
    const aindaVisivel = useInView(grade, { amount: 0 });
    const [emCena, setEmCena] = useState(false);

    useEffect(() => {
        if (entrou) setEmCena(true);
        else if (!aindaVisivel) setEmCena(false);
    }, [entrou, aindaVisivel]);

    return (
        <div
            ref={grade}
            className={cx("grid grid-cols-2 gap-2 @3xl/sw:grid-cols-4 @5xl/sw:gap-3", className)}
            role="group"
            aria-label="Modalidades da campanha"
        >
            {MODALIDADES.filter((m) => m.slug !== excluir).map((modalidade, i) => {
                const total = eventosPorModalidade(modalidade.slug).length;

                return (
                    <motion.button
                        key={modalidade.slug}
                        type="button"
                        aria-label={`${modalidade.nome}, ${total} ${total === 1 ? "evento" : "eventos"}`}
                        onClick={() => onAbrir(modalidade.slug)}
                        whileTap={reduce ? undefined : { scale: 0.97 }}
                        transition={SPRING_POP}
                        className="group relative h-24 cursor-pointer overflow-hidden rounded-xl text-left @5xl/sw:h-28"
                        style={{ backgroundColor: modalidade.cor }}
                    >
                        <span
                            aria-hidden="true"
                            className="sw-stripes absolute inset-0 opacity-[0.14] transition-opacity duration-200 group-hover:opacity-[0.24]"
                            style={{
                                ["--sw-stripe-a" as string]: modalidade.tinta,
                                ["--sw-stripe-b" as string]: "transparent",
                            }}
                        />

                        <span className="absolute top-2.5 right-2.5">
                            <SwTag style={{ backgroundColor: "var(--sw-ink)", color: "var(--sw-lime)" }}>{total}</SwTag>
                        </span>

                        <span
                            className="sw-display absolute bottom-3 left-3 block text-[20px] leading-none transition-transform duration-200 group-hover:translate-x-1 @3xl/sw:text-[26px] @5xl/sw:text-[30px]"
                            style={{ color: modalidade.tinta }}
                        >
                            {modalidade.nomeCurto}
                        </span>

                        {/* Tampa que recua da direita. Cobre o bloco inteiro, inclusive
                            nome e contagem, senão o texto apareceria sobre o ink. */}
                        <motion.span
                            aria-hidden="true"
                            className="absolute inset-0 z-10 origin-right"
                            style={{ backgroundColor: "var(--sw-ink)" }}
                            initial={false}
                            animate={{ scaleX: emCena ? 0 : 1 }}
                            transition={
                                emCena
                                    ? { duration: reduce ? 0.18 : 0.52, ease: EASE_OUT_EXPO, delay: reduce ? 0 : i * STAGGER.grid }
                                    : { duration: 0 }
                            }
                        />
                    </motion.button>
                );
            })}
        </div>
    );
}
