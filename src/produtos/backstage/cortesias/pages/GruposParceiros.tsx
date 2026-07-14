import { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Calendar, CheckCircle, ChevronDown, CornerDownLeft, Plus, SearchLg, Ticket01, Users01, UsersPlus, XClose } from "@untitledui/icons";
import { toast } from "sonner";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input, InputBase } from "@/components/base/input/input";
import { InputGroup } from "@/components/base/input/input-group";
import { Tabs } from "@/components/application/tabs/tabs";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import type { ProgressFeaturedIconType } from "@/components/application/progress-steps/progress-types";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { addGrupo, addMembro, useGrupos, useMembros } from "../../components/membros-store";
import { addAlocacoes, useAlocacoes, type Alocacao } from "../data/parceiros";
import { COMBOS, PRODUCTS, SESSIONS } from "../data/cortesia-items";

type Categoria = "ingressos" | "produtos" | "combos";

/** Itens achatados (ingressos + produtos + combos) para o seletor de cotas. */
interface ItemCota {
    id: string;
    name: string;
    /** Setor (grupo) para ingressos; categoria para produto/combo. */
    setorTipo: string;
    categoria: Categoria;
}

const ITENS: ItemCota[] = [
    ...SESSIONS.flatMap((s) => s.groups.flatMap((g) => g.tickets.map((t) => ({ id: t.id, name: t.name, setorTipo: g.name, categoria: "ingressos" as const })))),
    ...PRODUCTS.map((p) => ({ id: p.id, name: p.name, setorTipo: "Produto", categoria: "produtos" as const })),
    ...COMBOS.map((c) => ({ id: c.id, name: c.name, setorTipo: "Combo", categoria: "combos" as const })),
];

/** Variantes de slide entre etapas (1 = avança → esquerda, -1 = volta → direita). */
const stepVariants = {
    enter: (dir: number) => ({ x: dir * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -40, opacity: 0 }),
};

const num = (n: number) => n.toLocaleString("pt-BR");
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Hash estável para derivar dados determinísticos por pessoa. */
function hashStr(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
}

/**
 * Distribui `total` cortesias enviadas entre `ids` de forma determinística
 * (largest remainder ponderado por hash) — a soma bate exatamente com o total.
 */
function distribuir(total: number, ids: string[]): Map<string, number> {
    const res = new Map<string, number>();
    const n = ids.length;
    if (n === 0) return res;
    if (total <= 0) {
        ids.forEach((id) => res.set(id, 0));
        return res;
    }
    const pesos = ids.map((id) => (hashStr(id) % 9) + 1);
    const soma = pesos.reduce((a, b) => a + b, 0);
    const raw = ids.map((_, i) => (total * pesos[i]) / soma);
    const base = raw.map(Math.floor);
    const resto = total - base.reduce((a, b) => a + b, 0);
    const ordem = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac);
    for (let k = 0; k < resto; k++) base[ordem[k % n].i] += 1;
    ids.forEach((id, i) => res.set(id, base[i]));
    return res;
}
const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);

/* ------------------------------------------------------------------ */
/*  Conteúdo da aba "Grupos e cota"                                    */
/* ------------------------------------------------------------------ */

/** Tela dedicada de gestão de emissores e cotas. */
export function GerenciarEmissores() {
    const navigate = useNavigate();
    const alocacoes = useAlocacoes();
    const membros = useMembros();
    const admins = useMemo(() => membros.filter((m) => m.cargoIds.includes("administrador")), [membros]);
    const total = admins.length + alocacoes.length;

    return (
        <BackstageLayout activeSection="cortesias" activeItem="emissao-cortesias">
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="relative flex items-center justify-between gap-3 px-6 py-6">
                    <Button size="sm" color="secondary" iconLeading={ArrowLeft} onClick={() => navigate("/backstage/cortesias")}>
                        Cortesias
                    </Button>
                    <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-display-xs font-bold text-primary">Emissores e cotas</h1>
                    <Button size="md" color="primary" iconLeading={Plus} onClick={() => navigate("/backstage/cortesias/emissores/configurar")}>
                        Configurar cotas
                    </Button>
                </header>
                <main className="flex flex-1 flex-col gap-4 px-6 pb-10">
                    <div className="flex items-center gap-2">
                        <UsersPlus className="size-5 text-fg-quaternary" aria-hidden="true" />
                        <h2 className="text-md font-semibold text-primary">Quem pode enviar cortesias</h2>
                        <Badge size="sm" type="pill-color" color="gray">
                            {num(total)}
                        </Badge>
                    </div>
                    <ResumoUso admins={admins} />
                </main>
            </div>
        </BackstageLayout>
    );
}

/** Tela/rota dedicada do fluxo de configuração de cota. */
export function ConfigurarCota() {
    const navigate = useNavigate();
    return (
        <BackstageLayout activeSection="cortesias" activeItem="emissao-cortesias">
            <div className="flex min-w-0 flex-1 flex-col">
                <main className="flex flex-1 flex-col px-6 py-6">
                    <ConfigurarCotasWizard onFechar={() => navigate("/backstage/cortesias/emissores")} />
                </main>
            </div>
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Wizard — configurar cota de um grupo parceiro                      */
/* ------------------------------------------------------------------ */

type SelState = Record<string, { on: boolean; cota: number }>;

const STEP_TITLES = ["Grupo", "Ingressos e cotas", "Revisão"];
const STEP_ICONS = [Users01, Ticket01, CheckCircle];
const STEP_DESCS = ["Nome e parceiros", "Cotas por ingresso", "Confirmar cota"];

function ConfigurarCotasWizard({ onFechar }: { onFechar: () => void }) {
    const [etapa, setEtapa] = useState(0);
    const [nome, setNome] = useState("");
    const [emails, setEmails] = useState<string[]>([]);
    const [sel, setSel] = useState<SelState>({});

    const [direction, setDirection] = useState(1);
    const itensSelecionados = useMemo(() => ITENS.filter((t) => sel[t.id]?.on && sel[t.id].cota > 0), [sel]);
    const totalCota = useMemo(() => itensSelecionados.reduce((acc, t) => acc + sel[t.id].cota, 0), [itensSelecionados, sel]);

    const podeAvancar = (() => {
        if (etapa === 0) return nome.trim().length > 0 && emails.length > 0;
        if (etapa === 1) return itensSelecionados.length > 0;
        return true;
    })();

    const toggleSetor = (id: string) =>
        setSel((prev) => {
            const atual = prev[id] ?? { on: false, cota: 0 };
            const on = !atual.on;
            return { ...prev, [id]: { on, cota: on ? (atual.cota > 0 ? atual.cota : 50) : 0 } };
        });

    const setCota = (id: string, v: number) =>
        setSel((prev) => {
            const atual = prev[id];
            if (!atual?.on) return prev;
            return { ...prev, [id]: { ...atual, cota: Math.max(0, v) } };
        });

    const voltar = () => {
        if (etapa === 0) {
            onFechar();
            return;
        }
        setDirection(-1);
        setEtapa((e) => e - 1);
    };

    const avancar = () => {
        if (!podeAvancar) return;
        if (etapa === 2) {
            confirmar();
            return;
        }
        setDirection(1);
        setEtapa((e) => e + 1);
    };

    const confirmar = () => {
        const grupoId = crypto.randomUUID();
        const membroIds = emails.map((email) => {
            const id = crypto.randomUUID();
            addMembro({ id, email, cargoIds: ["parceiro"], grupoIds: [grupoId], eventosCount: 0 });
            return id;
        });
        addGrupo({ id: grupoId, nome: nome.trim(), eventoIds: [], membroIds });

        const novas: Alocacao[] = itensSelecionados.map((t) => ({
            id: crypto.randomUUID(),
            grupoId,
            grupoNome: nome.trim(),
            setorNome: t.name,
            setorTipo: t.setorTipo,
            cota: sel[t.id].cota,
            usadas: 0,
            expira: "Sem prazo",
            ativa: true,
        }));
        addAlocacoes(novas);

        toast.success(`Grupo "${nome.trim()}" criado com cota de cortesias`);
        onFechar();
    };

    const steps: ProgressFeaturedIconType[] = STEP_TITLES.map((title, i) => ({
        title,
        description: STEP_DESCS[i],
        status: i < etapa ? "complete" : i === etapa ? "current" : "incomplete",
        icon: STEP_ICONS[i],
    }));

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Button size="sm" color="secondary" iconLeading={ArrowLeft} onClick={voltar}>
                    Voltar
                </Button>
                <h2 className="text-lg font-semibold text-primary">Configurar cotas</h2>
                <Button size="md" color="primary" isDisabled={!podeAvancar} onClick={avancar}>
                    {etapa === 2 ? "Criar grupo e cota" : "Avançar"}
                </Button>
            </div>

            <div className="flex flex-col items-center gap-8">
                <Progress.IconsWithText items={steps} size="sm" type="number" orientation="horizontal" className="max-w-[720px] max-md:hidden" />
                <Progress.IconsWithText items={steps} size="sm" type="number" orientation="vertical" className="w-full md:hidden" />

                <section className="w-full max-w-[720px] overflow-hidden">
                    <AnimatePresence mode="wait" custom={direction} initial={false}>
                        <motion.div
                            key={etapa}
                            custom={direction}
                            variants={stepVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.22, ease: "easeInOut" }}
                            className="flex flex-col"
                        >
                            {etapa === 0 && <StepGrupo nome={nome} onNome={setNome} emails={emails} onEmails={setEmails} />}
                            {etapa === 1 && <StepIngressos sel={sel} onToggle={toggleSetor} onSetCota={setCota} totalCota={totalCota} />}
                            {etapa === 2 && (
                                <StepRevisao
                                    nome={nome}
                                    emails={emails}
                                    setores={itensSelecionados.map((t) => ({ nome: t.name, tipo: t.setorTipo, cota: sel[t.id].cota }))}
                                    totalCota={totalCota}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </section>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Step 0 — Grupo                                                     */
/* ------------------------------------------------------------------ */

function StepGrupo({
    nome,
    onNome,
    emails,
    onEmails,
}: {
    nome: string;
    onNome: (v: string) => void;
    emails: string[];
    onEmails: (v: string[]) => void;
}) {
    const [input, setInput] = useState("");

    const addMany = (raw: string) => {
        const novos = raw
            .split(/[\s,;|\t\n\r]+/)
            .map((s) => s.trim().toLowerCase())
            .filter((s) => EMAIL_REGEX.test(s) && !emails.includes(s));
        if (novos.length > 0) onEmails([...emails, ...novos]);
    };

    const tryAdd = () => {
        const email = input.trim().toLowerCase();
        if (!email) return;
        if (EMAIL_REGEX.test(email) && !emails.includes(email)) onEmails([...emails, email]);
        setInput("");
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const text = e.clipboardData.getData("text");
        if (!text.trim()) return;
        e.preventDefault();
        addMany(text);
        setInput("");
    };

    const removeEmail = (idx: number) => onEmails(emails.filter((_, i) => i !== idx));

    return (
        <div className="mx-auto flex w-full max-w-[560px] flex-col gap-6">
            <Input label="Nome do grupo" placeholder="Ex: Patrocinador Master, Prefeitura…" value={nome} onChange={onNome} isRequired />

            <div className="flex flex-col gap-4">
                <div
                    onKeyDown={(e) => {
                        if ((e.key === "Enter" || e.key === " ") && input.trim()) {
                            e.preventDefault();
                            tryAdd();
                        } else if (e.key === "Backspace" && !input && emails.length > 0) {
                            e.preventDefault();
                            removeEmail(emails.length - 1);
                        }
                    }}
                    onPaste={handlePaste}
                >
                    <InputGroup
                        label="E-mails dos parceiros"
                        hint="Enter ou Espaço para adicionar · cole uma lista para importar vários"
                        value={input}
                        onChange={setInput}
                        trailingAddon={
                            <Button size="sm" color="secondary" iconLeading={CornerDownLeft} onClick={tryAdd}>
                                {isMac ? "Return" : "Enter"}
                            </Button>
                        }
                    >
                        <InputBase placeholder="parceiro@empresa.com" />
                    </InputGroup>
                </div>

                {emails.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {emails.map((email, i) => (
                            <span key={i} className="flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1 text-sm text-secondary ring-1 ring-border-secondary">
                                {email}
                                <button
                                    type="button"
                                    aria-label={`Remover ${email}`}
                                    onClick={() => removeEmail(i)}
                                    className="text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary"
                                >
                                    <XClose className="size-3.5" aria-hidden="true" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                <p className="text-sm text-tertiary">
                    <span className="font-semibold text-secondary">{num(emails.length)}</span> e-mail{emails.length !== 1 ? "s" : ""} adicionado{emails.length !== 1 ? "s" : ""}.
                </p>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Step 1 — Ingressos e cotas                                         */
/* ------------------------------------------------------------------ */

function StepIngressos({
    sel,
    onToggle,
    onSetCota,
    totalCota,
}: {
    sel: SelState;
    onToggle: (id: string) => void;
    onSetCota: (id: string, v: number) => void;
    totalCota: number;
}) {
    const [categoria, setCategoria] = useState<Categoria>("ingressos");
    const [busca, setBusca] = useState("");
    const [abertas, setAbertas] = useState<Set<string>>(() => new Set(SESSIONS.map((s) => s.id)));
    const q = busca.trim().toLowerCase();

    const sessoes = useMemo(() => {
        if (!q) return SESSIONS;
        return SESSIONS.map((s) => ({
            ...s,
            groups: s.groups
                .map((g) => ({ ...g, tickets: g.tickets.filter((t) => t.name.toLowerCase().includes(q) || t.type.toLowerCase().includes(q) || g.name.toLowerCase().includes(q)) }))
                .filter((g) => g.tickets.length > 0),
        })).filter((s) => s.groups.length > 0);
    }, [q]);

    const produtos = useMemo(() => (q ? PRODUCTS.filter((p) => p.name.toLowerCase().includes(q)) : PRODUCTS), [q]);
    const combos = useMemo(() => (q ? COMBOS.filter((c) => c.name.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q)) : COMBOS), [q]);

    const toggleAccordion = (id: string) =>
        setAbertas((prev) => {
            const n = new Set(prev);
            if (n.has(id)) n.delete(id);
            else n.add(id);
            return n;
        });

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-tertiary">Marque os itens liberados e defina a cota de cada um.</p>

            {/* Busca + tabs de categoria */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                    <Input icon={SearchLg} aria-label="Buscar itens" placeholder="Busque por setor, item ou lote" value={busca} onChange={setBusca} />
                </div>
                <Tabs selectedKey={categoria} onSelectionChange={(k) => setCategoria(k as Categoria)} className="w-fit!">
                    <Tabs.List type="button-border" size="sm">
                        <Tabs.Item id="ingressos">Ingressos</Tabs.Item>
                        <Tabs.Item id="produtos">Produtos</Tabs.Item>
                        <Tabs.Item id="combos">Combos</Tabs.Item>
                    </Tabs.List>
                </Tabs>
            </div>

            {categoria === "ingressos" &&
                (sessoes.length === 0 ? (
                    <VazioBusca />
                ) : (
                    sessoes.map((s) => {
                        const aberta = q !== "" || abertas.has(s.id);
                        return (
                            <div key={s.id} className="flex flex-col overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
                                <button
                                    type="button"
                                    onClick={() => toggleAccordion(s.id)}
                                    aria-expanded={aberta}
                                    className={cx("flex items-center gap-3 px-4 py-3 text-left transition duration-100 ease-linear hover:bg-primary_hover", aberta && "border-b border-secondary")}
                                >
                                    <FeaturedIcon icon={Calendar} color="gray" theme="modern" size="sm" />
                                    <h3 className="flex-1 text-sm font-semibold text-primary">{s.datetime}</h3>
                                    <ChevronDown className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-150", aberta && "rotate-180")} aria-hidden="true" />
                                </button>

                                {aberta && (
                                    <div className="flex flex-col gap-5 p-4">
                                        {s.groups.map((g) => (
                                            <div key={g.name} className="flex flex-col gap-2">
                                                <p className="text-sm font-semibold tracking-wide text-primary">{g.name}</p>
                                                <div className="flex flex-col gap-1">
                                                    {g.tickets.map((t) => {
                                                        const st = sel[t.id] ?? { on: false, cota: 0 };
                                                        return (
                                                            <div key={t.id} className="flex items-center gap-3 rounded-md px-2 py-1.5 transition duration-100 ease-linear hover:bg-primary_hover">
                                                                <Checkbox isSelected={st.on} onChange={() => onToggle(t.id)} aria-label={t.name} />
                                                                <span className="flex min-w-0 flex-1 items-center gap-2">
                                                                    <span className="truncate text-sm font-medium text-primary">{t.name}</span>
                                                                    <Badge size="sm" type="pill-color" color="gray">
                                                                        {t.type}
                                                                    </Badge>
                                                                </span>
                                                                <CotaAnimada show={st.on} value={st.cota} onSet={(v) => onSetCota(t.id, v)} />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                ))}

            {categoria === "produtos" &&
                (produtos.length === 0 ? (
                    <VazioBusca />
                ) : (
                    <div className="flex flex-col gap-1 rounded-xl bg-primary p-3 ring-1 ring-border-secondary">
                        {produtos.map((p) => {
                            const st = sel[p.id] ?? { on: false, cota: 0 };
                            return (
                                <div key={p.id} className="flex items-center gap-3 rounded-md px-2 py-1.5 transition duration-100 ease-linear hover:bg-primary_hover">
                                    <Checkbox isSelected={st.on} onChange={() => onToggle(p.id)} aria-label={p.name} />
                                    <img src={p.imageUrl} alt="" className="size-9 shrink-0 rounded-md object-cover ring-1 ring-secondary" />
                                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-primary">{p.name}</span>
                                    <CotaAnimada show={st.on} value={st.cota} onSet={(v) => onSetCota(p.id, v)} />
                                </div>
                            );
                        })}
                    </div>
                ))}

            {categoria === "combos" &&
                (combos.length === 0 ? (
                    <VazioBusca />
                ) : (
                    <div className="flex flex-col gap-1 rounded-xl bg-primary p-3 ring-1 ring-border-secondary">
                        {combos.map((c) => {
                            const st = sel[c.id] ?? { on: false, cota: 0 };
                            return (
                                <div key={c.id} className="flex items-start gap-3 rounded-md px-2 py-2 transition duration-100 ease-linear hover:bg-primary_hover">
                                    <span className="pt-0.5">
                                        <Checkbox isSelected={st.on} onChange={() => onToggle(c.id)} aria-label={c.name} />
                                    </span>
                                    <span className="flex min-w-0 flex-1 flex-col">
                                        <span className="truncate text-sm font-medium text-primary">{c.name}</span>
                                        <span className="truncate text-sm text-tertiary">{c.subtitle}</span>
                                    </span>
                                    <CotaAnimada show={st.on} value={st.cota} onSet={(v) => onSetCota(c.id, v)} />
                                </div>
                            );
                        })}
                    </div>
                ))}

            <div className="mt-2 flex items-center justify-between rounded-xl bg-brand-primary p-5 ring-1 ring-border-secondary">
                <span className="text-sm text-secondary">Total de cortesias</span>
                <span className="text-display-xs font-bold text-primary">
                    {num(totalCota)} <span className="text-sm font-medium text-tertiary">cortesias</span>
                </span>
            </div>
        </div>
    );
}

function VazioBusca() {
    return <p className="rounded-lg bg-secondary px-4 py-8 text-center text-sm text-tertiary">Nenhum item corresponde à busca.</p>;
}

/** Campo de cota que entra/sai com animação quando o item é selecionado. */
function CotaAnimada({ show, value, onSet }: { show: boolean; value: number; onSet: (v: number) => void }) {
    return (
        <AnimatePresence initial={false}>
            {show && (
                <motion.div
                    key="cota"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="shrink-0"
                >
                    <CotaField value={value} onSet={onSet} />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function CotaField({ value, onSet }: { value: number; onSet: (v: number) => void }) {
    return (
        <div className="flex shrink-0 items-center gap-2">
            <Input
                type="number"
                size="sm"
                aria-label="Cota de cortesias"
                value={String(value)}
                onChange={(v) => onSet(Math.max(0, parseInt(v.replace(/\D/g, ""), 10) || 0))}
                className="w-24"
            />
            <span className="hidden text-sm text-tertiary sm:inline">cortesias</span>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Step 2 — Revisão                                                   */
/* ------------------------------------------------------------------ */

function StepRevisao({
    nome,
    emails,
    setores,
    totalCota,
}: {
    nome: string;
    emails: string[];
    setores: { nome: string; tipo: string; cota: number }[];
    totalCota: number;
}) {
    const visiveis = emails.slice(0, 10);
    const restantes = emails.length - visiveis.length;

    return (
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4">
            <RevCard titulo="Grupo">
                <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-utility-purple-100 text-sm font-bold text-utility-purple-700">
                        {(nome || "?").slice(0, 2).toUpperCase()}
                    </span>
                    <div className="flex min-w-0 flex-col">
                        <span className="truncate text-md font-semibold text-primary">{nome || "—"}</span>
                        <span className="text-sm text-tertiary">
                            {num(emails.length)} {emails.length === 1 ? "parceiro" : "parceiros"}
                        </span>
                    </div>
                </div>
                {emails.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {visiveis.map((email, i) => (
                            <span key={i} className="rounded-md bg-secondary px-2 py-1 text-sm text-secondary">
                                {email}
                            </span>
                        ))}
                        {restantes > 0 && <span className="rounded-md bg-secondary px-2 py-1 text-sm text-tertiary">+{num(restantes)} outros</span>}
                    </div>
                )}
            </RevCard>

            <RevCard titulo="Nível de acesso">
                <div className="flex items-center gap-2.5">
                    <CheckCircle className="size-5 shrink-0 text-fg-success-primary" aria-hidden="true" />
                    <span className="text-sm font-medium text-primary">Gestão e Envio de Cortesias</span>
                </div>
            </RevCard>

            <RevCard titulo="Ingressos e cotas">
                <div className="flex flex-col">
                    {setores.map((s, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 border-b border-secondary py-2.5 first:pt-0 last:border-b-0">
                            <div className="flex min-w-0 flex-col">
                                <span className="truncate text-sm font-medium text-primary">{s.nome}</span>
                                <span className="truncate text-sm text-tertiary">{s.tipo}</span>
                            </div>
                            <span className="shrink-0 text-sm font-semibold text-primary">{num(s.cota)} cortesias</span>
                        </div>
                    ))}
                    <div className="flex items-center justify-between gap-3 pt-3">
                        <span className="text-sm text-tertiary">Total liberado</span>
                        <span className="text-sm font-bold text-primary">{num(totalCota)} cortesias</span>
                    </div>
                </div>
            </RevCard>
        </div>
    );
}

function RevCard({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-3.5 rounded-2xl bg-primary p-6 ring-1 ring-border-secondary">
            <span className="text-sm font-medium tracking-wide text-tertiary uppercase">{titulo}</span>
            {children}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Resumo de uso (mini relatório)                                     */
/* ------------------------------------------------------------------ */

const GRID_COLS = "md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_120px_minmax(0,1.4fr)]";

function ResumoUso({ admins }: { admins: { id: string; email: string }[] }) {
    const alocacoes = useAlocacoes();
    const grupos = useGrupos();
    const membros = useMembros();
    const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
    const [pessoasAbertas, setPessoasAbertas] = useState<Set<string>>(new Set());

    const membroById = useMemo(() => new Map(membros.map((m) => [m.id, m])), [membros]);
    const grupoById = useMemo(() => new Map(grupos.map((g) => [g.id, g])), [grupos]);

    // Agrupa as alocações por grupo (cada grupo = uma linha expansível).
    const gruposAloc = useMemo(() => {
        const map = new Map<string, { grupoId: string; grupoNome: string; itens: Alocacao[]; usadas: number; cota: number; ativa: boolean }>();
        for (const a of alocacoes) {
            const g = map.get(a.grupoId) ?? { grupoId: a.grupoId, grupoNome: a.grupoNome, itens: [], usadas: 0, cota: 0, ativa: false };
            g.itens.push(a);
            g.usadas += a.usadas;
            g.cota += a.cota;
            g.ativa = g.ativa || a.ativa;
            map.set(a.grupoId, g);
        }
        return [...map.values()];
    }, [alocacoes]);

    const toggle = (id: string) =>
        setExpandidos((prev) => {
            const n = new Set(prev);
            if (n.has(id)) n.delete(id);
            else n.add(id);
            return n;
        });

    const togglePessoa = (id: string) =>
        setPessoasAbertas((prev) => {
            const n = new Set(prev);
            if (n.has(id)) n.delete(id);
            else n.add(id);
            return n;
        });

    return (
        <div className="overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
            <div className={cx("hidden gap-4 border-b border-secondary bg-secondary px-5 py-3 md:grid", GRID_COLS)}>
                <ColHead>Parceiro</ColHead>
                <ColHead>Item vinculado</ColHead>
                <ColHead>Status</ColHead>
                <ColHead>Consumo da cota</ColHead>
            </div>

            {/* Admins / permissão equivalente — acesso total, cota ilimitada */}
            {admins.map((m) => (
                <div key={m.id} className={cx("flex flex-col gap-3 border-b border-secondary px-5 py-4 last:border-b-0 md:grid md:items-center md:gap-4", GRID_COLS)}>
                    <div className="flex items-center gap-3">
                        <span className="size-4 shrink-0" aria-hidden="true" />
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-utility-blue-100 text-sm font-bold text-utility-blue-700">{m.email.slice(0, 2).toUpperCase()}</span>
                        <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-semibold text-primary">{m.email}</span>
                            <span className="truncate text-sm text-tertiary">Administrador · acesso total</span>
                        </div>
                    </div>
                    <div className="text-sm text-primary">Todos</div>
                    <div>
                        <Badge size="sm" type="pill-color" color="success">
                            Ativo
                        </Badge>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                        <span className="text-md text-fg-quaternary" aria-hidden="true">∞</span>
                        Ilimitado
                    </span>
                </div>
            ))}

            {/* Grupos parceiros — linha expansível: grupo > pessoas + ingressos/limites/enviados */}
            {gruposAloc.map((g) => {
                const aberto = expandidos.has(g.grupoId);
                const membrosDoGrupo = (grupoById.get(g.grupoId)?.membroIds ?? []).map((id) => membroById.get(id)).filter((m): m is NonNullable<typeof m> => !!m);
                // Distribui os enviados de cada ingresso entre as pessoas do grupo (soma = usadas do grupo).
                const idsMembros = membrosDoGrupo.map((m) => m.id);
                const distribuicoes = g.itens.map((a) => distribuir(a.usadas, idsMembros));
                return (
                    <Fragment key={g.grupoId}>
                        <div
                            role="button"
                            tabIndex={0}
                            aria-expanded={aberto}
                            onClick={() => toggle(g.grupoId)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    toggle(g.grupoId);
                                }
                            }}
                            className={cx("flex cursor-pointer flex-col gap-3 border-b border-secondary px-5 py-4 transition duration-100 ease-linear last:border-b-0 hover:bg-primary_hover md:grid md:items-center md:gap-4", GRID_COLS)}
                        >
                            <div className="flex items-center gap-3">
                                <ChevronDown className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-150", aberto && "rotate-180")} aria-hidden="true" />
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-utility-purple-100 text-sm font-bold text-utility-purple-700">{g.grupoNome.slice(0, 2).toUpperCase()}</span>
                                <div className="flex min-w-0 flex-col">
                                    <span className="truncate text-sm font-semibold text-primary">{g.grupoNome}</span>
                                    <span className="truncate text-sm text-tertiary">
                                        {num(membrosDoGrupo.length)} {membrosDoGrupo.length === 1 ? "pessoa" : "pessoas"}
                                    </span>
                                </div>
                            </div>
                            <div className="text-sm text-tertiary">
                                {num(g.itens.length)} {g.itens.length === 1 ? "item liberado" : "itens liberados"}
                            </div>
                            <div>
                                <Badge size="sm" type="pill-color" color={g.ativa ? "success" : "gray"}>
                                    {g.ativa ? "Ativa" : "Expirada"}
                                </Badge>
                            </div>
                            <ConsumoBar usadas={g.usadas} cota={g.cota} ativa={g.ativa} />
                        </div>

                        {aberto && (
                            <div className="flex flex-col gap-5 border-b border-secondary bg-secondary/40 px-5 py-4 md:pl-16">
                                <section className="flex flex-col gap-2">
                                    {membrosDoGrupo.length > 0 ? (
                                        <div className="flex flex-col gap-2">
                                            {membrosDoGrupo.map((m) => (
                                                <PessoaLinha
                                                    key={m.id}
                                                    email={m.email}
                                                    itens={g.itens.map((a, idx) => ({
                                                        setorNome: a.setorNome,
                                                        setorTipo: a.setorTipo,
                                                        enviados: distribuicoes[idx].get(m.id) ?? 0,
                                                        cota: a.cota,
                                                        ativa: a.ativa,
                                                    }))}
                                                    aberta={pessoasAbertas.has(`${g.grupoId}:${m.id}`)}
                                                    onToggle={() => togglePessoa(`${g.grupoId}:${m.id}`)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-sm text-tertiary">Nenhuma pessoa vinculada.</span>
                                    )}
                                </section>
                            </div>
                        )}
                    </Fragment>
                );
            })}

            {alocacoes.length === 0 && admins.length === 0 && (
                <div className="px-5 py-12 text-center text-sm text-tertiary">Nenhuma cota ativa ainda.</div>
            )}
        </div>
    );
}

interface PessoaItem {
    setorNome: string;
    setorTipo: string;
    enviados: number;
    cota: number;
    ativa: boolean;
}

/** Nível 3: pessoa do grupo, expansível para ver seus ingressos e limites. */
function PessoaLinha({ email, itens, aberta, onToggle }: { email: string; itens: PessoaItem[]; aberta: boolean; onToggle: () => void }) {
    const enviados = itens.reduce((acc, it) => acc + it.enviados, 0);
    const cota = itens.reduce((acc, it) => acc + it.cota, 0);
    const ativa = itens.some((it) => it.ativa);

    return (
        <div className="overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
            <div
                role="button"
                tabIndex={0}
                aria-expanded={aberta}
                onClick={onToggle}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onToggle();
                    }
                }}
                className={cx(
                    "flex cursor-pointer flex-col gap-3 px-4 py-3 transition duration-100 ease-linear hover:bg-primary_hover md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,260px)] md:items-center md:gap-6",
                    aberta && "border-b border-secondary",
                )}
            >
                <div className="flex items-center gap-3">
                    <ChevronDown className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-150", aberta && "rotate-180")} aria-hidden="true" />
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-semibold text-secondary ring-1 ring-border-secondary">
                        {email.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-semibold text-primary">{email}</span>
                        <span className="truncate text-sm text-tertiary">
                            {num(itens.length)} {itens.length === 1 ? "item" : "itens"}
                        </span>
                    </div>
                </div>
                <ConsumoBar usadas={enviados} cota={cota} ativa={ativa} />
            </div>

            {aberta && (
                <div className="flex flex-col gap-3 px-4 py-3">
                    {itens.map((it, i) => (
                        <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,260px)] sm:items-center sm:gap-6">
                            <div className="flex min-w-0 flex-col">
                                <span className="truncate text-sm font-medium text-primary">{it.setorNome}</span>
                                <span className="truncate text-sm text-tertiary">{it.setorTipo}</span>
                            </div>
                            <ConsumoBar usadas={it.enviados} cota={it.cota} ativa={it.ativa} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ConsumoBar({ usadas, cota, ativa }: { usadas: number; cota: number; ativa: boolean }) {
    const pct = cota > 0 ? Math.min(100, Math.round((usadas / cota) * 100)) : 0;
    const cheio = usadas >= cota;
    const alto = pct >= 85;
    const cor = !ativa || cheio ? "bg-error-solid" : alto ? "bg-warning-solid" : "bg-success-solid";
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-primary">
                    {num(usadas)}/{num(cota)}
                </span>
                <span className="text-tertiary">{pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-quaternary">
                <div className={cx("h-full rounded-full transition-all duration-300 ease-linear", cor)} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Utilitários visuais                                                */
/* ------------------------------------------------------------------ */

function ColHead({ children }: { children: React.ReactNode }) {
    return <span className="text-sm font-medium text-tertiary">{children}</span>;
}

