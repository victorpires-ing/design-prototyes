import { useEffect, useRef, type ReactNode } from "react";
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

/**
 * Medidas do topo do mobile. O card da página começa 24px sobre a imagem e desliza por cima
 * dela até encostar na barra (72px). Nesse percurso a imagem e a barra ficam paradas; depois
 * tudo rola junto, e nada passa por baixo da barra. Com a foto padrão (280px) são 184px de
 * percurso e o card sobe 208px (RECUO_CARD_MOBILE).
 */
const FOTO = 280;
const BARRA = 72;
const SOBREPOSICAO = 24;
const percurso = (altura: number) => altura - SOBREPOSICAO - BARRA;

/** Quanto o card sobe sobre o topo do mobile, para uma altura de imagem. */
export const recuoCardMobile = (altura: number) => percurso(altura) + SOBREPOSICAO;

/** Recuo com a foto padrão (usado em pages/oferta.tsx como -mt-[208px]). */
export const RECUO_CARD_MOBILE = recuoCardMobile(FOTO); // 208

/** Foto padrão do topo do mobile, sem desfoque. */
function FotoTopo() {
    return <img src={heroEvento} alt="" aria-hidden="true" className="absolute inset-0 -z-10 size-full object-cover object-[center_40%]" />;
}

/**
 * Topo do mobile: header da Ingresse fixo no alto da tela, sempre vazado sobre a imagem do topo
 * — a foto padrão das ofertas ou outro conteúdo (ex.: o banner rotativo do Checklist), com a
 * altura que ele precisar. O card da página sobe por cima da imagem até encostar no header;
 * daí em diante a rolagem segue por baixo do header, que continua mostrando a faixa de cima da
 * imagem (uma cópia alinhada, `faixa`), então o conteúdo nunca aparece através dele.
 */
export function TopoComImagem({ altura = FOTO, children, faixa }: { altura?: number; children?: ReactNode; faixa?: ReactNode }) {
    const imagens = useRef<HTMLDivElement[]>([]);
    const trecho = percurso(altura);

    // Conforme o card sobe por cima, a imagem recua: escurece de leve (na imagem e na faixa do header)
    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const aoRolar = () => {
            const opacidade = String(1 - Math.min(window.scrollY / trecho, 1) * 0.5);
            imagens.current.forEach((el) => el && (el.style.opacity = opacidade));
        };
        aoRolar();
        window.addEventListener("scroll", aoRolar, { passive: true });
        return () => window.removeEventListener("scroll", aoRolar);
    }, [trecho]);

    const Veu = () => <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent" />;

    return (
        <>
            {/* Header fixo: mostra a faixa de cima da imagem (mesmo recorte), sempre vazado */}
            <div className="fixed inset-x-0 top-0 z-30 isolate overflow-hidden bg-black lg:hidden" style={{ height: BARRA }}>
                <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10" style={{ height: altura }}>
                    <div ref={(el) => void (el && (imagens.current[0] = el))} className="absolute inset-0 isolate">
                        {faixa ?? children ?? <FotoTopo />}
                    </div>
                    <Veu />
                </div>
                <BarraTopo />
            </div>

            {/* A altura extra (percurso) é o trecho em que a imagem fica presa; o card sobe por cima dela */}
            <div className="lg:hidden" style={{ height: altura + trecho }}>
                <header className="sticky top-0 isolate overflow-hidden bg-black" style={{ height: altura }}>
                    <div ref={(el) => void (el && (imagens.current[1] = el))} className="absolute inset-0 isolate">
                        {children ?? <FotoTopo />}
                    </div>
                    <Veu />
                </header>
            </div>
        </>
    );
}
