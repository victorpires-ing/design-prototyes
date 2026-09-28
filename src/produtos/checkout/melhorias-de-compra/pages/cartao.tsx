import { useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Radio as AriaRadio, RadioGroup as AriaRadioGroup } from "react-aria-components";
import { ChevronDown, InfoCircle, Plus, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { HintText } from "@/components/base/input/hint-text";
import { Input, InputBase, TextField } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { cx } from "@/utils/cx";
import { CheckoutShell, totalPedido } from "../components/checkout-shell";
import { BANDEIRAS } from "../components/icones";
import { TopoVoltar } from "../components/topo";
import { useCheckout } from "../data/checkout-store";
import { PARCELAS_VISIVEIS, PARCELA_POPULAR, brl, calcularParcelas } from "../data/pedido";
import { type CamposCartao, detectarBandeira, mascararNumero, mascararValidade, soDigitos, validarCartao } from "../utils/cartao";
import { useIsMobile, useTemaClaro } from "../utils/hooks";

const BASE = "/checkout/melhorias-de-compra";
const NOVO = "novo";

/** Valor com centavos menores, como no Figma (R$39,34). */
const Valor = ({ v, className }: { v: number; className?: string }) => {
    const [inteiro, centavos] = v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).split(",");
    return (
        <span className={cx("tabular-nums", className)}>
            R${inteiro}
            <span className="text-xs">,{centavos}</span>
        </span>
    );
};

function OpcaoCartao({ value, children }: { value: string; children: ReactNode }) {
    return (
        <AriaRadio
            value={value}
            className={({ isSelected }) =>
                cx(
                    "flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 shadow-xs transition duration-100 ease-linear",
                    isSelected ? "bg-brand-primary" : "bg-primary hover:bg-primary_hover",
                )
            }
        >
            {({ isSelected, isFocusVisible }) => (
                <>
                    <div className="flex min-w-0 flex-1 items-center gap-3 text-md text-primary">{children}</div>
                    <RadioButtonBase size="md" isSelected={isSelected} isFocusVisible={isFocusVisible} />
                </>
            )}
        </AriaRadio>
    );
}

export function Cartao() {
    useTemaClaro();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [params] = useSearchParams();
    const debito = params.get("tipo") === "debito";
    const { protecao, cartoesSalvos, salvarCartao, excluirCartao } = useCheckout();

    const [selecionado, setSelecionado] = useState<string>(NOVO);
    const [campos, setCampos] = useState<CamposCartao>({ numero: "", nome: "", validade: "", cvv: "" });
    const [tocados, setTocados] = useState<Partial<Record<keyof CamposCartao, boolean>>>({});
    const [salvar, setSalvar] = useState(false);
    const [parcelas, setParcelas] = useState(debito ? 1 : PARCELA_POPULAR);
    const [todasParcelas, setTodasParcelas] = useState(false);
    const [enviando, setEnviando] = useState(false);

    const cartaoSalvo = cartoesSalvos.find((c) => c.id === selecionado);
    const usandoNovo = !cartaoSalvo;

    // Parcelas calculadas sobre o total sem juros; a diferença entra no resumo como juros.
    const tabela = useMemo(() => calcularParcelas(totalPedido(protecao)), [protecao]);
    const escolhida = tabela[parcelas - 1];
    const juros = debito ? 0 : escolhida.total - totalPedido(protecao);

    const erros = validarCartao(campos);
    const errosVisiveis = usandoNovo ? erros : { cvv: erros.cvv };
    const valido = Object.values(errosVisiveis).every((e) => !e);
    const erro = (k: keyof CamposCartao) => (tocados[k] ? errosVisiveis[k] : undefined);

    const bandeira = detectarBandeira(campos.numero);
    const tamanhoCvv = (cartaoSalvo?.bandeira ?? bandeira) === "amex" ? 4 : 3;

    const atualizar = (k: keyof CamposCartao, v: string) => setCampos((c) => ({ ...c, [k]: v }));
    const tocar = (k: keyof CamposCartao) => () => setTocados((t) => ({ ...t, [k]: true }));

    const escolherCartao = (id: string) => {
        setSelecionado(id);
        setCampos((c) => ({ ...c, cvv: "" }));
        setTocados({});
    };

    const finalizar = () => {
        setEnviando(true);
        window.setTimeout(() => {
            if (usandoNovo && salvar && bandeira) salvarCartao({ bandeira, final: soDigitos(campos.numero).slice(-4) });
            navigate(`${BASE}/nao-autorizado${debito ? "?tipo=debito" : ""}`);
        }, 1400);
    };

    const rotuloNovo = debito ? "Novo cartão de débito" : "Novo cartão de crédito";
    const visiveis = todasParcelas ? tabela : tabela.slice(0, PARCELAS_VISIVEIS);

    return (
        <CheckoutShell isMobile={isMobile} juros={juros} topo={<TopoVoltar isMobile={isMobile} onVoltar={() => navigate(BASE)} />}>
            <div className="flex items-center justify-between gap-3">
                <h1 id="titulo-cartao" className="text-lg font-semibold text-primary">
                    Selecione como pagar
                </h1>
                {cartaoSalvo && (
                    <button
                        type="button"
                        onClick={() => {
                            excluirCartao(cartaoSalvo.id);
                            escolherCartao(NOVO);
                        }}
                        className="flex items-center gap-1.5 text-md font-medium text-brand-secondary transition duration-100 ease-linear hover:text-brand-secondary_hover"
                    >
                        <Trash01 className="size-4" />
                        Excluir
                    </button>
                )}
            </div>

            <AriaRadioGroup aria-labelledby="titulo-cartao" value={selecionado} onChange={escolherCartao} className="mt-4 flex flex-col gap-4">
                {cartoesSalvos.map((c) => {
                    const { Icon, nome } = BANDEIRAS[c.bandeira];
                    return (
                        <OpcaoCartao key={c.id} value={c.id}>
                            <Icon className="h-6 w-auto shrink-0" aria-label={nome} />
                            <span className="tabular-nums">****{c.final}</span>
                        </OpcaoCartao>
                    );
                })}
                <OpcaoCartao value={NOVO}>
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full ring-1 ring-secondary">
                        <Plus className="size-4 text-fg-secondary" />
                    </span>
                    {rotuloNovo}
                </OpcaoCartao>
            </AriaRadioGroup>

            <div className="mt-4 rounded-2xl bg-primary p-4 shadow-xs">
                <div className="flex flex-col gap-5">
                    {usandoNovo && (
                        <>
                            <TextField
                                size="lg"
                                value={campos.numero}
                                onChange={(v) => atualizar("numero", mascararNumero(v))}
                                onBlur={tocar("numero")}
                                isInvalid={!!erro("numero")}
                                className="flex flex-col gap-1.5"
                            >
                                <Label>Número do cartão</Label>
                                <div className="relative w-full">
                                    <InputBase size="lg" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" inputClassName="pr-32" />
                                    <div className={cx("pointer-events-none absolute top-1/2 flex -translate-y-1/2 gap-1", erro("numero") ? "right-10" : "right-3")}>
                                        {(["visa", "mastercard", "amex", "diners"] as const).map((b) => {
                                            const { Icon } = BANDEIRAS[b];
                                            return <Icon key={b} className={cx("h-4 w-auto transition-opacity", bandeira && bandeira !== b && "opacity-30")} />;
                                        })}
                                    </div>
                                </div>
                                {erro("numero") && <HintText isInvalid>{erro("numero")}</HintText>}
                            </TextField>

                            <Input
                                size="lg"
                                label="Nome impresso no cartão"
                                placeholder="Digite o nome conforme está no cartão"
                                autoComplete="cc-name"
                                value={campos.nome}
                                onChange={(v) => atualizar("nome", v)}
                                onBlur={tocar("nome")}
                                isInvalid={!!erro("nome")}
                                hint={erro("nome")}
                            />
                        </>
                    )}

                    <div className={cx("grid gap-4", usandoNovo ? "grid-cols-2 lg:gap-6" : "grid-cols-1 sm:max-w-80")}>
                        {usandoNovo && (
                            <Input
                                size="lg"
                                label="Validade"
                                placeholder="MM / AA"
                                inputMode="numeric"
                                autoComplete="cc-exp"
                                value={campos.validade}
                                onChange={(v) => atualizar("validade", mascararValidade(v))}
                                onBlur={tocar("validade")}
                                isInvalid={!!erro("validade")}
                                hint={erro("validade")}
                            />
                        )}
                        <TextField
                            size="lg"
                            value={campos.cvv}
                            onChange={(v) => atualizar("cvv", soDigitos(v).slice(0, tamanhoCvv))}
                            onBlur={tocar("cvv")}
                            isInvalid={!!erro("cvv")}
                            className="flex flex-col gap-1.5"
                        >
                            <div className="flex w-full items-center justify-between">
                                <Label>Cód. segurança</Label>
                                <Tooltip title="Onde encontrar" description={`São os ${tamanhoCvv} dígitos impressos no verso do cartão.`}>
                                    <TooltipTrigger aria-label="Onde encontrar o código de segurança" className="text-fg-quaternary hover:text-fg-secondary">
                                        <InfoCircle className="size-4" />
                                    </TooltipTrigger>
                                </Tooltip>
                            </div>
                            <InputBase size="lg" inputMode="numeric" autoComplete="cc-csc" placeholder={tamanhoCvv === 4 ? "Ex: 1234" : "Ex: 123"} />
                            {erro("cvv") && <HintText isInvalid>{erro("cvv")}</HintText>}
                        </TextField>
                    </div>

                    {usandoNovo && <Checkbox label="Salvar cartão para próximas compras" isSelected={salvar} onChange={setSalvar} />}
                </div>

                {!debito && (
                    <section aria-labelledby="titulo-parcelas" className="mt-8">
                        <h2 id="titulo-parcelas" className="text-lg font-semibold text-primary">
                            Selecione o parcelamento
                        </h2>
                        <AriaRadioGroup aria-labelledby="titulo-parcelas" value={String(parcelas)} onChange={(v) => setParcelas(Number(v))} className="mt-3 flex flex-col">
                            {visiveis.map((p) => (
                                <AriaRadio
                                    key={p.n}
                                    value={String(p.n)}
                                    className={({ isSelected }) =>
                                        cx(
                                            "flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 whitespace-nowrap transition duration-100 ease-linear lg:gap-3 lg:px-4",
                                            isSelected ? "bg-brand-primary" : "hover:bg-primary_hover",
                                        )
                                    }
                                >
                                    {({ isSelected, isFocusVisible }) => (
                                        <>
                                            <RadioButtonBase size="md" isSelected={isSelected} isFocusVisible={isFocusVisible} />
                                            <span className={cx("text-sm text-primary lg:text-md", isSelected && "font-semibold")}>
                                                {p.n}x <Valor v={p.valor} />
                                            </span>
                                            {p.n === PARCELA_POPULAR && (
                                                <span className="shrink-0 rounded-full bg-brand-solid px-2 py-0.5 text-xs font-medium text-white">Mais popular</span>
                                            )}
                                            <span className="ml-auto text-sm text-secondary">{p.semJuros ? "Sem juros" : <Valor v={p.total} />}</span>
                                        </>
                                    )}
                                </AriaRadio>
                            ))}
                        </AriaRadioGroup>
                        <button
                            type="button"
                            aria-expanded={todasParcelas}
                            onClick={() => setTodasParcelas((v) => !v)}
                            className="mt-1 flex w-full items-center justify-between px-3 py-2.5 text-md text-secondary lg:px-4"
                        >
                            {todasParcelas ? "Ver menos opções" : "Visualizar todas opções"}
                            <ChevronDown className={cx("size-5 text-fg-primary transition", todasParcelas && "rotate-180")} />
                        </button>
                    </section>
                )}
            </div>

            <Button size="xl" className="mt-4 w-full" isDisabled={!valido} isLoading={enviando} showTextWhileLoading onClick={finalizar}>
                {enviando ? "Processando pagamento" : "Finalizar pedido"}
            </Button>
        </CheckoutShell>
    );
}
