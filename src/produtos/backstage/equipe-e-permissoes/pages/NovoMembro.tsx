import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, BarChartSquare02, CheckCircle, ChevronDown, CornerDownLeft, Settings01, Shield01, Ticket01, User01, Users01 } from "@untitledui/icons";
import { toast } from "sonner";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input, InputBase } from "@/components/base/input/input";
import { InputGroup } from "@/components/base/input/input-group";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { TreeView } from "@/components/application/tree-view/tree-view";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import type { ProgressFeaturedIconType } from "@/components/application/progress-steps/progress-types";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import {
    MODULOS,
    RELATORIOS,
    TICKETS,
    addMembro,
    getMembro,
    moduloLabel,
    relatorioLabel,
    updateMembro,
    type Membro,
    type MembroTipo,
    type RegraIngresso,
} from "../data/membros";

const brNum = (n: number) => n.toLocaleString("pt-BR");
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);

type SelState = Record<string, { on: boolean; cota: number }>;

/** Módulos que possuem tela de configuração no passo 3. */
const CONFIG_MODULOS = ["cortesias", "relatorios"];

const STEP_TITLES = ["Identificação", "Permissões", "Configuração", "Revisão"];
const STEP_ICONS = [User01, Shield01, Settings01, CheckCircle];
const STEP_DESCS = ["Quem é o membro", "Módulos de acesso", "Regras de acesso", "Confirmar acesso"];

export function NovoMembro() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const editMembro = id ? getMembro(id) : undefined;
    const editMode = !!editMembro;

    const [step, setStep] = useState(0);
    const [tipo, setTipo] = useState<MembroTipo | null>(() => editMembro?.tipo ?? null);
    const [nome, setNome] = useState(() => editMembro?.nome ?? "");
    const [emails, setEmails] = useState<string[]>(() => editMembro?.emails ?? []);
    const [modulos, setModulos] = useState<string[]>(() => editMembro?.modulos ?? ["cortesias"]);
    const [relatorios, setRelatorios] = useState<string[]>(() => editMembro?.relatorios ?? []);
    const [conviteFantasma, setConviteFantasma] = useState(() => editMembro?.conviteFantasma ?? false);
    const [sel, setSel] = useState<SelState>(() => {
        if (!editMembro) return {};
        const s: SelState = {};
        editMembro.regras.forEach((r) => {
            s[r.ticketId] = { on: true, cota: r.cota };
        });
        return s;
    });
    const [confirmOpen, setConfirmOpen] = useState(false);

    const isGrupo = tipo === "grupo";
    const configModulos = modulos.filter((m) => CONFIG_MODULOS.includes(m));

    /* ghost invite detection (só indivíduo) */
    useEffect(() => {
        if (tipo !== "individuo") {
            setConviteFantasma(false);
            return;
        }
        const t = setTimeout(() => {
            const v = nome.trim().toLowerCase();
            const parecEmail = EMAIL_REGEX.test(v);
            setConviteFantasma(parecEmail && !v.endsWith("@ingresse.com"));
        }, 400);
        return () => clearTimeout(t);
    }, [nome, tipo]);

    const ticketsSelecionados = useMemo(() => TICKETS.filter((t) => sel[t.id]?.on && sel[t.id].cota > 0), [sel]);
    const totalCota = useMemo(() => ticketsSelecionados.reduce((acc, t) => acc + sel[t.id].cota, 0), [ticketsSelecionados, sel]);

    const podeAvancar = (() => {
        if (step === 0) return isGrupo ? nome.trim().length > 0 : nome.trim().length > 3;
        if (step === 1) return modulos.length > 0;
        if (step === 2) {
            const cortesiasOk = !modulos.includes("cortesias") || ticketsSelecionados.length > 0;
            const relatoriosOk = !modulos.includes("relatorios") || relatorios.length > 0;
            return cortesiasOk && relatoriosOk;
        }
        return true;
    })();

    /* ---- ações ---- */
    const toggleModulo = (id: string) =>
        setModulos((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));

    const toggleRelatorio = (id: string) =>
        setRelatorios((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));

    const toggleTicket = (id: string) =>
        setSel((prev) => {
            const atual = prev[id] ?? { on: false, cota: 0 };
            const on = !atual.on;
            return { ...prev, [id]: { on, cota: on ? (atual.cota > 0 ? atual.cota : 10) : 0 } };
        });

    const setCota = (id: string, v: number) =>
        setSel((prev) => {
            const atual = prev[id];
            if (!atual?.on) return prev;
            return { ...prev, [id]: { ...atual, cota: Math.max(0, v) } };
        });

    const cancelar = () => navigate("/backstage/equipe-e-permissoes");

    const voltar = () => {
        if (step === 0) {
            if (editMode) {
                cancelar();
            } else {
                setTipo(null);
            }
            return;
        }
        setStep((s) => s - 1);
    };

    const avancar = () => {
        if (!podeAvancar) return;
        if (step === 3) {
            setConfirmOpen(true);
            return;
        }
        setStep((s) => s + 1);
    };

    const buildMembro = (): Membro => {
        const temCortesias = modulos.includes("cortesias");
        const temRelatorios = modulos.includes("relatorios");
        const regras: RegraIngresso[] = temCortesias
            ? ticketsSelecionados.map((t) => {
                  const usadas = editMembro?.regras.find((r) => r.ticketId === t.id)?.usadas ?? 0;
                  return { ticketId: t.id, label: t.name, cota: sel[t.id].cota, usadas };
              })
            : [];
        return {
            id: editMembro?.id ?? crypto.randomUUID(),
            tipo: tipo!,
            nome: nome.trim(),
            emails: isGrupo ? emails : [],
            modulos,
            regras,
            relatorios: temRelatorios ? relatorios : [],
            conviteFantasma: tipo === "individuo" ? conviteFantasma : false,
            criadoEm: editMembro?.criadoEm ?? new Date().toISOString(),
        };
    };

    const confirmar = () => {
        const membro = buildMembro();
        if (editMode) {
            updateMembro(membro.id, membro);
            toast.success("Membro atualizado");
        } else {
            addMembro(membro);
            toast.success("Membro adicionado à equipe");
        }
        setConfirmOpen(false);
        navigate("/backstage/equipe-e-permissoes");
    };

    /* ---- pré-seleção (sem stepper) ---- */
    if (tipo === null) {
        return (
            <BackstageLayout activeSection="equipe-e-permissoes">
                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="relative flex items-center justify-between gap-3 px-6 py-6">
                        <Button size="sm" color="secondary" iconLeading={ArrowLeft} onClick={cancelar}>
                            Cancelar
                        </Button>
                        <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-display-xs font-bold text-primary">
                            Adicionar membro à equipe
                        </h1>
                        <span className="w-[92px]" />
                    </header>

                    <main className="flex flex-1 flex-col items-center gap-8 px-6 py-10">
                        <p className="text-center text-md text-tertiary">Você está adicionando acesso a quem?</p>
                        <div className="grid w-full max-w-[760px] grid-cols-1 gap-4 sm:grid-cols-2">
                            <TipoCard
                                icon={User01}
                                cor="gray"
                                titulo="Indivíduo"
                                descricao="Uma pessoa com e-mail ou CPF e cota dedicada."
                                onClick={() => setTipo("individuo")}
                            />
                            <TipoCard
                                icon={Users01}
                                cor="brand"
                                titulo="Grupo / Empresa"
                                descricao="Uma organização (ex: patrocinador) com vários emissores."
                                onClick={() => setTipo("grupo")}
                            />
                        </div>
                    </main>
                </div>
            </BackstageLayout>
        );
    }

    /* ---- wizard ---- */
    const steps: ProgressFeaturedIconType[] = STEP_TITLES.map((title, i) => ({
        title,
        description: STEP_DESCS[i],
        status: i < step ? "complete" : i === step ? "current" : "incomplete",
        icon: STEP_ICONS[i],
    }));

    return (
        <BackstageLayout activeSection="equipe-e-permissoes">
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="relative flex items-center justify-between gap-3 px-6 py-6">
                    <Button size="sm" color="secondary" iconLeading={ArrowLeft} onClick={voltar}>
                        Voltar
                    </Button>
                    <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-display-xs font-bold text-primary">
                        {editMode ? "Editar membro" : "Adicionar membro"}
                    </h1>
                    <Button size="md" color="primary" isDisabled={!podeAvancar} onClick={avancar}>
                        {step === 3 ? "Confirmar e Convidar" : "Avançar"}
                    </Button>
                </header>

                <main className="flex flex-1 flex-col items-center gap-8 px-6 py-6">
                    <Progress.IconsWithText items={steps} size="sm" type="number" orientation="horizontal" className="max-w-[860px] max-md:hidden" />
                    <Progress.IconsWithText items={steps} size="sm" type="number" orientation="vertical" className="w-full md:hidden" />

                    <section className="flex w-full max-w-[900px] flex-col">
                        {step === 0 && (
                            <StepIdentificacao
                                isGrupo={isGrupo}
                                nome={nome}
                                onNome={setNome}
                                emails={emails}
                                onEmails={setEmails}
                                conviteFantasma={conviteFantasma}
                            />
                        )}
                        {step === 1 && <StepPermissoes modulos={modulos} onToggle={toggleModulo} />}
                        {step === 2 && (
                            <StepConfiguracao
                                configModulos={configModulos}
                                sel={sel}
                                onToggle={toggleTicket}
                                onSetCota={setCota}
                                totalCota={totalCota}
                                relatorios={relatorios}
                                onToggleRelatorio={toggleRelatorio}
                            />
                        )}
                        {step === 3 && (
                            <StepRevisao
                                isGrupo={isGrupo}
                                nome={nome}
                                emails={emails}
                                conviteFantasma={conviteFantasma}
                                modulos={modulos}
                                regras={ticketsSelecionados.map((t) => ({ label: t.name, cota: sel[t.id].cota }))}
                                totalCota={totalCota}
                                relatorios={relatorios}
                            />
                        )}
                    </section>
                </main>
            </div>

            <ModalOverlay isOpen={confirmOpen} onOpenChange={(o) => !o && setConfirmOpen(false)} isDismissable>
                <Modal className="sm:max-w-[480px]">
                    <Dialog>
                        <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                            <div className="flex items-start gap-4">
                                <FeaturedIcon icon={CheckCircle} color="success" theme="light" size="lg" />
                                <div className="flex flex-col gap-1">
                                    <h2 className="text-lg font-semibold text-primary">Confirmar e convidar</h2>
                                    <p className="text-sm text-tertiary">
                                        {isGrupo ? (
                                            <>
                                                Você vai criar o grupo <strong>{nome}</strong>
                                                {emails.length > 0 && (
                                                    <> com <strong>{brNum(emails.length)}</strong> {emails.length === 1 ? "membro" : "membros"}</>
                                                )}
                                                {modulos.includes("cortesias") && (
                                                    <> e liberar <strong>{brNum(totalCota)}</strong> cortesias</>
                                                )}
                                                .
                                            </>
                                        ) : conviteFantasma ? (
                                            <>
                                                Enviaremos um convite de ativação para <strong>{nome}</strong> criar a senha e resgatar as cotas.
                                            </>
                                        ) : (
                                            <>
                                                <strong>{nome}</strong> receberá acesso de gerenciamento de cortesias neste evento.
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Button size="md" color="secondary" onClick={() => setConfirmOpen(false)}>
                                    Voltar
                                </Button>
                                <Button size="md" color="primary" onClick={confirmar}>
                                    {editMode ? "Salvar alterações" : "Confirmar e Convidar"}
                                </Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Pré-seleção — Cards de tipo                                        */
/* ------------------------------------------------------------------ */

function TipoCard({
    icon: Icon,
    cor,
    titulo,
    descricao,
    onClick,
}: {
    icon: typeof User01;
    cor: "brand" | "gray";
    titulo: string;
    descricao: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex flex-col items-center gap-4 rounded-2xl bg-primary p-8 text-center ring-1 ring-border-secondary transition duration-100 ease-linear hover:ring-2 hover:ring-brand"
        >
            <FeaturedIcon icon={Icon} color={cor} theme="light" size="xl" />
            <div className="flex flex-col gap-1.5">
                <span className="text-lg font-semibold text-primary">{titulo}</span>
                <span className="text-sm text-tertiary">{descricao}</span>
            </div>
        </button>
    );
}

/* ------------------------------------------------------------------ */
/*  Step 0 — Identificação                                             */
/* ------------------------------------------------------------------ */

function StepIdentificacao({
    isGrupo,
    nome,
    onNome,
    emails,
    onEmails,
    conviteFantasma,
}: {
    isGrupo: boolean;
    nome: string;
    onNome: (v: string) => void;
    emails: string[];
    onEmails: (v: string[]) => void;
    conviteFantasma: boolean;
}) {
    if (!isGrupo) {
        return (
            <div className="mx-auto flex w-full max-w-[560px] flex-col gap-3">
                <Input
                    label="E-mail ou CPF do usuário"
                    placeholder="nome@empresa.com ou 000.000.000-00"
                    value={nome}
                    onChange={onNome}
                    isRequired
                />
                {conviteFantasma && (
                    <div className="flex flex-col gap-1 rounded-xl bg-warning-primary p-4">
                        <span className="text-sm font-semibold text-warning-primary">Usuário não cadastrado</span>
                        <span className="text-sm text-warning-primary">Um convite de ativação será enviado para este e-mail.</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-[560px] flex-col gap-6">
            <Input label="Nome do Grupo / Empresa" placeholder="Ex: Patrocinador Ambev" value={nome} onChange={onNome} isRequired />
            <MembrosGrupoInput emails={emails} onEmails={onEmails} />
        </div>
    );
}

function MembrosGrupoInput({ emails, onEmails }: { emails: string[]; onEmails: (v: string[]) => void }) {
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
        <div className="flex flex-col gap-4">
            <div
                onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && input.trim()) {
                        e.preventDefault();
                        tryAdd();
                    }
                }}
                onPaste={handlePaste}
            >
                <InputGroup
                    label="Membros do grupo"
                    hint="Enter ou Espaço para adicionar · Cole uma lista para importar vários de uma vez"
                    value={input}
                    onChange={setInput}
                    trailingAddon={
                        <Button size="sm" color="secondary" iconLeading={CornerDownLeft} onClick={tryAdd}>
                            {isMac ? "Return" : "Enter"}
                        </Button>
                    }
                >
                    <InputBase placeholder="nome@empresa.com" />
                </InputGroup>
            </div>

            {emails.length > 0 && (
                <div className="overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
                    <div className="max-h-[40vh] overflow-y-auto">
                        {emails.map((email, i) => (
                            <div key={i} className="flex items-center justify-between gap-3 border-b border-secondary px-4 py-3 last:border-b-0">
                                <span className="truncate text-sm text-primary">{email}</span>
                                <Button size="sm" color="link-destructive" onClick={() => removeEmail(i)}>
                                    Deletar
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <p className="text-sm text-tertiary">
                <span className="font-semibold text-secondary">
                    {brNum(emails.length)} membro{emails.length !== 1 ? "s" : ""}
                </span>{" "}
                {emails.length !== 1 ? "adicionados" : "adicionado"}. Você também pode adicionar depois.
            </p>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Step 1 — Permissões                                                */
/* ------------------------------------------------------------------ */

function StepPermissoes({ modulos, onToggle }: { modulos: string[]; onToggle: (id: string) => void }) {
    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-tertiary">Selecione os módulos que este membro poderá acessar.</p>
            <div className="flex flex-col gap-2.5">
                {MODULOS.map((m) => {
                    const on = modulos.includes(m.id);
                    if (!m.disponivel) {
                        return (
                            <div
                                key={m.id}
                                className="pointer-events-none flex items-center gap-3 rounded-xl bg-primary p-4 opacity-50 ring-1 ring-border-secondary"
                            >
                                <span className="flex size-5 shrink-0 items-center justify-center rounded-md ring-2 ring-secondary" />
                                <span className="flex-1 text-sm font-medium text-primary">{m.label}</span>
                                <Badge size="sm" type="modern" color="gray">
                                    Em breve
                                </Badge>
                            </div>
                        );
                    }
                    return (
                        <button
                            key={m.id}
                            type="button"
                            onClick={() => onToggle(m.id)}
                            className={cx(
                                "flex items-center gap-3 rounded-xl bg-primary p-4 text-left ring-1 transition duration-100 ease-linear",
                                on ? "ring-brand" : "ring-border-secondary hover:ring-border-primary",
                            )}
                        >
                            <span className={cx("flex size-5 shrink-0 items-center justify-center rounded-md ring-2 transition", on ? "bg-brand-solid ring-brand" : "ring-secondary")}>
                                {on && <CheckIcon className="text-white" />}
                            </span>
                            <span className="flex-1 text-sm font-medium text-primary">{m.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Step 2 — Configuração                                              */
/* ------------------------------------------------------------------ */

function StepConfiguracao({
    configModulos,
    sel,
    onToggle,
    onSetCota,
    totalCota,
    relatorios,
    onToggleRelatorio,
}: {
    configModulos: string[];
    sel: SelState;
    onToggle: (id: string) => void;
    onSetCota: (id: string, v: number) => void;
    totalCota: number;
    relatorios: string[];
    onToggleRelatorio: (id: string) => void;
}) {
    const ticketsCount = TICKETS.filter((t) => sel[t.id]?.on && sel[t.id].cota > 0).length;

    const modConfig: Record<string, { icon: typeof Ticket01; titulo: string; resumo: string; body: React.ReactNode }> = {
        cortesias: {
            icon: Ticket01,
            titulo: "Gestão e Envio de Cortesias",
            resumo: ticketsCount > 0 ? `${ticketsCount} ${ticketsCount === 1 ? "ingresso" : "ingressos"} · ${brNum(totalCota)} cortesias` : "Nenhum ingresso liberado",
            body: <CortesiasConfig sel={sel} onToggle={onToggle} onSetCota={onSetCota} totalCota={totalCota} />,
        },
        relatorios: {
            icon: BarChartSquare02,
            titulo: "Relatórios e Dashboards",
            resumo: relatorios.length > 0 ? `${relatorios.length} ${relatorios.length === 1 ? "relatório" : "relatórios"}` : "Nenhum relatório liberado",
            body: <RelatoriosConfig relatorios={relatorios} onToggle={onToggleRelatorio} />,
        },
    };

    // 1 módulo → configuração direta; 2+ → accordion (um por módulo).
    if (configModulos.length === 1) {
        return <div className="flex flex-col">{modConfig[configModulos[0]].body}</div>;
    }

    return (
        <div className="flex flex-col gap-3">
            <p className="text-sm text-tertiary">Configure as regras de cada módulo liberado.</p>
            {configModulos.map((m) => (
                <ConfigAccordion key={m} icon={modConfig[m].icon} titulo={modConfig[m].titulo} resumo={modConfig[m].resumo}>
                    {modConfig[m].body}
                </ConfigAccordion>
            ))}
        </div>
    );
}

function ConfigAccordion({
    icon: Icon,
    titulo,
    resumo,
    children,
}: {
    icon: typeof Ticket01;
    titulo: string;
    resumo: string;
    children: React.ReactNode;
}) {
    const [aberto, setAberto] = useState(true);
    return (
        <div className="overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
            <button
                type="button"
                onClick={() => setAberto((v) => !v)}
                className="flex w-full items-center gap-3 px-4 py-4 text-left transition duration-100 ease-linear hover:bg-primary_hover"
            >
                <FeaturedIcon icon={Icon} color="brand" theme="light" size="sm" />
                <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-semibold text-primary">{titulo}</span>
                    <span className="truncate text-sm text-tertiary">{resumo}</span>
                </span>
                <ChevronDown className={cx("size-5 shrink-0 text-fg-quaternary transition-transform duration-150", aberto && "rotate-180")} />
            </button>
            <AnimatePresence initial={false}>
                {aberto && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-secondary p-4">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function CortesiasConfig({
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
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <span className="text-md font-semibold text-primary">Ingressos e cotas</span>
                <p className="text-sm text-tertiary">Marque os ingressos e defina a cota de cortesias de cada um.</p>
            </div>

            <div className="flex flex-col gap-2.5">
                {TICKETS.map((t) => {
                    const s = sel[t.id] ?? { on: false, cota: 0 };
                    return (
                        <div
                            key={t.id}
                            className={cx(
                                "flex flex-col gap-3 rounded-xl bg-primary p-4 ring-1 transition duration-100 ease-linear sm:flex-row sm:items-center sm:gap-4",
                                s.on ? "ring-brand" : "ring-border-secondary",
                            )}
                        >
                            <button type="button" onClick={() => onToggle(t.id)} className="flex flex-1 items-center gap-3 text-left">
                                <span className={cx("flex size-5 shrink-0 items-center justify-center rounded-md ring-2 transition", s.on ? "bg-brand-solid ring-brand" : "ring-secondary")}>
                                    {s.on && <CheckIcon className="text-white" />}
                                </span>
                                <span className="flex min-w-0 flex-col">
                                    <span className="text-sm font-medium text-primary">{t.name}</span>
                                    <span className="text-sm text-tertiary">{t.area}</span>
                                </span>
                            </button>
                            <CotaField disabled={!s.on} value={s.cota} onSet={(v) => onSetCota(t.id, v)} />
                        </div>
                    );
                })}
            </div>

            <div className="mt-2 flex items-center justify-between rounded-xl bg-brand-primary p-5 ring-1 ring-border-secondary">
                <span className="text-sm text-secondary">Total de cortesias</span>
                <span className="text-display-xs font-bold text-primary">
                    {brNum(totalCota)} <span className="text-sm font-medium text-tertiary">cortesias</span>
                </span>
            </div>
        </div>
    );
}

function RelatoriosConfig({ relatorios, onToggle }: { relatorios: string[]; onToggle: (id: string) => void }) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <span className="text-md font-semibold text-primary">Relatórios liberados</span>
                <p className="text-sm text-tertiary">Escolha quais relatórios e dashboards este membro poderá visualizar.</p>
            </div>

            <div className="flex flex-col gap-2.5">
                {RELATORIOS.map((r) => {
                    const on = relatorios.includes(r.id);
                    return (
                        <button
                            key={r.id}
                            type="button"
                            onClick={() => onToggle(r.id)}
                            className={cx(
                                "flex items-center gap-3 rounded-xl bg-primary p-4 text-left ring-1 transition duration-100 ease-linear",
                                on ? "ring-brand" : "ring-border-secondary hover:ring-border-primary",
                            )}
                        >
                            <span className={cx("flex size-5 shrink-0 items-center justify-center rounded-md ring-2 transition", on ? "bg-brand-solid ring-brand" : "ring-secondary")}>
                                {on && <CheckIcon className="text-white" />}
                            </span>
                            <span className="flex min-w-0 flex-col">
                                <span className="text-sm font-medium text-primary">{r.label}</span>
                                <span className="text-sm text-tertiary">{r.desc}</span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function CotaField({ disabled, value, onSet }: { disabled: boolean; value: number; onSet: (v: number) => void }) {
    return (
        <div className={cx("flex shrink-0 items-center gap-2", disabled && "pointer-events-none opacity-40")}>
            <Input
                type="number"
                size="sm"
                aria-label="Cota de cortesias"
                isDisabled={disabled}
                value={disabled ? "" : String(value)}
                onChange={(v) => onSet(Math.max(0, parseInt(v.replace(/\D/g, ""), 10) || 0))}
                className="w-24"
            />
            <span className="text-sm text-tertiary">cortesias</span>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Step 3 — Revisão                                                   */
/* ------------------------------------------------------------------ */

function StepRevisao({
    isGrupo,
    nome,
    emails,
    conviteFantasma,
    modulos,
    regras,
    totalCota,
    relatorios,
}: {
    isGrupo: boolean;
    nome: string;
    emails: string[];
    conviteFantasma: boolean;
    modulos: string[];
    regras: { label: string; cota: number }[];
    totalCota: number;
    relatorios: string[];
}) {
    const participantes = isGrupo ? emails.length : 1;

    return (
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4">
            {/* Card 1 — Identificação do membro/grupo + participantes */}
            <RevCard titulo="Membro">
                <div className="flex items-center gap-3">
                    <span
                        className={cx(
                            "flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                            isGrupo ? "bg-utility-purple-100 text-utility-purple-700" : "bg-utility-blue-100 text-utility-blue-700",
                        )}
                    >
                        {(nome || "?").slice(0, 2).toUpperCase()}
                    </span>
                    <div className="flex min-w-0 flex-col">
                        <span className="truncate text-md font-semibold text-primary">{nome || "—"}</span>
                        <span className="text-sm text-tertiary">
                            {isGrupo ? "Grupo / Empresa" : "Indivíduo"} · {brNum(participantes)} {participantes === 1 ? "participante" : "participantes"}
                        </span>
                    </div>
                    {!isGrupo && conviteFantasma && (
                        <Badge size="sm" type="pill-color" color="warning" className="ml-auto shrink-0">
                            Convite pendente
                        </Badge>
                    )}
                </div>
            </RevCard>

            {/* Card 2 — Níveis de acesso (features + detalhes em árvore) */}
            <RevCard titulo="Níveis de acesso">
                <TreeView aria-label="Níveis de acesso" size="sm" selectionMode="none" showConnectors defaultExpandedKeys={new Set(modulos)}>
                    {modulos.map((mod) => (
                        <TreeView.Item key={mod} id={mod} textValue={moduloLabel(mod)}>
                            <TreeView.ItemContent icon={mod === "cortesias" ? Ticket01 : mod === "relatorios" ? BarChartSquare02 : Shield01}>
                                <span className="font-semibold">{moduloLabel(mod)}</span>
                            </TreeView.ItemContent>

                            {mod === "cortesias" &&
                                regras.map((r, i) => (
                                    <TreeView.Item key={`c-${i}`} id={`c-${i}`} textValue={r.label}>
                                        <TreeView.ItemContent
                                            action={<span className="text-sm font-semibold text-primary">{brNum(r.cota)} cortesias</span>}
                                        >
                                            {r.label}
                                        </TreeView.ItemContent>
                                    </TreeView.Item>
                                ))}

                            {mod === "cortesias" && regras.length > 0 && (
                                <TreeView.Item id="c-total" textValue="Total de cortesias">
                                    <TreeView.ItemContent action={<span className="text-sm font-bold text-primary">{brNum(totalCota)} cortesias</span>}>
                                        <span className="text-tertiary">Total liberado</span>
                                    </TreeView.ItemContent>
                                </TreeView.Item>
                            )}

                            {mod === "relatorios" &&
                                relatorios.map((id) => (
                                    <TreeView.Item key={`r-${id}`} id={`r-${id}`} textValue={relatorioLabel(id)}>
                                        <TreeView.ItemContent>{relatorioLabel(id)}</TreeView.ItemContent>
                                    </TreeView.Item>
                                ))}
                        </TreeView.Item>
                    ))}
                </TreeView>
            </RevCard>

            {/* Card 3 — Lista de e-mails / membros (apenas grupo) */}
            {isGrupo && (
                <RevCard titulo={`Membros do grupo (${brNum(emails.length)})`}>
                    {emails.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {emails.map((m, i) => (
                                <span key={i} className="rounded-md bg-secondary px-2 py-1 text-sm text-secondary">
                                    {m}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-tertiary">Nenhum membro adicionado ainda — você pode incluir depois.</p>
                    )}
                </RevCard>
            )}
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

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 12 12" className={cx("size-3", className)} fill="none" aria-hidden="true">
            <path d="M10 3 4.5 8.5 2 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
