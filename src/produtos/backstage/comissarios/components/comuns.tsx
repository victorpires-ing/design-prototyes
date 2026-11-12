import { type FC, type ReactNode, useState } from "react";
import { BarChart10, Check, CheckCircle, CoinsHand, Copy01, Gift01, ShoppingBag01, Users01, Wallet02 } from "@untitledui/icons";
import { MetricsIcon03 } from "@/components/application/metrics/metrics";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { CANAL_LABEL, type CanalComissario, type Condicoes } from "../data/comissarios";

/* ------------------------------------------------------------------ */
/*  Peças comuns de Comissários: formatação, métricas, canais, link.   */
/* ------------------------------------------------------------------ */

const MOEDA = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const INTEIRO = new Intl.NumberFormat("pt-BR");
const DATA = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
const DATA_HORA = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export const moeda = (v: number) => MOEDA.format(v);
export const numero = (v: number) => INTEIRO.format(v);
export const dataCurta = (iso: string) => DATA.format(new Date(iso)).replace(".", "");
export const dataHora = (iso: string) => DATA_HORA.format(new Date(iso));
export const plural = (n: number, um: string, varios: string) => `${numero(n)} ${n === 1 ? um : varios}`;

/** "3% por ingresso" ou "R$ 5,00 por ingresso". */
export const textoComissao = (c: Pick<Condicoes, "tipo" | "comissao">) =>
    c.tipo === "acrescimo" ? `${moeda(c.comissao)} a mais por ingresso` : c.tipo === "fixo" ? `${moeda(c.comissao)} por ingresso` : `${String(c.comissao).replace(".", ",")}% por ingresso`;

export const textoDesconto = (c: Pick<Condicoes, "desconto">) => (c.desconto ? `${String(c.desconto).replace(".", ",")}% de desconto` : "Sem desconto");

/** Link de venda do comissário no evento (MKT-262: parâmetro ref). */
export const linkDeVenda = (slug: string, codigo: string) => `ingresse.com/e/${slug}?ref=${codigo}`;

/** Ícone de cada número, pelo rótulo: o mesmo número tem o mesmo ícone em todas as telas. */
const ICONE_DA_METRICA: Array<[RegExp, FC<{ className?: string }>]> = [
    [/^Comissários/, Users01],
    [/^Vendido/, ShoppingBag01],
    [/^Cortesias/, Gift01],
    [/^Comissão/, CoinsHand],
    [/^A repassar/, Wallet02],
    [/^Repassado/, CheckCircle],
];

/** Esconde a variação e o menu de ações do MetricsIcon03, que aqui não têm dado (como em Relatórios › Acesso). */
const SEM_VARIACAO_E_MENU = "[&_.top-4.right-4]:hidden [&_.md\\:top-5]:hidden [&_p+div]:hidden";

/** Número com rótulo, no componente de métricas do DS (MetricsIcon03); o apoio vai no rodapé. */
export function Metrica({ rotulo, valor, apoio }: { rotulo: string; valor: string; apoio?: ReactNode; destaque?: boolean }) {
    const icone = ICONE_DA_METRICA.find(([re]) => re.test(rotulo))?.[1] ?? BarChart10;
    return (
        <MetricsIcon03
            icon={icone}
            title={valor}
            subtitle={rotulo}
            actions={false}
            className={cx("min-w-0 [&_p]:break-words", SEM_VARIACAO_E_MENU)}
            footer={apoio ? <p className="w-full text-sm text-tertiary">{apoio}</p> : undefined}
        />
    );
}

export function FaixaDeMetricas({ children }: { children: ReactNode }) {
    return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

const COR_CANAL: Record<CanalComissario, "brand" | "blue" | "gray"> = { online: "brand", bilheteria: "blue", cortesia: "gray" };

export function CanalBadge({ canal }: { canal: CanalComissario }) {
    return (
        <Badge size="sm" type="pill-color" color={COR_CANAL[canal]}>
            {CANAL_LABEL[canal]}
        </Badge>
    );
}

export function CanaisBadges({ canais }: { canais: CanalComissario[] }) {
    return (
        <span className="flex flex-wrap gap-1">
            {canais.map((c) => (
                <CanalBadge key={c} canal={c} />
            ))}
        </span>
    );
}

/** Copia o link e confirma no próprio botão por 2 s. */
export function CopiarLink({ link, rotulo = "Copiar link", size = "sm" }: { link: string; rotulo?: string; size?: "sm" | "md" }) {
    const [copiado, setCopiado] = useState(false);
    return (
        <Button
            color="secondary"
            size={size}
            iconLeading={copiado ? Check : Copy01}
            onClick={() => {
                navigator.clipboard?.writeText(`https://${link}`).catch(() => {});
                setCopiado(true);
                window.setTimeout(() => setCopiado(false), 2000);
            }}
            aria-live="polite"
        >
            {copiado ? "Copiado" : rotulo}
        </Button>
    );
}

/** Seção-cartão da página (um nível de contêiner, formularios.md §2). */
export function Secao({ titulo, descricao, acao, children, className }: { titulo: string; descricao?: string; acao?: ReactNode; children: ReactNode; className?: string }) {
    return (
        <section className={cx("flex flex-col gap-5 rounded-2xl bg-primary p-5 ring-1 ring-secondary md:p-6", className)}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-lg font-semibold text-primary">{titulo}</span>
                    {descricao && <span className="max-w-[65ch] text-sm text-tertiary">{descricao}</span>}
                </h2>
                {acao}
            </div>
            {children}
        </section>
    );
}

/** Cabeçalho de tabela (desktop). */
export const TH = "px-4 py-3 text-left text-sm font-medium whitespace-nowrap text-tertiary";
export const TD = "px-4 py-4 text-sm text-tertiary";
