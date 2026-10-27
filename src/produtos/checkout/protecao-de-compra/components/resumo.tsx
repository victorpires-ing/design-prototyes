import { type FC, useEffect, useRef, useState } from "react";
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

/** V2: a proteção aparece abaixo dos itens como opção desligada; a pessoa ativa pelo radio. */
export interface ProtecaoOpcional {
    ativa: boolean;
    qtdIngressos: number;
    valor: number;
    /** Só ativa: depois de escolhida, a proteção não pode ser desmarcada. */
    onAtivar: () => void;
}

interface PropsResumo {
    linhas: LinhaResumo[];
    total: number;
    qtdItens: number;
    comProtecao: boolean;
    onRemover: (id: string) => void;
    onRemoverTudo: () => void;
    onContinuarSemProtecao?: () => void;
    /** Presente só na V2: troca a linha de proteção pelo card com radio e volta ao rodapé original. */
    protecaoOpcional?: ProtecaoOpcional;
    /** Presente só na V3: a proteção fica na lista como os outros itens, com um radio no início, e o rodapé vira "Continuar com proteção" / "Prefiro correr o risco". */
    protecaoRadio?: ProtecaoRadio;
}

/** V3: a proteção começa desligada; o radio (ou o "Continuar com proteção") liga e não dá para desligar. */
export interface ProtecaoRadio {
    ativa: boolean;
    onAtivar: () => void;
}

/** "Resumo da compra": no desktop, card lateral; no celular, barra fixa no rodapé que abre como gaveta (igual produção). */
export function Resumo(props: PropsResumo) {
    return (
        <>
            <ResumoDesktop {...props} />
            <ResumoMobile {...props} />
        </>
    );
}

function ResumoDesktop({
    linhas,
    total,
    qtdItens,
    comProtecao,
    onRemover,
    onRemoverTudo,
    onContinuarSemProtecao,
    protecaoOpcional,
    protecaoRadio,
}: PropsResumo) {
    const vazio = linhas.length === 0;
    // V3: a proteção sai da lista de itens e vai para o rodapé, logo acima do total (mesmo lugar do celular)
    const linhaProtecao = protecaoRadio ? linhas.find((l) => l.id === "protecao") : undefined;
    const linhasLista = linhaProtecao ? linhas.filter((l) => l !== linhaProtecao) : linhas;

    return (
        <aside className="hidden min-h-[440px] flex-col overflow-hidden rounded-2xl border border-[#dcdcdc] bg-white lg:flex">
            <h2 className="border-b border-[#ececec] px-4 py-3.5 text-sm font-medium text-[#1a1a1a]">Resumo da compra</h2>

            <div className="flex flex-1 flex-col gap-4 px-4 py-4">
                {vazio ? (
                    <p className="py-8 text-center text-sm text-[#7a7a7a]">Selecione um ingresso para continuar.</p>
                ) : (
                    <>
                        <ListaItens linhas={linhasLista} onRemover={onRemover} onRemoverTudo={onRemoverTudo} />
                        {protecaoOpcional && <CardProtecao {...protecaoOpcional} />}
                    </>
                )}
            </div>

            <footer className="border-t border-[#ececec] px-4 py-4">
                {protecaoOpcional ? (
                    <TotalComBotao total={total} qtdItens={qtdItens} desabilitado={vazio} />
                ) : protecaoRadio ? (
                    <div className="flex flex-col gap-3">
                        {linhaProtecao && (
                            <ul className="mb-2">
                                <LinhaItem linha={linhaProtecao} onRemover={onRemover} protecaoRadio={protecaoRadio} />
                            </ul>
                        )}
                        <RodapeV3 total={total} qtdItens={qtdItens} desabilitado={vazio} {...protecaoRadio} />
                    </div>
                ) : (
                    <RodapeV1
                        total={total}
                        qtdItens={qtdItens}
                        comProtecao={comProtecao}
                        desabilitado={vazio}
                        onContinuarSemProtecao={onContinuarSemProtecao}
                    />
                )}
            </footer>
        </aside>
    );
}

function ResumoMobile({
    linhas,
    total,
    qtdItens,
    comProtecao,
    onRemover,
    onRemoverTudo,
    onContinuarSemProtecao,
    protecaoOpcional,
    protecaoRadio,
}: PropsResumo) {
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

    // V2: o card da proteção fica sempre à vista na barra, mesmo com o resumo fechado; total embaixo e "Continuar" de ponta a ponta
    // V1 e V3: a linha da proteção sai da gaveta e fica sempre à vista na barra, logo acima do total
    const linhaProtecao = protecaoOpcional ? undefined : linhas.find((l) => l.id === "protecao");
    const linhasGaveta = linhaProtecao ? linhas.filter((l) => l !== linhaProtecao) : linhas;

    const rodape = protecaoOpcional ? (
        <div className="flex flex-col gap-3">
            <CardProtecao {...protecaoOpcional} />
            <LinhaTotal total={total} qtdItens={qtdItens} />
            <BotaoContinuar largo>Continuar</BotaoContinuar>
        </div>
    ) : (
        <div className="flex flex-col gap-3">
            {linhaProtecao && (
                <ul className={cx(protecaoRadio && "mb-2")}>
                    <LinhaItem linha={linhaProtecao} onRemover={onRemover} protecaoRadio={protecaoRadio} />
                </ul>
            )}
            {protecaoRadio ? (
                <RodapeV3 total={total} qtdItens={qtdItens} {...protecaoRadio} />
            ) : (
                <RodapeV1 total={total} qtdItens={qtdItens} comProtecao={comProtecao} onContinuarSemProtecao={onContinuarSemProtecao} />
            )}
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

function ListaItens({ linhas, onRemover, onRemoverTudo, protecaoRadio }: Pick<PropsResumo, "linhas" | "onRemover" | "onRemoverTudo" | "protecaoRadio">) {
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
                    <LinhaItem key={l.id} linha={l} onRemover={onRemover} protecaoRadio={protecaoRadio} />
                ))}
            </ul>
        </>
    );
}

function LinhaItem({ linha, onRemover, protecaoRadio }: { linha: LinhaResumo; onRemover: (id: string) => void; protecaoRadio?: ProtecaoRadio }) {
    const { id, quantidade, titulo, subtitulo, valor, icone: Icone, link } = linha;
    const radio = id === "protecao" ? protecaoRadio : undefined;
    return (
        <li className="relative flex items-start gap-3">
            {radio && (
                <>
                    {/* A linha inteira é o alvo do radio (botão esticado por cima); uma vez ativa, fica travada */}
                    <button
                        type="button"
                        role="radio"
                        aria-checked={radio.ativa}
                        aria-label="Adicionar proteção de compra"
                        onClick={radio.onAtivar}
                        disabled={radio.ativa}
                        className="absolute -inset-1.5 cursor-pointer rounded-lg disabled:cursor-default"
                    />
                    <Radio ativa={radio.ativa} className="mt-1" />
                </>
            )}
            <span className="flex shrink-0 items-center gap-0.5 rounded-md bg-[#f2f2f2] px-1.5 py-0.5 text-sm font-semibold text-[#1a1a1a] tabular-nums">
                {quantidade}
                <Icone className="size-3.5" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-sm font-bold text-[#1a1a1a]">{titulo}</span>
                {/* V3: o valor vai na legenda, em peso regular ("Cobre 2 ingressos por R$ 24,00"), e o link fica preto */}
                <span className="text-sm text-[#1a1a1a]">
                    {subtitulo}
                    {radio && (
                        <>
                            {" "}
                            por <span className="tabular-nums">{brl(valor)}</span>
                        </>
                    )}
                </span>
                {link && (
                    <button
                        type="button"
                        className={cx(
                            "relative self-start text-xs font-semibold underline underline-offset-2 transition duration-100 ease-linear",
                            radio ? "text-[#1a1a1a] hover:text-[#525252]" : "text-[#ff4f1f] hover:text-[#e8410f]",
                        )}
                    >
                        {link}
                    </button>
                )}
            </span>
            {!radio && (
                <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-bold text-[#1a1a1a] tabular-nums">{brl(valor)}</span>
                    {/* A proteção sai pelo "Continuar sem proteção"; não precisa de Remover próprio */}
                    {id !== "protecao" && (
                        <button type="button" onClick={() => onRemover(id)} className="text-xs text-[#1a1a1a] underline underline-offset-2">
                            Remover
                        </button>
                    )}
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

/** Total com "+ taxas" em cima e a contagem de itens embaixo (coluna). */
function Total({ total, qtdItens }: { total: number; qtdItens: number }) {
    return (
        <span className="flex min-w-0 flex-col">
            <span className="flex flex-wrap items-baseline gap-x-1">
                <span className="text-base font-semibold whitespace-nowrap text-[#1a1a1a] tabular-nums">{brl(total)}</span>
                <span className="text-sm whitespace-nowrap text-[#7a7a7a]">+ taxas</span>
            </span>
            <span className="text-sm text-[#7a7a7a]">
                {qtdItens} {qtdItens === 1 ? "item" : "itens"}
            </span>
        </span>
    );
}

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

/** Rodapé de produção: total à esquerda, "Continuar" à direita. */
function TotalComBotao({ total, qtdItens, desabilitado }: { total: number; qtdItens: number; desabilitado?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <Total total={total} qtdItens={qtdItens} />
            <BotaoContinuar desabilitado={desabilitado}>Continuar</BotaoContinuar>
        </div>
    );
}

/** Rodapé da V3: "Continuar com proteção" de ponta a ponta (já liga a proteção) e "Prefiro correr o risco" embaixo, sem borda; ligada, fica só "Continuar". */
function RodapeV3({ total, qtdItens, ativa, onAtivar, desabilitado }: { total: number; qtdItens: number; desabilitado?: boolean } & ProtecaoRadio) {
    return (
        <div className="flex flex-col gap-3">
            <LinhaTotal total={total} qtdItens={qtdItens} />
            <BotaoContinuar largo desabilitado={desabilitado} onClick={onAtivar}>
                {/* Com a proteção já ligada, o convite perde sentido: vira só "Continuar" */}
                {ativa ? "Continuar" : "Continuar com proteção"}
            </BotaoContinuar>
            {!ativa && (
                <button
                    type="button"
                    disabled={desabilitado}
                    className="h-11 w-full rounded-xl text-sm font-semibold text-[#525252] transition duration-100 ease-linear hover:bg-[#f2f2f2] hover:text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Prefiro correr o risco
                </button>
            )}
        </div>
    );
}

/** Rodapé da V1: total, "Continuar com proteção" de ponta a ponta e "Continuar sem proteção" embaixo. */
function RodapeV1({
    total,
    qtdItens,
    comProtecao,
    desabilitado,
    onContinuarSemProtecao,
}: {
    total: number;
    qtdItens: number;
    comProtecao: boolean;
    desabilitado?: boolean;
    onContinuarSemProtecao?: () => void;
}) {
    return (
        <div className="flex flex-col gap-3">
            <LinhaTotal total={total} qtdItens={qtdItens} />
            <BotaoContinuar largo desabilitado={desabilitado}>
                {comProtecao ? "Continuar com proteção" : "Continuar"}
            </BotaoContinuar>
            {comProtecao && (
                <button
                    type="button"
                    onClick={onContinuarSemProtecao}
                    className="self-center text-sm font-medium text-[#7a7a7a] transition duration-100 ease-linear hover:text-[#1a1a1a]"
                >
                    Continuar sem proteção
                </button>
            )}
        </div>
    );
}

export const ICONE_INGRESSO = Ticket01;
export const ICONE_PROTECAO = ShieldTick;

function CardProtecao({ ativa, qtdIngressos, valor, onAtivar }: ProtecaoOpcional) {
    return (
        <div
            className={cx(
                "relative flex items-start gap-2.5 rounded-xl border p-3 transition duration-100 ease-linear",
                // Desligada parece um alerta a resolver antes de continuar (borda amarela); ativa, fica verde
                ativa ? "border-[#17b26a] bg-[#ecfdf3]" : "border-[#f79009] bg-[#fffaeb] hover:border-[#dc6803]",
            )}
        >
            {/* O card inteiro é o alvo do radio (botão esticado por cima); uma vez ativa, fica travada */}
            <button
                type="button"
                role="radio"
                aria-checked={ativa}
                aria-label="Adicionar proteção de compra"
                onClick={onAtivar}
                disabled={ativa}
                className="absolute inset-0 cursor-pointer rounded-xl disabled:cursor-default"
            />
            <Radio ativa={ativa} className="mt-0.5" corDesligado="border-[#dc6803]" />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
                {/* Ao ativar, o convite vira confirmação: o título antigo sobe e some, o novo entra de baixo */}
                <span className="relative overflow-hidden" aria-live="polite">
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                            key={ativa ? "protegido" : "convite"}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            className="block text-sm font-bold text-[#1a1a1a]"
                        >
                            {ativa ? (
                                <>{qtdIngressos === 1 ? "Ingresso protegido" : "Ingressos protegidos"}</>
                            ) : (
                                <>{qtdIngressos === 1 ? "Proteja seu ingresso de imprevistos" : "Proteja seus ingressos de imprevistos"}</>
                            )}
                        </motion.span>
                    </AnimatePresence>
                </span>
                <span className="text-sm text-[#1a1a1a]">
                    {qtdIngressos === 1 ? "Cobre 1 ingresso" : `Cobre ${qtdIngressos} ingressos`} por <span className="tabular-nums">{brl(valor)}</span>
                </span>
                <button
                    type="button"
                    className="relative self-start text-xs font-semibold text-[#525252] underline underline-offset-2 transition duration-100 ease-linear hover:text-[#1a1a1a]"
                >
                    Ver coberturas
                </button>
            </span>
        </div>
    );
}

/** Círculo do radio (só visual; o clique fica no botão esticado de quem usa). Ligado: verde, com o miolo branco surgindo com mola. */
function Radio({ ativa, className, corDesligado = "border-[#a3a3a3]" }: { ativa: boolean; className?: string; corDesligado?: string }) {
    return (
        <span
            aria-hidden="true"
            className={cx(
                "flex size-4 shrink-0 items-center justify-center rounded-full border transition duration-100 ease-linear",
                ativa ? "border-[#17b26a] bg-[#17b26a]" : cx(corDesligado, "bg-white"),
                className,
            )}
        >
            <AnimatePresence>
                {ativa && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 600, damping: 22 }}
                        className="size-1.5 rounded-full bg-white"
                    />
                )}
            </AnimatePresence>
        </span>
    );
}
