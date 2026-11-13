import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import type { Servico } from "../data/servicos";
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
    const selecao = useSelecaoValor(servico);
    const escolheu = selecao.valor != null;
    const card = useRef<HTMLElement>(null);

    // Mobile: os cantos de cima do card vão endireitando nos últimos 24px antes de encostar
    // na barra do topo (72px), para não sobrar uma curva sob o header ao rolar
    useEffect(() => {
        const el = card.current;
        if (!el) return;
        const desktop = window.matchMedia("(min-width: 1024px)");
        const BARRA = 72;
        const RAIO = 24;
        const atualizar = () => {
            if (desktop.matches) {
                el.style.borderTopLeftRadius = el.style.borderTopRightRadius = "";
                return;
            }
            const raio = Math.max(0, Math.min(RAIO, el.getBoundingClientRect().top - BARRA));
            el.style.borderTopLeftRadius = el.style.borderTopRightRadius = `${raio}px`;
        };
        atualizar();
        window.addEventListener("scroll", atualizar, { passive: true });
        desktop.addEventListener("change", atualizar);
        return () => {
            window.removeEventListener("scroll", atualizar);
            desktop.removeEventListener("change", atualizar);
        };
    }, []);

    const contratar = () => {
        if (selecao.valor == null) return;
        navigate(`/revenda/servicos-adicionais/${servico.id}/checkout?valor=${selecao.valor}`);
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
