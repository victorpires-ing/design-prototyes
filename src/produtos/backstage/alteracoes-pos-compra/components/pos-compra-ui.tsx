import { useEffect, useState, type FC, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, ArrowDown, ChevronDown, ClipboardCheck, InfoCircle, Package, RefreshCcw01, Ticket01, UserSquare } from "@untitledui/icons";
import { Badge, BadgeWithIcon } from "@/components/base/badges/badges";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Input } from "@/components/base/input/input";
import { InputNumber } from "@/components/base/input/input-number";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { TextArea } from "@/components/base/textarea/textarea";
import { cx } from "@/utils/cx";
import {
    CATEGORIA_MOTIVO_LABEL,
    STATUS_LABEL,
    formatarMoeda,
    type CatalogoItem,
    type CategoriaMotivo,
    type LinhaCobranca,
    type Motivo,
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

/* Badges sempre em "md": o "sm" do design system escreve em 12px, abaixo do mínimo da casa. */
export const StatusBadge = ({ status, size = "md" }: { status: StatusPedido; size?: "sm" | "md" | "lg" }) => (
    <Badge color={STATUS_COR[status]} type="pill-color" size={size}>
        {STATUS_LABEL[status]}
    </Badge>
);

/* Par ícone + cor consistente por tipo de operação — o mesmo em toda a superfície (lista de
   pedidos, cartão de operação, histórico), para reconhecimento visual em vez de leitura de texto. */
export const TIPO_OPERACAO_ICONE: Record<TipoOperacao, FC<{ className?: string }>> = {
    "troca-item": RefreshCcw01,
    "troca-titularidade": UserSquare,
    /* Era InfoCircle. Como o ícone agora também é o botão da linha, "i" lia como
       informação, não como ação sobre o formulário. */
    "alterar-respostas": ClipboardCheck,
};

export const TIPO_OPERACAO_COR: Record<TipoOperacao, "blue" | "purple" | "gray"> = {
    "troca-item": "blue",
    "troca-titularidade": "purple",
    "alterar-respostas": "gray",
};

export const BadgeTipoOperacao = ({ tipo, texto, size = "md" }: { tipo: TipoOperacao; texto: string; size?: "sm" | "md" | "lg" }) => (
    <BadgeWithIcon color={TIPO_OPERACAO_COR[tipo]} type="pill-color" size={size} iconLeading={TIPO_OPERACAO_ICONE[tipo]}>
        {texto}
    </BadgeWithIcon>
);

/** Nota curta de regra. Use só quando a informação não cabe em um rótulo ou em um estado visual. */
export const Regra = ({ children, className }: { children: ReactNode; className?: string }) => (
    <p className={cx("flex items-start gap-2 text-sm text-tertiary", className)}>
        <InfoCircle className="mt-0.5 size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
        <span>{children}</span>
    </p>
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

/** Card de resumo financeiro: cada linha carrega, por escrito, a regra que a originou. A regra
 *  não fica num tooltip: o do design system escreve em 12px e esconde o que justifica o valor. */
/**
 * Recibo: rótulo e valor, as parcelas somando no total. Nada mais.
 *
 * Antes cada linha vinha com um parágrafo explicando a própria regra, e quatro
 * linhas viravam um bloco de texto que ninguém lê na hora de conferir um valor.
 * A regra que o operador precisa ver na decisão — a sobra não devolvida do
 * downgrade — está no aviso e no aceite da revisão, que é onde ela age.
 *
 * `regra` continua no modelo: documenta a conta para quem lê o código e serve
 * se um dia houver uma superfície de auditoria. Só não polui o recibo.
 */
export const ResumoFinanceiro = ({ linhas, titulo = "Resumo da cobrança", semMoldura = false }: { linhas: LinhaCobranca[]; titulo?: string; semMoldura?: boolean }) => {
    const todas = linhas.filter((l) => !l.destaque);
    const total = linhas.find((l) => l.destaque);
    /* Uma cobrança só: parcela e total são o mesmo número, e repetir o valor em
       duas linhas não informa nada. A linha única vira o próprio total, mantendo
       o rótulo que diz do que se trata. */
    const unica = todas.length === 1 && total && todas[0].valor === total.valor ? todas[0] : null;
    const parcelas = unica ? [] : todas;
    return (
        <div className={cx(!semMoldura && "rounded-xl bg-primary ring-1 ring-border-secondary")}>
            {!semMoldura && <p className="border-b border-secondary px-4 py-3 text-sm font-semibold text-primary">{titulo}</p>}
            <dl className="flex flex-col gap-2 px-4 py-3">
                {parcelas.map((linha) => (
                    <div key={linha.label} className="flex items-baseline justify-between gap-4">
                        <dt className="text-sm text-secondary">{linha.label}</dt>
                        <dd className="shrink-0 text-sm text-primary tabular-nums">{formatarMoeda(linha.valor)}</dd>
                    </div>
                ))}
                {total && (
                    <div className={cx("flex items-baseline justify-between gap-4", !unica && "mt-1 border-t border-secondary pt-3")}>
                        <dt className="text-sm font-semibold text-primary">{unica ? unica.label : total.label}</dt>
                        <dd className="shrink-0 text-md font-bold text-primary tabular-nums">{formatarMoeda(total.valor)}</dd>
                    </div>
                )}
            </dl>
        </div>
    );
};

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

const CATEGORIAS = Object.keys(CATEGORIA_MOTIVO_LABEL) as CategoriaMotivo[];

/** Motivo da alteração, comum aos três fluxos. Opções cobrem o caso frequente com um clique; a
 *  nota só é obrigatória em "Outro". Diz quem lê: antes o campo pedia um texto "para o
 *  comprador" e, na mesma tela, dizia que ia para o histórico. */
export const CampoMotivo = ({ valor, onChange }: { valor: Motivo; onChange: (valor: Motivo) => void }) => (
    <div className="flex w-full flex-col gap-4 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
        <div>
            <p className="text-sm font-semibold text-primary">Motivo da alteração</p>
            <p className="text-sm text-tertiary">Fica só no histórico do pedido. O cliente não vê.</p>
        </div>
        {/* H-07: motivo E número do chamado são obrigatórios em toda alteração no Backstage. */}
        <Input
            label="Número do chamado"
            placeholder="Ex.: 98231"
            value={valor.chamado}
            onChange={(chamado) => onChange({ ...valor, chamado })}
            isRequired
            hint="Obrigatório: liga a alteração ao atendimento que a originou."
        />
        <RadioGroup aria-label="Motivo da alteração" value={valor.categoria} onChange={(categoria) => onChange({ ...valor, categoria: categoria as CategoriaMotivo })} className="gap-3">
            {CATEGORIAS.map((categoria) => (
                <RadioButton key={categoria} value={categoria} label={CATEGORIA_MOTIVO_LABEL[categoria]} />
            ))}
        </RadioGroup>
        <TextArea
            label={valor.categoria === "outro" ? "Descreva o motivo" : "Observação (opcional)"}
            placeholder={valor.categoria === "outro" ? "O que aconteceu" : "Algum detalhe que ajude quem ler depois"}
            value={valor.nota}
            onChange={(nota) => onChange({ ...valor, nota })}
            rows={3}
            isRequired={valor.categoria === "outro"}
        />
    </div>
);

export const MOTIVO_INICIAL: Motivo = { categoria: "", nota: "", chamado: "" };

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
        size="md"
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

/** Liga "o que está sendo alterado" ao que vem depois, nos três fluxos do overlay. */
export const SetaParaBaixo = () => (
    <span className="flex size-11 shrink-0 items-center justify-center self-center rounded-full bg-primary shadow-xs ring-1 ring-border-secondary" aria-hidden="true">
        <ArrowDown className="size-5 text-fg-secondary" />
    </span>
);

/** "Lote 2" já vem escrito assim no catálogo; "2" sozinho não se explica. */
export const rotuloDoLote = (lote: string) => (lote.toLowerCase().startsWith("lote") ? lote : `Lote ${lote}`);

/**
 * Onde o item mora: grupo e lote, na mesma frase em toda a superfície.
 *
 * O ingresso é identificado pelo caminho grupo > ingresso > lote, e sem o grupo um item fora do
 * contexto da sessão deixa de se explicar: "Corrida 5 km" existe em mais de um grupo. Produto
 * não tem nem um nem outro, e aí a linha simplesmente não aparece.
 */
export const caminhoDoItem = (item: CatalogoItem) => [item.grupo, item.lote && rotuloDoLote(item.lote)].filter(Boolean).join(" · ");

/** Foto do produto quando existe; ingresso e combo usam um ícone — não têm imagem própria no catálogo. */
export const Miniatura = ({ item }: { item: CatalogoItem }) => {
    if (item.foto) return <img src={item.foto} alt="" className="size-10 shrink-0 rounded-lg object-cover ring-1 ring-border-primary" />;
    return <FeaturedIcon icon={item.tipo === "ingresso" ? Ticket01 : Package} color="gray" theme="modern" size="md" className="shrink-0" />;
};

/* ------------------------------------------------------------------ */
/*  Dados pessoais e prazos                                            */
/* ------------------------------------------------------------------ */

/** CPF por extenso, no formato do documento. Era mascarado em `***.012.345-**`, mostrando só os
 *  seis dígitos do meio; o produto exibe os onze. */
export const formatarCPF = (cpf: string) => {
    const d = cpf.replace(/\D/g, "");
    return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : cpf;
};

/** E-mail de destino de um link, sem expor o endereço inteiro: "b***@email.com". */
export const mascararEmail = (email: string) => {
    const [usuario, dominio] = email.split("@");
    return dominio ? `${usuario.slice(0, 1)}***@${dominio}` : email;
};

export const mascararTelefone = (telefone: string) => {
    const d = telefone.replace(/\D/g, "");
    return d.length >= 8 ? `(${d.slice(-11, -9) || "**"}) *****-${d.slice(-4)}` : telefone;
};

/** Destino de envio já mascarado, pelo formato do valor. */
export const mascararDestino = (destino: string) => (destino.includes("@") ? mascararEmail(destino) : mascararTelefone(destino));

/** Celular no formato que cola direto no WhatsApp ou no discador: "+5584988124407". */
export const telefoneParaCopia = (telefone: string) => `+${telefone.replace(/\D/g, "")}`;

const horaDe = (instante: number) => new Date(instante).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

/** Prazo como horário e tempo restante ("expira às 15:42, em 38 min"), não como cronômetro. */
export const formatarPrazo = (expiraEm: number, restanteMs: number) => {
    const segundos = Math.max(0, Math.ceil(restanteMs / 1000));
    const falta = segundos >= 3600 ? `${Math.floor(segundos / 3600)} h` : segundos >= 60 ? `${Math.floor(segundos / 60)} min` : `${segundos} s`;
    return `expira às ${horaDe(expiraEm)}, em ${falta}`;
};
