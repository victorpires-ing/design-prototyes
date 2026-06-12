import { useNavigate } from "react-router";
import { ArrowLeft, ChevronRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

interface LandingPageItem {
    id: string;
    name: string;
    description: string;
    to: string;
    gradient: string;
}

const PAGES: LandingPageItem[] = [
    {
        id: "sao-silvestre",
        name: "Corrida de São Silvestre",
        description: "Landing page da São Silvestre 2026",
        to: "/landing-pages/sao-silvestre",
        gradient: "linear-gradient(135deg,#FF4D00 0%,#1d4ed8 100%)",
    },
];

export function LandingPagesMenu() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-primary px-4 py-12 md:px-6">
            <div className="mx-auto w-full max-w-3xl">
                <Button size="sm" color="link-gray" iconLeading={ArrowLeft} onClick={() => navigate("/")}>
                    Produtos
                </Button>

                <h1 className="mt-5 text-3xl font-bold text-primary">Landing Pages</h1>
                <p className="mt-1 text-md text-tertiary">Escolha uma landing page para visualizar.</p>

                <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {PAGES.map((page) => (
                        <button
                            key={page.id}
                            type="button"
                            onClick={() => navigate(page.to)}
                            className="group flex flex-col overflow-hidden rounded-2xl text-left ring-1 ring-border-secondary transition duration-150 ease-linear hover:-translate-y-1 hover:ring-brand"
                        >
                            <div className="h-36" style={{ background: page.gradient }} />
                            <div className="flex items-center justify-between gap-2 border-t border-secondary bg-secondary/60 px-4 py-4">
                                <div className="min-w-0">
                                    <p className="text-md font-semibold text-primary">{page.name}</p>
                                    <p className="truncate text-sm text-tertiary">{page.description}</p>
                                </div>
                                <ChevronRight className="size-5 shrink-0 text-fg-quaternary transition group-hover:text-fg-secondary" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
