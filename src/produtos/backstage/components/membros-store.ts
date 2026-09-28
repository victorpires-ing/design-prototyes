import { useSyncExternalStore } from "react";

/* ------------------------------------------------------------------ */
/*  Store compartilhado de Membros / Grupos / Cargos (nível org).      */
/*  Consumido pela área de Membros e pela gestão de Cortesias.         */
/*  Via sancionada de compartilhamento entre projetos: components/.    */
/* ------------------------------------------------------------------ */

export type PermissionLevel = "none" | "viewer" | "editor" | "admin";

export interface FeaturePermission {
    featureId: string;
    nome: string;
    level: PermissionLevel;
    /** Subitems com permissões granulares (ex: tipos de relatórios). */
    subitens?: { id: string; nome: string; level: PermissionLevel }[];
}

export interface Cargo {
    id: string;
    nome: string;
    descricao: string;
    /** Permissões granulares por funcionalidade. */
    permissions?: FeaturePermission[];
    /** Cargo sem permissão explícita — configurado por feature (ex: Cortesias). */
    porFeature?: boolean;
}

export interface EventoRef {
    id: string;
    nome: string;
}

export interface Grupo {
    id: string;
    nome: string;
    eventoIds: string[];
    membroIds: string[];
    /** Grupo padrão do sistema — não pode ser excluído. */
    sistema?: boolean;
}

export interface Membro {
    id: string;
    email: string;
    cargoIds: string[];
    grupoIds: string[];
    /** Nº de eventos com acesso (mock). */
    eventosCount: number;
}

/* ---- Cargos (entidades fixas) ---- */
export const CARGOS: Cargo[] = [
    { id: "administrador", nome: "Administrador", descricao: "Acesso total a membros, eventos, financeiro, relatórios e configurações da organização." },
    { id: "editor", nome: "Editor de eventos", descricao: "Pode criar e editar eventos e todo o seu conteúdo — ingressos, combos, produtos, cupons, passkeys e etiquetas — e visualizar relatórios." },
    { id: "financeiro", nome: "Financeiro", descricao: "Pode visualizar eventos, relatórios e saldos, e solicitar repasses." },
    { id: "financeiro-padrao", nome: "Financeiro (conta padrão)", descricao: "Pode visualizar eventos, relatórios e saldos, e solicitar repasses apenas para a conta padrão." },
    { id: "marketing", nome: "Marketing", descricao: "Pode gerenciar cupons, passkeys e etiquetas, e visualizar eventos e relatórios." },
    { id: "visualizador", nome: "Visualizador", descricao: "Pode visualizar eventos e seus detalhes, como ingressos, combos e cupons." },
    {
        id: "parceiro",
        nome: "Parceiro",
        descricao: "Não possui nenhuma permissão explícita. As permissões específicas (ex.: limites e itens de cortesias) devem ser configuradas por feature.",
        porFeature: true,
    },
];

export function cargoById(id: string) {
    return CARGOS.find((c) => c.id === id);
}

/* ---- Eventos (para os selects) ---- */
export const EVENTOS: EventoRef[] = [
    { id: "e-botafogo", nome: "Botafogo x Chapecoense - Copa do Brasil" },
    { id: "e-coquetel", nome: "Coquetel de Rebranding" },
    { id: "e-nutris", nome: "ENCONTRO NUTRIS DA CASA" },
    { id: "e-operacoes", nome: "Evento TESTE (Operações Entretenimento)" },
    { id: "e-teste", nome: "Teste" },
    { id: "e-samba", nome: "Samba Independente" },
];

export function eventoById(id: string) {
    return EVENTOS.find((e) => e.id === id);
}

/* ---- Funcionalidades do sistema (para construtor de cargos) ---- */
export const FEATURES: { id: string; nome: string; subitens: { id: string; nome: string }[] }[] = [
    {
        id: "eventos",
        nome: "Eventos",
        subitens: [
            { id: "info-evento", nome: "Informações do evento" },
            { id: "gestao-cotas", nome: "Gerenciamento de cotas (cortesia, bilheteria e PDV)" },
            { id: "itens", nome: "Itens" },
            { id: "ingressos", nome: "Ingressos" },
            { id: "combos", nome: "Combos" },
            { id: "produtos", nome: "Produtos" },
            { id: "abertura-vendas", nome: "Abertura de vendas" },
            { id: "estrategia-vendas", nome: "Estratégia de vendas" },
            { id: "lotes-sincronizados", nome: "Lotes sincronizados" },
            { id: "compras-grupo", nome: "Compras em grupo" },
            { id: "cortesias", nome: "Cortesias" },
            { id: "emissao-cortesias", nome: "Emissão de cortesias" },
            { id: "relatorios", nome: "Relatórios" },
            { id: "vendas", nome: "Vendas" },
            { id: "transacoes", nome: "Transações" },
            { id: "acesso", nome: "Acesso" },
            { id: "bordero", nome: "Borderô" },
            { id: "transferencias", nome: "Transferências" },
            { id: "questionarios", nome: "Questionários" },
            { id: "marketing", nome: "Marketing" },
            { id: "passkey", nome: "Passkey" },
            { id: "cupom-desconto", nome: "Cupom de desconto" },
            { id: "etiquetas", nome: "Etiquetas" },
            { id: "pixel-rastreamento", nome: "Pixel de rastreamento" },
            { id: "coleta-dados", nome: "Coleta de dados" },
            { id: "perguntas-ingresso", nome: "Perguntas por ingresso" },
        ],
    },
    {
        id: "financeiro",
        nome: "Financeiro",
        subitens: [
            { id: "saldos", nome: "Saldos" },
            { id: "repasses", nome: "Repasses" },
            { id: "operacoes", nome: "Operações" },
        ],
    },
    {
        id: "membros",
        nome: "Membros",
        subitens: [
            { id: "listar-membros", nome: "Listar membros" },
            { id: "criar-membros", nome: "Criar membros" },
            { id: "gerenciar-permissoes", nome: "Gerenciar permissões" },
        ],
    },
    {
        id: "relatorios-geral",
        nome: "Relatórios",
        subitens: [
            { id: "vendas-geral", nome: "Vendas" },
            { id: "financeiro-geral", nome: "Financeiro" },
            { id: "audience", nome: "Audience" },
        ],
    },
];

/* ------------------------------------------------------------------ */
/*  Store reativo                                                      */
/* ------------------------------------------------------------------ */

let _membros: Membro[] = [
    { id: "m-admin", email: "admin@ingresse.com", cargoIds: ["administrador"], grupoIds: [], eventosCount: EVENTOS.length },
];

let _grupos: Grupo[] = [
    { id: "g-todos", nome: "Todos os eventos", eventoIds: EVENTOS.map((e) => e.id), membroIds: [], sistema: true },
];

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const subscribe = (fn: () => void) => {
    listeners.add(fn);
    return () => {
        listeners.delete(fn);
    };
};

/* ---- membros ---- */
const membrosSnap = () => _membros;
export function useMembros() {
    return useSyncExternalStore(subscribe, membrosSnap);
}
export function getMembro(id: string) {
    return _membros.find((m) => m.id === id);
}
export function addMembro(m: Membro) {
    _membros = [m, ..._membros];
    _sincronizarGrupos(m);
    notify();
}
export function updateMembro(id: string, patch: Partial<Membro>) {
    _membros = _membros.map((m) => (m.id === id ? { ...m, ...patch } : m));
    notify();
}
export function removeMembros(ids: Set<string>) {
    _membros = _membros.filter((m) => !ids.has(m.id));
    // remove referências nos grupos
    _grupos = _grupos.map((g) => ({ ...g, membroIds: g.membroIds.filter((mid) => !ids.has(mid)) }));
    notify();
}

/* ---- grupos ---- */
const gruposSnap = () => _grupos;
export function useGrupos() {
    return useSyncExternalStore(subscribe, gruposSnap);
}
export function getGrupo(id: string) {
    return _grupos.find((g) => g.id === id);
}
export function addGrupo(g: Grupo) {
    _grupos = [g, ..._grupos];
    // reflete o vínculo nos membros
    _membros = _membros.map((m) => (g.membroIds.includes(m.id) ? { ...m, grupoIds: [...new Set([...m.grupoIds, g.id])] } : m));
    notify();
}
export function updateGrupo(id: string, patch: Partial<Grupo>) {
    _grupos = _grupos.map((g) => (g.id === id ? { ...g, ...patch } : g));
    notify();
}
export function removeGrupos(ids: Set<string>) {
    _grupos = _grupos.filter((g) => !ids.has(g.id));
    // remove referências nos membros
    _membros = _membros.map((m) => ({ ...m, grupoIds: m.grupoIds.filter((gid) => !ids.has(gid)) }));
    notify();
}

/** Sincroniza os grupos de um membro recém-criado (adiciona o id do membro aos grupos). */
function _sincronizarGrupos(m: Membro) {
    _grupos = _grupos.map((g) => (m.grupoIds.includes(g.id) ? { ...g, membroIds: [...new Set([...g.membroIds, m.id])] } : g));
}

/* ---- cargos customizados (por-criar) ---- */
let _cargosCustom: Cargo[] = [];

export function useCargos() {
    // Por enquanto, apenas retorna CARGOS combinado com customizados
    // TODO: implementar com useSyncExternalStore quando resolver o infinite loop
    return [...CARGOS, ..._cargosCustom];
}

export function addCargo(c: Cargo) {
    _cargosCustom = [c, ..._cargosCustom];
}

export function updateCargo(id: string, patch: Partial<Cargo>) {
    const idx = _cargosCustom.findIndex((c) => c.id === id);
    if (idx !== -1) {
        _cargosCustom = [
            ..._cargosCustom.slice(0, idx),
            { ..._cargosCustom[idx], ...patch },
            ..._cargosCustom.slice(idx + 1),
        ];
    }
}

export function removeCargo(id: string) {
    _cargosCustom = _cargosCustom.filter((c) => c.id !== id);
}
