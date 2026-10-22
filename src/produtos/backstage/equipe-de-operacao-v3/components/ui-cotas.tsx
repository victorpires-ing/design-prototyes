/* ------------------------------------------------------------------ */
/*  Peças visuais compartilhadas pelas telas do Gerenciamento de cotas */
/*  — medidas e cores tiradas do Figma (seção "Proposta").             */
/* ------------------------------------------------------------------ */

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { Calendar, ChevronLeft } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { useTheme } from "@/providers/theme-provider";
import { cx } from "@/utils/cx";
import "../tema-cotas.css";

/** Aplica o vermelho de marca do AfterDS (ver tema-cotas.css) a tudo o que estiver dentro. */
export const TemaCotas = ({ children, className }: { children: ReactNode; className?: string }) => {
    // Tooltips, modais e listas de select abrem num portal fora deste div; a marca no <body>
    // leva a fonte do fluxo até eles enquanto alguma tela de cotas estiver aberta.
    useEffect(() => {
        document.body.classList.add("cotas-aberto");
        return () => document.body.classList.remove("cotas-aberto");
    }, []);

    // O fluxo só existe em dark no Figma. O tema fica salvo no navegador (a revenda, por
    // exemplo, força light), então ao abrir as telas de cotas força dark e devolve ao sair.
    const { theme, setTheme } = useTheme();
    useEffect(() => {
        const anterior = theme;
        setTheme("dark");
        return () => setTheme(anterior);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div className={cx("tema-cotas flex min-w-0 flex-1 flex-col", className)}>{children}</div>;
};

/* ----------------------------- Cabeçalho ------------------------------ */

interface CabecalhoProps {
    titulo: string;
    onVoltar: () => void;
    acao?: { label: string; onClick: () => void; desabilitada?: boolean };
    /** Título alinhado à esquerda, ao lado do voltar (listagem) ou centralizado (fluxo). */
    alinhamento?: "centro" | "esquerda";
}

/** Altura do cabeçalho fixo (p-6 + botão de 44px + 1px de borda) — o que mais grudar no topo começa abaixo dele. */
export const ALTURA_CABECALHO = 93;

/**
 * Cabeçalho das telas: voltar (32px) + título 24/32 bold + CTA vermelho. Fica fixo no topo
 * durante o scroll, para o "Continuar" estar sempre à mão; ao rolar ganha uma linha de separação.
 */
export function CabecalhoCotas({ titulo, onVoltar, acao, alinhamento = "centro" }: CabecalhoProps) {
    const [rolou, setRolou] = useState(false);

    useEffect(() => {
        const onScroll = () => setRolou(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <header
            className={cx(
                "sticky top-0 z-30 flex items-center gap-3 border-b bg-[var(--cotas-fundo-pagina)] p-6 transition-colors duration-200 ease-out",
                rolou ? "border-secondary" : "border-transparent",
            )}
        >
            <ButtonUtility size="sm" color="secondary" icon={ChevronLeft} tooltip="Voltar" onClick={onVoltar} />
            <h1
                className={cx(
                    "text-display-xs font-bold text-primary",
                    alinhamento === "centro" ? "pointer-events-none absolute inset-x-0 text-center" : "flex-1",
                )}
            >
                {titulo}
            </h1>
            {acao && (
                <Button size="lg" color="primary" className="ml-auto" isDisabled={acao.desabilitada} onClick={acao.onClick}>
                    {acao.label}
                </Button>
            )}
        </header>
    );
}

/* --------------------------- Barra de progresso ------------------------ */

/** Trilho #737373 e preenchimento #ff4a40, 8px de altura — como no Figma. */
export const BarraUso = ({ usadas, total, className }: { usadas: number; total: number; className?: string }) => {
    const pct = total > 0 ? Math.min(100, (usadas / total) * 100) : 0;
    return (
        <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={usadas}
            className={cx("h-2 overflow-hidden rounded-full bg-[var(--color-fg-quaternary)]", className)}
        >
            <div className="h-full rounded-full bg-fg-brand-primary transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
        </div>
    );
};

/* -------------------------------- Radio -------------------------------- */

/** Bolinha do radio: vazia com borda, ou vermelha com miolo branco. "md" = 20px, "sm" = 16px. */
export const RadioBolinha = ({ selecionado, tamanho = "md" }: { selecionado: boolean; tamanho?: "sm" | "md" }) => (
    <span
        aria-hidden="true"
        className={cx(
            "flex shrink-0 items-center justify-center rounded-full transition duration-100 ease-linear",
            tamanho === "sm" ? "size-4 *:size-1.5" : "size-5 *:size-2",
            selecionado ? "bg-brand-solid" : "ring-1 ring-border-primary ring-inset",
        )}
    >
        {selecionado && (
            <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 600, damping: 22 }}
                className="rounded-full bg-white"
            />
        )}
    </span>
);

/* ------------------------------ Seções --------------------------------- */

/** Título de bloco do fluxo: 18/28 semibold, igual aos títulos da etapa Grupo. */
export const TituloSecao = ({ children, apoio }: { children: ReactNode; apoio?: string }) => (
    <div className="flex flex-col">
        <h2 className="text-lg font-semibold text-primary">{children}</h2>
        {apoio && <p className="text-md text-primary">{apoio}</p>}
    </div>
);

/** Card de sessão (data do evento) que agrupa itens por grupo de ingresso. */
export const CardSessao = ({ rotulo, children, fundo = "escuro" }: { rotulo: string; children: ReactNode; fundo?: "escuro" | "medio" }) => (
    <section className={cx("overflow-hidden rounded-xl ring-1 ring-border-secondary ring-inset", fundo === "escuro" ? "bg-primary_alt" : "bg-primary")}>
        <header className="flex items-center gap-3 border-b border-secondary py-3 pr-5 pl-3">
            <span
                className={cx(
                    "flex size-8 shrink-0 items-center justify-center rounded-md ring-1 ring-border-primary ring-inset",
                    fundo === "escuro" ? "bg-primary_alt" : "bg-primary",
                )}
            >
                <Calendar className="size-4 text-secondary" aria-hidden="true" />
            </span>
            <h3 className="text-md font-semibold text-secondary">{rotulo}</h3>
        </header>
        <div className="flex flex-col gap-1 p-4">{children}</div>
    </section>
);

/** Badge do tipo do ingresso: pill escuro com borda. */
export const BadgeTipo = ({ children }: { children: ReactNode }) => (
    <span className="inline-flex shrink-0 items-center rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-secondary ring-1 ring-border-primary ring-inset">
        {children}
    </span>
);

/** Badge "Inativo". */
export const BadgeInativo = () => <BadgeTipo>Inativo</BadgeTipo>;
