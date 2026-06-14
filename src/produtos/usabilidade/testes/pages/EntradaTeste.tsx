import { useEffect, useState } from "react";
import { ArrowRight, Beaker02, CheckCircle, XCircle } from "@untitledui/icons";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { gerarId, getDeviceId, gravarRun, gravarSessao, jaFez, usabilityStore } from "@/lib/usability";
import type { SessaoTeste, Teste } from "@/lib/usability";

type Estado = { tela: "carregando" } | { tela: "indisponivel"; motivo: string } | { tela: "ja-fez" } | { tela: "intro"; teste: Teste };

export function EntradaTeste() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [estado, setEstado] = useState<Estado>({ tela: "carregando" });

    useEffect(() => {
        if (!id) return;
        usabilityStore.getTeste(id).then((teste) => {
            if (!teste) return setEstado({ tela: "indisponivel", motivo: "Este teste não foi encontrado." });
            if (teste.status === "encerrado") return setEstado({ tela: "indisponivel", motivo: "Este teste foi encerrado." });
            if (teste.status === "rascunho") return setEstado({ tela: "indisponivel", motivo: "Este teste ainda não foi publicado." });
            if (teste.umaVezPorDispositivo && jaFez(teste.id)) return setEstado({ tela: "ja-fez" });
            setEstado({ tela: "intro", teste });
        });
    }, [id]);

    const comecar = async (teste: Teste) => {
        const sessao: SessaoTeste = {
            id: gerarId(),
            testeId: teste.id,
            deviceId: getDeviceId(),
            iniciadaEm: new Date().toISOString(),
            userAgent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            eventos: [],
            concluida: false,
        };
        await usabilityStore.criarSessao(sessao);
        gravarSessao(sessao);
        const primeira = teste.atividades[0];
        gravarRun({ teste, sessaoId: sessao.id, atividadeIndex: 0, iniciadaEmTarefa: new Date().toISOString() });
        navigate(primeira?.rotaInicial ?? "/");
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-quaternary px-4 py-10 text-primary">
            <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl bg-primary p-8 text-center shadow-sm ring-1 ring-border-secondary">
                {estado.tela === "carregando" && <p className="py-8 text-sm text-tertiary">Carregando…</p>}

                {estado.tela === "indisponivel" && (
                    <>
                        <FeaturedIcon icon={XCircle} color="warning" theme="light" size="xl" />
                        <h1 className="text-xl font-semibold text-primary">Teste indisponível</h1>
                        <p className="text-sm text-tertiary">{estado.motivo}</p>
                    </>
                )}

                {estado.tela === "ja-fez" && (
                    <>
                        <FeaturedIcon icon={CheckCircle} color="success" theme="light" size="xl" />
                        <h1 className="text-xl font-semibold text-primary">Você já participou</h1>
                        <p className="text-sm text-tertiary">Este teste só pode ser respondido uma vez por dispositivo. Obrigado pela participação!</p>
                    </>
                )}

                {estado.tela === "intro" && (
                    <>
                        <FeaturedIcon icon={Beaker02} color="brand" theme="light" size="xl" />
                        <h1 className="text-xl font-semibold text-primary">{estado.teste.introTitulo}</h1>
                        <p className="text-sm whitespace-pre-line text-tertiary">{estado.teste.introTexto}</p>
                        <p className="text-xs text-quaternary">
                            {estado.teste.atividades.length} {estado.teste.atividades.length === 1 ? "tarefa" : "tarefas"} · sua sessão será gravada para análise
                        </p>
                        <Button size="lg" color="primary" iconTrailing={ArrowRight} onClick={() => comecar(estado.teste)} className="w-full">
                            Começar
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
