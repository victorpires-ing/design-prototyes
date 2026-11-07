/**
 * Banco unificado da plataforma (gêmeo da Ingresse para protótipo).
 * Vercel Edge Function + o mesmo Upstash Redis das outras APIs, em namespace próprio.
 *
 * Cada coleção é um hash Redis: campo = id do documento, valor = JSON.
 * Coleções: eventos, pedidos, ingressos, usuarios (ver src/plataforma/modelo.ts).
 *
 * GET  /api/db                       → { meta, colecoes: { eventos: [...], ... } }
 * GET  /api/db?col=eventos           → [...]
 * POST /api/db { op: "put",  col, doc }          → doc
 * POST /api/db { op: "del",  col, id }           → { ok }
 * POST /api/db { op: "seed", versao, data }      → grava só documentos que ainda não existem
 * POST /api/db { op: "reset", confirmar: "RESETAR", versao, data } → apaga tudo e grava a seed
 *
 * Sem autenticação: é dado fictício de protótipo. Nunca grave dado real de cliente.
 */

import { Redis } from "@upstash/redis";

export const config = { runtime: "edge" };

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? "",
});

const NS = "design-prototyes:db:v1";
const COLECOES = ["eventos", "pedidos", "ingressos", "usuarios"] as const;
type Colecao = (typeof COLECOES)[number];
const META = `${NS}:meta`;
const chave = (col: Colecao) => `${NS}:${col}`;
const MAX_DOC = 200_000;

type Doc = { id: string } & Record<string, unknown>;

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

const ehColecao = (c: unknown): c is Colecao => typeof c === "string" && (COLECOES as readonly string[]).includes(c);
const ehDoc = (d: unknown): d is Doc => !!d && typeof d === "object" && typeof (d as Doc).id === "string" && (d as Doc).id.length > 0;

async function listar(col: Colecao): Promise<Doc[]> {
    const h = await redis.hgetall<Record<string, Doc | string>>(chave(col));
    if (!h) return [];
    // O cliente Upstash desserializa JSON automaticamente; string sobra só se o valor não for JSON.
    return Object.values(h).map((v) => (typeof v === "string" ? (JSON.parse(v) as Doc) : v));
}

async function gravarSeed(data: Record<string, unknown>, sobrescrever: boolean) {
    let gravados = 0;
    for (const col of COLECOES) {
        const docs = Array.isArray(data[col]) ? (data[col] as unknown[]).filter(ehDoc) : [];
        for (const d of docs) {
            const s = JSON.stringify(d);
            if (s.length > MAX_DOC) continue;
            if (sobrescrever) {
                await redis.hset(chave(col), { [d.id]: s });
                gravados++;
            } else if (await redis.hsetnx(chave(col), d.id, s)) gravados++;
        }
    }
    return gravados;
}

export default async function handler(req: Request): Promise<Response> {
    try {
        if (req.method === "GET") {
            const col = new URL(req.url).searchParams.get("col");
            if (col) {
                if (!ehColecao(col)) return json({ error: "coleção inválida" }, 400);
                return json(await listar(col));
            }
            const [meta, ...listas] = await Promise.all([redis.get(META), ...COLECOES.map(listar)]);
            return json({ meta: meta ?? null, colecoes: Object.fromEntries(COLECOES.map((c, i) => [c, listas[i]])) });
        }

        if (req.method === "POST") {
            const body = (await req.json()) as Record<string, unknown>;
            const op = body.op;

            if (op === "put") {
                if (!ehColecao(body.col) || !ehDoc(body.doc)) return json({ error: "col e doc.id são obrigatórios" }, 400);
                const s = JSON.stringify(body.doc);
                if (s.length > MAX_DOC) return json({ error: "documento grande demais" }, 413);
                await redis.hset(chave(body.col), { [body.doc.id]: s });
                return json(body.doc);
            }

            if (op === "del") {
                if (!ehColecao(body.col) || typeof body.id !== "string") return json({ error: "col e id são obrigatórios" }, 400);
                await redis.hdel(chave(body.col), body.id);
                return json({ ok: true });
            }

            if (op === "seed" || op === "reset") {
                if (typeof body.versao !== "string" || !body.data || typeof body.data !== "object") return json({ error: "versao e data são obrigatórios" }, 400);
                if (op === "reset") {
                    if (body.confirmar !== "RESETAR") return json({ error: "confirmação ausente" }, 400);
                    await redis.del(...COLECOES.map(chave));
                } else {
                    const meta = await redis.get<{ versao?: string }>(META);
                    if (meta?.versao === body.versao) return json({ gravados: 0, meta });
                }
                const gravados = await gravarSeed(body.data as Record<string, unknown>, op === "reset");
                const meta = { versao: body.versao, em: new Date().toISOString() };
                await redis.set(META, meta);
                return json({ gravados, meta });
            }

            return json({ error: "op inválida" }, 400);
        }

        return json({ error: "método não permitido" }, 405);
    } catch (err) {
        return json({ error: String(err) }, 500);
    }
}
