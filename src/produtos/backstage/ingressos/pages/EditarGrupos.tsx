import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, ChevronLeft, Copy01, InfoCircle, Plus, Trash01, XClose } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
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
const COLS = "grid-cols-[minmax(0,1.3fr)_minmax(0,1.3fr)_11rem_minmax(0,1.4fr)_6rem_2.5rem]";

export function EditarGrupos() {
    const navigate = useNavigate();
    const seq = useRef(0);
    const nid = () => `g-${(seq.current += 1)}`;

    const [sessoes, setSessoes] = useState<SessaoGrupos[]>(() =>
        SESSOES_DEF.map((s) => ({ ...s, grupos: GRUPOS_TPL.map((g) => ({ ...g, id: nid() })) })),
    );
    const [confirm, setConfirm] = useState<{ tipo: "duplicar" | "remover"; id: string } | null>(null);
    // Badge temporária "cópia de grupo" no grupo recém-duplicado.
    const [flashId, setFlashId] = useState<string | null>(null);

    const removerSessao = (sessaoId: string) => setSessoes((prev) => prev.filter((s) => s.id !== sessaoId));

    const addGrupo = (sessaoId: string) =>
        setSessoes((prev) =>
            prev.map((s) =>
                s.id === sessaoId ? { ...s, grupos: [...s.grupos, { id: nid(), nome: "", acesso: "", tipo: "Código QR", mapping: "", estoque: "" }] } : s,
            ),
        );
    const removeGrupo = (sessaoId: string, grupoId: string) =>
        setSessoes((prev) => prev.map((s) => (s.id === sessaoId ? { ...s, grupos: s.grupos.filter((g) => g.id !== grupoId) } : s)));

    // Duplica a sessão (com todos os grupos) logo abaixo, com novos ids + badge temporária.
    const duplicarSessao = (sessaoId: string) => {
        const orig = sessoes.find((s) => s.id === sessaoId);
        if (!orig) return;
        const copiaId = `s-${(seq.current += 1)}`;
        const copia: SessaoGrupos = { ...orig, id: copiaId, grupos: orig.grupos.map((g) => ({ ...g, id: nid() })) };
        setSessoes((prev) => {
            const idx = prev.findIndex((s) => s.id === sessaoId);
            if (idx === -1) return prev;
            const next = [...prev];
            next.splice(idx + 1, 0, copia);
            return next;
        });
        // Badge some (com fade) depois de 30s.
        setFlashId(copiaId);
        window.setTimeout(() => setFlashId((cur) => (cur === copiaId ? null : cur)), 30000);
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
                                    <AnimatePresence>
                                        {flashId === sessao.id && (
                                            <motion.span
                                                initial={{ opacity: 0, scale: 0.8, y: -4 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.6, ease: "easeInOut" } }}
                                                transition={{ type: "spring", stiffness: 420, damping: 22 }}
                                            >
                                                <Badge size="sm" color="blue" type="pill-color">
                                                    cópia de grupo
                                                </Badge>
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <ButtonUtility
                                        size="sm"
                                        color="tertiary"
                                        icon={Copy01}
                                        tooltip="Duplicar grupo"
                                        tooltipPlacement="bottom"
                                        onClick={() => setConfirm({ tipo: "duplicar", id: sessao.id })}
                                    />
                                    <ButtonUtility
                                        size="sm"
                                        color="tertiary"
                                        icon={Trash01}
                                        tooltip="Remover grupo"
                                        tooltipPlacement="bottom"
                                        onClick={() => setConfirm({ tipo: "remover", id: sessao.id })}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 overflow-x-auto">
                                <div className="min-w-[880px] overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
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
                                            <div key={g.id} className={cx("grid items-center gap-3 px-4 py-3", COLS)}>
                                                <TextInput defaultValue={g.nome} placeholder="Nome do grupo" />
                                                <TextInput defaultValue={g.acesso} placeholder="Ex.: A,B,C" />
                                                <TipoSelect defaultValue={g.tipo} />
                                                <TextInput defaultValue={g.mapping} placeholder="Ex.: ARENA-NORTE-P1, CAM-VIP-LESTE-02…" />
                                                <TextInput defaultValue={g.estoque} placeholder="0" inputMode="numeric" />
                                                <button
                                                    type="button"
                                                    aria-label="Remover grupo"
                                                    onClick={() => removeGrupo(sessao.id, g.id)}
                                                    className="flex size-10 items-center justify-center rounded-lg text-fg-error-secondary transition duration-100 ease-linear hover:bg-error-primary"
                                                >
                                                    <Trash01 className="size-5" />
                                                </button>
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

            {/* Modal de confirmação: duplicar / remover grupo */}
            {confirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/60 p-4" role="dialog" aria-modal="true">
                    <div className="w-full max-w-md rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex items-start justify-between gap-3">
                            <h2 className="text-lg font-bold text-primary">
                                {confirm.tipo === "duplicar" ? "Duplicar grupo?" : "Remover grupo?"}
                            </h2>
                            <button
                                type="button"
                                aria-label="Fechar"
                                onClick={() => setConfirm(null)}
                                className="shrink-0 text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary"
                            >
                                <XClose className="size-5" />
                            </button>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-tertiary">
                            {confirm.tipo === "duplicar"
                                ? "Será criado um novo grupo com as mesmas configurações deste. Depois, você poderá revisar e ajustar o que for necessário."
                                : "O grupo inteiro será removido. Esta ação não poderá ser desfeita."}
                        </p>
                        <div className="mt-6 flex items-center justify-end gap-2">
                            <Button size="lg" color="link-gray" onClick={() => setConfirm(null)}>
                                Cancelar
                            </Button>
                            <Button
                                size="lg"
                                color={confirm.tipo === "duplicar" ? "primary" : "primary-destructive"}
                                onClick={() => {
                                    if (confirm.tipo === "duplicar") duplicarSessao(confirm.id);
                                    else removerSessao(confirm.id);
                                    setConfirm(null);
                                }}
                            >
                                {confirm.tipo === "duplicar" ? "Duplicar grupo" : "Remover grupo"}
                            </Button>
                        </div>
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

function TextInput({ defaultValue, placeholder, inputMode }: { defaultValue?: string; placeholder?: string; inputMode?: "numeric" }) {
    return (
        <input
            defaultValue={defaultValue}
            placeholder={placeholder}
            inputMode={inputMode}
            className="w-full rounded-lg bg-secondary px-3.5 py-2.5 text-sm text-primary ring-1 ring-border-secondary outline-none placeholder:text-placeholder focus:ring-2 focus:ring-brand"
        />
    );
}

function TipoSelect({ defaultValue }: { defaultValue: string }) {
    return (
        <div className="relative">
            <select
                defaultValue={defaultValue}
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
