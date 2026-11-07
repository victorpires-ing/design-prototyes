import type { FC } from "react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { AlertTriangle, ArrowLeft, Calendar, ChevronRight, ClockRewind, FilterLines, MarkerPin01, Package, Ticket01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { GradientFill } from "../components/GradientFill";
import { DesktopDetalhe, MobileComboView } from "../components/IngressosModal";
import { EditarFormularioModal } from "../components/EditarFormularioModal";
import { EditarFormularioMobile } from "../components/EditarFormularioMobile";
import { WebToast } from "../components/WebToast";
import { ControlesPrototipo } from "../components/controles-prototipo";
import { useViewport } from "../data/viewport";
import { SiteHeader } from "../components/site-header";
import { DetalheEvento, EventoIngressos, type Alvo } from "../components/evento-ingressos";
import { getEvento, paraOPerfil } from "../data/eventos";
import { useCarteiraDoBanco } from "../data/plataforma";
import { usePerfilAtivo, type PerfilAtivo } from "../data/perfil-ativo";
import { useDependentes } from "../data/dependentes";
import { PerfisOnboarding } from "../components/perfis-onboarding";

/** Onboarding dos perfis dos dependentes já visto (mostra uma vez; o link dedicado abre sempre). */
const ONBOARDING_PERFIS = "cw-onboarding-perfis";
import { useForceLightTheme } from "../components/use-force-light-theme";
import { useMarcaIngresse } from "../components/use-marca-ingresse";
import { SAO_SILVESTRE } from "../data/sao-silvestre";
import { isTransferido } from "../data/transfer-store";

type Tab = "proximos" | "anteriores";

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

/** Mesmos eventos da carteira do app; só a São Silvestre tem o fluxo completo (inscrição, transferência e formulário). */
const PROXIMOS: EventoCard[] = [
    {
        id: "gop-tun",
        title: "Gop Tun Festival 2026",
        local: "Audio, São Paulo",
        hora: "16:00",
        dia: "11",
        mes: "Abril",
        qtd: 2,
        gradient: "linear-gradient(160deg,#ef4444 0%,#111827 55%,#0b0b0f 100%)",
        datas: "11 de Abr 2026",
        mesAno: "Abril 2026",
    },
    {
        id: "arena",
        title: "ARENA BRASILEIRA 2026",
        local: "Parque Ibirapuera, São Paulo",
        hora: "15:00",
        dia: "19",
        mes: "Junho",
        qtd: 2,
        gradient: "linear-gradient(150deg,#16a34a 0%,#2563eb 50%,#f59e0b 100%)",
        datas: "19 de Jun 2026",
        mesAno: "Junho 2026",
    },
    {
        id: "samba-independente",
        title: "SAMBA INDEPENDENTE DOS BONS COSTUMES",
        local: "Fundição Progresso, Rio de Janeiro",
        hora: "20:00",
        dia: "4",
        mes: "Julho",
        qtd: 2,
        gradient: "linear-gradient(135deg,#F59E0B 0%,#DB2777 55%,#7C3AED 100%)",
        datas: "4 e 18, Jul 2026",
        mesAno: "Julho 2026",
    },
    {
        id: "reveillon-copacabana",
        title: "Réveillon Copacabana 2027",
        local: "Praia de Copacabana, Rio de Janeiro",
        hora: "22:00",
        dia: "31",
        mes: "Dezembro",
        qtd: 2,
        gradient: "linear-gradient(135deg,#1d4ed8 0%,#9333ea 55%,#f59e0b 100%)",
        datas: "31 de Dez 2026",
        mesAno: "Dezembro 2026",
    },
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
    {
        id: "verao",
        title: "Festival de Verão 2024",
        local: "Parque de Exposições, Salvador",
        hora: "16:00",
        dia: "27",
        mes: "Janeiro",
        qtd: 4,
        gradient: "linear-gradient(135deg,#0ea5e9 0%,#22c55e 100%)",
        datas: "27 de Jan 2024",
        mesAno: "Janeiro 2024",
    },
];

const SS = PROXIMOS.find((e) => e.comboId === "combo-sao-silvestre")!;
/** A São Silvestre tem o fluxo próprio da inscrição; os demais abrem a lista de ingressos do evento (dados em eventos.ts). */
const ehSaoSilvestre = (e: EventoCard) => e.comboId === "combo-sao-silvestre";
/** No perfil de um dependente: só os eventos com ingressos dele que essa conta pode acessar (como no app). */
const doPerfil = (lista: EventoCard[], perfil: PerfilAtivo | null) =>
    !perfil
        ? lista
        : lista.flatMap((e) => {
              const itens = perfil.carteira.find((c) => c.eventId === e.id)?.itens ?? [];
              return itens.length ? [{ ...e, qtd: itens.length }] : [];
          });

/** A São Silvestre é inscrição; os outros eventos têm ingressos. */
const contagem = (e: EventoCard) =>
    e.comboId ? `${e.qtd} ${e.qtd === 1 ? "inscrição" : "inscrições"}` : `${e.qtd} ${e.qtd === 1 ? "ingresso" : "ingressos"}`;

/* ------------------------------ Conteúdo ------------------------------ */

function CarteiraContent({ onCardClick, erro = false }: { onCardClick: (card: EventoCard) => void; erro?: boolean }) {
    const [tab, setTab] = useState<Tab>("proximos");
    const perfil = usePerfilAtivo();
    const doBanco = useCarteiraDoBanco();
    const cards = doPerfil(tab === "proximos" ? [...doBanco.proximos, ...PROXIMOS] : [...doBanco.anteriores, ...ANTERIORES], perfil);

    return (
        <div className="bg-primary text-primary">
            {/* Como no Figma ([Desktop] Carteira): coluna de 1144px, abas em largura total e grade de 3 cards */}
            <main className="mx-auto flex max-w-[1192px] flex-col gap-8 px-6 py-[60px]">
                <h1 className="text-3xl font-bold text-primary">Carteira de ingressos</h1>

                {/* Tabs */}
                <div className="flex gap-3 border-b border-secondary">
                    <TabButton icon={Ticket01} label="Vem aí" active={tab === "proximos"} onClick={() => setTab("proximos")} />
                    <TabButton icon={ClockRewind} label="Já passou" active={tab === "anteriores"} onClick={() => setTab("anteriores")} />
                </div>

                {cards.length === 0 && <SemIngressos nome={perfil?.nome} />}
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,360px))] gap-8">
                    {cards.map((card) => (
                        <EventoCardView
                            key={card.id}
                            card={card}
                            past={tab === "anteriores"}
                            erro={erro && card.comboId === "combo-sao-silvestre"}
                            onClick={() => onCardClick(card)}
                        />
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
            "-mb-px flex flex-1 items-center justify-center gap-1 border-b-2 px-0.5 pb-3 text-sm font-semibold transition duration-100 ease-linear",
            active ? "border-fg-brand-primary text-brand-secondary" : "border-transparent text-tertiary hover:text-secondary",
        )}
    >
        <Icon className={cx("size-4", active ? "text-fg-brand-primary" : "text-fg-quaternary")} />
        <span>{label}</span>
    </button>
);

const EventoCardView = ({ card, past, erro = false, onClick }: { card: EventoCard; past?: boolean; erro?: boolean; onClick?: () => void }) => {
    const escuro = !!card.gradient;
    const transferido = !!card.comboId && isTransferido(card.comboId);
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full flex-col overflow-hidden rounded-2xl bg-primary text-left ring-1 ring-border-secondary transition duration-100 ease-linear hover:-translate-y-0.5 hover:shadow-lg"
        >
            {/* Foto do evento (em cima) — altura explícita + degradê como SVG (export-safe) */}
            <div
                className={cx(
                    "relative h-44 w-full shrink-0 overflow-hidden",
                    !escuro && "flex items-center justify-center bg-secondary text-quaternary",
                    transferido && "grayscale",
                )}
            >
                {escuro ? <GradientFill gradient={card.gradient ?? ""} className="absolute inset-0 size-full" /> : <Package className="size-16" aria-hidden="true" />}
                {/* Inscrição transferida: esmaece a foto */}
                {transferido && <div className="absolute inset-0 bg-primary/40" />}

                {/* Tag de quantidade + badge de status (topo direito, sobre a imagem) */}
                <div className="absolute top-3 right-3 flex flex-wrap items-center justify-end gap-1.5">
                    <div className="flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                        <Ticket01 className="size-3.5" />
                        <span>{contagem(card)}</span>
                    </div>
                    {/* Status só quando pede atenção (no Figma o card não leva badge) */}
                    {past ? null : transferido ? (
                        <Badge size="sm" color="blue" type="pill-color">
                            Transferido
                        </Badge>
                    ) : erro ? (
                        <Badge size="sm" color="error" type="pill-color">
                            Formulário pendente
                        </Badge>
                    ) : null}
                </div>
            </div>

            {/* Informações (embaixo, fundo branco) */}
            <div className="flex flex-col gap-2 p-4">
                <p className="truncate text-md font-bold text-primary uppercase">{card.title}</p>
                <p className="flex items-center gap-2 text-md text-secondary">
                    <Calendar className="size-4 shrink-0 text-fg-quaternary" />
                    <span>{card.datas}</span>
                </p>
                <p className="flex items-center gap-2 text-sm text-tertiary">
                    <MarkerPin01 className="size-4 shrink-0 text-fg-quaternary" />
                    <span className="truncate">{card.local}</span>
                </p>
            </div>
        </button>
    );
};

/** Vazio (ex.: dependente sem ingressos nessa aba), com o texto do app. */
const SemIngressos = ({ nome }: { nome?: string }) => (
    <div className="flex flex-col items-center px-5 pt-12 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-fg-quaternary ring-1 ring-border-secondary">
            <Ticket01 className="size-6" />
        </span>
        <p className="mt-4 text-md font-semibold text-primary">Nenhum ingresso por aqui</p>
        {nome && <p className="mt-1 text-sm text-tertiary">Os ingressos de {nome.split(" ")[0]} aparecem aqui.</p>}
    </div>
);

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
        <span>{label}</span>
    </button>
);

/** Lista de eventos agrupada por mês (estilo app). */
function MobileEventList({ onEventClick }: { onEventClick: (card: EventoCard) => void }) {
    const [tab, setTab] = useState<Tab>("proximos");
    const perfil = usePerfilAtivo();
    const doBanco = useCarteiraDoBanco();
    const eventos = doPerfil(tab === "proximos" ? [...doBanco.proximos, ...PROXIMOS] : [...doBanco.anteriores, ...ANTERIORES], perfil);
    const grupos = [...new Set(eventos.map((e) => e.mesAno))].map((mes) => ({ mes, eventos: eventos.filter((e) => e.mesAno === mes) }));

    return (
        <div className="scrollbar-hide flex-1 overflow-y-auto bg-secondary">
            <h1 className="px-5 pt-6 pb-5 text-xl font-bold text-primary">Carteira</h1>

            <div className="flex px-5">
                <MobileTab icon={Ticket01} label="Vem aí" active={tab === "proximos"} onClick={() => setTab("proximos")} />
                <MobileTab icon={ClockRewind} label="Passados" active={tab === "anteriores"} onClick={() => setTab("anteriores")} />
            </div>
            <div className="h-px bg-border-secondary" />

            {grupos.length === 0 && <SemIngressos nome={perfil?.nome} />}

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
                                    {/* Mesma "foto" do app: retrato 72×96 com a cor do evento */}
                                    <div className="h-[96px] w-[72px] shrink-0 overflow-hidden rounded-xl">
                                        <GradientFill gradient={evento.gradient ?? ""} />
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                                        <p className="truncate text-sm font-bold text-primary">{evento.title}</p>
                                        <p className="text-sm font-medium text-secondary">{evento.datas}</p>
                                        <p className="truncate text-sm text-tertiary">{evento.local}</p>
                                        <p className="text-sm text-tertiary">{contagem(evento)}</p>
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
function MobileIngressos({ card, erro = false, onBack, onOpen }: { card: EventoCard; erro?: boolean; onBack: () => void; onOpen: () => void }) {
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

            <h1 className="px-5 pt-4 text-xl font-bold text-primary">{card.comboId === "combo-sao-silvestre" ? "Inscrição" : "Ingressos"}</h1>

            {/* Card do evento */}
            <div className="px-5 pt-5">
                <div className="flex gap-3 rounded-2xl bg-primary p-3 ring-1 ring-border-secondary">
                    <div className="size-24 shrink-0 overflow-hidden rounded-xl">
                        <GradientFill gradient={card.gradient ?? ""} />
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
                            ) : erro ? (
                                <Badge size="md" color="error" type="pill-color">
                                    Formulário pendente
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

/** Tela de reenvio do formulário da inscrição (cenário de erro) — usada no mobile e no desktop. */
function FormularioInscricao({ onBack, onSubmit }: { onBack: () => void; onSubmit: () => void }) {
    const perguntas = SAO_SILVESTRE.questionario;
    const [respostas, setRespostas] = useState<Record<string, string>>({});
    const ok = perguntas.every((q) => (respostas[q.pergunta] ?? "").trim() !== "");

    return (
        <div className="scrollbar-hide flex-1 overflow-y-auto bg-secondary">
            <div className="mx-auto w-full max-w-md px-5 pt-6">
                <button
                    type="button"
                    aria-label="Voltar"
                    onClick={onBack}
                    className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                >
                    <ArrowLeft className="size-5" />
                </button>
                <h1 className="pt-4 text-xl font-bold text-primary">Formulário</h1>
            </div>

            <div className="mx-auto w-full max-w-md px-5 pt-4 pb-8">
                <div className="rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                    <h2 className="text-md font-bold text-primary">Formulário da inscrição</h2>
                    <p className="mt-1 text-sm text-tertiary">Responda novamente para liberar e acessar seu ingresso.</p>

                    <div className="mt-4 flex flex-col gap-4">
                        {perguntas.map((q) => (
                            <Input
                                key={q.pergunta}
                                isRequired
                                label={q.pergunta}
                                placeholder="Sua resposta"
                                value={respostas[q.pergunta] ?? ""}
                                onChange={(v) => setRespostas((r) => ({ ...r, [q.pergunta]: v }))}
                            />
                        ))}
                    </div>

                    <Button size="lg" color="primary" className="mt-5 w-full rounded-lg" isDisabled={!ok} onClick={onSubmit}>
                        Enviar formulário
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* --------------------- Página + toggle de viewport --------------------- */

export function Carteira() {
    useForceLightTheme();
    useMarcaIngresse();
    const navigate = useNavigate();
    const [viewport] = useViewport();
    // Desktop: lista de eventos → tela de detalhe da inscrição → formulário (reenvio)
    const [desktopDetalhe, setDesktopDetalhe] = useState(false);
    const [desktopForm, setDesktopForm] = useState(false);
    // Mobile espelha o app: lista de eventos → listagem de ingressos → ingresso (detalhe) → formulário (reenvio)
    const [mobileScreen, setMobileScreen] = useState<"lista" | "ingressos" | "detalhe" | "formulario" | "editar-formulario">("lista");
    // Edição do formulário: modal no desktop, tela cheia no frame do celular.
    const [editandoFormulario, setEditandoFormulario] = useState<string | null>(null);
    // Cenário de erro: formulário não enviado corretamente
    const [erroFormulario, setErroFormulario] = useState(false);
    // Demais eventos (fora a São Silvestre): lista de ingressos do evento → detalhe. Vale para desktop e mobile.
    const [outro, setOutro] = useState<{ eventId: string; alvo?: Alvo } | null>(null);
    const perfilAtivo = usePerfilAtivo();
    // Onboarding dos perfis: para quem tem dependentes, na 1ª vez; pelo link /carteira-web/dependentes/onboarding, sempre
    const location = useLocation();
    const temDependentes = useDependentes().length > 0;
    const [onboardingPerfis, setOnboardingPerfis] = useState(false);
    useEffect(() => {
        const peloLink = location.pathname.endsWith("/dependentes/onboarding");
        let visto = false;
        try {
            visto = localStorage.getItem(ONBOARDING_PERFIS) === "1";
        } catch {
            /* sem storage: trata como não visto */
        }
        if (!peloLink && (visto || !temDependentes || perfilAtivo)) return;
        const t = setTimeout(() => setOnboardingPerfis(true), 600);
        return () => clearTimeout(t);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const fecharOnboardingPerfis = () => {
        try {
            localStorage.setItem(ONBOARDING_PERFIS, "1");
        } catch {
            /* ignora */
        }
        setOnboardingPerfis(false);
    };
    const eventoBase = getEvento(outro?.eventId);
    const eventoOutro = eventoBase && paraOPerfil(eventoBase, perfilAtivo);
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [outro, desktopDetalhe, desktopForm]);
    const abrirCard = (card: EventoCard) => {
        if (!ehSaoSilvestre(card)) return setOutro({ eventId: card.id });
        if (viewport === "desktop") setDesktopDetalhe(true);
        else setMobileScreen("ingressos");
    };
    const telaOutro =
        outro && eventoOutro ? (
            outro.alvo ? (
                <DetalheEvento evento={eventoOutro} alvo={outro.alvo} onBack={() => setOutro({ eventId: outro.eventId })} />
            ) : (
                <EventoIngressos
                    evento={eventoOutro}
                    compact={viewport === "mobile"}
                    onBack={() => setOutro(null)}
                    onAbrir={(alvo) => setOutro({ eventId: outro.eventId, alvo })}
                />
            )
        ) : null;

    // Cenário de erro só faz sentido dentro do evento da São Silvestre
    const naSaoSilvestre = !telaOutro && (viewport === "desktop" ? desktopDetalhe || desktopForm : mobileScreen !== "lista");

    return (
        <div className={cx("min-h-screen", viewport === "mobile" ? "bg-secondary" : "bg-primary")}>
            {/* Controles do protótipo: barra flutuante no canto inferior direito; o erro no formulário entra nela só na São Silvestre */}
            <ControlesPrototipo
                voltar={{ label: "Produtos", onClick: () => navigate("/") }}
                extra={
                    naSaoSilvestre && (
                        <button
                            type="button"
                            onClick={() => setErroFormulario((v) => !v)}
                            aria-pressed={erroFormulario}
                            className={cx(
                                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition duration-100 ease-linear",
                                erroFormulario ? "bg-error-primary text-error-primary" : "text-tertiary hover:bg-secondary hover:text-secondary",
                            )}
                        >
                            <AlertTriangle className="size-4" />
                            <span>Erro no formulário</span>
                        </button>
                    )
                }
            />

            {viewport === "desktop" && <SiteHeader />}

            {/* Área de preview. No mobile real (telas pequenas) o frame de 390px é
               dispensado e fica full-bleed; o frame só aparece em telas grandes
               (sm+) para simular o celular durante o preview no desktop. */}
            <div className={cx(viewport === "mobile" && "py-10 sm:px-4")}>
                <div
                    className={cx(
                        "mx-auto",
                        viewport === "mobile"
                            ? "relative flex h-[calc(100dvh-5rem)] w-full flex-col overflow-hidden bg-secondary sm:h-[820px] sm:max-h-[85vh] sm:w-[390px] sm:max-w-full sm:rounded-3xl sm:shadow-xl sm:ring-1 sm:ring-border-secondary"
                            : "w-full bg-primary",
                    )}
                >
                    {viewport === "mobile" && <SiteHeader compact />}
                    {telaOutro ? (
                        telaOutro
                    ) : viewport === "desktop" ? (
                        desktopForm ? (
                            <FormularioInscricao
                                onBack={() => setDesktopForm(false)}
                                onSubmit={() => {
                                    setErroFormulario(false);
                                    setDesktopForm(false);
                                }}
                            />
                        ) : desktopDetalhe ? (
                            <DesktopDetalhe
                                onBack={() => setDesktopDetalhe(false)}
                                onTransfer={(combo) => navigate("/carteira-web/transferir", { state: { viewport, comboId: combo.id } })}
                                erro={erroFormulario}
                                onResponderFormulario={() => setDesktopForm(true)}
                                onEditarFormulario={(combo) => setEditandoFormulario(combo.id)}
                            />
                        ) : (
                            <CarteiraContent onCardClick={abrirCard} erro={erroFormulario} />
                        )
                    ) : mobileScreen === "lista" ? (
                        <MobileEventList onEventClick={abrirCard} />
                    ) : mobileScreen === "ingressos" ? (
                        <MobileIngressos card={SS} erro={erroFormulario} onBack={() => setMobileScreen("lista")} onOpen={() => setMobileScreen("detalhe")} />
                    ) : mobileScreen === "editar-formulario" ? (
                        <EditarFormularioMobile comboId={SAO_SILVESTRE.combos[0].id} onBack={() => setMobileScreen("detalhe")} />
                    ) : mobileScreen === "formulario" ? (
                        <FormularioInscricao
                            onBack={() => setMobileScreen("detalhe")}
                            onSubmit={() => {
                                setErroFormulario(false);
                                setMobileScreen("detalhe");
                            }}
                        />
                    ) : (
                        <MobileComboView
                            ev={SAO_SILVESTRE}
                            combo={SAO_SILVESTRE.combos[0]}
                            titular={SAO_SILVESTRE.titular}
                            cpf={SAO_SILVESTRE.cpf}
                            onClose={() => setMobileScreen("ingressos")}
                            onTransfer={(combo) => navigate("/carteira-web/transferir", { state: { viewport, comboId: combo.id } })}
                            erro={erroFormulario}
                            onResponderFormulario={() => setMobileScreen("formulario")}
                            onEditarFormulario={() => setMobileScreen("editar-formulario")}
                        />
                    )}
                    <WebToast ancora={viewport === "mobile" ? "frame" : "janela"} />
                    <PerfisOnboarding
                        aberto={onboardingPerfis}
                        compact={viewport === "mobile"}
                        onFechar={fecharOnboardingPerfis}
                        onAcessar={() => {
                            fecharOnboardingPerfis();
                            navigate("/carteira-web/dependentes");
                        }}
                    />
                </div>
            </div>

            <EditarFormularioModal
                isOpen={editandoFormulario !== null}
                comboId={editandoFormulario ?? SAO_SILVESTRE.combos[0].id}
                onClose={() => setEditandoFormulario(null)}
            />
        </div>
    );
}
