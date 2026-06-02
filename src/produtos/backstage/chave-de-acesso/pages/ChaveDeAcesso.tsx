import { Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { BackstageLayout } from "../../components/Backstage";

export function ChaveDeAcesso() {
    return (
        <BackstageLayout activeSection="marketing" activeItem="chave-de-acesso">
            <div className="flex min-w-0 flex-1 flex-col">
                <main className="flex flex-1 flex-col px-4 py-6 md:px-6">
                    <h1 className="text-xl font-semibold text-primary">Chave de acesso</h1>

                    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden">
                        <div className="z-10 flex max-w-xl flex-col items-center gap-5 text-center">
                            <div className="flex flex-col gap-1">
                                <p className="text-display-sm font-light text-tertiary italic">
                                    Crie chaves de acesso para
                                </p>
                                <h2 className="text-display-md font-bold text-primary">
                                    liberar ingressos ocultos
                                </h2>
                            </div>

                            <p className="max-w-md text-md text-tertiary">
                                Com a chave de acesso é possível liberar ingressos apenas para quem o
                                tem ou acessa o evento por um link especial.
                            </p>

                            <Button size="lg" color="primary" iconLeading={Plus} className="mt-1">
                                Criar chave de acesso
                            </Button>
                        </div>

                        <DecorativeCards />
                    </div>
                </main>
            </div>
        </BackstageLayout>
    );
}

/* Faded stacked "ticket" cards illustration at the bottom of the empty state. */
const DecorativeCards = () => (
    <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]"
    >
        <div className="relative h-64 w-full max-w-2xl">
            <SkeletonCard className="absolute bottom-0 left-1/2 w-[440px] -translate-x-1/2 translate-y-10 -rotate-6 opacity-50" />
            <SkeletonCard className="absolute bottom-0 left-1/2 w-[440px] -translate-x-1/2 translate-y-10 rotate-6 opacity-50" />
            <SkeletonCard className="absolute bottom-0 left-1/2 w-[480px] -translate-x-1/2 translate-y-12" />
        </div>
    </div>
);

const SkeletonCard = ({ className }: { className?: string }) => (
    <div
        className={
            "flex flex-col gap-3 rounded-2xl bg-secondary p-6 ring-1 ring-border-secondary " +
            (className ?? "")
        }
    >
        <div className="h-3 w-1/3 rounded-full bg-quaternary" />
        <div className="h-3 w-3/4 rounded-full bg-quaternary" />
        <div className="h-3 w-2/3 rounded-full bg-quaternary" />
        <div className="h-3 w-1/2 rounded-full bg-quaternary" />
    </div>
);
