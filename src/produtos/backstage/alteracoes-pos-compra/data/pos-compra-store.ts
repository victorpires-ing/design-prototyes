import { useSyncExternalStore } from "react";
import CAPA_MARATONA from "../../../../assets/event-cover.png";
import CAPA_TRAIL from "../../../../assets/gremio-hero.webp";
import CAPA_TRIATHLON from "../../../../assets/gremio-poster-taca.jpeg";
import FOTO_CAMISETA from "../../../../assets/products/camisa_oficial/1.webp";
import FOTO_KIT from "../../../../assets/products/kit_oficial/1.png";
import FOTO_COPO from "../../../../assets/products/copo_oficial/1.png";
import FOTO_SACOCHILA from "../../../../assets/products/sacochila/1.webp";
import FOTO_TIRANTE from "../../../../assets/products/tirante/1.png";

/* ------------------------------------------------------------------ */
/*  Regras de negócio (valores fixos do protótipo)                     */
/* ------------------------------------------------------------------ */

/** Taxa fixa cobrada em qualquer troca de item/modalidade. */
export const TAXA_TROCA_ITEM = 20;
/** Taxa fixa cobrada em qualquer troca de titularidade. */
export const TAXA_TITULARIDADE = 15;
/** Taxa única por operação de edição de respostas, independente de quantas respostas mudam. */
export const TAXA_EDICAO_FORMULARIO = 10;
/** Taxa de processamento aplicada sobre o subtotal da operação. */
export const TAXA_PROCESSAMENTO = 0.02;
/** Prazo real de pagamento: 1 hora. No protótipo o timer roda acelerado. */
export const PRAZO_REAL_LABEL = "1 hora";
/** Prazo acelerado usado na demonstração (em segundos). */
export const PRAZO_DEMO_SEGUNDOS = 60;
/** Antecedência mínima para trocar para uma sessão. */
export const PRAZO_TROCA_HORAS = 24;

/* ------------------------------------------------------------------ */
/*  Tipos                                                              */
/* ------------------------------------------------------------------ */

export type StatusPedido =
    /** Compra saudável: paga, sem nenhuma alteração pedida. */
    | "ativo"
    /** Já passou por uma alteração pós-compra que terminou bem. */
    | "alteracao-concluida"
    | "aguardando-pagamento"
    | "pago-processando"
    | "expirado"
    | "falha";

export type TipoOperacao = "troca-item" | "troca-titularidade" | "alterar-respostas";

export interface Conta {
    id: string;
    nome: string;
    email: string;
    cpf: string;
    nascimento: string;
    celular: string;
    genero: "F" | "M" | "outro";
    socio: boolean;
}

export interface OpcaoResposta {
    valor: string;
    /** Quando definido, a opção controla estoque próprio (ex.: tamanho de camiseta). */
    estoque?: number;
}

/** Nem toda pergunta é de escolha: formulários de inscrição também têm texto livre e anexo. */
export type TipoPergunta = "opcao" | "texto" | "anexo";

export interface Pergunta {
    id: string;
    label: string;
    tipo: TipoPergunta;
    /** Vazio para perguntas de texto e de anexo. */
    opcoes: OpcaoResposta[];
    /** Só para tipo "texto". */
    limiteCaracteres?: number;
    /** Só para tipo "anexo". */
    formatosAceitos?: string;
    ajuda?: string;
}

export interface Formulario {
    id: string;
    nome: string;
    perguntaIds: string[];
}

/** Sessão: a ocorrência do evento em uma data, horário e local. Os itens vivem dentro dela. */
export interface Sessao {
    id: string;
    eventoId: string;
    /** Timestamp do início, usado nas regras de prazo. */
    inicio: number;
    dataLabel: string;
    horaLabel: string;
}

/** Um pedido pode misturar ingresso, produto e combo, como na bilheteria. */
export type TipoItem = "ingresso" | "produto" | "combo";

export const TIPO_ITEM_LABEL: Record<TipoItem, string> = {
    ingresso: "Ingresso",
    produto: "Produto",
    combo: "Combo",
};

export interface CatalogoItem {
    id: string;
    tipo: TipoItem;
    eventoId: string;
    nome: string;
    modalidade: string;
    precoIntegral: number;
    estoque: number;
    formularioId?: string;
    /** Regra de segmentação simulada que restringe quem pode assumir o item. */
    segmentacao?: "feminino" | "socio";
    /** Hierarquia do catálogo: sessão > grupo > item. Produto não tem sessão nem grupo. */
    sessaoId?: string;
    grupo?: string;
    /** Lote do ingresso, quando houver. */
    lote?: string;
    descricao?: string;
    /** Foto do produto. Ingresso e combo usam ícone. */
    foto?: string;
    /** Datas cobertas por um combo. */
    datasCombo?: string[];
}

/** Uma linha do pedido: o mesmo pedido pode ter várias. */
export interface PedidoItem {
    id: string;
    itemId: string;
    /** Titular desta linha. Ausente significa o comprador; preenchido, o item foi transferido. */
    titularId?: string;
    /** Valor efetivamente pago nesta linha (pode ser menor que o preço integral). */
    valorPago: number;
    /** Quando a transferência foi concluída, para a linha virar registro legível. */
    transferidoEmLabel?: string;
    respostas: Record<string, string>;
}

export interface EventoOrg {
    id: string;
    nome: string;
    data: string;
    /** Arte do evento, mostrada no cabeçalho do pedido. */
    capa: string;
}

export interface EntradaHistorico {
    id: string;
    dataLabel: string;
    responsavel: string;
    titulo: string;
    descricao: string;
    /** Linhas curtas com o que exatamente mudou: itens, quantidades, de quem para quem. */
    detalhes?: string[];
    valor?: number;
    estado: "concluido" | "expirado" | "falha" | "pendente";
}

export interface LinhaCobranca {
    label: string;
    valor: number;
    /** Explicação curta da regra aplicada nessa linha. */
    regra?: string;
    destaque?: boolean;
}

export interface Solicitacao {
    id: string;
    tipo: TipoOperacao;
    resumo: string;
    linhas: LinhaCobranca[];
    total: number;
    criadoEm: number;
    expiraEm: number;
    /** Link de checkout enviado ao participante, no mesmo formato da bilheteria. */
    linkPagamento: string;
    detalhes?: string[];
    /** Linhas presas nesta operação: elas não entram em outra enquanto isso não resolver. */
    linhasAfetadas: string[];
    /** Aguardando o pagamento ou já pago e sendo aplicado. */
    estado: "aguardando" | "processando";
    /** Payload aplicado apenas quando o pagamento é confirmado. */
    aplicar: {
        /** Trocas em lote: cada linha do pedido vira o item de destino indicado. */
        trocas?: Array<{ pedidoItemId: string; novoItemId: string }>;
        /** Respostas por linha do pedido. */
        respostasPorItem?: Record<string, Record<string, string>>;
        /** Novo titular por linha: permite transferir parte do pedido. */
        titularPorLinha?: Record<string, string>;
    };
    /** Reservas de estoque a liberar caso a solicitação expire. */
    reservas: Array<{ tipo: "item"; itemId: string } | { tipo: "resposta"; perguntaId: string; valor: string }>;
}

export interface Pedido {
    /** Identificador do pedido: UUID, como no sistema. Também é o id da rota. */
    id: string;
    eventoId: string;
    /** O pedido tem um comprador só. Titularidade é por item. */
    compradorId: string;
    itens: PedidoItem[];
    dataCompraLabel: string;
    /* Metadados da compra, mostrados no cabeçalho do pedido. */
    canal: "Online" | "Bilheteria" | "Cortesia";
    meioPagamento: string;
    cupom?: string;
    criadoEmLabel: string;
    atualizadoEmLabel: string;
    /** Situação mostrada na lista: sai das solicitações abertas ou da situação de fundo. */
    status: StatusPedido;
    /** Para onde o pedido volta quando não há nenhuma operação aberta. */
    baseStatus: StatusPedido;
    /** Operações abertas ao mesmo tempo, cada uma com sua cobrança e seu prazo. */
    solicitacoes: Solicitacao[];
    historico: EntradaHistorico[];
}

/* ------------------------------------------------------------------ */
/*  Dados fictícios                                                    */
/* ------------------------------------------------------------------ */

/* Datas relativas ao dia de hoje para o protótipo nunca ficar com sessões vencidas por acidente. */
const criarSessao = (id: string, eventoId: string, dias: number, hora: number, minuto: number): Sessao => {
    const inicio = new Date();
    inicio.setDate(inicio.getDate() + dias);
    inicio.setHours(hora, minuto, 0, 0);
    return {
        id,
        eventoId,
        inicio: inicio.getTime(),
        dataLabel: inicio.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).replace(".", ""),
        horaLabel: inicio.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };
};

const ARENA = "Arena das Dunas";
const PONTA_NEGRA = "Praia de Ponta Negra";

/** Nível 1 da hierarquia: sessões do evento. */
export const SESSOES: Sessao[] = [
    criarSessao("s-mar-class", "ev-maratona", -3, 6, 0),
    criarSessao("s-mar-noturna", "ev-maratona", 0, 20, 0),
    criarSessao("s-mar-d1", "ev-maratona", 27, 6, 0),
    criarSessao("s-mar-d2", "ev-maratona", 28, 5, 0),
    criarSessao("s-trail-d1", "ev-trail", 69, 7, 0),
    criarSessao("s-trail-d2", "ev-trail", 70, 4, 30),
    criarSessao("s-tri-d1", "ev-triathlon", 83, 6, 0),
    criarSessao("s-tri-d2", "ev-triathlon", 84, 7, 0),
];

export const EVENTOS: EventoOrg[] = [
    { id: "ev-maratona", nome: "Maratona Internacional de Natal", data: SESSOES[2].dataLabel, capa: CAPA_MARATONA },
    { id: "ev-trail", nome: "Trail Run Serra do Mel", data: SESSOES[4].dataLabel, capa: CAPA_TRAIL },
    { id: "ev-triathlon", nome: "Triathlon Costa Branca", data: SESSOES[6].dataLabel, capa: CAPA_TRIATHLON },
];

/** Nível 2 e 3: cada item pertence a um grupo dentro de uma sessão. */
const GRUPO_RUA = "Provas de rua";
const GRUPO_LONGAS = "Provas longas";
const GRUPO_SEGMENTADOS = "Lotes segmentados";
const GRUPO_TRAIL = "Trail";
const GRUPO_INDIVIDUAL = "Provas individuais";
const GRUPO_EQUIPE = "Provas em equipe";

export const PERGUNTAS: Pergunta[] = [
    {
        id: "p-camiseta",
        label: "Tamanho da camiseta",
        tipo: "opcao",
        opcoes: [
            { valor: "PP", estoque: 12 },
            { valor: "P", estoque: 0 },
            { valor: "M", estoque: 48 },
            { valor: "G", estoque: 31 },
            { valor: "GG", estoque: 7 },
        ],
    },
    {
        id: "p-kit",
        label: "Local de retirada do kit",
        tipo: "opcao",
        opcoes: [
            { valor: ARENA, estoque: 220 },
            { valor: "Midway Mall", estoque: 0 },
            { valor: PONTA_NEGRA, estoque: 85 },
        ],
    },
    {
        id: "p-equipe",
        label: "Equipe / assessoria",
        tipo: "opcao",
        opcoes: [{ valor: "Sem equipe" }, { valor: "Run Potiguar" }, { valor: "Dunas Team" }, { valor: "Costa Branca Bike" }],
    },
    {
        id: "p-emergencia",
        label: "Contato de emergência",
        tipo: "opcao",
        opcoes: [{ valor: "Familiar" }, { valor: "Amigo" }, { valor: "Assessoria" }],
    },
    { id: "p-restricao", label: "Restrição alimentar", tipo: "opcao", opcoes: [{ valor: "Nenhuma" }, { valor: "Vegetariana" }, { valor: "Vegana" }, { valor: "Sem glúten" }] },
    { id: "p-sangue", label: "Tipo sanguíneo", tipo: "opcao", opcoes: [{ valor: "A+" }, { valor: "A-" }, { valor: "O+" }, { valor: "O-" }, { valor: "AB+" }] },
    {
        id: "p-transporte",
        label: "Transporte para a largada",
        tipo: "opcao",
        opcoes: [{ valor: "Por conta própria" }, { valor: "Ônibus oficial", estoque: 24 }, { valor: "Carona solidária", estoque: 0 }],
    },
    { id: "p-conheceu", label: "Como conheceu o evento", tipo: "opcao", opcoes: [{ valor: "Assessoria" }, { valor: "Redes sociais" }, { valor: "Indicação" }, { valor: "Edição anterior" }] },
    { id: "p-seguro", label: "Seguro do atleta", tipo: "opcao", opcoes: [{ valor: "Não contratado" }, { valor: "Básico" }, { valor: "Completo" }] },
    {
        id: "p-historico",
        label: "Histórico médico e observações",
        tipo: "texto",
        opcoes: [],
        limiteCaracteres: 600,
        ajuda: "Texto livre preenchido pelo participante. Pode ser longo, então a leitura fica recolhida por padrão.",
    },
    {
        id: "p-atestado",
        label: "Atestado médico",
        tipo: "anexo",
        opcoes: [],
        formatosAceitos: "PDF, JPG ou PNG de até 5 MB",
        ajuda: "O arquivo enviado pelo participante. Trocar a resposta substitui o anexo anterior.",
    },
    { id: "p-categoria-etaria", label: "Categoria etária", tipo: "opcao", opcoes: [{ valor: "Juvenil (até 19)" }, { valor: "Adulto (20–34)" }, { valor: "Master 35 (35–39)" }, { valor: "Master 40 (40–44)" }, { valor: "Master 45 (45–49)" }, { valor: "Master 50+" }] },
    { id: "p-genero-prova", label: "Gênero da prova", tipo: "opcao", opcoes: [{ valor: "Masculino" }, { valor: "Feminino" }, { valor: "Não-binário" }] },
    { id: "p-traje-natacao", label: "Traje de natação", tipo: "opcao", opcoes: [{ valor: "Maiô/Sunga" }, { valor: "Wetsuit próprio" }, { valor: "Wetsuit alugado", estoque: 18 }] },
    { id: "p-bicicleta", label: "Tipo de bicicleta", tipo: "opcao", opcoes: [{ valor: "Speed" }, { valor: "Triathlon / TT" }, { valor: "Mountain bike" }, { valor: "Gravel" }] },
    { id: "p-sapatilha", label: "Número da sapatilha (ciclismo)", tipo: "opcao", opcoes: [{ valor: "36" }, { valor: "37" }, { valor: "38" }, { valor: "39" }, { valor: "40" }, { valor: "41" }, { valor: "42" }, { valor: "43" }, { valor: "44" }] },
    { id: "p-capacete", label: "Tipo de capacete", tipo: "opcao", opcoes: [{ valor: "Convencional" }, { valor: "Aerodinâmico" }] },
    { id: "p-chip", label: "Local de retirada do chip", tipo: "opcao", opcoes: [{ valor: ARENA, estoque: 160 }, { valor: PONTA_NEGRA, estoque: 40 }] },
    { id: "p-estacionamento", label: "Estacionamento", tipo: "opcao", opcoes: [{ valor: "Não preciso" }, { valor: "Credencial de carro", estoque: 30 }, { valor: "Credencial de moto", estoque: 20 }] },
    { id: "p-acompanhante", label: "Nome do acompanhante no pit lane", tipo: "texto", opcoes: [], limiteCaracteres: 120, ajuda: "Pessoa que poderá acessar a área restrita durante a prova." },
    { id: "p-voluntario", label: "Interesse em voluntariar em edições futuras", tipo: "opcao", opcoes: [{ valor: "Sim, adoraria!" }, { valor: "Talvez" }, { valor: "Não tenho interesse" }] },
    { id: "p-foto-pacote", label: "Pacote fotográfico", tipo: "opcao", opcoes: [{ valor: "Não quero" }, { valor: "Digital (R$ 89)", estoque: 999 }, { valor: "Digital + impresso (R$ 149)", estoque: 999 }] },
    { id: "p-nota-fiscal", label: "Emitir nota fiscal em nome de", tipo: "opcao", opcoes: [{ valor: "CPF do atleta" }, { valor: "CNPJ (informar nos dados)" }, { valor: "Não preciso de NF" }] },
    { id: "p-primeiro-evento", label: "Primeira participação neste evento", tipo: "opcao", opcoes: [{ valor: "Sim, é minha estreia" }, { valor: "Já participei 1 vez" }, { valor: "Já participei 2 vezes ou mais" }] },
    { id: "p-nivel", label: "Nível competitivo", tipo: "opcao", opcoes: [{ valor: "Iniciante" }, { valor: "Amador" }, { valor: "Competitivo" }, { valor: "Elite" }] },
];

export const FORMULARIOS: Formulario[] = [
    { id: "f-corrida", nome: "Formulário de corrida de rua", perguntaIds: ["p-camiseta", "p-kit", "p-equipe"] },
    { id: "f-trail", nome: "Formulário de trail", perguntaIds: ["p-camiseta", "p-equipe", "p-emergencia", "p-historico", "p-atestado"] },
    { id: "f-triathlon", nome: "Formulário de triathlon", perguntaIds: ["p-camiseta", "p-kit", "p-emergencia"] },
    {
        id: "f-completo",
        nome: "Formulário completo do olímpico",
        perguntaIds: [
            "p-camiseta",
            "p-kit",
            "p-equipe",
            "p-emergencia",
            "p-restricao",
            "p-sangue",
            "p-transporte",
            "p-conheceu",
            "p-seguro",
            "p-historico",
            "p-atestado",
            "p-categoria-etaria",
            "p-genero-prova",
            "p-traje-natacao",
            "p-bicicleta",
            "p-sapatilha",
            "p-capacete",
            "p-chip",
            "p-estacionamento",
            "p-nivel",
        ],
    },
];

export const CATALOGO: CatalogoItem[] = [
    /* Ingressos: sempre dentro de uma sessão. */
    { id: "it-mar-class", tipo: "ingresso", eventoId: "ev-maratona", sessaoId: "s-mar-class", grupo: GRUPO_RUA, lote: "Lote único", nome: "Corrida 5 km classificatória", modalidade: "5 km", precoIntegral: 90, estoque: 12, formularioId: "f-completo" },
    { id: "it-mar-noturna", tipo: "ingresso", eventoId: "ev-maratona", sessaoId: "s-mar-noturna", grupo: GRUPO_RUA, lote: "Lote 2", nome: "Corrida 5 km noturna", modalidade: "5 km", precoIntegral: 140, estoque: 30, formularioId: "f-completo" },
    { id: "it-mar-5k", tipo: "ingresso", eventoId: "ev-maratona", sessaoId: "s-mar-d1", grupo: GRUPO_RUA, lote: "Lote 2", nome: "Corrida 5 km", modalidade: "5 km", precoIntegral: 120, estoque: 64, formularioId: "f-completo" },
    { id: "it-mar-10k", tipo: "ingresso", eventoId: "ev-maratona", sessaoId: "s-mar-d1", grupo: GRUPO_RUA, lote: "Lote 2", nome: "Corrida 10 km", modalidade: "10 km", precoIntegral: 180, estoque: 23, formularioId: "f-completo" },
    {
        id: "it-mar-fem",
        tipo: "ingresso",
        eventoId: "ev-maratona",
        sessaoId: "s-mar-d1",
        grupo: GRUPO_SEGMENTADOS,
        lote: "Lote único",
        nome: "Corrida 10 km feminina",
        modalidade: "10 km",
        precoIntegral: 170,
        estoque: 18,
        formularioId: "f-completo",
        segmentacao: "feminino",
    },
    { id: "it-mar-21k", tipo: "ingresso", eventoId: "ev-maratona", sessaoId: "s-mar-d2", grupo: GRUPO_LONGAS, lote: "Lote 3", nome: "Meia maratona 21 km", modalidade: "21 km", precoIntegral: 260, estoque: 0, formularioId: "f-completo" },
    { id: "it-mar-42k", tipo: "ingresso", eventoId: "ev-maratona", sessaoId: "s-mar-d2", grupo: GRUPO_LONGAS, lote: "Lote 3", nome: "Maratona 42 km", modalidade: "42 km", precoIntegral: 340, estoque: 9, formularioId: "f-completo" },
    {
        id: "it-mar-socio",
        tipo: "ingresso",
        eventoId: "ev-maratona",
        sessaoId: "s-mar-d2",
        grupo: GRUPO_SEGMENTADOS,
        lote: "Lote único",
        nome: "Meia maratona sócio clube",
        modalidade: "21 km",
        precoIntegral: 200,
        estoque: 14,
        formularioId: "f-completo",
        segmentacao: "socio",
    },
    { id: "it-trail-12k", tipo: "ingresso", eventoId: "ev-trail", sessaoId: "s-trail-d1", grupo: GRUPO_TRAIL, lote: "Lote 2", nome: "Trail 12 km", modalidade: "12 km", precoIntegral: 150, estoque: 40, formularioId: "f-completo" },
    { id: "it-trail-24k", tipo: "ingresso", eventoId: "ev-trail", sessaoId: "s-trail-d1", grupo: GRUPO_TRAIL, lote: "Lote 2", nome: "Trail 24 km", modalidade: "24 km", precoIntegral: 230, estoque: 11, formularioId: "f-completo" },
    { id: "it-trail-42k", tipo: "ingresso", eventoId: "ev-trail", sessaoId: "s-trail-d2", grupo: GRUPO_LONGAS, lote: "Lote 1", nome: "Ultra trail 42 km", modalidade: "42 km", precoIntegral: 390, estoque: 0, formularioId: "f-completo" },
    { id: "it-tri-sprint", tipo: "ingresso", eventoId: "ev-triathlon", sessaoId: "s-tri-d1", grupo: GRUPO_INDIVIDUAL, lote: "Lote 2", nome: "Triathlon sprint", modalidade: "Sprint", precoIntegral: 280, estoque: 26, formularioId: "f-completo" },
    { id: "it-tri-olimpico", tipo: "ingresso", eventoId: "ev-triathlon", sessaoId: "s-tri-d1", grupo: GRUPO_INDIVIDUAL, lote: "Lote 2", nome: "Triathlon olímpico", modalidade: "Olímpico", precoIntegral: 420, estoque: 6, formularioId: "f-completo" },
    { id: "it-tri-revezamento", tipo: "ingresso", eventoId: "ev-triathlon", sessaoId: "s-tri-d2", grupo: GRUPO_EQUIPE, lote: "Lote 1", nome: "Revezamento em dupla", modalidade: "Dupla", precoIntegral: 330, estoque: 15 },

    /* Produtos: não têm sessão nem formulário. */
    { id: "pr-camiseta-extra", tipo: "produto", eventoId: "ev-maratona", foto: FOTO_CAMISETA, nome: "Camiseta extra do evento", modalidade: "Unidade", descricao: "Segunda camiseta oficial, retirada junto com o kit.", precoIntegral: 80, estoque: 45 },
    { id: "pr-medalha", tipo: "produto", eventoId: "ev-maratona", foto: FOTO_TIRANTE, nome: "Medalha personalizada", modalidade: "Unidade", descricao: "Gravação do nome e do tempo final.", precoIntegral: 60, estoque: 0 },
    { id: "pr-foto", tipo: "produto", eventoId: "ev-maratona", foto: FOTO_COPO, nome: "Pacote de fotos", modalidade: "Unidade", descricao: "Todas as fotos do atleta em alta resolução.", precoIntegral: 45, estoque: 200 },
    { id: "pr-trail-bastao", tipo: "produto", eventoId: "ev-trail", foto: FOTO_SACOCHILA, nome: "Bastão de trail", modalidade: "Par", descricao: "Aluguel do par de bastões para a prova.", precoIntegral: 70, estoque: 18 },
    { id: "pr-trail-transfer", tipo: "produto", eventoId: "ev-trail", foto: FOTO_KIT, nome: "Transfer para a largada", modalidade: "Ida e volta", descricao: "Saída de Natal às 4h.", precoIntegral: 55, estoque: 24 },
    { id: "pr-tri-aluguel", tipo: "produto", eventoId: "ev-triathlon", foto: FOTO_SACOCHILA, nome: "Aluguel de roupa de neoprene", modalidade: "Unidade", descricao: "Retirada na véspera, na arena de transição.", precoIntegral: 110, estoque: 9 },

    /* Combos: pacote de ingresso mais produtos. */
    {
        id: "cb-mar-completo",
        tipo: "combo",
        eventoId: "ev-maratona",
        grupo: "Pacotes",
        nome: "Combo maratona completa",
        modalidade: "42 km + extras",
        descricao: "Maratona 42 km, camiseta extra e pacote de fotos.",
        datasCombo: ["13 de out., 05:00"],
        precoIntegral: 430,
        estoque: 7,
        formularioId: "f-completo",
    },
    {
        id: "cb-mar-dupla",
        tipo: "combo",
        eventoId: "ev-maratona",
        grupo: "Pacotes",
        nome: "Combo duas provas",
        modalidade: "5 km + 10 km",
        descricao: "Corrida 5 km e corrida 10 km no mesmo dia, com kit único.",
        datasCombo: ["12 de out., 06:00"],
        precoIntegral: 270,
        estoque: 0,
        formularioId: "f-completo",
    },
    {
        id: "cb-trail-fds",
        tipo: "combo",
        eventoId: "ev-trail",
        grupo: "Pacotes",
        nome: "Combo fim de semana trail",
        modalidade: "12 km + 24 km",
        descricao: "As duas provas do fim de semana, com transfer incluído.",
        datasCombo: ["23 de nov., 07:00", "24 de nov., 04:30"],
        precoIntegral: 340,
        estoque: 5,
        formularioId: "f-completo",
    },
    {
        id: "cb-tri-premium",
        tipo: "combo",
        eventoId: "ev-triathlon",
        grupo: "Pacotes",
        nome: "Combo triathlon premium",
        modalidade: "Olímpico + extras",
        descricao: "Triathlon olímpico, aluguel de neoprene e pacote de fotos.",
        datasCombo: ["07 de dez., 06:00"],
        precoIntegral: 520,
        estoque: 4,
        formularioId: "f-completo",
    },
];

export const CONTAS: Conta[] = [
    { id: "c-ana", nome: "Ana Beatriz Correia", email: "ana.correia@email.com", cpf: "012.345.678-90", nascimento: "03/09/1986", celular: "+55 (84) 98812-4407", genero: "F", socio: true },
    { id: "c-rafael", nome: "Rafael Menezes", email: "rafael.menezes@email.com", cpf: "123.456.789-01", nascimento: "27/01/1994", celular: "+55 (81) 99735-1180", genero: "M", socio: false },
    { id: "c-juliana", nome: "Juliana Prado", email: "juliana.prado@email.com", cpf: "234.567.890-12", nascimento: "15/06/1979", celular: "+55 (84) 99420-7788", genero: "F", socio: false },
    { id: "c-marcos", nome: "Marcos Vinícius Leite", email: "marcos.leite@email.com", cpf: "345.678.901-23", nascimento: "08/11/1990", celular: "+55 (11) 98164-3301", genero: "M", socio: true },
    { id: "c-carol", nome: "Carolina Sampaio", email: "carolina.sampaio@email.com", cpf: "456.789.012-34", nascimento: "30/03/1983", celular: "+55 (84) 99901-2255", genero: "F", socio: false },
    { id: "c-diego", nome: "Diego Fontes", email: "diego.fontes@email.com", cpf: "567.890.123-45", nascimento: "19/07/1996", celular: "+55 (85) 98123-9040", genero: "M", socio: false },
    { id: "c-leticia", nome: "Letícia Amaral", email: "leticia.amaral@email.com", cpf: "678.901.234-56", nascimento: "22/12/1988", celular: "+55 (84) 99688-4512", genero: "F", socio: true },
    { id: "c-paulo", nome: "Paulo Henrique Braga", email: "paulo.braga@email.com", cpf: "789.012.345-67", nascimento: "12/04/1991", celular: "+55 (84) 99164-2210", genero: "M", socio: false },
];

/* UUID determinístico: o protótipo recria o estado a cada carga, e os links precisam continuar valendo. */
const semente = (n: number) => {
    let t = (n + 0x6d2b79f5) >>> 0;
    return () => {
        t = (t + 0x6d2b79f5) >>> 0;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
};

export const uuidDeterministico = (indice: number) => {
    const aleatorio = semente(indice * 7919 + 13);
    const hex = (quantidade: number) =>
        Array.from({ length: quantidade }, () => Math.floor(aleatorio() * 16).toString(16)).join("");
    return `${hex(8)}-${hex(4)}-4${hex(3)}-${"89ab"[Math.floor(aleatorio() * 4)]}${hex(3)}-${hex(12)}`;
};

/** Forma curta para listas e cabeçalhos: os 8 primeiros caracteres identificam bem no dia a dia. */
export const uuidCurto = (id: string) => id.slice(0, 8);

/* Contas criadas junto com os pedidos gerados, para a busca por titular funcionar neles também. */
const CONTAS_EXTRA: Conta[] = [];

/** Resposta plausível para qualquer pergunta: primeira opção com estoque, ou um texto/anexo padrão. */
const respostaPadrao = (pergunta: Pergunta): string => {
    if (pergunta.tipo === "opcao") {
        const disponivel = pergunta.opcoes.find((o) => typeof o.estoque !== "number" || o.estoque > 0);
        return (disponivel ?? pergunta.opcoes[0])?.valor ?? "";
    }
    if (pergunta.tipo === "anexo") return "atestado-medico.pdf";
    return "Nenhuma observação.";
};

/** Todas as perguntas do formulário do item, já respondidas — como o comprador que concluiu a inscrição
    na hora da compra. Simula o cenário real: quem recebe por troca ou transferência já encontra o
    formulário completo, e só edita o que precisa mudar. */
export const respostasCompletas = (itemId: string): Record<string, string> => {
    const item = CATALOGO.find((i) => i.id === itemId);
    const formulario = FORMULARIOS.find((f) => f.id === item?.formularioId);
    if (!formulario) return {};
    return Object.fromEntries(
        formulario.perguntaIds
            .map((id) => PERGUNTAS.find((p) => p.id === id))
            .filter((p): p is Pergunta => Boolean(p))
            .map((p) => [p.id, respostaPadrao(p)]),
    );
};

/** Os pedidos nascem sem operação aberta: baseStatus e solicitações entram na carga do store. */
type PedidoSemente = Omit<Pedido, "baseStatus" | "solicitacoes">;

const PEDIDOS_INICIAIS: PedidoSemente[] = [
    {
        id: uuidDeterministico(1),
        eventoId: "ev-maratona",
        compradorId: "c-ana",
        dataCompraLabel: "02 ago 2026",
        canal: "Online",
        meioPagamento: "Cartão de crédito (2x)",
        criadoEmLabel: "02 ago 2026, 09:16:33",
        atualizadoEmLabel: "02 ago 2026, 09:45:33",
        itens: [
            {
                id: "li-1a",
                itemId: "it-mar-10k",
                valorPago: 144,
                respostas: { ...respostasCompletas("it-mar-10k"), "p-camiseta": "M", "p-kit": "Arena das Dunas", "p-equipe": "Run Potiguar" },
            },
            { id: "li-1b", itemId: "pr-camiseta-extra", valorPago: 80, respostas: {} },
            { id: "li-1c", itemId: "pr-foto", valorPago: 45, respostas: {} },
        ],
        status: "ativo",
        historico: [
            {
                id: "h-1",
                dataLabel: "02 ago 2026, 10:12",
                responsavel: "Ana Beatriz Correia",
                titulo: "Pedido criado",
                descricao: "Corrida 10 km no lote promocional, camiseta extra e pacote de fotos.",
                valor: 269,
                estado: "concluido",
            },
        ],
    },
    {
        id: uuidDeterministico(2),
        eventoId: "ev-maratona",
        compradorId: "c-rafael",
        dataCompraLabel: "05 ago 2026",
        canal: "Online",
        meioPagamento: "Pix",
        criadoEmLabel: "05 ago 2026, 09:16:33",
        atualizadoEmLabel: "05 ago 2026, 09:45:33",
        itens: [
            {
                id: "li-2a",
                itemId: "it-mar-5k",
                valorPago: 120,
                respostas: { ...respostasCompletas("it-mar-5k"), "p-camiseta": "G", "p-kit": "Praia de Ponta Negra", "p-equipe": "Sem equipe" },
            },
        ],
        status: "ativo",
        historico: [
            {
                id: "h-2",
                dataLabel: "05 ago 2026, 19:44",
                responsavel: "Rafael Menezes",
                titulo: "Pedido criado",
                descricao: "Corrida 5 km no lote 1.",
                valor: 120,
                estado: "concluido",
            },
        ],
    },
    {
        id: uuidDeterministico(3),
        eventoId: "ev-trail",
        compradorId: "c-juliana",
        dataCompraLabel: "11 ago 2026",
        canal: "Online",
        meioPagamento: "Cartão de crédito (3x)",
        cupom: "TRAIL10",
        criadoEmLabel: "11 ago 2026, 09:16:33",
        atualizadoEmLabel: "11 ago 2026, 09:45:33",
        itens: [
            {
                id: "li-3a",
                itemId: "it-trail-12k",
                titularId: "c-carol",
                valorPago: 135,
                respostas: {
                    ...respostasCompletas("it-trail-12k"),
                    "p-camiseta": "PP",
                    "p-equipe": "Dunas Team",
                    "p-emergencia": "Familiar",
                    "p-historico": "Fiz cirurgia no joelho direito em 2024 e sigo acompanhamento com fisioterapeuta duas vezes por semana. Uso joelheira de compressão nas provas longas e costumo reduzir o ritmo nos trechos de descida técnica. Não tenho alergia a medicamentos, mas prefiro não receber anti-inflamatório sem avaliação. Em caso de dor aguda no joelho, quero ser levada ao posto médico antes de qualquer decisão sobre continuar a prova.",
                    "p-atestado": "atestado-juliana-prado.pdf",
                },
            },
            { id: "li-3b", itemId: "pr-trail-transfer", valorPago: 55, respostas: {} },
        ],
        status: "alteracao-concluida",
        historico: [
            {
                id: "h-3a",
                dataLabel: "11 ago 2026, 08:31",
                responsavel: "Juliana Prado",
                titulo: "Pedido criado",
                descricao: "Trail 12 km com cupom de 10 por cento e transfer para a largada.",
                valor: 190,
                estado: "concluido",
            },
            {
                id: "h-3b",
                dataLabel: "28 ago 2026, 16:02",
                responsavel: "Juliana Prado",
                titulo: "Troca de titularidade concluída",
                descricao: "1 item transferido. Comprador do pedido preservado.",
                detalhes: [
                    "1x Trail 12 km · Lote 2 · 23 de nov., 07:00",
                    "De Juliana Prado para Carolina Sampaio (carolina.sampaio@email.com)",
                    "Transfer para a largada segue com Juliana Prado",
                ],
                valor: 15.3,
                estado: "concluido",
            },
        ],
    },
    {
        id: uuidDeterministico(4),
        eventoId: "ev-trail",
        compradorId: "c-marcos",
        dataCompraLabel: "14 ago 2026",
        canal: "Bilheteria",
        meioPagamento: "Dinheiro",
        criadoEmLabel: "14 ago 2026, 09:16:33",
        atualizadoEmLabel: "14 ago 2026, 09:45:33",
        itens: [
            {
                id: "li-4a",
                itemId: "it-trail-24k",
                valorPago: 230,
                respostas: {
                    ...respostasCompletas("it-trail-24k"),
                    "p-camiseta": "GG",
                    "p-equipe": "Costa Branca Bike",
                    "p-emergencia": "Assessoria",
                    "p-historico": "Hipertensão controlada com medicação diária. Sem restrição para esforço, conforme liberação do cardiologista.",
                    "p-atestado": "atestado-marcos-leite.jpg",
                },
            },
            { id: "li-4b", itemId: "pr-trail-bastao", valorPago: 70, respostas: {} },
        ],
        status: "ativo",
        historico: [
            {
                id: "h-4",
                dataLabel: "14 ago 2026, 21:07",
                responsavel: "Marcos Vinícius Leite",
                titulo: "Pedido criado",
                descricao: "Trail 24 km no lote 2 e aluguel de bastões.",
                valor: 300,
                estado: "concluido",
            },
        ],
    },
    {
        id: uuidDeterministico(5),
        eventoId: "ev-triathlon",
        compradorId: "c-diego",
        dataCompraLabel: "19 ago 2026",
        canal: "Online",
        meioPagamento: "Cartão de crédito",
        cupom: "FEDERADO",
        criadoEmLabel: "19 ago 2026, 09:16:33",
        atualizadoEmLabel: "19 ago 2026, 09:45:33",
        itens: [
            {
                id: "li-5a",
                itemId: "it-tri-sprint",
                valorPago: 252,
                respostas: { ...respostasCompletas("it-tri-sprint"), "p-camiseta": "M", "p-kit": "Arena das Dunas", "p-emergencia": "Amigo" },
            },
        ],
        status: "falha",
        historico: [
            {
                id: "h-5a",
                dataLabel: "19 ago 2026, 13:55",
                responsavel: "Diego Fontes",
                titulo: "Pedido criado",
                descricao: "Triathlon sprint com desconto de atleta federado.",
                valor: 252,
                estado: "concluido",
            },
            {
                id: "h-5b",
                dataLabel: "03 set 2026, 09:18",
                responsavel: "Diego Fontes",
                titulo: "Falha de processamento",
                descricao: "Troca para triathlon olímpico paga e não aplicada. Estorno em análise pelo financeiro.",
                valor: 162.18,
                estado: "falha",
            },
        ],
    },
    {
        id: uuidDeterministico(6),
        eventoId: "ev-triathlon",
        compradorId: "c-leticia",
        dataCompraLabel: "24 ago 2026",
        canal: "Online",
        meioPagamento: "Pix",
        criadoEmLabel: "24 ago 2026, 09:16:33",
        atualizadoEmLabel: "24 ago 2026, 09:45:33",
        itens: [
            { id: "li-6a", itemId: "it-tri-revezamento", valorPago: 330, respostas: { "p-camiseta": "P", "p-kit": "Praia de Ponta Negra" } },
            { id: "li-6b", itemId: "pr-tri-aluguel", valorPago: 110, respostas: {} },
        ],
        status: "ativo",
        historico: [
            {
                id: "h-6",
                dataLabel: "24 ago 2026, 07:40",
                responsavel: "Letícia Amaral",
                titulo: "Pedido criado",
                descricao: "Revezamento em dupla no lote 1 e aluguel de neoprene.",
                valor: 440,
                estado: "concluido",
            },
        ],
    },
    {
        id: uuidDeterministico(7),
        eventoId: "ev-maratona",
        compradorId: "c-paulo",
        dataCompraLabel: "30 ago 2026",
        canal: "Online",
        meioPagamento: "Cartão de crédito (6x)",
        cupom: "ASSESSORIA",
        criadoEmLabel: "30 ago 2026, 09:16:33",
        atualizadoEmLabel: "30 ago 2026, 09:45:33",
        itens: [
            {
                id: "li-7a",
                itemId: "cb-mar-completo",
                valorPago: 387,
                respostas: { ...respostasCompletas("cb-mar-completo"), "p-camiseta": "G", "p-kit": "Arena das Dunas", "p-equipe": "Run Potiguar" },
            },
        ],
        status: "ativo",
        historico: [
            {
                id: "h-7",
                dataLabel: "30 ago 2026, 11:26",
                responsavel: "Paulo Henrique Braga",
                titulo: "Pedido criado",
                descricao: "Combo maratona completa com cupom de assessoria.",
                valor: 387,
                estado: "concluido",
            },
        ],
    },
    {
        id: uuidDeterministico(8),
        eventoId: "ev-triathlon",
        compradorId: "c-carol",
        dataCompraLabel: "04 set 2026",
        canal: "Online",
        meioPagamento: "Cartão de crédito (4x)",
        criadoEmLabel: "04 set 2026, 09:16:33",
        atualizadoEmLabel: "04 set 2026, 09:45:33",
        itens: [
            {
                id: "li-8a",
                itemId: "it-tri-olimpico",
                valorPago: 420,
                respostas: {
                    ...respostasCompletas("it-tri-olimpico"),
                    "p-camiseta": "M",
                    "p-kit": "Arena das Dunas",
                    "p-equipe": "Run Potiguar",
                    "p-emergencia": "Familiar",
                    "p-restricao": "Vegetariana",
                    "p-sangue": "O+",
                    "p-transporte": "Ônibus oficial",
                    "p-conheceu": "Edição anterior",
                    "p-seguro": "Completo",
                    "p-historico": "Já tive duas crises de bronquite induzida por exercício nos últimos doze meses, sempre em dias frios e com muita umidade. Carrego bombinha de resgate na transição e aviso a equipe de apoio antes da largada. Também tenho intolerância à lactose, então evito os géis com leite distribuídos no percurso e levo a minha própria nutrição.",
                    "p-atestado": "atestado-carolina-sampaio.pdf",
                },
            },
            { id: "li-8b", itemId: "pr-tri-aluguel", valorPago: 110, respostas: {} },
            { id: "li-8c", itemId: "pr-foto", valorPago: 45, respostas: {} },
        ],
        status: "ativo",
        historico: [
            {
                id: "h-8",
                dataLabel: "04 set 2026, 15:02",
                responsavel: "Carolina Sampaio",
                titulo: "Pedido criado",
                descricao: "Triathlon olímpico, aluguel de neoprene e pacote de fotos.",
                valor: 575,
                estado: "concluido",
            },
        ],
    },
];

/* Pedido de assessoria: serve para testar a interface com muitas linhas. */
const gerarLinhas = (prefixo: string, itemId: string, quantidade: number, valorPago: number, respostas: () => Record<string, string>) =>
    Array.from({ length: quantidade }, (_, indice) => ({
        id: `${prefixo}-${indice + 1}`,
        itemId,
        valorPago,
        respostas: respostas(),
    }));

const TAMANHOS = ["PP", "M", "G", "GG"];

PEDIDOS_INICIAIS.push({
    id: uuidDeterministico(9),
    eventoId: "ev-maratona",
    compradorId: "c-paulo",
    dataCompraLabel: "08 set 2026",
    canal: "Online",
    meioPagamento: "Boleto",
    cupom: "RUNPOT15",
    criadoEmLabel: "08 set 2026, 09:15:02",
    atualizadoEmLabel: "08 set 2026, 09:15:02",
    itens: [
        ...gerarLinhas("li-9a", "it-mar-5k", 40, 102, () => ({
            ...respostasCompletas("it-mar-5k"),
            "p-camiseta": TAMANHOS[Math.floor(Math.random() * TAMANHOS.length)],
            "p-kit": "Arena das Dunas",
            "p-equipe": "Run Potiguar",
        })),
        ...gerarLinhas("li-9b", "it-mar-10k", 20, 153, () => ({
            ...respostasCompletas("it-mar-10k"),
            "p-camiseta": TAMANHOS[Math.floor(Math.random() * TAMANHOS.length)],
            "p-kit": "Arena das Dunas",
            "p-equipe": "Run Potiguar",
        })),
        ...gerarLinhas("li-9c", "pr-camiseta-extra", 10, 72, () => ({})),
    ],
    status: "ativo",
    historico: [
        {
            id: "h-9",
            dataLabel: "08 set 2026, 09:15",
            responsavel: "Paulo Henrique Braga",
            titulo: "Pedido criado",
            descricao: "Compra em lote da assessoria Run Potiguar: 60 inscrições e 10 camisetas extras.",
            valor: 8100,
            estado: "concluido",
        },
    ],
});


/* ------------------------------------------------------------------ */
/*  Volume: a lista precisa ser exercitada com o tamanho real          */
/* ------------------------------------------------------------------ */

/* Os nove pedidos acima são escritos à mão porque cada um demonstra uma regra.
   O restante é gerado para a tela de listagem enfrentar paginação de verdade. */
const NOMES_EXTRA = [
    "Adriana Nogueira", "Bruno Tavares", "Camila Rocha", "Daniel Peixoto", "Elaine Bezerra",
    "Fábio Queiroz", "Gabriela Lins", "Henrique Sales", "Isabela Moura", "João Vitor Farias",
    "Karina Dantas", "Leonardo Mesquita", "Mariana Cavalcanti", "Nelson Aragão", "Olívia Barreto",
    "Patrícia Fontenele", "Rodrigo Aguiar", "Simone Vasconcelos", "Thiago Marinho", "Vanessa Caldas",
];

const STATUS_EXTRA: StatusPedido[] = ["ativo", "ativo", "ativo", "ativo", "alteracao-concluida", "expirado", "falha"];

const gerarPedidosExtra = (quantidade: number): PedidoSemente[] =>
    Array.from({ length: quantidade }, (_, indice) => {
        const aleatorio = semente(indice * 31 + 101);
        const sorteio = <T,>(lista: T[]) => lista[Math.floor(aleatorio() * lista.length)];

        const evento = sorteio(EVENTOS);
        const ingressos = CATALOGO.filter((i) => i.eventoId === evento.id && i.tipo === "ingresso" && i.estoque > 0);
        const produtos = CATALOGO.filter((i) => i.eventoId === evento.id && i.tipo === "produto");
        const ingresso = sorteio(ingressos);
        const formulario = FORMULARIOS.find((f) => f.id === ingresso.formularioId);

        const conta = CONTAS[indice % CONTAS.length];
        const nome = NOMES_EXTRA[indice % NOMES_EXTRA.length];
        const contaSintetica: Conta = {
            ...conta,
            id: `c-extra-${indice}`,
            nome,
            nascimento: `${String(1 + Math.floor(aleatorio() * 28)).padStart(2, "0")}/${String(1 + Math.floor(aleatorio() * 12)).padStart(2, "0")}/19${70 + Math.floor(aleatorio() * 30)}`,
            celular: `+55 (84) 9${String(Math.floor(aleatorio() * 9000) + 1000)}-${String(Math.floor(aleatorio() * 9000) + 1000)}`,
            email: `${nome.toLowerCase().normalize("NFD").replace(/[^a-z ]/g, "").replace(/ /g, ".")}@email.com`,
        };
        CONTAS_EXTRA.push(contaSintetica);

        const respostas: Record<string, string> = {};
        (formulario?.perguntaIds ?? []).forEach((perguntaId) => {
            const pergunta = PERGUNTAS.find((p) => p.id === perguntaId);
            if (!pergunta) return;
            if (pergunta.tipo === "opcao") {
                const disponiveis = pergunta.opcoes.filter((o) => typeof o.estoque !== "number" || o.estoque > 0);
                respostas[perguntaId] = sorteio(disponiveis).valor;
            } else {
                respostas[perguntaId] = respostaPadrao(pergunta);
            }
        });

        const desconto = [1, 1, 0.9, 0.85][Math.floor(aleatorio() * 4)];
        const itens: PedidoItem[] = [
            {
                id: `li-x${indice}-a`,
                itemId: ingresso.id,
                valorPago: Math.round(ingresso.precoIntegral * desconto * 100) / 100,
                respostas,
            },
        ];
        if (aleatorio() > 0.55 && produtos.length > 0) {
            const produto = sorteio(produtos);
            itens.push({ id: `li-x${indice}-b`, itemId: produto.id, valorPago: produto.precoIntegral, respostas: {} });
        }

        const dia = 1 + Math.floor(aleatorio() * 28);
        const dataCompraLabel = `${String(dia).padStart(2, "0")} ago 2026`;
        const status = sorteio(STATUS_EXTRA);
        const hora = `${String(8 + Math.floor(aleatorio() * 12)).padStart(2, "0")}:${String(Math.floor(aleatorio() * 60)).padStart(2, "0")}:${String(Math.floor(aleatorio() * 60)).padStart(2, "0")}`;

        return {
            id: uuidDeterministico(indice + 100),
            eventoId: evento.id,
            compradorId: contaSintetica.id,
            dataCompraLabel,
            canal: sorteio(["Online", "Online", "Online", "Bilheteria"] as const),
            meioPagamento: sorteio(["Cartão de crédito", "Cartão de crédito (2x)", "Pix", "Boleto"]),
            cupom: aleatorio() > 0.75 ? sorteio(["PRIMEIRA10", "ASSESSORIA", "CLUBE15"]) : undefined,
            criadoEmLabel: `${dataCompraLabel}, ${hora}`,
            atualizadoEmLabel: `${dataCompraLabel}, ${hora}`,
            itens,
            status,
            historico: [
                {
                    id: `h-x${indice}`,
                    dataLabel: `${dataCompraLabel}, 12:00`,
                    responsavel: nome,
                    titulo: "Pedido criado",
                    descricao: itens.map((l) => CATALOGO.find((i) => i.id === l.itemId)?.nome).join(", ") + ".",
                    valor: itens.reduce((soma, l) => soma + l.valorPago, 0),
                    estado: "concluido" as const,
                },
            ],
        };
    });

PEDIDOS_INICIAIS.push(...gerarPedidosExtra(101));

/* ------------------------------------------------------------------ */
/*  Store em memória                                                   */
/* ------------------------------------------------------------------ */

interface Estado {
    pedidos: Pedido[];
    catalogo: CatalogoItem[];
    perguntas: Pergunta[];
}

let estado: Estado = {
    pedidos: PEDIDOS_INICIAIS.map((pedido) => ({ ...pedido, baseStatus: pedido.status, solicitacoes: [] })),
    catalogo: CATALOGO,
    perguntas: PERGUNTAS,
};

const listeners = new Set<() => void>();
const notificar = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
};

const setEstado = (fn: (atual: Estado) => Estado) => {
    estado = fn(estado);
    notificar();
};

export const usePedidos = () => useSyncExternalStore(subscribe, () => estado.pedidos);
export const useCatalogo = () => useSyncExternalStore(subscribe, () => estado.catalogo);
export const usePerguntas = () => useSyncExternalStore(subscribe, () => estado.perguntas);

export const getPedido = (id: string) => estado.pedidos.find((p) => p.id === id);
export const getItem = (id: string) => estado.catalogo.find((i) => i.id === id);
export const getConta = (id: string) => CONTAS.find((c) => c.id === id) ?? CONTAS_EXTRA.find((c) => c.id === id);
export const getEvento = (id: string) => EVENTOS.find((e) => e.id === id);
export const getPergunta = (id: string) => estado.perguntas.find((p) => p.id === id);
export const getFormulario = (id?: string) => (id ? FORMULARIOS.find((f) => f.id === id) : undefined);

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Totais do pedido, derivados das linhas: nada de valor solto que possa divergir dos itens. */
export const totaisDoPedido = (pedido: Pedido) => {
    const final = pedido.itens.reduce((soma, l) => soma + l.valorPago, 0);
    const original = pedido.itens.reduce((soma, l) => soma + (getItem(l.itemId)?.precoIntegral ?? l.valorPago), 0);
    return { final, original, desconto: Math.max(0, Math.round((original - final) * 100) / 100) };
};

export const formatarMoeda = (valor: number) =>
    valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const arredondar = (valor: number) => Math.round(valor * 100) / 100;

const agoraLabel = () => {
    const d = new Date();
    const data = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
    const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return `${data}, ${hora}`;
};

const novoId = (prefixo: string) => `${prefixo}-${Math.random().toString(36).slice(2, 9)}`;

/** Link de checkout no mesmo formato usado pela bilheteria. */
const novoLinkPagamento = (pedidoId: string) => `pay.ingresse.com/alteracao/${uuidCurto(pedidoId)}-${Math.random().toString(36).slice(2, 8)}`;

/** Estado para o qual o pedido volta quando uma solicitação é cancelada, expira ou é reaberta. */
const statusBase = (p: Pedido): StatusPedido =>
    p.historico.some((h) => h.estado === "concluido" && h.titulo.includes("concluída")) ? "alteracao-concluida" : "ativo";

/* A situação do pedido é sempre derivada: com operação aberta ela manda, sem operação vale o fundo. */
const comStatus = (p: Pedido): Pedido => ({
    ...p,
    status: p.solicitacoes.some((s) => s.estado === "processando")
        ? "pago-processando"
        : p.solicitacoes.length > 0
          ? "aguardando-pagamento"
          : p.baseStatus,
});

/* Os rótulos são os mesmos do filtro de situação: quem filtra por "Alteração em andamento"
   precisa reconhecer o resultado na coluna sem traduzir nada. */
export const STATUS_LABEL: Record<StatusPedido, string> = {
    ativo: "Sem alterações",
    "alteracao-concluida": "Já alterados",
    "aguardando-pagamento": "Alteração em andamento",
    "pago-processando": "Alteração em andamento",
    expirado: "Alteração expirada",
    falha: "Falha na alteração",
};

/** Frase curta que explica o badge para quem está vendo a tela pela primeira vez. */
export const STATUS_AJUDA: Record<StatusPedido, string> = {
    ativo: "Pedido pago, sem alterações solicitadas.",
    "alteracao-concluida": "Pedido já passou por uma alteração aplicada.",
    "aguardando-pagamento": "Há uma alteração pendente de pagamento.",
    "pago-processando": "Pagamento confirmado. A alteração está sendo aplicada.",
    expirado: "O prazo de pagamento terminou e o pedido voltou ao estado anterior.",
    falha: "Alteração paga e não aplicada. Consulte o histórico.",
};

/** Só os dois primeiros significam pedido sem nada pendente. */
export const statusEmDia = (status: StatusPedido) => status === "ativo" || status === "alteracao-concluida";

export const TIPO_OPERACAO_LABEL: Record<TipoOperacao, string> = {
    "troca-item": "Troca de item",
    "troca-titularidade": "Troca de titularidade",
    "alterar-respostas": "Edição de respostas",
};

/* ------------------------------------------------------------------ */
/*  Cálculos das operações                                             */
/* ------------------------------------------------------------------ */

export interface Calculo {
    linhas: LinhaCobranca[];
    total: number;
    /** Diferença bruta entre o novo item e o valor pago, antes da regra de crédito. */
    diferencaBruta: number;
    /** True quando o novo item é mais barato e a diferença é descartada. */
    semCredito: boolean;
}

export interface ParTroca {
    linha: PedidoItem;
    novoItem: CatalogoItem;
}

/** Troca de N itens de uma vez. A diferença é calculada item a item. */
export const calcularTrocaItens = (pares: ParTroca[]): Calculo => {
    const quantidade = pares.length;
    const diferencaBruta = arredondar(pares.reduce((soma, { linha, novoItem }) => soma + novoItem.precoIntegral - linha.valorPago, 0));
    const diferenca = arredondar(pares.reduce((soma, { linha, novoItem }) => soma + Math.max(0, novoItem.precoIntegral - linha.valorPago), 0));
    const semCredito = diferencaBruta < diferenca;
    const taxaTroca = arredondar(quantidade * TAXA_TROCA_ITEM);
    const subtotal = arredondar(diferenca + taxaTroca);
    const processamento = arredondar(subtotal * TAXA_PROCESSAMENTO);
    const total = arredondar(subtotal + processamento);

    return {
        diferencaBruta,
        semCredito,
        total,
        linhas: [
            {
                label: "Diferença dos itens",
                valor: diferenca,
                regra: "Calculada item a item, com o preço atual do item novo menos o valor pago. Item mais barato entra como zero: não gera crédito nem reembolso.",
            },
            {
                label: `Taxa de troca (${quantidade} × ${formatarMoeda(TAXA_TROCA_ITEM)})`,
                valor: taxaTroca,
                regra: `Valor fixo de ${formatarMoeda(TAXA_TROCA_ITEM)} por item trocado.`,
            },
            { label: "Taxa de processamento (2%)", valor: processamento, regra: "2% sobre a diferença somada às taxas de troca." },
            { label: "Total", valor: total, destaque: true },
        ],
    };
};

export const calcularTrocaItem = (linha: PedidoItem, novoItem: CatalogoItem): Calculo => {
    const diferencaBruta = arredondar(novoItem.precoIntegral - linha.valorPago);
    const diferenca = Math.max(0, diferencaBruta);
    const semCredito = diferencaBruta < 0;
    const subtotal = arredondar(diferenca + TAXA_TROCA_ITEM);
    const processamento = arredondar(subtotal * TAXA_PROCESSAMENTO);
    const linhas: LinhaCobranca[] = [
        {
            label: "Preço atual do novo item",
            valor: novoItem.precoIntegral,
            regra: "A troca usa o preço atual do item de destino, não o preço do lote em que a compra foi feita.",
        },
        {
            label: "Valor pago pelo item atual",
            valor: -linha.valorPago,
            regra: "Valor efetivamente pago, já com cupons e descontos aplicados.",
        },
        {
            label: "Diferença",
            valor: diferenca,
            regra: semCredito
                ? `A diferença seria de ${formatarMoeda(diferencaBruta)}. Troca para item mais barato não gera crédito nem reembolso.`
                : "Valor cobrado do participante para cobrir a diferença de preço.",
        },
        { label: "Taxa de troca", valor: TAXA_TROCA_ITEM, regra: `Valor fixo de ${formatarMoeda(TAXA_TROCA_ITEM)} por troca de item.` },
        {
            label: "Taxa de processamento (2%)",
            valor: processamento,
            regra: "2% sobre a diferença somada à taxa de troca.",
        },
        { label: "Total", valor: arredondar(subtotal + processamento), destaque: true },
    ];
    return { linhas, total: arredondar(subtotal + processamento), diferencaBruta, semCredito };
};

export const calcularTrocaTitularidade = (quantidade = 1): Calculo => {
    const taxa = arredondar(quantidade * TAXA_TITULARIDADE);
    const processamento = arredondar(taxa * TAXA_PROCESSAMENTO);
    const total = arredondar(taxa + processamento);
    return {
        diferencaBruta: 0,
        semCredito: false,
        total,
        linhas: [
            {
                label: `Taxa de transferência (${quantidade} × ${formatarMoeda(TAXA_TITULARIDADE)})`,
                valor: taxa,
                regra: "O item é o mesmo, então não há diferença de preço. A taxa é cobrada por item transferido.",
            },
            { label: "Taxa de processamento (2%)", valor: processamento, regra: "2% sobre a taxa." },
            { label: "Total", valor: total, destaque: true },
        ],
    };
};

export const calcularEdicaoRespostas = (quantidadeAlterada: number): Calculo => {
    const processamento = arredondar(TAXA_EDICAO_FORMULARIO * TAXA_PROCESSAMENTO);
    const total = arredondar(TAXA_EDICAO_FORMULARIO + processamento);
    return {
        diferencaBruta: 0,
        semCredito: false,
        total,
        linhas: [
            {
                label: "Taxa de edição",
                valor: TAXA_EDICAO_FORMULARIO,
                regra: `Cobrada uma vez por operação. As ${quantidadeAlterada} respostas alteradas juntas custam o mesmo que uma.`,
            },
            { label: "Taxa de processamento (2%)", valor: processamento, regra: "2% sobre a taxa." },
            { label: "Total", valor: total, destaque: true },
        ],
    };
};

/* ------------------------------------------------------------------ */
/*  Bloqueios                                                          */
/* ------------------------------------------------------------------ */

export interface Bloqueio {
    /** Rótulo de uma ou duas palavras, mostrado no próprio item da lista. */
    curto: string;
    titulo: string;
    descricao: string;
}

export const getSessao = (id?: string) => SESSOES.find((s) => s.id === id);

export const sessaoDoItem = (item?: CatalogoItem) => getSessao(item?.sessaoId);

export const sessaoLabel = (item?: CatalogoItem) => {
    const sessao = sessaoDoItem(item);
    return sessao ? `${sessao.dataLabel}, ${sessao.horaLabel}` : "";
};

/* Produto e combo não pertencem a uma sessão: as regras de agenda não se aplicam a eles. */
export const sessaoRealizada = (item: CatalogoItem) => {
    const sessao = sessaoDoItem(item);
    return sessao ? sessao.inicio <= Date.now() : false;
};

export const dentroDoPrazoDeTroca = (item: CatalogoItem) => {
    const sessao = sessaoDoItem(item);
    return sessao ? sessao.inicio - Date.now() > PRAZO_TROCA_HORAS * 60 * 60 * 1000 : true;
};

/** Sessão da linha já aconteceu: não há mais o que trocar nela. */
export const linhaEncerrada = (linha: PedidoItem) => {
    const item = getItem(linha.itemId);
    return item ? sessaoRealizada(item) : false;
};

/** Todas as linhas do pedido já aconteceram. */
export const pedidoEncerrado = (pedido: Pedido) => pedido.itens.every(linhaEncerrada);

export const getLinha = (pedido: Pedido, linhaId?: string) => pedido.itens.find((l) => l.id === linhaId);

/** Titular efetivo de uma linha: o dela, se houver, senão o do pedido. */
export const titularDaLinha = (pedido: Pedido, linha: PedidoItem) => getConta(linha.titularId ?? pedido.compradorId);

/** Agrupa as linhas por titular, para o card de titularidade mostrar a divisão. */
export const titularesDoPedido = (pedido: Pedido) => {
    const mapa = new Map<string, number>();
    pedido.itens.forEach((linha) => {
        const id = linha.titularId ?? pedido.compradorId;
        mapa.set(id, (mapa.get(id) ?? 0) + 1);
    });
    return [...mapa.entries()].map(([contaId, quantidade]) => ({ conta: getConta(contaId), quantidade }));
};

/** Regras de segmentação, estoque e agenda que impedem a troca para um item. */
export const validarTrocaItem = (pedido: Pedido, linha: PedidoItem, novoItem: CatalogoItem): Bloqueio | null => {
    const itemAtual = getItem(linha.itemId);
    if (itemAtual && novoItem.tipo !== itemAtual.tipo) {
        return {
            curto: "Outro tipo",
            titulo: "Tipos diferentes",
            descricao: `${TIPO_ITEM_LABEL[itemAtual.tipo]} só pode ser trocado por outro ${TIPO_ITEM_LABEL[itemAtual.tipo].toLowerCase()}.`,
        };
    }
    if (novoItem.id === linha.itemId) {
        return { curto: "Item atual", titulo: "Item igual ao atual", descricao: "Selecione um item diferente do que está no pedido." };
    }
    if (novoItem.estoque <= 0) {
        return {
            curto: "Esgotado",
            titulo: "Item esgotado",
            descricao: `Não há vaga disponível em ${novoItem.nome} para reservar.`,
        };
    }
    if (sessaoRealizada(novoItem)) {
        return {
            curto: "Sessão encerrada",
            titulo: "Sessão já realizada",
            descricao: `${novoItem.nome} ocorreu em ${sessaoLabel(novoItem)}. A troca só vale para sessões futuras.`,
        };
    }
    if (!dentroDoPrazoDeTroca(novoItem)) {
        return {
            curto: `Prazo encerrado`,
            titulo: "Prazo de troca encerrado",
            descricao: `${novoItem.nome} começa em ${sessaoLabel(novoItem)}. A troca exige ${PRAZO_TROCA_HORAS} horas de antecedência.`,
        };
    }
    const titular = getConta(linha.titularId ?? pedido.compradorId);
    if (novoItem.segmentacao === "feminino" && titular?.genero !== "F") {
        return {
            curto: "Restrito",
            titulo: "Item restrito",
            descricao: `${novoItem.nome} é restrito ao público feminino e o titular atual não atende à regra.`,
        };
    }
    if (novoItem.segmentacao === "socio" && !titular?.socio) {
        return {
            curto: "Restrito",
            titulo: "Item restrito",
            descricao: `${novoItem.nome} é exclusivo para sócios e o titular atual não tem vínculo ativo.`,
        };
    }
    return null;
};

export const validarNovoTitular = (pedido: Pedido, conta: Conta): Bloqueio | null => {
    if (conta.id === pedido.compradorId) {
        return { curto: "Titular atual", titulo: "Conta já é a titular", descricao: "Selecione outra conta para a troca." };
    }
    /* Basta um item restrito no pedido para travar a transferência inteira. */
    const item = pedido.itens.map((l) => getItem(l.itemId)).find((i) => i?.segmentacao);
    if (item?.segmentacao === "feminino" && conta.genero !== "F") {
        return {
            curto: "Restrito",
            titulo: "Item restrito",
            descricao: `${item.nome} é restrito ao público feminino, então essa conta não pode assumir a titularidade.`,
        };
    }
    if (item?.segmentacao === "socio" && !conta.socio) {
        return {
            curto: "Restrito",
            titulo: "Item restrito",
            descricao: `${item.nome} é exclusivo para sócios e essa conta não tem vínculo ativo.`,
        };
    }
    return null;
};

/** O pedido tem alguma operação aberta. Não bloqueia a tela: o bloqueio é por linha. */
export const temConflito = (pedido: Pedido) => pedido.solicitacoes.length > 0;

/** Operação aberta que já reservou esta linha. Enquanto existir, a linha não entra em outra. */
export const solicitacaoDaLinha = (pedido: Pedido, linhaId: string) =>
    pedido.solicitacoes.find((s) => s.linhasAfetadas.includes(linhaId));

/** O que está acontecendo com a linha agora, para mostrar dentro do próprio item. */
export const pendenciaDaLinha = (pedido: Pedido, linha: PedidoItem) => {
    const solicitacao = solicitacaoDaLinha(pedido, linha.id);
    if (!solicitacao) return null;
    return {
        solicitacao,
        /* Troca: o item de destino. Transferência: a conta que vai receber. */
        novoItemId: solicitacao.aplicar.trocas?.find((t) => t.pedidoItemId === linha.id)?.novoItemId,
        contaDestinoId: solicitacao.aplicar.titularPorLinha?.[linha.id],
    };
};

/* ------------------------------------------------------------------ */
/*  Ações                                                              */
/* ------------------------------------------------------------------ */

const atualizarPedido = (pedidoId: string, fn: (p: Pedido) => Pedido) =>
    setEstado((atual) => ({ ...atual, pedidos: atual.pedidos.map((p) => (p.id === pedidoId ? fn(p) : p)) }));

const ajustarEstoqueItem = (itemId: string, delta: number) =>
    setEstado((atual) => ({
        ...atual,
        catalogo: atual.catalogo.map((i) => (i.id === itemId ? { ...i, estoque: Math.max(0, i.estoque + delta) } : i)),
    }));

const ajustarEstoqueResposta = (perguntaId: string, valor: string, delta: number) =>
    setEstado((atual) => ({
        ...atual,
        perguntas: atual.perguntas.map((p) =>
            p.id !== perguntaId
                ? p
                : {
                      ...p,
                      opcoes: p.opcoes.map((o) =>
                          o.valor === valor && typeof o.estoque === "number" ? { ...o, estoque: Math.max(0, o.estoque + delta) } : o,
                      ),
                  },
        ),
    }));

export interface CriarSolicitacaoInput {
    pedidoId: string;
    /** Detalhamento que acompanha a operação no histórico. */
    detalhes?: string[];
    /** Linhas do pedido presas na operação até o pagamento resolver. */
    linhasAfetadas: string[];
    tipo: TipoOperacao;
    resumo: string;
    calculo: Calculo;
    aplicar: Solicitacao["aplicar"];
    reservas: Solicitacao["reservas"];
}

/** Cria a cobrança pendente e reserva o estoque. Nada é aplicado ainda. */
export const criarSolicitacao = ({ pedidoId, tipo, resumo, detalhes, linhasAfetadas, calculo, aplicar, reservas }: CriarSolicitacaoInput) => {
    const agora = Date.now();
    reservas.forEach((r) => (r.tipo === "item" ? ajustarEstoqueItem(r.itemId, -1) : ajustarEstoqueResposta(r.perguntaId, r.valor, -1)));
    atualizarPedido(pedidoId, (p) =>
        comStatus({
            ...p,
            solicitacoes: [
                ...p.solicitacoes,
                {
                    id: novoId("sol"),
                    tipo,
                    resumo,
                    linhas: calculo.linhas,
                    total: calculo.total,
                    criadoEm: agora,
                    expiraEm: agora + PRAZO_DEMO_SEGUNDOS * 1000,
                    linkPagamento: novoLinkPagamento(p.id),
                    detalhes,
                    linhasAfetadas,
                    estado: "aguardando",
                    aplicar,
                    reservas,
                },
            ],
            historico: [
                ...p.historico,
                {
                    id: novoId("h"),
                    dataLabel: agoraLabel(),
                    responsavel: "Operador do backoffice",
                    titulo: `${TIPO_OPERACAO_LABEL[tipo]} solicitada`,
                    descricao: `${resumo} Aguardando pagamento, prazo de ${PRAZO_REAL_LABEL}.`,
                    detalhes,
                    valor: calculo.total,
                    estado: "pendente",
                },
            ],
        }),
    );
};

/** Aplica o que a solicitação prometeu e tira ela da lista de operações abertas. */
const aplicarSolicitacao = (p: Pedido, solicitacao: Solicitacao): Pedido => {
    const { aplicar, tipo, resumo, total, detalhes } = solicitacao;
    const trocasPorLinha = new Map((aplicar.trocas ?? []).map((t) => [t.pedidoItemId, t.novoItemId]));
    const quando = agoraLabel();

    const itens = p.itens.map((linha) => {
        const destino = trocasPorLinha.get(linha.id);
        if (destino) {
            /* Item novo no pedido: as respostas antigas não fazem sentido para ele. Sem formulário aplicado
               na troca, entra em branco — igual a qualquer item novo do catálogo. */
            return {
                ...linha,
                itemId: destino,
                valorPago: getItem(destino)?.precoIntegral ?? linha.valorPago,
                respostas: aplicar.respostasPorItem?.[linha.id] ?? {},
            };
        }
        const novasRespostas = aplicar.respostasPorItem?.[linha.id];
        const novoTitular = aplicar.titularPorLinha?.[linha.id];
        if (!novasRespostas && !novoTitular) return linha;
        return {
            ...linha,
            titularId: novoTitular ?? linha.titularId,
            transferidoEmLabel: novoTitular ? quando : linha.transferidoEmLabel,
            respostas: novasRespostas ?? linha.respostas,
        };
    });

    return comStatus({
        ...p,
        itens,
        baseStatus: "alteracao-concluida",
        solicitacoes: p.solicitacoes.filter((s) => s.id !== solicitacao.id),
        historico: [
            ...p.historico,
            {
                id: novoId("h"),
                dataLabel: quando,
                responsavel: "Operador do backoffice",
                titulo: `${TIPO_OPERACAO_LABEL[tipo]} concluída`,
                descricao: resumo,
                detalhes,
                valor: total,
                estado: "concluido",
            },
        ],
    });
};

/** Marca a cobrança como paga. O processamento acontece em seguida. */
export const confirmarPagamento = (pedidoId: string, solicitacaoId: string) => {
    atualizarPedido(pedidoId, (p) =>
        comStatus({
            ...p,
            solicitacoes: p.solicitacoes.map((s) => (s.id === solicitacaoId ? { ...s, estado: "processando" } : s)),
        }),
    );

    window.setTimeout(() => {
        const pedido = getPedido(pedidoId);
        const solicitacao = pedido?.solicitacoes.find((s) => s.id === solicitacaoId);
        if (!pedido || !solicitacao) return;
        const { aplicar, reservas } = solicitacao;

        /* O destino já foi reservado ao criar a solicitação: aqui devolve o estoque das origens. */
        aplicar.trocas?.forEach((t) => {
            const origem = pedido.itens.find((l) => l.id === t.pedidoItemId);
            if (origem) ajustarEstoqueItem(origem.itemId, 1);
        });
        reservas.forEach((r) => {
            if (r.tipo !== "resposta") return;
            /* A opção antiga de cada linha volta ao estoque quando a nova entra no lugar. */
            solicitacao.linhasAfetadas.forEach((linhaId) => {
                const anterior = pedido.itens.find((l) => l.id === linhaId)?.respostas[r.perguntaId];
                if (anterior && anterior !== r.valor) ajustarEstoqueResposta(r.perguntaId, anterior, 1);
            });
        });

        atualizarPedido(pedidoId, (p) => {
            const atual = p.solicitacoes.find((s) => s.id === solicitacaoId);
            return atual ? aplicarSolicitacao(p, atual) : p;
        });
    }, 1400);
};

/** Devolve o estoque reservado e fecha a solicitação sem aplicar nada. */
const encerrarSolicitacao = (
    pedidoId: string,
    solicitacaoId: string,
    entrada: { titulo: (s: Solicitacao) => string; descricao: string; responsavel: string; baseStatus?: StatusPedido },
) => {
    const pedido = getPedido(pedidoId);
    const solicitacao = pedido?.solicitacoes.find((s) => s.id === solicitacaoId);
    if (!pedido || !solicitacao) return;

    solicitacao.reservas.forEach((r) => (r.tipo === "item" ? ajustarEstoqueItem(r.itemId, 1) : ajustarEstoqueResposta(r.perguntaId, r.valor, 1)));

    atualizarPedido(pedidoId, (p) =>
        comStatus({
            ...p,
            baseStatus: entrada.baseStatus ?? p.baseStatus,
            solicitacoes: p.solicitacoes.filter((s) => s.id !== solicitacaoId),
            historico: [
                ...p.historico,
                {
                    id: novoId("h"),
                    dataLabel: agoraLabel(),
                    responsavel: entrada.responsavel,
                    titulo: entrada.titulo(solicitacao),
                    descricao: entrada.descricao,
                    detalhes: solicitacao.detalhes,
                    valor: solicitacao.total,
                    estado: "expirado",
                },
            ],
        }),
    );
};

/** Expira a solicitação, libera o estoque reservado e volta o pedido ao estado anterior. */
export const expirarSolicitacao = (pedidoId: string, solicitacaoId: string) =>
    encerrarSolicitacao(pedidoId, solicitacaoId, {
        titulo: (s) => `${TIPO_OPERACAO_LABEL[s.tipo]} expirada`,
        descricao: "Pagamento não confirmado no prazo. Reserva liberada e itens revertidos.",
        responsavel: "Sistema",
        baseStatus: "expirado",
    });

/** Cancela manualmente a solicitação pendente, com a mesma reversão da expiração. */
export const cancelarSolicitacao = (pedidoId: string, solicitacaoId: string) =>
    encerrarSolicitacao(pedidoId, solicitacaoId, {
        titulo: (s) => `${TIPO_OPERACAO_LABEL[s.tipo]} cancelada`,
        descricao: "Cancelada antes do pagamento. Reserva liberada.",
        responsavel: "Operador do backoffice",
    });

/** Volta o pedido de falha ou expirado para o estado operável. */
export const retomarPedido = (pedidoId: string) =>
    atualizarPedido(pedidoId, (p) => comStatus({ ...p, baseStatus: statusBase(p) }));
