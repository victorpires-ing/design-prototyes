import { BackstageLayout } from "../../components/Backstage";

export function Transferencias() {
    return (
        <BackstageLayout activeSection="relatorios" activeItem="transferencias">
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex items-center px-6 py-6">
                    <h1 className="text-display-xs font-bold text-primary">Transferências</h1>
                </header>
                <main className="flex flex-1 items-center justify-center px-6 py-6">
                    <p className="text-md text-tertiary">Página em construção</p>
                </main>
            </div>
        </BackstageLayout>
    );
}
