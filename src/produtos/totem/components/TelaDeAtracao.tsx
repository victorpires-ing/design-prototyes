import { Ticket02 } from "@untitledui/icons";

/** Logo oficial da Ingresse (versão clara, para fundo escuro). */
const INGRESSE_LOGO = "https://auth.prod.ingresse.com/resources/2ibrw/login/custom/img/ingresse-light.svg";

interface Props {
    /** Nome do evento travado neste totem. */
    evento: string;
    /** Logo do evento, quando configurada. */
    logo?: string;
    /** Toque em qualquer lugar inicia uma sessão nova. */
    onIniciar: () => void;
}

/**
 * Tela de atração: o estado de repouso do totem.
 *
 * Um equipamento de rua nunca fica parado no meio de um formulário — ou está
 * convidando quem passa, ou está atendendo alguém. Ela também é a fronteira
 * entre uma compra e a próxima: sair daqui zera o carrinho da pessoa anterior.
 */
export function TelaDeAtracao({ evento, logo, onIniciar }: Props) {
    return (
        <button
            type="button"
            onClick={onIniciar}
            aria-label={`Começar a compra de ingressos para ${evento}`}
            className="absolute inset-0 z-[60] flex cursor-pointer flex-col items-center justify-between bg-[#111114] px-10 py-16 text-center text-white"
        >
            <img src={logo || INGRESSE_LOGO} alt="" className="h-12 w-auto object-contain" />

            <div className="flex flex-col items-center gap-6">
                <Ticket02 className="size-20 text-white/30" aria-hidden="true" />
                <div className="flex flex-col gap-3">
                    <span className="text-sm font-semibold tracking-[0.25em] text-white/50 uppercase">Ingressos</span>
                    <span className="text-4xl leading-tight font-bold text-balance">{evento}</span>
                </div>
            </div>

            {/*
              O convite fica na faixa baixa da tela: num totem de chão, o topo do
              painel passa da altura dos olhos e a base fica na altura do joelho.
              É aqui que a mão alcança sem esforço.
            */}
            <span className="flex flex-col items-center gap-4">
                <span className="relative flex size-4 items-center justify-center">
                    <span className="absolute inline-flex size-4 animate-ping rounded-full bg-white/40 motion-reduce:hidden" />
                    <span className="relative inline-flex size-3 rounded-full bg-white" />
                </span>
                <span className="text-2xl font-semibold">Toque para começar</span>
            </span>
        </button>
    );
}
