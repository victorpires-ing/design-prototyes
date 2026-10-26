import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Button as AriaButton,
    Dialog as AriaDialog,
    DialogTrigger as AriaDialogTrigger,
    ListBox as AriaListBox,
    ListBoxItem as AriaListBoxItem,
    Popover as AriaPopover,
} from "react-aria-components";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, SearchLg, Users01 } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { GRUPO_MEMBROS_POR_ID, GRUPOS_MEMBROS } from "../data/membros";

interface Props {
    /** Grupo de Membros vinculado (id), ou undefined enquanto nada foi escolhido. */
    valor?: string;
    onChange: (id: string) => void;
    /** Grupos de Membros já vinculados a outro grupo de cotas: aparecem, mas não podem ser escolhidos. */
    indisponiveis?: string[];
}

/**
 * "Qual grupo será vinculado?": dropdown com os grupos de Membros, com busca dentro da
 * lista. Depois de escolher, mostra quem faz parte do grupo — é quem vira operador.
 */
const EASE = [0.22, 1, 0.36, 1] as const;
const ENTRADA = {
    oculto: { opacity: 0, y: -6 },
    visivel: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE } },
};

export function SeletorGrupoMembros({ valor, onChange, indisponiveis = [] }: Props) {
    const [aberto, setAberto] = useState(false);
    const [busca, setBusca] = useState("");
    const lista = useRef<HTMLDivElement>(null);
    const reduzir = useReducedMotion();
    const escolhido = valor ? GRUPO_MEMBROS_POR_ID[valor] : undefined;
    const [alturaMembros, setAlturaMembros] = useState<number | null>(null);
    const observador = useRef<ResizeObserver | null>(null);
    // Mede a área de membros sempre que o conteúdo muda de tamanho (ex.: trocar de grupo).
    const medirMembros = useCallback((no: HTMLDivElement | null) => {
        observador.current?.disconnect();
        if (!no) return;
        observador.current = new ResizeObserver(([entrada]) => setAlturaMembros(entrada.target.getBoundingClientRect().height));
        observador.current.observe(no);
    }, []);

    // Sem o modo modal, fechar ao clicar fora e com Esc fica por nossa conta.
    const gatilho = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        if (!aberto) return;
        const fora = (e: PointerEvent) => {
            const alvo = e.target as Node;
            // A lista é identificada pela marcação no conteúdo (a ref do Popover não chega ao DOM).
            if ((alvo as Element).closest?.("[data-lista-grupos]") || gatilho.current?.contains(alvo)) return;
            setAberto(false);
            setBusca("");
        };
        const esc = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            e.preventDefault();
            setAberto(false);
            setBusca("");
            gatilho.current?.focus({ preventScroll: true });
        };
        document.addEventListener("pointerdown", fora, true);
        document.addEventListener("keydown", esc, true);
        return () => {
            document.removeEventListener("pointerdown", fora, true);
            document.removeEventListener("keydown", esc, true);
        };
    }, [aberto]);

    // Ao reabrir com um grupo já escolhido, a lista abre rolada até ele (senão ele fica escondido abaixo).
    useEffect(() => {
        if (!aberto || !valor) return;
        const t = window.setTimeout(() => {
            // Rola só a lista (scrollIntoView também rolaria a página, outro "pulo").
            const el = lista.current?.querySelector<HTMLElement>(`[data-key="${valor}"]`);
            const caixa = lista.current;
            if (el && caixa) caixa.scrollTop = el.offsetTop - caixa.clientHeight / 2 + el.offsetHeight / 2;
        }, 0);
        return () => window.clearTimeout(t);
    }, [aberto, valor]);

    const visiveis = useMemo(() => {
        const q = busca.trim().toLowerCase();
        return q ? GRUPOS_MEMBROS.filter((g) => g.nome.toLowerCase().includes(q)) : GRUPOS_MEMBROS;
    }, [busca]);

    return (
        <div className="flex flex-col rounded-xl bg-primary p-6 ring-1 ring-border-secondary ring-inset">
            <div className="flex flex-col gap-1.5">
                <span id="rotulo-grupos" className="text-sm font-medium text-secondary">
                    Grupos
                </span>
                <AriaDialogTrigger
                    isOpen={aberto}
                    onOpenChange={(abrir) => {
                        setAberto(abrir);
                        if (!abrir) setBusca("");
                    }}
                >
                    <AriaButton
                        ref={gatilho}
                        aria-labelledby="rotulo-grupos"
                        // Com a lista aberta o destaque fica só na busca. Depois de escolher o campo também
                        // fica neutro: o anel aparece só para quem navega pelo teclado (acessibilidade).
                        className={({ isFocusVisible }) =>
                            cx(
                                "flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg bg-primary px-3 text-left text-sm shadow-xs ring-1 ring-border-primary outline-hidden transition duration-100 ease-linear ring-inset",
                                isFocusVisible && !aberto && "ring-2 ring-brand",
                            )
                        }
                    >
                        <span className={cx("min-w-0 flex-1 truncate font-normal", escolhido ? "text-primary" : "text-placeholder")}>
                            {escolhido ? escolhido.nome : "Selecione um grupo de membros"}
                        </span>
                        <ChevronDown
                            className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-200 ease-out", aberto && "rotate-180")}
                            aria-hidden="true"
                        />
                    </AriaButton>

                    <AriaPopover
                        // Não modal: o modo modal trava a rolagem da página (overflow hidden no <html>),
                        // a barra de rolagem some e a tela inteira "pula" para o lado ao abrir/fechar.
                        isNonModal
                        placement="bottom start"
                        offset={4}
                        className={({ isEntering, isExiting }) =>
                            cx(
                                // Fica fora de .tema-cotas (portal): repete a classe para herdar fonte e cores.
                                // Camada elevada: fundo um tom acima do card, borda visível e sombra escura —
                                // aberta por cima da lista de membros, não se confunde com o que está atrás.
                                "tema-cotas w-(--trigger-width) overflow-hidden rounded-lg bg-secondary shadow-[0_16px_40px_-8px_rgb(0_0_0/0.75),0_4px_12px_-4px_rgb(0_0_0/0.5)] ring-1 ring-border-primary outline-hidden",
                                isEntering && "duration-150 ease-out animate-in fade-in slide-in-from-top-1",
                                isExiting && "duration-100 ease-in animate-out fade-out",
                            )
                        }
                    >
                        <AriaDialog aria-label="Grupos de membros" className="outline-hidden" data-lista-grupos>
                            <div className="p-1.5">
                                <Input
                                    size="sm"
                                    icon={SearchLg}
                                    placeholder="Buscar grupo"
                                    aria-label="Buscar grupo"
                                    value={busca}
                                    onChange={setBusca}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        // Seta para baixo leva da busca para a lista.
                                        if (e.key === "ArrowDown") {
                                            e.preventDefault();
                                            lista.current?.querySelector<HTMLElement>("[role=option]")?.focus();
                                        }
                                    }}
                                />
                            </div>
                            {visiveis.length === 0 ? (
                                <p className="px-3 pt-2 pb-4 text-sm text-tertiary">Nenhum grupo encontrado.</p>
                            ) : (
                                <AriaListBox
                                    ref={lista}
                                    aria-label="Grupos de membros"
                                    // Só ação (sem selectionMode): com seleção ligada, clicar em outro grupo
                                    // com um já escolhido apenas alternava a seleção e não trocava o grupo.
                                    onAction={(id) => {
                                        onChange(String(id));
                                        setAberto(false);
                                        setBusca("");
                                    }}
                                    items={visiveis}
                                    disabledKeys={indisponiveis}
                                    // Barra de rolagem própria: a global usa border-secondary (#262626), a mesma cor
                                    // do fundo desta lista, e sumia. Fina (6px) como a do Figma.
                                    className="max-h-[176px] overflow-y-auto px-1.5 pb-1.5 outline-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-0 [&::-webkit-scrollbar-thumb]:bg-[var(--color-border-primary)] hover:[&::-webkit-scrollbar-thumb]:bg-[var(--color-fg-quaternary)] [&::-webkit-scrollbar-track]:bg-transparent"
                                >
                                    {(g) => (
                                        <AriaListBoxItem
                                            id={g.id}
                                            textValue={g.nome}
                                            aria-current={g.id === valor || undefined}
                                            className={({ isFocused, isHovered, isDisabled }) =>
                                                cx(
                                                    "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-hidden transition duration-100 ease-linear",
                                                    isDisabled ? "cursor-not-allowed" : "cursor-pointer",
                                                    !isDisabled && (isFocused || isHovered || g.id === valor) && "bg-primary_hover",
                                                )
                                            }
                                        >
                                            {({ isDisabled }) => (
                                                <>
                                                    <span className={cx("truncate font-medium text-primary", isDisabled && "opacity-50")}>{g.nome}</span>
                                                    <span className={cx("shrink-0 text-tertiary", isDisabled && "opacity-50")}>
                                                        {g.emails.length} {g.emails.length === 1 ? "membro" : "membros"}
                                                    </span>
                                                    {isDisabled && <span className="ml-auto shrink-0 text-xs text-tertiary">Já vinculado</span>}
                                                </>
                                            )}
                                        </AriaListBoxItem>
                                    )}
                                </AriaListBox>
                            )}
                        </AriaDialog>
                    </AriaPopover>
                </AriaDialogTrigger>
            </div>

            {/*
             * Depois de escolher: quem faz parte do grupo (vira operador). A área abre em altura
             * e os e-mails entram em cascata; trocar de grupo ajusta a altura e troca o conteúdo.
             */}
            <AnimatePresence initial={false}>
                {escolhido && (
                    <motion.div
                        key="membros"
                        initial={reduzir ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        // A altura segue o conteúdo medido: abrir e trocar de grupo animam do mesmo jeito.
                        animate={{ height: reduzir || alturaMembros === null ? "auto" : alturaMembros, opacity: 1 }}
                        exit={reduzir ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={{ height: { duration: 0.4, ease: EASE }, opacity: { duration: 0.2 } }}
                        className="overflow-hidden"
                    >
                        <div ref={medirMembros} className="pt-4">
                            <AnimatePresence mode="popLayout" initial={false}>
                                <motion.div
                                    key={escolhido.id}
                                    initial="oculto"
                                    animate="visivel"
                                    exit={{ opacity: 0, transition: { duration: 0.12 } }}
                                    variants={{ visivel: { transition: { staggerChildren: reduzir ? 0 : 0.035, delayChildren: reduzir ? 0 : 0.08 } } }}
                                    className="flex flex-col gap-3"
                                >
                                    <motion.div variants={ENTRADA} className="flex items-center gap-2 text-sm font-medium text-secondary">
                                        <Users01 className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                        <span>
                                            {escolhido.nome} – {escolhido.emails.length} {escolhido.emails.length === 1 ? "membro" : "membros"} neste grupo
                                        </span>
                                    </motion.div>
                                    <ul className="flex flex-col">
                                        {escolhido.emails.map((email) => (
                                            <motion.li key={email} variants={ENTRADA} className="border-t border-secondary py-2.5 text-sm text-secondary first:border-t-0">
                                                {email}
                                            </motion.li>
                                        ))}
                                    </ul>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
