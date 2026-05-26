import type {
    Comment,
    CommentInput,
    CommentReply,
    CommentsStore,
    ReplyInput,
} from "./types";

const STORAGE_KEY = "design-prototyes:comments:v2";
const LEGACY_KEY = "design-prototyes:comments:v1";

interface LegacyComment {
    id?: string;
    x?: number;
    y?: number;
    text?: string;
    author?: string;
    createdAt?: string;
    replies?: CommentReply[];
}

function migrateLegacy(): Comment[] {
    try {
        const raw = localStorage.getItem(LEGACY_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map((c: LegacyComment) => ({
            id: String(c.id ?? generateId()),
            pathname: null,
            anchorSelector: "body",
            offsetX: Number(c.x ?? 0),
            offsetY: Number(c.y ?? 0),
            text: String(c.text ?? ""),
            author: String(c.author ?? "Anônimo"),
            createdAt: String(c.createdAt ?? new Date().toISOString()),
            replies: Array.isArray(c.replies) ? c.replies : [],
        }));
    } catch {
        return [];
    }
}

function readAll(): Comment[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            // First load — migrate v1 if present
            const migrated = migrateLegacy();
            if (migrated.length > 0) {
                writeAll(migrated);
                return migrated;
            }
            return [];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map((c: Partial<Comment>) => ({
            id: String(c.id ?? generateId()),
            pathname: c.pathname === undefined ? null : c.pathname,
            anchorSelector: String(c.anchorSelector ?? "body"),
            offsetX: Number(c.offsetX ?? 0),
            offsetY: Number(c.offsetY ?? 0),
            text: String(c.text ?? ""),
            author: String(c.author ?? "Anônimo"),
            createdAt: String(c.createdAt ?? new Date().toISOString()),
            replies: Array.isArray(c.replies) ? c.replies : [],
        }));
    } catch {
        return [];
    }
}

function writeAll(comments: Comment[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
}

function generateId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * localStorage-backed store. Single-browser persistence.
 *
 * To swap for a multi-user backend (Vercel KV, Supabase, etc.) implement the
 * same `CommentsStore` interface and replace the export below.
 */
export const localStorageCommentsStore: CommentsStore = {
    async list() {
        return readAll();
    },
    async add(input: CommentInput) {
        const comment: Comment = {
            id: generateId(),
            pathname: input.pathname,
            anchorSelector: input.anchorSelector,
            offsetX: input.offsetX,
            offsetY: input.offsetY,
            text: input.text,
            author: input.author,
            createdAt: new Date().toISOString(),
            replies: [],
        };
        const all = readAll();
        all.push(comment);
        writeAll(all);
        return comment;
    },
    async remove(id: string) {
        const all = readAll().filter((c) => c.id !== id);
        writeAll(all);
    },
    async addReply(commentId: string, input: ReplyInput) {
        const reply: CommentReply = {
            id: generateId(),
            text: input.text,
            author: input.author,
            createdAt: new Date().toISOString(),
        };
        const all = readAll();
        const target = all.find((c) => c.id === commentId);
        if (target) {
            target.replies = [...target.replies, reply];
            writeAll(all);
        }
        return reply;
    },
    async removeReply(commentId: string, replyId: string) {
        const all = readAll();
        const target = all.find((c) => c.id === commentId);
        if (target) {
            target.replies = target.replies.filter((r) => r.id !== replyId);
            writeAll(all);
        }
    },
};
