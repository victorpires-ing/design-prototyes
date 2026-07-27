import { useEffect } from "react";

const INK = "#0A0A0A";
const MIST = "#F4F4F5";
const LINE = "#E5E5E5";
const MUTED = "#525252";
const LARANJA_BOTAO = "#FF2F01";

const MODALIDADES = [
    { sigla: "CAD", nome: "Cadeirantes" },
    { sigla: "CCG", nome: "Cadeirantes com Guia" },
    { sigla: "DEV", nome: "Deficientes Visuais" },
    { sigla: "AMP", nome: "Amputados de Membros Inferiores" },
    { sigla: "DMAI", nome: "Deficientes Andantes com Comprometimento em Membros Inferiores" },
    { sigla: "DMS", nome: "Deficientes com Comprometimento em Membros Superiores" },
    { sigla: "DI", nome: "Deficientes Intelectuais" },
    { sigla: "DAU", nome: "Deficientes Auditivos" },
];

const DOCUMENTOS = [
    "Documento com foto (CNH, Passaporte, RG ou Carteira de Trabalho).",
    "Laudo Médico contendo os elementos que justifiquem a eventual deficiência, inclusive com o respectivo CID.",
];

interface PcdDetalhesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/** Modal "Detalhes e requisitos" — modalidades PCD aceitas, regras de análise e documentos necessários. */
export const PcdDetalhesModal = ({ isOpen, onClose }: PcdDetalhesModalProps) => {
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
                <div className="relative shrink-0 border-b px-8 pt-7 pb-[22px]" style={{ borderColor: LINE }}>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar"
                        className="absolute top-5 right-5 z-10 flex size-[38px] items-center justify-center rounded-full text-lg leading-none"
                        style={{ backgroundColor: MIST, color: INK }}
                    >
                        ×
                    </button>
                    <h3 className="max-w-[420px] text-3xl font-extrabold" style={{ fontFamily: "'Outfit', sans-serif", color: INK }}>
                        Inscrição PCD gratuita
                    </h3>
                </div>

                <div className="flex flex-col gap-6 overflow-y-auto px-8 py-7">
                    <div>
                        <h4 className="text-base font-bold" style={{ fontFamily: "'Outfit', sans-serif", color: INK }}>
                            Modalidades disponíveis
                        </h4>
                        <ul className="mt-3 flex flex-col gap-1.5 text-[15px] leading-[1.5]" style={{ color: MUTED }}>
                            {MODALIDADES.map((m) => (
                                <li key={m.sigla}>
                                    <strong style={{ color: INK }}>{m.sigla}</strong> – {m.nome}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="text-[15px] leading-[1.6]" style={{ color: MUTED }}>
                        O ATLETA que se enquadrar em qualquer uma das modalidades citadas no item acima, deverá realizar o cadastro e pedido para sua
                        inscrição no site da TICKETSPORTS e enviar os documentos citados abaixo durante o processo de inscrição. A análise dos laudos
                        será feita em ordem de envio respeitando número limitado de vagas. Caso um laudo seja reprovado, o próximo da fila será
                        analisado.
                    </p>

                    <p className="text-[15px] leading-[1.6]" style={{ color: MUTED }}>
                        A realização da inscrição no site oficial do Evento e envio dos documentos não garante a participação do ATLETA. A inscrição
                        só será confirmada após: (i) Inscrição no site da TICKETSPORTS (ii) a conclusão de todos os procedimentos internos e, (iii)
                        parecer final da organizadora técnica e concessão da CORTESIA.
                    </p>

                    <div>
                        <h4 className="text-base font-bold" style={{ fontFamily: "'Outfit', sans-serif", color: INK }}>
                            Documentos necessários
                        </h4>
                        <ul className="mt-3 flex flex-col gap-1.5 text-[15px] leading-[1.5]" style={{ color: MUTED }}>
                            {DOCUMENTOS.map((d) => (
                                <li key={d}>{d}</li>
                            ))}
                        </ul>
                    </div>

                    <p className="text-xs" style={{ color: "#9a9aa2" }}>
                        *Inscrições limitadas.
                    </p>

                    <button
                        type="button"
                        className="mt-2 block w-full rounded-[11px] py-3.5 text-center text-base font-semibold"
                        style={{ backgroundColor: LARANJA_BOTAO, color: "#fff", fontFamily: "'Outfit', sans-serif" }}
                    >
                        Solicitar vaga
                    </button>
                </div>
            </div>
        </div>
    );
};
