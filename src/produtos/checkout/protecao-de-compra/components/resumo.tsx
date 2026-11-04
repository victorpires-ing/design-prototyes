import { type FC, createContext, useContext, useEffect, useRef, useState } from "react";
import { ChevronDown, ShieldTick, Ticket01 } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import { cx } from "@/utils/cx";
import { brl } from "../data/evento";

export interface LinhaResumo {
    id: string;
    quantidade: number;
    titulo: string;
    subtitulo: string;
    valor: number;
    /** Ícone ao lado da quantidade: ingresso ou escudo da proteção. */
    icone: FC<{ className?: string }>;
    /** Link extra abaixo do subtítulo (ex.: "Ver coberturas" na proteção). */
    link?: string;
}

interface PropsResumo {
    linhas: LinhaResumo[];
    total: number;
    qtdItens: number;
    onRemover: (id: string) => void;
    onRemoverTudo: () => void;
    /** "Continuar com proteção" (true) ou "Prefiro correr o risco" (false). No experimento os botões não fazem nada. */
    onContinuar?: (comProtecao: boolean) => void;
    /** Abre o modal de coberturas ("Ver coberturas" na linha da proteção). */
    onVerCoberturas?: () => void;
}

const VerCoberturas = createContext<(() => void) | undefined>(undefined);

/** "Resumo da compra": no desktop, card lateral; no celular, barra fixa no rodapé que abre como gaveta (igual produção). */
export function Resumo(props: PropsResumo) {
    return (
        <VerCoberturas.Provider value={props.onVerCoberturas}>
            <ResumoDesktop {...props} />
            <ResumoMobile {...props} />
        </VerCoberturas.Provider>
    );
}

function ResumoDesktop({ linhas, total, qtdItens, onRemover, onRemoverTudo, onContinuar }: PropsResumo) {
    const vazio = linhas.length === 0;
    // A proteção sai da lista de itens e vai para o rodapé, logo acima do total (mesmo lugar do celular)
    const linhaProtecao = linhas.find((l) => l.id === "protecao");
    const linhasLista = linhaProtecao ? linhas.filter((l) => l !== linhaProtecao) : linhas;

    return (
        <aside className="hidden min-h-[440px] flex-col overflow-hidden rounded-2xl border border-[#dcdcdc] bg-white lg:flex">
            <h2 className="border-b border-[#ececec] px-4 py-3.5 text-sm font-medium text-[#1a1a1a]">Resumo da compra</h2>

            <div className="flex flex-1 flex-col gap-4 px-4 py-4">
                {vazio ? (
                    <p className="py-8 text-center text-sm text-[#7a7a7a]">Selecione um ingresso para continuar.</p>
                ) : (
                    <ListaItens linhas={linhasLista} onRemover={onRemover} onRemoverTudo={onRemoverTudo} />
                )}
            </div>

            <footer className="border-t border-[#ececec] px-4 py-4">
                <div className="flex flex-col gap-3">
                    {linhaProtecao && (
                        <>
                            <ul>
                                <LinhaItem linha={linhaProtecao} onRemover={onRemover} />
                            </ul>
                            <Divisor />
                        </>
                    )}
                    <Rodape total={total} qtdItens={qtdItens} desabilitado={vazio} onContinuar={onContinuar} />
                </div>
            </footer>
        </aside>
    );
}

function ResumoMobile({ linhas, total, qtdItens, onRemover, onRemoverTudo, onContinuar }: PropsResumo) {
    const [aberto, setAberto] = useState(false);
    const barraRef = useRef<HTMLDivElement>(null);
    const [altura, setAltura] = useState(0);
    const temItens = linhas.length > 0;

    // Reserva no fim da página a altura da barra fechada, para ela não cobrir o último setor
    useEffect(() => {
        const el = barraRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            if (!aberto) setAltura(el.offsetHeight);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [temItens, aberto]);

    useEffect(() => {
        if (!temItens) setAberto(false);
    }, [temItens]);

    // A linha da proteção sai da gaveta e fica sempre à vista na barra, logo acima do total
    const linhaProtecao = linhas.find((l) => l.id === "protecao");
    const linhasGaveta = linhaProtecao ? linhas.filter((l) => l !== linhaProtecao) : linhas;

    const rodape = (
        <div className="flex flex-col gap-3">
            {linhaProtecao && (
                <>
                    <ul>
                        <LinhaItem linha={linhaProtecao} onRemover={onRemover} />
                    </ul>
                    <Divisor />
                </>
            )}
            <Rodape total={total} qtdItens={qtdItens} onContinuar={onContinuar} />
        </div>
    );

    return (
        <>
            {temItens && <div className="lg:hidden" style={{ height: altura }} aria-hidden="true" />}

            <AnimatePresence>
                {aberto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => setAberto(false)}
                        className="fixed inset-0 z-40 bg-black/60 lg:hidden"
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {temItens && (
                    <motion.div
                        ref={barraRef}
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", stiffness: 320, damping: 34 }}
                        className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.08)] lg:hidden"
                    >
                        <button
                            type="button"
                            onClick={() => setAberto((a) => !a)}
                            aria-expanded={aberto}
                            className="flex items-center justify-between gap-3 border-b border-[#ececec] px-4 py-3 text-sm font-medium text-[#1a1a1a]"
                        >
                            Resumo da compra
                            <ChevronDown className={cx("size-5 transition-transform duration-300", aberto && "rotate-180")} aria-hidden="true" />
                        </button>

                        <AnimatePresence initial={false}>
                            {aberto && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: "auto" }}
                                    exit={{ height: 0 }}
                                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                    className="overflow-hidden"
                                >
                                    <div className="max-h-[50vh] overflow-y-auto border-b border-[#ececec] px-4 py-4">
                                        <div className="flex flex-col gap-4">
                                            <ListaItens linhas={linhasGaveta} onRemover={onRemover} onRemoverTudo={onRemoverTudo} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">{rodape}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function ListaItens({ linhas, onRemover, onRemoverTudo }: Pick<PropsResumo, "linhas" | "onRemover" | "onRemoverTudo">) {
    return (
        <>
            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#1a1a1a]">Itens</span>
                <span className="h-px flex-1 border-t border-dashed border-[#cfcfcf]" />
                <button type="button" onClick={onRemoverTudo} className="text-xs text-[#1a1a1a] underline underline-offset-2">
                    Remover itens
                </button>
            </div>

            <ul className="flex flex-col gap-4">
                {linhas.map((l) => (
                    <LinhaItem key={l.id} linha={l} onRemover={onRemover} />
                ))}
            </ul>
        </>
    );
}

function LinhaItem({ linha, onRemover }: { linha: LinhaResumo; onRemover: (id: string) => void }) {
    const { id, quantidade, titulo, subtitulo, valor, icone: Icone, link } = linha;
    // Proteção: a linha só informa (o valor vai na legenda); quem liga a proteção é o "Continuar com proteção"
    const protecao = id === "protecao";
    const verCoberturas = useContext(VerCoberturas);
    return (
        <li className="relative flex items-start gap-3">
            <span className="flex shrink-0 items-center gap-0.5 rounded-md bg-[#f2f2f2] px-1.5 py-0.5 text-sm font-semibold text-[#1a1a1a] tabular-nums">
                {quantidade}
                <Icone className="size-3.5" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-sm font-bold text-[#1a1a1a]">{titulo}</span>
                {/* Proteção: o valor vai na legenda, em peso regular ("Cobre 2 ingressos por R$ 24,00"), e o link fica preto */}
                <span className="text-sm text-[#1a1a1a]">
                    {subtitulo}
                    {protecao && (
                        <>
                            {" "}
                            por <span className="tabular-nums">{brl(valor)}</span>
                        </>
                    )}
                </span>
                {link && (
                    <button
                        type="button"
                        onClick={verCoberturas}
                        className={cx(
                            "relative self-start text-xs font-semibold underline underline-offset-2 transition duration-100 ease-linear",
                            protecao ? "text-[#1a1a1a] hover:text-[#525252]" : "text-[#ff4f1f] hover:text-[#e8410f]",
                        )}
                    >
                        {link}
                    </button>
                )}
            </span>
            {!protecao && (
                <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-bold text-[#1a1a1a] tabular-nums">{brl(valor)}</span>
                    <button type="button" onClick={() => onRemover(id)} className="text-xs text-[#1a1a1a] underline underline-offset-2">
                        Remover
                    </button>
                </span>
            )}
        </li>
    );
}

function BotaoContinuar({
    children,
    largo,
    desabilitado,
    onClick,
}: {
    children: React.ReactNode;
    largo?: boolean;
    desabilitado?: boolean;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            disabled={desabilitado}
            onClick={onClick}
            className={cx(
                "h-11 rounded-xl bg-[#ff4f1f] text-sm font-semibold text-white transition duration-100 ease-linear hover:bg-[#e8410f] disabled:cursor-not-allowed disabled:bg-[#ffd3c4]",
                largo ? "w-full px-3" : "shrink-0 px-6",
            )}
        >
            {children}
        </button>
    );
}

/** Divider entre a proteção e o valor final, de ponta a ponta (sai do respiro lateral de 16px do rodapé; mesmo cinza das outras divisões). */
const Divisor = () => <hr className="-mx-4 border-t border-[#ececec]" />;

/** Total à esquerda e a contagem à direita, numa linha só (quando o botão vai embaixo, de ponta a ponta). */
function LinhaTotal({ total, qtdItens }: { total: number; qtdItens: number }) {
    return (
        <span className="flex items-baseline justify-between gap-3">
            <span className="flex items-baseline gap-1">
                <span className="text-base font-semibold text-[#1a1a1a] tabular-nums">{brl(total)}</span>
                <span className="text-sm text-[#7a7a7a]">+ taxas</span>
            </span>
            <span className="text-sm text-[#7a7a7a]">
                {qtdItens} {qtdItens === 1 ? "item" : "itens"}
            </span>
        </span>
    );
}

/** Rodapé: "Continuar com proteção" de ponta a ponta (já liga a proteção) e "Prefiro correr o risco" embaixo, sem borda. */
function Rodape({
    total,
    qtdItens,
    onContinuar,
    desabilitado,
}: { total: number; qtdItens: number; desabilitado?: boolean } & Pick<PropsResumo, "onContinuar">) {
    // Os dois botões são as duas saídas da tela: "Continuar com proteção" é o único jeito de seguir protegido
    return (
        <div className="flex flex-col gap-3">
            <LinhaTotal total={total} qtdItens={qtdItens} />
            <BotaoContinuar largo desabilitado={desabilitado} onClick={() => onContinuar?.(true)}>
                Continuar com proteção
            </BotaoContinuar>
            <button
                type="button"
                disabled={desabilitado}
                onClick={() => onContinuar?.(false)}
                className="h-11 w-full rounded-xl text-sm font-semibold text-[#525252] transition duration-100 ease-linear hover:bg-[#f2f2f2] hover:text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
            >
                Prefiro correr o risco
            </button>
        </div>
    );
}

export const ICONE_INGRESSO = Ticket01;
export const ICONE_PROTECAO = ShieldTick;
