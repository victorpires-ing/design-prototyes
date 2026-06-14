/**
 * Usability API — Vercel Edge Function backed by Upstash Redis.
 *
 * Reaproveita a MESMA store Redis dos comentários (apenas namespaces de chave
 * diferentes). Setup já feito no projeto: UPSTASH_REDIS_REST_URL/TOKEN
 * (ou KV_REST_API_URL/TOKEN) populados pela Vercel.
 *
 * Local dev: `vercel env pull .env.local` + `vercel dev` para servir esta API
 * junto do Vite. Sem isso, o store cai no fallback localStorage.
 */

import { Redis } from "@upstash/redis";

export const config = { runtime: "edge" };

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? "",
});

const TESTES_KEY = "design-prototyes:usability:testes:v1";
const sessoesKey = (testeId: string) => `design-prototyes:usability:sessoes:v1:${testeId}`;

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "content-type": "application/json" },
    });
}

async function listTestes(): Promise<unknown[]> {
    const data = await redis.get<unknown[]>(TESTES_KEY);
    return Array.isArray(data) ? data : [];
}

async function listSessoes(testeId: string): Promise<unknown[]> {
    const data = await redis.get<unknown[]>(sessoesKey(testeId));
    return Array.isArray(data) ? data : [];
}

export default async function handler(req: Request): Promise<Response> {
    try {
        const url = new URL(req.url);

        if (req.method === "GET") {
            const testeId = url.searchParams.get("testeId");
            const sessoes = url.searchParams.get("sessoes");
            if (sessoes && testeId) return json(await listSessoes(testeId));
            if (testeId) {
                const all = (await listTestes()) as Array<{ id: string }>;
                const found = all.find((t) => t.id === testeId);
                return found ? json(found) : json(null, 404);
            }
            return json(await listTestes());
        }

        if (req.method !== "POST") {
            return new Response("Method not allowed", { status: 405 });
        }

        const body = (await req.json()) as Record<string, unknown>;
        const action = body.action as string | undefined;

        if (action === "saveTeste") {
            const teste = body.teste as { id: string };
            const all = (await listTestes()) as Array<{ id: string }>;
            const idx = all.findIndex((t) => t.id === teste.id);
            if (idx >= 0) all[idx] = teste;
            else all.push(teste);
            await redis.set(TESTES_KEY, all);
            return json(teste, 201);
        }

        if (action === "removeTeste") {
            const id = String(body.id ?? "");
            const all = (await listTestes()) as Array<{ id: string }>;
            await redis.set(TESTES_KEY, all.filter((t) => t.id !== id));
            await redis.del(sessoesKey(id));
            return json({ ok: true });
        }

        if (action === "saveSessao") {
            const sessao = body.sessao as { id: string; testeId: string };
            const all = (await listSessoes(sessao.testeId)) as Array<{ id: string }>;
            const idx = all.findIndex((s) => s.id === sessao.id);
            if (idx >= 0) all[idx] = sessao;
            else all.push(sessao);
            await redis.set(sessoesKey(sessao.testeId), all);
            return json(sessao, 201);
        }

        return new Response("Unknown action", { status: 400 });
    } catch (err) {
        console.error("Usability API error:", err);
        return new Response("Internal error", { status: 500 });
    }
}
