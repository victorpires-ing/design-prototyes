import {
    COMBOS_DINAMICOS,
    COMBOS_FIXOS,
    CUPONS,
    DATAS,
    EXIBIR_PADRAO,
    INGRESSOS,
    PERGUNTAS,
    PRODUTOS,
    QUANTITATIVO_PADRAO,
    TAXA_PADRAO,
    TAXA_PRODUTO_PADRAO,
    type ComboDinamico,
    type ComboFixo,
    type Cupom,
    type DataEvento,
    type Exibir,
    type Ingresso,
    type PerguntaEvento,
    type Produto,
    type Quantitativo,
    type TaxaProduto,
    type TaxaServico,
} from "./combos";

/* ------------------------------------------------------------------ */
/*  Configuração do evento (serializável na URL via ?cfg=)            */
/* ------------------------------------------------------------------ */

/**
 * Chave do rascunho local, compartilhada por Config, seleção e sucesso.
 * v3: passa a carregar taxa de serviço e quantitativo por grupo. Vive aqui
 * porque editor e leitores precisam concordar: divergir quebra o handoff.
 */
export const STORAGE_KEY = "marketplace:lastConfig:v3";

export interface EventConfig {
    nome: string;
    logo: string;
    capa: string;
    mapa: string;
    termos: string;
    selo: string;
    comboTabLabel: string;
    /** Cor de destaque do evento (botões primários e links). Hex; vazio = cor padrão. */
    corDestaque?: string;
    /** Exibe o botão de voltar (para as configurações) na tela de seleção. */
    exibirVoltar?: boolean;
    /** Como o formulário de perguntas é exibido na atribuição: modal (padrão) ou accordion inline. */
    modoAtribuicao?: "modal" | "accordion";
    /**
     * Art. 1º §2º: o Decreto 13.108/2026 não alcança evento esportivo, regido
     * pela Lei 14.597/2023. O protótipo aplica o regime do decreto nos dois
     * casos e usa este campo só para sinalizar a diferença no editor.
     */
    categoria?: "cultural" | "esportivo";
    /** Taxa acessória única do evento (art. 3º V, 6º e 9º). */
    taxaServico: TaxaServico;
    /** Cobrança acessória do produto: outra alíquota e outro nome. */
    taxaProduto?: TaxaProduto;
    /** Art. 11: quantitativo ofertado por nome de grupo de ingresso. */
    quantitativoPorGrupo?: Record<string, Quantitativo>;
    /** Art. 11 p.ú.: divulgado até 30 dias após o evento. Null enquanto não houver. */
    percentualMeiaVendido?: number | null;
    exibir: Exibir;
    ingressos: Ingresso[];
    produtos: Produto[];
    datas: DataEvento[];
    combosFixos: ComboFixo[];
    combosDinamicos: ComboDinamico[];
    perguntas: PerguntaEvento[];
    cupons: Cupom[];
}

/** Config padrão usada quando a URL não traz ?cfg=. */
export const DEFAULT_CONFIG: EventConfig = {
    nome: "[Teste] - Victor",
    logo: "",
    capa: "",
    mapa: "",
    termos:
        "Ticket Sports by Ingresse é plataforma de vendas dos ingressos / inscrições on-line. Não temos responsabilidade e poder sobre organização e ocorrências relativas a este evento.\n\nDeclaro que:\n\n1. Estarei presente neste evento por minha livre e espontânea vontade, isentando de quaisquer responsabilidades os ORGANIZADORES e as empresas envolvidas, em meu nome e de meus herdeiros;\n\n2. Estou em plenas condições físicas e de saúde para participar do evento.",
    selo: "Rascunho",
    comboTabLabel: "Combo dinâmico",
    corDestaque: "",
    exibirVoltar: true,
    modoAtribuicao: "modal",
    categoria: "cultural",
    taxaServico: TAXA_PADRAO,
    taxaProduto: TAXA_PRODUTO_PADRAO,
    quantitativoPorGrupo: QUANTITATIVO_PADRAO,
    percentualMeiaVendido: null,
    exibir: EXIBIR_PADRAO,
    ingressos: INGRESSOS,
    produtos: PRODUTOS,
    datas: DATAS,
    combosFixos: COMBOS_FIXOS,
    combosDinamicos: COMBOS_DINAMICOS,
    perguntas: PERGUNTAS,
    cupons: CUPONS,
};

/* ------------------------------------------------------------------ */
/*  Serialização (JSON → base64 unicode-safe)                         */
/* ------------------------------------------------------------------ */

function toBase64(str: string): string {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin);
}

function fromBase64(b64: string): string {
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

export function encodeConfig(cfg: EventConfig): string {
    return toBase64(JSON.stringify(cfg));
}

export function decodeConfig(param: string): EventConfig | null {
    try {
        const obj = JSON.parse(fromBase64(param)) as Partial<EventConfig>;
        if (!obj || typeof obj.nome !== "string") return null;
        return {
            nome: obj.nome,
            logo: obj.logo ?? "",
            capa: obj.capa ?? "",
            mapa: obj.mapa ?? "",
            termos: obj.termos ?? "",
            selo: obj.selo ?? "",
            comboTabLabel: obj.comboTabLabel ?? "Combo dinâmico",
            corDestaque: obj.corDestaque ?? "",
            exibirVoltar: obj.exibirVoltar ?? true,
            modoAtribuicao: obj.modoAtribuicao === "accordion" ? "accordion" : "modal",
            categoria: obj.categoria === "esportivo" ? "esportivo" : "cultural",
            // Link ?cfg= antigo não tem taxa. Assumir zero renderiria o estado que
            // o próprio desenho declara irregular, então o default é a taxa padrão:
            // links já compartilhados passam a exibir 20%.
            taxaServico: {
                nome: obj.taxaServico?.nome || TAXA_PADRAO.nome,
                aliquota: typeof obj.taxaServico?.aliquota === "number" ? Math.max(0, obj.taxaServico.aliquota) : TAXA_PADRAO.aliquota,
                descricao: obj.taxaServico?.descricao || TAXA_PADRAO.descricao,
                criteriosUrl: obj.taxaServico?.criteriosUrl || undefined,
            },
            taxaProduto: {
                nome: obj.taxaProduto?.nome || TAXA_PRODUTO_PADRAO.nome,
                aliquota: typeof obj.taxaProduto?.aliquota === "number" ? Math.max(0, obj.taxaProduto.aliquota) : TAXA_PRODUTO_PADRAO.aliquota,
                modo: obj.taxaProduto?.modo === "embutida" ? "embutida" : TAXA_PRODUTO_PADRAO.modo,
                descricao: obj.taxaProduto?.descricao || TAXA_PRODUTO_PADRAO.descricao,
            },
            quantitativoPorGrupo: obj.quantitativoPorGrupo && typeof obj.quantitativoPorGrupo === "object" ? obj.quantitativoPorGrupo : {},
            percentualMeiaVendido: typeof obj.percentualMeiaVendido === "number" ? obj.percentualMeiaVendido : null,
            exibir: { datas: true, combosFixos: true, combosDinamicos: true, ...(obj.exibir ?? {}) },
            ingressos: Array.isArray(obj.ingressos) ? obj.ingressos : [],
            produtos: Array.isArray(obj.produtos) ? obj.produtos : [],
            datas: Array.isArray(obj.datas) ? obj.datas : [],
            combosFixos: Array.isArray(obj.combosFixos) ? obj.combosFixos : [],
            combosDinamicos: Array.isArray(obj.combosDinamicos)
                ? obj.combosDinamicos.map((c) => ({
                      ...c,
                      precoVisivel: Array.isArray(c.precoVisivel) ? c.precoVisivel : [],
                      ocultos: Array.isArray(c.ocultos) ? c.ocultos : [],
                      quantidades: c.quantidades && typeof c.quantidades === "object" ? c.quantidades : {},
                  }))
                : [],
            perguntas: Array.isArray(obj.perguntas) ? obj.perguntas : [],
            cupons: Array.isArray(obj.cupons) ? obj.cupons : [],
        };
    } catch {
        return null;
    }
}

export function buildShareUrl(cfg: EventConfig): string {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/marketplace/event?cfg=${encodeURIComponent(encodeConfig(cfg))}`;
}

/**
 * Cria um link curto (id derivado do hash do conteúdo) via /api/links e Redis.
 * Idempotente: o mesmo config retorna o mesmo id. Cai no link longo (?cfg=) se a API falhar.
 */
export async function buildShortShareUrl(cfg: EventConfig): Promise<string> {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    try {
        const data = encodeConfig(cfg);
        const res = await fetch("/api/links", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ data }),
        });
        if (!res.ok) throw new Error("falha ao criar link");
        const { id } = (await res.json()) as { id: string };
        return `${base}/marketplace/event?e=${id}`;
    } catch {
        return buildShareUrl(cfg);
    }
}

/** Resolve um link curto (?e=<id>) buscando o cfg no Redis. */
export async function resolverLinkCurto(id: string): Promise<EventConfig | null> {
    try {
        const res = await fetch(`/api/links?id=${encodeURIComponent(id)}`);
        if (!res.ok) return null;
        const { data } = (await res.json()) as { data?: string };
        return data ? decodeConfig(data) : null;
    } catch {
        return null;
    }
}
