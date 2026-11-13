import { useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import type { Servico } from "../data/servicos";
import { useCantosDoCard } from "../utils/use-cantos-do-card";
import { useSelecaoValor } from "../utils/use-selecao-valor";
import { ApresentacaoServico, MarcaServico } from "./apresentacao-servico";
import { AvisoServico } from "./condicoes";
import { SeletorValor } from "./seletor-valor";

/**
 * Oferta individual num único card: tudo que é leitura e ação fica junto, em uma coluna.
 * Montada só a partir da configuração do serviço — é o bloco que a futura página com
 * vários serviços pode reaproveitar. O CTA aparece desde o início, desabilitado até a escolha
 * do valor: no fim do card no desktop e numa barra fixa no rodapé no mobile.
 */
export function OfertaServico({ servico }: { servico: Servico }) {
    const navigate = useNavigate();
    // Veio da vitrine (Checklist do rolê)? Mostra o voltar e leva a marcação adiante
    const [params] = useSearchParams();
    const doChecklist = params.get("de") === "checklist";
    const selecao = useSelecaoValor(servico);
    const escolheu = selecao.valor != null;
    const card = useRef<HTMLElement>(null);

    useCantosDoCard(card);

    const contratar = () => {
        if (selecao.valor == null) return;
        navigate(`/novos-negocios/servicos-adicionais/${servico.id}/checkout?valor=${selecao.valor}${doChecklist ? "&de=checklist" : ""}`);
    };

    return (
        <>
            <section
                ref={card}
                className={cx(
                    "flex min-h-[calc(100dvh-72px)] flex-col gap-8 rounded-t-3xl bg-primary px-4 pt-8 lg:min-h-0 lg:rounded-none lg:bg-transparent lg:p-0",
                    // Mobile: o fim do card fica livre acima da barra fixa do CTA
                    "pb-28 lg:pb-0",
                )}
            >
                {doChecklist && (
                    <Button
                        size="sm"
                        color="link-gray"
                        iconLeading={ArrowLeft}
                        // Mobile: no topo do card; no desktop o voltar fica acima do mosaico (pages/oferta.tsx)
                        className="-mb-4 self-start lg:hidden"
                        onClick={() => navigate("/novos-negocios/servicos-adicionais/checklist")}
                    >
                        Voltar
                    </Button>
                )}
                <div className="-mb-2">
                    <MarcaServico servico={servico} />
                </div>
                <ApresentacaoServico servico={servico} />

                <div className="flex flex-col gap-5 pt-8">
                    <SeletorValor servico={servico} selecao={selecao} />
                    {servico.aviso && <AvisoServico texto={servico.aviso} />}
                    {/* Desktop: CTA no fim do card, desabilitado até a pessoa escolher um valor */}
                    <Button size="xl" color="primary" className="hidden w-full lg:flex" isDisabled={!escolheu} onClick={contratar}>
                        {servico.cta}
                    </Button>
                </div>
            </section>

            {/* Mobile: CTA fixo no rodapé, desabilitado até a pessoa escolher um valor */}
            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-secondary bg-primary px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">
                <Button size="xl" color="primary" className="w-full" isDisabled={!escolheu} onClick={contratar}>
                    {servico.cta}
                </Button>
            </div>
        </>
    );
}
