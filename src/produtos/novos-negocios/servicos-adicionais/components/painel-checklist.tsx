import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cx } from "@/utils/cx";
import type { Servico } from "../data/servicos";
import { SeloServico } from "./selo-servico";

/** Tempo de cada slide. */
const INTERVALO = 15_000;

/** Cores dos brilhos atrás do vidro, por serviço (principal + apoio, na família do selo). */
const BRILHO: Record<string, [string, string]> = {
    uber: ["bg-utility-neutral-400", "bg-utility-slate-500"],
    meep: ["bg-utility-orange-500", "bg-utility-yellow-400"],
    fotos: ["bg-utility-purple-500", "bg-utility-pink-500"],
    seguro: ["bg-utility-blue-500", "bg-utility-indigo-500"],
};

/**
 * Estado da rotação, separado do desenho para que mais de uma cópia (no mobile: o topo e a faixa
 * dele atrás do header fixo) troquem juntas. Passa a cada 15s; pausa com o mouse em cima; com
 * "reduzir movimento" ligado, não roda sozinho (a troca fica só nos indicadores).
 */
export function useRotacaoChecklist(total: number) {
    const [indice, setIndice] = useState(0);
    const [pausado, setPausado] = useState(false);
    const [reduzirMovimento] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    useEffect(() => {
        if (pausado || reduzirMovimento || total < 2) return;
        const t = window.setTimeout(() => setIndice((i) => (i + 1) % total), INTERVALO);
        return () => window.clearTimeout(t);
    }, [indice, pausado, reduzirMovimento, total]);

    return { indice, irPara: setIndice, pausado, setPausado, automatico: !reduzirMovimento };
}

export type RotacaoChecklist = ReturnType<typeof useRotacaoChecklist>;

/**
 * Card rotativo do Checklist do rolê, sem foto: vidro escurecido (camada fosca com desfoque,
 * reflexo na diagonal e borda clara) sobre brilhos coloridos na cor do serviço da vez, mostrando
 * selo, nome, categoria e benefícios, com indicadores para ir direto a um serviço.
 * `card`: card arredondado (desktop, ao lado do conteúdo).
 * `topo`: ocupa todo o topo do mobile, atrás do header vazado; o card da página sobe por cima da
 * parte de baixo, então o conteúdo ganha respiro extra embaixo.
 * `so-fundo`: só o fundo de vidro (a faixa que aparece atrás do header fixo do mobile).
 */
export function CardRotativoChecklist({
    servicos,
    rotacao,
    variante = "card",
    className,
}: {
    servicos: Servico[];
    rotacao: RotacaoChecklist;
    variante?: "card" | "topo" | "so-fundo";
    className?: string;
}) {
    const { indice, irPara, pausado, setPausado, automatico } = rotacao;
    const servico = servicos[indice];
    const [cor1, cor2] = BRILHO[servico.id] ?? BRILHO.uber;
    const card = variante === "card";

    return (
        <section
            aria-roledescription={variante === "so-fundo" ? undefined : "carrossel"}
            aria-label={variante === "so-fundo" ? undefined : "Serviços disponíveis"}
            aria-hidden={variante === "so-fundo" || undefined}
            onMouseEnter={() => setPausado(true)}
            onMouseLeave={() => setPausado(false)}
            className={cx("relative isolate overflow-hidden text-white", card ? "rounded-3xl shadow-xl" : "size-full", className)}
        >
            {/* Fundo: brilhos coloridos na cor do serviço; trocam de cor junto com o slide */}
            <div aria-hidden="true" className="absolute inset-0 -z-20 bg-gray-950">
                <div className={cx("absolute -top-20 -right-10 size-80 rounded-full opacity-60 blur-2xl transition-colors duration-700", cor1)} />
                <div className={cx("absolute -bottom-24 -left-16 size-72 rounded-full opacity-45 blur-2xl transition-colors duration-700", cor2)} />
            </div>
            {/* Vidro escurecido (para o texto ter contraste): camada fosca com desfoque, reflexo na diagonal e borda clara */}
            {/* No topo do mobile sem desfoque de fundo: os brilhos já são desfocados e assim o topo e a
                faixa atrás do header (72px) ficam idênticos, sem emenda */}
            <div aria-hidden="true" className={cx("absolute inset-0 -z-10 bg-black/40", card && "rounded-3xl ring-1 ring-white/20 backdrop-blur-2xl ring-inset")}>
                <div className={cx("absolute inset-0 bg-gradient-to-br from-white/15 via-white/[0.03] to-transparent", card && "rounded-3xl")} />
                {card && <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />}
            </div>

            {variante !== "so-fundo" && (
                <div className={cx("flex flex-col gap-5", card ? "p-6 lg:gap-6 lg:p-8" : "h-full justify-end px-4 pt-24 pb-12")}>
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={servico.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            aria-live={pausado || !automatico ? "polite" : "off"}
                            className="flex flex-col gap-4 lg:gap-5"
                        >
                            <div className="flex items-center gap-3">
                                <SeloServico servico={servico} tamanho="md" />
                                <div className="flex flex-col">
                                    <span className="text-lg font-semibold">{servico.item}</span>
                                    <span className="text-sm text-white/70">{servico.categoria}</span>
                                </div>
                            </div>
                            <ul className="flex flex-col gap-2.5">
                                {servico.beneficios.map(({ icone: Icone, texto }) => (
                                    <li key={texto} className="flex items-center gap-2.5 text-sm text-white/90 lg:text-md">
                                        <Icone className="size-5 shrink-0" />
                                        {texto}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </AnimatePresence>

                    {/* Indicadores: um por serviço; o ativo é mais largo. A área de clique (24px de altura)
                        é maior que a barrinha, para facilitar o toque */}
                    <div className="-my-2 flex gap-1">
                        {servicos.map((s, i) => (
                            <button
                                key={s.id}
                                type="button"
                                aria-label={`Ver ${s.item}`}
                                aria-current={i === indice}
                                onClick={() => irPara(i)}
                                className="group flex h-6 cursor-pointer items-center rounded-full px-1 outline-focus-ring focus-visible:outline-2"
                            >
                                <span
                                    className={cx(
                                        "h-2 rounded-full transition-all duration-300 ease-out",
                                        i === indice ? "w-14 bg-white" : "w-8 bg-white/40 group-hover:bg-white/70",
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
