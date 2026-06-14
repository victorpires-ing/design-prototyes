import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle, Eye, Star06, XCircle } from "@untitledui/icons";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { gerarId, getDeviceId, gravarRun, gravarSessao, jaFez, usabilityStore } from "@/lib/usability";
import type { SessaoTeste, Teste } from "@/lib/usability";

type Estado = { tela: "carregando" } | { tela: "indisponivel"; motivo: string } | { tela: "ja-fez" } | { tela: "intro"; teste: Teste } | { tela: "rodando" };

export function EntradaTeste() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preview = searchParams.get("preview") === "1";
    const [estado, setEstado] = useState<Estado>({ tela: "carregando" });

    useEffect(() => {
        if (!id) return;
        usabilityStore.getTeste(id).then((teste) => {
            if (!teste) return setEstado({ tela: "indisponivel", motivo: "Este teste não foi encontrado." });
            // No preview, ignora status e a trava de uma vez por dispositivo.
            if (!preview) {
                if (teste.status === "encerrado") return setEstado({ tela: "indisponivel", motivo: "Este teste foi encerrado." });
                if (teste.status === "rascunho") return setEstado({ tela: "indisponivel", motivo: "Este teste ainda não foi publicado." });
                if (teste.umaVezPorDispositivo && jaFez(teste.id)) return setEstado({ tela: "ja-fez" });
            }
            setEstado({ tela: "intro", teste });
        });
    }, [id, preview]);

    const comecar = async (teste: Teste) => {
        let sessaoId = gerarId();
        // No preview não cria sessão (não grava no relatório).
        if (!preview) {
            const sessao: SessaoTeste = {
                id: sessaoId,
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
        } else {
            sessaoId = "preview";
            gravarSessao(null);
        }

        // Começa no primeiro bloco de conteúdo (após o welcome).
        const idxConteudo = teste.blocos.findIndex((b) => b.tipo !== "welcome");
        const indice = idxConteudo >= 0 ? idxConteudo : 0;
        gravarRun({ teste, sessaoId, blocoIndex: indice, iniciadaEmBloco: new Date().toISOString(), preview });

        const blocoConteudo = teste.blocos[indice];
        setEstado({ tela: "rodando" });
        // Se o primeiro conteúdo é uma atividade, vai para a rota dela; senão, o overlay assume aqui.
        if (blocoConteudo?.tipo === "atividade") navigate(blocoConteudo.rotaInicial);
    };

    // Em execução: fundo neutro — o TestRunnerLayer global desenha os cards/barra.
    if (estado.tela === "rodando") return <div className="min-h-screen bg-quaternary" />;

    const welcome = estado.tela === "intro" ? estado.teste.blocos.find((b) => b.tipo === "welcome") : undefined;
    const titulo = welcome?.tipo === "welcome" ? welcome.titulo : "Bem-vindo";
    const texto = welcome?.tipo === "welcome" ? welcome.texto : "";
    const nConteudo = estado.tela === "intro" ? estado.teste.blocos.filter((b) => b.tipo === "atividade" || b.tipo === "pergunta" || b.tipo === "sus").length : 0;

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
                        {preview && (
                            <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-tertiary">
                                <Eye className="size-3.5" aria-hidden="true" /> Pré-visualização — nada é gravado
                            </span>
                        )}
                        <FeaturedIcon icon={Star06} color="brand" theme="light" size="xl" />
                        <h1 className="text-xl font-semibold text-primary">{titulo}</h1>
                        <p className="text-sm whitespace-pre-line text-tertiary">{texto}</p>
                        <p className="text-xs text-quaternary">
                            {nConteudo} {nConteudo === 1 ? "etapa" : "etapas"} · sua sessão será gravada para análise
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
