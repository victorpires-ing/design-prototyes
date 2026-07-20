import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, BarChartSquare02, Calendar, MarkerPin01, Pin01 } from "@untitledui/icons";
import { CymaticsFill } from "@/components/application/loading-indicator/cymatics-loader";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { ComposerIA, useRelatorioChat } from "../../relatorios/components/RelatorioIAChat";
import { RelatorioIABlocks } from "../../relatorios/components/RelatorioIABlocks";
import { EVENTO, PERIODO_PADRAO, type Bloco } from "../../relatorios/data/relatorio-ia";
import eventCover from "@/assets/event-cover.png";

/* Resumo textual de um bloco (acompanha o gráfico na resposta do chat). */
function resumir(bloco: Bloco): string {
    switch (bloco.tipo) {
        case "metric":
            return `${bloco.titulo}: ${bloco.valor}.${bloco.ajuda ? ` ${bloco.ajuda}.` : ""}`;
        case "medidor":
            return `${bloco.titulo} está em ${bloco.pct}%.${bloco.detalhe ? ` ${bloco.detalhe}.` : ""}`;
        case "barras":
        case "pizza": {
            if (!bloco.dados.length) return bloco.titulo;
            const top = [...bloco.dados].sort((a, b) => b.valor - a.valor)[0];
            const total = bloco.dados.reduce((s, d) => s + d.valor, 0);
            const pct = total ? Math.round((top.valor / total) * 100) : 0;
            return `Em ${bloco.titulo.toLowerCase()}, ${top.nome} lidera com ${pct}% do total.`;
        }
        case "linha": {
            if (bloco.dados.length < 2) return bloco.titulo;
            const ini = bloco.dados[0].valor;
            const fim = bloco.dados[bloco.dados.length - 1].valor;
            const varPct = ini ? Math.round(((fim - ini) / Math.abs(ini)) * 100) : 0;
            return `${bloco.titulo}: variação de ${varPct >= 0 ? "+" : ""}${varPct}% do início ao fim do período.`;
        }
        case "dispersao":
            return bloco.ajuda ?? bloco.titulo;
        case "tabela":
            return `${bloco.titulo} — veja o detalhamento abaixo.`;
        case "texto":
            return bloco.conteudo;
        default:
            return "";
    }
}

/* ------------------------------------------------------------------ */
/*  Chat conversacional (coluna direita)                               */
/* ------------------------------------------------------------------ */

interface Turno {
    id: number;
    autor: "user" | "assistant";
    texto?: string;
    bloco?: Bloco | null;
}

function ChatConversacional({ onPin }: { onPin: (bloco: Bloco) => void }) {
    const [conversa, setConversa] = useState<Turno[]>([]);
    const [pending, setPending] = useState(false);
    const seq = useState(() => ({ n: 0 }))[0];
    const fimRef = useRef<HTMLDivElement>(null);

    const chat = useRelatorioChat({
        periodo: PERIODO_PADRAO,
        onPendingChange: setPending,
        onUser: (texto) => setConversa((prev) => [...prev, { id: ++seq.n, autor: "user", texto }]),
        onResult: (resposta, blocos) => {
            const bloco = blocos[0] ?? null;
            setConversa((prev) => [...prev, { id: ++seq.n, autor: "assistant", texto: bloco ? resumir(bloco) : resposta || "Aqui está.", bloco }]);
        },
    });

    useEffect(() => {
        fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [conversa, pending]);

    return (
        <div className="flex flex-col overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary lg:sticky lg:top-6 lg:h-[calc(100vh-7rem)]">
            <div className="flex items-center gap-2 border-b border-secondary px-4 py-3">
                <BarChartSquare02 className="size-4 text-fg-brand-primary" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-primary">Assistente</h2>
            </div>

            <div className="flex min-h-[320px] flex-1 flex-col gap-4 overflow-y-auto p-4">
                {conversa.length === 0 && !pending && (
                    <div className="m-auto flex max-w-xs flex-col items-center gap-2 text-center">
                        <span className="size-12 rounded-full bg-gradient-to-br from-brand-300 to-brand-600" aria-hidden="true" />
                        <p className="text-sm text-tertiary">Converse sobre o evento. Peça um gráfico e fixe no dashboard ao lado.</p>
                    </div>
                )}

                {conversa.map((t) =>
                    t.autor === "user" ? (
                        <div key={t.id} className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-brand-solid px-3.5 py-2 text-sm text-white">
                            {t.texto}
                        </div>
                    ) : (
                        <div key={t.id} className="flex flex-col gap-2">
                            {t.texto && <p className="max-w-[92%] self-start text-sm text-secondary">{t.texto}</p>}
                            {t.bloco && (
                                <div className="flex flex-col gap-1.5">
                                    <RelatorioIABlocks blocos={[t.bloco]} />
                                    <button
                                        type="button"
                                        onClick={() => onPin(t.bloco!)}
                                        className="flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-brand-secondary transition duration-100 ease-linear hover:bg-secondary"
                                    >
                                        <Pin01 className="size-4" aria-hidden="true" />
                                        Fixar no dashboard
                                    </button>
                                </div>
                            )}
                        </div>
                    ),
                )}

                {pending && (
                    <div className="flex items-center gap-2 self-start text-sm text-tertiary">
                        <span className="size-2 animate-bounce rounded-full bg-fg-quaternary [animation-delay:-0.2s]" />
                        <span className="size-2 animate-bounce rounded-full bg-fg-quaternary [animation-delay:-0.1s]" />
                        <span className="size-2 animate-bounce rounded-full bg-fg-quaternary" />
                    </div>
                )}
                <div ref={fimRef} />
            </div>

            <div className="border-t border-secondary p-3">
                <ComposerIA chat={chat} attached />
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Dashboard (colunas 1–2): fixados + evento + relatórios             */
/* ------------------------------------------------------------------ */

const RELATORIOS = [
    { label: "Vendas por grupo", href: "/backstage/relatorios/vendas-por-grupo" },
    { label: "Transações", href: "/backstage/relatorios/transacoes" },
    { label: "Acesso", href: "/backstage/relatorios/acesso" },
    { label: "Borderô", href: "/backstage/relatorios/bordero" },
    { label: "Comparativos", href: "/backstage/relatorios/comparativos" },
    { label: "Relatório personalizado", href: "/backstage/relatorios/relatorio-personalizado" },
];

function EventoCard() {
    return (
        <button
            type="button"
            className="group flex w-full items-center gap-4 overflow-hidden rounded-2xl bg-primary p-3 text-left ring-1 ring-border-secondary transition duration-100 ease-linear hover:ring-brand"
        >
            <img src={eventCover} alt="" aria-hidden="true" className="size-20 shrink-0 rounded-xl object-cover" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h3 className="truncate text-md font-semibold text-primary">{EVENTO.nome}</h3>
                <span className="flex items-center gap-1.5 text-sm text-tertiary">
                    <Calendar className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                    {EVENTO.diaEvento}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-tertiary">
                    <MarkerPin01 className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                    <span className="truncate">{EVENTO.local}</span>
                </span>
            </div>
            <ArrowRight className="mr-1 size-5 shrink-0 text-fg-quaternary transition-transform duration-100 ease-linear group-hover:translate-x-0.5" aria-hidden="true" />
        </button>
    );
}

/* ------------------------------------------------------------------ */
/*  Página                                                             */
/* ------------------------------------------------------------------ */

interface Fixado {
    id: string;
    bloco: Bloco;
}

export function Home() {
    const navigate = useNavigate();
    const [fixados, setFixados] = useState<Fixado[]>([]);
    const fseq = useRef(0);

    const fixar = (bloco: Bloco) => {
        const chave = JSON.stringify(bloco);
        setFixados((prev) => (prev.some((f) => JSON.stringify(f.bloco) === chave) ? prev : [{ id: `p${fseq.current++}`, bloco }, ...prev]));
    };
    const desafixar = (i: number) => setFixados((prev) => prev.filter((_, idx) => idx !== i));

    return (
        <BackstageLayout showEventContext={false}>
            <div className="grid flex-1 grid-cols-1 gap-6 py-6 lg:grid-cols-3">
                {/* Colunas 1–2: dashboard */}
                <div className="flex flex-col gap-8 lg:col-span-2">
                    {fixados.length > 0 && (
                        <section className="flex flex-col gap-4">
                            <h2 className="text-lg font-semibold text-primary">Fixados no dashboard</h2>
                            <RelatorioIABlocks blocos={fixados.map((f) => f.bloco)} ids={fixados.map((f) => f.id)} onRemover={desafixar} />
                        </section>
                    )}

                    <section className="flex flex-col gap-4">
                        <h2 className="text-lg font-semibold text-primary">Seu evento</h2>
                        <EventoCard />
                    </section>

                    <section className="flex flex-col gap-4">
                        <h2 className="text-lg font-semibold text-primary">Relatórios</h2>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {RELATORIOS.map((r) => (
                                <button
                                    key={r.href}
                                    type="button"
                                    onClick={() => navigate(r.href)}
                                    className="group flex items-center justify-between gap-3 rounded-xl bg-primary px-4 py-3 text-left ring-1 ring-border-secondary transition duration-100 ease-linear hover:ring-brand"
                                >
                                    <span className="flex items-center gap-2.5 text-sm font-medium text-primary">
                                        <BarChartSquare02 className="size-4 text-fg-quaternary" aria-hidden="true" />
                                        {r.label}
                                    </span>
                                    <ArrowRight className="size-4 shrink-0 text-fg-quaternary transition-transform duration-100 ease-linear group-hover:translate-x-0.5" aria-hidden="true" />
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Coluna 3: chat conversacional */}
                <div className="lg:col-span-1">
                    <ChatConversacional onPin={fixar} />
                </div>
            </div>
        </BackstageLayout>
    );
}
