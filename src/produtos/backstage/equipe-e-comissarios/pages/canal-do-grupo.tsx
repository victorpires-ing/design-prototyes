import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { TITULO_PAGINA } from "@/produtos/backstage/components/titulo-pagina";
import { BackstageLayout } from "../../components/Backstage";
import { CAMINHO_CRIAR_INGRESSOS, FormularioCanal } from "../components/formulario-canal";
import { CabecalhoCotas, TemaCotas } from "../components/ui-cotas";
import { BASE, CANAIS_GRUPO, codigosEmUso, DICA_CANAL, ROTULO_CANAL, useEquipeDoEvento, type CanalGrupo } from "../data/equipe";

/**
 * Configurar um canal do grupo (ECO-14): página, não modal. O Comissário tem quatro seções e os
 * outros canais abrem o seletor de ingressos por cima; numa página, nada fica empilhado (UI-NAV-001, UI-NAV-002).
 */
export function CanalDoGrupo() {
    const { grupoId = "", canal = "" } = useParams();
    const navigate = useNavigate();
    const { carregando, evento, grupos } = useEquipeDoEvento();
    const dados = grupos.find((x) => x.grupo.id === grupoId);
    const valido = (CANAIS_GRUPO as string[]).includes(canal);
    const doGrupo = `${BASE}/${grupoId}`;
    // Volta ao grupo na Configuração, de onde a pessoa veio (ECO-11).
    const voltar = () => navigate(`${doGrupo}?aba=configuracao`);

    useEffect(() => {
        window.scrollTo({ top: 0 });
    }, [grupoId, canal]);

    if (carregando)
        return (
            <BackstageLayout activeSection="equipe-e-comissarios" activeItem="equipe-e-comissarios">
                <div role="status" aria-label="Carregando canal" className="h-64 w-full animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" />
            </BackstageLayout>
        );

    if (!dados || !valido)
        return (
            <BackstageLayout activeSection="equipe-e-comissarios" activeItem="equipe-e-comissarios">
                <TemaCotas className="items-start gap-4 py-16">
                    <h1 className={TITULO_PAGINA}>Canal não encontrado</h1>
                    <p className="text-md text-tertiary">O grupo não é de {evento.nome} ou o endereço está incompleto.</p>
                    <Button size="md" color="secondary" onClick={() => navigate(BASE)}>
                        Ver grupos do evento
                    </Button>
                </TemaCotas>
            </BackstageLayout>
        );

    const c = canal as CanalGrupo;
    const { grupo, comissario, vendas } = dados;
    return (
        <BackstageLayout activeSection="equipe-e-comissarios" activeItem="equipe-e-comissarios" recolherGuia>
            <TemaCotas className="flex-1 gap-8">
                <FormularioCanal
                    key={`${grupo.id}:${c}`}
                    grupo={grupo}
                    canal={c}
                    comissario={comissario}
                    codigosDoEvento={[...codigosEmUso(grupos.map((x) => x.grupo), evento.id, { grupoId: grupo.id })]}
                    temVendas={vendas.length > 0}
                    onSair={voltar}
                    onCriarItens={() => navigate(CAMINHO_CRIAR_INGRESSOS)}
                    cabecalho={(sair) => (
                        <div className="flex flex-col gap-2">
                            <CabecalhoCotas titulo={ROTULO_CANAL[c]} alinhamento="esquerda" onVoltar={sair} rotuloVoltar={grupo.nome} />
                            <p className="text-md text-tertiary">{DICA_CANAL[c]}</p>
                        </div>
                    )}
                />
            </TemaCotas>
        </BackstageLayout>
    );
}
