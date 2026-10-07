import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

/* O elo entre a árvore e o que foi portado para o document.body.
   Container CSS não atravessa `createPortal`; contexto React atravessa, porque o
   portal preserva a árvore de COMPONENTES e só muda a árvore de DOM. Então o CTA
   fixo, a barra de progresso e o wipe descobrem por aqui que estão em desktop.

   Importante: isto NÃO é o hook `useBreakpoint` do projeto. Aquele lê a JANELA;
   aqui medimos a COLUNA, que é o que o CSS da campanha consulta. Hoje as duas
   coincidem, e é justamente por isso que a diferença passa despercebida até o dia
   em que a LP for embutida num recorte mais estreito. */

export type SwModo = "mobile" | "tablet" | "desktop" | "largo";

interface SwLayout {
    largura: number;
    /** Borda esquerda da coluna em coordenadas de viewport. */
    esquerda: number;
    modo: SwModo;
    desktop: boolean;
    /** Ainda não houve medição: não renderize cromo de desktop neste frame. */
    medido: boolean;
}

const LayoutContext = createContext<SwLayout>({ largura: 0, esquerda: 0, modo: "mobile", desktop: false, medido: false });

export function useSwLayout() {
    return useContext(LayoutContext);
}

/* Os mesmos limites do CSS. Se um lado mudar, o outro precisa mudar junto. */
function modoDe(largura: number): SwModo {
    if (largura < 768) return "mobile";
    if (largura < 1024) return "tablet";
    if (largura < 1280) return "desktop";
    return "largo";
}

export function SwLayoutProvider({ children }: { children: ReactNode }) {
    const medidor = useRef<HTMLDivElement>(null);
    const [caixa, setCaixa] = useState({ largura: 0, esquerda: 0 });

    useEffect(() => {
        const alvo = medidor.current;
        if (!alvo) return;

        const medir = () => {
            const r = alvo.getBoundingClientRect();
            setCaixa((anterior) =>
                Math.abs(anterior.largura - r.width) < 1 && Math.abs(anterior.esquerda - r.left) < 1
                    ? anterior
                    : { largura: r.width, esquerda: r.left },
            );
        };

        /* Um observer só, reagindo a resize. Não é layout medido por frame de
           scroll, que seria o padrão caro que o playbook proíbe. */
        const observer = new ResizeObserver(medir);
        observer.observe(alvo);
        medir();
        window.addEventListener("resize", medir);
        return () => {
            observer.disconnect();
            window.removeEventListener("resize", medir);
        };
    }, []);

    const valor = useMemo<SwLayout>(
        () => ({
            largura: caixa.largura,
            esquerda: caixa.esquerda,
            modo: modoDe(caixa.largura),
            desktop: caixa.largura >= 1024,
            medido: caixa.largura > 0,
        }),
        [caixa],
    );

    return (
        <LayoutContext.Provider value={valor}>
            {/* Um div de altura zero em fluxo normal mede exatamente a largura que
                o `.sw-root` vai medir, sem acoplar o provider a um ref que
                atravessa o roteador. */}
            <div ref={medidor} aria-hidden="true" className="h-0" />
            {children}
        </LayoutContext.Provider>
    );
}
