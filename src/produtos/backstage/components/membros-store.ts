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
    /** Ações concedidas no formato "recurso:acao" (catálogo real). */
    acoes?: string[];
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
    {
        // O cadastro de comissários saiu da organização em 12/11/2026: o grupo de Equipe e Comissários com o
        // canal Comissário é o comissário, e as pessoas dele recebem este cargo (ECO-24).
        id: "comissario",
        nome: "Comissário",
        descricao: "Aplicado às pessoas dos grupos com o canal Comissário, em Equipe e Comissários. Vendem pelo link e pelo cupom do grupo e acompanham as vendas no Freepass; o resto vem do grupo.",
        porFeature: true,
    },
];

export function cargoById(id: string) {
    return CARGOS.find((c) => c.id === id) ?? _cargosCustom.find((c) => c.id === id);
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

/**
 * Grupos de exemplo com quem opera no evento (bilheteria, promoters, camarote). São os grupos que a
 * Equipe de operação oferece como origem de operadores (EO3-09): um cadastro só de Membros.
 */
const GRUPOS_DE_EXEMPLO: Array<{ id: string; nome: string; emails: string[] }> = [
    { id: "m-bilheteria", nome: "Equipe de bilheteria", emails: ["ana.lima@casamarceneiro.com.br", "bruno.costa@casamarceneiro.com.br", "carla.mendes@casamarceneiro.com.br", "diego.rocha@casamarceneiro.com.br", "elisa.prado@casamarceneiro.com.br", "felipe.nunes@casamarceneiro.com.br"] },
    { id: "m-promoters", nome: "Promoters", emails: ["gabi.promo@gmail.com", "henrique.eventos@gmail.com", "isa.noite@gmail.com", "joao.vip@gmail.com", "karen.lista@gmail.com", "leo.festas@gmail.com", "marina.rp@gmail.com", "nando.promo@gmail.com"] },
    { id: "m-camarote", nome: "Atendimento Camarote", emails: ["otavio.reis@casamarceneiro.com.br", "paula.santos@casamarceneiro.com.br", "rafael.dias@casamarceneiro.com.br", "sofia.alves@casamarceneiro.com.br"] },
    { id: "m-producao", nome: "Produção", emails: ["tiago.moura@producao.com.br", "ursula.melo@producao.com.br", "vitor.lopes@producao.com.br", "wanda.ribeiro@producao.com.br", "yuri.campos@producao.com.br"] },
    { id: "m-pdv", nome: "PDV Portaria", emails: ["adriana.pdv@casamarceneiro.com.br", "beto.pdv@casamarceneiro.com.br", "cris.pdv@casamarceneiro.com.br", "davi.pdv@casamarceneiro.com.br", "edu.pdv@casamarceneiro.com.br", "fabi.pdv@casamarceneiro.com.br", "gui.pdv@casamarceneiro.com.br"] },
    { id: "m-hostess", nome: "Hostess", emails: ["helena.host@gmail.com", "iara.host@gmail.com", "julia.host@gmail.com"] },
    { id: "m-bar", nome: "Bar Central", emails: ["kleber.bar@casamarceneiro.com.br", "luana.bar@casamarceneiro.com.br", "mateus.bar@casamarceneiro.com.br", "nina.bar@casamarceneiro.com.br", "orlando.bar@casamarceneiro.com.br"] },
    { id: "m-seguranca", nome: "Segurança", emails: ["pedro.seg@seguranca.com.br", "quiteria.seg@seguranca.com.br", "renan.seg@seguranca.com.br", "silvia.seg@seguranca.com.br", "tadeu.seg@seguranca.com.br", "valeria.seg@seguranca.com.br", "wesley.seg@seguranca.com.br", "xavier.seg@seguranca.com.br", "yara.seg@seguranca.com.br"] },
    { id: "m-credenciamento", nome: "Credenciamento", emails: ["amanda.cred@producao.com.br", "breno.cred@producao.com.br", "caio.cred@producao.com.br", "daniela.cred@producao.com.br"] },
    { id: "m-influenciadores", nome: "Influenciadores", emails: ["bia.vibes@gmail.com", "duda.roles@gmail.com", "enzo.night@gmail.com", "fefe.agenda@gmail.com", "gui.festeiro@gmail.com", "lari.eventos@gmail.com"] },
    { id: "m-imprensa", nome: "Imprensa", emails: ["carlos.jornal@redacao.com.br", "denise.revista@redacao.com.br", "erick.portal@redacao.com.br"] },
    { id: "m-patrocinadores", nome: "Patrocinadores", emails: ["fabio.marca@parceiros.com.br", "gisele.marca@parceiros.com.br", "heitor.marca@parceiros.com.br", "ingrid.marca@parceiros.com.br", "jonas.marca@parceiros.com.br", "kelly.marca@parceiros.com.br", "lucas.marca@parceiros.com.br"] },
    { id: "m-artistas", nome: "Artistas e banda", emails: ["mano.vocal@producao.com.br", "nara.guitarra@producao.com.br", "otto.bateria@producao.com.br", "priscila.baixo@producao.com.br"] },
    { id: "m-backstage", nome: "Backstage", emails: ["rodrigo.palco@producao.com.br", "samara.palco@producao.com.br", "tulio.palco@producao.com.br", "vanessa.palco@producao.com.br", "william.palco@producao.com.br", "zeca.palco@producao.com.br"] },
    { id: "m-vip", nome: "Lista VIP", emails: ["alice.vip@gmail.com", "bernardo.vip@gmail.com", "cecilia.vip@gmail.com", "davi.vip@gmail.com", "eloisa.vip@gmail.com", "fabricio.vip@gmail.com", "giovana.vip@gmail.com", "hugo.vip@gmail.com", "isis.vip@gmail.com", "joaquim.vip@gmail.com"] },
    { id: "m-staff-extra", nome: "Staff extra", emails: ["kaio.staff@gmail.com", "lia.staff@gmail.com"] }
];

const membroId = (email: string) => `m-${email.replace(/[^a-z0-9]/gi, "-")}`;

let _membros: Membro[] = [
    { id: "m-admin", email: "admin@ingresse.com", cargoIds: ["administrador"], grupoIds: [], eventosCount: EVENTOS.length },
    ...[...new Set(GRUPOS_DE_EXEMPLO.flatMap((g) => g.emails))].map((email) => ({
        id: membroId(email),
        email,
        cargoIds: ["visualizador"],
        grupoIds: GRUPOS_DE_EXEMPLO.filter((g) => g.emails.includes(email)).map((g) => g.id),
        eventosCount: EVENTOS.length,
    })),
];

let _grupos: Grupo[] = [
    { id: "g-todos", nome: "Todos os eventos", eventoIds: EVENTOS.map((e) => e.id), membroIds: [], sistema: true },
    ...GRUPOS_DE_EXEMPLO.map((g) => ({ id: g.id, nome: g.nome, eventoIds: EVENTOS.map((e) => e.id), membroIds: g.emails.map(membroId) })),
];

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const subscribe = (fn: () => void) => {
    listeners.add(fn);
    return () => {
        listeners.delete(fn);
    };
};

/** Para leitores fora do React (espelhos): assinar e ler grupos e membros como estão agora. */
export const assinarMembros = subscribe;
export const lerMembros = () => ({ membros: _membros, grupos: _grupos });

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
/** Atualiza cargos/grupos de um membro e reflete a troca de grupos nos próprios grupos. */
export function editarMembro(id: string, patch: Pick<Membro, "cargoIds" | "grupoIds">) {
    _membros = _membros.map((m) => (m.id === id ? { ...m, ...patch } : m));
    _grupos = _grupos.map((g) => {
        const tem = g.membroIds.includes(id);
        const deveTer = patch.grupoIds.includes(g.id);
        if (tem === deveTer) return g;
        return { ...g, membroIds: deveTer ? [...g.membroIds, id] : g.membroIds.filter((mid) => mid !== id) };
    });
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

/* ---- cargos customizados (criados pela organização) ---- */
let _cargosCustom: Cargo[] = [];
// Snapshot estável: useSyncExternalStore exige a mesma referência entre leituras.
let _cargosSnap: Cargo[] = [...CARGOS];
const atualizarCargos = () => {
    _cargosSnap = [...CARGOS, ..._cargosCustom];
    notify();
};

export function useCargos() {
    return useSyncExternalStore(subscribe, () => _cargosSnap);
}

/** Cargos padrão do sistema não podem ser editados nem excluídos. */
export const isCargoSistema = (id: string) => CARGOS.some((c) => c.id === id);

export function addCargo(c: Cargo) {
    _cargosCustom = [..._cargosCustom, c];
    atualizarCargos();
}

export function updateCargo(id: string, patch: Partial<Cargo>) {
    _cargosCustom = _cargosCustom.map((c) => (c.id === id ? { ...c, ...patch } : c));
    atualizarCargos();
}

export function removeCargo(id: string) {
    _cargosCustom = _cargosCustom.filter((c) => c.id !== id);
    _membros = _membros.map((m) => ({ ...m, cargoIds: m.cargoIds.filter((cid) => cid !== id) }));
    atualizarCargos();
}
