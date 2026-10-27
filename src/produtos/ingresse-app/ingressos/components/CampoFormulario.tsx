import { useId, useRef } from "react";
import { Paperclip, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { TextArea } from "@/components/base/textarea/textarea";
import { Toggle } from "@/components/base/toggle/toggle";
import { cx } from "@/utils/cx";
import type { OpcaoResposta, Resposta } from "../data/eventos";
import { juntarValores, valoresDe } from "../data/formulario-store";

/** Texto de apoio do estoque da opção.
 *  Só marca o que não dá mais para escolher: a contagem é ruído para quem responde,
 *  muda sozinha enquanto a tela está aberta e vira promessa que o sistema não faz. */
export const textoEstoque = (opcao: OpcaoResposta): string | undefined =>
    typeof opcao.estoque === "number" && opcao.estoque <= 0 ? "Esgotado" : undefined;

/** Esgotada e não é o que a pessoa já tinha escolhido: não dá para selecionar. */
const indisponivel = (opcao: OpcaoResposta, originais: string[]) =>
    typeof opcao.estoque === "number" && opcao.estoque <= 0 && !originais.includes(opcao.valor);

/** True quando a resposta ainda não foi preenchida. */
export const respostaVazia = (pergunta: Resposta, valor: string) => {
    if (pergunta.obrigatoria === false) return false;
    // O toggle sempre tem um estado: desligado já significa "Não".
    if (pergunta.tipo === "sim-nao") return false;
    return valor.trim() === "";
};

const SIM = "Sim";
const NAO = "Não";

/** Valor inicial de uma pergunta ainda não respondida (o toggle já nasce em "Não"). */
export const valorPadrao = (pergunta: Resposta) => (pergunta.tipo === "sim-nao" ? NAO : "");

/** Resposta pronta para leitura: data em pt-BR e múltipla separada por vírgula. */
export const formatarResposta = (pergunta: Resposta, valor: string): string => {
    if (!valor) return "";
    if (pergunta.tipo === "multipla") return valoresDe(valor).join(", ");
    if (pergunta.tipo === "data") {
        const [ano, mes, dia] = valor.split("-");
        return dia && mes && ano ? `${dia}/${mes}/${ano}` : valor;
    }
    return valor;
};

interface CampoFormularioProps {
    pergunta: Resposta;
    valor: string;
    onChange: (valor: string) => void;
    /** Resposta salva na inscrição: a opção dela continua disponível mesmo esgotada. */
    valorOriginal?: string;
    /** Marca o campo como pendente (obrigatório sem resposta). */
    isInvalid?: boolean;
}

/** Renderiza uma pergunta do formulário conforme o tipo, respeitando o estoque das opções. */
export function CampoFormulario({ pergunta, valor, onChange, valorOriginal, isInvalid = false }: CampoFormularioProps) {
    const fileRef = useRef<HTMLInputElement>(null);
    const idRotulo = useId();
    const originais = valoresDe(valorOriginal ?? "");
    const obrigatoria = pergunta.obrigatoria !== false;
    const opcoes = pergunta.opcoes ?? [];
    const temEstoque = opcoes.some((o) => typeof o.estoque === "number");
    const dicaEstoque = temEstoque ? "Opções esgotadas ficam indisponíveis." : undefined;
    const pendente = isInvalid ? "Responda esta pergunta para continuar." : undefined;
    const ajuda = [pendente, pergunta.ajuda, dicaEstoque].filter(Boolean).join(" ") || undefined;

    switch (pergunta.tipo) {
        case "selecao":
            return (
                <Select
                    label={pergunta.pergunta}
                    placeholder="Selecione"
                    isRequired={obrigatoria}
                    isInvalid={isInvalid}
                    selectedKey={valor || null}
                    onSelectionChange={(key) => onChange(key === null ? "" : String(key))}
                    hint={ajuda}
                    items={opcoes.map((o) => ({
                        id: o.valor,
                        label: o.valor,
                        supportingText: textoEstoque(o),
                        isDisabled: indisponivel(o, originais),
                    }))}
                >
                    {(opcao) => (
                        <Select.Item id={opcao.id} isDisabled={opcao.isDisabled} supportingText={opcao.supportingText}>
                            {opcao.label}
                        </Select.Item>
                    )}
                </Select>
            );

        case "multipla": {
            const marcados = valoresDe(valor);
            const alternar = (opcao: string) =>
                onChange(juntarValores(marcados.includes(opcao) ? marcados.filter((v) => v !== opcao) : [...marcados, opcao]));
            return (
                <fieldset aria-invalid={isInvalid || undefined}>
                    <legend className="text-sm font-medium text-secondary">
                        {pergunta.pergunta}
                        {obrigatoria && <span className="text-brand-tertiary"> *</span>}
                    </legend>
                    <div className="mt-2 flex flex-col gap-3">
                        {opcoes.map((o) => {
                            const bloqueada = indisponivel(o, originais);
                            const apoio = textoEstoque(o);
                            return (
                                <Checkbox
                                    key={o.valor}
                                    size="md"
                                    isSelected={marcados.includes(o.valor)}
                                    isDisabled={bloqueada}
                                    onChange={() => alternar(o.valor)}
                                    label={
                                        <span className="flex flex-wrap items-baseline gap-x-2">
                                            <span>{o.valor}</span>
                                            {apoio && <span className={cx("text-sm", bloqueada ? "text-tertiary" : "text-brand-secondary")}>{apoio}</span>}
                                        </span>
                                    }
                                />
                            );
                        })}
                    </div>
                    {ajuda && <p className={cx("mt-2 text-sm", isInvalid ? "text-error-primary" : "text-tertiary")}>{ajuda}</p>}
                </fieldset>
            );
        }

        case "sim-nao":
            return (
                <Toggle
                    size="md"
                    /* O Toggle do DS é w-max: sem isto, rótulo longo vaza a moldura do celular. */
                    className="w-full"
                    label={pergunta.pergunta}
                    hint={pergunta.ajuda}
                    isSelected={valor === SIM}
                    onChange={(ligado) => onChange(ligado ? SIM : NAO)}
                />
            );

        case "texto-longo": {
            const limite = pergunta.limiteCaracteres;
            return (
                <div>
                    <TextArea
                        label={pergunta.pergunta}
                        placeholder="Sua resposta"
                        isRequired={obrigatoria}
                        isInvalid={isInvalid}
                        rows={4}
                        value={valor}
                        maxLength={limite}
                        onChange={onChange}
                        isInvalid={isInvalid}
                        hint={ajuda}
                    />
                    {limite && (
                        <p className="mt-1.5 text-right text-sm text-tertiary">
                            {valor.length}/{limite}
                        </p>
                    )}
                </div>
            );
        }

        case "anexo":
            return (
                <div>
                    <p id={idRotulo} className="text-sm font-medium text-secondary">
                        {pergunta.pergunta}
                        {obrigatoria && <span className="text-brand-tertiary"> *</span>}
                    </p>
                    <div className="mt-2 flex items-center gap-3 rounded-xl bg-primary p-3 ring-1 ring-border-secondary">
                        <Paperclip className="size-5 shrink-0 text-fg-quaternary" />
                        <span className={cx("min-w-0 flex-1 truncate text-sm", valor ? "font-semibold text-primary" : "text-tertiary")}>
                            {valor || "Nenhum arquivo enviado"}
                        </span>
                        {valor && (
                            <button
                                type="button"
                                aria-label={`Remover o arquivo de "${pergunta.pergunta}"`}
                                onClick={() => onChange("")}
                                className="shrink-0 text-fg-quaternary transition duration-100 ease-linear active:text-fg-secondary"
                            >
                                <Trash01 className="size-5" />
                            </button>
                        )}
                    </div>
                    <input
                        ref={fileRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                            const arquivo = e.target.files?.[0];
                            if (arquivo) onChange(arquivo.name);
                            e.target.value = "";
                        }}
                    />
                    <Button size="sm" color="secondary" className="mt-2" aria-labelledby={idRotulo} onClick={() => fileRef.current?.click()}>
                        {valor ? "Trocar arquivo" : "Enviar arquivo"}
                    </Button>
                    {[pendente, pergunta.ajuda, pergunta.formatosAceitos].filter(Boolean).map((texto) => (
                        <p key={texto} className={cx("mt-1.5 text-sm", isInvalid && texto === pendente ? "text-error-primary" : "text-tertiary")}>
                            {texto}
                        </p>
                    ))}
                </div>
            );

        case "data":
            return (
                <Input
                    type="date"
                    label={pergunta.pergunta}
                    isRequired={obrigatoria}
                    isInvalid={isInvalid}
                    value={valor}
                    onChange={onChange}
                    hint={ajuda}
                />
            );

        case "numero":
            return (
                <Input
                    inputMode="numeric"
                    label={pergunta.pergunta}
                    placeholder="0"
                    isRequired={obrigatoria}
                    isInvalid={isInvalid}
                    value={valor}
                    onChange={(v) => onChange(v.replace(/\D/g, ""))}
                    hint={ajuda}
                />
            );

        case "telefone":
            return (
                <Input
                    type="tel"
                    inputMode="tel"
                    label={pergunta.pergunta}
                    placeholder="(00) 00000-0000"
                    isRequired={obrigatoria}
                    isInvalid={isInvalid}
                    value={valor}
                    onChange={(v) => onChange(mascararTelefone(v))}
                    hint={ajuda}
                />
            );

        default:
            return (
                <Input
                    label={pergunta.pergunta}
                    placeholder="Sua resposta"
                    isRequired={obrigatoria}
                    isInvalid={isInvalid}
                    value={valor}
                    onChange={onChange}
                    hint={ajuda}
                />
            );
    }
}

/** (11) 99999-0000 — formatação enquanto digita, sem biblioteca. */
export function mascararTelefone(valor: string): string {
    const d = valor.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
