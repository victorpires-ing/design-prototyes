/* ------------------------------------------------------------------ */
/*  Modelo único da plataforma Ingresse (gêmeo para protótipo)         */
/*                                                                     */
/*  Backstage, site, link de compra, checkout e carteiras leem e       */
/*  gravam estes tipos no mesmo banco (src/plataforma/db). Cada        */
/*  produto pode ter o próprio tipo de tela, mas converte a partir     */
/*  daqui num adaptador dentro do produto.                             */
/* ------------------------------------------------------------------ */

export type EventoStatus = "rascunho" | "privado" | "publicado" | "encerrado";

/** Hierarquia de venda: sessão > grupo (setor) > ingresso > lote. */
export interface Lote {
    id: string;
    nome: string;
    /** Preço de face em reais. */
    preco: number;
    /** Quantidade ofertada neste lote. Vendidos são derivados dos ingressos emitidos. */
    quantidade: number;
    /** Pausado pelo produtor: não vende e o próximo lote não abre por causa dele. */
    pausado?: boolean;
    /** ISO local: o lote para de vender nesta data, mesmo com saldo. */
    dataLimite?: string;
    /** Códigos de chave de acesso (Marketing) que liberam este lote. */
    chaves?: string[];
}

/** Onde um item pode ser vendido. */
export type CanalVenda = "site" | "link" | "app" | "bilheteria";

/** Quem pode comprar: qualquer pessoa ou só quem tem uma chave de acesso. */
export type PublicoVenda = "todos" | "chave";

/** Quando, onde e para quem um item vende. Tudo opcional: sem regra, vende enquanto estiver ativo. */
export interface RegrasDeVenda {
    /** ISO local de início das vendas. Vazio: começa quando o evento for publicado ou ficar privado. */
    inicio?: string;
    /** ISO local de fim das vendas. Vazio: até o início do evento. */
    fim?: string;
    /** Vazio ou ausente: todos os canais. */
    canais?: CanalVenda[];
    publico?: PublicoVenda;
    /** Máximo deste item por pedido. `null` ou ausente: sem limite. */
    limitePorPedido?: number | null;
    /** Mínimo deste item por pedido. Ausente: 1. */
    minimoPorPedido?: number;
}

/** Transferência do ingresso para outra pessoa. */
export type Transferencia = "sempre" | "nunca" | "compra";
/** Quem pode portar o ingresso. Com dependentes, a transferência vira "nunca". */
export type Portador = "usuario" | "dependentes";
/** Quem paga as taxas de venda. */
export type PagadorDeTaxas = "comprador" | "organizacao";
/** O que o item vendido é: ingresso, check-in ou pacote. */
export type ItemVendido = "ingresso" | "checkin" | "pacote";
/** Como as pessoas entram no setor. */
export type TipoAcesso = "qr" | "facial";

export type Beneficio = "inteira" | "meia-entrada";

export interface TipoIngresso {
    id: string;
    nome: string;
    descricao?: string;
    beneficio?: Beneficio;
    /** Desligado no Backstage: não aparece para venda. */
    ativo: boolean;
    lotes: Lote[];
    vendas?: RegrasDeVenda;
    /** `false`: não aparece na página do evento; vende só pelo link direto ou com chave. Padrão: visível. */
    visivel?: boolean;
    /** Antigo: as perguntas agora ficam em `Evento.perguntas`, com os itens em cada uma. */
    perguntas?: string[];
    /** Padrão: "ingresso". */
    itemVendido?: ItemVendido;
    /** Padrão: "sempre". Portador com dependentes força "nunca"; segmentação força "compra". */
    transferencia?: Transferencia;
    portador?: Portador;
    /** Ids de ingressos: só compra quem adquirir um deles. */
    vendaVinculada?: string[];
    /** Ids das segmentações de Público da organização que podem comprar. */
    segmentos?: string[];
    /** Padrão: "comprador". */
    taxas?: PagadorDeTaxas;
    /** Códigos de chave de acesso (Marketing) que liberam o ingresso inteiro. */
    chaves?: string[];
}

export interface Grupo {
    id: string;
    nome: string;
    /** Portão ou acesso exibido no ingresso. */
    acesso?: string;
    /** Lotação do setor. A soma dos lotes dos ingressos do setor é conferida contra ela. */
    capacidade?: number;
    /** Como as pessoas entram: código QR ou reconhecimento facial. */
    tipoAcesso?: TipoAcesso;
    ingressos: TipoIngresso[];
}

/** Produto da biblioteca da organização: reaproveitado entre eventos. */
export interface ProdutoDaOrganizacao {
    id: string;
    nome: string;
    descricao?: string;
    /** URL ou caminho da imagem. */
    imagem?: string;
    /** Preço sugerido; cada evento pode vender por outro. */
    precoBase: number;
    /** Regras de venda do produto (quantidade por pedido), iguais em todos os eventos. */
    vendas?: RegrasDeVenda;
    criadoEm: string;
}

/** Produto vendido num evento: escolhido da biblioteca, com preço e estoque do evento. */
export interface ProdutoNoEvento {
    produtoId: string;
    /** Preço no evento. Ausente: usa o preço base da organização. */
    preco?: number;
    estoque: number;
    ativo: boolean;
    /** Ausente: sempre permitir. */
    transferencia?: Transferencia;
    /** Antigo: as regras agora são do produto na organização. Não é mais lido nem editado. */
    vendas?: RegrasDeVenda;
    visivel?: boolean;
}

/** Um item dentro de um combo, com a quantidade. */
export interface ItemDoCombo {
    tipo: "ingresso" | "produto";
    /** Id do tipo de ingresso ou do produto da organização. */
    id: string;
    quantidade: number;
}

/** Pacote de itens já existentes do evento, vendidos juntos pelo preço do combo. */
export interface Combo {
    id: string;
    nome: string;
    descricao?: string;
    preco: number;
    itens: ItemDoCombo[];
    /** Limite próprio de combos à venda. `null` ou ausente: só o estoque dos itens limita. */
    limite?: number | null;
    ativo: boolean;
    vendas?: RegrasDeVenda;
    visivel?: boolean;
}

export interface Sessao {
    id: string;
    /** ISO local, sem fuso (ex.: 2026-10-03T22:00). */
    inicio: string;
    grupos: Grupo[];
}

/** Dados só de vitrine (site). Opcionais: o site completa com padrões. */
export interface Vitrine {
    artista?: string;
    categoria?: string;
    tags?: string[];
    descricao?: string[];
    /** A mesma descrição em rich text (HTML do editor do DS), escrita na criação do evento. `descricao` segue em texto puro para quem só lê parágrafos. */
    descricaoHtml?: string;
}

/** Tipo escolhido ao criar o evento. Muda os campos e o vocabulário (esportivo: inscrição, largada). */
export type TipoEvento = "futebol" | "show" | "esportivo";
export type Modalidade = "corrida" | "natacao" | "trilha" | "ciclismo";
export type CategoriaLimite = "inteira" | "meia-entrada" | "gratuidade" | "convidado" | "socio-torcedor" | "ingresso" | "combo" | "produto";

/** Limite de compra por usuário. `null` = ilimitado. Categoria sem valor segue só o geral. */
export interface LimitesPorUsuario {
    geral: number | null;
    porCategoria: Partial<Record<CategoriaLimite, number | null>>;
}

/** Jogo de futebol. Os ids vêm das listas do back-end (campeonatos, times, programas). */
export interface Partida {
    campeonatoId?: string;
    mandanteId: string;
    visitanteId: string;
    programaMembrosId?: string;
}

export type MapaDoEvento = { tipo: "imagem"; url?: string } | { tipo: "assentos"; mapaId: string };

export interface ConfiguracoesAvancadas {
    /** Um pedido pode ter ingressos de grupos diferentes. */
    comprasEntreGrupos: boolean;
    /** Estoque devolvido de lote esgotado (pedido não pago): volta ao lote de origem ou soma ao lote ativo. */
    estoqueDevolvido: "lote-origem" | "lote-ativo";
    trocaDeSetor: boolean;
    reservaNaCompra: boolean;
    limiteBilheteriaOnline: "sem-limite" | "aplicar";
    politicaId?: string;
    acessoFacialId?: string;
    qrCodeNoEmail: boolean;
}

/** Conta da produtora no Backstage. Cada evento pertence a uma. */
export interface Organizacao {
    id: string;
    nome: string;
    /** Até 2 letras, mostradas no avatar. */
    sigla: string;
    criadoEm: string;
    /** Biblioteca de produtos. Ausente: a organização ainda não salvou a sua (usa a inicial). */
    produtos?: ProdutoDaOrganizacao[];
    /** Ajustes: ingressos dos eventos podem ser atribuídos direto a um CPF ou passaporte, sem conta (ORG-43). */
    atribuicaoADocumentos?: boolean;
}

/** Item vendido numa abertura: ingresso, produto do evento ou combo. */
/** Só o que foi marcado: ingresso criado depois num setor não entra sozinho (decisão Victor, 08/11/2026). */
export interface ItemDaAbertura {
    tipo: "ingresso" | "produto" | "combo";
    id: string;
}

/** Uma linha da abertura: para quem, quais itens e onde. */
/** Formato antigo (até 08/11/2026): público, itens e canais por configuração. Só para ler dados salvos. */
export interface ConfiguracaoDeAbertura {
    id: string;
    publico: string[];
    itens: ItemDaAbertura[];
    canais: CanalVenda[];
}

/** Quando os itens vendem: nome, início, fim e os ingressos, produtos e combos incluídos. */
export interface AberturaDeVendas {
    id: string;
    /** Aparece para o comprador. */
    nome: string;
    /** "AAAA-MM-DDTHH:mm", hora local do evento. */
    inicio: string;
    fim: string;
    itens?: ItemDaAbertura[];
    /** Antigo: lido por `itensDaAbertura` e apagado na próxima gravação. */
    configuracoes?: ConfiguracaoDeAbertura[];
}

/** Tipos de resposta do questionário (QST). */
export type TipoDePergunta = "texto-curto" | "texto-longo" | "opcao-unica" | "multipla" | "numero" | "telefone" | "anexo";

export interface OpcaoDaPergunta {
    id: string;
    rotulo: string;
    /** Quantas pessoas podem escolher. Ausente: sem limite. 0: esgotada. */
    estoque?: number;
}

/** Item que recebe a pergunta: só o que foi marcado; ingresso criado depois não entra sozinho. */
export interface ItemDaPergunta {
    tipo: "ingresso" | "combo";
    id: string;
}

/**
 * Pergunta do questionário do evento. Respondida por ingresso ou combo comprado, na compra e na
 * transferência. Quais podem mudar na Carteira, e quando, fica em `Evento.edicaoNaCarteira`.
 */
export interface Pergunta {
    id: string;
    titulo: string;
    tipo: TipoDePergunta;
    obrigatoria: boolean;
    /** Só em "opcao-unica" e "multipla". */
    opcoes?: OpcaoDaPergunta[];
    itens: ItemDaPergunta[];
}

/** Edição das respostas na Carteira: geral do evento, com janela e perguntas escolhidas. */
export interface EdicaoNaCarteira {
    /** "AAAA-MM-DDTHH:mm", hora local do evento. */
    inicio: string;
    fim: string;
    /** Ids das perguntas que podem mudar. */
    perguntas: string[];
}

export interface Evento {
    id: string;
    /** Usado no link de compra: /e/<slug>. */
    slug: string;
    nome: string;
    /** Nome da organização, congelado para vitrine e listagens. */
    produtora: string;
    /** Organização dona do evento. Eventos antigos sem o campo usam `organizacaoDoEvento()`. */
    organizacaoId?: string;
    status: EventoStatus;
    capa?: string;
    local: string;
    cidade?: string;
    /** Início da primeira sessão (ISO local). Duplicado aqui para listagens. */
    data: string;
    sessoes: Sessao[];
    /** Produtos da organização escolhidos para este evento. */
    produtos?: ProdutoNoEvento[];
    combos?: Combo[];
    aberturas?: AberturaDeVendas[];
    /** Questionário do evento, na ordem em que aparece para quem compra. */
    perguntas?: Pergunta[];
    /** `null` ou ausente: desligada. */
    edicaoNaCarteira?: EdicaoNaCarteira | null;
    /** Alíquota da taxa de serviço sobre o preço de face (0.1 = 10%). */
    taxaServico: number;
    /* Campos da criação por tipo. Opcionais: eventos antigos e da seed não têm. */
    tipo?: TipoEvento;
    modalidade?: Modalidade;
    /** Categoria do show ou festa (id da lista da criação). */
    categoria?: string;
    /** Fim do evento (ISO local). */
    fim?: string;
    /** Código ISO da moeda (ex.: BRL). */
    moeda?: string;
    limites?: LimitesPorUsuario;
    /** Idade mínima em anos; 0 = livre. */
    idadeMinima?: number;
    mapa?: MapaDoEvento;
    partida?: Partida;
    avancado?: ConfiguracoesAvancadas;
    vitrine?: Vitrine;
    criadoEm: string;
    atualizadoEm: string;
}

export interface Usuario {
    id: string;
    nome: string;
    email: string;
}

/** saldo: a produtora paga a taxa pelo saldo dela e o comprador não paga (bilheteria). */
export type MetodoPagamento = "pix" | "credito" | "debito" | "dinheiro" | "saldo" | "cortesia";
export type PedidoStatus = "aguardando-pagamento" | "pago" | "cancelado";
export type Canal = "site" | "link" | "app" | "bilheteria" | "cortesia";

/** Uma linha do carrinho. Ingresso aponta para o catálogo; produto só tem nome. */
export interface ItemPedido {
    tipo: "ingresso" | "produto";
    nome: string;
    detalhe?: string;
    sessaoId?: string;
    grupoId?: string;
    ingressoId?: string;
    loteId?: string;
    quantidade: number;
    face: number;
    taxa: number;
}

/** Para quem vai cada ingresso do pedido. */
export interface Atribuicao {
    /** Índice da linha em `itens`. */
    item: number;
    nome: string;
    email: string;
}

export interface Pedido {
    id: string;
    eventoId: string;
    comprador: Usuario;
    canal: Canal;
    itens: ItemPedido[];
    atribuicoes: Atribuicao[];
    subtotal: number;
    taxas: number;
    total: number;
    status: PedidoStatus;
    pagamento?: { metodo: MetodoPagamento; parcelas?: number; pagoEm: string };
    /** Cobranças do checkout que não são do catálogo (proteção de compra, juros do parcelamento). */
    adicionais?: { protecao: number; juros: number };
    /** Envio feito pelo Backstage (cortesias): agrupa os pedidos de vários destinatários. */
    envio?: { id: string; nome: string; emissor: string };
    criadoEm: string;
    atualizadoEm: string;
}

export type IngressoEmitidoStatus = "valido" | "transferido" | "utilizado" | "cancelado";

/** Ingresso que existe na carteira de alguém. */
export interface IngressoEmitido {
    id: string;
    pedidoId: string;
    eventoId: string;
    sessaoId: string;
    grupoId: string;
    ingressoId: string;
    loteId: string;
    /** Rótulos congelados na emissão: o catálogo pode mudar depois. */
    rotulo: { evento: string; grupo: string; ingresso: string; lote: string; acesso?: string };
    titular: { nome: string; email: string };
    codigo: string;
    status: IngressoEmitidoStatus;
    emitidoEm: string;
    atualizadoEm: string;
}

/** Canal de venda como o Backstage agrupa nas métricas. */
export type CanalMetrica = "online" | "bilheteria" | "cortesia";

/**
 * Vendas anteriores ao gêmeo, consolidadas por evento (um documento por evento, id = eventoId).
 * Dá aos eventos da seed um passado de vendas sem gravar milhares de pedidos. Entra no estoque
 * (vendidos por lote) e nas métricas do Backstage junto com os pedidos reais.
 */
export interface HistoricoVendas {
    id: string;
    eventoId: string;
    /** Meta de faturamento definida pela produtora (R$). */
    meta: number;
    /** Ingressos vendidos por lote. Soma com os emitidos no estoque. */
    porLote: Record<string, number>;
    /** Parte de porLote vendida por canal. */
    porCanal: Record<CanalMetrica, number>;
    pagamentos: { tipo: string; qtd: number }[];
    /**
     * Uma linha por dia: [ingressos, produtos, faturamento]. A última linha é ontem: o histórico
     * acompanha o relógio para o protótipo não envelhecer.
     */
    serie: [number, number, number][];
}

/** Coleções do banco e o tipo de cada uma. */
export interface Colecoes {
    eventos: Evento;
    pedidos: Pedido;
    ingressos: IngressoEmitido;
    usuarios: Usuario;
    historico: HistoricoVendas;
    organizacoes: Organizacao;
}

export type NomeColecao = keyof Colecoes;
export const COLECOES: NomeColecao[] = ["eventos", "pedidos", "ingressos", "usuarios", "historico", "organizacoes"];
