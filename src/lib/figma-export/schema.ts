/**
 * Schema da árvore capturada do app, que será reconstruída no Figma.
 *
 * É um espelho semântico do DOM renderizado: cada nó traz posição, estilo e —
 * quando é a raiz de um componente do design system (detectado via fiber do
 * React) — a marcação `ds` com a key da biblioteca Figma e as variantes.
 */

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** Subconjunto de estilos computados que sabemos traduzir para o Figma. */
export interface CapturedStyle {
    display?: string;
    flexDirection?: string;
    flexWrap?: string;
    gap?: number;
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    alignItems?: string;
    justifyContent?: string;

    backgroundColor?: string; // rgba
    backgroundImage?: string; // url(...) ou gradiente
    color?: string; // cor do texto (rgba)
    opacity?: number;

    borderWidth?: number;
    borderColor?: string; // rgba
    borderRadius?: number;
    boxShadow?: string;

    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    lineHeight?: number; // px
    letterSpacing?: number; // px
    textAlign?: string;
}

/** Marcação de componente do design system (raiz detectada via fiber). */
export interface DsMark {
    /** Nome do componente React (ex.: "Button"). */
    component: string;
    /** Key do componente na biblioteca Figma (AFTER DS v8). */
    figmaKey: string;
    /** Propriedades de variante já traduzidas para o Figma (ex.: { Size: "md" }). */
    properties: Record<string, string | boolean>;
    /** Texto principal do componente (para preencher slots de label). */
    text?: string;
    /** Ícones dentro do componente (nome PascalCase) para setar os swaps no Figma. */
    iconLeading?: string;
    iconTrailing?: string;
    /** Props primitivas originais do React (debug / refino do mapeamento). */
    rawProps?: Record<string, string | number | boolean>;
}

export type CapturedRole = "ds" | "frame" | "text" | "image" | "icon";

export interface CapturedNode {
    id: string;
    role: CapturedRole;
    tag: string;
    rect: Rect;
    style: CapturedStyle;
    /** Classes utilitárias de cor (bg-/text-/fg-/border-/ring-…) — o token exato, sem ambiguidade. */
    cls?: string[];
    /** Conteúdo textual quando role === "text". */
    text?: string;
    /** URL da imagem quando role === "image". */
    src?: string;
    /** Nome do ícone (PascalCase, ex.: "BarChartSquare02") quando role === "icon". */
    icon?: string;
    /** Presente quando role === "ds": filhos NÃO são capturados (a instância já os tem). */
    ds?: DsMark;
    children: CapturedNode[];
}

export interface CapturedScreen {
    /** Rota/pathname capturado. */
    pathname: string;
    /** Viewport no momento da captura. */
    viewport: { width: number; height: number };
    capturadoEm: string;
    /** Tabela de tokens de cor do :root (nome → valor resolvido), para bind exato no Figma. */
    tokens: Record<string, string>;
    root: CapturedNode;
}
