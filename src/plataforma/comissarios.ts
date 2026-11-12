import { useSyncExternalStore } from "react";
import type { Evento } from "./modelo";
import { canalNovo, comissarioDoGrupo, cotaSemLimite, vinculoDoGrupo, type CanalDoGrupo, type CanalGrupo, type GrupoEquipe } from "./equipe";

/* ------------------------------------------------------------------ */
/*  Comissários (COM): store compartilhado por Backstage e Freepass    */
/*                                                                     */
/*  Dois níveis, como Produtos da organização:                         */
/*  - organização: o cadastro do comissário com as condições padrão    */
/*    (comissão e desconto). Cadastra uma vez, usa em todos os eventos.*/
/*  - evento: o comissário é puxado do cadastro, herda as condições e  */
/*    pode ter outras só ali. O evento define canais e ingressos.      */
/*                                                                     */
/*  Comissário não é sub-evento: o comprador compra o mesmo evento. O  */
/*  que muda é a atribuição da venda (link, cupom, bilheteria,         */
/*  cortesia) e quanto o comissário ganha por ela.                     */
/*                                                                     */
/*  Mock em localStorage, fora do banco: a plataforma ainda não tem    */
/*  comissário nem atribuição no pedido (backstage/comissarios/        */
/*  rules.md, Em aberto). Quando virar coleção, só este arquivo muda.  */
/*                                                                     */
/*  É o store único de Equipe e Comissários (ECO): no evento, o        */
/*  comissário vive dentro de um grupo da equipe (`equipe.ts`). O      */
/*  "vínculo" de antes virou uma leitura do grupo, sem gravação.       */
/* ------------------------------------------------------------------ */

/** Por onde o comissário vende ou emite. */
export type CanalComissario = "online" | "bilheteria" | "cortesia";

export const CANAIS: CanalComissario[] = ["online", "bilheteria", "cortesia"];

export const CANAL_LABEL: Record<CanalComissario, string> = {
    online: "Link de venda",
    bilheteria: "Bilheteria",
    cortesia: "Cortesia",
};

export const CANAL_DICA: Record<CanalComissario, string> = {
    online: "Vende pelo link e pelo cupom dele. O desconto vale aqui.",
    bilheteria: "Vende na bilheteria do Backstage, com a venda no nome dele.",
    cortesia: "Envia cortesias até a cota definida. Cortesia não gera comissão.",
};

/** % do valor do ingresso ou valor fixo por ingresso (MKT-262). */
/**
 * Como o comissário ganha: % do ingresso, valor fixo por ingresso ou valor a mais (quem compra paga
 * o preço do ingresso mais esse valor, e a diferença é do comissário).
 */
export type TipoComissao = "percentual" | "fixo" | "acrescimo";

/** Condições comerciais. Desconto em % para quem compra pelo link ou cupom (não vale com valor a mais). */
export interface Condicoes {
    tipo: TipoComissao;
    /** % sobre o preço (percentual) ou reais por ingresso (fixo e valor a mais). */
    comissao: number;
    /** `null`: sem desconto. */
    desconto: number | null;
}

/** Preço que quem compra pelo código paga, com o desconto ou o valor a mais do comissário. */
export const precoComCodigo = (preco: number, c: Pick<Condicoes, "tipo" | "comissao" | "desconto">) =>
    c.tipo === "acrescimo" ? preco + c.comissao : c.desconto ? Math.round(preco * (100 - c.desconto)) / 100 : preco;

/** Quanto o comissário ganha por ingresso desse preço. */
export const ganhoPorIngresso = (preco: number, c: Condicoes) =>
    c.tipo === "percentual" ? Math.round(precoComCodigo(preco, c) * c.comissao) / 100 : c.comissao;

/** Quem acessa "Suas vendas" pelo comissário. Responsável vê tudo do comissário; vendedor, só o que vendeu. */
export interface PessoaDoComissario {
    nome: string;
    email: string;
    papel: "responsavel" | "vendedor";
}

export const PAPEL_LABEL: Record<PessoaDoComissario["papel"], string> = { responsavel: "Responsável", vendedor: "Vendedor" };

/**
 * O comissário. Desde 12/11/2026 não é mais um cadastro da organização: é a leitura de um grupo de
 * Equipe e Comissários com o canal Comissário (`comissarioDoGrupo`, em `equipe.ts`). O id é o do grupo.
 */
export interface Comissario {
    id: string;
    organizacaoId: string;
    nome: string;
    email: string;
    telefone?: string;
    /** Usado no link (/e/<slug>?c=<codigo>) e como cupom. Único na organização. */
    codigo: string;
    padrao: Condicoes;
    /** A primeira é a responsável. */
    pessoas: PessoaDoComissario[];
    ativo: boolean;
    criadoEm: string;
}

/**
 * O comissário dentro de um evento. Não é gravado: é a leitura do grupo da equipe que tem o
 * comissário (`vinculoDoGrupo`, em `equipe.ts`). Um comissário está em no máximo um grupo por evento.
 */
export interface ComissarioNoEvento {
    comissarioId: string;
    eventoId: string;
    /** Grupo da equipe de onde vem esta leitura. */
    grupoId: string;
    /** `null`: usa as condições do cadastro. */
    condicoes: Condicoes | null;
    canais: CanalComissario[];
    /** `null`: todos os ingressos do evento, incluindo os criados depois. */
    ingressos: string[] | null;
    /** Teto de cortesias. `null`: sem cota (só o estoque). */
    cotaCortesia: number | null;
    ativo: boolean;
    adicionadoEm: string;
}

/** Venda ou emissão atribuída a um comissário. */
export interface VendaAtribuida {
    id: string;
    comissarioId: string;
    eventoId: string;
    pedido: string;
    canal: CanalComissario;
    comprador: string;
    /** Pessoa do comissário que fez a venda. */
    vendedor: string;
    ingresso: string;
    setor: string;
    quantidade: number;
    /** Valor pago por ingresso, já com o desconto ou o valor a mais do comissário. Cortesia: 0. */
    face: number;
    /** Desconto dado por ingresso. */
    desconto: number;
    /** Valor a mais cobrado por ingresso, que vai para o comissário. */
    acrescimo?: number;
    /** Condição da hora da venda (congelada: mudar a condição depois não muda o passado). */
    tipoAplicado: TipoComissao;
    comissaoAplicada: number;
    /** Cancelada estorna a comissão (MKT-262). */
    status: "confirmada" | "cancelada";
    data: string;
}

/** Pagamento da comissão feito pela organização. */
export interface Repasse {
    id: string;
    comissarioId: string;
    eventoId: string;
    valor: number;
    data: string;
    observacao?: string;
}

/** O que é gravado. */
interface EstadoGravado {
    /** Grupos da equipe de cada evento, com ou sem comissário (ECO). */
    grupos: GrupoEquipe[];
    vendas: VendaAtribuida[];
    repasses: Repasse[];
    /** Organizações que já receberam os exemplos. */
    semeadas: string[];
    /** Eventos que já receberam os grupos de exemplo da equipe. */
    eventosComExemplos: string[];
}

/** O que as telas leem: o gravado mais os comissários e os vínculos, lidos dos grupos com o canal Comissário. */
export interface Estado extends EstadoGravado {
    comissarios: Comissario[];
    vinculos: ComissarioNoEvento[];
}

// v11: o grupo virou o comissário (sem cadastro na organização). Dados anteriores ficam para trás e semeiam de novo.
const CHAVE = "backstage-comissarios-v11";

const vazio = (): EstadoGravado => ({ grupos: [], vendas: [], repasses: [], semeadas: [], eventosComExemplos: [] });

const comVinculos = (e: EstadoGravado): Estado => {
    const comissarios = e.grupos.filter((g): g is GrupoEquipe & { comissarioId: string } => !!g.comissarioId);
    return { ...e, comissarios: comissarios.map(comissarioDoGrupo), vinculos: comissarios.map(vinculoDoGrupo) };
};

let gravado: EstadoGravado = (() => {
    if (typeof window === "undefined") return vazio();
    try {
        ["backstage-comissarios-v9", "backstage-comissarios-v10"].forEach((k) => window.localStorage.removeItem(k));
        const salvo = JSON.parse(window.localStorage.getItem(CHAVE) ?? "null");
        return salvo && Array.isArray(salvo.grupos) ? { ...vazio(), ...salvo } : vazio();
    } catch {
        return vazio();
    }
})();
let estado: Estado = comVinculos(gravado);

const ouvintes = new Set<() => void>();

function mudar(fn: (e: EstadoGravado) => EstadoGravado) {
    gravado = fn(gravado);
    estado = comVinculos(gravado);
    try {
        window.localStorage.setItem(CHAVE, JSON.stringify(gravado));
    } catch {
        /* storage indisponível: fica só em memória */
    }
    ouvintes.forEach((o) => o());
}

const assinar = (fn: () => void) => {
    ouvintes.add(fn);
    return () => ouvintes.delete(fn);
};

export function useEstadoComissarios(): Estado {
    return useSyncExternalStore(assinar, () => estado, () => estado);
}

/** Leitura fora do React (ações e validações). */
export const lerEstadoComissarios = () => estado;

/** Recomeça o protótipo: apaga tudo e semeia de novo na próxima leitura. */
export function reiniciarComissarios() {
    mudar(() => vazio());
}

/* ------------------------------------------------------------------ */
/*  Semente: exemplos por organização                                  */
/* ------------------------------------------------------------------ */

/** Gerador determinístico: a mesma organização sempre nasce igual. */
/** Id de pedido no formato uuid (v4), sorteado de forma estável para a seed. */
function uuidDe(r: () => number) {
    const hex = (n: number) => Array.from({ length: n }, () => Math.floor(r() * 16).toString(16)).join("");
    return `${hex(8)}-${hex(4)}-4${hex(3)}-${"89ab"[Math.floor(r() * 4)]}${hex(3)}-${hex(12)}`;
}

function sorteador(semente: string) {
    let h = 2166136261;
    for (let i = 0; i < semente.length; i++) h = Math.imul(h ^ semente.charCodeAt(i), 16777619);
    return () => {
        h = Math.imul(h ^ (h >>> 15), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        h ^= h >>> 16;
        return (h >>> 0) / 4294967296;
    };
}

const EXEMPLOS: Array<Pick<Comissario, "nome" | "email" | "codigo" | "telefone"> & { padrao: Condicoes; ativo?: boolean; vendedores?: string[] }> = [
    { nome: "Vitor Almeida", email: "vitor.almeida@email.com", codigo: "VITOR", telefone: "(11) 98765-4321", padrao: { tipo: "percentual", comissao: 3, desconto: 10 } },
    { nome: "Atlética de Engenharia", email: "contato@atleticaeng.com.br", codigo: "ENGENHARIA", padrao: { tipo: "fixo", comissao: 5, desconto: null }, vendedores: ["Caio Prado", "Letícia Ramos", "João Vitor Sá"] },
    { nome: "Bruna Costa", email: "bruna.costa@email.com", codigo: "BRUNA", telefone: "(21) 99876-1234", padrao: { tipo: "percentual", comissao: 4, desconto: 5 } },
    { nome: "Coletivo Noite Sul", email: "producao@noitesul.com", codigo: "NOITESUL", padrao: { tipo: "percentual", comissao: 6, desconto: 10 }, vendedores: ["Duda Freitas"] },
    { nome: "Atlética de Direito", email: "diretoria@atleticadireito.org", codigo: "DIREITO", padrao: { tipo: "acrescimo", comissao: 20, desconto: null }, vendedores: ["Helena Vaz", "Otávio Brandão"] },
    { nome: "Rafael Nunes", email: "rafa.nunes@email.com", codigo: "RAFA", padrao: { tipo: "percentual", comissao: 3, desconto: null } },
    { nome: "Marina Lopes", email: "marina.lopes@email.com", codigo: "MARINA", padrao: { tipo: "percentual", comissao: 3, desconto: 5 }, ativo: false },
];

const COMPRADORES = [
    "Ana Ribeiro", "Pedro Henrique", "Juliana Martins", "Lucas Ferreira", "Camila Rocha", "Gabriel Souza", "Larissa Melo", "Thiago Barros",
    "Beatriz Lima", "Matheus Araújo", "Fernanda Dias", "Rodrigo Teixeira", "Isabela Castro", "Felipe Moreira", "Carolina Pinto", "Diego Cardoso",
];

interface IngressoPlano {
    id: string;
    nome: string;
    setor: string;
    preco: number;
}

/** Todos os ingressos do evento, com o preço do primeiro lote. */
export function ingressosDoEvento(evento: Evento): IngressoPlano[] {
    const vistos = new Map<string, IngressoPlano>();
    for (const s of evento.sessoes ?? [])
        for (const g of s.grupos ?? [])
            for (const i of g.ingressos ?? []) if (!vistos.has(i.id)) vistos.set(i.id, { id: i.id, nome: i.nome, setor: g.nome, preco: i.lotes?.[0]?.preco ?? 0 });
    return [...vistos.values()];
}

/** Setores do evento com os ingressos de cada um (para a seleção em árvore). */
export function setoresDoEvento(evento: Evento): Array<{ id: string; nome: string; ingressos: IngressoPlano[] }> {
    const setores = new Map<string, { id: string; nome: string; ingressos: IngressoPlano[] }>();
    const vistos = new Set<string>();
    for (const s of evento.sessoes ?? [])
        for (const g of s.grupos ?? []) {
            const setor = setores.get(g.nome) ?? { id: g.id, nome: g.nome, ingressos: [] };
            for (const i of g.ingressos ?? []) {
                if (vistos.has(i.id)) continue;
                vistos.add(i.id);
                setor.ingressos.push({ id: i.id, nome: i.nome, setor: g.nome, preco: i.lotes?.[0]?.preco ?? 0 });
            }
            setores.set(g.nome, setor);
        }
    return [...setores.values()].filter((s) => s.ingressos.length > 0);
}

const dataISO = (base: Date, diasAtras: number, r: () => number) => {
    const d = new Date(base);
    d.setDate(d.getDate() - diasAtras);
    d.setHours(9 + Math.floor(r() * 14), Math.floor(r() * 60));
    return d.toISOString();
};

function gerarVendas(c: Comissario, v: ComissarioNoEvento, evento: Evento, r: () => number): VendaAtribuida[] {
    const ingressos = ingressosDoEvento(evento).filter((i) => !v.ingressos || v.ingressos.includes(i.id));
    if (ingressos.length === 0) return [];
    const cond = v.condicoes ?? c.padrao;
    const hoje = new Date();
    const vendas: VendaAtribuida[] = [];
    const total = 6 + Math.floor(r() * 28);
    for (let n = 0; n < total; n++) {
        const canal = v.canais[Math.floor(r() * v.canais.length)];
        const ing = ingressos[Math.floor(r() * ingressos.length)];
        // O valor a mais vale onde ele vende (link, cupom e bilheteria); o desconto, só no link e no cupom.
        const acrescimo = cond.tipo === "acrescimo" && canal !== "cortesia" ? cond.comissao : 0;
        const desconto = canal === "online" && cond.tipo !== "acrescimo" && cond.desconto ? Math.round(ing.preco * cond.desconto) / 100 : 0;
        vendas.push({
            id: `${c.id}-${evento.id}-${n}`,
            comissarioId: c.id,
            eventoId: evento.id,
            pedido: uuidDe(r),
            canal,
            comprador: COMPRADORES[Math.floor(r() * COMPRADORES.length)],
            vendedor: c.pessoas[Math.floor(r() * c.pessoas.length)]?.nome ?? c.nome,
            ingresso: ing.nome,
            setor: ing.setor,
            quantidade: canal === "cortesia" ? 1 : 1 + Math.floor(r() * 3),
            face: canal === "cortesia" ? 0 : ing.preco - desconto + acrescimo,
            desconto: canal === "cortesia" ? 0 : desconto,
            acrescimo: canal === "cortesia" ? 0 : acrescimo,
            tipoAplicado: cond.tipo,
            comissaoAplicada: cond.comissao,
            status: canal !== "cortesia" && r() < 0.06 ? "cancelada" : "confirmada",
            data: dataISO(hoje, Math.floor(r() * 30), r),
        });
    }
    return vendas.sort((a, b) => b.data.localeCompare(a.data));
}

/** Parte final do id do modelo ("org-com-3" -> "com-3"), para o id do grupo-comissário. */
const i0 = (id: string) => id.slice(id.lastIndexOf("com-"));

/** Semeia uma organização na primeira vez que ela abre a feature. */
export function semear(organizacaoId: string, eventos: Evento[]) {
    if (!organizacaoId || estado.semeadas.includes(organizacaoId)) return;
    const r = sorteador(organizacaoId);
    const agora = new Date().toISOString();
    // O Vitor (persona do Freepass) vende para poucas organizações; nas outras, o primeiro exemplo é outra pessoa.
    const comVitor = organizacaoId === "org_anitta" || sorteador(`vitor-${organizacaoId}`)() < 0.1;
    const exemplos = comVitor ? EXEMPLOS : [{ ...EXEMPLOS[0], nome: "Lucas Mendes", email: "lucas.mendes@email.com", codigo: "LUCAS" }, ...EXEMPLOS.slice(1)];
    // Modelos dos exemplos: cada um vira um grupo-comissário em cada evento (o grupo é o comissário).
    const comissarios: Comissario[] = exemplos.map((e, i) => ({
        id: `${organizacaoId}-com-${i + 1}`,
        organizacaoId,
        nome: e.nome,
        email: e.email,
        telefone: e.telefone,
        codigo: e.codigo,
        padrao: e.padrao,
        pessoas: [
            { nome: e.vendedores ? `Presidência ${e.nome.replace(/^Atlética de /, "")}` : e.nome, email: e.email, papel: "responsavel" },
            ...(e.vendedores ?? []).map((n) => ({ nome: n, email: `${normalizarCodigo(n.split(" ")[0]).toLowerCase()}@${e.email.split("@")[1]}`, papel: "vendedor" as const })),
        ],
        ativo: e.ativo ?? true,
        criadoEm: agora,
    }));
    const grupos: GrupoEquipe[] = [];
    const vendas: VendaAtribuida[] = [];
    const repasses: Repasse[] = [];
    // Até 3 eventos recebem comissários, primeiro os que estão vendendo; o resto fica sem, para mostrar o vazio.
    const vendendo = eventos.filter((e) => e.status !== "encerrado" && e.status !== "rascunho").sort((a, b) => b.data.localeCompare(a.data));
    const outros = eventos.filter((e) => !vendendo.includes(e)).sort((a, b) => b.data.localeCompare(a.data));
    const comEventos = [...vendendo, ...outros].slice(0, 3);
    comEventos.forEach((evento, ei) => {
        const quantos = ei === 0 ? 6 : 3;
        comissarios.slice(0, quantos).forEach((c, ci) => {
            const personalizado = ci === 0 && ei === 0;
            // No Freepass há quem só emite: nos outros eventos, o primeiro exemplo (o Vitor) só tem
            // bilheteria e cortesia, ou só cortesia, sem link de venda e sem comissão.
            const soEmite = ci === 0 && ei > 0;
            const canaisAntigos: CanalComissario[] = soEmite
                ? ei === 1
                    ? ["bilheteria", "cortesia"]
                    : ["cortesia"]
                : ci % 3 === 0
                  ? ["online", "bilheteria", "cortesia"]
                  : ci % 3 === 1
                    ? ["online", "cortesia"]
                    : ["online"];
            // Cada comissário do evento vira um grupo da equipe com ele (ECO): os canais de antes viram canais do grupo.
            const ingressos = ingressosDoEvento(evento).map((i) => i.id);
            const canais: Partial<Record<CanalGrupo, CanalDoGrupo>> = {};
            // O canal Comissário sempre existe no grupo-comissário; quem só emite tem o canal desligado (sem link).
            canais.link = { ...canalNovo("link"), todos: true, ligado: canaisAntigos.includes("online") };
            if (canaisAntigos.includes("bilheteria")) canais.bilheteria = { ...canalNovo("bilheteria"), itens: ingressos, comissao: !soEmite };
            if (canaisAntigos.includes("cortesia"))
                canais.cortesia = {
                    ...canalNovo("cortesia"),
                    itens: ingressos.slice(0, 3),
                    cota: ci % 3 === 2 ? cotaSemLimite() : { tipo: "compartilhada", total: 20, porItem: {} },
                };
            const id = `${evento.id}-grp-${i0(c.id)}`;
            const grupo: GrupoEquipe & { comissarioId: string } = {
                id,
                eventoId: evento.id,
                organizacaoId,
                nome: c.nome,
                ativo: c.ativo,
                criadoEm: agora,
                gruposMembrosIds: [],
                emailsAvulsos: c.pessoas.map((p) => p.email),
                operadores: c.pessoas.map((p) => p.email),
                operadoresInativos: [],
                gruposInativos: [],
                emitidosPorOperador: {},
                comissarioId: id,
                // O Vitor tem outra comissão no evento principal.
                condicoes: personalizado ? { tipo: "percentual", comissao: 5, desconto: c.padrao.desconto } : c.padrao,
                codigo: c.codigo,
                responsavel: c.email,
                nomes: Object.fromEntries(c.pessoas.map((p) => [p.email, p.nome])),
                canais,
            };
            const daquiNoGrupo = comissarioDoGrupo(grupo);
            const v = vinculoDoGrupo(grupo);
            const geradas = c.ativo && !soEmite ? gerarVendas(daquiNoGrupo, v, evento, r) : [];
            vendas.push(...geradas);
            // O uso de cada canal do grupo é o que já saiu por ele: vendas do link e da bilheteria e as
            // cortesias enviadas (as cortesias vão para os itens do canal, em rodízio).
            const idDoIngresso = new Map(ingressosDoEvento(evento).map((i) => [`${i.setor}:${i.nome}`, i.id]));
            for (const x of geradas.filter((y) => y.status === "confirmada")) {
                const destino = x.canal === "online" ? canais.link : x.canal === "bilheteria" ? canais.bilheteria : canais.cortesia;
                if (!destino) continue;
                const item = x.canal === "cortesia" ? destino.itens[destino.uso.__n__ ?? 0] : idDoIngresso.get(`${x.setor}:${x.ingresso}`);
                if (x.canal === "cortesia") destino.uso.__n__ = ((destino.uso.__n__ ?? 0) + 1) % Math.max(1, destino.itens.length);
                if (item) destino.uso[item] = (destino.uso[item] ?? 0) + x.quantidade;
            }
            for (const cfg of Object.values(canais)) if (cfg) delete cfg.uso.__n__;
            grupos.push(grupo);
            const comissao = geradas.reduce((s, x) => s + comissaoDaVenda(x), 0);
            if (comissao > 0 && ci % 2 === 0) {
                repasses.push({ id: `${id}-rep`, comissarioId: id, eventoId: evento.id, valor: Math.round(comissao * 0.5 * 100) / 100, data: agora, observacao: "Pix" });
            }
        });
    });
    mudar((e) => ({
        ...e,
        grupos: [...e.grupos, ...grupos],
        vendas: [...e.vendas, ...vendas],
        repasses: [...e.repasses, ...repasses],
        semeadas: [...e.semeadas, organizacaoId],
    }));
}

/* ------------------------------------------------------------------ */
/*  Cálculos                                                           */
/* ------------------------------------------------------------------ */

/** Comissão bruta de uma venda, antes do estorno: % sobre o valor pago, ou reais por ingresso (fixo e valor a mais). Cortesia não gera. */
export const comissaoBruta = (v: VendaAtribuida) => {
    if (v.canal === "cortesia") return 0;
    return v.tipoAplicado === "percentual" ? Math.round(v.face * v.quantidade * v.comissaoAplicada) / 100 : v.comissaoAplicada * v.quantidade;
};

/** Comissão que conta: só pedido confirmado. Cancelado estorna (MKT-262). */
export const comissaoDaVenda = (v: VendaAtribuida) => (v.status === "cancelada" ? 0 : comissaoBruta(v));

export interface Totais {
    vendidos: number;
    cortesias: number;
    receita: number;
    comissao: number;
    repassado: number;
    aRepassar: number;
    /** Ingressos de pedidos cancelados e a comissão estornada por eles. */
    cancelados: number;
    estornado: number;
    porCanal: Record<CanalComissario, { quantidade: number; receita: number }>;
}

export function totais(vendas: VendaAtribuida[], repasses: Repasse[]): Totais {
    const porCanal: Totais["porCanal"] = { online: { quantidade: 0, receita: 0 }, bilheteria: { quantidade: 0, receita: 0 }, cortesia: { quantidade: 0, receita: 0 } };
    let vendidos = 0;
    let cortesias = 0;
    let receita = 0;
    let comissao = 0;
    let cancelados = 0;
    let estornado = 0;
    for (const v of vendas) {
        if (v.status === "cancelada") {
            cancelados += v.quantidade;
            estornado += comissaoBruta(v);
            continue;
        }
        porCanal[v.canal].quantidade += v.quantidade;
        porCanal[v.canal].receita += v.face * v.quantidade;
        if (v.canal === "cortesia") cortesias += v.quantidade;
        else vendidos += v.quantidade;
        receita += v.face * v.quantidade;
        comissao += comissaoDaVenda(v);
    }
    const repassado = repasses.reduce((s, r) => s + r.valor, 0);
    return { vendidos, cortesias, receita, comissao, repassado, aRepassar: Math.max(0, comissao - repassado), cancelados, estornado, porCanal };
}

/** Condições valendo para o comissário no evento, e se vêm do cadastro. */
export function condicoesNoEvento(c: Comissario, v: ComissarioNoEvento): Condicoes & { herdadas: boolean } {
    return v.condicoes ? { ...v.condicoes, herdadas: false } : { ...c.padrao, herdadas: true };
}

/** Cortesias já enviadas pelo comissário no evento. */
export const cortesiasEnviadas = (vendas: VendaAtribuida[]) => vendas.filter((v) => v.canal === "cortesia").reduce((s, v) => s + v.quantidade, 0);

/* ------------------------------------------------------------------ */
/*  Ações                                                              */
/* ------------------------------------------------------------------ */

export const normalizarCodigo = (t: string) =>
    t
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 20);

export function registrarRepasse(r: Omit<Repasse, "id">) {
    mudar((e) => ({ ...e, repasses: [{ ...r, id: `rep-${Date.now().toString(36)}` }, ...e.repasses] }));
}

/**
 * Cortesias que o comissário emitiu pelo Freepass entram nas vendas atribuídas dele, sem comissão
 * (FCO-72), e no uso do canal Cortesia do grupo dele (`itemId`, quando o item está no canal).
 */
export function registrarCortesias(lista: Array<Pick<VendaAtribuida, "comissarioId" | "eventoId" | "pedido" | "comprador" | "vendedor" | "ingresso" | "setor" | "quantidade"> & { itemId?: string }>) {
    if (lista.length === 0) return;
    const data = new Date().toISOString();
    const novas: VendaAtribuida[] = lista.map(({ itemId: _item, ...v }, i) => ({
        ...v,
        id: `ven-cor-${Date.now().toString(36)}-${i}`,
        canal: "cortesia",
        face: 0,
        desconto: 0,
        tipoAplicado: "fixo",
        comissaoAplicada: 0,
        status: "confirmada",
        data,
    }));
    mudar((e) => ({
        ...e,
        vendas: [...novas, ...e.vendas],
        grupos: e.grupos.map((g) => {
            const cortesia = g.canais.cortesia;
            const doGrupo = lista.filter((v) => v.comissarioId === g.comissarioId && v.eventoId === g.eventoId && v.itemId && cortesia?.itens.includes(v.itemId));
            if (!cortesia || doGrupo.length === 0) return g;
            const uso = { ...cortesia.uso };
            for (const v of doGrupo) uso[v.itemId!] = (uso[v.itemId!] ?? 0) + v.quantidade;
            return { ...g, canais: { ...g.canais, cortesia: { ...cortesia, uso } } };
        }),
    }));
}

/* ------------------------------------------------------------------ */
/*  Grupos da equipe do evento (ECO)                                   */
/* ------------------------------------------------------------------ */

export type DadosNovoGrupo = Pick<GrupoEquipe, "eventoId" | "organizacaoId" | "nome" | "gruposMembrosIds" | "emailsAvulsos" | "operadores">;

/** Cria o grupo ativo, sem uso e sem canal: comissário e canais se configuram depois, na tela do grupo. */
export function criarGrupo(dados: DadosNovoGrupo, exemplos: GrupoEquipe[] = []): GrupoEquipe {
    const novo: GrupoEquipe = {
        ...dados,
        id: `grp-${Date.now().toString(36)}`,
        nome: dados.nome.trim(),
        ativo: true,
        criadoEm: new Date().toISOString(),
        operadoresInativos: [],
        gruposInativos: [],
        emitidosPorOperador: {},
        comissarioId: null,
        condicoes: null,
        canais: {},
    };
    mudar((e) => {
        // O primeiro grupo de um evento vazio chega com os exemplos (sem repetir o nome do novo).
        const vazio = !e.grupos.some((g) => g.eventoId === dados.eventoId) && !e.eventosComExemplos.includes(dados.eventoId);
        const extras = vazio ? exemplos.filter((g) => g.nome.toLowerCase() !== novo.nome.toLowerCase()) : [];
        return {
            ...e,
            grupos: [novo, ...e.grupos, ...extras],
            eventosComExemplos: vazio ? [...e.eventosComExemplos, dados.eventoId] : e.eventosComExemplos,
        };
    });
    return novo;
}

/** Grupos de exemplo de um evento que já tem grupos semeados (só na primeira vez). */
export function semearExemplosDaEquipe(eventoId: string, exemplos: GrupoEquipe[]) {
    if (gravado.eventosComExemplos.includes(eventoId)) return;
    mudar((e) => ({ ...e, grupos: [...e.grupos, ...exemplos], eventosComExemplos: [...e.eventosComExemplos, eventoId] }));
}

/** Muda um grupo. Toda edição de grupo passa por aqui. */
export function alterarGrupo(id: string, fn: (g: GrupoEquipe) => GrupoEquipe) {
    mudar((e) => ({ ...e, grupos: e.grupos.map((g) => (g.id === id ? fn(g) : g)) }));
}

/** Liga, desliga ou configura um canal; `undefined` volta o canal para "não configurado". */
export function salvarCanal(id: string, canal: CanalGrupo, cfg: CanalDoGrupo | undefined) {
    alterarGrupo(id, (g) => {
        const canais = { ...g.canais };
        if (cfg) canais[canal] = cfg;
        else delete canais[canal];
        return { ...g, canais };
    });
}

/**
 * Liga o canal Comissário: o próprio grupo vira o comissário, com código, responsável e condições
 * (o canal com itens e cota se grava com `salvarCanal`). `null` desfaz: o grupo deixa de ser
 * comissário, o canal sai e PDV e Bilheteria deixam de gerar comissão.
 */
export function tornarComissario(id: string, dados: { codigo: string; responsavel: string; condicoes: Condicoes } | null) {
    alterarGrupo(id, (g) => {
        if (dados) return { ...g, comissarioId: g.id, ...dados };
        const canais = { ...g.canais };
        delete canais.link;
        for (const c of ["pdv", "bilheteria"] as const) if (canais[c]) canais[c] = { ...canais[c]!, comissao: false };
        return { ...g, comissarioId: null, condicoes: null, codigo: undefined, responsavel: undefined, canais };
    });
}
