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
    /** Começa recolhido nesta tela, sem gravar a escolha (GDC-44). */
    recolher?: boolean;
}

/**
 * Monta o guia numa tela do evento: o painel, o holofote de apresentação e as ações de cada passo.
 * Vive no BackstageLayout, então acompanha o produtor por todas as telas do evento (GDC-01).
 */
export function GuiaDeConfiguracao({ eventoId, abrirModalDeStatus, recolher = false }: GuiaDeConfiguracaoProps) {
    const navigate = useNavigate();
    const guia = useGuiaDeConfiguracao(eventoId);
    const [painel, setPainel] = useState<HTMLElement | null>(null);
    // Em tela de formulário, recolhido por padrão; expandir vale só para esta visita (GDC-44).
    const [abertoAqui, setAbertoAqui] = useState(false);
    const minimizado = recolher ? !abertoAqui : guia.minimizado;
    const alternarMinimizado = recolher ? () => setAbertoAqui((a) => !a) : guia.alternarMinimizado;

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
                        minimizado={minimizado}
                        onIrParaPasso={(id) => acoes[id]()}
                        onAlternarMinimizado={alternarMinimizado}
                        onFechar={guia.fechar}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

/**
 * O que sobra depois de fechar o guia, quando o passo atual trava a venda (GDC-43).
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
            // Espaço que a página reserva no fim e que a barra de salvar fixa sobe, para o painel não cobrir ação (GDC-43).
            // No celular o painel ocupa a largura: a barra sobe acima dele. No desktop ele fica no canto: a barra abre espaço à direita.
            const desktop = window.matchMedia("(min-width: 640px)").matches;
            const raiz = document.documentElement.style;
            raiz.setProperty("--altura-do-guia", `${altura + (desktop ? 24 : 16) + 12}px`);
            // Recolhido (só a faixa) a barra sobe acima dele; aberto no desktop, alto demais, ela abre espaço à direita.
            const aoLado = desktop && altura > 120;
            raiz.setProperty("--guia-rodape-baixo", aoLado ? "0px" : `${altura + (desktop ? 24 : 16) + 12}px`);
            raiz.setProperty("--guia-rodape-direita", aoLado ? `${Math.round(painel.getBoundingClientRect().width) + 24}px` : "0px");
        };
        atualizar();
        document.head.appendChild(estilo);
        const observador = new ResizeObserver(atualizar);
        observador.observe(painel);
        window.addEventListener("resize", atualizar);
        return () => {
            observador.disconnect();
            window.removeEventListener("resize", atualizar);
            estilo.remove();
            for (const v of ["--altura-do-guia", "--guia-rodape-baixo", "--guia-rodape-direita"]) document.documentElement.style.removeProperty(v);
        };
    }, [painel]);
}
