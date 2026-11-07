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
}

export type Beneficio = "inteira" | "meia-entrada";

export interface TipoIngresso {
    id: string;
    nome: string;
    descricao?: string;
    beneficio?: Beneficio;
    /** Desligado no Backstage: não aparece para venda. */
    ativo: boolean;
    lotes: Lote[];
}

export interface Grupo {
    id: string;
    nome: string;
    /** Portão ou acesso exibido no ingresso. */
    acesso?: string;
    ingressos: TipoIngresso[];
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
}

export interface Evento {
    id: string;
    /** Usado no link de compra: /e/<slug>. */
    slug: string;
    nome: string;
    produtora: string;
    status: EventoStatus;
    capa?: string;
    local: string;
    cidade?: string;
    /** Início da primeira sessão (ISO local). Duplicado aqui para listagens. */
    data: string;
    sessoes: Sessao[];
    /** Alíquota da taxa de serviço sobre o preço de face (0.1 = 10%). */
    taxaServico: number;
    vitrine?: Vitrine;
    criadoEm: string;
    atualizadoEm: string;
}

export interface Usuario {
    id: string;
    nome: string;
    email: string;
}

export type MetodoPagamento = "pix" | "credito" | "debito";
export type PedidoStatus = "aguardando-pagamento" | "pago" | "cancelado";
export type Canal = "site" | "link" | "app" | "bilheteria";

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

/** Coleções do banco e o tipo de cada uma. */
export interface Colecoes {
    eventos: Evento;
    pedidos: Pedido;
    ingressos: IngressoEmitido;
    usuarios: Usuario;
}

export type NomeColecao = keyof Colecoes;
export const COLECOES: NomeColecao[] = ["eventos", "pedidos", "ingressos", "usuarios"];
