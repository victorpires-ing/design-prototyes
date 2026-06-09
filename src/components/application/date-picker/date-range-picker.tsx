import { useMemo, useState } from "react";
import { endOfMonth, endOfWeek, getLocalTimeZone, startOfMonth, startOfWeek, today } from "@internationalized/date";
import { useControlledState } from "@react-stately/utils";
import { Calendar as CalendarIcon } from "@untitledui/icons";
import { useDateFormatter } from "react-aria";
import type { DateRangePickerProps as AriaDateRangePickerProps, DateValue } from "react-aria-components";
import { DateRangePicker as AriaDateRangePicker, Dialog as AriaDialog, Group as AriaGroup, Popover as AriaPopover, useLocale } from "react-aria-components";
import { Button, type ButtonProps } from "@/components/base/buttons/button";
import { InputDateBase } from "@/components/base/input/input-date";
import { cx } from "@/utils/cx";
import { RangeCalendar, RangePresetButton } from "./range-calendar";

const now = today(getLocalTimeZone());

const highlightedDates = [today(getLocalTimeZone())];

type RangePreset = { label: string; value: { start: DateValue; end: DateValue } };

interface DateRangePickerProps extends AriaDateRangePickerProps<DateValue> {
    size?: ButtonProps["size"];
    /** The function to call when the apply button is clicked. */
    onApply?: () => void;
    /** The function to call when the cancel button is clicked. */
    onCancel?: () => void;
    /** Custom presets shown on the left. Falls back to the generic presets when omitted. */
    presets?: Record<string, RangePreset>;
}

export const DateRangePicker = ({ value: valueProp, defaultValue, onChange, onApply, onCancel, presets: presetsProp, size = "sm", ...props }: DateRangePickerProps) => {
    const { locale } = useLocale();
    const formatter = useDateFormatter({
        month: "short",
        day: "numeric",
        year: "numeric",
    });
    const [value, setValue] = useControlledState(valueProp, defaultValue || null, onChange);
    const [focusedValue, setFocusedValue] = useState<DateValue | null>(null);

    const formattedStartDate = value?.start ? formatter.format(value.start.toDate(getLocalTimeZone())) : "Selecione a data";
    const formattedEndDate = value?.end ? formatter.format(value.end.toDate(getLocalTimeZone())) : "Selecione a data";

    const defaultPresets = useMemo(
        () => ({
            today: { label: "Hoje", value: { start: now, end: now } },
            yesterday: { label: "Ontem", value: { start: now.subtract({ days: 1 }), end: now.subtract({ days: 1 }) } },
            thisWeek: { label: "Esta semana", value: { start: startOfWeek(now, locale), end: endOfWeek(now, locale) } },
            lastWeek: {
                label: "Semana passada",
                value: {
                    start: startOfWeek(now, locale).subtract({ weeks: 1 }),
                    end: endOfWeek(now, locale).subtract({ weeks: 1 }),
                },
            },
            thisMonth: { label: "Este mês", value: { start: startOfMonth(now), end: endOfMonth(now) } },
            lastMonth: {
                label: "Mês passado",
                value: {
                    start: startOfMonth(now).subtract({ months: 1 }),
                    end: endOfMonth(now).subtract({ months: 1 }),
                },
            },
            thisYear: { label: "Este ano", value: { start: startOfMonth(now.set({ month: 1 })), end: endOfMonth(now.set({ month: 12 })) } },
            lastYear: {
                label: "Ano passado",
                value: {
                    start: startOfMonth(now.set({ month: 1 }).subtract({ years: 1 })),
                    end: endOfMonth(now.set({ month: 12 }).subtract({ years: 1 })),
                },
            },
            allTime: {
                label: "Todo o período",
                value: {
                    start: now.set({ year: 2000, month: 1, day: 1 }),
                    end: now,
                },
            },
        }),
        [locale],
    );

    const presets = presetsProp ?? defaultPresets;
    // Presets exibidos como chips no calendário (mobile) — no máx. 3 para não estourar a largura.
    const calendarPresets = useMemo(() => Object.fromEntries(Object.entries(presets).slice(0, 3)), [presets]);

    return (
        <AriaDateRangePicker aria-label="Date range picker" shouldCloseOnSelect={false} {...props} value={value} onChange={setValue}>
            <AriaGroup>
                <Button size={size} color="secondary" iconLeading={CalendarIcon}>
                    {!value ? <span className="text-placeholder">Selecione as datas</span> : `${formattedStartDate} – ${formattedEndDate}`}
                </Button>
            </AriaGroup>
            <AriaPopover
                placement="bottom right"
                offset={8}
                className={({ isEntering, isExiting }) =>
                    cx(
                        "z-50 origin-(--trigger-anchor-point) will-change-transform",
                        isEntering &&
                            "duration-150 ease-out animate-in fade-in placement-right:slide-in-from-left-0.5 placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5",
                        isExiting &&
                            "duration-100 ease-in animate-out fade-out placement-right:slide-out-to-left-0.5 placement-top:slide-out-to-bottom-0.5 placement-bottom:slide-out-to-top-0.5",
                    )
                }
            >
                <AriaDialog
                    aria-label="Date range picker"
                    className="flex max-w-[calc(100vw-1rem)] overflow-auto rounded-2xl bg-primary shadow-xl ring ring-secondary_alt focus:outline-hidden"
                >
                    {({ close }) => (
                        <>
                            <div className="hidden w-38 flex-col gap-0.5 border-r border-solid border-secondary p-3 lg:flex">
                                {Object.values(presets).map((preset) => (
                                    <RangePresetButton
                                        key={preset.label}
                                        value={preset.value}
                                        onClick={() => {
                                            setValue(preset.value);
                                            setFocusedValue(preset.value.start);
                                        }}
                                    >
                                        {preset.label}
                                    </RangePresetButton>
                                ))}
                            </div>
                            <div className="flex flex-col">
                                <RangeCalendar
                                    focusedValue={focusedValue}
                                    onFocusChange={setFocusedValue}
                                    highlightedDates={highlightedDates}
                                    presets={calendarPresets}
                                />
                                <div className="flex justify-between gap-3 border-t border-secondary p-4">
                                    <div className="hidden items-center gap-2 md:flex">
                                        <InputDateBase slot="start" size="sm" />
                                        <div className="text-md text-quaternary">–</div>
                                        <InputDateBase slot="end" size="sm" />
                                    </div>
                                    <div className="grid w-full grid-cols-2 gap-3 md:flex md:w-auto">
                                        <Button
                                            size="sm"
                                            color="secondary"
                                            onClick={() => {
                                                onCancel?.();
                                                close();
                                            }}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            size="sm"
                                            color="primary"
                                            onClick={() => {
                                                onApply?.();
                                                close();
                                            }}
                                        >
                                            Aplicar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </AriaDialog>
            </AriaPopover>
        </AriaDateRangePicker>
    );
};
