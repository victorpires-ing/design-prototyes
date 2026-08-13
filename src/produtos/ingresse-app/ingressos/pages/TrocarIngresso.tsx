import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "@untitledui/icons";
import { AppShell } from "../../components/AppShell";
import { StatusBar } from "../../components/StatusBar";
import { getEvento, getItem } from "../data/eventos";

/** Ponto de entrada do fluxo de troca/upgrade de ingresso.
 *  (Placeholder — as telas do fluxo serão construídas na sequência.) */
export function TrocarIngresso() {
    const navigate = useNavigate();
    const { eventId, itemId } = useParams();
    const evento = getEvento(eventId);
    const item = getItem(eventId, itemId);

    return (
        <AppShell showTabBar={false} scrollClassName="bg-secondary">
            <div className="flex min-h-full flex-col bg-secondary">
                <StatusBar tone="dark" />

                <div className="px-5 pt-2">
                    <button
                        type="button"
                        aria-label="Voltar"
                        onClick={() => navigate(-1)}
                        className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <h1 className="pt-4 text-xl font-bold text-primary">Trocar ingresso</h1>
                </div>

                <div className="px-5 pt-5 pb-8">
                    <div className="rounded-3xl bg-primary p-5 shadow-sm ring-1 ring-border-secondary">
                        <p className="text-sm text-tertiary">{evento.title}</p>
                        <div className="my-3 border-t border-tertiary" />
                        <p className="text-2xl leading-tight font-bold text-primary">{item?.title ?? "Ingresso"}</p>
                        <p className="mt-1.5 text-sm text-tertiary">Data do evento: {item?.data ?? evento.sessao}</p>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
