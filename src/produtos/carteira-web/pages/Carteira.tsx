import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Calendar, MarkerPin01, Monitor01, Package, Phone01, Ticket01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { cx } from "@/utils/cx";
import { IngressosModal } from "../components/IngressosModal";
import { isTransferido } from "../data/transfer-store";

type Tab = "proximos" | "anteriores";
type Viewport = "desktop" | "mobile";

interface EventoCard {
    id: string;
    title: string;
    local: string;
    hora: string;
    dia: string;
    mes: string;
    qtd: number;
    gradient?: string;
    /** Datas do evento formatadas — ex.: "10 e 31, Dez 2026". */
    datas: string;
    /** Id do combo (quando o evento é um combo) — habilita a badge "Combo" e o estado transferido. */
    comboId?: string;
}

const PROXIMOS: EventoCard[] = [
    {
        id: "sao-silvestre",
        title: "São Silvestre 2026",
        local: "Av. Paulista, São Paulo",
        hora: "08:00",
        dia: "31",
        mes: "Dezembro",
        qtd: 1,
        gradient: "linear-gradient(135deg,#FF4D00 0%,#1d4ed8 100%)",
        datas: "30 de Dez 2026",
        comboId: "combo-sao-silvestre",
    },
];

const ANTERIORES: EventoCard[] = [
    {
        id: "lolla",
        title: "Lollapalooza 2025",
        local: "Autódromo de Interlagos, São Paulo",
        hora: "12:00",
        dia: "28",
        mes: "Março",
        qtd: 2,
        gradient: "linear-gradient(135deg,#db2777 0%,#7c3aed 100%)",
        datas: "28, Mar 2025",
    },
];

/* ------------------------------ Conteúdo ------------------------------ */

function CarteiraContent({ onCardClick }: { onCardClick: () => void }) {
    const [tab, setTab] = useState<Tab>("proximos");
    const cards = tab === "proximos" ? PROXIMOS : ANTERIORES;

    return (
        <div className="@container bg-primary text-primary">
            <main className="mx-auto max-w-7xl px-4 py-10 @lg:px-6 @3xl:px-8">
                <h1 className="text-2xl font-bold text-primary @lg:text-3xl">Carteira</h1>

                {/* Tabs */}
                <div className="mt-6 flex border-b border-secondary">
                    <TabButton label="Próximos" active={tab === "proximos"} onClick={() => setTab("proximos")} />
                    <TabButton label="Anteriores" active={tab === "anteriores"} onClick={() => setTab("anteriores")} />
                </div>

                {/* Lista de cards — largura fixa (mesmo tamanho do mobile) */}
                <div className="mt-8 flex flex-wrap gap-5">
                    {cards.map((card) => (
                        <EventoCardView key={card.id} card={card} past={tab === "anteriores"} onClick={onCardClick} />
                    ))}
                </div>
            </main>
        </div>
    );
}

const TabButton = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className={cx(
            "-mb-px border-b-2 px-1 pb-3 text-sm font-semibold transition duration-100 ease-linear",
            active ? "border-fg-brand-primary text-brand-secondary" : "border-transparent text-tertiary hover:text-secondary",
            label === "Anteriores" && "ml-8",
        )}
    >
        {label}
    </button>
);

const EventoCardView = ({ card, past, onClick }: { card: EventoCard; past?: boolean; onClick: () => void }) => {
    const escuro = !!card.gradient;
    const transferido = !!card.comboId && isTransferido(card.comboId);
    return (
        <button
            type="button"
            onClick={onClick}
            className="relative flex aspect-[4/3] w-[360px] max-w-full flex-col overflow-hidden rounded-2xl text-left ring-1 ring-border-secondary transition duration-100 ease-linear hover:-translate-y-0.5 hover:shadow-lg"
        >
            {escuro ? <div className="absolute inset-0" style={{ background: card.gradient }} /> : <div className="absolute inset-0 bg-secondary" />}
            {!escuro && (
                <div className="absolute inset-0 flex items-center justify-center text-quaternary">
                    <Package className="size-24" aria-hidden="true" />
                </div>
            )}

            <div className="absolute inset-x-4 top-4 flex flex-wrap items-center gap-1.5">
                <div className="flex items-center gap-1.5 rounded-lg bg-black/70 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
                    <Ticket01 className="size-4" />
                    {card.qtd} {card.qtd === 1 ? "inscrição" : "inscrições"}
                </div>
                {past ? (
                    <Badge size="sm" color="gray" type="pill-color">
                        Finalizado
                    </Badge>
                ) : transferido ? (
                    <Badge size="sm" color="blue" type="pill-color">
                        Transferido
                    </Badge>
                ) : (
                    <Badge size="sm" color="success" type="pill-color">
                        Pronto para uso
                    </Badge>
                )}
            </div>

            <div className="absolute inset-x-3 bottom-3">
                <div className={cx("rounded-xl p-3 backdrop-blur", escuro ? "bg-black/75 text-white" : "bg-primary text-primary ring-1 ring-border-secondary")}>
                    <p className="truncate text-base font-bold">{card.title}</p>
                    <p className={cx("mt-1.5 flex items-center gap-1.5 text-sm", escuro ? "text-white/80" : "text-tertiary")}>
                        <Calendar className="size-4 shrink-0" />
                        {card.datas}
                    </p>
                    <p className={cx("mt-1 flex items-center gap-1.5 text-sm", escuro ? "text-white/80" : "text-tertiary")}>
                        <MarkerPin01 className="size-4 shrink-0" />
                        <span className="truncate">{card.local}</span>
                    </p>
                </div>
            </div>
        </button>
    );
};

/* --------------------- Página + toggle de viewport --------------------- */

export function Carteira() {
    const navigate = useNavigate();
    const [viewport, setViewport] = useState<Viewport>("desktop");
    const [modalOpen, setModalOpen] = useState(false);

    const seg = "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition duration-100 ease-linear";

    return (
        <div className={cx("min-h-screen", viewport === "mobile" ? "bg-secondary" : "bg-primary")}>
            {/* Barra de controle do protótipo */}
            <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-3 border-b border-secondary bg-primary/90 px-4 py-2.5 backdrop-blur">
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="flex items-center gap-1.5 text-sm font-medium text-tertiary transition hover:text-secondary"
                >
                    <ArrowLeft className="size-4" />
                    Produtos
                </button>

                <div className="flex items-center gap-1 rounded-lg bg-secondary p-1 ring-1 ring-border-secondary">
                    <button type="button" onClick={() => setViewport("desktop")} className={cx(seg, viewport === "desktop" ? "bg-primary text-primary shadow-sm" : "text-tertiary")}>
                        <Monitor01 className="size-4" /> Desktop
                    </button>
                    <button type="button" onClick={() => setViewport("mobile")} className={cx(seg, viewport === "mobile" ? "bg-primary text-primary shadow-sm" : "text-tertiary")}>
                        <Phone01 className="size-4" /> Mobile
                    </button>
                </div>

                <span className="hidden w-[120px] text-right text-xs text-tertiary @3xl:inline">{viewport === "mobile" ? "390px" : "Full width"}</span>
            </div>

            {/* Área de preview. No mobile real (telas pequenas) o frame de 390px é
               dispensado e fica full-bleed; o frame só aparece em telas grandes
               (sm+) para simular o celular durante o preview no desktop. */}
            <div className={cx(viewport === "mobile" ? "pt-16 pb-10 sm:px-4" : "pt-14")}>
                <div
                    className={cx(
                        "mx-auto bg-primary",
                        viewport === "mobile"
                            ? "w-full sm:w-[390px] sm:max-w-full sm:overflow-hidden sm:rounded-3xl sm:shadow-xl sm:ring-1 sm:ring-border-secondary"
                            : "w-full",
                    )}
                >
                    <CarteiraContent onCardClick={() => setModalOpen(true)} />
                </div>
            </div>

            {modalOpen && (
                <IngressosModal
                    onClose={() => setModalOpen(false)}
                    compact={viewport === "mobile"}
                    onTransfer={(combo) => navigate("/carteira-web/transferir", { state: { viewport, comboId: combo.id } })}
                />
            )}
        </div>
    );
}
