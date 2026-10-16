import { useSyncExternalStore } from "react";
import FOTO_CAMISETA from "../../../../assets/products/camisa_oficial/1.webp";
import FOTO_KIT from "../../../../assets/products/kit_oficial/1.png";
import FOTO_COPO from "../../../../assets/products/copo_oficial/1.png";
import FOTO_SACOCHILA from "../../../../assets/products/sacochila/1.webp";
import FOTO_TIRANTE from "../../../../assets/products/tirante/1.png";

/* ------------------------------------------------------------------ */
/*  Regras de negócio (valores fixos do protótipo)                     */
/* ------------------------------------------------------------------ */

/**
 * Taxa de serviço padrão sobre o preço do item. O item pode ter a sua: a tabela
 * de exemplos da EF (575995905 §10.4) tem um caso com destino a 12%.
 */
export const TAXA_SERVICO_PADRAO = 0.1;
/**
 * Cobrança da troca de item. Configurada no finance e cobrada UMA VEZ por
 * operação, não por item (575995905 §10.1).
 */
export const COBRANCA_TROCA_ITEM = 20;
/** Divisão da cobrança da troca de item (575995905 §10.3). */
export const COBRANCA_TROCA_ITEM_PRODUTOR = 15;
export const COBRANCA_TROCA_ITEM_INGRESSE = 5;
/**
 * Cobrança da troca de perguntas. Entrada PRÓPRIA no finance, separada da troca
 * de item, uma vez por operação (575635517 §6.2 e §9.2).
 */
export const COBRANCA_TROCA_PERGUNTAS = 10;
/** Cobrança da titularidade: segue a configuração da transferência paga (576978948 §6). */
export const COBRANCA_TITULARIDADE = 15;
/** Prazo real de pagamento: 15 minutos (544309249 §4, 575995905 H-09, 575635517 §11.1).
 *  No protótipo o timer roda acelerado. */
export const PRAZO_REAL_LABEL = "15 minutos";
/** Prazo acelerado usado na demonstração (em segundos). */
export const PRAZO_DEMO_SEGUNDOS = 60;
/** Antecedência mínima para trocar para uma sessão. */
/** Quem está operando o Backstage nesta sessão. Sem autenticação no protótipo, é um nome fixo,
 *  mas toda ação grava um autor real: "Operador do backoffice" não responde "quem fez isso?". */
export const OPERADOR_ATUAL = "Renata Lopes";

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

/** Únicos dois canais para entregar o link de pagamento — escolhidos e disparados pelo operador. */
/* Só e-mail. A EF de troca de item põe o envio automático por WhatsApp fora do escopo (§25) e
   define e-mail como canal das notificações (§15); o operador copia e cola o link quando quiser
   mandar por outro meio. O tipo continua existindo para o dia em que houver um segundo canal. */
export type CanalEnvio = "email";

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

export interface CatalogoItem {
    id: string;
    tipo: TipoItem;
    eventoId: string;
    nome: string;
    modalidade: string;
    precoIntegral: number;
    /** Taxa de serviço deste item. Ausente = TAXA_SERVICO_PADRAO. */
    taxaServicoPercent?: number;
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
    /** Controle de nominalidade: uma unidade por documento/conta. Sem valor explícito, segue o padrão do tipo
        (ingresso é nominal, produto e combo não são). */
    nominal?: boolean;
}

/** Se o item exige uma unidade por participante — ingresso é nominal por padrão, salvo override explícito. */
export const nominalDoItem = (item: CatalogoItem) => item.nominal ?? item.tipo === "ingresso";

/** Uma linha do pedido: o mesmo pedido pode ter várias. */
export interface PedidoItem {
    id: string;
    itemId: string;
    /** Titular desta linha. Ausente significa o comprador; preenchido, o item foi transferido. */
    titularId?: string;
    /** Valor efetivamente pago nesta linha (pode ser menor que o preço integral). */
    valorPago: number;
    /**
     * Taxa de serviço efetivamente paga nesta linha. É o minuendo da taxa
     * proporcional (575995905 §10.2). Ausente, deriva do valor pago.
     */
    taxaServicoPaga?: number;
    /** Quando a transferência foi concluída, para a linha virar registro legível. */
    transferidoEmLabel?: string;
    /** Quem pediu a transferência, para a linha responder "quem fez isso" sem abrir o histórico. */
    transferidoPor?: string;
    respostas: Record<string, string>;
}

export interface EventoOrg {
    id: string;
    nome: string;
    data: string;
    /** Arte do evento, mostrada no cabeçalho do pedido. */
    capa: string;
}

/** O fato que uma entrada do histórico registra. Fatos não mudam: o resultado de uma alteração
 *  é sempre derivado do último marco do grupo, nunca de uma entrada "pendente" congelada. */
export type MarcoHistorico = "compra" | "solicitada" | "reenviada" | "paga" | "aplicada" | "falha" | "expirada" | "cancelada" | "financeiro";

export type CategoriaMotivo = "pedido-cliente" | "erro-cadastro" | "erro-operador" | "outro";

export const CATEGORIA_MOTIVO_LABEL: Record<CategoriaMotivo, string> = {
    "pedido-cliente": "Pedido do cliente",
    "erro-cadastro": "Erro de cadastro",
    "erro-operador": "Erro do operador",
    outro: "Outro",
};

/** Por que a alteração foi feita. Só a equipe lê: o cliente não vê. */
export interface Motivo {
    /** Vazio até o operador escolher: H-07 exige que o motivo seja informado, e categoria
     *  pré-marcada enchia todo histórico de "Pedido do cliente" por omissão. */
    categoria: CategoriaMotivo | "";
    nota: string;
    /** Número do chamado. Obrigatório no Backstage, nas três operações (H-07). */
    chamado: string;
}

/** H-07: motivo E número do chamado são obrigatórios em toda alteração no Backstage. O motivo
 *  só conta como informado quando o operador escolheu a categoria; em "Outro", a nota explica. */
export const motivoValido = (motivo: Motivo) =>
    motivo.chamado.trim().length > 0 && motivo.categoria !== "" && (motivo.categoria !== "outro" || motivo.nota.trim().length > 0);

export const descreverMotivo = (motivo?: Motivo) =>
    motivo
        ? [motivo.categoria && CATEGORIA_MOTIVO_LABEL[motivo.categoria], motivo.nota.trim(), motivo.chamado.trim() && `Chamado ${motivo.chamado.trim()}`]
              .filter(Boolean)
              .join(" · ")
        : "";

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
    /** Agrupa os fatos de uma mesma alteração: pedido, envios, pagamento e resultado. */
    solicitacaoId?: string;
    tipo?: TipoOperacao;
    marco?: MarcoHistorico;
    /** Unidades afetadas, para a linha da unidade saber o que aconteceu com ela. */
    linhaIds?: string[];
    motivo?: Motivo;
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
    /** Canal e destino escolhidos ao enviar a cobrança — fica registrado para "Reenviar link" e auditoria. */
    canalEnvio: CanalEnvio;
    destinatarioEnvio: string;
    detalhes?: string[];
    /** Linhas presas nesta operação: elas não entram em outra enquanto isso não resolver. */
    linhasAfetadas: string[];
    /**
     * A máquina de estados das três EFs (§12.1 / §11.1).
     *
     * aguardando: cobrança pendente. processando: pagamento confirmado, aplicando.
     * reprovada: o pagamento entrou e a revalidação das regras reprovou — estorno integral
     * automático, nada muda no pedido, estado final (H-06). falha: a revalidação passou e a
     * aplicação quebrou por erro técnico; sem nova cobrança, admite reprocessamento.
     *
     * O protótipo tinha um "aguardando-financeiro" no lugar do estorno: a operação ficava paga
     * e não aplicada e a saída era avisar o financeiro por fora. Isso trocava a regra do
     * documento por um processo manual e deixava o cliente pago e sem o item.
     */
    estado: "aguardando" | "processando" | "reprovada" | "falha";
    /** Por que reprovou ou falhou. */
    motivoFalha?: string;
    /** Referência que o operador digitou ao registrar o pagamento (não é validação de gateway). */
    referenciaPagamento?: string;
    motivo?: Motivo;
    /** Quem abriu a alteração. */
    operador: string;
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

export type TipoRascunho = "troca-item" | "troca-titularidade";

/**
 * Uma operação em montagem, ainda sem cobrança gerada — não reserva estoque nem trava linha.
 * Vive no store (não em local/sessionStorage) para sobreviver a F5, fechar a aba, ou ser
 * retomada por qualquer operador que reabrir o pedido depois, inclusive dias depois.
 */
export interface Rascunho {
    id: string;
    pedidoId: string;
    tipo: TipoRascunho;
    /** Etapa em que o operador parou, para o wizard retomar exatamente ali. */
    etapa: string;
    linhasSelecionadas: string[];
    /** Troca: item de destino escolhido por linha. */
    destinoPorLinha?: Record<string, string>;
    /** Transferência: novo titular escolhido por linha. */
    titularPorLinha?: Record<string, string>;
    /** Transferência: o destinatário escolhido, independente de haver linha marcada. Com o
     *  destinatário vindo antes dos itens, existe um rascunho legítimo de conta escolhida e
     *  nenhuma unidade, e `titularPorLinha` (indexado por linha) não tem onde guardá-lo. */
    destinatarioId?: string;
    respostasPorLinha?: Record<string, Record<string, string>>;
    motivo?: Motivo;
    /** Texto da busca de destinatário, para a retomada não abrir em branco. */
    busca?: string;
    atualizadoEm: number;
    atualizadoEmLabel: string;
    /** Último operador a tocar o rascunho — alimenta o indicador leve de concorrência. */
    operador: string;
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

/*
  Os mesmos eventos da listagem do Backstage (eventos/data/eventos.ts), com nome e pôster
  iguais: trocar de tela durante um atendimento tem que parecer o mesmo produto, e o produtor
  reconhece o evento pela arte que já vê na própria lista.

  Os ids internos seguem como estavam porque as sessões, o catálogo e os pedidos semente
  apontam para eles; só o que aparece na tela mudou.
*/
export const EVENTOS: EventoOrg[] = [
    {
        id: "ev-maratona",
        nome: "Laroc apresenta: RAVE THE WORLD by Alok",
        data: SESSOES[2].dataLabel,
        capa: "https://kraken.ingresse.com/event/posters/104600/large/1786025742.4637246.jpg",
    },
    {
        id: "ev-trail",
        nome: "MOCHAKK CALLING 2026",
        data: SESSOES[4].dataLabel,
        capa: "https://kraken.ingresse.com/event/posters/103691/large/1787000382.8580675.jpg",
    },
    {
        id: "ev-triathlon",
        nome: "D-EDGE RIO apresenta IN DA CLUB W/ JUICCE",
        data: SESSOES[6].dataLabel,
        capa: "https://kraken.ingresse.com/event/posters/108467/large/1790120499.9730182.jpg",
    },
];

/** Nível 2 e 3: cada item pertence a um grupo dentro de uma sessão. */
const GRUPO_RUA = "Provas de rua";
const GRUPO_LONGAS = "Provas longas";
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
        grupo: GRUPO_RUA,
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
        grupo: GRUPO_LONGAS,
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

    /* Combos: um pacote vendido como item único que cobre mais de uma data. O tipo existia no
       modelo (e `datasCombo` com ele) sem nenhum item no catálogo, então o grupo "Combos" da
       lista nunca aparecia na tela. */
    {
        id: "cb-mar-2dias",
        tipo: "combo",
        eventoId: "ev-maratona",
        nome: "Combo dois dias",
        modalidade: "Dupla",
        descricao: "Inscrição nos dois dias de prova, com kit único na retirada.",
        precoIntegral: 420,
        estoque: 24,
        formularioId: "f-corrida",
        datasCombo: [SESSOES[2].dataLabel, SESSOES[3].dataLabel],
    },
    {
        id: "cb-mar-dupla",
        tipo: "combo",
        eventoId: "ev-maratona",
        nome: "Combo corrida mais camiseta",
        modalidade: "Unidade",
        descricao: "Inscrição de 10 km com a camiseta oficial inclusa.",
        precoIntegral: 230,
        estoque: 40,
        datasCombo: [SESSOES[2].dataLabel],
    },

    /* Combos removidos por hora — "combo" segue existindo em TipoItem para religar rápido depois. */
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
        criadoEmLabel: "02 ago 2026, 10:12",
        atualizadoEmLabel: "02 ago 2026, 10:12",
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
                marco: "compra" as const,
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
        criadoEmLabel: "05 ago 2026, 19:44",
        atualizadoEmLabel: "05 ago 2026, 19:44",
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
                marco: "compra" as const,
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
        criadoEmLabel: "11 ago 2026, 08:31",
        atualizadoEmLabel: "11 ago 2026, 08:31",
        itens: [
            {
                id: "li-3a",
                itemId: "it-trail-12k",
                titularId: "c-carol",
                transferidoEmLabel: "28 ago 2026",
                transferidoPor: "Marcelo Duarte",
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
                marco: "compra" as const,
                descricao: "Trail 12 km com cupom de 10 por cento e transfer para a largada.",
                valor: 190,
                estado: "concluido",
            },
            {
                id: "h-3b",
                dataLabel: "28 ago 2026, 15:40",
                responsavel: "Marcelo Duarte",
                titulo: "Transferência solicitada",
                descricao: "Link enviado por e-mail para carolina.sampaio@email.com.",
                detalhes: ["1x Trail 12 km · Lote 2", "De Juliana Prado para Carolina Sampaio (carolina.sampaio@email.com)"],
                valor: 15.3,
                estado: "concluido",
                solicitacaoId: "sol-seed-3",
                tipo: "troca-titularidade",
                marco: "solicitada",
                linhaIds: ["li-3a"],
                motivo: { categoria: "pedido-cliente", nota: "", chamado: "98231" },
            },
            {
                id: "h-3c",
                dataLabel: "28 ago 2026, 16:01",
                responsavel: "Carolina Sampaio",
                titulo: "Pagamento confirmado",
                descricao: "Pago pelo link de pagamento.",
                valor: 15.3,
                estado: "concluido",
                solicitacaoId: "sol-seed-3",
                tipo: "troca-titularidade",
                marco: "paga",
                linhaIds: ["li-3a"],
            },
            {
                id: "h-3d",
                dataLabel: "28 ago 2026, 16:02",
                responsavel: "Sistema",
                titulo: "Transferência aplicada",
                descricao: "1 item transferido. O transfer para a largada segue com Juliana Prado.",
                valor: 15.3,
                estado: "concluido",
                solicitacaoId: "sol-seed-3",
                tipo: "troca-titularidade",
                marco: "aplicada",
                linhaIds: ["li-3a"],
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
        criadoEmLabel: "14 ago 2026, 21:07",
        atualizadoEmLabel: "14 ago 2026, 21:07",
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
                marco: "compra" as const,
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
        criadoEmLabel: "19 ago 2026, 13:55",
        atualizadoEmLabel: "19 ago 2026, 13:55",
        itens: [
            {
                id: "li-5a",
                itemId: "it-tri-sprint",
                valorPago: 252,
                respostas: { ...respostasCompletas("it-tri-sprint"), "p-camiseta": "M", "p-kit": "Arena das Dunas", "p-emergencia": "Amigo" },
            },
        ],
        status: "ativo",
        historico: [
            {
                id: "h-5a",
                dataLabel: "19 ago 2026, 13:55",
                responsavel: "Diego Fontes",
                titulo: "Pedido criado",
                marco: "compra" as const,
                descricao: "Triathlon sprint com desconto de atleta federado.",
                valor: 252,
                estado: "concluido",
            },
            {
                id: "h-5b",
                dataLabel: "02 set 2026, 18:20",
                responsavel: "Marcelo Duarte",
                titulo: "Troca solicitada",
                descricao: "Link enviado por e-mail para diego.fontes@email.com.",
                detalhes: ["Sai 1x Triathlon sprint · Lote 2", "Entra 1x Triathlon olímpico · Lote 2"],
                valor: 162.18,
                estado: "concluido",
                solicitacaoId: "sol-seed-5",
                tipo: "troca-item",
                marco: "solicitada",
                linhaIds: ["li-5a"],
                motivo: { categoria: "pedido-cliente", nota: "", chamado: "98231" },
            },
            {
                id: "h-5c",
                dataLabel: "03 set 2026, 09:10",
                responsavel: "Diego Fontes",
                titulo: "Pagamento confirmado",
                descricao: "Pago pelo link de pagamento.",
                valor: 162.18,
                estado: "concluido",
                solicitacaoId: "sol-seed-5",
                tipo: "troca-item",
                marco: "paga",
                linhaIds: ["li-5a"],
            },
            {
                id: "h-5d",
                dataLabel: "03 set 2026, 09:18",
                responsavel: "Sistema",
                titulo: "Troca paga e não aplicada",
                descricao: "O Triathlon olímpico esgotou antes de a troca ser aplicada. Diego seguiu com o Triathlon sprint.",
                valor: 162.18,
                estado: "falha",
                solicitacaoId: "sol-seed-5",
                tipo: "troca-item",
                marco: "falha",
                linhaIds: ["li-5a"],
            },
            {
                id: "h-5e",
                dataLabel: "03 set 2026, 09:31",
                responsavel: "Marcelo Duarte",
                titulo: "Financeiro notificado",
                descricao: "Estorno da diferença em análise pelo financeiro.",
                valor: 162.18,
                estado: "falha",
                solicitacaoId: "sol-seed-5",
                tipo: "troca-item",
                marco: "financeiro",
                linhaIds: ["li-5a"],
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
        criadoEmLabel: "24 ago 2026, 07:40",
        atualizadoEmLabel: "24 ago 2026, 07:40",
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
                marco: "compra" as const,
                descricao: "Revezamento em dupla no lote 1 e aluguel de neoprene.",
                valor: 440,
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
        criadoEmLabel: "04 set 2026, 15:02",
        atualizadoEmLabel: "04 set 2026, 15:02",
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
                marco: "compra" as const,
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
    criadoEmLabel: "08 set 2026, 09:15",
    atualizadoEmLabel: "08 set 2026, 09:15",
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
                marco: "compra" as const,
            descricao: "Compra em lote da assessoria Run Potiguar: 60 inscrições e 10 camisetas extras.",
            valor: 7860,
            estado: "concluido",
        },
    ],
});

/* Pedido para testar o cartão de item com uma unidade só ao lado de várias — em ingresso e em
   produto ao mesmo tempo, pra ver o cartão de 1 unidade (sem "ver unidades") ao lado do de 3
   (que já nasce expandido, por ter 4 unidades ou menos). */
PEDIDOS_INICIAIS.push({
    id: uuidDeterministico(10),
    eventoId: "ev-maratona",
    compradorId: "c-leticia",
    dataCompraLabel: "10 set 2026",
    canal: "Online",
    meioPagamento: "Cartão de crédito (3x)",
    criadoEmLabel: "10 set 2026, 10:22",
    atualizadoEmLabel: "10 set 2026, 10:22",
    itens: [
        ...gerarLinhas("li-10a", "it-mar-5k", 3, 120, () => ({
            ...respostasCompletas("it-mar-5k"),
            "p-camiseta": TAMANHOS[Math.floor(Math.random() * TAMANHOS.length)],
            "p-kit": "Arena das Dunas",
            "p-equipe": "Sem equipe",
        })),
        ...gerarLinhas("li-10b", "it-mar-10k", 1, 180, () => ({
            ...respostasCompletas("it-mar-10k"),
            "p-camiseta": "M",
            "p-kit": "Praia de Ponta Negra",
            "p-equipe": "Sem equipe",
        })),
        ...gerarLinhas("li-10c", "pr-camiseta-extra", 3, 80, () => ({})),
        ...gerarLinhas("li-10d", "pr-foto", 1, 45, () => ({})),
    ],
    status: "ativo",
    historico: [
        {
            id: "h-10",
            dataLabel: "10 set 2026, 10:22",
            responsavel: "Letícia Amaral",
            titulo: "Pedido criado",
                marco: "compra" as const,
            descricao: "3x Corrida 5 km, 1x Corrida 10 km, 3x camiseta extra do evento e 1x pacote de fotos.",
            valor: 825,
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

/* "falha" fica fora do sorteio: é um estado derivado de uma solicitação aberta (comStatus),
   nunca um estado de repouso — um pedido semente nasce sempre sem solicitações. */
const STATUS_EXTRA: StatusPedido[] = ["ativo", "ativo", "ativo", "ativo", "alteracao-concluida", "expirado"];

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
            /* O nome se repete a cada 20 pedidos (NOMES_EXTRA), então o índice entra no e-mail:
               sem ele, contas de pessoas diferentes cairiam no mesmo endereço e o "confira o
               nome e o e-mail" da busca de transferência perderia sentido. */
            email: `${nome.toLowerCase().normalize("NFD").replace(/[^a-z ]/g, "").replace(/ /g, ".")}.${indice}@email.com`,
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
        const hora = `${String(8 + Math.floor(aleatorio() * 12)).padStart(2, "0")}:${String(Math.floor(aleatorio() * 60)).padStart(2, "0")}`;

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
                    dataLabel: `${dataCompraLabel}, ${hora}`,
                    responsavel: nome,
                    titulo: "Pedido criado",
                    marco: "compra" as const,
                    descricao: itens.map((l) => CATALOGO.find((i) => i.id === l.itemId)?.nome).join(", ") + ".",
                    valor: itens.reduce((soma, l) => soma + l.valorPago, 0),
                    estado: "concluido" as const,
                },
            ],
        };
    });

/* Pedido com os três tipos de item lado a lado, que nenhum outro tinha: combo, ingresso e
   produto. Dois deles chegam já transferidos, um combo e um produto, para a linha de portador
   e o detalhe da titularidade aparecerem fora do ingresso. */
PEDIDOS_INICIAIS.push({
    id: uuidDeterministico(11),
    eventoId: "ev-maratona",
    compradorId: "c-rafael",
    dataCompraLabel: "12 set 2026",
    canal: "Online",
    meioPagamento: "Pix",
    criadoEmLabel: "12 set 2026, 16:40",
    atualizadoEmLabel: "29 set 2026, 11:05",
    itens: [
        { id: "li-11a", itemId: "cb-mar-2dias", valorPago: 420, respostas: { ...respostasCompletas("cb-mar-2dias"), "p-camiseta": "G", "p-kit": ARENA, "p-equipe": "Sem equipe" } },
        {
            id: "li-11b",
            itemId: "cb-mar-2dias",
            titularId: "c-carol",
            transferidoEmLabel: "29 set 2026",
            transferidoPor: "Rafael Menezes",
            valorPago: 420,
            respostas: { ...respostasCompletas("cb-mar-2dias"), "p-camiseta": "M", "p-kit": ARENA, "p-equipe": "Sem equipe" },
        },
        { id: "li-11c", itemId: "cb-mar-dupla", valorPago: 230, respostas: {} },
        { id: "li-11d", itemId: "it-mar-10k", valorPago: 180, respostas: { ...respostasCompletas("it-mar-10k"), "p-camiseta": "GG", "p-kit": ARENA, "p-equipe": "Sem equipe" } },
        {
            id: "li-11e",
            itemId: "pr-camiseta-extra",
            titularId: "c-diego",
            transferidoEmLabel: "29 set 2026",
            transferidoPor: "Rafael Menezes",
            valorPago: 80,
            respostas: {},
        },
    ],
    status: "alteracao-concluida",
    historico: [
        {
            id: "h-11",
            dataLabel: "12 set 2026, 16:40",
            responsavel: "Rafael Menezes",
            titulo: "Pedido criado",
            marco: "compra" as const,
            descricao: "2x combo dois dias, 1x combo corrida mais camiseta, 1x Corrida 10 km e 1x camiseta extra.",
            valor: 1330,
            estado: "concluido",
        },
    ],
});

PEDIDOS_INICIAIS.push(...gerarPedidosExtra(101));

/* ------------------------------------------------------------------ */
/*  Store em memória                                                   */
/* ------------------------------------------------------------------ */

interface Estado {
    pedidos: Pedido[];
    catalogo: CatalogoItem[];
    perguntas: Pergunta[];
    rascunhos: Rascunho[];
}

let estado: Estado = {
    pedidos: PEDIDOS_INICIAIS.map((pedido) => ({ ...pedido, baseStatus: pedido.status, solicitacoes: [] })),
    catalogo: CATALOGO,
    perguntas: PERGUNTAS,
    rascunhos: [],
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

const soDigitos = (texto: string) => texto.replace(/\D/g, "");

/** Busca por nome, e-mail ou CPF contra TODA a base de contas — inclui CONTAS_EXTRA (as contas dos
 *  pedidos gerados dinamicamente, a maioria da base real), não só a lista fixa de exemplo. Antes,
 *  a busca de destinatário só olhava CONTAS e só reconhecia e-mail exato ou CPF por dígitos, então
 *  o dado mais natural que um operador tem numa ligação — o nome de quem vai receber — nunca
 *  encontrava ninguém. */
export const buscarContas = (termo: string, limite = 8): Conta[] => {
    const busca = termo.trim().toLowerCase();
    if (!busca) return [];
    const digitos = soDigitos(busca);
    return [...CONTAS, ...CONTAS_EXTRA]
        .filter((c) => c.nome.toLowerCase().includes(busca) || c.email.toLowerCase().includes(busca) || (digitos.length >= 3 && soDigitos(c.cpf).includes(digitos)))
        .slice(0, limite);
};

/* Criar conta não existe neste fluxo. A EF de titularidade põe fora do escopo criar conta,
   cadastrar facial e editar o cadastro global (§4 e §18), e manda bloquear a operação quando o
   novo possuidor não tem conta, orientando o cadastro (§8 E2, V08). Havia aqui um `criarConta`
   e um formulário inline que coletava inclusive gênero e vínculo de sócio, os dois campos que a
   segmentação usa para decidir: o operador declararia o dado que o bloqueia. */
export const getEvento = (id: string) => EVENTOS.find((e) => e.id === id);
export const getPergunta = (id: string) => estado.perguntas.find((p) => p.id === id);
export const getFormulario = (id?: string) => (id ? FORMULARIOS.find((f) => f.id === id) : undefined);

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Totais do pedido, derivados das linhas: nada de valor solto que possa divergir dos itens.
 *  Desconto só existe quando houve cupom: diferença de lote não é desconto, e sem essa regra
 *  um pedido sem cupom mostrava "desconto" comparando com o preço de hoje do catálogo. */
export const totaisDoPedido = (pedido: Pedido) => {
    const final = arredondar(pedido.itens.reduce((soma, l) => soma + l.valorPago, 0));
    if (!pedido.cupom) return { final, original: final, desconto: 0 };
    const original = arredondar(pedido.itens.reduce((soma, l) => soma + Math.max(l.valorPago, getItem(l.itemId)?.precoIntegral ?? l.valorPago), 0));
    return { final, original, desconto: arredondar(original - final) };
};

export const formatarMoeda = (valor: number) =>
    valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const arredondar = (valor: number) => Math.round(valor * 100) / 100;

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/* Mesmo formato das datas semeadas ("28 ago 2026, 16:02"): o histórico não pode misturar dois
   jeitos de escrever a mesma coisa. */
const dataLabel = (d: Date) => `${String(d.getDate()).padStart(2, "0")} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
const agoraLabel = () => {
    const d = new Date();
    return `${dataLabel(d)}, ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
};

const novoId = (prefixo: string) => `${prefixo}-${Math.random().toString(36).slice(2, 9)}`;

/** Link de checkout no mesmo formato usado pela bilheteria. */
const novoLinkPagamento = (pedidoId: string) => `pay.ingresse.com/alteracao/${uuidCurto(pedidoId)}-${Math.random().toString(36).slice(2, 8)}`;

/** Estado para o qual o pedido volta quando uma solicitação é cancelada, expira ou é reaberta.
 *  Lê o marco, nunca o texto do título. */
const statusBase = (p: Pedido): StatusPedido => (p.historico.some((h) => h.marco === "aplicada") ? "alteracao-concluida" : "ativo");

/* A situação do pedido é sempre derivada. Uma falha nunca fica escondida atrás de outra
   operação aberta na mesma linha ou em outra: ela manda sobre qualquer outro estado
   transitório até ser resolvida deliberadamente (Notificar financeiro). */
const comStatus = (p: Pedido): Pedido => ({
    ...p,
    status: p.solicitacoes.some((s) => s.estado === "falha")
        ? "falha"
        : p.solicitacoes.some((s) => s.estado === "processando")
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

/** O nome curto, na fala do cliente, que abre os títulos de cartão e de histórico. */
export const TIPO_OPERACAO_CURTO: Record<TipoOperacao, string> = {
    "troca-item": "Troca",
    "troca-titularidade": "Transferência",
    "alterar-respostas": "Edição do formulário",
};

/* ------------------------------------------------------------------ */
/*  Cálculos das operações                                             */
/* ------------------------------------------------------------------ */

export interface Calculo {
    linhas: LinhaCobranca[];
    total: number;
    /** Diferença bruta entre o novo item e o valor pago, antes da regra de crédito. */
    diferencaBruta: number;
    /** True quando sobrou crédito que não é devolvido (downgrade). Exige aceite explícito. */
    semCredito: boolean;
    /**
     * Sobra do downgrade que fica com a Ingresse: não vira devolução, crédito
     * nem saldo, e a tela precisa de aceite explícito (575995905 §10.2).
     */
    naoDevolvido?: number;
    /** Quanto da diferença cobrada vem do desconto da compra, que não vale para o item novo. */
    descontoPerdido?: number;
}

/** Taxa de serviço de um item do catálogo, com o padrão quando não há a sua. */
const percentualDoItem = (item?: CatalogoItem) => item?.taxaServicoPercent ?? TAXA_SERVICO_PADRAO;
const taxaServicoSobre = (valor: number, item?: CatalogoItem) => arredondar(valor * percentualDoItem(item));
/** Taxa de serviço paga na linha. Sem registro, deriva do que foi efetivamente pago. */
const taxaPagaNaLinha = (linha: PedidoItem) => linha.taxaServicoPaga ?? taxaServicoSobre(linha.valorPago, getItem(linha.itemId));

export interface ParTroca {
    linha: PedidoItem;
    novoItem: CatalogoItem;
}

/** Pares que saem e entram ordenados do menor para o maior valor: com a diferença tendo piso
 *  zero, essa combinação dá o menor total possível. Antes, o par dependia da ordem em que as
 *  linhas e os itens apareciam nos arrays, e trocar a ordem mudava o valor cobrado. */
export const parearTroca = (linhasSaem: PedidoItem[], itensEntram: CatalogoItem[]): ParTroca[] => {
    const saem = [...linhasSaem].sort((a, b) => a.valorPago - b.valorPago);
    const entram = [...itensEntram].sort((a, b) => a.precoIntegral - b.precoIntegral);
    return saem.flatMap((linha, i) => (entram[i] ? [{ linha, novoItem: entram[i] }] : []));
};

/**
 * Troca de N itens (575995905 §10.2).
 *
 *   Diferença  = Σ (integral do novo − efetivamente pago no atual)   ← pode ser negativa
 *   Taxa prop. = Σ máx(0, taxa de serviço do novo − taxa paga no atual)
 *   TOTAL      = máx(0, Diferença + Taxa proporcional + Cobrança da troca)
 *
 * Duas armadilhas que a implementação anterior caiu:
 *
 * O `máx(0, …)` é do TOTAL, não da diferença. Travando item a item, o crédito
 * do downgrade deixava de abater a cobrança e o protótipo cobrava R$ 20,40 numa
 * troca que a tabela §10.4 diz ser de R$ 0,00.
 *
 * A cobrança da troca é por OPERAÇÃO. Multiplicada pela quantidade, uma troca
 * de três itens cobrava três vezes o que o finance configura uma vez.
 *
 * Não existe taxa de processamento: "Não existe outra taxa na operação" (§10.1).
 */
export const calcularTrocaItens = (pares: ParTroca[]): Calculo => {
    const diferenca = arredondar(pares.reduce((soma, { linha, novoItem }) => soma + novoItem.precoIntegral - linha.valorPago, 0));
    const taxaProporcional = arredondar(
        pares.reduce((soma, { linha, novoItem }) => soma + Math.max(0, taxaServicoSobre(novoItem.precoIntegral, novoItem) - taxaPagaNaLinha(linha)), 0),
    );
    /* O desconto da compra não acompanha a troca: o crédito é o que foi pago e o
       destino entra pelo integral do lote (§10.1). Isto é só o aviso na tela. */
    const descontoPerdido = arredondar(
        pares.reduce((soma, { linha, novoItem }) => {
            const descontoDaLinha = Math.max(0, (getItem(linha.itemId)?.precoIntegral ?? linha.valorPago) - linha.valorPago);
            return soma + Math.min(descontoDaLinha, Math.max(0, novoItem.precoIntegral - linha.valorPago));
        }, 0),
    );

    const bruto = arredondar(diferenca + taxaProporcional + COBRANCA_TROCA_ITEM);
    const total = Math.max(0, bruto);
    const naoDevolvido = Math.max(0, arredondar(-bruto));

    const linhas: LinhaCobranca[] = [
        {
            label: "Diferença dos itens",
            valor: diferenca,
            regra: "Preço integral do item novo menos o valor efetivamente pago no atual. O desconto da compra original não acompanha a troca.",
        },
        {
            label: "Taxa de serviço proporcional",
            valor: taxaProporcional,
            regra: "Taxa de serviço do item novo menos a já paga no atual. Nunca negativa.",
        },
        {
            label: "Cobrança da troca",
            valor: COBRANCA_TROCA_ITEM,
            regra: `Cobrada uma vez por operação, independente de quantos itens mudam. Dividida em ${formatarMoeda(COBRANCA_TROCA_ITEM_PRODUTOR)} para o produtor e ${formatarMoeda(COBRANCA_TROCA_ITEM_INGRESSE)} para a Ingresse.`,
        },
    ];
    /* A sobra do downgrade NÃO entra no recibo: ela não é cobrança e, somada às
       parcelas, fazia a lista deixar de fechar com o total. Ela aparece onde age,
       no aviso e no aceite da revisão (§10.2). */
    linhas.push({ label: "Total", valor: total, destaque: true });

    return { linhas, total, diferencaBruta: diferenca, semCredito: naoDevolvido > 0, naoDevolvido, descontoPerdido };
};

/** Um item só. Delega, para não existirem duas fórmulas que possam divergir. */
export const calcularTrocaItem = (linha: PedidoItem, novoItem: CatalogoItem): Calculo => calcularTrocaItens([{ linha, novoItem }]);

/**
 * Titularidade (576978948 §6): o item não muda, então não há diferença nem taxa
 * de serviço proporcional. Vale a cobrança da transferência paga.
 */
export const calcularTrocaTitularidade = (quantidade = 1): Calculo => {
    const total = arredondar(quantidade * COBRANCA_TITULARIDADE);
    return {
        diferencaBruta: 0,
        semCredito: false,
        total,
        linhas: [
            {
                /* Sem a conta no rótulo: a quantidade já está no card "Transferindo",
                   logo acima, e com uma unidade saía o inútil "(1 × R$ 15,00)". */
                label: quantidade > 1 ? `Cobrança da transferência · ${quantidade} unidades` : "Cobrança da transferência",
                valor: total,
                regra: "Segue a configuração da transferência paga. O item é o mesmo: não há diferença de preço nem taxa de serviço proporcional.",
            },
            { label: "Total", valor: total, destaque: true },
        ],
    };
};

/**
 * Troca de respostas (575635517 §9.2): TOTAL = cobrança da troca, e só.
 * Respostas não têm valor monetário — sem diferença, crédito ou taxa de serviço.
 */
export const calcularEdicaoRespostas = (quantidadeAlterada: number): Calculo => ({
    diferencaBruta: 0,
    semCredito: false,
    total: COBRANCA_TROCA_PERGUNTAS,
    linhas: [
        {
            label: "Cobrança da troca",
            valor: COBRANCA_TROCA_PERGUNTAS,
            regra: `Entrada própria no finance, separada da troca de item. Cobrada uma vez por operação: as ${quantidadeAlterada} respostas alteradas juntas custam o mesmo que uma.`,
        },
        { label: "Total", valor: COBRANCA_TROCA_PERGUNTAS, destaque: true },
    ],
});

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
    /* A origem também tem regra: uma sessão que já aconteceu não tem mais o que trocar. */
    if (linhaEncerrada(linha)) {
        return { curto: "Sessão realizada", titulo: "Sessão já realizada", descricao: "A sessão desta unidade já aconteceu. Só a transferência continua disponível." };
    }
    if (novoItem.id === linha.itemId) {
        return { curto: "Item atual", titulo: "Item igual ao atual", descricao: "Selecione um item diferente do que está no pedido." };
    }
    /* Nominal: uma unidade por participante. A própria linha sendo substituída não conta como duplicidade —
       é ela que vai deixar de existir com o item antigo. */
    if (nominalDoItem(novoItem)) {
        const titularId = linha.titularId ?? pedido.compradorId;
        const duplicado = pedido.itens.some((l) => l.id !== linha.id && l.itemId === novoItem.id && (l.titularId ?? pedido.compradorId) === titularId);
        if (duplicado) {
            const titular = getConta(titularId);
            return {
                curto: "Já vinculado",
                titulo: "Item já vinculado a este participante",
                descricao: `${titular?.nome ?? "Este participante"} já tem uma unidade de ${novoItem.nome} neste pedido.`,
            };
        }
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

/** Valida a transferência de uma linha específica — cada linha pode ter titular e item
 *  diferentes, então a restrição de segmentação precisa olhar o item DESSA linha, nunca
 *  "o primeiro item segmentado do pedido inteiro" (isso bloqueava ou liberava transferências
 *  com base num item que não tinha nada a ver com a linha sendo transferida). */
export const validarNovoTitular = (pedido: Pedido, linha: PedidoItem, conta: Conta, junto: PedidoItem[] = []): Bloqueio | null => {
    const titularAtual = linha.titularId ?? pedido.compradorId;
    if (conta.id === titularAtual) {
        return { curto: "Titular atual", titulo: "Conta já é a titular", descricao: "Selecione outra conta para a transferência." };
    }
    const item = getItem(linha.itemId);
    /* Nominal: uma unidade por pessoa, como na troca. Conta o que a pessoa já tem no pedido e o
       que está indo para ela na mesma transferência. */
    if (item && nominalDoItem(item)) {
        const jaTem = pedido.itens.some((l) => l.id !== linha.id && l.itemId === item.id && (l.titularId ?? pedido.compradorId) === conta.id);
        const vaiJunto = junto.some((l) => l.id !== linha.id && l.itemId === item.id);
        if (jaTem || vaiJunto) {
            return {
                curto: "Já vinculado",
                titulo: "Ingresso nominal",
                descricao: `${conta.nome} já ${jaTem ? "tem" : "vai receber"} uma unidade de ${item.nome}. Ingresso nominal: uma unidade por pessoa.`,
            };
        }
    }
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
/* Reprovada é estado final com estorno feito: não há nada pendente sobre a linha, então ela
   volta a aceitar operação. Só aguardando, processando e falha prendem a unidade (§12.1). */
export const solicitacaoDaLinha = (pedido: Pedido, linhaId: string) =>
    pedido.solicitacoes.find((s) => s.linhasAfetadas.includes(linhaId) && s.estado !== "reprovada");

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

/** As três coisas que um operador faz com uma unidade. */
export type Verbo = "transferir" | "trocar" | "formulario";

export const temFormulario = (item?: CatalogoItem) => Boolean(getFormulario(item?.formularioId)?.perguntaIds.length);

/** Por que uma unidade não entra numa ação, em texto curto para aparecer ao lado dela.
 *  Null quando está disponível. A mesma regra vale na lista e dentro do overlay, então nada
 *  aparece como possível num lugar e bloqueado no outro. */
export const motivoIndisponivel = (pedido: Pedido, linha: PedidoItem, verbo: Verbo): string | null => {
    /*
      Ter recebido por transferência NÃO bloqueia nada. A spec prevê o item mudar
      de possuidor mais de uma vez (576978948 §11.3, C23) e prevê o operador
      trocar perguntas DEPOIS da titularidade concluída (§10, C12). A única chave
      de bloqueio é a solicitação pendente (H-08).
    */
    const solicitacao = solicitacaoDaLinha(pedido, linha.id);
    if (solicitacao) {
        if (solicitacao.estado === "falha") return `${TIPO_OPERACAO_CURTO[solicitacao.tipo]} paga e não aplicada`;
        if (solicitacao.tipo === "troca-titularidade") {
            const destino = getConta(solicitacao.aplicar.titularPorLinha?.[linha.id] ?? "");
            return `Em transferência para ${destino?.nome ?? "outra pessoa"}`;
        }
        return solicitacao.tipo === "troca-item" ? "Em troca" : "Em edição do formulário";
    }
    if (verbo === "trocar" && linhaEncerrada(linha)) return "Sessão realizada";
    if (verbo === "formulario" && !temFormulario(getItem(linha.itemId))) return "Sem formulário";
    return null;
};

export const disponivelPara = (pedido: Pedido, linha: PedidoItem, verbo: Verbo) => motivoIndisponivel(pedido, linha, verbo) === null;

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
    /** Canal e destino da cobrança: sempre gravam rastro no histórico. */
    canalEnvio: CanalEnvio;
    destinatarioEnvio: string;
    motivo: Motivo;
}

export const canalLabel = (_canal: CanalEnvio) => "e-mail";

/** Os campos que toda entrada de uma alteração carrega, para o histórico agrupar por ela. */
const daAlteracao = (s: Pick<Solicitacao, "id" | "tipo" | "linhasAfetadas">) => ({ solicitacaoId: s.id, tipo: s.tipo, linhaIds: s.linhasAfetadas });

/** Cria a cobrança pendente, reserva o estoque e já registra o envio: nunca existe uma
 *  solicitação "criada mas não enviada" sem rastro de canal, destino e horário.
 *  Guarda de concorrência: devolve null, sem criar nada, se alguma unidade já está em outra
 *  alteração ou já foi transferida (outro operador pode ter agido enquanto este montava). */
/**
 * Devolve ao estoque o que a operação libera: o item de origem de cada troca e a
 * resposta anterior de cada linha. O destino já foi consumido na reserva, então
 * aqui só entra o que sai (575995905 §11, 575635517 §10).
 */
/** Solta o que a solicitação havia segurado no destino. Usado quando ela termina sem aplicar:
 *  expirada, cancelada ou reprovada depois do pagamento. */
const liberarReservasDoDestino = (solicitacao: Solicitacao) =>
    solicitacao.reservas.forEach((r) => (r.tipo === "item" ? ajustarEstoqueItem(r.itemId, 1) : ajustarEstoqueResposta(r.perguntaId, r.valor, 1)));

const devolverEstoqueDasOrigens = (pedido: Pedido, solicitacao: Solicitacao) => {
    solicitacao.aplicar.trocas?.forEach((t) => {
        const origem = pedido.itens.find((l) => l.id === t.pedidoItemId);
        if (origem) ajustarEstoqueItem(origem.itemId, 1);
    });
    solicitacao.reservas.forEach((r) => {
        if (r.tipo !== "resposta") return;
        solicitacao.linhasAfetadas.forEach((linhaId) => {
            const anterior = pedido.itens.find((l) => l.id === linhaId)?.respostas[r.perguntaId];
            if (anterior && anterior !== r.valor) ajustarEstoqueResposta(r.perguntaId, anterior, 1);
        });
    });
};

export const criarSolicitacao = ({ pedidoId, tipo, resumo, detalhes, linhasAfetadas, calculo, aplicar, reservas, canalEnvio, destinatarioEnvio, motivo }: CriarSolicitacaoInput): string | null => {
    const pedido = getPedido(pedidoId);
    if (!pedido) return null;
    /* Só a solicitação pendente ocupa a linha; transferência concluída não ocupa (H-08). */
    const ocupada = linhasAfetadas.some((id) => solicitacaoDaLinha(pedido, id));
    if (ocupada) return null;

    const agora = Date.now();
    const solicitacaoId = novoId("sol");
    reservas.forEach((r) => (r.tipo === "item" ? ajustarEstoqueItem(r.itemId, -1) : ajustarEstoqueResposta(r.perguntaId, r.valor, -1)));

    /*
      Total zero não gera solicitação, link nem prazo: valida, aplica e devolve o
      estoque de origem na mesma transação (575995905 §10.2 e §12.3, 575635517 §6.2
      e §9.2). Antes a tela oferecia "Enviar cobrança de R$ 0,00" e punha a operação
      para esperar um pagamento que não existe.
    */
    if (calculo.total === 0) {
        const semCobranca: Solicitacao = {
            id: solicitacaoId,
            tipo,
            resumo,
            linhas: calculo.linhas,
            total: 0,
            criadoEm: agora,
            expiraEm: agora,
            linkPagamento: "",
            canalEnvio,
            destinatarioEnvio,
            detalhes,
            linhasAfetadas,
            estado: "aguardando",
            aplicar,
            reservas,
            motivo,
            operador: OPERADOR_ATUAL,
        };
        devolverEstoqueDasOrigens(pedido, semCobranca);
        atualizarPedido(pedidoId, (p) =>
            aplicarSolicitacao(
                {
                    ...p,
                    historico: [
                        ...p.historico,
                        {
                            id: novoId("h"),
                            dataLabel: agoraLabel(),
                            responsavel: OPERADOR_ATUAL,
                            titulo: `${TIPO_OPERACAO_CURTO[tipo]} sem cobrança`,
                            descricao: "Sem valor a pagar: aplicada na hora, sem link e sem prazo.",
                            detalhes,
                            valor: 0,
                            estado: "concluido",
                            marco: "solicitada",
                            motivo,
                            ...daAlteracao({ id: solicitacaoId, tipo, linhasAfetadas }),
                        },
                    ],
                },
                semCobranca,
            ),
        );
        return solicitacaoId;
    }

    atualizarPedido(pedidoId, (p) =>
        comStatus({
            ...p,
            solicitacoes: [
                ...p.solicitacoes,
                {
                    id: solicitacaoId,
                    tipo,
                    resumo,
                    linhas: calculo.linhas,
                    total: calculo.total,
                    criadoEm: agora,
                    expiraEm: agora + PRAZO_DEMO_SEGUNDOS * 1000,
                    linkPagamento: novoLinkPagamento(p.id),
                    canalEnvio,
                    destinatarioEnvio,
                    detalhes,
                    linhasAfetadas,
                    estado: "aguardando",
                    aplicar,
                    reservas,
                    motivo,
                    operador: OPERADOR_ATUAL,
                },
            ],
            historico: [
                ...p.historico,
                {
                    id: novoId("h"),
                    dataLabel: agoraLabel(),
                    responsavel: OPERADOR_ATUAL,
                    titulo: `${TIPO_OPERACAO_CURTO[tipo]} solicitada`,
                    descricao: `Link enviado por ${canalLabel(canalEnvio)} para ${destinatarioEnvio}.`,
                    detalhes,
                    valor: calculo.total,
                    estado: "concluido",
                    marco: "solicitada",
                    motivo,
                    ...daAlteracao({ id: solicitacaoId, tipo, linhasAfetadas }),
                },
            ],
        }),
    );
    return solicitacaoId;
};

/** Reenvia o mesmo link (o prazo conta da criação, não reinicia), para o destino que o operador
 *  conferiu na hora. Sempre grava rastro no histórico. */
export const reenviarLink = (pedidoId: string, solicitacaoId: string, canal: CanalEnvio, destinatario: string) =>
    atualizarPedido(pedidoId, (p) => {
        const atual = p.solicitacoes.find((s) => s.id === solicitacaoId);
        if (!atual) return p;
        return comStatus({
            ...p,
            solicitacoes: p.solicitacoes.map((s) => (s.id === solicitacaoId ? { ...s, canalEnvio: canal, destinatarioEnvio: destinatario } : s)),
            historico: [
                ...p.historico,
                {
                    id: novoId("h"),
                    dataLabel: agoraLabel(),
                    responsavel: OPERADOR_ATUAL,
                    titulo: "Link reenviado",
                    descricao: `Por ${canalLabel(canal)} para ${destinatario}.`,
                    valor: atual.total,
                    estado: "concluido",
                    marco: "reenviada",
                    ...daAlteracao(atual),
                },
            ],
        });
    });

/** O último envio do link de uma alteração: canal, destino, quando e por quem. */
export const ultimoEnvio = (pedido: Pedido, solicitacaoId: string) =>
    [...pedido.historico].reverse().find((h) => h.solicitacaoId === solicitacaoId && (h.marco === "solicitada" || h.marco === "reenviada"));

/** Aplica o que a solicitação prometeu e tira ela da lista de operações abertas. */
const aplicarSolicitacao = (p: Pedido, solicitacao: Solicitacao): Pedido => {
    const { aplicar, tipo, resumo, total, detalhes } = solicitacao;
    const trocasPorLinha = new Map((aplicar.trocas ?? []).map((t) => [t.pedidoItemId, t.novoItemId]));
    const quando = agoraLabel();

    const itens = p.itens.map((linha) => {
        const destino = trocasPorLinha.get(linha.id);
        if (destino) {
            /* O valor pago passa a ser o que a pessoa de fato pagou pela unidade: o da compra mais a
               diferença paga agora. Antes virava o preço cheio do item novo, e uma segunda troca
               cobrava de novo uma diferença que já tinha sido paga (ou perdoada). */
            const precoNovo = getItem(destino)?.precoIntegral ?? linha.valorPago;
            return {
                ...linha,
                itemId: destino,
                valorPago: Math.max(linha.valorPago, precoNovo),
                respostas: aplicar.respostasPorItem?.[linha.id] ?? {},
            };
        }
        const novasRespostas = aplicar.respostasPorItem?.[linha.id];
        const novoTitular = aplicar.titularPorLinha?.[linha.id];
        if (!novasRespostas && !novoTitular) return linha;
        return {
            ...linha,
            titularId: novoTitular ?? linha.titularId,
            transferidoEmLabel: novoTitular ? dataLabel(new Date()) : linha.transferidoEmLabel,
            transferidoPor: novoTitular ? solicitacao.operador : linha.transferidoPor,
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
                responsavel: "Sistema",
                titulo: `${TIPO_OPERACAO_CURTO[tipo]} aplicada`,
                descricao: resumo,
                detalhes,
                valor: total,
                estado: "concluido",
                marco: "aplicada",
                ...daAlteracao(solicitacao),
            },
        ],
    });
};

/** Confere, no momento de aplicar, se as regras de negócio ainda valem: o estoque ou a
 *  segmentação podem ter mudado entre a criação da cobrança e o pagamento confirmado. */
const revalidarSolicitacao = (pedido: Pedido, solicitacao: Solicitacao): Bloqueio | null => {
    for (const troca of solicitacao.aplicar.trocas ?? []) {
        const linha = pedido.itens.find((l) => l.id === troca.pedidoItemId);
        const novoItem = getItem(troca.novoItemId);
        if (!linha || !novoItem) continue;
        const bloqueio = validarTrocaItem(pedido, linha, novoItem);
        if (bloqueio) return bloqueio;
    }
    const transferidas = pedido.itens.filter((l) => l.id in (solicitacao.aplicar.titularPorLinha ?? {}));
    for (const [linhaId, contaId] of Object.entries(solicitacao.aplicar.titularPorLinha ?? {})) {
        const linha = pedido.itens.find((l) => l.id === linhaId);
        const conta = getConta(contaId);
        if (!linha || !conta) continue;
        const bloqueio = validarNovoTitular(pedido, linha, conta, transferidas);
        if (bloqueio) return bloqueio;
    }
    return null;
};

/** Registra um pagamento que o operador confirmou por fora do link. É a ação mais arriscada da
 *  tela (não volta): exige referência e grava autor e referência no histórico. O
 *  processamento (revalidação e aplicação) acontece em seguida. */
export const registrarPagamento = (pedidoId: string, solicitacaoId: string, referenciaPagamento: string) => {
    atualizarPedido(pedidoId, (p) => {
        const atual = p.solicitacoes.find((s) => s.id === solicitacaoId);
        if (!atual) return p;
        return comStatus({
            ...p,
            solicitacoes: p.solicitacoes.map((s) => (s.id === solicitacaoId ? { ...s, estado: "processando", referenciaPagamento } : s)),
            historico: [
                ...p.historico,
                {
                    id: novoId("h"),
                    dataLabel: agoraLabel(),
                    responsavel: OPERADOR_ATUAL,
                    titulo: "Pagamento registrado manualmente",
                    descricao: `Referência informada: ${referenciaPagamento}.`,
                    valor: atual.total,
                    estado: "concluido",
                    marco: "paga",
                    ...daAlteracao(atual),
                },
            ],
        });
    });

    window.setTimeout(() => {
        const pedido = getPedido(pedidoId);
        const solicitacao = pedido?.solicitacoes.find((s) => s.id === solicitacaoId);
        if (!pedido || !solicitacao) return;

        const bloqueio = revalidarSolicitacao(pedido, solicitacao);
        if (bloqueio) {
            /* H-06, nas três EFs: pagamento confirmado com revalidação reprovada gera estorno
               integral automático e estado final REPROVADA. Nada muda no pedido, as reservas
               do destino são liberadas e a linha volta a aceitar operação. */
            liberarReservasDoDestino(solicitacao);
            atualizarPedido(pedidoId, (p) => {
                const atual = p.solicitacoes.find((s) => s.id === solicitacaoId);
                if (!atual) return p;
                return comStatus({
                    ...p,
                    baseStatus: statusBase(p),
                    solicitacoes: p.solicitacoes.map((s) => (s.id === solicitacaoId ? { ...s, estado: "reprovada", motivoFalha: bloqueio.descricao } : s)),
                    historico: [
                        ...p.historico,
                        {
                            id: novoId("h"),
                            dataLabel: agoraLabel(),
                            responsavel: "Sistema",
                            titulo: `${TIPO_OPERACAO_CURTO[atual.tipo]} reprovada após o pagamento`,
                            descricao: `${bloqueio.descricao} O valor pago foi estornado integralmente e nada mudou no pedido.`,
                            valor: atual.total,
                            estado: "concluido",
                            marco: "falha",
                            ...daAlteracao(atual),
                        },
                    ],
                });
            });
            return;
        }

        devolverEstoqueDasOrigens(pedido, solicitacao);

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
    entrada: { titulo: (s: Solicitacao) => string; descricao: string; responsavel: string; marco: MarcoHistorico; baseStatus?: StatusPedido },
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
                    valor: solicitacao.total,
                    estado: "expirado",
                    marco: entrada.marco,
                    ...daAlteracao(solicitacao),
                },
            ],
        }),
    );
};

/** Expira a solicitação, libera o estoque reservado e volta o pedido ao estado anterior. */
export const expirarSolicitacao = (pedidoId: string, solicitacaoId: string) =>
    encerrarSolicitacao(pedidoId, solicitacaoId, {
        titulo: (s) => `${TIPO_OPERACAO_CURTO[s.tipo]} expirou sem pagamento`,
        descricao: "O prazo do link terminou. Reserva liberada e nada foi cobrado.",
        responsavel: "Sistema",
        marco: "expirada",
        baseStatus: "expirado",
    });

/** Cancela manualmente a solicitação pendente, com a mesma reversão da expiração. */
export const cancelarSolicitacao = (pedidoId: string, solicitacaoId: string) =>
    encerrarSolicitacao(pedidoId, solicitacaoId, {
        titulo: (s) => `${TIPO_OPERACAO_CURTO[s.tipo]} cancelada`,
        descricao: "Cancelada antes do pagamento. Reserva liberada e nada foi cobrado.",
        responsavel: OPERADOR_ATUAL,
        marco: "cancelada",
    });

/** Volta o pedido de falha ou expirado para o estado operável. */
export const retomarPedido = (pedidoId: string) =>
    atualizarPedido(pedidoId, (p) => comStatus({ ...p, baseStatus: statusBase(p) }));

/* ------------------------------------------------------------------ */
/*  Rascunhos: operação em montagem, sem cobrança gerada ainda         */
/* ------------------------------------------------------------------ */

/** Rascunhos do pedido, do mais recente para o mais antigo. */
export const useRascunhos = (pedidoId: string) => {
    const todos = useSyncExternalStore(subscribe, () => estado.rascunhos);
    return todos.filter((r) => r.pedidoId === pedidoId).sort((a, b) => b.atualizadoEm - a.atualizadoEm);
};

export const getRascunho = (id: string) => estado.rascunhos.find((r) => r.id === id);

export const novoRascunhoId = () => novoId("rasc");

/** Grava (cria ou atualiza) um rascunho: ao avançar uma etapa e ao fechar o overlay. */
export const salvarRascunho = (rascunho: Omit<Rascunho, "atualizadoEm" | "atualizadoEmLabel">) =>
    setEstado((atual) => ({
        ...atual,
        rascunhos: [...atual.rascunhos.filter((r) => r.id !== rascunho.id), { ...rascunho, atualizadoEm: Date.now(), atualizadoEmLabel: agoraLabel() }],
    }));

/** Remove o rascunho: ao enviar a cobrança (ele vira Solicitacao) ou ao descartar deliberadamente. */
export const removerRascunho = (id: string) => setEstado((atual) => ({ ...atual, rascunhos: atual.rascunhos.filter((r) => r.id !== id) }));

/** Desfaz um descarte: devolve o rascunho exatamente como estava. */
export const restaurarRascunho = (rascunho: Rascunho) => setEstado((atual) => ({ ...atual, rascunhos: [...atual.rascunhos.filter((r) => r.id !== rascunho.id), rascunho] }));
