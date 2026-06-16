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
// Legado: array com todas as sessões de um teste (mantido só para leitura de dados antigos).
const sessoesKeyLegado = (testeId: string) => `design-prototyes:usability:sessoes:v1:${testeId}`;
// Novo modelo: uma chave por sessão + um índice (set) com os ids. Escrita isolada por
// participante — sem read-modify-write, então nenhuma resposta sobrescreve a outra.
const sessaoKey = (testeId: string, sessaoId: string) => `design-prototyes:usability:sessao:v1:${testeId}:${sessaoId}`;
const sessaoIdsKey = (testeId: string) => `design-prototyes:usability:sessao-ids:v1:${testeId}`;

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
    // Sessões novas (uma chave por sessão, via índice).
    const ids = (await redis.smembers(sessaoIdsKey(testeId))) as string[];
    let novas: unknown[] = [];
    if (ids.length > 0) {
        const vals = (await redis.mget<unknown[]>(...ids.map((id) => sessaoKey(testeId, id)))) ?? [];
        novas = (vals as unknown[]).filter(Boolean);
    }
    // Sessões legadas (array único antigo), se houver.
    const legado = await redis.get<unknown[]>(sessoesKeyLegado(testeId));
    const antigas = Array.isArray(legado) ? legado : [];

    // Mescla, dando preferência às novas em caso de id repetido.
    const porId = new Map<string, unknown>();
    for (const s of antigas) {
        const id = (s as { id?: string })?.id;
        if (id) porId.set(id, s);
    }
    for (const s of novas) {
        const id = (s as { id?: string })?.id;
        if (id) porId.set(id, s);
    }
    return [...porId.values()];
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
            // Apaga sessões (novas + índice + array legado).
            const ids = (await redis.smembers(sessaoIdsKey(id))) as string[];
            if (ids.length > 0) await redis.del(...ids.map((sid) => sessaoKey(id, sid)));
            await redis.del(sessaoIdsKey(id));
            await redis.del(sessoesKeyLegado(id));
            return json({ ok: true });
        }

        if (action === "saveSessao") {
            const sessao = body.sessao as { id: string; testeId: string };
            // Escrita isolada: cada sessão na própria chave + id no índice (SADD é atômico).
            await redis.set(sessaoKey(sessao.testeId, sessao.id), sessao);
            await redis.sadd(sessaoIdsKey(sessao.testeId), sessao.id);
            return json(sessao, 201);
        }

        return new Response("Unknown action", { status: 400 });
    } catch (err) {
        console.error("Usability API error:", err);
        return new Response("Internal error", { status: 500 });
    }
}
