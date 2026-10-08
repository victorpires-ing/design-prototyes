import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { SearchLg, XClose } from "@untitledui/icons";
import { contarFiltrosAtivos, type Filtros } from "../utils/filtros";
import { DUR, EASE_OUT_EXPO } from "../utils/motion-tokens";
import { useSwMotion } from "../utils/use-sw-motion";
import { useSwLayout } from "./SwLayout";
import { BarraDeBusca } from "./BarraDeBusca";

/* Busca do mobile: um campo só, que abre uma folha de baixo com todos os
   filtros. Empilhar cinco campos na página custava meia tela antes do primeiro
   evento; aqui a tela só é ocupada quando a pessoa pede. */

function Folha({
    valores,
    onBuscar,
    onFechar,
}: {
    valores: Filtros;
    onBuscar: (filtros: Filtros) => void;
    onFechar: () => void;
}) {
    const { reduce } = useSwMotion();
    /* A folha sai por portal para o body, onde não existe container query. A
       largura da coluna da campanha vem pelo contexto; sem medida ainda, 100%. */
    const { largura } = useSwLayout();
    const caixa = useRef<HTMLDivElement>(null);

    /* Trava o scroll de fundo, senão o gesto "vaza" e rola a página atrás. */
    useEffect(() => {
        const anterior = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
        document.addEventListener("keydown", aoTeclar);
        return () => {
            document.body.style.overflow = anterior;
            document.removeEventListener("keydown", aoTeclar);
        };
    }, [onFechar]);

    /* A folha é portada para o body e fica DEPOIS da página na ordem do DOM, então
       sem isto o Tab percorre a listagem inteira atrás do escurecimento antes de
       chegar no formulário, focando o que ninguém enxerga. `inert` é a resposta
       nativa: tira a página do foco e da árvore de acessibilidade de uma vez, sem
       armadilha de foco escrita à mão. */
    useEffect(() => {
        const pagina = document.querySelector<HTMLElement>(".sw-root");
        if (pagina) pagina.inert = true;
        caixa.current?.focus({ preventScroll: true });
        return () => {
            if (pagina) pagina.inert = false;
        };
    }, []);

    return createPortal(
        <div
            ref={caixa}
            tabIndex={-1}
            className="sw-camada fixed inset-0 z-[88] flex justify-center outline-none"
            role="dialog"
            aria-modal="true"
            aria-label="Buscar eventos"
        >
            <motion.button
                type="button"
                aria-label="Fechar busca"
                onClick={onFechar}
                className="absolute inset-0 cursor-pointer bg-black/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DUR.quick }}
            />

            {/* `pointer-events-none` porque esta coluna cobre a janela inteira e é
                irmã POSTERIOR do escurecimento: sem isso ela recebe o toque que era
                para fechar a folha. Enquanto existia moldura o problema não
                aparecia, porque a coluna tinha 390px e sobrava escurecimento dos
                dois lados. O painel devolve o ponteiro para si. */}
            <div
                className="pointer-events-none relative h-full w-full max-w-full"
                style={{ width: largura || "100%" }}
            >
                <motion.div
                    className="pointer-events-auto absolute inset-x-0 bottom-0 max-h-[calc(100%-3rem)] overflow-y-auto overscroll-contain rounded-t-3xl border-t-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
                    style={{ backgroundColor: "var(--sw-ink)", borderColor: "var(--sw-lime)" }}
                    initial={reduce ? { opacity: 0 } : { y: "100%" }}
                    animate={reduce ? { opacity: 1 } : { y: 0 }}
                    exit={reduce ? { opacity: 0 } : { y: "100%" }}
                    transition={{ duration: reduce ? 0.18 : DUR.enter, ease: EASE_OUT_EXPO }}
                >
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="sw-ui text-base font-extrabold text-[var(--sw-white)]">Buscar eventos</h2>
                        <button
                            type="button"
                            aria-label="Fechar"
                            onClick={onFechar}
                            className="cursor-pointer rounded-full p-2"
                            style={{ color: "var(--sw-muted)" }}
                        >
                            <XClose className="size-5" />
                        </button>
                    </div>

                    <BarraDeBusca
                        valores={valores}
                        comModalidade={false}
                        empilhado
                        onBuscar={(filtros) => {
                            onBuscar(filtros);
                            onFechar();
                        }}
                    />
                </motion.div>
            </div>
        </div>,
        document.body,
    );
}

export function GatilhoDeBusca({ valores, onBuscar }: { valores: Filtros; onBuscar: (filtros: Filtros) => void }) {
    const [aberta, setAberta] = useState(false);
    const gatilho = useRef<HTMLButtonElement>(null);
    /* A folha é a busca do MOBILE. Quem a esconde na página é uma classe de
       container query, e classe não alcança um nó portado para o body: alargando a
       janela com a folha aberta, ela continuava por cima do layout de desktop, com
       o scroll travado e duas buscas vivas na tela. Enquanto existia moldura isso
       não aparecia, porque trocar de modo remontava a árvore. */
    const { desktop } = useSwLayout();
    const ativos = contarFiltrosAtivos(valores);

    useEffect(() => {
        if (desktop) setAberta(false);
    }, [desktop]);

    const fechar = () => {
        setAberta(false);
        gatilho.current?.focus({ preventScroll: true });
    };

    const resumo = valores.busca.trim()
        ? valores.busca.trim()
        : ativos > 0
          ? `${ativos} ${ativos === 1 ? "filtro aplicado" : "filtros aplicados"}`
          : "Procurar eventos...";

    return (
        <>
            <button
                ref={gatilho}
                type="button"
                onClick={() => setAberta(true)}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-full border-2 px-4 py-3.5 text-left"
                style={{ backgroundColor: "var(--sw-white)", borderColor: "var(--sw-navy)" }}
            >
                <SearchLg className="size-5 shrink-0" style={{ color: "var(--sw-navy)" }} />
                <span
                    className="sw-ui min-w-0 flex-1 truncate text-sm font-semibold"
                    style={{ color: valores.busca.trim() || ativos > 0 ? "var(--sw-navy)" : "color-mix(in srgb, var(--sw-navy) 60%, transparent)" }}
                >
                    {resumo}
                </span>
                <span
                    className="sw-ui shrink-0 rounded-full px-3 py-1.5 text-sm font-extrabold"
                    style={{ backgroundColor: "var(--sw-lime)", color: "var(--sw-navy)" }}
                >
                    Filtros
                </span>
            </button>

            <AnimatePresence>
                {aberta && !desktop ? (
                    <Folha key="folha" valores={valores} onBuscar={onBuscar} onFechar={fechar} />
                ) : null}
            </AnimatePresence>
        </>
    );
}
