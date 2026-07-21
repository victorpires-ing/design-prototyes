import { useState, type ReactNode } from "react";
import {
    Dialog as AriaDialog,
    Modal as AriaModal,
    ModalOverlay as AriaModalOverlay,
} from "react-aria-components";
import { ArrowDown, ArrowUp } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import comoFuncionaBg from "../assets/como-funciona-bg.png";
import comoFuncionaBg2 from "../assets/como-funciona-bg-2.png";
import comoFuncionaBg3 from "../assets/como-funciona-bg-3.png";
import comoFuncionaBg4 from "../assets/como-funciona-bg-4.png";

/* ------------------------------------------------------------------ */
/*  Ilustrações                                                        */
/* ------------------------------------------------------------------ */

/** Mini gráfico (sparkline) usado nos cards de métrica. */
const Sparkline = ({ trend }: { trend: "up" | "down" }) => (
    <svg
        width="62"
        height="31"
        viewBox="0 0 62 31"
        fill="none"
        aria-hidden="true"
        className="shrink-0 text-fg-success-secondary"
    >
        <polyline
            points={trend === "up" ? "0,22 12,15 22,23 34,10 44,17 62,5" : "0,8 14,19 28,13 40,23 50,16 62,7"}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle
            cx={trend === "up" ? 44 : 50}
            cy={trend === "up" ? 17 : 16}
            r="2.6"
            fill="white"
            stroke="currentColor"
            strokeWidth="1.2"
        />
    </svg>
);

interface MetricMiniProps {
    label: string;
    value: string;
    change: string;
    trend: "up" | "down";
    period: string;
    darker?: boolean;
    className?: string;
}

/** Card de métrica flutuante sobre a imagem (Ofertas / Ticket médio). */
const MetricMini = ({ label, value, change, trend, period, darker, className }: MetricMiniProps) => {
    const ChangeIcon = trend === "up" ? ArrowUp : ArrowDown;
    return (
        <div
            className={cx(
                "flex w-[180px] flex-col gap-2 rounded-lg border border-secondary p-2.5 shadow-md backdrop-blur-md",
                darker ? "bg-black/80" : "bg-black/50",
                className,
            )}
        >
            <p className="text-[10px] font-semibold leading-none text-white">{label}</p>
            <div className="flex items-end gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="text-[15px] font-semibold leading-none text-white">{value}</p>
                    <div className="flex items-center gap-1">
                        <ChangeIcon
                            className={cx("size-2.5", trend === "up" ? "text-fg-success-secondary" : "text-fg-error-secondary")}
                            aria-hidden="true"
                        />
                        <span className={cx("text-[9px] font-medium", trend === "up" ? "text-success-primary" : "text-error-primary")}>
                            {change}
                        </span>
                        <span className="truncate text-[9px] text-white/70">{period}</span>
                    </div>
                </div>
                <Sparkline trend={trend} />
            </div>
        </div>
    );
};

/** Ilustração do slide 1 — foto do evento com cards de métrica sobrepostos. */
const MetricsIllustration = () => (
    <div className="relative h-[208px] w-full overflow-hidden rounded-md bg-tertiary">
        <img src={comoFuncionaBg} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />
        <MetricMini className="absolute right-5 top-5" label="Ofertas" value="1.210" change="10%" trend="down" period="vs último mês" />
        <MetricMini className="absolute bottom-5 left-5" darker label="Ticket médio" value="R$ 200" change="40%" trend="up" period="vs ontem" />
    </div>
);

/** Unidade do contador (número + rótulo). */
const TimerUnit = ({ value, label }: { value: string; label: string }) => (
    <div className="flex flex-col items-center text-white">
        <span className="text-[11px] font-bold leading-none">{value}</span>
        <span className="text-[8px] leading-tight opacity-50">{label}</span>
    </div>
);

/** Ilustração do slide 2 — preview da pré-venda na página do evento (contador + lance). */
const PreVendaPreviewIllustration = () => (
    <div className="relative h-[208px] w-full overflow-hidden rounded-md bg-tertiary">
        <img src={comoFuncionaBg2} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover" />
        <div className="absolute left-1/2 top-1/2 flex w-[260px] -translate-x-1/2 -translate-y-1/2 flex-col gap-1.5">
            {/* CTA */}
            <div className="flex h-[37px] items-center justify-center rounded-md bg-brand-solid px-6">
                <span className="text-[8px] font-medium uppercase tracking-wide text-white">
                    Participar da pré-venda
                </span>
            </div>
            {/* Contador */}
            <div className="flex items-center justify-between gap-2 rounded-md bg-[rgba(24,24,24,0.8)] px-2.5 py-1.5 backdrop-blur-md">
                <span className="w-[86px] text-[8px] leading-tight text-white/70">A pré-venda encerra em</span>
                <div className="flex items-start gap-1.5">
                    <TimerUnit value="02" label="dias" />
                    <span className="text-[11px] font-bold leading-none text-white opacity-50">:</span>
                    <TimerUnit value="14" label="horas" />
                    <span className="text-[11px] font-bold leading-none text-white opacity-50">:</span>
                    <TimerUnit value="36" label="min" />
                    <span className="text-[11px] font-bold leading-none text-white opacity-50">:</span>
                    <TimerUnit value="21" label="seg" />
                </div>
            </div>
            {/* Legenda */}
            <p className="text-[8px] leading-snug text-white">
                Entre na pré-venda e tente comprar antes da venda oficial. Você só paga se sua
                oferta for aceita. <span className="underline">Entenda como funciona.</span>
            </p>
        </div>
    </div>
);

/** Mini campo de formulário sobreposto à imagem (slide 3). */
const MiniField = ({
    label,
    required,
    placeholder,
    showDate,
    className,
}: {
    label: string;
    required?: boolean;
    placeholder?: string;
    showDate?: boolean;
    className?: string;
}) => (
    <div className={cx("absolute rounded-lg bg-black/80 p-2 backdrop-blur-sm", className)}>
        <div className="flex flex-col gap-1">
            <p className="flex gap-0.5 text-[9px] font-medium leading-none text-white/90">
                {label}
                {required && <span className="text-brand-secondary">*</span>}
            </p>
            <div className="flex items-center justify-between gap-1.5 rounded-md border border-primary bg-primary px-2 py-1.5">
                {showDate ? (
                    <>
                        <span className="text-[10px] leading-none text-placeholder">DD / MM / AAAA</span>
                        <span className="text-[10px] leading-none text-fg-quaternary">– 00:00</span>
                    </>
                ) : (
                    <span className="truncate text-[10px] leading-none text-placeholder">{placeholder}</span>
                )}
            </div>
        </div>
    </div>
);

/** Ilustração do slide 3 — preview do formulário de configuração da pré-venda. */
const FormPreviewIllustration = () => (
    <div className="relative h-[208px] w-full overflow-hidden rounded-md bg-tertiary">
        <img src={comoFuncionaBg3} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover" />
        <MiniField className="left-[29px] top-[16px] w-[185px]" label="Data de início" required showDate />
        <MiniField className="left-[137px] top-[57px] w-[185px]" label="Data de fim" required showDate />
        <MiniField
            className="left-[30px] top-[130px] w-[293px]"
            label="Limite de emissões do evento"
            placeholder="Se vazio, o limite será o definido em cada item"
        />
    </div>
);

/** Ilustração do slide 4 — apenas a foto do evento. */
const PhotoIllustration = () => (
    <div className="h-[208px] w-full overflow-hidden rounded-md bg-tertiary">
        <img src={comoFuncionaBg4} alt="" aria-hidden="true" className="size-full object-cover" />
    </div>
);

/* ------------------------------------------------------------------ */
/*  Slides                                                             */
/* ------------------------------------------------------------------ */

interface Slide {
    illustration: ReactNode;
    title: string;
    description: ReactNode;
    /** Rótulo do botão primário (avança para o próximo passo, ou conclui no último). */
    primaryLabel: string;
    /** Rótulo do botão secundário (Pular/Voltar/Fica para próxima). */
    secondaryLabel: string;
}

const SLIDES: Slide[] = [
    {
        illustration: <MetricsIllustration />,
        title: "Entenda a demanda antes da venda oficial",
        primaryLabel: "Me conta mais!",
        secondaryLabel: "Pular",
        description: (
            <>
                <p>
                    Com a pré-venda, você identifica o interesse do público e descobre quanto ele
                    está disposto a pagar por cada item.
                </p>
                <p className="mt-3">
                    Esses dados ajudam a aumentar o ticket médio e a tomar decisões mais
                    estratégicas para os próximos eventos.
                </p>
            </>
        ),
    },
    {
        illustration: <PreVendaPreviewIllustration />,
        title: "O que acontece durante a pré-venda",
        primaryLabel: "E como começo?",
        secondaryLabel: "Voltar",
        description: (
            <>
                <p>
                    Na página do evento, o comprador verá um contador da pré-venda. Ele poderá
                    escolher um único ingresso participante, fazer um lance e deixar uma reserva
                    no cartão de crédito.
                </p>
                <p className="mt-3">
                    Quando a pré-venda terminar, os maiores lances serão selecionados
                    automaticamente.
                </p>
            </>
        ),
    },
    {
        illustration: <FormPreviewIllustration />,
        title: "Criar uma pré-venda é fácil",
        primaryLabel: "E depois?",
        secondaryLabel: "Voltar",
        description: (
            <>
                <p>
                    Defina o período da pré-venda, os itens participantes, o valor mínimo dos
                    lances e a quantidade disponível para emissão de cada item.
                </p>
                <p className="mt-3">
                    Essas informações garantem que a pré-venda funcione de acordo com a sua
                    estratégia para o evento.
                </p>
            </>
        ),
    },
    {
        illustration: <PhotoIllustration />,
        title: "Depois é só acompanhar os resultados",
        primaryLabel: "Criar uma pré-venda",
        secondaryLabel: "Fica para próxima",
        description: (
            <>
                <p>
                    Durante a pré-venda, você acompanha os valores médios, o número de
                    participantes e o desempenho de cada item.
                </p>
                <p className="mt-3">
                    Ao final do período configurado, os compradores com os maiores lances recebem
                    seus ingressos automaticamente, e os valores são creditados no evento.
                </p>
            </>
        ),
    },
];

/* ------------------------------------------------------------------ */
/*  Modal                                                              */
/* ------------------------------------------------------------------ */

interface ComoFuncionaModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Acionado pelo CTA do último passo ("Quero criar uma pré-venda"). */
    onCriar?: () => void;
}

export function ComoFuncionaModal({ isOpen, onClose, onCriar }: ComoFuncionaModalProps) {
    const [index, setIndex] = useState(0);
    // Direção da transição — define o lado de onde o slide entra.
    const [direction, setDirection] = useState<"forward" | "back">("forward");

    const isFirst = index === 0;
    const isLast = index === SLIDES.length - 1;
    const slide = SLIDES[index];

    const goTo = (next: number) => {
        setDirection(next >= index ? "forward" : "back");
        setIndex(next);
    };

    const handleClose = () => {
        onClose();
        // Reinicia no primeiro passo ao fechar (após a animação de saída).
        setTimeout(() => {
            setIndex(0);
            setDirection("forward");
        }, 200);
    };

    // Primário: avança; no último passo, conclui e inicia a criação.
    const handlePrimary = () => {
        if (isLast) {
            handleClose();
            onCriar?.();
        } else {
            goTo(index + 1);
        }
    };

    // Secundário: 1º e último passos fecham (Pular / Fica para próxima);
    // passos intermediários voltam um passo (Voltar).
    const handleSecondary = () => {
        if (isFirst || isLast) handleClose();
        else goTo(index - 1);
    };

    return (
        <AriaModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open) handleClose();
            }}
            isDismissable
            className={({ isEntering, isExiting }) =>
                cx(
                    "fixed inset-0 z-50 flex items-center justify-center bg-overlay/70 p-4 outline-hidden backdrop-blur-[8px]",
                    isEntering && "duration-200 ease-out animate-in fade-in",
                    isExiting && "duration-150 ease-in animate-out fade-out",
                )
            }
        >
            <AriaModal
                className={({ isEntering, isExiting }) =>
                    cx(
                        "w-full max-w-[400px] overflow-clip rounded-2xl bg-primary shadow-xl outline-hidden",
                        isEntering && "duration-200 ease-out animate-in zoom-in-95 fade-in",
                        isExiting && "duration-150 ease-in animate-out zoom-out-95 fade-out",
                    )
                }
            >
                <AriaDialog className="flex flex-col items-center outline-hidden">
                    {/* Conteúdo do slide — remonta a cada passo para reproduzir a transição */}
                    <div
                        key={index}
                        className={cx(
                            "flex w-full flex-col items-center duration-300 ease-out animate-in fade-in",
                            direction === "forward" ? "slide-in-from-right-8" : "slide-in-from-left-8",
                        )}
                    >
                        {/* Ilustração */}
                        <div className="w-full px-6 pt-6">{slide.illustration}</div>

                        {/* Texto */}
                        <div className="flex flex-col items-center gap-0.5 px-6 pt-6 pb-5 text-center">
                            <h2 className="text-md font-semibold text-primary">{slide.title}</h2>
                            <div className="text-sm text-tertiary">{slide.description}</div>
                        </div>
                    </div>

                    {/* Paginação */}
                    <div className="flex items-center justify-center gap-4">
                        {SLIDES.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => goTo(i)}
                                aria-label={`Ir para o passo ${i + 1}`}
                                aria-current={i === index}
                                className={cx(
                                    "size-2.5 rounded-full outline-none transition duration-100 ease-linear focus-visible:ring-2 focus-visible:ring-brand",
                                    i === index ? "bg-brand-solid" : "bg-quaternary hover:bg-tertiary",
                                )}
                            />
                        ))}
                    </div>

                    {/* Ações */}
                    <div className="flex w-full items-center gap-3 px-6 pt-8 pb-6">
                        <Button
                            size="md"
                            color="secondary"
                            className="shrink-0 whitespace-nowrap"
                            onClick={handleSecondary}
                        >
                            {slide.secondaryLabel}
                        </Button>
                        <Button
                            size="md"
                            color="primary"
                            className="flex-1 whitespace-nowrap"
                            onClick={handlePrimary}
                        >
                            {slide.primaryLabel}
                        </Button>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}
