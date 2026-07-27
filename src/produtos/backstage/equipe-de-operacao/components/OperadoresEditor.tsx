import { useState } from "react";
import { AlertTriangle, Lock01, Mail01, Trash01, UploadCloud02, XClose } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Estado de cada operador (mock de validação de cadastro). */
function statusEmail(email: string): "ok" | "invalido" | "sem-cadastro" {
    if (!EMAIL_RE.test(email)) return "invalido";
    if (email.toLowerCase().startsWith("novo")) return "sem-cadastro";
    return "ok";
}

const separar = (texto: string) => texto.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);

interface Props {
    value: string[];
    onChange: (emails: string[]) => void;
    /** E-mails que não podem ser removidos (operadores já adicionados, na edição). */
    bloqueados?: string[];
    /** Verifica o cadastro na Ingresse. Só a EDIÇÃO de operadores usa (grupo já criado). */
    mostrarConta?: boolean;
    /** Mostra o status como badge na extremidade direita. */
    badgeConta?: boolean;
}

export function OperadoresEditor({ value, onChange, bloqueados = [], mostrarConta = false, badgeConta = false }: Props) {
    const [entrada, setEntrada] = useState("");
    const [importando, setImportando] = useState(false);

    const adicionar = (texto: string) => {
        const novos = separar(texto).filter((e) => !value.includes(e));
        if (novos.length) onChange([...value, ...novos]);
        setEntrada("");
    };

    const temRemoviveis = value.some((e) => !bloqueados.includes(e));

    return (
        <div className="flex flex-col gap-4 rounded-xl bg-secondary p-4">
            <div className="flex items-center justify-between gap-3">
                <Button size="sm" color="secondary" iconLeading={UploadCloud02} onClick={() => setImportando(true)}>
                    Importar e-mails
                </Button>
                {temRemoviveis && (
                    <button type="button" onClick={() => onChange(value.filter((e) => bloqueados.includes(e)))} className="text-sm font-semibold text-brand-secondary transition duration-100 ease-linear hover:text-brand-secondary_hover">
                        Remover e-mails
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-1.5">
                <div className="flex items-start gap-2">
                    <div className="flex-1">
                        <Input
                            icon={Mail01}
                            placeholder="E-mail do operador"
                            value={entrada}
                            onChange={setEntrada}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && entrada.trim()) {
                                    e.preventDefault();
                                    adicionar(entrada);
                                }
                            }}
                            aria-label="E-mail do operador"
                        />
                    </div>
                    <Button size="md" color="primary" isDisabled={!entrada.trim()} onClick={() => adicionar(entrada)}>
                        Adicionar
                    </Button>
                </div>
                <p className="text-xs text-tertiary">Cole ou digite os e-mails separados por espaço ou vírgula. Cada operador pode fazer parte de apenas um grupo.</p>
            </div>

            <OperadoresList value={value} onChange={onChange} bloqueados={bloqueados} mostrarConta={mostrarConta} badgeConta={badgeConta} />

            {importando && <ImportModal onClose={() => setImportando(false)} onConfirm={(t) => { adicionar(t); setImportando(false); }} />}
        </div>
    );
}

/** Lista vertical de operadores (e-mail + status de cadastro + remover). Reutilizada na edição/revisão. */
export function OperadoresList({ value, onChange, bloqueados = [], badgeConta = false, mostrarConta = false }: Props) {
    if (value.length === 0) return null;
    return (
        <ul className="flex flex-col divide-y divide-border-secondary rounded-lg bg-primary ring-1 ring-border-secondary">
            {value.map((email, i) => {
                const base = statusEmail(email);
                // Status de conta só quando habilitado (não na edição). Teste: 3º operador sempre "sem conta".
                const st = !mostrarConta ? (base === "invalido" ? "invalido" : "ok") : i === 2 && base === "ok" ? "sem-cadastro" : base;
                const travado = bloqueados.includes(email);
                return (
                    <li key={email} className="flex items-center gap-3 px-4 py-3">
                        {travado ? (
                            <Lock01 className="size-4 shrink-0 text-fg-quaternary" aria-label="Operador não pode ser removido" />
                        ) : (
                            <button type="button" onClick={() => onChange(value.filter((e) => e !== email))} aria-label={`Remover ${email}`} className="shrink-0 text-fg-quaternary transition duration-100 ease-linear hover:text-fg-error-secondary">
                                <Trash01 className="size-4" aria-hidden="true" />
                            </button>
                        )}
                        <div className="flex min-w-0 flex-1 flex-col">
                            <span className={cx("truncate text-sm", st === "invalido" ? "text-error-primary" : "text-primary")}>{email}</span>
                            {!badgeConta && st === "invalido" && <span className="text-xs font-medium text-error-primary">E-mail inválido</span>}
                            {!badgeConta && st === "sem-cadastro" && (
                                <span className="flex items-center gap-1 text-xs font-medium text-warning-primary">
                                    <AlertTriangle className="size-3" aria-hidden="true" /> Usuário sem conta na Ingresse — será convidado
                                </span>
                            )}
                        </div>
                        {badgeConta && st !== "ok" && (
                            <Badge size="sm" type="pill-color" color={st === "invalido" ? "error" : "warning"} className="shrink-0">
                                {st === "invalido" ? "E-mail inválido" : "Sem cadastro Ingresse"}
                            </Badge>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

function ImportModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (texto: string) => void }) {
    const [texto, setTexto] = useState("");
    const total = separar(texto).length;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4" onClick={onClose}>
            <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-lg font-semibold text-primary">Importar e-mails</h3>
                        <p className="text-sm text-tertiary">Cole a lista de e-mails, separados por espaço, vírgula ou quebra de linha.</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Fechar" className="shrink-0 text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary">
                        <XClose className="size-5" aria-hidden="true" />
                    </button>
                </div>
                <textarea
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    rows={6}
                    placeholder="joao@empresa.com, maria@empresa.com…"
                    className="w-full resize-none rounded-lg bg-primary px-3.5 py-2.5 text-sm text-primary shadow-xs ring-1 ring-border-primary outline-none transition duration-100 ease-linear placeholder:text-placeholder focus:ring-2 focus:ring-brand"
                />
                <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-tertiary">{total} e-mail{total === 1 ? "" : "s"} detectado{total === 1 ? "" : "s"}</span>
                    <div className="flex gap-3">
                        <Button size="md" color="secondary" onClick={onClose}>Cancelar</Button>
                        <Button size="md" color="primary" isDisabled={!total} onClick={() => onConfirm(texto)}>Importar</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
