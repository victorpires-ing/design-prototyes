import { useState } from "react";
import { CalendarPlus01, Plus, XClose } from "@untitledui/icons";
import { Heading as AriaHeading } from "react-aria-components";
import { parseDate } from "@internationalized/date";
import { Calendar } from "@/components/application/date-picker/calendar";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { CloseButton } from "@/components/base/buttons/close-button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { HORA_COM_CONTRASTE } from "./periodo-do-evento";

/*
 * Cronograma de sessões (EVT-89). Nada é criado sozinho: cada sessão é adicionada pela pessoa, com
 * dia, horário de início e de fim, e um dia pode ter mais de uma. As sessões aparecem em cartões
 * por dia (dia da semana e data), com os horários embaixo. Só existe com o evento em mais de um
 * dia (EVT-88).
 */

/** A partir de quantos dias o dia da sessão se escolhe num calendário, em vez de cartões (EVT-89). */
const DIAS_PARA_CALENDARIO = 10;

export interface SessaoExtra {
    id: number;
    /** Início, ISO local `AAAA-MM-DDTHH:mm`. */
    valor: string;
    /** Horário de fim `HH:mm`, no mesmo dia (ou no dia seguinte, se for antes do início). */
    fim: string;
}

const diasEntre = (inicio: string, fim: string) => {
    const dias: string[] = [];
    const d = new Date(`${inicio.slice(0, 10)}T12:00`);
    const ultimo = new Date(`${fim.slice(0, 10)}T12:00`);
    while (d <= ultimo) {
        dias.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
        d.setDate(d.getDate() + 1);
    }
    return dias;
};

const semana = (d: string) => new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(new Date(`${d}T12:00`)).replace(".", "");
/** "13 Nov". */
const diaMes = (d: string) => {
    const [dia, , mes] = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" }).format(new Date(`${d}T12:00`)).replace(/\./g, "").split(" ");
    return `${dia} ${mes.charAt(0).toUpperCase()}${mes.slice(1)}`;
};

/** O evento tem mais de um dia: só então existe cronograma (EVT-88). */
export const temCronograma = (inicio: string, fim: string) => !!inicio && !!fim && inicio.slice(0, 10) !== fim.slice(0, 10);

/** Cartão de dia no formato do anexo: dia da semana em cima, data em destaque. */
function CabecaDoDia({ d }: { d: string }) {
    return (
        <>
            <span className="text-sm text-tertiary first-letter:uppercase">{semana(d)}</span>
            <span className="text-lg font-semibold text-primary">{diaMes(d)}</span>
        </>
    );
}

interface CronogramaProps {
    inicio: string;
    fim: string;
    sessoes: SessaoExtra[];
    onChange: (sessoes: SessaoExtra[]) => void;
    /** Vocabulário: "sessão" ou "largada" (evento esportivo). */
    item: string;
}

export function CronogramaDeSessoes({ inicio, fim, sessoes, onChange, item }: CronogramaProps) {
    const dias = diasEntre(inicio, fim);
    const [adicionando, setAdicionando] = useState(false);
    const plural = item === "sessão" ? "sessões" : "largadas";
    const porDia = dias.map((d) => ({ d, lista: sessoes.filter((s) => s.valor.slice(0, 10) === d).sort((a, b) => a.valor.localeCompare(b.valor)) })).filter((x) => x.lista.length > 0);

    return (
        <div className="flex flex-col gap-4">
            <ul className="flex flex-wrap gap-3" aria-label={`${plural.charAt(0).toUpperCase()}${plural.slice(1)} por dia`}>
                    {porDia.map(({ d, lista }) => (
                        <li key={d} className="flex min-w-32 flex-col items-center gap-2 rounded-xl bg-primary px-3 py-3 text-center ring-1 ring-secondary ring-inset">
                            <CabecaDoDia d={d} />
                            {/* Horários embaixo da data; um dia pode ter mais de uma. */}
                            <ul className="flex w-full flex-col gap-1">
                                {lista.map((s) => (
                                    <li key={s.id} className="flex items-center justify-center gap-1 rounded-md bg-secondary py-0.5 pr-0.5 pl-2 text-sm font-medium text-secondary tabular-nums">
                                        <span className="flex-1">
                                            {s.valor.slice(11, 16)} às {s.fim}
                                        </span>
                                        <ButtonUtility
                                            icon={XClose}
                                            size="xs"
                                            color="tertiary"
                                            tooltip={`Remover ${item} das ${s.valor.slice(11, 16)}`}
                                            onClick={() => onChange(sessoes.filter((x) => x.id !== s.id))}
                                        />
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                    {/* Adicionar no mesmo formato dos cartões de dia, no fim da lista (EVT-89). */}
                    <li className="flex">
                        <button
                            type="button"
                            onClick={() => setAdicionando(true)}
                            className="flex min-h-24 min-w-32 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-primary bg-primary px-3 py-3 text-center transition duration-100 ease-linear hover:bg-primary_hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                        >
                            <Plus className="size-5 text-fg-quaternary" aria-hidden="true" />
                            <span className="text-sm font-semibold text-secondary">{`Adicionar ${item}`}</span>
                        </button>
                    </li>
                </ul>

            {/* Criar a sessão abre um modal (EVT-89). */}
            {adicionando && (
                <NovaSessao
                    dias={dias}
                    item={item}
                    horaPadrao={inicio.slice(11, 16)}
                    existentes={sessoes}
                    onCancelar={() => setAdicionando(false)}
                    onAdicionar={(s) => {
                        onChange([...sessoes, s]);
                        setAdicionando(false);
                    }}
                />
            )}
        </div>
    );
}

/** Uma sessão nova: escolhe o dia (cartões), depois o horário de início e de fim. */
function NovaSessao({
    dias,
    item,
    horaPadrao,
    existentes,
    onCancelar,
    onAdicionar,
}: {
    dias: string[];
    item: string;
    horaPadrao: string;
    existentes: SessaoExtra[];
    onCancelar: () => void;
    onAdicionar: (s: SessaoExtra) => void;
}) {
    // Evento de um dia: o dia já vem escolhido e a escolha some (EVT-89).
    const umDia = dias.length === 1;
    const [dia, setDia] = useState<string | null>(umDia ? dias[0] : null);
    const [comeca, setComeca] = useState(horaPadrao || "20:00");
    const [termina, setTermina] = useState("");
    const [tentou, setTentou] = useState(false);
    const repetida = !!dia && existentes.some((s) => s.valor === `${dia}T${comeca}`);
    const erro = !dia ? "Escolha o dia." : !comeca || !termina ? "Informe o horário de início e de fim." : termina === comeca ? "O fim precisa ser diferente do início." : repetida ? `Já existe uma ${item} nesse dia e horário.` : null;

    const adicionar = () => {
        setTentou(true);
        if (erro || !dia) return;
        onAdicionar({ id: Date.now(), valor: `${dia}T${comeca}`, fim: termina });
    };

    return (
        <ModalOverlay isOpen onOpenChange={(aberto) => !aberto && onCancelar()} isDismissable>
            <Modal className="sm:max-w-[560px]">
                <Dialog>
                    <div className="relative flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <CloseButton size="sm" label="Fechar" onPress={onCancelar} className="absolute top-4 right-4" />
                        <div className="flex gap-4 pr-8">
                            <FeaturedIcon icon={CalendarPlus01} color="gray" theme="modern" size="md" className="max-sm:hidden" />
                            <div className="flex flex-col gap-0.5">
                                <AriaHeading slot="title" className="text-lg font-semibold text-primary">
                                    {`Nova ${item}`}
                                </AriaHeading>
                                <p className="text-sm text-tertiary">
                                    {umDia ? `${semana(dias[0]).charAt(0).toUpperCase()}${semana(dias[0]).slice(1)}, ${diaMes(dias[0])}. Escolha os horários de início e de fim.` : "Escolha o dia e os horários de início e de fim."}
                                </p>
                            </div>
                        </div>
                        <div className={cx("flex flex-col gap-2", umDia && "hidden")}>
                            <span className="text-sm font-medium text-secondary" id="nova-sessao-dia">
                                Dia
                            </span>
                            {dias.length >= DIAS_PARA_CALENDARIO ? (
                                // Período longo: calendário do DS na largura toda, só com os dias do evento liberados; dias com sessão ficam marcados.
                                <div className="w-full rounded-xl bg-primary p-4 ring-1 ring-secondary ring-inset [&_table]:w-full [&_table]:table-fixed [&_td>*]:mx-auto [&_th>div]:mx-auto">
                                    <Calendar
                                        aria-labelledby="nova-sessao-dia"
                                        minValue={parseDate(dias[0])}
                                        maxValue={parseDate(dias[dias.length - 1])}
                                        value={dia ? parseDate(dia) : null}
                                        defaultFocusedValue={parseDate(dias[0])}
                                        onChange={(v) => v && setDia(v.toString())}
                                        highlightedDates={[...new Set(existentes.map((x) => x.valor.slice(0, 10)))].map((d) => parseDate(d))}
                                    >
                                        <p className="text-sm text-tertiary" aria-live="polite">
                                            {dia ? `${semana(dia).charAt(0).toUpperCase()}${semana(dia).slice(1)}, ${diaMes(dia)}` : "Escolha um dia do período do evento."}
                                        </p>
                                    </Calendar>
                                </div>
                            ) : (
                            <div className="flex flex-wrap gap-3" role="radiogroup" aria-labelledby="nova-sessao-dia">
                                    {dias.map((d) => {
                                        const escolhido = dia === d;
                                        return (
                                            <button
                                                key={d}
                                                type="button"
                                                role="radio"
                                                aria-checked={escolhido}
                                                onClick={() => setDia(d)}
                                                className={cx(
                                                    "flex w-28 cursor-pointer flex-col items-center rounded-xl px-3 py-3 ring-1 transition duration-100 ease-linear ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                                                    escolhido ? "bg-active ring-2 ring-brand" : "bg-primary ring-secondary hover:bg-primary_hover",
                                                )}
                                            >
                                                <CabecaDoDia d={d} />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input label="Começa às" type="time" isRequired value={comeca} onChange={setComeca} inputClassName={HORA_COM_CONTRASTE} />
                            <Input
                                label="Termina às"
                                type="time"
                                isRequired
                                value={termina}
                                onChange={setTermina}
                                inputClassName={HORA_COM_CONTRASTE}
                                hint={termina && comeca && termina < comeca ? "Termina no dia seguinte." : undefined}
                            />
                        </div>
                        {tentou && erro && <p className="text-sm text-error-primary">{erro}</p>}
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Button color="secondary" size="md" onClick={onCancelar}>
                                Cancelar
                            </Button>
                            <Button color="primary" size="md" onClick={adicionar}>
                                {`Adicionar ${item}`}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
