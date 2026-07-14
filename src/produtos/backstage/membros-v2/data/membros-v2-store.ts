import { useSyncExternalStore } from "react";
import { EVENTOS, eventoById } from "../../components/membros-store";

/* ------------------------------------------------------------------ */
/*  Membros v2 — permissionamento avançado por ACL (none/read/write).  */
/*                                                                     */
/*  Não há mais "cargo" explícito. O admin descreve o ACESSO por       */
/*  feature (nível + opções da feature) DENTRO de cada grupo, POR      */
/*  MEMBRO. O "cargo" vira um resumo implícito, derivado do dado.      */
/*                                                                     */
/*  Grupo = escopo de eventos + pessoas. O membro herda acesso por     */
/*  estar no grupo; entre grupos, vale a UNIÃO (mais permissivo vence).*/
/* ------------------------------------------------------------------ */

export { EVENTOS, eventoById };

/* ---- ACL primitiva ---- */
export type Nivel = "none" | "read" | "write";
/** Cortesias · Visualizar: abrangência do que a pessoa enxerga. */
export type EscopoView = "proprio" | "todos";
/** Cortesias · Emissão: total ou mediante aprovação. */
export type EmissaoModo = "total" | "aprovacao";

export interface FeatureAccess {
    nivel: Nivel;
    /** Cortesias · Visualizar. */
    escopo?: EscopoView;
    /** Cortesias · Emissão. */
    emissao?: EmissaoModo;
    /** Relatórios: quais relatórios podem ser vistos. */
    relatorios?: string[];
}

/* ---- Registro de features (cada feature interpreta o nível) ---- */
export interface FeatureDef {
    id: string;
    nome: string;
    descricao: string;
    /** Rótulos em linguagem da feature para read/write (none é sempre "Sem acesso"). */
    labels: { read: string; write: string };
    /** Cortesias · Visualizar expõe escopo (do próprio usuário / de todos). */
    temEscopo?: boolean;
    /** Cortesias · Emissão expõe o modo (total / mediante aprovação). */
    temEmissao?: boolean;
    /** Relatórios: seleção de quais relatórios podem ser vistos. */
    temRelatorios?: boolean;
}

export const FEATURES_V2: FeatureDef[] = [
    { id: "f-cortesias", nome: "Cortesias", descricao: "Visualização e emissão de cortesias.", labels: { read: "Visualizar", write: "Emissão" }, temEscopo: true, temEmissao: true },
    { id: "f-relatorios", nome: "Relatórios", descricao: "Vendas, acesso, transações e borderô.", labels: { read: "Sem dados financeiros", write: "Completo" }, temRelatorios: true },
    { id: "f-itens", nome: "Ingressos e itens", descricao: "Ingressos, combos e produtos.", labels: { read: "Ver", write: "Gerenciar" } },
    { id: "f-eventos", nome: "Eventos", descricao: "Conteúdo e configuração dos eventos.", labels: { read: "Ver", write: "Criar/editar" } },
    { id: "f-financeiro", nome: "Financeiro", descricao: "Saldos e solicitações de repasse.", labels: { read: "Ver saldos", write: "Solicitar repasses" } },
    { id: "f-marketing", nome: "Marketing", descricao: "Cupons, passkeys e etiquetas.", labels: { read: "Ver", write: "Gerenciar" } },
];
export function featureById(id: string) {
    return FEATURES_V2.find((f) => f.id === id);
}

/** Nível → verbo da feature (para rótulos e resumo). */
export function nivelLabel(featureId: string, nivel: Nivel): string {
    if (nivel === "none") return "Sem acesso";
    const f = featureById(featureId);
    return f ? f.labels[nivel] : nivel;
}

/* ---- Relatórios disponíveis (checkboxes de quais podem ser vistos) ---- */
export interface RelatorioDef {
    id: string;
    nome: string;
}
export const RELATORIOS_V2: RelatorioDef[] = [
    { id: "vendas", nome: "Vendas" },
    { id: "acesso", nome: "Acesso" },
    { id: "transacoes", nome: "Transações" },
    { id: "bordero", nome: "Borderô" },
    { id: "transferencias", nome: "Transferências" },
    { id: "questionarios", nome: "Questionários" },
];
const TODOS_RELATORIOS = RELATORIOS_V2.map((r) => r.id);

const acessoVazio = (): Record<string, FeatureAccess> => Object.fromEntries(FEATURES_V2.map((f) => [f.id, { nivel: "none" as Nivel }]));

/** Acessos iniciais (tudo "Sem acesso") — para novos membros/rascunhos. */
export function acessosIniciais(): Record<string, FeatureAccess> {
    return acessoVazio();
}

/** Normaliza um acesso de feature ao aplicar um patch (higiene de escopo/emissão). */
export function normalizarAcesso(featureId: string, atual: FeatureAccess, patch: Partial<FeatureAccess>): FeatureAccess {
    const next: FeatureAccess = { ...atual, ...patch };
    if (next.nivel === "none") return { nivel: "none" };
    const f = featureById(featureId);
    // Escopo (Visualizar): só em read.
    if (f?.temEscopo && next.nivel === "read" && !next.escopo) next.escopo = "proprio";
    if (next.nivel !== "read") delete next.escopo;
    // Emissão: só em write.
    if (f?.temEmissao && next.nivel === "write" && !next.emissao) next.emissao = "total";
    if (next.nivel !== "write") delete next.emissao;
    // Relatórios: em qualquer nível de acesso; default = todos ao habilitar.
    if (f?.temRelatorios && !next.relatorios) next.relatorios = [...TODOS_RELATORIOS];
    if (!f?.temRelatorios) delete next.relatorios;
    return next;
}

export interface GrupoV2 {
    id: string;
    nome: string;
    sistema?: boolean;
    /** "todos" ou lista de ids de eventos. */
    escopo: "todos" | string[];
    membroIds: string[];
}

export interface MembroV2 {
    id: string;
    nome: string;
    email: string;
}

/** Acessos de um membro DENTRO de um grupo (por feature). */
export interface AtribuicaoV2 {
    membroId: string;
    grupoId: string;
    acessos: Record<string, FeatureAccess>;
}

/* ---- Membros (pool) ---- */
export const MEMBROS_V2: MembroV2[] = [
    { id: "u-ana", nome: "Ana Souza", email: "ana.souza@ingresse.com" },
    { id: "u-bruno", nome: "Bruno Lima", email: "bruno.lima@ingresse.com" },
    { id: "u-carla", nome: "Carla Nunes", email: "carla.nunes@ingresse.com" },
    { id: "u-diego", nome: "Diego Rocha", email: "diego.rocha@ingresse.com" },
    { id: "u-elaine", nome: "Elaine Prado", email: "elaine.prado@ingresse.com" },
    { id: "u-felipe", nome: "Felipe Antunes", email: "felipe.antunes@ingresse.com" },
];
export function membroV2ById(id: string) {
    return MEMBROS_V2.find((m) => m.id === id);
}

/* ------------------------------------------------------------------ */
/*  Store reativo (grupos + atribuições)                               */
/* ------------------------------------------------------------------ */

const acKey = (membroId: string, grupoId: string) => `${membroId}:${grupoId}`;

const EV = EVENTOS.map((e) => e.id);

/** Resolve o escopo de um grupo para uma lista de ids de eventos. */
export function eventosDoEscopo(escopo: "todos" | string[]): string[] {
    return escopo === "todos" ? EV : escopo;
}

let _grupos: GrupoV2[] = [
    { id: "g-todos", nome: "Todos os eventos", sistema: true, escopo: "todos", membroIds: ["u-ana", "u-diego"] },
    { id: "g-corporativo", nome: "Eventos Corporativos", escopo: [EV[1], EV[3]], membroIds: ["u-bruno", "u-elaine"] },
    { id: "g-festival", nome: "Festival de Verão", escopo: [EV[5]], membroIds: ["u-bruno", "u-carla"] },
    { id: "g-camarote", nome: "Camarote & Hospitality", escopo: [EV[0]], membroIds: ["u-carla", "u-elaine"] },
    { id: "g-teatro", nome: "Circuito Teatro", escopo: [EV[2], EV[4]], membroIds: ["u-carla", "u-felipe"] },
];

const full = (): Record<string, FeatureAccess> => ({
    "f-cortesias": { nivel: "write", emissao: "total" },
    "f-relatorios": { nivel: "write", relatorios: [...TODOS_RELATORIOS] },
    "f-itens": { nivel: "write" },
    "f-eventos": { nivel: "write" },
    "f-financeiro": { nivel: "write" },
    "f-marketing": { nivel: "write" },
});

let _atribuicoes: AtribuicaoV2[] = [
    // Ana em Todos os eventos → acesso total (o mais permissivo).
    { membroId: "u-ana", grupoId: "g-todos", acessos: full() },
    // Diego em Todos os eventos → só leitura de relatórios em todos os eventos.
    { membroId: "u-diego", grupoId: "g-todos", acessos: { ...acessoVazio(), "f-relatorios": { nivel: "read", relatorios: [...TODOS_RELATORIOS] } } },
    // Bruno: gerencia itens + vê eventos no Corporativo; visualiza cortesias do grupo no Festival.
    { membroId: "u-bruno", grupoId: "g-corporativo", acessos: { ...acessoVazio(), "f-itens": { nivel: "write" }, "f-eventos": { nivel: "read" } } },
    { membroId: "u-bruno", grupoId: "g-festival", acessos: { ...acessoVazio(), "f-cortesias": { nivel: "read", escopo: "proprio" } } },
    // Carla: marketing + visualiza cortesias de todos no Festival; itens no Camarote; relatórios no Teatro.
    { membroId: "u-carla", grupoId: "g-festival", acessos: { ...acessoVazio(), "f-marketing": { nivel: "write" }, "f-cortesias": { nivel: "read", escopo: "todos" } } },
    { membroId: "u-carla", grupoId: "g-camarote", acessos: { ...acessoVazio(), "f-itens": { nivel: "write" } } },
    { membroId: "u-carla", grupoId: "g-teatro", acessos: { ...acessoVazio(), "f-relatorios": { nivel: "read", relatorios: ["vendas", "acesso", "questionarios"] } } },
    // Elaine: vê saldos no Corporativo; emite camarote no Camarote + marketing.
    { membroId: "u-elaine", grupoId: "g-corporativo", acessos: { ...acessoVazio(), "f-financeiro": { nivel: "read" } } },
    { membroId: "u-elaine", grupoId: "g-camarote", acessos: { ...acessoVazio(), "f-cortesias": { nivel: "write", emissao: "aprovacao" }, "f-marketing": { nivel: "write" } } },
    // Felipe: visualiza as próprias cortesias no Teatro.
    { membroId: "u-felipe", grupoId: "g-teatro", acessos: { ...acessoVazio(), "f-cortesias": { nivel: "read", escopo: "proprio" } } },
];

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const subscribe = (fn: () => void) => {
    listeners.add(fn);
    return () => {
        listeners.delete(fn);
    };
};

/* ---- grupos ---- */
const gruposSnap = () => _grupos;
export function useGruposV2() {
    return useSyncExternalStore(subscribe, gruposSnap);
}
export function grupoV2ById(id: string) {
    return _grupos.find((g) => g.id === id);
}
export function updateEscopo(grupoId: string, escopo: "todos" | string[]) {
    _grupos = _grupos.map((g) => (g.id === grupoId ? { ...g, escopo } : g));
    notify();
}
export function addMembroAoGrupo(grupoId: string, membroId: string) {
    _grupos = _grupos.map((g) => (g.id === grupoId && !g.membroIds.includes(membroId) ? { ...g, membroIds: [...g.membroIds, membroId] } : g));
    notify();
}
export function removeMembroDoGrupo(grupoId: string, membroId: string) {
    _grupos = _grupos.map((g) => (g.id === grupoId ? { ...g, membroIds: g.membroIds.filter((id) => id !== membroId) } : g));
    _atribuicoes = _atribuicoes.filter((a) => acKey(a.membroId, a.grupoId) !== acKey(membroId, grupoId));
    notify();
}

/** Cria grupo com escopo, membros e o acesso já configurado de cada membro. */
export function addGrupoV2(input: { nome: string; escopo: "todos" | string[]; membros: { membroId: string; acessos: Record<string, FeatureAccess> }[] }) {
    const grupoId = `g-${crypto.randomUUID().slice(0, 8)}`;
    _grupos = [..._grupos, { id: grupoId, nome: input.nome.trim(), escopo: input.escopo, membroIds: input.membros.map((m) => m.membroId) }];
    _atribuicoes = [..._atribuicoes, ...input.membros.map((m) => ({ membroId: m.membroId, grupoId, acessos: m.acessos }))];
    notify();
    return grupoId;
}

/* ---- atribuições (acesso por membro+grupo) ---- */
const atribSnap = () => _atribuicoes;
export function useAtribuicoes() {
    return useSyncExternalStore(subscribe, atribSnap);
}

/** Acessos de um membro em um grupo (com defaults "none"). */
export function getAcessos(atribuicoes: AtribuicaoV2[], membroId: string, grupoId: string): Record<string, FeatureAccess> {
    const a = atribuicoes.find((x) => x.membroId === membroId && x.grupoId === grupoId);
    return { ...acessoVazio(), ...(a?.acessos ?? {}) };
}

/** Atualiza o acesso de uma feature para (membro, grupo). */
export function setAcesso(membroId: string, grupoId: string, featureId: string, patch: Partial<FeatureAccess>) {
    const idx = _atribuicoes.findIndex((a) => a.membroId === membroId && a.grupoId === grupoId);
    const base = idx >= 0 ? _atribuicoes[idx].acessos : acessoVazio();
    const next = normalizarAcesso(featureId, base[featureId] ?? { nivel: "none" }, patch);
    const acessos = { ...base, [featureId]: next };
    if (idx >= 0) _atribuicoes = _atribuicoes.map((a, i) => (i === idx ? { ...a, acessos } : a));
    else _atribuicoes = [..._atribuicoes, { membroId, grupoId, acessos }];
    notify();
}

/* ------------------------------------------------------------------ */
/*  Agregação: acesso efetivo (união entre grupos do membro)           */
/* ------------------------------------------------------------------ */

const ordem: Record<Nivel, number> = { none: 0, read: 1, write: 2 };

/** Combina dois acessos de uma feature pegando o mais permissivo. */
function combinar(a: FeatureAccess, b: FeatureAccess): FeatureAccess {
    const maior = ordem[b.nivel] > ordem[a.nivel] ? b : a;
    const r: FeatureAccess = { ...maior };
    // Escopo: "todos" vence "proprio".
    if (a.escopo || b.escopo) r.escopo = a.escopo === "todos" || b.escopo === "todos" ? "todos" : "proprio";
    // Emissão: "total" vence "mediante aprovação".
    if (a.emissao || b.emissao) r.emissao = a.emissao === "total" || b.emissao === "total" ? "total" : "aprovacao";
    // Relatórios: união.
    if (a.relatorios || b.relatorios) r.relatorios = [...new Set([...(a.relatorios ?? []), ...(b.relatorios ?? [])])];
    return r;
}

/** Acesso efetivo de um membro (união dos grupos em que participa). */
export function acessoEfetivo(grupos: GrupoV2[], atribuicoes: AtribuicaoV2[], membroId: string): Record<string, FeatureAccess> {
    const gruposDoMembro = grupos.filter((g) => g.membroIds.includes(membroId));
    const efetivo = acessoVazio();
    for (const g of gruposDoMembro) {
        const ac = getAcessos(atribuicoes, membroId, g.id);
        for (const f of FEATURES_V2) efetivo[f.id] = combinar(efetivo[f.id], ac[f.id]);
    }
    return efetivo;
}

/* ------------------------------------------------------------------ */
/*  Resumo implícito (cargo derivado do ACL, em linguagem natural)     */
/* ------------------------------------------------------------------ */

export interface ResumoChip {
    featureId: string;
    texto: string;
    nivel: Exclude<Nivel, "none">;
}

/** Chips por feature descrevendo o que o acesso concede (ignora "none"). */
export function resumoChips(acessos: Record<string, FeatureAccess>): ResumoChip[] {
    const chips: ResumoChip[] = [];
    for (const f of FEATURES_V2) {
        const ac = acessos[f.id];
        if (!ac || ac.nivel === "none") continue;
        let texto = `${f.nome}: ${f.labels[ac.nivel]}`;
        if (f.temEscopo && ac.nivel === "read") texto += ac.escopo === "todos" ? " (de todos os usuários)" : " (do próprio usuário)";
        if (f.temEmissao && ac.nivel === "write") texto += ac.emissao === "aprovacao" ? " (mediante aprovação)" : " (total)";
        if (f.temRelatorios) {
            const n = ac.relatorios?.length ?? 0;
            texto += n === TODOS_RELATORIOS.length ? " · todos" : ` · ${n} ${n === 1 ? "relatório" : "relatórios"}`;
        }
        chips.push({ featureId: f.id, texto, nivel: ac.nivel });
    }
    return chips;
}

/** Escopo do grupo em texto curto. */
export function escopoLabel(grupo: GrupoV2): string {
    if (grupo.escopo === "todos") return "Todos os eventos";
    const n = grupo.escopo.length;
    return `${n} ${n === 1 ? "evento" : "eventos"}`;
}
