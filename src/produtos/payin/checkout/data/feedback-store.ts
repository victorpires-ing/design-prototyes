/* Store das respostas do teste de usabilidade do checkout Pix.
   Tenta a API remota (Redis via /api/checkout-feedback) e cai num fallback
   localStorage quando a API não está disponível (ex.: dev sem `vercel dev`). */

export type Pergunta = { texto: string; tipo: "texto" | "escala" };

// Pergunta isolada, fora da numeração do formulário.
export const PERGUNTA_DISPOSITIVO = { texto: "Por onde você testou?", opcoes: ["Computador", "Celular"] };

export const PERGUNTAS: Pergunta[] = [
    { texto: "Ao entrar na tela de pagamentos como você se sentiu?", tipo: "texto" },
    { texto: "Na opção de pagamento com o PIX, quais informações e ações haviam disponíveis?", tipo: "texto" },
    { texto: "Se fosse pagar agora, o que você faria?", tipo: "texto" },
    { texto: "Em um cenário de compra como esse, por quê você usaria o PIX como meio de pagamento?", tipo: "texto" },
    { texto: "Se você NÃO quisesse pagar com PIX, o que faria?", tipo: "texto" },
    { texto: "Tem algo que você melhoraria nessa tela?", tipo: "texto" },
];

export type RespostaFeedback = {
    id: string;
    criadoEm: string;
    dispositivo: string;
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

export async function salvarResposta(dispositivo: string, respostas: string[]): Promise<void> {
    const resposta: RespostaFeedback = { id: gerarId(), criadoEm: new Date().toISOString(), dispositivo, respostas };
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

export async function apagarResposta(id: string): Promise<void> {
    try {
        const r = await fetch(ENDPOINT, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "delete", id }),
        });
        if (!r.ok) throw new Error(String(r.status));
    } catch {
        const arr = lerLocal().filter((x) => x.id !== id);
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
