import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
    ArrowRight,
    ArrowUp,
    ClockRewind,
    Copy01,
    Edit05,
    MessageCircle01,
    Microphone01,
    Plus,
    Share04,
    ThumbsDown,
    ThumbsUp,
    XClose,
} from "@untitledui/icons";
import { toast } from "sonner";
import { CymaticsFill } from "@/components/application/loading-indicator/cymatics-loader";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { setEventoAtual } from "../../eventos/data/eventos";
import { BlocoRemix, Destaque, type AbrirEvento } from "./RemixCharts";
import { useRemix } from "./remix-context";
import { responder, sugestoesPara, type Resposta } from "./remix-respostas";

interface Turno {
    id: number;
    pergunta: string;
    resposta: Resposta | null;
}

const HISTORICO = [
    { periodo: "Hoje", itens: ["Qual está sendo a ocupação por sessão?", "Quanto faturei em cada evento ativo?"] },
    { periodo: "Ontem", itens: ["Quais eventos precisam de atenção?", "Como meus clientes estão pagando?"] },
];

/** Conteúdo do agente — usado tanto na doca do desktop quanto na folha mobile. */
export function RemixPanel() {
    const navigate = useNavigate();
    const { fechar, escopo, escopoLabel, perguntaPendente, limparPergunta } = useRemix();

    const [turnos, setTurnos] = useState<Turno[]>([]);
    const [rascunho, setRascunho] = useState("");
    const [pensando, setPensando] = useState(false);
    const [historicoAberto, setHistoricoAberto] = useState(false);
    const fimRef = useRef<HTMLDivElement>(null);

    const novaConversa = () => {
        setTurnos([]);
        setRascunho("");
        setPensando(false);
        setHistoricoAberto(false);
    };

    const perguntar = (texto: string) => {
        const pergunta = texto.trim();
        if (!pergunta) return;
        const id = Date.now();
        setTurnos((atuais) => [...atuais, { id, pergunta, resposta: null }]);
        setRascunho("");
        setPensando(true);
        window.setTimeout(() => {
            setTurnos((atuais) => atuais.map((t) => (t.id === id ? { ...t, resposta: responder(pergunta, escopo) } : t)));
            setPensando(false);
        }, 3000);
    };

    // Pergunta disparada de outra tela (ex.: um alerta no painel de eventos).
    useEffect(() => {
        if (!perguntaPendente) return;
        perguntar(perguntaPendente);
        limparPergunta();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [perguntaPendente]);

    useEffect(() => {
        fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [turnos, pensando]);

    const sugestoes = sugestoesPara(escopo);

    return (
        <div className="flex h-full flex-col bg-primary">
            <header className="flex items-center gap-1 border-b border-secondary px-4 py-3">
                <BotaoHeader
                    icon={ClockRewind}
                    label="Histórico de conversas"
                    ativo={historicoAberto}
                    onClick={() => setHistoricoAberto((v) => !v)}
                />
                <BotaoHeader icon={Edit05} label="Nova conversa" onClick={novaConversa} />

                <div className="flex min-w-0 flex-1 flex-col items-center">
                    <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                        <RemixMark className="size-5" />
                        Remix
                    </span>
                    <span className="max-w-full truncate text-sm text-tertiary">{escopoLabel}</span>
                </div>

                <BotaoHeader icon={XClose} label="Fechar Remix" onClick={fechar} />
            </header>

            {historicoAberto ? (
                <Conversas
                    onAbrir={(item) => {
                        setHistoricoAberto(false);
                        setTurnos([]);
                        perguntar(item);
                    }}
                />
            ) : (
                <>
                    <div className="relative flex min-h-0 flex-1 flex-col">
                        {/* O cymatics preenche toda a parte de baixo do chat enquanto o agente pensa. */}
                        {pensando && (
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] [mask-image:linear-gradient(to_bottom,transparent,black_35%)]"
                            >
                                <CymaticsFill count={4500} dot={1} />
                            </div>
                        )}
                        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
                            {turnos.length === 0 && !pensando ? (
                                <div className="flex flex-1 flex-col justify-end gap-3">
                                    <h2 className="text-center text-display-xs font-bold text-primary">Como você quer começar?</h2>
                                    <p className="mb-4 text-center text-sm text-tertiary">Respondo sobre {escopoLabel.toLowerCase()}.</p>
                                    {sugestoes.map((sugestao) => (
                                        <button
                                            key={sugestao.id}
                                            type="button"
                                            onClick={() => perguntar(sugestao.texto)}
                                            className="rounded-xl bg-secondary px-4 py-3 text-left text-sm text-secondary transition duration-100 ease-linear hover:bg-secondary_hover"
                                        >
                                            {sugestao.texto}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                turnos.map((turno) => (
                                    <div key={turno.id} className="flex flex-col gap-3">
                                        <p className="ml-auto max-w-[85%] rounded-xl bg-secondary px-4 py-3 text-sm text-primary">
                                            {turno.pergunta}
                                        </p>
                                        {turno.resposta ? (
                                            <CartaoResposta
                                                resposta={turno.resposta}
                                                onNavigate={navigate}
                                                onPerguntar={perguntar}
                                                onAbrirEvento={(eventoId, href) => {
                                                    setEventoAtual(eventoId);
                                                    fechar();
                                                    navigate(href);
                                                }}
                                            />
                                        ) : (
                                            <Pensando />
                                        )}
                                    </div>
                                ))
                            )}
                            <div ref={fimRef} />
                        </div>
                    </div>

                    <div className="border-t border-secondary p-3">
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                perguntar(rascunho);
                            }}
                            className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2"
                        >
                            <button
                                type="button"
                                aria-label="Anexar"
                                onClick={() => toast("Anexos ainda não estão disponíveis neste protótipo")}
                                className="flex size-8 shrink-0 items-center justify-center rounded-md text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary_hover"
                            >
                                <Plus className="size-5" />
                            </button>
                            <input
                                value={rascunho}
                                onChange={(event) => setRascunho(event.target.value)}
                                placeholder="Consulte informações dos eventos"
                                aria-label="Pergunte ao Remix"
                                className="min-w-0 flex-1 bg-transparent text-sm text-primary outline-hidden placeholder:text-placeholder"
                            />
                            {rascunho.trim() ? (
                                <button
                                    type="submit"
                                    aria-label="Enviar pergunta"
                                    className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-solid text-white transition duration-100 ease-linear hover:bg-brand-solid_hover"
                                >
                                    <ArrowUp className="size-5" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    aria-label="Ditar pergunta"
                                    onClick={() => toast("Ditado ainda não está disponível neste protótipo")}
                                    className="flex size-8 shrink-0 items-center justify-center rounded-md text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary_hover"
                                >
                                    <Microphone01 className="size-5" />
                                </button>
                            )}
                        </form>
                    </div>
                </>
            )}
        </div>
    );
}

/** Enquanto pensa, só a linha de status — o cymatics preenche o fundo do chat. */
const Pensando = () => (
    <p className="flex items-center gap-2 text-sm text-tertiary">
        <RemixMark className="size-5 shrink-0 animate-pulse text-fg-brand-primary" />
        Analisando eventos…
    </p>
);

const BotaoHeader = ({
    icon: Icone,
    label,
    ativo,
    onClick,
}: {
    icon: typeof ClockRewind;
    label: string;
    ativo?: boolean;
    onClick: () => void;
}) => (
    <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={ativo}
        className={cx(
            "flex size-9 shrink-0 items-center justify-center rounded-md text-fg-secondary transition duration-100 ease-linear hover:bg-secondary",
            ativo && "bg-secondary",
        )}
    >
        <Icone className="size-5" />
    </button>
);

/** Tela de histórico — substitui o chat inteiro, como no template. */
const Conversas = ({ onAbrir }: { onAbrir: (item: string) => void }) => (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
        <h2 className="text-display-xs font-bold text-primary">Conversas</h2>
        {HISTORICO.map((grupo) => (
            <div key={grupo.periodo} className="flex flex-col gap-2">
                <p className="text-sm text-tertiary">{grupo.periodo}</p>
                {grupo.itens.map((item) => (
                    <button
                        key={item}
                        type="button"
                        onClick={() => onAbrir(item)}
                        className="-mx-2 flex items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm font-semibold text-secondary transition duration-100 ease-linear hover:bg-secondary hover:text-secondary_hover"
                    >
                        <MessageCircle01 className="mt-0.5 size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                        {item}
                    </button>
                ))}
            </div>
        ))}
    </div>
);

const CartaoResposta = ({
    resposta,
    onNavigate,
    onPerguntar,
    onAbrirEvento,
}: {
    resposta: Resposta;
    onNavigate: (href: string) => void;
    onPerguntar: (pergunta: string) => void;
    onAbrirEvento: AbrirEvento;
}) => {
    const [fixarAberto, setFixarAberto] = useState(false);
    const [voto, setVoto] = useState<"sim" | "nao" | null>(null);

    return (
        <div className="flex flex-col gap-3">
            {/* Número em destaque vem num cartão próprio, antes do principal. */}
            {resposta.destaque && (
                <div className="rounded-xl bg-secondary p-2 ring-1 ring-border-secondary">
                    <Destaque rotulo={resposta.destaque.rotulo} valor={resposta.destaque.valor} />
                </div>
            )}

            {/* Um cartão só: título, gráfico e o insight no fim — não uma bolha separada. */}
            <div className="flex flex-col gap-4 rounded-xl bg-secondary p-4 ring-1 ring-border-secondary">
                {resposta.titulo && <h3 className="text-md font-semibold text-primary">{resposta.titulo}</h3>}
                {resposta.bloco && <BlocoRemix bloco={resposta.bloco} onAbrirEvento={onAbrirEvento} />}
                <p className="text-sm text-secondary">{resposta.insight}</p>
            </div>

            <div className="relative flex items-center gap-1">
                <AcaoIcone
                    icone={ThumbsUp}
                    label="Resposta útil"
                    ativo={voto === "sim"}
                    onClick={() => setVoto(voto === "sim" ? null : "sim")}
                />
                <AcaoIcone
                    icone={ThumbsDown}
                    label="Resposta ruim"
                    ativo={voto === "nao"}
                    onClick={() => setVoto(voto === "nao" ? null : "nao")}
                />
                <span aria-hidden="true" className="mx-1 h-4 w-px bg-border-secondary" />
                <AcaoIcone icone={Copy01} label="Copiar resposta" onClick={() => toast.success("Resposta copiada")} />
                <AcaoIcone icone={Share04} label="Compartilhar" onClick={() => toast.success("Link de compartilhamento criado")} />
                <AcaoIcone icone={PinIcon} label="Fixar" ativo={fixarAberto} onClick={() => setFixarAberto((v) => !v)} />

                {fixarAberto && (
                    <div className="absolute bottom-full left-0 z-10 mb-2 flex w-60 flex-col rounded-lg bg-primary py-1 shadow-lg ring-1 ring-border-secondary">
                        <button
                            type="button"
                            onClick={() => {
                                setFixarAberto(false);
                                toast.success("Fixado no relatório “Audiência”");
                            }}
                            className="px-3 py-2 text-left text-sm text-primary transition duration-100 ease-linear hover:bg-primary_hover"
                        >
                            Fixar no relatório “Audiência”
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setFixarAberto(false);
                                toast.success("Novo dashboard criado com este gráfico");
                            }}
                            className="px-3 py-2 text-left text-sm text-primary transition duration-100 ease-linear hover:bg-primary_hover"
                        >
                            Novo dashboard
                        </button>
                    </div>
                )}
            </div>

            {/* Ações empilhadas e alinhadas à esquerda, com a largura do texto. */}
            {resposta.acoes && resposta.acoes.length > 0 && (
                <div className="flex flex-col items-start gap-2">
                    {resposta.acoes.map((acao) => (
                        <Button
                            key={acao.label}
                            size="md"
                            color="secondary"
                            iconTrailing={acao.href || acao.pergunta ? ArrowRight : undefined}
                            onClick={() => {
                                if (acao.pergunta) return onPerguntar(acao.pergunta);
                                if (acao.href) return onNavigate(acao.href);
                                toast.success(`${acao.label}: ação enviada`);
                            }}
                        >
                            {acao.label}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
};

const AcaoIcone = ({
    icone: Icone,
    label,
    ativo,
    onClick,
}: {
    icone: typeof ThumbsUp;
    label: string;
    ativo?: boolean;
    onClick: () => void;
}) => (
    <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={ativo}
        className={cx(
            "flex size-8 items-center justify-center rounded-md text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-fg-secondary_hover",
            ativo && "text-fg-brand-primary ring-1 ring-brand",
        )}
    >
        <Icone className="size-4" />
    </button>
);

const PinIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m9 15-4.5 4.5M14.5 4.5l5 5-3 1-4 4-1.5-1.5-3-3L7.5 8.5l4-4 3-1Z" />
    </svg>
);

/** Marca do Remix — o mesmo símbolo da Ingresse usado no launcher e no header. */
export const RemixMark = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
        <path d="M3 8.5 12 4l9 4.5-9 4.5-9-4.5Zm0 4.2 9 4.5 9-4.5v2.6L12 19.8 3 15.3v-2.6Z" />
    </svg>
);
