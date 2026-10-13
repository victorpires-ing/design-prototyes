import { useEffect, useRef } from "react";
import { XClose } from "@untitledui/icons";
import { SOMBRA_BOTAO } from "../../components/RevendaHeader";

const TAXAS = [
    {
        titulo: "Taxa de serviço",
        texto: "Relacionada à operação e intermediação da revenda, incluindo segurança e manutenção da plataforma.",
    },
    {
        titulo: "Taxa de processamento",
        texto: "Relacionada ao processamento do pagamento. O valor pode variar conforme a forma de pagamento escolhida.",
    },
];

/**
 * "Entenda as taxas" — modal aberto pelo ícone de informação na linha de oferta.
 * Desktop: diálogo centrado de 560px. Mobile: bottom sheet de 64px acima da base.
 * Medidas, sombra em 3 camadas e overlay com blur conforme o Figma (16501:48292).
 */
export function ModalTaxas({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
    const dialogo = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!aberto) return;

        const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
        document.addEventListener("keydown", aoTeclar);

        // Trava o scroll do fundo enquanto o modal está aberto
        const overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        dialogo.current?.focus();

        return () => {
            document.removeEventListener("keydown", aoTeclar);
            document.body.style.overflow = overflowAnterior;
        };
    }, [aberto, aoFechar]);

    if (!aberto) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex animate-in fade-in justify-center bg-[#0a0a0a]/70 p-4 pb-16 duration-150 ease-linear backdrop-blur-[16px] sm:items-center sm:p-8"
            onClick={aoFechar}
        >
            <div
                ref={dialogo}
                role="dialog"
                aria-modal="true"
                aria-labelledby="titulo-taxas"
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
                className="relative mt-auto flex w-full max-w-[560px] flex-col rounded-2xl bg-white font-['Elza'] outline-none animate-in slide-in-from-bottom-4 duration-200 ease-out sm:mt-0 shadow-[0_3px_3px_-1.5px_rgba(0,0,0,0.04),0_8px_8px_-4px_rgba(0,0,0,0.03),0_20px_24px_-4px_rgba(0,0,0,0.08)]"
            >
                <button
                    type="button"
                    onClick={aoFechar}
                    aria-label="Fechar"
                    className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-lg text-[#a3a3a3] transition duration-100 ease-linear hover:bg-black/5 hover:text-[#525252] sm:top-4 sm:right-4"
                >
                    <XClose className="size-5" strokeWidth={1.667} aria-hidden="true" />
                </button>

                <div className="flex flex-col gap-4 px-4 pt-5 sm:px-6 sm:pt-6">
                    <div className="flex flex-col gap-0.5">
                        <h2 id="titulo-taxas" className="pr-10 text-base leading-6 font-semibold text-[#171717]">
                            Entenda as taxas
                        </h2>

                        {/* O Figma usa um nó único com paragraphSpacing 14 — daí o gap, e não <br/> */}
                        <div className="flex flex-col gap-[14px] text-sm leading-5 text-[#525252]">
                            {TAXAS.map((t) => (
                                <p key={t.titulo}>
                                    <strong className="font-semibold">{t.titulo}</strong> {t.texto}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="px-4 pt-6 pb-4 sm:px-6 sm:pt-8 sm:pb-6">
                    <button
                        type="button"
                        onClick={aoFechar}
                        className={`flex h-10 w-full items-center justify-center rounded-lg bg-[#ff271a] text-sm leading-none font-semibold text-white transition duration-100 ease-linear hover:bg-[#e11b10] ${SOMBRA_BOTAO}`}
                    >
                        Entendi
                    </button>
                </div>
            </div>
        </div>
    );
}
