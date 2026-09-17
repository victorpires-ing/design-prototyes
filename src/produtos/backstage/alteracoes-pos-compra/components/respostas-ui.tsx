import { useRef, useState } from "react";
import { Download01, File02, Paperclip } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Select } from "@/components/base/select/select";
import { TextArea } from "@/components/base/textarea/textarea";
import { cx } from "@/utils/cx";
import type { Pergunta } from "../data/pos-compra-store";
import { FOCO } from "./pos-compra-ui";

/* ------------------------------------------------------------------ */
/*  Leitura                                                            */
/* ------------------------------------------------------------------ */

/** Texto livre pode ser longo: mostra duas linhas e revela o resto sob demanda. */
const RespostaTexto = ({ valor }: { valor: string }) => {
    const [aberto, setAberto] = useState(false);
    const longo = valor.length > 120;

    return (
        <div className="flex min-w-0 flex-col items-start gap-1">
            <p className={cx("text-sm text-primary", !aberto && longo && "line-clamp-2")}>{valor}</p>
            {longo && (
                <button
                    type="button"
                    onClick={() => setAberto((atual) => !atual)}
                    className={cx(
                        "rounded-md text-sm font-semibold text-brand-secondary transition duration-100 ease-linear hover:text-brand-secondary_hover",
                        FOCO,
                    )}
                >
                    {aberto ? "Recolher texto" : "Ver texto completo"}
                </button>
            )}
        </div>
    );
};

const RespostaAnexo = ({ valor }: { valor: string }) => (
    <div className="flex min-w-0 items-center gap-2 rounded-lg bg-secondary px-3 py-2">
        <File02 className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-primary">{valor}</span>
        <Button size="sm" color="secondary" iconLeading={Download01} className="shrink-0">
            Baixar
        </Button>
    </div>
);

/** Uma linha da lista de respostas, com o formato certo para cada tipo de pergunta. */
export const RespostaLinha = ({ pergunta, valor }: { pergunta?: Pergunta; valor: string }) => {
    const tipo = pergunta?.tipo ?? "opcao";

    if (tipo === "opcao") {
        return (
            <div className="flex items-baseline justify-between gap-4 py-3">
                <span className="text-sm text-tertiary">{pergunta?.label}</span>
                <span className="text-sm font-medium text-primary">{valor}</span>
            </div>
        );
    }

    /* Texto e anexo ocupam a largura toda: encaixá-los à direita quebraria a leitura. */
    return (
        <div className="flex flex-col gap-1.5 py-3">
            <span className="text-sm text-tertiary">{pergunta?.label}</span>
            {tipo === "texto" ? <RespostaTexto valor={valor} /> : <RespostaAnexo valor={valor} />}
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Edição                                                             */
/* ------------------------------------------------------------------ */

interface EditorProps {
    pergunta: Pergunta;
    valor: string;
    valorOriginal: string;
    onChange: (valor: string) => void;
}

/** Campo de edição de uma resposta, respeitando o tipo da pergunta. */
export const EditorResposta = ({ pergunta, valor, valorOriginal, onChange }: EditorProps) => {
    const inputArquivo = useRef<HTMLInputElement>(null);

    if (pergunta.tipo === "texto") {
        const limite = pergunta.limiteCaracteres ?? 600;
        return (
            <div className="flex flex-col gap-1">
                <TextArea
                    label={pergunta.label}
                    value={valor}
                    onChange={(texto) => onChange(texto.slice(0, limite))}
                    rows={4}
                    hint={pergunta.ajuda}
                />
                <p className="self-end text-sm text-tertiary tabular-nums">
                    {valor.length} de {limite} caracteres
                </p>
            </div>
        );
    }

    if (pergunta.tipo === "anexo") {
        return (
            <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-secondary">{pergunta.label}</p>
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-secondary px-3 py-2">
                    <Paperclip className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-primary">{valor || "Sem arquivo enviado"}</span>
                    <Button size="sm" color="secondary" onClick={() => inputArquivo.current?.click()}>
                        {valor ? "Substituir arquivo" : "Enviar arquivo"}
                    </Button>
                    {valor !== valorOriginal && (
                        <Button size="sm" color="link-gray" onClick={() => onChange(valorOriginal)}>
                            Desfazer
                        </Button>
                    )}
                </div>
                <input
                    ref={inputArquivo}
                    type="file"
                    hidden
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(evento) => {
                        const arquivo = evento.target.files?.[0];
                        if (arquivo) onChange(arquivo.name);
                        evento.target.value = "";
                    }}
                />
                <p className="text-sm text-tertiary">{pergunta.formatosAceitos}</p>
            </div>
        );
    }

    return (
        <Select
            label={pergunta.label}
            selectedKey={valor || null}
            onSelectionChange={(key) => onChange(String(key))}
            hint={
                pergunta.opcoes.some((o) => typeof o.estoque === "number")
                    ? "Opções esgotadas ficam indisponíveis porque essa pergunta controla estoque."
                    : undefined
            }
            items={pergunta.opcoes.map((o) => ({
                id: o.valor,
                label: o.valor,
                supportingText: typeof o.estoque === "number" ? (o.estoque > 0 ? `${o.estoque} disponíveis` : "Esgotado") : undefined,
                isDisabled: typeof o.estoque === "number" && o.estoque <= 0 && valorOriginal !== o.valor,
            }))}
        >
            {(opcao) => (
                <Select.Item id={opcao.id} isDisabled={opcao.isDisabled} supportingText={opcao.supportingText}>
                    {opcao.label}
                </Select.Item>
            )}
        </Select>
    );
};

/** Antes e depois de uma resposta, empilhado quando o valor é longo. */
export const ComparativoResposta = ({ pergunta, de, para }: { pergunta?: Pergunta; de: string; para: string }) => {
    const mudou = de !== para;
    const empilhado = (pergunta?.tipo ?? "opcao") !== "opcao";

    return (
        <div className="flex flex-col gap-1 py-2">
            <p className="text-sm text-tertiary">{pergunta?.label}</p>
            <div className={cx("flex gap-2", empilhado ? "flex-col" : "flex-wrap items-center")}>
                <span className={cx("text-sm", mudou ? "text-tertiary line-through" : "font-medium text-primary")}>{de || "Sem resposta"}</span>
                {mudou && (
                    <>
                        <span className="text-sm text-fg-quaternary" aria-hidden="true">
                            {empilhado ? "passa a ser" : "→"}
                        </span>
                        <span className="text-sm font-semibold text-brand-secondary">{para || "Sem resposta"}</span>
                    </>
                )}
            </div>
        </div>
    );
};
