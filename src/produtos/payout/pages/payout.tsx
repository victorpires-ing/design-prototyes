import { useNavigate } from "react-router";
import { ArrowLeft, BankNote01 } from "@untitledui/icons";

/**
 * Página de entrada do PayOut. O produto ainda não tem projeto — esta tela é o
 * ponto de partida até o primeiro fluxo (repasses, estornos) ser definido.
 */
export function PayOut() {
    const navigate = useNavigate();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-primary px-4 py-16">
            <div className="flex flex-col items-center gap-4 text-center">
                <span className="flex size-12 items-center justify-center rounded-xl bg-brand-solid text-white">
                    <BankNote01 className="size-6" aria-hidden="true" />
                </span>
                <h1 className="text-3xl font-bold tracking-tight text-primary">PayOut</h1>
                <p className="max-w-md text-md text-tertiary">
                    Saída de dinheiro — repasses aos organizadores, estornos e afins. O produto ainda não tem projeto.
                </p>
            </div>

            <div className="flex w-full max-w-md flex-col gap-3 rounded-2xl bg-secondary p-5 ring-1 ring-border-secondary">
                <span className="text-sm font-semibold text-primary">Para criar o primeiro projeto</span>
                <ol className="flex flex-col gap-2 text-sm text-tertiary">
                    <li>
                        1. Duplique <code className="text-secondary">src/produtos/_template/_projeto/</code> dentro de{" "}
                        <code className="text-secondary">src/produtos/payout/</code> e renomeie em kebab-case.
                    </li>
                    <li>
                        2. Registre as páginas como rotas em <code className="text-secondary">src/app/App.tsx</code>.
                    </li>
                    <li>
                        3. Aponte o card do produto em{" "}
                        <code className="text-secondary">src/app/components/ProductSelection.tsx</code> para a primeira tela.
                    </li>
                </ol>
            </div>

            <button
                type="button"
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-sm font-semibold text-tertiary transition duration-150 ease-linear hover:text-primary"
            >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Voltar para os produtos
            </button>
        </div>
    );
}
