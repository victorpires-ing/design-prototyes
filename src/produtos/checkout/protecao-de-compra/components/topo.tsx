import { ChevronDown, HelpCircle, Share04 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import logo from "../assets/ingresse-logo-branco.svg";
import { EVENTO } from "../data/evento";

/** Faixa com a foto do evento desfocada, logo e usuário; abaixo, o nome do evento e as ações. */
export function Topo() {
    return (
        <header>
            <div className="relative h-[71px] overflow-hidden bg-[#7d6a66]">
                <img
                    src="https://picsum.photos/seed/dawn-patrol/1600/300"
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 size-full scale-110 object-cover opacity-70 blur-xl"
                />
                <div className="absolute inset-0 bg-[#3d2f2c]/40" />
                <div className="relative mx-auto flex h-full max-w-[1408px] items-center justify-between px-4 lg:px-0">
                    <img src={logo} alt="Ingresse" className="h-7" />
                    <button type="button" className="flex items-center gap-2 text-[13px] font-semibold text-white">
                        <span className="flex items-center gap-0.5">
                            Janaina Souza <ChevronDown className="size-4" aria-hidden="true" />
                        </span>
                        <span aria-hidden="true" className="text-lg leading-none">
                            🇧🇷
                        </span>
                    </button>
                </div>
            </div>

            <div className="border-b border-[#ececec] bg-white">
                <div className="mx-auto flex max-w-[1408px] items-center justify-between gap-4 px-4 py-3 lg:px-0">
                    <h1 className="text-base font-bold text-[#1a1a1a]">{EVENTO.nome}</h1>
                    <div className="flex gap-2">
                        <BotaoContorno icone={Share04} somenteIconeNoMobile>
                            Compartilhar
                        </BotaoContorno>
                        <BotaoContorno icone={HelpCircle} somenteIconeNoMobile>
                            Preciso de ajuda
                        </BotaoContorno>
                    </div>
                </div>
            </div>
        </header>
    );
}

export function BotaoContorno({
    icone: Icone,
    children,
    iconeAntes,
    somenteIconeNoMobile,
}: {
    icone: typeof Share04;
    children: React.ReactNode;
    iconeAntes?: boolean;
    /** No celular o texto fica só para leitores de tela, para o nome do evento caber na barra. */
    somenteIconeNoMobile?: boolean;
}) {
    return (
        <button
            type="button"
            className="flex h-11 items-center gap-2 rounded-xl border border-[#dcdcdc] bg-white px-3 text-sm font-semibold text-[#1a1a1a] transition duration-100 ease-linear hover:bg-[#f7f7f7]"
        >
            {iconeAntes && <Icone className="size-4" aria-hidden="true" />}
            <span className={cx(somenteIconeNoMobile && "sr-only sm:not-sr-only")}>{children}</span>
            {!iconeAntes && <Icone className="size-4" aria-hidden="true" />}
        </button>
    );
}
