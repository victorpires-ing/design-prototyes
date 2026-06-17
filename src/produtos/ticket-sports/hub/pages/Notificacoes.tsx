import { ArrowLeft, Settings01 } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { cx } from "@/utils/cx";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { NOTIFICACOES } from "../data/notificacoes";

export function Notificacoes() {
    const navigate = useNavigate();
    return (
        <TicketSportsLayout>
            <header className="flex items-center justify-between gap-3 border-b border-secondary bg-primary px-5 py-3.5 md:rounded-t-3xl">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        aria-label="Voltar"
                        className="flex size-9 items-center justify-center rounded-full text-fg-secondary hover:bg-secondary"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <h1 className="text-xl font-bold text-primary">Notificações</h1>
                </div>
                <button
                    type="button"
                    onClick={() => navigate("/ticket-sports/hub/notificacoes/configurar")}
                    aria-label="Configurar notificações"
                    className="flex size-10 items-center justify-center rounded-full bg-secondary text-fg-secondary transition hover:bg-tertiary"
                >
                    <Settings01 className="size-5" />
                </button>
            </header>

            <div className="hub-rise flex flex-1 flex-col px-5 py-4 pb-10">
                <div className="flex flex-col gap-2">
                    {NOTIFICACOES.map((n) => (
                        <div
                            key={n.id}
                            className={cx(
                                "flex items-start gap-3 rounded-2xl border p-4",
                                n.lida ? "border-secondary" : "border-[#7C3AED]/20 bg-[#7C3AED]/5",
                            )}
                        >
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-xl">{n.emoji}</span>
                            <div className="flex min-w-0 flex-1 flex-col">
                                <span className="text-sm font-semibold text-primary">{n.titulo}</span>
                                <span className="text-sm text-tertiary">{n.texto}</span>
                                <span className="mt-1 text-xs text-tertiary">{n.tempo}</span>
                            </div>
                            {!n.lida && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#7C3AED]" />}
                        </div>
                    ))}
                </div>
            </div>
        </TicketSportsLayout>
    );
}
