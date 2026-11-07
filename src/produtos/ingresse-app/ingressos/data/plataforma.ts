import { useMemo } from "react";
import { dataHoraCurta, useMeusIngressosPorEvento } from "@/plataforma";
import { EVENTOS_DO_BANCO } from "./eventos";

/* ------------------------------------------------------------------ */
/*  Carteira do app ⇄ banco unificado (src/plataforma)                 */
/*  Os ingressos comprados pelo e-mail logado entram antes dos mocks.  */
/* ------------------------------------------------------------------ */

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export interface EventoListaApp {
    id: string;
    title: string;
    date: string;
    local: string;
    qtd: number;
    gradient?: string;
}
export interface GrupoMesApp {
    mes: string;
    eventos: EventoListaApp[];
}

export function useCarteiraAppDoBanco(): { vemAi: GrupoMesApp[]; passados: GrupoMesApp[] } {
    const lista = useMeusIngressosPorEvento();
    return useMemo(() => {
        const agrupar = (itens: typeof lista) => {
            const grupos: GrupoMesApp[] = [];
            for (const { evento: ev, ingressos, inicio } of itens) {
                const d = new Date(inicio);
                const mes = `${MESES[d.getMonth()]} ${d.getFullYear()}`;
                // Registro síncrono: getEvento() das telas de ingresso encontra o evento do banco.
                EVENTOS_DO_BANCO[ev.id] = {
                    id: ev.id,
                    title: ev.nome,
                    date: dataHoraCurta(inicio),
                    local: [ev.local, ev.cidade].filter(Boolean).join(" • "),
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
                };
                const item = { id: ev.id, title: ev.nome, date: dataHoraCurta(inicio), local: [ev.local, ev.cidade].filter(Boolean).join(" • "), qtd: ingressos.length, gradient: ev.capa };
                const g = grupos.find((x) => x.mes === mes);
                if (g) g.eventos.push(item);
                else grupos.push({ mes, eventos: [item] });
            }
            return grupos;
        };
        return { vemAi: agrupar(lista.filter((i) => !i.passado)), passados: agrupar(lista.filter((i) => i.passado).reverse()) };
    }, [lista]);
}

/** Junta os grupos do banco com os do mock, somando no mesmo mês quando coincide. */
export function juntarGrupos(banco: GrupoMesApp[], mock: GrupoMesApp[]): GrupoMesApp[] {
    const out = mock.map((g) => ({ ...g, eventos: [...g.eventos] }));
    for (const g of banco) {
        const igual = out.find((x) => x.mes === g.mes);
        if (igual) igual.eventos.unshift(...g.eventos);
        else out.unshift(g);
    }
    return out;
}
