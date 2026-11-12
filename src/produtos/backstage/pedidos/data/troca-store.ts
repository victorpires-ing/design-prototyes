import { useState, useSyncExternalStore } from "react";

/**
 * Pedidos com troca de inscrição (épico TS-1812).
 *
 * Dados fictícios e regras de negócio da spec (Confluence 575995905). O estado fica em
 * `localStorage` para que o fluxo completo (trocar → link → pagar → concluir, expirar,
 * cancelar, refazer) possa ser testado sem backend.
 */

/* ------------------------------------------------------------------ */
/*  Constantes da regra                                                */
/* ------------------------------------------------------------------ */

/** Taxa de serviço sobre o valor da inscrição. */
export const TAXA = 0.1;
/** Taxa de troca: R$ 15 do produtor e R$ 5 da Ingresse. */
export const TAXA_TROCA = { total: 20, produtor: 15, ingresse: 5 };
/** Sessão de pagamento: a vaga fica reservada por 15 minutos depois que o link é aberto. */
export const SESSAO_MIN = 15;
/** Validade do link, limitada à última sessão do evento. */
export const LINK_H = 24;

export const EVENTO = {
    id: "8c1f2a90-77de-4b1e-9a10-3f6c2d1e5b7a",
    nome: "Corrida Rio das Pedras 2027",
    org: "Pedras Eventos Esportivos",
    local: "Parque das Pedras, Curitiba, PR",
    ultima: new Date(2027, 2, 14, 6, 0).getTime(),
};

export type PerfilId = "admin-ingresse" | "atendimento" | "admin-org" | "financeiro";
export const PERFIS: Record<PerfilId, { nome: string; global: boolean; pode: boolean; repro: boolean; config: boolean }> = {
    "admin-ingresse": { nome: "Admin Ingresse", global: true, pode: true, repro: true, config: true },
    atendimento: { nome: "Atendimento", global: true, pode: true, repro: false, config: false },
    "admin-org": { nome: "Admin da organização", global: false, pode: true, repro: false, config: true },
    financeiro: { nome: "Financeiro", global: false, pode: false, repro: false, config: false },
};

export type PedidoStatus = "pago" | "pendente" | "processando" | "abandonado" | "recusado" | "reembolsado" | "cancelado";
export const STATUS_PEDIDO: Record<PedidoStatus, { label: string; color: "success" | "warning" | "gray" | "error" }> = {
    pago: { label: "Pago", color: "success" },
    pendente: { label: "Aguardando pagamento", color: "warning" },
    processando: { label: "Processando", color: "warning" },
    abandonado: { label: "Carrinho abandonado", color: "gray" },
    recusado: { label: "Recusado", color: "error" },
    reembolsado: { label: "Reembolsado", color: "gray" },
    cancelado: { label: "Cancelado", color: "error" },
};
export const MSG_STATUS: Partial<Record<PedidoStatus, [string, string]>> = {
    pendente: ["Aguardando pagamento", "Este pedido só pode ser alterado após o pagamento."],
    processando: ["Pagamento em processamento", "Este pedido só pode ser alterado depois que o pagamento for confirmado."],
    abandonado: ["Carrinho abandonado", "A compra não foi concluída. Não há itens para alterar."],
    recusado: ["Pagamento recusado", "Este pedido não foi pago e não pode ser alterado."],
    reembolsado: ["Pedido reembolsado", "Este pedido não pode mais ser editado."],
    cancelado: ["Pedido cancelado", "Este pedido não pode mais ser editado."],
};

export interface Pergunta {
    label: string;
    tipo: "select" | "text";
    req: boolean;
    estoque?: boolean;
    opcoes?: string[];
    ph?: string;
}
export const PERG: Record<string, Pergunta> = {
    camiseta: { label: "Tamanho da camiseta", tipo: "select", req: true, estoque: true, opcoes: ["P", "M", "G", "GG"] },
    contatoNome: { label: "Nome do contato de emergência", tipo: "text", req: true, ph: "Nome e sobrenome" },
    emergencia: { label: "Telefone do contato de emergência", tipo: "text", req: true, ph: "(00) 00000-0000" },
    categoria: { label: "Categoria", tipo: "select", req: true, opcoes: ["Feminino", "Masculino"] },
    cidade: { label: "Cidade e UF", tipo: "text", req: true, ph: "Ex.: Curitiba, PR" },
    saude: { label: "Condição de saúde que a organização deve saber", tipo: "text", req: false, ph: "Ex.: asma, alergia a dipirona" },
    comoSoube: { label: "Como ficou sabendo da prova", tipo: "select", req: false, opcoes: ["Redes sociais", "Amigos", "Assessoria", "Site da prova", "Outro"] },
    equipe: { label: "Equipe ou assessoria", tipo: "text", req: false, ph: "Ex.: Assessoria Pace" },
    tempo: { label: "Tempo estimado de prova", tipo: "select", req: true, opcoes: ["Até 1h45", "1h45 a 2h15", "2h15 a 2h45", "Mais de 2h45"] },
    pelotao: { label: "Pelotão de largada", tipo: "select", req: true, opcoes: ["Elite", "A", "B"] },
};

/* ------------------------------------------------------------------ */
/*  Pessoas fictícias                                                  */
/* ------------------------------------------------------------------ */

const P: Record<string, [string, string, number, boolean]> = {
    ana: ["Ana Souza", "123.***.***-09", 34, false],
    jose: ["José Souza", "045.***.***-71", 62, true],
    marina: ["Marina Dias", "398.***.***-12", 29, true],
    marcos: ["Marcos Vieira", "185.***.***-72", 38, true],
    helena: ["Helena Vieira", "296.***.***-83", 36, true],
    pedro: ["Pedro Vieira", "307.***.***-94", 63, true],
    sofia: ["Sofia Andrade", "418.***.***-05", 31, true],
    andre: ["André Andrade", "529.***.***-16", 33, true],
    julio: ["Júlio Lima", "640.***.***-27", 20, true],
    clara: ["Clara Lima", "751.***.***-38", 24, true],
    rafael: ["Rafael Costa", "309.***.***-17", 31, true],
    julia: ["Júlia Costa", "310.***.***-26", 29, false],
    carla: ["Carla Mendes", "220.***.***-88", 41, true],
    bruno: ["Bruno Lima", "512.***.***-40", 28, true],
    paulo: ["Paulo Reis", "634.***.***-55", 45, true],
    lucas: ["Lucas Prado", "771.***.***-03", 25, true],
    gabi: ["Gabriela Nunes", "602.***.***-31", 33, true],
    rui: ["Rui Tavares", "118.***.***-64", 39, true],
    tiago: ["Tiago Melo", "287.***.***-15", 27, true],
    leo: ["Leonardo Dias", "741.***.***-36", 35, true],
    duda: ["Eduarda Lins", "852.***.***-47", 26, true],
    caio: ["Caio Ramos", "963.***.***-58", 44, true],
    bia: ["Beatriz Rocha", "934.***.***-02", 30, true],
    nina: ["Nina Alves", "476.***.***-58", 22, true],
    lia: ["Lia Prado", "455.***.***-90", 37, true],
};

export interface Pessoa {
    id: string;
    nome: string;
    cpf: string;
    idade: number;
    facial: boolean;
    email: string;
    tel: string;
}

const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "");

export function pessoa(id: string): Pessoa {
    const [nome, cpf, idade, facial] = P[id];
    let h = 7;
    for (const c of nome) h = (h * 33 + c.charCodeAt(0)) % 100000000;
    const x = String(h).padStart(8, "0");
    return {
        id,
        nome,
        cpf,
        idade,
        facial,
        email: `${semAcento(nome.toLowerCase()).replace(" ", ".")}@email.com`,
        tel: `(41) 9${x.slice(0, 4)}-${x.slice(4, 8)}`,
    };
}
export const PESSOAS_IDS = Object.keys(P);

/* ------------------------------------------------------------------ */
/*  Tipos                                                              */
/* ------------------------------------------------------------------ */

export interface Lote {
    id: string;
    nome: string;
    valor: number;
    estoque: number;
    vendidos: number;
    ativo: boolean;
}
export type Segmentacao = { tipo: "idade"; min: number } | { tipo: "cpf"; lista: string; cpfs: string[] };
export interface Modalidade {
    id: string;
    ativo: boolean;
    nome: string;
    grupo: string;
    perguntas: string[];
    lotes: Lote[];
    sync?: boolean;
    seg?: Segmentacao;
    passkey?: boolean;
    facial?: boolean;
    /** Combo: número de inscrições. */
    n?: number;
}
export type Respostas = Record<string, string>;
export interface Item {
    id: string;
    mod: string | null;
    lote: string | null;
    pago: number;
    taxa: number;
    /** Atletas inscritos (portadores). */
    ps: string[];
    status: "ativo" | "kit" | "trocado";
    resp: Respostas[];
    passkey?: string;
    /** Item de evento fora do AWA, só para consulta. */
    livre?: string;
    para?: string;
    veioDe?: string;
}
export interface Pedido {
    id: string;
    status: PedidoStatus;
    comprador: string;
    data: string;
    pagamento: string;
    itens: Item[];
    org: "pedras" | "outra";
    origem: "site" | "grupo" | "bilheteria" | "cortesia";
    canal: string;
    grupo?: string;
    cupom?: string;
    evento?: string;
    eventoId?: string;
}
export interface Valores {
    dif: number;
    dt: number;
    tt: number;
    total: number;
    down: boolean;
    /** Diferença não devolvida quando a nova inscrição é mais barata. */
    nd: number;
}
export type SolStatus = "AGUARDANDO" | "PROCESSANDO" | "FALHA" | "CONCLUIDA" | "EXPIRADA" | "CANCELADA" | "REPROVADA";
export type MotivoTipo = "expirou" | "vagas" | "pergunta" | "atendimento" | "comprador" | "reprovada";
export interface Solicitacao {
    id: string;
    grupo: string;
    pedido: string;
    itemId: string;
    destino: string;
    lote: string;
    resp: Respostas[];
    val: Valores;
    chamado?: string;
    aceite?: boolean;
    canal: "Backstage" | "Carteira";
    autor: string;
    criada: number;
    expira: number;
    status: SolStatus;
    reservado?: boolean;
    reservaAte?: number | null;
    abertoEm?: number;
    pagamento?: string;
    novo?: string;
    concluida?: number;
    motivoTipo?: MotivoTipo;
    motivoFim?: string;
    fimEm?: number;
    quem?: string;
    tam?: string;
}
export interface Email {
    tipo: string;
    solId: string;
    para: string;
    mail: string;
    ts: number;
}
export interface Estado {
    perfil: PerfilId;
    nominal: boolean;
    eventoFacial: boolean;
    volume: boolean;
    permitir: boolean;
    periodo: { ini: number; fim: number };
    mods: Modalidade[];
    camiseta: Record<string, number>;
    pedidos: Pedido[];
    seq: number;
    iseq: number;
    sols: Solicitacao[];
    emails: Email[];
    hist: Record<string, [string, string][]>;
    simSemVaga?: boolean;
    simCamiseta?: boolean;
    simEsgotar?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Formatação                                                         */
/* ------------------------------------------------------------------ */

export const r2 = (n: number) => Math.round(n * 100) / 100;

export function brl(v = 0) {
    const inteiro = Math.abs(v % 1) < 0.001;
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: inteiro ? 0 : 2, maximumFractionDigits: 2 });
}
const pad = (n: number) => String(n).padStart(2, "0");
export function fmt(ts: number) {
    const d = new Date(ts);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export const ate = (ts: number) => fmt(ts).replace(" ", " às ");
export const hora = (ts: number) => fmt(ts).slice(11);
export const norm = (t: unknown) =>
    semAcento(String(t ?? "").toLowerCase()).replace(/[.\-\s()/#]/g, "");

export function uuid(id: string) {
    let h = 0;
    for (const c of id + "ped") h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const x = (h.toString(16) + "a3f9c2e17b4d").padEnd(12, "0");
    return `${x.slice(0, 8)}-${x.slice(0, 4)}-4${x.slice(1, 4)}-9${x.slice(4, 7)}-${(x + x).slice(0, 12)}`;
}

/* ------------------------------------------------------------------ */
/*  Dados iniciais                                                     */
/* ------------------------------------------------------------------ */

function seed(): Estado {
    const L = (id: string, nome: string, valor: number, estoque: number, vendidos: number, ativo: boolean): Lote => ({ id, nome, valor, estoque, vendidos, ativo });
    const Q8 = ["camiseta", "contatoNome", "emergencia", "categoria", "cidade", "equipe", "saude", "comoSoube"];
    const mods: Modalidade[] = [
        { id: "m5", ativo: true, nome: "5 km", grupo: "Corrida", perguntas: Q8, lotes: [L("l1", "Lote 1", 100, 300, 300, false), L("l2", "Lote 2", 110, 400, 212, true)] },
        { id: "m10", ativo: true, nome: "10 km", grupo: "Corrida", sync: true, perguntas: Q8, lotes: [L("l1", "Lote 1", 140, 300, 180, true)] },
        {
            id: "m21",
            ativo: true,
            nome: "21 km",
            grupo: "Corrida",
            sync: true,
            perguntas: ["camiseta", "contatoNome", "emergencia", "categoria", "cidade", "equipe", "saude", "tempo"],
            lotes: [L("l1", "Lote 1", 160, 200, 200, false), L("l2", "Lote 2", 170, 250, 240, true), L("l3", "Lote 3", 180, 300, 12, true)],
        },
        { id: "m60", ativo: true, nome: "5 km 60+", grupo: "Corrida", seg: { tipo: "idade", min: 60 }, perguntas: Q8, lotes: [L("l1", "Lote 1", 55, 100, 31, true)] },
        {
            id: "mcol",
            ativo: true,
            nome: "5 km Colaboradores",
            grupo: "Corrida",
            seg: { tipo: "cpf", lista: "Colaboradores Pedras", cpfs: ["296.***.***-83", "418.***.***-05"] },
            perguntas: Q8,
            lotes: [L("l1", "Lote 1", 60, 80, 12, true)],
        },
        {
            id: "m42",
            ativo: true,
            nome: "42 km Elite",
            grupo: "Elite",
            passkey: true,
            facial: true,
            perguntas: ["camiseta", "contatoNome", "emergencia", "categoria", "cidade", "saude", "tempo", "pelotao"],
            lotes: [L("l1", "Lote 1", 300, 50, 41, true)],
        },
        { id: "m3", ativo: true, nome: "Caminhada 3 km", grupo: "Corrida", perguntas: ["contatoNome", "emergencia", "categoria", "cidade", "saude", "comoSoube"], lotes: [L("l1", "Lote 1", 80, 300, 90, true)] },
        { id: "kids", ativo: false, nome: "Corrida Kids", grupo: "Corrida", perguntas: ["contatoNome", "emergencia"], lotes: [L("l1", "Lote 1", 60, 200, 15, true)] },
        { id: "cd5", ativo: true, nome: "Combo Dupla 5 km", grupo: "Combos", n: 2, perguntas: ["camiseta", "contatoNome", "emergencia", "categoria", "cidade", "saude"], lotes: [L("l1", "Lote 1", 200, 100, 40, true)] },
        { id: "cd10", ativo: true, nome: "Combo Dupla 10 km", grupo: "Combos", n: 2, perguntas: ["camiseta", "contatoNome", "emergencia", "categoria", "cidade", "saude"], lotes: [L("l1", "Lote 1", 260, 100, 22, true)] },
    ];
    const I = (id: string, mod: string | null, lote: string | null, pago: number, taxa: number, ps: string[], resp: Respostas[], extra: Partial<Item> = {}): Item => ({
        id,
        mod,
        lote,
        pago,
        taxa,
        ps,
        status: "ativo",
        resp,
        ...extra,
    });
    const R = (c: string, e: string, x: Respostas = {}): Respostas => ({ camiseta: c, emergencia: e, ...x });
    const O = (id: string, status: PedidoStatus, comprador: string, data: string, pagamento: string, itens: Item[], extra: Partial<Pedido> = {}): Pedido => ({
        id,
        status,
        comprador,
        data,
        pagamento,
        itens,
        org: "pedras",
        origem: "site",
        canal: "Site",
        ...extra,
    });
    const pedidos: Pedido[] = [
        O("48330", "pago", "marcos", "05/11/2026 20:14", "Cartão de crédito 2x", [
            I("i30", "m10", "l1", 140, 14, ["marcos"], [R("GG", "(41) 99655-9000", { equipe: "Assessoria Pace" })]),
            I("i31", "m21", "l2", 170, 17, ["helena"], [R("P", "(41) 99655-9001", { tempo: "2h15 a 2h45" })]),
            I("i32", "m5", "l2", 110, 11, ["pedro"], [R("M", "(41) 99655-9002", { equipe: "" })]),
        ]),
        O("48213", "pago", "ana", "12/09/2026 14:32", "Pix", [
            I("i1", "m5", "l1", 100, 10, ["ana"], [R("M", "(41) 98888-1234", { equipe: "Assessoria Pace" })]),
            I("i2", "m5", "l1", 100, 10, ["jose"], [R("G", "(41) 97777-4321", { equipe: "" })]),
            I("i3", "m10", "l1", 140, 14, ["marina"], [R("P", "(41) 96666-0000", { equipe: "" })], { status: "kit" }),
        ]),
        O("48335", "pago", "sofia", "06/11/2026 07:55", "Pix", [
            I("i33", "m42", "l1", 300, 30, ["sofia"], [R("P", "(41) 99433-0001", { pelotao: "Elite" })], { passkey: "ELITE-7Q4K" }),
            I("i34", "m10", "l1", 140, 14, ["andre"], [R("G", "(41) 99433-0002", { equipe: "" })]),
        ]),
        O("48340", "pago", "julio", "07/11/2026 12:30", "Pix", [
            I("i35", "m5", "l2", 110, 11, ["julio"], [R("M", "(41) 99122-0001", { equipe: "" })]),
            I("i36", "m10", "l1", 140, 14, ["clara"], [R("P", "(41) 99122-0002", { equipe: "" })]),
        ]),
        O("48222", "pago", "rafael", "20/09/2026 09:11", "Cartão de crédito 3x", [I("i4", "cd5", "l1", 200, 20, ["rafael", "julia"], [R("G", "(41) 95555-1111"), R("P", "(41) 95555-2222")])], {
            cupom: "DUPLA10",
        }),
        O("48250", "pago", "carla", "02/10/2026 18:40", "Pix", [I("i5", "m10", "l1", 140, 14, ["bruno"], [R("M", "(41) 94444-2222", { equipe: "Assessoria Pace" })])], {
            origem: "grupo",
            canal: "Compra em grupo",
            grupo: "Assessoria Pace",
        }),
        O("48270", "pago", "paulo", "15/10/2026 16:05", "Cartão de crédito", [I("i7", "m21", "l2", 170, 17, ["paulo"], [R("M", "(41) 92222-4444", { tempo: "1h45 a 2h15" })])], {
            origem: "bilheteria",
            canal: "Bilheteria online",
        }),
        O("48261", "pago", "lucas", "05/10/2026 10:00", "Cortesia", [I("i6", "m5", "l2", 0, 0, ["lucas"], [R("GG", "(41) 93333-3333", { equipe: "" })])], {
            origem: "cortesia",
            canal: "Cortesia",
        }),
        O("48280", "pago", "gabi", "18/10/2026 11:20", "Cartão de crédito", [
            I("i20", "m10", "l1", 140, 14, ["gabi"], [R("P", "(41) 91111-2020", { equipe: "" })], { status: "trocado", para: "i21" }),
            I("i21", "m21", "l3", 180, 18, ["gabi"], [R("P", "(41) 91111-2020", { tempo: "1h45 a 2h15" })], { veioDe: "TR-0998" }),
        ]),
        O("48285", "pago", "rui", "22/10/2026 19:02", "Pix", [I("i22", "m5", "l1", 100, 10, ["rui"], [R("GG", "(41) 90000-1212", { equipe: "" })])]),
        O("48290", "pendente", "tiago", "08/11/2026 21:15", "Pix", [I("i23", "m10", "l1", 140, 14, ["tiago"], [R("M", "(41) 98989-0000", { equipe: "" })])]),
        O("48320", "processando", "leo", "09/11/2026 22:41", "Cartão de crédito", [I("i26", "m10", "l1", 140, 14, ["leo"], [R("G", "(41) 99812-0000", { equipe: "" })])]),
        O("48322", "abandonado", "duda", "09/11/2026 18:03", "Pix", [I("i27", "m21", "l3", 180, 18, ["duda"], [{}])]),
        O("48325", "recusado", "caio", "07/11/2026 10:12", "Cartão de crédito", [I("i28", "m5", "l2", 110, 11, ["caio"], [R("M", "(41) 99701-0000", { equipe: "" })])]),
        O("48301", "reembolsado", "bia", "03/10/2026 08:45", "Cartão de crédito", [I("i24", "m21", "l2", 170, 17, ["bia"], [R("P", "(41) 97878-1111", { tempo: "Mais de 2h45" })])]),
        O("48315", "cancelado", "nina", "28/10/2026 13:30", "Pix", [I("i25", "m5", "l2", 110, 11, ["nina"], [R("P", "(41) 96767-2222", { equipe: "" })])]),
        O("51002", "pago", "lia", "01/10/2026 08:20", "Pix", [I("i8", null, null, 220, 22, ["lia"], [{}], { livre: "Pedal 60 km" })], {
            org: "outra",
            evento: "Pedal Serra Gaúcha 2027",
            eventoId: "5d2a7c41-0b8e-4f3a-9e61-2c7b1f0a9d33",
        }),
    ];
    const FEM = ["ana", "marina", "helena", "sofia", "clara", "julia", "carla", "gabi", "duda", "bia", "nina", "lia"];
    const CONTATOS = ["Maria Souza", "João Pereira", "Lúcia Andrade", "Carlos Lima", "Fernanda Costa", "Paulo Nunes"];
    pedidos.forEach((o) =>
        o.itens.forEach((it) => {
            const m = mods.find((x) => x.id === it.mod);
            if (!m) return;
            it.resp.forEach((r, i) => {
                if (!Object.keys(r).length) return;
                const pid = it.ps[i];
                const ex: Respostas = {
                    contatoNome: CONTATOS[(pid.length + i) % CONTATOS.length],
                    categoria: FEM.includes(pid) ? "Feminino" : "Masculino",
                    cidade: "Curitiba, PR",
                    saude: "",
                    comoSoube: "Redes sociais",
                    equipe: "",
                };
                m.perguntas.forEach((k) => {
                    if (!(k in r) && k in ex) r[k] = ex[k];
                });
            });
        }),
    );
    const now = Date.now();
    return {
        perfil: "atendimento",
        nominal: true,
        eventoFacial: false,
        volume: false,
        permitir: true,
        periodo: { ini: new Date(2026, 10, 1, 8, 0).getTime(), fim: new Date(2027, 2, 13, 23, 59).getTime() },
        mods,
        camiseta: { P: 190, M: 12, G: 0, GG: 56 },
        pedidos,
        seq: 1001,
        iseq: 100,
        sols: [
            { id: "TR-0998", grupo: "G0", pedido: "48280", itemId: "i20", destino: "m21", lote: "l3", resp: [], val: calc(140, 14, 180), canal: "Backstage", autor: "Atendimento", criada: now - 3 * 864e5, concluida: now - 3 * 864e5, expira: now - 2 * 864e5, status: "CONCLUIDA" },
            {
                id: "TR-0997",
                grupo: "G00",
                pedido: "48213",
                itemId: "i2",
                destino: "m10",
                lote: "l1",
                resp: pedidos[1].itens[1].resp.map((r) => ({ ...r, camiseta: "M" })),
                val: calc(100, 10, 140),
                canal: "Backstage",
                autor: "Atendimento",
                criada: now - 2 * 864e5,
                expira: now - 864e5,
                status: "EXPIRADA",
                motivoTipo: "expirou",
                fimEm: now - 864e5,
            },
            {
                id: "TR-0999",
                grupo: "G1",
                pedido: "48285",
                itemId: "i22",
                destino: "m10",
                lote: "l1",
                resp: [{ ...pedidos[9].itens[0].resp[0] }],
                val: calc(100, 10, 140),
                chamado: "ATD-55102",
                canal: "Backstage",
                autor: "Atendimento",
                criada: now - 36e5,
                expira: now + 23 * 36e5,
                status: "AGUARDANDO",
                reservado: false,
            },
        ],
        emails: [],
        hist: {
            "48330": [["05/11/2026 20:14", "Pedido pago no cartão em 2x, no site. 3 inscrições."]],
            "48280": [
                ["18/10/2026 11:20", "Pedido pago no cartão, no site."],
                ["06/11/2026 10:12", "Troca TR-0998 concluída: de 10 km (Lote 1) para 21 km (Lote 3)."],
            ],
            "48285": [
                ["22/10/2026 19:02", "Pedido pago via Pix, no site."],
                [fmt(now - 36e5), "Troca TR-0999 criada por Atendimento: de 5 km para 10 km, total de R$ 64. Link enviado para Rui Tavares."],
            ],
            "48213": [
                ["12/09/2026 14:32", "Pedido pago via Pix, no site."],
                [fmt(now - 2 * 864e5), "Troca TR-0997 criada por Atendimento: de 5 km para 10 km, total de R$ 64. Link enviado para Ana Souza."],
                [fmt(now - 864e5), "Troca TR-0997 expirou sem pagamento. Nada foi alterado."],
            ],
            "48335": [["06/11/2026 07:55", "Pedido pago via Pix. A 42 km Elite foi liberada pelo código de passkey ELITE-7Q4K."]],
        },
    };
}

/* ------------------------------------------------------------------ */
/*  Persistência e assinatura                                          */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "backstage-troca-de-inscricao.v1";
let S: Estado = load();
let versao = 0;
const listeners = new Set<() => void>();

function load(): Estado {
    if (typeof window === "undefined") return seed();
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as Estado) : seed();
    } catch {
        return seed();
    }
}

/** Grava e avisa quem está ouvindo. Toda mutação passa por aqui. */
export function commit() {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
    } catch {
        /* storage indisponível: mantém em memória */
    }
    versao++;
    listeners.forEach((l) => l());
}

/** Relê o que está salvo: a carteira e o link (outra aba) gravam na mesma chave. */
function recarregar() {
    if (typeof window === "undefined") return;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) S = JSON.parse(raw) as Estado;
    } catch {
        /* mantém o estado em memória */
    }
}

function onStorage(e: StorageEvent) {
    if (e.key !== STORAGE_KEY) return;
    recarregar();
    versao++;
    listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
    if (!listeners.size) window.addEventListener("storage", onStorage);
    listeners.add(l);
    return () => {
        listeners.delete(l);
        if (!listeners.size) window.removeEventListener("storage", onStorage);
    };
}

let ultimaRota = "";

/** Re-renderiza o componente a cada mudança do estado. Retorna o estado atual. */
export function useTroca(): Estado {
    // Ao entrar numa tela, relê o storage (a carteira usa uma cópia deste store).
    useState(() => {
        const rota = typeof window === "undefined" ? "" : window.location.pathname;
        if (rota !== ultimaRota) {
            ultimaRota = rota;
            recarregar();
        }
        return 0;
    });
    useSyncExternalStore(
        subscribe,
        () => versao,
        () => versao,
    );
    return S;
}

export const estado = () => S;

export function reiniciar() {
    S = seed();
    window.localStorage.removeItem(STORAGE_KEY);
    rascunhos.clear();
    commit();
}

/* ------------------------------------------------------------------ */
/*  Consultas                                                          */
/* ------------------------------------------------------------------ */

export const perfil = () => PERFIS[S.perfil];
export const mod = (id: string | null | undefined) => S.mods.find((m) => m.id === id);
export const ped = (id: string | undefined) => S.pedidos.find((p) => p.id === id);
export const sol = (id: string | undefined) => S.sols.find((s) => s.id === id);
export const lote = (m: Modalidade | undefined, id: string | null | undefined) => m?.lotes.find((l) => l.id === id);
export const vagas = (l: Lote) => l.estoque - l.vendidos;
export const disp = (l: Lote) => l.ativo && vagas(l) > 0;
/** RN-08: o destino usa o último lote ativo com vaga. */
export function ultimoLote(m: Modalidade | undefined) {
    const a = m?.lotes.filter(disp) ?? [];
    return a[a.length - 1] ?? null;
}
export const nomeItem = (it: Item) => (it.mod ? mod(it.mod)?.nome ?? "" : it.livre ?? "");
export const nomes = (it: Item) => it.ps.map((id) => pessoa(id).nome).join(" e ");
export const evDoPed = (p: Pedido) => (p.org === "pedras" ? { id: EVENTO.id, nome: EVENTO.nome } : { id: p.eventoId ?? "", nome: p.evento ?? "" });
export const encerrado = () => Date.now() >= EVENTO.ultima;
export const valorPed = (p: Pedido) => p.itens.filter((i) => !i.veioDe).reduce((a, i) => a + i.pago, 0);
export const taxaPed = (p: Pedido) => p.itens.filter((i) => !i.veioDe).reduce((a, i) => a + i.taxa, 0);
export const camisetaOk = (v: string | undefined) => !!v && (S.camiseta[v] ?? 0) > 0;

/** Valores da troca: diferença da inscrição, diferença da taxa de serviço e taxa de troca. */
export function calc(pago: number, taxa: number, novo: number): Valores {
    const dif = r2(novo - pago);
    const dt = Math.max(0, r2(novo * TAXA - taxa));
    const bruto = r2(dif + dt + TAXA_TROCA.total);
    return { dif, dt, tt: TAXA_TROCA.total, total: Math.max(0, bruto), down: dif < 0, nd: bruto < 0 ? -bruto : 0 };
}

const ABERTAS: SolStatus[] = ["AGUARDANDO", "PROCESSANDO", "FALHA"];
const FALHAS: SolStatus[] = ["EXPIRADA", "CANCELADA", "REPROVADA"];
export const pendDoItem = (id: string) => S.sols.find((s) => s.itemId === id && ABERTAS.includes(s.status));
export const solsPend = (pid: string) => S.sols.filter((s) => s.pedido === pid && ABERTAS.includes(s.status));
export const ultimaSol = (itemId: string) =>
    S.sols.filter((s) => s.itemId === itemId).sort((a, b) => +b.id.slice(3) - +a.id.slice(3))[0];
export const falhou = (s: Solicitacao | undefined) => !!s && FALHAS.includes(s.status);

export type TrocaDoPedido = "aguardando" | "nao" | "concluida" | "sem";
export function trocaDoPed(p: Pedido): TrocaDoPedido {
    if (solsPend(p.id).length) return "aguardando";
    if (p.itens.some((it) => it.status !== "trocado" && falhou(ultimaSol(it.id)))) return "nao";
    if (S.sols.some((s) => s.pedido === p.id && s.status === "CONCLUIDA")) return "concluida";
    return "sem";
}

export function editavel(p: Pedido) {
    return p.status === "pago" && p.org === "pedras" && p.origem !== "cortesia" && perfil().pode && !encerrado();
}

function outrasAcesso(pid: string, exceto: string) {
    return S.pedidos
        .filter((p) => p.org === "pedras" && p.status === "pago")
        .flatMap((p) => p.itens)
        .filter((i) => i.id !== exceto && i.status !== "trocado" && i.ps.includes(pid) && i.mod).length;
}

export interface Bloqueio {
    cod: string;
    msg: string;
    curto: string;
    seg?: boolean;
    facial?: boolean;
}
/** RN-11: regras do destino validadas em cada atleta inscrito, com a configuração vigente. */
export function elegib(it: Item, m: Modalidade): Bloqueio[] {
    const e: Bloqueio[] = [];
    it.ps.forEach((id) => {
        const p = pessoa(id);
        if (S.nominal && outrasAcesso(id, it.id) > 0)
            e.push({ cod: "V-14", curto: "Atleta já inscrito no evento", msg: `${p.nome} já tem uma inscrição de acesso nesta sessão do evento.` });
        if (m.seg?.tipo === "idade" && p.idade < m.seg.min) {
            const t = `Exclusiva para portadores com ${m.seg.min} anos ou mais. ${p.nome} tem ${p.idade} anos.`;
            e.push({ cod: "V-12", seg: true, curto: t, msg: t });
        }
        if (m.seg?.tipo === "cpf" && !m.seg.cpfs.includes(p.cpf)) {
            const t = `Exclusiva para os CPFs da lista "${m.seg.lista}". O CPF de ${p.nome} (${p.cpf}) não está na lista.`;
            e.push({ cod: "V-13", seg: true, curto: t, msg: t });
        }
        if ((m.facial || S.eventoFacial) && !p.facial)
            e.push({
                cod: "V-15",
                facial: true,
                curto: "Atleta sem facial cadastrada",
                msg: `${m.facial ? m.nome : "Este evento"} exige reconhecimento facial e ${p.nome} não tem facial cadastrada.`,
            });
    });
    return e;
}

export interface Opcao {
    m: Modalidade;
    l: Lote;
    off: boolean;
    f?: Valores;
    e?: Bloqueio[];
    motivo?: string;
}
/** RN-06 a RN-10: destinos possíveis (ativos, mesmo nº de inscrições, último lote). */
export function opcoes(it: Item, canal: "backstage" | "carteira" = "backstage"): Opcao[] {
    const atual = mod(it.mod)!;
    const n = atual.n ?? 1;
    return S.mods
        .filter((m) => m.ativo && m.id !== atual.id && (m.n ?? 1) === n && !(canal === "carteira" && m.passkey))
        .map((m) => {
            const l = ultimoLote(m);
            if (!l) return { m, l: m.lotes[m.lotes.length - 1], off: true, motivo: canal === "carteira" ? "Esgotado" : "Esgotada" };
            const e = elegib(it, m);
            return { m, l, f: calc(it.pago, it.taxa, l.valor), e, off: e.length > 0 };
        });
}

/** Por que a troca não aconteceu, em uma frase. */
export function motivoTxt(s: Solicitacao) {
    const t: MotivoTipo = s.motivoTipo ?? (s.status === "EXPIRADA" ? "expirou" : s.status === "REPROVADA" ? "reprovada" : "atendimento");
    const quando = ate(s.fimEm ?? s.expira);
    const textos: Record<MotivoTipo, string> = {
        expirou: `O link de pagamento expirou em ${ate(s.expira)} sem pagamento.`,
        vagas: `As vagas da ${mod(s.destino)?.nome} acabaram antes do pagamento.`,
        pergunta: `O tamanho ${s.tam ?? ""} da camiseta esgotou antes do pagamento.`,
        atendimento: `Cancelada por ${s.quem ?? "Atendimento"} em ${quando}.`,
        comprador: `Cancelada pelo comprador na carteira em ${quando}.`,
        reprovada: `${s.motivoFim ?? "A verificação final não aprovou a troca."} O valor pago (${brl(s.val.total)}) foi estornado.`,
    };
    return textos[t];
}

/* ------------------------------------------------------------------ */
/*  Mutações                                                           */
/* ------------------------------------------------------------------ */

export function hist(pid: string, txt: string) {
    (S.hist[pid] ||= []).push([fmt(Date.now()), txt]);
}
export function email(tipo: string, s: Solicitacao, para: Pessoa) {
    S.emails.push({ tipo, solId: s.id, para: para.nome, mail: para.email, ts: Date.now() });
}

export function setPerfil(id: PerfilId) {
    S.perfil = id;
    commit();
}
export function setSim(k: "simSemVaga" | "simCamiseta" | "simEsgotar" | "volume" | "eventoFacial", v: boolean) {
    S[k] = v;
    commit();
}

/** RN-34: efetiva a troca, devolve a vaga ao lote da compra e emite o novo comprovante. */
export function efetivar(s: Solicitacao) {
    const p = ped(s.pedido)!;
    const it = p.itens.find((i) => i.id === s.itemId)!;
    const de = mod(it.mod)!;
    const para = mod(s.destino)!;
    const lo = lote(de, it.lote)!;
    const ld = lote(para, s.lote)!;
    lo.vendidos -= 1;
    if (!s.reservado) ld.vendidos += 1;
    s.reservado = false;
    s.reservaAte = null;
    it.resp.forEach((r) => {
        if (r.camiseta) S.camiseta[r.camiseta]++;
    });
    s.resp.forEach((r) => {
        if (r.camiseta) S.camiseta[r.camiseta]--;
    });
    const nid = "i" + ++S.iseq;
    p.itens.splice(p.itens.indexOf(it) + 1, 0, {
        id: nid,
        mod: para.id,
        lote: ld.id,
        pago: ld.valor,
        taxa: r2(ld.valor * TAXA),
        ps: [...it.ps],
        status: "ativo",
        resp: s.resp.map((r) => ({ ...r })),
        veioDe: s.id,
    });
    it.status = "trocado";
    it.para = nid;
    s.status = "CONCLUIDA";
    s.novo = nid;
    s.concluida = Date.now();
    hist(
        p.id,
        `Troca ${s.id} concluída: de ${de.nome} (${lo.nome}) para ${para.nome} (${ld.nome}). Vaga devolvida ao ${lo.nome} da ${de.nome} e consumida do ${ld.nome} da ${para.nome}. Novo comprovante emitido; o anterior foi invalidado.`,
    );
    if (de.sync || para.sync)
        hist(p.id, `Progresso do Conjunto Provas longas ajustado${de.sync ? `, menos 1 na ${de.nome}` : ""}${para.sync ? `, mais 1 na ${para.nome}` : ""}.`);
    email("concluida", s, pessoa(p.comprador));
    it.ps.forEach((id) => {
        if (id !== p.comprador) email("portador", s, pessoa(id));
    });
}

/** RN-16 e RN-18: vaga no lote e estoque das respostas. */
export function falhaEstoque(grp: Solicitacao[]): { tipo: "vagas" | "pergunta"; tam?: string; motivo: string } | null {
    for (const x of grp) {
        if (x.reservado) continue;
        const m = mod(x.destino)!;
        if (!disp(lote(m, x.lote)!)) return { tipo: "vagas", motivo: `As vagas da ${m.nome} acabaram.` };
        const t = x.resp.map((r) => r.camiseta).find((c) => c && (S.camiseta[c] ?? 0) <= 0);
        if (t) return { tipo: "pergunta", tam: t, motivo: `O tamanho ${t} da camiseta esgotou.` };
    }
    return null;
}

export function cancelarGrupo(grp: Solicitacao[], motivo: string, tipo: MotivoTipo, extra: Partial<Solicitacao> = {}) {
    grp.forEach((x) => {
        x.motivoTipo = tipo;
        x.fimEm = Date.now();
        Object.assign(x, extra);
        if (x.reservado) {
            lote(mod(x.destino), x.lote)!.vendidos -= 1;
            x.reservado = false;
        }
        x.status = "CANCELADA";
        x.motivoFim = motivo;
        hist(x.pedido, `Troca ${x.id} cancelada: ${motivo.toLowerCase()} Nada foi cobrado.`);
    });
    if (grp[0]) email("cancelada", grp[0], pessoa(ped(grp[0].pedido)!.comprador));
}

/** Libera reservas vencidas (15 min) e expira links (24 h). */
export function tick() {
    let mudou = false;
    const now = Date.now();
    S.sols.forEach((s) => {
        if (s.status === "AGUARDANDO" && s.reservado && s.reservaAte && now > s.reservaAte) {
            lote(mod(s.destino), s.lote)!.vendidos -= 1;
            s.reservado = false;
            s.reservaAte = null;
            mudou = true;
            hist(s.pedido, `Tempo de pagamento da troca ${s.id} acabou. Vaga liberada; o link continua válido até ${ate(s.expira)}.`);
        }
        if (s.status === "AGUARDANDO" && now > s.expira) {
            if (s.reservado) {
                lote(mod(s.destino), s.lote)!.vendidos -= 1;
                s.reservado = false;
            }
            s.status = "EXPIRADA";
            s.motivoTipo = "expirou";
            s.fimEm = now;
            mudou = true;
            hist(s.pedido, "Troca " + s.id + " expirou sem pagamento. Nada foi alterado.");
            email("expirada", s, pessoa(ped(s.pedido)!.comprador));
        }
    });
    if (mudou) commit();
    return mudou;
}

export function reenviar(id: string) {
    const s = sol(id)!;
    email("criada", s, pessoa(ped(s.pedido)!.comprador));
    commit();
}
export function cancelarNoBackstage(pid: string) {
    cancelarGrupo(
        solsPend(pid).filter((s) => s.status === "AGUARDANDO"),
        `Cancelada por ${perfil().nome}.`,
        "atendimento",
        { quem: perfil().nome },
    );
    commit();
}
export function reprocessar(pid: string) {
    solsPend(pid)
        .filter((s) => s.status === "FALHA")
        .forEach((s) => {
            efetivar(s);
            hist(pid, `Troca ${s.id} reprocessada por ${perfil().nome}, sem nova cobrança.`);
        });
    commit();
}
/** Atalho do protótipo: faz o link do pedido vencer agora. */
export function expirarPendentes(pid: string) {
    const g = solsPend(pid).filter((s) => s.status === "AGUARDANDO");
    g.forEach((s) => (s.expira = Date.now() - 1000));
    tick();
    commit();
    return g.length;
}

/* ------------------------------------------------------------------ */
/*  Rascunho da edição do pedido (não persiste)                        */
/* ------------------------------------------------------------------ */

export interface RascunhoItem {
    dest: string | null;
    resp: Respostas[];
    /** Avisos por campo (ex.: tamanho esgotado ao refazer). Chave: `${i}${k}`. */
    av?: Record<string, string>;
}
export interface Rascunho {
    itens: Record<string, RascunhoItem>;
    aceite: boolean;
    erroAceite: boolean;
    chamado: string;
    tentou: boolean;
}
const rascunhos = new Map<string, Rascunho>();

export function rascunho(pid: string): Rascunho {
    let d = rascunhos.get(pid);
    if (!d) {
        d = { itens: {}, aceite: false, erroAceite: false, chamado: "", tentou: false };
        rascunhos.set(pid, d);
    }
    return d;
}
export function descartarRascunho(pid: string) {
    rascunhos.delete(pid);
    versao++;
    listeners.forEach((l) => l());
}
/** Mudanças locais do rascunho: não gravam no storage, só re-renderizam. */
export function tocar() {
    versao++;
    listeners.forEach((l) => l());
}

function rascItem(pid: string, it: Item) {
    const d = rascunho(pid);
    return (d.itens[it.id] ||= { dest: null, resp: it.resp.map((r) => ({ ...r })) });
}

/** Perguntas do item no rascunho: as do destino, se houver troca. */
export function pergs(pid: string, it: Item) {
    const d = rascunhos.get(pid)?.itens[it.id];
    return mod(d?.dest ?? it.mod)?.perguntas ?? [];
}

export interface Mudanca {
    i: number;
    k: string;
    a: string;
    b: string;
    nova: boolean;
}
export function mudancas(pid: string, it: Item): { dest: Modalidade | null; resp: Mudanca[] } | null {
    const d = rascunhos.get(pid)?.itens[it.id];
    if (!d) return null;
    const ks = pergs(pid, it);
    const l: Mudanca[] = [];
    it.ps.forEach((_, i) =>
        ks.forEach((k) => {
            const a = it.resp[i]?.[k] ?? "";
            const b = d.resp[i]?.[k] ?? "";
            const nova = !!d.dest && !(k in (it.resp[i] ?? {}));
            if (a !== b || nova) l.push({ i, k, a, b, nova });
        }),
    );
    if (!d.dest && !l.length) return null;
    return { dest: d.dest ? mod(d.dest)! : null, resp: l };
}
export const alterados = (p: Pedido) =>
    p.itens.map((it) => ({ it, m: mudancas(p.id, it) })).filter((x): x is { it: Item; m: NonNullable<ReturnType<typeof mudancas>> } => !!x.m);

export function faltas(p: Pedido) {
    const d = rascunho(p.id);
    let n = 0;
    alterados(p).forEach(({ it }) =>
        it.ps.forEach((_, i) =>
            pergs(p.id, it).forEach((k) => {
                if (PERG[k].req && !String(d.itens[it.id].resp[i]?.[k] ?? "").trim()) n++;
            }),
        ),
    );
    return n;
}

/** Respostas do item levadas para o destino. Tamanho esgotado fica em branco. */
function herdar(it: Item, destino: Modalidade, base?: Respostas[]) {
    const av: Record<string, string> = {};
    const resp = it.ps.map((_, i) => {
        const a = { ...(it.resp[i] ?? {}), ...(base?.[i] ?? {}) };
        const r: Respostas = {};
        destino.perguntas.forEach((k) => {
            let v = a[k] ?? "";
            if (PERG[k].estoque && v && !camisetaOk(v)) {
                av[`${i}${k}`] = `O tamanho ${v} esgotou. Escolha outro.`;
                v = "";
            }
            r[k] = v;
        });
        return r;
    });
    return { resp, av };
}

export function escolherDestino(pid: string, it: Item, destino: string) {
    const d = rascItem(pid, it);
    const { resp } = herdar(it, mod(destino)!);
    d.dest = destino;
    d.resp = resp;
    d.av = {};
    tocar();
}

export function desfazer(pid: string, itId: string) {
    delete rascunho(pid).itens[itId];
    tocar();
}

export function setResp(pid: string, it: Item, i: number, k: string, v: string) {
    const d = rascItem(pid, it);
    (d.resp[i] ||= {})[k] = v;
    tocar();
}

/**
 * Refazer uma troca não realizada. Mesmo destino disponível: traz as respostas já
 * preenchidas. Destino esgotado ou bloqueado: devolve `false` para abrir a escolha.
 */
export function refazer(pid: string, it: Item, s: Solicitacao): boolean {
    const m = mod(s.destino)!;
    if (!ultimoLote(m) || elegib(it, m).length) return false;
    const d = rascItem(pid, it);
    const { resp, av } = herdar(it, m, s.resp);
    d.dest = s.destino;
    d.resp = resp;
    d.av = av;
    rascunho(pid).tentou = Object.keys(av).length > 0;
    tocar();
    return true;
}

/** Confirmar a revisão: salva respostas, cria as solicitações e gera um link só. */
export function confirmar(p: Pedido): { tipo: "link" | "concluida" | "salvo" | "esgotou"; expira?: number; destino?: string } {
    const d = rascunho(p.id);
    const alt = alterados(p);
    const tr = alt.filter((a) => a.m.dest);
    if (S.simEsgotar && tr.length) {
        S.simEsgotar = false;
        commit();
        return { tipo: "esgotou", destino: tr[0].m.dest!.nome };
    }
    alt
        .filter((a) => !a.m.dest)
        .forEach(({ it, m }) => {
            m.resp.forEach((r) => {
                const old = it.resp[r.i]?.[r.k];
                if (PERG[r.k].estoque) {
                    if (old) S.camiseta[old]++;
                    if (r.b) S.camiseta[r.b]--;
                }
                (it.resp[r.i] ||= {})[r.k] = r.b;
            });
            hist(
                p.id,
                `Respostas de ${nomes(it)} alteradas por ${perfil().nome}: ${m.resp.map((r) => `${PERG[r.k].label}, de "${r.a || "sem resposta"}" para "${r.b || "sem resposta"}"`).join("; ")}.`,
            );
        });
    const grupo = "G" + Date.now();
    const expira = Math.min(Date.now() + LINK_H * 36e5, EVENTO.ultima);
    let primeiro: Solicitacao | null = null;
    let zero = 0;
    tr.forEach(({ it, m }) => {
        const l = ultimoLote(m.dest!)!;
        const f = calc(it.pago, it.taxa, l.valor);
        const s: Solicitacao = {
            id: "TR-" + S.seq++,
            grupo,
            pedido: p.id,
            itemId: it.id,
            destino: m.dest!.id,
            lote: l.id,
            resp: d.itens[it.id].resp.map((r) => ({ ...r })),
            val: f,
            chamado: d.chamado.trim(),
            aceite: f.down,
            canal: "Backstage",
            autor: perfil().nome,
            criada: Date.now(),
            expira,
            status: f.total ? "AGUARDANDO" : "PROCESSANDO",
            reservado: false,
        };
        S.sols.push(s);
        hist(
            p.id,
            `Troca ${s.id} criada por ${s.autor}: de ${nomeItem(it)} para ${m.dest!.nome} (${l.nome}), total de ${brl(f.total)}${s.chamado ? `, chamado ${s.chamado}` : ""}${f.down ? ", aceite de não devolução registrado" : ""}.`,
        );
        if (!f.total) {
            efetivar(s);
            zero++;
        } else if (!primeiro) primeiro = s;
    });
    if (primeiro) email("criada", primeiro, pessoa(p.comprador));
    rascunhos.delete(p.id);
    commit();
    return { tipo: primeiro ? "link" : zero ? "concluida" : "salvo", expira };
}

/* ------------------------------------------------------------------ */
/*  Configuração do evento (TS-1816)                                   */
/* ------------------------------------------------------------------ */

export function salvarConfigTrocas(permitir: boolean, periodo?: { ini: number; fim: number }) {
    S.permitir = permitir;
    if (permitir && periodo) S.periodo = periodo;
    commit();
}

/* ------------------------------------------------------------------ */
/*  Link de pagamento (TS-1818)                                        */
/* ------------------------------------------------------------------ */

/** Trocas do mesmo link (um link por confirmação). */
export const grupoDe = (s: Solicitacao) => S.sols.filter((x) => x.grupo === s.grupo && x.status === "AGUARDANDO");

/** Simulações do protótipo: esgota de verdade o lote ou o tamanho antes da revalidação. */
function simFalha(grp: Solicitacao[]) {
    if (S.simSemVaga) {
        S.simSemVaga = false;
        const m = mod(grp[0].destino)!;
        m.lotes.forEach((l) => {
            if (l.ativo) l.vendidos = l.estoque;
        });
        return { tipo: "vagas" as const, motivo: `As vagas da ${m.nome} acabaram.` };
    }
    if (S.simCamiseta) {
        S.simCamiseta = false;
        const t = grp.flatMap((x) => x.resp.map((r) => r.camiseta)).find(Boolean) ?? "G";
        S.camiseta[t] = 0;
        return { tipo: "pergunta" as const, tam: t, motivo: `O tamanho ${t} da camiseta esgotou.` };
    }
    return null;
}

/**
 * RN-16: ao abrir o link, valida o estoque de novo. Com vaga, reserva por 15 minutos (tudo ou nada).
 * Sem vaga, a troca é cancelada com o motivo.
 */
export function abrirLink(id: string): "reservado" | "cancelada" | "nada" {
    const s = sol(id);
    if (!s || s.status !== "AGUARDANDO" || s.reservado) return "nada";
    const g = grupoDe(s);
    const fx = simFalha(g) ?? falhaEstoque(g);
    if (fx) {
        cancelarGrupo(g, fx.motivo, fx.tipo, { tam: fx.tam });
        commit();
        return "cancelada";
    }
    g.forEach((x) => {
        lote(mod(x.destino), x.lote)!.vendidos += 1;
        x.reservado = true;
        x.reservaAte = Date.now() + SESSAO_MIN * 6e4;
        x.abertoEm = Date.now();
        hist(x.pedido, `Link da troca ${x.id} aberto pelo comprador. Vaga reservada no ${lote(mod(x.destino), x.lote)!.nome} da ${mod(x.destino)!.nome} até ${hora(x.reservaAte)} para o pagamento.`);
    });
    commit();
    return "reservado";
}

export function pagarLink(id: string, forma: string) {
    const s = sol(id)!;
    const g = grupoDe(s);
    g.forEach((x) => {
        x.status = "PROCESSANDO";
        x.pagamento = forma;
    });
    hist(s.pedido, `Pagamento da troca ${g.map((x) => x.id).join(", ")} confirmado (${forma}, ${brl(g.reduce((a, x) => a + x.val.total, 0))}).`);
    email("pago", s, pessoa(ped(s.pedido)!.comprador));
    commit();
    setTimeout(() => {
        g.forEach((x) => efetivar(x));
        commit();
    }, 1400);
}

/** Atalhos do protótipo para o tempo passar. */
export function encerrarSessao(id: string) {
    const s = sol(id);
    if (!s) return;
    S.sols.filter((x) => x.grupo === s.grupo && x.reservaAte).forEach((x) => (x.reservaAte = Date.now() - 1000));
    tick();
}
export function vencerLink(id: string) {
    const s = sol(id);
    if (!s) return;
    S.sols.filter((x) => x.grupo === s.grupo).forEach((x) => (x.expira = Date.now() - 1000));
    tick();
}
