import { ShieldTick } from "@untitledui/icons";
import logoBlack from "../../../assets/Company logo_black.svg";

/** Sombra skeumórfica dos botões sólidos do canal (igual aos efeitos do Figma). */
export const SOMBRA_BOTAO =
    "shadow-[0_1px_2px_0_rgba(0,0,0,0.05),inset_0_-2px_0_0_rgba(0,0,0,0.05),inset_0_0_0_1px_rgba(0,0,0,0.18)]";

/** Topo do canal de Revenda: logo + selo "Revenda Oficial" + CTA de vender. */
export function RevendaHeader({ onVender }: { onVender?: () => void }) {
    return (
        <header className="sticky top-0 z-30 border-b border-[#d4d4d4] bg-white font-['Elza']">
            <div className="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between px-3 lg:px-14">
                <div className="flex items-center">
                    <div className="flex shrink-0 items-center pr-3 lg:pr-8">
                        <img src={logoBlack} alt="Ingresse" className="h-auto w-[180px]" />
                    </div>

                    <span className="h-[50px] w-px shrink-0 bg-[#ff271a]" aria-hidden="true" />

                    <span className="ml-2 flex items-center gap-2 px-2 py-2 lg:ml-4 lg:px-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#ffdfdd] lg:size-12">
                            <ShieldTick className="size-5 text-[#ff271a] lg:size-6" strokeWidth={2} aria-hidden="true" />
                        </span>
                        <span className="max-w-[90px] text-[16px] leading-[19px] font-medium tracking-[0.7px] text-[#ff271a] lg:max-w-none lg:text-[18px] lg:leading-[22px] lg:font-semibold">
                            Revenda Oficial
                        </span>
                    </span>
                </div>

                {/* Em produção o CTA não aparece no mobile */}
                <button
                    type="button"
                    onClick={onVender}
                    className={`hidden h-11 shrink-0 items-center justify-center rounded-lg bg-[#ff271a] px-5 text-sm font-medium tracking-[0.7px] text-white uppercase transition duration-100 ease-linear hover:bg-[#e11b10] md:flex ${SOMBRA_BOTAO}`}
                >
                    Vender meu ingresso
                </button>
            </div>
        </header>
    );
}
