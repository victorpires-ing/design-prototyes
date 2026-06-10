import { Calendar, Package, XClose } from "@untitledui/icons";
import { useForceLightTheme } from "../../components/use-light-theme";
import { ComboCard, IngressoCard } from "../components/ticket-cards";
import { COMBOS, DIAS_INGRESSOS } from "../data/ingressos";

export function MeusIngressosWeb() {
    useForceLightTheme();
    return (
        <div className="flex min-h-screen justify-center bg-secondary px-4 py-8">
            <div className="flex h-max w-full max-w-3xl flex-col rounded-2xl bg-primary ring-1 ring-border-secondary">
                <header className="flex items-start justify-between gap-4 border-b border-secondary p-5">
                    <div className="flex flex-col gap-0.5">
                        <h1 className="text-lg font-bold text-primary">Nome do evento</h1>
                        <p className="text-sm text-tertiary">
                            Documents and attachments that have been uploaded as part of this project.
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label="Fechar"
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-fg-secondary"
                    >
                        <XClose className="size-5" />
                    </button>
                </header>

                <div className="flex flex-col gap-6 p-5">
                    {/* Combos */}
                    <section className="flex flex-col gap-3">
                        <h2 className="flex items-center gap-2 text-md font-bold text-primary">
                            <Package className="size-5 text-brand-secondary" />
                            Combos
                        </h2>
                        {COMBOS.map((combo) => (
                            <ComboCard key={combo.id} combo={combo} web />
                        ))}
                    </section>

                    {/* Ingressos por data */}
                    {DIAS_INGRESSOS.map((dia) => {
                        const [titulo, sufixo] = dia.data.split(" - ");
                        return (
                            <section key={dia.data} className="flex flex-col gap-3">
                                <h2 className="flex items-center gap-2 text-md font-bold text-primary">
                                    <Calendar className="size-5 text-brand-secondary" />
                                    {titulo}
                                    {sufixo && <span className="font-normal text-tertiary">- {sufixo}</span>}
                                </h2>
                                {dia.ingressos.map((ingresso) => (
                                    <IngressoCard key={ingresso.id} ingresso={ingresso} web />
                                ))}
                            </section>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
