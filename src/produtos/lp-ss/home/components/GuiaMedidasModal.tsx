import { useEffect } from "react";

const INK = "#0A0A0A";
const MIST = "#F4F4F5";
const LINE = "#E5E5E5";
const MUTED = "#525252";

const TAMANHOS = [
    { tamanho: "PP", largura: "48 cm", comprimento: "66 cm" },
    { tamanho: "P", largura: "51 cm", comprimento: "69 cm" },
    { tamanho: "M", largura: "54 cm", comprimento: "72 cm" },
    { tamanho: "G", largura: "57 cm", comprimento: "74 cm" },
    { tamanho: "GG", largura: "60 cm", comprimento: "76 cm" },
    { tamanho: "XGG", largura: "63 cm", comprimento: "78 cm" },
];

interface GuiaMedidasModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/** Modal "Guia de medidas" — tabela de tamanhos da camiseta oficial + diagrama de como medir. */
export const GuiaMedidasModal = ({ isOpen, onClose }: GuiaMedidasModalProps) => {
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
                className="relative flex max-h-[90vh] w-full max-w-[620px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
            >
                <div className="relative shrink-0 overflow-hidden border-b px-8 pt-7 pb-[22px]" style={{ borderColor: LINE }}>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar"
                        className="absolute top-5 right-5 z-10 flex size-[38px] items-center justify-center rounded-full text-lg leading-none"
                        style={{ backgroundColor: MIST, color: INK }}
                    >
                        ×
                    </button>
                    <div className="relative">
                        <h3 className="text-3xl font-extrabold" style={{ fontFamily: "'Outfit', sans-serif", color: INK }}>
                            Guia de medidas
                        </h3>
                        <p className="mt-2.5 max-w-[420px] text-[15px]" style={{ color: MUTED }}>
                            Meça uma camiseta que já te serve bem, comparação deitada e plana, e escolha o tamanho certinho. Medidas em centímetros.
                        </p>
                    </div>
                </div>

                <div className="overflow-y-auto px-8 py-7">
                    <table className="w-full border-collapse text-[15px]">
                        <thead>
                            <tr className="text-left" style={{ color: MUTED, fontFamily: "'Outfit', sans-serif" }}>
                                <th className="pb-3 text-[13px] font-semibold tracking-[0.5px] uppercase">Tamanho</th>
                                <th className="pb-3 text-[13px] font-semibold tracking-[0.5px] uppercase">Largura (A)</th>
                                <th className="pb-3 text-[13px] font-semibold tracking-[0.5px] uppercase">Comprimento (B)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {TAMANHOS.map((t) => (
                                <tr key={t.tamanho} className="border-t" style={{ borderColor: LINE }}>
                                    <td className="py-3.5 font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                        {t.tamanho}
                                    </td>
                                    <td className="py-3.5">{t.largura}</td>
                                    <td className="py-3.5">{t.comprimento}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-[22px] flex items-center gap-4 rounded-2xl p-4" style={{ backgroundColor: MIST }}>
                        <svg width="56" height="70" viewBox="0 0 56 70" fill="none" className="shrink-0">
                            <path
                                d="M14 8 L22 4 h12 l8 4 8 6 -6 10 -6 -3 v33 h-24 V25 l-6 3 -6 -10 z"
                                fill="#e3e3e6"
                                stroke="#b3b3ba"
                                strokeWidth="1.4"
                                strokeLinejoin="round"
                            />
                            <line x1="20" y1="30" x2="36" y2="30" stroke="#FF0000" strokeWidth="1.6" />
                            <text x="28" y="27" fontSize="7" fill="#FF0000" textAnchor="middle" fontFamily="Outfit">
                                A
                            </text>
                            <line x1="44" y1="26" x2="44" y2="58" stroke={INK} strokeWidth="1.6" />
                            <text x="49" y="44" fontSize="7" fill={INK} textAnchor="middle" fontFamily="Outfit">
                                B
                            </text>
                        </svg>
                        <div className="text-sm leading-relaxed" style={{ color: MUTED }}>
                            <strong style={{ color: INK }}>A · Largura:</strong> de uma axila à outra.
                            <br />
                            <strong style={{ color: INK }}>B · Comprimento:</strong> do ombro até a barra.
                        </div>
                    </div>
                    <p className="mt-4 text-xs" style={{ color: "#9a9aa2" }}>
                        Modelagem unissex. Tolerância de ±2 cm por conta do processo de confecção.
                    </p>
                </div>
            </div>
        </div>
    );
};
