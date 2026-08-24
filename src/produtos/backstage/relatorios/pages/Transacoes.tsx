import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
    Bank,
    CheckCircle,
    ClockFastForward,
    CreditCard02,
    CurrencyDollarCircle,
    Edit02,
    RefreshCcw01,
    SearchLg,
    ShoppingCart01,
    SlashCircle01,
} from "@untitledui/icons";
import { toast } from "sonner";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { MetricsIcon03 } from "@/components/application/metrics/metrics";
import { PaginationCardAdvanced } from "@/components/application/pagination/pagination";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { DEFAULT_SELECTED, ManageColumnsModal } from "../components/ManageColumnsModal";
import { ExportMenu, RelatorioPageHeader } from "../components/RelatorioPageHeader";
import { RelatorioFiltersProvider, matchRow, inDateRange, useRelatorioFilters, type FilterFieldDef } from "../components/relatorio-filters";
import { SortableHeader } from "../components/SortableHeader";
import { TransacionadoChartCard, type ChartPoint } from "../components/TransacionadoChart";
import { useSortableTable } from "../utils/useSortableTable";
import { EVENT, currencyFormatter, numberFormatter, parseEventDate } from "../data/event";
import { EVENTO, GRUPOS, PERIODO_PADRAO } from "@/reports/event-dataset";
import { EXPORT_FIELD_GROUPS } from "../data/export-fields";

/* ------------------------------------------------------------------ */
/*  Status + meios                                                    */
/* ------------------------------------------------------------------ */

type StatusTransacao = "aprovado" | "pendente" | "cancelado" | "estornado" | "reembolso";

const STATUS_META: Record<StatusTransacao, { label: string; icon: typeof CheckCircle; color: "success" | "warning" | "error" | "gray" }> = {
    aprovado: { label: "Aprovado", icon: CheckCircle, color: "success" },
    pendente: { label: "Pendente", icon: ClockFastForward, color: "warning" },
    cancelado: { label: "Carrinho Abandonado", icon: ShoppingCart01, color: "gray" },
    estornado: { label: "Cancelado", icon: SlashCircle01, color: "error" },
    reembolso: { label: "Reembolso", icon: RefreshCcw01, color: "warning" },
};

const STATUS_FILL: Record<StatusTransacao, string> = {
    aprovado: "var(--color-utility-green-500)",
    pendente: "var(--color-utility-yellow-500)",
    cancelado: "var(--color-utility-neutral-500)",
    estornado: "var(--color-utility-red-500)",
    reembolso: "var(--color-utility-orange-500)",
};

interface IngressoStatusRow {
    id: string;
    status: StatusTransacao;
    canal: string;
    totalIngressos: number;
    total: number;
}

interface MeioPagamentoRow {
    id: string;
    nome: string;
    icon: typeof CreditCard02;
    quantidadeTransacoes: number;
    pctQtdTransacoes: number;
    quantidadeIngressos: number;
    pctQtdIngressos: number;
    valor: number;
    pctValor: number;
}


/* ------------------------------------------------------------------ */
/*  Mock data — gerador determinístico de transações                  */
/*  Todos os cards derivam DESTE conjunto, então qualquer filtro       */
/*  (período, sessão ou campo) recompõe todas as visões da página.     */
/* ------------------------------------------------------------------ */

interface Transacao {
    id: string;
    sessaoId: string;
    dataCriacao: string;
    ultimaAtualizacao: string;
    status: StatusTransacao;
    nomeIngresso: string;
    setor: string;
    modalidade: string;
    lote: string;
    comprador: string;
    tipoDocumentoComprador: string;
    cpf: string;
    telefone: string;
    email: string;
    dataNascimentoComprador: string;
    canal: string;
    tipoPagamento: string;
    estado: string;
    cidade: string;
    operadorVendas: string;
    valor: number;
    valorUnitario: number;
    cupom: string;
    valorDesconto: number;
    valorFinal: number;
    qtdItem: number;
    passkey: string;
    pdv: boolean;
    bundle: boolean;
    bundleDinamico: boolean;
    // Dados da inscrição.
    itemCodigo: string;
    idInscricao: string;
    // Dados do atleta — normalmente a mesma pessoa que comprou, mas pode ser outra
    // (compra feita para terceiros).
    atletaNome: string;
    atletaTipoDocumento: string;
    atletaDocumento: string;
    atletaEmail: string;
    atletaTelefone: string;
    atletaDataNascimento: string;
    // Compra em grupo — os campos de líder só são preenchidos quando o pedido é de um
    // grupo ("—" nos demais).
    grupoCompraEmGrupo: string;
    grupoNomeGrupo: string;
    grupoLiderGrupo: string;
    grupoTelefoneLider: string;
    grupoEmailLider: string;
    grupoDocLider: string;
    grupoNumDocLider: string;
    grupoDataNascLider: string;
    // Perguntas (formulário de inscrição) — só existem para poder popular a
    // tabela quando o usuário marca esses campos na gestão de colunas.
    perguntaPace: string;
    perguntaDistanciaProva: string;
    perguntaTempoEstimado: string;
    perguntaJaCorreuProva: string;
    perguntaCategoriaParticipacao: string;
    perguntaTamanhoCamisa: string;
    perguntaFaixaEtaria: string;
    perguntaConvenioMedico: string;
    perguntaComoConheceuEvento: string;
    perguntaMetaTempo: string;
    perguntaAnoInicioCorrida: string;
    perguntaTermoResponsabilidade: string;
    perguntaContatoEmergencia: string;
    perguntaMelhorTempoPessoal: string;
    perguntaQtdParticipacoes: string;
    perguntaAssessoriaEsportiva: string;
    perguntaFederadoCBAt: string;
    perguntaGrupoPace: string;
    perguntaEquipeRevezamento: string;
    perguntaFuncaoRevezamento: string;
    perguntaRetiradaKitTerceiros: string;
    perguntaMedicacaoContinua: string;
    perguntaDoencaPreExistente: string;
    perguntaPeso: string;
    perguntaNumeracaoCalcado: string;
}

// Setores e tipos de ingresso derivados dos grupos do evento (src/reports).
const t = (nome: string, valor: number) => ({ nome, valor, lote: nome });
const CATALOGO = GRUPOS.filter((g) => g.categoria === "Ingressos").map((g) => ({
    setor: g.nome,
    peso: g.capacidade ?? 1,
    tipos: [t("Inteira", g.precoMedio), t("Meia-entrada", Math.round(g.precoMedio / 2))],
}));

const PRIMEIROS = ["Adriano", "Mariana", "Pedro", "Camila", "Roberto", "Larissa", "Vinicius", "Davi", "Beatriz", "Gustavo", "Fernanda", "Rafael", "Juliana", "Bruno", "Aline", "Thiago", "Patrícia", "Lucas", "Carolina", "Felipe"];
const SOBRENOMES = ["Albuquerque", "Lopes Ferreira", "Henrique Costa", "Rodrigues", "Santos Júnior", "Almeida", "Cayres", "Marinho da Silva", "Oliveira", "Souza", "Pereira", "Carvalho", "Ribeiro", "Gomes", "Martins", "Araújo", "Barbosa", "Nunes"];
const LOCAIS = [
    { estado: "PE", cidade: "Recife", ddd: "81" },
    { estado: "PE", cidade: "Tamandaré", ddd: "81" },
    { estado: "SP", cidade: "São Paulo", ddd: "11" },
    { estado: "RJ", cidade: "Rio de Janeiro", ddd: "21" },
    { estado: "MG", cidade: "Belo Horizonte", ddd: "31" },
    { estado: "BA", cidade: "Salvador", ddd: "71" },
    { estado: "DF", cidade: "Brasília", ddd: "61" },
];
const OPERADORES = ["Bilheteria Praia de Carneiros", "Loja Oficial Réveillon Carneiros"];
const PASSKEYS = ["VIP2027", "EARLYBIRD", "PARCEIRO2027", "IMPRENSA27", "STAFF2027"];
const MODALIDADE_OPTIONS = ["Corrida", "Caminhada"];
const LOTE_OPTIONS = [
    { lote: "1º lote", peso: 0.35 },
    { lote: "2º lote", peso: 0.3 },
    { lote: "3º lote", peso: 0.25 },
    { lote: "4º lote", peso: 0.1 },
];
const CUPONS = [
    { cupom: "REVEILLON15", pct: 0.15 },
    { cupom: "OFF10", pct: 0.1 },
    { cupom: "VIRADA2027", pct: 0.1 },
];

// Pools para as "Perguntas" do formulário de inscrição (mock).
const DISTANCIA_PROVA_OPTIONS = ["5km", "10km", "15km", "21km", "42km"];
const CATEGORIA_PARTICIPACAO_OPTIONS = ["Geral", "PCD", "Elite", "Master"];
const CATEGORIA_COMPETICAO_OPTIONS = ["Feminino", "Masculino", "Idosos", "PCD"];
const CAMISA_TAMANHOS = ["PP", "P", "M", "G", "GG", "XG"];
const FAIXA_ETARIA_OPTIONS = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const CONVENIO_OPTIONS = ["Nenhum", "Unimed", "Bradesco Saúde", "SulAmérica", "Amil", "Hapvida"];
const COMO_CONHECEU_OPTIONS = ["Instagram", "Indicação de amigos", "Assessoria esportiva", "Site do evento", "Facebook", "Edição anterior"];
const ASSESSORIA_OPTIONS = ["Não participa", "Bora Correr", "Runners Team", "Ativa Assessoria", "Pró Corrida"];
const FUNCAO_REVEZAMENTO_OPTIONS = ["Não participa", "1º revezamento", "2º revezamento", "3º revezamento", "4º revezamento"];
const GRUPO_PACE_OPTIONS = ["Pelotão Azul", "Pelotão Verde", "Pelotão Vermelho", "Pelotão Geral"];
// Nomes de equipe para pedidos de "Compra em grupo".
const EQUIPE_PREFIXOS = ["Equipe", "Grupo", "Assessoria"];

/** "H:MM:SS" a partir de um total de minutos (usado por tempos de prova). */
const formatDuracao = (totalMinutos: number): string => {
    const totalSegundos = Math.round(totalMinutos * 60);
    const h = Math.floor(totalSegundos / 3600);
    const m = Math.floor((totalSegundos % 3600) / 60);
    const s = totalSegundos % 60;
    return `${h}:${pad(m)}:${pad(s)}`;
};

// Meios de pagamento (online), alinhados à distribuição do dataset.
const MEIOS_PAGAMENTO: { nome: string; peso: number; isento?: boolean }[] = [
    { nome: "Pix", peso: 0.63 },
    { nome: "Cartão de Crédito", peso: 0.27 },
    { nome: "Cartão de Débito", peso: 0.06 },
    { nome: "Isento", peso: 0.04, isento: true },
];

/** dd/mm/aaaa a partir de um offset (em dias) sobre a data de início de vendas. */
const SALES_START_DATE = parseEventDate(EVENTO.vendasInicio)!;
const SALES_TOTAL_DAYS =
    Math.round((parseEventDate(EVENTO.vendasFim)!.getTime() - SALES_START_DATE.getTime()) / 86_400_000) + 1;
const SESSAO_ID = "reveillon-31-12";

const pad = (n: number, size = 2) => String(n).padStart(size, "0");
const fmtDateTime = (d: Date) =>
    `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} às ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const fmtDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

function mulberry32(seed: number) {
    return function () {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const transacoes: Transacao[] = (() => {
    const rng = mulberry32(20260615);
    const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)];
    const pickWeighted = <T extends { peso: number }>(arr: T[]): T => {
        const total = arr.reduce((s, x) => s + x.peso, 0);
        let r = rng() * total;
        for (const x of arr) {
            r -= x.peso;
            if (r <= 0) return x;
        }
        return arr[arr.length - 1];
    };
    const rows: Transacao[] = [];
    const COUNT = 12500;
    for (let i = 0; i < COUNT; i++) {
        // Data enviesada para o fim da janela (rampa em direção ao evento), com pico no anúncio.
        let dayOffset: number;
        if (rng() < 0.16) {
            dayOffset = Math.floor(rng() * 8); // pico de anúncio (1ª semana)
        } else {
            dayOffset = Math.floor((SALES_TOTAL_DAYS - 1) * Math.pow(rng(), 0.55));
        }
        const created = new Date(SALES_START_DATE);
        created.setDate(created.getDate() + dayOffset);
        created.setHours(Math.floor(rng() * 24), Math.floor(rng() * 60), Math.floor(rng() * 60));
        const updated = new Date(created.getTime() + Math.floor(rng() * 30) * 60_000);

        const statusRoll = rng();
        const status: StatusTransacao =
            statusRoll < 0.86 ? "aprovado" : statusRoll < 0.91 ? "pendente" : statusRoll < 0.96 ? "cancelado" : statusRoll < 0.98 ? "estornado" : "reembolso";

        const cat = pickWeighted(CATALOGO);
        const tipo = pick(cat.tipos);
        const qtdItem = rng() < 0.82 ? 1 : rng() < 0.7 ? 2 : rng() < 0.7 ? 3 : 4;

        // Jogo único; vendas majoritariamente online. Bilheteria (PDV) usa dinheiro;
        // cortesias (isentas) entram como canal próprio.
        const isPdv = rng() < 0.01;
        const meio = isPdv ? { nome: "Dinheiro", peso: 1 } : pickWeighted(MEIOS_PAGAMENTO);
        const tipoPagamento = meio.nome;
        const isento = "isento" in meio && meio.isento === true;
        const canal = isento ? "Cortesia" : isPdv ? "Bilheteria" : "Online";
        const temPasskey = rng() < 0.08;

        const valor = isento ? 0 : tipo.valor * qtdItem;
        const temCupom = !isento && rng() < 0.12;
        const cupomDef = temCupom ? pick(CUPONS) : null;
        const valorDesconto = cupomDef ? Math.round(valor * cupomDef.pct * 100) / 100 : 0;
        const valorFinal = Math.round((valor - valorDesconto) * 100) / 100;
        const local = pick(LOCAIS);
        const nome = `${pick(PRIMEIROS)} ${pick(SOBRENOMES)}`;
        const emailUser = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]+/g, ".");
        const email = `${emailUser}${Math.floor(rng() * 90 + 10)}@${pick(["gmail.com", "outlook.com", "hotmail.com", "yahoo.com"])}`;
        const cpf = String(Math.floor(rng() * 9e10 + 1e10));
        const telefone = `+55${local.ddd}9${String(Math.floor(rng() * 9e7 + 1e7))}`;
        const tipoDocumentoComprador = rng() < 0.85 ? "CPF" : "Passaporte";
        const dataNascimentoComprador = fmtDate(new Date(1955 + Math.floor(rng() * 50), Math.floor(rng() * 12), 1 + Math.floor(rng() * 28)));

        // Dados do atleta — na maioria das vezes é quem comprou; ~15% das compras são
        // feitas para outra pessoa (ex.: presente, inscrição em nome de terceiros).
        const compradoParaOutro = rng() < 0.15;
        const atletaNome = compradoParaOutro ? `${pick(PRIMEIROS)} ${pick(SOBRENOMES)}` : nome;
        const atletaEmailUser = atletaNome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]+/g, ".");
        const atletaEmail = compradoParaOutro
            ? `${atletaEmailUser}${Math.floor(rng() * 90 + 10)}@${pick(["gmail.com", "outlook.com", "hotmail.com", "yahoo.com"])}`
            : email;
        const atletaTipoDocumento = compradoParaOutro ? (rng() < 0.85 ? "CPF" : "Passaporte") : tipoDocumentoComprador;
        const atletaDocumento = compradoParaOutro ? String(Math.floor(rng() * 9e10 + 1e10)) : cpf;
        const atletaTelefone = compradoParaOutro ? `+55${local.ddd}9${String(Math.floor(rng() * 9e7 + 1e7))}` : telefone;
        const atletaDataNascimento = fmtDate(new Date(1955 + Math.floor(rng() * 50), Math.floor(rng() * 12), 1 + Math.floor(rng() * 28)));

        // Compra em grupo — só ~12% dos pedidos são de uma equipe; o comprador é o
        // responsável pelo pedido nesse modelo (não há sub-registros por integrante).
        const compraEmGrupo = rng() < 0.12;

        // Perguntas (formulário de inscrição de corrida de rua).
        const jaCorreuProva = rng() < 0.55;
        const distanciaProva = pick(DISTANCIA_PROVA_OPTIONS);
        const distanciaKm = { "5km": 5, "10km": 10, "15km": 15, "21km": 21, "42km": 42 }[distanciaProva] ?? 10;
        const paceMin = 4 + rng() * 3; // 4:00–7:00 min/km
        const participaRevezamento = rng() < 0.1;
        const categoriaCompeticao = pick(CATEGORIA_COMPETICAO_OPTIONS);
        const modalidade = `${pick(MODALIDADE_OPTIONS)} ${distanciaProva}`;
        const lote = pickWeighted(LOTE_OPTIONS).lote;
        const perguntas = {
            perguntaPace: `${Math.floor(paceMin)}:${pad(Math.round((paceMin % 1) * 60))} min/km`,
            perguntaDistanciaProva: distanciaProva,
            perguntaTempoEstimado: formatDuracao(distanciaKm * paceMin),
            perguntaJaCorreuProva: jaCorreuProva ? "Sim" : "Não",
            perguntaCategoriaParticipacao: pick(CATEGORIA_PARTICIPACAO_OPTIONS),
            perguntaTamanhoCamisa: pick(CAMISA_TAMANHOS),
            perguntaFaixaEtaria: pick(FAIXA_ETARIA_OPTIONS),
            perguntaConvenioMedico: pick(CONVENIO_OPTIONS),
            perguntaComoConheceuEvento: pick(COMO_CONHECEU_OPTIONS),
            perguntaMetaTempo: formatDuracao(distanciaKm * paceMin * 0.95),
            perguntaAnoInicioCorrida: String(2010 + Math.floor(rng() * 16)),
            perguntaTermoResponsabilidade: rng() < 0.98 ? "Sim" : "Não",
            perguntaContatoEmergencia: `${pick(PRIMEIROS)} ${pick(SOBRENOMES)} — +55${pick(LOCAIS).ddd}9${String(Math.floor(rng() * 9e7 + 1e7))}`,
            perguntaMelhorTempoPessoal: formatDuracao(distanciaKm * Math.max(paceMin - 0.5, 3.5)),
            perguntaQtdParticipacoes: String(Math.floor(rng() * 10)),
            perguntaAssessoriaEsportiva: rng() < 0.3 ? pick(ASSESSORIA_OPTIONS.slice(1)) : "Não participa",
            perguntaFederadoCBAt: rng() < 0.12 ? "Sim" : "Não",
            perguntaGrupoPace: pick(GRUPO_PACE_OPTIONS),
            perguntaEquipeRevezamento: participaRevezamento ? "Sim" : "Não",
            perguntaFuncaoRevezamento: participaRevezamento ? pick(FUNCAO_REVEZAMENTO_OPTIONS.slice(1)) : "Não participa",
            perguntaRetiradaKitTerceiros: rng() < 0.2 ? "Sim" : "Não",
            perguntaMedicacaoContinua: rng() < 0.15 ? "Sim" : "Não",
            perguntaDoencaPreExistente: rng() < 0.08 ? "Sim" : "Não",
            perguntaPeso: `${Math.floor(rng() * 40 + 50)} kg`,
            perguntaNumeracaoCalcado: String(Math.floor(rng() * 13 + 34)),
        };

        rows.push({
            id: `${pad(Math.floor(rng() * 9e7), 8)}-${pad(Math.floor(rng() * 9000), 4)}-4${pad(Math.floor(rng() * 900), 3)}-${pad(Math.floor(rng() * 9000), 4)}`,
            sessaoId: SESSAO_ID,
            dataCriacao: fmtDateTime(created),
            ultimaAtualizacao: fmtDateTime(updated),
            status,
            nomeIngresso: distanciaProva,
            setor: categoriaCompeticao,
            modalidade,
            lote,
            comprador: nome,
            tipoDocumentoComprador,
            cpf,
            telefone,
            email,
            dataNascimentoComprador,
            canal,
            tipoPagamento,
            estado: local.estado,
            cidade: local.cidade,
            operadorVendas: isPdv ? pick(OPERADORES) : "—",
            valor,
            valorUnitario: tipo.valor,
            cupom: cupomDef?.cupom ?? "—",
            valorDesconto,
            valorFinal,
            qtdItem,
            passkey: temPasskey ? pick(PASSKEYS) : "—",
            pdv: isPdv,
            bundle: false,
            bundleDinamico: false,
            itemCodigo: `IT-${pad(Math.floor(rng() * 9999), 4)}`,
            idInscricao: `INS-${pad(Math.floor(rng() * 999999), 6)}`,
            atletaNome,
            atletaTipoDocumento,
            atletaDocumento,
            atletaEmail,
            atletaTelefone,
            atletaDataNascimento,
            grupoCompraEmGrupo: compraEmGrupo ? "Sim" : "Não",
            grupoNomeGrupo: compraEmGrupo ? `${pick(EQUIPE_PREFIXOS)} ${pick(SOBRENOMES)}` : "—",
            grupoLiderGrupo: compraEmGrupo ? nome : "—",
            grupoTelefoneLider: compraEmGrupo ? telefone : "—",
            grupoEmailLider: compraEmGrupo ? email : "—",
            grupoDocLider: compraEmGrupo ? tipoDocumentoComprador : "—",
            grupoNumDocLider: compraEmGrupo ? cpf : "—",
            grupoDataNascLider: compraEmGrupo ? dataNascimentoComprador : "—",
            ...perguntas,
        });
    }
    // Ordena do mais recente para o mais antigo (como uma lista de transações real).
    rows.sort((a, b) => (parseEventDate(b.dataCriacao)?.getTime() ?? 0) - (parseEventDate(a.dataCriacao)?.getTime() ?? 0));
    return rows;
})();

/** Dia (00:00) da transação mais recente do dataset — usado como "hoje" para o filtro
 * "Aprovados hoje", já que os dados são gerados numa janela fixa que pode não coincidir
 * com a data real. */
const ULTIMO_DIA_MS = (() => {
    const d = parseEventDate(transacoes[0]?.dataCriacao ?? "");
    return d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() : 0;
})();
const isMesmoDia = (dataStr: string, diaMs: number): boolean => {
    const d = parseEventDate(dataStr);
    if (!d) return false;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() === diaMs;
};

/* ------------------------------------------------------------------ */
/*  Filtros — definição de campos (usada pelo slideout global)         */
/* ------------------------------------------------------------------ */

const ULTIMO_DIA_LABEL = (() => {
    const d = new Date(ULTIMO_DIA_MS);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
})();
const STATUS_OPTIONS = [
    { id: "Aprovados hoje", label: `Aprovados hoje (${ULTIMO_DIA_LABEL})` },
    ...Object.entries(STATUS_META).map(([, m]) => ({ id: m.label, label: m.label })),
];
const CANAL_OPTIONS = [
    { id: "Bilheteria", label: "Bilheteria" },
    { id: "Cortesia", label: "Cortesia" },
    { id: "Online", label: "Online" },
];
const TIPO_PRODUTO_OPTIONS = [
    { id: "Inscrição", label: "Inscrição" },
    { id: "Produto", label: "Produto" },
    { id: "Combo", label: "Combo" },
];
const MEIO_PAGAMENTO_OPTIONS = [
    { id: "Pix", label: "Pix" },
    { id: "Cartão de Crédito", label: "Cartão de Crédito" },
    { id: "Cartão de Débito", label: "Cartão de Débito" },
    { id: "Apple Pay", label: "Apple Pay" },
    { id: "Google Pay", label: "Google Pay" },
    { id: "Dinheiro", label: "Dinheiro" },
    { id: "Isento", label: "Isento" },
    { id: "Grátis", label: "Grátis" },
];

const FILTER_FIELDS: FilterFieldDef[] = [
    { id: "status", label: "Status", multi: { options: STATUS_OPTIONS } },
    { id: "meioPagamento", label: "Meio de pagamento", multi: { options: MEIO_PAGAMENTO_OPTIONS } },
    { id: "canal", label: "Canal", multi: { options: CANAL_OPTIONS } },
    { id: "tipoIngresso", label: "Tipo de produto", multi: { options: TIPO_PRODUTO_OPTIONS } },
    { id: "cupom", label: "Cupom", placeholder: "Buscar por um cupom específico" },
];

function getFieldValue(t: Transacao, field: string): string {
    switch (field) {
        case "status": {
            const base = STATUS_META[t.status].label;
            const aprovadoHoje = t.status === "aprovado" && isMesmoDia(t.dataCriacao, ULTIMO_DIA_MS);
            return aprovadoHoje ? `${base},Aprovados hoje` : base;
        }
        case "canal":
            return t.canal;
        case "meioPagamento":
            return t.tipoPagamento;
        case "email":
            return t.email;
        case "cpf":
            return t.cpf;
        case "passkey":
            return t.passkey;
        case "nomeComprador":
            return t.comprador;
        case "operador":
            return t.operadorVendas;
        case "setor":
            return t.setor;
        case "tipoIngresso":
            return t.nomeIngresso;
        case "idTransacao":
            return t.id;
        case "cupom":
            return t.cupom;
        default:
            return "";
    }
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function Transacoes() {
    return (
        <BackstageLayout activeSection="relatorios" activeItem="transacoes">
            <RelatorioFiltersProvider fields={FILTER_FIELDS} initialDateRange={PERIODO_PADRAO}>
                <div className="flex min-w-0 flex-1 flex-col">
                    <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
                        <RelatorioPageHeader title="Transações" />
                        <TransacoesBody />
                    </main>
                </div>
            </RelatorioFiltersProvider>
        </BackstageLayout>
    );
}

const TransacoesBody = () => {
    const { dateRange, sessao, filters } = useRelatorioFilters();

    const filtered = useMemo(() => {
        const validFilters = filters.filter((f) => f.field && f.value);
        return transacoes.filter((t) => {
            if (sessao !== "all" && t.sessaoId !== sessao) return false;
            if (!inDateRange(parseEventDate(t.dataCriacao), dateRange)) return false;
            if (!matchRow(t, validFilters, getFieldValue)) return false;
            return true;
        });
    }, [dateRange, sessao, filters]);

    const totalFinal = useMemo(() => filtered.reduce((s, t) => s + t.valorFinal, 0), [filtered]);

    const statusRows = useMemo<IngressoStatusRow[]>(() => {
        const order: StatusTransacao[] = ["aprovado", "pendente", "cancelado", "estornado", "reembolso"];
        return order
            .map((status) => {
                const rows = filtered.filter((t) => t.status === status);
                if (!rows.length) return null;
                const canais = new Set(rows.map((r) => r.canal));
                return {
                    id: status,
                    status,
                    canal: canais.size > 1 ? "Online + PDV" : [...canais][0],
                    totalIngressos: rows.reduce((s, r) => s + r.qtdItem, 0),
                    total: rows.reduce((s, r) => s + r.valorFinal, 0),
                };
            })
            .filter(Boolean) as IngressoStatusRow[];
    }, [filtered]);

    const meiosRows = useMemo<MeioPagamentoRow[]>(() => {
        const defs = [
            { id: "pix", nome: "Pix", icon: Bank, match: "Pix" },
            { id: "cartao", nome: "Cartão de Crédito", icon: CreditCard02, match: "Cartão de Crédito" },
        ];
        const totalTx = filtered.length || 1;
        const totalIng = filtered.reduce((s, r) => s + r.qtdItem, 0) || 1;
        const totalVal = filtered.reduce((s, r) => s + r.valorFinal, 0) || 1;
        return defs
            .map((d) => {
                const rows = filtered.filter((t) => t.tipoPagamento === d.match);
                if (!rows.length) return null;
                const qtdTx = rows.length;
                const qtdIng = rows.reduce((s, r) => s + r.qtdItem, 0);
                const val = rows.reduce((s, r) => s + r.valorFinal, 0);
                return {
                    id: d.id,
                    nome: d.nome,
                    icon: d.icon,
                    quantidadeTransacoes: qtdTx,
                    pctQtdTransacoes: qtdTx / totalTx,
                    quantidadeIngressos: qtdIng,
                    pctQtdIngressos: qtdIng / totalIng,
                    valor: val,
                    pctValor: val / totalVal,
                };
            })
            .filter(Boolean) as MeioPagamentoRow[];
    }, [filtered]);

    const chartData = useMemo<ChartPoint[]>(() => {
        const byDay = new Map<number, { d: Date; quantidade: number; total: number }>();
        for (const t of filtered) {
            const d = parseEventDate(t.dataCriacao);
            if (!d) continue;
            const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
            const acc = byDay.get(key) ?? { d: new Date(key), quantidade: 0, total: 0 };
            acc.quantidade += t.qtdItem;
            acc.total += t.valorFinal;
            byDay.set(key, acc);
        }
        return [...byDay.values()]
            .sort((a, b) => a.d.getTime() - b.d.getTime())
            .map((x) => ({ data: `${x.d.getDate()}/${x.d.getMonth() + 1}`, quantidade: x.quantidade, total: Math.round(x.total) }));
    }, [filtered]);

    return (
        <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <TotalTransacionadoCard total={totalFinal} />
            </div>
            <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
                <IngressosValorPorStatusCard rows={statusRows} />
                <MeioPagamentosCard rows={meiosRows} />
            </div>
            <TransacionadoChartCard
                data={chartData}
                title="Total transacionado e número de ingressos"
                subtitle="Distribuição diária de transações e ingressos vendidos"
            />
            <TransacionadoChartCard
                data={chartData}
                acumulado
                title="Total transacionado e número de ingressos acumulados"
                subtitle="Evolução acumulada de transações e ingressos vendidos"
            />
            <ListaTransacoesCard rows={filtered} />
        </>
    );
};

/* ------------------------------------------------------------------ */
/*  Total transacionado (big number)                                  */
/* ------------------------------------------------------------------ */

const TotalTransacionadoCard = ({ total }: { total: number }) => (
    <MetricsIcon03
        icon={CurrencyDollarCircle}
        title={currencyFormatter.format(total)}
        subtitle="Total transacionado"
        change={null}
        changeTrend="positive"
        actions={false}
        className="h-full [&_p+div]:hidden"
    />
);

/* ------------------------------------------------------------------ */
/*  Quantidade de ingressos e valor por status                        */
/* ------------------------------------------------------------------ */

const IngressosValorPorStatusCard = ({ rows }: { rows: IngressoStatusRow[] }) => {
    if (rows.length === 0) {
        return (
            <Card title="Quantidade de Ingressos e Valor por status">
                <div className="px-4 py-12 text-center text-sm text-tertiary">Nenhum status corresponde aos filtros.</div>
            </Card>
        );
    }
    const totalValor = rows.reduce((s, r) => s + r.total, 0);
    const pctOf = (v: number) => (totalValor === 0 ? 0 : Math.round((v / totalValor) * 100));
    return (
        <Card title="Quantidade de Ingressos e Valor por status">
            <div className="flex flex-col gap-6 px-4 py-5 md:px-5">
                {/* Barra horizontal segmentada por status (largura ∝ valor) */}
                <div className="flex w-full items-start gap-1">
                    {rows.map((row) => (
                        <div key={row.id} className="flex min-w-[52px] flex-col gap-1.5" style={{ flexGrow: row.total, flexBasis: 0 }}>
                            <div className="h-10 rounded-md" style={{ backgroundColor: STATUS_FILL[row.status] }} />
                            <span className="text-sm font-semibold text-secondary tabular-nums">{pctOf(row.total)}%</span>
                        </div>
                    ))}
                </div>

                {/* Tabela de itens */}
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-secondary">
                            <th className="py-2 pr-4 text-left text-sm font-semibold text-tertiary" />
                            <th className="px-4 py-2 text-right text-sm font-semibold text-tertiary">Total ingressos</th>
                            <th className="py-2 pl-4 text-right text-sm font-semibold text-tertiary">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary">
                        {rows.map((row) => (
                            <tr key={row.id}>
                                <td className="py-3 pr-4">
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ backgroundColor: STATUS_FILL[row.status] }} />
                                        <span className="shrink-0 text-sm font-semibold text-primary tabular-nums">{pctOf(row.total)}%</span>
                                        <span className="truncate text-sm text-secondary">{STATUS_META[row.status].label}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-medium text-primary tabular-nums">{numberFormatter.format(row.totalIngressos)}</td>
                                <td className="py-3 pl-4 text-right text-sm font-semibold text-primary tabular-nums">{currencyFormatter.format(row.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};


/* ------------------------------------------------------------------ */
/*  Meio de Pagamentos                                                */
/* ------------------------------------------------------------------ */

const MEIO_FILL: Record<string, string> = {
    pix: "var(--color-utility-green-500)",
    cartao: "var(--color-utility-blue-500)",
};

const MeioPagamentosCard = ({ rows }: { rows: MeioPagamentoRow[] }) => {
    if (rows.length === 0) {
        return (
            <Card title="Meio de Pagamentos">
                <div className="px-4 py-12 text-center text-sm text-tertiary">Nenhum meio corresponde aos filtros.</div>
            </Card>
        );
    }
    const fillFor = (id: string) => MEIO_FILL[id] ?? "var(--color-utility-gray-400)";
    const totalValor = rows.reduce((s, r) => s + r.valor, 0);
    const pctOf = (v: number) => (totalValor === 0 ? 0 : Math.round((v / totalValor) * 100));
    return (
        <Card title="Meio de Pagamentos">
            <div className="flex flex-col gap-6 px-4 py-5 md:px-5">
                {/* Barra horizontal segmentada por meio (largura ∝ valor) */}
                <div className="flex w-full items-start gap-1">
                    {rows.map((row) => (
                        <div key={row.id} className="flex min-w-[52px] flex-col gap-1.5" style={{ flexGrow: row.valor, flexBasis: 0 }}>
                            <div className="h-10 rounded-md" style={{ backgroundColor: fillFor(row.id) }} />
                            <span className="text-sm font-semibold text-secondary tabular-nums">{pctOf(row.valor)}%</span>
                        </div>
                    ))}
                </div>

                {/* Tabela de itens */}
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-secondary">
                            <th className="py-2 pr-4 text-left text-sm font-semibold text-tertiary" />
                            <th className="px-4 py-2 text-right text-sm font-semibold text-tertiary">Total ingressos</th>
                            <th className="py-2 pl-4 text-right text-sm font-semibold text-tertiary">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary">
                        {rows.map((row) => (
                            <tr key={row.id}>
                                <td className="py-3 pr-4">
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ backgroundColor: fillFor(row.id) }} />
                                        <span className="shrink-0 text-sm font-semibold text-primary tabular-nums">{pctOf(row.valor)}%</span>
                                        <span className="truncate text-sm text-secondary">{row.nome}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-medium text-primary tabular-nums">{numberFormatter.format(row.quantidadeIngressos)}</td>
                                <td className="py-3 pl-4 text-right text-sm font-semibold text-primary tabular-nums">{currencyFormatter.format(row.valor)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

/* ------------------------------------------------------------------ */
/*  Lista de transações                                               */
/* ------------------------------------------------------------------ */

/** Liga cada campo selecionável no modal "Editar colunas" à coluna correspondente da tabela —
 * a tabela nunca exibe uma coluna que o usuário não possa desmarcar. */
const COLUMN_FIELD_MAP: Partial<Record<string, keyof Transacao | "status">> = {
    pedido_id: "id",
    pedido_dataCriacao: "dataCriacao",
    pedido_ultimaAtualizacao: "ultimaAtualizacao",
    pedido_status: "status",
    pedido_formaPagamento: "tipoPagamento",
    pedido_canal: "canal",
    pedido_operadorVendas: "operadorVendas",
    pedido_comprador: "comprador",
    pedido_tipoDocumentoComprador: "tipoDocumentoComprador",
    pedido_documentoComprador: "cpf",
    pedido_emailComprador: "email",
    pedido_telefoneComprador: "telefone",
    pedido_dataNascimentoComprador: "dataNascimentoComprador",
    inscricao_categoria: "setor",
    inscricao_modalidade: "modalidade",
    pedido_idInscricao: "idInscricao",
    pedido_cupom: "cupom",
    pedido_passkey: "passkey",
    pedido_quantidade: "qtdItem",
    pedido_valorUnitario: "valorUnitario",
    pedido_valorDesconto: "valorDesconto",
    pedido_valorTotal: "valorFinal",
    inscricao_item: "itemCodigo",
    inscricao_lote: "lote",
    atleta_nome: "atletaNome",
    atleta_tipoDocumento: "atletaTipoDocumento",
    atleta_documento: "atletaDocumento",
    atleta_email: "atletaEmail",
    atleta_telefone: "atletaTelefone",
    atleta_dataNascimento: "atletaDataNascimento",
    grupo_compraEmGrupo: "grupoCompraEmGrupo",
    grupo_nomeGrupo: "grupoNomeGrupo",
    grupo_liderGrupo: "grupoLiderGrupo",
    grupo_telefoneLider: "grupoTelefoneLider",
    grupo_emailLider: "grupoEmailLider",
    grupo_docLider: "grupoDocLider",
    grupo_numDocLider: "grupoNumDocLider",
    grupo_dataNascLider: "grupoDataNascLider",
    pergunta_pace: "perguntaPace",
    pergunta_distanciaProva: "perguntaDistanciaProva",
    pergunta_tempoEstimado: "perguntaTempoEstimado",
    pergunta_jaCorreuProva: "perguntaJaCorreuProva",
    pergunta_categoriaParticipacao: "perguntaCategoriaParticipacao",
    pergunta_tamanhoCamisa: "perguntaTamanhoCamisa",
    pergunta_faixaEtaria: "perguntaFaixaEtaria",
    pergunta_convenioMedico: "perguntaConvenioMedico",
    pergunta_comoConheceuEvento: "perguntaComoConheceuEvento",
    pergunta_metaTempo: "perguntaMetaTempo",
    pergunta_anoInicioCorrida: "perguntaAnoInicioCorrida",
    pergunta_termoResponsabilidade: "perguntaTermoResponsabilidade",
    pergunta_contatoEmergencia: "perguntaContatoEmergencia",
    pergunta_melhorTempoPessoal: "perguntaMelhorTempoPessoal",
    pergunta_qtdParticipacoes: "perguntaQtdParticipacoes",
    pergunta_assessoriaEsportiva: "perguntaAssessoriaEsportiva",
    pergunta_federadoCBAt: "perguntaFederadoCBAt",
    pergunta_grupoPace: "perguntaGrupoPace",
    pergunta_equipeRevezamento: "perguntaEquipeRevezamento",
    pergunta_funcaoRevezamento: "perguntaFuncaoRevezamento",
    pergunta_retiradaKitTerceiros: "perguntaRetiradaKitTerceiros",
    pergunta_medicacaoContinua: "perguntaMedicacaoContinua",
    pergunta_doencaPreExistente: "perguntaDoencaPreExistente",
    pergunta_peso: "perguntaPeso",
    pergunta_numeracaoCalcado: "perguntaNumeracaoCalcado",
};
// Rótulos das colunas vêm do próprio export-fields.ts (fonte única de verdade), para
// nunca divergir do texto mostrado na gestão de colunas.
const EXPORT_FIELD_LABELS: Record<string, string> = Object.fromEntries(
    EXPORT_FIELD_GROUPS.flatMap((g) => g.fields.map((f) => [f.id, f.label] as const)),
);
const RIGHT_ALIGN_KEYS = new Set<keyof Transacao>(["qtdItem", "valorUnitario", "valorDesconto", "valorFinal"]);

/** Definição de coluna por campo — a ORDEM em que as colunas aparecem na tabela não vem
 * daqui, e sim da ordem de `selectedFields` (ver `visibleColumns`), que reflete tanto a
 * ordem canônica de COLUMN_FIELD_MAP quanto qualquer reordenação feita via drag and drop
 * no modal "Editar colunas". */
const COLUMN_BY_FIELD_ID = new Map(
    Object.entries(COLUMN_FIELD_MAP).map(([exportId, colKey]) => [
        exportId,
        {
            key: colKey as keyof Transacao | "status",
            label: EXPORT_FIELD_LABELS[exportId],
            align: RIGHT_ALIGN_KEYS.has(colKey as keyof Transacao) ? ("right" as const) : undefined,
        },
    ]),
);

const formatCpf = (cpf: string): string => cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
const formatTelefone = (telefone: string): string => {
    const match = telefone.match(/^\+55(\d{2})(\d{9})$/);
    if (!match) return telefone;
    const [, ddd, numero] = match;
    return `+55 (${ddd}) ${numero.slice(0, 5)}-${numero.slice(5)}`;
};

const CURRENCY_KEYS = new Set<keyof Transacao>(["valorUnitario", "valorDesconto", "valorFinal"]);
const DOCUMENTO_KEYS = new Set<keyof Transacao>(["cpf", "atletaDocumento", "grupoNumDocLider"]);
const TELEFONE_KEYS = new Set<keyof Transacao>(["telefone", "atletaTelefone", "grupoTelefoneLider"]);

const renderTransacaoCell = (row: Transacao, key: keyof Transacao | "status"): ReactNode => {
    if (key === "status") {
        const meta = STATUS_META[row.status];
        return <span className="font-medium text-primary">{meta.label}</span>;
    }
    const value = row[key];
    if (CURRENCY_KEYS.has(key as keyof Transacao)) return currencyFormatter.format(Number(value));
    if (key === "qtdItem") return numberFormatter.format(Number(value));
    if (DOCUMENTO_KEYS.has(key as keyof Transacao)) return formatCpf(String(value));
    if (TELEFONE_KEYS.has(key as keyof Transacao)) return formatTelefone(String(value));
    return String(value);
};

const SORT_ACCESSORS: Partial<Record<string, (t: Transacao) => string | number>> = {
    status: (t) => STATUS_META[t.status].label,
    dataCriacao: (t) => parseEventDate(t.dataCriacao)?.getTime() ?? 0,
    ultimaAtualizacao: (t) => parseEventDate(t.ultimaAtualizacao)?.getTime() ?? 0,
};

const ListaTransacoesCard = ({ rows }: { rows: Transacao[] }) => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [search, setSearch] = useState("");
    const [isManageColumnsOpen, setIsManageColumnsOpen] = useState(false);
    const [selectedFields, setSelectedFields] = useState<string[]>(DEFAULT_SELECTED);

    const visibleColumns = useMemo(
        () => selectedFields.map((fieldId) => COLUMN_BY_FIELD_ID.get(fieldId)).filter((col): col is NonNullable<typeof col> => Boolean(col)),
        [selectedFields],
    );

    const searched = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return rows;
        return rows.filter((t) =>
            [t.id, STATUS_META[t.status].label, t.setor, t.comprador, t.cpf, t.telefone, t.email].join(" ").toLowerCase().includes(term),
        );
    }, [rows, search]);

    const { sorted, sortKey, sortDir, toggleSort } = useSortableTable(
        searched as unknown as Record<string, unknown>[],
        SORT_ACCESSORS as Partial<Record<string, (r: Record<string, unknown>) => string | number>>,
    );

    useEffect(() => {
        setPage(1);
    }, [search, rows]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const visibleRows = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return (sorted as unknown as Transacao[]).slice(start, start + pageSize);
    }, [sorted, safePage, pageSize]);

    return (
        <Card
            title={
                <>
                    Lista de transações
                    <Badge size="sm" color="gray" type="pill-color">
                        {numberFormatter.format(sorted.length)}
                    </Badge>
                </>
            }
        >
            <div className="flex flex-col gap-3 border-b border-secondary px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                <Input
                    size="sm"
                    icon={SearchLg}
                    aria-label="Buscar transações"
                    placeholder="Buscar por ID, setor ou comprador"
                    value={search}
                    onChange={setSearch}
                    className="lg:max-w-xs lg:flex-1"
                />
                <div className="flex items-center gap-2">
                    <Button size="sm" color="secondary" iconLeading={Edit02} onClick={() => setIsManageColumnsOpen(true)}>
                        Editar colunas
                    </Button>
                    <ExportMenu
                        size="sm"
                        formats={["excel", "csv"]}
                        onExport={(f) => toast.success(`Exportando ${f.toUpperCase()}`, { description: "As transações serão exportadas." })}
                    />
                </div>
            </div>

            <ManageColumnsModal
                isOpen={isManageColumnsOpen}
                onClose={() => setIsManageColumnsOpen(false)}
                selected={selectedFields}
                onSelectedChange={setSelectedFields}
                onExport={(fields) => toast.success("Exportação concluída", { description: `${fields.length} colunas foram exportadas.` })}
            />

            <div className="max-h-[500px] overflow-x-auto overflow-y-auto">
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10 bg-secondary">
                        <tr className="border-b border-secondary bg-secondary text-left">
                            {visibleColumns.map((col) => (
                                <th key={String(col.key)} className={cx("whitespace-nowrap px-4 py-3 text-sm font-semibold text-tertiary", col.align === "right" && "text-right")}>
                                    <SortableHeader label={col.label} align={col.align} sortKey={String(col.key)} activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {visibleRows.length === 0 && (
                            <tr>
                                <td colSpan={visibleColumns.length} className="px-4 py-12 text-center text-sm text-tertiary">
                                    Nenhuma transação corresponde aos filtros aplicados.
                                </td>
                            </tr>
                        )}
                        {visibleRows.map((row, i) => (
                            <tr key={row.id} className={cx("transition duration-100 ease-linear hover:bg-primary_hover", i !== visibleRows.length - 1 && "border-b border-secondary")}>
                                {visibleColumns.map((col) => (
                                    <td key={String(col.key)} className={cx("whitespace-nowrap px-4 py-4 text-sm text-tertiary", col.align === "right" && "text-right", col.key === "id" && "font-mono text-sm text-secondary")}>
                                        {renderTransacaoCell(row, col.key)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <PaginationCardAdvanced
                page={safePage}
                total={totalPages}
                pageSize={pageSize}
                onPageChange={(p: number) => setPage(p)}
                onPageSizeChange={(size: number) => {
                    setPageSize(size);
                    setPage(1);
                }}
            />
        </Card>
    );
};

/* ------------------------------------------------------------------ */
/*  Shared primitives                                                 */
/* ------------------------------------------------------------------ */

const Card = ({ title, children, headerRight }: { title: ReactNode; children: ReactNode; headerRight?: ReactNode }) => (
    <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
        <header className="flex items-center justify-between gap-3 border-b border-secondary px-4 py-4">
            <h3 className="flex items-center gap-2 text-md font-semibold text-primary">{title}</h3>
            {headerRight}
        </header>
        {children}
    </section>
);
