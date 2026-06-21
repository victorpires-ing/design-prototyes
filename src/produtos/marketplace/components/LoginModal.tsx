import { useEffect, useState } from "react";
import { ArrowLeft } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Logo do evento configurada no marketplace (exibida ao lado da Ingresse). */
    logoEvento?: string;
    /** Cadastro concluído — recebe o nome informado. */
    onSucesso: (nome: string) => void;
}

type Etapa = "telefone" | "email" | "cadastro";
const ORDEM: Etapa[] = ["telefone", "email", "cadastro"];

const PAISES = [
    { code: "BR", nome: "Brasil", flag: "🇧🇷" },
    { code: "PT", nome: "Portugal", flag: "🇵🇹" },
    { code: "US", nome: "Estados Unidos", flag: "🇺🇸" },
    { code: "AR", nome: "Argentina", flag: "🇦🇷" },
    { code: "FR", nome: "França", flag: "🇫🇷" },
    { code: "ES", nome: "Espanha", flag: "🇪🇸" },
    { code: "GB", nome: "Reino Unido", flag: "🇬🇧" },
    { code: "DE", nome: "Alemanha", flag: "🇩🇪" },
];

const IMAGEM_LOGIN = "https://auth.prod.ingresse.com/resources/2ibrw/login/custom/img/hero-dark.png";
const INGRESSE_LOGO = "https://auth.prod.ingresse.com/resources/2ibrw/login/custom/img/ingresse-light.svg";

const maskFone = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (!d) return "";
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};
const maskCPF = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length > 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
    if (d.length > 6) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    if (d.length > 3) return `${d.slice(0, 3)}.${d.slice(3)}`;
    return d;
};

function Marca({ logoEvento }: { logoEvento?: string }) {
    return (
        <div className="flex items-center gap-4">
            <img src={INGRESSE_LOGO} alt="Ingresse" className="h-7 w-auto" />
            {logoEvento && (
                <>
                    <span aria-hidden="true" className="h-6 w-px bg-white/25" />
                    <img src={logoEvento} alt="Logo do evento" className="h-7 w-auto object-contain" />
                </>
            )}
        </div>
    );
}

/** Cadastro Ingresse (tela cheia, tema escuro) — fluxo de teste, sem código. */
export function LoginModal({ isOpen, onClose, logoEvento, onSucesso }: LoginModalProps) {
    const [etapa, setEtapa] = useState<Etapa>("telefone");
    const [fone, setFone] = useState("");
    const [email, setEmail] = useState("");
    const [nome, setNome] = useState("");
    const [pais, setPais] = useState("BR");
    const [cpf, setCpf] = useState("");
    const [nascimento, setNascimento] = useState("");

    useEffect(() => {
        if (!isOpen) return;
        setEtapa("telefone");
        setFone("");
        setEmail("");
        setNome("");
        setPais("BR");
        setCpf("");
        setNascimento("");
    }, [isOpen]);

    if (!isOpen) return null;

    const idx = ORDEM.indexOf(etapa);
    const voltar = () => (idx > 0 ? setEtapa(ORDEM[idx - 1]) : onClose());
    const avancar = () => setEtapa(ORDEM[Math.min(idx + 1, ORDEM.length - 1)]);

    const foneOk = fone.replace(/\D/g, "").length >= 10;
    const emailOk = /.+@.+\..+/.test(email.trim());
    const cadastroOk = nome.trim() !== "";

    const seletorIdioma = (
        <button type="button" className="mx-auto flex items-center gap-1.5 text-sm font-medium text-secondary transition hover:text-primary">
            🇧🇷 Português
            <svg viewBox="0 0 12 8" className="size-2.5" fill="none" aria-hidden="true">
                <path d="M1 1.5 6 6.5l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </button>
    );

    return (
        <div className="dark-mode fixed inset-0 z-50 flex bg-primary text-primary">
            <div className="hidden w-1/2 shrink-0 p-4 lg:block">
                <img src={IMAGEM_LOGIN} alt="" className="h-full w-full rounded-3xl object-cover" />
            </div>

            <div className="relative flex flex-1 flex-col items-center justify-center gap-8 overflow-y-auto p-4">
                <Marca logoEvento={logoEvento} />

                <div className="w-full max-w-[420px] rounded-2xl bg-secondary p-6 ring-1 ring-border-secondary">
                    {etapa === "telefone" && (
                        <div className="flex flex-col gap-5">
                            {seletorIdioma}
                            <h2 className="text-center text-xl font-bold text-primary">Acesse sua conta</h2>
                            <div className="flex items-end gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-sm font-medium text-secondary">País</span>
                                    <div className="flex h-11 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary ring-1 ring-border-primary">
                                        🇧🇷 +55
                                        <svg viewBox="0 0 12 8" className="size-2.5 text-fg-quaternary" fill="none" aria-hidden="true">
                                            <path d="M1 1.5 6 6.5l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                                <label className="flex min-w-0 flex-1 flex-col gap-1.5">
                                    <span className="text-sm font-medium text-secondary">Número de telefone</span>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        placeholder="(00) 90000-0000"
                                        value={fone}
                                        onChange={(e) => setFone(maskFone(e.target.value))}
                                        onKeyDown={(e) => e.key === "Enter" && foneOk && avancar()}
                                        className="h-11 w-full rounded-lg bg-primary px-3.5 text-sm text-primary outline-none ring-1 ring-border-primary transition placeholder:text-placeholder focus:ring-2 focus:ring-brand"
                                    />
                                </label>
                            </div>
                            <Button size="lg" color="primary" className="w-full" isDisabled={!foneOk} onClick={avancar}>
                                Continuar
                            </Button>
                            <button type="button" className="text-center text-sm font-bold text-primary underline">Problemas com o login?</button>
                        </div>
                    )}

                    {etapa === "email" && (
                        <div className="flex flex-col gap-5">
                            {seletorIdioma}
                            <h2 className="text-center text-xl font-bold text-primary">Crie sua conta</h2>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-secondary">Endereço de email</span>
                                <input
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && emailOk && avancar()}
                                    className="h-11 w-full rounded-lg bg-primary px-3.5 text-sm text-primary outline-none ring-1 ring-border-primary transition placeholder:text-placeholder focus:ring-2 focus:ring-brand"
                                />
                            </label>
                            <Button size="lg" color="primary" className="w-full" isDisabled={!emailOk} onClick={avancar}>
                                Continuar
                            </Button>
                            <button type="button" className="text-center text-sm font-bold text-primary underline">Problemas com o cadastro?</button>
                        </div>
                    )}

                    {etapa === "cadastro" && (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={voltar} aria-label="Voltar" className="text-fg-secondary transition hover:text-fg-primary">
                                    <ArrowLeft className="size-5" />
                                </button>
                                <h2 className="flex-1 text-center text-xl font-bold text-primary">Finalize seu cadastro</h2>
                                <span className="size-5" />
                            </div>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-secondary">Nome e sobrenome</span>
                                <input
                                    placeholder="Digite o seu nome e sobrenome"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    className="h-11 w-full rounded-lg bg-primary px-3.5 text-sm text-primary outline-none ring-1 ring-border-primary transition placeholder:text-placeholder focus:ring-2 focus:ring-brand"
                                />
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-secondary">País de nacionalidade</span>
                                <select
                                    value={pais}
                                    onChange={(e) => setPais(e.target.value)}
                                    className="h-11 w-full rounded-lg bg-primary px-3 text-sm font-medium text-primary ring-1 ring-border-primary outline-none transition focus:ring-2 focus:ring-brand"
                                >
                                    {PAISES.map((p) => (
                                        <option key={p.code} value={p.code}>
                                            {p.flag} {p.nome}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            {pais === "BR" && (
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-sm font-medium text-secondary">CPF</span>
                                    <input
                                        inputMode="numeric"
                                        placeholder="000.000.000-00"
                                        value={cpf}
                                        onChange={(e) => setCpf(maskCPF(e.target.value))}
                                        className="h-11 w-full rounded-lg bg-primary px-3.5 text-sm text-primary outline-none ring-1 ring-border-primary transition placeholder:text-placeholder focus:ring-2 focus:ring-brand"
                                    />
                                </label>
                            )}
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-secondary">Data de nascimento</span>
                                <input
                                    type="date"
                                    value={nascimento}
                                    onChange={(e) => setNascimento(e.target.value)}
                                    className="h-11 w-full rounded-lg bg-primary px-3.5 text-sm text-primary outline-none ring-1 ring-border-primary transition focus:ring-2 focus:ring-brand"
                                />
                            </label>
                            <Button size="lg" color="primary" className="w-full" isDisabled={!cadastroOk} onClick={() => onSucesso(nome.trim())}>
                                Continuar
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center gap-2 text-center">
                    <span className="text-sm text-tertiary">Ou continue com:</span>
                    <div className="flex items-center gap-2 text-sm font-bold text-primary">
                        <span>Termos de Serviço</span>
                        <span className="text-tertiary">•</span>
                        <span>Política de Privacidade</span>
                        <span className="text-tertiary">•</span>
                        <span>Ingresse ↗</span>
                    </div>
                    <span className="text-sm text-quaternary">Copyright © 2026 Ingresse</span>
                </div>
            </div>
        </div>
    );
}
