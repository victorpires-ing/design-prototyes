/**
 * Gera um critério de clique estável para o elemento clicado, usado na captura
 * interativa de critérios de sucesso. Estratégia (best-effort, suficiente para protótipos):
 *   0. sobe até o elemento interativo mais próximo (botão, link...), não o <span> interno
 *   1. id estável → `#id` (ids gerados pelo React Aria/React mudam a cada carga e são ignorados)
 *   2. data-testid / data-test → `[data-testid="..."]`
 *   3. aria-label → `[aria-label="..."]`
 *   4. texto do elemento interativo → `texto:<tag>:<texto>` (casado por `elementoCasaCriterio`)
 *   5. caminho de tag:nth-of-type subindo até um ancestral com id estável (máx. 5 níveis)
 */

const INTERATIVOS = "button, a[href], [role='button'], [role='link'], [role='menuitem'], [role='tab'], input, select, textarea, label";
const PREFIXO_TEXTO = "texto:";

/** Ids que o React Aria (`react-aria…`) e o `useId` do React (`:r1:`, `_r_1_`) geram a cada render. */
const idGerado = (id: string) => /^react-aria|^:r|_r_|^radix-/.test(id);

const textoNormalizado = (el: Element) => (el.textContent ?? "").trim().replace(/\s+/g, " ");

export function gerarSeletor(clicado: Element): string {
    const el = clicado.closest(INTERATIVOS) ?? clicado;

    if (el.id && !idGerado(el.id)) return `#${cssEscape(el.id)}`;

    const testid = el.getAttribute("data-testid") ?? el.getAttribute("data-test");
    if (testid) return `[data-testid="${cssEscape(testid)}"]`;

    const aria = el.getAttribute("aria-label");
    if (aria) return `${el.tagName.toLowerCase()}[aria-label="${cssEscape(aria)}"]`;

    const texto = textoNormalizado(el);
    if (el.matches(INTERATIVOS) && texto && texto.length <= 60) return `${PREFIXO_TEXTO}${el.tagName.toLowerCase()}:${texto}`;

    const partes: string[] = [];
    let atual: Element | null = el;
    let nivel = 0;
    while (atual && atual.nodeType === 1 && nivel < 5) {
        if (atual.id && !idGerado(atual.id)) {
            partes.unshift(`#${cssEscape(atual.id)}`);
            break;
        }
        const tag = atual.tagName.toLowerCase();
        const pai = atual.parentElement;
        if (pai) {
            const irmaos = Array.from(pai.children).filter((c) => c.tagName === atual!.tagName);
            const idx = irmaos.indexOf(atual) + 1;
            partes.unshift(irmaos.length > 1 ? `${tag}:nth-of-type(${idx})` : tag);
        } else {
            partes.unshift(tag);
        }
        atual = pai;
        nivel++;
    }
    return partes.join(" > ");
}

/** Elemento desabilitado (nativo, ARIA ou React Aria), incluindo herdado de um ancestral. */
function desabilitado(el: Element) {
    return Boolean(el.closest(":disabled, [aria-disabled='true'], [data-disabled]"));
}

/**
 * Diz se o clique em `alvo` conclui o critério. Só conta clique em elemento habilitado:
 * um clique num botão ainda desabilitado (ex.: formulário incompleto) não encerra a tarefa.
 */
export function elementoCasaCriterio(alvo: Element, criterio: string): boolean {
    let casado: Element | null = null;

    if (criterio.startsWith(PREFIXO_TEXTO)) {
        const resto = criterio.slice(PREFIXO_TEXTO.length);
        const separador = resto.indexOf(":");
        const tag = resto.slice(0, separador);
        const texto = resto.slice(separador + 1);
        const interativo = alvo.closest(INTERATIVOS);
        if (interativo && interativo.tagName.toLowerCase() === tag && textoNormalizado(interativo) === texto) casado = interativo;
    } else {
        try {
            casado = alvo.closest(criterio);
        } catch {
            return false; // seletor digitado à mão e inválido
        }
    }

    return casado !== null && !desabilitado(casado);
}

/** Texto curto do elemento, para exibir como rótulo amigável do critério. */
export function rotuloDoElemento(clicado: Element): string {
    const el = clicado.closest(INTERATIVOS) ?? clicado;
    const texto = textoNormalizado(el);
    if (texto) return texto.slice(0, 40);
    const aria = el.getAttribute("aria-label");
    if (aria) return aria.slice(0, 40);
    return el.tagName.toLowerCase();
}

function cssEscape(value: string): string {
    if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(value);
    return value.replace(/["\\]/g, "\\$&");
}
