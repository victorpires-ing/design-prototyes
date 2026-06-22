/**
 * Links curtos do Marketplace — Vercel Edge Function + Upstash Redis.
 *
 * Guarda o `cfg` (base64) do evento sob um id derivado do HASH do conteúdo.
 * Idempotente: o mesmo config gera sempre o mesmo id, então:
 *   - links iguais não criam entradas novas (sem churn no banco);
 *   - mudar o config gera um id novo (link novo), sem sobrescrever o antigo.
 *
 * Setup já existente: UPSTASH_REDIS_REST_URL/TOKEN (ou KV_REST_API_URL/TOKEN).
 *
 * GET  /api/links?id=<id>  → { data: <base64> } | 404
 * POST /api/links { data } → { id }
 */

import { Redis } from "@upstash/redis";

export const config = { runtime: "edge" };

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? "",
});

const linkKey = (id: string) => `design-prototyes:mkt:link:v1:${id}`;

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}

/** id curto = primeiros 12 hex do SHA-256 do conteúdo. */
async function hashId(data: string): Promise<string> {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
    return Array.from(new Uint8Array(buf).slice(0, 6))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

export default async function handler(req: Request): Promise<Response> {
    try {
        const url = new URL(req.url);

        if (req.method === "GET") {
            const id = url.searchParams.get("id");
            if (!id) return json({ error: "id obrigatório" }, 400);
            const data = await redis.get<string>(linkKey(id));
            return data ? json({ data }) : json(null, 404);
        }

        if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

        const body = (await req.json()) as { data?: unknown };
        const data = typeof body.data === "string" ? body.data : "";
        if (!data) return json({ error: "data obrigatório" }, 400);

        const id = await hashId(data);
        const key = linkKey(id);
        // Só grava se ainda não existir (idempotente — evita reescrever o mesmo conteúdo).
        const existe = await redis.exists(key);
        if (!existe) await redis.set(key, data);
        return json({ id }, 201);
    } catch (e) {
        return json({ error: (e as Error).message }, 500);
    }
}
