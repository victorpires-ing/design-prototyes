/* Dados mock do evento (exemplo de Réveillon), compartilhados entre a tela de
   vincular itens e o slide-out de adicionar vínculos.

   Hierarquia de Ingressos: Sessão → Grupo (agrupador, ex: "Arena") →
   Ingresso (Feminino/Masculino/...) → Lote (item selecionável).
   Combos: agrupador "Combo N" + legenda (ingressos que o compõem) → Lote. */

import viseiraImg from "../assets/viseira.jpg";
import copoImg from "../assets/copo.jpg";

export interface Lote {
    id: string;
    name: string;
}
export interface Ingresso {
    id: string;
    name: string;
    /** Tipo do código: Ingresso, Check-in ou Pacote. */
    type: string;
    lotes: Lote[];
}
export interface Grupo {
    id: string;
    name: string;
    ingressos: Ingresso[];
}
export interface Sessao {
    id: string;
    date: string;
    grupos: Grupo[];
}
export interface Produto {
    id: string;
    name: string;
    img: string;
}
export interface Combo {
    id: string;
    name: string;
    /** Ingressos que compõem o combo. */
    legenda: string;
    lotes: Lote[];
}

const lote = (id: string, name: string): Lote => ({ id, name });
const duasLotes = (prefix: string): Lote[] => [lote(`${prefix}-l1`, "1º Lote"), lote(`${prefix}-l2`, "2º Lote")];

const INGRESSO_NOMES = ["Feminino", "Masculino", "Meia entrada", "PCD"];
const makeIngresso = (gid: string, i: number, name: string, type = "Ingresso"): Ingresso => {
    const id = `${gid}-t${i}`;
    return { id, name, type, lotes: duasLotes(id) };
};
const makeGrupo = (sid: string, name: string): Grupo => {
    const id = `${sid}-${name.toLowerCase().replace(/\s+/g, "-")}`;
    const ingressos = INGRESSO_NOMES.map((n, i) => makeIngresso(id, i, n));
    // Check-in de estacionamento em cada agrupador.
    ingressos.push(makeIngresso(id, INGRESSO_NOMES.length, "Estacionamento", "Check-in"));
    return { id, name, ingressos };
};
const makeSessao = (sid: string, date: string): Sessao => ({
    id: sid,
    date,
    grupos: [makeGrupo(sid, "Arena"), makeGrupo(sid, "Full Open Bar")],
});

export const SESSOES: Sessao[] = [
    makeSessao("s1", "Dom 27 Dez • 14:00"),
    makeSessao("s2", "Seg 28 Dez • 15:00"),
    makeSessao("s3", "Ter 29 Dez • 15:00"),
];

export const PRODUTOS: Produto[] = [
    { id: "p1", name: "Viseira Personalizada", img: viseiraImg },
    { id: "p2", name: "Copo Personalizado", img: copoImg },
];

const makeCombo = (id: string, name: string, legenda: string): Combo => ({ id, name, legenda, lotes: duasLotes(id) });
export const COMBOS: Combo[] = [
    makeCombo("cb1", "Combo 1", "Arena Feminino + Arena Masculino"),
    makeCombo("cb2", "Combo 2", "Arena Feminino + Meia entrada"),
    makeCombo("cb3", "Combo 3", "Arena Masculino + PCD"),
    makeCombo("cb4", "Combo 4", "Arena Feminino + Arena Masculino + PCD"),
];

/* Ids dos itens selecionáveis (lotes / produtos). */
export const sessaoLeafIds = (sessao: Sessao) => sessao.grupos.flatMap((g) => g.ingressos.flatMap((t) => t.lotes.map((l) => l.id)));
export const sessoesLeafIds = SESSOES.flatMap(sessaoLeafIds);
export const produtoLeafIds = PRODUTOS.map((p) => p.id);
export const comboLeafIds = COMBOS.flatMap((c) => c.lotes.map((l) => l.id));
export const allLeafIds = [...sessoesLeafIds, ...produtoLeafIds, ...comboLeafIds];
