/**
 * Captura a tela atual numa árvore JSON (CapturedScreen).
 *
 * Para cada elemento visível coleta rect + estilos; usa o fiber do React para
 * detectar a RAIZ de componentes do design system (sem alterar o DS) e marca
 * esses nós com a key da biblioteca Figma + variantes (registry). Filhos de um
 * nó DS não são percorridos — a instância no Figma já os contém.
 */

import { DS_NAMES, DS_REGISTRY } from "./registry";
import type { CapturedNode, CapturedScreen, CapturedStyle, Rect } from "./schema";

/* ----------------------------- fiber ----------------------------- */

type Fiber = { type: unknown; return: Fiber | null; memoizedProps: Record<string, unknown> | null };

function getFiber(el: Element): Fiber | null {
    const key = Object.keys(el).find((k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"));
    return key ? ((el as unknown as Record<string, Fiber>)[key] ?? null) : null;
}

function componentName(type: unknown): string | null {
    if (!type) return null;
    if (typeof type === "function") return (type as { displayName?: string; name?: string }).displayName || (type as { name?: string }).name || null;
    if (typeof type === "object") {
        const t = type as { displayName?: string; render?: unknown; type?: unknown };
        if (t.displayName) return t.displayName;
        if (t.render) return componentName(t.render); // forwardRef
        if (t.type) return componentName(t.type); // memo
    }
    return null;
}

/**
 * Sobe a partir do host até o primeiro outro host; entre os componentes nesse
 * trecho, retorna o MAIS EXTERNO que está no registro. Assim ButtonUtility (que
 * envolve Button por dentro) vence o Button interno.
 */
function dsForNode(el: Element): { name: string; props: Record<string, unknown> } | null {
    const host = getFiber(el);
    if (!host) return null;
    let f = host.return;
    let achado: { name: string; props: Record<string, unknown> } | null = null;
    while (f) {
        if (typeof f.type === "string") break; // outro nó DOM → para
        const name = componentName(f.type);
        if (name && DS_NAMES.has(name)) achado = { name, props: f.memoizedProps ?? {} };
        f = f.return;
    }
    return achado;
}

/** Nome do componente de ícone que renderiza este <svg> (ex.: "BarChartSquare02"). */
function iconeDoNode(el: Element): string | null {
    let f = getFiber(el);
    if (!f) return null;
    f = f.return;
    let depth = 0;
    while (f && depth < 4) {
        if (typeof f.type === "string") break;
        const name = componentName(f.type);
        if (name && /^[A-Z]/.test(name) && !DS_NAMES.has(name)) return name;
        f = f.return;
        depth++;
    }
    return null;
}

/** Ícones leading/trailing dentro de um componente DS (para setar os swaps no Figma). */
function iconesDoComponente(el: Element): { iconLeading?: string; iconTrailing?: string } {
    const svgs = Array.from(el.querySelectorAll("svg"));
    if (!svgs.length) return {};
    let textX: number | null = null;
    const txt = Array.from(el.querySelectorAll("*")).find((n) => n.children.length === 0 && (n.textContent ?? "").trim());
    if (txt) textX = txt.getBoundingClientRect().left;
    const res: { iconLeading?: string; iconTrailing?: string } = {};
    for (const svg of svgs) {
        const nome = iconeDoNode(svg);
        if (!nome) continue;
        const x = svg.getBoundingClientRect().left;
        if (textX == null || x < textX) res.iconLeading = res.iconLeading || nome;
        else res.iconTrailing = res.iconTrailing || nome;
    }
    return res;
}

function primProps(props: Record<string, unknown>): Record<string, string | number | boolean> {
    const out: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(props)) {
        if (k === "children" || k === "className" || k === "class") continue;
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") out[k] = v;
    }
    return out;
}

/* ----------------------------- estilo ----------------------------- */

const px = (v: string): number => parseFloat(v) || 0;
const naoTransparente = (c: string) => c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent";

function styleSubset(cs: CSSStyleDeclaration, rect: Rect): CapturedStyle {
    const s: CapturedStyle = {};
    const flex = cs.display.includes("flex");
    s.display = cs.display;
    if (flex) {
        s.flexDirection = cs.flexDirection;
        if (cs.flexWrap !== "nowrap") s.flexWrap = cs.flexWrap;
        const gap = px(cs.columnGap) || px(cs.rowGap) || px(cs.gap);
        if (gap) s.gap = gap;
        if (cs.alignItems && cs.alignItems !== "normal") s.alignItems = cs.alignItems;
        if (cs.justifyContent && cs.justifyContent !== "normal") s.justifyContent = cs.justifyContent;
    }
    if (px(cs.paddingTop)) s.paddingTop = px(cs.paddingTop);
    if (px(cs.paddingRight)) s.paddingRight = px(cs.paddingRight);
    if (px(cs.paddingBottom)) s.paddingBottom = px(cs.paddingBottom);
    if (px(cs.paddingLeft)) s.paddingLeft = px(cs.paddingLeft);

    if (naoTransparente(cs.backgroundColor)) s.backgroundColor = cs.backgroundColor;
    if (cs.backgroundImage && cs.backgroundImage !== "none") s.backgroundImage = cs.backgroundImage;
    if (+cs.opacity < 1) s.opacity = +cs.opacity;

    const bw = px(cs.borderTopWidth);
    if (bw > 0 && naoTransparente(cs.borderTopColor)) {
        s.borderWidth = bw;
        s.borderColor = cs.borderTopColor;
    }
    const br = px(cs.borderTopLeftRadius);
    if (br > 0) s.borderRadius = br;
    if (cs.boxShadow && cs.boxShadow !== "none") s.boxShadow = cs.boxShadow;

    s.color = cs.color;
    s.fontFamily = cs.fontFamily;
    s.fontSize = px(cs.fontSize);
    s.fontWeight = +cs.fontWeight || 400;
    if (cs.lineHeight && cs.lineHeight !== "normal") s.lineHeight = px(cs.lineHeight);
    if (px(cs.letterSpacing)) s.letterSpacing = px(cs.letterSpacing);
    if (cs.textAlign && cs.textAlign !== "start") s.textAlign = cs.textAlign;

    void rect;
    return s;
}

/* ----------------------------- walk ----------------------------- */

const SKIP_TAGS = new Set(["script", "style", "noscript", "br"]);
const SKIP_SELECTOR = "[data-fig-skip],[data-react-aria-top-layer],[data-sonner-toaster]";

function deveIgnorar(el: Element): boolean {
    if (SKIP_TAGS.has(el.tagName.toLowerCase())) return true;
    if (el.closest(SKIP_SELECTOR)) return true;
    return false;
}

// Classes de token (cor + spacing) — o token exato. Ignora modificadores (hover:, dark:, md:)
// e valores arbitrários (bg-[#fff], p-[10px]).
const TOKEN_PREFIX = /^(bg|text|fg|border|ring|fill|stroke|outline|p|px|py|pt|pb|pl|pr|gap)-/;
function classesDeCor(el: Element): string[] | undefined {
    const raw = el.getAttribute && el.getAttribute("class");
    if (!raw) return undefined;
    const out = raw
        .split(/\s+/)
        .filter((c) => c && c.indexOf(":") < 0 && c.indexOf("[") < 0 && TOKEN_PREFIX.test(c));
    return out.length ? out : undefined;
}

function textoDireto(el: Element): string | null {
    if (el.children.length > 0) return null;
    const t = (el.textContent ?? "").trim().replace(/\s+/g, " ");
    return t || null;
}

let contador = 0;

function walk(el: Element): CapturedNode | null {
    if (deveIgnorar(el)) return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return null;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) return null;

    const rect: Rect = { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height };
    const style = styleSubset(cs, rect);
    const id = `n${contador++}`;
    const tag = el.tagName.toLowerCase();

    // Componente do DS?
    const ds = dsForNode(el);
    if (ds) {
        const entry = DS_REGISTRY[ds.name];
        const raw = primProps(ds.props);
        const resolved = entry.resolve ? entry.resolve(raw) : { properties: {} as Record<string, string | boolean> };
        const icones = iconesDoComponente(el);
        return {
            id,
            role: "ds",
            tag,
            rect,
            style,
            ds: {
                component: ds.name,
                figmaKey: resolved.figmaKey ?? entry.figmaKey,
                properties: resolved.properties,
                // só componentes rotuláveis (Button/Badge…) levam texto; senão concatena
                // tudo (ex.: Tabs juntaria todos os nomes numa linha só).
                text: entry.textProp ? (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 200) || undefined : undefined,
                iconLeading: icones.iconLeading,
                iconTrailing: icones.iconTrailing,
                rawProps: raw,
            },
            children: [],
        };
    }

    if (tag === "img") {
        return { id, role: "image", tag, rect, style, src: (el as HTMLImageElement).currentSrc || (el as HTMLImageElement).src, children: [] };
    }

    // Ícone (svg): folha. Captura o NOME do ícone (via fiber) p/ instanciar no Figma.
    if (tag === "svg") {
        const icone = iconeDoNode(el);
        return { id, role: icone ? "icon" : "frame", tag, rect, style, cls: classesDeCor(el), icon: icone || undefined, children: [] };
    }

    const cls = classesDeCor(el);
    const texto = textoDireto(el);
    const ehCelula = tag === "td" || tag === "th";
    if (texto && ehCelula) {
        // Célula com texto: frame (mantém bg/borda/padding) + filho de texto recuado pelo padding.
        const pl = style.paddingLeft ?? 0;
        const pt = style.paddingTop ?? 0;
        const filho: CapturedNode = {
            id: `${id}t`,
            role: "text",
            tag: "span",
            rect: { x: rect.x + pl, y: rect.y + pt, width: Math.max(1, rect.width - pl - (style.paddingRight ?? 0)), height: Math.max(1, rect.height - pt - (style.paddingBottom ?? 0)) },
            style,
            cls,
            text: texto,
            children: [],
        };
        return { id, role: "frame", tag, rect, style, cls, children: [filho] };
    }
    if (texto) {
        return { id, role: "text", tag, rect, style, cls, text: texto, children: [] };
    }

    const children: CapturedNode[] = [];
    for (const child of Array.from(el.children)) {
        const node = walk(child);
        if (node) children.push(node);
    }
    return { id, role: "frame", tag, rect, style, cls, children };
}

/** Lê os tokens de cor do :root (nome → valor resolvido) para bind exato no Figma. */
function capturarTokens(): Record<string, string> {
    const out: Record<string, string> = {};
    const cs = getComputedStyle(document.documentElement);
    for (let i = 0; i < cs.length; i++) {
        const prop = cs[i];
        if (prop.startsWith("--color")) {
            const val = cs.getPropertyValue(prop).trim();
            if (val) out[prop] = val;
        }
    }
    return out;
}

/** Captura a árvore a partir de um elemento raiz (default: #root ou body). */
export function capturarTela(rootEl?: Element): CapturedScreen | null {
    contador = 0;
    const root = rootEl ?? document.getElementById("root") ?? document.body;
    const node = walk(root);
    if (!node) return null;
    return {
        pathname: window.location.pathname,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        capturadoEm: new Date().toISOString(),
        tokens: capturarTokens(),
        root: node,
    };
}

/** Conta nós e componentes DS reconhecidos (para feedback). */
export function resumo(screen: CapturedScreen): { nos: number; ds: number } {
    let nos = 0;
    let ds = 0;
    const visita = (n: CapturedNode) => {
        nos++;
        if (n.role === "ds") ds++;
        n.children.forEach(visita);
    };
    visita(screen.root);
    return { nos, ds };
}
