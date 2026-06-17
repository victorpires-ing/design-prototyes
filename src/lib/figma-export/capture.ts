/**
 * Captura a tela atual numa árvore JSON (CapturedScreen).
 *
 * Para cada elemento visível coleta rect + estilos; usa o fiber do React para
 * detectar a RAIZ de componentes do design system (sem alterar o DS) e marca
 * esses nós com a key da biblioteca Figma + variantes (registry). Filhos de um
 * nó DS não são percorridos — a instância no Figma já os contém.
 */

import { MenuTrigger as AriaMenuTrigger } from "react-aria-components";
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
 * Componentes compostos do DS (ex.: `EmptyState = Root`) reportam o nome interno
 * ("Root") no fiber, não o nome exportado. Reconhece-os pela ASSINATURA de
 * subcomponentes anexados na própria função (EmptyState.FeaturedIcon, .Footer…).
 */
function nomeCompound(type: unknown): string | null {
    if (!type || (typeof type !== "function" && typeof type !== "object")) return null;
    const t = type as Record<string, unknown>;
    if (t.FeaturedIcon && t.Footer && t.Content && t.Illustration) return "EmptyState";
    return null;
}

// Componentes cujo nome interno da função difere do exportado (ex.: `const X = XRoot`).
const ALIAS_DS: Record<string, string> = { MultiSelectRoot: "MultiSelect" };

/** Nome do componente DS para detecção (resolve compostos, aliases e refs do react-aria). */
function nomeDs(type: unknown): string | null {
    // react-aria-components têm nomes "mangled" — compara por REFERÊNCIA.
    if (type === AriaMenuTrigger) return "MenuTrigger";
    const nome = nomeCompound(type) || componentName(type);
    return (nome && ALIAS_DS[nome]) || nome;
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
        const name = nomeDs(f.type);
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

/** Abas (role="tab") dentro de um componente — labels + índice da ativa (para Tabs). */
function abasDoComponente(el: Element): { tabs?: string[]; tabActive?: number } {
    const els = Array.from(el.querySelectorAll('[role="tab"]'));
    const tabs = els.map((t) => (t.textContent ?? "").trim().replace(/\s+/g, " ")).filter(Boolean);
    if (!tabs.length) return {};
    const active = els.findIndex((t) => t.getAttribute("aria-selected") === "true");
    return { tabs, tabActive: active >= 0 ? active : 0 };
}

/** Lê color/theme do FeaturedIcon a partir do fiber (subindo do elemento). */
function propsFeaturedIcon(el: Element): { color?: string; theme?: string } {
    let f = getFiber(el);
    let depth = 0;
    while (f && depth < 6) {
        if (componentName(f.type) === "FeaturedIcon") {
            const p = (f.memoizedProps ?? {}) as Record<string, unknown>;
            return { color: typeof p.color === "string" ? p.color : undefined, theme: typeof p.theme === "string" ? p.theme : undefined };
        }
        f = f.return;
        depth++;
    }
    return {};
}

const HIERARQUIA_FIGMA: Record<string, string> = {
    primary: "Primary",
    secondary: "Secondary",
    tertiary: "Tertiary",
    "link-gray": "Link gray",
    "link-color": "Link color",
};

/** Hierarquia Figma (Primary/Secondary…) de um <button>, lida do prop `color` do componente Button. */
function hierarquiaBotao(el: Element): string | undefined {
    let f = getFiber(el);
    let depth = 0;
    while (f && depth < 6) {
        if (componentName(f.type) === "Button") {
            const color = String((f.memoizedProps ?? {}).color ?? "primary").replace(/-?destructive/, "") || "primary";
            return HIERARQUIA_FIGMA[color] ?? "Primary";
        }
        f = f.return;
        depth++;
    }
    return undefined;
}

// pattern do EmptyState.Header (decorativo) → Type do componente "Background pattern decorative".
const PATTERN_MAP: Record<string, string> = { circle: "Circles", square: "Squares", grid: "Grid", "grid-check": "Grid dot" };

/** Padrão de fundo decorativo (círculos/grid) do EmptyState.Header: tipo + rect relativo. */
function patternDoEmptyState(el: Element): { type: string; rect: Rect } | undefined {
    const base = el.getBoundingClientRect();
    const svgs = Array.from(el.querySelectorAll("svg")).filter((s) => !s.closest("[data-featured-icon]"));
    for (const svg of svgs) {
        let f = getFiber(svg);
        let depth = 0;
        while (f && depth < 6) {
            if (componentName(f.type) === "BackgroundPattern") {
                const p = String((f.memoizedProps ?? {}).pattern ?? "");
                const type = PATTERN_MAP[p];
                if (!type) return undefined;
                const r = svg.getBoundingClientRect();
                return { type, rect: { x: r.left - base.left, y: r.top - base.top, width: r.width, height: r.height } };
            }
            f = f.return;
            depth++;
        }
    }
    return undefined;
}

/** Conteúdo do Empty state: título (h1), descrição (p), ícone (featured + cor/tema), botões e padrão de fundo. */
function conteudoEmptyState(el: Element): {
    title?: string;
    desc?: string;
    icon?: string;
    iconColor?: string;
    iconTheme?: string;
    buttons: { text: string; hierarchy?: string; icon?: string }[];
    pattern?: { type: string; rect: Rect };
} {
    const txt = (sel: string) => (el.querySelector(sel)?.textContent ?? "").trim().replace(/\s+/g, " ") || undefined;
    const fiEl = el.querySelector("[data-featured-icon]");
    const svg = (fiEl && fiEl.querySelector("svg")) ?? el.querySelector("svg");
    const fp = fiEl ? propsFeaturedIcon(fiEl) : {};
    const buttons = Array.from(el.querySelectorAll("button, a[href]"))
        .map((b) => {
            const text = (b.textContent ?? "").trim().replace(/\s+/g, " ");
            return { text, hierarchy: hierarquiaBotao(b), icon: iconesDoComponente(b).iconLeading };
        })
        .filter((b) => b.text);
    return { title: txt("h1"), desc: txt("p"), icon: svg ? iconeDoNode(svg) || undefined : undefined, iconColor: fp.color, iconTheme: fp.theme, buttons, pattern: patternDoEmptyState(el) };
}

/** Opções de um listbox aberto (Select/MultiSelect): label, supporting, ícone, avatar, selecionado. */
function opcoesDoListbox(lb: Element): { label?: string; supportingText?: string; icon?: string; avatar?: boolean; selected?: boolean }[] {
    return Array.from(lb.querySelectorAll('[role="option"]')).map((op) => {
        // SelectItem: label = text-primary (font-medium), supporting = text-tertiary. O `slot` do
        // react-aria NÃO vira atributo no DOM, então detecta pela classe (que existe de fato).
        const labelEl = op.querySelector('[class*="text-primary"]');
        const descEl = op.querySelector('[class*="text-tertiary"]');
        const label = ((labelEl ?? op).textContent ?? "").trim().replace(/\s+/g, " ") || undefined;
        const supportingText = descEl ? (descEl.textContent ?? "").trim().replace(/\s+/g, " ") || undefined : undefined;
        const avatar = !!op.querySelector("img");
        const iconEl = op.querySelector("svg[data-icon]"); // só o ícone leading (o Check de selecionado não tem data-icon)
        const icon = !avatar && iconEl ? iconeDoNode(iconEl) || undefined : undefined;
        return { label, supportingText, icon, avatar, selected: op.getAttribute("aria-selected") === "true" };
    });
}

/** Conteúdo de Input/Select: label/hint dos props, valor/placeholder do campo, flags. */
function conteudoInput(el: Element, raw: Record<string, string | number | boolean>): {
    label?: string;
    hint?: string;
    value?: string;
    filled: boolean;
    disabled: boolean;
    required: boolean;
    destructive: boolean;
    help: boolean;
    icon?: string;
    open: boolean;
    options?: { label?: string; supportingText?: string; icon?: string; avatar?: boolean; selected?: boolean }[];
} {
    // <input>/<textarea> p/ Input; trigger de Select (botão/combobox) usa o texto selecionado.
    const campo = el.querySelector("input,textarea") as HTMLInputElement | HTMLTextAreaElement | null;
    let valor = "";
    let filled = false;
    if (campo) {
        valor = campo.value || campo.placeholder || "";
        filled = !!campo.value;
    } else {
        // Select: o valor visível fica no trigger ([data-rac] button / [role=button]).
        const trigger = el.querySelector("button,[role='button']");
        valor = (trigger?.textContent ?? "").trim().replace(/\s+/g, " ");
        filled = !!valor && !(typeof raw.placeholder === "string" && valor === raw.placeholder);
    }
    // Ícone leading REAL: só svg[data-icon] que vem ANTES do input/valor no DOM (descarta
    // help/validação/chevron à direita, que eram detectados como leading indevidamente).
    let icon: string | undefined;
    const ref = campo || el.querySelector("[class*='truncate']") || el.querySelector("button,[role='button']");
    if (ref) {
        for (const svg of Array.from(el.querySelectorAll("svg[data-icon]"))) {
            if (svg.compareDocumentPosition(ref) & Node.DOCUMENT_POSITION_FOLLOWING) {
                const nome = iconeDoNode(svg);
                if (nome && !/chevron|check/i.test(nome)) { icon = nome; break; }
            }
        }
    }
    // Aberto? (Select/MultiSelect) — captura as opções do listbox portado.
    const gatilho = el.querySelector('[aria-expanded]');
    const open = gatilho?.getAttribute("aria-expanded") === "true";
    let options: { label?: string; supportingText?: string; icon?: string; avatar?: boolean; selected?: boolean }[] | undefined;
    if (open) {
        const controls = gatilho?.getAttribute("aria-controls");
        const listbox = (controls && document.getElementById(controls)) || document.querySelector('[role="listbox"]');
        if (listbox) options = opcoesDoListbox(listbox);
    }
    return {
        label: typeof raw.label === "string" ? raw.label : undefined,
        hint: typeof raw.hint === "string" ? raw.hint : undefined,
        value: valor || undefined,
        filled,
        disabled: !!raw.isDisabled,
        required: !!raw.isRequired,
        destructive: !!raw.isInvalid,
        help: !!raw.tooltip,
        icon,
        open,
        options,
    };
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
// Não pulamos mais o top-layer inteiro: modais/slideouts abertos são capturados à
// parte (capturarOverlays). Toasts e tooltips continuam fora.
const SKIP_SELECTOR = '[data-fig-skip],[data-sonner-toaster],[role="tooltip"]';

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

    // Backstage: o elemento renderizado diretamente pelo BackstageLayout → componente Backstage
    // Template (rail/card/menu vêm do template; só o conteúdo da página entra no slot `content`).
    const pai = getFiber(el)?.return;
    if (pai && componentName(pai.type) === "BackstageLayout") {
        const props = primProps((pai.memoizedProps ?? {}) as Record<string, unknown>);
        const content = conteudoBackstage(el);
        const filhos = content ? [walk(content)].filter((n): n is CapturedNode => !!n).map(aplainar) : [];
        return {
            id,
            role: "ds",
            tag,
            rect,
            style,
            ds: { component: "BackstageTemplate", figmaKey: BACKSTAGE_TEMPLATE_KEY, slotContent: filhos, showEventDetail: props.showEventContext !== false },
            children: [],
        };
    }

    // Componente do DS?
    const ds = dsForNode(el);
    if (ds) {
        const entry = DS_REGISTRY[ds.name];
        const raw = primProps(ds.props);
        const resolved = entry.resolve ? entry.resolve(raw) : { properties: {} as Record<string, string | boolean> };
        const icones = iconesDoComponente(el);
        const abas = abasDoComponente(el);
        // Dropdown (MenuTrigger) → componente "Dropdown menu"; Type/Open/label/itens do trigger.
        const dd = ds.name === "MenuTrigger" ? conteudoDropdown(el) : null;
        return {
            id,
            role: "ds",
            tag,
            rect,
            style,
            ds: {
                component: dd ? "DropdownMenu" : ds.name,
                figmaKey: resolved.figmaKey ?? entry.figmaKey,
                properties: dd ? { Type: dd.tipo, Open: dd.aberto ? "True" : "False" } : resolved.properties,
                triggerLabel: dd?.label,
                dropdownItems: dd?.items,
                menuWidth: dd?.menuWidth,
                // só componentes rotuláveis (Button/Badge…) levam texto; senão concatena
                // tudo (ex.: Tabs juntaria todos os nomes numa linha só). Prefere o prop
                // (ex.: Toggle.label) ao textContent, que misturaria label + hint.
                text: entry.textProp
                    ? (typeof raw[entry.textProp] === "string" && raw[entry.textProp]
                          ? String(raw[entry.textProp])
                          : (el.textContent ?? "").trim().replace(/\s+/g, " "))
                          .slice(0, 200) || undefined
                    : undefined,
                supportingText: entry.hintProp && typeof raw[entry.hintProp] === "string" ? String(raw[entry.hintProp]).slice(0, 200) || undefined : undefined,
                iconLeading: icones.iconLeading,
                iconTrailing: icones.iconTrailing,
                tabs: abas.tabs,
                tabActive: abas.tabActive,
                crumbs:
                    ds.name === "Breadcrumbs"
                        ? Array.from(el.querySelectorAll("a,button"))
                              .map((c) => (c.textContent ?? "").trim().replace(/\s+/g, " "))
                              .filter((t) => t && t.length < 40)
                        : undefined,
                emptyState: ds.name === "EmptyState" ? conteudoEmptyState(el) : undefined,
                input: ["Input", "Select", "MultiSelect", "ComboBox"].includes(ds.name) ? conteudoInput(el, raw) : undefined,
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

    // Tabela nativa → componente Table do DS, montada por COLUNA no slot Content.
    if (tag === "table") {
        const tabela = extrairTabela(el);
        if (tabela.headers.length || tabela.rows.length) {
            return { id, role: "ds", tag, rect, style, ds: { component: "Table", figmaKey: TABLE_KEY, table: tabela }, children: [] };
        }
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
    // Frame vazio e sem valor visual = lixo de layout → descarta (reduz camadas vazias no import).
    if (children.length === 0 && frameSemValor(style, cls)) return null;
    return { id, role: "frame", tag, rect, style, cls, children };
}

/** Frame sem conteúdo nem aparência (bg/borda/raio/sombra/token) — não vale virar camada. */
function frameSemValor(style: CapturedStyle, cls?: string[]): boolean {
    if (style.backgroundColor || style.backgroundImage || style.borderWidth || style.borderRadius || style.boxShadow) return false;
    if (cls && cls.some((c) => /^(bg|border|ring|fill|stroke|outline)-/.test(c))) return false;
    return true;
}

// Wrapper "pass-through": frame sem valor visual com 1 filho só → pode ser colapsado.
function colapsavel(node: CapturedNode): boolean {
    if (node.role !== "frame" || !node.children || node.children.length !== 1) return false;
    const s = node.style;
    if (s.backgroundColor || s.borderWidth || s.borderRadius || s.boxShadow || (s.opacity != null && s.opacity < 1)) return false;
    if (s.paddingTop || s.paddingBottom || s.paddingLeft || s.paddingRight) return false; // padding posiciona o filho
    if (node.cls && node.cls.some((c) => /^(bg|border|ring|fill|stroke|outline)-/.test(c))) return false; // viraria token
    return true;
}

// Componentes do DS com slot que recebem o conteúdo do overlay.
const SLIDEOUT_KEY = "79f134bd264b89ac988dc52d04b63fd1107f8743"; // Slide out menu (slot "Panel")
const MODAL_KEY = "a78265d3ef38f1a52452e06a9a43b161b474f455"; // Modal (slot "Modal")
const TABLE_KEY = "df97aa4c20a4686e188a80288b0e376f0dd72b99"; // Table (slot "Content" = colunas)
const BACKSTAGE_TEMPLATE_KEY = "16a29e24192fc7a4af6a847e5c08db12bb1fa5da"; // Backstage Template (slots content/Modal/Panel)

/** Conteúdo da página dentro do BackstageLayout (o `children`): o filho visível que não é rail/menu. */
function conteudoBackstage(el: Element): Element | null {
    const inner = Array.from(el.children).find((c) => c.tagName === "DIV" && getComputedStyle(c).display !== "none");
    if (!inner) return null;
    return Array.from(inner.children).find((c) => c.tagName !== "ASIDE" && c.tagName !== "HEADER" && getComputedStyle(c).display !== "none") || null;
}

/** Extrai a tabela transposta: cabeçalhos (th) + linhas (td) como nós de célula + larguras. */
function extrairTabela(el: Element): { headers: CapturedNode[]; rows: CapturedNode[][]; colWidths: number[] } {
    const ths = Array.from(el.querySelectorAll("thead th, thead td"));
    const headers = ths.map((c) => walk(c)).filter((n): n is CapturedNode => !!n);
    let bodyRows = Array.from(el.querySelectorAll("tbody tr"));
    if (!bodyRows.length) bodyRows = Array.from(el.querySelectorAll("tr")).filter((tr) => tr.querySelector("td"));
    const rows = bodyRows.map((tr) =>
        Array.from(tr.children)
            .filter((c) => c.tagName === "TD" || c.tagName === "TH")
            .map((c) => walk(c))
            .filter((n): n is CapturedNode => !!n),
    );
    const colWidths = ths.map((c) => Math.round(c.getBoundingClientRect().width));
    return { headers, rows, colWidths };
}

/** Sobe até o filho direto do body (raiz do portal). null se não for portal no body. */
function raizDoPortal(el: Element, appRoot: Element | null): Element | null {
    let rootEl: Element = el;
    while (rootEl.parentElement && rootEl.parentElement !== document.body) rootEl = rootEl.parentElement;
    if (rootEl.parentElement !== document.body) return null;
    if (rootEl === appRoot || (appRoot && rootEl.contains(appRoot))) return null;
    return rootEl;
}

/**
 * Dropdown (Dropdown.Root = MenuTrigger): o `el` é o trigger. Type pelo trigger (texto →
 * Button simple, ícone → Icon simple), Open por aria-expanded, e — se aberto — os itens do
 * menu portado vão para o slot.
 */
function conteudoDropdown(el: Element): { tipo: string; aberto: boolean; label?: string; items?: { label?: string; icon?: string }[]; menuWidth?: number } {
    const aberto = el.getAttribute("aria-expanded") === "true";
    const label = (el.textContent ?? "").trim().replace(/\s+/g, " ");
    const tipo = label ? "Button simple" : "Icon simple";
    let items: { label?: string; icon?: string }[] | undefined;
    let menuWidth: number | undefined;
    const controls = el.getAttribute("aria-controls");
    const menu = (controls && document.getElementById(controls)) || document.querySelector('[role="menu"]');
    if (aberto && menu) {
        const itensEls = Array.from(menu.querySelectorAll('[role="menuitem"],[role="menuitemradio"],[role="menuitemcheckbox"]'));
        items = itensEls.map((it) => ({ label: (it.textContent ?? "").trim().replace(/\s+/g, " ") || undefined, icon: iconesDoComponente(it).iconLeading }));
        menuWidth = Math.round(menu.getBoundingClientRect().width);
    }
    return { tipo, aberto, label: label || undefined, items, menuWidth };
}

/**
 * slideout (anima da lateral) vs modal. Tenta pelo componente React (SlideoutMenu); como
 * muitos slideouts usam ModalOverlay/Modal/Dialog direto, cai num teste geométrico: painel
 * ancorado numa borda lateral ocupando quase toda a altura = slideout.
 */
function tipoOverlay(dialogEl: Element, overlayRoot: Element): "slideout" | "modal" {
    let f = getFiber(dialogEl);
    let depth = 0;
    while (f && depth < 14) {
        if (componentName(f.type) === "SlideoutMenu") return "slideout";
        f = f.return;
        depth++;
    }
    // Sinal por classe: SÓ na cadeia overlay→painel (o wrapper do ModalOverlay), nunca no
    // conteúdo — senão um footer com `justify-end` daria falso positivo. Slideout ancora o
    // painel numa borda (justify-end/start) ou anima de lado (slide-*-right/left).
    for (let el: Element | null = dialogEl; el && el !== overlayRoot.parentElement; el = el.parentElement) {
        const cls = el.getAttribute("class") || "";
        if (/(?:^|\s)justify-(end|start)(?:\s|$)|slide-(in-from|out-to)-(right|left)/.test(cls)) return "slideout";
    }
    // Geometria: painel encostado numa borda lateral, alto e estreito (tolera scrollbar).
    const r = dialogEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gapLateral = Math.min(r.left, vw - r.right);
    const margem = Math.max(8, vw * 0.04);
    if (r.height >= vh * 0.8 && gapLateral <= margem && r.width <= vw * 0.92) return "slideout";
    return "modal";
}

/**
 * Modais/slideouts abertos são portados pelo React Aria FORA do #root (direto no body).
 * Cada `[role="dialog"]` vira uma instância do componente DS correspondente (que já traz o
 * backdrop + chrome do painel), e o conteúdo interno do diálogo é injetado no SLOT.
 */
function capturarOverlays(): CapturedNode[] {
    const appRoot = document.getElementById("root");
    const vistos = new Set<Element>();
    const desktop = window.innerWidth >= 768;
    const out: CapturedNode[] = [];

    const conteudoSlot = (el: Element) =>
        Array.from(el.children)
            .map((c) => walk(c))
            .filter((n): n is CapturedNode => !!n)
            .map(aplainar);
    const nodeDeRect = (r: DOMRect): Rect => ({ x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height });

    // Modais e slideouts ([role=dialog]).
    for (const d of Array.from(document.querySelectorAll('[role="dialog"],[role="alertdialog"]'))) {
        const rootEl = raizDoPortal(d, appRoot);
        if (!rootEl || vistos.has(rootEl)) continue;
        vistos.add(rootEl);
        const tipo = tipoOverlay(d, rootEl);
        // Slideout: componente DS é só o painel → dimensiona pelo diálogo. Modal: componente é
        // tela cheia (backdrop + box) → dimensiona pelo overlay (viewport).
        const r = (tipo === "slideout" ? d : rootEl).getBoundingClientRect();
        out.push({
            id: `ov${contador++}`,
            role: "ds",
            tag: "div",
            rect: nodeDeRect(r),
            style: {},
            ds: {
                component: tipo === "slideout" ? "SlideoutMenu" : "Modal",
                figmaKey: tipo === "slideout" ? SLIDEOUT_KEY : MODAL_KEY,
                properties: { Type: "Placeholder", Breakpoint: desktop ? "Desktop" : "Mobile" },
                slotContent: conteudoSlot(d),
            },
            children: [],
        });
    }

    return out;
}

/** Achata wrappers redundantes (reduz aninhamento). Rects são absolutos, então é seguro. */
function aplainar(node: CapturedNode): CapturedNode {
    if (node.children && node.children.length) node.children = node.children.map(aplainar);
    if (colapsavel(node)) return node.children[0];
    return node;
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
        root: aplainar(node),
        overlays: capturarOverlays(),
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
