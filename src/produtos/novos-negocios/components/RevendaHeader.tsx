import { ShieldTick } from "@untitledui/icons";
import logoBlack from "../../../assets/Company logo_black.svg";

/** Sombra skeumórfica dos botões sólidos do canal (igual aos efeitos do Figma). */
export const SOMBRA_BOTAO =
    "shadow-[0_1px_2px_0_rgba(0,0,0,0.05),inset_0_-2px_0_0_rgba(0,0,0,0.05),inset_0_0_0_1px_rgba(0,0,0,0.18)]";

/**
 * Topo do canal de Revenda: logo + selo "Revenda Oficial" + CTA de vender.
 *
 * O box model espelha o do site em produção, medido elemento a elemento:
 * a barra tem gutter próprio (12 no mobile, 56 no desktop) e NÃO acompanha a
 * largura do conteúdo da página; o container é um flex de gap 8 e altura 79,
 * e as distâncias saem da soma desse gap com as margens de cada peça —
 * logo→divisor 20/40, divisor→selo 16, e 12 de recuo até o ícone.
 */
export function RevendaHeader({ onVender }: { onVender?: () => void }) {
    return (
        <header className="sticky top-0 z-30 border-b border-[#d4d4d4] bg-white font-['Elza']">
            <div className="flex h-[79px] w-full items-center gap-2 px-3 lg:px-14">
                <div className="mr-3 flex h-full shrink-0 items-center lg:mr-8">
                    <img src={logoBlack} alt="Ingresse" className="h-auto w-[180px]" />
                </div>

                <span className="h-[50px] w-px shrink-0 bg-[#ff271a] lg:h-[42px]" aria-hidden="true" />

                <span className="ml-2 flex items-center gap-2 pl-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#ffdfdd] lg:size-12">
                        <ShieldTick className="size-5 text-[#ff271a] lg:size-6" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span className="max-w-[64px] text-[16px] leading-[19.2px] font-medium tracking-[0.7px] text-[#ff271a] lg:max-w-none lg:text-[18px] lg:leading-[21.6px] lg:font-semibold">
                        Revenda Oficial
                    </span>
                </span>

                {/* Em produção o CTA não aparece no mobile */}
                <button
                    type="button"
                    onClick={onVender}
                    className={`ml-auto hidden h-11 shrink-0 items-center justify-center rounded-lg bg-[#ff271a] px-5 text-sm leading-[16.8px] font-medium tracking-[0.7px] text-white uppercase transition duration-100 ease-linear hover:bg-[#e11b10] md:flex ${SOMBRA_BOTAO}`}
                >
                    Vender meu ingresso
                </button>
            </div>
        </header>
    );
}
