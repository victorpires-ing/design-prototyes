import { useEffect, useState, type FC, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, ChevronDown, HelpCircle, InfoCircle, Package, RefreshCcw01, Ticket01, UserSquare } from "@untitledui/icons";
import { Badge, BadgeWithIcon } from "@/components/base/badges/badges";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { InputNumber } from "@/components/base/input/input-number";
import { TextArea } from "@/components/base/textarea/textarea";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { cx } from "@/utils/cx";
import {
    STATUS_LABEL,
    formatarMoeda,
    getItem,
    sessaoDoItem,
    sessaoLabel,
    type CatalogoItem,
    type LinhaCobranca,
    type PedidoItem,
    type StatusPedido,
    type TipoOperacao,
} from "../data/pos-compra-store";

/* O token `border-brand` que o design system usa no foco resolve para cinza neste tema, o que deixa
   o anel quase invisível. Aqui o foco usa o coral da marca, que tem contraste em claro e escuro. */
/* As classes ficam literais: o Tailwind lê o código-fonte e não resolve interpolação. */

/** Foco visível para os elementos montados fora do design system. */
/* Sem `outline-none`, que no Tailwind v4 zera --tw-outline-style e apaga o anel, e com a mesma
   cor de foco do design system, já que a versão arbitrária com var() não gera classe. */
export const FOCO = "focus-visible:[--tw-outline-style:solid] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

/** Aplique no container de uma página ou modal para elevar o foco de tudo que estiver dentro. */
export const FOCO_ESCOPO = "[&_:focus-visible]:[--tw-outline-style:solid] [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-2 [&_:focus-visible]:outline-focus-ring";

/* Vermelho fica reservado para falha, o único estado que exige alguém agir.
   Expirado e em andamento são avisos; sem alteração e já alterado são desfechos bons. */
const STATUS_COR: Record<StatusPedido, "success" | "warning" | "error"> = {
    ativo: "success",
    "alteracao-concluida": "success",
    "aguardando-pagamento": "warning",
    "pago-processando": "warning",
    expirado: "warning",
    falha: "error",
};

export const StatusBadge = ({ status, size = "sm" }: { status: StatusPedido; size?: "sm" | "md" | "lg" }) => (
    <Badge color={STATUS_COR[status]} type="pill-color" size={size}>
        {STATUS_LABEL[status]}
    </Badge>
);

/* Par ícone + cor consistente por tipo de operação — o mesmo em toda a superfície (lista de
   pedidos, cartão de operação, histórico), para reconhecimento visual em vez de leitura de texto. */
export const TIPO_OPERACAO_ICONE: Record<TipoOperacao, FC<{ className?: string }>> = {
    "troca-item": RefreshCcw01,
    "troca-titularidade": UserSquare,
    "alterar-respostas": InfoCircle,
};

export const TIPO_OPERACAO_COR: Record<TipoOperacao, "blue" | "purple" | "gray"> = {
    "troca-item": "blue",
    "troca-titularidade": "purple",
    "alterar-respostas": "gray",
};

export const BadgeTipoOperacao = ({ tipo, texto, size = "sm" }: { tipo: TipoOperacao; texto: string; size?: "sm" | "md" | "lg" }) => (
    <BadgeWithIcon color={TIPO_OPERACAO_COR[tipo]} type="pill-color" size={size} iconLeading={TIPO_OPERACAO_ICONE[tipo]}>
        {texto}
    </BadgeWithIcon>
);

/** Cor da barra de prazo por faixa restante: acima de 50% do prazo, entre 20% e 50%, abaixo de 20%. */
export const corDaBarraDePrazo = (restanteMs: number, totalMs: number) => {
    const fracao = totalMs > 0 ? restanteMs / totalMs : 0;
    if (fracao > 0.5) return "bg-fg-brand-primary";
    if (fracao > 0.2) return "bg-fg-warning-primary";
    return "bg-fg-error-primary";
};

/** Nota curta de regra. Use só quando a informação não cabe em um rótulo ou em um estado visual. */
export const Regra = ({ children, className }: { children: ReactNode; className?: string }) => (
    <p className={cx("flex items-start gap-2 text-sm text-tertiary", className)}>
        <InfoCircle className="mt-0.5 size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
        <span>{children}</span>
    </p>
);

/** Explicação que só aparece quando o usuário pede. */
export const Ajuda = ({ titulo, texto }: { titulo: string; texto: string }) => (
    <Tooltip title={titulo} description={texto} placement="top">
        <TooltipTrigger
            aria-label={texto}
            className={cx(
                "flex size-6 shrink-0 items-center justify-center rounded-full bg-primary ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-primary_hover",
                FOCO,
            )}
        >
            <HelpCircle className="size-4 text-fg-quaternary" aria-hidden="true" />
        </TooltipTrigger>
    </Tooltip>
);

export const Aviso = ({ titulo, descricao, tom = "error" }: { titulo: string; descricao?: string; tom?: "error" | "warning" }) => (
    <div
        className={cx(
            "flex items-start gap-3 rounded-lg p-3 ring-1",
            tom === "error" ? "bg-error-primary ring-error_subtle" : "bg-warning-primary ring-border-secondary",
        )}
    >
        <AlertTriangle
            className={cx("mt-0.5 size-5 shrink-0", tom === "error" ? "text-fg-error-secondary" : "text-fg-warning-secondary")}
            aria-hidden="true"
        />
        <div className="min-w-0">
            <p className={cx("text-sm font-semibold", tom === "error" ? "text-error-primary" : "text-warning-primary")}>{titulo}</p>
            {descricao && <p className="mt-0.5 text-sm text-tertiary">{descricao}</p>}
        </div>
    </div>
);

/** Card de resumo financeiro: cada linha carrega a regra que a originou. */
export const ResumoFinanceiro = ({ linhas, titulo = "Resumo da cobrança" }: { linhas: LinhaCobranca[]; titulo?: string }) => (
    <div className="rounded-xl bg-primary ring-1 ring-border-secondary">
        <p className="border-b border-secondary px-4 py-3 text-sm font-semibold text-primary">{titulo}</p>
        <dl className="flex flex-col divide-y divide-border-secondary">
            {linhas.map((linha) => (
                <div key={linha.label} className={cx("flex items-center justify-between gap-4 px-4 py-2.5", linha.destaque && "bg-secondary")}>
                    <dt className={cx("flex items-center gap-1.5 text-sm", linha.destaque ? "font-semibold text-primary" : "text-secondary")}>
                        {linha.label}
                        {linha.regra && <Ajuda titulo={linha.label} texto={linha.regra} />}
                    </dt>
                    <dd className={cx("text-sm tabular-nums", linha.destaque ? "font-semibold text-primary" : "text-primary")}>
                        {formatarMoeda(linha.valor)}
                    </dd>
                </div>
            ))}
        </dl>
    </div>
);

export const CampoComparativo = ({ label, de, para }: { label: string; de: string; para: string }) => {
    const mudou = de !== para;
    return (
        <div className="flex flex-col gap-1 py-2">
            <p className="text-sm text-tertiary">{label}</p>
            <div className="flex flex-wrap items-center gap-2">
                <span className={cx("text-sm", mudou ? "text-tertiary line-through" : "font-medium text-primary")}>{de}</span>
                {mudou && (
                    <>
                        <span className="text-sm text-fg-quaternary" aria-hidden="true">
                            {"→"}
                        </span>
                        <span className="text-sm font-semibold text-brand-secondary">{para}</span>
                    </>
                )}
            </div>
        </div>
    );
};

export const iniciaisDe = (nome: string) =>
    nome
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((parte) => parte[0]?.toUpperCase() ?? "")
        .join("");

/** Etapa comum aos três fluxos: exige um motivo antes de seguir para a revisão. */
export const EtapaJustificativa = ({
    descricao,
    valor,
    onChange,
    destinatario = "comprador",
}: {
    descricao: string;
    valor: string;
    onChange: (valor: string) => void;
    /** Quem lê essa justificativa: o comprador original numa troca, o novo titular numa transferência. */
    destinatario?: string;
}) => (
    <div className="flex w-full flex-col gap-4 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
        <Regra>{descricao}</Regra>
        <TextArea
            label="Justificativa"
            placeholder={`Explique o motivo dessa alteração para o ${destinatario}.`}
            value={valor}
            onChange={onChange}
            rows={4}
        />
    </div>
);

/** Contagem regressiva acelerada da cobrança pendente. */
export const useContagem = (expiraEm: number | undefined, aoExpirar: () => void) => {
    const [restante, setRestante] = useState(() => (expiraEm ? Math.max(0, expiraEm - Date.now()) : 0));

    useEffect(() => {
        if (!expiraEm) return;
        setRestante(Math.max(0, expiraEm - Date.now()));
        const id = window.setInterval(() => {
            const falta = expiraEm - Date.now();
            setRestante(Math.max(0, falta));
            if (falta <= 0) {
                window.clearInterval(id);
                aoExpirar();
            }
        }, 250);
        return () => window.clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expiraEm]);

    return restante;
};

export const formatarContagem = (ms: number) => {
    const total = Math.ceil(ms / 1000);
    const min = Math.floor(total / 60);
    const seg = total % 60;
    return `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
};

/** Lista que não cresce sem limite: mostra as primeiras linhas e revela o resto sob demanda. */
export function ListaLimitada<T>({
    itens,
    limite = 4,
    rotulo,
    children,
}: {
    itens: T[];
    limite?: number;
    /** Palavra usada no botão, no plural (ex.: "respostas"). */
    rotulo: string;
    children: (item: T, indice: number) => ReactNode;
}) {
    const [expandido, setExpandido] = useState(false);
    const excedente = itens.length - limite;
    const visiveis = expandido ? itens : itens.slice(0, limite);

    return (
        <>
            <div className={cx("flex flex-col divide-y divide-border-secondary", expandido && itens.length > limite && "max-h-80 overflow-y-auto pr-2")}>
                {visiveis.map((item, indice) => children(item, indice))}
            </div>
            {excedente > 0 && (
                <button
                    type="button"
                    onClick={() => setExpandido((atual) => !atual)}
                    className={cx(
                        "mt-3 flex items-center gap-1 rounded-md text-sm font-semibold text-brand-secondary transition duration-100 ease-linear hover:text-brand-secondary_hover",
                        FOCO,
                    )}
                >
                    {expandido ? "Ver menos" : `Ver todas as ${itens.length} ${rotulo}`}
                    <ChevronDown
                        className={cx("size-4 transition-transform duration-100 ease-linear", expandido && "rotate-180")}
                        aria-hidden="true"
                    />
                </button>
            )}
        </>
    );
}

/** Contador de quantidade. Mesmo componente do passo 2 da bilheteria: número centralizado e digitável. */
export const Stepper = ({
    valor,
    maximo,
    rotulo,
    onChange,
}: {
    valor: number;
    maximo: number;
    rotulo: string;
    onChange: (valor: number) => void;
}) => (
    <InputNumber
        size="sm"
        orientation="horizontal"
        value={valor}
        minValue={0}
        maxValue={maximo}
        onChange={(proximo) => onChange(Number.isNaN(proximo) ? 0 : proximo)}
        aria-label={`Quantidade de ${rotulo}`}
        inputClassName="text-center tabular-nums"
        className="w-[120px] shrink-0"
    />
);

/** Passo atual de um fluxo com várias etapas. Mesmo componente usado nos outros fluxos do Backstage. */
export const Etapas = ({ atual, titulos }: { atual: number; titulos: string[] }) => (
    <Progress.IconsWithText
        type="number"
        size="sm"
        orientation="horizontal"
        className="max-md:hidden"
        items={titulos.map((titulo, indice) => ({
            title: titulo,
            description: "",
            status: indice < atual ? "complete" : indice === atual ? "current" : "incomplete",
        }))}
    />
);

export const SecaoCard = ({ titulo, acao, children }: { titulo: string; acao?: ReactNode; children: ReactNode }) => (
    <section className="rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
        <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <h2 className="text-base font-semibold text-primary">{titulo}</h2>
            {acao}
        </div>
        {children}
    </section>
);

/** Resumo do que já foi escolhido na lista do pedido: o fluxo começa sabendo sobre o que age. */
export const ItensSelecionados = ({ linhas, titulo, acao }: { linhas: PedidoItem[]; titulo?: string; acao?: ReactNode }) => {
    const agrupado = new Map<string, { quantidade: number; total: number }>();
    linhas.forEach((linha) => {
        const atual = agrupado.get(linha.itemId) ?? { quantidade: 0, total: 0 };
        atual.quantidade++;
        atual.total += linha.valorPago;
        agrupado.set(linha.itemId, atual);
    });

    return (
        <div className="rounded-xl bg-primary ring-1 ring-border-secondary">
            <div className="flex items-center justify-between gap-3 border-b border-secondary px-4 py-3">
                <p className="text-sm font-semibold text-primary">
                    {titulo ?? `${linhas.length} ${linhas.length === 1 ? "item selecionado" : "itens selecionados"}`}
                </p>
                {acao}
            </div>
            <ul className="flex max-h-72 flex-col divide-y divide-border-secondary overflow-y-auto">
                {[...agrupado.entries()].map(([itemId, { quantidade, total }]) => {
                    const item = getItem(itemId);
                    const detalhe = [item?.lote, sessaoDoItem(item) ? sessaoLabel(item) : null].filter(Boolean).join(" | ");
                    return (
                        <li key={itemId} className="flex items-baseline justify-between gap-3 px-4 py-3">
                            <span className="min-w-0">
                                <span className="block text-sm font-medium text-primary">
                                    {quantidade}x {item?.nome}
                                </span>
                                {detalhe && <span className="block text-sm text-tertiary">{detalhe}</span>}
                            </span>
                            <span className="shrink-0 text-sm font-semibold text-primary tabular-nums">{formatarMoeda(total)}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

/** Stepper para telas pequenas: os ícones mínimos do design system com o rótulo em português.
    O `text` nativo do MinimalIcons escreve "Step X of Y" e conta só as etapas concluídas. */
export const EtapaCompacta = ({ atual, titulos, className }: { atual: number; titulos: string[]; className?: string }) => (
    <div className={cx("flex w-full flex-col items-center gap-2", className)}>
        <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-secondary">
                Etapa {atual + 1} de {titulos.length}
            </p>
            <Progress.MinimalIcons
                size="sm"
                className="w-auto"
                items={titulos.map((titulo, indice) => ({
                    title: titulo,
                    description: "",
                    status: indice < atual ? "complete" : indice === atual ? "current" : "incomplete",
                }))}
            />
        </div>
        <p className="text-sm font-semibold text-primary">{titulos[atual]}</p>
    </div>
);

/** Troca de texto com a mesma sensação de um placar: o valor antigo sobe e sai, o novo entra de baixo.
    Use para rótulos curtos (contadores, nomes de etapa) — `key` precisa mudar a cada valor novo. */
export const TextoAnimado = ({ children, className }: { children: string; className?: string }) => (
    <span className={cx("relative inline-block overflow-hidden align-bottom", className)}>
        <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
                key={children}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="block whitespace-nowrap"
            >
                {children}
            </motion.span>
        </AnimatePresence>
    </span>
);

/** True assim que a página rola alguns pixels. Usada para só mostrar a borda do header fixo (título +
    steps) quando já há conteúdo passando por baixo dele — no topo da página ela é só ruído visual. */
export const useRolou = (limiar = 4) => {
    const [rolou, setRolou] = useState(false);
    useEffect(() => {
        const aoRolar = () => setRolou(window.scrollY > limiar);
        aoRolar();
        window.addEventListener("scroll", aoRolar, { passive: true });
        return () => window.removeEventListener("scroll", aoRolar);
    }, [limiar]);
    return rolou;
};

/** Foto do produto quando existe; ingresso e combo usam um ícone — não têm imagem própria no catálogo. */
export const Miniatura = ({ item }: { item: CatalogoItem }) => {
    if (item.foto) return <img src={item.foto} alt="" className="size-10 shrink-0 rounded-lg object-cover ring-1 ring-border-primary" />;
    return <FeaturedIcon icon={item.tipo === "ingresso" ? Ticket01 : Package} color="gray" theme="modern" size="md" className="shrink-0" />;
};
