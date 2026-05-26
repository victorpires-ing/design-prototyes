import type {
    Comment,
    CommentInput,
    CommentReply,
    CommentsStore,
    ReplyInput,
} from "./types";

/**
 * Remote store backed by the `/api/comments` Vercel function (Upstash Redis).
 *
 * Local dev: requires `vercel dev` to serve the API. Without it the fetch will
 * fall through to the Vite dev server and return HTML, causing the JSON parse
 * to throw — the caller should handle the rejection (CommentsLayer logs and
 * falls back to an empty list on `list` failure).
 */

const ENDPOINT = "/api/comments";

async function fetchJson<T>(init?: RequestInit): Promise<T> {
    const res = await fetch(ENDPOINT, {
        ...init,
        headers: {
            "content-type": "application/json",
            ...(init?.headers ?? {}),
        },
    });
    if (!res.ok) {
        throw new Error(`Comments API ${res.status}: ${res.statusText}`);
    }
    return res.json() as Promise<T>;
}

function post<T>(body: Record<string, unknown>): Promise<T> {
    return fetchJson<T>({ method: "POST", body: JSON.stringify(body) });
}

export const remoteCommentsStore: CommentsStore = {
    async list() {
        return fetchJson<Comment[]>({ method: "GET", cache: "no-store" });
    },
    add(input: CommentInput) {
        return post<Comment>({ action: "add", input });
    },
    async remove(id: string) {
        await post({ action: "remove", id });
    },
    addReply(commentId: string, input: ReplyInput) {
        return post<CommentReply>({ action: "addReply", commentId, input });
    },
    async removeReply(commentId: string, replyId: string) {
        await post({ action: "removeReply", commentId, replyId });
    },
};
