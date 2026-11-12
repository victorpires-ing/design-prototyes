import type { CanalComissario, Comissario, ComissarioNoEvento, Condicoes, PessoaDoComissario } from "./comissarios";

/* ------------------------------------------------------------------ */
/*  Equipe e Comissários do evento (ECO): modelo do grupo              */
/*                                                                     */
/*  A unidade é o GRUPO. Ele junta o que antes era a Equipe de         */
/*  operação (quem opera, em qual canal, com quais itens e qual cota)  */
/*  e o comissário no evento (quem ganha pela venda). Não há limite    */
/*  por pessoa: a cota é sempre do canal do grupo.                     */
/*                                                                     */
/*  Um grupo pode ter vários canais (Link de venda, PDV, Bilheteria    */
/*  online e Cortesia), cada um com itens e cota próprios. O link só   */
/*  existe com comissário; PDV e Bilheteria geram comissão quando o    */
/*  canal pede; Cortesia nunca gera.                                   */
/*                                                                     */
/*  O grupo é o comissário: ligar o canal Comissário transforma o      */
/*  próprio grupo em comissário (nome, pessoas, código, condições).    */
/*  Não há cadastro de comissário na organização; "Comissário" é um    */
/*  cargo aplicado às pessoas do grupo. Cada grupo, em cada evento, é  */
/*  um comissário próprio.                                             */
/*                                                                     */
/*  Aqui ficam só os tipos e as contas puras. O estado (localStorage)  */
/*  mora no store de `comissarios.ts`, o único da feature.             */
/* ------------------------------------------------------------------ */

export type CanalGrupo = "link" | "pdv" | "bilheteria" | "cortesia";

export const CANAIS_GRUPO: CanalGrupo[] = ["link", "pdv", "bilheteria", "cortesia"];

export const ROTULO_CANAL: Record<CanalGrupo, string> = {
    // O canal do comissário: quem é, as condições, o link de venda e a cota dele.
    link: "Comissário",
    pdv: "PDV",
    bilheteria: "Bilheteria online",
    cortesia: "Cortesia",
};

export const DICA_CANAL: Record<CanalGrupo, string> = {
    link: "O grupo vira comissário: as pessoas dele vendem pelo link e pelo cupom e ele ganha comissão pelas vendas.",
    pdv: "Vende no ponto de venda do evento.",
    bilheteria: "Vende na bilheteria online, pelo Backstage ou pelo Freepass.",
    cortesia: "Envia cortesias. Cortesia não gera comissão.",
};

export type TipoCota = "sem-limite" | "compartilhada" | "por-item";

export const ROTULO_COTA: Record<TipoCota, string> = {
    "sem-limite": "Sem limite de cotas",
    compartilhada: "Cota compartilhada",
    "por-item": "Cota por item",
};

export interface CotaGrupo {
    tipo: TipoCota;
    /** Cota compartilhada: um saldo único do canal, somando todos os itens. */
    total: number;
    /** Cota por item: limite de cada item (chave: id do item). */
    porItem: Record<string, number>;
}

export interface CanalDoGrupo {
    ligado: boolean;
    /** Ingressos, produtos e combos que o canal opera, na ordem em que foram escolhidos. */
    itens: string[];
    /** Só no link: todos os ingressos do evento, inclusive os criados depois. */
    todos?: boolean;
    cota: CotaGrupo;
    /** PDV e Bilheteria em grupo com comissário: a venda gera comissão para ele. */
    comissao?: boolean;
    /** Quanto já foi operado de cada item neste canal. */
    uso: Record<string, number>;
}

export interface GrupoEquipe {
    id: string;
    eventoId: string;
    organizacaoId: string;
    nome: string;
    ativo: boolean;
    criadoEm: string;
    /** Grupos de Membros vinculados: os membros deles são pessoas do grupo. */
    gruposMembrosIds: string[];
    /** Pessoas incluídas uma a uma, por e-mail (as do comissário entram aqui). */
    emailsAvulsos: string[];
    /** Todas as pessoas: membros dos grupos + e-mails avulsos, sem repetição. */
    operadores: string[];
    /** E-mails desligados individualmente. */
    operadoresInativos: string[];
    /** Grupos de Membros desligados por inteiro. */
    gruposInativos: string[];
    /** Quanto cada pessoa já operou, somando os canais. */
    emitidosPorOperador: Record<string, number>;
    /** O próprio id do grupo quando o grupo é comissário (canal Comissário configurado). `null`: sem comissão. */
    comissarioId: string | null;
    /** Condições do comissário (o grupo). `null` em grupo sem comissário. */
    condicoes: Condicoes | null;
    /** Código do link e do cupom, único no evento. */
    codigo?: string;
    /** E-mail da pessoa do grupo que responde pelo comissário (vê tudo e recebe os repasses). */
    responsavel?: string;
    /** Nome de cada pessoa, quando se sabe (o resto aparece pelo e-mail). */
    nomes?: Record<string, string>;
    /** Canal ausente: ainda não configurado. */
    canais: Partial<Record<CanalGrupo, CanalDoGrupo>>;
}

export const plural = (n: number, um: string, varios: string) => `${n.toLocaleString("pt-BR")} ${n === 1 ? um : varios}`;

/** Canais que o grupo pode ter: o link só com comissário. */
export const canaisPossiveis = (g: Pick<GrupoEquipe, "comissarioId">): CanalGrupo[] => CANAIS_GRUPO.filter((c) => c !== "link" || !!g.comissarioId);

/** Canais ligados, na ordem do menu. Grupo desativado não tem canal ligado. */
export const canaisLigados = (g: GrupoEquipe): CanalGrupo[] => (g.ativo ? canaisPossiveis(g).filter((c) => g.canais[c]?.ligado) : []);

/** O canal gera comissão? Link sempre; Cortesia nunca; PDV e Bilheteria quando o canal pede. */
export const geraComissao = (g: Pick<GrupoEquipe, "comissarioId">, canal: CanalGrupo, cfg?: CanalDoGrupo) =>
    !!g.comissarioId && (canal === "link" || ((canal === "pdv" || canal === "bilheteria") && !!cfg?.comissao));

/** Cota vazia: sem limite. */
export const cotaSemLimite = (): CotaGrupo => ({ tipo: "sem-limite", total: 0, porItem: {} });

/** Canal recém-configurado: ligado, sem itens, sem limite. */
export const canalNovo = (canal: CanalGrupo): CanalDoGrupo => ({
    ligado: true,
    itens: [],
    todos: canal === "link" ? true : undefined,
    cota: cotaSemLimite(),
    comissao: canal === "pdv" || canal === "bilheteria" ? false : undefined,
    uso: {},
});

type Valido = (itemId: string) => boolean;
const sempre: Valido = () => true;

/** Itens do canal que ainda existem (o filtro vem do catálogo de quem chama). */
export const itensDoCanal = (c: CanalDoGrupo, valido: Valido = sempre) => c.itens.filter(valido);

export const usadasDoCanal = (c: CanalDoGrupo, valido: Valido = sempre) => Object.entries(c.uso).reduce((s, [id, n]) => (valido(id) ? s + n : s), 0);

/** Limite do canal: o saldo compartilhado, a soma das cotas por item, ou nenhum (`null`). */
export function limiteDoCanal(c: CanalDoGrupo, valido: Valido = sempre): number | null {
    if (c.cota.tipo === "sem-limite") return null;
    if (c.cota.tipo === "compartilhada") return c.cota.total;
    return itensDoCanal(c, valido).reduce((s, id) => s + (c.cota.porItem[id] ?? 0), 0);
}

/** Uso somando os canais ligados; limite só quando todos têm limite. */
export function usoDoGrupo(g: GrupoEquipe, valido: Valido = sempre): { usadas: number; limite: number | null } {
    const canais = canaisPossiveis(g)
        .map((c) => g.canais[c])
        .filter((c): c is CanalDoGrupo => !!c?.ligado);
    const usadas = canais.reduce((s, c) => s + usadasDoCanal(c, valido), 0);
    const limites = canais.map((c) => limiteDoCanal(c, valido));
    return { usadas, limite: canais.length > 0 && limites.every((l) => l !== null) ? limites.reduce((s, l) => s + (l ?? 0), 0) : null };
}

export const porcentagem = (usadas: number, total: number) => (total > 0 ? Math.min(100, Math.round((usadas / total) * 100)) : 0);

/**
 * Pessoa ligada no grupo. Sem o cadastro de Membros à mão (fica no Backstage), um membro conta como
 * ligado enquanto algum grupo de Membros do grupo segue ligado; o Backstage faz a conta exata.
 */
export function pessoaAtivaNoGrupo(g: GrupoEquipe, email: string) {
    const e = email.toLowerCase();
    if (g.operadoresInativos.some((x) => x.toLowerCase() === e)) return false;
    if (g.emailsAvulsos.some((x) => x.toLowerCase() === e)) return true;
    return g.operadores.some((x) => x.toLowerCase() === e) && g.gruposMembrosIds.some((m) => !g.gruposInativos.includes(m));
}

/**
 * O comissário no evento visto como antes (o "vínculo"): uma leitura do grupo com comissário, para o
 * cadastro da organização e o Freepass seguirem lendo canais, ingressos e cota sem saber do grupo.
 * Não é gravado em lugar nenhum.
 */
export function vinculoDoGrupo(g: GrupoEquipe & { comissarioId: string }): ComissarioNoEvento {
    const ligados = canaisLigados(g);
    const link = g.canais.link;
    const cortesia = g.canais.cortesia;
    const canais: CanalComissario[] = [];
    if (ligados.includes("link")) canais.push("online");
    if (ligados.includes("bilheteria")) canais.push("bilheteria");
    if (ligados.includes("cortesia")) canais.push("cortesia");
    return {
        comissarioId: g.comissarioId,
        eventoId: g.eventoId,
        grupoId: g.id,
        // As condições são do próprio grupo (o "cadastro" dele): o vínculo não sobrescreve nada.
        condicoes: null,
        canais,
        ingressos: link && !link.todos ? link.itens : null,
        cotaCortesia: cortesia?.ligado ? limiteDoCanal(cortesia) : null,
        ativo: g.ativo,
        adicionadoEm: g.criadoEm,
    };
}

/** Canais do grupo que viram funcionalidade no Freepass: Cortesia e Bilheteria online (PDV é outro app). */
export const emissoesDoGrupo = (g: GrupoEquipe): Array<"cortesia" | "bilheteria"> =>
    canaisLigados(g).filter((c): c is "cortesia" | "bilheteria" => c === "cortesia" || c === "bilheteria");

/** Grupos ativos em que a pessoa está ligada (num evento, quando dado). */
export const gruposDaPessoa = (grupos: GrupoEquipe[], email: string, eventoId?: string) =>
    grupos.filter((g) => g.ativo && (!eventoId || g.eventoId === eventoId) && pessoaAtivaNoGrupo(g, email));

/** Pessoas do comissário (o grupo): o responsável primeiro, as outras como vendedores. */
export function pessoasDoGrupo(g: GrupoEquipe): PessoaDoComissario[] {
    const nome = (email: string) => g.nomes?.[email] ?? email;
    const responsavel = g.responsavel && g.operadores.includes(g.responsavel) ? g.responsavel : g.operadores[0];
    return [
        ...(responsavel ? [{ nome: nome(responsavel), email: responsavel, papel: "responsavel" as const }] : []),
        ...g.operadores.filter((e) => e !== responsavel).map((e) => ({ nome: nome(e), email: e, papel: "vendedor" as const })),
    ];
}

/** O grupo visto como comissário: o "cadastro" que o Freepass, as vendas e os repasses leem. Não é gravado. */
export function comissarioDoGrupo(g: GrupoEquipe & { comissarioId: string }): Comissario {
    const pessoas = pessoasDoGrupo(g);
    return {
        id: g.comissarioId,
        organizacaoId: g.organizacaoId,
        nome: g.nome,
        email: pessoas[0]?.email ?? "",
        codigo: g.codigo ?? "",
        padrao: g.condicoes ?? { tipo: "percentual", comissao: 0, desconto: null },
        pessoas,
        ativo: g.ativo,
        criadoEm: g.criadoEm,
    };
}

/** Código sugerido a partir do nome do grupo: a última palavra, em maiúsculas, só letras e números. */
export const codigoSugerido = (nome: string) =>
    (nome.trim().split(/\s+/).at(-1) ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 20);
