import { useState, type KeyboardEvent } from "react";
import { Edit01 } from "@untitledui/icons";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { formatarCodigo } from "../data/equipe";

/**
 * Código de link e cupom de uma pessoa do grupo-comissário (ECO-27). O do responsável é o do grupo e
 * muda no canal Comissário; o de cada vendedor muda aqui, no lugar: Enter salva, Esc cancela.
 * `validar` devolve a mensagem de erro, ou nada quando o código pode ser usado.
 */
export function CodigoVendedor({ codigo, editavel, validar, onSalvar }: { codigo?: string; editavel: boolean; validar: (c: string) => string | undefined; onSalvar: (c: string) => void }) {
    const [editando, setEditando] = useState(false);
    const [valor, setValor] = useState(codigo ?? "");
    const [erro, setErro] = useState<string>();

    if (!codigo) return null;
    if (!editando)
        return (
            <span className="flex shrink-0 items-center gap-1">
                <span className="text-sm text-tertiary">
                    Código <span className="font-medium text-secondary">{codigo}</span>
                </span>
                {editavel && (
                    <ButtonUtility
                        size="sm"
                        color="tertiary"
                        icon={Edit01}
                        tooltip="Editar código"
                        aria-label={`Editar o código ${codigo}`}
                        onClick={() => {
                            setValor(codigo);
                            setErro(undefined);
                            setEditando(true);
                        }}
                    />
                )}
            </span>
        );

    const salvar = () => {
        if (valor === codigo) return setEditando(false);
        const e = validar(valor);
        if (e) return setErro(e);
        onSalvar(valor);
        setEditando(false);
    };
    const teclas = (e: KeyboardEvent) => {
        if (e.key === "Enter") salvar();
        if (e.key === "Escape") setEditando(false);
    };

    return (
        <span className="flex w-52 shrink-0 flex-col gap-1">
            <Input size="sm" aria-label="Código do vendedor" value={valor} onChange={(v) => setValor(formatarCodigo(v))} onKeyDown={teclas} onBlur={salvar} isInvalid={!!erro} hint={erro} autoFocus />
        </span>
    );
}
