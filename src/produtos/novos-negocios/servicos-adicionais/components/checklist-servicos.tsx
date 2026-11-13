import { useNavigate } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { MOMENTOS, SERVICOS, type Servico } from "../data/servicos";
import { SeloServico } from "./selo-servico";

/**
 * Checklist do rolê: os serviços organizados pelos momentos do rolê (antes de sair, ida e
 * volta, no evento), numa linha do tempo vertical. Cada momento é um passo numerado e traz os
 * serviços dele; "Eu quero" abre a página de contratação daquele serviço.
 */
export function ChecklistServicos() {
    return (
        <ol className="flex flex-col">
            {MOMENTOS.map((momento, i) => {
                const ultimo = i === MOMENTOS.length - 1;
                return (
                    <li key={momento.id} className="relative flex gap-4 sm:gap-5">
                        {/* Trilho: número do passo e a linha até o próximo */}
                        <div className="flex flex-col items-center">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary ring-1 ring-border-primary ring-inset">{i + 1}</span>
                            {!ultimo && <span aria-hidden="true" className="w-0.5 flex-1 bg-border-secondary" />}
                        </div>

                        <div className={ultimo ? "flex-1 pb-0" : "flex-1 pb-8"}>
                            <h3 className="flex h-8 items-center text-lg font-semibold text-primary">{momento.titulo}</h3>
                            <ul className="mt-3 flex flex-col gap-3">
                                {momento.servicos.map((id) => (
                                    <li key={id}>
                                        <CartaoServico servico={SERVICOS[id]} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}

function CartaoServico({ servico }: { servico: Servico }) {
    const navigate = useNavigate();
    const principal = servico.beneficios[0];

    return (
        <div className="flex flex-col gap-4 rounded-2xl bg-primary p-4 shadow-xs ring-1 ring-secondary transition duration-100 ease-linear sm:flex-row sm:items-center lg:hover:ring-2 lg:hover:ring-fg-primary">
            <div className="flex min-w-0 flex-1 items-center gap-3">
                <SeloServico servico={servico} tamanho="md" />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-md font-semibold text-primary">{servico.item}</span>
                    <span className="text-sm text-tertiary">{principal.texto}</span>
                </div>
            </div>
            <Button
                size="md"
                color="secondary"
                className="w-full shrink-0 sm:w-auto"
                onClick={() => navigate(`/novos-negocios/servicos-adicionais/${servico.id}?de=checklist`)}
            >
                Eu quero
            </Button>
        </div>
    );
}
