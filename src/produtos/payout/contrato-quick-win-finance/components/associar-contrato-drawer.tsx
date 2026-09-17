import { useEffect, useState } from "react";
import {
    AlertTriangle,
    Building03,
    Calendar,
    Check,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Copy01,
    InfoCircle,
    Link03,
    SwitchHorizontal01,
    X,
    XCircle,
} from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { CONTRATOS, type Contrato, type Evento } from "../data/cashout";
import { CondicoesCompletas, ResumoComercial } from "./condicoes";
import { EventThumb } from "./event-thumb";
import { Btn, FieldLabel, SearchField, SelectField } from "./ui";

const SITUACOES = ["Todas", "Pode associar", "Não pode associar"];

/* ------------------------------------------------------------------ */
/*  Cabeçalho da marca — título, stepper e o evento em questão        */
/* ------------------------------------------------------------------ */

function Stepper({ step }: { step: 1 | 2 }) {
    return (
        <div className="flex items-center gap-3">
            <span className="flex shrink-0 items-center gap-2">
                <span
                    className={cx(
                        "grid size-5 place-items-center rounded-full text-[11px] font-semibold",
                        step === 1 ? "bg-white text-brand-secondary" : "text-white",
                    )}
                >
                    {step === 1 ? "1" : <Check className="size-4" aria-hidden="true" />}
                </span>
                <span className="text-[13px] font-semibold whitespace-nowrap text-white">Selecionar contrato</span>
            </span>

            <span className="h-px flex-1 bg-white/30" aria-hidden="true" />

            <span className="flex shrink-0 items-center gap-2">
                <span
                    className={cx(
                        "grid size-5 place-items-center rounded-full text-[11px] font-semibold",
                        step === 2 ? "bg-white text-brand-secondary" : "text-white/70 ring-1 ring-white/50 ring-inset",
                    )}
                >
                    2
                </span>
                <span className={cx("text-[13px] font-semibold whitespace-nowrap", step === 2 ? "text-white" : "text-white/70")}>
                    Revisar e confirmar
                </span>
            </span>
        </div>
    );
}

function DrawerHeader({ evento, step, onClose }: { evento: Evento; step: 1 | 2; onClose: () => void }) {
    return (
        <div className="flex shrink-0 flex-col gap-5 bg-brand-solid p-6">
            <div className="flex items-start gap-4">
                <span className="flex shrink-0 items-center rounded-xl bg-white/15 p-2.5 text-white">
                    <Link03 className="size-5" aria-hidden="true" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <h2 className="text-xl font-bold text-white">Associar contrato</h2>
                    <p className="text-[13px] text-white/80">Selecione o contrato que será vinculado a este evento</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fechar"
                    className="shrink-0 rounded-lg p-1 text-white/80 transition duration-100 ease-linear hover:bg-white/15 hover:text-white"
                >
                    <X className="size-5" aria-hidden="true" />
                </button>
            </div>

            <Stepper step={step} />

            <div className="flex items-center gap-3 rounded-xl bg-white/15 p-3">
                <EventThumb capa={evento.capa} nome={evento.nome} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-[15px] font-semibold text-white">{evento.nome}</span>
                    <span className="flex flex-wrap items-center gap-2 text-[13px] text-white/80">
                        <span className="flex items-center gap-1.5">
                            <Building03 className="size-3.5 shrink-0" aria-hidden="true" />
                            {evento.produtora}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="size-3.5 shrink-0" aria-hidden="true" />
                            {evento.data}
                        </span>
                    </span>
                </div>
                <span className="flex shrink-0 items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-[13px] font-semibold text-primary">
                    ID: {evento.id}
                    <Copy01 className="size-3.5 text-quaternary" aria-hidden="true" />
                </span>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Identidade e situação do contrato                                 */
/* ------------------------------------------------------------------ */

function IdentidadeContrato({ contrato }: { contrato: Contrato }) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-[15px] font-semibold text-primary">{contrato.nome}</span>
            <span className="flex flex-wrap items-center gap-2 text-[13px]">
                <span className="font-semibold text-primary">{contrato.produtora}</span>
                <span className="text-quaternary" aria-hidden="true">
                    ·
                </span>
                <span className="text-quaternary">
                    Contrato <span className="font-semibold text-secondary">{contrato.id}</span>
                </span>
            </span>
            <span className="flex flex-wrap items-center gap-2 text-[13px]">
                {contrato.podeAssociar ? (
                    <span className="flex items-center gap-1.5 font-medium text-utility-green-700">
                        <CheckCircle className="size-3.5 shrink-0" aria-hidden="true" />
                        Pode associar
                    </span>
                ) : (
                    <span className="flex items-center gap-1.5 font-medium text-utility-red-700">
                        <XCircle className="size-3.5 shrink-0" aria-hidden="true" />
                        Não pode associar
                    </span>
                )}
                <span className="text-quaternary" aria-hidden="true">
                    ·
                </span>
                <span className="text-quaternary">
                    {contrato.vigenciaPrefixo} <span className="font-semibold text-secondary">{contrato.vigenciaData}</span>
                </span>
            </span>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Step 1 — seleção                                                  */
/* ------------------------------------------------------------------ */

function CardContrato({
    contrato,
    selecionado,
    onSelecionar,
}: {
    contrato: Contrato;
    selecionado: boolean;
    onSelecionar: () => void;
}) {
    const [expandido, setExpandido] = useState(false);

    return (
        <div className="flex flex-col gap-3.5 p-5">
            <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                    <IdentidadeContrato contrato={contrato} />
                </div>
                <button
                    type="button"
                    onClick={contrato.podeAssociar ? onSelecionar : undefined}
                    disabled={!contrato.podeAssociar}
                    role="checkbox"
                    aria-checked={selecionado}
                    aria-label={`Selecionar contrato ${contrato.nome}`}
                    className={cx(
                        "grid size-5 shrink-0 place-items-center rounded-md border transition duration-100 ease-linear",
                        selecionado ? "border-brand bg-brand-solid text-white" : "border-primary bg-primary",
                        !contrato.podeAssociar && "cursor-not-allowed opacity-50",
                    )}
                >
                    {selecionado && <Check className="size-3.5" aria-hidden="true" />}
                </button>
            </div>

            {contrato.aviso && (
                <p className="flex items-start gap-2 text-[13px] text-utility-yellow-700">
                    <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                    {contrato.aviso}
                </p>
            )}

            {expandido ? <CondicoesCompletas condicoes={contrato.condicoes} /> : <ResumoComercial resumo={contrato.resumo} />}

            {expandido ? (
                <Btn icon={ChevronUp} onClick={() => setExpandido(false)} className="self-start">
                    Ocultar condições
                </Btn>
            ) : (
                <button
                    type="button"
                    onClick={() => setExpandido(true)}
                    className="flex items-center gap-1.5 self-start text-[13px] font-semibold text-brand-secondary transition duration-100 ease-linear hover:text-brand-secondary_hover"
                >
                    Ver todas as condições
                    <ChevronDown className="size-4" aria-hidden="true" />
                </button>
            )}
        </div>
    );
}

function StepSelecao({
    contratos,
    busca,
    onBusca,
    situacao,
    onSituacao,
    selecionadoId,
    onSelecionar,
}: {
    contratos: Contrato[];
    busca: string;
    onBusca: (valor: string) => void;
    situacao: string;
    onSituacao: (valor: string) => void;
    selecionadoId?: string;
    onSelecionar: (id: string) => void;
}) {
    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                    <FieldLabel>Buscar por</FieldLabel>
                    <SearchField placeholder="Nome, ID do contrato ou produtora" value={busca} onChange={onBusca} />
                </div>
                <div className="flex w-full flex-col gap-2.5 sm:w-[230px]">
                    <FieldLabel>Situação</FieldLabel>
                    <SelectField value={situacao} onChange={onSituacao} options={SITUACOES} />
                </div>
            </div>

            <div className="flex items-center justify-between gap-4">
                <FieldLabel>Contratos encontrados</FieldLabel>
                <span className="shrink-0 rounded-md bg-secondary px-2 py-1 text-xs font-semibold tracking-[0.6px] text-quaternary uppercase">
                    {contratos.length} {contratos.length === 1 ? "resultado" : "resultados"}
                </span>
            </div>

            {contratos.length === 0 ? (
                <p className="rounded-xl border border-secondary p-8 text-center text-sm text-quaternary">
                    Nenhum contrato encontrado para os filtros aplicados.
                </p>
            ) : (
                <div className="divide-y divide-border-secondary overflow-hidden rounded-xl border border-secondary">
                    {contratos.map((contrato) => (
                        <CardContrato
                            key={contrato.id}
                            contrato={contrato}
                            selecionado={selecionadoId === contrato.id}
                            onSelecionar={() => onSelecionar(contrato.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Step 2 — revisão                                                  */
/* ------------------------------------------------------------------ */

function StepRevisao({ contrato, onTrocar }: { contrato: Contrato; onTrocar: () => void }) {
    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-4">
                <FieldLabel>Contrato selecionado</FieldLabel>
                <button
                    type="button"
                    onClick={onTrocar}
                    className="flex shrink-0 items-center gap-2 text-[15px] font-semibold text-brand-secondary transition duration-100 ease-linear hover:text-brand-secondary_hover"
                >
                    <SwitchHorizontal01 className="size-4" aria-hidden="true" />
                    Trocar contrato
                </button>
            </div>

            <div className="rounded-xl border border-secondary p-5">
                <IdentidadeContrato contrato={contrato} />
            </div>

            <FieldLabel>Condições que passarão a valer para este evento</FieldLabel>

            <div className="rounded-xl border border-secondary p-5">
                <CondicoesCompletas condicoes={contrato.condicoes} />
            </div>

            <div className="flex items-start gap-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-full text-utility-yellow-700 ring-1 ring-utility-yellow-200 ring-inset">
                    <InfoCircle className="size-4" aria-hidden="true" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-[13px] font-semibold text-primary">Sincronização com o checkout</span>
                    <p className="text-[13px] text-quaternary">
                        A sincronização com o checkout leva alguns minutos. A conferência pode ser feita abrindo o checkout do evento.
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Drawer                                                            */
/* ------------------------------------------------------------------ */

export function AssociarContratoDrawer({
    evento,
    onFechar,
    onConfirmar,
}: {
    evento: Evento;
    onFechar: () => void;
    onConfirmar: (contrato: Contrato) => void;
}) {
    const [step, setStep] = useState<1 | 2>(1);
    const [selecionadoId, setSelecionadoId] = useState<string>();
    const [busca, setBusca] = useState("");
    const [situacao, setSituacao] = useState("Todas");

    useEffect(() => {
        const aoTeclar = (evento: KeyboardEvent) => {
            if (evento.key === "Escape") onFechar();
        };
        document.addEventListener("keydown", aoTeclar);
        return () => document.removeEventListener("keydown", aoTeclar);
    }, [onFechar]);

    const termo = busca.trim().toLowerCase();
    const contratos = CONTRATOS.filter((contrato) => {
        const casaBusca =
            termo === "" ||
            contrato.nome.toLowerCase().includes(termo) ||
            contrato.produtora.toLowerCase().includes(termo) ||
            contrato.id.includes(termo);
        const casaSituacao =
            situacao === "Todas" || (situacao === "Pode associar" ? contrato.podeAssociar : !contrato.podeAssociar);

        return casaBusca && casaSituacao;
    });

    const selecionado = CONTRATOS.find((contrato) => contrato.id === selecionadoId);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Associar contrato"
        >
            <div className="flex max-h-full w-full max-w-[660px] flex-col overflow-hidden rounded-2xl bg-primary shadow-xl">
                <DrawerHeader evento={evento} step={step} onClose={onFechar} />

                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
                    {step === 1 || !selecionado ? (
                        <StepSelecao
                            contratos={contratos}
                            busca={busca}
                            onBusca={setBusca}
                            situacao={situacao}
                            onSituacao={setSituacao}
                            selecionadoId={selecionadoId}
                            onSelecionar={(id) => setSelecionadoId(id === selecionadoId ? undefined : id)}
                        />
                    ) : (
                        <StepRevisao contrato={selecionado} onTrocar={() => setStep(1)} />
                    )}
                </div>

                <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-t border-secondary p-6">
                    <span className="text-[13px] text-quaternary">
                        {step === 2
                            ? "Confirme para aplicar a condição ao evento"
                            : selecionado
                              ? `Contrato selecionado: ${selecionado.nome}`
                              : "Nenhum contrato selecionado"}
                    </span>
                    <div className="flex items-center gap-3">
                        <Btn onClick={onFechar} className="px-5 py-3 text-[15px]">
                            Cancelar
                        </Btn>
                        {step === 1 ? (
                            <Btn variant="brand" isDisabled={!selecionado} onClick={() => setStep(2)} className="px-5 py-3 text-[15px]">
                                Ir para resumo
                            </Btn>
                        ) : (
                            <Btn variant="brand" onClick={() => onConfirmar(selecionado!)} className="px-5 py-3 text-[15px]">
                                Confirmar associação
                            </Btn>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
