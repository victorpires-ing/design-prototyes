import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { CAMPANHA } from "../data/campanha";
import { DUR, EASE_OUT_EXPO, SPRING_SCROLL, SPRING_TOGGLE, STAGGER } from "../utils/motion-tokens";
import { useSwMotion } from "../utils/use-sw-motion";
import { Asterisco, Logo } from "./SwBrand";
import { SwContainer } from "./SwContainer";
import { useSwLayout } from "./SwLayout";
import { SwBotao } from "./SwUi";

/* Hero "interruptor".
   A tela abre escura e quieta e, meio segundo depois, LIGA: os blocos de cor
   invadem, a faixa de chegada atravessa, o toggle vira para ON e a headline
   aterrissa. "Tá ON" deixa de ser uma palavra no cartaz e passa a ser o que a
   tela faz. Com movimento reduzido a página já nasce ligada. */

const PALAVRAS = CAMPANHA.headline.split(" ");
/* Três cores, não quatro: com quatro o ciclo repetia a lime em palavras vizinhas
   e os dois blocos colavam num só. */
const COR_DO_BLOCO = ["var(--sw-lime)", "var(--sw-magenta)", "var(--sw-white)"];
const COR_DO_TEXTO = ["var(--sw-navy)", "var(--sw-white)", "var(--sw-navy)"];

function TogglePequeno({ ligado }: { ligado: boolean }) {
    const { reduce } = useSwMotion();
    return (
        <span className="flex items-center gap-3">
            <span
                className="relative inline-flex h-9 w-[72px] shrink-0 items-center rounded-full p-1 @5xl/sw:h-16 @5xl/sw:w-[128px] @5xl/sw:p-2"
                style={{ justifyContent: ligado ? "flex-end" : "flex-start" }}
                aria-hidden="true"
            >
                <motion.span
                    className="absolute inset-0 rounded-full"
                    animate={{ backgroundColor: ligado ? "#FF1289" : "#0B2559" }}
                    transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }}
                />
                <motion.span
                    layout
                    transition={reduce ? { duration: 0.12 } : SPRING_TOGGLE}
                    className="relative z-10 flex size-7 items-center justify-center rounded-full @5xl/sw:size-12"
                    style={{ backgroundColor: "var(--sw-lime)" }}
                >
                    <motion.span
                        animate={{ rotate: ligado && !reduce ? 180 : 0 }}
                        transition={reduce ? { duration: 0.12 } : SPRING_TOGGLE}
                        className="flex"
                    >
                        <Asterisco className="size-3.5 @5xl/sw:size-6" style={{ color: "var(--sw-navy)" }} />
                    </motion.span>
                </motion.span>
            </span>

            {/* O rótulo só aparece quando há espaço: é a ideia da campanha dita em
                duas letras, e no celular ela já está no lockup. */}
            <span
                className="sw-ui hidden text-base font-extrabold @5xl/sw:inline"
                style={{ color: ligado ? "var(--sw-lime)" : "var(--sw-subtle)" }}
            >
                {ligado ? "ON" : "OFF"}
            </span>
        </span>
    );
}

export function Hero({ onVerEventos, onComoFunciona }: { onVerEventos: () => void; onComoFunciona: () => void }) {
    const { reduce } = useSwMotion();
    const { desktop } = useSwLayout();
    const [ligado, setLigado] = useState(reduce);
    const ref = useRef<HTMLDivElement>(null);

    /* O "liga" espera duas coisas: a aba estar visível, senão a animação congela
       no meio e a pessoa volta para uma tela quebrada; e a Boldonse estar
       carregada, porque a 96px a troca de face reflui a composição inteira.
       A pausa é menor no desktop: lá não existe dobra, a composição aparece toda
       de uma vez e meio segundo de tela preta lê como falha de carregamento. */
    useEffect(() => {
        if (reduce) {
            setLigado(true);
            return;
        }

        let timer: number | undefined;
        let vivo = true;
        const pausa = desktop ? 220 : 420;

        const agendar = () => {
            if (!vivo || document.hidden || timer !== undefined) return;
            timer = window.setTimeout(() => setLigado(true), pausa);
        };

        Promise.race([
            document.fonts?.ready ?? Promise.resolve(),
            new Promise((resolve) => setTimeout(resolve, 1200)),
        ]).then(agendar);

        document.addEventListener("visibilitychange", agendar);
        return () => {
            vivo = false;
            if (timer !== undefined) window.clearTimeout(timer);
            document.removeEventListener("visibilitychange", agendar);
        };
    }, [reduce, desktop]);

    /* Parallax das camadas. `layoutEffect: false` evita o progresso travado em 0
       quando o hero é medido antes das fontes carregarem. */
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"], layoutEffect: false });
    const p = useSpring(scrollYProgress, SPRING_SCROLL);
    const fundoY = useTransform(p, [0, 1], ["0%", "16%"]);
    const conteudoY = useTransform(p, [0, 1], ["0%", "-38%"]);
    const conteudoOpacidade = useTransform(p, [0, 0.75], [1, 0]);
    const S = (mv: unknown) => (reduce ? undefined : (mv as never));
    /* No desktop a tela é alta e o conteúdo inteiro cabe: apagar o CTA principal
       no scroll apagaria a única chamada visível. Só o fundo e a faixa se movem. */
    const Sc = (mv: unknown) => (reduce || desktop ? undefined : (mv as never));

    return (
        <div
            ref={ref}
            className="sw-grain relative overflow-hidden pt-5 pb-10 @5xl/sw:pt-12 @5xl/sw:pb-20"
            style={{ backgroundColor: "var(--sw-ink)" }}
        >
            <motion.div
                aria-hidden="true"
                className="absolute inset-0 -z-30"
                style={{ y: S(fundoY) }}
                animate={{
                    background: ligado
                        ? "radial-gradient(130% 95% at 50% 0%, #0099FF 0%, #0B2559 62%, #07132E 100%)"
                        : "radial-gradient(130% 95% at 50% 0%, #07132E 0%, #07132E 100%)",
                }}
                transition={{ duration: reduce ? 0.18 : 0.9, ease: EASE_OUT_EXPO }}
            />

            <motion.div style={{ y: Sc(conteudoY), opacity: Sc(conteudoOpacidade) }}>
                <SwContainer className="relative z-10 @5xl/sw:grid @5xl/sw:grid-cols-12 @5xl/sw:items-start @5xl/sw:gap-x-6">
                    <div className="flex items-start justify-between gap-4 @5xl/sw:col-span-12 @5xl/sw:mb-10">
                        <Logo altura={desktop ? 98 : 62} className="text-[var(--sw-white)]" />
                        <TogglePequeno ligado={ligado} />
                    </div>

                    {/* Headline: cada PALAVRA tem seu bloco de cor, e a frase quebra onde a
                        coluna manda. Antes as linhas vinham escritas no dado, o que deixava
                        "para" sozinho numa linha: quebra que nenhum revisor assinaria.
                        Em `flex-wrap` o navegador decide, e a margem vertical negativa
                        reaproxima as fileiras, que senão ficariam com a altura das caixas
                        da Boldonse entre um bloco e outro.
                        Só scaleX e translate, tudo no compositor. */}
                    <h1 className="relative mt-9 flex flex-wrap items-start gap-x-[0.2em] py-[0.42em] text-[length:var(--sw-fs-hero)] @5xl/sw:col-span-8 @5xl/sw:mt-0">
                        {PALAVRAS.map((palavra, i) => (
                            <span key={`${palavra}-${i}`} className="relative -my-[0.42em] block leading-[1]">
                                {/* O bloco usa as MESMAS insets em `em` do padding da máscara,
                                    então cobre exatamente a faixa de caixa alta em qualquer
                                    tamanho de fonte, sem número mágico. */}
                                <motion.span
                                    aria-hidden="true"
                                    className="absolute inset-x-0 top-[0.56em] bottom-[0.46em] origin-left"
                                    style={{ backgroundColor: COR_DO_BLOCO[i % COR_DO_BLOCO.length] }}
                                    initial={reduce ? false : { scaleX: 0 }}
                                    animate={ligado ? { scaleX: 1 } : { scaleX: 0 }}
                                    transition={{
                                        duration: reduce ? 0.18 : DUR.enter,
                                        ease: EASE_OUT_EXPO,
                                        delay: reduce ? 0 : i * STAGGER.word,
                                    }}
                                />
                                <span className="relative block overflow-hidden px-[0.08em] pt-[0.56em] pb-[0.46em]">
                                    <motion.span
                                        className="sw-display sw-display-integral block leading-[1.05] whitespace-nowrap"
                                        style={{ color: COR_DO_TEXTO[i % COR_DO_TEXTO.length] }}
                                        initial={reduce ? false : { y: "118%", skewY: 7, letterSpacing: "-0.075em" }}
                                        animate={
                                            ligado
                                                ? { y: "0%", skewY: 0, letterSpacing: "var(--sw-ls-hero)" }
                                                : { y: "118%", skewY: 7, letterSpacing: "-0.075em" }
                                        }
                                        transition={{
                                            duration: reduce ? 0.18 : DUR.hero,
                                            ease: EASE_OUT_EXPO,
                                            delay: reduce ? 0 : 0.1 + i * STAGGER.word,
                                        }}
                                    >
                                        {palavra}
                                    </motion.span>
                                </span>
                            </span>
                        ))}
                    </h1>

                    <motion.div
                        className="@5xl/sw:col-span-7 @5xl/sw:col-start-1 @5xl/sw:mt-12"
                        initial={reduce ? false : { opacity: 0, y: 18 }}
                        animate={ligado ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
                        transition={{ duration: reduce ? 0.18 : DUR.reveal, ease: EASE_OUT_EXPO, delay: reduce ? 0 : 0.56 }}
                    >
                        <p className="mt-6 max-w-[42ch] text-[length:var(--sw-fs-apoio)] leading-[1.5] text-[var(--sw-white)] @5xl/sw:mt-0">
                            {CAMPANHA.subheadline}
                        </p>

                        <div className="mt-8 flex flex-col gap-3 @5xl/sw:flex-row @5xl/sw:gap-4">
                            <SwBotao
                                tamanho={desktop ? "lg" : "md"}
                                larguraTotal={!desktop}
                                onClick={onVerEventos}
                            >
                                Ver eventos em oferta
                            </SwBotao>
                            <SwBotao
                                tamanho={desktop ? "lg" : "md"}
                                larguraTotal={!desktop}
                                variante="contorno"
                                onClick={onComoFunciona}
                            >
                                Como funciona
                            </SwBotao>
                        </div>
                    </motion.div>
                </SwContainer>
            </motion.div>
        </div>
    );
}
