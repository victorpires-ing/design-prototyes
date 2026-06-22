import type { FC } from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Calendar, ChevronRight, ClockRewind, FilterLines, MarkerPin01, Monitor01, Package, Phone01, Ticket01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { cx } from "@/utils/cx";
import { GradientFill } from "../components/GradientFill";
import { DesktopDetalhe, MobileComboView } from "../components/IngressosModal";
import { SAO_SILVESTRE } from "../data/sao-silvestre";
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
    /** Mês/ano para agrupar na lista mobile (estilo app). */
    mesAno: string;
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
        mesAno: "Dezembro 2026",
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
        mesAno: "Março 2025",
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
                    <TabButton icon={Ticket01} label="Vem aí" active={tab === "proximos"} onClick={() => setTab("proximos")} />
                    <TabButton icon={ClockRewind} label="Passados" active={tab === "anteriores"} onClick={() => setTab("anteriores")} />
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

const TabButton = ({ icon: Icon, label, active, onClick }: { icon: FC<{ className?: string }>; label: string; active: boolean; onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className={cx(
            "-mb-px flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold transition duration-100 ease-linear",
            active ? "border-fg-brand-primary text-brand-secondary" : "border-transparent text-tertiary hover:text-secondary",
            label === "Passados" && "ml-8",
        )}
    >
        <Icon className={cx("size-5", active ? "text-fg-brand-primary" : "text-fg-quaternary")} />
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
            className="flex w-[360px] max-w-full flex-col overflow-hidden rounded-2xl bg-primary text-left ring-1 ring-border-secondary transition duration-100 ease-linear hover:-translate-y-0.5 hover:shadow-lg"
        >
            {/* Foto do evento (em cima) — altura explícita + degradê como SVG (export-safe) */}
            <div
                className={cx(
                    "relative h-44 w-full shrink-0 overflow-hidden",
                    !escuro && "flex items-center justify-center bg-secondary text-quaternary",
                    transferido && "grayscale",
                )}
            >
                {escuro ? <GradientFill gradient={card.gradient} className="absolute inset-0 size-full" /> : <Package className="size-16" aria-hidden="true" />}
                {/* Inscrição transferida: esmaece a foto */}
                {transferido && <div className="absolute inset-0 bg-primary/40" />}

                {/* Tag de quantidade + badge de status (topo direito, sobre a imagem) */}
                <div className="absolute top-3 right-3 flex flex-wrap items-center justify-end gap-1.5">
                    <div className="flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                        <Ticket01 className="size-3.5" />
                        <span>
                            {card.qtd} {card.qtd === 1 ? "inscrição" : "inscrições"}
                        </span>
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
            </div>

            {/* Informações (embaixo, fundo branco) */}
            <div className="flex flex-col gap-1.5 p-4">
                <p className="truncate text-base font-bold text-primary">{card.title}</p>
                <p className="flex items-center gap-1.5 text-sm text-tertiary">
                    <Calendar className="size-4 shrink-0 text-fg-quaternary" />
                    <span>{card.datas}</span>
                </p>
                <p className="flex items-center gap-1.5 text-sm text-tertiary">
                    <MarkerPin01 className="size-4 shrink-0 text-fg-quaternary" />
                    <span className="truncate">{card.local}</span>
                </p>
            </div>
        </button>
    );
};

/* ----------- Mobile: fluxo igual ao app (lista de eventos → ingressos) ----------- */

const MobileTab = ({ icon: Icon, label, active, onClick }: { icon: FC<{ className?: string }>; label: string; active: boolean; onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className={cx(
            "-mb-px flex flex-1 items-center justify-center gap-2 border-b-2 pb-3 text-sm font-semibold transition duration-100 ease-linear",
            active ? "border-fg-brand-primary text-brand-secondary" : "border-transparent text-tertiary",
        )}
    >
        <Icon className={cx("size-5", active ? "text-fg-brand-primary" : "text-fg-quaternary")} />
        {label}
    </button>
);

/** Lista de eventos agrupada por mês (estilo app), só com a São Silvestre. */
function MobileEventList({ onEventClick }: { onEventClick: (card: EventoCard) => void }) {
    const [tab, setTab] = useState<Tab>("proximos");
    // Só a São Silvestre no mobile.
    const eventos = tab === "proximos" ? PROXIMOS.filter((e) => e.comboId === "combo-sao-silvestre") : [];
    const grupos = [...new Set(eventos.map((e) => e.mesAno))].map((mes) => ({ mes, eventos: eventos.filter((e) => e.mesAno === mes) }));

    return (
        <div className="scrollbar-hide flex-1 overflow-y-auto bg-secondary">
            <h1 className="px-5 pt-6 pb-5 text-xl font-bold text-primary">Carteira</h1>

            <div className="flex px-5">
                <MobileTab icon={Ticket01} label="Vem aí" active={tab === "proximos"} onClick={() => setTab("proximos")} />
                <MobileTab icon={ClockRewind} label="Passados" active={tab === "anteriores"} onClick={() => setTab("anteriores")} />
            </div>
            <div className="h-px bg-border-secondary" />

            {grupos.length === 0 && <p className="px-5 pt-10 text-center text-sm text-tertiary">Nenhuma inscrição por aqui.</p>}

            <div className="flex flex-col gap-2 px-5 pt-5 pb-6">
                {grupos.map((grupo) => (
                    <section key={grupo.mes} className="pt-2">
                        <h2 className="pb-3 text-md font-bold text-primary">{grupo.mes}</h2>
                        <div className="flex flex-col gap-4">
                            {grupo.eventos.map((evento) => (
                                <button
                                    key={evento.id}
                                    type="button"
                                    onClick={() => onEventClick(evento)}
                                    className="flex items-center gap-4 rounded-2xl bg-primary p-3 text-left ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                                >
                                    <div className="size-24 shrink-0 overflow-hidden rounded-xl">
                                        <GradientFill gradient={evento.gradient} />
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                                        <p className="text-sm font-bold text-primary">{evento.title}</p>
                                        <p className="text-sm font-medium text-secondary">{evento.datas}</p>
                                        <p className="text-sm text-tertiary">{evento.local}</p>
                                        <p className="text-sm text-tertiary">
                                            {evento.qtd} {evento.qtd === 1 ? "inscrição" : "inscrições"}
                                        </p>
                                    </div>
                                    <ChevronRight className="size-5 shrink-0 text-fg-quaternary" />
                                </button>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}

/** Tela intermediária com a listagem de ingressos do evento (estilo app), só SS. */
function MobileIngressos({ card, onBack, onOpen }: { card: EventoCard; onBack: () => void; onOpen: () => void }) {
    const combo = SAO_SILVESTRE.combos[0];
    const transferido = !!card.comboId && isTransferido(card.comboId);

    return (
        <div className="scrollbar-hide flex-1 overflow-y-auto bg-secondary">
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 pt-6">
                <button
                    type="button"
                    aria-label="Voltar"
                    onClick={onBack}
                    className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                >
                    <ArrowLeft className="size-5" />
                </button>
                <button
                    type="button"
                    aria-label="Filtrar"
                    className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                >
                    <FilterLines className="size-5" />
                </button>
            </div>

            <h1 className="px-5 pt-4 text-xl font-bold text-primary">Ingressos</h1>

            {/* Card do evento */}
            <div className="px-5 pt-5">
                <div className="flex gap-3 rounded-2xl bg-primary p-3 ring-1 ring-border-secondary">
                    <div className="size-24 shrink-0 overflow-hidden rounded-xl">
                        <GradientFill gradient={card.gradient} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <p className="text-sm font-bold text-primary">{card.title}</p>
                        <p className="text-sm font-medium text-secondary">{card.datas}</p>
                        <div className="flex items-end justify-between gap-2">
                            <p className="text-sm text-tertiary">{card.local}</p>
                            <button
                                type="button"
                                aria-label="Ver no mapa"
                                className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                            >
                                <MarkerPin01 className="size-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sessão */}
            <div className="flex items-center justify-between px-5 pt-6">
                <h2 className="text-sm font-semibold text-primary">{card.datas}</h2>
                <span className="flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-medium text-secondary ring-1 ring-border-secondary">1</span>
            </div>

            {/* Inscrição (abre o detalhe) */}
            <div className="flex flex-col gap-4 px-5 pt-3 pb-6">
                <button
                    type="button"
                    onClick={onOpen}
                    className="flex w-full items-start gap-3 rounded-2xl bg-primary p-4 text-left ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                >
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold text-primary">{combo.nome}</p>
                            <ChevronRight className="mt-0.5 size-5 shrink-0 text-fg-quaternary" />
                        </div>
                        <p className="-mt-1 text-sm text-tertiary">1 inscrição</p>
                        <p className="flex items-center gap-1.5 text-sm text-secondary">
                            <Calendar className="size-4 shrink-0 text-fg-quaternary" />
                            <span>{combo.dataEvento}</span>
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {transferido ? (
                                <Badge size="md" color="blue" type="pill-color">
                                    Transferido
                                </Badge>
                            ) : (
                                <Badge size="md" color="success" type="pill-color">
                                    Pronto para uso
                                </Badge>
                            )}
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
}

/* --------------------- Página + toggle de viewport --------------------- */

export function Carteira() {
    const navigate = useNavigate();
    const [viewport, setViewport] = useState<Viewport>("desktop");
    // Desktop: lista de eventos → tela de detalhe da inscrição
    const [desktopDetalhe, setDesktopDetalhe] = useState(false);
    // Mobile espelha o app: lista de eventos → listagem de ingressos → ingresso (detalhe)
    const [mobileScreen, setMobileScreen] = useState<"lista" | "ingressos" | "detalhe">("lista");

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
                        "mx-auto",
                        viewport === "mobile"
                            ? "relative flex h-[calc(100dvh-6.5rem)] w-full flex-col overflow-hidden bg-secondary sm:h-[820px] sm:max-h-[85vh] sm:w-[390px] sm:max-w-full sm:rounded-3xl sm:shadow-xl sm:ring-1 sm:ring-border-secondary"
                            : "w-full bg-primary",
                    )}
                >
                    {viewport === "desktop" ? (
                        desktopDetalhe ? (
                            <DesktopDetalhe
                                onBack={() => setDesktopDetalhe(false)}
                                onTransfer={(combo) => navigate("/carteira-web/transferir", { state: { viewport, comboId: combo.id } })}
                            />
                        ) : (
                            <CarteiraContent onCardClick={() => setDesktopDetalhe(true)} />
                        )
                    ) : mobileScreen === "lista" ? (
                        <MobileEventList onEventClick={() => setMobileScreen("ingressos")} />
                    ) : mobileScreen === "ingressos" ? (
                        <MobileIngressos card={PROXIMOS[0]} onBack={() => setMobileScreen("lista")} onOpen={() => setMobileScreen("detalhe")} />
                    ) : (
                        <MobileComboView
                            ev={SAO_SILVESTRE}
                            combo={SAO_SILVESTRE.combos[0]}
                            titular={SAO_SILVESTRE.titular}
                            cpf={SAO_SILVESTRE.cpf}
                            onClose={() => setMobileScreen("ingressos")}
                            onTransfer={(combo) => navigate("/carteira-web/transferir", { state: { viewport, comboId: combo.id } })}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
