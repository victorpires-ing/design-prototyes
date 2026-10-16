import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { useNavigate } from "react-router";
import { DUR, EASE_IN_OUT, SPRING_POP, SPRING_SCROLL, SW } from "../utils/motion-tokens";
import { useSwLayout } from "./SwLayout";
import { Monograma } from "./SwBrand";
import { useSwMotion } from "../utils/use-sw-motion";

/* Cromo da campanha: barra de progresso, CTA fixo e a transição de página com
   wipe de bandeira quadriculada. Tudo que é `fixed` vai por portal para o body,
   porque qualquer ancestral com transform viraria o bloco de contenção e o
   elemento ancoraria no lugar errado. */

/* A bandeira de chegada da campanha não é preto e branco: um dos quadrados é uma
   das três cores da marca, sorteada a cada transição. E o ladrilho é mais alto que
   largo, o que junto com o leve giro desalinha as fileiras e dá o aspecto de
   bandeira tremulando em vez de xadrez de corrida genérico.

   Ladrilho grande de propósito: poucos quadrados grandes atravessando devagar
   leem como uma bandeira passando na frente da tela; muitos quadrados pequenos
   leem como textura, e numa tela larga viram ruído.

   O quadrado claro é o azul de fundo da campanha, não branco: branco em tela
   cheia é um flash, e a transição deixava de ser a página virando bandeira para
   virar um susto entre duas telas escuras. */
const CORES_DO_XADREZ = [SW.lime, SW.magenta, SW.blue];

const corSorteada = () => CORES_DO_XADREZ[Math.floor(Math.random() * CORES_DO_XADREZ.length)];

const xadrezDe = (cor: string) => ({
    backgroundImage: `conic-gradient(${cor} 0% 25%, ${SW.ink} 0% 50%, ${cor} 0% 75%, ${SW.ink} 0%)`,
    backgroundSize: "144px 256px",
});

/**
 * Barra de progresso de leitura. `scaleX` é a forma mais barata de fazer isso.
 * No desktop ela não existe: o progresso é o preenchimento vertical da calha.
 */
export function BarraDeProgresso() {
    const { desktop } = useSwLayout();
    const { scrollYProgress } = useScroll();
    const suave = useSpring(scrollYProgress, SPRING_SCROLL);

    if (desktop) return null;

    return createPortal(
        <motion.div
            aria-hidden="true"
            className="pointer-events-none fixed inset-x-0 top-0 z-[85] h-1 origin-left"
            style={{ scaleX: suave, backgroundColor: "#B3F300" }}
        />,
        document.body,
    );
}

/**
 * CTA que aparece quando o usuário rola para baixo e some ao voltar para o topo.
 * A zona morta de 6px evita o salto do scroll inercial do iOS fazer a barra piscar.
 */
export function CtaFixo({ apoio, rotulo, onClick }: { apoio: string; rotulo: string; onClick?: () => void }) {
    /* No desktop o CTA do header já fica visível o tempo todo. Os dois juntos
       seriam duas chamadas concorrentes para a mesma ação. */
    const { desktop, largura } = useSwLayout();
    const { scrollY } = useScroll();
    const [visivel, setVisivel] = useState(false);
    const anterior = useRef(0);

    useMotionValueEvent(scrollY, "change", (y) => {
        if (Math.abs(y - anterior.current) < 6) return;
        setVisivel(y > 420);
        anterior.current = y;
    });

    return createPortal(
        <AnimatePresence>
            {visivel && !desktop ? (
                <motion.div
                    className="fixed inset-x-0 bottom-0 z-[75] flex justify-center"
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "110%" }}
                    transition={{ duration: DUR.enter, ease: EASE_IN_OUT }}
                >
                    <div
                        className="sw-camada w-full max-w-full border-t-2 px-4 pt-3"
                        style={{
                            /* Acompanha a coluna da campanha, que sem moldura é a
                               janela inteira. Antes da primeira medição, 100%. */
                            width: largura || "100%",
                            borderColor: "var(--sw-lime)",
                            backgroundColor: "var(--sw-ink)",
                            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
                        }}
                    >
                        <p className="sw-ui mb-2 text-center text-sm font-bold" style={{ color: "var(--sw-muted)" }}>
                            {apoio}
                        </p>
                        <button
                            type="button"
                            onClick={onClick}
                            className="sw-ui w-full rounded-full px-6 py-3.5 text-base font-extrabold"
                            style={{ backgroundColor: "var(--sw-lime)", color: "var(--sw-navy)" }}
                        >
                            {rotulo}
                        </button>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>,
        document.body,
    );
}

function Wipe({ fase, cor }: { fase: "cobrir" | "descobrir"; cor: string }) {
    const cobrindo = fase === "cobrir";

    return (
        /* `sw-camada` e não `sw-root`: o wipe é portado para o body e precisa das
           variáveis da campanha para a marca, mas não pode pintar fundo nenhum. */
        <div className="sw-camada pointer-events-none fixed inset-0 z-[95] overflow-hidden" aria-hidden="true">
            <motion.div
                className="absolute top-[-60%] left-[-40%] h-[220%] w-[180%] origin-center will-change-transform"
                style={{ ...xadrezDe(cor), rotate: -14 }}
                initial={{ x: fase === "cobrir" ? "-130%" : "0%" }}
                animate={{ x: fase === "cobrir" ? "0%" : "130%" }}
                transition={{ duration: DUR.wipe, ease: EASE_IN_OUT }}
            />
            {/* Filete na borda de ataque, na mesma cor sorteada: dá peso ao avanço. */}
            <motion.div
                className="absolute top-[-60%] left-[-40%] h-[220%] w-[52px] origin-center will-change-transform"
                style={{ backgroundColor: cor, rotate: -14 }}
                initial={{ x: fase === "cobrir" ? "-130%" : "0%" }}
                animate={{ x: fase === "cobrir" ? "180%" : "320%" }}
                transition={{ duration: DUR.wipe, ease: EASE_IN_OUT }}
            />

            {/* A marca ocupa o miolo da transição, que até agora era bandeira passando
                e mais nada. Entra depois que a bandeira já cobriu a tela (daí o atraso
                de 45% da varredura) e sai antes de ela terminar de descobrir: quem
                espera vê a marca, não um vazio quadriculado.

                O disco escuro não é enfeite: a cor do xadrez é sorteada, então a marca
                lime cairia em cima de um quadrado lime metade das vezes e sumiria. Com
                o disco ela tem sempre o mesmo fundo, e o anel na cor sorteada é o que
                amarra a marca à transição daquela vez.

                Mola na entrada e `ease-in` curto na saída: a entrada passa um pouco do
                ponto e volta, a saída foge. Simétrico ficaria mecânico. */}
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    className="flex items-center justify-center rounded-full will-change-transform"
                    style={{ backgroundColor: "var(--sw-ink)", boxShadow: `0 0 0 6px ${cor}` }}
                    initial={cobrindo ? { scale: 0.32, opacity: 0 } : { scale: 1, opacity: 1 }}
                    animate={cobrindo ? { scale: 1, opacity: 1 } : { scale: 0.32, opacity: 0 }}
                    transition={
                        cobrindo
                            ? { ...SPRING_POP, delay: DUR.wipe * 0.45 }
                            : { duration: DUR.wipe * 0.34, ease: EASE_IN_OUT }
                    }
                >
                    <span className="flex size-36 items-center justify-center @5xl/sw:size-52">
                        <Monograma altura={52} className="text-[var(--sw-lime)] @5xl/sw:hidden" />
                        <Monograma altura={76} className="hidden text-[var(--sw-lime)] @5xl/sw:inline-flex" />
                    </span>
                </motion.div>
            </div>
        </div>
    );
}

const WipeContext = createContext<(destino: string) => void>(() => {});

/** Navegação com wipe. Em qualquer página: `const ir = useIrComWipe()`. */
export function useIrComWipe() {
    return useContext(WipeContext);
}

export function WipeProvider({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    const { reduce } = useSwMotion();
    const [fase, setFase] = useState<"parado" | "cobrir" | "descobrir">("parado");
    const [cor, setCor] = useState(CORES_DO_XADREZ[0]);
    const ocupado = useRef(false);

    const ir = useCallback(
        (destino: string) => {
            if (reduce) {
                navigate(destino);
                window.scrollTo({ top: 0 });
                return;
            }
            if (ocupado.current) return;
            ocupado.current = true;

            setCor(corSorteada());
            setFase("cobrir");
            window.setTimeout(() => {
                /* A rota troca com a tela coberta: o wipe compra o tempo que o React
                   leva para reconciliar a página nova. */
                navigate(destino);
                window.scrollTo({ top: 0 });
                setFase("descobrir");
                window.setTimeout(() => {
                    setFase("parado");
                    ocupado.current = false;
                }, DUR.wipe * 1000);
            }, DUR.wipe * 1000);
        },
        [navigate, reduce],
    );

    return (
        <WipeContext.Provider value={ir}>
            {children}
            {createPortal(
                <AnimatePresence>{fase !== "parado" ? <Wipe key={fase} fase={fase} cor={cor} /> : null}</AnimatePresence>,
                document.body,
            )}
        </WipeContext.Provider>
    );
}
