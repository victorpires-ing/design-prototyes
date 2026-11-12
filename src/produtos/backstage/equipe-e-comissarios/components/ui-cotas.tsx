/* ------------------------------------------------------------------ */
/*  Peças compartilhadas pelas telas da Equipe de operação.            */
/*                                                                     */
/*  Tudo composto do DS e no tema do Backstage (EO3-01): sem tema,     */
/*  cor ou fonte próprios, sem forçar o tema escuro.                   */
/* ------------------------------------------------------------------ */

import type { ReactNode } from "react";
import { ArrowLeft, Calendar } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { cx } from "@/utils/cx";
import { TITULO_PAGINA } from "@/produtos/backstage/components/titulo-pagina";

/** Contêiner das telas do fluxo. Antes aplicava tema próprio; hoje só organiza o conteúdo. */
export const TemaCotas = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={cx("flex min-w-0 flex-1 flex-col", className)}>{children}</div>
);

/* ----------------------------- Cabeçalho ------------------------------ */

interface CabecalhoProps {
    titulo: string;
    /** Sem `onVoltar`: tela que vem do menu, sem seta de voltar (EO3-02). */
    onVoltar?: () => void;
    /** Rótulo do voltar ("Equipe de operação", "Grupo"). */
    rotuloVoltar?: string;
    /** O botão nunca fica desativado: com pendência, a tela diz o que falta (EO3-34). */
    acao?: { label: string; onClick: () => void };
    /** Fluxo de etapas: título no meio, como na Emissão de cortesias. Listagem e detalhe: à esquerda. */
    alinhamento?: "centro" | "esquerda";
}

/**
 * Cabeçalho de página do Backstage (o mesmo da Emissão de cortesias): voltar, título e a ação
 * principal. No celular o título desce para uma linha própria, sem ficar embaixo do botão.
 */
export function CabecalhoCotas({ titulo, onVoltar, rotuloVoltar = "Voltar", acao, alinhamento = "centro" }: CabecalhoProps) {
    if (alinhamento === "esquerda")
        return (
            <header className="flex flex-col gap-3">
                {onVoltar && (
                    <Button color="link-gray" size="sm" iconLeading={ArrowLeft} onClick={onVoltar} className="self-start">
                        {rotuloVoltar}
                    </Button>
                )}
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <h1 className={TITULO_PAGINA}>{titulo}</h1>
                    {acao && (
                        <Button size="md" color="primary" onClick={acao.onClick}>
                            {acao.label}
                        </Button>
                    )}
                </div>
            </header>
        );
    return (
        <header className="relative flex items-center justify-between gap-3 max-md:flex-wrap">
            {onVoltar ? (
                <Button size="sm" color="secondary" iconLeading={ArrowLeft} onClick={onVoltar}>
                    {rotuloVoltar}
                </Button>
            ) : (
                <span />
            )}
            <h1 className={cx(TITULO_PAGINA, "pointer-events-none md:absolute md:left-1/2 md:-translate-x-1/2 md:whitespace-nowrap max-md:order-last max-md:w-full")}>{titulo}</h1>
            {acao && (
                <Button size="md" color="primary" onClick={acao.onClick}>
                    {acao.label}
                </Button>
            )}
        </header>
    );
}

/* --------------------------- Barra de uso ------------------------------ */

/** Uso da cota: a barra de progresso do DS. */
export const BarraUso = ({ usadas, total, className }: { usadas: number; total: number; className?: string }) => (
    <ProgressBarBase value={total > 0 ? Math.min(usadas, total) : 0} max={Math.max(total, 1)} className={className} />
);

/* ------------------------------ Seções --------------------------------- */

/** Título de seção (Text lg Semibold) com apoio em Text sm tertiary (UI-VIS-018). */
export const TituloSecao = ({ children, apoio }: { children: ReactNode; apoio?: string }) => (
    <div className="flex flex-col gap-0.5">
        <h2 className="text-lg font-semibold text-primary">{children}</h2>
        {apoio && <p className="text-sm text-tertiary">{apoio}</p>}
    </div>
);

/** Bloco de uma sessão do evento, com a data no topo. Sem rótulo (produtos) fica sem cabeçalho. */
export const CardSessao = ({ rotulo, children }: { rotulo?: string; children: ReactNode; fundo?: "escuro" | "medio" }) => (
    <section className="overflow-hidden rounded-xl bg-primary ring-1 ring-secondary ring-inset">
        {rotulo && (
            <header className="flex items-center gap-3 border-b border-secondary px-4 py-3">
                <Calendar className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-primary">{rotulo}</h3>
            </header>
        )}
        <div className="flex flex-col gap-1 p-4">{children}</div>
    </section>
);

/** Tipo do item (Ingresso, Produto, Combo): o Badge do DS. */
export const BadgeTipo = ({ children }: { children: ReactNode }) => (
    <Badge size="sm" type="pill-color" color="gray" className="shrink-0">
        {children}
    </Badge>
);

/** Grupo desativado: o Badge do DS, no lugar da opacidade (UI-A11Y-001). */
export const BadgeInativo = () => <BadgeTipo>Inativo</BadgeTipo>;
