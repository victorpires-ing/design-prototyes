import { useMemo } from "react";
import { dataHoraCurta, useMeusIngressosPorEvento, type EventoNaCarteira } from "@/plataforma";
import { EVENTOS_DO_BANCO, type EventoDetalhe } from "./eventos";

/* ------------------------------------------------------------------ */
/*  Carteira web ⇄ banco unificado (src/plataforma)                    */
/*                                                                     */
/*  Mostra, antes dos mocks, os ingressos válidos cujo titular tem o   */
/*  e-mail de quem está logado. Sem login, ficam só os mocks.          */
/* ------------------------------------------------------------------ */

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** Mesmo formato dos cards da carteira (EventoCard em pages/Carteira.tsx). */
export interface CardDoBanco {
    id: string;
    title: string;
    local: string;
    hora: string;
    dia: string;
    mes: string;
    qtd: number;
    gradient?: string;
    datas: string;
    mesAno: string;
}

export const detalheDoBanco = ({ evento: ev, ingressos, inicio }: EventoNaCarteira): EventoDetalhe => ({
    id: ev.id,
    title: ev.nome,
    date: dataHoraCurta(inicio),
    local: [ev.local, ev.cidade].filter(Boolean).join(" • "),
    // GradientFill entende URL como foto: a capa do evento entra no lugar do degradê.
    gradient: ev.capa ?? "",
    sessao: dataHoraCurta(inicio),
    ingressos: ingressos.map((i) => ({
        id: i.id,
        title: `${i.rotulo.grupo} · ${i.rotulo.ingresso}`,
        tipo: i.rotulo.lote,
        data: dataHoraCurta(ev.sessoes.find((s) => s.id === i.sessaoId)?.inicio ?? inicio),
        portador: i.titular.nome,
        acesso: "qr",
        qrModo: "dinamico",
    })),
});

export function useCarteiraDoBanco(): { proximos: CardDoBanco[]; anteriores: CardDoBanco[] } {
    const lista = useMeusIngressosPorEvento();
    return useMemo(() => {
        const proximos: CardDoBanco[] = [];
        const anteriores: CardDoBanco[] = [];
        for (const item of lista) {
            // Registro síncrono: getEvento() das telas de detalhe passa a encontrar este evento.
            EVENTOS_DO_BANCO[item.evento.id] = detalheDoBanco(item);
            const d = new Date(item.inicio);
            const card: CardDoBanco = {
                id: item.evento.id,
                title: item.evento.nome,
                local: [item.evento.local, item.evento.cidade].filter(Boolean).join(", "),
                hora: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
                dia: String(d.getDate()),
                mes: MESES[d.getMonth()],
                qtd: item.ingressos.length,
                gradient: item.evento.capa,
                datas: `${d.getDate()} de ${MESES_CURTOS[d.getMonth()]} ${d.getFullYear()}`,
                mesAno: `${MESES[d.getMonth()]} ${d.getFullYear()}`,
            };
            (item.passado ? anteriores : proximos).push(card);
        }
        return { proximos, anteriores: anteriores.reverse() };
    }, [lista]);
}
