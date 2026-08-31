import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, ChevronLeft, Copy01, InfoCircle, Plus, Trash01, XClose } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";

interface GrupoRow {
    id: string;
    nome: string;
    acesso: string;
    tipo: string;
    mapping: string;
    estoque: string;
}

interface SessaoGrupos {
    id: string;
    label: string;
    dia: string;
    grupos: GrupoRow[];
}

const GRUPOS_TPL: Omit<GrupoRow, "id">[] = [
    { nome: "Gramado Oeste", acesso: "B,D,Y", tipo: "Código QR", mapping: "", estoque: "30" },
    { nome: "Gramado Leste", acesso: "K,M,O", tipo: "Código QR", mapping: "", estoque: "30" },
    { nome: "Superior Norte", acesso: "R,V", tipo: "Código QR", mapping: "", estoque: "30" },
    { nome: "Superior Sul", acesso: "E", tipo: "Código QR", mapping: "", estoque: "30" },
];

const SESSOES_DEF = [
    { id: "s1", label: "30/08/2026 às 10:00", dia: "Domingo" },
    { id: "s2", label: "30/08/2026 às 11:30", dia: "Domingo" },
    { id: "s3", label: "30/08/2026 às 16:00", dia: "Domingo" },
];

const TIPOS = ["Código QR", "Facial", "Código de barras"];

/** Template das colunas da tabela de grupos. */
const COLS = "grid-cols-[minmax(0,1.3fr)_minmax(0,1.3fr)_11rem_minmax(0,1.4fr)_6rem_5rem]";

export function EditarGrupos() {
    const navigate = useNavigate();
    const seq = useRef(0);
    const nid = () => `g-${(seq.current += 1)}`;

    // Cenário do protótipo: a 1ª sessão já tem grupos; as demais começam vazias.
    const [sessoes, setSessoes] = useState<SessaoGrupos[]>(() =>
        SESSOES_DEF.map((s, i) => ({ ...s, grupos: i === 0 ? GRUPOS_TPL.map((g) => ({ ...g, id: nid() })) : [] })),
    );
    const [removerId, setRemoverId] = useState<string | null>(null);
    // Modal "Copiar para outras sessões": grupoId nulo = copiar todos os grupos da sessão.
    const [copia, setCopia] = useState<{ sessaoId: string; grupoId: string | null } | null>(null);
    const [alvos, setAlvos] = useState<Set<string>>(new Set());
    // Destaque temporário nos grupos recém-copiados.
    const [flashGrupos, setFlashGrupos] = useState<Set<string>>(new Set());

    const removerSessao = (sessaoId: string) => setSessoes((prev) => prev.filter((s) => s.id !== sessaoId));

    const addGrupo = (sessaoId: string) =>
        setSessoes((prev) =>
            prev.map((s) =>
                s.id === sessaoId ? { ...s, grupos: [...s.grupos, { id: nid(), nome: "", acesso: "", tipo: "Código QR", mapping: "", estoque: "" }] } : s,
            ),
        );
    const removeGrupo = (sessaoId: string, grupoId: string) =>
        setSessoes((prev) => prev.map((s) => (s.id === sessaoId ? { ...s, grupos: s.grupos.filter((g) => g.id !== grupoId) } : s)));
    const updateGrupo = (sessaoId: string, grupoId: string, campo: keyof GrupoRow, valor: string) =>
        setSessoes((prev) =>
            prev.map((s) => (s.id === sessaoId ? { ...s, grupos: s.grupos.map((g) => (g.id === grupoId ? { ...g, [campo]: valor } : g)) } : s)),
        );

    // ---- Copiar para outras sessões (um grupo ou todos os grupos da sessão) ----
    // Grupos de origem: um único grupo, ou todos os da sessão quando grupoId é nulo.
    const fonte = useMemo(() => {
        if (!copia) return null;
        const sessao = sessoes.find((s) => s.id === copia.sessaoId);
        if (!sessao) return null;
        const grupos = copia.grupoId ? sessao.grupos.filter((g) => g.id === copia.grupoId) : sessao.grupos;
        return { sessao, grupos };
    }, [copia, sessoes]);

    const copiandoSessao = !!copia && !copia.grupoId;
    const nomeOrigem = fonte?.grupos[0]?.nome.trim() ?? "";
    // Nomes (normalizados) dos grupos de origem, usados para detectar equivalência.
    const nomesOrigem = useMemo(
        () => (fonte?.grupos ?? []).map((g) => g.nome.trim().toLowerCase()).filter(Boolean),
        [fonte],
    );

    // Outras sessões (exceto a de origem). Uma sessão é conflito quando já possui todos os grupos de origem.
    const outrasSessoes = useMemo(() => {
        if (!copia) return [];
        return sessoes
            .filter((s) => s.id !== copia.sessaoId)
            .map((s) => {
                const nomesAlvo = new Set(s.grupos.map((g) => g.nome.trim().toLowerCase()).filter(Boolean));
                const faltantes = nomesOrigem.filter((n) => !nomesAlvo.has(n));
                return { id: s.id, label: s.label, dia: s.dia, jaTem: nomesOrigem.length > 0 && faltantes.length === 0 };
            });
    }, [copia, sessoes, nomesOrigem]);

    const disponiveis = outrasSessoes.filter((s) => !s.jaTem);
    const todasSelecionadas = disponiveis.length > 0 && disponiveis.every((s) => alvos.has(s.id));
    const algumaSelecionada = disponiveis.some((s) => alvos.has(s.id));

    const abrirCopia = (sessaoId: string, grupoId: string | null = null) => {
        setAlvos(new Set());
        setCopia({ sessaoId, grupoId });
    };

    const toggleAlvo = (id: string) =>
        setAlvos((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const toggleTodas = () => setAlvos(todasSelecionadas ? new Set() : new Set(disponiveis.map((s) => s.id)));

    const confirmarCopia = () => {
        if (!fonte || alvos.size === 0) return;
        // Calcula as cópias fora do updater para manter a cópia independente e o destaque estável.
        const novosIds: string[] = [];
        const adicoes: Record<string, GrupoRow[]> = {};
        sessoes.forEach((s) => {
            if (!alvos.has(s.id)) return;
            const nomesAlvo = new Set(s.grupos.map((g) => g.nome.trim().toLowerCase()).filter(Boolean));
            adicoes[s.id] = fonte.grupos
                .filter((g) => {
                    const n = g.nome.trim().toLowerCase();
                    return n === "" || !nomesAlvo.has(n); // não sobrescreve grupos equivalentes já existentes
                })
                .map((g) => {
                    const id = nid();
                    novosIds.push(id);
                    return { ...g, id };
                });
        });
        setSessoes((prev) => prev.map((s) => (adicoes[s.id]?.length ? { ...s, grupos: [...s.grupos, ...adicoes[s.id]] } : s)));
        const novos = new Set(novosIds);
        setFlashGrupos(novos);
        window.setTimeout(() => setFlashGrupos((cur) => (cur === novos ? new Set() : cur)), 4000);
        setCopia(null);
    };

    return (
        <BackstageLayout activeSection="itens" activeItem="catalogo-ingressos">
            <div className="flex min-w-0 flex-1 flex-col px-4 py-6 md:px-6">
                {/* Header */}
                <header className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            aria-label="Voltar"
                            onClick={() => navigate("/backstage/catalogo/ingressos")}
                            className="flex size-9 items-center justify-center rounded-lg text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-secondary"
                        >
                            <ChevronLeft className="size-5" />
                        </button>
                        <h1 className="text-display-xs font-bold text-primary">Editar grupos</h1>
                    </div>
                    <Button size="md" color="primary">
                        Salvar alterações
                    </Button>
                </header>

                {/* Sessões */}
                <div className="mt-8 flex flex-col gap-6">
                    <AnimatePresence initial={false}>
                    {sessoes.map((sessao) => (
                        <motion.div
                            key={sessao.id}
                            className="overflow-hidden"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{
                                height: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                                opacity: { duration: 0.45, ease: "easeOut" },
                            }}
                        >
                        <section className="rounded-2xl bg-secondary p-4 ring-1 ring-border-secondary md:p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-lg font-semibold text-primary">
                                        {sessao.label} <span className="font-normal text-tertiary">({sessao.dia})</span>
                                    </h2>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <ButtonUtility
                                        size="sm"
                                        color="tertiary"
                                        icon={Copy01}
                                        tooltip="Copiar grupos para outras sessões"
                                        tooltipPlacement="bottom"
                                        isDisabled={sessao.grupos.length === 0}
                                        onClick={() => abrirCopia(sessao.id)}
                                    />
                                    <ButtonUtility
                                        size="sm"
                                        color="tertiary"
                                        icon={Trash01}
                                        tooltip="Remover sessão"
                                        tooltipPlacement="bottom"
                                        onClick={() => setRemoverId(sessao.id)}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 overflow-x-auto">
                                <div className="min-w-[920px] overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
                                    {/* Cabeçalho das colunas */}
                                    <div className={cx("grid gap-3 border-b border-secondary bg-secondary/40 px-4 py-2.5", COLS)}>
                                        <ColHead>Nome do grupo</ColHead>
                                        <ColHead>
                                            Nome do acesso <span className="font-normal text-quaternary normal-case">(Opcional)</span>
                                        </ColHead>
                                        <ColHead info>Tipo</ColHead>
                                        <ColHead info>Mapping de acesso</ColHead>
                                        <ColHead>Estoque</ColHead>
                                        <span />
                                    </div>

                                    {/* Linhas */}
                                    <div className="flex flex-col">
                                        {sessao.grupos.map((g) => (
                                            <div
                                                key={g.id}
                                                className={cx(
                                                    "grid items-center gap-3 px-4 py-3 transition-colors duration-500",
                                                    flashGrupos.has(g.id) && "bg-tertiary",
                                                    COLS,
                                                )}
                                            >
                                                <TextInput value={g.nome} onChange={(v) => updateGrupo(sessao.id, g.id, "nome", v)} placeholder="Nome do grupo" />
                                                <TextInput value={g.acesso} onChange={(v) => updateGrupo(sessao.id, g.id, "acesso", v)} placeholder="Ex.: A,B,C" />
                                                <TipoSelect value={g.tipo} onChange={(v) => updateGrupo(sessao.id, g.id, "tipo", v)} />
                                                <TextInput
                                                    value={g.mapping}
                                                    onChange={(v) => updateGrupo(sessao.id, g.id, "mapping", v)}
                                                    placeholder="Ex.: ARENA-NORTE-P1, CAM-VIP-LESTE-02…"
                                                />
                                                <TextInput
                                                    value={g.estoque}
                                                    onChange={(v) => updateGrupo(sessao.id, g.id, "estoque", v)}
                                                    placeholder="0"
                                                    inputMode="numeric"
                                                />
                                                <div className="flex items-center justify-end gap-1">
                                                    <ButtonUtility
                                                        size="sm"
                                                        color="tertiary"
                                                        icon={Copy01}
                                                        tooltip="Copiar para outras sessões"
                                                        tooltipPlacement="bottom"
                                                        onClick={() => abrirCopia(sessao.id, g.id)}
                                                    />
                                                    <button
                                                        type="button"
                                                        aria-label="Remover grupo"
                                                        onClick={() => removeGrupo(sessao.id, g.id)}
                                                        className="flex size-9 items-center justify-center rounded-lg text-fg-error-secondary transition duration-100 ease-linear hover:bg-error-primary"
                                                    >
                                                        <Trash01 className="size-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Novo grupo (rodapé do card) */}
                                    <button
                                        type="button"
                                        onClick={() => addGrupo(sessao.id)}
                                        className="flex w-full items-center gap-2 border-t border-secondary px-4 py-3.5 text-left text-sm font-semibold text-brand-secondary transition duration-100 ease-linear hover:bg-tertiary hover:text-brand-secondary_hover"
                                    >
                                        <Plus className="size-4" />
                                        Novo grupo
                                    </button>
                                </div>
                            </div>
                        </section>
                        </motion.div>
                    ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Modal de confirmação: remover sessão */}
            {removerId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/60 p-4" role="dialog" aria-modal="true">
                    <div className="w-full max-w-md rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex items-start justify-between gap-3">
                            <h2 className="text-lg font-bold text-primary">Remover sessão?</h2>
                            <button
                                type="button"
                                aria-label="Fechar"
                                onClick={() => setRemoverId(null)}
                                className="shrink-0 text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary"
                            >
                                <XClose className="size-5" />
                            </button>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-tertiary">
                            A sessão inteira e seus grupos serão removidos. Esta ação não poderá ser desfeita.
                        </p>
                        <div className="mt-6 flex items-center justify-end gap-2">
                            <Button size="lg" color="secondary" onClick={() => setRemoverId(null)}>
                                Cancelar
                            </Button>
                            <Button
                                size="lg"
                                color="primary-destructive"
                                onClick={() => {
                                    removerSessao(removerId);
                                    setRemoverId(null);
                                }}
                            >
                                Remover sessão
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: copiar grupo(s) para outras sessões */}
            {copia && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/60 p-4" role="dialog" aria-modal="true">
                    <div className="w-full max-w-lg rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        {disponiveis.length === 0 ? (
                            /* Não há sessão de destino: o(s) grupo(s) já existe(m) em todas as outras. */
                            <>
                                <div className="flex items-start justify-between gap-3">
                                    <h2 className="text-lg font-bold text-primary">
                                        {copiandoSessao ? "Grupos já duplicados" : "Grupo já duplicado"}
                                    </h2>
                                    <button
                                        type="button"
                                        aria-label="Fechar"
                                        onClick={() => setCopia(null)}
                                        className="shrink-0 text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary"
                                    >
                                        <XClose className="size-5" />
                                    </button>
                                </div>
                                <p className="mt-2 text-sm leading-relaxed text-tertiary">
                                    {outrasSessoes.length === 0
                                        ? "Não há outras sessões para receber a duplicação."
                                        : copiandoSessao
                                          ? "Esses grupos já foram duplicados ou já existem em todas as outras sessões."
                                          : "Esse grupo já foi duplicado ou já existe em todas as outras sessões."}
                                </p>
                                <div className="mt-6 flex items-center justify-end">
                                    <Button size="lg" color="primary" onClick={() => setCopia(null)}>
                                        Entendi
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-start justify-between gap-3">
                                    <h2 className="text-lg font-bold text-primary">
                                        {copiandoSessao ? "Duplicar grupos" : nomeOrigem ? <>Duplicar “{nomeOrigem}”</> : "Duplicar grupo"}
                                    </h2>
                                    <button
                                        type="button"
                                        aria-label="Fechar"
                                        onClick={() => setCopia(null)}
                                        className="shrink-0 text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary"
                                    >
                                        <XClose className="size-5" />
                                    </button>
                                </div>
                                <p className="mt-2 text-sm leading-relaxed text-tertiary">
                                    {copiandoSessao
                                        ? "Escolha as sessões onde todos os grupos desta sessão serão duplicados. As configurações poderão ser editadas depois."
                                        : "Escolha as sessões onde este grupo será duplicado. As configurações poderão ser editadas depois."}
                                </p>

                                <div className="mt-5 flex flex-col gap-3">
                                    {/* Selecionar todas */}
                                    <div className="flex items-center gap-2.5">
                                        <Checkbox
                                            size="md"
                                            isSelected={todasSelecionadas}
                                            isIndeterminate={algumaSelecionada && !todasSelecionadas}
                                            onChange={toggleTodas}
                                            label="Selecionar todas"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {disponiveis.map((s) => (
                                            <label
                                                key={s.id}
                                                className="flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-3 ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-secondary"
                                            >
                                                <Checkbox
                                                    size="md"
                                                    isSelected={alvos.has(s.id)}
                                                    onChange={() => toggleAlvo(s.id)}
                                                    label={
                                                        <span className="text-sm font-medium text-primary">
                                                            {s.label} <span className="font-normal text-tertiary">({s.dia})</span>
                                                        </span>
                                                    }
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-end gap-2">
                                    <Button size="lg" color="secondary" onClick={() => setCopia(null)}>
                                        Cancelar
                                    </Button>
                                    <Button size="lg" color="primary" isDisabled={alvos.size === 0} onClick={confirmarCopia}>
                                        {copiandoSessao ? "Duplicar grupos" : "Duplicar grupo"}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </BackstageLayout>
    );
}

function ColHead({ children, info }: { children: React.ReactNode; info?: boolean }) {
    return (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-tertiary uppercase">
            {children}
            {info && <InfoCircle className="size-3.5 text-fg-quaternary" />}
        </span>
    );
}

function TextInput({
    value,
    onChange,
    placeholder,
    inputMode,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    inputMode?: "numeric";
}) {
    return (
        <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            inputMode={inputMode}
            className="w-full rounded-lg bg-secondary px-3.5 py-2.5 text-sm text-primary ring-1 ring-border-secondary outline-none placeholder:text-placeholder focus:ring-2 focus:ring-brand"
        />
    );
}

function TipoSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full appearance-none rounded-lg bg-secondary py-2.5 pr-9 pl-3.5 text-sm text-primary ring-1 ring-border-secondary outline-none focus:ring-2 focus:ring-brand"
            >
                {TIPOS.map((t) => (
                    <option key={t} value={t}>
                        {t}
                    </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-quaternary" />
        </div>
    );
}
