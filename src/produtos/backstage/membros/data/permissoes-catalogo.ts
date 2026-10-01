export type AcaoBase = "view" | "edit" | "create" | "delete";

export const ACOES_BASE: { id: AcaoBase; nome: string }[] = [
    { id: "view", nome: "Visualizar" },
    { id: "edit", nome: "Editar" },
    { id: "create", nome: "Criar" },
    { id: "delete", nome: "Excluir" },
];

export interface RecursoPermissao {
    id: string;
    nome: string;
    base: AcaoBase[];
    /** Sub-item exibido recuado abaixo do recurso pai. */
    nivel?: 1;
}

export interface SecaoPermissao {
    id: string;
    nome: string;
    recursos: RecursoPermissao[];
}

const CRUD: AcaoBase[] = ["view", "edit", "create", "delete"];

// Ações específicas da API viram linhas próprias mapeadas para uma coluna:
// mudanças de estado → Editar; importar/emitir → Criar; exportar → Visualizar.
const sub = (id: string, nome: string, acao: AcaoBase): RecursoPermissao => ({ id, nome, base: [acao], nivel: 1 });

export const CATALOGO_PERMISSOES: SecaoPermissao[] = [
    {
        id: "organizacao",
        nome: "Organização",
        recursos: [
            { id: "members", nome: "Membros da organização", base: CRUD },
            { id: "products", nome: "Catálogo de produtos", base: CRUD },
            { id: "segments", nome: "Segmentos de público", base: CRUD },
            { id: "settings", nome: "Ajustes da organização", base: ["view", "edit"] },
            { id: "settings.facial", nome: "Provedores de reconhecimento facial", base: ["view"], nivel: 1 },
            { id: "settings.terms", nome: "Termos de uso da organização", base: ["view", "create"], nivel: 1 },
            sub("settings.terms:activate", "Ativar termos de uso", "edit"),
            sub("settings.terms:deactivate", "Desativar termos de uso", "edit"),
            { id: "settings.default_terms", nome: "Definir termo de uso padrão", base: ["edit"], nivel: 1 },
        ],
    },
    {
        id: "eventos",
        nome: "Eventos",
        recursos: [
            { id: "events", nome: "Eventos", base: CRUD },
            sub("events:publish", "Publicar eventos", "edit"),
            { id: "events.dates", nome: "Datas do evento", base: CRUD, nivel: 1 },
            { id: "events.sales_openings", nome: "Aberturas de venda do evento", base: CRUD, nivel: 1 },
            sub("events.sales_status:suspend", "Suspender e retomar as vendas do evento", "edit"),
            { id: "events.settings", nome: "Ajustes do evento", base: ["view", "edit"], nivel: 1 },
            { id: "events.terms", nome: "Termos de uso do evento", base: ["view"], nivel: 1 },
            sub("events.terms:associate", "Associar termos de uso ao evento", "edit"),
            { id: "tickets", nome: "Ingressos e lotes", base: CRUD },
            sub("tickets:activate", "Ativar ingressos", "edit"),
            sub("tickets:deactivate", "Desativar ingressos", "edit"),
            sub("tickets:reorder", "Reordenar ingressos", "edit"),
            { id: "tickets.groups", nome: "Grupos de ingressos", base: CRUD, nivel: 1 },
            sub("tickets.groups:reorder", "Reordenar grupos de ingressos", "edit"),
            { id: "tickets.combos", nome: "Lotes de combos", base: CRUD, nivel: 1 },
            sub("tickets.combos:activate", "Ativar lotes de combos", "edit"),
            sub("tickets.combos:deactivate", "Desativar lotes de combos", "edit"),
            { id: "tickets.sync_groups", nome: "Grupos de lotes sincronizados", base: CRUD, nivel: 1 },
            sub("tickets.item_batches:advance", "Avançar lotes de itens", "edit"),
            { id: "combos", nome: "Combos do evento", base: CRUD },
            { id: "event_products", nome: "Produtos do evento", base: ["view", "edit"] },
            sub("event_products:associate", "Associar produtos ao evento", "edit"),
            sub("event_products:disassociate", "Desassociar produtos do evento", "edit"),
            { id: "coupons", nome: "Cupons de desconto", base: CRUD },
            sub("coupons:activate", "Ativar cupons", "edit"),
            sub("coupons:deactivate", "Desativar cupons", "edit"),
            sub("coupons:associate", "Associar cupons a ingressos ou produtos", "edit"),
            sub("coupons:disassociate", "Desassociar cupons de ingressos ou produtos", "edit"),
            { id: "freepasses", nome: "Cortesias do evento", base: ["view", "edit"] },
            sub("freepasses:issue", "Emitir cortesias", "create"),
            sub("freepasses:cancel", "Cancelar cortesias", "edit"),
            sub("freepasses:resend", "Reenviar cortesias", "edit"),
            { id: "quota_groups", nome: "Grupos de cota do evento", base: ["view", "edit", "create"] },
            sub("quota_groups:activate", "Ativar grupos de cota", "edit"),
            { id: "quota_groups.issues", nome: "Histórico de emissões do grupo de cota", base: ["view"], nivel: 1 },
            { id: "quota_groups.issuers", nome: "Emissores do grupo de cota", base: ["edit"], nivel: 1 },
            sub("quota_groups.issuers:activate", "Ativar emissores", "edit"),
            sub("quota_groups.issuers:validate", "Validar emissores", "edit"),
            { id: "group_registrations", nome: "Inscrições em grupo do evento", base: ["view", "edit"] },
            { id: "group_registrations.authorizations", nome: "Autorizações de inscrição em grupo", base: ["view", "edit"], nivel: 1 },
            sub("group_registrations.authorizations:cancel", "Cancelar autorizações de inscrição em grupo", "edit"),
            { id: "group_registrations.requests", nome: "Solicitações de inscrição em grupo", base: ["view"], nivel: 1 },
            sub("group_registrations.requests:approve", "Aprovar ou recusar solicitações de inscrição em grupo", "edit"),
            { id: "labels", nome: "Etiquetas personalizadas", base: CRUD },
            sub("labels:associate", "Associar etiquetas a ingressos ou produtos", "edit"),
            sub("labels:disassociate", "Desassociar etiquetas de ingressos ou produtos", "edit"),
            { id: "passkeys", nome: "Passkeys (códigos de acesso)", base: CRUD },
            sub("passkeys:deactivate", "Desativar passkeys", "edit"),
            sub("passkeys:export", "Exportar passkeys", "view"),
            { id: "questions", nome: "Perguntas ao comprador", base: CRUD },
            sub("questions:activate", "Ativar perguntas", "edit"),
            sub("questions:reorder", "Reordenar perguntas", "edit"),
            { id: "reports", nome: "Relatórios do evento", base: ["view"] },
            { id: "reports.sales", nome: "Relatório de vendas", base: ["view"], nivel: 1 },
            { id: "reports.finance", nome: "Relatório financeiro", base: ["view"], nivel: 1 },
            { id: "reports.audience", nome: "Relatório de público", base: ["view"], nivel: 1 },
            sub("reports:export", "Exportar relatórios do evento", "view"),
        ],
    },
    {
        id: "financeiro",
        nome: "Financeiro",
        recursos: [
            { id: "finance.balances", nome: "Saldo financeiro dos eventos", base: ["view"] },
            { id: "finance.transfer", nome: "Repasses para qualquer conta", base: CRUD },
            { id: "finance.transfer_default_account", nome: "Repasses só para a conta padrão", base: CRUD },
        ],
    },
    {
        id: "operacao",
        nome: "Operação",
        recursos: [{ id: "operators", nome: "Operadores da organização", base: CRUD }],
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
            .map((acao) => ({
                pai: chavePermissao(r.id, acao),
                filhos: filhos.filter((f) => f.base.includes(acao)).map((f) => chavePermissao(f.id, acao)),
            }))
            .filter((g) => g.filhos.length > 0);
    }),
);

export const chavesDoRecurso =(r: RecursoPermissao) => r.base.map((a) => chavePermissao(r.id, a));
