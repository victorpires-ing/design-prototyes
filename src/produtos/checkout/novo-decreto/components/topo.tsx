import brazil from "../assets/brazil.svg";
import capaEvento from "../assets/evento-capa.png";
import icChevronIdioma from "../assets/ic-chevron-idioma.svg";
import icHelp from "../assets/ic-help.svg";
import icLocation from "../assets/ic-location.svg";
import icLocked from "../assets/ic-locked.svg";
import logomark from "../assets/logomark.svg";
import logotext from "../assets/logotext.svg";
import { EVENTO } from "../data/pedido";
import { useTempoReserva } from "../utils/hooks";
import { Icone } from "./base";

export const CapaEvento = () => <img src={capaEvento} alt="" className="size-20 shrink-0 rounded-lg object-cover" />;

/** "branding": barra preta com o logo da Ingresse. */
function Branding() {
    return (
        <div className="flex h-11 items-center justify-center bg-(--ck-bar) px-6 py-2">
            <div className="flex items-start gap-[4.167px]" aria-label="Ingresse" role="img">
                <span className="h-5 w-[16.667px]">
                    <img src={logomark} alt="" className="block h-5 w-[17.5px] max-w-none" />
                </span>
                <img src={logotext} alt="" className="block h-5 w-[55.833px]" />
            </div>
        </div>
    );
}

function Stepper() {
    return (
        <nav aria-label="Etapas da compra" className="flex items-center gap-2 text-[14px] whitespace-nowrap text-(--ck-text-quaternary)">
            <span className="leading-5">Ingressos</span>
            <span aria-hidden="true" className="tracking-[0.224px]">•</span>
            <span className="leading-5">Atribuição</span>
            <span aria-hidden="true" className="tracking-[0.224px]">•</span>
            <span aria-current="step" className="leading-5 font-bold text-(--ck-utility-brand-500)">
                Pagamento
            </span>
        </nav>
    );
}

function Suporte({ isMobile }: { isMobile: boolean }) {
    return (
        <button
            type="button"
            className={`flex h-6 items-center justify-center gap-2 bg-(--ck-bg-brand-primary) px-3 ${isMobile ? "rounded-lg" : "rounded-[4px]"}`}
        >
            <Icone src={icHelp} tamanho={16} />
            <span className="text-[12px] leading-normal font-medium text-(--ck-utility-red-500)">Suporte</span>
        </button>
    );
}

function Idioma() {
    return (
        <button type="button" className="flex items-center gap-1" aria-label="Idioma: português">
            <img src={brazil} alt="" className="size-6" />
            <span className="w-[22px] text-center text-[12px] leading-[18px] text-(--ck-text-primary)">PT</span>
            <Icone src={icChevronIdioma} tamanho={16} />
        </button>
    );
}

/** Cabeçalho do checkout: branding + etapas, suporte, idioma e (desktop) o evento. */
export function Cabecalho({ isMobile }: { isMobile: boolean }) {
    if (isMobile) {
        return (
            <header>
                <Branding />
                <div className="flex flex-col items-center gap-4 bg-(--ck-bg-primary) px-6 py-4">
                    <Stepper />
                    <div className="flex w-full items-center justify-between">
                        <Suporte isMobile />
                        <Idioma />
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header>
            <Branding />
            <div className="bg-(--ck-bg-primary) px-6 py-4 xl:px-[124px]">
                <div className="mx-auto flex max-w-[1192px] flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <Stepper />
                        <div className="flex items-center gap-4">
                            <Suporte isMobile={false} />
                            <Idioma />
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <CapaEvento />
                        <div className="flex h-20 min-w-0 flex-1 flex-col justify-between">
                            <p className="text-[16px] leading-6 font-bold text-(--ck-text-primary)">{EVENTO.nome}</p>
                            <p className="flex items-center gap-1 text-[14px] leading-5 text-(--ck-text-secondary)">
                                <Icone src={icLocation} tamanho={16} />
                                {EVENTO.local}
                            </p>
                            <div className="flex h-6 items-center gap-4 text-[12px] leading-normal font-medium text-(--ck-text-brand-tertiary)">
                                <a href="#evento" onClick={(e) => e.preventDefault()}>
                                    Ver página do evento
                                </a>
                                <a href="#compartilhar" onClick={(e) => e.preventDefault()}>
                                    Compartilhar
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

/** "Finalizar compra" + "Compra 100% segura" + "Tempo restante". */
export function TituloFinalizar({ isMobile }: { isMobile: boolean }) {
    const tempo = useTempoReserva();

    if (isMobile) {
        return (
            <div className="flex flex-col gap-1 leading-[1.4] whitespace-nowrap">
                <div className="flex items-center justify-between">
                    <h1 className="text-[18px] leading-[1.4] font-bold text-(--ck-heading-card)">Finalizar compra</h1>
                    <p className="text-[13px] leading-[1.4] text-(--ck-text-muted)">
                        Tempo restante: <span className="tabular-nums">{tempo}</span>
                    </p>
                </div>
                <p className="text-[12px] leading-[1.4] text-(--ck-text-muted)">Compra 100% segura</p>
            </div>
        );
    }

    return (
        <div className="flex h-14 items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
                <h1 className="text-[20px] leading-7 font-bold text-(--ck-content-primary)">Finalizar compra</h1>
                <p className="flex h-5 items-center gap-2 text-[12px] leading-5 text-(--ck-text-seguro)">
                    <Icone src={icLocked} tamanho={16} />
                    Compra 100% segura
                </p>
            </div>
            <p className="text-[14px] leading-5 tracking-[0.28px] whitespace-nowrap text-(--ck-content-secundary)">
                Tempo restante:<span className="tabular-nums">{tempo}</span>
            </p>
        </div>
    );
}
