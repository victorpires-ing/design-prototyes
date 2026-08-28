import type { FC, ReactNode } from "react";
import { AlertCircle, CheckCircle, ChevronDown, Clock, RefreshCw02, SearchLg, SlashCircle01, Target04 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import type { SituacaoAssociacao, StatusContratoProdutora } from "../data/cashout";

/* ------------------------------------------------------------------ */
/*  Card com faixa de título                                          */
/* ------------------------------------------------------------------ */

export function Card({ icon: Icon, title, action, children }: { icon: FC<{ className?: string }>; title: string; action?: ReactNode; children: ReactNode }) {
    return (
        <section className="w-full overflow-hidden rounded-xl border border-secondary bg-primary">
            <div className="flex items-center gap-2.5 border-b border-secondary bg-secondary px-6 py-4">
                <Icon className="size-[18px] shrink-0 text-brand-secondary" aria-hidden="true" />
                <p className="min-w-0 flex-1 text-[15px] font-semibold text-primary">{title}</p>
                {action}
            </div>
            <div className="flex flex-col p-6">{children}</div>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/*  Cabeçalho de página                                               */
/* ------------------------------------------------------------------ */

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
    return (
        <div className="flex w-full items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1.5">
                <h1 className="text-3xl font-semibold text-primary">{title}</h1>
                <p className="text-sm text-quaternary">{description}</p>
            </div>
            {action}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Campos (visuais — protótipo)                                      */
/* ------------------------------------------------------------------ */

/** Label em caixa alta com tracking, como no refinamento. */
export function FieldLabel({ children }: { children: ReactNode }) {
    return <span className="text-xs font-semibold tracking-[0.72px] text-quaternary uppercase">{children}</span>;
}

export function SearchField({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (valor: string) => void }) {
    return (
        <span className="flex w-full items-center gap-2.5 rounded-lg border border-secondary bg-primary px-3.5 py-3 focus-within:border-brand">
            <SearchLg className="size-4 shrink-0 text-quaternary" aria-hidden="true" />
            <input
                type="text"
                className="min-w-0 flex-1 bg-transparent text-sm text-primary outline-hidden placeholder:text-placeholder"
                placeholder={placeholder}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </span>
    );
}

export function SelectField({ value, onChange, options }: { value: string; onChange: (valor: string) => void; options: string[] }) {
    return (
        <span className="relative flex w-full items-center rounded-lg border border-secondary bg-primary focus-within:border-brand">
            <select
                className="w-full appearance-none bg-transparent px-3.5 py-3 text-sm font-medium text-primary outline-hidden"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 size-4 text-quaternary" aria-hidden="true" />
        </span>
    );
}

/* ------------------------------------------------------------------ */
/*  Botão                                                             */
/* ------------------------------------------------------------------ */

export function Btn({
    variant = "secondary",
    icon: Icon,
    children,
    onClick,
    isDisabled,
    className,
}: {
    variant?: "secondary" | "brand";
    icon?: FC<{ className?: string }>;
    children: ReactNode;
    onClick?: () => void;
    isDisabled?: boolean;
    className?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isDisabled}
            className={cx(
                "flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-[13px] font-semibold whitespace-nowrap transition duration-100 ease-linear",
                variant === "brand" ? "bg-brand-solid text-white hover:bg-brand-solid_hover" : "border border-secondary bg-primary text-secondary hover:bg-primary_hover",
                isDisabled && "cursor-not-allowed opacity-50",
                className,
            )}
        >
            {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
            {children}
        </button>
    );
}

/* ------------------------------------------------------------------ */
/*  Tabela                                                            */
/* ------------------------------------------------------------------ */

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
    return <div className={cx("text-xs font-semibold tracking-[0.72px] text-quaternary uppercase", className)}>{children}</div>;
}

/** Divisor de linha em tom suave da marca, como no refinamento. */
export function RowDivider() {
    return <div className="h-px w-full shrink-0 bg-utility-brand-100" />;
}

/* ------------------------------------------------------------------ */
/*  Badge de situação do contrato associado                           */
/* ------------------------------------------------------------------ */

const SITUACAO: Record<SituacaoAssociacao, { label: string; icon: FC<{ className?: string }>; classes: string }> = {
    ativo: {
        label: "Ativo",
        icon: CheckCircle,
        classes: "bg-utility-green-50 ring-utility-green-200 text-utility-green-700",
    },
    renegociacao: {
        label: "Em renegociação",
        icon: RefreshCw02,
        classes: "bg-utility-blue-50 ring-utility-blue-200 text-utility-blue-700",
    },
    "renegociacao-pendente": {
        label: "Em renegociação",
        icon: Clock,
        classes: "bg-utility-yellow-50 ring-utility-yellow-200 text-utility-yellow-700",
    },
    "meta-gmv": {
        label: "Ativo por meta de GMV",
        icon: Target04,
        classes: "bg-utility-purple-50 ring-utility-purple-200 text-utility-purple-700",
    },
    "sem-contrato": {
        label: "Sem contrato",
        icon: AlertCircle,
        classes: "bg-utility-neutral-50 ring-utility-neutral-200 text-utility-neutral-700",
    },
    inativo: {
        label: "Inativo",
        icon: SlashCircle01,
        classes: "bg-utility-red-50 ring-utility-red-200 text-utility-red-700",
    },
};

export function SituacaoBadge({ situacao }: { situacao: SituacaoAssociacao }) {
    const { label, icon: Icon, classes } = SITUACAO[situacao];

    return (
        <span className={cx("flex shrink-0 items-center gap-0.5 rounded-md py-0.5 pr-2 pl-1.5 text-xs font-medium ring-1 ring-inset", classes)}>
            <Icon className="size-3 shrink-0" aria-hidden="true" />
            {label}
        </span>
    );
}

/* ------------------------------------------------------------------ */
/*  Status com ponto — sub-tabela de contratos da produtora           */
/* ------------------------------------------------------------------ */

const STATUS_CONTRATO: Record<StatusContratoProdutora, { label: string; dot: string; text: string }> = {
    ativo: { label: "Ativo", dot: "bg-utility-green-500", text: "text-utility-green-700" },
    renegociacao: { label: "Em renegociação", dot: "bg-utility-blue-500", text: "text-utility-blue-700" },
    inativo: { label: "Inativo", dot: "bg-utility-red-500", text: "text-utility-red-700" },
};

export function StatusDot({ status }: { status: StatusContratoProdutora }) {
    const { label, dot, text } = STATUS_CONTRATO[status];

    return (
        <span className={cx("flex items-center gap-2 text-[13px] font-medium", text)}>
            <span className={cx("size-1.5 shrink-0 rounded-full", dot)} aria-hidden="true" />
            {label}
        </span>
    );
}

/** Badge PJ / PF da tabela de produtoras. */
export function TipoPessoaBadge({ tipo }: { tipo: "PJ" | "PF" }) {
    return (
        <span className="flex size-fit items-center rounded-md bg-utility-blue-50 px-1.5 py-0.5 text-xs font-medium text-utility-blue-700 ring-1 ring-utility-blue-200 ring-inset">
            {tipo}
        </span>
    );
}
