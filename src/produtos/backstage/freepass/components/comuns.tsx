import { type FC, type ReactNode, useState } from "react";
import { BarChart10, Check, CheckCircle, CoinsHand, Copy01, Gift01, Share07, ShoppingBag01, Wallet02 } from "@untitledui/icons";
import { MetricsIcon03 } from "@/components/application/metrics/metrics";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

/* Peças do Freepass. As métricas são as mesmas do Backstage (componente de métricas do DS). */

const ICONE_DA_METRICA: Array<[RegExp, FC<{ className?: string }>]> = [
    [/^Vendido/, ShoppingBag01],
    [/^Cortesias/, Gift01],
    [/^(Comissão|Sua comissão)/, CoinsHand],
    [/^A receber/, Wallet02],
    [/^Já recebido/, CheckCircle],
];

/** Esconde a variação e o menu de ações do MetricsIcon03, que aqui não têm dado. */
const SEM_VARIACAO_E_MENU = "[&_.top-4.right-4]:hidden [&_.md\\:top-5]:hidden [&_p+div]:hidden";

export function FaixaDeMetricas({ children }: { children: ReactNode }) {
    return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

/** Número com rótulo no MetricsIcon03; apoio e ação (children) vão no rodapé. */
export function Metrica({ rotulo, valor, apoio, className, children }: { rotulo: string; valor: string; apoio?: ReactNode; className?: string; children?: ReactNode }) {
    const icone = ICONE_DA_METRICA.find(([re]) => re.test(rotulo))?.[1] ?? BarChart10;
    const rodape =
        apoio || children ? (
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
                {apoio && <p className="text-sm text-tertiary">{apoio}</p>}
                {children}
            </div>
        ) : undefined;
    return <MetricsIcon03 icon={icone} title={valor} subtitle={rotulo} actions={false} className={cx("min-w-0 [&_p]:break-words", SEM_VARIACAO_E_MENU, className)} footer={rodape} />;
}

/** Copia o link (https) e confirma no próprio botão por 2 s. */
export function CopiarLink({ link, rotulo = "Copiar link", size = "sm", className }: { link: string; rotulo?: string; size?: "sm" | "md" | "lg"; className?: string }) {
    const [copiado, setCopiado] = useState(false);
    return (
        <Button
            color="secondary"
            size={size}
            className={className}
            iconLeading={copiado ? Check : Copy01}
            onClick={() => {
                navigator.clipboard?.writeText(`https://${link}`).catch(() => {});
                setCopiado(true);
                window.setTimeout(() => setCopiado(false), 2000);
            }}
        >
            <span aria-live="polite">{copiado ? "Copiado" : rotulo}</span>
        </Button>
    );
}

/** Compartilhar nativo do aparelho (WhatsApp, Instagram); sem suporte, o botão não aparece (nativo antes de biblioteca). */
export function CompartilharLink({ link, texto, size = "md", className }: { link: string; texto: string; size?: "sm" | "md" | "lg"; className?: string }) {
    if (typeof navigator === "undefined" || !navigator.share) return null;
    return (
        <Button color="primary" size={size} className={className} iconLeading={Share07} onClick={() => navigator.share({ title: texto, text: texto, url: `https://${link}` }).catch(() => {})}>
            Compartilhar
        </Button>
    );
}
