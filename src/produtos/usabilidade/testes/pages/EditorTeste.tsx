import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowLeft,
    CheckCircle,
    CursorClick01,
    DotsGrid,
    Eye,
    Flag05,
    Monitor01,
    Phone01,
    Plus,
    Star06,
    Trash02,
} from "@untitledui/icons";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { Toggle } from "@/components/base/toggle/toggle";
import { cx } from "@/utils/cx";
import { gerarId, PERGUNTAS_SUS, usabilityStore } from "@/lib/usability";
import type { Bloco, BlocoAtividade, BlocoPergunta, BlocoSus, Criterio, CriterioTipo, Teste } from "@/lib/usability";
import { CATALOGO, ICONE_BLOCO, novoTeste, rotuloTipo } from "../data/blocos";
import { RichText } from "../../components/RichText";
import { RichTextView } from "@/lib/usability/branding";

/** Converte um link colado em rota interna (pathname+search+hash), preservando o ?cfg=. */
function paraRotaInterna(v: string): string {
    const t = v.trim();
    if (/^https?:\/\//i.test(t)) {
        try {
            const u = new URL(t);
            return `${u.pathname}${u.search}${u.hash}`;
        } catch {
            return t;
        }
    }
    return t;
}

const CRITERIO_META: Record<CriterioTipo, { label: string; ajuda: string }> = {
    rota: { label: "Chegar numa rota", ajuda: "Conclui ao atingir uma rota (casa por prefixo)." },
    clique: { label: "Clicar num elemento", ajuda: "Conclui ao clicar num elemento específico do protótipo." },
    auto: { label: "Declaração do participante", ajuda: "Mostra um botão 'Concluí' para o participante encerrar." },
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function EditorTeste() {
    const navigate = useNavigate();
    const { id } = useParams();
    const editando = Boolean(id);
    const [teste, setTeste] = useState<Teste | null>(editando ? null : novoTeste());
    const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
    const [dispositivo, setDispositivo] = useState<"desktop" | "mobile">("desktop");
    const [catalogoAberto, setCatalogoAberto] = useState(false);
    const [selElemento, setSelElemento] = useState<string | null>(null); // blocoId em seleção de elemento
    const [iframeRota, setIframeRota] = useState<string>("/");
    const [previewW, setPreviewW] = useState(620);
    const [arrastando, setArrastando] = useState<string | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (!id) return;
        usabilityStore.getTeste(id).then((t) => {
            const carregado = t ?? novoTeste();
            setTeste(carregado);
            setSelecionadoId(carregado.blocos[0]?.id ?? null);
        });
    }, [id]);

    useEffect(() => {
        if (teste && !selecionadoId) setSelecionadoId(teste.blocos[0]?.id ?? null);
    }, [teste, selecionadoId]);

    const selecionado = useMemo(() => teste?.blocos.find((b) => b.id === selecionadoId) ?? null, [teste, selecionadoId]);

    /* ----------------------- mutações de bloco ----------------------- */

    const patchTeste = (patch: Partial<Teste>) => setTeste((p) => (p ? { ...p, ...patch } : p));
    const patchBloco = useCallback(
        (blocoId: string, patch: Partial<Bloco>) =>
            setTeste((p) => (p ? { ...p, blocos: p.blocos.map((b) => (b.id === blocoId ? ({ ...b, ...patch } as Bloco) : b)) } : p)),
        [],
    );

    const adicionar = (criar: () => Bloco) => {
        if (!teste) return;
        const novo = criar();
        const idxObrigado = teste.blocos.findIndex((b) => b.tipo === "obrigado");
        const blocos = [...teste.blocos];
        blocos.splice(idxObrigado >= 0 ? idxObrigado : blocos.length, 0, novo);
        patchTeste({ blocos });
        setSelecionadoId(novo.id);
        setCatalogoAberto(false);
    };

    const remover = (blocoId: string) => {
        if (!teste) return;
        const blocos = teste.blocos.filter((b) => b.id !== blocoId);
        patchTeste({ blocos });
        if (selecionadoId === blocoId) setSelecionadoId(blocos[0]?.id ?? null);
    };

    // Reordena `arrastadoId` para a posição de `alvoId` (só blocos do meio).
    const reordenar = (arrastadoId: string, alvoId: string) => {
        if (!teste || arrastadoId === alvoId) return;
        const blocos = [...teste.blocos];
        const from = blocos.findIndex((b) => b.id === arrastadoId);
        const to = blocos.findIndex((b) => b.id === alvoId);
        const ultimo = blocos.length - 1;
        if (from <= 0 || from >= ultimo || to <= 0 || to >= ultimo) return; // welcome/obrigado fixos
        const [item] = blocos.splice(from, 1);
        blocos.splice(to, 0, item);
        patchTeste({ blocos });
    };

    /* --------------------------- captura ---------------------------- */

    useEffect(() => {
        const onMsg = (e: MessageEvent) => {
            if (e.data?.source !== "uxcap") return;
            if (e.data.tipo === "rota" || e.data.tipo === "pronto") setIframeRota(e.data.rota);
            if (e.data.tipo === "selecao-cancelada") setSelElemento(null);
            if (e.data.tipo === "elemento" && selElemento) {
                setCriterioValor(selElemento, "clique", e.data.seletor, e.data.rotulo);
                setSelElemento(null);
                toast.success("Elemento capturado", { description: e.data.rotulo });
            }
        };
        window.addEventListener("message", onMsg);
        return () => window.removeEventListener("message", onMsg);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selElemento]);

    const selecionarElemento = (blocoId: string) => {
        if (selElemento === blocoId) {
            iframeRef.current?.contentWindow?.postMessage({ source: "uxcap-cmd", tipo: "desarmar-selecao" }, window.location.origin);
            setSelElemento(null);
            return;
        }
        setSelElemento(blocoId);
        iframeRef.current?.contentWindow?.postMessage({ source: "uxcap-cmd", tipo: "armar-selecao" }, window.location.origin);
    };

    /* ----------------------- critérios (atividade) ------------------- */

    const toggleCriterio = (blocoId: string, tipo: CriterioTipo) => {
        const bloco = teste?.blocos.find((b) => b.id === blocoId);
        if (bloco?.tipo !== "atividade") return;
        const existe = bloco.criterios.some((c) => c.tipo === tipo);
        const criterios: Criterio[] = existe ? bloco.criterios.filter((c) => c.tipo !== tipo) : [...bloco.criterios, { id: gerarId(), tipo }];
        patchBloco(blocoId, { criterios: criterios.length ? criterios : [{ id: gerarId(), tipo: "auto" }] } as Partial<Bloco>);
    };
    const setCriterioValor = useCallback(
        (blocoId: string, tipo: CriterioTipo, valor: string, rotulo?: string) =>
            setTeste((p) =>
                p
                    ? {
                          ...p,
                          blocos: p.blocos.map((b) => {
                              if (b.id !== blocoId || b.tipo !== "atividade") return b;
                              const temTipo = b.criterios.some((c) => c.tipo === tipo);
                              const criterios = temTipo
                                  ? b.criterios.map((c) => (c.tipo === tipo ? { ...c, valor, rotulo } : c))
                                  : [...b.criterios, { id: gerarId(), tipo, valor, rotulo }];
                              return { ...b, criterios };
                          }),
                      }
                    : p,
            ),
        [],
    );

    /* ------------------------ redimensionar preview ------------------ */

    const iniciarResize = () => {
        const onMove = (e: MouseEvent) => setPreviewW(clamp(window.innerWidth - e.clientX, 360, window.innerWidth - 640));
        const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
            document.body.style.userSelect = "";
        };
        document.body.style.userSelect = "none";
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    };

    /* ----------------------------- salvar --------------------------- */

    const valido = useMemo(() => {
        if (!teste?.nome.trim()) return false;
        return teste.blocos.every((b) => {
            if (b.tipo === "atividade") return b.enunciado.trim() && b.rotaInicial.trim();
            if (b.tipo === "pergunta") return b.enunciado.trim() && (b.formato === "aberta" || b.opcoes.filter((o) => o.trim()).length >= 2);
            return true;
        });
    }, [teste]);

    const salvar = async (status?: Teste["status"]): Promise<Teste | null> => {
        if (!teste) return null;
        const final = status ? { ...teste, status } : teste;
        await usabilityStore.saveTeste(final);
        setTeste(final);
        return final;
    };

    const publicar = async () => {
        if (!valido) {
            toast.error("Preencha o nome, e o enunciado/rota de cada bloco.");
            return;
        }
        const salvo = await salvar("ativo");
        if (salvo) toast.success("Teste publicado", { description: `${window.location.origin}/t/${salvo.id}` });
    };

    const preVisualizar = async () => {
        const salvo = await salvar();
        if (salvo) window.open(`/t/${salvo.id}?preview=1`, "_blank");
    };

    if (!teste) return <div className="flex min-h-screen items-center justify-center bg-quaternary text-sm text-tertiary">Carregando…</div>;

    return (
        <div className="flex h-screen flex-col bg-quaternary text-primary">
            {/* Header / wizard (centralizado) */}
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-secondary bg-primary px-4 py-2.5">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    <ButtonUtility size="sm" color="tertiary" icon={ArrowLeft} tooltip="Voltar" onClick={() => navigate("/testes")} />
                    <input
                        value={teste.nome}
                        onChange={(e) => patchTeste({ nome: e.target.value })}
                        placeholder="Nome do teste"
                        className="min-w-0 flex-1 truncate bg-transparent text-sm font-semibold text-primary outline-none placeholder:text-placeholder"
                    />
                </div>
                <div className="flex shrink-0 items-center justify-end gap-2">
                    <Button size="sm" color="secondary" iconLeading={Eye} onClick={preVisualizar}>
                        Pré-visualizar
                    </Button>
                    <Button size="sm" color="primary" onClick={publicar} isDisabled={!valido}>
                        Iniciar testes
                    </Button>
                </div>
            </header>

            <div className="flex min-h-0 flex-1">
                {/* Coluna 1: blocos */}
                <aside className="flex w-72 shrink-0 flex-col gap-2 overflow-y-auto border-r border-secondary bg-primary p-3">
                    {teste.blocos.map((bloco, index) => {
                        const Icon = ICONE_BLOCO[bloco.tipo];
                        const fixo = bloco.tipo === "welcome" || bloco.tipo === "obrigado";
                        const ativo = bloco.id === selecionadoId;
                        return (
                            <div key={bloco.id} className="flex flex-col gap-2">
                                <div
                                    draggable={!fixo}
                                    onDragStart={() => !fixo && setArrastando(bloco.id)}
                                    onDragEnd={() => setArrastando(null)}
                                    onDragOver={(e) => arrastando && !fixo && e.preventDefault()}
                                    onDrop={() => arrastando && reordenar(arrastando, bloco.id)}
                                    className={cx(
                                        "group/bl flex items-center gap-2 rounded-lg p-2.5 ring-1 transition-colors duration-100 ease-linear",
                                        ativo ? "bg-secondary ring-brand" : "ring-border-secondary hover:bg-primary_hover",
                                        arrastando === bloco.id && "opacity-50",
                                    )}
                                >
                                    {/* grip à esquerda (hover) */}
                                    {!fixo ? (
                                        <span className="-ml-1 flex w-0 shrink-0 cursor-grab justify-center overflow-hidden text-fg-quaternary opacity-0 transition-all group-hover/bl:w-4 group-hover/bl:opacity-100 active:cursor-grabbing">
                                            <DotsGrid className="size-4" aria-hidden="true" />
                                        </span>
                                    ) : null}
                                    <button type="button" onClick={() => setSelecionadoId(bloco.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                                        <FeaturedIcon icon={Icon} color="gray" theme="light" size="sm" className="shrink-0" />
                                        <span className="flex min-w-0 flex-col">
                                            <span className="truncate text-sm font-medium text-primary">{tituloBloco(bloco)}</span>
                                            <span className="truncate text-xs text-tertiary">{rotuloTipo(bloco)}</span>
                                        </span>
                                    </button>
                                    {/* lixeira à direita (hover) */}
                                    {!fixo && (
                                        <span className="w-0 shrink-0 overflow-hidden opacity-0 transition-all group-hover/bl:w-8 group-hover/bl:opacity-100">
                                            <ButtonUtility size="xs" color="tertiary" icon={Trash02} tooltip="Remover" onClick={() => remover(bloco.id)} />
                                        </span>
                                    )}
                                </div>
                                {/* adicionar bloco antes do obrigado */}
                                {index === teste.blocos.length - 2 && <AddBlockArea aberto={catalogoAberto} onToggle={() => setCatalogoAberto((v) => !v)} onAdd={adicionar} />}
                            </div>
                        );
                    })}
                </aside>

                {/* Coluna 2: config do bloco */}
                <main className="min-w-0 flex-1 overflow-y-auto bg-primary">
                    {selecionado && (
                        <div className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-6">
                            <div className="flex items-center gap-3">
                                <FeaturedIcon icon={ICONE_BLOCO[selecionado.tipo]} color="gray" theme="light" size="md" />
                                <h2 className="text-lg font-semibold text-primary">{rotuloTipo(selecionado)}</h2>
                            </div>

                            {(selecionado.tipo === "welcome" || selecionado.tipo === "obrigado") && (
                                <>
                                    <Input label="Título" value={selecionado.titulo} onChange={(v) => patchBloco(selecionado.id, { titulo: v } as Partial<Bloco>)} />
                                    <div className="flex flex-col gap-1.5">
                                        <Label>Mensagem</Label>
                                        <RichText value={selecionado.texto} onChange={(v) => patchBloco(selecionado.id, { texto: v } as Partial<Bloco>)} />
                                    </div>
                                    {selecionado.tipo === "welcome" && (
                                        <>
                                            <Input
                                                label="Logo da marca parceira (link)"
                                                placeholder="https://… (opcional — aparece ao lado da Ingresse)"
                                                hint="A logo da Ingresse é sempre exibida; informe um link para co-marcar com um parceiro."
                                                value={teste.logoParceira ?? ""}
                                                onChange={(v) => patchTeste({ logoParceira: v || undefined })}
                                            />
                                            {teste.logoParceira && (
                                                <span className="flex h-12 w-fit items-center rounded-md bg-primary-solid px-3">
                                                    <img src={teste.logoParceira} alt="" className="h-6 w-auto object-contain" />
                                                </span>
                                            )}
                                        </>
                                    )}
                                </>
                            )}

                            {selecionado.tipo === "pergunta" && <ConfigPergunta bloco={selecionado} patch={(p) => patchBloco(selecionado.id, p as Partial<Bloco>)} />}

                            {selecionado.tipo === "sus" && <ConfigSus bloco={selecionado} patch={(p) => patchBloco(selecionado.id, p as Partial<Bloco>)} />}

                            {selecionado.tipo === "atividade" && (
                                <ConfigAtividade
                                    bloco={selecionado}
                                    patch={(p) => patchBloco(selecionado.id, p as Partial<Bloco>)}
                                    iframeRota={iframeRota}
                                    selecionandoElemento={selElemento === selecionado.id}
                                    onComecarAqui={() => patchBloco(selecionado.id, { rotaInicial: iframeRota } as Partial<Bloco>)}
                                    onConcluirAqui={() => setCriterioValor(selecionado.id, "rota", iframeRota)}
                                    onSelecionarElemento={() => selecionarElemento(selecionado.id)}
                                    toggleCriterio={(t) => toggleCriterio(selecionado.id, t)}
                                    setCriterioValor={(t, v) => setCriterioValor(selecionado.id, t, v)}
                                />
                            )}
                        </div>
                    )}
                </main>

                {/* divisor redimensionável — linha de 1px com alça sobreposta */}
                <div className="relative w-px shrink-0 bg-border-secondary">
                    <div onMouseDown={iniciarResize} title="Arraste para ajustar a largura" className="group absolute inset-y-0 left-1/2 z-10 flex w-4 -translate-x-1/2 cursor-col-resize items-center justify-center">
                        <span className="h-12 w-1 rounded-full bg-fg-quaternary transition-colors group-hover:bg-fg-brand-primary" />
                    </div>
                </div>

                {/* Coluna 3: preview / protótipo */}
                <section style={{ width: previewW }} className="flex shrink-0 flex-col bg-secondary">
                    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-secondary px-4 py-2.5">
                        <span className="text-xs font-semibold tracking-wide text-tertiary uppercase">Pré-visualização</span>
                        <div className="flex items-center gap-0.5 rounded-lg bg-tertiary p-1 ring-1 ring-border-secondary">
                            <button
                                type="button"
                                onClick={() => setDispositivo("desktop")}
                                className={cx("flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors", dispositivo === "desktop" ? "bg-primary text-primary shadow-sm" : "text-tertiary hover:text-secondary")}
                            >
                                <Monitor01 className="size-4" aria-hidden="true" /> Desktop
                            </button>
                            <button
                                type="button"
                                onClick={() => setDispositivo("mobile")}
                                className={cx("flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors", dispositivo === "mobile" ? "bg-primary text-primary shadow-sm" : "text-tertiary hover:text-secondary")}
                            >
                                <Phone01 className="size-4" aria-hidden="true" /> Mobile
                            </button>
                        </div>
                    </div>
                    <div className="relative min-h-0 flex-1 overflow-hidden p-4">
                        {selecionado?.tipo === "atividade" ? (
                            <PrototipoCaptura bloco={selecionado} iframeRef={iframeRef} iframeRota={iframeRota} selecionandoElemento={selElemento === selecionado.id} dispositivo={dispositivo} />
                        ) : (
                            <PreviewParticipante
                                bloco={selecionado}
                                dispositivo={dispositivo}
                                etapas={teste.blocos.filter((b) => b.tipo === "atividade" || b.tipo === "pergunta" || b.tipo === "sus").length}
                            />
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

function tituloBloco(bloco: Bloco): string {
    if (bloco.tipo === "welcome" || bloco.tipo === "obrigado") return bloco.titulo;
    return bloco.enunciado.trim() || bloco.titulo;
}

/* ------------------------------------------------------------------ */
/*  Adicionar bloco                                                    */
/* ------------------------------------------------------------------ */

function AddBlockArea({ aberto, onToggle, onAdd }: { aberto: boolean; onToggle: () => void; onAdd: (criar: () => Bloco) => void }) {
    return (
        <div className="flex flex-col gap-2">
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-secondary py-2.5 text-sm font-semibold text-brand-secondary transition-colors hover:bg-primary_hover"
            >
                <Plus className="size-4" aria-hidden="true" /> Adicionar bloco
            </button>
            {aberto && (
                <div className="flex flex-col gap-3 rounded-lg bg-secondary p-3 ring-1 ring-border-secondary">
                    {CATALOGO.map((grupo) => (
                        <div key={grupo.grupo} className="flex flex-col gap-1.5">
                            <span className="text-[11px] font-semibold tracking-wide text-tertiary uppercase">{grupo.grupo}</span>
                            {grupo.itens.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => onAdd(item.criar)}
                                    className="flex items-start gap-2.5 rounded-md bg-primary p-2.5 text-left ring-1 ring-border-secondary transition-colors hover:ring-brand"
                                >
                                    <FeaturedIcon icon={item.icon} color="gray" theme="light" size="sm" className="shrink-0" />
                                    <span className="flex flex-col">
                                        <span className="text-sm font-medium text-primary">{item.label}</span>
                                        <span className="text-xs text-tertiary">{item.descricao}</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Config: pergunta                                                   */
/* ------------------------------------------------------------------ */

function ConfigPergunta({ bloco, patch }: { bloco: BlocoPergunta; patch: (p: Partial<BlocoPergunta>) => void }) {
    const setOpcao = (i: number, v: string) => patch({ opcoes: bloco.opcoes.map((o, idx) => (idx === i ? v : o)) });
    const addOpcao = () => patch({ opcoes: [...bloco.opcoes, `Opção ${bloco.opcoes.length + 1}`] });
    const rmOpcao = (i: number) => patch({ opcoes: bloco.opcoes.filter((_, idx) => idx !== i) });
    return (
        <>
            <Input label="Pergunta" placeholder="O que você achou da experiência?" value={bloco.enunciado} onChange={(v) => patch({ enunciado: v })} isRequired />
            <div className="flex flex-col gap-1.5">
                <Label>Descrição (opcional)</Label>
                <RichText value={bloco.descricao ?? ""} onChange={(v) => patch({ descricao: v })} placeholder="Texto de apoio exibido abaixo da pergunta" />
            </div>
            {bloco.formato !== "aberta" && (
                <div className="flex flex-col gap-2">
                    <Label>Opções</Label>
                    {bloco.opcoes.map((op, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <Input size="sm" value={op} onChange={(v) => setOpcao(i, v)} className="flex-1" />
                            {bloco.opcoes.length > 2 && <ButtonUtility size="sm" color="tertiary" icon={Trash02} tooltip="Remover" onClick={() => rmOpcao(i)} />}
                        </div>
                    ))}
                    <Button size="sm" color="link-color" iconLeading={Plus} onClick={addOpcao} className="self-start">
                        Adicionar opção
                    </Button>
                </div>
            )}
            <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                <span className="text-sm font-medium text-primary">Resposta obrigatória</span>
                <Toggle size="sm" isSelected={bloco.obrigatoria} onChange={(v) => patch({ obrigatoria: v })} />
            </div>
        </>
    );
}

/* ------------------------------------------------------------------ */
/*  Config: atividade (captura por ação única)                         */
/* ------------------------------------------------------------------ */

function ConfigAtividade({
    bloco,
    patch,
    iframeRota,
    selecionandoElemento,
    onComecarAqui,
    onConcluirAqui,
    onSelecionarElemento,
    toggleCriterio,
    setCriterioValor,
}: {
    bloco: BlocoAtividade;
    patch: (p: Partial<BlocoAtividade>) => void;
    iframeRota: string;
    selecionandoElemento: boolean;
    onComecarAqui: () => void;
    onConcluirAqui: () => void;
    onSelecionarElemento: () => void;
    toggleCriterio: (t: CriterioTipo) => void;
    setCriterioValor: (t: CriterioTipo, v: string) => void;
}) {
    const critRota = bloco.criterios.find((c) => c.tipo === "rota");
    const critClique = bloco.criterios.find((c) => c.tipo === "clique");

    return (
        <>
            <Input label="Tarefa" placeholder="Escreva uma frase que resume a tarefa" value={bloco.enunciado} onChange={(v) => patch({ enunciado: v })} isRequired />
            <div className="flex flex-col gap-1.5">
                <Label>Descrição (opcional)</Label>
                <RichText value={bloco.descricao ?? ""} onChange={(v) => patch({ descricao: v })} placeholder="Dê detalhes para o participante completar a missão" />
            </div>

            {/* Link de início */}
            <div className="flex flex-col gap-2">
                <Label>Link de início</Label>
                <div className="flex items-center gap-2">
                    <Input size="sm" placeholder="/backstage/cortesias" value={bloco.rotaInicial} onChange={(v) => patch({ rotaInicial: paraRotaInterna(v) })} className="flex-1" />
                    <Button size="sm" color="secondary" iconLeading={Flag05} onClick={onComecarAqui}>
                        Começar nessa tela
                    </Button>
                </div>
                <span className="text-xs text-tertiary">Navegue o protótipo ao lado e use “Começar nessa tela” para fixar a rota atual ({iframeRota}).</span>
            </div>

            {/* Critérios de sucesso */}
            <div className="flex flex-col gap-2">
                <Label>Critérios de sucesso (combináveis)</Label>
                {(["rota", "clique", "auto"] as CriterioTipo[]).map((tipo) => {
                    const ativo = bloco.criterios.some((c) => c.tipo === tipo);
                    return (
                        <div key={tipo} className="flex flex-col gap-2.5 rounded-lg p-3 ring-1 ring-inset ring-border-secondary data-[on=true]:bg-secondary" data-on={ativo}>
                            <Checkbox size="sm" isSelected={ativo} onChange={() => toggleCriterio(tipo)} label={CRITERIO_META[tipo].label} hint={CRITERIO_META[tipo].ajuda} />
                            {ativo && tipo === "rota" && (
                                <div className="flex items-center gap-2 pl-6">
                                    <Input size="sm" placeholder="/backstage/cortesias/sucesso" value={critRota?.valor ?? ""} onChange={(v) => setCriterioValor("rota", v)} className="flex-1" />
                                    <Button size="sm" color="secondary" iconLeading={CheckCircle} onClick={onConcluirAqui}>
                                        Concluir nessa tela
                                    </Button>
                                </div>
                            )}
                            {ativo && tipo === "clique" && (
                                <div className="flex flex-col gap-2 pl-6">
                                    <div className="flex items-center gap-2">
                                        <Input size="sm" placeholder='[data-testid="..."] ou seletor' value={critClique?.valor ?? ""} onChange={(v) => setCriterioValor("clique", v)} className="flex-1" />
                                        <Button size="sm" color={selecionandoElemento ? "primary" : "secondary"} iconLeading={CursorClick01} onClick={onSelecionarElemento}>
                                            {selecionandoElemento ? "Selecionando…" : "Selecionar elemento"}
                                        </Button>
                                    </div>
                                    {critClique?.rotulo && <span className="text-xs text-tertiary">Elemento: “{critClique.rotulo}”</span>}
                                </div>
                            )}
                            {ativo && tipo === "auto" && (
                                <div className="mt-1 ml-6 flex flex-col gap-2 rounded-lg bg-primary p-3.5 ring-1 ring-border-secondary">
                                    <span className="text-xs font-medium text-secondary">Quando mostrar a barra "Concluir tarefa"</span>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => patch({ declaracaoApos: 0 })}
                                            className={cx("flex-1 rounded-lg p-2 text-xs font-semibold ring-1 ring-inset transition-colors", bloco.declaracaoApos === 0 ? "bg-secondary text-primary ring-brand" : "text-secondary ring-border-secondary hover:bg-primary_hover")}
                                        >
                                            Sempre em tela
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => patch({ declaracaoApos: bloco.declaracaoApos > 0 ? bloco.declaracaoApos : 10 })}
                                            className={cx("flex-1 rounded-lg p-2 text-xs font-semibold ring-1 ring-inset transition-colors", bloco.declaracaoApos > 0 ? "bg-secondary text-primary ring-brand" : "text-secondary ring-border-secondary hover:bg-primary_hover")}
                                        >
                                            Exibir após…
                                        </button>
                                    </div>
                                    {bloco.declaracaoApos > 0 && (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={String(bloco.declaracaoApos)}
                                                onChange={(e) => patch({ declaracaoApos: Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1) })}
                                                className="w-20 rounded-lg bg-primary px-3 py-2 text-sm text-primary ring-1 ring-border-primary outline-none focus:ring-2 focus:ring-brand"
                                            />
                                            <span className="text-sm text-tertiary">segundos após começar</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <Input label="Mensagem de sucesso (opcional)" placeholder="Boa! Tarefa concluída." value={bloco.mensagemSucesso ?? ""} onChange={(v) => patch({ mensagemSucesso: v })} />
        </>
    );
}

/* ------------------------------------------------------------------ */
/*  Config: SUS                                                        */
/* ------------------------------------------------------------------ */

function ConfigSus({ bloco, patch }: { bloco: BlocoSus; patch: (p: Partial<BlocoSus>) => void }) {
    return (
        <>
            <Input label="Título" value={bloco.titulo} onChange={(v) => patch({ titulo: v })} />
            <div className="flex flex-col gap-1.5">
                <Label>Texto de apoio (opcional)</Label>
                <RichText value={bloco.enunciado} onChange={(v) => patch({ enunciado: v })} />
            </div>
            <div className="flex flex-col gap-2 rounded-lg bg-secondary p-4">
                <span className="text-sm font-medium text-primary">Escala de Usabilidade do Sistema</span>
                <p className="text-xs text-tertiary">
                    10 afirmações padrão respondidas de 1 (discordo totalmente) a 5 (concordo totalmente). O sistema calcula automaticamente o score SUS (0–100) por participante e a média no relatório.
                </p>
                <ol className="mt-1 flex list-decimal flex-col gap-1 pl-4 text-xs text-tertiary">
                    {PERGUNTAS_SUS.map((p, i) => (
                        <li key={i}>{p}</li>
                    ))}
                </ol>
            </div>
        </>
    );
}

/* ------------------------------------------------------------------ */
/*  Preview: card do participante (welcome / obrigado / pergunta)      */
/* ------------------------------------------------------------------ */

function PreviewParticipante({ bloco, dispositivo, etapas }: { bloco: Bloco | null; dispositivo: "desktop" | "mobile"; etapas: number }) {
    if (!bloco) return null;
    const card = <CardParticipante bloco={bloco} etapas={etapas} />;
    if (dispositivo === "mobile") {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="flex h-[680px] max-h-full w-[340px] flex-col overflow-hidden rounded-[2.5rem] bg-primary p-3 shadow-2xl ring-8 ring-secondary-solid">
                    <div className="flex flex-1 items-center justify-center overflow-y-auto rounded-[1.8rem] bg-secondary p-4">{card}</div>
                </div>
            </div>
        );
    }
    return (
        <div className="flex h-full items-center justify-center">
            <div className="flex h-full max-h-[680px] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-primary shadow-xl ring-1 ring-border-secondary">
                <div className="flex shrink-0 items-center gap-1.5 border-b border-secondary px-3 py-2">
                    <span className="size-2.5 rounded-full bg-quaternary" />
                    <span className="size-2.5 rounded-full bg-quaternary" />
                    <span className="size-2.5 rounded-full bg-quaternary" />
                </div>
                <div className="flex flex-1 items-center justify-center overflow-y-auto p-6">{card}</div>
            </div>
        </div>
    );
}

function CardParticipante({ bloco, etapas }: { bloco: Bloco; etapas: number }) {
    if (bloco.tipo === "welcome" || bloco.tipo === "obrigado") {
        const ehWelcome = bloco.tipo === "welcome";
        return (
            <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
                <FeaturedIcon icon={ehWelcome ? Star06 : CheckCircle} color={ehWelcome ? "brand" : "success"} theme="light" size="xl" />
                <h3 className="text-xl font-semibold text-primary">{bloco.titulo || (ehWelcome ? "Bem-vindo" : "Obrigado!")}</h3>
                {bloco.texto && <RichTextView html={bloco.texto} className="text-sm text-tertiary" />}
                {ehWelcome && (
                    <>
                        <p className="text-xs text-quaternary">
                            {etapas} {etapas === 1 ? "etapa" : "etapas"} · sua sessão será gravada para análise
                        </p>
                        <div className="mt-1 w-full rounded-lg bg-brand-solid py-2.5 text-center text-sm font-semibold text-white">Começar</div>
                    </>
                )}
            </div>
        );
    }
    if (bloco.tipo === "pergunta") {
        return (
            <div className="flex w-full max-w-sm flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold text-primary">
                        {bloco.enunciado || "Sua pergunta aparece aqui"}
                        {bloco.obrigatoria && <span className="text-error-primary"> *</span>}
                    </h3>
                    {bloco.descricao && <RichTextView html={bloco.descricao} className="text-sm text-tertiary" />}
                </div>
                {bloco.formato === "aberta" ? (
                    <div className="h-24 w-full rounded-lg bg-primary ring-1 ring-border-primary" />
                ) : (
                    <div className="flex flex-col gap-2">
                        {bloco.opcoes.map((op, i) => (
                            <div key={i} className="flex items-center gap-2.5 rounded-lg p-2.5 text-sm text-secondary ring-1 ring-border-secondary">
                                <span className={cx("size-4 border border-primary", bloco.formato === "multipla" ? "rounded" : "rounded-full")} />
                                {op}
                            </div>
                        ))}
                    </div>
                )}
                <div className="mt-1 w-full rounded-lg bg-brand-solid py-2.5 text-center text-sm font-semibold text-white">Próximo</div>
            </div>
        );
    }
    if (bloco.tipo === "sus") {
        return (
            <div className="flex w-full max-w-sm flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-semibold text-primary">{bloco.titulo}</h3>
                    {bloco.enunciado && <RichTextView html={bloco.enunciado} className="text-sm text-tertiary" />}
                </div>
                {PERGUNTAS_SUS.slice(0, 3).map((p, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                        <span className="text-sm text-secondary">{i + 1}. {p}</span>
                        <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((v) => (
                                <span key={v} className="flex h-8 flex-1 items-center justify-center rounded-md text-xs font-semibold text-tertiary ring-1 ring-border-secondary">
                                    {v}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
                <span className="text-xs text-quaternary">… e mais 7 afirmações</span>
            </div>
        );
    }
    return null;
}

/* ------------------------------------------------------------------ */
/*  Preview: protótipo embarcado + seleção de elemento (atividade)     */
/* ------------------------------------------------------------------ */

function PrototipoCaptura({
    bloco,
    iframeRef,
    iframeRota,
    selecionandoElemento,
    dispositivo,
}: {
    bloco: BlocoAtividade;
    iframeRef: React.RefObject<HTMLIFrameElement | null>;
    iframeRota: string;
    selecionandoElemento: boolean;
    dispositivo: "desktop" | "mobile";
}) {
    const rota = bloco.rotaInicial || "/";
    const src = `${rota}${rota.includes("?") ? "&" : "?"}__capture=1`;
    const areaRef = useRef<HTMLDivElement>(null);
    const [area, setArea] = useState({ w: 0, h: 0 });

    useEffect(() => {
        const el = areaRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setArea({ w: el.clientWidth, h: el.clientHeight }));
        ro.observe(el);
        setArea({ w: el.clientWidth, h: el.clientHeight });
        return () => ro.disconnect();
    }, []);

    // Renderiza num viewport "desktop" (1280) e encaixa na largura disponível.
    const VW = 1280;
    const escala = area.w ? Math.min(1, area.w / VW) : 1;

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-xl bg-primary shadow-xl ring-1 ring-border-secondary">
            <div className="flex shrink-0 items-center gap-2 border-b border-secondary px-3 py-2">
                <span className="truncate rounded-md bg-secondary px-2 py-1 font-mono text-xs text-tertiary">{iframeRota}</span>
                {dispositivo === "desktop" && escala < 1 && <span className="shrink-0 text-[11px] text-quaternary">{Math.round(escala * 100)}%</span>}
                <span className="ml-auto text-[11px] text-quaternary">protótipo</span>
            </div>
            <div ref={areaRef} className="relative min-h-0 flex-1 overflow-hidden bg-secondary">
                {dispositivo === "mobile" ? (
                    <div className="flex h-full items-start justify-center p-3">
                        <iframe key={bloco.id} ref={iframeRef} src={src} title="Protótipo" className="h-full w-[390px] rounded-2xl border-0 bg-primary shadow-xl ring-1 ring-border-secondary" />
                    </div>
                ) : (
                    <iframe
                        key={bloco.id}
                        ref={iframeRef}
                        src={src}
                        title="Protótipo"
                        style={{ width: VW, height: escala ? area.h / escala : "100%", transform: `scale(${escala})`, transformOrigin: "top left" }}
                        className="border-0 bg-primary"
                    />
                )}
                {selecionandoElemento && (
                    <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-3">
                        <span className="rounded-full bg-brand-solid px-3 py-1.5 text-xs font-semibold text-white shadow-lg">Clique no elemento dentro do protótipo</span>
                    </div>
                )}
            </div>
        </div>
    );
}
