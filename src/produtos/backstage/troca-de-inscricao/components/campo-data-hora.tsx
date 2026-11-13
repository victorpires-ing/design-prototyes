import { useRef } from "react";
import { CalendarDateTime, getLocalTimeZone, today } from "@internationalized/date";
import { Calendar as CalendarIcon, XClose } from "@untitledui/icons";
import type { DateValue } from "react-aria-components";
import { Button as AriaButton, DatePicker as AriaDatePicker, Dialog as AriaDialog, Popover as AriaPopover } from "react-aria-components";
import { Calendar } from "@/components/application/date-picker/calendar";
import { Button } from "@/components/base/buttons/button";
import { HintText } from "@/components/base/input/hint-text";
import { InputDateBase } from "@/components/base/input/input-date";
import { Label } from "@/components/base/input/label";
import { cx } from "@/utils/cx";

export const tsParaData = (ts: number | null) => {
    if (ts == null) return null;
    const d = new Date(ts);
    return new CalendarDateTime(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes());
};
export const dataParaTs = (v: DateValue | null) => (v ? v.toDate(getLocalTimeZone()).getTime() : null);

interface CampoDataHoraProps {
    label: string;
    value: DateValue | null;
    onChange: (v: DateValue | null) => void;
    erro?: string;
    hint?: string;
    /** Último dia que pode ser escolhido no calendário. */
    max?: DateValue;
}

/**
 * Data e hora num campo só (UI-FRM-008). Composto do DS: segmentos do InputDate, calendário do
 * DatePicker e botão de limpar. O horário é digitado no próprio campo.
 */
export function CampoDataHora({ label, value, onChange, erro, hint, max }: CampoDataHoraProps) {
    const antes = useRef(value);
    return (
        <AriaDatePicker
            aria-label={label}
            granularity="minute"
            hourCycle={24}
            hideTimeZone
            shouldForceLeadingZeros
            shouldCloseOnSelect={false}
            onOpenChange={(aberto) => {
                if (aberto) antes.current = value;
            }}
            value={value}
            onChange={onChange}
            isInvalid={!!erro}
            minValue={today(getLocalTimeZone())}
            maxValue={max}
            placeholderValue={new CalendarDateTime(today(getLocalTimeZone()).year, today(getLocalTimeZone()).month, today(getLocalTimeZone()).day, 8, 0)}
            className="group flex flex-col gap-1.5"
        >
            <Label isInvalid={!!erro}>{label}</Label>
            <div className="relative">
                <InputDateBase size="md" isInvalid={!!erro} wrapperClassName="pr-16" tooltipClassName="hidden" />
                <div className="absolute inset-y-0 right-2 flex items-center gap-0.5">
                    {value && (
                        <AriaButton
                            slot={null}
                            aria-label={`Limpar ${label}`}
                            onPress={() => onChange(null)}
                            className="rounded-md p-1 text-fg-quaternary outline-focus-ring hover:text-fg-quaternary_hover focus-visible:outline-2"
                        >
                            <XClose className="size-4" aria-hidden="true" />
                        </AriaButton>
                    )}
                    <AriaButton aria-label={`Abrir calendário de ${label}`} className="rounded-md p-1 text-fg-quaternary outline-focus-ring hover:text-fg-quaternary_hover focus-visible:outline-2">
                        <CalendarIcon className="size-4" aria-hidden="true" />
                    </AriaButton>
                </div>
            </div>
            {(erro || hint) && <HintText isInvalid={!!erro}>{erro || hint}</HintText>}
            <AriaPopover
                offset={8}
                placement="bottom end"
                className={({ isEntering, isExiting }) =>
                    cx(isEntering && "duration-150 ease-out motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-0.5", isExiting && "duration-100 ease-in animate-out fade-out")
                }
            >
                <AriaDialog aria-label={`Calendário de ${label}`} className="rounded-2xl bg-primary shadow-xl ring ring-secondary_alt outline-hidden">
                    {({ close }) => (
                        <>
                            <div className="flex px-6 py-5">
                                <Calendar>
                                    <p className="text-sm text-tertiary">Escolha o dia. O horário você digita no campo.</p>
                                </Calendar>
                            </div>
                            <div className="grid grid-cols-2 gap-3 border-t border-secondary p-4">
                                <Button
                                    size="md"
                                    color="secondary"
                                    onClick={() => {
                                        onChange(antes.current);
                                        close();
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button size="md" color="primary" onClick={close}>
                                    Aplicar
                                </Button>
                            </div>
                        </>
                    )}
                </AriaDialog>
            </AriaPopover>
        </AriaDatePicker>
    );
}
