import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { ChevronDown } from "@untitledui/icons";
import heroEvento from "../assets/hero-evento.jpg";
import logoWhite from "../../../../assets/Company logo_white.svg";
import { EVENTO, USUARIO } from "../data/servicos";

/** Fundo com o banner do evento levemente desfocado: dá a identidade visual sem roubar a leitura. */
function FundoBanner({ veu = "bg-black/55", desfoque = "blur-[12px]" }: { veu?: string; desfoque?: string }) {
    return (
        <>
            <img src={EVENTO.poster} alt="" aria-hidden="true" className={`absolute inset-0 -z-10 size-full scale-110 object-cover ${desfoque}`} />
            <div aria-hidden="true" className={`absolute inset-0 -z-10 ${veu}`} />
        </>
    );
}

/** Logo, usuário e idioma — a barra vazada do header B2C da Ingresse. */
function BarraTopo() {
    return (
        <div className="mx-auto flex h-[72px] w-full max-w-[1264px] items-center justify-between gap-4 px-4 lg:px-6">
            {/* No protótipo a marca volta para a lista de ofertas */}
            <Link
                to="/novos-negocios/servicos-adicionais"
                aria-label="Ingresse — Serviços adicionais"
                className="rounded-sm outline-focus-ring focus-visible:outline-2"
            >
                <img src={logoWhite} alt="Ingresse" className="h-7 w-auto" />
            </Link>
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <button
                    type="button"
                    className="hidden cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 transition duration-100 ease-linear hover:bg-white/10 sm:flex"
                >
                    {USUARIO.nome}
                    <ChevronDown className="size-4" aria-hidden="true" />
                </button>
                <button
                    type="button"
                    className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 transition duration-100 ease-linear hover:bg-white/10"
                >
                    <img src="/Brazil flag.svg" alt="" className="size-4 rounded-full" />
                    PT
                    <ChevronDown className="size-4" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}

/**
 * Header B2C do site (Figma "B2C header navigation"): barra vazada sobre o banner do
 * evento desfocado, com logo, usuário e idioma. Usado no desktop e no pagamento/confirmação.
 * `comEvento={false}` tira o banner (fundo preto liso) quando a tela não é de um evento.
 */
export function Topo({ comEvento = true }: { comEvento?: boolean }) {
    return (
        <header className="relative isolate overflow-hidden bg-black">
            {comEvento && <FundoBanner />}
            <BarraTopo />
        </header>
    );
}

/** Altura total do topo do mobile (barra + imagem); fixa para alinhar o recorte da foto nas duas camadas. */
const ALTURA_TOPO_MOBILE = "h-[280px]";

/** Foto do topo do mobile, sem desfoque; o véu escurece só o alto para o logo e o idioma lerem bem. */
function FotoTopo() {
    return (
        <>
            <img src={heroEvento} alt="" aria-hidden="true" className="absolute inset-0 -z-10 size-full object-cover object-[center_40%]" />
            <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-28 bg-gradient-to-b from-black/60 to-transparent" />
        </>
    );
}

/**
 * Topo do mobile na oferta: header vazado sobre uma foto com clima de evento, sem amarrar a
 * comunicação a um evento específico. Duas camadas presas ao topo: a da foto fica atrás do
 * card (que desliza por cima dela) e a barra com logo e idioma fica na frente, sempre
 * visível. A barra usa o mesmo recorte da foto, então não aparece emenda entre as duas.
 * Precisa ser filho direto da página (sem wrapper) para o sticky valer na rolagem toda.
 */
export function TopoComImagem() {
    const foto = useRef<HTMLDivElement>(null);

    // Conforme o card sobe por cima, a foto recua: escurece de leve
    useEffect(() => {
        const el = foto.current;
        if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const aoRolar = () => {
            const p = Math.min(window.scrollY / 200, 1);
            el.style.opacity = String(1 - p * 0.5);
        };
        aoRolar();
        window.addEventListener("scroll", aoRolar, { passive: true });
        return () => window.removeEventListener("scroll", aoRolar);
    }, []);

    return (
        <>
            {/* Frente: barra com logo e idioma */}
            <div className="sticky top-0 z-20 isolate h-[72px] overflow-hidden bg-black lg:hidden">
                <div className={`absolute inset-x-0 top-0 -z-10 ${ALTURA_TOPO_MOBILE}`}>
                    <FotoTopo />
                </div>
                <BarraTopo />
            </div>

            {/* Atrás: a foto, que o card cobre ao rolar */}
            <header className={`sticky top-0 z-0 -mt-[72px] overflow-hidden bg-black lg:hidden ${ALTURA_TOPO_MOBILE}`}>
                <div ref={foto} className="relative isolate size-full">
                    <FotoTopo />
                </div>
            </header>
        </>
    );
}
