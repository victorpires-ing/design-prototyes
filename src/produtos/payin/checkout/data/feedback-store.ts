/* Store das respostas do teste de usabilidade do checkout Pix.
   Tenta a API remota (Redis via /api/checkout-feedback) e cai num fallback
   localStorage quando a API não está disponível (ex.: dev sem `vercel dev`). */

export type Pergunta = { texto: string; tipo: "texto" | "escala" };

export const PERGUNTAS: Pergunta[] = [
    { texto: "Olhando essa tela, o que dá pra fazer aqui?", tipo: "texto" },
    { texto: "O que chamou sua atenção primeiro?", tipo: "texto" },
    { texto: "Se fosse pagar agora, o que você faria?", tipo: "texto" },
    { texto: "Esse código que aparece na tela — o que você faria com ele?", tipo: "texto" },
    { texto: 'Tem um "Mostrar QR Code" na tela. Em que situação você usaria isso?', tipo: "texto" },
    { texto: "Pagando pelo celular, faz mais sentido copiar o código ou escanear o QR? Por quê?", tipo: "texto" },
    { texto: "Fora o Pix, quais outras formas de pagar você viu nessa tela?", tipo: "texto" },
    { texto: "De 0 a 10, quanta confiança essa tela te passa pra pagar? Sendo 0 nada confiável e 10 muito confiável.", tipo: "escala" },
    { texto: "Teve algo que gerou dúvida ou que você não entendeu?", tipo: "texto" },
];

export type RespostaFeedback = {
    id: string;
    criadoEm: string;
    respostas: string[];
};

const ENDPOINT = "/api/checkout-feedback";
const LS_KEY = "checkout-feedback:respostas";

function gerarId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function lerLocal(): RespostaFeedback[] {
    try {
        const raw = localStorage.getItem(LS_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

export async function salvarResposta(respostas: string[]): Promise<void> {
    const resposta: RespostaFeedback = { id: gerarId(), criadoEm: new Date().toISOString(), respostas };
    try {
        const r = await fetch(ENDPOINT, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "save", resposta }),
        });
        if (!r.ok) throw new Error(String(r.status));
    } catch {
        const arr = lerLocal();
        arr.push(resposta);
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(arr));
        } catch {
            /* ignore */
        }
    }
}

export async function listarRespostas(): Promise<RespostaFeedback[]> {
    try {
        const r = await fetch(ENDPOINT);
        if (!r.ok) throw new Error(String(r.status));
        const data = await r.json();
        if (Array.isArray(data)) return data as RespostaFeedback[];
        throw new Error("formato inesperado");
    } catch {
        return lerLocal();
    }
}
