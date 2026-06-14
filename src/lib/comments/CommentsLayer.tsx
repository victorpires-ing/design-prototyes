import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent,
    type ReactNode,
} from "react";
import { useLocation } from "react-router";
import { MessageCircle01, Trash01, XClose } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { remoteCommentsStore } from "./remoteStore";
import type { Comment } from "./types";

const STORE = remoteCommentsStore;
const AUTHOR_KEY = "design-prototyes:comments:author";
const ENABLED_KEY = "design-prototyes:comments:enabled";

/** Lê o estado dos comentários a partir do `?comments=on/off` ou do estado persistido. */
function lerCommentsEnabled(search: string): boolean {
    const param = new URLSearchParams(search).get("comments");
    if (param === "on") return true;
    if (param === "off") return false;
    return sessionStorage.getItem(ENABLED_KEY) === "on";
}

const PIN_SIZE = 32;
const BUBBLE_WIDTH = 280;
const VIEWPORT_MARGIN = 16;
// Conservative max heights used to decide whether the bubble fits above/below the pin.
const ESTIMATED_THREAD_BUBBLE_HEIGHT = 420;
const ESTIMATED_DRAFT_HEIGHT = 160;

// Pin-shaped cursor used during placement mode. Hotspot is at the bottom-left
// tip of the pin so the click position matches the visual anchor.
const PIN_CURSOR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M2 30V16a14 14 0 1 1 14 14H2Z" fill="#ff271a" stroke="white" stroke-width="2"/></svg>`;
const PIN_CURSOR = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(PIN_CURSOR_SVG)}") 2 30, crosshair`;

/* ------------------------------------------------------------------ */
/*  DOM helpers                                                       */
/* ------------------------------------------------------------------ */

function isInputFocused(): boolean {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (el instanceof HTMLElement && el.isContentEditable) return true;
    return false;
}

function getStoredAuthor(): string | null {
    const name = localStorage.getItem(AUTHOR_KEY);
    return name && name.trim() ? name : null;
}

function setStoredAuthor(name: string) {
    localStorage.setItem(AUTHOR_KEY, name);
}

function hashColor(seed: string): string {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const hue = h % 360;
    return `hsl(${hue} 70% 50%)`;
}

function getInitial(name: string): string {
    const trimmed = name.trim();
    return trimmed ? trimmed[0]!.toUpperCase() : "?";
}

function formatTimestamp(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffMin = Math.round((now.getTime() - d.getTime()) / 60000);
    if (diffMin < 1) return "agora";
    if (diffMin < 60) return `${diffMin} min atrás`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr} h atrás`;
    const diffDay = Math.round(diffHr / 24);
    if (diffDay < 30) return `${diffDay} d atrás`;
    return d.toLocaleDateString("pt-BR");
}

function truncate(text: string, max: number): string {
    if (text.length <= max) return text;
    return text.slice(0, max).trim() + "…";
}

/** Build a stable CSS selector for an element (uses ID when available). */
function buildSelector(el: Element): string {
    if (el === document.body) return "body";
    if (el === document.documentElement) return "html";
    if (el.id) return `#${CSS.escape(el.id)}`;
    const parts: string[] = [];
    let current: Element | null = el;
    while (
        current &&
        current !== document.body &&
        current !== document.documentElement
    ) {
        let part = current.tagName.toLowerCase();
        const parent = current.parentElement;
        if (parent) {
            const sameTagSiblings = Array.from(parent.children).filter(
                (s) => s.tagName === current!.tagName,
            );
            if (sameTagSiblings.length > 1) {
                const index = sameTagSiblings.indexOf(current) + 1;
                part += `:nth-of-type(${index})`;
            }
        }
        parts.unshift(part);
        current = current.parentElement;
    }
    return parts.length > 0 ? `body > ${parts.join(" > ")}` : "body";
}

/** Look up the anchor element for a stored selector. */
function findAnchor(selector: string): Element | null {
    try {
        return document.querySelector(selector);
    } catch {
        return null;
    }
}

interface BubblePlacement {
    side: "left" | "right";
    vertical: "up" | "down";
}

/**
 * Pick the side/vertical placement for a bubble so it stays inside the viewport.
 * `anchorRect` is the bounding rect of the 0x0 anchor container (positioned at
 * the pin's bottom-left tip).
 */
function computeBubblePlacement(
    anchorRect: DOMRect | null,
    bubbleHeight: number,
): BubblePlacement {
    if (!anchorRect) return { side: "right", vertical: "up" };
    const spaceRight = window.innerWidth - anchorRect.right;
    const spaceAbove = anchorRect.top;
    const spaceBelow = window.innerHeight - anchorRect.top;
    const needWidth = BUBBLE_WIDTH + PIN_SIZE + VIEWPORT_MARGIN;
    const needHeight = bubbleHeight + VIEWPORT_MARGIN;
    const side: "left" | "right" = spaceRight < needWidth ? "left" : "right";
    let vertical: "up" | "down";
    if (spaceAbove >= needHeight) {
        vertical = "up";
    } else if (spaceBelow >= needHeight) {
        vertical = "down";
    } else {
        vertical = spaceAbove >= spaceBelow ? "up" : "down";
    }
    return { side, vertical };
}

/** Find the element under the cursor, skipping the comments overlay. */
function elementUnderPoint(
    clientX: number,
    clientY: number,
    overlay: HTMLElement | null,
): Element | null {
    const prev = overlay?.style.pointerEvents;
    if (overlay) overlay.style.pointerEvents = "none";
    const target = document.elementFromPoint(clientX, clientY);
    if (overlay) overlay.style.pointerEvents = prev ?? "";
    return target;
}

/* ------------------------------------------------------------------ */
/*  Layer                                                             */
/* ------------------------------------------------------------------ */

interface DraftComment {
    anchorSelector: string;
    offsetX: number;
    offsetY: number;
}

interface HighlightRect {
    left: number;
    top: number;
    width: number;
    height: number;
}

interface CommentsLayerProps {
    children: ReactNode;
}

export function CommentsLayer({ children }: CommentsLayerProps) {
    const location = useLocation();
    // Os comentários ligam com "?comments=on" e PERMANECEM ao navegar (persistido),
    // até serem desligados com "?comments=off".
    const [commentsEnabled, setCommentsEnabled] = useState(() => lerCommentsEnabled(location.search));
    useEffect(() => {
        const param = new URLSearchParams(location.search).get("comments");
        if (param === "on") {
            sessionStorage.setItem(ENABLED_KEY, "on");
            setCommentsEnabled(true);
        } else if (param === "off") {
            sessionStorage.removeItem(ENABLED_KEY);
            setCommentsEnabled(false);
        }
    }, [location.search]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isPlacing, setIsPlacing] = useState(false);
    const [draft, setDraft] = useState<DraftComment | null>(null);
    const [openId, setOpenId] = useState<string | null>(null);
    const [highlight, setHighlight] = useState<HighlightRect | null>(null);
    const [viewportVersion, setViewportVersion] = useState(0);
    const [authorRequest, setAuthorRequest] = useState<{
        resolve: (name: string | null) => void;
    } | null>(null);
    const placementOverlayRef = useRef<HTMLDivElement | null>(null);

    const requestAuthor = useCallback((): Promise<string | null> => {
        const stored = getStoredAuthor();
        if (stored) return Promise.resolve(stored);
        return new Promise((resolve) => setAuthorRequest({ resolve }));
    }, []);

    const handleAuthorSubmit = useCallback(
        (name: string) => {
            const trimmed = name.trim();
            if (!trimmed) return;
            setStoredAuthor(trimmed);
            authorRequest?.resolve(trimmed);
            setAuthorRequest(null);
        },
        [authorRequest],
    );

    const handleAuthorCancel = useCallback(() => {
        authorRequest?.resolve(null);
        setAuthorRequest(null);
    }, [authorRequest]);

    useEffect(() => {
        STORE.list().then(setComments).catch(() => setComments([]));
    }, []);

    // Reset all transient state on route change so stale highlights / open
    // bubbles from the previous page don't leak into the new one.
    useEffect(() => {
        setHighlight(null);
        setOpenId(null);
        setDraft(null);
        setIsPlacing(false);
    }, [location.pathname]);

    // Only render comments anchored to the current path (legacy comments with
    // `pathname === null` are shown on every page for backward compat).
    const visibleComments = useMemo(
        () =>
            comments.filter(
                (c) => c.pathname === null || c.pathname === location.pathname,
            ),
        [comments, location.pathname],
    );

    // Recompute pin positions on window resize / DOM resize
    useEffect(() => {
        const bump = () => setViewportVersion((v) => v + 1);
        window.addEventListener("resize", bump);
        const ro = new ResizeObserver(bump);
        ro.observe(document.body);
        return () => {
            window.removeEventListener("resize", bump);
            ro.disconnect();
        };
    }, []);

    const exitPlacing = useCallback(() => {
        setIsPlacing(false);
        setDraft(null);
        setHighlight(null);
    }, []);

    // Shift+C shortcut + Esc to cancel
    useEffect(() => {
        const handler = (e: globalThis.KeyboardEvent) => {
            if (
                e.shiftKey &&
                e.code === "KeyC" &&
                !e.repeat &&
                !e.metaKey &&
                !e.ctrlKey &&
                !e.altKey
            ) {
                if (isInputFocused()) return;
                e.preventDefault();
                setOpenId(null);
                setDraft(null);
                setHighlight(null);
                setIsPlacing((prev) => !prev);
                return;
            }
            if (e.key === "Escape") {
                if (draft) {
                    setDraft(null);
                    return;
                }
                if (isPlacing) {
                    exitPlacing();
                    return;
                }
                if (openId) {
                    setOpenId(null);
                    setHighlight(null);
                }
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [draft, isPlacing, openId, exitPlacing]);

    const handlePlacementMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isPlacing || draft) return;
        const target = elementUnderPoint(
            e.clientX,
            e.clientY,
            placementOverlayRef.current,
        );
        if (!target || target === document.body || target === document.documentElement) {
            setHighlight(null);
            return;
        }
        const rect = target.getBoundingClientRect();
        setHighlight({
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
        });
    };

    const handlePlacementClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isPlacing) return;
        e.preventDefault();
        e.stopPropagation();
        const target = elementUnderPoint(
            e.clientX,
            e.clientY,
            placementOverlayRef.current,
        );
        const anchor =
            target && target !== document.documentElement
                ? target
                : document.body;
        const rect = anchor.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        const selector = buildSelector(anchor);
        setDraft({ anchorSelector: selector, offsetX, offsetY });
        setHighlight(null);
    };

    const submitDraft = async (text: string) => {
        if (!draft) return;
        const trimmed = text.trim();
        if (!trimmed) {
            setDraft(null);
            setIsPlacing(false);
            return;
        }
        const author = await requestAuthor();
        if (!author) return;
        const created = await STORE.add({
            pathname: location.pathname,
            anchorSelector: draft.anchorSelector,
            offsetX: draft.offsetX,
            offsetY: draft.offsetY,
            text: trimmed,
            author,
        });
        setComments((prev) => [...prev, created]);
        setDraft(null);
        setIsPlacing(false);
        setOpenId(created.id);
    };

    const cancelDraft = () => {
        setDraft(null);
        setIsPlacing(false);
    };

    const removeComment = async (id: string) => {
        await STORE.remove(id);
        setComments((prev) => prev.filter((c) => c.id !== id));
        if (openId === id) setOpenId(null);
    };

    const addReply = async (commentId: string, text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const author = await requestAuthor();
        if (!author) return;
        const reply = await STORE.addReply(commentId, { text: trimmed, author });
        setComments((prev) =>
            prev.map((c) =>
                c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c,
            ),
        );
    };

    const removeReply = async (commentId: string, replyId: string) => {
        await STORE.removeReply(commentId, replyId);
        setComments((prev) =>
            prev.map((c) =>
                c.id === commentId
                    ? { ...c, replies: c.replies.filter((r) => r.id !== replyId) }
                    : c,
            ),
        );
    };

    const setAnchorHighlightForComment = useCallback(
        (comment: Comment | null) => {
            if (!comment) {
                setHighlight(null);
                return;
            }
            const anchor = findAnchor(comment.anchorSelector);
            if (!anchor) {
                setHighlight(null);
                return;
            }
            const rect = anchor.getBoundingClientRect();
            setHighlight({
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
            });
        },
        [],
    );

    const showLowHighlight = highlight !== null && !isPlacing;
    const showHighHighlight = highlight !== null && isPlacing;

    // Sem a flag "?comments=on", renderiza apenas o app — nenhum pin, overlay ou
    // ação de comentário fica disponível.
    if (!commentsEnabled) return <>{children}</>;

    return (
        <>
            <div className="relative isolate">
                {children}

                {/* Anchor highlight in idle/hover mode — below pins so bubble is on top */}
                {showLowHighlight && highlight && (
                    <div
                        aria-hidden="true"
                        className="pointer-events-none fixed z-[85] rounded-md ring-2 ring-brand"
                        style={{
                            left: highlight.left - 4,
                            top: highlight.top - 4,
                            width: highlight.width + 8,
                            height: highlight.height + 8,
                        }}
                    />
                )}

                <div className="pointer-events-none absolute inset-0 z-[90]">
                    {visibleComments.map((comment) => (
                        <CommentPin
                            key={comment.id}
                            comment={comment}
                            isOpen={openId === comment.id}
                            viewportVersion={viewportVersion}
                            onOpen={() => setOpenId(comment.id)}
                            onClose={() => {
                                setOpenId(null);
                                setHighlight(null);
                            }}
                            onDeleteComment={() => removeComment(comment.id)}
                            onAddReply={(text) => addReply(comment.id, text)}
                            onDeleteReply={(replyId) => removeReply(comment.id, replyId)}
                            onShowAnchorHighlight={() =>
                                setAnchorHighlightForComment(comment)
                            }
                            onHideAnchorHighlight={() => setHighlight(null)}
                        />
                    ))}
                    {draft && (
                        <CommentDraftForm
                            anchorSelector={draft.anchorSelector}
                            offsetX={draft.offsetX}
                            offsetY={draft.offsetY}
                            viewportVersion={viewportVersion}
                            onSubmit={submitDraft}
                            onCancel={cancelDraft}
                        />
                    )}
                </div>
            </div>

            {/* Anchor highlight during placement — above the placement overlay */}
            {showHighHighlight && highlight && (
                <div
                    aria-hidden="true"
                    className="pointer-events-none fixed z-[105] rounded-md ring-2 ring-brand"
                    style={{
                        left: highlight.left - 4,
                        top: highlight.top - 4,
                        width: highlight.width + 8,
                        height: highlight.height + 8,
                    }}
                />
            )}

            {/* Click-catcher overlay during placing mode */}
            {isPlacing && !draft && (
                <div
                    ref={placementOverlayRef}
                    role="presentation"
                    onMouseMove={handlePlacementMouseMove}
                    onClick={handlePlacementClick}
                    className="fixed inset-0 z-[100] bg-overlay/10"
                    style={{ cursor: PIN_CURSOR }}
                />
            )}

            {isPlacing && (
                <div className="fixed bottom-6 left-1/2 z-[110] flex -translate-x-1/2 items-center gap-3 rounded-full bg-primary-solid px-4 py-2 text-sm text-white shadow-lg">
                    <MessageCircle01 className="size-4" />
                    <span>Clique no elemento que quer comentar</span>
                    <button
                        type="button"
                        onClick={exitPlacing}
                        className="ml-1 rounded p-1 hover:bg-white/10"
                        aria-label="Cancelar"
                    >
                        <XClose className="size-4" />
                    </button>
                </div>
            )}

            {authorRequest && (
                <NameModal
                    onSubmit={handleAuthorSubmit}
                    onCancel={handleAuthorCancel}
                />
            )}
        </>
    );
}

/* ------------------------------------------------------------------ */
/*  Name modal                                                        */
/* ------------------------------------------------------------------ */

interface NameModalProps {
    onSubmit: (name: string) => void;
    onCancel: () => void;
}

const NameModal = ({ onSubmit, onCancel }: NameModalProps) => {
    const [name, setName] = useState("");
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        const handler = (e: globalThis.KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onCancel();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onCancel]);

    const handleSubmit = () => {
        const trimmed = name.trim();
        if (!trimmed) return;
        onSubmit(trimmed);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="Cancelar"
                onClick={onCancel}
                className="absolute inset-0 bg-overlay"
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="comments-name-modal-title"
                className="relative w-full max-w-sm rounded-xl bg-primary p-5 shadow-2xl ring-1 ring-border-secondary"
            >
                <div className="flex flex-col gap-1.5">
                    <h2
                        id="comments-name-modal-title"
                        className="text-md font-semibold text-primary"
                    >
                        Como você quer aparecer?
                    </h2>
                    <p className="text-sm text-tertiary">
                        Seu nome será exibido nos comentários que você deixar.
                    </p>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit();
                    }}
                    className="mt-4 flex flex-col gap-4"
                >
                    <label className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium text-secondary">Nome</span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Victor Pires"
                            maxLength={60}
                            className="rounded-lg bg-primary px-3 py-2 text-sm text-primary outline-none ring-1 ring-border-primary placeholder:text-placeholder focus:ring-2 focus:ring-brand"
                        />
                    </label>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="rounded-md px-3 py-1.5 text-sm font-medium text-secondary transition duration-100 ease-linear hover:bg-secondary"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="rounded-md bg-brand-solid px-3 py-1.5 text-sm font-semibold text-white transition duration-100 ease-linear hover:bg-brand-solid_hover disabled:opacity-40"
                        >
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Anchored positioning hook                                         */
/* ------------------------------------------------------------------ */

function useAnchoredPosition(
    anchorSelector: string,
    offsetX: number,
    offsetY: number,
    viewportVersion: number,
): { x: number; y: number } | null {
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
    useLayoutEffect(() => {
        const anchor = findAnchor(anchorSelector);
        if (!anchor) {
            setPosition(null);
            return;
        }
        const rect = anchor.getBoundingClientRect();
        setPosition({
            x: rect.left + offsetX + window.scrollX,
            y: rect.top + offsetY + window.scrollY,
        });
    }, [anchorSelector, offsetX, offsetY, viewportVersion]);
    return position;
}

/* ------------------------------------------------------------------ */
/*  Pin                                                               */
/* ------------------------------------------------------------------ */

interface CommentPinProps {
    comment: Comment;
    isOpen: boolean;
    viewportVersion: number;
    onOpen: () => void;
    onClose: () => void;
    onDeleteComment: () => void;
    onAddReply: (text: string) => void | Promise<void>;
    onDeleteReply: (replyId: string) => void;
    onShowAnchorHighlight: () => void;
    onHideAnchorHighlight: () => void;
}

const CommentPin = ({
    comment,
    isOpen,
    viewportVersion,
    onOpen,
    onClose,
    onDeleteComment,
    onAddReply,
    onDeleteReply,
    onShowAnchorHighlight,
    onHideAnchorHighlight,
}: CommentPinProps) => {
    const color = useMemo(() => hashColor(comment.author), [comment.author]);
    const initial = useMemo(() => getInitial(comment.author), [comment.author]);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [placement, setPlacement] = useState<BubblePlacement>({
        side: "right",
        vertical: "up",
    });

    const position = useAnchoredPosition(
        comment.anchorSelector,
        comment.offsetX,
        comment.offsetY,
        viewportVersion,
    );

    useEffect(() => {
        if (!isOpen && !isHovered) return;
        const rect = containerRef.current?.getBoundingClientRect() ?? null;
        setPlacement(computeBubblePlacement(rect, ESTIMATED_THREAD_BUBBLE_HEIGHT));
    }, [isOpen, isHovered, position]);

    // Click outside closes the bubble
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current?.contains(e.target as Node)) return;
            onClose();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [isOpen, onClose]);

    if (!position) return null;

    const replyCount = comment.replies.length;

    return (
        <div
            ref={containerRef}
            style={{
                position: "absolute",
                left: position.x,
                top: position.y,
                width: 0,
                height: 0,
            }}
            className="pointer-events-auto"
            onMouseEnter={() => {
                setIsHovered(true);
                onShowAnchorHighlight();
            }}
            onMouseLeave={() => {
                setIsHovered(false);
                if (!isOpen) onHideAnchorHighlight();
            }}
        >
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    if (isOpen) onClose();
                    else onOpen();
                }}
                aria-label={`Comentário de ${comment.author}`}
                className={cx(
                    "absolute flex items-center justify-center rounded-full rounded-bl-none text-xs font-bold text-white shadow-lg transition duration-100 ease-linear hover:scale-110",
                    isOpen && "ring-2 ring-white",
                )}
                style={{
                    width: PIN_SIZE,
                    height: PIN_SIZE,
                    left: 0,
                    bottom: 0,
                    backgroundColor: color,
                }}
            >
                {initial}
                {replyCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary ring-1 ring-secondary">
                        {replyCount}
                    </span>
                )}
            </button>

            {/* Hover preview (only when not open) */}
            {isHovered && !isOpen && (
                <div
                    className="pointer-events-none absolute z-10 flex flex-col gap-1 rounded-lg bg-primary-solid px-3 py-2 text-xs text-white shadow-xl"
                    style={{
                        width: 220,
                        ...(placement.side === "right"
                            ? { left: PIN_SIZE + 8 }
                            : { right: PIN_SIZE + 8 }),
                        ...(placement.vertical === "up" ? { bottom: 0 } : { top: 0 }),
                    }}
                >
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold opacity-90">
                        <span>{comment.author}</span>
                        <span className="opacity-60">·</span>
                        <span className="opacity-60">{formatTimestamp(comment.createdAt)}</span>
                    </div>
                    <p className="line-clamp-3 whitespace-pre-wrap break-words">
                        {truncate(comment.text, 160)}
                    </p>
                    {replyCount > 0 && (
                        <span className="text-[10px] opacity-70">
                            {replyCount === 1 ? "1 resposta" : `${replyCount} respostas`}
                        </span>
                    )}
                </div>
            )}

            {/* Full thread bubble (on click) */}
            {isOpen && (
                <CommentThreadBubble
                    comment={comment}
                    placement={placement}
                    onClose={onClose}
                    onDeleteComment={onDeleteComment}
                    onAddReply={onAddReply}
                    onDeleteReply={onDeleteReply}
                />
            )}
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Thread bubble                                                     */
/* ------------------------------------------------------------------ */

interface CommentThreadBubbleProps {
    comment: Comment;
    placement: BubblePlacement;
    onClose: () => void;
    onDeleteComment: () => void;
    onAddReply: (text: string) => void | Promise<void>;
    onDeleteReply: (replyId: string) => void;
}

const CommentThreadBubble = ({
    comment,
    placement,
    onClose,
    onDeleteComment,
    onAddReply,
    onDeleteReply,
}: CommentThreadBubbleProps) => {
    const [replyText, setReplyText] = useState("");
    const replyInputRef = useRef<HTMLTextAreaElement | null>(null);

    const handleSubmitReply = async () => {
        const trimmed = replyText.trim();
        if (!trimmed) return;
        await onAddReply(trimmed);
        setReplyText("");
        replyInputRef.current?.focus();
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void handleSubmitReply();
        }
    };

    return (
        <div
            className="absolute z-10 flex max-h-[420px] flex-col gap-3 rounded-lg bg-primary p-3 shadow-xl ring-1 ring-border-secondary"
            style={{
                width: BUBBLE_WIDTH,
                ...(placement.side === "right"
                    ? { left: PIN_SIZE + 8 }
                    : { right: PIN_SIZE + 8 }),
                ...(placement.vertical === "up" ? { bottom: 0 } : { top: 0 }),
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <header className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-tertiary">
                    {comment.replies.length === 0
                        ? "Comentário"
                        : `Thread · ${comment.replies.length + 1} mensagens`}
                </span>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fechar"
                    className="rounded p-1 text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-fg-secondary"
                >
                    <XClose className="size-3.5" />
                </button>
            </header>

            <div className="flex max-h-72 flex-col gap-3 overflow-y-auto pr-1">
                <ThreadEntry
                    author={comment.author}
                    text={comment.text}
                    createdAt={comment.createdAt}
                    onDelete={onDeleteComment}
                />
                {comment.replies.map((reply) => (
                    <ThreadEntry
                        key={reply.id}
                        author={reply.author}
                        text={reply.text}
                        createdAt={reply.createdAt}
                        onDelete={() => onDeleteReply(reply.id)}
                    />
                ))}
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    void handleSubmitReply();
                }}
                className="flex flex-col gap-2 border-t border-secondary pt-3"
            >
                <textarea
                    ref={replyInputRef}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Responder..."
                    rows={2}
                    className="w-full resize-none rounded-md bg-secondary px-2 py-1.5 text-sm text-primary outline-none placeholder:text-placeholder focus:ring-2 focus:ring-brand"
                />
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={!replyText.trim()}
                        className="rounded-md bg-brand-solid px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
                    >
                        Responder
                    </button>
                </div>
            </form>
        </div>
    );
};

interface ThreadEntryProps {
    author: string;
    text: string;
    createdAt: string;
    onDelete: () => void;
}

const ThreadEntry = ({ author, text, createdAt, onDelete }: ThreadEntryProps) => {
    const color = useMemo(() => hashColor(author), [author]);
    const initial = useMemo(() => getInitial(author), [author]);
    return (
        <div className="group/entry flex gap-2">
            <span
                className="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: color }}
            >
                {initial}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center justify-between gap-1">
                    <div className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-xs font-semibold text-primary">
                            {author}
                        </span>
                        <span className="text-[10px] text-tertiary">·</span>
                        <span className="whitespace-nowrap text-[10px] text-tertiary">
                            {formatTimestamp(createdAt)}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onDelete}
                        aria-label="Excluir"
                        className="rounded p-0.5 text-fg-quaternary opacity-0 transition duration-100 ease-linear hover:bg-secondary hover:text-fg-secondary group-hover/entry:opacity-100 focus-visible:opacity-100"
                    >
                        <Trash01 className="size-3" />
                    </button>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm text-primary">{text}</p>
            </div>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Draft form                                                        */
/* ------------------------------------------------------------------ */

interface CommentDraftFormProps {
    anchorSelector: string;
    offsetX: number;
    offsetY: number;
    viewportVersion: number;
    onSubmit: (text: string) => void;
    onCancel: () => void;
}

const CommentDraftForm = ({
    anchorSelector,
    offsetX,
    offsetY,
    viewportVersion,
    onSubmit,
    onCancel,
}: CommentDraftFormProps) => {
    const [text, setText] = useState("");
    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [placement, setPlacement] = useState<BubblePlacement>({
        side: "right",
        vertical: "up",
    });

    const position = useAnchoredPosition(
        anchorSelector,
        offsetX,
        offsetY,
        viewportVersion,
    );

    // Focus the textarea as soon as it's mounted (position becomes non-null).
    useEffect(() => {
        if (!position) return;
        inputRef.current?.focus();
    }, [position]);

    useEffect(() => {
        const rect = containerRef.current?.getBoundingClientRect() ?? null;
        setPlacement(computeBubblePlacement(rect, ESTIMATED_DRAFT_HEIGHT));
    }, [position]);

    // Click outside cancels the draft
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current?.contains(e.target as Node)) return;
            onCancel();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onCancel]);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit(text);
        } else if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
        }
    };

    if (!position) return null;

    return (
        <div
            ref={containerRef}
            style={{ position: "absolute", left: position.x, top: position.y, width: 0, height: 0 }}
            className="pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
        >
            <div
                className="absolute flex items-center justify-center rounded-full rounded-bl-none bg-brand-solid text-xs font-bold text-white shadow-lg"
                style={{ width: PIN_SIZE, height: PIN_SIZE, left: 0, bottom: 0 }}
            >
                <MessageCircle01 className="size-4" />
            </div>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    onSubmit(text);
                }}
                className="absolute z-10 flex w-[260px] flex-col gap-2 rounded-lg bg-primary p-2 shadow-xl ring-1 ring-border-secondary"
                style={{
                    ...(placement.side === "right"
                        ? { left: PIN_SIZE + 8 }
                        : { right: PIN_SIZE + 8 }),
                    ...(placement.vertical === "up" ? { bottom: 0 } : { top: 0 }),
                }}
            >
                <textarea
                    ref={inputRef}
                    autoFocus
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Deixe um comentário..."
                    rows={3}
                    className="w-full resize-none rounded-md bg-secondary px-2 py-1.5 text-sm text-primary outline-none placeholder:text-placeholder focus:ring-2 focus:ring-brand"
                />
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-md px-2 py-1 text-xs font-medium text-secondary hover:bg-secondary"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={!text.trim()}
                        className="rounded-md bg-brand-solid px-2 py-1 text-xs font-semibold text-white disabled:opacity-40"
                    >
                        Comentar
                    </button>
                </div>
            </form>
        </div>
    );
};
