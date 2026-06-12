/**
 * Detecção de perguntas semelhantes via embeddings (Transformers.js).
 * Carrega o modelo sob demanda (import dinâmico) e mantém cache de vetores.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipePromise: Promise<any> | null = null;
const cache = new Map<string, number[]>();

async function getExtractor() {
    if (!pipePromise) {
        pipePromise = (async () => {
            const { pipeline, env } = await import("@xenova/transformers");
            // Usa os modelos hospedados no hub (sem arquivos locais).
            env.allowLocalModels = false;
            // Modelo multilíngue (entende semântica em PT, não só sobreposição de palavras).
            return pipeline("feature-extraction", "Xenova/paraphrase-multilingual-MiniLM-L12-v2");
        })();
    }
    return pipePromise;
}

async function embed(text: string): Promise<number[]> {
    const key = text.trim().toLowerCase();
    const cached = cache.get(key);
    if (cached) return cached;
    const extractor = await getExtractor();
    const out = await extractor(text, { pooling: "mean", normalize: true });
    const vec = Array.from(out.data as Float32Array);
    cache.set(key, vec);
    return vec;
}

/** Vetores normalizados → produto escalar = similaridade de cosseno. */
function cosine(a: number[], b: number[]) {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += a[i] * b[i];
    return s;
}

export interface Semelhante {
    id: string;
    titulo: string;
    score: number;
}

/** Retorna a pergunta existente mais parecida com `texto`, se passar do limiar. */
export async function perguntaSemelhante(
    texto: string,
    candidatos: { id: string; titulo: string }[],
    threshold = 0.75,
): Promise<Semelhante | null> {
    const t = texto.trim();
    if (t.length < 4 || candidatos.length === 0) return null;

    const tv = await embed(t);
    let best: Semelhante | null = null;
    for (const c of candidatos) {
        const score = cosine(tv, await embed(c.titulo));
        if (!best || score > best.score) best = { id: c.id, titulo: c.titulo, score };
    }
    return best && best.score >= threshold ? best : null;
}
