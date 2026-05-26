/**
 * Comments API — Vercel Edge Function backed by Upstash Redis.
 *
 * Setup:
 *   1. Vercel dashboard → Project → Storage → Connect "Upstash for Redis"
 *      (or any Redis-compatible store that populates the env vars below).
 *   2. Vercel will auto-populate:
 *        UPSTASH_REDIS_REST_URL
 *        UPSTASH_REDIS_REST_TOKEN
 *      (or the equivalent KV_REST_API_URL / KV_REST_API_TOKEN for the
 *      legacy Vercel KV integration — both are supported below).
 *   3. For local development, pull the env vars: `vercel env pull .env.local`
 *      then run `vercel dev` to serve the API alongside Vite.
 */

import { Redis } from "@upstash/redis";

export const config = { runtime: "edge" };

interface CommentReply {
    id: string;
    text: string;
    author: string;
    createdAt: string;
}

interface Comment {
    id: string;
    pathname: string | null;
    anchorSelector: string;
    offsetX: number;
    offsetY: number;
    text: string;
    author: string;
    createdAt: string;
    replies: CommentReply[];
}

const redis = new Redis({
    url:
        process.env.UPSTASH_REDIS_REST_URL ??
        process.env.KV_REST_API_URL ??
        "",
    token:
        process.env.UPSTASH_REDIS_REST_TOKEN ??
        process.env.KV_REST_API_TOKEN ??
        "",
});

const COMMENTS_KEY = "design-prototyes:comments:v1";

function generateId(): string {
    return crypto.randomUUID();
}

async function listAll(): Promise<Comment[]> {
    const data = await redis.get<Comment[]>(COMMENTS_KEY);
    return Array.isArray(data) ? data : [];
}

async function writeAll(comments: Comment[]): Promise<void> {
    await redis.set(COMMENTS_KEY, comments);
}

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "content-type": "application/json" },
    });
}

function clamp(value: unknown, max: number): string {
    return String(value ?? "").slice(0, max);
}

export default async function handler(req: Request): Promise<Response> {
    try {
        if (req.method === "GET") {
            return json(await listAll());
        }
        if (req.method !== "POST") {
            return new Response("Method not allowed", { status: 405 });
        }

        const body = (await req.json()) as Record<string, unknown>;
        const action = body.action as string | undefined;
        const all = await listAll();

        if (action === "add") {
            const input = (body.input ?? {}) as Record<string, unknown>;
            const comment: Comment = {
                id: generateId(),
                pathname: input.pathname == null ? null : String(input.pathname),
                anchorSelector: String(input.anchorSelector ?? "body"),
                offsetX: Number(input.offsetX ?? 0),
                offsetY: Number(input.offsetY ?? 0),
                text: clamp(input.text, 2000),
                author: clamp(input.author, 60) || "Anônimo",
                createdAt: new Date().toISOString(),
                replies: [],
            };
            all.push(comment);
            await writeAll(all);
            return json(comment, 201);
        }

        if (action === "remove") {
            const id = String(body.id ?? "");
            const next = all.filter((c) => c.id !== id);
            await writeAll(next);
            return json({ ok: true });
        }

        if (action === "addReply") {
            const commentId = String(body.commentId ?? "");
            const input = (body.input ?? {}) as Record<string, unknown>;
            const target = all.find((c) => c.id === commentId);
            if (!target) return new Response("Comment not found", { status: 404 });
            const reply: CommentReply = {
                id: generateId(),
                text: clamp(input.text, 2000),
                author: clamp(input.author, 60) || "Anônimo",
                createdAt: new Date().toISOString(),
            };
            target.replies.push(reply);
            await writeAll(all);
            return json(reply, 201);
        }

        if (action === "removeReply") {
            const commentId = String(body.commentId ?? "");
            const replyId = String(body.replyId ?? "");
            const target = all.find((c) => c.id === commentId);
            if (target) {
                target.replies = target.replies.filter((r) => r.id !== replyId);
                await writeAll(all);
            }
            return json({ ok: true });
        }

        return new Response("Unknown action", { status: 400 });
    } catch (err) {
        console.error("Comments API error:", err);
        return new Response("Internal error", { status: 500 });
    }
}
