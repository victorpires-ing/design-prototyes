/**
 * Gera um seletor CSS razoavelmente estável para um elemento clicado, usado na
 * captura interativa de critérios de sucesso por clique. Estratégia (best-effort,
 * suficiente para protótipos):
 *   1. id  → `#id`
 *   2. data-testid / data-test → `[data-testid="..."]`
 *   3. aria-label → `[aria-label="..."]`
 *   4. caminho de tag:nth-of-type subindo até um ancestral com id (máx. 5 níveis)
 */
export function gerarSeletor(el: Element): string {
    if (el.id) return `#${cssEscape(el.id)}`;

    const testid = el.getAttribute("data-testid") ?? el.getAttribute("data-test");
    if (testid) return `[data-testid="${cssEscape(testid)}"]`;

    const aria = el.getAttribute("aria-label");
    if (aria) return `${el.tagName.toLowerCase()}[aria-label="${cssEscape(aria)}"]`;

    const partes: string[] = [];
    let atual: Element | null = el;
    let nivel = 0;
    while (atual && atual.nodeType === 1 && nivel < 5) {
        if (atual.id) {
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

/** Texto curto do elemento, para exibir como rótulo amigável do critério. */
export function rotuloDoElemento(el: Element): string {
    const texto = (el.textContent ?? "").trim().replace(/\s+/g, " ");
    if (texto) return texto.slice(0, 40);
    const aria = el.getAttribute("aria-label");
    if (aria) return aria.slice(0, 40);
    return el.tagName.toLowerCase();
}

function cssEscape(value: string): string {
    if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(value);
    return value.replace(/["\\]/g, "\\$&");
}
