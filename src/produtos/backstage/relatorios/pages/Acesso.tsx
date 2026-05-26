import { BackstageLayout } from "../../components/Backstage";
import { RelatorioPageHeader } from "../components/RelatorioPageHeader";

export function Acesso() {
    return (
        <BackstageLayout activeSection="relatorios" activeItem="acesso">
            <div className="flex min-w-0 flex-1 flex-col">
                <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
                    <RelatorioPageHeader title="Acesso" />
                    <p className="text-md text-tertiary">Página em construção</p>
                </main>
            </div>
        </BackstageLayout>
    );
}
