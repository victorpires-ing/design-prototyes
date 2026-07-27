import { useEffect } from "react";

const INK = "#0A0A0A";
const MIST = "#F4F4F5";
const LINE = "#E5E5E5";
const MUTED = "#525252";

interface ComoFuncionaModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/** Modal "Como funciona" — explica o fluxo de inscrição em grupo (representante, acompanhamento, pagamento). */
export const ComoFuncionaModal = ({ isOpen, onClose }: ComoFuncionaModalProps) => {
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
            style={{ backgroundColor: "rgba(10,10,10,0.7)", backdropFilter: "blur(4px)" }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-[480px] rounded-3xl bg-white shadow-2xl"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
            >
                <div className="relative px-8 pt-7 pb-8">
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar"
                        className="absolute top-5 right-5 z-10 flex size-[38px] items-center justify-center rounded-full text-lg leading-none"
                        style={{ backgroundColor: MIST, color: INK }}
                    >
                        ×
                    </button>
                    <h3 className="max-w-[340px] text-2xl font-extrabold" style={{ fontFamily: "'Outfit', sans-serif", color: INK }}>
                        Como funciona?
                    </h3>
                    <p className="mt-3 border-t pt-5 text-[15px] leading-[1.6]" style={{ color: MUTED, borderColor: LINE }}>
                        Correr junto fica mais fácil por aqui. Um representante pede as vagas do grupo, acompanha tudo em um só lugar e decide se faz
                        o pagamento completo ou se cada convidado paga sua inscrição.
                    </p>
                </div>
            </div>
        </div>
    );
};
