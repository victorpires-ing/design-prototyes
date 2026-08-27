/* ------------------------------------------------------------------ */
/*  Dados da Bilheteria Online (protótipo).                            */
/* ------------------------------------------------------------------ */

/** Liga/desliga o estado vazio bloqueado ("configure itens antes de vender"). */
export const EVENTO_TEM_ITENS = true;

export const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/* ------------------------------ Catálogo ------------------------- */

export type ItemKind = "ingresso" | "produto" | "combo";

/** Forma de acesso/entrega do ingresso. Facial exige identificação do comprador. */
export type AcessoTipo = "qrcode" | "facial";

export const ACESSO_LABEL: Record<AcessoTipo, string> = {
    qrcode: "QR code",
    facial: "Facial",
};

export interface Componente {
    nome: string;
    tipo: string;
    data?: string;
}

export interface VendaItem {
    id: string;
    kind: ItemKind;
    nome: string;
    /** Lote (ingressos). */
    lote?: string;
    /** Tipo (Inteira, Meia, Unissex…). */
    tipo?: string;
    grupo?: string;
    descricao?: string;
    preco: number;
    imagem?: string;
    componentes?: Componente[];
    /** Forma de acesso do ingresso (facial exige identificação do comprador). */
    acesso?: AcessoTipo;
}

/** true quando o item só pode ser vendido com comprador identificado (ingresso facial). */
export const exigeIdentificacao = (item?: VendaItem) => item?.acesso === "facial";

export interface Sessao {
    id: string;
    data: string;
    itens: VendaItem[];
}

const DESC_PASSAPORTE = "Os ingressos de PASSAPORTE são válidos para SÁBADO e DOMINGO (08 e 09 de agosto). As vendas para sexta-feira ocorrem separadamente.";

export const SESSOES: Sessao[] = [
    {
        id: "s1",
        data: "08 de agosto às 14:00",
        itens: [
            { id: "i-passe-int", kind: "ingresso", grupo: "Passaporte", nome: "Passaporte", lote: "1º lote", tipo: "Inteira", descricao: DESC_PASSAPORTE, preco: 515.97, acesso: "facial" },
            { id: "i-passe-mei", kind: "ingresso", grupo: "Passaporte", nome: "Passaporte", lote: "1º lote", tipo: "Meia", descricao: DESC_PASSAPORTE, preco: 257.98, acesso: "facial" },
            { id: "i-pista-int", kind: "ingresso", grupo: "Pista", nome: "Pista", lote: "2º lote", tipo: "Inteira", preco: 180, acesso: "qrcode" },
            { id: "p-camiseta", kind: "produto", grupo: "Produtos oficiais", nome: "Camiseta do evento", tipo: "Unissex", preco: 89.9, imagem: "https://picsum.photos/seed/camiseta-evento/80" },
            { id: "p-copo", kind: "produto", grupo: "Produtos oficiais", nome: "Copo colecionável", tipo: "500ml", preco: 39.9, imagem: "https://picsum.photos/seed/copo-colecionavel/80" },
            {
                id: "c-familia",
                kind: "combo",
                grupo: "Combo Família",
                nome: "Combo Família",
                tipo: "4 ingressos",
                preco: 1899.9,
                acesso: "qrcode",
                componentes: [
                    { nome: "Passaporte", tipo: "Inteira", data: "08 ago, 14:00" },
                    { nome: "Passaporte", tipo: "Meia", data: "08 ago, 14:00" },
                    { nome: "Copo colecionável", tipo: "500ml" },
                ],
            },
        ],
    },
    {
        id: "s2",
        data: "09 de agosto às 14:30",
        itens: [
            { id: "i2-passe-int", kind: "ingresso", grupo: "Passaporte", nome: "Passaporte", lote: "1º lote", tipo: "Inteira", descricao: DESC_PASSAPORTE, preco: 515.97, acesso: "facial" },
            { id: "i2-pista-int", kind: "ingresso", grupo: "Pista", nome: "Pista", lote: "2º lote", tipo: "Inteira", preco: 180, acesso: "qrcode" },
        ],
    },
];

export const KIND_TABS: { id: ItemKind; label: string }[] = [
    { id: "ingresso", label: "Ingressos" },
    { id: "produto", label: "Produtos" },
    { id: "combo", label: "Combos" },
];

export const ITENS_POR_ID: Record<string, VendaItem> = Object.fromEntries(SESSOES.flatMap((s) => s.itens).map((i) => [i.id, i]));
export const SESSAO_DO_ITEM: Record<string, string> = Object.fromEntries(SESSOES.flatMap((s) => s.itens.map((i) => [i.id, s.data])));

/* ------------------------------ Comprador ------------------------ */

export interface Comprador {
    nome: string;
    email: string;
    /** E-mail/CPF mascarado quando encontrado por documento. */
    emailExibicao: string;
    cpf: string;
    iniciais: string;
}

/** Busca mockada de comprador por e-mail/CPF. Retorna null quando não encontra. */
export function buscarComprador(termo: string): Comprador | null {
    const t = termo.trim().toLowerCase();
    if (!t) return null;
    // "nenhuma conta" para e-mails contendo "nao" ou CPFs desconhecidos.
    if (t.includes("nao") || t.includes("none")) return null;
    const ehCpf = /^[\d.\-]+$/.test(t);
    if (ehCpf) {
        return { nome: "Mariana Costa Lima", email: "maria.costa@gmail.com", emailExibicao: "m****sta@gmail.com", cpf: "•••.•••.456-20", iniciais: "MC" };
    }
    return { nome: "João Silva", email: t, emailExibicao: t, cpf: "•••.•••.123-10", iniciais: "JS" };
}
