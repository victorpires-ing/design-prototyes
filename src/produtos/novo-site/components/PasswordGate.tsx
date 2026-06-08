import { useState, type ReactNode } from "react";
import { Lock01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";

const STORAGE_KEY = "novo-site-auth";
const SENHA = "novo_site_2026";

/** Gate de senha que protege todas as rotas do produto novo-site. */
export function PasswordGate({ children }: { children: ReactNode }) {
    const [authed, setAuthed] = useState(() => sessionStorage.getItem(STORAGE_KEY) === "true");
    const [value, setValue] = useState("");
    const [error, setError] = useState(false);

    if (authed) return <>{children}</>;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value === SENHA) {
            sessionStorage.setItem(STORAGE_KEY, "true");
            setAuthed(true);
        } else {
            setError(true);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-primary px-4 text-primary">
            <form onSubmit={submit} className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl p-8 ring-1 ring-border-secondary">
                <FeaturedIcon icon={Lock01} color="brand" theme="light" size="lg" />
                <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-xl font-semibold text-primary">Acesso restrito</h1>
                    <p className="text-sm text-tertiary">Digite a senha de acesso para continuar.</p>
                </div>
                <Input
                    type="password"
                    label="Senha de acesso"
                    placeholder="••••••••"
                    value={value}
                    onChange={(v) => {
                        setValue(v);
                        setError(false);
                    }}
                    isInvalid={error}
                    hint={error ? "Senha incorreta. Tente novamente." : undefined}
                    className="w-full"
                />
                <Button type="submit" size="lg" color="primary" className="w-full">
                    Entrar
                </Button>
            </form>
        </div>
    );
}
