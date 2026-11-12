import type { CategoriaLimite, ConfiguracoesAvancadas } from "@/plataforma";

/**
 * Padrão das configurações avançadas do evento (EVT-59). Gravado na criação; a criação só deixa
 * escolher a política (EVT-84). O resto se ajusta em Itens › Configurações de ingressos
 * (itens/rules.md ITM-66), que também usa este padrão para eventos antigos sem o campo.
 */
export const AVANCADO_PADRAO: ConfiguracoesAvancadas = {
    comprasEntreGrupos: true,
    estoqueDevolvido: "lote-origem",
    trocaDeSetor: false,
    reservaNaCompra: false,
    limiteBilheteriaOnline: "sem-limite",
    politicaId: "politica-padrao",
    acessoFacialId: "nenhum",
    qrCodeNoEmail: true,
};

/** Categorias com limite de compra por pessoa (EVT-57, ITM-67). `esportivo`: rótulo no evento esportivo. */
export const CATEGORIAS_DE_LIMITE: { id: CategoriaLimite; label: string; esportivo?: string }[] = [
    { id: "inteira", label: "Inteira" },
    { id: "meia-entrada", label: "Meia-entrada" },
    { id: "gratuidade", label: "Gratuidade" },
    { id: "convidado", label: "Convidado" },
    { id: "socio-torcedor", label: "Sócio torcedor" },
    { id: "ingresso", label: "Ingresso", esportivo: "Inscrição" },
    { id: "combo", label: "Combo" },
    { id: "produto", label: "Produto" },
];
