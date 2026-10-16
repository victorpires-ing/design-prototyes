import { useEffect } from "react";
import { useNavigate } from "react-router";
import { CheckCircle, ShieldTick, SwitchHorizontal01, Ticket01 } from "@untitledui/icons";
import { useTheme } from "@/providers/theme-provider";
import { cx } from "@/utils/cx";
import logoWhite from "../../../../assets/Company logo_white.svg";
import { RevendaHeader, SOMBRA_BOTAO } from "../../components/RevendaHeader";
import { CardAvisoEvento } from "../components/CardAvisoEvento";
import { CardIngresso } from "../components/CardIngresso";
import { CarrosselMaisBuscados } from "../components/CarrosselMaisBuscados";
import { Faq } from "../components/Faq";
import { EVENTOS, MAIS_BUSCADOS, type EventoRevenda } from "../../data/eventos";

/** Força o tema light enquanto o canal (consumer) está montado. */
function useForceLightTheme() {
    const { theme, setTheme } = useTheme();
    useEffect(() => {
        const previous = theme;
        setTheme("light");
        return () => setTheme(previous);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}

/**
 * Textura do hero — aproximação do shader de partículas do Figma
 * (particleColor #996500, particleSize 1.5, density 10, opacidade 0.2).
 */
const TEXTURA_PARTICULAS = {
    backgroundImage: [
        "radial-gradient(circle, #996500 1.2px, transparent 1.3px)",
        "radial-gradient(circle, #996500 1px, transparent 1.1px)",
        "radial-gradient(circle, #996500 1.4px, transparent 1.5px)",
    ].join(","),
    backgroundSize: "57px 61px, 83px 47px, 103px 89px",
    backgroundPosition: "0 0, 23px 31px, 61px 11px",
};

const BENEFICIOS = [
    { icon: ShieldTick, linhas: ["Pagamento seguro,", "sem chance de calote"] },
    { icon: SwitchHorizontal01, linhas: ["Transferência automática e", "imediata de titularidade"] },
    { icon: Ticket01, linhas: ["Plataforma Oficial: ingresso", "validado pela Ingresse"] },
    { icon: CheckCircle, linhas: ["Comprador e", "vendedor verificados"] },
];

export function Home() {
    useForceLightTheme();

    // O React Router não reseta o scroll entre rotas: entrar no canal vindo de
    // uma página já rolada (a seleção de produtos) começaria no meio da home.
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const navigate = useNavigate();
    const abrirEvento = (evento: EventoRevenda) => navigate(`/revenda/${evento.id}`);

    return (
        <div className="min-h-screen bg-white font-['Elza'] text-[#374151]">
            <RevendaHeader />

            {/* Hero */}
            <section className="relative overflow-hidden bg-[#fff5e4]">
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-20" style={TEXTURA_PARTICULAS} />
                <div className="relative mx-auto grid w-full max-w-[1380px] grid-cols-1 items-center px-4 pt-16 pb-8 lg:grid-cols-2 lg:px-0 lg:py-8">
                    <div className="flex flex-col items-center gap-8 pb-8 text-center lg:gap-10 lg:px-4 lg:pb-0">
                        <h1 className="text-[32px] leading-[38px] font-semibold tracking-[-0.02em] text-[#181818] lg:text-5xl lg:leading-[52px] lg:text-[#374151]">
                            Deu sold out? Relaxa. Ainda dá pra viver essa experiência.
                        </h1>
                        <p className="text-xl leading-[1.2] text-[#181818] lg:text-[#374151]">
                            Com a Revenda Oficial Ingresse, conectamos quem quer vender o ingresso com quem quer comprar pra não perder o ao vivo por nada.
                        </p>
                        <div className="flex w-full items-center justify-center gap-2">
                            <button
                                type="button"
                                className="inline-flex h-11 items-center justify-center rounded-lg border border-[#ff271a] px-5 text-sm font-medium tracking-[0.7px] text-[#ff271a] uppercase transition duration-100 ease-linear hover:bg-[#fff0ef]"
                            >
                                Quero vender
                            </button>
                            <button
                                type="button"
                                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#ff271a] px-5 text-sm font-medium tracking-[0.7px] text-white uppercase transition duration-100 ease-linear hover:bg-[#e11b10]"
                            >
                                Quero comprar
                            </button>
                        </div>
                    </div>

                    {/* Divisor só no mobile (o desktop não tem) */}
                    <span aria-hidden="true" className="mx-4 block h-px bg-[#ff271a] lg:hidden" />

                    {/* Os mais buscados — 1 card no mobile (seta sobreposta), 2 no desktop (seta ao lado) */}
                    <div className="flex flex-col items-center gap-4 pt-8 pb-8 lg:px-4 lg:pb-0">
                        <h2 className="w-full text-center text-[32px] leading-[38px] font-semibold text-[#ff271a] lg:text-[42px] lg:leading-[50px]">
                            Os mais buscados hoje
                        </h2>
                        <CarrosselMaisBuscados eventos={MAIS_BUSCADOS} aoSelecionar={abrirEvento} />
                    </div>
                </div>
            </section>

            {/* Benefícios (faixa preta) */}
            <section className="bg-black">
                <div className="mx-auto max-w-[1280px] py-9 lg:px-14 lg:py-8">
                    {/* Em produção o mobile rola na horizontal em vez de empilhar */}
                    <div className="flex gap-3 overflow-x-auto px-9 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:px-0">
                        {BENEFICIOS.map((b) => (
                            <div
                                key={b.linhas[0]}
                                className="flex w-max shrink-0 flex-col gap-8 rounded bg-[#181818] p-6 ring-1 ring-[#262626] ring-inset lg:w-auto"
                            >
                                <span className="flex size-6 items-center justify-center">
                                    <b.icon className="size-6 text-[#ff4a40]" aria-hidden="true" />
                                </span>
                                <div className="flex flex-col gap-1">
                                    {b.linhas.map((l) => (
                                        <p key={l} className="text-[19.32px] leading-[1.3] whitespace-nowrap text-white lg:whitespace-normal">
                                            {l}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Grade principal */}
            <section className="mx-auto w-full max-w-[1216px] px-[11px] pt-12 pb-12 lg:px-0 lg:pt-20 lg:pb-16">
                <h2 className="px-[15px] py-[5px] text-xl leading-7 font-bold text-black uppercase lg:px-0 lg:py-0 lg:text-[32px] lg:leading-[28px]">
                    Compre de quem não vai mais
                </h2>
                {/* 2 colunas no mobile (como em produção), 4 no desktop */}
                <div className="mt-8 grid grid-cols-2 items-start gap-x-2 gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-4">
                    {EVENTOS.map((e) => (
                        <CardIngresso key={e.id} evento={e} onClick={() => abrirEvento(e)} />
                    ))}
                    <CardAvisoEvento />
                </div>
            </section>

            {/* Banner promocional — bloco rosa + foto à direita (como em produção) */}
            <section className="mx-auto max-w-[1280px] px-8 py-8 lg:px-8 lg:pt-14 lg:pb-8">
                <div className="relative flex h-[549px] flex-col justify-end overflow-hidden rounded-2xl bg-[#f83b56] p-4 lg:h-auto lg:flex-row lg:justify-start lg:p-0">
                    <div className="relative z-10 flex flex-col gap-8 pt-8 lg:flex-1 lg:p-8">
                        <div className="flex flex-col gap-2">
                            <p className="text-sm leading-[1.2] font-bold text-[#cbc648] lg:text-[28px] lg:leading-[41.25px]">OFERTA ESPECIAL</p>
                            <p className="text-base leading-[1.2] font-medium text-white lg:text-[28px] lg:leading-[41.25px]">
                                Garanta o BOMA PRESENTS: WHOMADEWHO &amp; DENIS SULTA com condições especiais na revenda ⚡️
                            </p>
                        </div>
                        <button
                            type="button"
                            className="w-full rounded-lg bg-[#cdd048] px-6 py-2.5 text-base font-semibold text-[#1a69c0] transition duration-100 ease-linear hover:bg-[#c2c53f] lg:w-fit"
                        >
                            APROVEITAR OFERTA
                        </button>
                    </div>
                    {/* Foto do evento (placeholder até ter o asset) */}
                    <div
                        aria-hidden="true"
                        className="absolute top-[54px] left-[75px] h-[283px] w-[207px] origin-top-left rotate-[11.9deg] rounded-lg bg-cover bg-center lg:static lg:h-auto lg:w-[494px] lg:rotate-0 lg:rounded-none"
                        style={{ backgroundImage: "linear-gradient(135deg,#f6c445 0%,#e8763a 45%,#2f6fb5 100%)" }}
                    />
                </div>
            </section>

            {/* Faixa vermelha — comprou e não vai mais */}
            <section className="bg-[#ff271a]">
                <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-4 px-8 py-16 text-center lg:px-6">
                    <h2 className="text-[28px] leading-[38px] font-bold text-[#fff5e4] normal-case lg:text-[32px] lg:leading-[28px] lg:uppercase">Comprou e não vai mais?</h2>
                    <p className="max-w-[768px] text-left text-base text-white">
                        Revender seu ingresso na <strong className="font-bold">plataforma oficial da Ingresse</strong> é o caminho mais seguro para evitar dores de cabeça na transferência e no recebimento do seu dinheiro.<br className="lg:hidden" /> Você acessa seu ingresso e clica em vender, escolhe o preço e pronto! <strong className="font-bold">É simples, rápido e seguro.</strong>
                    </p>
                    <button
                        type="button"
                        className={cx(
                            "rounded-lg bg-[#fff1f0] px-5 py-3 text-base font-semibold text-[#171717] transition duration-100 ease-linear hover:bg-white",
                            SOMBRA_BOTAO,
                        )}
                    >
                        Quero vender meu ingresso
                    </button>
                </div>
            </section>

            <Faq />
            <RevendaFooter />
        </div>
    );
}

const FOOTER_COLS = [
    { titulo: "A Ingresse", links: ["Sobre nós"] },
    { titulo: "Seus direitos aqui", links: ["Lei da Meia-Entrada", "Termos de Serviço", "Termos de Privacidade"] },
];

function RevendaFooter() {
    return (
        <footer className="bg-black text-white">
            <div className="mx-auto w-full max-w-[1440px] px-5 pt-12 pb-12 lg:px-[136px] lg:pt-[130px] lg:pb-[30px]">
                <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-[369.6px_217.4px_217.4px_minmax(0,1fr)] lg:gap-x-14 lg:gap-y-12">
                    {/* Coluna 1 — headline + contato */}
                    <div className="flex flex-col gap-4">
                        <h2 className="text-[34px] leading-[37.4px] font-bold uppercase lg:text-[56px] lg:leading-[61.6px]">
                            Ao vivo,
                            <br />
                            ao máximo.
                        </h2>
                        <button
                            type="button"
                            className="mt-4 flex h-12 w-fit items-center justify-center rounded-[10px] bg-[#ff4d3d] px-[32.73px] lg:mt-8 text-[14px] leading-5 tracking-[0.84px] text-white uppercase transition duration-100 ease-linear hover:bg-[#e8402f]"
                        >
                            Quer falar com a gente?
                        </button>
                        <p className="text-[14px] leading-6 tracking-[0.7px] text-white/90 lg:text-[16px] lg:tracking-[0.8px]">Se precisar de ajuda, a gente tá por aqui.</p>
                    </div>

                    {FOOTER_COLS.map((col) => (
                        <div key={col.titulo} className="flex flex-col gap-4 pb-4 lg:gap-5">
                            <h3 className="text-lg font-bold">{col.titulo}</h3>
                            <ul className="flex flex-col gap-4">
                                {col.links.map((l) => (
                                    <li key={l}>
                                        <a href="#" className="text-[14px] leading-6 text-white/80 transition duration-100 ease-linear hover:text-white">
                                            {l}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    <div className="flex flex-col gap-4 pb-4 lg:gap-5">
                        <h3 className="text-lg font-bold">Baixe o app Ingresse</h3>
                        <div className="flex items-center gap-4">
                            <a href="#" aria-label="App Store" className="flex h-[34px] items-center rounded-md px-3 text-xs text-white/70 ring-1 ring-white/20">
                                App Store
                            </a>
                            <a href="#" aria-label="Google Play" className="flex h-[34px] items-center rounded-md px-3 text-xs text-white/70 ring-1 ring-white/20">
                                Google Play
                            </a>
                        </div>
                    </div>
                </div>

                {/* Barra inferior */}
                <div className="mt-10 flex flex-col gap-6 border-t border-white/20 pt-6 lg:mt-14 lg:flex-row lg:items-center lg:justify-between lg:pt-8">
                    <img src={logoWhite} alt="Ingresse" className="h-[39.1px] w-[150px] opacity-[0.84]" />

                    <div className="flex items-center gap-2 lg:gap-3">
                        <button type="button" className="flex items-center text-[16px] leading-6 text-white">
                            <img src="/Brazil flag.svg" alt="" className="size-[25px]" />
                            <span className="pr-1 pl-1">PT</span>
                        </button>
                        <button type="button" className="flex items-center text-[16px] leading-6 text-white opacity-50">
                            ES
                        </button>
                        <button type="button" className="flex items-center text-[16px] leading-6 text-white opacity-50">
                            EN
                        </button>
                    </div>

                    <p className="text-xs leading-4 text-white/90 lg:text-[14px] lg:leading-5">© 2026 Todos os direitos reservados</p>
                </div>
            </div>
        </footer>
    );
}
