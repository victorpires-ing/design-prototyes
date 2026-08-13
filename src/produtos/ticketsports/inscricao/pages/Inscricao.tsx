import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronUp, HelpCircle, InfoCircle, Plus, QrCode01, Share07, Trash01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { CAMPOS, EVENTO, RESUMO, type CampoFormulario } from "../data/formulario";
import { EsgotadoModal } from "../components/EsgotadoModal";

const BLUE = "#1aa0de";

/** Recriação da tela de formulário de inscrição do TicketSports (checkout web),
 *  com os cenários de erro de estoque (esgotado em tempo real e ao selecionar). */
export function Inscricao() {
    const [respostas, setRespostas] = useState<Record<string, string>>({});
    const [esgotados, setEsgotados] = useState<Set<string>>(new Set());
    const [armado, setArmado] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectAberto, setSelectAberto] = useState<string | null>(null);

    const chave = (campoId: string, opcaoId: string) => `${campoId}:${opcaoId}`;
    const estaEsgotado = (campoId: string, opcaoId: string) => esgotados.has(chave(campoId, opcaoId));

    // Cenário 1 — esgota uma opção em tempo real (some do estoque enquanto preenche).
    const esgotarAgora = (campoId: string, opcaoId: string) => {
        setEsgotados((s) => new Set(s).add(chave(campoId, opcaoId)));
        setRespostas((r) => (r[campoId] === opcaoId ? { ...r, [campoId]: "" } : r));
    };

    // Seleção de uma opção — considera o cenário 2 (esgota no momento da seleção).
    const selecionar = (campo: CampoFormulario, opcaoId: string) => {
        if (estaEsgotado(campo.id, opcaoId)) return;
        if (campo.estoque && armado) {
            setEsgotados((s) => new Set(s).add(chave(campo.id, opcaoId)));
            setArmado(false);
            setSelectAberto(null);
            setModalOpen(true);
            return;
        }
        setRespostas((r) => ({ ...r, [campo.id]: opcaoId }));
        setSelectAberto(null);
    };

    return (
        <div className="min-h-screen bg-[#f4f4f5] text-gray-900">
            {/* Header preto */}
            <header className="flex h-16 items-center justify-between bg-[#0d0d0d] px-6">
                <div className="flex items-center gap-2">
                    <svg width="34" height="26" viewBox="0 0 34 26" fill="none" aria-hidden="true">
                        <path d="M2 15 C10 3 16 3 22 9 C26 13 30 12 32 8" stroke={BLUE} strokeWidth="4" strokeLinecap="round" />
                        <path d="M2 22 C10 10 16 10 22 16" stroke={BLUE} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
                    </svg>
                    <div className="leading-none">
                        <span className="block text-lg font-extrabold tracking-tight text-white">
                            TICKET<span className="font-light">SPORTS</span>
                        </span>
                        <span className="block text-[9px] font-semibold tracking-[0.2em] text-gray-400">BY INGRESSE</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button type="button" className="text-sm font-medium text-white/90 transition hover:text-white">Acessar conta</button>
                    <span className="flex size-6 items-center justify-center overflow-hidden rounded-full text-base leading-none">🇧🇷</span>
                </div>
            </header>

            {/* Sub-header (evento) */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
                <div className="flex items-center gap-3">
                    <button type="button" aria-label="Voltar" className="text-gray-700 transition hover:text-gray-900">
                        <ChevronLeft className="size-5" />
                    </button>
                    <h1 className="text-sm font-bold tracking-tight text-gray-900 uppercase">{EVENTO.nome}</h1>
                </div>
                <div className="flex items-center gap-6">
                    <button type="button" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 transition hover:text-gray-900">
                        <Share07 className="size-4" /> Compartilhar
                    </button>
                    <button type="button" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 transition hover:text-gray-900">
                        <HelpCircle className="size-4" /> Preciso de ajuda
                    </button>
                </div>
            </div>

            {/* Conteúdo */}
            <main className="mx-auto max-w-[1180px] px-6 py-8">
                <div className="mb-5 flex items-end justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Para quem é esta inscrição?</h2>
                    <span className="text-sm text-gray-500">Termine sua inscrição em: mm:ss</span>
                </div>

                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_360px]">
                    {/* Coluna do formulário */}
                    <div className="flex flex-col gap-3">
                        {/* Card "Para mim" */}
                        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <QrCode01 className="size-6 text-gray-800" />
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{EVENTO.grupo}</p>
                                        <p className="text-sm text-gray-500">{EVENTO.ingresso}</p>
                                    </div>
                                </div>
                                <button type="button" aria-label="Remover" className="text-gray-400 transition hover:text-gray-600">
                                    <Trash01 className="size-5" />
                                </button>
                            </div>

                            <div className="my-5 flex items-center justify-between">
                                <span className="flex items-center gap-3">
                                    <RadioDot on />
                                    <span className="text-base font-semibold text-gray-900">Para mim</span>
                                </span>
                                <span className="flex items-center gap-3">
                                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">Responda o formulário</span>
                                    <ChevronUp className="size-5 text-gray-400" />
                                </span>
                            </div>

                            <p className="mb-4 text-base font-bold text-gray-900">Formulário do atleta</p>

                            <div className="flex flex-col gap-5">
                                {CAMPOS.map((campo) => (
                                    <Campo
                                        key={campo.id}
                                        campo={campo}
                                        valor={respostas[campo.id] ?? ""}
                                        esgotado={(opId) => estaEsgotado(campo.id, opId)}
                                        onSelecionar={(opId) => selecionar(campo, opId)}
                                        aberto={selectAberto === campo.id}
                                        onToggleAberto={() => setSelectAberto((s) => (s === campo.id ? null : campo.id))}
                                    />
                                ))}
                            </div>

                            <button
                                type="button"
                                className="mt-6 w-full rounded-lg py-3 text-sm font-semibold text-white transition hover:brightness-95"
                                style={{ backgroundColor: BLUE }}
                            >
                                Salvar respostas
                            </button>
                        </div>

                        {/* Linhas colapsadas */}
                        <CollapsedRow label="Outra pessoa" />
                        <CollapsedRow label="Meu dependente" />
                    </div>

                    {/* Coluna do resumo */}
                    <aside className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 lg:sticky lg:top-6">
                        <p className="text-base font-bold text-gray-900">Resumo da compra</p>

                        <div className="mt-4 flex items-center justify-between border-t border-dashed border-gray-200 pt-3">
                            <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Ingressos</span>
                            <button type="button" className="text-xs font-medium text-gray-500 underline">Remover tudo</button>
                        </div>
                        <div className="mt-2 flex gap-2">
                            <span className="text-sm text-gray-500">{RESUMO.ingresso.qtd}</span>
                            <QrCode01 className="mt-0.5 size-4 shrink-0 text-gray-500" />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-gray-900">{RESUMO.ingresso.grupo}</p>
                                <p className="text-sm text-gray-500">{RESUMO.ingresso.nome}</p>
                                <button type="button" className="mt-0.5 text-xs font-medium text-gray-500 underline">Remover</button>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">{RESUMO.ingresso.valor}</span>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-dashed border-gray-200 pt-3">
                            <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Produtos</span>
                            <button type="button" className="text-xs font-medium text-gray-500 underline">Remover tudo</button>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                            <div className="size-11 shrink-0 rounded-lg bg-gray-800" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-gray-900">{RESUMO.produto.nome}</p>
                                <p className="text-sm text-gray-500">{RESUMO.produto.valor}</p>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 ring-1 ring-gray-200">
                                <Trash01 className="size-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900">{RESUMO.produto.qtd}</span>
                                <Plus className="size-4 text-gray-400" />
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-dashed border-gray-200 pt-3">
                            <span className="text-sm text-gray-700">Descontos</span>
                            <span className="text-sm font-semibold text-emerald-600">{RESUMO.desconto}</span>
                        </div>

                        <div className="mt-4 flex items-end justify-between">
                            <div>
                                <p className="text-sm text-gray-400 line-through">{RESUMO.subtotal}</p>
                                <p className="flex items-center gap-1 text-xl font-bold text-gray-900">
                                    {RESUMO.total} <span className="text-sm font-normal text-gray-500">+ taxas</span>
                                    <InfoCircle className="size-4 text-gray-400" />
                                </p>
                            </div>
                            <button
                                type="button"
                                className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
                                style={{ backgroundColor: "#9fd6f0" }}
                            >
                                Continuar
                            </button>
                        </div>
                    </aside>
                </div>
            </main>

            {/* Backdrop invisível para fechar select aberto */}
            {selectAberto && <div className="fixed inset-0 z-20" onClick={() => setSelectAberto(null)} />}

            <ScenarioPanel
                esgotado={estaEsgotado}
                armado={armado}
                setArmado={setArmado}
                onEsgotar={esgotarAgora}
                onReset={() => {
                    setEsgotados(new Set());
                    setArmado(false);
                    setRespostas({});
                }}
            />

            <EsgotadoModal open={modalOpen} onClose={() => setModalOpen(false)} />
        </div>
    );
}

/* ------------------------------------------------------------------ */

const RadioDot = ({ on, disabled }: { on?: boolean; disabled?: boolean }) => (
    <span
        className={cx(
            "flex size-5 shrink-0 items-center justify-center rounded-full ring-2",
            disabled ? "ring-gray-200" : on ? "" : "ring-gray-300",
        )}
        style={on && !disabled ? { boxShadow: `inset 0 0 0 2px ${BLUE}` } : undefined}
    >
        {on && !disabled && <span className="size-2.5 rounded-full" style={{ backgroundColor: BLUE }} />}
    </span>
);

const EsgotadoPill = () => (
    <span className="rounded-full bg-[var(--color-utility-neutral-50)] px-2 py-0.5 text-xs font-medium text-[var(--color-utility-neutral-700)] ring-1 ring-[var(--color-utility-neutral-200)]">
        Esgotado
    </span>
);

function Campo({
    campo,
    valor,
    esgotado,
    onSelecionar,
    aberto,
    onToggleAberto,
}: {
    campo: CampoFormulario;
    valor: string;
    esgotado: (opId: string) => boolean;
    onSelecionar: (opId: string) => void;
    aberto: boolean;
    onToggleAberto: () => void;
}) {
    const label = (
        <label className="mb-1.5 block text-sm text-gray-700">
            {campo.label} {campo.obrigatorio && <span className="text-red-500">*</span>}
        </label>
    );

    if (campo.tipo === "texto") {
        return (
            <div>
                {label}
                <input
                    placeholder={campo.placeholder}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-transparent focus:ring-2"
                    style={{ ["--tw-ring-color" as string]: BLUE }}
                />
            </div>
        );
    }

    if (campo.tipo === "radio") {
        return (
            <div>
                {label}
                <div className="flex flex-col gap-1">
                    {campo.opcoes!.map((o) => {
                        const esg = esgotado(o.id);
                        const sel = valor === o.id;
                        return (
                            <button
                                key={o.id}
                                type="button"
                                disabled={esg}
                                onClick={() => onSelecionar(o.id)}
                                className={cx("flex items-center gap-2.5 py-1.5 text-left", esg && "cursor-not-allowed")}
                            >
                                <RadioDot on={sel} disabled={esg} />
                                <span className={cx("text-sm", esg ? "text-gray-400 line-through" : "text-gray-900")}>{o.label}</span>
                                {esg && <EsgotadoPill />}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    if (campo.tipo === "select") {
        const selecionada = campo.opcoes!.find((o) => o.id === valor);
        return (
            <div>
                {label}
                <div className="relative z-30">
                    <button
                        type="button"
                        onClick={onToggleAberto}
                        className={cx(
                            "flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-sm outline-none transition",
                            aberto ? "border-gray-900" : "border-gray-300",
                            selecionada ? "text-gray-900" : "text-gray-400",
                        )}
                    >
                        {selecionada ? selecionada.label : campo.placeholder}
                        <ChevronDown className={cx("size-5 text-gray-400 transition", aberto && "rotate-180")} />
                    </button>

                    {aberto && (
                        <div className="absolute top-full right-0 left-0 z-30 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                            {campo.opcoes!.map((o) => {
                                const esg = esgotado(o.id);
                                return (
                                    <button
                                        key={o.id}
                                        type="button"
                                        disabled={esg}
                                        onClick={() => onSelecionar(o.id)}
                                        className={cx(
                                            "flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm",
                                            esg ? "cursor-not-allowed text-gray-400" : "text-gray-900 hover:bg-gray-100",
                                        )}
                                    >
                                        <span className={cx(esg && "line-through")}>{o.label}</span>
                                        {esg && <EsgotadoPill />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return null;
}

const CollapsedRow = ({ label }: { label: string }) => (
    <div className="flex items-center justify-between rounded-2xl bg-white px-6 py-4 shadow-sm ring-1 ring-gray-200">
        <span className="flex items-center gap-3">
            <RadioDot />
            <span className="text-base font-medium text-gray-900">{label}</span>
        </span>
        <ChevronDown className="size-5 text-gray-400" />
    </div>
);

/* ------------------------------------------------------------------ */
/*  Painel para disparar os cenários em tempo real (só protótipo).     */
/* ------------------------------------------------------------------ */

function ScenarioPanel({
    esgotado,
    armado,
    setArmado,
    onEsgotar,
    onReset,
}: {
    esgotado: (campoId: string, opId: string) => boolean;
    armado: boolean;
    setArmado: (v: boolean) => void;
    onEsgotar: (campoId: string, opId: string) => void;
    onReset: () => void;
}) {
    const [aberto, setAberto] = useState(true);
    const camposEstoque = CAMPOS.filter((c) => c.estoque);

    if (!aberto) {
        return (
            <button
                type="button"
                onClick={() => setAberto(true)}
                className="fixed left-4 bottom-4 z-40 rounded-full bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
            >
                Simular cenários
            </button>
        );
    }

    return (
        <div className="fixed left-4 bottom-4 z-40 w-80 rounded-xl bg-white p-4 text-sm shadow-2xl ring-1 ring-gray-200">
            <div className="flex items-center justify-between">
                <p className="font-bold text-gray-900">Simular cenários</p>
                <button type="button" onClick={() => setAberto(false)} className="text-xs font-medium text-gray-400 hover:text-gray-600">
                    ocultar
                </button>
            </div>

            {/* Cenário 1 */}
            <p className="mt-3 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">1 · Esgotar em tempo real</p>
            <p className="mt-0.5 text-xs text-gray-500">Clique para esgotar a opção enquanto o formulário está aberto.</p>
            <div className="mt-2 flex flex-col gap-2">
                {camposEstoque.map((c) => (
                    <div key={c.id}>
                        <p className="text-xs font-medium text-gray-600">{c.label}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                            {c.opcoes!.map((o) => {
                                const esg = esgotado(c.id, o.id);
                                return (
                                    <button
                                        key={o.id}
                                        type="button"
                                        disabled={esg}
                                        onClick={() => onEsgotar(c.id, o.id)}
                                        className={cx(
                                            "rounded-md px-2 py-1 text-xs font-medium ring-1 transition",
                                            esg
                                                ? "cursor-not-allowed text-gray-300 ring-gray-100"
                                                : "text-gray-700 ring-gray-300 hover:bg-gray-50",
                                        )}
                                    >
                                        {o.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Cenário 2 */}
            <p className="mt-4 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">2 · Esgotar ao selecionar</p>
            <button
                type="button"
                onClick={() => setArmado(!armado)}
                className={cx(
                    "mt-2 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold ring-1 transition",
                    armado ? "text-white" : "bg-white text-gray-700 ring-gray-300 hover:bg-gray-50",
                )}
                style={armado ? { backgroundColor: BLUE } : undefined}
            >
                {armado ? "Armado — selecione uma opção" : "Armar próxima seleção"}
                <span className={cx("flex h-4 w-7 items-center rounded-full px-0.5", armado ? "bg-white/40" : "bg-gray-200")}>
                    <span className={cx("size-3 rounded-full bg-white transition", armado && "translate-x-3")} />
                </span>
            </button>
            <p className="mt-1 text-xs text-gray-500">A próxima opção com estoque que você selecionar vai esgotar e abrir o modal.</p>

            <button type="button" onClick={onReset} className="mt-3 w-full rounded-lg py-2 text-xs font-medium text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50">
                Resetar
            </button>
        </div>
    );
}
