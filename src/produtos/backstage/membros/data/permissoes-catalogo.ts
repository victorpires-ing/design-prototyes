export type AcaoBase = "view" | "edit" | "create" | "delete" | "request" | "cancel" | "export" | "emit";

export const NOME_ACAO: Record<AcaoBase, string> = {
    view: "Visualizar",
    edit: "Editar",
    create: "Criar",
    delete: "Excluir",
    request: "Solicitar",
    cancel: "Cancelar",
    export: "Exportar",
    emit: "Emitir",
};

/** Colunas padrão das tabelas, na ordem. Uma seção pode trocar alguma pelo verbo do próprio domínio. */
export const ACOES_BASE: { id: AcaoBase; nome: string }[] = (["view", "edit", "create", "delete"] as const).map((id) => ({ id, nome: NOME_ACAO[id] }));

export interface RecursoPermissao {
    id: string;
    nome: string;
    base: AcaoBase[];
    /** Linha de ação: id do recurso a que pertence, cujo Visualizar ela exige. */
    dono?: string;
    /** Exibida recuada abaixo do recurso dono, que agrega as marcações dela. */
    nivel?: 1;
}

export interface SecaoPermissao {
    id: string;
    nome: string;
    /** Uma frase sob o título dizendo o que a seção controla. */
    descricao?: string;
    /** Colunas da tabela na ordem (mesmo número de trilhas do padrão); omitido usa ACOES_BASE. */
    colunas?: AcaoBase[];
    recursos: RecursoPermissao[];
}

export const acoesDaSecao = (secao: SecaoPermissao) => (secao.colunas ? secao.colunas.map((id) => ({ id, nome: NOME_ACAO[id] })) : ACOES_BASE);

const CRUD: AcaoBase[] = ["view", "edit", "create", "delete"];

// Linha de recurso: substantivo no plural; o verbo vem da coluna. Mudanças de baixo impacto
// (reordenar, desativar chave de acesso, vincular termos) ficam no Editar do próprio item.
// Linha de ação: só quando o efeito é maior que o da coluna (abre ou fecha venda, vira lote,
// exporta dados, movimenta dinheiro) e sempre começa pelo verbo real.
// Recurso com uma linha de ação só: ela fica direta, logo abaixo (`acao`). Com duas ou mais,
// elas formam um grupo recuado sob o recurso (`sub`).
const acao = (dono: string, verbo: string, nome: string, base: AcaoBase): RecursoPermissao => ({ id: `${dono}:${verbo}`, nome, base: [base], dono });
const sub = (dono: string, verbo: string, nome: string, base: AcaoBase): RecursoPermissao => ({ ...acao(dono, verbo, nome, base), nivel: 1 });

/** Todas as permissões de produção (lista de 06/10/2026), com as fusões já aprovadas. */
export const CATALOGO_PERMISSOES: SecaoPermissao[] = [
    {
        id: "organizacao",
        nome: "Organização",
        descricao: "Membros, produtos da organização, segmentos de público, ajustes e termos de uso.",
        recursos: [
            { id: "org.members", nome: "Membros", base: CRUD },
            { id: "org.products", nome: "Produtos da organização", base: CRUD },
            { id: "org.segments", nome: "Segmentos de público", base: CRUD },
            { id: "org.segments.members", nome: "Membros dos segmentos", base: ["view", "create", "delete"] },
            acao("org.segments.members", "import", "Importar membros para os segmentos", "create"),
            { id: "org.settings", nome: "Ajustes da organização", base: ["view", "edit"] },
            { id: "org.settings.face_providers", nome: "Provedores de reconhecimento facial", base: ["view"] },
            { id: "org.terms", nome: "Termos de uso da organização", base: ["view", "create"] },
            sub("org.terms", "toggle", "Ativar e desativar termos de uso", "edit"),
            sub("org.terms", "set_default", "Definir o termo de uso padrão", "edit"),
        ],
    },
    {
        id: "evento",
        nome: "Configurações do evento",
        descricao: "Eventos e sua publicação, sessões, configurações gerais e termos de uso do evento.",
        recursos: [
            { id: "events", nome: "Eventos", base: CRUD },
            acao("events", "publish", "Publicar eventos", "edit"),
            { id: "events.dates", nome: "Sessões", base: CRUD },
            { id: "events.settings", nome: "Configurações gerais", base: ["view", "edit"] },
            { id: "events.terms", nome: "Termos de uso do evento", base: ["view", "edit"] },
        ],
    },
    {
        id: "equipe-operacao",
        nome: "Equipe de operação",
        descricao: "Operadores da organização e os grupos de cota que emitem ingressos no evento.",
        recursos: [
            { id: "operation.operators", nome: "Operadores", base: CRUD },
            { id: "events.quota_groups", nome: "Grupos de cota", base: ["view", "edit", "create"] },
            acao("events.quota_groups", "activate", "Ativar grupos de cota", "edit"),
            { id: "events.quota_groups.issuances", nome: "Emissões dos grupos de cota", base: ["view"] },
            { id: "events.quota_groups.issuers", nome: "Emissores dos grupos de cota", base: ["edit"], dono: "events.quota_groups" },
            { id: "events.quota_groups.issuers:activate", nome: "Ativar emissores", base: ["edit"], dono: "events.quota_groups", nivel: 1 },
            { id: "events.quota_groups.issuers:validate", nome: "Validar emissores", base: ["edit"], dono: "events.quota_groups", nivel: 1 },
        ],
    },
    {
        id: "itens",
        nome: "Ingressos e produtos",
        descricao: "Ingressos, lotes, combos e produtos, com as aberturas e as vendas do evento.",
        recursos: [
            { id: "tickets", nome: "Ingressos", base: CRUD },
            acao("tickets", "toggle", "Ativar e desativar ingressos", "edit"),
            { id: "tickets.groups", nome: "Grupos de ingressos", base: CRUD },
            { id: "tickets.batches", nome: "Lotes", base: CRUD },
            sub("tickets.batches", "toggle", "Ativar e desativar lotes", "edit"),
            sub("tickets.batches", "advance", "Virar lotes manualmente", "edit"),
            { id: "tickets.sync_groups", nome: "Grupos de sincronização", base: CRUD },
            { id: "events.sales_openings", nome: "Aberturas de vendas", base: CRUD },
            acao("events.sales_openings", "suspend", "Suspender vendas do evento", "edit"),
            { id: "events.sales", nome: "Vendas do evento", base: CRUD },
            { id: "combos", nome: "Combos", base: CRUD },
            { id: "tickets.combos", nome: "Lotes de combos", base: CRUD },
            acao("tickets.combos", "toggle", "Ativar e desativar lotes de combos", "edit"),
            { id: "event_products", nome: "Produtos do evento", base: ["view", "edit"] },
            acao("event_products", "link", "Vincular e desvincular produtos", "edit"),
        ],
    },
    {
        id: "emissao",
        nome: "Emissão de ingressos",
        descricao: "Cortesias e inscrições em grupo, com as autorizações e as solicitações a aprovar.",
        // Emitir e Cancelar ocupam as trilhas de Criar e Excluir.
        colunas: ["view", "edit", "emit", "cancel"],
        recursos: [
            { id: "events.courtesies", nome: "Cortesias", base: ["view", "edit", "emit", "cancel"] },
            acao("events.courtesies", "resend", "Reenviar cortesias", "emit"),
            { id: "events.group_registrations", nome: "Inscrições em grupo", base: ["view", "edit"] },
            { id: "events.group_registrations.authorizations", nome: "Autorizações de inscrição em grupo", base: ["view", "edit", "cancel"] },
            { id: "events.group_registrations.requests", nome: "Solicitações de inscrição em grupo", base: ["view"] },
            acao("events.group_registrations.requests", "approve", "Aprovar e rejeitar solicitações", "edit"),
        ],
    },
    {
        id: "relatorios",
        nome: "Relatórios",
        descricao: "Os relatórios do evento que o cargo pode abrir e exportar, como vendas e borderô.",
        // Uma linha por relatório da aba Relatórios do evento, na ordem do menu. Exportar exige Visualizar.
        colunas: ["view", "export", "create", "delete"],
        recursos: [
            { id: "reports.sales", nome: "Relatório de vendas", base: ["view", "export"] },
            { id: "reports.transactions", nome: "Relatório de transações", base: ["view", "export"] },
            { id: "reports.access", nome: "Relatório de acesso do público", base: ["view", "export"] },
            { id: "reports.bordero", nome: "Borderô", base: ["view", "export"] },
            { id: "reports.ticket_transfers", nome: "Relatório de transferências de ingressos", base: ["view", "export"] },
            { id: "reports.comparatives", nome: "Comparativo entre eventos", base: ["view", "export"] },
            { id: "reports.surveys", nome: "Respostas dos questionários", base: ["view", "export"] },
            { id: "reports.custom", nome: "Relatório personalizado com IA", base: ["view", "export"] },
        ],
    },
    {
        id: "marketing",
        nome: "Marketing",
        descricao: "Cupons de desconto, etiquetas e as chaves de acesso que liberam ingressos ocultos.",
        recursos: [
            { id: "coupons", nome: "Cupons de desconto", base: CRUD },
            sub("coupons", "toggle", "Ativar e desativar cupons", "edit"),
            sub("coupons", "link", "Vincular e desvincular cupons", "edit"),
            { id: "passkeys", nome: "Chaves de acesso", base: CRUD },
            acao("passkeys", "export", "Exportar chaves de acesso", "view"),
            { id: "labels", nome: "Etiquetas", base: CRUD },
            acao("labels", "link", "Vincular e desvincular etiquetas", "edit"),
        ],
    },
    {
        id: "coleta-dados",
        nome: "Coleta de dados",
        descricao: "As perguntas que o comprador responde na compra de cada ingresso.",
        recursos: [{ id: "events.questions", nome: "Perguntas por ingresso", base: CRUD }, acao("events.questions", "activate", "Ativar perguntas", "edit")],
    },
    {
        id: "financas",
        nome: "Finanças",
        descricao: "Saldos das vendas e repasses, para qualquer conta ou só para a conta padrão.",
        // Repasse não se edita nem se cria livremente: só se solicita e, antes de processar, se cancela.
        // Fora da matriz por decisão (nada tem edição em finanças): lançamentos de saldo e editar repasses.
        colunas: ["view", "request", "cancel", "delete"],
        recursos: [
            { id: "finance.balances", nome: "Saldos", base: ["view"] },
            { id: "finance.transfers", nome: "Repasses para qualquer conta", base: ["view", "request", "cancel"] },
            { id: "finance.transfer_default_account", nome: "Repasses para a conta padrão", base: ["view", "request", "cancel"] },
        ],
    },
];

export const chavePermissao = (recursoId: string, acaoId: string) => `${recursoId}:${acaoId}`;

/** Por coluna: a chave do recurso pai e as chaves dos seus sub-itens com a mesma ação. */
export const GRUPOS_PAI: { pai: string; filhos: string[] }[] = CATALOGO_PERMISSOES.flatMap((secao) =>
    secao.recursos.flatMap((r, i) => {
        if (r.nivel) return [];
        const filhos: RecursoPermissao[] = [];
        for (const f of secao.recursos.slice(i + 1)) {
            if (!f.nivel) break;
            filhos.push(f);
        }
        return r.base
            .map((coluna) => ({
                pai: chavePermissao(r.id, coluna),
                filhos: filhos.filter((f) => f.base.includes(coluna)).map((f) => chavePermissao(f.id, coluna)),
            }))
            .filter((g) => g.filhos.length > 0);
    }),
);

export const chavesDoRecurso = (r: RecursoPermissao) => r.base.map((a) => chavePermissao(r.id, a));

const RECURSOS = new Map(CATALOGO_PERMISSOES.flatMap((secao) => secao.recursos.map((r) => [r.id, r] as const)));

/**
 * Visualizar que cada permissão pressupõe: Editar, Criar e Excluir dependem do Visualizar da
 * própria linha; linhas de ação, do Visualizar do recurso dono.
 */
export const VISUALIZAR_EXIGIDO: Map<string, string> = new Map(
    [...RECURSOS.values()].flatMap((r) => {
        const dono = r.dono ? RECURSOS.get(r.dono) : r;
        if (!dono?.base.includes("view")) return [];
        const visualizar = chavePermissao(dono.id, "view");
        return chavesDoRecurso(r)
            .filter((k) => k !== visualizar)
            .map((k): [string, string] => [k, visualizar]);
    }),
);

/** Acrescenta o que a seleção implica: o pai com todos os sub-itens marcados e os Visualizar exigidos. */
export function completarSelecao(selecao: Set<string>): Set<string> {
    const next = new Set(selecao);
    let mudou = true;
    while (mudou) {
        mudou = false;
        for (const g of GRUPOS_PAI) {
            if (!next.has(g.pai) && g.filhos.every((k) => next.has(k))) {
                next.add(g.pai);
                mudou = true;
            }
        }
        for (const [chave, visualizar] of VISUALIZAR_EXIGIDO) {
            if (next.has(chave) && !next.has(visualizar)) {
                next.add(visualizar);
                mudou = true;
            }
        }
    }
    return next;
}

/** Tira o que ficou sem o Visualizar de que depende. */
export function semDependentesOrfaos(selecao: Set<string>): Set<string> {
    const next = new Set(selecao);
    for (const [chave, visualizar] of VISUALIZAR_EXIGIDO) {
        if (next.has(chave) && !next.has(visualizar)) next.delete(chave);
    }
    return next;
}
