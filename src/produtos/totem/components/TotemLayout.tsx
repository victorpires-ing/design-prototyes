import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { HelpCircle, RefreshCcw01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { TelaDeAtracao } from "./TelaDeAtracao";
import { useTheme } from "@/providers/theme-provider";

/*
 * Estado em nível de módulo para forçar light mode em TODAS as telas do
 * totem, inclusive ao navegar entre elas (ex: Config → preview).
 *
 * Um contador de montagens evita que o unmount de uma tela restaure o tema
 * antes da próxima assumir: a restauração é adiada (setTimeout 0) e cancelada
 * se outra tela do totem montar em seguida. Só quando o contador zera de
 * verdade (usuário saiu do totem) a preferência anterior é restaurada.
 */
let mpCount = 0;
let mpPrevTheme: "light" | "dark" | "system" | null = null;
let mpRestoreTimer: ReturnType<typeof setTimeout> | null = null;

function useForceLightMode() {
    const { theme, setTheme } = useTheme();
    useEffect(() => {
        if (mpRestoreTimer !== null) {
            clearTimeout(mpRestoreTimer);
            mpRestoreTimer = null;
        }
        if (mpCount === 0) mpPrevTheme = theme;
        mpCount++;
        setTheme("light");

        return () => {
            mpCount--;
            if (mpCount === 0) {
                mpRestoreTimer = setTimeout(() => {
                    if (mpCount === 0 && mpPrevTheme && mpPrevTheme !== "light") setTheme(mpPrevTheme);
                    mpPrevTheme = null;
                    mpRestoreTimer = null;
                }, 0);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}

/* ------------------------------------------------------------------ */
/*  Moldura do totem                                                    */
/* ------------------------------------------------------------------ */

/** Painel físico simulado: TV Full HD na vertical. */
export const TELA_LARGURA = 1080;
export const TELA_ALTURA = 1920;
/**
 * O conteúdo é autorado em 540×960 e ampliado 2× para preencher o painel.
 * Um totem é visto de pé, a um braço de distância: na densidade de um site
 * desktop o texto de 16px viraria uma linha fina no meio de uma tela de 43".
 */
const ESCALA_CONTEUDO = 2;
export const CONTEUDO_LARGURA = TELA_LARGURA / ESCALA_CONTEUDO;
export const CONTEUDO_ALTURA = TELA_ALTURA / ESCALA_CONTEUDO;
/** Moldura preta em volta do painel, em pixels físicos. */
const MOLDURA = 28;
/** Antecedência do aviso de ociosidade, em segundos. */
const AVISO_SEGUNDOS = 20;
/** Respiro entre o painel e a borda da janela, em pixels de tela. */
const MARGEM = 24;

/*
 * Elemento dentro da caixa transformada que hospeda o que é `position: fixed`
 * (gaveta do resumo, overlays de modal). Um ancestral com `transform` vira o
 * bloco de contenção de descendentes fixos, então portar para cá prende esses
 * elementos à tela do totem em vez de à janela do navegador.
 *
 * Store de módulo em vez de contexto: quem mais precisa do container é a página
 * que *renderiza* o layout, e o hook dela roda acima de qualquer Provider que o
 * layout pudesse criar. Só existe um totem em tela por vez.
 */
let portalTela: HTMLElement | null = null;
const ouvintes = new Set<() => void>();

function definirPortal(el: HTMLElement | null) {
    portalTela = el;
    for (const ouvinte of ouvintes) ouvinte();
}

const assinar = (ouvinte: () => void) => {
    ouvintes.add(ouvinte);
    return () => void ouvintes.delete(ouvinte);
};

/** Container de portal da tela do totem — `null` fora da moldura. */
export function useTotemPortal() {
    return useSyncExternalStore(
        assinar,
        () => portalTela,
        () => null,
    );
}

/** Dimensões da janela e se ela já está no formato do totem. */
function medirJanela() {
    if (typeof window === "undefined") return { largura: 0, altura: 0, retrato: false };
    const largura = window.innerWidth;
    const altura = window.innerHeight;
    return { largura, altura, retrato: altura > largura };
}

/** Painel do totem escalado para caber na janela, com a sala em volta. */
function TotemFrame({ children }: { children: ReactNode }) {
    const areaRef = useRef<HTMLDivElement>(null);
    const [escala, setEscala] = useState(0);
    const [tela, setTela] = useState(() => medirJanela());
    const registrarPortal = useCallback((el: HTMLDivElement | null) => definirPortal(el), []);

    useLayoutEffect(() => {
        const atualizar = () => setTela(medirJanela());
        atualizar();
        window.addEventListener("resize", atualizar);
        window.addEventListener("orientationchange", atualizar);
        return () => {
            window.removeEventListener("resize", atualizar);
            window.removeEventListener("orientationchange", atualizar);
        };
    }, []);

    useLayoutEffect(() => {
        const area = areaRef.current;
        if (!area) return;

        const medir = () => {
            // A margem sai da conta aqui: se ela virasse padding do elemento medido,
            // o retângulo incluiria o padding e o painel passaria da janela.
            const { width, height } = area.getBoundingClientRect();
            const livre = (lado: number) => Math.max(0, lado - MARGEM * 2);
            const total = (lado: number) => lado + MOLDURA * 2;
            setEscala(Math.min(livre(width) / total(TELA_LARGURA), livre(height) / total(TELA_ALTURA)));
        };

        medir();
        const observer = new ResizeObserver(medir);
        observer.observe(area);
        return () => observer.disconnect();
    }, []);

    const px = (valor: number) => valor * escala;

    /*
     * Numa janela já vertical — um tablet de pé, que é como o totem é testado —
     * desenhar a moldura seria simular um aparelho dentro de outro. Aí a tela do
     * navegador *é* o painel e o conteúdo ocupa tudo.
     */
    if (tela.retrato) {
        return (
            <div className="fixed inset-0 overflow-hidden bg-white">
                <div
                    className="absolute top-0 left-0 origin-top-left"
                    style={{
                        width: CONTEUDO_LARGURA,
                        height: tela.altura / (tela.largura / CONTEUDO_LARGURA),
                        transform: `scale(${tela.largura / CONTEUDO_LARGURA})`,
                    }}
                >
                    {children}
                    <div ref={registrarPortal} />
                </div>
            </div>
        );
    }

    return (
        <div ref={areaRef} className="fixed inset-0 grid place-items-center overflow-hidden bg-[#0b0b0e]">
            {/* escala 0 = ainda não medimos; renderizar antes disso faz o painel piscar em tamanho cheio. */}
            {escala > 0 && (
                <div
                    className="relative shadow-[0_40px_120px_rgba(0,0,0,0.6)] ring-1 ring-white/10"
                    style={{
                        width: px(TELA_LARGURA + MOLDURA * 2),
                        height: px(TELA_ALTURA + MOLDURA * 2),
                        padding: px(MOLDURA),
                        borderRadius: px(44),
                        background: "linear-gradient(160deg, #24242a 0%, #131317 45%, #1c1c21 100%)",
                    }}
                >
                    <div
                        className="relative size-full overflow-hidden bg-white"
                        style={{ borderRadius: px(20) }}
                        aria-label={`Totem ${TELA_LARGURA}×${TELA_ALTURA}`}
                    >
                        <div
                            className="absolute top-0 left-0 origin-top-left"
                            style={{
                                width: CONTEUDO_LARGURA,
                                height: CONTEUDO_ALTURA,
                                transform: `scale(${escala * ESCALA_CONTEUDO})`,
                            }}
                        >
                            {children}
                            {/* Precisa estar dentro do `transform` para conter os elementos fixos. */}
                            <div ref={registrarPortal} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Chrome do checkout                                                  */
/* ------------------------------------------------------------------ */

interface TotemLayoutProps {
    /** Título exibido no subheader (nome do evento/teste). */
    title: string;
    /** Selo opcional ao lado do título (ex.: "Rascunho"). */
    badge?: string;
    /** URL da logo exibida no header (substitui o wordmark INGRESSE). */
    logo?: string;
    /** Cor de destaque (hex) — aplica a botões primários e links via variáveis do tema. */
    accent?: string;
    /** Handler do botão voltar. Omitir esconde a seta. */
    onBack?: () => void;
    /** Handler de "Recomeçar" — limpa a sessão e volta ao início do fluxo. */
    onRecomecar?: () => void;
    /**
     * Zera a sessão. Chamado quando o totem volta ao repouso, seja por
     * inatividade, seja quando a próxima pessoa toca na tela de atração.
     */
    onOcioso?: () => void;
    /** Segundos sem toque até o totem voltar ao repouso. `0` desliga o repouso. */
    segundosOciosos?: number;
    /** Nome do usuário logado. Ausente = exibe o botão "Acessar conta". */
    usuario?: string;
    /** Handler do botão de conta (abre o login). */
    onAcessar?: () => void;
    /** Ação primária da tela, no topo à direita do subheader. */
    action?: ReactNode;
    /**
     * Envolve a tela na moldura do totem. Desligado nas telas que são ferramenta
     * de bastidor (o configurador do evento roda num desktop, não no totem).
     */
    frame?: boolean;
    /**
     * A tela abre em repouso. Verdadeiro onde uma compra começa; falso onde ela
     * termina — o comprovante não pode nascer atrás do "Toque para começar".
     */
    repousoInicial?: boolean;
    children: ReactNode;
}

/** Variáveis de marca sobrescritas pela cor de destaque do evento (botões + links). */
export function accentVars(accent?: string): CSSProperties | undefined {
    if (!accent) return undefined;
    return {
        // tokens base
        "--color-bg-brand-solid": accent,
        "--color-bg-brand-solid_hover": accent,
        "--color-text-brand-secondary": accent,
        "--color-text-brand-secondary_hover": accent,
        "--color-fg-brand-primary": accent,
        "--color-border-brand": accent,
        // namespaces usados pelos utilitários (bg-, text-, border-, ring-)
        "--background-color-brand-solid": accent,
        "--background-color-brand-solid_hover": accent,
        "--text-color-brand-secondary": accent,
        "--text-color-brand-secondary_hover": accent,
        "--border-color-brand": accent,
        "--ring-color-brand": accent,
    } as CSSProperties;
}

/** Logo oficial da Ingresse (versão clara, para a barra escura). */
const INGRESSE_LOGO = "https://auth.prod.ingresse.com/resources/2ibrw/login/custom/img/ingresse-light.svg";

/**
 * Chrome do checkout no totem: barra superior escura (marca + conta) e
 * subheader claro (voltar + título + selo, ajuda e recomeçar).
 *
 * Sem "Compartilhar": num equipamento de rua não há para onde compartilhar.
 * No lugar entra "Recomeçar", que é o que falta quando alguém abandona a
 * compra no meio e a próxima pessoa chega.
 */
export function TotemLayout({
    title,
    badge,
    logo,
    accent,
    onBack,
    onRecomecar,
    onOcioso,
    segundosOciosos = 120,
    usuario,
    action,
    onAcessar,
    frame = true,
    repousoInicial = true,
    children,
}: TotemLayoutProps) {
    useForceLightMode();

    /*
     * Repouso é o estado inicial: quem chega no totem encontra o convite, não o
     * formulário pela metade de quem passou antes. Fora da moldura (configurador)
     * não existe repouso.
     */
    const [emRepouso, setEmRepouso] = useState(frame && repousoInicial);
    /** Segundos que faltam para o totem voltar ao repouso — `null` fora da contagem. */
    const [segundosRestantes, setSegundosRestantes] = useState<number | null>(null);

    /*
     * Nunca zera sem avisar: alguém lendo o resumo do pedido não toca em nada por
     * um minuto, e perder a compra por isso é pior que qualquer tela ociosa.
     */
    useEffect(() => {
        if (!frame || emRepouso || segundosOciosos <= 0) return;

        let aviso: number;
        let fim: number;
        let contagem: number;

        const armar = () => {
            window.clearTimeout(aviso);
            window.clearTimeout(fim);
            window.clearInterval(contagem);
            setSegundosRestantes(null);

            aviso = window.setTimeout(
                () => {
                    setSegundosRestantes(AVISO_SEGUNDOS);
                    contagem = window.setInterval(() => setSegundosRestantes((s) => (s === null ? null : Math.max(0, s - 1))), 1000);
                },
                Math.max(0, (segundosOciosos - AVISO_SEGUNDOS) * 1000),
            );
            fim = window.setTimeout(() => setEmRepouso(true), segundosOciosos * 1000);
        };

        armar();
        // `click` também: teclado e leitor de tela ativam sem passar por pointerdown.
        const eventos = ["pointerdown", "click", "keydown", "wheel"] as const;
        for (const evento of eventos) window.addEventListener(evento, armar, { passive: true });
        return () => {
            window.clearTimeout(aviso);
            window.clearTimeout(fim);
            window.clearInterval(contagem);
            for (const evento of eventos) window.removeEventListener(evento, armar);
        };
    }, [frame, emRepouso, segundosOciosos]);

    /* Sair do repouso é o começo de uma compra nova: a anterior é descartada aqui. */
    const iniciarSessao = () => {
        onOcioso?.();
        setEmRepouso(false);
    };

    const chrome = (
        <div className="flex h-full flex-col overflow-hidden bg-primary text-primary md:bg-secondary" style={accentVars(accent)}>
            {/* Barra INGRESSE (escura) */}
            <header className="h-[56px] shrink-0 bg-primary-solid">
                <div className="mx-auto flex h-[56px] w-full items-center justify-between px-4">
                    {logo ? (
                        <img src={logo} alt="Logo do evento" className="h-8 w-auto object-contain" />
                    ) : (
                        <img src={INGRESSE_LOGO} alt="Ingresse" className="h-7 w-auto" />
                    )}
                    <div className={cx("flex items-center gap-3 text-md text-white", !frame && "hidden")}>
                        {usuario ? (
                            <button
                                type="button"
                                onClick={onAcessar}
                                className="flex items-center gap-1.5 font-semibold transition hover:opacity-80"
                            >
                                {usuario}
                                <svg viewBox="0 0 12 8" className="size-2.5" fill="none" aria-hidden="true">
                                    <path
                                        d="M1 1.5 6 6.5l5-5"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                        ) : (
                            <button type="button" onClick={onAcessar} className="font-semibold transition hover:opacity-80">
                                Acessar conta
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Subheader (claro) */}
            <div className="shrink-0 border-b border-secondary bg-primary">
                <div className="mx-auto flex h-16 w-full items-center justify-between gap-4 px-4">
                    <div className="flex min-w-0 items-center gap-3">
                        {onBack && (
                            <button
                                type="button"
                                onClick={onBack}
                                aria-label="Voltar"
                                className="-m-2 shrink-0 p-2 text-fg-secondary transition hover:text-fg-primary"
                            >
                                <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden="true">
                                    <path
                                        d="M16 10H4m0 0 5-5m-5 5 5 5"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                        )}
                        <h1 className="line-clamp-2 text-xl leading-tight font-semibold text-primary">{title}</h1>
                        {badge && (
                            <span className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-md font-medium text-tertiary">{badge}</span>
                        )}
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                        {action}
                        {onRecomecar && (
                            <button
                                type="button"
                                onClick={onRecomecar}
                                className="flex items-center gap-1.5 text-md text-secondary transition hover:text-primary"
                            >
                                <RefreshCcw01 className="size-4" />
                                Recomeçar
                            </button>
                        )}
                        {frame && (
                            <button type="button" className="flex items-center gap-1.5 text-md text-secondary transition hover:text-primary">
                                <HelpCircle className="size-4" />
                                Ajuda
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <main className="mx-auto min-h-0 w-full flex-1 overflow-y-auto p-0 md:p-4">{children}</main>
        </div>
    );

    if (!frame) return <div className="h-[100dvh]">{chrome}</div>;

    return (
        <TotemFrame>
            {chrome}
            {emRepouso && <TelaDeAtracao evento={title} logo={logo} onIniciar={iniciarSessao} />}
            {!emRepouso && segundosRestantes !== null && (
                <div className="absolute inset-0 z-[55] flex flex-col items-center justify-center gap-6 bg-overlay/80 px-10 text-center backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3 rounded-2xl bg-primary px-8 py-8">
                        <span className="text-3xl font-bold text-primary">Ainda está por aí?</span>
                        <p className="text-lg text-tertiary">
                            A compra vai ser encerrada em <span className="font-semibold text-secondary tabular-nums">{segundosRestantes}s</span>{" "}
                            para liberar o totem.
                        </p>
                        <button
                            type="button"
                            onClick={() => setSegundosRestantes(null)}
                            className="mt-2 rounded-lg bg-brand-solid px-6 py-3 text-lg font-semibold text-white transition hover:bg-brand-solid_hover"
                        >
                            Continuar comprando
                        </button>
                    </div>
                </div>
            )}
        </TotemFrame>
    );
}
