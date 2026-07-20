import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { CymaticsLoader, CymaticsLoaderFullscreen } from "@/components/application/loading-indicator/cymatics-loader";

const INLINE_SIZES = ["sm", "md", "lg", "xl"] as const;

export function CymaticsShowcase() {
    const [fullscreen, setFullscreen] = useState(false);

    const abrirFullscreen = () => {
        setFullscreen(true);
        // Auto-fecha só pra demonstração — no uso real, controla pelo estado de loading.
        window.setTimeout(() => setFullscreen(false), 4000);
    };

    return (
        <div className="min-h-screen bg-secondary text-primary">
            <div className="mx-auto flex w-full max-w-[960px] flex-col gap-8 px-4 py-10 md:px-6">
                <header className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-brand-secondary">Nova identidade · Cymatics</span>
                    <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">Loading cymatics</h1>
                    <p className="max-w-xl text-sm text-tertiary">
                        Partículas migram pras linhas nodais de uma onda estacionária (figuras de Chladni) e o padrão se transforma
                        continuamente. Componente compartilhado do design system, com versões inline e fullscreen.
                    </p>
                </header>

                <section className="flex flex-col gap-4 rounded-2xl bg-primary p-6 ring-1 ring-border-secondary">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-lg font-semibold text-primary">Inline</h2>
                        <p className="text-sm text-tertiary">Substitui o spinner. Tamanhos sm, md, lg e xl.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                        {INLINE_SIZES.map((size) => (
                            <div key={size} className="flex flex-col items-center justify-end gap-4 rounded-xl bg-secondary p-6">
                                <CymaticsLoader size={size} />
                                <span className="text-xs font-medium text-tertiary uppercase">{size}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col items-start gap-4 rounded-xl bg-secondary p-6">
                        <CymaticsLoader size="lg" label="Gerando relatório…" />
                    </div>
                </section>

                <section className="flex flex-col gap-4 rounded-2xl bg-primary p-6 ring-1 ring-border-secondary">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-lg font-semibold text-primary">Fullscreen</h2>
                        <p className="text-sm text-tertiary">Tela de carregamento inteira (splash / transição de rota).</p>
                    </div>
                    <div>
                        <Button size="md" color="primary" onClick={abrirFullscreen}>
                            Ver loading fullscreen
                        </Button>
                    </div>
                </section>
            </div>

            <CymaticsLoaderFullscreen isOpen={fullscreen} label="Carregando o evento…" />
        </div>
    );
}
