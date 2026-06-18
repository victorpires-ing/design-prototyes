import {
    COMBOS_DINAMICOS,
    COMBOS_FIXOS,
    CUPONS,
    DATAS,
    EXIBIR_PADRAO,
    INGRESSOS,
    PERGUNTAS,
    PRODUTOS,
    type ComboDinamico,
    type ComboFixo,
    type Cupom,
    type DataEvento,
    type Exibir,
    type Ingresso,
    type PerguntaEvento,
    type Produto,
} from "./combos";

/* ------------------------------------------------------------------ */
/*  Configuração do evento (serializável na URL via ?cfg=)            */
/* ------------------------------------------------------------------ */

export interface EventConfig {
    nome: string;
    logo: string;
    capa: string;
    mapa: string;
    termos: string;
    selo: string;
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
            exibir: { datas: true, combosFixos: true, combosDinamicos: true, ...(obj.exibir ?? {}) },
            ingressos: Array.isArray(obj.ingressos) ? obj.ingressos : [],
            produtos: Array.isArray(obj.produtos) ? obj.produtos : [],
            datas: Array.isArray(obj.datas) ? obj.datas : [],
            combosFixos: Array.isArray(obj.combosFixos) ? obj.combosFixos : [],
            combosDinamicos: Array.isArray(obj.combosDinamicos) ? obj.combosDinamicos.map((c) => ({ ...c, precoVisivel: Array.isArray(c.precoVisivel) ? c.precoVisivel : [] })) : [],
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
