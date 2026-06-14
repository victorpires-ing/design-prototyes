/**
 * Camada global do runner de testes. Montada na raiz (como o CommentsLayer),
 * fica presente em TODAS as rotas — assim o participante navega pelas telas
 * reais dos protótipos enquanto medimos a jornada.
 *
 * Quando há um run ativo (sessionStorage), renderiza uma barra flutuante com a
 * tarefa atual e detecta a conclusão por: rota atingida, clique em elemento, ou
 * declaração do participante ("Concluí"). Também carrega o Microsoft Clarity e
 * injeta as tags da sessão.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, Flag05 } from "@untitledui/icons";
import { useLocation, useNavigate } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { carregarClarity, clarityIdentify, clarityTag } from "./clarity";
import { gravarRun, gravarSessao, lerRun, lerSessao, ouvirRun } from "./run";
import { marcarFeito, usabilityStore } from "./store";
import type { Atividade, CriterioTipo, EventoTarefa, ResultadoTarefa, RunAtivo, SessaoTeste } from "./types";

export function TestRunnerLayer() {
    const [run, setRun] = useState<RunAtivo | null>(() => lerRun());
    const [fase, setFase] = useState<"tarefa" | "sucesso" | "fim">("tarefa");
    const location = useLocation();
    const navigate = useNavigate();

    // Sincroniza com mudanças no sessionStorage (entry page inicia o run).
    useEffect(() => ouvirRun(() => setRun(lerRun())), []);

    // Carrega o Clarity e injeta as tags quando o run começa / troca de tarefa.
    useEffect(() => {
        if (!run) return;
        carregarClarity();
        clarityIdentify(run.sessaoId);
        clarityTag("teste_id", run.teste.id);
        clarityTag("teste_nome", run.teste.nome);
        clarityTag("sessao_id", run.sessaoId);
        const atividade = run.teste.atividades[run.atividadeIndex];
        if (atividade) clarityTag("tarefa", `${run.atividadeIndex + 1}. ${atividade.enunciado.slice(0, 60)}`);
    }, [run]);

    const atividade: Atividade | undefined = run?.teste.atividades[run.atividadeIndex];

    /* ----------------------- conclusão da tarefa ----------------------- */

    const concluirTarefa = useCallback(
        (resultado: ResultadoTarefa, comoConcluiu?: CriterioTipo) => {
            if (!run || !atividade) return;
            const agora = new Date().toISOString();
            const evento: EventoTarefa = {
                atividadeId: atividade.id,
                iniciadaEm: run.iniciadaEmTarefa,
                concluidaEm: agora,
                resultado,
                comoConcluiu,
                duracaoMs: new Date(agora).getTime() - new Date(run.iniciadaEmTarefa).getTime(),
            };

            const sessao = lerSessao();
            if (sessao) {
                sessao.eventos = [...sessao.eventos.filter((e) => e.atividadeId !== atividade.id), evento];
                gravarSessao(sessao);
                void usabilityStore.atualizarSessao(sessao);
            }

            setFase(resultado === "sucesso" ? "sucesso" : "tarefa");
            if (resultado !== "sucesso") avancar();
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [run, atividade],
    );

    const finalizar = useCallback(() => {
        const sessao = lerSessao();
        if (sessao) {
            const finalizada: SessaoTeste = { ...sessao, concluida: true, finalizadaEm: new Date().toISOString() };
            gravarSessao(finalizada);
            void usabilityStore.atualizarSessao(finalizada);
            marcarFeito(sessao.testeId);
        }
        setFase("fim");
    }, []);

    const avancar = useCallback(() => {
        const atual = lerRun();
        if (!atual) return;
        const proximo = atual.atividadeIndex + 1;
        if (proximo >= atual.teste.atividades.length) {
            finalizar();
            return;
        }
        const atualizado: RunAtivo = { ...atual, atividadeIndex: proximo, iniciadaEmTarefa: new Date().toISOString() };
        gravarRun(atualizado);
        setFase("tarefa");
        navigate(atual.teste.atividades[proximo].rotaInicial);
    }, [finalizar, navigate]);

    const fecharFim = useCallback(() => {
        gravarRun(null);
        gravarSessao(null);
        setRun(null);
    }, []);

    /* ------------------- detecção: rota atingida ----------------------- */

    useEffect(() => {
        if (!run || !atividade || fase !== "tarefa") return;
        const criterioRota = atividade.criterios.find((c) => c.tipo === "rota" && c.valor);
        if (!criterioRota?.valor) return;
        // Ignora a própria rota inicial; só conta ao atingir a rota-alvo depois.
        if (location.pathname === atividade.rotaInicial && atividade.rotaInicial === criterioRota.valor) return;
        if (location.pathname.startsWith(criterioRota.valor)) {
            concluirTarefa("sucesso", "rota");
        }
    }, [location.pathname, run, atividade, fase, concluirTarefa]);

    /* ------------------- detecção: clique em elemento ------------------ */

    useEffect(() => {
        if (!run || !atividade || fase !== "tarefa") return;
        const criterioClique = atividade.criterios.find((c) => c.tipo === "clique" && c.valor);
        if (!criterioClique?.valor) return;
        const seletor = criterioClique.valor;
        const onClick = (e: MouseEvent) => {
            const alvo = e.target as Element | null;
            if (alvo?.closest?.(seletor)) concluirTarefa("sucesso", "clique");
        };
        document.addEventListener("click", onClick, true);
        return () => document.removeEventListener("click", onClick, true);
    }, [run, atividade, fase, concluirTarefa]);

    const temAuto = useMemo(() => atividade?.criterios.some((c) => c.tipo === "auto"), [atividade]);
    const total = run?.teste.atividades.length ?? 0;

    if (!run) return null;

    return (
        <AnimatePresence>
            {fase === "fim" ? (
                <OverlayCentral key="fim">
                    <FeaturedIcon icon={CheckCircle} color="success" theme="light" size="xl" />
                    <h2 className="text-xl font-semibold text-primary">Teste concluído</h2>
                    <p className="max-w-sm text-center text-sm text-tertiary">
                        Obrigado por participar! Suas interações foram registradas e ajudam a melhorar o produto.
                    </p>
                    <Button size="lg" color="primary" onClick={fecharFim}>
                        Fechar
                    </Button>
                </OverlayCentral>
            ) : fase === "sucesso" ? (
                <OverlayCentral key="sucesso">
                    <FeaturedIcon icon={CheckCircle} color="success" theme="light" size="xl" />
                    <h2 className="text-lg font-semibold text-primary">Tarefa concluída</h2>
                    {atividade?.mensagemSucesso && (
                        <p className="max-w-sm text-center text-sm text-tertiary">{atividade.mensagemSucesso}</p>
                    )}
                    <Button size="lg" color="primary" onClick={avancar}>
                        {run.atividadeIndex + 1 >= total ? "Finalizar teste" : "Próxima tarefa"}
                    </Button>
                </OverlayCentral>
            ) : (
                atividade && (
                    <motion.div
                        key="tarefa"
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                        className="fixed inset-x-0 bottom-0 z-[9998] flex justify-center px-3 pb-3 sm:px-4 sm:pb-4"
                    >
                        <div className="flex w-full max-w-2xl flex-col gap-3 rounded-2xl bg-primary-solid p-4 text-primary_on-brand shadow-2xl sm:flex-row sm:items-center sm:gap-4">
                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <span className="text-xs font-semibold tracking-wide text-tertiary_on-brand uppercase">
                                    Tarefa {run.atividadeIndex + 1} de {total}
                                </span>
                                <p className="text-sm font-medium text-primary_on-brand">{atividade.enunciado}</p>
                                {atividade.mensagemInicio && (
                                    <p className="text-xs text-tertiary_on-brand">{atividade.mensagemInicio}</p>
                                )}
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <Button
                                    size="sm"
                                    color="link-gray"
                                    iconLeading={Flag05}
                                    onClick={() => concluirTarefa("desistencia")}
                                    className="!text-tertiary_on-brand hover:!text-primary_on-brand"
                                >
                                    Desisti
                                </Button>
                                {temAuto && (
                                    <Button size="sm" color="secondary" iconLeading={CheckCircle} onClick={() => concluirTarefa("sucesso", "auto")}>
                                        Concluí
                                    </Button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )
            )}
        </AnimatePresence>
    );
}

function OverlayCentral({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-overlay px-4"
        >
            <motion.div
                initial={{ scale: 0.95, y: 12 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
                className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl bg-primary p-8 shadow-2xl"
            >
                {children}
            </motion.div>
        </motion.div>
    );
}
