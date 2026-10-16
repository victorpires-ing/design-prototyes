import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "@untitledui/icons";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";

/**
 * Carrossel horizontal de abas: datas da sessão e tipos de item.
 *
 * Uma fileira só, que rola por arrasto e, no desktop, por setas que aparecem
 * apenas quando há aba daquele lado. Abaixo de md as setas saem: o dedo já
 * arrasta, e o chip cortado na borda anuncia que a fila continua.
 *
 * É o mesmo seletor da bilheteria, para o operador reconhecer na troca a tira
 * que já usa para vender. Cópia e não import: o repo não deixa um produto
 * importar de outro, então marketplace e backstage mantêm cada um a sua.
 */

const TRANSICAO = { duration: 0.18, ease: "easeOut" } as const;

/** Seta que entra e sai sem empurrar o trilho (anima a própria largura). */
function SetaAnimada({ lado, children }: { lado: -1 | 1; children: ReactNode }) {
    const [recortar, setRecortar] = useState(false);
    const fechada = { opacity: 0, x: lado * 8, width: 0, marginLeft: 0, marginRight: 0 };
    return (
        <motion.div
            initial={fechada}
            animate={{ opacity: 1, x: 0, width: "auto", marginLeft: lado === 1 ? 8 : 0, marginRight: lado === -1 ? 8 : 0 }}
            exit={fechada}
            transition={TRANSICAO}
            onAnimationStart={() => setRecortar(true)}
            onAnimationComplete={() => setRecortar(false)}
            className={cx("shrink-0", recortar && "overflow-hidden")}
        >
            {children}
        </motion.div>
    );
}

export interface AbaItem {
    id: string;
    /** Recebe o estado para que as legendas acompanhem a inversão do chip. */
    conteudo: (ativo: boolean) => ReactNode;
    /** Aba que não leva a lugar nenhum, como uma data já encerrada. Fica visível, porque sumir
     *  com ela esconderia que a data existe, mas não recebe clique nem foco. */
    bloqueada?: boolean;
}

/**
 * Legenda secundária do chip. No chip ativo o texto inverte junto com o fundo:
 * `text-tertiary` sobre preto fica ilegível.
 */
export function ChipLegenda({ ativo, children }: { ativo: boolean; children: ReactNode }) {
    return <span className={cx("text-sm", ativo ? "text-alpha-white/70" : "text-tertiary")}>{children}</span>;
}

interface AbasCarrosselProps {
    abas: AbaItem[];
    ativa: string;
    ariaLabel: string;
    onSelecionar: (id: string) => void;
}

export function AbasCarrossel({ abas, ativa, ariaLabel, onSelecionar }: AbasCarrosselProps) {
    const trilhoRef = useRef<HTMLDivElement>(null);
    // Seta só existe quando há aba para aquele lado: botão que não leva a lugar nenhum é ruído.
    const [temAnterior, setTemAnterior] = useState(false);
    const [temProxima, setTemProxima] = useState(false);

    const sincronizarSetas = () => {
        const trilho = trilhoRef.current;
        if (!trilho) return;
        setTemAnterior(trilho.scrollLeft > 1);
        setTemProxima(Math.ceil(trilho.scrollLeft + trilho.clientWidth) < trilho.scrollWidth);
    };

    useEffect(() => {
        sincronizarSetas();
        const trilho = trilhoRef.current;
        if (!trilho) return;
        const observer = new ResizeObserver(sincronizarSetas);
        observer.observe(trilho);
        return () => observer.disconnect();
    }, [abas.length]);

    /**
     * Traz a aba ativa para dentro do trilho. Usa scrollTo no próprio trilho em
     * vez de scrollIntoView, que arrastaria a página junto quando o link já
     * chega com uma data selecionada.
     */
    useEffect(() => {
        const trilho = trilhoRef.current;
        if (!trilho) return;
        const chip = Array.from(trilho.children).find((el) => (el as HTMLElement).dataset.aba === ativa) as HTMLElement | undefined;
        if (!chip) return;
        const inicio = chip.offsetLeft;
        const fim = inicio + chip.offsetWidth;
        if (inicio < trilho.scrollLeft) trilho.scrollTo({ left: Math.max(0, inicio - 12), behavior: "smooth" });
        else if (fim > trilho.scrollLeft + trilho.clientWidth) trilho.scrollTo({ left: fim - trilho.clientWidth + 12, behavior: "smooth" });
    }, [ativa]);

    const rolar = (direcao: 1 | -1) => {
        const trilho = trilhoRef.current;
        if (!trilho) return;
        trilho.scrollBy({ left: direcao * Math.max(trilho.clientWidth * 0.8, 160), behavior: "smooth" });
    };

    return (
        <div className="flex items-center">
            {/* As setas somem abaixo de md. No toque elas eram redundantes com o arrasto e cobravam
                caro: 72px de uma pista de 358px, em alvos de 28px, e a de voltar nascia no primeiro
                pixel de rolagem, encolhendo o trilho 36px com o dedo ainda na tela. O chip cortado na
                borda é a affordance que resta, e é a que o arrasto já usa. */}
            <div className="shrink-0 max-md:hidden">
                <AnimatePresence initial={false}>
                    {temAnterior && (
                        <SetaAnimada key="anteriores" lado={-1}>
                            <ButtonUtility size="xs" color="tertiary" icon={ChevronLeft} tooltip="Abas anteriores" onClick={() => rolar(-1)} />
                        </SetaAnimada>
                    )}
                </AnimatePresence>
            </div>

            <div
                ref={trilhoRef}
                role="radiogroup"
                aria-label={ariaLabel}
                onScroll={sincronizarSetas}
                className="flex min-w-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {abas.map((aba) => {
                    const ativo = aba.id === ativa;
                    return (
                        <button
                            key={aba.id}
                            type="button"
                            role="radio"
                            aria-checked={ativo}
                            disabled={aba.bloqueada}
                            data-aba={aba.id}
                            onClick={() => onSelecionar(aba.id)}
                            className={cx(
                                "flex h-[72px] min-w-[96px] shrink-0 snap-start flex-col items-center justify-center rounded-xl px-3 transition duration-100 ease-linear",
                                /*
                                  O chip escolhido inverte em relação à superfície: os tokens alpha
                                  viram branco no dark e preto no light, que é o chip do design.
                                */
                                ativo ? "bg-alpha-black text-alpha-white" : "bg-primary text-primary ring-1 ring-border-secondary",
                                aba.bloqueada ? "cursor-not-allowed opacity-50" : !ativo && "hover:bg-primary_hover",
                            )}
                        >
                            {aba.conteudo(ativo)}
                        </button>
                    );
                })}
            </div>

            <div className="shrink-0 max-md:hidden">
                <AnimatePresence initial={false}>
                    {temProxima && (
                        <SetaAnimada key="proximas" lado={1}>
                            <ButtonUtility size="xs" color="tertiary" icon={ChevronRight} tooltip="Próximas abas" onClick={() => rolar(1)} />
                        </SetaAnimada>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
