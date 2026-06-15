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
    /** Texto de apoio/hint (ex.: supporting text do Toggle/Checkbox). */
    supportingText?: string;
    /** Ícones dentro do componente (nome PascalCase) para setar os swaps no Figma. */
    iconLeading?: string;
    iconTrailing?: string;
    /** Labels das abas (para Tabs) — define quantas mostrar e o texto de cada. */
    tabs?: string[];
    /** Índice da aba ativa (aria-selected). */
    tabActive?: number;
    /** Rótulos dos itens de breadcrumb (Breadcrumbs) — define quantos mostrar e o texto. */
    crumbs?: string[];
    /** Conteúdo do Empty state (título, descrição, ícone + cor/tema, botões com texto/hierarquia/ícone). */
    emptyState?: {
        title?: string;
        desc?: string;
        icon?: string;
        iconColor?: string;
        iconTheme?: string;
        buttons: { text: string; hierarchy?: string; icon?: string }[];
        /** Padrão de fundo decorativo (Background pattern decorative): tipo + rect relativo ao empty state. */
        pattern?: { type: string; rect: Rect };
    };
    /** Conteúdo de Input/Select: label, hint, valor/placeholder, flags (o State é resolvido no plugin). */
    input?: {
        label?: string;
        hint?: string;
        value?: string;
        filled?: boolean;
        disabled?: boolean;
        required?: boolean;
        destructive?: boolean;
        help?: boolean;
        /** Ícone leading real do campo (svg antes do input/valor). */
        icon?: string;
        /** Select/MultiSelect aberto: estado + opções do listbox para popular o slot. */
        open?: boolean;
        options?: { label?: string; supportingText?: string; icon?: string; avatar?: boolean; selected?: boolean }[];
    };
    /** Conteúdo a injetar no SLOT do componente (ex.: painel do slideout/modal). */
    slotContent?: CapturedNode[];
    /** Tabela: cabeçalhos + linhas (nós de célula) + larguras, para montar por coluna no slot Content. */
    table?: { headers: CapturedNode[]; rows: CapturedNode[][]; colWidths: number[] };
    /** Backstage Template: liga "Show Event Detail" (card + funcionalidades) conforme showEventContext. */
    showEventDetail?: boolean;
    /** Dropdown: rótulo do trigger (quando Type="Button simple"). */
    triggerLabel?: string;
    /** Dropdown: largura real do menu aberto (para redimensionar a frame "Menu"). */
    menuWidth?: number;
    /** Dropdown aberto: itens (label + ícone) para popular o slot clonando o item do DS. */
    dropdownItems?: { label?: string; icon?: string }[];
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
    /** Modais/slideouts abertos (portal fora do #root) — reconstruídos por cima da tela. */
    overlays?: CapturedNode[];
}
