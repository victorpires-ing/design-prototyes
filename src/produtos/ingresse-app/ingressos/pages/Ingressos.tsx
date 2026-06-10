import { useNavigate } from "react-router";
import { ArrowLeft, Calendar, ChevronRight, FilterLines, Map01, MarkerPin01, QrCode02, User01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { cx } from "@/utils/cx";
import { AppShell } from "../../components/AppShell";
import { StatusBar } from "../../components/StatusBar";

interface Ingresso {
    id: string;
    title: string;
    tipo: string;
    data: string;
    portador: string;
}

const INGRESSOS: Ingresso[] = [
    { id: "1", title: "ARENA | Brasil x Haiti | (19/06)", tipo: "Inteira", data: "Sex, 19 jun • 15:00", portador: "Janaina Nascimento de Souza" },
    { id: "2", title: "ARENA | Brasil x Haiti | (19/06)", tipo: "Inteira", data: "Sex, 19 jun • 15:00", portador: "Janaina Nascimento de Souza" },
];

export function Ingressos() {
    const navigate = useNavigate();

    return (
        <AppShell activeTab="ingressos">
            <div className="min-h-full bg-secondary">
                <StatusBar tone="dark" />

                {/* Top bar */}
                <div className="flex items-center justify-between px-5 pt-2">
                    <IconButton icon={ArrowLeft} label="Voltar" onClick={() => navigate("/ingresse-app/ingressos")} />
                    <IconButton icon={FilterLines} label="Filtrar" />
                </div>

                <h1 className="px-5 pt-4 text-xl font-bold text-primary">Ingressos</h1>

                {/* Card do evento */}
                <div className="px-5 pt-5">
                    <div className="flex gap-3 rounded-2xl bg-primary p-3 ring-1 ring-border-secondary">
                        <div
                            className="size-24 shrink-0 rounded-xl"
                            style={{ background: "linear-gradient(150deg, #22C55E 0%, #0EA5E9 55%, #F59E0B 100%)" }}
                        />
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <p className="text-sm font-bold text-primary">ARENA BRASILEIRA 2026</p>
                            <p className="text-sm font-medium text-secondary">Sex, 19 jun • 15:00</p>
                            <div className="flex items-end justify-between gap-2">
                                <p className="text-sm text-tertiary">Parque Ibirapuera • São Paulo/SP</p>
                                <IconButton icon={Map01} label="Ver no mapa" small />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sessão */}
                <div className="flex items-center justify-between px-5 pt-6">
                    <h2 className="text-sm font-semibold text-primary">Sex, 19 jun • 15:00</h2>
                    <span className="flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-medium text-secondary ring-1 ring-border-secondary">
                        {INGRESSOS.length}
                    </span>
                </div>

                {/* Ingressos */}
                <div className="px-5 pt-3 pb-6">
                    <div className="overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
                        {INGRESSOS.map((ingresso, i) => (
                            <button
                                key={ingresso.id}
                                type="button"
                                onClick={() => navigate("/ingresse-app/ingressos/detalhe")}
                                className={cx(
                                    "flex w-full items-start gap-3 p-4 text-left transition duration-100 ease-linear active:bg-secondary",
                                    i > 0 && "border-t border-secondary",
                                )}
                            >
                                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-fg-secondary">
                                    <QrCode02 className="size-6" />
                                </span>
                                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-bold text-primary">{ingresso.title}</p>
                                        <ChevronRight className="mt-0.5 size-5 shrink-0 text-fg-quaternary" />
                                    </div>
                                    <p className="-mt-1 text-sm text-tertiary">{ingresso.tipo}</p>
                                    <p className="flex items-center gap-1.5 text-sm text-secondary">
                                        <Calendar className="size-4 shrink-0 text-fg-quaternary" />
                                        {ingresso.data}
                                    </p>
                                    <p className="flex items-center gap-1.5 text-sm text-secondary">
                                        <User01 className="size-4 shrink-0 text-fg-quaternary" />
                                        {ingresso.portador}
                                    </p>
                                    <div className="pt-1">
                                        <Badge size="md" color="success" type="pill-color">
                                            Pronto para uso
                                        </Badge>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

const IconButton = ({ icon: Icon, label, onClick, small }: { icon: typeof ArrowLeft; label: string; onClick?: () => void; small?: boolean }) => (
    <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className={cx(
            "flex shrink-0 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary",
            small ? "size-9" : "size-10",
        )}
    >
        <Icon className="size-5" />
    </button>
);
