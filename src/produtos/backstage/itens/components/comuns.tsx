import { type ReactNode, useEffect, useState } from "react";
import { ArrowLeft, ChevronRight } from "@untitledui/icons";
import { AccordionComponent as Accordion } from "@/components/application/accordion/accordion";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input, InputBase } from "@/components/base/input/input";
import { InputGroup } from "@/components/base/input/input-group";
import { Toggle } from "@/components/base/toggle/toggle";
import { Surgir } from "@/components/foundations/transicao";
import type { RegrasDeVenda } from "@/plataforma";
import { TITULO_PAGINA } from "@/produtos/backstage/components/titulo-pagina";
import { cx } from "@/utils/cx";
import type { EstadoItem, EstadoLote } from "../data/catalogo";
import { formatar, useTextosItens } from "../data/textos-itens";

/* ------------------------------------------------------------------ */
/*  Peças comuns ao catálogo: estado, seção com resumo, barra de       */
/*  salvar, regras de venda e o toggle À venda.                        */
/* ------------------------------------------------------------------ */

const COR_DO_ESTADO: Record<EstadoItem | EstadoLote, "success" | "gray" | "warning" | "blue" | "error"> = {
    "a-venda": "success",
    esgotado: "error",
    pausado: "gray",
    agendado: "blue",
    encerrado: "gray",
    "sem-estoque": "warning",
    "sem-abertura": "warning",
    aguardando: "gray",
};

/** Um nome por estado, sempre o mesmo (UI-TXT-004). */
export function EstadoBadge({ estado, lote }: { estado: EstadoItem | EstadoLote; lote?: boolean }) {
    const { t } = useTextosItens();
    const rotulo = lote ? t.estadoLote[estado as EstadoLote] : t.estado[estado as EstadoItem];
    return (
        <Badge size="sm" type="pill-color" color={COR_DO_ESTADO[estado]}>
            {rotulo}
        </Badge>
    );
}

/**
 * Seção do formulário de detalhe: cartão sempre aberto com título, como em Criar evento. Formulário
 * curto não esconde campo em accordion (UI-FRM-006, knowledge/research/2026-11-08-accordion-em-formularios.md).
 * `recolhida`: só para o opcional e raro (ex.: Avançado), com o Accordion do DS, fechada.
 */
export function SecaoDoItem({
    titulo,
    descricao,
    alerta,
    recolhida,
    children,
}: {
    titulo: string;
    descricao?: string;
    /** Destaca a seção quando algo precisa de atenção (ex.: erro, setor acima da capacidade). */
    alerta?: boolean;
    recolhida?: boolean;
    children: ReactNode;
}) {
    const cabecalho = (
        <span className="flex flex-col gap-0.5">
            <span className="text-lg font-semibold text-primary">{titulo}</span>
            {descricao && <span className="max-w-[65ch] text-sm text-tertiary">{descricao}</span>}
        </span>
    );
    if (recolhida)
        return (
            <section data-alerta={alerta || undefined} className={cx("rounded-2xl bg-primary ring-1 ring-secondary", alerta && "ring-2 ring-fg-warning-secondary")}>
                <Accordion>
                    <Accordion.Item value="secao" className="rounded-2xl bg-primary" trigger={<span className="block py-1">{cabecalho}</span>}>
                        <div className="flex flex-col gap-5">{children}</div>
                    </Accordion.Item>
                </Accordion>
            </section>
        );
    return (
        <section
            data-alerta={alerta || undefined}
            className={cx("flex flex-col gap-5 rounded-2xl bg-primary p-5 ring-1 ring-secondary md:p-6", alerta && "ring-2 ring-fg-warning-secondary")}
        >
            <h2>{cabecalho}</h2>
            {children}
        </section>
    );
}

/**
 * Depois de um salvar com erro, rola até o primeiro campo inválido (ou a primeira seção em alerta) e
 * põe o foco nele. Nada fica escondido: as seções são abertas (UI-FRM-006).
 */
export function irParaPrimeiroErro() {
    requestAnimationFrame(() => {
        const campo = document.querySelector<HTMLElement>('main [aria-invalid="true"]');
        const alvo = campo ?? document.querySelector<HTMLElement>("main [data-alerta]");
        if (!alvo) return;
        alvo.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        campo?.focus({ preventScroll: true });
    });
}

/**
 * Barra fixa de salvar: aparece quando há mudança. Fundo da página e largura da área de conteúdo
 * (UI-VIS-013, UI-VIS-009).
 */
export function BarraDeSalvar({ visivel, salvando, onSalvar, onDescartar, desabilitado }: { visivel: boolean; salvando?: boolean; onSalvar: () => void; onDescartar: () => void; desabilitado?: boolean }) {
    const { t } = useTextosItens();
    return (
        <div className="sticky bottom-0 z-20 mt-auto">
            <Surgir visivel={visivel}>
                <div data-barra-fixa className="flex flex-wrap items-center justify-between gap-3 border-t border-secondary bg-primary_alt py-3">
                    <span className="text-sm text-tertiary" role="status">
                        {t.alteracoesNaoSalvas}
                    </span>
                    <div className="flex gap-3">
                        <Button color="secondary" size="md" onClick={onDescartar} isDisabled={salvando}>
                            {t.descartar}
                        </Button>
                        <Button color="primary" size="md" onClick={onSalvar} isLoading={salvando} isDisabled={desabilitado}>
                            {t.salvar}
                        </Button>
                    </div>
                </div>
            </Surgir>
        </div>
    );
}

/** Confirmação ao sair com alterações não salvas. */
export function ConfirmarSaida({ aberto, onFechar, onSair }: { aberto: boolean; onFechar: () => void; onSair: () => void }) {
    const { t } = useTextosItens();
    return (
        <ModalOverlay isOpen={aberto} onOpenChange={(v) => !v && onFechar()} isDismissable>
            <Modal className="sm:max-w-[400px]">
                <Dialog>
                    <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold text-primary">{t.sairSemSalvar}</h2>
                            <p className="text-sm text-tertiary">{t.sairSemSalvarDica}</p>
                        </div>
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Button color="secondary" size="md" onClick={onFechar}>
                                {t.continuarEditando}
                            </Button>
                            <Button color="primary-destructive" size="md" onClick={onSair}>
                                {t.sair}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

/* ---------------- regras de venda ---------------- */

/**
 * Resumo das regras de venda em uma frase. Sem regra, volta vazio: o padrão não vira texto na tela
 * (tela saturada de texto sobrecarrega antes mesmo do uso).
 */
export function useResumoDasVendas() {
    const { t } = useTextosItens();
    return (v: RegrasDeVenda | undefined) => {
        if (!v || v.limitePorPedido == null) return "";
        const partes: string[] = [];
        if (v.limitePorPedido != null)
            partes.push(
                (v.minimoPorPedido ?? 1) > 1
                    ? formatar(t.vendas.resumoFaixa, { min: v.minimoPorPedido!, max: v.limitePorPedido })
                    : formatar(t.vendas.resumoLimite, { n: v.limitePorPedido }),
            );
        // Frase com vírgulas, sem símbolo separador (UI-TXT-010).
        const frase = partes.join(", ");
        return frase.charAt(0).toUpperCase() + frase.slice(1) + ".";
    };
}

/**
 * Regras de venda, iguais para ingresso, produto e combo: só a quantidade por pedido. Quando o item
 * vende é decidido pelo lote (ordem, estoque, data limite) e pela abertura de vendas, não aqui.
 */
export function CamposDeVendas({ valor, onChange }: { valor: RegrasDeVenda | undefined; onChange: (v: RegrasDeVenda) => void }) {
    const { t } = useTextosItens();
    const v = valor ?? {};
    const set = (patch: Partial<RegrasDeVenda>) => onChange({ ...v, ...patch });

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
                <Toggle
                    label={t.vendas.limite}
                    isSelected={v.limitePorPedido != null}
                    onChange={(on) => set(on ? { limitePorPedido: 4, minimoPorPedido: 1 } : { limitePorPedido: null, minimoPorPedido: undefined })}
                />
                <Surgir visivel={v.limitePorPedido != null}>
                    <div className="grid max-w-80 grid-cols-2 gap-3">
                        <Input
                            label={t.vendas.minimoQtd}
                            type="number"
                            inputMode="numeric"
                            value={String(v.minimoPorPedido ?? 1)}
                            onChange={(x) => set({ minimoPorPedido: Math.max(1, Math.round(Number(x) || 1)) })}
                            isInvalid={(v.minimoPorPedido ?? 1) > (v.limitePorPedido ?? Infinity)}
                            hint={(v.minimoPorPedido ?? 1) > (v.limitePorPedido ?? Infinity) ? t.vendas.minimoErro : undefined}
                        />
                        <Input
                            label={t.vendas.limiteQtd}
                            type="number"
                            inputMode="numeric"
                            value={v.limitePorPedido != null ? String(v.limitePorPedido) : ""}
                            onChange={(x) => set({ limitePorPedido: Math.max(1, Math.round(Number(x) || 1)) })}
                        />
                    </div>
                </Surgir>
            </div>
        </div>
    );
}

/** Estados que o toggle "À venda" não mostra sozinho: só eles viram badge no cabeçalho. */
const ESTADOS_DO_BADGE: EstadoItem[] = ["esgotado", "sem-estoque"];

/**
 * Cabeçalho do detalhe de ingresso, produto e combo (UI-VIS-014, UI-VIS-015): voltar, título e um
 * subtítulo; o liga e desliga do item na mesma linha do título, à direita. O badge só aparece para
 * o que o toggle não diz (esgotado, sem estoque); o aviso explica quando está ligado e não vende.
 */
export function CabecalhoDoItem({
    voltar,
    onVoltar,
    titulo,
    midia,
    estado,
    resumo,
    ativo,
    onAtivo,
    aviso,
}: {
    voltar: string;
    onVoltar: () => void;
    titulo: string;
    /** Imagem ao lado do título (produto). */
    midia?: ReactNode;
    estado?: EstadoItem;
    resumo?: ReactNode;
    ativo: boolean;
    onAtivo: (v: boolean) => void;
    aviso?: string;
}) {
    const { t } = useTextosItens();
    const badge = estado && ESTADOS_DO_BADGE.includes(estado) ? <EstadoBadge estado={estado} /> : null;
    return (
        <header className="flex flex-col gap-3">
            <Button color="tertiary" size="md" iconLeading={ArrowLeft} onClick={onVoltar} className="-ml-3 self-start">
                {voltar}
            </Button>
            {/* Título à esquerda e o toggle à direita, na mesma linha também no celular. */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                    {midia}
                    <div className="flex min-w-0 flex-col gap-1">
                        <h1 className={`${TITULO_PAGINA} break-words`}>{titulo}</h1>
                        {(badge || resumo) && (
                            <p className="flex flex-wrap items-center gap-2 text-md text-tertiary">
                                {badge}
                                {resumo && <span>{resumo}</span>}
                            </p>
                        )}
                    </div>
                </div>
                {/* Área de toque de 44 px de altura sem mudar o alinhamento (WCAG 2.5.8). */}
                <Toggle
                    size="md"
                    label={t.visibilidade.ativo}
                    aria-label={formatar("{rotulo}, {item}", { rotulo: t.visibilidade.ativo, item: titulo })}
                    isSelected={ativo}
                    onChange={onAtivo}
                    className="-my-2.5 shrink-0 py-2.5 md:mt-1.5"
                />
            </div>
            <Surgir visivel={!!aviso}>
                <p role="status" className="text-sm text-warning-primary">
                    {aviso}
                </p>
            </Surgir>
        </header>
    );
}

type CampoPrecoProps = {
    label: string;
    isRequired?: boolean;
    hint?: string;
    ocultarLabel?: boolean;
    isInvalid?: boolean;
    placeholder?: string;
} & (
    | { opcional?: false; valor: number; onChange: (v: number) => void }
    /** Vazio é um valor (ex.: "usa o preço base"), diferente de R$ 0. */
    | { opcional: true; valor: number | undefined; onChange: (v: number | undefined) => void }
);

/** Campo de preço em reais, o único do catálogo (UI-DS-003): prefixo "R$" do DS, aceita vírgula, grava número. */
export function CampoPreco(props: CampoPrecoProps) {
    const { label, isRequired, hint, ocultarLabel, isInvalid, placeholder = "0" } = props;
    // Máscara de preço (ITM-90): os dígitos entram pelos centavos, como em maquininha ("1234" vira "12,34"),
    // com separador de milhar. O valor vai em reais.
    const formatar = (v: number) => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
    const paraTexto = (v: number | undefined) => (v || (props.opcional && v === 0) ? formatar(v ?? 0) : "");
    const [texto, setTexto] = useState(paraTexto(props.valor));
    // Acompanha mudanças de fora (descartar, trocar de item) sem atrapalhar a digitação.
    useEffect(() => {
        const atual = texto ? Number(texto.replace(/\D/g, "")) / 100 : props.opcional ? undefined : 0;
        if (atual !== props.valor) setTexto(paraTexto(props.valor));
    }, [props.valor]);
    return (
        <InputGroup
            label={ocultarLabel ? undefined : label}
            aria-label={ocultarLabel ? label : undefined}
            isRequired={isRequired}
            isInvalid={isInvalid}
            hint={hint}
            prefix="R$"
            value={texto}
            onChange={(v: string) => {
                // Só dígitos, até 9 (R$ 9.999.999,99); apagar tudo volta ao vazio.
                const digitos = v.replace(/\D/g, "").replace(/^0+/, "").slice(0, 9);
                const reais = digitos ? Number(digitos) / 100 : 0;
                setTexto(digitos ? formatar(reais) : "");
                if (props.opcional) props.onChange(digitos ? reais : undefined);
                else props.onChange(reais);
            }}
        >
            <InputBase inputMode="numeric" placeholder={placeholder === "0" ? "0,00" : placeholder} />
        </InputGroup>
    );
}

export { cx };

/**
 * Lista de escolhas: cada tipo de item vira uma linha (rótulo, o que está escolhido e "Escolher" ou
 * "Editar" à direita). A linha inteira abre a escolha; as ações ficam alinhadas na mesma borda.
 */
export function ListaDeEscolhas({ children }: { children: ReactNode }) {
    return <div className="flex flex-col divide-y divide-secondary rounded-xl ring-1 ring-secondary ring-inset">{children}</div>;
}

export function EscolhaEmLista({ rotulo, dica, escolhidos, vazio, onEscolher }: { rotulo: string; dica?: string; escolhidos: string[]; vazio: string; onEscolher: () => void }) {
    const { locale } = useTextosItens();
    const visiveis = escolhidos.slice(0, 5);
    const vazia = escolhidos.length === 0;
    return (
        <button
            type="button"
            onClick={onEscolher}
            className="group flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left outline-focus-ring transition duration-100 ease-linear -outline-offset-2 first:rounded-t-xl last:rounded-b-xl hover:bg-primary_hover focus-visible:outline-2 md:px-5"
        >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium text-secondary">{rotulo}</span>
                <span className={cx("text-sm", vazia ? "text-tertiary" : "text-primary")}>
                    {vazia
                        ? vazio
                        : new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(
                              escolhidos.length > 5 ? [...visiveis, formatar("mais {n}", { n: escolhidos.length - 5 })] : visiveis,
                          )}
                </span>
                {dica && <span className="text-sm text-tertiary">{dica}</span>}
            </span>
            <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-secondary group-hover:text-brand-secondary_hover">
                {vazia ? "Escolher" : "Editar"}
                <ChevronRight className="size-4" aria-hidden="true" />
            </span>
        </button>
    );
}
