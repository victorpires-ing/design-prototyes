import { Users03 } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { HubTabBar } from "../components/HubTabBar";
import { PublicacaoCard } from "../components/PublicacaoCard";
import { FEED } from "../data/comunidade";

export function ComunidadeFeed() {
    const navigate = useNavigate();

    return (
        <TicketSportsLayout fullHeight>
            <header className="flex items-center justify-between gap-3 border-b border-secondary bg-primary px-5 py-3.5 md:rounded-t-3xl">
                <h1 className="text-xl font-bold text-primary">Comunidade</h1>
                <button
                    type="button"
                    onClick={() => navigate("/ticket-sports/hub/comunidades")}
                    className="flex items-center gap-1.5 rounded-full bg-[#7C3AED]/10 px-3.5 py-2 text-sm font-semibold text-[#7C3AED] transition duration-100 hover:bg-[#7C3AED]/15"
                >
                    <Users03 className="size-4" />
                    Ver todas
                </button>
            </header>

            <main className="hub-rise flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-5 pb-28">
                {FEED.map((p) => (
                    <PublicacaoCard
                        key={`${p.comunidadeId}-${p.id}`}
                        item={p}
                        onAbrirComunidade={(id) => navigate(`/ticket-sports/hub/comunidades/${id}`)}
                    />
                ))}
            </main>

            <HubTabBar active="comunidade" />
        </TicketSportsLayout>
    );
}
