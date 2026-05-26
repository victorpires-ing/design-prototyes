export interface CommentReply {
    id: string;
    text: string;
    author: string;
    createdAt: string;
}

export interface Comment {
    id: string;
    /** Route/path where the comment was placed. `null` = legacy (shown everywhere). */
    pathname: string | null;
    /** CSS selector path of the anchor element this comment is attached to. */
    anchorSelector: string;
    /** Offset in pixels from the anchor element's top-left corner. */
    offsetX: number;
    offsetY: number;
    text: string;
    author: string;
    createdAt: string;
    replies: CommentReply[];
}

export interface CommentInput {
    pathname: string;
    anchorSelector: string;
    offsetX: number;
    offsetY: number;
    text: string;
    author: string;
}

export interface ReplyInput {
    text: string;
    author: string;
}

export interface CommentsStore {
    list(): Promise<Comment[]>;
    add(input: CommentInput): Promise<Comment>;
    remove(id: string): Promise<void>;
    addReply(commentId: string, input: ReplyInput): Promise<CommentReply>;
    removeReply(commentId: string, replyId: string): Promise<void>;
}
