import { useRef, useState } from "react";
import { getLocalTimeZone, parseDate, today, type CalendarDate } from "@internationalized/date";
import type { DateValue, RangeValue } from "react-aria-components";
import { DateRangePicker as AriaDateRangePicker, Dialog as AriaDialog, Group as AriaGroup, Popover as AriaPopover } from "react-aria-components";
import { RangeCalendar } from "@/components/application/date-picker/range-calendar";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";

/*
 * Quando o evento acontece, no jeito de passagem de ida e volta (EVT-88): primeiro o intervalo de
 * dias num calendário de dois meses (o RangeCalendar do DS), depois os horários de início e de fim.
 * Valores em ISO local `AAAA-MM-DDTHH:mm`, como o resto do formulário.
 */

const HORA_INICIO_PADRAO = "20:00";

/**
 * O relógio do campo de hora é o ícone nativo do navegador: sem `color-scheme`, ele fica escuro
 * sobre o fundo escuro. Dizer o tema ao navegador deixa o ícone com contraste nos dois (EVT-88).
 */
export const HORA_COM_CONTRASTE = "[color-scheme:light] dark:[color-scheme:dark]";

const dia = (iso: string) => iso.slice(0, 10);
const hora = (iso: string) => iso.slice(11, 16);
const juntar = (d: string, h: string) => (d && h ? `${d}T${h}` : d ? `${d}T${h || HORA_INICIO_PADRAO}` : "");

/** Fim sugerido para um intervalo novo: no mesmo dia, 4 h depois (até 23:59); em dias diferentes, o mesmo horário do início. */
function horaFimSugerida(inicioDia: string, fimDia: string, horaInicio: string) {
    if (inicioDia !== fimDia) return horaInicio;
    const [h, m] = horaInicio.split(":").map(Number);
    const minutos = Math.min(h * 60 + m + 240, 23 * 60 + 59);
    return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** Data de um dia do calendário: o número vem da célula e o mês e o ano, do rótulo da grade ("novembro de 2026"). */
function dataDaCelula(celula: Element): CalendarDate | null {
    const [mes, , ano] = (celula.closest('[role="grid"]')?.getAttribute("aria-label") ?? "").toLowerCase().split(" ");
    const m = MESES.indexOf(mes) + 1;
    const d = Number(celula.textContent?.trim());
    if (!m || !d || !Number(ano)) return null;
    return parseDate(`${ano}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
}

const formatarDia = (d: CalendarDate | string) => {
    const data = typeof d === "string" ? new Date(`${d}T12:00`) : d.toDate(getLocalTimeZone());
    return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "numeric", month: "short" }).format(data).replace(/\./g, "");
};

interface PeriodoDoEventoProps {
    inicio: string;
    fim: string;
    onChange: (inicio: string, fim: string) => void;
    erroInicio?: string;
    erroFim?: string;
}

export function PeriodoDoEvento({ inicio, fim, onChange, erroInicio, erroFim }: PeriodoDoEventoProps) {
    const valor: RangeValue<DateValue> | null = inicio && fim ? { start: parseDate(dia(inicio)), end: parseDate(dia(fim)) } : null;
    // Rascunho do calendário: só vale ao aplicar, como na escolha de ida e volta.
    const [rascunho, setRascunho] = useState<RangeValue<DateValue> | null>(valor);
    // Primeiro clique sem o segundo: o calendário de intervalo não confirma nada sozinho, então guardamos
    // o dia clicado. Aplicar só com ele vale como evento de um dia (EVT-88).
    const [diaUnico, setDiaUnico] = useState<DateValue | null>(null);
    // Já houve o primeiro clique e falta o segundo.
    const ancorado = useRef(false);
    // O último toque foi num dia do calendário. Com o primeiro dia marcado, o calendário fecha o
    // intervalo até o dia sob o cursor quando se toca fora dele (no Aplicar, por exemplo): esse
    // fechamento não é escolha da pessoa e é ignorado, e Aplicar vale como um dia só.
    const tocouNoDia = useRef(false);

    /** Toque (ou Enter/Espaço) num dia: o primeiro marca o dia único; o segundo fecha o intervalo. */
    const marcarDia = (alvo: EventTarget) => {
        const celula = (alvo as HTMLElement).closest?.('[role="gridcell"]');
        tocouNoDia.current = !!celula;
        if (!celula || celula.getAttribute("aria-disabled") === "true") return;
        if (ancorado.current) {
            ancorado.current = false;
            return;
        }
        const data = dataDaCelula(celula);
        if (!data) return;
        ancorado.current = true;
        setDiaUnico(data);
    };
    const [aberto, setAberto] = useState(false);

    const aplicar = () => {
        const intervalo = diaUnico ? { start: diaUnico, end: diaUnico } : rascunho;
        if (!intervalo) return;
        const d1 = intervalo.start.toString();
        const d2 = intervalo.end.toString();
        const h1 = hora(inicio) || HORA_INICIO_PADRAO;
        // Horário de fim já escolhido continua; senão, a sugestão.
        const h2 = hora(fim) && valor && d1 === dia(inicio) && d2 === dia(fim) ? hora(fim) : horaFimSugerida(d1, d2, h1);
        onChange(juntar(d1, h1), juntar(d2, h2));
        setAberto(false);
    };

    const resumo = valor ? (dia(inicio) === dia(fim) ? formatarDia(dia(inicio)) : `${formatarDia(dia(inicio))} até ${formatarDia(dia(fim))}`) : null;
    const instrucao = diaUnico
        ? `${formatarDia(diaUnico as CalendarDate)}, um dia só. Para um período, clique no último dia.`
        : !rascunho
        ? "Clique no primeiro e depois no último dia do evento"
        : rascunho.start.compare(rascunho.end) === 0
          ? `${formatarDia(rascunho.start as CalendarDate)}, evento de um dia só`
          : `${formatarDia(rascunho.start as CalendarDate)} até ${formatarDia(rascunho.end as CalendarDate)}`;

    return (
        <div className="flex flex-col gap-4">
            <AriaDateRangePicker
                aria-label="Dias do evento"
                shouldCloseOnSelect={false}
                minValue={today(getLocalTimeZone())}
                value={rascunho}
                onChange={(v) => {
                    // Fechado por um toque fora dos dias: não é o segundo dia, fica o dia único.
                    if (!tocouNoDia.current) {
                        // O calendário soltou o primeiro dia: o próximo toque num dia recomeça.
                        ancorado.current = false;
                        return;
                    }
                    // Segundo clique num dia: o intervalo está completo.
                    setRascunho(v);
                    setDiaUnico(null);
                }}
                isOpen={aberto}
                onOpenChange={(a) => {
                    setAberto(a);
                    if (a) {
                        setRascunho(valor);
                        setDiaUnico(null);
                        ancorado.current = false;
                    }
                }}
                isInvalid={!!erroInicio && !inicio}
                className="flex flex-col gap-1.5"
            >
                <span className="text-sm font-medium text-secondary">
                    Dias do evento <span className="text-brand-tertiary">*</span>
                </span>
                <AriaGroup>
                    <Button
                        size="md"
                        color="secondary"
                        className={cx("w-full justify-start", !!erroInicio && !inicio && "ring-error_subtle")}
                    >
                        {resumo ? <span className="inline-block first-letter:uppercase">{resumo}</span> : <span className="text-placeholder">Escolha o primeiro e o último dia</span>}
                    </Button>
                </AriaGroup>
                {erroInicio && !inicio && <p className="text-sm text-error-primary">{erroInicio}</p>}
                <AriaPopover
                    placement="bottom start"
                    offset={8}
                    className={({ isEntering, isExiting }) =>
                        cx("z-50 will-change-transform", isEntering && "duration-150 ease-out animate-in fade-in", isExiting && "duration-100 ease-in animate-out fade-out")
                    }
                >
                    <AriaDialog
                        aria-label="Escolher os dias do evento"
                        onPointerDownCapture={(e) => marcarDia(e.target)}
                        onKeyDownCapture={(e) => (e.key === "Enter" || e.key === " " ? marcarDia(e.target) : undefined)} className="flex max-w-[calc(100vw-1rem)] flex-col overflow-auto rounded-2xl bg-primary shadow-xl ring ring-secondary_alt focus:outline-hidden">
                        {/* Primeiro clique marca a ida; o segundo, a volta. Valor e mínimo vêm do picker. */}
                        {/* Toques capturados no diálogo: o dia do calendário para a propagação (usePress). */}
                        <RangeCalendar />
                        {/* Sem quebra de linha: o texto muda a cada clique e não pode empurrar os botões (o clique em Aplicar se perdia). */}
                        <div className="flex items-center gap-3 border-t border-secondary p-4">
                            <p className="min-w-0 flex-1 text-sm text-secondary first-letter:uppercase" aria-live="polite">
                                {instrucao}
                            </p>
                            <div className="flex shrink-0 gap-3">
                                <Button size="sm" color="secondary" onClick={() => setAberto(false)}>
                                    Cancelar
                                </Button>
                                <Button size="sm" color="primary" isDisabled={!rascunho && !diaUnico} onClick={aplicar}>
                                    Aplicar
                                </Button>
                            </div>
                        </div>
                    </AriaDialog>
                </AriaPopover>
            </AriaDateRangePicker>

            {/* Os horários vêm depois dos dias, como na passagem: escolhe o dia, depois a hora. */}
            {valor && (
                <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                        label={`Começa às (${formatarDia(dia(inicio))})`}
                        type="time"
                        inputClassName={HORA_COM_CONTRASTE}
                        isRequired
                        value={hora(inicio)}
                        onChange={(h) => onChange(juntar(dia(inicio), h), fim)}
                        isInvalid={!!erroInicio && !!inicio}
                        hint={inicio ? erroInicio : undefined}
                    />
                    <Input
                        label={`Termina às (${formatarDia(dia(fim))})`}
                        type="time"
                        inputClassName={HORA_COM_CONTRASTE}
                        isRequired
                        value={hora(fim)}
                        onChange={(h) => onChange(inicio, juntar(dia(fim), h))}
                        isInvalid={!!erroFim}
                        hint={erroFim}
                    />
                </div>
            )}
        </div>
    );
}
