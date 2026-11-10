import { type ReactNode, type RefObject, useContext, useEffect, useRef } from "react";
import { Calendar as CalendarIcon, Clock } from "@untitledui/icons";
import type { DatePickerProps as AriaDatePickerProps, DateValue, TimeValue } from "react-aria-components";
import {
    Button as AriaButton,
    DateInput as AriaDateInput,
    DatePicker as AriaDatePicker,
    DatePickerStateContext,
    DateSegment as AriaDateSegment,
    Dialog as AriaDialog,
    Group as AriaGroup,
    Label as AriaLabel,
    Popover as AriaPopover,
    TimeField as AriaTimeField,
} from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { HintText } from "@/components/base/input/hint-text";
import { Label } from "@/components/base/input/label";
import { Surgir } from "@/components/foundations/transicao";
import { cx } from "@/utils/cx";
import { Calendar } from "./calendar";

/* ------------------------------------------------------------------ */
/*  Data e hora com calendário (UI-FRM-001)                            */
/*                                                                     */
/*  - Clicar em qualquer ponto do campo abre o calendário e o foco     */
/*    FICA no campo: dá para digitar a data, e o foco segue para a     */
/*    hora como num campo comum. O calendário acompanha o que é        */
/*    digitado.                                                        */
/*  - Clicar num dia do calendário leva o foco para o horário, logo    */
/*    abaixo dos dias. "Aplicar" fecha.                                */
/*  - Pelo teclado, Tab entra nos segmentos sem abrir nada; Alt+↓ ou o */
/*    botão abrem o calendário. Esc fecha.                             */
/*  - O popover tem a largura do campo, inclusive no celular.          */
/* ------------------------------------------------------------------ */

/** Textos do componente. Padrão em pt-BR; passe a versão do idioma da pessoa (UI-TXT-009). */
export interface TextosDateTimePicker {
    abrirCalendario: string;
    calendario: string;
    horario: string;
    aplicar: string;
}

const TEXTOS_PADRAO: TextosDateTimePicker = { abrirCalendario: "Abrir calendário", calendario: "Calendário", horario: "Horário", aplicar: "Aplicar" };

interface DateTimePickerProps extends AriaDatePickerProps<DateValue> {
    label?: string;
    hint?: ReactNode;
    className?: string;
    textos?: Partial<TextosDateTimePicker>;
}

const segmento = (isPlaceholder: boolean, type: string) =>
    cx(
        "rounded px-0.5 text-primary tabular-nums caret-transparent focus:bg-brand-solid focus:font-medium focus:text-white focus:outline-hidden",
        isPlaceholder && "text-placeholder uppercase",
        type === "literal" && "text-fg-quaternary",
    );

/** Altura aproximada do calendário com o horário, para decidir se cabe abaixo do campo. */
const ESPACO_DO_CALENDARIO = 480;

/** Campo inteiro clicável: um clique (de mouse ou toque) abre o calendário sem tirar o foco do campo. */
const GrupoDoCampo = ({ campoRef, popoverRef, children }: { campoRef: RefObject<HTMLDivElement | null>; popoverRef: RefObject<HTMLElement | null>; children: ReactNode }) => {
    const state = useContext(DatePickerStateContext);
    const alvo = useRef<HTMLElement | null>(null);

    // Ao abrir pelo clique, o popover puxa o foco para dentro; nos primeiros instantes, devolve ao
    // segmento clicado para a pessoa digitar a data.
    useEffect(() => {
        if (!state?.isOpen || !alvo.current) return;
        const segmentoAlvo = alvo.current;
        const devolver = (e: FocusEvent) => {
            if (popoverRef.current?.contains(e.target as Node)) segmentoAlvo.focus();
        };
        document.addEventListener("focusin", devolver, true);
        const fim = setTimeout(() => {
            document.removeEventListener("focusin", devolver, true);
            alvo.current = null;
        }, 400);
        requestAnimationFrame(() => segmentoAlvo.focus());
        return () => {
            clearTimeout(fim);
            document.removeEventListener("focusin", devolver, true);
        };
    }, [state?.isOpen]);

    // O popover não é modal (o foco precisa ficar no campo), então fechar ao clicar fora é daqui.
    useEffect(() => {
        if (!state?.isOpen) return;
        const fora = (e: PointerEvent) => {
            const alvo = e.target as Node;
            if (!campoRef.current?.contains(alvo) && !popoverRef.current?.contains(alvo)) state.close();
        };
        document.addEventListener("pointerdown", fora, true);
        return () => document.removeEventListener("pointerdown", fora, true);
    }, [state?.isOpen]);

    return (
        <div
            ref={campoRef}
            // Margem para a barra do topo no celular quando o campo sobe.
            className="w-full scroll-mt-24"
            // Captura: os segmentos tratam o toque e não deixam o clique subir.
            // `detail` é 0 quando o clique vem do teclado: aí só o foco vai para o segmento.
            onClickCapture={(e) => {
                if (e.detail === 0 || state?.isOpen) return;
                alvo.current = (e.target as HTMLElement).closest<HTMLElement>('[role="spinbutton"]') ?? campoRef.current?.querySelector<HTMLElement>('[role="spinbutton"]') ?? null;
                // Sem espaço para o calendário abaixo (comum no celular), sobe o campo antes de abrir:
                // o popover não modal fecha com a rolagem, então a rolagem vem primeiro.
                const caixa = campoRef.current?.getBoundingClientRect();
                if (caixa && window.innerHeight - caixa.bottom < ESPACO_DO_CALENDARIO) {
                    campoRef.current?.scrollIntoView({ block: "start" });
                    requestAnimationFrame(() => state?.open());
                } else state?.open();
            }}
            onKeyDown={(e) => {
                if (e.key === "Escape" && state?.isOpen) state.close();
            }}
        >
            <AriaGroup
                className={({ isFocusWithin, isInvalid, isDisabled }) =>
                    cx(
                        "relative flex w-full cursor-pointer items-center rounded-lg bg-primary shadow-xs ring-1 ring-primary transition-shadow duration-100 ease-linear ring-inset",
                        (isFocusWithin || state?.isOpen) && "ring-2 ring-brand",
                        isInvalid && "ring-error_subtle",
                        isInvalid && isFocusWithin && "ring-2 ring-error",
                        isDisabled && "cursor-not-allowed bg-disabled_subtle",
                    )
                }
            >
                {children}
            </AriaGroup>
        </div>
    );
};

/** Rodapé do calendário: horário e confirmação. */
const Horario = ({ textos }: { textos: TextosDateTimePicker }) => {
    const state = useContext(DatePickerStateContext);
    const horaRef = useRef<HTMLDivElement>(null);
    const dia = state?.dateValue?.toString().slice(0, 10);

    // Escolheu um dia no calendário: o foco passa para a hora.
    useEffect(() => {
        if (!dia || !document.activeElement?.closest('[role="grid"]')) return;
        horaRef.current?.querySelector<HTMLElement>('[role="spinbutton"]')?.focus();
    }, [dia]);

    if (!state) return null;
    const completo = !!state.dateValue && !!state.timeValue;
    return (
        <div className="flex items-end gap-3 border-t border-secondary pt-4">
            <AriaTimeField
                hourCycle={24}
                granularity="minute"
                value={state.timeValue as TimeValue | null}
                onChange={(v) => v && state.setTimeValue(v)}
                className="flex min-w-0 flex-1 flex-col gap-1.5"
            >
                <AriaLabel className="text-sm font-medium text-secondary">{textos.horario}</AriaLabel>
                <div
                    ref={horaRef}
                    className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 shadow-xs ring-1 ring-primary ring-inset focus-within:ring-2 focus-within:ring-brand"
                >
                    <Clock className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                    <AriaDateInput className="flex flex-1 text-md">
                        {(s) => <AriaDateSegment segment={s} className={segmento(s.isPlaceholder, s.type)} />}
                    </AriaDateInput>
                </div>
            </AriaTimeField>
            <Button size="md" color="primary" isDisabled={!completo} onClick={() => state.close()}>
                {textos.aplicar}
            </Button>
        </div>
    );
};

export function DateTimePicker({ label, hint, className, textos: textosProp, ...props }: DateTimePickerProps) {
    const textos = { ...TEXTOS_PADRAO, ...textosProp };
    const campoRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLElement>(null);

    return (
        <AriaDatePicker
            // Escolher o dia não fecha: o horário vem logo abaixo e "Aplicar" confirma.
            shouldCloseOnSelect={false}
            {...props}
            className={cx("group flex h-max w-full flex-col items-start justify-start gap-1.5", className)}
        >
            {({ isInvalid }) => (
                <>
                    {label && (
                        <Label isRequired={props.isRequired} isInvalid={isInvalid}>
                            {label}
                        </Label>
                    )}

                    <GrupoDoCampo campoRef={campoRef} popoverRef={popoverRef}>
                        <AriaDateInput className="flex w-full py-2 pr-1 pl-3 text-md">
                            {(s) => <AriaDateSegment segment={s} className={segmento(s.isPlaceholder, s.type)} />}
                        </AriaDateInput>
                        <AriaButton
                            aria-label={textos.abrirCalendario}
                            className="mr-1 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-fg-quaternary outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:outline-2"
                        >
                            <CalendarIcon className="size-5" />
                        </AriaButton>
                    </GrupoDoCampo>

                    <Surgir visivel={!!hint} gap={6} className="w-full">
                        <HintText isInvalid={isInvalid}>{hint}</HintText>
                    </Surgir>

                    <AriaPopover
                        ref={popoverRef}
                        // Não modal: o foco pode ficar no campo enquanto o calendário está aberto.
                        isNonModal
                        // Passar o foco do calendário de volta para o campo não fecha.
                        shouldCloseOnInteractOutside={(el) => !campoRef.current?.contains(el)}
                        offset={6}
                        placement="bottom start"
                        // Mesma largura do campo (no celular, o campo é a referência).
                        className={({ isEntering, isExiting }) =>
                            cx(
                                "w-(--trigger-width) min-w-[288px] overflow-y-auto rounded-2xl origin-(--trigger-anchor-point) will-change-transform",
                                isEntering && "duration-150 ease-out animate-in fade-in placement-bottom:slide-in-from-top-0.5 motion-reduce:animate-none",
                                isExiting && "duration-100 ease-in animate-out fade-out motion-reduce:animate-none",
                            )
                        }
                    >
                        <AriaDialog
                            // O calendário leva o nome do campo, sem montar frase.
                            aria-label={label ?? textos.calendario}
                            className={cx(
                                "flex flex-col gap-4 rounded-2xl bg-primary p-4 shadow-xl ring ring-secondary_alt outline-hidden",
                                // A grade do calendário ocupa a largura do popover: colunas iguais, dia redondo no centro.
                                "[&_table]:w-full [&_table]:table-fixed [&_th>div]:w-full [&_[role=gridcell]>div]:h-10 [&_[role=gridcell]>div]:w-full [&_[role=gridcell]>div>div]:mx-auto [&_[role=gridcell]>div>div]:size-10",
                            )}
                        >
                            {/* Sem a linha de data digitada do Calendar: o próprio campo é a entrada digitável. */}
                            <Calendar>
                                <></>
                            </Calendar>
                            <Horario textos={textos} />
                        </AriaDialog>
                    </AriaPopover>
                </>
            )}
        </AriaDatePicker>
    );
}
