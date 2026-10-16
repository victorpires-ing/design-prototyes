import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { useLocation, useNavigate } from "react-router";
import { cx } from "@/utils/cx";
import { CAMPANHA } from "../data/campanha";
import { DUR, EASE_OUT_EXPO, SPRING_SCROLL } from "../utils/motion-tokens";
import { useSwMotion } from "../utils/use-sw-motion";
import { dd, useCountdown } from "../utils/use-countdown";
import { useSwLayout } from "./SwLayout";
import { Asterisco, Logo, Monograma } from "./SwBrand";
import { BarraDeBusca } from "./BarraDeBusca";
import { filtrosDaQuery, filtrosParaQuery } from "../utils/filtros";

/* Cromo da campanha: o header, a calha vertical e o pulo para o conteúdo.
   O header existe nas duas larguras; a calha é exclusiva do desktop. A altura do
   header e a largura da calha são reservadas por `.sw-pagina`, então nada corre
   por baixo deles. */

const SECOES = [
    { id: "modalidades", label: "Modalidades" },
    { id: "destaques", label: "Destaques" },
    { id: "como-funciona", label: "Como funciona" },
    { id: "perguntas", label: "Perguntas" },
];

/**
 * Calha esquerda. Carrega a marca, a assinatura da campanha e a barra de
 * progresso de leitura, que sobe de baixo para cima conforme a pessoa rola.
 *
 * Ela é `fixed`, mas se ancora na BORDA DA COLUNA medida, não na da janela: numa
 * coluna mais estreita que a janela, ancorar na janela faria a calha descolar do
 * conteúdo e passar por cima do que estivesse ao lado. O espaço dela é reservado
 * pelo `padding-left` do `<main>`, então nada corre por baixo.
 */
export function Calha() {
    const { desktop, esquerda, medido } = useSwLayout();
    const { scrollYProgress } = useScroll();
    const progresso = useSpring(scrollYProgress, SPRING_SCROLL);

    if (!desktop || !medido) return null;

    return (
        <div
            role="presentation"
            aria-hidden="true"
            className="pointer-events-none fixed bottom-0 z-[60] w-[var(--sw-rail)] overflow-hidden border-r"
            style={{
                left: esquerda,
                top: "var(--sw-chrome-h)",
                backgroundColor: "var(--sw-ink)",
                borderColor: "var(--sw-line)",
            }}
        >
            {/* O preenchimento é o progresso de leitura. Fica atrás do texto. */}
            <motion.div
                className="absolute inset-x-0 bottom-0 h-full origin-bottom"
                style={{ scaleY: progresso, backgroundColor: "var(--sw-lime)", opacity: 0.22 }}
            />

            {/* A marca sobe pela calha. Aqui não cabe `writing-mode`, que vira o fluxo
                do TEXTO: a marca é uma caixa com tamanho próprio e ignora isso. É
                rotação mesmo. E como `transform` não mexe na caixa de layout, a peça
                deitada seria posicionada como se continuasse com seus ~300px de
                largura e empurraria tudo para fora da calha; daí ser absoluta e
                centrada na mão. O deslocamento de 3rem desconta o bloco lime do pé,
                para a marca ficar no meio do que sobra e não no meio da calha.

                Sem assinatura: a 34px de altura ela sairia com menos de 4px e viraria
                sujeira ao lado do letreiro. */}
            <div
                className="absolute left-1/2 flex items-center gap-5"
                style={{ top: "calc(50% - 3rem)", transform: "translate(-50%, -50%) rotate(-90deg)" }}
            >
                <Logo deitado semAssinatura altura={34} className="text-[var(--sw-lime)]" />
                {/* `sw-display-integral` devolve a caixa cheia da fonte: com o recorte na
                    altura das maiúsculas o ano desalinharia do letreiro ao lado. */}
                <span
                    className="sw-display sw-display-integral text-[29px] leading-none"
                    style={{ color: "var(--sw-lime)" }}
                >
                    {CAMPANHA.edicao}
                </span>
            </div>

            {/* Marca de fechamento do cartaz: dá um fim à barra. */}
            <div
                className="absolute inset-x-0 bottom-0 flex h-24 items-center justify-center"
                style={{ backgroundColor: "var(--sw-lime)" }}
            >
                <Asterisco className="size-7" style={{ color: "var(--sw-navy)" }} />
            </div>
        </div>
    );
}

/** Relógio compacto do header. Inter com cifra tabular: Boldonse não sai de headline. */
function CountdownCompacto({ alvo }: { alvo: number }) {
    const r = useCountdown(alvo);
    if (r.encerrado) return null;

    return (
        <span className="hidden text-right @7xl/sw:block">
            <span className="sw-overline block" style={{ color: "var(--sw-magenta)" }}>
                Expira em
            </span>
            <span
                className="sw-ui block text-base font-extrabold"
                style={{ color: "var(--sw-lime)", fontVariantNumeric: "tabular-nums" }}
            >
                <span className="sr-only">A campanha termina em </span>
                {r.dias}d {dd(r.horas)}h {dd(r.minutos)}m
            </span>
        </span>
    );
}

/**
 * Header da campanha. Presente desde o scroll zero, transparente sobre o hero e
 * sólido depois que ele sai: assim nunca existe uma janela de rolagem sem CTA
 * visível. Não vai por portal, para a navegação principal continuar no começo da
 * ordem de tabulação.
 */
export function HeaderDaCampanha({
    alvoDoCountdown,
    onIrParaHome,
}: {
    alvoDoCountdown: number;
    onIrParaHome: () => void;
}) {
    const { desktop, esquerda, largura, medido } = useSwLayout();
    const { pathname } = useLocation();
    /* Na listagem o menu de seções não leva a lugar nenhum: as âncoras são da home.
       Ali o centro do header fica vazio até a busca compacta entrar. */
    const naHome = pathname.replace(/\/$/, "").endsWith("/sports-week");
    /* O header existe nas duas larguras. No mobile ele é só marca e CTA: menu de
       seções e relógio não cabem em 390px sem virar aperto. */
    const [solido, setSolido] = useState(false);
    const [ativa, setAtiva] = useState<string | null>(null);
    /* Menu e busca disputam o centro do header: quando a busca sobe, o menu sai. */
    const buscaVisivel = useBuscaAtrasDoHeader();

    useEffect(() => {
        const aoRolar = () => setSolido(window.scrollY > 360);
        aoRolar();
        window.addEventListener("scroll", aoRolar, { passive: true });
        return () => window.removeEventListener("scroll", aoRolar);
    }, []);

    useEffect(() => {
        if (!desktop || !naHome) return;
        const alvos = SECOES.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
        if (!alvos.length) return;

        const observer = new IntersectionObserver(
            (entradas) => {
                const visivel = entradas.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
                if (visivel) setAtiva(visivel.target.id);
            },
            { rootMargin: "-20% 0px -70% 0px" },
        );
        alvos.forEach((a) => observer.observe(a));
        return () => observer.disconnect();
    }, [desktop, naHome]);

    return (
        /* Existe nas duas larguras. No desktop ele atravessa a coluna inteira por
           cima da calha e carrega menu e relógio; no mobile fica só a marca e o
           relógio, que é o que cabe na largura de um telefone. */
        <header
            className={cx(
                "fixed z-[70] h-[var(--sw-chrome-h)] backdrop-blur-md transition-colors duration-200",
                solido && "border-b-2",
            )}
            /* Ancorado na COLUNA medida, não em `inset-x-0`: hoje a coluna é a
               janela inteira, mas se a LP voltar a viver dentro de uma moldura o
               header continua nascendo alinhado com ela. */
            style={{
                top: 0,
                left: medido ? esquerda : 0,
                width: medido ? largura : "100%",
                backgroundColor: solido
                    ? "color-mix(in srgb, var(--sw-ink) 94%, transparent)"
                    : "color-mix(in srgb, var(--sw-ink) 55%, transparent)",
                borderColor: solido ? "var(--sw-lime)" : "transparent",
            }}
        >
            <div className="flex h-full w-full items-center justify-between gap-4 px-[var(--sw-gutter)] py-3 @5xl/sw:gap-10 @5xl/sw:py-4">
                <button
                    type="button"
                    onClick={onIrParaHome}
                    aria-label="Sports Week, ir para a home"
                    className="shrink-0 cursor-pointer rounded-full px-2 py-2"
                >
                    <Monograma altura={26} className="text-[var(--sw-lime)] @5xl/sw:hidden" />
                    <Monograma altura={32} className="hidden text-[var(--sw-lime)] @5xl/sw:inline-flex" />
                </button>

                <motion.nav
                    aria-label="Seções da campanha"
                    className={cx("hidden items-center gap-1", naHome && !buscaVisivel && "@5xl/sw:flex")}
                    animate={{ opacity: buscaVisivel ? 0 : 1 }}
                    transition={{ duration: DUR.quick, ease: EASE_OUT_EXPO }}
                >
                    {SECOES.map((s) => (
                        <button
                            key={s.id}
                            type="button"
                            aria-current={ativa === s.id ? "true" : undefined}
                            onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                            className="sw-ui cursor-pointer rounded-full px-4 py-2.5 text-base font-bold transition-colors duration-100 hover:bg-[var(--sw-raised)]"
                            style={{ color: ativa === s.id ? "var(--sw-lime)" : "var(--sw-white)" }}
                        >
                            {s.label}
                        </button>
                    ))}
                </motion.nav>

                <BuscaNoTopo />

                <div className="flex shrink-0 items-center gap-5">
                    <CountdownCompacto alvo={alvoDoCountdown} />
                </div>
            </div>
        </header>
    );
}

/**
 * Diz se a barra de busca da página já passou PARA TRÁS do header.
 *
 * O limiar não é a borda da tela, é a borda de baixo do cromo fixo: sem o
 * `rootMargin`, a barra ainda contaria como visível enquanto estivesse escondida
 * atrás do header, e a do topo só apareceria tarde demais.
 */
function useBuscaAtrasDoHeader() {
    const { pathname, search } = useLocation();
    const [atras, setAtras] = useState(false);

    useEffect(() => {
        const alvo = document.getElementById("busca-principal");
        if (!alvo) {
            setAtras(false);
            return;
        }

        const area = document.querySelector(".sw-area");
        const cromo = area ? parseFloat(getComputedStyle(area).getPropertyValue("--sw-chrome-h")) || 0 : 0;

        /* "Não está intersectando" acontece dos DOIS lados: a barra já ter passado
           para cima do cromo, e ela ainda nem ter chegado, lá embaixo da dobra.
           Só o primeiro caso justifica promover a busca para o topo; o segundo
           fazia a busca compacta nascer junto com a página, com a barra do hero
           ainda a caminho. Daí a comparação com a borda de cima da raiz. */
        const observer = new IntersectionObserver(
            ([e]) => setAtras(!e.isIntersecting && e.boundingClientRect.top < (e.rootBounds?.top ?? 0)),
            {
                threshold: 0,
                rootMargin: `-${Math.round(cromo)}px 0px 0px 0px`,
            },
        );
        observer.observe(alvo);
        return () => observer.disconnect();
    }, [pathname, search]);

    return atras;
}

/**
 * A barra de busca da página, promovida para o header quando a original sai da
 * tela. É o mesmo componente, não uma cópia reduzida: quem rolou a página não
 * perde a ferramenta, e não existe um segundo campo com outras regras.
 */
function BuscaNoTopo() {
    const navigate = useNavigate();
    const { search } = useLocation();
    const { reduce } = useSwMotion();
    const visivel = useBuscaAtrasDoHeader();

    /* Ela desce de trás do header em vez de piscar no lugar: a barra está
       "chegando" do conteúdo que acabou de sair da tela. */
    return (
        <AnimatePresence initial={false}>
            {visivel ? (
                <motion.div
                    key="busca-no-topo"
                    className="hidden min-w-0 flex-1 @5xl/sw:block"
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ duration: reduce ? 0.18 : DUR.enter, ease: EASE_OUT_EXPO }}
                >
                    <BarraDeBusca
                        comModalidade={false}
                        valores={filtrosDaQuery(search)}
                        onBuscar={(filtros) => navigate(`/landing-pages/sports-week/eventos${filtrosParaQuery(filtros)}`)}
                    />
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}

/** Primeiro elemento focável da página. A campanha não tinha nenhum. */
export function PuloParaConteudo() {
    return (
        <a
            href="#conteudo"
            className="sw-ui sr-only rounded-full px-5 py-3 text-sm font-extrabold focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[90]"
            style={{ backgroundColor: "var(--sw-lime)", color: "var(--sw-navy)" }}
        >
            Pular para o conteúdo
        </a>
    );
}

/** Alvo do countdown. Fica aqui para header e hero compartilharem o mesmo prazo. */
export function usarAlvoDaCampanha() {
    const alvo = useRef(Date.now() + CAMPANHA.duracaoHoras * 3600_000);
    return alvo.current;
}
