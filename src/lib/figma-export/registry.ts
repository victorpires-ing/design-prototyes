/**
 * Registro componente React (do Untitled UI / AFTER DS) → componente da
 * biblioteca Figma. As keys vêm do catálogo `AFTER-DS-v8-reference.md`.
 *
 * Cada entrada resolve, a partir das props do React, qual key usar (alguns
 * casos trocam de componente — ex.: botão destrutivo) e as variantes Figma já
 * com os nomes/capitalização corretos. O mapeamento é best-effort e será
 * refinado na fase de reconstrução (figma_execute).
 */

type Primitivos = Record<string, string | number | boolean>;

export interface RegistryEntry {
    /** Key padrão do componente (set) na biblioteca. */
    figmaKey: string;
    /** Resolve key (opcional, p/ trocar de componente) + variantes Figma. */
    resolve?: (props: Primitivos) => { figmaKey?: string; properties: Record<string, string | boolean> };
    /** Prop de texto principal (fallback usa o textContent do nó). */
    textProp?: string;
    /** Prop de texto de apoio (ex.: "hint" do Toggle/Checkbox → supporting text). */
    hintProp?: string;
}

const cap = (s: unknown) => {
    const v = String(s ?? "");
    return v.charAt(0).toUpperCase() + v.slice(1);
};

/** key do Button e do Button destructive (AFTER DS v8). */
const BUTTON_KEY = "2d37a217ed291969764da354115c7c73592b2047";
const BUTTON_DESTRUCTIVE_KEY = "9c0b31214310bb70dd5a1aa24286620d91a8adfb";
const BUTTON_UTILITY_KEY = "9cec40eae26130492ccfa8fd76b7769a4e12fe0e";

const HIERARQUIA: Record<string, string> = {
    primary: "Primary",
    secondary: "Secondary",
    tertiary: "Tertiary",
    "link-gray": "Link gray",
    "link-color": "Link color",
};

export const DS_REGISTRY: Record<string, RegistryEntry> = {
    Button: {
        figmaKey: BUTTON_KEY,
        textProp: "children",
        resolve: (p) => {
            const color = String(p.color ?? "primary");
            const destructive = color.includes("destructive");
            const base = color.replace("-destructive", "").replace("destructive", "") || "primary";
            return {
                figmaKey: destructive ? BUTTON_DESTRUCTIVE_KEY : BUTTON_KEY,
                properties: {
                    Size: String(p.size ?? "sm"),
                    Hierarchy: destructive ? cap(base === "link" ? "Link" : base) : HIERARQUIA[base] ?? "Primary",
                    State: p.isDisabled ? "Disabled" : p.isLoading ? "Loading" : "Default",
                },
            };
        },
    },

    Input: {
        // Variantes só Size/Type aqui; State, Destructive, booleans (#) e textos são
        // aplicados no plugin via `ds.input` (as keys têm sufixo #id e não casam aqui).
        figmaKey: "aa8e6d0ec44345c6942f05e820b6e6bb5a7b45a9", // Input field
        resolve: (p) => ({ properties: { Size: String(p.size ?? "md"), Type: "Default" } }),
    },

    TextArea: {
        figmaKey: "1b1b09fd1c2c16a958f1f08c7f0e1eab6ee1bd4f", // Textarea input field
        resolve: (p) => ({ properties: { Size: String(p.size ?? "md"), Label: Boolean(p.label) } }),
    },

    Badge: {
        figmaKey: "389f60cc5418361a548e04c81d296c08d4879966",
        textProp: "children",
        resolve: (p) => ({
            properties: {
                Size: String(p.size ?? "md"),
                Type:
                    String(p.type ?? "pill-color") === "modern"
                        ? "Badge modern"
                        : String(p.type) === "color"
                          ? "Badge color"
                          : "Pill color",
                Color: cap(p.color ?? "gray"),
            },
        }),
    },

    Checkbox: {
        figmaKey: "b1c045937a4fa80ac59ef95fd9c2b53aea4ffef2",
        textProp: "label",
        hintProp: "hint",
        resolve: (p) => ({
            properties: {
                Size: String(p.size ?? "sm"),
                Type: "Checkbox",
                Checked: p.isSelected ? "True" : "False",
                Text: p.label ? "True" : "False",
            },
        }),
    },

    Toggle: {
        figmaKey: "7e1137caa29d983cff39734b683a2a26ad3cdbc6",
        textProp: "label",
        hintProp: "hint",
        resolve: (p) => ({
            properties: {
                Size: String(p.size ?? "sm"),
                Type: p.slim ? "Slim" : "Default",
                Pressed: p.isSelected ? "True" : "False",
                Text: p.label ? "True" : "False",
            },
        }),
    },

    Select: {
        // Como o Input: State/booleans(#)/textos/Type vão no plugin via `ds.input`.
        figmaKey: "88ffeac8b589f30591ca2cad9b35b0819d513204",
        resolve: (p) => ({ properties: { Size: String(p.size ?? "md") } }),
    },
    // Select com busca → mesmo componente Select, Type=Search.
    ComboBox: {
        figmaKey: "88ffeac8b589f30591ca2cad9b35b0819d513204",
        resolve: (p) => ({ properties: { Size: String(p.size ?? "md"), Type: "Search" } }),
    },

    Avatar: {
        figmaKey: "7c32f15986f1ee10948cebfec0f5c11d834d0046",
        resolve: (p) => ({ properties: { Size: String(p.size ?? "md") } }),
    },

    ButtonUtility: {
        figmaKey: BUTTON_UTILITY_KEY, // Button utility
        resolve: (p) => ({
            properties: {
                Size: String(p.size ?? "sm"),
                Hierarchy: cap(p.color === "tertiary" ? "Tertiary" : "Secondary"),
                State: p.isDisabled ? "Disabled" : "Default",
            },
        }),
    },
    // Botão de fechar (X) de modais/slideouts → Button utility tertiary, ícone X.
    CloseButton: {
        figmaKey: BUTTON_UTILITY_KEY,
        resolve: (p) => ({ properties: { Size: String(p.size) === "xs" ? "xs" : "sm", Hierarchy: "Tertiary", State: p.isDisabled ? "Disabled" : "Default" } }),
    },
    // Dropdown (Dropdown.Root = MenuTrigger) → componente "Dropdown menu". O Type (Button
    // simple / Icon simple), o Open, o label e os itens do menu são resolvidos no walk/plugin.
    MenuTrigger: {
        figmaKey: "c87574185690cb37605497d59cc9c2fffb65635e", // Dropdown menu (slot "menu itens")
    },
    Tabs: {
        figmaKey: "ff9d82fe902844625590609dc67637b52e3fd353", // Horizontal tabs
        resolve: (p) => ({ properties: { Type: "Underline", Size: String(p.size ?? "md") } }),
    },
    Tooltip: { figmaKey: "611aa738824d17202e60040dcc84d719e0678968" },
    Tag: { figmaKey: "9d5dd8725623305826e714d338077c3faa0176dd", textProp: "children" },

    /* ---- Base: progress / slider ---- */
    ProgressBar: { figmaKey: "505f93bb8550d8341e3893060bcb5d2875f96695" }, // Progress bar (variante default)
    ProgressBarCircle: {
        figmaKey: "05c064ba1ce9f0a2f2a1e6aecc009b3f3c7ff43a", // Progress circle
        resolve: (p) => ({ properties: { Size: String(p.size ?? "md"), Shape: "Circle" } }),
    },
    ProgressBarHalfCircle: {
        figmaKey: "05c064ba1ce9f0a2f2a1e6aecc009b3f3c7ff43a",
        resolve: (p) => ({ properties: { Size: String(p.size ?? "md"), Shape: "Half circle" } }),
    },
    Slider: { figmaKey: "31b288b55f65bca1b5adbae967ae58aaee5e4377" }, // Slider (variante default)

    /* ---- Foundations ---- */
    FeaturedIcon: {
        figmaKey: "d162cb944e7da79f0acd10330365d53f45fcfded", // Featured icon (set)
        resolve: (p) => {
            const theme = String(p.theme ?? "light");
            const size = String(p.size ?? "sm");
            const color = cap(p.color ?? "brand");
            if (theme === "outline") {
                return { figmaKey: "53c214f7c0f2e8af59fbe23affc6dac0ae21001e", properties: { Size: size, Color: color } }; // Featured icon outline
            }
            const tipo = { light: "Light", gradient: "Gradient", dark: "Dark", modern: "Modern", "modern-neue": "Modern neue" }[theme] ?? "Light";
            return { properties: { Size: size, Color: color, Type: tipo } };
        },
    },
    RatingBadge: { figmaKey: "592c4b4335f269e29923fd0da5bcae06e3917bd1" }, // Ratings badge

    /* ---- Badges (variantes) ---- */
    BadgeWithDot: {
        figmaKey: "389f60cc5418361a548e04c81d296c08d4879966",
        textProp: "children",
        resolve: (p) => ({ properties: { Size: String(p.size ?? "md"), Type: "Pill color", Icon: "Dot", Color: cap(p.color ?? "gray") } }),
    },
    BadgeWithIcon: {
        figmaKey: "389f60cc5418361a548e04c81d296c08d4879966",
        textProp: "children",
        resolve: (p) => ({ properties: { Size: String(p.size ?? "md"), Type: "Pill color", Icon: "Icon leading", Color: cap(p.color ?? "gray") } }),
    },
    BadgeWithFlag: {
        figmaKey: "389f60cc5418361a548e04c81d296c08d4879966",
        textProp: "children",
        resolve: (p) => ({ properties: { Size: String(p.size ?? "md"), Type: "Pill color", Icon: "Country", Color: cap(p.color ?? "gray") } }),
    },
    BadgeGroup: { figmaKey: "1eb96594f8ba995b7dbb1d7e72857262253cbce0" },

    /* ---- Select / Radio / Button group ---- */
    MultiSelect: {
        figmaKey: "b3d6fd027c7363743a1c0addd3de0a1078e91e08",
        resolve: (p) => ({ properties: { Size: String(p.size ?? "md") } }),
    },
    RadioGroup: { figmaKey: "a9926f5c3d36b13270c66313b75ddfa7cda95b56" },
    RadioButton: {
        figmaKey: "23340edcb954b134cbcc74f4f5d11fcd49fe3556", // Radio group item
        resolve: (p) => ({ properties: { Size: String(p.size ?? "sm"), Selected: p.isSelected ? "True" : "False" } }),
    },
    ButtonGroup: {
        figmaKey: "4a02a1d1fbd052d97377d8636833dd3984dcf03c",
        resolve: (p) => ({ properties: { Size: String(p.size ?? "md") } }),
    },

    /* ---- Application ---- */
    EmptyState: { figmaKey: "a3b99687129f19a051b5039ebe040ea6faf6fec4" },

    // Alert (full-width / floating) — Color do prop, Breakpoint Desktop.
    AlertFloating: {
        figmaKey: "79d4e3661aaed18c99ca013afa72aadd3fafa8ac",
        resolve: (p) => ({ properties: { Color: cap(p.color ?? "gray"), Size: "Floating", Breakpoint: "Desktop" } }),
    },
    AlertFullWidth: {
        figmaKey: "79d4e3661aaed18c99ca013afa72aadd3fafa8ac",
        resolve: (p) => ({ properties: { Color: cap(p.color ?? "gray"), Size: "Full-width", Breakpoint: "Desktop" } }),
    },

    // Pagination (a barra). Sub-exports (Card/Page/ButtonGroup/Dot) caem aqui no default Page.
    Pagination: {
        figmaKey: "2e24e5b674946e159b516774f6b7199eb91b33a2",
        resolve: () => ({ properties: { Type: "Page default", Shape: "Circle", Breakpoint: "Desktop" } }),
    },
    PaginationPageDefault: { figmaKey: "2e24e5b674946e159b516774f6b7199eb91b33a2", resolve: () => ({ properties: { Type: "Page default", Shape: "Circle", Breakpoint: "Desktop" } }) },
    PaginationCardDefault: { figmaKey: "2e24e5b674946e159b516774f6b7199eb91b33a2", resolve: () => ({ properties: { Type: "Card default", Shape: "Square", Breakpoint: "Desktop" } }) },
    PaginationButtonGroup: { figmaKey: "2e24e5b674946e159b516774f6b7199eb91b33a2", resolve: () => ({ properties: { Type: "Card button group right aligned", Shape: "Square", Breakpoint: "Desktop" } }) },
    PaginationDot: { figmaKey: "c372a7340596868a878937712a2772436445563b", resolve: (p) => ({ properties: { Size: String(p.size ?? "md"), Style: "Dot", Framed: "False" } }) },

    ContentDivider: {
        figmaKey: "17467249c4570728e56a3323a0adc867db2281f1",
        resolve: () => ({ properties: { Type: "Text", Style: "Single line" } }),
    },
    Breadcrumbs: {
        figmaKey: "bdfd9d63807a972d892dc4d6e88e84cfdc0ec015",
        resolve: (p) => ({
            properties: {
                Type: { text: "Text", "text-line": "Text with line", button: "Button" }[String(p.type ?? "text")] ?? "Text",
                Divider: String(p.divider ?? "chevron") === "slash" ? "Slash" : "Chevron",
                Breakpoint: "Desktop",
            },
        }),
    },
    LoadingIndicator: {
        figmaKey: "d1f3eaa3b31184faf1e3b7de19e6fa37201fdead",
        resolve: (p) => ({ properties: { Style: "Line simple", Size: String(p.size ?? "md") } }),
    },
    MetricsSimple: { figmaKey: "5f2e67f1c889afd93cb36212bfd57aba9e11f252", resolve: () => ({ properties: { Type: "Simple" } }) },
    MetricsIcon01: { figmaKey: "5f2e67f1c889afd93cb36212bfd57aba9e11f252", resolve: () => ({ properties: { Type: "Icon 01" } }) },
    MetricsIcon02: { figmaKey: "5f2e67f1c889afd93cb36212bfd57aba9e11f252", resolve: () => ({ properties: { Type: "Icon 02" } }) },
    MetricsIcon03: { figmaKey: "5f2e67f1c889afd93cb36212bfd57aba9e11f252", resolve: () => ({ properties: { Type: "Icon 03" } }) },

    // Nota: rail/card/menu do Backstage NÃO são componentes publicados isoladamente
    // (só existem dentro do "Backstage Template"), então NÃO entram aqui — senão a
    // captura podaria os filhos e o import viria vazio. São reconstruídos como frames.
    // Tabela ("Table" set df97aa4c…) tem estrutura muito diferente do React — tratar à parte.
};

/** Nomes de componentes que o capture deve reconhecer. */
export const DS_NAMES = new Set(Object.keys(DS_REGISTRY));
