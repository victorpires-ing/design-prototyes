import { BackstageLayout } from "../../components/Backstage";
import { DemografiaMetrics, GeografiaSecoes } from "../components/demografia-geo";
import { ExportMenu, RelatorioPageHeader } from "../components/RelatorioPageHeader";
import { RelatorioFiltersProvider } from "../components/relatorio-filters";
import { EVENT } from "../data/event";

export function SocioDemografico() {
    return (
        <BackstageLayout activeSection="relatorios" activeItem="socio-demografico">
            <RelatorioFiltersProvider sessoes={EVENT.sessoes}>
                <div className="flex min-w-0 flex-1 flex-col">
                    <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
                        <RelatorioPageHeader title="Sócio-demográfico" withFilters={false} actions={<ExportMenu />} />
                        <DemografiaMetrics />
                        <GeografiaSecoes />
                    </main>
                </div>
            </RelatorioFiltersProvider>
        </BackstageLayout>
    );
}
