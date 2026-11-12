import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { AlertFloating } from "@/components/application/alerts/alerts";
import { useGuiaDeConfiguracao } from "../data/use-guia";
import type { PassoId } from "../data/passos";
import { HolofoteDoGuia } from "./holofote-do-guia";
import { PainelDoGuia } from "./painel-do-guia";

export const ROTA_ABERTURAS = "/backstage/catalogo/aberturas-de-vendas";

/** Pedido para Itens › Ingressos abrir o modal "Novo setor" ao chegar (GDC-11). */
export const PARAMETRO_NOVO_SETOR = "novoSetor";

interface GuiaDeConfiguracaoProps {
    eventoId: string;
    /** Abre o modal de status do evento já com o destino escolhido. */
    abrirModalDeStatus: (status: "publicado") => void;
}

/**
 * Monta o guia numa tela do evento: o painel, o holofote de apresentação e as ações de cada passo.
 * Vive no BackstageLayout, então acompanha o produtor por todas as telas do evento (GDC-01).
 */
export function GuiaDeConfiguracao({ eventoId, abrirModalDeStatus }: GuiaDeConfiguracaoProps) {
    const navigate = useNavigate();
    const guia = useGuiaDeConfiguracao(eventoId);
    const [painel, setPainel] = useState<HTMLElement | null>(null);

    useReservarEspacoDosToasts(painel);

    // Mexeu no painel, o holofote sai de cena (GDC-14).
    const { holofotePendente, concluirHolofote } = guia;
    useEffect(() => {
        if (!painel || !holofotePendente) return;
        painel.addEventListener("click", concluirHolofote, { capture: true });
        return () => painel.removeEventListener("click", concluirHolofote, { capture: true });
    }, [painel, holofotePendente, concluirHolofote]);

    const acoes: Record<PassoId, () => void> = {
        setores: () => navigate(`/backstage/catalogo/ingressos?${PARAMETRO_NOVO_SETOR}=1`),
        ingressos: () => navigate("/backstage/catalogo/ingressos/novo"),
        abertura: () => navigate(ROTA_ABERTURAS),
        publicar: () => abrirModalDeStatus("publicado"),
    };

    return (
        <>
            <AnimatePresence>{holofotePendente && <HolofoteDoGuia onConcluir={concluirHolofote} />}</AnimatePresence>
            <AnimatePresence>
                {guia.superficie === "painel" && (
                    <PainelDoGuia
                        painelRef={setPainel}
                        passos={guia.passos}
                        minimizado={guia.minimizado}
                        onIrParaPasso={(id) => acoes[id]()}
                        onAlternarMinimizado={guia.alternarMinimizado}
                        onFechar={guia.fechar}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

/**
 * O que sobra depois de fechar o guia, quando o passo atual trava a venda (GDC-10).
 * Sem X de propósito: um estado não se dispensa; resolvido o passo, o alerta some sozinho.
 */
export function AlertaDoGuia({ eventoId }: { eventoId: string | undefined }) {
    const navigate = useNavigate();
    const guia = useGuiaDeConfiguracao(eventoId);
    const alerta = guia.superficie === "alerta" ? guia.passoDoAlerta?.alerta : undefined;
    if (!alerta) return null;
    return (
        <div role="status">
            <AlertFloating color="warning" title={alerta.titulo} description={alerta.descricao} confirmLabel={alerta.acao} onConfirm={() => navigate(ROTA_ABERTURAS)} />
        </div>
    );
}

/**
 * Toasts (sonner, canto inferior direito) sobem para cima do painel enquanto ele está na tela,
 * em vez de cobri-lo. Só a partir de 640px: no celular o painel ocupa a largura e o toast fica por cima dele.
 */
function useReservarEspacoDosToasts(painel: HTMLElement | null) {
    useEffect(() => {
        if (!painel) return;
        const estilo = document.createElement("style");
        const atualizar = () => {
            const altura = Math.round(painel.getBoundingClientRect().height);
            estilo.textContent = `@media (min-width: 640px) { [data-sonner-toaster][data-y-position="bottom"][data-x-position="right"] { --offset-bottom: ${altura + 24 + 12}px !important; } }`;
        };
        atualizar();
        document.head.appendChild(estilo);
        const observador = new ResizeObserver(atualizar);
        observador.observe(painel);
        return () => {
            observador.disconnect();
            estilo.remove();
        };
    }, [painel]);
}
