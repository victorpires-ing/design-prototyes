import { Moon01, Sun, XClose } from "@untitledui/icons";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { Select } from "@/components/base/select/select";
import { Toggle } from "@/components/base/toggle/toggle";
import { useTheme } from "@/providers/theme-provider";
import { cx } from "@/utils/cx";
import { VIBE_LIST, gradientCss, type VibeId } from "./gradient-families";

export type EventStatus = "venda-ativa" | "soldout-sem-lista" | "soldout-com-lista" | "aguardando-abertura";

/** Classificação indicativa (ClassInd) — cores e textos oficiais. */
export const CLASSIFICACOES: { id: string; label: string; cor: string; legenda: string }[] = [
    { id: "L", label: "Livre", cor: "#1f9d55", legenda: "livre" },
    { id: "10", label: "10 anos", cor: "#1d70b8", legenda: "anos" },
    { id: "12", label: "12 anos", cor: "#f2c200", legenda: "anos" },
    { id: "14", label: "14 anos", cor: "#f08200", legenda: "anos" },
    { id: "16", label: "16 anos", cor: "#e3000f", legenda: "anos" },
    { id: "18", label: "18 anos", cor: "#000000", legenda: "anos" },
];

export interface EventConfig {
    nomeEvento: string;
    classificacao: string;
    localNome: string;
    localEndereco: string;
    preco: string;
    /** Datas no formato ISO (yyyy-mm-dd). */
    dataInicio: string;
    dataFim: string;
    horarioTipo: "fixo" | "varios";
    horarioFixo: string;
    temLineup: boolean;
    lineupComHorario: boolean;
    status: EventStatus;
    /** Datas (chaves ISO) marcadas como esgotadas. */
    esgotadas: string[];
    /** Família de gradiente (energia) que veste a página. */
    vibe: VibeId;
    /** URL de vídeo de fundo do hero (blend duotone). Vazio = animação de palavras. */
    heroVideoUrl: string;
    /** URL do banner/pôster. Vazio = pôster padrão. Usado também na cor "From image". */
    bannerUrl: string;
}

export const defaultEventConfig: EventConfig = {
    nomeEvento: "Turnê Dominguinho - Recife",
    classificacao: "16",
    localNome: "Classic Hall - Olinda",
    localEndereco: "Av. Gov. Agamenon Magalhães, S/N - Salgadinho, Olinda - PE, 53110-710, Brasil",
    preco: "R$ 3.000,00",
    dataInicio: "2025-12-19",
    dataFim: "2025-12-22",
    horarioTipo: "varios",
    horarioFixo: "20h",
    temLineup: true,
    lineupComHorario: true,
    status: "venda-ativa",
    esgotadas: [],
    vibe: "from-image",
    heroVideoUrl: "",
    bannerUrl: "",
};

export const STATUS_LABELS: Record<EventStatus, string> = {
    "venda-ativa": "Venda ativa",
    "soldout-sem-lista": "Sold-out sem lista de espera",
    "soldout-com-lista": "Sold-out com lista de espera",
    "aguardando-abertura": "Aguardando abertura",
};

/* ---- Helpers de data ---- */

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MONTHS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MONTHS_LONG = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

const parseISO = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
};

const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function formatLongDate(iso: string): string {
    if (!iso) return "";
    const dt = parseISO(iso);
    if (isNaN(dt.getTime())) return "";
    return `${dt.getDate()} de ${MONTHS_LONG[dt.getMonth()]}`;
}

export interface DiaEvento {
    iso: string;
    weekday: string;
    day: string;
    month: string;
}

/** Enumera os dias entre o início e o fim (inclusive), gerados a partir do intervalo. */
export function enumerateDays(startISO: string, endISO: string): DiaEvento[] {
    if (!startISO || !endISO) return [];
    const start = parseISO(startISO);
    const end = parseISO(endISO);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return [];

    const days: DiaEvento[] = [];
    const cur = new Date(start);
    let guard = 0;
    while (cur <= end && guard < 90) {
        days.push({
            iso: toISO(cur),
            weekday: WEEKDAYS[cur.getDay()],
            day: String(cur.getDate()).padStart(2, "0"),
            month: MONTHS_SHORT[cur.getMonth()],
        });
        cur.setDate(cur.getDate() + 1);
        guard++;
    }
    return days;
}

const isDarkTheme = (theme: string) =>
    theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

interface EventConfigSlideoutProps {
    isOpen: boolean;
    onClose: () => void;
    config: EventConfig;
    onChange: (config: EventConfig) => void;
}

export function EventConfigSlideout({ isOpen, onClose, config, onChange }: EventConfigSlideoutProps) {
    const { theme, setTheme } = useTheme();
    const isDark = isDarkTheme(theme);
    const dias = enumerateDays(config.dataInicio, config.dataFim);

    const set = <K extends keyof EventConfig>(key: K, value: EventConfig[K]) => onChange({ ...config, [key]: value });

    const toggleEsgotada = (iso: string, esgotado: boolean) =>
        set("esgotadas", esgotado ? [...config.esgotadas, iso] : config.esgotadas.filter((d) => d !== iso));

    return (
        <AriaModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => !open && onClose()}
            isDismissable
            className={({ isEntering, isExiting }) =>
                cx(
                    "fixed inset-0 z-50 flex justify-end bg-overlay/70 outline-hidden backdrop-blur-[2px]",
                    isEntering && "duration-300 ease-out animate-in fade-in",
                    isExiting && "duration-200 ease-in animate-out fade-out",
                )
            }
        >
            <AriaModal
                className={({ isEntering, isExiting }) =>
                    cx(
                        "h-full w-full max-w-[420px] bg-primary shadow-xl outline-hidden",
                        isEntering && "duration-300 ease-out animate-in slide-in-from-right",
                        isExiting && "duration-200 ease-in animate-out slide-out-to-right",
                    )
                }
            >
                <AriaDialog className="flex h-full flex-col outline-hidden">
                    {/* Header */}
                    <div className="flex shrink-0 items-start justify-between gap-4 border-b border-secondary px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                            <h2 className="text-md font-semibold text-primary">Configurar evento</h2>
                            <p className="text-sm text-tertiary">Ajuste as informações exibidas na página.</p>
                        </div>
                        <ButtonUtility size="sm" color="tertiary" icon={XClose} onClick={onClose} tooltip="Fechar" />
                    </div>

                    {/* Corpo */}
                    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
                        {/* Evento */}
                        <Section title="Evento">
                            <Input label="Nome do evento" value={config.nomeEvento} onChange={(v) => set("nomeEvento", v)} />
                            <Input
                                label="Banner (URL)"
                                hint="Imagem do pôster. Vazio usa o padrão. Também alimenta a cor “From image”."
                                placeholder="https://…/poster.jpg"
                                value={config.bannerUrl}
                                onChange={(v) => set("bannerUrl", v)}
                            />
                            <Select
                                label="Classificação indicativa"
                                selectedKey={config.classificacao}
                                onSelectionChange={(key) => key && set("classificacao", String(key))}
                                items={CLASSIFICACOES}
                            >
                                {(item) => (
                                    <Select.Item id={item.id} textValue={item.label}>
                                        <span className="flex items-center gap-2.5">
                                            <span
                                                className="grid size-5 shrink-0 place-items-center rounded-xs text-[10px] font-semibold text-white"
                                                style={{ backgroundColor: item.cor }}
                                            >
                                                {item.id === "L" ? "L" : item.id}
                                            </span>
                                            {item.label}
                                        </span>
                                    </Select.Item>
                                )}
                            </Select>
                            <Input
                                label="Vídeo de fundo (YouTube)"
                                hint="Cole o link do YouTube. O vídeo entra em duotone na família. Vazio usa a animação de palavras."
                                placeholder="https://www.youtube.com/watch?v=…"
                                value={config.heroVideoUrl}
                                onChange={(v) => set("heroVideoUrl", v)}
                            />
                        </Section>

                        {/* Energia (família de gradiente) */}
                        <Section title="Energia do evento">
                            <p className="-mt-1 text-sm text-tertiary">Define o gradiente que veste a página, conforme o gênero.</p>
                            <Select
                                label="Família de gradiente"
                                selectedKey={config.vibe}
                                onSelectionChange={(key) => key && set("vibe", key as VibeId)}
                                items={VIBE_LIST}
                            >
                                {(item) => (
                                    <Select.Item id={item.id} textValue={item.label} supportingText={item.generos}>
                                        <span className="flex items-center gap-2.5">
                                            <span
                                                className="size-5 shrink-0 rounded-full ring-1 ring-border-secondary"
                                                style={{ backgroundImage: gradientCss(item, 135) }}
                                            />
                                            {item.label}
                                        </span>
                                    </Select.Item>
                                )}
                            </Select>
                        </Section>

                        {/* Local */}
                        <Section title="Local">
                            <Input label="Nome do local" value={config.localNome} onChange={(v) => set("localNome", v)} />
                            <Input
                                label="Endereço"
                                hint="Usado no mapa de “Como chegar”."
                                value={config.localEndereco}
                                onChange={(v) => set("localEndereco", v)}
                            />
                        </Section>

                        {/* Preço */}
                        <Section title="Preço">
                            <Input label="A partir de" placeholder="Ex.: R$ 3.000,00" value={config.preco} onChange={(v) => set("preco", v)} />
                        </Section>

                        {/* Datas */}
                        <Section title="Datas">
                            <Input label="Início" type="date" value={config.dataInicio} onChange={(v) => set("dataInicio", v)} />
                            <Input label="Término" type="date" value={config.dataFim} onChange={(v) => set("dataFim", v)} />
                        </Section>

                        {/* Horários */}
                        <Section title="Horários">
                            <RadioGroup value={config.horarioTipo} onChange={(v) => set("horarioTipo", v as EventConfig["horarioTipo"])}>
                                <RadioButton value="fixo" label="Horário fixo" />
                                <RadioButton value="varios" label="Vários horários" />
                            </RadioGroup>
                            {config.horarioTipo === "fixo" && (
                                <Input label="Horário" placeholder="Ex.: 20h" value={config.horarioFixo} onChange={(v) => set("horarioFixo", v)} />
                            )}
                        </Section>

                        {/* Line-up */}
                        <Section title="Line-up">
                            <Toggle
                                size="sm"
                                label="Exibir line-up"
                                hint="Mostra a lista de atrações na página."
                                isSelected={config.temLineup}
                                onChange={(v) => set("temLineup", v)}
                            />
                            {config.temLineup && (
                                <Toggle
                                    size="sm"
                                    label="Exibir horário das atrações"
                                    hint="Mostra o horário ao lado das datas de cada atração."
                                    isSelected={config.lineupComHorario}
                                    onChange={(v) => set("lineupComHorario", v)}
                                />
                            )}
                        </Section>

                        {/* Disponibilidade — datas geradas a partir do intervalo */}
                        <Section title="Disponibilidade">
                            <p className="-mt-1 text-sm text-tertiary">Marque as datas esgotadas para sinalizar no card.</p>
                            {dias.length === 0 ? (
                                <p className="text-sm text-tertiary">Informe um intervalo de datas válido.</p>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {dias.map((d) => (
                                        <div key={d.iso} className="flex items-center justify-between gap-3 rounded-lg border border-secondary px-3 py-2">
                                            <span className="text-sm text-secondary">
                                                {d.weekday} • {d.day} {d.month}
                                            </span>
                                            <Toggle
                                                size="sm"
                                                aria-label={`Marcar ${d.day} ${d.month} como esgotado`}
                                                isSelected={config.esgotadas.includes(d.iso)}
                                                onChange={(v) => toggleEsgotada(d.iso, v)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Section>

                        {/* Status */}
                        <Section title="Status">
                            <RadioGroup value={config.status} onChange={(v) => set("status", v as EventStatus)}>
                                {(Object.keys(STATUS_LABELS) as EventStatus[]).map((s) => (
                                    <RadioButton key={s} value={s} label={STATUS_LABELS[s]} />
                                ))}
                            </RadioGroup>
                        </Section>

                        {/* Aparência */}
                        <Section title="Aparência">
                            <Toggle size="sm" label="Modo escuro" isSelected={isDark} onChange={(v) => setTheme(v ? "dark" : "light")} />
                            <span className="flex items-center gap-2 text-sm text-tertiary">
                                {isDark ? <Moon01 className="size-4" /> : <Sun className="size-4" />}
                                {isDark ? "Tema escuro ativo" : "Tema claro ativo"}
                            </span>
                        </Section>
                    </div>

                    {/* Footer */}
                    <div className="flex shrink-0 justify-end border-t border-secondary px-5 py-4">
                        <Button size="md" color="primary" onClick={onClose}>
                            Concluir
                        </Button>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-primary">{title}</h3>
            {children}
        </section>
    );
}
