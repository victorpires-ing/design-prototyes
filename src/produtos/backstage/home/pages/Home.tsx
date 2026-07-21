import { useEffect, useRef, useState } from "react";
import { Pin01 } from "@untitledui/icons";
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

/** Orb de partículas (cymatics) redondo e flat. Sem fundo nem brilho. */
function CymaticsOrb({ className = "size-12" }: { className?: string }) {
    return (
        <span className={cx("relative shrink-0 overflow-hidden rounded-full", className)}>
            <CymaticsFill count={2000} dot={0.8} className="absolute inset-0 scale-125" />
        </span>
    );
}

/* ------------------------------------------------------------------ */
/*  Chat conversacional (coluna direita) — o gráfico aparece inline      */
/*  no chat (largura total, sem corte) e o usuário pode fixá-lo.         */
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
        <div className="flex flex-col overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary lg:sticky lg:top-6 lg:h-[60vh]">
            <div className="flex min-h-[280px] flex-1 flex-col gap-4 overflow-y-auto p-4">
                {conversa.length === 0 && !pending && (
                    <div className="m-auto flex max-w-xs flex-col items-center gap-3 text-center">
                        <CymaticsOrb className="size-14" />
                        <p className="text-sm text-tertiary">Converse sobre os seus eventos, como posso ajudar?</p>
                    </div>
                )}

                {conversa.map((t) =>
                    t.autor === "user" ? (
                        <div key={t.id} className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-brand-solid px-3.5 py-2 text-sm text-white">
                            {t.texto}
                        </div>
                    ) : (
                        <div key={t.id} className="flex w-full flex-col gap-2">
                            {t.texto && <p className="max-w-[95%] self-start text-sm text-secondary">{t.texto}</p>}
                            {t.bloco && (
                                <div className="flex w-full flex-col gap-1.5">
                                    <RelatorioIABlocks blocos={[t.bloco]} ids={[`c${t.id}`]} />
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
                    <div className="flex items-center gap-3 self-start text-sm text-tertiary">
                        <CymaticsOrb />
                        Gerando…
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
/*  Eventos do produtor — pôster vertical 3:4                          */
/* ------------------------------------------------------------------ */

const EVENTOS = [{ id: "reveillon", nome: EVENTO.nome, data: EVENTO.diaEvento, capa: eventCover }];

function EventoCard({ nome, data, capa }: { nome: string; data: string; capa: string }) {
    return (
        <button
            type="button"
            className="group flex flex-col overflow-hidden rounded-2xl bg-primary text-left ring-1 ring-border-secondary transition duration-100 ease-linear hover:ring-brand"
        >
            <div className="aspect-[3/4] w-full overflow-hidden bg-secondary">
                <img src={capa} alt="" aria-hidden="true" className="size-full object-cover transition-transform duration-200 ease-out group-hover:scale-105" />
            </div>
            <div className="flex flex-col gap-0.5 p-3">
                <h3 className="line-clamp-2 text-sm font-semibold text-primary">{nome}</h3>
                <span className="text-sm text-tertiary">{data}</span>
            </div>
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
    const [fixados, setFixados] = useState<Fixado[]>([]);
    const fseq = useRef(0);

    const fixar = (bloco: Bloco) => {
        const chave = JSON.stringify(bloco);
        setFixados((prev) => (prev.some((f) => JSON.stringify(f.bloco) === chave) ? prev : [{ id: `p${fseq.current++}`, bloco }, ...prev]));
    };
    const desafixar = (i: number) => setFixados((prev) => prev.filter((_, idx) => idx !== i));

    return (
        <BackstageLayout showEventContext={false}>
            <div className="grid min-w-0 flex-1 gap-6 py-8 md:px-2 lg:grid-cols-3">
                {/* Colunas 1–2: dashboard (fixados + eventos) */}
                <div className="flex flex-col gap-8 lg:col-span-2">
                    {fixados.length > 0 && (
                        <section className="flex flex-col gap-4">
                            <h2 className="text-lg font-semibold text-primary">Fixados no dashboard</h2>
                            <RelatorioIABlocks blocos={fixados.map((f) => f.bloco)} ids={fixados.map((f) => f.id)} onRemover={desafixar} />
                        </section>
                    )}

                    <section className="flex flex-col gap-4">
                        <h2 className="text-lg font-semibold text-primary">Seus eventos</h2>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                            {EVENTOS.map((e) => (
                                <EventoCard key={e.id} nome={e.nome} data={e.data} capa={e.capa} />
                            ))}
                        </div>
                    </section>
                </div>

                {/* Coluna 3: chat (fixo) — gráfico aparece aqui e pode ser fixado */}
                <div className="lg:col-span-1">
                    <ChatConversacional onPin={fixar} />
                </div>
            </div>
        </BackstageLayout>
    );
}
