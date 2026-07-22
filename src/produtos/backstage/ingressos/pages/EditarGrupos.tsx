import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, ChevronLeft, Copy01, InfoCircle, Plus, Trash01, XClose } from "@untitledui/icons";
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
    const [confirmDup, setConfirmDup] = useState<string | null>(null);

    const addGrupo = (sessaoId: string) =>
        setSessoes((prev) =>
            prev.map((s) =>
                s.id === sessaoId ? { ...s, grupos: [...s.grupos, { id: nid(), nome: "", acesso: "", tipo: "Código QR", mapping: "", estoque: "" }] } : s,
            ),
        );
    const removeGrupo = (sessaoId: string, grupoId: string) =>
        setSessoes((prev) => prev.map((s) => (s.id === sessaoId ? { ...s, grupos: s.grupos.filter((g) => g.id !== grupoId) } : s)));

    // Duplica a sessão (com todos os grupos) logo abaixo, com novos ids.
    const duplicarSessao = (sessaoId: string) =>
        setSessoes((prev) => {
            const idx = prev.findIndex((s) => s.id === sessaoId);
            if (idx === -1) return prev;
            const orig = prev[idx];
            const copia: SessaoGrupos = { ...orig, id: `s-${(seq.current += 1)}`, grupos: orig.grupos.map((g) => ({ ...g, id: nid() })) };
            const next = [...prev];
            next.splice(idx + 1, 0, copia);
            return next;
        });

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
                    {sessoes.map((sessao) => (
                        <section key={sessao.id} className="rounded-2xl bg-secondary p-4 ring-1 ring-border-secondary md:p-5">
                            <div className="flex items-start justify-between gap-3">
                                <h2 className="text-lg font-semibold text-primary">
                                    {sessao.label} <span className="font-normal text-tertiary">({sessao.dia})</span>
                                </h2>
                                <ButtonUtility
                                    size="sm"
                                    color="tertiary"
                                    icon={Copy01}
                                    tooltip="Duplicar grupo"
                                    tooltipPlacement="bottom"
                                    onClick={() => setConfirmDup(sessao.id)}
                                />
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
                    ))}
                </div>
            </div>

            {/* Modal de confirmação: duplicar grupo */}
            {confirmDup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/60 p-4" role="dialog" aria-modal="true">
                    <div className="w-full max-w-md rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex items-start justify-between gap-3">
                            <h2 className="text-lg font-bold text-primary">Duplicar grupo</h2>
                            <button
                                type="button"
                                aria-label="Fechar"
                                onClick={() => setConfirmDup(null)}
                                className="shrink-0 text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary"
                            >
                                <XClose className="size-5" />
                            </button>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-tertiary">Deseja criar uma cópia deste grupo com os mesmos dados?</p>
                        <div className="mt-6 flex items-center justify-end gap-2">
                            <Button size="lg" color="link-gray" onClick={() => setConfirmDup(null)}>
                                Cancelar
                            </Button>
                            <Button
                                size="lg"
                                color="primary"
                                onClick={() => {
                                    duplicarSessao(confirmDup);
                                    setConfirmDup(null);
                                }}
                            >
                                Duplicar
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
