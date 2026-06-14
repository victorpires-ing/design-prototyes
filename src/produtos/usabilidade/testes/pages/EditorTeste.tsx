import { useEffect, useState } from "react";
import { ArrowLeft, CursorClick01, Plus, Route as RouteIcon, Target04, Trash02 } from "@untitledui/icons";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { TextArea } from "@/components/base/textarea/textarea";
import { Toggle } from "@/components/base/toggle/toggle";
import { cx } from "@/utils/cx";
import { gerarId, usabilityStore } from "@/lib/usability";
import type { Atividade, Criterio, CriterioTipo, Teste } from "@/lib/usability";

function novaAtividade(): Atividade {
    return { id: gerarId(), enunciado: "", mensagemInicio: "", mensagemSucesso: "", rotaInicial: "/", criterios: [{ id: gerarId(), tipo: "auto" }] };
}

function novoTeste(): Teste {
    return {
        id: gerarId(),
        nome: "",
        status: "rascunho",
        introTitulo: "Bem-vindo ao teste",
        introTexto: "Você vai realizar algumas tarefas no protótipo. Não há respostas certas ou erradas — o que avaliamos é o produto, não você.",
        atividades: [novaAtividade()],
        umaVezPorDispositivo: true,
        criadoEm: new Date().toISOString(),
    };
}

const CRITERIO_META: Record<CriterioTipo, { label: string; icon: typeof RouteIcon; placeholder?: string; ajuda: string }> = {
    rota: { label: "Chegar numa rota", icon: RouteIcon, placeholder: "/backstage/pesquisas/banco", ajuda: "Conclui ao atingir essa rota (casa por prefixo)." },
    clique: { label: "Clicar num elemento", icon: CursorClick01, placeholder: '[data-testid="salvar"]', ajuda: "Conclui ao clicar num elemento que casa com o seletor CSS." },
    auto: { label: "Declaração do participante", icon: Target04, ajuda: "Mostra um botão 'Concluí' para o participante encerrar a tarefa." },
};

export function EditorTeste() {
    const navigate = useNavigate();
    const { id } = useParams();
    const editando = Boolean(id);
    const [teste, setTeste] = useState<Teste | null>(editando ? null : novoTeste());
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        if (!id) return;
        usabilityStore.getTeste(id).then((t) => setTeste(t ?? novoTeste()));
    }, [id]);

    if (!teste) return <div className="min-h-screen bg-quaternary py-20 text-center text-sm text-tertiary">Carregando…</div>;

    const set = (patch: Partial<Teste>) => setTeste((prev) => (prev ? { ...prev, ...patch } : prev));
    const setAtividade = (index: number, patch: Partial<Atividade>) =>
        setTeste((prev) => (prev ? { ...prev, atividades: prev.atividades.map((a, i) => (i === index ? { ...a, ...patch } : a)) } : prev));

    const addAtividade = () => set({ atividades: [...teste.atividades, novaAtividade()] });
    const removeAtividade = (index: number) => set({ atividades: teste.atividades.filter((_, i) => i !== index) });

    const toggleCriterio = (aIndex: number, tipo: CriterioTipo) => {
        const atividade = teste.atividades[aIndex];
        const existe = atividade.criterios.some((c) => c.tipo === tipo);
        const criterios: Criterio[] = existe
            ? atividade.criterios.filter((c) => c.tipo !== tipo)
            : [...atividade.criterios, { id: gerarId(), tipo }];
        setAtividade(aIndex, { criterios: criterios.length ? criterios : [{ id: gerarId(), tipo: "auto" }] });
    };
    const setCriterioValor = (aIndex: number, tipo: CriterioTipo, valor: string) =>
        setAtividade(aIndex, { criterios: teste.atividades[aIndex].criterios.map((c) => (c.tipo === tipo ? { ...c, valor } : c)) });

    const valido = teste.nome.trim() && teste.atividades.every((a) => a.enunciado.trim() && a.rotaInicial.trim());

    const salvar = async (status?: Teste["status"]) => {
        if (!valido) {
            toast.error("Preencha o nome do teste e o enunciado/rota de cada atividade.");
            return;
        }
        setSalvando(true);
        const final = status ? { ...teste, status } : teste;
        await usabilityStore.saveTeste(final);
        setSalvando(false);
        toast.success(editando ? "Teste atualizado" : "Teste criado");
        navigate("/testes");
    };

    return (
        <div className="min-h-screen bg-quaternary text-primary">
            <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6">
                <div className="flex flex-col gap-4">
                    <Button size="sm" color="link-gray" iconLeading={ArrowLeft} onClick={() => navigate("/testes")} className="self-start">
                        Voltar
                    </Button>
                    <h1 className="text-2xl font-semibold text-primary">{editando ? "Editar teste" : "Novo teste"}</h1>
                </div>

                {/* Dados gerais */}
                <section className="flex flex-col gap-5 rounded-xl bg-primary p-5 ring-1 ring-border-secondary">
                    <Input label="Nome do teste" placeholder="Ex.: Emissão de cortesias — v2" value={teste.nome} onChange={(v) => set({ nome: v })} isRequired />
                    <div className="flex items-start justify-between gap-4 rounded-lg bg-secondary p-4">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium text-primary">Uma vez por dispositivo</span>
                            <span className="text-xs text-tertiary">Cada pessoa só consegue responder uma vez (pode ser reaberto desmarcando).</span>
                        </div>
                        <Toggle size="sm" isSelected={teste.umaVezPorDispositivo} onChange={(v) => set({ umaVezPorDispositivo: v })} />
                    </div>
                </section>

                {/* Introdução */}
                <section className="flex flex-col gap-5 rounded-xl bg-primary p-5 ring-1 ring-border-secondary">
                    <h2 className="text-sm font-semibold tracking-wide text-tertiary uppercase">Introdução</h2>
                    <Input label="Título" placeholder="Bem-vindo ao teste" value={teste.introTitulo} onChange={(v) => set({ introTitulo: v })} />
                    <TextArea label="Texto de abertura" rows={3} value={teste.introTexto} onChange={(v) => set({ introTexto: v })} />
                </section>

                {/* Atividades */}
                <section className="flex flex-col gap-4">
                    <h2 className="text-sm font-semibold tracking-wide text-tertiary uppercase">Atividades · {teste.atividades.length}</h2>
                    {teste.atividades.map((atividade, index) => (
                        <div key={atividade.id} className="flex flex-col gap-5 rounded-xl bg-primary p-5 ring-1 ring-border-secondary">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-primary">Tarefa {index + 1}</span>
                                {teste.atividades.length > 1 && (
                                    <ButtonUtility size="xs" color="tertiary" icon={Trash02} tooltip="Remover" onClick={() => removeAtividade(index)} />
                                )}
                            </div>
                            <Input label="O que pedir ao participante" placeholder="Ex.: Emita uma cortesia para João" value={atividade.enunciado} onChange={(v) => setAtividade(index, { enunciado: v })} isRequired />
                            <Input label="Rota inicial" placeholder="/backstage/cortesias" value={atividade.rotaInicial} onChange={(v) => setAtividade(index, { rotaInicial: v })} hint="Para onde o participante é levado ao iniciar a tarefa." isRequired />
                            <Input label="Mensagem de sucesso (opcional)" placeholder="Boa! Cortesia emitida." value={atividade.mensagemSucesso} onChange={(v) => setAtividade(index, { mensagemSucesso: v })} />

                            {/* Critérios de sucesso */}
                            <div className="flex flex-col gap-3">
                                <Label>Como concluir a tarefa</Label>
                                <div className="flex flex-col gap-2">
                                    {(Object.keys(CRITERIO_META) as CriterioTipo[]).map((tipo) => {
                                        const meta = CRITERIO_META[tipo];
                                        const ativo = atividade.criterios.find((c) => c.tipo === tipo);
                                        return (
                                            <div key={tipo} className={cx("flex flex-col gap-2 rounded-lg p-3 ring-1 ring-inset", ativo ? "bg-secondary ring-border-secondary" : "ring-border-secondary")}>
                                                <Checkbox
                                                    size="sm"
                                                    isSelected={Boolean(ativo)}
                                                    onChange={() => toggleCriterio(index, tipo)}
                                                    label={meta.label}
                                                    hint={meta.ajuda}
                                                />
                                                {ativo && meta.placeholder && (
                                                    <Input size="sm" placeholder={meta.placeholder} value={ativo.valor ?? ""} onChange={(v) => setCriterioValor(index, tipo, v)} className="ml-6" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                    <Button size="md" color="secondary" iconLeading={Plus} onClick={addAtividade} className="self-start">
                        Adicionar atividade
                    </Button>
                </section>

                {/* Ações */}
                <div className="flex items-center justify-end gap-2 border-t border-secondary pt-5">
                    <Button size="md" color="secondary" onClick={() => salvar()} isDisabled={salvando}>
                        Salvar rascunho
                    </Button>
                    <Button size="md" color="primary" onClick={() => salvar("ativo")} isLoading={salvando} isDisabled={!valido}>
                        {editando ? "Salvar e ativar" : "Criar e ativar"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
