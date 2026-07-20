import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { chamarIA, type Bloco, type Mensagem, type PeriodoSelecionado } from "../data/relatorio-ia";

/** Sugestão: `label` curto exibido no chip; `query` é o texto enviado à IA. */
interface Sugestao {
    label: string;
    query: string;
}

const POOL: Sugestao[] = [
    { label: "Faturamento", query: "Faturamento total" },
    { label: "Acumulado/dia", query: "Faturamento acumulado por dia" },
    { label: "Vendas por dia", query: "Vendas por dia" },
    { label: "Meios de pgto", query: "Meios de pagamento" },
    { label: "Ranking grupos", query: "Ranking de grupos por receita" },
    { label: "Ocupação", query: "Taxa de ocupação" },
    { label: "Acesso por tipo", query: "Taxa de acesso por tipo de ingresso" },
    { label: "Por status", query: "Transações por status" },
    { label: "Check-ins/hora", query: "Check-ins por horário" },
    { label: "Ticket médio", query: "Ticket médio" },
    { label: "Estatísticas", query: "Estatísticas do faturamento diário" },
    { label: "Correlação", query: "Correlação entre ingressos e faturamento" },
];

const batch = (offset: number, n = 3): Sugestao[] => Array.from({ length: n }, (_, i) => POOL[(offset + i) % POOL.length]);

/* ------------------------------------------------------------------ */
/*  Estado do chat (elevado para a página) — assim o composer pode      */
/*  mudar de posição (centro ↔ base) sem remontar e perder a conversa.  */
/* ------------------------------------------------------------------ */

export function useRelatorioChat({
    periodo,
    onResult,
    onPendingChange,
    onUser,
}: {
    periodo: PeriodoSelecionado;
    onResult: (resposta: string, blocos: Bloco[]) => void;
    onPendingChange?: (pending: boolean) => void;
    /** Chamado quando o usuário envia uma mensagem (para montar a thread visível). */
    onUser?: (texto: string) => void;
}) {
    const [entrada, setEntrada] = useState("");
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [offset, setOffset] = useState(0);
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [sugestoes, setSugestoes] = useState<Sugestao[]>(batch(0));

    const enviar = async (texto: string) => {
        const msg = texto.trim();
        if (!msg || carregando) return;
        setErro(null);
        setEntrada("");
        onUser?.(msg);
        const historico = [...mensagens, { autor: "user" as const, texto: msg }];
        setMensagens(historico);
        setCarregando(true);
        onPendingChange?.(true);
        try {
            const r = await chamarIA(historico, periodo);
            setMensagens((prev) => [...prev, { autor: "assistant", texto: r.resposta || "" }]);
            onResult(r.resposta || "", r.blocos);
            // Novas recomendações após cada pedido: rotaciona o pool (labels curtos e objetivos).
            const next = offset + 3;
            setOffset(next);
            setSugestoes(batch(next));
        } catch (e) {
            setErro((e as Error).message || "Falha ao consultar a IA.");
            setMensagens((prev) => prev.slice(0, -1));
        } finally {
            setCarregando(false);
            onPendingChange?.(false);
        }
    };

    return { entrada, setEntrada, carregando, erro, sugestoes, enviar };
}

export type ChatState = ReturnType<typeof useRelatorioChat>;

/* ------------------------------------------------------------------ */
/*  Composer apresentacional — variação `attached` (chips no container  */
/*  colado ao input, quando já há relatório na tela).                   */
/* ------------------------------------------------------------------ */

export function ComposerIA({ chat, attached = false }: { chat: ChatState; attached?: boolean }) {
    const { entrada, setEntrada, carregando, erro, sugestoes, enviar } = chat;

    const chips = (
        <div
            className={cx(
                "flex gap-2",
                // Attached: linha única com scroll horizontal. Empty: pode empilhar (wrap), centralizado.
                attached ? "overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : "flex-wrap justify-center",
            )}
        >
            <AnimatePresence mode="popLayout">
                {!carregando &&
                    sugestoes.map((s, i) => (
                        <motion.button
                            key={s.label}
                            type="button"
                            layout
                            initial={{ opacity: 0, scale: 0.8, y: 6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 6 }}
                            transition={{ duration: 0.18, ease: "easeOut", delay: i * 0.04 }}
                            onClick={() => enviar(s.query)}
                            className={cx(
                                "shrink-0 whitespace-nowrap rounded-full text-sm text-secondary transition-colors duration-100 ease-linear",
                                attached
                                    ? "px-2.5 py-1 hover:bg-secondary"
                                    : "bg-primary px-3.5 py-1.5 shadow-xs ring-1 ring-border-secondary hover:bg-primary_hover",
                            )}
                        >
                            {s.label}
                        </motion.button>
                    ))}
            </AnimatePresence>
        </div>
    );

    const form = (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                enviar(entrada);
            }}
            className={cx(
                "flex items-center gap-2 rounded-full py-2 pr-2 pl-5",
                attached ? "bg-secondary" : "bg-primary shadow-lg ring-1 ring-border-secondary focus-within:ring-brand",
            )}
        >
            <input
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
                placeholder="Peça um ou vários gráficos sobre o evento…"
                className="min-w-0 flex-1 bg-transparent py-1.5 text-md text-primary outline-none placeholder:text-placeholder"
            />
            <button
                type="submit"
                disabled={!entrada.trim() || carregando}
                aria-label="Enviar"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-solid text-white transition hover:bg-brand-solid_hover disabled:cursor-not-allowed disabled:opacity-50"
            >
                <ArrowUp className="size-5" aria-hidden="true" />
            </button>
        </form>
    );

    return (
        <div className="mx-auto flex w-full max-w-[760px] flex-col gap-3">
            {erro && <p className="px-1 text-center text-sm text-error-primary">{erro}</p>}
            {attached ? (
                // Chips num container colado ao input.
                <div className="flex flex-col gap-2 rounded-[28px] bg-primary p-2 shadow-lg ring-1 ring-border-secondary">
                    {chips}
                    {form}
                </div>
            ) : (
                // Empty state: input em destaque, exemplos logo abaixo.
                <>
                    {form}
                    {chips}
                </>
            )}
        </div>
    );
}
