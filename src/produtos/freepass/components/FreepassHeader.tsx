import { ChevronDown, Globe01, SearchLg } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import LogoBlack from "../../../../assets/Company logo_black.svg";
import LogoWhite from "../../../../assets/Company logo_white.svg";

/** Nav bar consumer do Freepass (logo · busca · idioma · conta). */
export function FreepassHeader({ className }: { className?: string }) {
    return (
        <header className={cx("sticky top-0 z-30 border-b border-secondary bg-primary", className)}>
            <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-4 px-4 md:h-18 md:px-8">
                <a href="/freepass/distribuicao-cortesias" aria-label="Início" className="shrink-0">
                    <img src={LogoBlack} alt="Ingresse" className="block h-7 dark:hidden" />
                    <img src={LogoWhite} alt="Ingresse" className="hidden h-7 dark:block" />
                </a>

                <div className="ml-auto hidden max-w-80 flex-1 md:block">
                    <Input size="sm" icon={SearchLg} aria-label="Buscar eventos" placeholder="Buscar eventos" />
                </div>

                <div className="ml-auto flex items-center gap-2 md:ml-0">
                    <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-secondary transition duration-100 ease-linear hover:bg-secondary"
                    >
                        <Globe01 className="size-4 text-fg-quaternary" aria-hidden="true" />
                        PT
                        <ChevronDown className="size-4 text-fg-quaternary" aria-hidden="true" />
                    </button>
                    <Avatar size="sm" initials="VP" />
                </div>
            </div>
        </header>
    );
}
