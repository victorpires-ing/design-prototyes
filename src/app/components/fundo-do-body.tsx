import { useEffect } from "react";
import { useLocation } from "react-router";

/*
 * O fundo do <html> e do <body> segue o fundo da tela atual, para o elástico da rolagem (bounce)
 * não mostrar outra cor acima ou abaixo da página. Vale para qualquer produto: procura o primeiro
 * bloco com fundo próprio dentro do #root e copia a cor. Refaz ao trocar de rota e de tema.
 *
 * O elástico em si fica desligado (`overscroll-behavior-y: none`): o CSS não deixa só diminuir a
 * intensidade, e desligar é o mais perto disso.
 */

const transparente = (cor: string) => !cor || cor === "transparent" || cor === "rgba(0, 0, 0, 0)";

function fundoDaTela(): string | null {
    let el = document.getElementById("root")?.firstElementChild as HTMLElement | null;
    // Desce pelos primeiros filhos até achar quem pinta o fundo (layouts embrulham a tela em providers sem DOM ou em divs sem cor).
    for (let i = 0; el && i < 6; i++) {
        const cor = getComputedStyle(el).backgroundColor;
        if (!transparente(cor)) return cor;
        el = el.firstElementChild as HTMLElement | null;
    }
    return null;
}

export function FundoDoBody() {
    const { pathname } = useLocation();

    useEffect(() => {
        const aplicar = () => {
            const cor = fundoDaTela();
            for (const alvo of [document.documentElement, document.body]) {
                alvo.style.backgroundColor = cor ?? "";
                alvo.style.overscrollBehaviorY = "none";
            }
        };
        // Depois da pintura da tela nova; e de novo quando o tema troca (classe no <html>).
        const quadro = requestAnimationFrame(aplicar);
        const observador = new MutationObserver(aplicar);
        observador.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => {
            cancelAnimationFrame(quadro);
            observador.disconnect();
        };
    }, [pathname]);

    return null;
}
