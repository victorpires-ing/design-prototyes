import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/utils/cx";
import logoHorizontal from "../assets/logo-sw-horizontal.svg";
import logoVertical from "../assets/logo-sw-vertical.svg";
import logoMonograma from "../assets/logo-sw-monogram.png";

/* Primitivas gráficas da identidade Sports Week.
   Tudo é vetor ou CSS, para a campanha escalar em qualquer densidade de tela e
   trocar de cor por `currentColor`. */

/** Asterisco de seis pontas. O glifo ✳ não existe na Boldonse nem na Sora,
    então o separador da marca precisa ser vetor. */
export function Asterisco({ className, style }: { className?: string; style?: CSSProperties }) {
    return (
        <svg viewBox="0 0 100 100" aria-hidden="true" className={className} style={style} fill="currentColor">
            <path d="M50,2 L56,39.61 L91.57,26 L62,50 L91.57,74 L56,60.39 L50,98 L44,60.39 L8.43,74 L38,50 L8.43,26 L44,39.61 Z" />
        </svg>
    );
}

/** Filtros de ondulação das faixas de padrão, para a bandeira parecer tremulando
    em vez de um retângulo chapado. Renderizados uma vez, no shell da campanha.
    São duas calibragens: a de 390px vira tremor imperceptível em tela larga, e a
    de tela larga vira distorção grosseira no celular. */
export function WaveDefs() {
    return (
        <svg aria-hidden="true" className="pointer-events-none absolute size-0">
            <defs>
                {/* `color-interpolation-filters="sRGB"` é obrigatório: no padrão (linearRGB)
                    o Chrome lava as cores. A região precisa ser expandida, senão o
                    deslocamento é cortado na borda. Frequência X bem menor que a Y é o
                    que gera onda larga em vez de granulado. */}
                <filter
                    id="sw-wave"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                    colorInterpolationFilters="sRGB"
                >
                    <feTurbulence type="fractalNoise" baseFrequency="0.009 0.028" numOctaves="2" seed="7" result="ruido" />
                    <feDisplacementMap in="SourceGraphic" in2="ruido" scale="26" xChannelSelector="R" yChannelSelector="G" />
                </filter>

                <filter
                    id="sw-wave-lg"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                    colorInterpolationFilters="sRGB"
                >
                    <feTurbulence type="fractalNoise" baseFrequency="0.0027 0.0085" numOctaves="2" seed="7" result="ruido" />
                    <feDisplacementMap in="SourceGraphic" in2="ruido" scale="78" xChannelSelector="R" yChannelSelector="G" />
                </filter>
            </defs>
        </svg>
    );
}

/* ----------------------------- A marca --------------------------------- */

/* As três marcas são os arquivos oficiais, não texto em Boldonse. A logo tem
   desenho próprio: no monograma o S e o W se interpenetram, coisa que fonte
   nenhuma faz, então montar com tipografia dava um parecido, não a marca.

   Pintadas por `mask-image` + `currentColor`, em vez de `<img>`: os arquivos têm
   uma cor só, e assim a MESMA marca serve lime no cromo, branca no hero e navy
   sobre fundo claro, sem precisar de um arquivo por cor. O monograma veio em
   PNG; para a máscara tanto faz, ela lê o canal alfa igual leria o de um SVG.

   Dimensionadas por ALTURA: é o que se enxerga alinhando a marca com o resto da
   linha. A largura sai da proporção do arquivo. */

function Marca({
    fonte,
    proporcao,
    altura,
    rotulo,
    recortado = false,
    className,
    style,
}: {
    fonte: string;
    /** largura ÷ altura da PARTE VISÍVEL do arquivo. */
    proporcao: number;
    altura: number;
    rotulo: string;
    /** Mostra só o topo do arquivo, cortando a assinatura do pé. */
    recortado?: boolean;
    className?: string;
    style?: CSSProperties;
}) {
    /* Recortar é dizer à máscara para cobrir a LARGURA da caixa e deixar a altura
       sair da proporção do arquivo inteiro: o que passa do pé da caixa não é
       pintado. Assim a assinatura some sem precisar de um segundo arquivo. */
    const tamanho = recortado ? "100% auto" : "contain";
    const posicao = recortado ? "left top" : "center";

    return (
        <span
            role="img"
            aria-label={rotulo}
            className={cx("inline-block shrink-0 bg-current", className)}
            style={{
                height: altura,
                width: altura * proporcao,
                maskImage: `url(${fonte})`,
                WebkitMaskImage: `url(${fonte})`,
                maskRepeat: "no-repeat",
                WebkitMaskRepeat: "no-repeat",
                maskSize: tamanho,
                WebkitMaskSize: tamanho,
                maskPosition: posicao,
                WebkitMaskPosition: posicao,
                ...style,
            }}
        />
    );
}

/* Proporções medidas no arquivo, não chutadas. `cheia` é a arte inteira; `limpa`
   é só o letreiro, até onde a assinatura começa. */
const CAIXA = {
    vertical: { cheia: 1346 / 847, limpa: 1346 / 776.61 },
    horizontal: { cheia: 1668 / 268, limpa: 1668 / 202.31 },
} as const;

const ROTULO = "Sports Week, powered by Ticket Sports";

/** Lockup da marca. Empilhado por padrão; `deitado` usa a versão de uma linha,
    para faixas largas e baixas onde o empilhado obrigaria a diminuir demais.

    `semAssinatura` deixa só o letreiro. A assinatura "powered by Ticket Sports"
    ocupa uns 4% da altura do arquivo empilhado: lida bem em peça grande, mas num
    tamanho pequeno vira um fio sujo em vez de palavra. */
export function Logo({
    className,
    altura = 104,
    deitado = false,
    semAssinatura = false,
    style,
}: {
    className?: string;
    altura?: number;
    deitado?: boolean;
    semAssinatura?: boolean;
    style?: CSSProperties;
}) {
    const caixa = deitado ? CAIXA.horizontal : CAIXA.vertical;

    return (
        <Marca
            fonte={deitado ? logoHorizontal : logoVertical}
            proporcao={semAssinatura ? caixa.limpa : caixa.cheia}
            altura={altura}
            recortado={semAssinatura}
            rotulo={semAssinatura ? "Sports Week" : ROTULO}
            className={className}
            style={style}
        />
    );
}

/** Monograma, ladeado pelos asteriscos como no kit da marca. */
export function Monograma({ className, altura = 40 }: { className?: string; altura?: number }) {
    return (
        <span className={cx("inline-flex items-center gap-2", className)}>
            <Asterisco className="shrink-0" style={{ width: altura * 0.26, height: altura * 0.26 }} />
            <Marca fonte={logoMonograma} proporcao={734 / 763} altura={altura} rotulo="Sports Week" />
            <Asterisco className="shrink-0" style={{ width: altura * 0.26, height: altura * 0.26 }} />
        </span>
    );
}

/** Faixa de bandeira quadriculada, na diagonal. Decorativa. */
export function FaixaXadrez({
    className,
    altura = 56,
    rotacao = -12,
    quadro = 16,
    ondulada = true,
}: {
    className?: string;
    altura?: number;
    rotacao?: number;
    quadro?: number;
    ondulada?: boolean;
}) {
    return (
        <div
            aria-hidden="true"
            className={cx("sw-checker pointer-events-none absolute left-[-20%] w-[140%] origin-center", ondulada && "sw-wave", className)}
            style={{ height: altura, transform: `rotate(${rotacao}deg)`, ["--sw-checker-size" as string]: `${quadro}px` }}
        />
    );
}

/** Fileira de asteriscos: o ornamento que separa seções no material impresso. */
export function FileiraAsteriscos({
    quantidade = 9,
    className,
    style,
}: {
    quantidade?: number;
    className?: string;
    style?: CSSProperties;
}) {
    return (
        <div aria-hidden="true" className={cx("flex items-center justify-between px-4 py-2.5", className)} style={style}>
            {Array.from({ length: quantidade }).map((_, i) => (
                <Asterisco key={i} className="size-3 shrink-0" />
            ))}
        </div>
    );
}

/** Tarja pequena de campanha, como as etiquetas "VIP NA SPORTS WEEK" do kit. */
export function Tarja({
    children,
    className,
    style,
}: {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
}) {
    return (
        <span className={cx("sw-overline inline-flex items-center gap-1.5 px-2.5 py-1", className)} style={style}>
            {children}
        </span>
    );
}

/** Cursor pixelado do kit. Puro ornamento. */
export function CursorPixel({ className, style }: { className?: string; style?: CSSProperties }) {
    return (
        <svg viewBox="0 0 12 16" aria-hidden="true" className={className} style={style} shapeRendering="crispEdges">
            <path fill="currentColor" d="M1 0h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1H7v1h1v1h1v2H7v-1H6v-1H5v-1H4v1H3v1H2v1H1z" />
            <path fill="#07132E" d="M2 2h1v1h1v1h1v1h1v1h1v1h1v1h1v1H6v1h1v1h1v1H6v-1H5v-1H4v1H3v1H2z" />
        </svg>
    );
}
