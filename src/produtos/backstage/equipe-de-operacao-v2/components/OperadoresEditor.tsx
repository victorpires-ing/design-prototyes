import { useState } from "react";
import { AlertTriangle, Lock01, Plus, Trash01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { InputBase } from "@/components/base/input/input";
import { InputGroup } from "@/components/base/input/input-group";
import { cx } from "@/utils/cx";
import { ImportarEmailsModal } from "./ImportarEmailsModal";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Estado de cada operador (mock de validação de cadastro). */
function statusEmail(email: string): "ok" | "invalido" | "sem-cadastro" {
    if (!EMAIL_RE.test(email)) return "invalido";
    if (email.toLowerCase().startsWith("novo")) return "sem-cadastro";
    return "ok";
}

const separar = (texto: string) =>
    texto
        .split(/[\s,;]+/)
        .map((s) => s.trim())
        .filter(Boolean);

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
                <Button
                    size="sm"
                    color="secondary"
                    iconLeading={<XlsFileIcon data-icon className="size-5" />}
                    onClick={() => setImportando(true)}
                >
                    Importar e-mails
                </Button>
                {temRemoviveis && (
                    <button
                        type="button"
                        onClick={() => onChange(value.filter((e) => bloqueados.includes(e)))}
                        className="text-sm font-semibold text-brand-secondary transition duration-100 ease-linear hover:text-brand-secondary_hover"
                    >
                        Remover e-mails
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-1.5">
                <InputGroup
                    value={entrada}
                    onChange={setEntrada}
                    aria-label="E-mail do operador"
                    trailingAddon={
                        <Button
                            size="md"
                            color="secondary"
                            iconLeading={Plus}
                            isDisabled={!entrada.trim()}
                            onClick={() => adicionar(entrada)}
                        >
                            Adicionar
                        </Button>
                    }
                >
                    <InputBase
                        placeholder="E-mail do operador"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && entrada.trim()) {
                                e.preventDefault();
                                adicionar(entrada);
                            }
                        }}
                    />
                </InputGroup>
                <p className="text-xs text-tertiary">
                    Cole ou digite os e-mails separados por espaço ou vírgula para adicionar vários e-mails de uma vez.
                </p>
            </div>

            <OperadoresList value={value} onChange={onChange} bloqueados={bloqueados} mostrarConta={mostrarConta} badgeConta={badgeConta} />

            <ImportarEmailsModal
                isOpen={importando}
                onClose={() => setImportando(false)}
                onConfirm={(emails) => {
                    adicionar(emails.join(" "));
                    setImportando(false);
                }}
            />
        </div>
    );
}

/** Lista vertical de operadores (e-mail + status de cadastro + remover). E-mails inválidos vêm primeiro. */
export function OperadoresList({ value, onChange, bloqueados = [], badgeConta = false, mostrarConta = false }: Props) {
    if (value.length === 0) return null;
    // Inválidos no topo (ordenação estável preserva o resto da ordem).
    const ordenado = value
        .map((email, i) => ({ email, i }))
        .sort((a, b) => Number(statusEmail(b.email) === "invalido") - Number(statusEmail(a.email) === "invalido"));

    return (
        <ul className="flex flex-col divide-y divide-border-secondary rounded-lg bg-primary ring-1 ring-border-secondary">
            {ordenado.map(({ email, i }) => {
                const base = statusEmail(email);
                // Status de conta só quando habilitado (não na etapa 2). Teste: 3º operador sempre "sem conta".
                const st = !mostrarConta ? (base === "invalido" ? "invalido" : "ok") : i === 2 && base === "ok" ? "sem-cadastro" : base;
                const travado = bloqueados.includes(email);
                return (
                    <li key={email} className="flex items-center gap-3 px-4 py-3">
                        {travado ? (
                            <Lock01 className="size-4 shrink-0 text-fg-quaternary" aria-label="Operador não pode ser removido" />
                        ) : (
                            <button
                                type="button"
                                onClick={() => onChange(value.filter((e) => e !== email))}
                                aria-label={`Remover ${email}`}
                                className="shrink-0 text-fg-quaternary transition duration-100 ease-linear hover:text-fg-error-secondary"
                            >
                                <Trash01 className="size-4" aria-hidden="true" />
                            </button>
                        )}
                        <div className="flex min-w-0 flex-1 flex-col">
                            <span className={cx("truncate text-sm", st === "invalido" ? "text-error-primary" : "text-primary")}>
                                {email}
                            </span>
                            {!badgeConta && st === "invalido" && (
                                <span className="text-xs font-medium text-error-primary">E-mail inválido</span>
                            )}
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

/** Ícone de planilha (Excel) verde, usado no botão "Importar e-mails". */
const XlsFileIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 40 40" fill="none" {...props}>
        <path
            stroke="currentColor"
            strokeWidth={1.5}
            d="M7.75 4A3.25 3.25 0 0 1 11 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 35 39.25H11A3.25 3.25 0 0 1 7.75 36z"
        />
        <path stroke="currentColor" strokeWidth={1.5} d="M27 .5V8a4 4 0 0 0 4 4h7.5" />
        <rect width={28} height={16} x={1} y={18} fill="#079455" rx={2} />
        <path
            fill="#fff"
            d="M11.273 25.273H9.717a1.5 1.5 0 0 0-.174-.536 1.4 1.4 0 0 0-.337-.405 1.5 1.5 0 0 0-.476-.255 1.8 1.8 0 0 0-.579-.09q-.564 0-.983.282-.42.276-.65.81-.231.528-.231 1.285 0 .777.23 1.306.236.53.654.8.42.27.97.27.309 0 .571-.082.267-.082.473-.238a1.4 1.4 0 0 0 .34-.387q.14-.228.192-.519l1.556.007q-.06.501-.302.966a2.9 2.9 0 0 1-.643.828 3 3 0 0 1-.959.575q-.554.21-1.253.21-.973 0-1.74-.44a3.13 3.13 0 0 1-1.208-1.276q-.44-.834-.44-2.02 0-1.19.447-2.024.448-.835 1.215-1.272a3.4 3.4 0 0 1 1.726-.44q.632 0 1.172.177.543.179.962.519.42.337.682.827.265.49.34 1.122m5.048-.454a.9.9 0 0 0-.366-.668q-.324-.238-.877-.238-.377 0-.636.107a.9.9 0 0 0-.398.288.7.7 0 0 0-.135.419.6.6 0 0 0 .082.34.85.85 0 0 0 .252.253q.16.103.37.18.21.075.447.129l.653.156q.477.106.874.284.398.177.689.437.291.259.45.61.164.353.168.807-.004.667-.341 1.157-.335.487-.966.757-.63.266-1.516.266-.882 0-1.534-.27a2.25 2.25 0 0 1-1.016-.799q-.362-.533-.38-1.317h1.488q.024.366.21.61.188.242.5.366.316.12.714.12.39 0 .678-.113a1.04 1.04 0 0 0 .451-.316.73.73 0 0 0 .16-.465q0-.244-.146-.412a1.1 1.1 0 0 0-.419-.284 4 4 0 0 0-.67-.213l-.793-.199q-.92-.224-1.452-.7-.533-.475-.53-1.282-.003-.66.352-1.154.36-.493.984-.77.625-.277 1.42-.277.81 0 1.414.277.608.276.944.77.338.494.348 1.144zm3.92-2.092L22 28.253h.067l1.762-5.526h1.704L23.026 30h-1.982l-2.51-7.273z"
        />
    </svg>
);
