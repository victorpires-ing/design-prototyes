import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
    ArrowLeft,
    ChevronLeft,
    Bank,
    FaceSmile,
    BankNote01,
    CalendarDate,
    CalendarPlus02,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    ClockFastForward,
    CoinsHand,
    Copy01,
    CreditCard02,
    CurrencyDollarCircle,
    Edit02,
    Gift02,
    Grid01,
    Hash02,
    Loading02,
    HelpCircle,
    Mail01,
    Passport,
    Phone01,
    RefreshCcw01,
    Sale03,
    Scales02,
    SearchLg,
    ShoppingBag01,
    ShoppingCart01,
    SlashCircle01,
    Tag01,
    Ticket01,
    User01,
    Wallet04,
    XClose,
} from "@untitledui/icons";
import {
    Dialog as AriaDialog,
    Focusable as AriaFocusable,
    Modal as AriaModal,
    ModalOverlay as AriaModalOverlay,
    Radio as AriaRadio,
    RadioGroup as AriaRadioGroup,
    Tooltip as AriaTooltip,
    TooltipTrigger as AriaTooltipTrigger,
} from "react-aria-components";
import { toast } from "sonner";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { RadioButton, RadioButtonBase, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { Select } from "@/components/base/select/select";
import { MetricsIcon03 } from "@/components/application/metrics/metrics";
import { PaginationCardAdvanced } from "@/components/application/pagination/pagination";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Tabs } from "@/components/application/tabs/tabs";
import { Input, InputBase } from "@/components/base/input/input";
import { InputGroup } from "@/components/base/input/input-group";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { DEFAULT_SELECTED, ManageColumnsModal } from "../components/ManageColumnsModal";
import { ExportMenu, RelatorioPageHeader } from "../components/RelatorioPageHeader";
import { RelatorioFiltersProvider, matchRow, inDateRange, useRelatorioFilters, type FilterFieldDef } from "../components/relatorio-filters";
import { SortableHeader } from "../components/SortableHeader";
import { TransacionadoChartCard, type ChartPoint } from "../components/TransacionadoChart";
import { useSortableTable } from "../utils/useSortableTable";
import { EVENT, currencyFormatter, numberFormatter, parseEventDate } from "../data/event";
import aguardandoPagamentoBg from "../assets/aguardando-pagamento-bg.png";
import { EVENTO, PERIODO_PADRAO } from "@/reports/event-dataset";
import { EXPORT_FIELD_GROUPS, type ExportFieldGroup } from "../data/export-fields";

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

// Status que impedem gerar vale-troca e editar respostas do ingresso — nesses status a ação
// simplesmente não aparece (sem botão desabilitado/tooltip).
const STATUS_SEM_VALE_TROCA_OU_EDICAO = new Set<StatusTransacao>(["reembolso", "estornado", "cancelado"]);

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
    perguntaMarcaTenis: string;
}

// Setores e tipos de ingresso derivados dos grupos do evento (src/reports).
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

// Preço mock por distância — usado para simular o valor do item ao trocar a seleção no
// autocomplete de "Item" durante a edição.
const ITEM_CATALOGO_PRECO_POR_DISTANCIA: Record<string, number> = {
    "5km": 80,
    "10km": 100,
    "15km": 120,
    "21km": 180,
    "42km": 250,
};

interface ItemCatalogoOpcao {
    id: string;
    label: string;
    dataProva: string;
    categoria: string;
    modalidade: string;
    distanciaProva: string;
    setor: string;
    valorUnitario: number;
}

// Datas da prova — a edição do item vira 3 selects em cadeia (data → categoria → modalidade),
// cada um só habilitado/preenchido depois do anterior; trocar a data reseta os outros dois.
const DATA_PROVA_OPTIONS = ["30/12/2026", "31/12/2026"];

// Restrição mock da dependência entre os selects: cada data libera um subconjunto de
// categorias, e cada categoria libera um subconjunto de distâncias (a modalidade final
// combina modalidade base + distância, como já era).
const CATEGORIAS_POR_DATA: Record<string, string[]> = {
    "30/12/2026": ["Feminino", "Masculino"],
    "31/12/2026": CATEGORIA_COMPETICAO_OPTIONS,
};
// Cobre todas as distâncias do mock (o gerador de transações escolhe categoria e distância de
// forma independente, então toda combinação precisa existir aqui para a edição vir pré-selecionada).
const DISTANCIAS_POR_CATEGORIA: Record<string, string[]> = {
    Feminino: DISTANCIA_PROVA_OPTIONS,
    Masculino: DISTANCIA_PROVA_OPTIONS,
    Idosos: DISTANCIA_PROVA_OPTIONS,
    PCD: DISTANCIA_PROVA_OPTIONS,
};

// Catálogo de itens da edição — gerado a partir da cadeia data → categoria → modalidade.
const ITEM_CATALOGO: ItemCatalogoOpcao[] = DATA_PROVA_OPTIONS.flatMap((dataProva) =>
    (CATEGORIAS_POR_DATA[dataProva] ?? []).flatMap((categoria) =>
        MODALIDADE_OPTIONS.flatMap((modalidadeBase) =>
            (DISTANCIAS_POR_CATEGORIA[categoria] ?? []).map((distancia) => {
                const modalidade = `${modalidadeBase} ${distancia}`;
                return {
                    id: `${dataProva}__${modalidadeBase}__${distancia}__${categoria}`,
                    label: `${modalidade} • ${categoria}`,
                    dataProva,
                    categoria,
                    modalidade,
                    distanciaProva: distancia,
                    setor: categoria,
                    valorUnitario: ITEM_CATALOGO_PRECO_POR_DISTANCIA[distancia] ?? 100,
                };
            }),
        ),
    ),
);
// Simulação de estoque no item — a data da prova não tem controle de estoque, só categoria e
// modalidade. Continuam selecionáveis mesmo esgotadas, mas exigem a confirmação "aumentar
// estoque" antes de poder atualizar (mesmo comportamento da marca de tênis no questionário).
// Taxa do produtor — simula um produtor que cadastrou uma taxa própria nas configurações do
// produto (nem todo produto tem). Quando cadastrada, é cobrada por cima do custo de edição.
const PRODUTOR_TEM_TAXA_CADASTRADA = true;
const TAXA_PRODUTOR_PERCENTUAL = 0.02;
const CATEGORIA_ESGOTADA = "PCD";
const MODALIDADE_ESGOTADA = "Corrida 42km";
const CAMISA_TAMANHOS = ["PP", "P", "M", "G", "GG", "XG"];
const TENIS_MARCAS = ["Nike", "Adidas", "Asics", "Mizuno", "Hoka", "New Balance", "Puma", "Olympikus"];
const EMAIL_DOMINIOS = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com"];
// E-mails com nome fixo na simulação de busca de portador (em vez de um nome aleatório).
const NOMES_POR_EMAIL: Record<string, string> = {
    "olivia.m@gmail.com": "Olívia Martins",
};
// Simulação de estoque: uma marca aparece esgotada no select, mas continua selecionável.
const TENIS_MARCA_ESGOTADA = "Mizuno";
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

const MESES_PT = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
/** "30/12/2026" -> "30 de dezembro de 2026 às 14:00" — mesmo formato usado no restante do
 * produto pra exibir data e horário de sessão. */
const formatDataSessaoLonga = (dataProva: string): string => {
    const [dia, mes, ano] = dataProva.split("/").map(Number);
    if (!dia || !mes || !ano) return dataProva;
    return `${dia} de ${MESES_PT[mes - 1]} de ${ano} às 14:00`;
};
/** "30/12/2026" -> "30/12/2026 às 14:00" — mesma sessão, formato numérico curto (usado nas
 * linhas de informação do item, onde o formato por extenso ocuparia espaço demais). */
const formatDataSessaoCurta = (dataProva?: string): string | undefined => (dataProva ? `${dataProva} às 14:00` : undefined);

/** Rola o ancestral com scroll até `target`, parando `offset`px antes do topo em vez de
 * encostar nele — scrollIntoView({block: "start"}) não tem uma opção de offset nativa. */
const scrollComOffsetDoTopo = (target: HTMLElement, offset = 24) => {
    const container = target.closest<HTMLElement>(".overflow-y-auto");
    if (!container) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
    }
    const delta = target.getBoundingClientRect().top - container.getBoundingClientRect().top - offset;
    container.scrollTo({ top: container.scrollTop + delta, behavior: "smooth" });
};

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

        const qtdItem = rng() < 0.82 ? 1 : rng() < 0.7 ? 2 : rng() < 0.7 ? 3 : 4;

        // Jogo único; vendas majoritariamente online. Bilheteria (PDV) usa dinheiro;
        // cortesias (isentas) entram como canal próprio.
        const isPdv = rng() < 0.01;
        const meio = isPdv ? { nome: "Dinheiro", peso: 1 } : pickWeighted(MEIOS_PAGAMENTO);
        const tipoPagamento = meio.nome;
        const isento = "isento" in meio && meio.isento === true;
        const canal = isento ? "Cortesia" : isPdv ? "Bilheteria" : "Online";
        const temPasskey = rng() < 0.08;

        // Produto comprado (mesmo para todos os itens do pedido — é o mesmo "carrinho").
        // O preço vem da mesma tabela usada na edição (ITEM_CATALOGO), pra "Valor pago"
        // sempre corresponder à modalidade de fato registrada.
        const distanciaProva = pick(DISTANCIA_PROVA_OPTIONS);
        const distanciaKm = { "5km": 5, "10km": 10, "15km": 15, "21km": 21, "42km": 42 }[distanciaProva] ?? 10;
        const modalidade = `${pick(MODALIDADE_OPTIONS)} ${distanciaProva}`;
        const valorUnitario = ITEM_CATALOGO_PRECO_POR_DISTANCIA[distanciaProva] ?? 100;

        const valor = isento ? 0 : valorUnitario * qtdItem;
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

        // Compra em grupo — só ~12% dos pedidos são de uma equipe; o comprador é o
        // responsável pelo pedido nesse modelo (não há sub-registros por integrante).
        const compraEmGrupo = rng() < 0.12;

        const lote = pickWeighted(LOTE_OPTIONS).lote;

        const pedidoId = `${pad(Math.floor(rng() * 9e7), 8)}-${pad(Math.floor(rng() * 9000), 4)}-4${pad(Math.floor(rng() * 900), 3)}-${pad(Math.floor(rng() * 9000), 4)}`;

        // Um registro por item do pedido — todos compartilham os dados do pedido acima
        // (id, comprador, pagamento, valores), mas cada um tem seu próprio atleta e
        // respostas de inscrição.
        for (let j = 0; j < qtdItem; j++) {
            // Dados do atleta — na maioria das vezes é quem comprou; ~15% das inscrições são
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

            // Perguntas (formulário de inscrição de corrida de rua) — próprias de cada atleta.
            const jaCorreuProva = rng() < 0.55;
            const paceMin = 4 + rng() * 3; // 4:00–7:00 min/km
            const participaRevezamento = rng() < 0.1;
            const categoriaCompeticao = pick(CATEGORIA_COMPETICAO_OPTIONS);
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
                perguntaContatoEmergencia: `${pick(LOCAIS).ddd}9${String(Math.floor(rng() * 9e7 + 1e7))}`,
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
                perguntaMarcaTenis: pick(TENIS_MARCAS),
            };

            rows.push({
                id: pedidoId,
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
                valorUnitario,
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

/** Um registro por ID de pedido (o primeiro encontrado) — cada pedido pode ter vários
 * itens (linhas) com os mesmos dados de pedido (valor, status, pagamento etc.) repetidos,
 * então totais em dinheiro/transação precisam somar por pedido, não por linha/item. */
const dedupePorPedido = (rows: Transacao[]): Transacao[] => {
    const seen = new Set<string>();
    const out: Transacao[] = [];
    for (const r of rows) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        out.push(r);
    }
    return out;
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

export function Transacoes3() {
    // Versão alternativa: editar um pedido não abre mais edição inline no slideout — em vez
    // disso, sai da lista inteira e mostra uma página única (ver EditarPedidoPage).
    const [pedidoEmEdicao, setPedidoEmEdicao] = useState<{ pedido: Transacao; itens: Transacao[] } | null>(null);
    // IDs de pedido com edição concluída pelo wizard — fica aqui (fora da lista) porque a
    // lista inteira desmonta enquanto o wizard está aberto; precisa sobreviver a isso pra
    // continuar mostrando "Em edição" na tabela ao voltar.
    const [pedidosEmEdicao, setPedidosEmEdicao] = useState<Set<string>>(new Set());
    const handlePedidoEmEdicaoChange = (pedidoId: string, emEdicao: boolean) => {
        setPedidosEmEdicao((prev) => {
            const jaTem = prev.has(pedidoId);
            if (emEdicao === jaTem) return prev;
            const next = new Set(prev);
            if (emEdicao) next.add(pedidoId);
            else next.delete(pedidoId);
            return next;
        });
    };

    if (pedidoEmEdicao) {
        return (
            <BackstageLayout activeSection="relatorios" activeItem="transacoes">
                <div className="flex min-w-0 flex-1 flex-col">
                    <main className="flex flex-1 flex-col gap-6 py-6 md:px-6">
                        <EditarPedidoPage
                            pedido={pedidoEmEdicao.pedido}
                            itens={pedidoEmEdicao.itens}
                            onSair={() => setPedidoEmEdicao(null)}
                            onPedidoEmEdicaoChange={handlePedidoEmEdicaoChange}
                        />
                    </main>
                </div>
            </BackstageLayout>
        );
    }

    return (
        <BackstageLayout activeSection="relatorios" activeItem="transacoes">
            <RelatorioFiltersProvider fields={FILTER_FIELDS} initialDateRange={PERIODO_PADRAO}>
                <div className="flex min-w-0 flex-1 flex-col">
                    <main className="flex flex-1 flex-col gap-6 py-6 md:px-6">
                        <RelatorioPageHeader title="Transações" />
                        <TransacoesBody
                            onAbrirEdicaoWizard={(pedido, itens) => setPedidoEmEdicao({ pedido, itens })}
                            pedidosEmEdicao={pedidosEmEdicao}
                        />
                    </main>
                </div>
            </RelatorioFiltersProvider>
        </BackstageLayout>
    );
}

const TransacoesBody = ({
    onAbrirEdicaoWizard,
    pedidosEmEdicao,
}: {
    onAbrirEdicaoWizard: (pedido: Transacao, itens: Transacao[]) => void;
    pedidosEmEdicao: Set<string>;
}) => {
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

    // Cada pedido pode ter várias linhas (uma por item) com os mesmos dados de pedido
    // repetidos — totais em dinheiro e contagem de transações somam por pedido (deduplicado),
    // enquanto contagem de inscrições/ingressos soma por linha (cada linha já é um item real).
    const pedidosFiltrados = useMemo(() => dedupePorPedido(filtered), [filtered]);

    const totalFinal = useMemo(() => pedidosFiltrados.reduce((s, t) => s + t.valorFinal, 0), [pedidosFiltrados]);

    const statusRows = useMemo<IngressoStatusRow[]>(() => {
        const order: StatusTransacao[] = ["aprovado", "pendente", "cancelado", "estornado", "reembolso"];
        return order
            .map((status) => {
                const itens = filtered.filter((t) => t.status === status);
                if (!itens.length) return null;
                const pedidos = dedupePorPedido(itens);
                const canais = new Set(pedidos.map((r) => r.canal));
                return {
                    id: status,
                    status,
                    canal: canais.size > 1 ? "Online + PDV" : [...canais][0],
                    totalIngressos: itens.length,
                    total: pedidos.reduce((s, r) => s + r.valorFinal, 0),
                };
            })
            .filter(Boolean) as IngressoStatusRow[];
    }, [filtered]);

    const meiosRows = useMemo<MeioPagamentoRow[]>(() => {
        const defs = [
            { id: "pix", nome: "Pix", icon: Bank, match: "Pix" },
            { id: "cartao", nome: "Cartão de Crédito", icon: CreditCard02, match: "Cartão de Crédito" },
        ];
        const totalTx = pedidosFiltrados.length || 1;
        const totalIng = filtered.length || 1;
        const totalVal = pedidosFiltrados.reduce((s, r) => s + r.valorFinal, 0) || 1;
        return defs
            .map((d) => {
                const itens = filtered.filter((t) => t.tipoPagamento === d.match);
                if (!itens.length) return null;
                const pedidos = dedupePorPedido(itens);
                const qtdTx = pedidos.length;
                const qtdIng = itens.length;
                const val = pedidos.reduce((s, r) => s + r.valorFinal, 0);
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
    }, [filtered, pedidosFiltrados]);

    const chartData = useMemo<ChartPoint[]>(() => {
        const byDay = new Map<number, { d: Date; quantidade: number; total: number }>();
        // Quantidade: cada linha já é um item real, conta 1 a 1.
        for (const t of filtered) {
            const d = parseEventDate(t.dataCriacao);
            if (!d) continue;
            const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
            const acc = byDay.get(key) ?? { d: new Date(key), quantidade: 0, total: 0 };
            acc.quantidade += 1;
            byDay.set(key, acc);
        }
        // Valor: soma uma única vez por pedido, senão pedidos com vários itens contam em dobro.
        for (const t of pedidosFiltrados) {
            const d = parseEventDate(t.dataCriacao);
            if (!d) continue;
            const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
            const acc = byDay.get(key) ?? { d: new Date(key), quantidade: 0, total: 0 };
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
                title="Total transacionado e número de inscrições"
                subtitle="Distribuição diária de transações e inscrições vendidas"
            />
            <TransacionadoChartCard
                data={chartData}
                acumulado
                title="Total transacionado e número de inscrições acumuladas"
                subtitle="Evolução acumulada de transações e inscrições vendidas"
            />
            <ListaTransacoesCard rows={filtered} onAbrirEdicaoWizard={onAbrirEdicaoWizard} pedidosEmEdicao={pedidosEmEdicao} />
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
            <Card title="Quantidade de Inscrições e Valor por status">
                <div className="px-4 py-12 text-center text-sm text-tertiary">Nenhum status corresponde aos filtros.</div>
            </Card>
        );
    }
    const totalValor = rows.reduce((s, r) => s + r.total, 0);
    const pctOf = (v: number) => (totalValor === 0 ? 0 : Math.round((v / totalValor) * 100));
    return (
        <Card title="Quantidade de Inscrições e Valor por status">
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
                            <th className="px-4 py-2 text-right text-sm font-semibold text-tertiary">Total inscrições</th>
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
                            <th className="px-4 py-2 text-right text-sm font-semibold text-tertiary">Total inscrições</th>
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
    pergunta_marcaTenis: "perguntaMarcaTenis",
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

// Máscara progressiva (sem código do país) para campos de telefone em edição — formata a cada
// dígito digitado, sempre reconstruída a partir dos dígitos crus guardados no estado.
const maskTelefoneLocal = (raw: string): string => {
    const d = raw.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const CURRENCY_KEYS = new Set<keyof Transacao>(["valor", "valorUnitario", "valorDesconto", "valorFinal"]);
const DOCUMENTO_KEYS = new Set<keyof Transacao>(["cpf", "atletaDocumento", "grupoNumDocLider"]);
const TELEFONE_KEYS = new Set<keyof Transacao>(["telefone", "atletaTelefone", "grupoTelefoneLider"]);

const renderTransacaoCell = (row: Transacao, key: keyof Transacao | "status", emEdicao = false): ReactNode => {
    if (key === "status") {
        // Pedido com edição pendente sobrepõe o status real na tabela — o status verdadeiro
        // continua intacto em row.status pros agregados do dashboard não serem afetados.
        if (emEdicao) {
            return (
                <BadgeWithDot size="sm" type="pill-color" color="purple">
                    Em edição
                </BadgeWithDot>
            );
        }
        const meta = STATUS_META[row.status];
        return (
            <BadgeWithDot size="sm" type="pill-color" color={meta.color}>
                {meta.label}
            </BadgeWithDot>
        );
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

type ModoTabela = "item" | "transacao";

// Modo "Transação" agrupa os itens pelo ID do pedido — hoje cada pedido já tem um único
// item no mock, então o agrupamento é 1:1, mas a lógica já suporta múltiplos itens por
// pedido. As colunas aqui são fixas (não passam pelo "Editar colunas").
const TRANSACAO_MODE_COLUMNS: Array<{ key: keyof Transacao | "status"; label: string; align?: "right" }> = [
    { key: "id", label: "ID do pedido" },
    { key: "status", label: "Status" },
    { key: "comprador", label: "Informações do comprador" },
    { key: "valorFinal", label: "Valor final", align: "right" },
    { key: "canal", label: "Canal" },
    { key: "tipoPagamento", label: "Tipo de pagamento" },
    { key: "dataCriacao", label: "Data de criação" },
    { key: "ultimaAtualizacao", label: "Última atualização" },
    { key: "cupom", label: "Cupom" },
    { key: "valorDesconto", label: "Valor de desconto", align: "right" },
    { key: "valor", label: "Valor original", align: "right" },
    { key: "qtdItem", label: "Quantidade", align: "right" },
];

const TRANSACAO_MODE_ANCHOR_KEY = "id";
const TRANSACAO_MODE_DEFAULT_KEYS = ["id", "status", "comprador", "valorFinal", "qtdItem"];

// Universo de campos do "Editar colunas" do modo Transação — mesmo componente usado no modo
// Item (ManageColumnsModal), só que restrito às próprias colunas fixas do modo (nenhum campo
// de item entra aqui, e não há subgrupos porque são poucas colunas). Inclui o campo âncora
// ("id") na lista — igual a EXPORT_FIELD_GROUPS incluindo "pedido_id" — porque o modal usa
// esse mesmo `groups` para resolver o rótulo da linha travada ("ID do pedido"); é o próprio
// modal que o remove da lista de opções via `anchorFieldId`.
const TRANSACAO_COLUMN_GROUPS: ExportFieldGroup[] = [
    {
        id: "colunas",
        title: "Colunas",
        fields: TRANSACAO_MODE_COLUMNS.map((c) => ({ id: String(c.key), label: c.label })),
    },
];

const renderTransacaoModeCell = (row: Transacao, key: keyof Transacao | "status", emEdicao = false): ReactNode => {
    if (key === "comprador") {
        return (
            <div className="flex flex-col">
                <span className="font-medium text-primary">{row.comprador}</span>
                <span className="text-xs text-tertiary">{row.email}</span>
            </div>
        );
    }
    return renderTransacaoCell(row, key, emEdicao);
};

/** Mesmo visual do Tooltip compartilhado, mas com fundo #262626 — o componente do design
 * system não expõe essa cor por prop, e ele não deve ser editado a partir de um prototype, então
 * este é um tooltip à parte (react-aria-components puro) só para o tooltip de preço do rodapé. */
const TooltipFundoEscuro = ({ title, description, children }: { title: ReactNode; description?: ReactNode; children: ReactNode }) => (
    <AriaTooltipTrigger delay={300} closeDelay={0}>
        {children}
        <AriaTooltip offset={6} placement="top" className={({ isEntering, isExiting }) => cx(isEntering && "ease-out animate-in", isExiting && "ease-in animate-out")}>
            {({ isEntering, isExiting }) => (
                <div
                    className={cx(
                        "z-50 flex max-w-xs origin-(--trigger-anchor-point) flex-col items-start gap-1 rounded-lg bg-[#262626] px-3 shadow-lg will-change-transform",
                        description ? "py-3" : "py-2",
                        isEntering && "duration-150 ease-out animate-in fade-in zoom-in-95",
                        isExiting && "duration-150 ease-in animate-out fade-out zoom-out-95",
                    )}
                >
                    <span className="text-xs font-semibold text-white">{title}</span>
                    {description && <span className="text-xs font-medium text-tooltip-supporting-text">{description}</span>}
                </div>
            )}
        </AriaTooltip>
    </AriaTooltipTrigger>
);

/** Autocomplete feito à mão (busca + lista flutuando por cima, sem afetar a altura do card) —
 * o Select.ComboBox do design system posiciona o dropdown errado (canto superior esquerdo da
 * tela) dentro deste card com scroll, então a lista fica com position absolute própria em vez
 * de depender do popover flutuante dele. */
const AutocompleteInline = ({
    icon: Icon,
    label,
    placeholder,
    items,
    selectedId,
    onSelect,
    isDisabled = false,
    isInvalid = false,
    esgotado,
    dropdownClassName,
}: {
    icon?: typeof CalendarDate;
    /** Rótulo exibido acima do campo (mesmo padrão do Input/Select do design system). */
    label?: string;
    placeholder: string;
    items: { id: string; label: string; preco?: number }[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    isDisabled?: boolean;
    isInvalid?: boolean;
    /** Rótulo que aparece marcado como "Esgotado" na lista — continua selecionável. */
    esgotado?: string;
    /** Sobrepõe o posicionamento/largura padrão do dropdown (que por padrão fica do mesmo
     * tamanho do campo) — útil quando o campo é estreito mas as opções têm texto longo (ex.:
     * modalidade, que mostra nome + preço). */
    dropdownClassName?: string;
}) => {
    const [busca, setBusca] = useState("");
    const [aberto, setAberto] = useState(false);
    const [ativa, setAtiva] = useState(-1);
    const selecionado = items.find((i) => i.id === selectedId);
    const filtrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return termo ? items.filter((i) => i.label.toLowerCase().includes(termo)) : items;
    }, [items, busca]);
    useEffect(() => {
        setAtiva(-1);
    }, [filtrados]);

    const selecionar = (id: string) => {
        onSelect(id);
        setBusca("");
        setAberto(false);
        setAtiva(-1);
    };

    return (
        <div className="flex flex-col gap-1.5">
            {label && <span className="text-sm font-medium text-secondary">{label}</span>}
            <div className="relative">
                <Input
                    size="sm"
                    icon={Icon}
                    inputClassName="pr-8"
                    placeholder={placeholder}
                    isDisabled={isDisabled}
                    isInvalid={isInvalid}
                    value={aberto ? busca : (selecionado?.label ?? "")}
                    onChange={(v) => {
                        setBusca(v);
                        setAberto(true);
                    }}
                    onFocus={() => {
                        setBusca("");
                        setAberto(true);
                    }}
                    onBlur={() => setTimeout(() => setAberto(false), 150)}
                    onKeyDown={(e) => {
                        const listaAberta = aberto && filtrados.length > 0;
                        if (e.key === "Enter") {
                            if (listaAberta && ativa >= 0) {
                                e.preventDefault();
                                selecionar(filtrados[ativa].id);
                            }
                            return;
                        }
                        if (!listaAberta) return;
                        if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setAtiva((i) => (i + 1) % filtrados.length);
                        } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setAtiva((i) => (i <= 0 ? filtrados.length - 1 : i - 1));
                        } else if (e.key === "Escape") {
                            setAberto(false);
                        }
                    }}
                />
                <ChevronDown
                    className={cx("pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-quaternary", isDisabled && "opacity-50")}
                    aria-hidden="true"
                />
                {aberto && (
                    <div
                        className={cx(
                            "absolute top-full z-20 mt-1 flex max-h-56 flex-col gap-0.5 overflow-y-auto rounded-lg bg-primary p-1 shadow-lg ring-1 ring-border-secondary",
                            dropdownClassName ?? "inset-x-0",
                        )}
                    >
                        {filtrados.map((opt, i) => (
                            <button
                                key={opt.id}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => selecionar(opt.id)}
                                onMouseEnter={() => setAtiva(i)}
                                className={cx(
                                    "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition duration-100 ease-linear",
                                    i === ativa ? "bg-primary_hover text-primary" : opt.id === selectedId ? "font-medium text-primary" : "text-secondary hover:bg-primary_hover",
                                )}
                            >
                                <span>{opt.label}</span>
                                <span className="flex shrink-0 items-center gap-2 text-xs text-tertiary">
                                    {opt.preco != null && <span>{currencyFormatter.format(opt.preco)}</span>}
                                    {opt.label === esgotado && <span>Esgotado</span>}
                                </span>
                            </button>
                        ))}
                        {filtrados.length === 0 && <p className="px-2 py-3 text-center text-sm text-tertiary">Nenhuma opção encontrada.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

/** Linha "ícone + rótulo à esquerda, valor à direita" — usada em todas as seções de
 * detalhe do slideout de transação (dados do comprador/compra, portador do item). */
const IconInfoRow = ({
    icon: Icon,
    label,
    value,
    valorAnterior,
    isEmail = false,
    isMono = false,
    loading = false,
}: {
    icon: typeof User01;
    label: string;
    value: string;
    /** Valor de antes da última edição salva — some sozinho quando o item muda. */
    valorAnterior?: string;
    isEmail?: boolean;
    isMono?: boolean;
    /** Enquanto "Atualizar" está com loading fake — mostra um shimmer no lugar do valor. */
    loading?: boolean;
}) => {
    const temAnterior = !loading && !!valorAnterior && valorAnterior !== value;
    return (
        <div className={cx("flex justify-between gap-3", temAnterior ? "items-start" : "items-center")}>
            <div className={cx("flex min-w-0 shrink-0 items-center gap-2 text-tertiary", temAnterior && "pt-px")}>
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="text-sm">{label}</span>
            </div>
            {loading ? (
                <div className="h-4 w-28 animate-pulse rounded bg-quaternary" />
            ) : (
                <div className="flex min-w-0 flex-col items-end">
                    <span className={cx("truncate text-right text-sm font-medium", isEmail ? "text-brand-secondary" : "text-primary", isMono && "font-mono")}>{value}</span>
                    {temAnterior && <span className="truncate text-right text-xs text-placeholder">Antes: {valorAnterior}</span>}
                </div>
            )}
        </div>
    );
};

/** Uma resposta do formulário de inscrição, num card próprio — mesmo padrão visual do
 * relatório de Questionários (pergunta em cinza, resposta em destaque). A edição fica
 * centralizada no botão "Editar" ao lado do título da seção, não por resposta. Quando a
 * última edição salva mudou esta resposta, mostra "anterior → nova" em vez de só a nova. */
const RespostaIngressoRow = ({ pergunta, resposta, respostaAnterior }: { pergunta: string; resposta: string; respostaAnterior?: string }) => (
    <div className="flex flex-col gap-2 rounded-lg bg-secondary p-3">
        <span className="text-sm text-tertiary">{pergunta}</span>
        <span className="text-sm font-medium text-secondary">
            {respostaAnterior && respostaAnterior !== resposta ? (
                <>
                    <span className="text-[#737373]">{respostaAnterior}</span> <span className="text-[#FF4A40]">→</span>{" "}
                    <span className="text-[#D4D4D4]">{resposta}</span>
                </>
            ) : (
                resposta
            )}
        </span>
    </div>
);

interface RespostasIngresso {
    perguntaMarcaTenis: string;
    perguntaContatoEmergencia: string;
    perguntaJaCorreuProva: string;
}

interface PortadorEditavel {
    nome: string;
    tipoDocumento: string;
    documento: string;
    email: string;
    telefone: string;
    dataNascimento: string;
}

/** Um item (inscrição) dentro do pedido, em accordion — mesmo padrão visual usado para
 * "Ingressos" no relatório de Questionários. Hoje sempre 1 item por pedido no mock, mas a
 * seção já lista todos os itens que compartilham o mesmo ID de pedido. */
const ItemDoPedidoAccordion = ({
    item,
    isOpen,
    onToggle,
    selecionavel = false,
    isSelected = false,
    onSelectChange,
    emTroca = false,
    onSalvarItemCatalogo,
    onGerarPagamento,
    modoEdicaoAtiva = false,
    salvarTodosNonce = 0,
    desfazerTodosNonce = 0,
    quemPagaGlobal,
    onAlteracaoChange,
    onExcedenteChange,
    onCustoTaxaChange,
}: {
    item: Transacao;
    isOpen: boolean;
    onToggle: () => void;
    selecionavel?: boolean;
    isSelected?: boolean;
    onSelectChange?: (checked: boolean) => void;
    emTroca?: boolean;
    /** Item/produto é dado do pedido (mesmo carrinho para todos os itens) — ao salvar uma nova
     * escolha aqui, o pai propaga modalidade/distância/categoria/valor para todos os itens. */
    onSalvarItemCatalogo?: (opcao: ItemCatalogoOpcao) => void;
    /** Link de pagamento é do pedido — o pai mostra o card "Aguardando pagamento" uma única
     * vez no topo do slideout, não dentro de cada item. */
    /** `prazoLimite` é o timestamp (epoch ms) em que o link expira — vira um timer regressivo. */
    onGerarPagamento?: (link: string, prazoLimite: number) => void;
    /** Acionado pelo botão "Editar" do rodapé — não existe mais gatilho por item, então este
     * item entra em edição sozinho quando o pai liga isso pra todos de uma vez. */
    modoEdicaoAtiva?: boolean;
    /** Incrementam a cada clique em "Salvar"/"Desfazer edições" no rodapé — disparam a ação
     * neste item só se ele estiver mesmo em edição. */
    salvarTodosNonce?: number;
    desfazerTodosNonce?: number;
    /** "Quem pagará pela edição?" é do pedido inteiro (uma escolha só, fora de cada item) —
     * o pai decide e cada item só lê o resultado pra saber como se salvar. */
    quemPagaGlobal?: "organizacao" | "comprador" | null;
    /** Avisa o pai sempre que este item passa a ter (ou deixa de ter) alterações não salvas —
     * usado pra desativar "Salvar e pagar" no rodapé quando nenhum item mudou nada ainda. */
    onAlteracaoChange?: (idInscricao: string, temAlteracao: boolean) => void;
    /** Avisa o pai o valor excedente da troca de modalidade deste item (0 se não houver troca
     * pendente) — somado ao custo de edição exibido no rodapé. */
    onExcedenteChange?: (idInscricao: string, excedente: number) => void;
    /** Avisa o pai os 5% da taxa de edição deste item, calculados sobre o valor final (o novo
     * item, se ele também foi alterado; senão o valor original) — somado ao custo do rodapé. */
    onCustoTaxaChange?: (idInscricao: string, custo: number) => void;
}) => {
    // Respostas do ingresso vivem em estado local (não no `item` vindo de fora): este é um
    // mock sem backend, então "salvar" só precisa fazer a edição parecer persistida enquanto
    // o accordion deste item continuar montado — reseta se o item mudar (troca de inscrição).
    const [respostas, setRespostas] = useState<RespostasIngresso>({
        perguntaMarcaTenis: item.perguntaMarcaTenis,
        perguntaContatoEmergencia: item.perguntaContatoEmergencia,
        perguntaJaCorreuProva: item.perguntaJaCorreuProva,
    });
    useEffect(() => {
        setRespostas({
            perguntaMarcaTenis: item.perguntaMarcaTenis,
            perguntaContatoEmergencia: item.perguntaContatoEmergencia,
            perguntaJaCorreuProva: item.perguntaJaCorreuProva,
        });
    }, [item.idInscricao]);

    // Portador vive em estado local pelo mesmo motivo das respostas — "Buscar" por e-mail
    // simula encontrar outra pessoa e substitui todos os dados do portador de uma vez.
    const portadorDoItem = (i: Transacao): PortadorEditavel => ({
        nome: i.atletaNome,
        tipoDocumento: i.atletaTipoDocumento,
        documento: i.atletaDocumento,
        email: i.atletaEmail,
        telefone: i.atletaTelefone,
        dataNascimento: i.atletaDataNascimento,
    });
    const [portador, setPortador] = useState<PortadorEditavel>(() => portadorDoItem(item));
    const [draftPortador, setDraftPortador] = useState<PortadorEditavel>(portador);
    useEffect(() => {
        setPortador(portadorDoItem(item));
    }, [item.idInscricao]);

    // Campo de busca do novo portador — sempre começa vazio (estado inicial da referência),
    // só é aplicado ao portador de fato quando "Atualizar" é clicado.
    const [novoEmailPortador, setNovoEmailPortador] = useState("");
    const [erroEmailPortador, setErroEmailPortador] = useState<string | null>(null);
    const [sugestoesEmailAbertas, setSugestoesEmailAbertas] = useState(false);
    // Índice destacado via teclado (seta pra cima/baixo) entre as sugestões de e-mail.
    const [sugestaoEmailAtiva, setSugestaoEmailAtiva] = useState(-1);
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Sugestões de domínio ao digitar "@" — mesmo padrão inline (sem popover flutuante) já
    // usado pra busca de item, pra não repetir o bug de posicionamento do Select.ComboBox
    // dentro deste card com scroll.
    const sugestoesEmail = useMemo(() => {
        const arroba = novoEmailPortador.indexOf("@");
        if (arroba === -1) return [];
        const usuario = novoEmailPortador.slice(0, arroba);
        const dominioDigitado = novoEmailPortador.slice(arroba + 1).toLowerCase();
        if (!usuario) return [];
        return EMAIL_DOMINIOS.filter((d) => d.startsWith(dominioDigitado) && d !== dominioDigitado).map((d) => `${usuario}@${d}`);
    }, [novoEmailPortador]);
    useEffect(() => {
        setSugestaoEmailAtiva(-1);
    }, [sugestoesEmail]);

    const selecionarSugestaoEmail = (sugestao: string) => {
        setNovoEmailPortador(sugestao);
        setErroEmailPortador(null);
        setSugestoesEmailAbertas(false);
        setSugestaoEmailAtiva(-1);
    };

    // Loading fake do botão "Atualizar" do portador (1,5s) — os campos abaixo (que vão
    // mudar) ficam com shimmer enquanto isso.
    const [salvandoEmail, setSalvandoEmail] = useState(false);

    const buscarPortador = () => {
        if (salvandoEmail) return;
        const email = novoEmailPortador.trim();
        if (!email) {
            setErroEmailPortador("Nenhum e-mail informado");
            return;
        }
        if (!EMAIL_REGEX.test(email)) {
            setErroEmailPortador("E-mail inválido, tente novamente");
            return;
        }
        setErroEmailPortador(null);
        setSalvandoEmail(true);
        setTimeout(() => {
            const nome =
                NOMES_POR_EMAIL[email.toLowerCase()] ??
                `${PRIMEIROS[Math.floor(Math.random() * PRIMEIROS.length)]} ${SOBRENOMES[Math.floor(Math.random() * SOBRENOMES.length)]}`;
            const tipoDocumento = Math.random() < 0.85 ? "CPF" : "Passaporte";
            const documento = String(Math.floor(Math.random() * 9e10 + 1e10));
            const ddd = LOCAIS[Math.floor(Math.random() * LOCAIS.length)].ddd;
            const telefone = `+55${ddd}9${String(Math.floor(Math.random() * 9e7 + 1e7))}`;
            const dataNascimento = fmtDate(new Date(1955 + Math.floor(Math.random() * 50), Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28)));
            setDraftPortador((d) => ({ ...d, email, nome, tipoDocumento, documento, telefone, dataNascimento }));
            setNovoEmailPortador("");
            setSalvandoEmail(false);
        }, 1500);
    };

    // Item é dado do pedido (mesmo carrinho pra todo mundo) — a opção escolhida aqui é
    // aplicada a todos os itens do pedido pelo pai (ver onSalvarItemCatalogo).
    const opcaoAtual = useMemo(
        () => ITEM_CATALOGO.find((o) => o.modalidade === item.modalidade && o.setor === item.setor) ?? null,
        [item.modalidade, item.setor],
    );

    // Edição do item em 3 selects encadeados (sessão → categoria → modalidade) — sempre começam
    // vazios (estado inicial da referência), mesmo já sendo uma edição; trocar a sessão reseta
    // categoria e modalidade; trocar a categoria reseta a modalidade.
    const [draftDataProva, setDraftDataProva] = useState<string | null>(null);
    const [draftCategoria, setDraftCategoria] = useState<string | null>(null);
    const [draftModalidade, setDraftModalidade] = useState<string | null>(null);

    const opcoesCategoria = useMemo(() => (draftDataProva ? (CATEGORIAS_POR_DATA[draftDataProva] ?? []) : []), [draftDataProva]);
    const opcoesModalidade = useMemo(
        () => (draftDataProva && draftCategoria ? ITEM_CATALOGO.filter((o) => o.dataProva === draftDataProva && o.categoria === draftCategoria) : []),
        [draftDataProva, draftCategoria],
    );

    // Erros de "campo obrigatório" ao clicar em "Atualizar" com algum dos 3 campos vazio.
    const [erroCamposItem, setErroCamposItem] = useState<{ sessao?: boolean; categoria?: boolean; modalidade?: boolean }>({});
    // Erros de "sem estoque" — mesma ideia, mas quando o campo preenchido está esgotado e
    // ainda não foi confirmado.
    const [erroEstoqueItem, setErroEstoqueItem] = useState<{ sessao?: boolean; categoria?: boolean; modalidade?: boolean }>({});
    // Confirmação "quero adicionar estoque" por campo do item — mesma ideia da marca de tênis.
    const [confirmaEstoqueItem, setConfirmaEstoqueItem] = useState<{ sessao?: boolean; categoria?: boolean; modalidade?: boolean }>({});
    const sessaoFieldRef = useRef<HTMLDivElement>(null);
    const categoriaFieldRef = useRef<HTMLDivElement>(null);
    const modalidadeFieldRef = useRef<HTMLDivElement>(null);
    // Loading fake do botão "Atualizar" do item (1,5s) — sessão/categoria/modalidade e os
    // valores abaixo (que vão mudar) ficam com shimmer enquanto isso.
    const [salvandoItem, setSalvandoItem] = useState(false);

    const handleChangeDataProva = (data: string) => {
        setDraftDataProva(data);
        setDraftCategoria(null);
        setDraftModalidade(null);
        setErroCamposItem({});
        setErroEstoqueItem({});
        setConfirmaEstoqueItem({});
    };
    const handleChangeCategoria = (categoria: string) => {
        setDraftCategoria(categoria);
        setDraftModalidade(null);
        setErroCamposItem((e) => ({ ...e, categoria: false }));
        setErroEstoqueItem({});
        setConfirmaEstoqueItem({});
    };

    const opcaoSelecionada = useMemo(
        () => ITEM_CATALOGO.find((o) => o.dataProva === draftDataProva && o.categoria === draftCategoria && o.modalidade === draftModalidade),
        [draftDataProva, draftCategoria, draftModalidade],
    );

    const handleClickAtualizarItem = () => {
        if (salvandoItem) return;
        if (!draftDataProva) {
            setErroCamposItem({ sessao: true });
            requestAnimationFrame(() => {
                if (sessaoFieldRef.current) scrollComOffsetDoTopo(sessaoFieldRef.current);
            });
            return;
        }
        if (!draftCategoria) {
            setErroCamposItem({ categoria: true });
            requestAnimationFrame(() => {
                if (categoriaFieldRef.current) scrollComOffsetDoTopo(categoriaFieldRef.current);
            });
            return;
        }
        if (!draftModalidade || !opcaoSelecionada) {
            setErroCamposItem({ modalidade: true });
            requestAnimationFrame(() => {
                if (modalidadeFieldRef.current) scrollComOffsetDoTopo(modalidadeFieldRef.current);
            });
            return;
        }
        if (draftCategoria === CATEGORIA_ESGOTADA && !confirmaEstoqueItem.categoria) {
            setErroEstoqueItem({ categoria: true });
            requestAnimationFrame(() => {
                if (categoriaFieldRef.current) scrollComOffsetDoTopo(categoriaFieldRef.current);
            });
            return;
        }
        if (draftModalidade === MODALIDADE_ESGOTADA && !confirmaEstoqueItem.modalidade) {
            setErroEstoqueItem({ modalidade: true });
            requestAnimationFrame(() => {
                if (modalidadeFieldRef.current) scrollComOffsetDoTopo(modalidadeFieldRef.current);
            });
            return;
        }
        setErroCamposItem({});
        setErroEstoqueItem({});
        setSalvandoItem(true);
        // Captura o "antes" já aqui (no clique do próprio "Atualizar" do item), em vez de
        // esperar o "Salvar e pagar" do rodapé — mais direto e evita depender de outro
        // recálculo posterior de opcaoAtual.
        const opcaoAnterior = opcaoAtual;
        setTimeout(() => {
            if (opcaoAnterior && opcaoSelecionada.id !== opcaoAnterior.id) {
                setItemAnterior(opcaoAnterior);
            }
            setItemAtualizado(opcaoSelecionada);
            setSalvandoItem(false);
        }, 1500);
    };

    const [editandoRespostas, setEditandoRespostas] = useState(false);
    const [draftRespostas, setDraftRespostas] = useState<RespostasIngresso>(respostas);
    // Confirmação "quero adicionar estoque" — só existe/importa quando a marca de tênis
    // selecionada está esgotada.
    const [confirmaEstoqueMarcaTenis, setConfirmaEstoqueMarcaTenis] = useState(false);
    const [erroEstoqueMarcaTenis, setErroEstoqueMarcaTenis] = useState(false);
    const marcaTenisFieldRef = useRef<HTMLDivElement>(null);
    // Único campo do questionário que pode ficar vazio de fato (os outros dois sempre têm
    // algum valor pré-selecionado) — obrigatório ao salvar.
    const [erroContatoEmergencia, setErroContatoEmergencia] = useState(false);
    const contatoEmergenciaFieldRef = useRef<HTMLDivElement>(null);
    // Item (produto) só é aplicado aos 3 campos abaixo e ao valor quando "Atualizar" é
    // clicado — mesma lógica do portador, nunca reflete a seleção ao vivo.
    const [itemAtualizado, setItemAtualizado] = useState<ItemCatalogoOpcao | null>(null);
    // Snapshot do item de antes do último salvamento — mostrado como texto secundário abaixo
    // do valor novo; some se o item mudar.
    const [itemAnterior, setItemAnterior] = useState<ItemCatalogoOpcao | null>(null);

    // Detecta se algo de fato mudou nesta edição (respostas, portador ou item) — o rodapé usa
    // isso pra manter "Salvar e pagar" desativado enquanto nada tiver sido alterado ainda.
    const temAlteracao = useMemo(() => {
        if (!editandoRespostas) return false;
        const respostasAlteradas = JSON.stringify(draftRespostas) !== JSON.stringify(respostas);
        const portadorAlterado = JSON.stringify(draftPortador) !== JSON.stringify(portador);
        const itemAlterado = !!itemAtualizado && itemAtualizado.id !== opcaoAtual?.id;
        return respostasAlteradas || portadorAlterado || itemAlterado;
    }, [editandoRespostas, draftRespostas, respostas, draftPortador, portador, itemAtualizado, opcaoAtual]);
    useEffect(() => {
        onAlteracaoChange?.(item.idInscricao, temAlteracao);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [temAlteracao]);

    // Valor exibido do item — reflete o rascunho ("Atualizar") enquanto edita, e o valor já
    // aplicado (via prop `item`, atualizada pelo pai) depois de salvo.
    const valorUnitarioExibido = editandoRespostas && itemAtualizado ? itemAtualizado.valorUnitario : item.valorUnitario;
    // Mesmo antes de salvar, já aponta o item anterior assim que o rascunho (após "Atualizar")
    // difere do item atual; depois de salvo, usa o snapshot persistido (ver handleClickAtualizarItem).
    const anteriorItem = editandoRespostas
        ? itemAtualizado && itemAtualizado.id !== opcaoAtual?.id
            ? opcaoAtual
            : undefined
        : itemAnterior;
    // "Valor pago" precisa ficar estável no preço original mesmo depois que `item.valorUnitario`
    // já reflete a nova modalidade (a troca é aplicada em todos os itens do pedido) — por isso
    // usa o snapshot de `anteriorItem`, não o `item` ao vivo, quando existe uma troca.
    const valorPago = (anteriorItem?.valorUnitario ?? item.valorUnitario) - item.valorDesconto / item.qtdItem;
    // Valor excedente de uma troca de modalidade pendente (0 se não houver troca) — mesma
    // conta mostrada no card "Valor excedente", mas reportada pro rodapé somar no custo total.
    const excedenteAtual = anteriorItem ? valorUnitarioExibido - valorPago : 0;
    useEffect(() => {
        onExcedenteChange?.(item.idInscricao, excedenteAtual);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [excedenteAtual]);

    // 5% da taxa de edição sobre o valor final deste item — se o item também foi trocado, usa
    // o valor do novo item; senão, usa o valor original (só o titular mudou, por exemplo).
    const custoTaxaAtual = temAlteracao ? valorUnitarioExibido - item.valorDesconto / item.qtdItem : 0;
    useEffect(() => {
        onCustoTaxaChange?.(item.idInscricao, custoTaxaAtual > 0 ? custoTaxaAtual * 0.05 : 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [custoTaxaAtual]);
    // Link de pagamento gerado ao salvar — some de novo se o item mudar ou se uma nova edição
    // começar. Só usado aqui para o badge "Em edição"; o card em si é mostrado uma vez só no
    // topo do slideout (ver TransacaoDetailsSlideOut).
    const [linkPagamento, setLinkPagamento] = useState<string | null>(null);
    // Snapshot das respostas de antes do último salvamento — usado só para mostrar
    // "anterior → nova" nos campos que de fato mudaram; some se o item mudar.
    const [respostasAnteriores, setRespostasAnteriores] = useState<RespostasIngresso | null>(null);
    // Snapshots de portador/item de antes do último salvamento — mostrados como texto
    // secundário abaixo do valor novo; somem se o item mudar.
    const [portadorAnterior, setPortadorAnterior] = useState<PortadorEditavel | null>(null);
    // Loading fake do botão "Salvar" (3s) — cancelável se o usuário sair da edição antes de terminar.
    const [salvando, setSalvando] = useState(false);
    const salvarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const limparTimeoutSalvar = () => {
        if (salvarTimeoutRef.current) {
            clearTimeout(salvarTimeoutRef.current);
            salvarTimeoutRef.current = null;
        }
        setSalvando(false);
    };

    useEffect(() => {
        setLinkPagamento(null);
        setRespostasAnteriores(null);
        setPortadorAnterior(null);
        setItemAnterior(null);
        limparTimeoutSalvar();
        return limparTimeoutSalvar;
    }, [item.idInscricao]);

    const iniciarEdicaoRespostas = () => {
        setDraftRespostas(respostas);
        setDraftPortador(portador);
        setNovoEmailPortador("");
        setErroEmailPortador(null);
        setSugestoesEmailAbertas(false);
        setDraftDataProva(null);
        setDraftCategoria(null);
        setDraftModalidade(null);
        setItemAtualizado(null);
        setErroCamposItem({});
        setErroEstoqueItem({});
        setConfirmaEstoqueItem({});
        setSalvandoItem(false);
        setSalvandoEmail(false);
        setConfirmaEstoqueMarcaTenis(false);
        setErroEstoqueMarcaTenis(false);
        setErroContatoEmergencia(false);
        setEditandoRespostas(true);
        setLinkPagamento(null);
    };

    // Não existe mais botão "Editar informações" por item — o rodapé liga a edição pra todos
    // de uma vez. Cada item ainda pode ser cancelado individualmente sem afetar os outros.
    useEffect(() => {
        if (modoEdicaoAtiva && !STATUS_SEM_VALE_TROCA_OU_EDICAO.has(item.status)) {
            iniciarEdicaoRespostas();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modoEdicaoAtiva]);
    const cancelarEdicaoRespostas = () => {
        limparTimeoutSalvar();
        setEditandoRespostas(false);
    };

    const efetivarSalvamento = () => {
        // Portador é aplicado na hora nos dois fluxos (só o banner de pagamento é exclusivo
        // das respostas do ingresso) — guarda o valor de antes pra mostrar como texto
        // secundário abaixo do novo, se algo mudou de fato. O item já guarda o próprio
        // "antes" no clique do seu "Atualizar" (ver handleClickAtualizarItem).
        if (JSON.stringify(draftPortador) !== JSON.stringify(portador)) setPortadorAnterior(portador);
        setPortador(draftPortador);
        if (itemAtualizado) onSalvarItemCatalogo?.(itemAtualizado);

        // Organização paga: aplica na hora, sem banner de pagamento nem antes/depois.
        if (quemPagaGlobal === "organizacao") {
            setRespostas(draftRespostas);
            setEditandoRespostas(false);
            setLinkPagamento(null);
            setRespostasAnteriores(null);
            toast.success("Respostas atualizadas", { description: "As respostas do ingresso foram atualizadas." });
            return;
        }

        // Comprador paga: só efetiva de fato após o pagamento — aqui mostramos o link e o
        // antes/depois já refletindo a mudança pendente, como preview do que vai valer.
        setRespostasAnteriores(respostas);
        setRespostas(draftRespostas);
        setEditandoRespostas(false);
        const link = `https://pagamento.ingresse.com/editar/${item.idInscricao}`;
        const prazoLimite = Date.now() + 48 * 60 * 60 * 1000;
        setLinkPagamento(link);
        onGerarPagamento?.(link, prazoLimite);
        toast.success("Pagamento gerado", { description: "As respostas do ingresso foram atualizadas e um novo pagamento foi gerado." });
    };

    // Valida os campos obrigatórios (estoque e contato de emergência vazio) antes de disparar
    // o loading fake de 3s do botão.
    const handleClickSalvar = () => {
        if (draftRespostas.perguntaMarcaTenis === TENIS_MARCA_ESGOTADA && !confirmaEstoqueMarcaTenis) {
            setErroEstoqueMarcaTenis(true);
            requestAnimationFrame(() => {
                if (marcaTenisFieldRef.current) scrollComOffsetDoTopo(marcaTenisFieldRef.current);
            });
            return;
        }
        if (!draftRespostas.perguntaContatoEmergencia.trim()) {
            setErroContatoEmergencia(true);
            requestAnimationFrame(() => {
                if (contatoEmergenciaFieldRef.current) scrollComOffsetDoTopo(contatoEmergenciaFieldRef.current);
            });
            return;
        }
        setErroEstoqueMarcaTenis(false);
        setErroContatoEmergencia(false);
        setSalvando(true);
        salvarTimeoutRef.current = setTimeout(() => {
            salvarTimeoutRef.current = null;
            setSalvando(false);
            efetivarSalvamento();
        }, 3000);
    };

    // "Salvar"/"Desfazer edições" do rodapé disparam em todos os itens de uma vez via nonce
    // (incrementa a cada clique). O ref começa no valor atual pra não disparar ação sozinho
    // quando o item é montado do zero (troca de pedido) já com um nonce antigo vindo do pai.
    const salvarTodosNonceRef = useRef(salvarTodosNonce);
    useEffect(() => {
        if (salvarTodosNonce !== salvarTodosNonceRef.current) {
            salvarTodosNonceRef.current = salvarTodosNonce;
            if (editandoRespostas) {
                // Só efetiva (e só ganha a tag "Em edição"/link de pagamento) quem de fato
                // mudou algo — os demais itens só saem do modo de edição, sem gerar nada.
                if (temAlteracao) handleClickSalvar();
                else setEditandoRespostas(false);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [salvarTodosNonce]);

    const desfazerTodosNonceRef = useRef(desfazerTodosNonce);
    useEffect(() => {
        if (desfazerTodosNonce !== desfazerTodosNonceRef.current) {
            desfazerTodosNonceRef.current = desfazerTodosNonce;
            if (editandoRespostas) cancelarEdicaoRespostas();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [desfazerTodosNonce]);

    // Ao abrir o item, rola até o topo dele — mesmo comportamento do "Editar" das respostas.
    const itemRootRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!isOpen) return;
        requestAnimationFrame(() => {
            if (itemRootRef.current) scrollComOffsetDoTopo(itemRootRef.current);
        });
    }, [isOpen]);

    // Modo de seleção (vale-troca): card sempre fechado, sem chevron — a linha inteira é
    // um botão que alterna a seleção, com o checkbox à direita só como indicador visual.
    if (selecionavel) {
        return (
            <button
                type="button"
                onClick={() => onSelectChange?.(!isSelected)}
                aria-pressed={isSelected}
                className={cx(
                    "flex w-full items-center gap-3 rounded-xl py-3 pr-6 pl-4 text-left ring-1 transition duration-100 ease-linear hover:bg-primary_hover",
                    isSelected ? "ring-brand" : "ring-border-secondary",
                )}
            >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-fg-secondary ring-1 ring-border-secondary">
                    <Ticket01 className="size-5" aria-hidden="true" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="line-clamp-2 text-sm font-semibold text-primary">
                        {item.modalidade} · {item.setor}
                    </span>
                    <span className="line-clamp-2 text-sm text-tertiary">de {item.atletaNome}</span>
                </div>
                <Checkbox isSelected={isSelected} className="pointer-events-none" aria-hidden="true" />
            </button>
        );
    }

    return (
    <div ref={itemRootRef} className="shrink-0 rounded-xl ring-1 ring-border-secondary">
        {/* Sem overflow-hidden no card — o arredondamento acompanha o estado (xl fechado,
         * t-xl aberto) em vez de depender de clipping pra não vazar quina quadrada. */}
        <div className={cx("flex w-full items-start bg-primary", isOpen ? "rounded-t-xl" : "rounded-xl")}>
            {/* Div[role=button] em vez de <button> porque o ícone de lápis abaixo (com tooltip)
             * é ele próprio um botão — <button> dentro de <button> é HTML inválido. */}
            <div
                role="button"
                tabIndex={0}
                onClick={onToggle}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onToggle();
                    }
                }}
                aria-expanded={isOpen}
                className={cx(
                    "flex min-w-0 flex-1 cursor-pointer items-start gap-3 px-4 py-3 text-left transition duration-100 ease-linear hover:bg-primary_hover",
                    isOpen ? "rounded-t-xl" : "rounded-xl",
                )}
            >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-fg-secondary ring-1 ring-border-secondary">
                    <Ticket01 className="size-5" aria-hidden="true" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="line-clamp-2 text-sm font-semibold text-primary">
                        {item.modalidade} · {item.setor}
                    </span>
                    <span className="line-clamp-2 text-sm text-tertiary">de {item.atletaNome}</span>
                </div>
                {emTroca && (
                    <BadgeWithDot size="sm" type="pill-color" color="indigo">
                        Em troca
                    </BadgeWithDot>
                )}
                {linkPagamento && (
                    <BadgeWithDot size="sm" type="pill-color" color="purple" className="self-center">
                        Em edição
                    </BadgeWithDot>
                )}
                {temAlteracao && (
                    <Tooltip title="Edições em andamento">
                        <TooltipTrigger className="flex items-center self-center text-fg-brand-primary">
                            <Edit02 className="size-4" aria-hidden="true" />
                        </TooltipTrigger>
                    </Tooltip>
                )}
                <ChevronDown aria-hidden="true" className={cx("mt-1 size-5 shrink-0 text-fg-quaternary transition-transform duration-150", isOpen && "rotate-180")} />
            </div>
        </div>

        {isOpen && (
            <div className="flex flex-col gap-6 border-t border-secondary p-4">
                <div className="flex flex-col gap-4">
                    <h4 className="text-sm font-semibold text-primary">Portador</h4>
                    {editandoRespostas && (
                        <div className="relative rounded-lg bg-secondary p-3">
                            <InputGroup
                                size="sm"
                                aria-label="E-mail do novo portador"
                                value={novoEmailPortador}
                                onChange={(v) => {
                                    setNovoEmailPortador(v);
                                    setErroEmailPortador(null);
                                }}
                                isInvalid={!!erroEmailPortador}
                                hint={erroEmailPortador}
                                trailingAddon={
                                    <Button
                                        size="sm"
                                        color="secondary"
                                        className="bg-[#171717]"
                                        isLoading={salvandoEmail}
                                        showTextWhileLoading
                                        onClick={buscarPortador}
                                    >
                                        {salvandoEmail ? "Atualizando..." : "Atualizar"}
                                    </Button>
                                }
                            >
                                <InputBase
                                    icon={Mail01}
                                    placeholder="E-mail do novo portador"
                                    onFocus={() => setSugestoesEmailAbertas(true)}
                                    onBlur={() => setTimeout(() => setSugestoesEmailAbertas(false), 150)}
                                    onKeyDown={(e) => {
                                        const listaAberta = sugestoesEmailAbertas && sugestoesEmail.length > 0;
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            if (listaAberta && sugestaoEmailAtiva >= 0) {
                                                selecionarSugestaoEmail(sugestoesEmail[sugestaoEmailAtiva]);
                                            } else {
                                                buscarPortador();
                                            }
                                            return;
                                        }
                                        if (!listaAberta) return;
                                        if (e.key === "ArrowDown") {
                                            e.preventDefault();
                                            setSugestaoEmailAtiva((i) => (i + 1) % sugestoesEmail.length);
                                        } else if (e.key === "ArrowUp") {
                                            e.preventDefault();
                                            setSugestaoEmailAtiva((i) => (i <= 0 ? sugestoesEmail.length - 1 : i - 1));
                                        } else if (e.key === "Escape") {
                                            setSugestoesEmailAbertas(false);
                                        }
                                    }}
                                />
                            </InputGroup>
                            {sugestoesEmailAbertas && sugestoesEmail.length > 0 && (
                                <div className="absolute inset-x-3 top-full z-20 mt-1 flex flex-col gap-0.5 rounded-lg bg-primary p-1 shadow-lg ring-1 ring-border-secondary">
                                    {sugestoesEmail.map((sugestao, i) => (
                                        <button
                                            key={sugestao}
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => selecionarSugestaoEmail(sugestao)}
                                            onMouseEnter={() => setSugestaoEmailAtiva(i)}
                                            className={cx(
                                                "rounded-md px-2 py-1.5 text-left text-sm transition duration-100 ease-linear",
                                                i === sugestaoEmailAtiva ? "bg-primary_hover text-primary" : "text-secondary hover:bg-primary_hover",
                                            )}
                                        >
                                            {sugestao}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex flex-col gap-4">
                        {(() => {
                            const p = editandoRespostas ? draftPortador : portador;
                            // Mesmo antes de salvar, já mostra o portador anterior assim que o
                            // rascunho (após "Atualizar") difere do portador atual.
                            const anterior = editandoRespostas
                                ? JSON.stringify(draftPortador) !== JSON.stringify(portador)
                                    ? portador
                                    : undefined
                                : portadorAnterior;
                            return (
                                <>
                                    <IconInfoRow icon={User01} label="Nome" value={p.nome} valorAnterior={anterior?.nome} loading={salvandoEmail} />
                                    <IconInfoRow
                                        icon={Passport}
                                        label="Documento"
                                        value={`${p.tipoDocumento} · ${formatCpf(p.documento)}`}
                                        valorAnterior={anterior ? `${anterior.tipoDocumento} · ${formatCpf(anterior.documento)}` : undefined}
                                        loading={salvandoEmail}
                                    />
                                    <IconInfoRow icon={Mail01} label="E-mail" value={p.email} isEmail valorAnterior={anterior?.email} loading={salvandoEmail} />
                                    <IconInfoRow
                                        icon={Phone01}
                                        label="Celular"
                                        value={formatTelefone(p.telefone)}
                                        valorAnterior={anterior ? formatTelefone(anterior.telefone) : undefined}
                                        loading={salvandoEmail}
                                    />
                                    <IconInfoRow
                                        icon={Gift02}
                                        label="Data de nascimento"
                                        value={p.dataNascimento}
                                        valorAnterior={anterior?.dataNascimento}
                                        loading={salvandoEmail}
                                    />
                                </>
                            );
                        })()}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <h4 className="text-sm font-semibold text-primary">Item</h4>
                    {editandoRespostas && (
                        <div className="flex flex-col gap-3 rounded-lg bg-secondary p-3">
                            {/* Selects em cadeia: sessão → categoria → modalidade. Trocar a sessão reseta
                             * categoria e modalidade; trocar a categoria reseta a modalidade. */}
                            <div ref={sessaoFieldRef} className="flex flex-col gap-1">
                                <AutocompleteInline
                                    icon={CalendarDate}
                                    placeholder="Selecione a sessão"
                                    items={DATA_PROVA_OPTIONS.map((d) => ({ id: d, label: formatDataSessaoCurta(d) ?? d }))}
                                    selectedId={draftDataProva}
                                    onSelect={handleChangeDataProva}
                                    isInvalid={erroCamposItem.sessao}
                                />
                                {erroCamposItem.sessao && <span className="text-sm text-error-primary">Campo obrigatório</span>}
                            </div>
                            <Tooltip title="Selecione o campo anterior para continuar" isDisabled={!!draftDataProva}>
                                <AriaFocusable>
                                    <div ref={categoriaFieldRef} className="flex flex-col gap-1">
                                        <AutocompleteInline
                                            icon={Grid01}
                                            placeholder="Selecione a categoria"
                                            items={opcoesCategoria.map((c) => ({ id: c, label: c }))}
                                            selectedId={draftCategoria}
                                            onSelect={handleChangeCategoria}
                                            isDisabled={!draftDataProva}
                                            isInvalid={erroCamposItem.categoria || erroEstoqueItem.categoria}
                                            esgotado={CATEGORIA_ESGOTADA}
                                        />
                                        {erroCamposItem.categoria && <span className="text-sm text-error-primary">Campo obrigatório</span>}
                                        {erroEstoqueItem.categoria && <span className="text-sm text-error-primary">Sem estoque, aumente ou troque a seleção</span>}
                                        {draftCategoria === CATEGORIA_ESGOTADA && (
                                            <div className="flex items-center gap-1.5">
                                                <Checkbox
                                                    label="Aumentar estoque para continuar"
                                                    isSelected={!!confirmaEstoqueItem.categoria}
                                                    onChange={(checked) => {
                                                        setConfirmaEstoqueItem((c) => ({ ...c, categoria: checked }));
                                                        if (checked) setErroEstoqueItem((e) => ({ ...e, categoria: false }));
                                                    }}
                                                />
                                                <Tooltip title="Atualmente esta opção não possui estoque, mas ao marcar este campo adicionaremos uma vaga ao salvar a edição">
                                                    <TooltipTrigger className="flex items-center text-fg-quaternary transition duration-100 ease-linear hover:text-fg-quaternary_hover">
                                                        <HelpCircle className="size-4" aria-hidden="true" />
                                                    </TooltipTrigger>
                                                </Tooltip>
                                            </div>
                                        )}
                                    </div>
                                </AriaFocusable>
                            </Tooltip>
                            <Tooltip title="Selecione o campo anterior para continuar" isDisabled={!!draftCategoria}>
                                <AriaFocusable>
                                    <div ref={modalidadeFieldRef} className="flex flex-col gap-1">
                                        <AutocompleteInline
                                            icon={Ticket01}
                                            placeholder="Selecione a modalidade"
                                            items={opcoesModalidade.map((o) => ({ id: o.id, label: o.modalidade, preco: o.valorUnitario }))}
                                            selectedId={opcaoSelecionada?.id ?? null}
                                            onSelect={(id) => {
                                                setDraftModalidade(opcoesModalidade.find((o) => o.id === id)?.modalidade ?? null);
                                                setErroCamposItem((e) => ({ ...e, modalidade: false }));
                                                setErroEstoqueItem((e) => ({ ...e, modalidade: false }));
                                                setConfirmaEstoqueItem((c) => ({ ...c, modalidade: false }));
                                            }}
                                            isDisabled={!draftCategoria}
                                            isInvalid={erroCamposItem.modalidade || erroEstoqueItem.modalidade}
                                            esgotado={MODALIDADE_ESGOTADA}
                                        />
                                        {erroCamposItem.modalidade && <span className="text-sm text-error-primary">Campo obrigatório</span>}
                                        {erroEstoqueItem.modalidade && <span className="text-sm text-error-primary">Sem estoque, aumente ou troque a seleção</span>}
                                        {draftModalidade === MODALIDADE_ESGOTADA && (
                                            <div className="flex items-center gap-1.5">
                                                <Checkbox
                                                    label="Aumentar estoque para continuar"
                                                    isSelected={!!confirmaEstoqueItem.modalidade}
                                                    onChange={(checked) => {
                                                        setConfirmaEstoqueItem((c) => ({ ...c, modalidade: checked }));
                                                        if (checked) setErroEstoqueItem((e) => ({ ...e, modalidade: false }));
                                                    }}
                                                />
                                                <Tooltip title="Atualmente esta opção não possui estoque, mas ao marcar este campo adicionaremos uma vaga ao salvar a edição">
                                                    <TooltipTrigger className="flex items-center text-fg-quaternary transition duration-100 ease-linear hover:text-fg-quaternary_hover">
                                                        <HelpCircle className="size-4" aria-hidden="true" />
                                                    </TooltipTrigger>
                                                </Tooltip>
                                            </div>
                                        )}
                                    </div>
                                </AriaFocusable>
                            </Tooltip>
                            <Button
                                size="sm"
                                color="secondary"
                                className="w-full bg-[#171717]"
                                isLoading={salvandoItem}
                                showTextWhileLoading
                                onClick={handleClickAtualizarItem}
                            >
                                {salvandoItem ? "Atualizando..." : "Atualizar"}
                            </Button>
                        </div>
                    )}
                    <div className="flex flex-col gap-4">
                        {(() => {
                            return (
                                <>
                                    <IconInfoRow
                                        icon={CalendarDate}
                                        label="Sessão"
                                        value={itemAtualizado?.dataProva ?? opcaoAtual?.dataProva ?? "—"}
                                        valorAnterior={anteriorItem?.dataProva}
                                        loading={salvandoItem}
                                    />
                                    <IconInfoRow
                                        icon={Hash02}
                                        label="Categoria"
                                        value={itemAtualizado?.categoria ?? item.setor}
                                        valorAnterior={anteriorItem?.categoria}
                                        loading={salvandoItem}
                                    />
                                    <IconInfoRow
                                        icon={Ticket01}
                                        label="Modalidade"
                                        value={itemAtualizado?.modalidade ?? item.modalidade}
                                        valorAnterior={anteriorItem?.modalidade}
                                        loading={salvandoItem}
                                    />
                                    <hr className="border-secondary" />
                                    {(() => {
                                        // Durante a edição (ou já com uma troca salva), o valor vira o trio
                                        // pago/nova modalidade/excedente. Fora disso, mantém como sempre foi.
                                        const emEdicaoOuSalvo = editandoRespostas || !!itemAnterior;
                                        if (emEdicaoOuSalvo) {
                                            return (
                                                <>
                                                    <IconInfoRow
                                                        icon={BankNote01}
                                                        label="Valor do item original"
                                                        value={currencyFormatter.format(valorPago)}
                                                        loading={salvandoItem}
                                                    />
                                                    <IconInfoRow
                                                        icon={Edit02}
                                                        label="Valor do novo item"
                                                        value={currencyFormatter.format(valorUnitarioExibido)}
                                                        loading={salvandoItem}
                                                    />
                                                    {!salvandoItem && (
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="flex items-center gap-2 text-tertiary">
                                                                <Scales02 className="size-4 shrink-0" aria-hidden="true" />
                                                                <span className="text-sm">Valor excedente</span>
                                                                <Tooltip title="É a diferença entre o valor pago inicialmente e o valor da nova modalidade. Caso a nova modalidade tenha o valor inferior, o comprador não será reembolsado, mas caso exceda, ele deverá pagar a diferença.">
                                                                    <TooltipTrigger className="flex items-center text-fg-quaternary transition duration-100 ease-linear hover:text-fg-quaternary_hover">
                                                                        <HelpCircle className="size-4" aria-hidden="true" />
                                                                    </TooltipTrigger>
                                                                </Tooltip>
                                                            </div>
                                                            <span className="text-sm font-medium text-primary">{currencyFormatter.format(excedenteAtual)}</span>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        }
                                        return (
                                            <>
                                                <IconInfoRow
                                                    icon={BankNote01}
                                                    label="Valor original"
                                                    value={currencyFormatter.format(valorUnitarioExibido)}
                                                    loading={salvandoItem}
                                                />
                                                <IconInfoRow icon={Tag01} label="Cupom ou passkey" value={item.cupom !== "—" ? item.cupom : item.passkey} />
                                                <IconInfoRow icon={Sale03} label="Valor do desconto" value={currencyFormatter.format(item.valorDesconto / item.qtdItem)} />
                                                <IconInfoRow
                                                    icon={CoinsHand}
                                                    label="Valor final"
                                                    value={currencyFormatter.format(valorUnitarioExibido - item.valorDesconto / item.qtdItem)}
                                                    loading={salvandoItem}
                                                />
                                            </>
                                        );
                                    })()}
                                </>
                            );
                        })()}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <h4 className="text-sm font-semibold text-primary">Respostas do questionário</h4>

                    {editandoRespostas ? (
                        <div className="flex flex-col gap-3 rounded-lg bg-secondary p-3">
                            <div ref={marcaTenisFieldRef} className="flex flex-col gap-3">
                                {/* Select.isInvalid só estiliza o hint, não a borda do próprio campo — como não dá
                                 * pra editar o design system, força a borda vermelha por seletor no botão interno. */}
                                <div className={erroEstoqueMarcaTenis ? "[&_button]:ring-2 [&_button]:ring-error" : undefined}>
                                    <Select
                                        size="sm"
                                        label={EXPORT_FIELD_LABELS["pergunta_marcaTenis"]}
                                        selectedKey={draftRespostas.perguntaMarcaTenis}
                                        onSelectionChange={(key) => {
                                            setDraftRespostas((d) => ({ ...d, perguntaMarcaTenis: String(key) }));
                                            setConfirmaEstoqueMarcaTenis(false);
                                            setErroEstoqueMarcaTenis(false);
                                        }}
                                        items={TENIS_MARCAS.map((m) => ({ id: m, label: m }))}
                                        isInvalid={erroEstoqueMarcaTenis}
                                    >
                                        {(opt) => (
                                            <Select.Item id={opt.id} supportingText={opt.id === TENIS_MARCA_ESGOTADA ? "Esgotado" : undefined}>
                                                {opt.label}
                                            </Select.Item>
                                        )}
                                    </Select>
                                </div>
                                {erroEstoqueMarcaTenis && <span className="text-sm text-error-primary">Sem estoque, aumente ou troque a seleção</span>}
                                {draftRespostas.perguntaMarcaTenis === TENIS_MARCA_ESGOTADA && (
                                    <div className="flex items-center gap-1.5">
                                        <Checkbox
                                            label="Aumentar estoque para continuar"
                                            isSelected={confirmaEstoqueMarcaTenis}
                                            onChange={(checked) => {
                                                setConfirmaEstoqueMarcaTenis(checked);
                                                if (checked) setErroEstoqueMarcaTenis(false);
                                            }}
                                        />
                                        <Tooltip title="Atualmente esta opção não possui estoque, mas ao marcar este campo adicionaremos uma vaga ao salvar a edição">
                                            <TooltipTrigger className="flex items-center text-fg-quaternary transition duration-100 ease-linear hover:text-fg-quaternary_hover">
                                                <HelpCircle className="size-4" aria-hidden="true" />
                                            </TooltipTrigger>
                                        </Tooltip>
                                    </div>
                                )}
                            </div>
                            <div ref={contatoEmergenciaFieldRef} className="flex flex-col gap-1">
                                <Input
                                    size="sm"
                                    type="tel"
                                    inputMode="numeric"
                                    label={EXPORT_FIELD_LABELS["pergunta_contatoEmergencia"]}
                                    value={maskTelefoneLocal(draftRespostas.perguntaContatoEmergencia)}
                                    onChange={(v) => {
                                        setDraftRespostas((d) => ({ ...d, perguntaContatoEmergencia: v.replace(/\D/g, "").slice(0, 11) }));
                                        setErroContatoEmergencia(false);
                                    }}
                                    isInvalid={erroContatoEmergencia}
                                />
                                {erroContatoEmergencia && <span className="text-sm text-error-primary">Campo obrigatório</span>}
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-sm font-medium text-secondary">{EXPORT_FIELD_LABELS["pergunta_jaCorreuProva"]}</span>
                                <RadioGroup
                                    aria-label={EXPORT_FIELD_LABELS["pergunta_jaCorreuProva"]}
                                    orientation="horizontal"
                                    className="flex-row gap-6"
                                    value={draftRespostas.perguntaJaCorreuProva}
                                    onChange={(value) => setDraftRespostas((d) => ({ ...d, perguntaJaCorreuProva: value }))}
                                >
                                    <RadioButton value="Sim" label="Sim" />
                                    <RadioButton value="Não" label="Não" />
                                </RadioGroup>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <RespostaIngressoRow
                                pergunta={EXPORT_FIELD_LABELS["pergunta_marcaTenis"]}
                                resposta={respostas.perguntaMarcaTenis}
                                respostaAnterior={respostasAnteriores?.perguntaMarcaTenis}
                            />
                            <RespostaIngressoRow
                                pergunta={EXPORT_FIELD_LABELS["pergunta_contatoEmergencia"]}
                                resposta={maskTelefoneLocal(respostas.perguntaContatoEmergencia)}
                                respostaAnterior={respostasAnteriores ? maskTelefoneLocal(respostasAnteriores.perguntaContatoEmergencia) : undefined}
                            />
                            <RespostaIngressoRow
                                pergunta={EXPORT_FIELD_LABELS["pergunta_jaCorreuProva"]}
                                resposta={respostas.perguntaJaCorreuProva}
                                respostaAnterior={respostasAnteriores?.perguntaJaCorreuProva}
                            />
                        </div>
                    )}
                </div>

                {/* Sem Cancelar/Salvar por item — a edição inteira agora é controlada pelo
                 * rodapé ("Editar" liga todos, "Salvar"/"Desfazer edições" agem em todos). */}
            </div>
        )}
    </div>
    );
};

/** Card de link de pagamento pendente — do pedido, não do item, então aparece uma única vez
 * no topo do slideout (logo abaixo do título) em vez de dentro de cada item. */
const AguardandoPagamentoCard = ({
    link,
    prazoLimite,
    onCopiar,
    semFundo = false,
}: {
    link: string;
    /** Timestamp (epoch ms) em que o link expira — vira um timer regressivo de 48h. */
    prazoLimite: number | null;
    onCopiar: () => void;
    /** Quando o card já está dentro de outra área com fundo próprio (ex.: o resumo da edição
     * em etapa única) — sem o wrapper bg-secondary/ring nem a imagem de fundo, fica direto na
     * área que já existe em vez de criar um card dentro de outro. */
    semFundo?: boolean;
}) => {
    // Feedback visual de 2s ao copiar — o botão vira "Copiado" com um check verde e volta
    // sozinho ao estado normal.
    const [copiado, setCopiado] = useState(false);
    const handleClickCopiar = () => {
        onCopiar();
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
    };

    // Timer regressivo (48h 00m contando pra baixo) em vez de mostrar a data-limite fixa.
    const [agora, setAgora] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setAgora(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);
    const restanteMs = Math.max(0, (prazoLimite ?? agora) - agora);
    const horasRestantes = Math.floor(restanteMs / 3_600_000);
    const minutosRestantes = Math.floor((restanteMs % 3_600_000) / 60_000);
    const timerFormatado = `${horasRestantes}h ${pad(minutosRestantes)}m`;

    const bloco = (
        <>
            <div className="flex flex-col gap-0.5">
                <span className="text-md font-medium text-primary">Aguardando pagamento</span>
                <span className="text-sm text-tertiary">
                    Conclua em <span className="font-semibold text-primary">{timerFormatado}</span> ou perderá os ajustes.
                </span>
            </div>
            <InputGroup
                size="sm"
                aria-label="Link de pagamento"
                value={link}
                isReadOnly
                onChange={() => {}}
                trailingAddon={
                    <Button
                        size="sm"
                        color="secondary"
                        className="bg-[#171717]"
                        iconLeading={copiado ? <CheckCircle data-icon className="text-fg-success-secondary" /> : Copy01}
                        onClick={handleClickCopiar}
                    >
                        {copiado ? "Copiado" : "Copiar"}
                    </Button>
                }
            >
                <InputBase wrapperClassName="bg-[#323232]" />
            </InputGroup>
        </>
    );
    const passos = [
        "O link já foi enviado ao comprador pelo WhatsApp. Se preferir, copie-o acima para compartilhar novamente.",
        "Aguarde o comprador pagar a taxa.",
        "Após a confirmação do pagamento, os ajustes serão aplicados automaticamente.",
    ];

    return (
        <div className={cx("flex flex-col gap-4", !semFundo && "rounded-lg bg-secondary p-3 ring-1 ring-border-secondary")}>
            {semFundo ? (
                <div className="flex flex-col gap-4">{bloco}</div>
            ) : (
                <div className="flex flex-col gap-4 rounded-lg bg-cover bg-center p-3" style={{ backgroundImage: `url(${aguardandoPagamentoBg})` }}>
                    {bloco}
                </div>
            )}
            <div className="flex flex-col gap-3">
                <span className="text-xs text-tertiary">Próximos passos:</span>
                <div className="flex flex-col gap-2">
                    {passos.map((passo, i) => (
                        <div key={passo} className="flex items-start gap-2">
                            <Badge size="sm" type="pill-color" color="gray" className="size-[22px] shrink-0 justify-center p-0">
                                {i + 1}
                            </Badge>
                            <span className="text-sm text-primary">{passo}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/** Card selecionável (ícone + título + descrição + radio) usado em "Quem pagará pela
 * edição?" — a resposta é do pedido inteiro, não de um item, então não usa o RadioButton
 * simples (que é feito pra linhas curtas de texto). */
const OpcaoQuemPagaCard = ({
    value,
    icon: Icon,
    titulo,
    descricao,
}: {
    value: "organizacao" | "comprador";
    icon: typeof Bank;
    titulo: string;
    descricao: string;
}) => (
    <AriaRadio
        value={value}
        className={({ isSelected, isFocusVisible }) =>
            cx(
                "flex flex-1 cursor-pointer flex-col items-center gap-3 rounded-xl p-4 text-center outline-focus-ring ring-1 ring-inset transition duration-100 ease-linear",
                isSelected ? "ring-2 ring-brand-600" : "ring-border-secondary hover:bg-primary_hover",
                isFocusVisible && "outline-2 outline-offset-2",
            )
        }
    >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg text-fg-secondary ring-1 ring-border-secondary">
            <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
            <span className="text-md font-semibold text-secondary">{titulo}</span>
            <span className="text-xs text-tertiary">{descricao}</span>
        </div>
    </AriaRadio>
);

const QuemPagaPelaEdicaoSecao = ({
    value,
    onChange,
    erro,
}: {
    value: "organizacao" | "comprador" | null;
    onChange: (value: "organizacao" | "comprador") => void;
    erro: boolean;
}) => (
    <div className="flex flex-col gap-4">
        <h3 className="text-md font-semibold text-primary">Quem pagará pela edição?</h3>
        <AriaRadioGroup
            aria-label="Quem pagará pela edição?"
            value={value}
            onChange={(v) => onChange(v as "organizacao" | "comprador")}
            className="flex flex-row gap-3"
        >
            <OpcaoQuemPagaCard
                value="organizacao"
                icon={Bank}
                titulo="A organização"
                descricao="O pagamento é debitado da organização e a edição é efetivada imediatamente"
            />
            <OpcaoQuemPagaCard
                value="comprador"
                icon={Bank}
                titulo="O comprador"
                descricao="Geraremos um pagamento. Após a confirmação, a edição será efetivada."
            />
        </AriaRadioGroup>
        {erro && <span className="text-sm text-error-primary">Selecione quem pagará pela edição</span>}
    </div>
);

const TransacaoDetailsSlideOut = ({
    isOpen,
    pedido,
    itens,
    onClose,
    onPedidoEmEdicaoChange,
    onAbrirEdicaoWizard,
    pedidosEmEdicao,
}: {
    isOpen: boolean;
    pedido: Transacao | null;
    itens: Transacao[];
    onClose: () => void;
    /** Avisa a tabela (que sobrevive ao fechar o slideout) quando este pedido passa a ter
     * (ou deixa de ter) uma edição com pagamento pendente, pra trocar o status exibido. */
    onPedidoEmEdicaoChange?: (pedidoId: string, emEdicao: boolean) => void;
    /** Versão alternativa (/transacoes3): "Editar" sai do slideout e abre a página com steps. */
    onAbrirEdicaoWizard: (pedido: Transacao, itens: Transacao[]) => void;
    /** IDs de pedido já editados pelo wizard — esconde o botão "Editar" pra eles também. */
    pedidosEmEdicao: Set<string>;
}) => {
    // Accordion single-open: abrir um item fecha o outro.
    const [itemAberto, setItemAberto] = useState<number | null>(null);
    // Modo de seleção de ingressos para gerar vale-troca — some as outras seções da tela.
    const [modoValeTroca, setModoValeTroca] = useState(false);
    const [itensSelecionados, setItensSelecionados] = useState<Set<string>>(new Set());
    const [erroSelecao, setErroSelecao] = useState(false);
    const [totalizadorAberto, setTotalizadorAberto] = useState(false);
    // Direção da transição entre a tela normal e a de seleção de vale-troca — usada para
    // decidir de que lado a animação de troca de tela entra.
    const [direcaoValeTroca, setDirecaoValeTroca] = useState<"avancar" | "voltar">("avancar");
    // Itens já confirmados num vale-troca (persiste depois de sair do modo de seleção,
    // até trocar de pedido) — ganham a tag "Em troca" e habilitam o banner/botão de atualizar.
    const [itensEmTroca, setItensEmTroca] = useState<Set<string>>(new Set());
    const trocaEmAndamento = itensEmTroca.size > 0;

    // Item é dado do pedido (mesmo carrinho pra todos os itens) — a troca feita editando um
    // item se aplica a todos os itens exibidos aqui, que já são só os do mesmo pedido.
    const [itemCatalogoOverride, setItemCatalogoOverride] = useState<ItemCatalogoOpcao | null>(null);
    const itensComCatalogo = useMemo(
        () =>
            itemCatalogoOverride
                ? itens.map((it) => ({
                      ...it,
                      modalidade: itemCatalogoOverride.modalidade,
                      nomeIngresso: itemCatalogoOverride.distanciaProva,
                      setor: itemCatalogoOverride.setor,
                      valorUnitario: itemCatalogoOverride.valorUnitario,
                  }))
                : itens,
        [itens, itemCatalogoOverride],
    );

    // Modo "Editar" do rodapé — estreita a visão pra mostrar só os itens (o comprador e os
    // dados da compra somem), mas a edição em si continua sendo por item, como já era.
    const [modoEdicaoItens, setModoEdicaoItens] = useState(false);
    // Nonces (incrementam a cada clique): disparam "salvar"/"desfazer" em todos os itens de
    // uma vez a partir do rodapé — cada item só reage se estiver de fato em edição.
    const [salvarTodosNonce, setSalvarTodosNonce] = useState(0);
    const [desfazerTodosNonce, setDesfazerTodosNonce] = useState(0);
    // Loading fake do botão "Salvar e pagar" do rodapé — mesma duração do "salvar" de cada
    // item (3s), pra terminar junto com eles antes de fechar o modo de edição.
    const [salvandoTodos, setSalvandoTodos] = useState(false);
    // Quais itens têm alguma alteração não salva — "Salvar e pagar" fica desativado enquanto
    // nenhum item tiver mudado nada (evita salvar/gerar pagamento à toa). Cada item conta como
    // 1 (o conjunto inteiro), não importa quantos campos dentro dele tenham sido editados.
    const [itensComAlteracao, setItensComAlteracao] = useState<Record<string, boolean>>({});
    const handleItemAlteracaoChange = (idInscricao: string, temAlteracao: boolean) => {
        setItensComAlteracao((prev) => (prev[idInscricao] === temAlteracao ? prev : { ...prev, [idInscricao]: temAlteracao }));
    };
    const idsItensEditados = useMemo(() => Object.entries(itensComAlteracao).filter(([, v]) => v).map(([id]) => id), [itensComAlteracao]);
    const algumaAlteracaoFeita = idsItensEditados.length > 0;
    // Valor excedente de troca de modalidade por item (0 quando não há troca pendente) —
    // somado ao custo de edição do rodapé.
    const [itensExcedente, setItensExcedente] = useState<Record<string, number>>({});
    const handleItemExcedenteChange = (idInscricao: string, excedente: number) => {
        setItensExcedente((prev) => (prev[idInscricao] === excedente ? prev : { ...prev, [idInscricao]: excedente }));
    };
    // 5% da taxa de edição por item — cada item já calcula sobre o próprio valor final (o novo
    // item, se ele também mudou; senão o original), reportado ao vivo, sem esperar o item
    // efetivar a troca no pedido inteiro.
    const [itensCustoTaxa, setItensCustoTaxa] = useState<Record<string, number>>({});
    const handleItemCustoTaxaChange = (idInscricao: string, custo: number) => {
        setItensCustoTaxa((prev) => (prev[idInscricao] === custo ? prev : { ...prev, [idInscricao]: custo }));
    };
    // Custo da edição exibido no rodapé — soma da taxa de cada item de fato editado mais
    // qualquer valor excedente de troca de modalidade.
    const valorEdicaoTotal = useMemo(() => {
        const custoPorItem = Object.values(itensCustoTaxa).reduce((acc, v) => acc + v, 0);
        const excedenteTotal = Object.values(itensExcedente).reduce((acc, v) => acc + v, 0);
        return custoPorItem + excedenteTotal;
    }, [itensCustoTaxa, itensExcedente]);
    const itensSecaoRef = useRef<HTMLDivElement>(null);
    // Conteúdo rolável do slideout inteiro — usado pra voltar ao topo depois de salvar.
    const conteudoSlideoutRef = useRef<HTMLDivElement>(null);
    // "Quem pagará pela edição?" é do pedido inteiro, escolhido uma vez fora de cada item.
    const [quemPagaGlobal, setQuemPagaGlobal] = useState<"organizacao" | "comprador" | null>(null);
    const [erroQuemPagaGlobal, setErroQuemPagaGlobal] = useState(false);
    const quemPagaGlobalRef = useRef<HTMLDivElement>(null);
    const iniciarEdicaoTodosItens = () => {
        setModoEdicaoItens(true);
        setQuemPagaGlobal(null);
        setErroQuemPagaGlobal(false);
        requestAnimationFrame(() => {
            if (itensSecaoRef.current) scrollComOffsetDoTopo(itensSecaoRef.current);
        });
    };

    // Link de pagamento pendente é do pedido, não do item — por isso mostrado uma única vez
    // no topo do slideout (logo abaixo do título), embora quem o gera seja a edição de um
    // item específico.
    const [linkPagamentoPedido, setLinkPagamentoPedido] = useState<string | null>(null);
    const [prazoEdicaoPedido, setPrazoEdicaoPedido] = useState<number | null>(null);
    const copiarLinkPagamentoPedido = async () => {
        if (!linkPagamentoPedido) return;
        try {
            await navigator.clipboard?.writeText(linkPagamentoPedido);
            toast.success("Link copiado", { description: "O link de pagamento foi copiado." });
        } catch {
            toast.success("Link de pagamento", { description: linkPagamentoPedido });
        }
    };
    const bannerPagamentoRef = useRef<HTMLDivElement>(null);
    const handleGerarPagamento = (link: string, prazoLimite: number) => {
        setLinkPagamentoPedido(link);
        setPrazoEdicaoPedido(prazoLimite);
        requestAnimationFrame(() => {
            if (bannerPagamentoRef.current) scrollComOffsetDoTopo(bannerPagamentoRef.current);
        });
    };
    // Avisa a tabela sempre que este pedido passa a ter (ou deixa de ter) pagamento pendente —
    // ela sobrevive ao fechar o slideout, então é quem mostra o status "Em edição" na linha.
    useEffect(() => {
        if (pedido) onPedidoEmEdicaoChange?.(pedido.id, !!linkPagamentoPedido);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [linkPagamentoPedido, pedido?.id]);

    // Reseta tudo ao trocar de pedido ou reabrir o slideout.
    useEffect(() => {
        setItemAberto(null);
        setModoValeTroca(false);
        setItensSelecionados(new Set());
        setErroSelecao(false);
        setTotalizadorAberto(false);
        setItensEmTroca(new Set());
        setItemCatalogoOverride(null);
        setModoEdicaoItens(false);
        setSalvandoTodos(false);
        setItensComAlteracao({});
        setItensExcedente({});
        setItensCustoTaxa({});
        setQuemPagaGlobal(null);
        setErroQuemPagaGlobal(false);
        setLinkPagamentoPedido(null);
        setPrazoEdicaoPedido(null);
    }, [isOpen, pedido?.id]);

    const VALE_TROCA_TAXA_PCT = 0.1;
    const itensSelecionadosList = itensComCatalogo.filter((it) => itensSelecionados.has(it.idInscricao));
    const valorBrutoValeTroca = itensSelecionadosList.reduce((s, it) => s + it.valorUnitario, 0);
    const valorTaxaValeTroca = valorBrutoValeTroca * VALE_TROCA_TAXA_PCT;
    const valorLiquidoValeTroca = valorBrutoValeTroca - valorTaxaValeTroca;

    const cancelarSelecaoValeTroca = () => {
        setDirecaoValeTroca("voltar");
        setModoValeTroca(false);
        setItensSelecionados(new Set());
        setErroSelecao(false);
        setTotalizadorAberto(false);
    };

    const toggleItemSelecionado = (idInscricao: string, checked: boolean) => {
        setErroSelecao(false);
        setItensSelecionados((prev) => {
            const next = new Set(prev);
            if (checked) next.add(idInscricao);
            else next.delete(idInscricao);
            return next;
        });
    };

    const confirmarGeracaoValeTroca = () => {
        if (itensSelecionados.size === 0) {
            // Atualizando um vale-troca existente e desmarcou todos os itens: em vez de barrar
            // com erro de seleção vazia, o CTA vira "Cancelar vale-troca" e essa ação cancela.
            if (itensEmTroca.size > 0) {
                setItensEmTroca(new Set());
                toast.success("Vale-troca cancelado", { description: "O vale-troca foi cancelado." });
                cancelarSelecaoValeTroca();
                return;
            }
            setErroSelecao(true);
            return;
        }
        toast.success(itensSelecionados.size === 1 ? "Vale-troca gerado" : "Vales-troca gerados", {
            description: `${currencyFormatter.format(valorLiquidoValeTroca)} gerados em vale-troca para ${itensSelecionados.size} ${itensSelecionados.size === 1 ? "ingresso" : "ingressos"}. O cancelamento deles acontecerá automaticamente.`,
        });
        setItensEmTroca(new Set(itensSelecionados));
        cancelarSelecaoValeTroca();
    };

    return (
    <AriaModalOverlay
        isOpen={isOpen}
        onOpenChange={(open) => {
            if (!open) onClose();
        }}
        isDismissable
        className="fixed inset-0 z-50 flex justify-end bg-overlay/40 outline-hidden"
    >
        <AriaModal
            className={({ isEntering, isExiting }) =>
                cx(
                    "h-full w-full max-w-[472px] bg-primary shadow-xl outline-hidden",
                    isEntering && "duration-300 ease-out animate-in slide-in-from-right",
                    isExiting && "duration-200 ease-in animate-out slide-out-to-right",
                )
            }
        >
            <AriaDialog className="flex h-full flex-col font-['Elza'] outline-hidden">
                <div
                    key={modoValeTroca ? "header-voucher" : "header-normal"}
                    className={cx(
                        "flex flex-col gap-1 border-b border-secondary px-6 pt-6 pb-4 duration-200 ease-out animate-in fade-in",
                        direcaoValeTroca === "avancar" ? "slide-in-from-right-4" : "slide-in-from-left-4",
                    )}
                >
                    {modoValeTroca ? (
                        <>
                            <div className="flex items-center justify-between gap-4">
                                <h2 className="text-lg font-semibold text-primary">Selecione os itens para troca</h2>
                                <ButtonUtility size="sm" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                            </div>
                            <p className="text-sm text-tertiary">
                                Os ingressos serão cancelados automaticamente após o uso do vale-troca.{" "}
                                <span className="font-semibold text-primary">Ver mais</span>
                            </p>
                            {erroSelecao && (
                                <p className="text-sm font-medium text-error-primary">Você deve selecionar ao menos um ingresso para gerar vale-troca</p>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-semibold text-primary">Transação</h2>
                                    {pedido &&
                                        (linkPagamentoPedido ? (
                                            <BadgeWithDot size="sm" type="pill-color" color="purple">
                                                Em edição
                                            </BadgeWithDot>
                                        ) : (
                                            <BadgeWithDot size="sm" type="pill-color" color={STATUS_META[pedido.status].color}>
                                                {STATUS_META[pedido.status].label}
                                            </BadgeWithDot>
                                        ))}
                                </div>
                                <ButtonUtility size="sm" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                            </div>
                            {pedido && <p className="text-sm text-tertiary">ID: {pedido.id}</p>}
                        </>
                    )}
                </div>

                <div ref={conteudoSlideoutRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-6 pb-6">
                    {pedido && (
                        <div
                            key={modoValeTroca ? "body-voucher" : "body-normal"}
                            className={cx(
                                "flex flex-col gap-8 duration-200 ease-out animate-in fade-in",
                                direcaoValeTroca === "avancar" ? "slide-in-from-right-4" : "slide-in-from-left-4",
                            )}
                        >
                            {!modoValeTroca && linkPagamentoPedido && (
                                <div ref={bannerPagamentoRef}>
                                    <AguardandoPagamentoCard link={linkPagamentoPedido} prazoLimite={prazoEdicaoPedido} onCopiar={copiarLinkPagamentoPedido} />
                                </div>
                            )}

                            {!modoValeTroca && (
                            <div className={cx("flex flex-col gap-8", modoEdicaoItens && "opacity-50")}>
                            <div className="flex flex-col gap-5">
                                <h3 className="text-md font-semibold text-primary">Dados do comprador</h3>
                                <div className="flex flex-col gap-4">
                                    <IconInfoRow icon={User01} label="Nome" value={pedido.comprador} />
                                    <IconInfoRow icon={Passport} label="Documento" value={`${pedido.tipoDocumentoComprador} · ${formatCpf(pedido.cpf)}`} />
                                    <IconInfoRow icon={Mail01} label="E-mail" value={pedido.email} isEmail />
                                    <IconInfoRow icon={Phone01} label="Celular" value={formatTelefone(pedido.telefone)} />
                                    <IconInfoRow icon={Gift02} label="Data de nascimento" value={pedido.dataNascimentoComprador} />
                                </div>
                            </div>

                            <div className="flex flex-col gap-5">
                                <h3 className="text-md font-semibold text-primary">Dados da compra</h3>
                                <div className="flex flex-col gap-4">
                                    <IconInfoRow icon={Hash02} label="Quantidade de itens" value={numberFormatter.format(pedido.qtdItem)} />
                                    <IconInfoRow icon={ShoppingBag01} label="Canal" value={pedido.canal} />
                                    <IconInfoRow icon={BankNote01} label="Valor original" value={currencyFormatter.format(pedido.valor)} />
                                    <IconInfoRow icon={Tag01} label="Cupom ou passkey" value={pedido.cupom !== "—" ? pedido.cupom : pedido.passkey} />
                                    <IconInfoRow icon={Sale03} label="Valor do desconto" value={currencyFormatter.format(pedido.valorDesconto)} />
                                    <IconInfoRow icon={CoinsHand} label="Valor final" value={currencyFormatter.format(pedido.valorFinal)} />
                                    <IconInfoRow icon={Wallet04} label="Tipo de pagamento" value={pedido.tipoPagamento} />
                                    <IconInfoRow icon={CalendarDate} label="Data de criação" value={pedido.dataCriacao} />
                                    <IconInfoRow icon={CalendarPlus02} label="Última atualização" value={pedido.ultimaAtualizacao} />
                                </div>
                            </div>
                            </div>
                            )}

                            {modoValeTroca ? (
                                <div className="flex flex-col gap-4">
                                    {itensComCatalogo.map((item, idx) => (
                                        <ItemDoPedidoAccordion
                                            key={item.idInscricao}
                                            item={item}
                                            isOpen={itemAberto === idx}
                                            onToggle={() => setItemAberto((prev) => (prev === idx ? null : idx))}
                                            selecionavel
                                            isSelected={itensSelecionados.has(item.idInscricao)}
                                            onSelectChange={(checked) => toggleItemSelecionado(item.idInscricao, checked)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div ref={itensSecaoRef} className="flex flex-col gap-8">
                                    {modoEdicaoItens && (
                                        <div ref={quemPagaGlobalRef}>
                                            <QuemPagaPelaEdicaoSecao
                                                value={quemPagaGlobal}
                                                onChange={(v) => {
                                                    setQuemPagaGlobal(v);
                                                    setErroQuemPagaGlobal(false);
                                                }}
                                                erro={erroQuemPagaGlobal}
                                            />
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-4">
                                        <h3 className="text-md font-semibold text-primary">Itens</h3>
                                        {itensComCatalogo.map((item, idx) => (
                                            <ItemDoPedidoAccordion
                                                key={item.idInscricao}
                                                item={item}
                                                isOpen={itemAberto === idx}
                                                onToggle={() => setItemAberto((prev) => (prev === idx ? null : idx))}
                                                emTroca={itensEmTroca.has(item.idInscricao)}
                                                onSalvarItemCatalogo={setItemCatalogoOverride}
                                                onGerarPagamento={handleGerarPagamento}
                                                modoEdicaoAtiva={modoEdicaoItens}
                                                salvarTodosNonce={salvarTodosNonce}
                                                desfazerTodosNonce={desfazerTodosNonce}
                                                quemPagaGlobal={quemPagaGlobal}
                                                onAlteracaoChange={handleItemAlteracaoChange}
                                                onExcedenteChange={handleItemExcedenteChange}
                                                onCustoTaxaChange={handleItemCustoTaxaChange}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {!modoValeTroca && trocaEmAndamento && (
                    <div className="flex flex-col gap-0.5 bg-secondary px-8 py-3">
                        <span className="text-sm text-secondary">Troca em andamento</span>
                        <span className="text-sm text-tertiary">
                            Oriente o cliente a acessar o evento com a conta usada na compra. O vale-troca será aplicado automaticamente.
                        </span>
                    </div>
                )}

                {modoValeTroca && (
                    <div className="flex flex-col gap-4 border-t border-secondary bg-secondary px-6 py-4">
                        <button
                            type="button"
                            onClick={() => setTotalizadorAberto((v) => !v)}
                            className="flex items-center justify-between gap-2"
                        >
                            <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                                Valor do vale-troca
                                {totalizadorAberto ? (
                                    <ChevronUp className="size-4 text-fg-quaternary" aria-hidden="true" />
                                ) : (
                                    <ChevronDown className="size-4 text-fg-quaternary" aria-hidden="true" />
                                )}
                            </span>
                            <span className="text-sm text-tertiary">{currencyFormatter.format(valorLiquidoValeTroca)}</span>
                        </button>
                        {totalizadorAberto && (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm text-tertiary">
                                        Valor bruto ({itensSelecionadosList.length} {itensSelecionadosList.length === 1 ? "ingresso" : "ingressos"})
                                    </span>
                                    <span className="text-sm font-medium text-secondary">{currencyFormatter.format(valorBrutoValeTroca)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm text-tertiary">Taxa de serviço (10%)</span>
                                    <span className="text-sm font-medium text-error-primary">- {currencyFormatter.format(valorTaxaValeTroca)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between gap-2 border-t border-secondary px-6 py-4">
                    <span
                        key={modoValeTroca ? "footer-left-voucher" : "footer-left-normal"}
                        className={cx(
                            "inline-flex duration-200 ease-out animate-in fade-in",
                            direcaoValeTroca === "avancar" ? "slide-in-from-right-4" : "slide-in-from-left-4",
                        )}
                    >
                        {modoValeTroca ? (
                            <Button size="sm" color="secondary" onClick={cancelarSelecaoValeTroca}>
                                Cancelar
                            </Button>
                        ) : modoEdicaoItens ? (
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="font-semibold text-primary">{currencyFormatter.format(valorEdicaoTotal)}</span>
                                    <TooltipFundoEscuro
                                        title="Como é calculado?"
                                        description={
                                            <div className="flex flex-col gap-3">
                                                <p>O custo da edição depende das alterações realizadas e das configurações definidas anteriormente. Ele pode incluir:</p>
                                                <ul className="flex flex-col gap-3">
                                                    <li className="flex items-start gap-2">
                                                        <span aria-hidden="true">•</span>
                                                        <span>
                                                            <span className="font-semibold">Taxa de edição:</span>{" "}
                                                            <span className="font-normal text-tertiary">
                                                                corresponde a 5% do valor das inscrições editadas no pedido e é sempre cobrada.
                                                            </span>
                                                        </span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span aria-hidden="true">•</span>
                                                        <span>
                                                            <span className="font-semibold">Valor definido pelo produtor:</span>{" "}
                                                            <span className="font-normal text-tertiary">
                                                                quando configurado na inscrição, é cobrado e repassado integralmente ao produtor.
                                                            </span>
                                                        </span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span aria-hidden="true">•</span>
                                                        <span>
                                                            <span className="font-semibold">Diferença de valor:</span>{" "}
                                                            <span className="font-normal text-tertiary">
                                                                se a nova modalidade custar mais, o comprador paga a diferença. Se custar menos, não haverá
                                                                reembolso.
                                                            </span>
                                                        </span>
                                                    </li>
                                                </ul>
                                            </div>
                                        }
                                    >
                                        <TooltipTrigger className="flex items-center text-fg-quaternary transition duration-100 ease-linear hover:text-fg-quaternary_hover">
                                            <HelpCircle className="size-4" aria-hidden="true" />
                                        </TooltipTrigger>
                                    </TooltipFundoEscuro>
                                </div>
                                <span className="text-xs text-tertiary">
                                    {idsItensEditados.length} {idsItensEditados.length === 1 ? "item editado" : "itens editados"}
                                </span>
                            </div>
                        ) : (
                            <Button size="sm" color="secondary" onClick={onClose}>
                                Voltar
                            </Button>
                        )}
                    </span>
                    <span
                        key={modoValeTroca ? "footer-right-voucher" : "footer-right-normal"}
                        className={cx(
                            "inline-flex duration-200 ease-out animate-in fade-in",
                            direcaoValeTroca === "avancar" ? "slide-in-from-right-4" : "slide-in-from-left-4",
                        )}
                    >
                        {modoValeTroca ? (
                            <Button size="sm" color="secondary" onClick={confirmarGeracaoValeTroca}>
                                {itensSelecionados.size === 0 && itensEmTroca.size > 0 ? "Cancelar vale-troca" : "Confirmar"}
                            </Button>
                        ) : modoEdicaoItens ? (
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    color="secondary"
                                    isDisabled={salvandoTodos}
                                    onClick={() => {
                                        setDesfazerTodosNonce((n) => n + 1);
                                        setModoEdicaoItens(false);
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Tooltip title="Nenhuma edição foi feita" isDisabled={algumaAlteracaoFeita || salvandoTodos}>
                                    <Button
                                        size="sm"
                                        color="primary"
                                        isLoading={salvandoTodos}
                                        showTextWhileLoading
                                        className={!algumaAlteracaoFeita && !salvandoTodos ? "cursor-not-allowed opacity-50" : undefined}
                                        onClick={() => {
                                            if (!algumaAlteracaoFeita) return;
                                            if (!quemPagaGlobal) {
                                                setErroQuemPagaGlobal(true);
                                                requestAnimationFrame(() => {
                                                    if (quemPagaGlobalRef.current) scrollComOffsetDoTopo(quemPagaGlobalRef.current);
                                                });
                                                return;
                                            }
                                            setErroQuemPagaGlobal(false);
                                            setSalvarTodosNonce((n) => n + 1);
                                            setSalvandoTodos(true);
                                            setTimeout(() => {
                                                setSalvandoTodos(false);
                                                setModoEdicaoItens(false);
                                                conteudoSlideoutRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                                                // Só fecha o item depois que o scroll termina — fechar junto
                                                // com o início do scroll dava a impressão de um salto brusco.
                                                setTimeout(() => setItemAberto(null), 400);
                                            }, 3000);
                                        }}
                                    >
                                        {salvandoTodos ? "Salvando..." : "Salvar e pagar"}
                                    </Button>
                                </Tooltip>
                            </div>
                        ) : pedido?.status === "aprovado" && pedidosEmEdicao.has(pedido.id) ? (
                            <Button
                                size="sm"
                                color="secondary"
                                onClick={() => {
                                    if (!pedido) return;
                                    onAbrirEdicaoWizard(pedido, itens);
                                    onClose();
                                }}
                            >
                                Ver edição
                            </Button>
                        ) : pedido?.status === "aprovado" && !linkPagamentoPedido ? (
                            <Button
                                size="sm"
                                color="secondary"
                                onClick={() => {
                                    if (!pedido) return;
                                    onAbrirEdicaoWizard(pedido, itens);
                                    onClose();
                                }}
                            >
                                Editar
                            </Button>
                        ) : null}
                    </span>
                </div>
            </AriaDialog>
        </AriaModal>
    </AriaModalOverlay>
    );
};

/** Estado agregado de um item reportado pro resumo lateral — cada accordion calcula o seu e
 * o pai só soma, sem saber os detalhes de cada seção. */
interface ItemEdicaoEstado {
    temAlteracao: boolean;
    /** Valor original do item — sempre o mesmo, não muda com o que for selecionado na edição. */
    valorPagoItem: number;
    /** Valor atual do item: o novo, se a modalidade foi trocada; senão, igual ao original. */
    valorAtualItem: number;
    /** Taxa de 5% sobre o valor final do item — só cobrada quando há alguma alteração nele. */
    custoTaxa: number;
    precisaConfirmarEstoque: boolean;
    /** true quando a categoria ficou em branco (sessão trocada sem escolher a nova categoria)
     * — bloqueia o salvamento. */
    categoriaEmBranco: boolean;
    /** true quando a modalidade ficou em branco (ex.: categoria/sessão trocada sem escolher a
     * nova modalidade) — bloqueia o salvamento. */
    modalidadeEmBranco: boolean;
    /** true quando o e-mail do portador não está num formato válido — bloqueia o salvamento. */
    portadorInvalido: boolean;
    /** true quando algum campo do questionário ficou em branco — bloqueia o salvamento. */
    questionarioIncompleto: boolean;
}

/** Linha "rótulo + descrição" à esquerda, campo(s) à direita — o padrão de todas as seções
 * (Portador/Item/Questionário) dentro de um item aberto. */
const SecaoEdicaoRow = ({ titulo, descricao, children }: { titulo: string; descricao: string; children: ReactNode }) => (
    <div className="flex gap-12">
        <div className="flex w-56 shrink-0 flex-col gap-2">
            <h4 className="text-md font-semibold text-primary">{titulo}</h4>
            <p className="text-sm text-quaternary">{descricao}</p>
        </div>
        <div className="flex flex-1 flex-col gap-4">{children}</div>
    </div>
);

/** Opção "Quem pagará?" — ícone + título centralizados, os dois lado a lado ocupando a
 * largura da barra lateral. */
const ResumoQuemPagaCard = ({
    value,
    icon: Icon,
    titulo,
    selecionadoAtual,
    onDesmarcar,
}: {
    value: "organizacao" | "comprador";
    icon: typeof Bank;
    titulo: string;
    selecionadoAtual: "organizacao" | "comprador" | null;
    onDesmarcar: () => void;
}) => (
    <div
        className="flex flex-1"
        onClickCapture={(e) => {
            // RadioGroup dispara onChange de novo mesmo clicando em quem já está selecionado
            // (não é um "change" de verdade) — sem isso, esse onChange reaplicaria o mesmo
            // valor por cima e desfaria o desmarcar. Barra o clique antes de chegar no rádio.
            if (value === selecionadoAtual) {
                e.stopPropagation();
                e.preventDefault();
                onDesmarcar();
            }
        }}
    >
        <AriaRadio
            value={value}
            className={({ isSelected, isFocusVisible }) =>
                cx(
                    "flex flex-1 cursor-pointer flex-col items-center gap-3 rounded-xl bg-primary p-6 text-center ring-1 ring-inset transition duration-100 ease-linear",
                    isSelected ? "ring-2 ring-brand-600" : "ring-border-secondary hover:bg-primary_hover",
                    isFocusVisible && "outline-2 outline-offset-2 outline-focus-ring",
                )
            }
        >
            {({ isSelected, isHovered }) => (
                <>
                    <Icon className={cx("size-6", isSelected || isHovered ? "text-fg-primary" : "text-fg-quaternary")} aria-hidden="true" />
                    <span className="text-sm font-medium text-secondary">{titulo}</span>
                </>
            )}
        </AriaRadio>
    </div>
);

/** Um item do pedido, em accordion — ao abrir, edita Portador, Item e Questionário lado a
 * lado (rótulo à esquerda, campo à direita), tudo já pré-preenchido com os valores atuais.
 * Reporta seu próprio estado (mudou algo? quanto custa?) pro resumo lateral somar. */
const ItemEdicaoAccordion = ({
    item,
    aberto,
    onToggle,
    onEstadoChange,
    tentouSalvar,
}: {
    item: Transacao;
    aberto: boolean;
    onToggle: () => void;
    onEstadoChange: (idInscricao: string, estado: ItemEdicaoEstado) => void;
    /** Só true depois que "Salvar e gerar pagamento" foi clicado ao menos uma vez — os campos
     * com estoque esgotado não confirmado só ficam vermelhos a partir daí, nunca antes. */
    tentouSalvar: boolean;
}) => {
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Portador — busca por e-mail, com confirmação explícita (só ela precisa de um botão; os
    // outros dois campos abaixo são só formulário, aplicados junto no "Salvar" geral).
    const portadorAtual = useMemo<PortadorEditavel>(
        () => ({
            nome: item.atletaNome,
            tipoDocumento: item.atletaTipoDocumento,
            documento: item.atletaDocumento,
            email: item.atletaEmail,
            telefone: item.atletaTelefone,
            dataNascimento: item.atletaDataNascimento,
        }),
        [item],
    );
    const [novoPortador, setNovoPortador] = useState<PortadorEditavel | null>(null);
    // Começa preenchido com o e-mail atual (não vazio) — só vira uma alteração de fato se o
    // e-mail digitado for diferente do original.
    const [campoPortador, setCampoPortador] = useState(portadorAtual.email);
    // Sem botão — o campo valida sozinho: 1s sem digitar mostra o spinner, +2s confirma (e o
    // check permanece até o campo mudar de novo). Começa em "confirmado" porque o e-mail
    // original já é de uma conta existente — não precisa revalidar sem o usuário mexer nele.
    const [statusPortador, setStatusPortador] = useState<"idle" | "validando" | "confirmado">("confirmado");
    // Conta como alteração assim que o texto difere do original — não espera a confirmação
    // (spinner/check) terminar, senão digitar e clicar em "Salvar" rápido não contaria a troca.
    const portadorMudou = campoPortador.trim().toLowerCase() !== portadorAtual.email.toLowerCase();
    // Só pode ficar assim se o usuário digitou algo e apagou/deixou num formato inválido — o
    // valor original sempre é um e-mail válido. Só vira erro visível depois do "Salvar".
    const portadorInvalido = !EMAIL_REGEX.test(campoPortador.trim());
    const debouncePortadorRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const loadingPortadorRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(
        () => () => {
            if (debouncePortadorRef.current) clearTimeout(debouncePortadorRef.current);
            if (loadingPortadorRef.current) clearTimeout(loadingPortadorRef.current);
        },
        [],
    );
    const handleChangeCampoPortador = (v: string) => {
        setCampoPortador(v);
        setNovoPortador(null);
        setStatusPortador("idle");
        if (debouncePortadorRef.current) clearTimeout(debouncePortadorRef.current);
        if (loadingPortadorRef.current) clearTimeout(loadingPortadorRef.current);
        const email = v.trim();
        if (!email || !EMAIL_REGEX.test(email)) return;
        debouncePortadorRef.current = setTimeout(() => {
            setStatusPortador("validando");
            loadingPortadorRef.current = setTimeout(() => {
                if (email.toLowerCase() !== portadorAtual.email.toLowerCase()) {
                    const nome =
                        NOMES_POR_EMAIL[email.toLowerCase()] ??
                        `${PRIMEIROS[Math.floor(Math.random() * PRIMEIROS.length)]} ${SOBRENOMES[Math.floor(Math.random() * SOBRENOMES.length)]}`;
                    const tipoDocumento = Math.random() < 0.85 ? "CPF" : "Passaporte";
                    const documento = String(Math.floor(Math.random() * 9e10 + 1e10));
                    const ddd = LOCAIS[Math.floor(Math.random() * LOCAIS.length)].ddd;
                    const telefone = `+55${ddd}9${String(Math.floor(Math.random() * 9e7 + 1e7))}`;
                    const dataNascimento = fmtDate(
                        new Date(1955 + Math.floor(Math.random() * 50), Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28)),
                    );
                    setNovoPortador({ nome, tipoDocumento, documento, email, telefone, dataNascimento });
                }
                setStatusPortador("confirmado");
            }, 2000);
        }, 500);
    };

    // Sugestões de domínio ao digitar "@" — mesmo padrão inline (sem popover flutuante) usado
    // no resto do produto, pra não repetir o bug de posicionamento de um popover de verdade.
    const [sugestoesAbertas, setSugestoesAbertas] = useState(false);
    const [sugestaoAtiva, setSugestaoAtiva] = useState(-1);
    const sugestoesEmail = useMemo(() => {
        const arroba = campoPortador.indexOf("@");
        if (arroba === -1) return [];
        const usuario = campoPortador.slice(0, arroba);
        const dominioDigitado = campoPortador.slice(arroba + 1).toLowerCase();
        if (!usuario) return [];
        return EMAIL_DOMINIOS.filter((d) => d.startsWith(dominioDigitado) && d !== dominioDigitado).map((d) => `${usuario}@${d}`);
    }, [campoPortador]);
    useEffect(() => setSugestaoAtiva(-1), [sugestoesEmail]);
    const selecionarSugestaoPortador = (sugestao: string) => {
        handleChangeCampoPortador(sugestao);
        setSugestoesAbertas(false);
        setSugestaoAtiva(-1);
    };

    // Item — sessão → categoria → modalidade em cadeia, já pré-preenchidos com a opção atual
    // (diferente do wizard anterior, aqui não começa vazio).
    const opcaoAtualItem = useMemo(
        () => ITEM_CATALOGO.find((o) => o.modalidade === item.modalidade && o.setor === item.setor) ?? null,
        [item],
    );
    const [draftDataProva, setDraftDataProva] = useState<string | null>(opcaoAtualItem?.dataProva ?? null);
    const [draftCategoria, setDraftCategoria] = useState<string | null>(opcaoAtualItem?.categoria ?? null);
    const [draftModalidade, setDraftModalidade] = useState<string | null>(opcaoAtualItem?.modalidade ?? null);
    const [confirmaEstoqueItem, setConfirmaEstoqueItem] = useState<{ categoria?: boolean; modalidade?: boolean }>({});
    const opcoesCategoria = useMemo(() => (draftDataProva ? (CATEGORIAS_POR_DATA[draftDataProva] ?? []) : []), [draftDataProva]);
    const opcoesModalidade = useMemo(
        () => (draftDataProva && draftCategoria ? ITEM_CATALOGO.filter((o) => o.dataProva === draftDataProva && o.categoria === draftCategoria) : []),
        [draftDataProva, draftCategoria],
    );
    const opcaoSelecionada = useMemo(
        () => ITEM_CATALOGO.find((o) => o.dataProva === draftDataProva && o.categoria === draftCategoria && o.modalidade === draftModalidade),
        [draftDataProva, draftCategoria, draftModalidade],
    );
    const itemMudou = !!opcaoSelecionada && opcaoSelecionada.id !== opcaoAtualItem?.id;
    // Já conta como edição assim que sessão ou categoria mudam, mesmo antes de uma modalidade
    // válida ser escolhida no fim da cadeia (itemMudou exige a opção completa e resolvida, só
    // pra calcular o valor novo — isso aqui é só "o usuário mexeu no item").
    const itemDraftMudou =
        itemMudou || draftDataProva !== (opcaoAtualItem?.dataProva ?? null) || draftCategoria !== (opcaoAtualItem?.categoria ?? null);
    const handleChangeDataProva = (data: string) => {
        setDraftDataProva(data);
        setDraftCategoria(null);
        setDraftModalidade(null);
        setConfirmaEstoqueItem({});
    };
    const handleChangeCategoria = (categoria: string) => {
        setDraftCategoria(categoria);
        setDraftModalidade(null);
        setConfirmaEstoqueItem({});
    };
    // "Está esgotado" mostra o checkbox (continua visível mesmo já marcado); "precisa
    // confirmar" só é usado pra bloquear o salvamento enquanto ele não estiver marcado. Se a
    // opção esgotada já é a original do ingresso (não foi o usuário quem trocou pra ela), não
    // precisa aumentar estoque pra manter o que já estava — só exige confirmação numa troca de
    // fato para uma opção sem estoque.
    const categoriaEstaEsgotada = draftCategoria === CATEGORIA_ESGOTADA && draftCategoria !== opcaoAtualItem?.categoria;
    const modalidadeEstaEsgotada = draftModalidade === MODALIDADE_ESGOTADA && draftModalidade !== opcaoAtualItem?.modalidade;
    const categoriaPrecisaConfirmar = categoriaEstaEsgotada && !confirmaEstoqueItem.categoria;
    const modalidadePrecisaConfirmar = modalidadeEstaEsgotada && !confirmaEstoqueItem.modalidade;

    // Questionário — só formulário, sem confirmação própria (aplica junto no "Salvar" geral).
    const respostasAtuais = useMemo<RespostasIngresso>(
        () => ({
            perguntaMarcaTenis: item.perguntaMarcaTenis,
            perguntaContatoEmergencia: item.perguntaContatoEmergencia,
            perguntaJaCorreuProva: item.perguntaJaCorreuProva,
        }),
        [item],
    );
    const [draftRespostas, setDraftRespostas] = useState<RespostasIngresso>(respostasAtuais);
    const [confirmaEstoqueTenis, setConfirmaEstoqueTenis] = useState(false);
    const perguntasMudaram = JSON.stringify(draftRespostas) !== JSON.stringify(respostasAtuais);
    // Mesma regra: se a marca esgotada já era a resposta original, não exige aumentar estoque.
    const tenisEstaEsgotado =
        draftRespostas.perguntaMarcaTenis === TENIS_MARCA_ESGOTADA && draftRespostas.perguntaMarcaTenis !== respostasAtuais.perguntaMarcaTenis;
    const tenisPrecisaConfirmar = tenisEstaEsgotado && !confirmaEstoqueTenis;
    // Nenhum campo do questionário pode ficar em branco — na prática só o campo de texto livre
    // (contato de emergência) permite isso; os outros dois nunca começam vazios e não têm como
    // ficar sem seleção pela UI, mas a checagem cobre os três por segurança.
    const contatoEmergenciaVazio = draftRespostas.perguntaContatoEmergencia.trim() === "";
    const tenisFavoritoVazio = !draftRespostas.perguntaMarcaTenis;
    const jaCorreuProvaVazio = !draftRespostas.perguntaJaCorreuProva;
    const questionarioIncompleto = contatoEmergenciaVazio || tenisFavoritoVazio || jaCorreuProvaVazio;

    // Desfazer — volta Portador/Item/Questionário deste item pro estado original, sempre com
    // confirmação antes (ação destrutiva, perde tudo que foi digitado/selecionado no item).
    const [confirmandoDesfazer, setConfirmandoDesfazer] = useState(false);
    const handleDesfazer = () => {
        if (debouncePortadorRef.current) clearTimeout(debouncePortadorRef.current);
        if (loadingPortadorRef.current) clearTimeout(loadingPortadorRef.current);
        setCampoPortador(portadorAtual.email);
        setNovoPortador(null);
        setStatusPortador("confirmado");
        setDraftDataProva(opcaoAtualItem?.dataProva ?? null);
        setDraftCategoria(opcaoAtualItem?.categoria ?? null);
        setDraftModalidade(opcaoAtualItem?.modalidade ?? null);
        setConfirmaEstoqueItem({});
        setDraftRespostas(respostasAtuais);
        setConfirmaEstoqueTenis(false);
        setConfirmandoDesfazer(false);
    };

    // Valor — igual ao resto do produto: 5% de taxa sobre o valor final do item (o novo, se
    // ele também mudou; senão o original). Preço original/valor novo cheio só entram na conta
    // do resumo quando o item de fato trocou de modalidade (0 caso contrário).
    const valorPago = item.valorUnitario - item.valorDesconto / item.qtdItem;
    const valorNovo = opcaoSelecionada ? opcaoSelecionada.valorUnitario - item.valorDesconto / item.qtdItem : valorPago;
    const temAlteracao = portadorMudou || itemDraftMudou || perguntasMudaram;
    const custoTaxa = temAlteracao ? (itemMudou ? valorNovo : valorPago) * 0.05 : 0;
    const precisaConfirmarEstoque = categoriaPrecisaConfirmar || modalidadePrecisaConfirmar || tenisPrecisaConfirmar;
    // Categoria/modalidade somem (ficam null) sempre que o campo anterior na cadeia muda — não
    // pode ir pro salvamento assim, precisa dos dois preenchidos no fim.
    const categoriaEmBranco = !draftCategoria;
    const modalidadeEmBranco = !draftModalidade;
    // Conta cada validação pendente separadamente pro badge de erro do header — só depois do
    // primeiro "Salvar" (antes disso nada é considerado erro ainda).
    const errosCount = [
        portadorInvalido,
        categoriaEmBranco,
        modalidadeEmBranco,
        categoriaPrecisaConfirmar,
        modalidadePrecisaConfirmar,
        tenisPrecisaConfirmar,
        contatoEmergenciaVazio,
        tenisFavoritoVazio,
        jaCorreuProvaVazio,
    ].filter(Boolean).length;
    const temErro = tentouSalvar && errosCount > 0;

    useEffect(() => {
        onEstadoChange(item.idInscricao, {
            temAlteracao,
            valorPagoItem: valorPago,
            valorAtualItem: itemMudou ? valorNovo : valorPago,
            custoTaxa,
            precisaConfirmarEstoque,
            categoriaEmBranco,
            modalidadeEmBranco,
            portadorInvalido,
            questionarioIncompleto,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        temAlteracao,
        valorPago,
        valorNovo,
        itemMudou,
        custoTaxa,
        precisaConfirmarEstoque,
        categoriaEmBranco,
        modalidadeEmBranco,
        portadorInvalido,
        questionarioIncompleto,
    ]);

    // Ao abrir (não na primeira renderização, só numa troca de fato), rola até o topo do card
    // — 80px de offset pro header fixo da página não cobrir o início do item.
    const cardRef = useRef<HTMLDivElement>(null);
    const primeiraRenderizacao = useRef(true);
    useEffect(() => {
        if (primeiraRenderizacao.current) {
            primeiraRenderizacao.current = false;
            return;
        }
        if (!aberto) return;
        // Espera o conteúdo do card terminar de abrir (layout já refletindo a nova altura) antes
        // de calcular o alvo do scroll — senão a rolagem começa com base numa posição desatualizada
        // e "engasga" quando o layout muda no meio da animação.
        const raf = requestAnimationFrame(() => {
            if (!cardRef.current) return;
            const rect = cardRef.current.getBoundingClientRect();
            window.scrollTo({ top: window.scrollY + rect.top - 88, behavior: "smooth" });
        });
        return () => cancelAnimationFrame(raf);
    }, [aberto]);

    return (
        // Sem border/overflow-clip aqui — a caixa deste div nunca chega a rolar sozinha, então
        // qualquer borda desenhada nela vaza para fora dos limites do header fixo enquanto ele
        // está grudado (o que aparecia como uma linha reta atrás do header ao rolar). Cada peça
        // visível (o header e, quando aberto, o conteúdo) desenha a própria borda completa, presa
        // exatamente aos próprios limites — não há caixa "de fora" que possa vazar.
        <div ref={cardRef} className="flex flex-col rounded-xl">
            {/* top-[80px] = mesma altura do header fixo da página — gruda logo abaixo dele e
             * sai de cena junto com o resto do card quando o item termina de rolar. */}
            {/* Não é mais um único <button> — o botão de desfazer mora dentro da mesma barra e
             * HTML não permite botão dentro de botão. O toggle vira dois botões irmãos (área do
             * título e o chevron) que fazem a mesma coisa. */}
            <div
                className={cx(
                    "sticky top-[80px] z-30 flex items-center justify-between gap-3 border border-secondary bg-[#171717] p-4 transition duration-100 ease-linear",
                    aberto ? "rounded-t-xl" : "rounded-xl",
                )}
            >
                <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary ring-1 ring-border-secondary">
                        <Ticket01 className="size-5 text-fg-secondary" aria-hidden="true" />
                    </span>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-primary">
                            {item.modalidade} • {item.setor}
                        </span>
                        <span className="text-sm text-tertiary">de {item.atletaNome}</span>
                    </div>
                </button>
                <div className="flex items-center gap-3">
                    {temErro ? (
                        <Badge size="sm" type="pill-color" color="error">
                            {errosCount} {errosCount === 1 ? "erro" : "erros"}
                        </Badge>
                    ) : (
                        temAlteracao && (
                            <Badge size="sm" type="pill-color" color="gray">
                                Editado
                            </Badge>
                        )
                    )}
                    {(temAlteracao || temErro) && (
                        <button
                            type="button"
                            aria-label="Desfazer edições deste item"
                            onClick={() => setConfirmandoDesfazer(true)}
                            className="flex size-6 shrink-0 items-center justify-center rounded-md text-fg-quaternary transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover"
                        >
                            <RefreshCcw01 className="size-4" aria-hidden="true" />
                        </button>
                    )}
                    <button type="button" onClick={onToggle} aria-label={aberto ? "Recolher" : "Expandir"} className="flex shrink-0 items-center">
                        {aberto ? (
                            <ChevronUp className="size-5 text-fg-quaternary" aria-hidden="true" />
                        ) : (
                            <ChevronDown className="size-5 text-fg-quaternary" aria-hidden="true" />
                        )}
                    </button>
                </div>
            </div>
            {aberto && (
                <div className="flex flex-col gap-8 rounded-b-xl border-x border-b border-secondary bg-[#0A0A0A] p-4">
                    <SecaoEdicaoRow titulo="Portador" descricao="É a pessoa que vai usar e receber o ingresso. Ela precisa ter uma conta na Ingresse.">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-sm font-medium text-secondary">E-mail</span>
                            <div className="relative">
                                <Input
                                    size="sm"
                                    placeholder="exemplo@email.com"
                                    inputClassName="pr-8"
                                    value={campoPortador}
                                    isInvalid={tentouSalvar && portadorInvalido}
                                    onChange={(v) => {
                                        handleChangeCampoPortador(v);
                                        setSugestoesAbertas(true);
                                    }}
                                    onFocus={() => setSugestoesAbertas(true)}
                                    onBlur={() => setTimeout(() => setSugestoesAbertas(false), 150)}
                                    onKeyDown={(e) => {
                                        const abertas = sugestoesAbertas && sugestoesEmail.length > 0;
                                        if (e.key === "Enter") {
                                            if (abertas && sugestaoAtiva >= 0) {
                                                e.preventDefault();
                                                selecionarSugestaoPortador(sugestoesEmail[sugestaoAtiva]);
                                            }
                                            return;
                                        }
                                        if (!abertas) return;
                                        if (e.key === "ArrowDown") {
                                            e.preventDefault();
                                            setSugestaoAtiva((i) => (i + 1) % sugestoesEmail.length);
                                        } else if (e.key === "ArrowUp") {
                                            e.preventDefault();
                                            setSugestaoAtiva((i) => (i <= 0 ? sugestoesEmail.length - 1 : i - 1));
                                        } else if (e.key === "Escape") {
                                            setSugestoesAbertas(false);
                                        }
                                    }}
                                />
                                {statusPortador === "validando" && (
                                    <Loading02
                                        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-fg-quaternary"
                                        aria-hidden="true"
                                    />
                                )}
                                {statusPortador === "confirmado" && (
                                    <CheckCircle
                                        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-success-primary"
                                        aria-hidden="true"
                                    />
                                )}
                                {sugestoesAbertas && sugestoesEmail.length > 0 && (
                                    <div className="absolute inset-x-0 top-full z-20 mt-1 flex flex-col gap-0.5 rounded-lg bg-primary p-1 shadow-lg ring-1 ring-border-secondary">
                                        {sugestoesEmail.map((s, i) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => selecionarSugestaoPortador(s)}
                                                onMouseEnter={() => setSugestaoAtiva(i)}
                                                className={cx(
                                                    "rounded-md px-2 py-1.5 text-left text-sm transition duration-100 ease-linear",
                                                    i === sugestaoAtiva ? "bg-primary_hover text-primary" : "text-secondary hover:bg-primary_hover",
                                                )}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {tentouSalvar && portadorInvalido && (
                                <span className="text-sm text-error-primary">Informe um e-mail válido para continuar</span>
                            )}
                            {portadorMudou && <span className="text-sm text-tertiary">Original: {portadorAtual.email}</span>}
                        </div>
                    </SecaoEdicaoRow>

                    <hr className="border-dashed border-secondary" />

                    <SecaoEdicaoRow
                        titulo="Item"
                        descricao="É o ingresso ou a inscrição que será usado. Alterações podem aumentar o valor da edição. Você verá o novo total antes de confirmar."
                    >
                        <div className="flex flex-col gap-1">
                            <AutocompleteInline
                                label="Sessão"
                                placeholder="Selecione a sessão"
                                items={DATA_PROVA_OPTIONS.map((d) => ({ id: d, label: formatDataSessaoCurta(d) ?? d }))}
                                selectedId={draftDataProva}
                                onSelect={handleChangeDataProva}
                            />
                            {opcaoAtualItem && draftDataProva !== opcaoAtualItem.dataProva && (
                                <span className="text-sm text-tertiary">Original: {formatDataSessaoCurta(opcaoAtualItem.dataProva)}</span>
                            )}
                        </div>
                        <Tooltip title="Selecione o campo anterior para continuar" isDisabled={!!draftDataProva}>
                            <AriaFocusable>
                                <div className="flex flex-col gap-1">
                                    <AutocompleteInline
                                        label="Categoria"
                                        placeholder="Selecione a categoria"
                                        items={opcoesCategoria.map((c) => ({ id: c, label: c }))}
                                        selectedId={draftCategoria}
                                        onSelect={handleChangeCategoria}
                                        isDisabled={!draftDataProva}
                                        isInvalid={tentouSalvar && (categoriaPrecisaConfirmar || categoriaEmBranco)}
                                        esgotado={CATEGORIA_ESGOTADA}
                                    />
                                    {tentouSalvar && categoriaEmBranco && (
                                        <span className="text-sm text-error-primary">Selecione uma categoria para continuar</span>
                                    )}
                                    {opcaoAtualItem && draftCategoria !== opcaoAtualItem.categoria && (
                                        <span className="text-sm text-tertiary">Original: {opcaoAtualItem.categoria}</span>
                                    )}
                                    {categoriaEstaEsgotada && (
                                        <div className="flex items-center gap-1.5">
                                            <Checkbox
                                                label="Aumentar estoque para continuar"
                                                isSelected={!!confirmaEstoqueItem.categoria}
                                                onChange={(checked) => setConfirmaEstoqueItem((c) => ({ ...c, categoria: checked }))}
                                            />
                                            <Tooltip title="Atualmente esta opção não possui estoque, mas ao marcar este campo adicionaremos uma vaga ao salvar a edição">
                                                <TooltipTrigger className="flex items-center text-fg-quaternary transition duration-100 ease-linear hover:text-fg-quaternary_hover">
                                                    <HelpCircle className="size-4" aria-hidden="true" />
                                                </TooltipTrigger>
                                            </Tooltip>
                                        </div>
                                    )}
                                    {tentouSalvar && categoriaPrecisaConfirmar && (
                                        <span className="text-sm text-error-primary">Sem estoque, aumente ou troque a seleção</span>
                                    )}
                                </div>
                            </AriaFocusable>
                        </Tooltip>
                        <Tooltip title="Selecione o campo anterior para continuar" isDisabled={!!draftCategoria}>
                            <AriaFocusable>
                                <div className="flex flex-col gap-1">
                                    <AutocompleteInline
                                        label="Modalidade"
                                        placeholder="Selecione a modalidade"
                                        items={opcoesModalidade.map((o) => ({ id: o.id, label: o.modalidade, preco: o.valorUnitario }))}
                                        selectedId={opcaoSelecionada?.id ?? null}
                                        onSelect={(id) => {
                                            setDraftModalidade(opcoesModalidade.find((o) => o.id === id)?.modalidade ?? null);
                                            setConfirmaEstoqueItem((c) => ({ ...c, modalidade: false }));
                                        }}
                                        isDisabled={!draftCategoria}
                                        isInvalid={tentouSalvar && (modalidadePrecisaConfirmar || modalidadeEmBranco)}
                                        esgotado={MODALIDADE_ESGOTADA}
                                    />
                                    {tentouSalvar && modalidadeEmBranco && (
                                        <span className="text-sm text-error-primary">Selecione uma modalidade para continuar</span>
                                    )}
                                    {opcaoAtualItem && draftModalidade !== opcaoAtualItem.modalidade && (
                                        <span className="text-sm text-tertiary">Original: {opcaoAtualItem.modalidade}</span>
                                    )}
                                    {modalidadeEstaEsgotada && (
                                        <div className="flex items-center gap-1.5">
                                            <Checkbox
                                                label="Aumentar estoque para continuar"
                                                isSelected={!!confirmaEstoqueItem.modalidade}
                                                onChange={(checked) => setConfirmaEstoqueItem((c) => ({ ...c, modalidade: checked }))}
                                            />
                                            <Tooltip title="Atualmente esta opção não possui estoque, mas ao marcar este campo adicionaremos uma vaga ao salvar a edição">
                                                <TooltipTrigger className="flex items-center text-fg-quaternary transition duration-100 ease-linear hover:text-fg-quaternary_hover">
                                                    <HelpCircle className="size-4" aria-hidden="true" />
                                                </TooltipTrigger>
                                            </Tooltip>
                                        </div>
                                    )}
                                    {tentouSalvar && modalidadePrecisaConfirmar && (
                                        <span className="text-sm text-error-primary">Sem estoque, aumente ou troque a seleção</span>
                                    )}
                                </div>
                            </AriaFocusable>
                        </Tooltip>
                    </SecaoEdicaoRow>

                    <hr className="border-dashed border-secondary" />

                    <SecaoEdicaoRow
                        titulo="Questionário"
                        descricao="Reúne as informações solicitadas pelo organizador. As perguntas podem mudar conforme o item selecionado."
                    >
                        <div className="flex flex-col gap-1">
                            {/* Select.isInvalid só estiliza o hint, não a borda do próprio campo
                             * — como não dá pra editar o design system, força a borda vermelha
                             * por seletor no botão interno. Mesmo tom (ring-error_subtle, 1px)
                             * que o Input usa parado/sem foco, pra não destoar dos outros campos. */}
                            <div
                                className={
                                    tentouSalvar && (tenisPrecisaConfirmar || tenisFavoritoVazio)
                                        ? "[&_button]:ring-1 [&_button]:ring-error_subtle"
                                        : undefined
                                }
                            >
                                <Select
                                    size="sm"
                                    label={EXPORT_FIELD_LABELS["pergunta_marcaTenis"]}
                                    selectedKey={draftRespostas.perguntaMarcaTenis}
                                    onSelectionChange={(key) => {
                                        setDraftRespostas((d) => ({ ...d, perguntaMarcaTenis: String(key) }));
                                        setConfirmaEstoqueTenis(false);
                                    }}
                                    items={TENIS_MARCAS.map((m) => ({ id: m, label: m }))}
                                >
                                    {(opt) => (
                                        <Select.Item id={opt.id} supportingText={opt.id === TENIS_MARCA_ESGOTADA ? "Esgotado" : undefined}>
                                            {opt.label}
                                        </Select.Item>
                                    )}
                                </Select>
                            </div>
                            {tenisEstaEsgotado && (
                                <div className="flex items-center gap-1.5">
                                    <Checkbox
                                        label="Aumentar estoque para continuar"
                                        isSelected={confirmaEstoqueTenis}
                                        onChange={(checked) => setConfirmaEstoqueTenis(checked)}
                                    />
                                    <Tooltip title="Atualmente esta opção não possui estoque, mas ao marcar este campo adicionaremos uma vaga ao salvar a edição">
                                        <TooltipTrigger className="flex items-center text-fg-quaternary transition duration-100 ease-linear hover:text-fg-quaternary_hover">
                                            <HelpCircle className="size-4" aria-hidden="true" />
                                        </TooltipTrigger>
                                    </Tooltip>
                                </div>
                            )}
                            {tentouSalvar && tenisPrecisaConfirmar && (
                                <span className="text-sm text-error-primary">Sem estoque, aumente ou troque a seleção</span>
                            )}
                            {tentouSalvar && tenisFavoritoVazio && (
                                <span className="text-sm text-error-primary">Selecione uma marca de tênis para continuar</span>
                            )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Input
                                size="sm"
                                type="tel"
                                inputMode="numeric"
                                label={EXPORT_FIELD_LABELS["pergunta_contatoEmergencia"]}
                                value={maskTelefoneLocal(draftRespostas.perguntaContatoEmergencia)}
                                isInvalid={tentouSalvar && contatoEmergenciaVazio}
                                onChange={(v) => setDraftRespostas((d) => ({ ...d, perguntaContatoEmergencia: v.replace(/\D/g, "").slice(0, 11) }))}
                            />
                            {tentouSalvar && contatoEmergenciaVazio && (
                                <span className="text-sm text-error-primary">Informe um contato de emergência para continuar</span>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-secondary">{EXPORT_FIELD_LABELS["pergunta_jaCorreuProva"]}</span>
                            <RadioGroup
                                aria-label={EXPORT_FIELD_LABELS["pergunta_jaCorreuProva"]}
                                orientation="horizontal"
                                className="flex-row gap-6"
                                value={draftRespostas.perguntaJaCorreuProva}
                                onChange={(value) => setDraftRespostas((d) => ({ ...d, perguntaJaCorreuProva: value }))}
                            >
                                <RadioButton value="Sim" label="Sim" />
                                <RadioButton value="Não" label="Não" />
                            </RadioGroup>
                            {tentouSalvar && jaCorreuProvaVazio && (
                                <span className="text-sm text-error-primary">Selecione uma opção para continuar</span>
                            )}
                        </div>
                    </SecaoEdicaoRow>
                </div>
            )}

            <ModalOverlay isOpen={confirmandoDesfazer} onOpenChange={setConfirmandoDesfazer} isDismissable>
                <Modal className="sm:max-w-[440px]">
                    <Dialog>
                        <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-lg font-semibold text-primary">Desfazer edições</h2>
                                <p className="text-sm text-tertiary">
                                    Tem certeza que quer desfazer as edições feitas neste ingresso? Portador, item e questionário voltam ao estado
                                    original e o que foi digitado ou selecionado aqui é perdido.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Button size="md" color="secondary" onClick={() => setConfirmandoDesfazer(false)}>
                                    Cancelar
                                </Button>
                                <Button size="md" color="primary-destructive" onClick={handleDesfazer}>
                                    Desfazer
                                </Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </div>
    );
};

/** Linha do resumo de preço com um tooltip explicando como aquele valor é calculado. */
const LinhaResumoPreco = ({ label, valor, tooltip }: { label: string; valor: number; tooltip: ReactNode }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-tertiary">
            <span className="text-sm">{label}</span>
            <TooltipFundoEscuro title={tooltip}>
                <TooltipTrigger className="flex items-center text-fg-quaternary transition duration-100 ease-linear hover:text-fg-quaternary_hover">
                    <HelpCircle className="size-4" aria-hidden="true" />
                </TooltipTrigger>
            </TooltipFundoEscuro>
        </div>
        <span className="text-sm font-medium text-secondary">{currencyFormatter.format(valor)}</span>
    </div>
);

/** Página de edição em etapa única — substitui o wizard multi-step. O usuário chega aqui ao
 * clicar em "Editar" no slideout, vê todos os itens do pedido como um accordion (um aberto
 * por vez) e edita Portador/Item/Questionário de cada um diretamente, sem múltiplas telas. O
 * resumo lateral soma o custo de todos os itens em tempo real e finaliza tudo de uma vez. */
const EditarPedidoPage = ({
    pedido,
    itens,
    onSair,
    onPedidoEmEdicaoChange,
}: {
    pedido: Transacao;
    itens: Transacao[];
    onSair: () => void;
    onPedidoEmEdicaoChange?: (pedidoId: string, emEdicao: boolean) => void;
}) => {
    // Ao chegar aqui vindo do "Editar" da tabela, a janela pode estar rolada de onde a linha
    // clicada ficava — a página sempre deve abrir do topo.
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    const [itemAbertoId, setItemAbertoId] = useState<string | null>(itens[0]?.idInscricao ?? null);
    const [quemPaga, setQuemPaga] = useState<"organizacao" | "comprador" | null>(null);
    const [erroQuemPaga, setErroQuemPaga] = useState(false);
    // Só faz sentido quando o comprador paga — reseta se voltar pra organização ou desmarcar.
    const [absorverCustoEdicao, setAbsorverCustoEdicao] = useState(false);
    useEffect(() => {
        if (quemPaga !== "comprador") setAbsorverCustoEdicao(false);
    }, [quemPaga]);
    // Só vira true depois do primeiro clique em "Salvar e gerar pagamento" — os campos com
    // estoque esgotado não confirmado só ficam vermelhos a partir daí, nunca antes disso.
    const [tentouSalvar, setTentouSalvar] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [concluido, setConcluido] = useState(false);
    // Modal de sucesso ao salvar — o usuário escolhe entre ver a edição já aplicada (fecha o
    // modal, continua na página) ou voltar pro relatório de transações.
    const [mostrarModalSucesso, setMostrarModalSucesso] = useState(false);
    // Cancelar a edição enquanto aguarda pagamento é destrutivo (perde as trocas feitas) — sempre
    // confirma antes.
    const [mostrarModalCancelar, setMostrarModalCancelar] = useState(false);
    // Feedback de 2s ao copiar o link dentro do modal de sucesso (comprador paga).
    const [copiadoModalSucesso, setCopiadoModalSucesso] = useState(false);
    const handleCopiarLinkModalSucesso = () => {
        if (!linkPagamentoGerado) return;
        navigator.clipboard?.writeText(linkPagamentoGerado);
        setCopiadoModalSucesso(true);
        setTimeout(() => setCopiadoModalSucesso(false), 2000);
    };
    const handleCancelarEdicao = () => {
        setLinkPagamentoGerado(null);
        setPrazoLimiteEdicao(null);
        setMostrarDetalhesTotal(false);
        setMostrarModalCancelar(false);
        onPedidoEmEdicaoChange?.(pedido.id, false);
    };
    // Quando o comprador paga, a edição não conclui na hora — o resumo vira o card "Aguardando
    // pagamento" (mesmo conteúdo da V2 no slideout) em vez da tela cheia de sucesso.
    const [linkPagamentoGerado, setLinkPagamentoGerado] = useState<string | null>(null);
    const [prazoLimiteEdicao, setPrazoLimiteEdicao] = useState<number | null>(null);
    const [mostrarDetalhesTotal, setMostrarDetalhesTotal] = useState(false);
    const [itensEstado, setItensEstado] = useState<Record<string, ItemEdicaoEstado>>({});
    const handleEstadoChange = (idInscricao: string, estado: ItemEdicaoEstado) => {
        setItensEstado((prev) => ({ ...prev, [idInscricao]: estado }));
    };

    const estados = Object.values(itensEstado);
    const algumaAlteracao = estados.some((e) => e.temAlteracao);
    // Valor original é fixo — o total original do pedido, sempre o mesmo independente do que for
    // selecionado na edição. Valor atual reflete as trocas de modalidade feitas (igual ao
    // original em quem não trocou). A diferença entre os dois (excedente) é o que entra na conta
    // do total — só existe se o valor atual passar do original; se ficou mais barato, não há
    // reembolso.
    const precoOriginal = estados.reduce((s, e) => s + e.valorPagoItem, 0);
    const trocaDeItem = estados.reduce((s, e) => s + e.valorAtualItem, 0);
    const excedente = Math.max(0, trocaDeItem - precoOriginal);
    const custoDeEdicao = estados.reduce((s, e) => s + e.custoTaxa, 0);
    // Simula o produtor ter cadastrado uma taxa própria no produto — só cobrada quando existe.
    const taxaProdutor = PRODUTOR_TEM_TAXA_CADASTRADA ? excedente * TAXA_PRODUTOR_PERCENTUAL : 0;
    // Com o comprador absorvendo o custo de edição, ele sai da conta do comprador e vira uma
    // linha à parte, abatida do saldo da organização — daí o total virar dois valores.
    const absorvendo = quemPaga === "comprador" && absorverCustoEdicao;
    const total = excedente + custoDeEdicao + taxaProdutor;
    const totalParaComprador = excedente + taxaProdutor;
    const totalParaOrganizacao = custoDeEdicao;
    const precisaConfirmarEstoque = estados.some((e) => e.precisaConfirmarEstoque);
    const algumaCategoriaEmBranco = estados.some((e) => e.categoriaEmBranco);
    const algumaModalidadeEmBranco = estados.some((e) => e.modalidadeEmBranco);
    const algumPortadorInvalido = estados.some((e) => e.portadorInvalido);
    const algumQuestionarioIncompleto = estados.some((e) => e.questionarioIncompleto);

    const handleSalvarEGerarPagamento = () => {
        // Sem nenhuma alteração o botão já fica desativado — não dá nem pra chegar aqui, mas a
        // guarda continua por segurança.
        if (salvando || !algumaAlteracao) return;
        setTentouSalvar(true);
        if (algumaCategoriaEmBranco || algumaModalidadeEmBranco || algumPortadorInvalido || algumQuestionarioIncompleto) return;
        if (precisaConfirmarEstoque) return;
        if (!quemPaga) {
            setErroQuemPaga(true);
            return;
        }
        setErroQuemPaga(false);
        setSalvando(true);
        setTimeout(() => {
            setSalvando(false);
            onPedidoEmEdicaoChange?.(pedido.id, true);
            if (quemPaga === "organizacao") {
                setConcluido(true);
                setMostrarModalSucesso(true);
                toast.success("Edição enviada", { description: "A edição foi aplicada imediatamente ao pedido." });
                return;
            }
            // Comprador paga: só efetiva depois do pagamento — o resumo vira o card
            // "Aguardando pagamento" em vez de concluir a edição na hora.
            setLinkPagamentoGerado(`https://cart.ingresse.com/pagamento/${pedido.id}`);
            setPrazoLimiteEdicao(Date.now() + 48 * 60 * 60 * 1000);
            setMostrarModalSucesso(true);
            toast.success("Link de pagamento gerado", {
                description: `Um link de pagamento de ${currencyFormatter.format(absorvendo ? totalParaComprador : total)} foi gerado para o comprador.`,
            });
        }, 3000);
    };

    return (
        // -mt-12 cancela os 48px de padding que já existem ACIMA do <main> (24px do wrapper
        // raiz do BackstageLayout + 24px do próprio <main>), puxando a CAIXA do header pra
        // y=0 — com isso "sticky top-0" já nasce grudado, sem percorrer nenhum pixel (o que
        // causava o header "subir" no início do scroll) e sem deixar aquela faixa sem fundo
        // (o que deixava o conteúdo por trás vazar ao rolar). pt-12 devolve o botão/título pra
        // a mesma posição visual de sempre.
        <div className="flex flex-1 flex-col bg-[#0A0A0A] font-['Elza']">
            <div className="sticky top-0 z-40 -mt-12 mb-6 flex items-center gap-3 bg-[#0A0A0A] pt-8 pb-2">
                <button
                    type="button"
                    aria-label="Voltar"
                    onClick={onSair}
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#171717] text-fg-quaternary ring-1 ring-border-primary transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover"
                >
                    <ChevronLeft className="size-5" aria-hidden="true" />
                </button>
                <h1 className="text-2xl font-bold text-primary">O que você quer mudar?</h1>
            </div>

            <div className="flex items-start gap-6">
                <div className="flex flex-1 flex-col gap-4">
                    {itens.map((it) => (
                        <ItemEdicaoAccordion
                            key={it.idInscricao}
                            item={it}
                            aberto={itemAbertoId === it.idInscricao}
                            onToggle={() => setItemAbertoId((prev) => (prev === it.idInscricao ? null : it.idInscricao))}
                            onEstadoChange={handleEstadoChange}
                            tentouSalvar={tentouSalvar}
                        />
                    ))}
                </div>

                {/* top-[80px] = altura total da caixa do header (pt-8 + botão 40px + pb-2) —
                 * evita que o resumo role por baixo dele ao grudar. */}
                <aside className="sticky top-[80px] flex w-[330px] shrink-0 flex-col rounded-2xl border border-secondary">

                    <div className="rounded-t-2xl border-b border-secondary bg-[#171717] px-4 py-3">
                        <h3 className="text-sm font-medium text-primary">Resumo</h3>
                    </div>
                    {linkPagamentoGerado ? (
                        <div className="flex flex-col gap-4 p-4">
                            <AguardandoPagamentoCard
                                link={linkPagamentoGerado}
                                prazoLimite={prazoLimiteEdicao}
                                onCopiar={() => navigator.clipboard?.writeText(linkPagamentoGerado)}
                                semFundo
                            />
                            <hr className="border-dashed border-secondary" />
                            {mostrarDetalhesTotal && (
                                <div className="flex flex-col gap-3">
                                    <LinhaResumoPreco label="Valor original" valor={precoOriginal} tooltip="Valor original do pedido — não muda com o que for selecionado na edição." />
                                    <LinhaResumoPreco
                                        label="Valor atual"
                                        valor={trocaDeItem}
                                        tooltip="Valor do pedido considerando as trocas de modalidade feitas nesta edição."
                                    />
                                    <LinhaResumoPreco
                                        label="Excedente"
                                        valor={excedente}
                                        tooltip="Diferença entre o valor atual e o valor original — é o que efetivamente entra na conta do total."
                                    />
                                    {!absorvendo && (
                                        <LinhaResumoPreco label="Custo de edição" valor={custoDeEdicao} tooltip="Corresponde a 5% do valor do pedido atualizado." />
                                    )}
                                    {PRODUTOR_TEM_TAXA_CADASTRADA && (
                                        <LinhaResumoPreco
                                            label="Taxa da organização"
                                            valor={taxaProdutor}
                                            tooltip="Taxa cadastrada no item vendido e repassada integralmente ao organizador."
                                        />
                                    )}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => setMostrarDetalhesTotal((v) => !v)}
                                className="flex items-center justify-between text-left"
                            >
                                <span className="flex items-center gap-1 text-sm font-semibold text-primary">
                                    {absorvendo ? "Total para o comprador" : "Total"}
                                    {mostrarDetalhesTotal ? (
                                        <ChevronUp className="size-4 text-fg-quaternary" aria-hidden="true" />
                                    ) : (
                                        <ChevronDown className="size-4 text-fg-quaternary" aria-hidden="true" />
                                    )}
                                </span>
                                <span className="text-sm font-semibold text-primary">
                                    {currencyFormatter.format(absorvendo ? totalParaComprador : total)}
                                </span>
                            </button>
                            {absorvendo && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-tertiary">
                                        <span className="text-sm">Total para organização</span>
                                        <TooltipFundoEscuro title="Custo de edição absorvido pela organização, abatido do saldo dela.">
                                            <TooltipTrigger className="flex items-center text-fg-quaternary transition duration-100 ease-linear hover:text-fg-quaternary_hover">
                                                <HelpCircle className="size-4" aria-hidden="true" />
                                            </TooltipTrigger>
                                        </TooltipFundoEscuro>
                                    </div>
                                    <span className="text-sm text-tertiary">{currencyFormatter.format(totalParaOrganizacao)}</span>
                                </div>
                            )}
                            <Button size="md" color="secondary" className="w-full" onClick={() => setMostrarModalCancelar(true)}>
                                Cancelar edição
                            </Button>
                        </div>
                    ) : (
                    <div className="flex flex-col gap-6 p-4">
                        <div className="flex flex-col gap-3">
                            <span className="text-lg font-semibold text-primary">Quem pagará?</span>
                            <AriaRadioGroup
                                aria-label="Quem pagará?"
                                value={quemPaga}
                                onChange={(v) => {
                                    setQuemPaga(v as "organizacao" | "comprador");
                                    setErroQuemPaga(false);
                                }}
                                className="flex flex-row gap-3"
                            >
                                <ResumoQuemPagaCard
                                    value="organizacao"
                                    icon={Bank}
                                    titulo="A organização"
                                    selecionadoAtual={quemPaga}
                                    onDesmarcar={() => setQuemPaga(null)}
                                />
                                <ResumoQuemPagaCard
                                    value="comprador"
                                    icon={FaceSmile}
                                    titulo="O comprador"
                                    selecionadoAtual={quemPaga}
                                    onDesmarcar={() => setQuemPaga(null)}
                                />
                            </AriaRadioGroup>
                            {quemPaga === "comprador" && (
                                <div className="-mt-1 flex items-center gap-1.5">
                                    <Checkbox
                                        label="Absorver custo de edição"
                                        isSelected={absorverCustoEdicao}
                                        onChange={setAbsorverCustoEdicao}
                                    />
                                    <Tooltip title="O custo da edição será abatido do saldo da organização.">
                                        <TooltipTrigger className="flex items-center text-fg-quaternary transition duration-100 ease-linear hover:text-fg-quaternary_hover">
                                            <HelpCircle className="size-4" aria-hidden="true" />
                                        </TooltipTrigger>
                                    </Tooltip>
                                </div>
                            )}
                            {erroQuemPaga && <span className="text-sm text-error-primary">Selecione quem pagará para continuar</span>}
                        </div>
                        <div className="flex flex-col gap-3">
                            <LinhaResumoPreco label="Valor original" valor={precoOriginal} tooltip="Valor original do pedido — não muda com o que for selecionado na edição." />
                            <LinhaResumoPreco
                                label="Valor atual"
                                valor={trocaDeItem}
                                tooltip="Valor do pedido considerando as trocas de modalidade feitas nesta edição."
                            />
                            <hr className="border-dashed border-secondary" />
                            <LinhaResumoPreco
                                label="Excedente"
                                valor={excedente}
                                tooltip="Diferença entre o valor atual e o valor original — é o que efetivamente entra na conta do total."
                            />
                            {!absorvendo && (
                                <LinhaResumoPreco
                                    label="Custo de edição"
                                    valor={custoDeEdicao}
                                    tooltip="Corresponde a 5% do valor do pedido atualizado."
                                />
                            )}
                            {PRODUTOR_TEM_TAXA_CADASTRADA && (
                                <LinhaResumoPreco
                                    label="Taxa da organização"
                                    valor={taxaProdutor}
                                    tooltip="Taxa cadastrada no item vendido e repassada integralmente ao organizador."
                                />
                            )}
                            <hr className="border-dashed border-secondary" />
                            {absorvendo ? (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-primary">Total para o comprador</span>
                                        <span className="text-sm font-semibold text-primary">{currencyFormatter.format(totalParaComprador)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-tertiary">
                                            <span className="text-sm">Total para organização</span>
                                            <TooltipFundoEscuro title="Custo de edição absorvido pela organização, abatido do saldo dela.">
                                                <TooltipTrigger className="flex items-center text-fg-quaternary transition duration-100 ease-linear hover:text-fg-quaternary_hover">
                                                    <HelpCircle className="size-4" aria-hidden="true" />
                                                </TooltipTrigger>
                                            </TooltipFundoEscuro>
                                        </div>
                                        <span className="text-sm text-tertiary">{currencyFormatter.format(totalParaOrganizacao)}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-primary">Total</span>
                                    <span className="text-sm font-semibold text-primary">{currencyFormatter.format(total)}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-3">
                            {tentouSalvar &&
                                (algumaCategoriaEmBranco ||
                                    algumaModalidadeEmBranco ||
                                    algumPortadorInvalido ||
                                    algumQuestionarioIncompleto ||
                                    precisaConfirmarEstoque) && (
                                    <span className="text-sm text-error-primary">Resolva os erros dos itens para continuar.</span>
                                )}
                            <Button
                                size="md"
                                color={algumaAlteracao ? "primary" : "secondary"}
                                className="w-full"
                                isDisabled={!algumaAlteracao}
                                isLoading={salvando}
                                showTextWhileLoading
                                onClick={handleSalvarEGerarPagamento}
                            >
                                {!algumaAlteracao ? "Nenhuma edição foi feita" : salvando ? "Salvando..." : "Salvar e gerar pagamento"}
                            </Button>
                        </div>
                    </div>
                    )}
                </aside>
            </div>

            <ModalOverlay isOpen={mostrarModalSucesso} onOpenChange={setMostrarModalSucesso} isDismissable>
                <Modal className="sm:max-w-[440px]">
                    <Dialog>
                        {concluido ? (
                            <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                                <div className="flex items-start gap-4">
                                    <FeaturedIcon icon={CheckCircle} color="success" theme="light" size="lg" />
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-lg font-semibold text-primary">Edição enviada</h2>
                                        <p className="text-sm text-tertiary">
                                            A edição já foi aplicada ao pedido <span className="font-medium text-secondary">#{pedido.id}</span>.
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button size="md" color="secondary" onClick={() => setMostrarModalSucesso(false)}>
                                        Ver como ficou a edição
                                    </Button>
                                    <Button size="md" color="primary" onClick={onSair}>
                                        Voltar para Transações
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                                <div className="flex items-start justify-between gap-4">
                                    <FeaturedIcon icon={ClockFastForward} color="gray" theme="modern" size="lg" />
                                    <ButtonUtility size="sm" color="tertiary" icon={XClose} tooltip="Fechar" onClick={() => setMostrarModalSucesso(false)} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <h2 className="text-lg font-semibold text-primary">Aguardando pagamento</h2>
                                    <p className="text-sm text-tertiary">Agora, basta seguir esses passos:</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {[
                                        "Envie o link acima ao comprador.",
                                        "O comprador deve pagar a taxa.",
                                        "Após a confirmação, as edições serão efetivadas automaticamente.",
                                    ].map((passo, i) => (
                                        <div key={passo} className="flex items-start gap-2">
                                            <Badge size="sm" type="pill-color" color="gray" className="size-[22px] shrink-0 justify-center p-0">
                                                {i + 1}
                                            </Badge>
                                            <span className="text-sm text-primary">{passo}</span>
                                        </div>
                                    ))}
                                </div>
                                <InputGroup
                                    size="sm"
                                    aria-label="Link de pagamento"
                                    value={linkPagamentoGerado ?? ""}
                                    isReadOnly
                                    onChange={() => {}}
                                    trailingAddon={
                                        <Button
                                            size="sm"
                                            color="secondary"
                                            iconLeading={copiadoModalSucesso ? <CheckCircle data-icon className="text-fg-success-secondary" /> : Copy01}
                                            onClick={handleCopiarLinkModalSucesso}
                                        >
                                            {copiadoModalSucesso ? "Copiado" : "Copiar"}
                                        </Button>
                                    }
                                >
                                    <InputBase />
                                </InputGroup>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button size="md" color="secondary" onClick={onSair}>
                                        Voltar para transações
                                    </Button>
                                    <Button size="md" color="primary" onClick={() => setMostrarModalSucesso(false)}>
                                        Revisar edição
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Dialog>
                </Modal>
            </ModalOverlay>

            <ModalOverlay isOpen={mostrarModalCancelar} onOpenChange={setMostrarModalCancelar} isDismissable>
                <Modal className="sm:max-w-[440px]">
                    <Dialog>
                        <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                            <div className="flex items-start gap-4">
                                <FeaturedIcon icon={SlashCircle01} color="error" theme="light" size="lg" />
                                <div className="flex flex-col gap-1">
                                    <h2 className="text-lg font-semibold text-primary">Cancelar edição</h2>
                                    <p className="text-sm text-tertiary">
                                        Tem certeza que quer cancelar? O link de pagamento deixará de valer e as alterações feitas neste pedido serão
                                        perdidas.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Button size="md" color="secondary" onClick={() => setMostrarModalCancelar(false)}>
                                    Voltar
                                </Button>
                                <Button size="md" color="primary-destructive" onClick={handleCancelarEdicao}>
                                    Cancelar edição
                                </Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </div>
    );
};

const ListaTransacoesCard = ({
    rows,
    onAbrirEdicaoWizard,
    pedidosEmEdicao,
}: {
    rows: Transacao[];
    onAbrirEdicaoWizard: (pedido: Transacao, itens: Transacao[]) => void;
    /** IDs de pedido já editados pelo wizard — mora no componente pai porque a lista
     * inteira desmonta enquanto o wizard está aberto (ver Transacoes3). */
    pedidosEmEdicao: Set<string>;
}) => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [search, setSearch] = useState("");
    const [isManageColumnsOpen, setIsManageColumnsOpen] = useState(false);
    const [selectedFields, setSelectedFields] = useState<string[]>(DEFAULT_SELECTED);
    const [isManageTransacaoColumnsOpen, setIsManageTransacaoColumnsOpen] = useState(false);
    const [selectedTransacaoFields, setSelectedTransacaoFields] = useState<string[]>(TRANSACAO_MODE_DEFAULT_KEYS);
    const [modo, setModo] = useState<ModoTabela>("transacao");
    const [selectedPedido, setSelectedPedido] = useState<Transacao | null>(null);

    const transacaoColumnByFieldId = useMemo(() => new Map(TRANSACAO_MODE_COLUMNS.map((col) => [String(col.key), col])), []);
    const visibleColumns = useMemo(
        () => selectedFields.map((fieldId) => COLUMN_BY_FIELD_ID.get(fieldId)).filter((col): col is NonNullable<typeof col> => Boolean(col)),
        [selectedFields],
    );
    const visibleTransacaoColumns = useMemo(
        () => selectedTransacaoFields.map((fieldId) => transacaoColumnByFieldId.get(fieldId)).filter((col): col is NonNullable<typeof col> => Boolean(col)),
        [selectedTransacaoFields, transacaoColumnByFieldId],
    );

    // Modo "Transação": um item por ID de pedido (agrupa os itens do mesmo pedido).
    const transacaoRows = useMemo(() => dedupePorPedido(rows), [rows]);

    const baseRows = modo === "transacao" ? transacaoRows : rows;
    const activeColumns = modo === "transacao" ? visibleTransacaoColumns : visibleColumns;
    const renderCell = modo === "transacao" ? renderTransacaoModeCell : renderTransacaoCell;

    // No modo "Transação" a busca não deve considerar campos de item (ex.: "setor", que é a
    // categoria do item, não do pedido) — só o que de fato aparece nas colunas desse modo.
    const searched = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return baseRows;
        const campos =
            modo === "transacao"
                ? (t: Transacao) => [t.id, STATUS_META[t.status].label, t.comprador, t.cpf, t.telefone, t.email]
                : (t: Transacao) => [t.id, STATUS_META[t.status].label, t.setor, t.comprador, t.cpf, t.telefone, t.email];
        return baseRows.filter((t) => campos(t).join(" ").toLowerCase().includes(term));
    }, [baseRows, search, modo]);

    const { sorted, sortKey, sortDir, toggleSort } = useSortableTable(
        searched as unknown as Record<string, unknown>[],
        SORT_ACCESSORS as Partial<Record<string, (r: Record<string, unknown>) => string | number>>,
    );

    useEffect(() => {
        setPage(1);
    }, [search, rows, modo]);

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
                    Registro de vendas
                    <Badge size="sm" color="gray" type="pill-color">
                        {numberFormatter.format(sorted.length)}
                    </Badge>
                </>
            }
            headerRight={
                <Tabs selectedKey={modo} onSelectionChange={(key) => setModo(key as ModoTabela)} className="!w-auto">
                    <Tabs.List type="button-border" size="sm">
                        <Tabs.Item id="item">Item</Tabs.Item>
                        <Tabs.Item id="transacao">Transação</Tabs.Item>
                    </Tabs.List>
                </Tabs>
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
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        size="sm"
                        color="secondary"
                        iconLeading={Edit02}
                        onClick={() => (modo === "item" ? setIsManageColumnsOpen(true) : setIsManageTransacaoColumnsOpen(true))}
                    >
                        Editar colunas
                    </Button>
                    <ExportMenu
                        size="sm"
                        formats={["excel", "csv"]}
                        onExport={(f) => toast.success(`Exportando ${f.toUpperCase()}`, { description: "As transações serão exportadas." })}
                        onEditColumnsAndExport={() => (modo === "item" ? setIsManageColumnsOpen(true) : setIsManageTransacaoColumnsOpen(true))}
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

            <ManageColumnsModal
                isOpen={isManageTransacaoColumnsOpen}
                onClose={() => setIsManageTransacaoColumnsOpen(false)}
                selected={selectedTransacaoFields}
                onSelectedChange={setSelectedTransacaoFields}
                onExport={(fields) => toast.success("Exportação concluída", { description: `${fields.length} colunas foram exportadas.` })}
                groups={TRANSACAO_COLUMN_GROUPS}
                anchorFieldId={TRANSACAO_MODE_ANCHOR_KEY}
                defaultSelected={TRANSACAO_MODE_DEFAULT_KEYS}
                description="Selecione as colunas exibidas na tabela de transações."
            />

            <TransacaoDetailsSlideOut
                isOpen={selectedPedido !== null}
                pedido={selectedPedido}
                itens={selectedPedido ? rows.filter((r) => r.id === selectedPedido.id) : []}
                onClose={() => setSelectedPedido(null)}
                onAbrirEdicaoWizard={onAbrirEdicaoWizard}
                pedidosEmEdicao={pedidosEmEdicao}
            />

            <div className="max-h-[484px] overflow-x-auto overflow-y-auto">
                {/* key={modo}: força remontagem completa da tabela ao trocar de aba — as duas
                 * visões têm formatos de coluna/linha bem diferentes, então não vale a pena
                 * arriscar reaproveitamento de nó do DOM entre elas. */}
                <table key={modo} className="w-full border-collapse">
                    <thead className="sticky top-0 z-10 bg-secondary">
                        <tr className="border-b border-secondary bg-secondary text-left">
                            {activeColumns.map((col) => (
                                <th
                                    key={String(col.key)}
                                    className={cx(
                                        "whitespace-nowrap px-4 py-3 text-sm font-semibold text-tertiary",
                                        col.align === "right" && "text-right",
                                        col.key === "comprador" && "w-full",
                                    )}
                                >
                                    <SortableHeader label={col.label} align={col.align} sortKey={String(col.key)} activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {visibleRows.length === 0 && (
                            <tr>
                                <td colSpan={activeColumns.length} className="px-4 py-12 text-center text-sm text-tertiary">
                                    Nenhuma transação corresponde aos filtros aplicados.
                                </td>
                            </tr>
                        )}
                        {visibleRows.map((row, i) => (
                            <tr
                                // No modo Item, várias linhas compartilham o mesmo `id` de pedido (um por item
                                // do pedido) — usar só `row.id` como key duplicaria chaves entre irmãos e podia
                                // fazer o React reaproveitar um <tr>/<td> de um modo no outro ao trocar de aba.
                                key={modo === "transacao" ? row.id : row.idInscricao}
                                onClick={modo === "transacao" ? () => setSelectedPedido(row) : undefined}
                                className={cx(
                                    "transition duration-100 ease-linear hover:bg-primary_hover",
                                    i !== visibleRows.length - 1 && "border-b border-secondary",
                                    modo === "transacao" && "cursor-pointer",
                                )}
                            >
                                {activeColumns.map((col) => (
                                    <td
                                        key={String(col.key)}
                                        className={cx(
                                            "whitespace-nowrap px-4 py-4 text-sm text-tertiary",
                                            col.align === "right" && "text-right",
                                            col.key === "id" && "font-mono text-sm text-secondary",
                                            col.key === "comprador" && "w-full",
                                        )}
                                    >
                                        {renderCell(row, col.key, pedidosEmEdicao.has(row.id))}
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
