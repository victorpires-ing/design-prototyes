import { useMemo, useState } from "react";
import { getLocalTimeZone, endOfWeek, startOfWeek, today } from "@internationalized/date";
import { ChevronRight } from "@untitledui/icons";
import { useLocale, type DateValue } from "react-aria-components";
import { DateRangePicker } from "@/components/application/date-picker/date-range-picker";
import { Select } from "@/components/base/select/select";
import { cx } from "@/utils/cx";
import { Footer, HeaderNav } from "../components/SiteChrome";
import { useCidade } from "../data/cidade-store";

/* ------------------------------------------------------------------ */
/*  Mock                                                              */
/* ------------------------------------------------------------------ */

type Genero = "show" | "festival" | "candlelight";

interface Evento {
    id: string;
    titulo: string;
    /** Data ISO (início) — usada para ordenar. */
    data: string;
    dataLabel: string;
    local: string;
    cidade: string;
    preco: number;
    seed: string;
    genero: Genero;
    tags: string[];
    popularidade: number;
}

// Tags soltas (folksonomia) — refinam a descoberta.
const TAGS = ["rock", "mpb", "sertanejo", "eletrônica", "pop", "gospel", "ao ar livre", "intimista"];

const EVENTOS: Evento[] = [
    { id: "e1", titulo: "Tributo a Frank Sinatra e Louis Armstrong", data: "2025-10-03", dataLabel: "03 out – 10 dez", local: "Cine Theatro Brasil", cidade: "Belo Horizonte", preco: 86.5, seed: "jazz1", genero: "show", tags: ["mpb", "intimista"], popularidade: 920 },
    { id: "e2", titulo: "The Jazz Room: New Orleans", data: "2025-08-08", dataLabel: "08 ago", local: "Cine Theatro Brasil", cidade: "Belo Horizonte", preco: 82.5, seed: "jazz2", genero: "show", tags: ["mpb", "intimista"], popularidade: 880 },
    { id: "e3", titulo: "Candlelight: Coldplay vs Imagine Dragons", data: "2025-08-16", dataLabel: "16 ago", local: "Palácio das Artes", cidade: "Belo Horizonte", preco: 120, seed: "candle1", genero: "candlelight", tags: ["pop", "intimista"], popularidade: 990 },
    { id: "e4", titulo: "Candlelight: Tributo a Lana Del Rey", data: "2025-08-23", dataLabel: "23 ago", local: "Palácio das Artes", cidade: "Belo Horizonte", preco: 110, seed: "candle2", genero: "candlelight", tags: ["pop", "intimista"], popularidade: 760 },
    { id: "e5", titulo: "Festival de Inverno", data: "2025-08-30", dataLabel: "30 ago", local: "Esplanada do Mineirão", cidade: "Belo Horizonte", preco: 180, seed: "fest1", genero: "festival", tags: ["rock", "pop", "ao ar livre"], popularidade: 1020 },
    { id: "e6", titulo: "Sertanejo na Praça", data: "2025-08-24", dataLabel: "24 ago", local: "Praça da Estação", cidade: "Belo Horizonte", preco: 0, seed: "sert1", genero: "show", tags: ["sertanejo", "ao ar livre"], popularidade: 540 },
    { id: "e7", titulo: "Rock in Roof", data: "2025-08-22", dataLabel: "22 ago", local: "Mirante Vivo", cidade: "São Paulo", preco: 95, seed: "rock1", genero: "show", tags: ["rock", "ao ar livre"], popularidade: 700 },
    { id: "e8", titulo: "Candlelight: Era dos Clássicos", data: "2025-08-29", dataLabel: "29 ago", local: "Teatro Santander", cidade: "São Paulo", preco: 130, seed: "candle3", genero: "candlelight", tags: ["intimista"], popularidade: 810 },
    { id: "e9", titulo: "Festival MPB ao Pôr do Sol", data: "2025-09-06", dataLabel: "06 set", local: "Parque Ibirapuera", cidade: "São Paulo", preco: 140, seed: "fest2", genero: "festival", tags: ["mpb", "ao ar livre"], popularidade: 770 },
    { id: "e10", titulo: "Noite Eletrônica", data: "2025-08-23", dataLabel: "23 ago", local: "Audio", cidade: "São Paulo", preco: 100, seed: "ele1", genero: "show", tags: ["eletrônica"], popularidade: 650 },
    { id: "e11", titulo: "Louvor & Adoração", data: "2025-08-31", dataLabel: "31 ago", local: "Arena Hall", cidade: "Curitiba", preco: 70, seed: "gospel1", genero: "show", tags: ["gospel"], popularidade: 480 },
    { id: "e12", titulo: "Festival de Verão", data: "2025-09-13", dataLabel: "13 set", local: "Parque Barigui", cidade: "Curitiba", preco: 160, seed: "fest3", genero: "festival", tags: ["pop", "rock", "ao ar livre"], popularidade: 590 },
    { id: "e13", titulo: "Candlelight: Tributo ao Queen", data: "2025-09-20", dataLabel: "20 set", local: "Teatro Castro Alves", cidade: "Salvador", preco: 125, seed: "candle4", genero: "candlelight", tags: ["rock", "intimista"], popularidade: 720 },
    { id: "e14", titulo: "Pôr do Sol Sertanejo", data: "2025-09-27", dataLabel: "27 set", local: "Casa da Música", cidade: "Salvador", preco: 60, seed: "sert2", genero: "show", tags: ["sertanejo"], popularidade: 410 },
];

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const HOJE = today(getLocalTimeZone());

type Intervalo = { start: DateValue; end: DateValue } | null;
const mesmoIntervalo = (a: Intervalo, b: { start: DateValue; end: DateValue }) =>
    !!a && a.start.toString() === b.start.toString() && a.end.toString() === b.end.toString();

/* ------------------------------------------------------------------ */
/*  Página                                                            */
/* ------------------------------------------------------------------ */

export function Categorias() {
    const cidade = useCidade();
    const { locale } = useLocale();

    const [tagsSel, setTagsSel] = useState<Set<string>>(new Set());
    const [periodo, setPeriodo] = useState<Intervalo>(null);
    const [ordem, setOrdem] = useState<string>("proxima");

    const estaSemana = { start: startOfWeek(HOJE, locale), end: endOfWeek(HOJE, locale) };
    const fimDeSemana = { start: endOfWeek(HOJE, locale).subtract({ days: 1 }), end: endOfWeek(HOJE, locale) };

    const toggleTag = (t: string) =>
        setTagsSel((prev) => {
            const next = new Set(prev);
            if (next.has(t)) next.delete(t);
            else next.add(t);
            return next;
        });

    const eventos = useMemo(() => {
        const tags = [...tagsSel];
        const lista = EVENTOS.filter((ev) => {
            if (ev.cidade !== cidade) return false;
            if (tags.length && !tags.some((t) => ev.tags.includes(t))) return false;
            return true;
        });
        return lista.sort((a, b) => (ordem === "distante" ? b.data.localeCompare(a.data) : a.data.localeCompare(b.data)));
    }, [cidade, tagsSel, ordem]);

    return (
        <div className="min-h-screen bg-primary text-primary">
            <HeaderNav />

            <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-tertiary">
                    <a href="#" className="font-medium text-secondary underline-offset-2 hover:underline">{cidade}</a>
                    <ChevronRight className="size-4 text-fg-quaternary" />
                    <span>Shows</span>
                </nav>

                {/* Título + descrição — no lugar das antigas subtabs */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-display-xs font-bold text-primary lg:text-display-sm">Shows em {cidade}</h1>
                    <p className="text-sm text-tertiary">Descubra os melhores shows e turnês de artistas em {cidade}, compre seus ingressos na Ingresse e curta!</p>
                </div>


                

                {/* Filtros de data + ordenação/contagem */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <DateRangePicker value={periodo} onChange={setPeriodo} />
                        <FiltroChip ativo={mesmoIntervalo(periodo, fimDeSemana)} onClick={() => setPeriodo(mesmoIntervalo(periodo, fimDeSemana) ? null : fimDeSemana)}>
                            Este fim de semana
                        </FiltroChip>
                        <FiltroChip ativo={mesmoIntervalo(periodo, estaSemana)} onClick={() => setPeriodo(mesmoIntervalo(periodo, estaSemana) ? null : estaSemana)}>
                            Esta semana
                        </FiltroChip>
                    </div>

                    <div className="flex items-center justify-between gap-4 lg:justify-end">
                        <span className="text-sm text-tertiary">
                            <span className="font-semibold text-primary tabular-nums">{eventos.length}</span> {eventos.length === 1 ? "experiência" : "experiências"}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="hidden text-sm text-tertiary sm:inline">Ordenar por</span>
                            <Select
                                aria-label="Ordenar por"
                                size="sm"
                                selectedKey={ordem}
                                onSelectionChange={(k: React.Key) => setOrdem(String(k))}
                                items={[
                                    { id: "proxima", label: "Data mais próxima" },
                                    { id: "distante", label: "Data mais distante" },
                                ]}
                                className="w-48"
                            >
                                {(item: { id: string; label: string }) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                            </Select>
                        </div>
                    </div>
                </div>

                                {/* Tags (folksonomia) — acima dos filtros de data */}
                <div className="flex flex-wrap gap-2">
                    {TAGS.map((t) => {
                        const ativa = tagsSel.has(t);
                        return (
                            <button
                                key={t}
                                type="button"
                                onClick={() => toggleTag(t)}
                                aria-pressed={ativa}
                                className={cx(
                                    "rounded-full px-3 py-1.5 text-sm font-medium transition duration-100 ease-linear",
                                    ativa ? "bg-brand-solid text-white" : "bg-primary text-secondary ring-1 ring-border-secondary hover:bg-primary_hover",
                                )}
                            >
                                #{t}
                            </button>
                        );
                    })}
                </div>

                {/* Grid / vazio */}
                {eventos.length === 0 ? (
                    <EmptyEventos />
                ) : (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        {eventos.map((ev) => (
                            <EventoCard key={ev.id} evento={ev} />
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Subcomponentes                                                    */
/* ------------------------------------------------------------------ */

function FiltroChip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={ativo}
            className={cx(
                "rounded-full border px-4 py-2 text-sm font-semibold transition duration-100 ease-linear",
                ativo ? "border-brand bg-brand-primary text-brand-secondary" : "border-border-secondary text-secondary hover:bg-primary_hover",
            )}
        >
            {children}
        </button>
    );
}

function EventoCard({ evento }: { evento: Evento }) {
    return (
        <a
            href="/novo-site/home/event-details"
            className="group flex flex-col overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary transition duration-100 ease-linear hover:ring-brand"
        >
            <div className="aspect-[3/4] overflow-hidden">
                <img
                    src={`https://picsum.photos/seed/${evento.seed}/400/520`}
                    alt=""
                    aria-hidden="true"
                    className="size-full object-cover transition duration-300 ease-out group-hover:scale-105"
                />
            </div>
            <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="flex flex-wrap gap-1">
                    {evento.tags.slice(0, 2).map((t) => (
                        <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-tertiary">
                            #{t}
                        </span>
                    ))}
                </div>
                <h3 className="line-clamp-2 text-sm font-bold text-primary">{evento.titulo}</h3>
                <p className="text-xs text-tertiary">
                    {evento.dataLabel}
                    <br />
                    {evento.local} · {evento.cidade}
                </p>
                <span className="mt-auto text-sm font-semibold text-primary">
                    {evento.preco === 0 ? "Gratuito" : `A partir de ${currency.format(evento.preco)}`}
                </span>
            </div>
        </a>
    );
}

function EmptyEventos() {
    return (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-secondary/40 px-6 py-16 text-center ring-1 ring-border-secondary">
            <h3 className="text-md font-semibold text-primary">Nenhuma experiência por aqui</h3>
            <p className="text-sm text-tertiary">Tente remover tags ou ajustar o período e a cidade.</p>
        </div>
    );
}
