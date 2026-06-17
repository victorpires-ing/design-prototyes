import { useState, type ComponentType, type ReactNode } from "react";
import { Check, ChevronDown, Eye, EyeOff } from "@untitledui/icons";
import { cx } from "@/utils/cx";

export const PURPLE = "#7C3AED";

/* Logo "Hub" — wordmark roxo arredondado */
export const HubWordmark = ({ className }: { className?: string }) => (
    <span className={cx("font-extrabold tracking-tight text-[#7C3AED]", className)} style={{ fontFamily: '"Baloo 2", system-ui, sans-serif' }}>
        Hub
    </span>
);

/* Botão principal do Hub */
interface HubButtonProps {
    children: ReactNode;
    onClick?: () => void;
    variant?: "primary" | "secondary";
    isDisabled?: boolean;
    iconLeading?: ComponentType<{ className?: string }>;
    iconTrailing?: ComponentType<{ className?: string }>;
}

export const HubButton = ({ children, onClick, variant = "primary", isDisabled, iconLeading: Leading, iconTrailing: Trailing }: HubButtonProps) => (
    <button
        type="button"
        onClick={onClick}
        disabled={isDisabled}
        className={cx(
            "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3.5 text-sm font-semibold transition duration-100 ease-linear",
            variant === "primary"
                ? "bg-[#7C3AED] text-white hover:bg-[#6D28D9] disabled:bg-[#C4B5FD]"
                : "bg-white text-primary ring-1 ring-border-secondary hover:bg-secondary",
            isDisabled && "cursor-not-allowed",
        )}
    >
        {Leading && <Leading className="size-5" />}
        {children}
        {Trailing && <Trailing className="size-5" />}
    </button>
);

/* Campo de texto */
interface HubInputProps {
    label: string;
    placeholder?: string;
    value: string;
    onChange: (v: string) => void;
    type?: "text" | "email";
    hint?: ReactNode;
}

export const HubInput = ({ label, placeholder, value, onChange, type = "text", hint }: HubInputProps) => (
    <label className="flex flex-col gap-1.5">
        {label && <span className="text-sm font-semibold text-primary">{label}</span>}
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-secondary bg-primary px-3.5 py-2.5 text-md text-primary placeholder:text-placeholder outline-none transition duration-100 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/30"
        />
        {hint}
    </label>
);

/* Textarea */
export const HubTextarea = ({
    label,
    placeholder,
    value,
    onChange,
    rows = 3,
}: {
    label: string;
    placeholder?: string;
    value: string;
    onChange: (v: string) => void;
    rows?: number;
}) => (
    <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-primary">{label}</span>
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full resize-none rounded-lg border border-secondary bg-primary px-3.5 py-2.5 text-md text-primary placeholder:text-placeholder outline-none transition duration-100 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/30"
        />
    </label>
);

/* Campo de senha com olho */
export const HubPasswordField = ({ label, placeholder, value, onChange, hint }: Omit<HubInputProps, "type">) => {
    const [show, setShow] = useState(false);
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-primary">{label}</span>
            <div className="relative">
                <input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-secondary bg-primary px-3.5 py-2.5 pr-11 text-md text-primary placeholder:text-placeholder outline-none transition duration-100 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/30"
                />
                <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-quaternary hover:text-fg-secondary"
                >
                    {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
            </div>
            {hint}
        </label>
    );
};

/* Botão "entre pelo Google" */
const GoogleG = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 34.9 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.6 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41.4 35.5 44 30.2 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
);

export const HubGoogleButton = ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-primary ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-secondary"
    >
        <GoogleG className="size-5" />
        {children}
    </button>
);

/* Select do Hub — abre a lista de opções (com emoji), seleção única */
interface HubSelectOption {
    id: string;
    emoji?: string;
    label: string;
}

interface HubSelectProps {
    label?: string;
    placeholder?: string;
    value: string | null;
    onChange: (id: string) => void;
    options: HubSelectOption[];
}

export const HubSelect = ({ label, placeholder = "Selecione", value, onChange, options }: HubSelectProps) => {
    const [open, setOpen] = useState(false);
    const selected = options.find((o) => o.id === value);

    return (
        <div className="flex flex-col gap-1.5">
            {label && <span className="text-sm font-semibold text-primary">{label}</span>}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className={cx(
                        "flex w-full items-center justify-between gap-2 rounded-lg border bg-primary px-3.5 py-2.5 text-left text-md outline-none transition duration-100",
                        open ? "border-[#7C3AED] ring-2 ring-[#7C3AED]/30" : "border-secondary",
                    )}
                >
                    {selected ? (
                        <span className="flex items-center gap-2.5 text-primary">
                            {selected.emoji && <span className="text-xl leading-none">{selected.emoji}</span>}
                            {selected.label}
                        </span>
                    ) : (
                        <span className="text-placeholder">{placeholder}</span>
                    )}
                    <ChevronDown className={cx("size-5 shrink-0 text-fg-quaternary transition-transform", open && "rotate-180")} />
                </button>

                {open && (
                    <>
                        <button type="button" aria-hidden className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
                        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-secondary bg-primary py-1 shadow-lg">
                            {options.map((o) => {
                                const sel = o.id === value;
                                return (
                                    <button
                                        key={o.id}
                                        type="button"
                                        onClick={() => {
                                            onChange(o.id);
                                            setOpen(false);
                                        }}
                                        className={cx(
                                            "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-md transition duration-100 hover:bg-secondary",
                                            sel && "bg-[#7C3AED]/5",
                                        )}
                                    >
                                        {o.emoji && <span className="text-xl leading-none">{o.emoji}</span>}
                                        <span className="flex-1 text-primary">{o.label}</span>
                                        {sel && <Check className="size-5 shrink-0 text-[#7C3AED]" />}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

/* Botão de ícone arredondado para headers */
export const HubIconButton = ({
    icon: Icon,
    onClick,
    label,
    dot,
}: {
    icon: ComponentType<{ className?: string }>;
    onClick?: () => void;
    label: string;
    dot?: boolean;
}) => (
    <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="relative flex size-10 items-center justify-center rounded-full bg-secondary text-fg-secondary transition duration-100 ease-linear hover:bg-tertiary"
    >
        <Icon className="size-5" />
        {dot && <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-[#EF4444] ring-2 ring-primary" />}
    </button>
);

/* Toggle roxo do Hub */
export const HubToggle = ({
    checked,
    onChange,
    label,
    description,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: ReactNode;
    description?: ReactNode;
}) => (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-start gap-3 text-left">
        <span className={cx("relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition duration-150", checked ? "bg-[#7C3AED]" : "bg-tertiary")}>
            <span className={cx("absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition duration-150", checked && "translate-x-5")} />
        </span>
        <span className="flex flex-col gap-0.5">
            <span className="text-sm text-secondary">{label}</span>
            {description && <span className="text-sm text-tertiary">{description}</span>}
        </span>
    </button>
);

/* Stepper de 4 passos */
export const Stepper = ({ current, total = 4 }: { current: number; total?: number }) => (
    <div className="flex items-center">
        {Array.from({ length: total }, (_, i) => i + 1).map((step, idx) => {
            const completo = step < current;
            return (
                <div key={step} className={cx("flex items-center", idx < total - 1 && "flex-1")}>
                    <span
                        className={cx(
                            "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                            completo ? "bg-[#7C3AED] text-white" : "text-tertiary ring-1 ring-border-secondary",
                        )}
                    >
                        {completo ? <Check className="size-4" /> : step}
                    </span>
                    {idx < total - 1 && <span className="mx-1 flex-1 border-t border-dashed border-secondary" />}
                </div>
            );
        })}
    </div>
);
