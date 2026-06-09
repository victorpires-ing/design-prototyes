import { Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

interface PerguntasEmptyStateProps {
    onCreate?: () => void;
}

export function PerguntasEmptyState({ onCreate }: PerguntasEmptyStateProps) {
    return (
        <div className="relative flex flex-1 flex-col items-center overflow-hidden">
            <div className="z-10 flex max-w-xl flex-col items-center gap-6 px-6 pt-12 text-center md:pt-20">
                <div className="flex flex-col leading-[1.05]">
                    <span className="text-display-sm font-light italic text-tertiary md:text-display-md">
                        Obtenha respostas
                    </span>
                    <span className="text-display-sm font-bold text-primary md:text-display-md">
                        para seus eventos
                    </span>
                </div>
                <p className="max-w-md text-md text-tertiary">
                    Leve mais pessoas para o seu evento com convites exclusivos e fáceis de enviar.
                </p>
                <Button size="lg" color="primary" iconLeading={Plus} onClick={onCreate}>
                    Nova pergunta
                </Button>
            </div>

            <FormsIllustration />
        </div>
    );
}

/* Decorative skeleton of question cards fanned behind a central card. */
const FormsIllustration = () => (
    <div className="pointer-events-none relative mt-10 flex w-full max-w-3xl flex-1 items-end justify-center">
        {/* back card — left */}
        <BackCard className="absolute bottom-0 left-1/2 -translate-x-[78%] -rotate-12" />
        {/* back card — right */}
        <BackCard className="absolute bottom-0 left-1/2 -translate-x-[22%] rotate-12" />

        {/* central card */}
        <div className="relative w-full max-w-md rounded-t-3xl bg-secondary p-6 ring-1 ring-border-secondary">
            <div className="flex items-center justify-between gap-4">
                <span className="h-3.5 w-40 rounded-full bg-quaternary" />
                <span className="h-3.5 w-16 rounded-full bg-quaternary" />
            </div>
            <span className="mt-4 block h-3 w-24 rounded-full bg-quaternary" />
            <span className="mt-6 block h-3 w-full rounded-full bg-quaternary" />
            <span className="mt-3 block h-3 w-full rounded-full bg-quaternary" />
            <div className="mt-8 flex items-center gap-4">
                <span className="h-16 flex-1 rounded-2xl bg-tertiary" />
                <span className="size-16 rounded-2xl bg-tertiary" />
            </div>
        </div>
    </div>
);

const BackCard = ({ className }: { className?: string }) => (
    <div
        className={`w-72 rounded-3xl bg-secondary/70 p-6 ring-1 ring-border-secondary ${className ?? ""}`}
    >
        <div className="flex flex-col gap-4">
            <span className="block h-2.5 w-full rounded-full bg-border-secondary" />
            <span className="block h-2.5 w-4/5 rounded-full bg-border-secondary" />
            <span className="block h-2.5 w-full rounded-full bg-border-secondary" />
            <span className="block h-2.5 w-2/3 rounded-full bg-border-secondary" />
        </div>
    </div>
);
