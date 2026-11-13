import { useEffect, useRef, type CSSProperties } from "react";
import { useForceLightTheme } from "../../utils/use-force-light-theme";
import { ChecklistServicos } from "../components/checklist-servicos";
import { FundoPagina } from "../components/fundo-pagina";
import { CardRotativoChecklist, useRotacaoChecklist } from "../components/painel-checklist";
import { Topo, TopoComImagem, recuoCardMobile } from "../components/topo";
import { CHECKLIST, SERVICOS } from "../data/servicos";
import { useCantosDoCard } from "../utils/use-cantos-do-card";

/** Altura do card rotativo no topo do mobile (header + detalhes do serviço + respiro do card que sobe). */
const ALTURA_TOPO_MOBILE = 400;

/**
 * Checklist do rolê — /novos-negocios/servicos-adicionais/checklist
 * Desktop: card rotativo de vidro (sem foto) à esquerda, centralizado na altura do conteúdo;
 * título e linha do tempo à direita.
 * Mobile: mesmo esquema das ofertas, sem foto — o card rotativo de vidro ocupa o topo atrás do
 * header vazado e o conteúdo vem num card branco arredondado que sobe por cima dele ao rolar.
 */
export function Checklist() {
    useForceLightTheme();
    const card = useRef<HTMLDivElement>(null);
    useCantosDoCard(card);
    const servicos = CHECKLIST.map((id) => SERVICOS[id]);
    // Uma rotação só para todas as cópias (topo do mobile, faixa do header e card do desktop)
    const rotacao = useRotacaoChecklist(servicos.length);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <FundoPagina className="lg:bg-primary">
            <TopoComImagem altura={ALTURA_TOPO_MOBILE} faixa={<CardRotativoChecklist servicos={servicos} rotacao={rotacao} variante="so-fundo" />}>
                <CardRotativoChecklist servicos={servicos} rotacao={rotacao} variante="topo" />
            </TopoComImagem>
            <div className="hidden lg:block">
                <Topo comEvento={false} />
            </div>

            <main
                style={{ "--recuo": `${recuoCardMobile(ALTURA_TOPO_MOBILE)}px` } as CSSProperties}
                className="relative z-10 mx-auto -mt-[var(--recuo)] grid w-full max-w-[1264px] grid-cols-1 items-start lg:mt-0 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-6 lg:pt-16 lg:pb-16"
            >
                {/* Mobile: card branco arredondado por cima do topo; desktop: coluna sem moldura */}
                <div
                    ref={card}
                    className="min-h-[calc(100dvh-72px)] rounded-t-3xl bg-primary px-4 pt-8 pb-10 lg:min-h-0 lg:rounded-none lg:bg-transparent lg:p-0"
                >
                    <h1 className="mb-8 text-display-xs font-bold text-primary sm:text-display-sm lg:mb-10">
                        Seu ingresso é só o começo. Encontre serviços e benefícios disponíveis para o seu evento.
                    </h1>
                    <ChecklistServicos />
                </div>

                {/* Desktop: card rotativo à esquerda, centralizado na altura do conteúdo */}
                <div className="hidden lg:order-first lg:block">
                    <CardRotativoChecklist servicos={servicos} rotacao={rotacao} />
                </div>
            </main>
        </FundoPagina>
    );
}
