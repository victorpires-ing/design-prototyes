import { useEffect, type ButtonHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cx } from "@/utils/cx";
import { IconCheck, IconClose } from "./icons";
import "./retool.css";

/* ------------------------------------------------------------------ */
/*  Botão                                                            */
/* ------------------------------------------------------------------ */

type Variante = "primary" | "secondary" | "danger" | "danger-outline" | "ghost" | "link";

interface RButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variante;
    size?: "sm" | "md";
    icon?: ReactNode;
    iconTrailing?: ReactNode;
}

export function RButton({ variant = "secondary", size = "md", icon, iconTrailing, children, className, type = "button", ...props }: RButtonProps) {
    return (
        <button
            type={type}
            className={cx("rt-btn", `rt-btn--${variant}`, size === "sm" && "rt-btn--sm", className)}
            {...props}
        >
            {icon}
            {children}
            {iconTrailing}
        </button>
    );
}

/* ------------------------------------------------------------------ */
/*  Campos                                                           */
/* ------------------------------------------------------------------ */

interface RInputProps {
    label?: string;
    value: string;
    onChange: (valor: string) => void;
    placeholder?: string;
    icon?: ReactNode;
    invalid?: boolean;
    onEnter?: () => void;
    id?: string;
}

export function RInput({ label, value, onChange, placeholder, icon, invalid, onEnter, id }: RInputProps) {
    return (
        <div>
            {label && (
                <label className="rt-label" htmlFor={id}>
                    {label}
                </label>
            )}
            <span className={icon ? "rt-field-icon" : undefined}>
                {icon}
                <input
                    id={id}
                    type="text"
                    className={cx("rt-field", invalid && "rt-field--invalid")}
                    placeholder={placeholder}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") onEnter?.();
                    }}
                />
            </span>
        </div>
    );
}

interface RSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> {
    label?: string;
    required?: boolean;
    value: string;
    onChange: (valor: string) => void;
    placeholder?: string;
    options: { value: string; label: string }[];
}

export function RSelect({ label, required, value, onChange, placeholder, options, id, ...props }: RSelectProps) {
    return (
        <div>
            {label && (
                <label className="rt-label" htmlFor={id}>
                    {label} {required && <span className="rt-required">*</span>}
                </label>
            )}
            <select id={id} className="rt-field" value={value} onChange={(event) => onChange(event.target.value)} {...props}>
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

interface RTextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> {
    label?: string;
    value: string;
    onChange: (valor: string) => void;
}

export function RTextArea({ label, value, onChange, id, ...props }: RTextAreaProps) {
    return (
        <div>
            {label && (
                <label className="rt-label" htmlFor={id}>
                    {label}
                </label>
            )}
            <textarea id={id} className="rt-field" value={value} onChange={(event) => onChange(event.target.value)} {...props} />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Contêineres e blocos                                              */
/* ------------------------------------------------------------------ */

export function RCard({
    title,
    description,
    action,
    children,
    className,
}: {
    title?: string;
    description?: string;
    action?: ReactNode;
    children?: ReactNode;
    className?: string;
}) {
    return (
        <section className={cx("rt-card", className)}>
            {(title || action) && (
                <div className="flex items-start justify-between gap-4">
                    <div>
                        {title && <h2 className="rt-card__title">{title}</h2>}
                        {description && <p className="rt-card__description">{description}</p>}
                    </div>
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}

export function RBadge({
    tone = "neutral",
    children,
}: {
    tone?: "neutral" | "success" | "blue" | "red" | "amber" | "purple";
    children: ReactNode;
}) {
    return <span className={cx("rt-badge", `rt-badge--${tone}`)}>{children}</span>;
}

export function RCallout({ tone = "info", children }: { tone?: "info" | "warning" | "danger" | "success"; children: ReactNode }) {
    return <div className={cx("rt-callout", `rt-callout--${tone}`)}>{children}</div>;
}

export function RTabs<T extends string>({
    value,
    onChange,
    items,
}: {
    value: T;
    onChange: (id: T) => void;
    items: { id: T; label: string }[];
}) {
    return (
        <div className="rt-tabs" role="tablist">
            {items.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={value === item.id}
                    className="rt-tab"
                    onClick={() => onChange(item.id)}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
}

/** Cartão de escolha única (contas vinculadas ao mesmo e-mail). */
export function RChoice({
    selected,
    onSelect,
    title,
    subtitle,
}: {
    selected: boolean;
    onSelect: () => void;
    title: string;
    subtitle: string;
}) {
    return (
        <button type="button" role="radio" aria-checked={selected} className="rt-choice" onClick={onSelect}>
            <span className="rt-radio" />
            <span className="flex flex-col">
                <span className="text-[13px] font-medium">{title}</span>
                <span className="text-[12px] text-[var(--rt-text-secondary)]">{subtitle}</span>
            </span>
        </button>
    );
}

export function RKeyValue({ label, value, tone }: { label: string; value?: string; tone?: "danger" }) {
    return (
        <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[12px] text-[var(--rt-text-secondary)]">{label}</span>
            <span
                className={cx(
                    "text-[13px] font-medium break-words",
                    tone === "danger" ? "text-[var(--rt-danger)]" : "text-[var(--rt-text)]",
                )}
            >
                {value ?? "—"}
            </span>
        </div>
    );
}

export function REmpty({ icon, title, description }: { icon: ReactNode; title: string; description?: string }) {
    return (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-[var(--rt-surface-subtle)] text-[var(--rt-text-tertiary)] ring-1 ring-[var(--rt-border)]">
                {icon}
            </span>
            <div>
                <p className="text-[14px] font-semibold text-[var(--rt-text)]">{title}</p>
                {description && <p className="mt-0.5 text-[13px] text-[var(--rt-text-secondary)]">{description}</p>}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Modal                                                            */
/* ------------------------------------------------------------------ */

export function RModal({
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children?: ReactNode;
    footer?: ReactNode;
}) {
    useEffect(() => {
        if (!isOpen) return;
        const aoTeclar = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", aoTeclar);
        return () => document.removeEventListener("keydown", aoTeclar);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="rt-overlay rt-app" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="rt-modal"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-[15px] font-semibold text-[var(--rt-text)]">{title}</h2>
                        {description && <p className="mt-1 text-[13px] text-[var(--rt-text-secondary)]">{description}</p>}
                    </div>
                    <button
                        type="button"
                        aria-label="Fechar"
                        onClick={onClose}
                        className="grid size-7 shrink-0 place-items-center rounded-[4px] text-[var(--rt-text-tertiary)] hover:bg-[var(--rt-surface-hover)] hover:text-[var(--rt-text)]"
                    >
                        <IconClose />
                    </button>
                </div>

                {children}

                {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Toast                                                            */
/* ------------------------------------------------------------------ */

/**
 * Aviso flutuante no canto superior direito, usado nos desfechos de
 * suspensão e reativação (Figma "Usuário suspenso" / "Usuário reativado").
 */
export function RToast({ title, description, onClose }: { title: string; description?: string; onClose: () => void }) {
    return (
        <div role="status" aria-live="polite" className="rt-toast">
            <span className="rt-toast__icon">
                <IconCheck size={13} />
            </span>
            <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[var(--rt-text)]">{title}</p>
                {description && <p className="mt-0.5 text-[12px] text-[var(--rt-text-secondary)]">{description}</p>}
            </div>
            <button
                type="button"
                aria-label="Fechar aviso"
                onClick={onClose}
                className="grid size-6 shrink-0 place-items-center rounded-[4px] text-[var(--rt-text-tertiary)] hover:bg-[var(--rt-surface-hover)] hover:text-[var(--rt-text)]"
            >
                <IconClose size={14} />
            </button>
        </div>
    );
}
