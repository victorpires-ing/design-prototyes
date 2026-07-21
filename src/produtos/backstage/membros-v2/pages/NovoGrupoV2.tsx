import { useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ChevronDown, Trash01 } from "@untitledui/icons";
import { toast } from "sonner";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { CheckboxSelect } from "../../components/CheckboxSelect";
import { AcessoEditor, Avatar, Collapse } from "../components/acesso-ui";
import { EVENTOS, MEMBROS_V2, acessosIniciais, addGrupoV2, membroV2ById, normalizarAcesso, type FeatureAccess } from "../data/membros-v2-store";

interface MembroDraft {
    membroId: string;
    acessos: Record<string, FeatureAccess>;
}

export function NovoGrupoV2() {
    const navigate = useNavigate();
    const todosIds = EVENTOS.map((e) => e.id);
    const [nome, setNome] = useState("");
    const [eventos, setEventos] = useState<string[]>(todosIds);
    const [membros, setMembros] = useState<MembroDraft[]>([]);
    const [abertos, setAbertos] = useState<Set<string>>(new Set());

    const todosMarcados = eventos.length === todosIds.length;
    const parcial = eventos.length > 0 && !todosMarcados;

    const voltar = () => navigate("/backstage/membros-v2");
    const podeCriar = nome.trim().length > 0 && eventos.length > 0;

    // "Todos os eventos": marca todos; se já estão todos, desmarca todos.
    const toggleTodos = () => setEventos(todosMarcados ? [] : todosIds);
    const toggleEvento = (id: string) => setEventos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    const setSelecionados = (next: Set<string>) => {
        setMembros((prev) => {
            const prevIds = new Set(prev.map((m) => m.membroId));
            const mantidos = prev.filter((m) => next.has(m.membroId));
            const novos = [...next].filter((id) => !prevIds.has(id)).map((id) => ({ membroId: id, acessos: acessosIniciais() }));
            return [...mantidos, ...novos];
        });
        setAbertos((prev) => {
            const n = new Set(prev);
            for (const id of next) if (!membros.some((m) => m.membroId === id)) n.add(id);
            return n;
        });
    };
    const removeMembro = (membroId: string) => setMembros((prev) => prev.filter((m) => m.membroId !== membroId));
    const setAcessoDraft = (membroId: string, featureId: string, patch: Partial<FeatureAccess>) =>
        setMembros((prev) =>
            prev.map((m) => (m.membroId === membroId ? { ...m, acessos: { ...m.acessos, [featureId]: normalizarAcesso(featureId, m.acessos[featureId], patch) } } : m)),
        );
    const toggleAberto = (membroId: string) =>
        setAbertos((prev) => {
            const n = new Set(prev);
            if (n.has(membroId)) n.delete(membroId);
            else n.add(membroId);
            return n;
        });

    const criar = () => {
        if (!podeCriar) return;
        addGrupoV2({ nome, escopo: todosMarcados ? "todos" : eventos, membros });
        toast.success(`Grupo "${nome.trim()}" criado`);
        voltar();
    };

    return (
        <BackstageLayout showEventContext={false} activeProducer="membros-v2">
            <motion.div
                className="flex min-w-0 flex-1 flex-col"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
            >
                <header className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button size="sm" color="secondary" iconLeading={ArrowLeft} onClick={voltar}>
                            Membros
                        </Button>
                        <h1 className="text-display-xs font-bold text-primary">Novo grupo</h1>
                    </div>
                    <Button size="md" color="primary" isDisabled={!podeCriar} onClick={criar}>
                        Criar grupo
                    </Button>
                </header>

                <main className="mx-auto flex w-full max-w-[860px] flex-1 flex-col gap-6 px-6 pb-12">
                    {/* Nome */}
                    <section className="flex flex-col gap-4 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary md:p-6">
                        <Input label="Nome do grupo" placeholder="Ex: Camarote, Imprensa, Operação…" value={nome} onChange={setNome} isRequired autoFocus />
                    </section>

                    {/* Escopo de eventos */}
                    <section className="flex flex-col gap-4 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary md:p-6">
                        <h2 className="text-md font-semibold text-primary">Eventos do grupo</h2>
                        <div className="flex flex-col overflow-hidden rounded-xl ring-1 ring-border-secondary">
                            {/* Primeira opção: Todos os eventos — igual às demais, mas bloqueia as outras */}
                            <label className="flex items-center gap-3 border-b border-secondary px-4 py-3 transition duration-100 ease-linear hover:bg-primary_hover">
                                <Checkbox size="sm" isSelected={todosMarcados} isIndeterminate={parcial} onChange={toggleTodos} aria-label="Todos os eventos" />
                                <span className="truncate text-sm font-semibold text-primary">Todos os eventos</span>
                            </label>
                            {/* Eventos específicos */}
                            {EVENTOS.map((ev) => (
                                <label key={ev.id} className="flex items-center gap-3 border-b border-secondary px-4 py-3 transition duration-100 ease-linear last:border-b-0 hover:bg-primary_hover">
                                    <Checkbox size="sm" isSelected={eventos.includes(ev.id)} onChange={() => toggleEvento(ev.id)} aria-label={ev.nome} />
                                    <span className="truncate text-sm text-secondary">{ev.nome}</span>
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* Pessoas e acesso */}
                    <section className="flex flex-col gap-4 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary md:p-6">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-md font-semibold text-primary">Pessoas e acesso</h2>
                            {membros.length > 0 && (
                                <Badge size="sm" type="pill-color" color="gray">
                                    {membros.length} {membros.length === 1 ? "pessoa" : "pessoas"}
                                </Badge>
                            )}
                        </div>

                        {/* Seleção de pessoas — dropdown com checkbox */}
                        <CheckboxSelect
                            placeholder="Selecionar pessoas…"
                            options={MEMBROS_V2.map((m) => ({ id: m.id, label: m.email }))}
                            selected={new Set(membros.map((m) => m.membroId))}
                            onChange={setSelecionados}
                            showChips={false}
                        />

                        {/* Configuração de acesso das pessoas selecionadas */}
                        {membros.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <AnimatePresence initial={false}>
                                    {membros.map((m) => {
                                        const membro = membroV2ById(m.membroId)!;
                                        const aberto = abertos.has(m.membroId);
                                        return (
                                            <motion.div
                                                key={m.membroId}
                                                layout
                                                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                                transition={{ duration: 0.2, ease: "easeOut" }}
                                                className="flex flex-col gap-3 overflow-hidden rounded-xl bg-secondary/40 p-4 ring-1 ring-border-secondary"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex min-w-0 items-center gap-2.5">
                                                        <Avatar nome={membro.email} size="sm" />
                                                        <span className="truncate text-sm font-semibold text-primary">{membro.email}</span>
                                                    </div>
                                                    <ButtonUtility size="xs" color="tertiary" tooltip="Remover" icon={Trash01} onClick={() => removeMembro(m.membroId)} />
                                                </div>
                                                <div>
                                                    <Button
                                                        size="sm"
                                                        color="link-color"
                                                        iconTrailing={<ChevronDown data-icon className={cx("size-4 transition-transform duration-150", aberto && "rotate-180")} />}
                                                        onClick={() => toggleAberto(m.membroId)}
                                                    >
                                                        Acessos
                                                    </Button>
                                                </div>
                                                <Collapse open={aberto}>
                                                    <AcessoEditor acessos={m.acessos} onChange={(featureId, patch) => setAcessoDraft(m.membroId, featureId, patch)} />
                                                </Collapse>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </section>
                </main>
            </motion.div>
        </BackstageLayout>
    );
}
