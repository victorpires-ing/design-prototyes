import { useState } from "react";
import { AlertTriangle, InfoCircle, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Avatar } from "@/components/base/avatar/avatar";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { buscarComprador, type Comprador } from "../data/bilheteria-data";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CPF_RE = /^[\d.\-]{11,14}$/;

type Estado = "idle" | "loading" | "found" | "none";

interface Props {
    comprador: Comprador | null;
    onComprador: (c: Comprador | null) => void;
}

export function CompradorStep({ comprador, onComprador }: Props) {
    const [termo, setTermo] = useState(comprador?.emailExibicao ?? "");
    const [estado, setEstado] = useState<Estado>(comprador ? "found" : "idle");
    const [erro, setErro] = useState<string | undefined>();

    const buscar = () => {
        const t = termo.trim();
        if (!EMAIL_RE.test(t) && !CPF_RE.test(t)) {
            setErro("E-mail inválido");
            setEstado("idle");
            onComprador(null);
            return;
        }
        setErro(undefined);
        setEstado("loading");
        onComprador(null);
        setTimeout(() => {
            const c = buscarComprador(t);
            setEstado(c ? "found" : "none");
            onComprador(c);
        }, 900);
    };

    return (
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4">
            <div className="flex flex-col gap-4 rounded-2xl bg-primary_alt p-5">
                <span className="text-sm font-semibold text-primary">Quem está comprando?</span>
                <div className="flex flex-col gap-1.5">
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="flex-1">
                            <Input
                                placeholder="Digite o CPF ou e-mail do comprador"
                                value={termo}
                                onChange={(v) => { setTermo(v); if (erro) setErro(undefined); }}
                                isInvalid={!!erro}
                                aria-label="CPF ou e-mail do comprador"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && termo.trim()) {
                                        e.preventDefault();
                                        buscar();
                                    }
                                }}
                            />
                        </div>
                        <Button size="md" color="secondary" className="w-full sm:w-auto" isDisabled={!termo.trim() || estado === "loading"} isLoading={estado === "loading"} onClick={buscar}>
                            Encontrar
                        </Button>
                    </div>
                    {erro ? (
                        <p className="text-xs font-medium text-error-primary">{erro}</p>
                    ) : (
                        <p className="text-xs text-tertiary">Busque compradores brasileiros por CPF e estrangeiros por e-mail.</p>
                    )}
                </div>
            </div>

            {estado === "found" && comprador && (
                <div className="flex flex-col gap-4 rounded-2xl bg-primary_alt p-5">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-primary">Conta encontrada</span>
                        <span className="text-sm text-tertiary">Confira o nome e o e-mail antes de continuar.</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Avatar size="md" initials={comprador.iniciais} alt={comprador.nome} />
                        <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-semibold text-primary">{comprador.nome}</span>
                            <span className="truncate text-sm text-tertiary">{comprador.emailExibicao}</span>
                            <span className="truncate text-xs text-tertiary">CPF {comprador.cpf}</span>
                        </div>
                    </div>
                </div>
            )}

            {estado === "none" && (
                <div className="flex items-start gap-3 rounded-2xl bg-primary_alt p-4">
                    <InfoCircle className="mt-0.5 size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                    <div className="flex min-w-0 flex-1 flex-col">
                        <span className="text-sm font-semibold text-primary">Nenhuma conta encontrada</span>
                        <span className="text-sm text-tertiary">Verifique o e-mail informado.</span>
                    </div>
                    <button type="button" onClick={() => setEstado("idle")} aria-label="Fechar" className="shrink-0 text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary">
                        <XClose className="size-5" aria-hidden="true" />
                    </button>
                </div>
            )}

            {!comprador && (
                <div className="flex items-start gap-3 rounded-2xl bg-warning-primary p-4">
                    <FeaturedIcon icon={AlertTriangle} color="warning" theme="modern" size="sm" />
                    <div className="flex min-w-0 flex-1 flex-col">
                        <span className="text-sm font-semibold text-primary">Venda sem identificação</span>
                        <span className="text-sm text-tertiary">Você pode avançar sem identificar o comprador — ingresso e nota são gerados normalmente. Só ingressos com facial não ficam disponíveis.</span>
                    </div>
                </div>
            )}
        </div>
    );
}
