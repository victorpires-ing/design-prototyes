/**
 * Checkout feedback API — Vercel Edge Function backed by Upstash Redis.
 *
 * Reaproveita a MESMA store Redis do resto do projeto (namespace próprio).
 * Guarda as respostas do teste de usabilidade do checkout Pix: uma chave por
 * resposta + um índice (set) com os ids (escrita isolada, sem sobrescrever).
 *
 * Local dev: `vercel env pull .env.local` + `vercel dev`. Sem isso, o store
 * cliente cai no fallback localStorage.
 */

import { Redis } from "@upstash/redis";

export const config = { runtime: "edge" };

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? "",
});

const respostaKey = (id: string) => `design-prototyes:checkout-feedback:v1:resposta:${id}`;
const idsKey = "design-prototyes:checkout-feedback:v1:ids";

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}

async function listRespostas(): Promise<unknown[]> {
    const ids = (await redis.smembers(idsKey)) as string[];
    if (!ids.length) return [];
    const vals = (await redis.mget<unknown[]>(...ids.map(respostaKey))) ?? [];
    return (vals as unknown[]).filter(Boolean);
}

export default async function handler(req: Request): Promise<Response> {
    try {
        if (req.method === "GET") {
            return json(await listRespostas());
        }

        if (req.method !== "POST") {
            return new Response("Method not allowed", { status: 405 });
        }

        const body = (await req.json()) as Record<string, unknown>;
        if (body.action === "save") {
            const resposta = body.resposta as { id: string };
            await redis.set(respostaKey(resposta.id), resposta);
            await redis.sadd(idsKey, resposta.id);
            return json(resposta, 201);
        }

        if (body.action === "delete") {
            const id = body.id as string;
            await redis.del(respostaKey(id));
            await redis.srem(idsKey, id);
            return json({ ok: true });
        }

        return new Response("Unknown action", { status: 400 });
    } catch (err) {
        console.error("Checkout feedback API error:", err);
        return new Response("Internal error", { status: 500 });
    }
}
