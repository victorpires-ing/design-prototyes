import { useEffect, useState } from "react";
import { InputBase } from "@/components/base/input/input";
import { InputGroup, InputPrefix } from "@/components/base/input/input-group";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { Toggle } from "@/components/base/toggle/toggle";
import { Surgir } from "@/components/foundations/transicao";
import { CampoPreco } from "../../itens/components/comuns";
import type { Condicoes, TipoComissao } from "../data/comissarios";

/* ------------------------------------------------------------------ */
/*  Editor de condições: como o comissário ganha (%, valor fixo ou     */
/*  valor a mais no ingresso) e o desconto de quem compra pelo código. */
/*  O mesmo no cadastro da organização e no evento (UI-DS-003).        */
/* ------------------------------------------------------------------ */

const paraNumero = (t: string) => (t ? Number(t.replace(",", ".")) || 0 : 0);
const paraTexto = (v: number | null | undefined) => (v ? String(v).replace(".", ",") : "");

/** Campo de porcentagem com sufixo "%". Aceita vírgula, até 2 casas. */
export function CampoPercentual({
    label,
    valor,
    onChange,
    hint,
    isInvalid,
    isRequired,
}: {
    label: string;
    valor: number | null;
    onChange: (v: number) => void;
    hint?: string;
    isInvalid?: boolean;
    isRequired?: boolean;
}) {
    const [texto, setTexto] = useState(paraTexto(valor));
    useEffect(() => {
        if (paraNumero(texto) !== (valor ?? 0)) setTexto(paraTexto(valor));
    }, [valor]);
    return (
        <InputGroup
            label={label}
            hint={hint}
            isInvalid={isInvalid}
            isRequired={isRequired}
            value={texto}
            onChange={(v: string) => {
                const limpo = v.replace(/[^\d,]/g, "").replace(/(,\d{0,2}).*/, "$1");
                setTexto(limpo);
                onChange(paraNumero(limpo));
            }}
            trailingAddon={<InputPrefix position="trailing">%</InputPrefix>}
        >
            <InputBase inputMode="decimal" placeholder="0" />
        </InputGroup>
    );
}

export interface ErrosDasCondicoes {
    comissao?: string;
    desconto?: string;
}

export function validarCondicoes(c: Condicoes): ErrosDasCondicoes {
    const e: ErrosDasCondicoes = {};
    if (!(c.comissao > 0)) e.comissao = c.tipo === "percentual" ? "Informe uma porcentagem maior que zero." : "Informe um valor maior que zero.";
    else if (c.tipo === "percentual" && c.comissao > 100) e.comissao = "Use até 100%.";
    if (c.desconto !== null && !(c.desconto > 0)) e.desconto = "Informe o desconto ou desligue a opção.";
    else if (c.desconto !== null && c.desconto >= 100) e.desconto = "Use menos de 100%. Para dar o ingresso, use cortesia.";
    return e;
}

export function EditorDeCondicoes({ valor, onChange, erros, mostrarErros }: { valor: Condicoes; onChange: (c: Condicoes) => void; erros: ErrosDasCondicoes; mostrarErros: boolean }) {
    // Com valor a mais, o ingresso já sai mais caro: não há desconto (COM-16).
    const mudarTipo = (tipo: TipoComissao) => onChange({ ...valor, tipo, comissao: 0, desconto: tipo === "acrescimo" ? null : valor.desconto });
    return (
        <div className="flex flex-col gap-5">
            <RadioGroup aria-label="Como a comissão é calculada" value={valor.tipo} onChange={(v) => mudarTipo(v as TipoComissao)} className="gap-3">
                <RadioButton value="percentual" label="Porcentagem do ingresso" hint="Sobre o valor do ingresso, já com o desconto. Não inclui a taxa de serviço." />
                <RadioButton value="fixo" label="Valor fixo por ingresso" hint="O mesmo valor por ingresso vendido, qualquer que seja o preço." />
                <RadioButton value="acrescimo" label="Valor a mais no ingresso" hint="Quem compra com o código paga o preço do ingresso mais este valor, e a diferença fica com o comissário." />
            </RadioGroup>
            <div className="grid gap-4 md:grid-cols-2">
                {valor.tipo === "percentual" ? (
                    <CampoPercentual label="Comissão" isRequired valor={valor.comissao} onChange={(comissao) => onChange({ ...valor, comissao })} isInvalid={mostrarErros && !!erros.comissao} hint={mostrarErros ? erros.comissao : undefined} />
                ) : valor.tipo === "acrescimo" ? (
                    <CampoPreco
                        label="Valor a mais por ingresso"
                        isRequired
                        valor={valor.comissao}
                        onChange={(comissao) => onChange({ ...valor, comissao })}
                        isInvalid={mostrarErros && !!erros.comissao}
                        hint={mostrarErros && erros.comissao ? erros.comissao : "Ex.: ingresso de R$ 100,00 com R$ 20,00 a mais sai por R$ 120,00."}
                    />
                ) : (
                    <CampoPreco label="Comissão por ingresso" isRequired valor={valor.comissao} onChange={(comissao) => onChange({ ...valor, comissao })} isInvalid={mostrarErros && !!erros.comissao} hint={mostrarErros ? erros.comissao : undefined} />
                )}
            </div>
            {valor.tipo !== "acrescimo" && (
                <div className="flex flex-col gap-4 border-t border-secondary pt-5">
                    <Toggle
                        className="w-full"
                        label="Desconto para quem compra com o código"
                        hint="Vale no link e no cupom do comissário, nos ingressos que ele pode vender."
                        isSelected={valor.desconto !== null}
                        onChange={(ligado) => onChange({ ...valor, desconto: ligado ? 10 : null })}
                    />
                    <Surgir visivel={valor.desconto !== null}>
                        <div className="grid gap-4 md:grid-cols-2">
                            <CampoPercentual label="Desconto" isRequired valor={valor.desconto} onChange={(desconto) => onChange({ ...valor, desconto })} isInvalid={mostrarErros && !!erros.desconto} hint={mostrarErros ? erros.desconto : undefined} />
                        </div>
                    </Surgir>
                </div>
            )}
        </div>
    );
}
