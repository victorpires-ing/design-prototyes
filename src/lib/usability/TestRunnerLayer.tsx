/**
 * Camada global do runner de testes. Montada na raiz (como o CommentsLayer),
 * percorre os BLOCOS do teste:
 *  - atividade: briefing de tela cheia à esquerda (fundo desfocado) → ao clicar
 *    "Começar", o briefing fecha e o participante usa as telas reais; um bloco
 *    de declaração (Desisti/Concluí) aparece à direita (imediato ou após N s),
 *    minimizável, com justificativa opcional ao desistir.
 *  - pergunta: tela cheia estilo Typeform (sem caixa, direto no fundo).
 *  - sus: as 10 afirmações da Escala de Usabilidade do Sistema.
 *  - obrigado: tela final (só mensagem, sem botão).
 *
 * Carrega o Microsoft Clarity (exceto em preview) e injeta as tags da sessão; ao
 * encerrar, para a gravação. O bloco `welcome` é tratado pela entrada (/t/:id).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, ChevronDown, ChevronUp } from "@untitledui/icons";
import { useLocation, useNavigate } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { LogoTopo, RichTextView } from "./branding";
import { carregarClarity, clarityIdentify, clarityTag, pararClarity } from "./clarity";
import { gravarRun, gravarSessao, lerRun, lerSessao, ouvirRun } from "./run";
import { marcarFeito, usabilityStore } from "./store";
import { ESCALA_SUS, PERGUNTAS_SUS } from "./sus";
import type { Bloco, BlocoAtividade, BlocoPergunta, BlocoSus, CriterioTipo, EventoBloco, ResultadoTarefa, RunAtivo, SessaoTeste } from "./types";

export function TestRunnerLayer() {
    const [run, setRun] = useState<RunAtivo | null>(() => lerRun());
    const [mostrandoSucesso, setMostrandoSucesso] = useState(false);
    // Respostas guardadas POR BLOCO (sobrevivem ao voltar/avançar entre perguntas).
    const [respostasPorBloco, setRespostasPorBloco] = useState<Record<string, string[]>>({});
    const [susPorBloco, setSusPorBloco] = useState<Record<string, number[]>>({});
    const [aviso, setAviso] = useState(false);
    const [direcao, setDirecao] = useState(1); // 1 = avançar (sobe), -1 = voltar (desce)
    const [briefingAberto, setBriefingAberto] = useState(true);
    const [declaracaoVisivel, setDeclaracaoVisivel] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const finalizadaRef = useRef(false);

    useEffect(() => ouvirRun(() => setRun(lerRun())), []);

    const bloco: Bloco | undefined = run?.teste.blocos[run.blocoIndex];

    // Resposta/SUS do bloco atual (lidas do mapa por bloco).
    const resposta = bloco ? respostasPorBloco[bloco.id] ?? [] : [];
    const susRespostas = bloco ? susPorBloco[bloco.id] ?? [] : [];
    const setResposta = useCallback((r: string[]) => { if (bloco) { setRespostasPorBloco((p) => ({ ...p, [bloco.id]: r })); setAviso(false); } }, [bloco]);
    const setSusRespostas = useCallback((r: number[]) => { if (bloco) { setSusPorBloco((p) => ({ ...p, [bloco.id]: r })); setAviso(false); } }, [bloco]);

    // Reset (estados de UI) ao trocar de bloco — respostas NÃO resetam (ficam no mapa).
    useEffect(() => {
        setMostrandoSucesso(false);
        setBriefingAberto(true);
        setDeclaracaoVisivel(false);
        setAviso(false);
    }, [run?.blocoIndex]);

    // Clarity (não em preview).
    useEffect(() => {
        if (!run || run.preview) return;
        carregarClarity();
        clarityIdentify(run.sessaoId);
        clarityTag("teste_id", run.teste.id);
        clarityTag("teste_nome", run.teste.nome);
        clarityTag("sessao_id", run.sessaoId);
        if (bloco) clarityTag("bloco", `${run.blocoIndex}. ${bloco.tipo}`);
    }, [run, bloco]);

    // Exibe a declaração após o briefing fechar (imediato ou após N segundos).
    useEffect(() => {
        if (bloco?.tipo !== "atividade" || briefingAberto) return;
        if (bloco.declaracaoApos > 0) {
            const t = setTimeout(() => setDeclaracaoVisivel(true), bloco.declaracaoApos * 1000);
            return () => clearTimeout(t);
        }
        setDeclaracaoVisivel(true);
    }, [bloco, briefingAberto]);

    /* --------------------------- registro -------------------------- */

    const registrarEvento = useCallback((evento: EventoBloco) => {
        const atual = lerRun();
        if (atual?.preview) return;
        const sessao = lerSessao();
        if (!sessao) return;
        sessao.eventos = [...sessao.eventos.filter((e) => e.blocoId !== evento.blocoId), evento];
        gravarSessao(sessao);
        void usabilityStore.atualizarSessao(sessao);
    }, []);

    const finalizar = useCallback(() => {
        if (finalizadaRef.current) return;
        finalizadaRef.current = true;
        const atual = lerRun();
        if (atual?.preview) return;
        const sessao = lerSessao();
        if (sessao) {
            const finalizada: SessaoTeste = { ...sessao, concluida: true, finalizadaEm: new Date().toISOString() };
            gravarSessao(finalizada);
            void usabilityStore.atualizarSessao(finalizada);
            marcarFeito(sessao.testeId);
        }
        pararClarity();
    }, []);

    const avancarBloco = useCallback(() => {
        setDirecao(1);
        const atual = lerRun();
        if (!atual) return;
        const proximo = atual.blocoIndex + 1;
        if (proximo >= atual.teste.blocos.length) return;
        const atualizado: RunAtivo = { ...atual, blocoIndex: proximo, iniciadaEmBloco: new Date().toISOString() };
        const blocoProx = atual.teste.blocos[proximo];
        gravarRun(atualizado);
        if (blocoProx.tipo === "atividade") navigate(blocoProx.rotaInicial);
    }, [navigate]);

    useEffect(() => {
        if (bloco?.tipo === "obrigado") finalizar();
    }, [bloco, finalizar]);

    // Autosave parcial: grava a resposta do bloco atual conforme o participante digita/seleciona.
    useEffect(() => {
        if (!run || run.preview || !bloco) return;
        if (bloco.tipo !== "pergunta" && bloco.tipo !== "sus") return;
        const r = bloco.tipo === "pergunta" ? resposta : susRespostas.map(String);
        if (!r.some((x) => String(x).trim())) return; // nada inserido ainda
        const t = setTimeout(() => {
            registrarEvento({ blocoId: bloco.id, tipo: bloco.tipo, iniciadaEm: run.iniciadaEmBloco, resposta: r, parcial: true });
        }, 500);
        return () => clearTimeout(t);
    }, [run, bloco, resposta, susRespostas, registrarEvento]);

    // Marca abandono ao fechar/recarregar sem ter concluído (autosave do estado parcial já gravado).
    useEffect(() => {
        const onSair = () => {
            if (finalizadaRef.current) return;
            const atual = lerRun();
            if (atual?.preview) return;
            const sessao = lerSessao();
            if (!sessao || sessao.concluida) return;
            gravarSessao({ ...sessao, abandonadaEm: new Date().toISOString() });
        };
        window.addEventListener("pagehide", onSair);
        window.addEventListener("beforeunload", onSair);
        return () => {
            window.removeEventListener("pagehide", onSair);
            window.removeEventListener("beforeunload", onSair);
        };
    }, []);

    /* ------------------------ atividade: sucesso ------------------------ */

    const concluirAtividade = useCallback(
        (resultado: ResultadoTarefa, comoConcluiu?: CriterioTipo, justif?: string) => {
            const atual = lerRun();
            const blocoAtual = atual?.teste.blocos[atual.blocoIndex];
            if (!atual || blocoAtual?.tipo !== "atividade") return;
            const agora = new Date().toISOString();
            registrarEvento({
                blocoId: blocoAtual.id,
                tipo: "atividade",
                iniciadaEm: atual.iniciadaEmBloco,
                concluidaEm: agora,
                resultado,
                comoConcluiu,
                justificativa: justif,
                duracaoMs: new Date(agora).getTime() - new Date(atual.iniciadaEmBloco).getTime(),
            });
            if (resultado === "sucesso") setMostrandoSucesso(true);
            else avancarBloco();
        },
        [registrarEvento, avancarBloco],
    );

    const ativaDeteccao = bloco?.tipo === "atividade" && !mostrandoSucesso && !briefingAberto;

    useEffect(() => {
        if (!ativaDeteccao || bloco?.tipo !== "atividade") return;
        const crit = bloco.criterios.find((c) => c.tipo === "rota" && c.valor);
        if (!crit?.valor) return;
        if (location.pathname === bloco.rotaInicial && bloco.rotaInicial === crit.valor) return;
        if (location.pathname.startsWith(crit.valor)) concluirAtividade("sucesso", "rota");
    }, [location.pathname, ativaDeteccao, bloco, concluirAtividade]);

    useEffect(() => {
        if (!ativaDeteccao || bloco?.tipo !== "atividade") return;
        const crit = bloco.criterios.find((c) => c.tipo === "clique" && c.valor);
        if (!crit?.valor) return;
        const seletor = crit.valor;
        const onClick = (e: MouseEvent) => {
            if ((e.target as Element | null)?.closest?.(seletor)) concluirAtividade("sucesso", "clique");
        };
        document.addEventListener("click", onClick, true);
        return () => document.removeEventListener("click", onClick, true);
    }, [ativaDeteccao, bloco, concluirAtividade]);

    /* --------------------------- pergunta / sus --------------------------- */

    const responder = useCallback(() => {
        const atual = lerRun();
        const blocoAtual = atual?.teste.blocos[atual.blocoIndex];
        if (!atual || blocoAtual?.tipo !== "pergunta") return;
        const r = respostasPorBloco[blocoAtual.id] ?? [];
        if (blocoAtual.obrigatoria && !r.some((x) => x.trim())) { setAviso(true); return; } // não avança obrigatória vazia
        registrarEvento({ blocoId: blocoAtual.id, tipo: "pergunta", iniciadaEm: atual.iniciadaEmBloco, concluidaEm: new Date().toISOString(), resposta: r });
        avancarBloco();
    }, [registrarEvento, respostasPorBloco, avancarBloco]);

    const responderSus = useCallback(() => {
        const atual = lerRun();
        const blocoAtual = atual?.teste.blocos[atual.blocoIndex];
        if (!atual || blocoAtual?.tipo !== "sus") return;
        const r = susPorBloco[blocoAtual.id] ?? [];
        if (!PERGUNTAS_SUS.every((_, i) => r[i])) { setAviso(true); return; }
        registrarEvento({ blocoId: blocoAtual.id, tipo: "sus", iniciadaEm: atual.iniciadaEmBloco, concluidaEm: new Date().toISOString(), resposta: r.map(String) });
        avancarBloco();
    }, [registrarEvento, susPorBloco, avancarBloco]);

    // Voltar — só entre perguntas/SUS; nunca para uma missão (atividade) ou welcome.
    const voltarBloco = useCallback(() => {
        setDirecao(-1);
        const atual = lerRun();
        if (!atual) return;
        const prev = atual.blocoIndex - 1;
        if (prev < 0) return;
        const bprev = atual.teste.blocos[prev];
        if (bprev.tipo !== "pergunta" && bprev.tipo !== "sus") return;
        gravarRun({ ...atual, blocoIndex: prev, iniciadaEmBloco: new Date().toISOString() });
    }, []);

    /* --------------------------- progresso -------------------------- */

    const progresso = useMemo(() => {
        if (!run || bloco?.tipo !== "atividade") return null;
        const atividades = run.teste.blocos.filter((b) => b.tipo === "atividade");
        const indice = atividades.findIndex((b) => b.id === bloco.id);
        return { atual: indice + 1, total: atividades.length };
    }, [run, bloco]);

    // Progresso (0–100) pela posição entre os blocos de conteúdo (missões + perguntas + SUS).
    const progressoPct = useMemo(() => {
        if (!run || !bloco) return 0;
        const passos = run.teste.blocos.filter((b) => b.tipo === "atividade" || b.tipo === "pergunta" || b.tipo === "sus");
        const idx = passos.findIndex((b) => b.id === bloco.id);
        return passos.length ? Math.round(((idx + 1) / passos.length) * 100) : 0;
    }, [run, bloco]);

    const podeVoltar = !!run && (() => {
        const p = run.blocoIndex - 1;
        if (p < 0) return false;
        const b = run.teste.blocos[p];
        return b.tipo === "pergunta" || b.tipo === "sus";
    })();

    if (!run || !bloco || bloco.tipo === "welcome") return null;

    const ehMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const ultimaAntesDoFim = run.blocoIndex + 1 >= run.teste.blocos.length - 1;

    /* ----------------------------- render --------------------------- */

    if (bloco.tipo === "obrigado" || bloco.tipo === "pergunta" || bloco.tipo === "sus") {
        return (
            <TopLayer>
                {/* Fundo opaco fixo: o protótipo nunca aparece durante a transição/volta. */}
                <div className="fixed inset-0 z-[9997] bg-primary" />
                <LogoTopo logoParceira={run.teste.logoParceira} />
                {bloco.tipo !== "obrigado" && <BarraProgresso valor={progressoPct} />}
                <AnimatePresence custom={direcao} initial={false}>
                    {bloco.tipo === "pergunta" ? (
                        <TelaPergunta key={bloco.id} direcao={direcao} bloco={bloco} resposta={resposta} setResposta={setResposta} onProximo={responder} aviso={aviso} />
                    ) : bloco.tipo === "sus" ? (
                        <TelaSus
                            key={bloco.id}
                            direcao={direcao}
                            bloco={bloco}
                            respostas={susRespostas}
                            setRespostas={setSusRespostas}
                            ultima={ultimaAntesDoFim}
                            onProximo={responderSus}
                            onVoltarBloco={voltarBloco}
                            podeVoltarBloco={podeVoltar}
                        />
                    ) : (
                        <TelaObrigado key={bloco.id} direcao={direcao} bloco={bloco} />
                    )}
                </AnimatePresence>
                {bloco.tipo === "pergunta" && <NavSetas onVoltar={voltarBloco} podeVoltar={podeVoltar} onAvancar={responder} />}
            </TopLayer>
        );
    }

    // bloco.tipo === "atividade"
    return (
        <TopLayer>
            <AnimatePresence>
                {mostrandoSucesso && (
                    <OverlayCard key="sucesso" fullscreen={ehMobile}>
                        <FeaturedIcon icon={CheckCircle} color="success" theme="light" size="xl" />
                        <h2 className="text-lg font-semibold text-primary">Tarefa concluída</h2>
                        {bloco.mensagemSucesso && <p className="max-w-sm text-center text-sm text-tertiary">{bloco.mensagemSucesso}</p>}
                        <Button size="lg" color="primary" onClick={avancarBloco} className="w-full sm:w-auto">
                            {ultimaAntesDoFim ? "Finalizar" : "Continuar"}
                        </Button>
                    </OverlayCard>
                )}
            </AnimatePresence>

            {/* Briefing de tela cheia à esquerda, fundo desfocado, fecha no "Começar" */}
            <AnimatePresence>
                {briefingAberto && !mostrandoSucesso && (
                    <Briefing key="briefing" bloco={bloco} progresso={progresso} ehMobile={ehMobile} onComecar={() => setBriefingAberto(false)} />
                )}
            </AnimatePresence>

            {/* Barra única no topo: tarefa à esquerda, "Concluir tarefa" à direita */}
            {!briefingAberto && declaracaoVisivel && !mostrandoSucesso && <BarraTarefa enunciado={bloco.enunciado} onConcluir={() => concluirAtividade("sucesso", "auto")} />}
        </TopLayer>
    );
}

/* ------------------------------------------------------------------ */
/*  Barra de tarefa (topo) — empurra o conteúdo pra baixo, sem sobrepor */
/* ------------------------------------------------------------------ */

const BARRA_H = 52;

function BarraTarefa({ enunciado, onConcluir }: { enunciado: string; onConcluir: () => void }) {
    // Empurra o conteúdo do protótipo pra baixo enquanto a barra existe (evita sobreposição).
    useEffect(() => {
        const prev = document.body.style.paddingTop;
        document.body.style.paddingTop = `${BARRA_H}px`;
        return () => {
            document.body.style.paddingTop = prev;
        };
    }, []);

    return (
        <motion.div
            initial={{ y: -BARRA_H }}
            animate={{ y: 0 }}
            exit={{ y: -BARRA_H }}
            transition={{ type: "spring", stiffness: 460, damping: 40 }}
            style={{ height: BARRA_H }}
            className="fixed inset-x-0 top-0 z-[10000] flex items-center justify-between gap-3 bg-blue-800 px-4 text-white shadow-lg"
        >
            <span className="truncate text-sm font-medium text-white">{enunciado}</span>
            <button
                type="button"
                onClick={onConcluir}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-blue-800 transition hover:bg-white/90"
            >
                <CheckCircle className="size-4" aria-hidden="true" />
                Concluir tarefa
            </button>
        </motion.div>
    );
}

/* ------------------------------------------------------------------ */
/*  Top layer — portal em document.body marcado para o React Aria não  */
/*  inertizar nem fechar slideouts ao interagir com o runner.          */
/* ------------------------------------------------------------------ */

function TopLayer({ children }: { children: React.ReactNode }) {
    const [el] = useState<HTMLDivElement | null>(() => {
        if (typeof document === "undefined") return null;
        const d = document.createElement("div");
        d.setAttribute("data-react-aria-top-layer", "true");
        return d;
    });
    useEffect(() => {
        if (!el) return;
        document.body.appendChild(el);
        return () => {
            el.remove();
        };
    }, [el]);
    if (!el) return null;
    return createPortal(children, el);
}

/* ------------------------------------------------------------------ */
/*  Briefing da tarefa (tela cheia à esquerda)                         */
/* ------------------------------------------------------------------ */

function Briefing({
    bloco,
    progresso,
    ehMobile,
    onComecar,
}: {
    bloco: BlocoAtividade;
    progresso: { atual: number; total: number } | null;
    ehMobile: boolean;
    onComecar: () => void;
}) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-overlay/40 backdrop-blur-md">
            <motion.div
                initial={{ x: ehMobile ? 0 : -32, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: ehMobile ? 0 : -32, opacity: 0 }}
                transition={{ type: "spring", stiffness: 460, damping: 38 }}
                className={cx("fixed flex flex-col gap-6 rounded-2xl bg-primary p-6 text-primary shadow-2xl ring-1 ring-border-secondary", ehMobile ? "inset-4" : "inset-y-4 left-4 w-[380px]")}
            >
                {progresso && <span className="text-xs font-semibold tracking-wide text-tertiary uppercase">Tarefa {progresso.atual} de {progresso.total}</span>}
                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
                    <span className="text-xs font-semibold tracking-wide text-brand-secondary uppercase">Sua tarefa</span>
                    <h2 className="text-xl font-semibold text-primary">{bloco.enunciado}</h2>
                    {bloco.descricao && <RichTextView html={bloco.descricao} className="text-sm leading-relaxed text-tertiary" />}
                </div>
                <Button size="lg" color="primary" onClick={onComecar} className="w-full">
                    Começar
                </Button>
            </motion.div>
        </motion.div>
    );
}

/* ------------------------------------------------------------------ */
/*  Tela de pergunta (estilo Typeform — sem caixa)                     */
/* ------------------------------------------------------------------ */

function TelaPergunta({
    bloco,
    resposta,
    setResposta,
    onProximo,
    aviso,
    direcao,
}: {
    bloco: BlocoPergunta;
    resposta: string[];
    setResposta: (r: string[]) => void;
    onProximo: () => void;
    aviso: boolean;
    direcao: number;
}) {
    const toggle = (op: string) => setResposta(bloco.formato === "multipla" ? (resposta.includes(op) ? resposta.filter((x) => x !== op) : [...resposta, op]) : [op]);

    return (
        <Fundo alinhar="start" direcao={direcao}>
            <div className="flex w-full max-w-2xl flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-semibold text-primary sm:text-3xl">
                        {bloco.enunciado || "Pergunta"}
                        {bloco.obrigatoria && <span className="text-error-primary"> *</span>}
                    </h2>
                    {bloco.descricao && <RichTextView html={bloco.descricao} className="text-base text-tertiary" />}
                </div>
                {bloco.formato === "aberta" ? (
                    <input
                        type="text"
                        value={resposta[0] ?? ""}
                        onChange={(e) => setResposta([e.target.value])}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                onProximo();
                            }
                        }}
                        autoFocus
                        placeholder="Digite sua resposta aqui…"
                        className="w-full border-0 border-b-2 border-secondary bg-transparent pb-1.5 text-2xl text-primary caret-brand outline-none placeholder:text-placeholder/60 focus:border-brand"
                    />
                ) : (
                    <div className="flex flex-col gap-2.5">
                        {bloco.opcoes.map((op, i) => {
                            const sel = resposta.includes(op);
                            return (
                                <button
                                    key={op}
                                    type="button"
                                    onClick={() => toggle(op)}
                                    className={cx(
                                        "flex items-center gap-3 rounded-xl px-4 py-3.5 text-left text-base ring-1 transition-colors duration-100 ease-linear",
                                        sel ? "bg-brand-primary text-primary ring-brand" : "text-secondary ring-border-secondary hover:bg-primary_hover",
                                    )}
                                >
                                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-primary text-xs font-semibold text-tertiary">
                                        {String.fromCharCode(65 + i)}
                                    </span>
                                    {op}
                                </button>
                            );
                        })}
                    </div>
                )}
                <div className="flex flex-col gap-2">
                    <Button size="xl" color="primary" onClick={onProximo} className="self-start">
                        Próximo
                    </Button>
                    {aviso && <span className="text-sm font-medium text-error-primary">Responda esta pergunta antes de continuar.</span>}
                </div>
            </div>
        </Fundo>
    );
}

/* ------------------------------------------------------------------ */
/*  Tela SUS                                                           */
/* ------------------------------------------------------------------ */

const SUS_POR_PAGINA = 3;

function TelaSus({
    bloco,
    respostas,
    setRespostas,
    ultima,
    onProximo,
    onVoltarBloco,
    podeVoltarBloco,
    direcao,
}: {
    bloco: BlocoSus;
    respostas: number[];
    setRespostas: (r: number[]) => void;
    ultima: boolean;
    onProximo: () => void;
    onVoltarBloco: () => void;
    podeVoltarBloco: boolean;
    direcao: number;
}) {
    const [pagina, setPagina] = useState(0);
    const [aviso, setAviso] = useState(false);
    const total = PERGUNTAS_SUS.length;
    // Mescla uma sobra de 1 item na página anterior (10 → 3+3+4 em vez de 3+3+3+1).
    const totalPaginas = Math.ceil(total / SUS_POR_PAGINA) - (total % SUS_POR_PAGINA === 1 ? 1 : 0);
    const ultimaPagina = pagina === totalPaginas - 1;
    const inicio = pagina * SUS_POR_PAGINA;
    const fim = ultimaPagina ? total : inicio + SUS_POR_PAGINA;
    const itens = PERGUNTAS_SUS.slice(inicio, fim);
    const paginaCompleta = itens.every((_, k) => respostas[inicio + k]);

    const set = (i: number, v: number) => {
        const next = [...respostas];
        next[i] = v;
        setRespostas(next);
        setAviso(false);
    };

    const proximo = () => {
        if (!paginaCompleta) {
            setAviso(true);
            return;
        }
        if (ultimaPagina) onProximo();
        else setPagina((p) => p + 1);
    };
    const voltar = () => {
        setAviso(false);
        if (pagina > 0) setPagina((p) => p - 1);
        else if (podeVoltarBloco) onVoltarBloco();
    };

    return (
        <Fundo alinhar="start" scroll direcao={direcao}>
            <div className="flex w-full max-w-2xl flex-col gap-6 py-8">
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-semibold text-primary">{bloco.titulo}</h2>
                    {bloco.enunciado && <RichTextView html={bloco.enunciado} className="text-sm text-tertiary" />}
                    <span className="text-sm font-medium text-tertiary">
                        {inicio + 1}–{fim} de {total}
                    </span>
                </div>
                <div className="flex flex-col gap-6">
                    {itens.map((pergunta, k) => {
                        const i = inicio + k;
                        return (
                            <div key={i} className="flex flex-col gap-2.5">
                                <span className="text-base font-medium text-primary">
                                    {i + 1}. {pergunta}
                                </span>
                                <div className="flex gap-1.5">
                                    {[1, 2, 3, 4, 5].map((v) => {
                                        const sel = respostas[i] === v;
                                        return (
                                            <button
                                                key={v}
                                                type="button"
                                                onClick={() => set(i, v)}
                                                title={ESCALA_SUS[v - 1]}
                                                className={cx(
                                                    "flex h-10 flex-1 items-center justify-center rounded-lg text-sm font-semibold ring-1 transition-colors duration-100 ease-linear",
                                                    sel ? "bg-brand-solid text-white ring-brand" : "text-secondary ring-border-secondary hover:bg-primary_hover",
                                                )}
                                            >
                                                {v}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between text-sm text-quaternary">
                                    <span>{ESCALA_SUS[0]}</span>
                                    <span>{ESCALA_SUS[4]}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        {(pagina > 0 || podeVoltarBloco) && (
                            <Button size="xl" color="secondary" onClick={voltar} className="self-start">
                                Voltar
                            </Button>
                        )}
                        <Button size="xl" color="primary" onClick={proximo} className="self-start">
                            {ultimaPagina ? (ultima ? "Finalizar" : "Próximo") : "Continuar"}
                        </Button>
                    </div>
                    {aviso && <span className="text-sm font-medium text-error-primary">Responda as afirmações desta página antes de continuar.</span>}
                </div>
            </div>
        </Fundo>
    );
}

/** Tela final (obrigado) — animada como as demais. */
function TelaObrigado({ bloco, direcao }: { bloco: { titulo?: string; texto?: string }; direcao: number }) {
    return (
        <Fundo direcao={direcao}>
            <div className="flex flex-col items-center gap-4 text-center">
                <FeaturedIcon icon={CheckCircle} color="success" theme="light" size="xl" />
                <h2 className="text-2xl font-semibold text-primary">{bloco.titulo || "Teste concluído"}</h2>
                {bloco.texto && <RichTextView html={bloco.texto} className="max-w-md text-base text-tertiary" />}
            </div>
        </Fundo>
    );
}

/** Indicador de progresso do DS (ProgressBarBase), colado no topo sem margem, em brand-color. */
function BarraProgresso({ valor }: { valor: number }) {
    return (
        <div className="fixed inset-x-0 top-0 z-[10001]">
            <ProgressBarBase value={valor} className="h-1 rounded-none bg-brand-solid/15" progressClassName="rounded-none" />
        </div>
    );
}

/** Setas de navegação (estilo Typeform) no canto inferior direito: voltar (↑) / avançar (↓). */
function NavSetas({ onVoltar, podeVoltar, onAvancar }: { onVoltar: () => void; podeVoltar: boolean; onAvancar: () => void }) {
    return (
        <div className="fixed right-5 bottom-5 z-[10000] flex overflow-hidden rounded-lg shadow-lg ring-1 ring-border-secondary">
            <button
                type="button"
                onClick={onVoltar}
                disabled={!podeVoltar}
                aria-label="Voltar"
                className="flex size-9 items-center justify-center bg-brand-solid text-white transition hover:bg-brand-solid_hover disabled:cursor-not-allowed disabled:opacity-40"
            >
                <ChevronUp className="size-4" aria-hidden="true" />
            </button>
            <button
                type="button"
                onClick={onAvancar}
                aria-label="Avançar"
                className="flex size-9 items-center justify-center border-l border-white/20 bg-brand-solid text-white transition hover:bg-brand-solid_hover"
            >
                <ChevronDown className="size-4" aria-hidden="true" />
            </button>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Helpers de layout                                                  */
/* ------------------------------------------------------------------ */

/** Fundo de tela cheia (bg primary), centralizado ou alinhado ao topo. */
function Fundo({ children, alinhar = "center", scroll }: { children: React.ReactNode; alinhar?: "center" | "start"; scroll?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cx("fixed inset-0 z-[9999] flex justify-center bg-primary px-5 pt-20 sm:px-8", scroll ? "items-start overflow-y-auto" : alinhar === "start" ? "items-center" : "items-center")}
        >
            {children}
        </motion.div>
    );
}


function OverlayCard({ children, fullscreen }: { children: React.ReactNode; fullscreen?: boolean }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center bg-overlay p-4">
            <motion.div
                initial={{ scale: 0.96, y: 12 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
                className={cx("flex flex-col items-center gap-4 bg-primary p-8 shadow-2xl", fullscreen ? "h-full w-full justify-center rounded-2xl" : "w-full max-w-md rounded-2xl")}
            >
                {children}
            </motion.div>
        </motion.div>
    );
}
