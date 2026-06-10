import { Calendar, Package } from "@untitledui/icons";
import { CarteiraAppLayout } from "../../components/CarteiraAppLayout";
import { ComboCard, IngressoCard } from "../components/ticket-cards";
import { COMBOS, DIAS_INGRESSOS } from "../data/ingressos";

export function MeusIngressos() {
    return (
        <CarteiraAppLayout title="Meus ingressos" activeTab="meus-ingressos">
            <div className="flex flex-col gap-6">
                {/* Combos */}
                <section className="flex flex-col gap-3">
                    <h2 className="flex items-center gap-2 text-md font-bold text-primary">
                        <Package className="size-5 text-brand-secondary" />
                        Combos
                    </h2>
                    {COMBOS.map((combo) => (
                        <ComboCard key={combo.id} combo={combo} />
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
                                <IngressoCard key={ingresso.id} ingresso={ingresso} />
                            ))}
                        </section>
                    );
                })}
            </div>
        </CarteiraAppLayout>
    );
}
