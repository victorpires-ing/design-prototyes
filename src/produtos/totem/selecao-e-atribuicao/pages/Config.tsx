import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ChevronDown, Copy01, Edit01, LinkExternal01, Plus, Ticket01, Trash01 } from "@untitledui/icons";
import { Reorder, useDragControls } from "motion/react";
import type { DragControls } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Toggle } from "@/components/base/toggle/toggle";
import { cx } from "@/utils/cx";
import { TotemLayout } from "../../components/TotemLayout";
import type {
    ComboDinamico,
    ComboFixo,
    ComboFixoInclui,
    DataEvento,
    GrupoIngresso,
    Ingresso,
    LoteIngresso,
    PerguntaEvento,
    Produto,
    Sessao,
    TipoIngresso,
    TipoPergunta,
} from "../data/combos";
import { DEFAULT_CONFIG, buildShortShareUrl, decodeConfig, encodeConfig, ingressosDoEvento, type EventConfig } from "../data/config";

const STORAGE_KEY = "totem:lastConfig:v2";
const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : `id-${Math.round(performance.now())}`);
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const TIPOS: { id: TipoPergunta; label: string }[] = [
    { id: "texto", label: "Texto" },
    { id: "numero", label: "Número" },
    { id: "data", label: "Data" },
    { id: "dropdown", label: "Dropdown" },
    { id: "radio", label: "Radio" },
    { id: "checkbox", label: "Checkbox" },
];
const TIPOS_COM_OPCOES: TipoPergunta[] = ["dropdown", "radio", "checkbox"];

type Tipo = "grupo" | "tipoIngresso" | "produto" | "data" | "comboFixo" | "comboDinamico" | "pergunta";
/** Uma seção do configurador por vez — o índice à esquerda é a navegação. */
type Aba =
    | "evento"
    | "dias"
    | "ingressos"
    | "produtos"
    | "datas"
    | "combosFixos"
    | "combosDinamicos"
    | "perguntas"
    | "cupons"
    | "termos"
    | "compartilhar";
interface Edicao {
    tipo: Tipo;
    index: number;
    /** Índice do grupo dono, quando o alvo é um tipo de ingresso. */
    grupo?: number;
}

export function Config() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [aba, setAba] = useState<Aba>("evento");

    const [cfg, setCfg] = useState<EventConfig>(() => {
        const raw = params.get("cfg");
        if (raw) {
            const d = decodeConfig(raw);
            if (d) return d;
        }
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const d = decodeConfig(saved);
                if (d) return d;
            }
        } catch {
            /* ignore */
        }
        return structuredClone(DEFAULT_CONFIG);
    });

    // Persiste a última configuração para retomar depois sem perder o trabalho.
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, encodeConfig(cfg));
        } catch {
            /* ignore */
        }
    }, [cfg]);

    const [edicao, setEdicao] = useState<Edicao | null>(null);

    const patch = (p: Partial<EventConfig>) => setCfg((c) => ({ ...c, ...p }));
    /* O cadastro é a hierarquia; tudo que precisa de "um item comprável" usa isto. */
    const ingressosPlanos = useMemo(() => ingressosDoEvento(cfg), [cfg]);
    const itensVinculaveis = useMemo(
        () => [...ingressosPlanos, ...cfg.produtos].map((x) => ({ id: x.id, nome: x.nome })),
        [ingressosPlanos, cfg.produtos],
    );

    const [linkCurto, setLinkCurto] = useState("");
    const [gerando, setGerando] = useState(false);
    // O link curto vira obsoleto quando o config muda; o usuário gera de novo quando quiser.
    useEffect(() => setLinkCurto(""), [cfg]);

    // Só grava no Redis quando o usuário pede explicitamente (evita gerar vários durante a edição).
    const gerarLink = async () => {
        setGerando(true);
        try {
            const link = await buildShortShareUrl(cfg);
            setLinkCurto(link);
            toast.success("Link gerado");
        } catch {
            toast.error("Não foi possível gerar o link");
        } finally {
            setGerando(false);
        }
    };
    const copiar = async () => {
        if (!linkCurto) return;
        try {
            await navigator.clipboard.writeText(linkCurto);
            toast.success("Link copiado");
        } catch {
            toast.error("Não foi possível copiar");
        }
    };
    // Preview local — abre a seleção com o config atual (link longo, sem gravar no banco).
    const abrirSelecao = () => navigate(`/totem/event?cfg=${encodeURIComponent(encodeConfig(cfg))}`);
    const restaurar = () => {
        setCfg(structuredClone(DEFAULT_CONFIG));
        toast.success("Configuração restaurada para o exemplo");
    };

    /* ---- adicionar abre a tela do novo elemento ---- */
    const addGrupo = () => {
        setEdicao({ tipo: "grupo", index: cfg.gruposIngresso.length });
        patch({ gruposIngresso: [...cfg.gruposIngresso, { id: uid(), nome: "Novo grupo", acesso: "", ingressos: [] }] });
    };
    const addTipoIngresso = (grupoIndex: number) => {
        const grupo = cfg.gruposIngresso[grupoIndex];
        setEdicao({ tipo: "tipoIngresso", grupo: grupoIndex, index: grupo.ingressos.length });
        patch({
            gruposIngresso: upd(cfg.gruposIngresso, grupoIndex, {
                ingressos: [...grupo.ingressos, { id: uid(), nome: "Inteira", descricao: "", ativo: true, lotes: [{ id: uid(), nome: "Lote 1", preco: 0, ativo: true }] }],
            }),
        });
    };
    const addProduto = () => {
        setEdicao({ tipo: "produto", index: cfg.produtos.length });
        patch({ produtos: [...cfg.produtos, { id: uid(), nome: "", imagem: "", preco: 0 }] });
    };
    const addData = () => {
        setEdicao({ tipo: "data", index: cfg.datas.length });
        patch({
            datas: [
                ...cfg.datas,
                {
                    id: uid(),
                    diaSemana: "Sexta",
                    dia: "01",
                    mes: "JAN",
                    ano: "2026",
                    hora: "10h00",
                    abertura: "10:00",
                    encerramento: "20:00",
                    sessoes: [],
                    // Sem editor de catálogo por dia, o padrão é vender tudo que está cadastrado.
                    itens: ingressosPlanos.map((i) => i.id),
                    produtos: cfg.produtos.map((p) => p.id),
                },
            ],
        });
    };
    const addComboFixo = () => {
        setEdicao({ tipo: "comboFixo", index: cfg.combosFixos.length });
        patch({ combosFixos: [...cfg.combosFixos, { id: uid(), tab: "Combo", nome: "Novo combo fixo", lote: "", descricao: "", preco: 0, inclui: [] }] });
    };
    const addComboDinamico = () => {
        setEdicao({ tipo: "comboDinamico", index: cfg.combosDinamicos.length });
        patch({
            combosDinamicos: [
                ...cfg.combosDinamicos,
                { id: uid(), nome: "Novo combo dinâmico", desconto: "", descricao: "", dataLabel: "", sessoesLabel: "", tags: [], minItens: 1, maxItens: 4, datas: [], obrigatorios: [], quantidades: {}, precoVisivel: [], ocultos: [] },
            ],
        });
    };
    const addPergunta = () => {
        setEdicao({ tipo: "pergunta", index: cfg.perguntas.length });
        patch({ perguntas: [...cfg.perguntas, { id: uid(), titulo: "Nova pergunta", tipo: "texto", obrigatoria: true, opcoes: [], vinculos: [] }] });
    };

    const remover = (tipo: Tipo, i: number, grupoIndex?: number) => {
        if (tipo === "grupo") patch({ gruposIngresso: cfg.gruposIngresso.filter((_, j) => j !== i) });
        if (tipo === "tipoIngresso" && grupoIndex != null) {
            const grupo = cfg.gruposIngresso[grupoIndex];
            patch({ gruposIngresso: upd(cfg.gruposIngresso, grupoIndex, { ingressos: grupo.ingressos.filter((_, j) => j !== i) }) });
        }
        if (tipo === "produto") patch({ produtos: cfg.produtos.filter((_, j) => j !== i) });
        if (tipo === "data") patch({ datas: cfg.datas.filter((_, j) => j !== i) });
        if (tipo === "comboFixo") patch({ combosFixos: cfg.combosFixos.filter((_, j) => j !== i) });
        if (tipo === "comboDinamico") patch({ combosDinamicos: cfg.combosDinamicos.filter((_, j) => j !== i) });
        if (tipo === "pergunta") patch({ perguntas: cfg.perguntas.filter((_, j) => j !== i) });
    };

    /* ---- tela cheia do alvo em edição (substituiu o slideout) ---- */
    const editor = (() => {
        if (!edicao) return null;
        const { tipo, index, grupo: grupoIndex } = edicao;

        if (tipo === "grupo" && cfg.gruposIngresso[index]) {
            const it = cfg.gruposIngresso[index];
            const patchGrupo = (p: Partial<GrupoIngresso>) => patch({ gruposIngresso: upd(cfg.gruposIngresso, index, p) });
            return {
                titulo: it.nome || "Grupo",
                voltar: () => setEdicao(null),
                remover: () => remover("grupo", index),
                body: (
                    <GrupoFields
                        value={it}
                        onPatch={patchGrupo}
                        onAbrirTipo={(i) => setEdicao({ tipo: "tipoIngresso", grupo: index, index: i })}
                        onAdicionarTipo={() => addTipoIngresso(index)}
                        onRemoverTipo={(i) => remover("tipoIngresso", i, index)}
                    />
                ),
            };
        }
        if (tipo === "tipoIngresso" && grupoIndex != null && cfg.gruposIngresso[grupoIndex]?.ingressos[index]) {
            const grupo = cfg.gruposIngresso[grupoIndex];
            const it = grupo.ingressos[index];
            return {
                titulo: it.nome || "Ingresso",
                trilha: grupo.nome,
                voltar: () => setEdicao({ tipo: "grupo", index: grupoIndex }),
                remover: () => {
                    remover("tipoIngresso", index, grupoIndex);
                    setEdicao({ tipo: "grupo", index: grupoIndex });
                },
                body: (
                    <TipoIngressoFields
                        value={it}
                        onPatch={(p) =>
                            patch({ gruposIngresso: upd(cfg.gruposIngresso, grupoIndex, { ingressos: upd(grupo.ingressos, index, p) }) })
                        }
                    />
                ),
            };
        }
        if (tipo === "produto" && cfg.produtos[index]) {
            const it = cfg.produtos[index];
            return {
                titulo: it.nome || "Produto",
                voltar: () => setEdicao(null),
                remover: () => remover("produto", index),
                body: <ProdutoFields value={it} onPatch={(p) => patch({ produtos: upd(cfg.produtos, index, p) })} />,
            };
        }
        if (tipo === "data" && cfg.datas[index]) {
            const it = cfg.datas[index];
            return {
                titulo: `${it.diaSemana}, ${it.dia} ${it.mes} ${it.ano}`,
                voltar: () => setEdicao(null),
                remover: () => remover("data", index),
                body: <DataFields value={it} onPatch={(p) => patch({ datas: upd(cfg.datas, index, p) })} />,
            };
        }
        if (tipo === "comboFixo" && cfg.combosFixos[index]) {
            const it = cfg.combosFixos[index];
            return {
                titulo: it.nome || "Combo fixo",
                voltar: () => setEdicao(null),
                remover: () => remover("comboFixo", index),
                body: <ComboFixoFields value={it} onPatch={(p) => patch({ combosFixos: upd(cfg.combosFixos, index, p) })} />,
            };
        }
        if (tipo === "comboDinamico" && cfg.combosDinamicos[index]) {
            const it = cfg.combosDinamicos[index];
            return {
                titulo: it.nome || "Combo dinâmico",
                voltar: () => setEdicao(null),
                remover: () => remover("comboDinamico", index),
                body: (
                    <ComboDinamicoFields
                        value={it}
                        datas={cfg.datas}
                        ingressos={ingressosPlanos}
                        produtos={cfg.produtos}
                        onPatch={(p) => patch({ combosDinamicos: upd(cfg.combosDinamicos, index, p) })}
                    />
                ),
            };
        }
        if (tipo === "pergunta" && cfg.perguntas[index]) {
            const it = cfg.perguntas[index];
            return {
                titulo: it.titulo || "Pergunta",
                voltar: () => setEdicao(null),
                remover: () => remover("pergunta", index),
                body: <PerguntaFields value={it} itens={itensVinculaveis} onPatch={(p) => patch({ perguntas: upd(cfg.perguntas, index, p) })} />,
            };
        }
        return null;
    })();

    /* Índice do configurador. Cada entrada é uma tela, não mais um bloco numa
       rolagem de quatro telas: o formulário inteiro aberto de uma vez não diz
       por onde começar nem o que já está preenchido. */
    const indice: Array<{ grupo: string; itens: Array<{ id: Aba; label: string; contagem?: number }> }> = [
        {
            grupo: "Evento",
            itens: [
                { id: "evento", label: "Identidade e exibição" },
                { id: "dias", label: "Dias e sessões", contagem: cfg.datas.length },
            ],
        },
        {
            grupo: "Catálogo",
            itens: [
                { id: "ingressos", label: "Ingressos", contagem: cfg.gruposIngresso.length },
                { id: "produtos", label: "Produtos", contagem: cfg.produtos.length },
                { id: "combosFixos", label: "Combos fixos", contagem: cfg.combosFixos.length },
                { id: "combosDinamicos", label: "Combos dinâmicos", contagem: cfg.combosDinamicos.length },
            ],
        },
        {
            grupo: "Compra",
            itens: [
                { id: "perguntas", label: "Perguntas", contagem: cfg.perguntas.length },
                { id: "cupons", label: "Cupons", contagem: cfg.cupons.length },
                { id: "termos", label: "Termos de uso" },
            ],
        },
        { grupo: "Protótipo", itens: [{ id: "compartilhar", label: "Compartilhar" }] },
    ];

    /*
      Editar é uma tela, não uma gaveta: o slideout de 420px espremia formulários
      com listas dentro e escondia o resto da configuração atrás de um overlay.
    */
    if (editor) {
        return (
            <TotemLayout
                frame={false}
                title={editor.titulo}
                badge={editor.trilha}
                logo={cfg.logo || undefined}
                onBack={editor.voltar}
                action={
                    <Button size="md" color="primary" onClick={editor.voltar}>
                        Concluir
                    </Button>
                }
            >
                <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5">
                    <section className="flex flex-col gap-4 rounded-xl bg-primary p-5 ring-1 ring-border-secondary">{editor.body}</section>
                    <div>
                        <Button size="md" color="tertiary-destructive" iconLeading={Trash01} onClick={editor.remover}>
                            Remover
                        </Button>
                    </div>
                </div>
            </TotemLayout>
        );
    }

    return (
        // O configurador roda num desktop de bastidor: sem moldura de totem.
        <TotemLayout
            frame={false}
            title="Configurar evento"
            logo={cfg.logo || undefined}
            onBack={() => navigate("/")}
            action={
                <Button size="md" color="primary" iconTrailing={LinkExternal01} onClick={abrirSelecao}>
                    Abrir totem
                </Button>
            }
        >
            <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 md:flex-row md:items-start">
                {/* Índice: no desktop uma coluna fixa, no mobile uma faixa de chips. */}
                <nav
                    aria-label="Seções da configuração"
                    className="shrink-0 md:sticky md:top-4 md:w-[212px]"
                >
                    <ul className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:gap-0 md:overflow-visible md:pb-0">
                        {indice.map((bloco, i) => (
                            <Fragment key={bloco.grupo}>
                                {bloco.grupo && (
                                    <li className="max-md:hidden">
                                        <span
                                            className={cx(
                                                "block px-3 pb-1.5 text-sm font-semibold tracking-wide text-quaternary uppercase",
                                                i > 0 && "pt-5",
                                            )}
                                        >
                                            {bloco.grupo}
                                        </span>
                                    </li>
                                )}
                                {bloco.itens.map((item) => {
                                    const ativa = aba === item.id;
                                    return (
                                        <li key={item.id} className="shrink-0">
                                            <button
                                                type="button"
                                                aria-current={ativa ? "page" : undefined}
                                                onClick={() => setAba(item.id)}
                                                className={cx(
                                                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm whitespace-nowrap transition duration-100 ease-linear",
                                                    ativa
                                                        ? "bg-secondary font-semibold text-primary max-md:ring-1 max-md:ring-border-primary"
                                                        : "font-medium text-tertiary hover:bg-secondary_hover hover:text-secondary",
                                                )}
                                            >
                                                <span className="flex-1">{item.label}</span>
                                                {/* A contagem responde “já configurei isso?” sem precisar abrir. */}
                                                {item.contagem !== undefined && (
                                                    <span
                                                        className={cx(
                                                            "rounded-full px-1.5 text-sm tabular-nums",
                                                            item.contagem > 0 ? "bg-brand-primary text-brand-secondary" : "text-quaternary",
                                                        )}
                                                    >
                                                        {item.contagem}
                                                    </span>
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </Fragment>
                        ))}
                    </ul>
                </nav>

                <div className="flex min-w-0 flex-1 flex-col gap-5">
                    {aba === "evento" && (
                        <Secao titulo="Identidade" descricao="Como o evento aparece no topo do totem e na tela de atração.">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Input size="sm" label="Nome" value={cfg.nome} onChange={(v) => patch({ nome: v })} placeholder="Nome do evento" />
                                <Input size="sm" label="Selo" value={cfg.selo} onChange={(v) => patch({ selo: v })} placeholder="Ex.: Rascunho" />
                            </div>
                            <Input size="sm" label="Link da logo (header)" value={cfg.logo} onChange={(v) => patch({ logo: v })} placeholder="https://..." />
                            {cfg.logo && (
                                <span className="mt-1 flex h-9 w-fit items-center rounded-md bg-primary-solid px-3">
                                    <img src={cfg.logo} alt="" className="h-5 w-auto object-contain" />
                                </span>
                            )}
                            <Input size="sm" label="Link da capa" value={cfg.capa} onChange={(v) => patch({ capa: v })} placeholder="https://..." />
                            <Input size="sm" label="Link do mapa do local" value={cfg.mapa} onChange={(v) => patch({ mapa: v })} placeholder="https://..." />
                            {cfg.mapa && <img src={cfg.mapa} alt="" className="mt-1 max-h-40 w-auto self-start rounded-lg object-cover ring-1 ring-border-secondary" />}

                            <div className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-secondary">Cor de destaque (botões e links)</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        aria-label="Cor de destaque"
                                        value={cfg.corDestaque || "#ff271a"}
                                        onChange={(e) => patch({ corDestaque: e.target.value })}
                                        className="size-9 shrink-0 cursor-pointer rounded-md ring-1 ring-border-primary"
                                    />
                                    <Input size="sm" placeholder="#ff271a" value={cfg.corDestaque ?? ""} onChange={(v) => patch({ corDestaque: v })} />
                                    {cfg.corDestaque && (
                                        <Button size="sm" color="link-gray" onClick={() => patch({ corDestaque: "" })}>
                                            Padrão
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Secao>
                    )}

                    {aba === "dias" && (
                        <Secao
                            titulo="Dias e sessões"
                            descricao="Os dias do evento, a janela de abertura de cada um e as sessões que acontecem dentro dela."
                            onAdd={addData}
                            addLabel="Adicionar dia"
                            vazio="Nenhum dia cadastrado."
                            temItens={cfg.datas.length > 0}
                        >
                            {cfg.datas.map((d, i) => (
                                <LinhaResumo key={d.id} onEditar={() => setEdicao({ tipo: "data", index: i })} onRemover={() => remover("data", i)}>
                                    <span className="truncate text-sm font-medium text-primary">
                                        {d.diaSemana}, {d.dia} {d.mes} {d.ano}
                                    </span>
                                    {/* A janela e a contagem de sessões respondem o que se quer saber da lista. */}
                                    {d.abertura && d.encerramento && (
                                        <span className="text-sm text-tertiary">
                                            {d.abertura} às {d.encerramento}
                                        </span>
                                    )}
                                    <span className="text-sm text-tertiary">
                                        {d.sessoes?.length
                                            ? `${d.sessoes.length} ${d.sessoes.length === 1 ? "sessão" : "sessões"}`
                                            : "sessão única"}
                                    </span>
                                </LinhaResumo>
                            ))}
                        </Secao>
                    )}

                    {aba === "evento" && (
                        <Secao
                            titulo="Comportamento da venda"
                            descricao="As abas do totem seguem o catálogo: aparece o que estiver cadastrado. Aqui ficam só os ajustes que não vêm dos itens."
                        >
                            {/*
                              Toggle, não checkbox: cada linha liga ou desliga um comportamento
                              na hora — não é uma escolha que se confirma depois.
                            */}
                            <div className="-my-1 flex flex-col divide-y divide-secondary">
                                <LinhaToggle
                                    label="Formulário de perguntas em accordion"
                                    hint="Ligado, as opções de atribuição viram accordion e o formulário abre inline. Desligado, abre em modal."
                                    isSelected={cfg.modoAtribuicao === "accordion"}
                                    onChange={(on) => patch({ modoAtribuicao: on ? "accordion" : "modal" })}
                                />
                                <LinhaToggle
                                    label="Botão de voltar para as configurações"
                                    hint="Só para testar o protótipo. No totem de rua fica desligado."
                                    isSelected={cfg.exibirVoltar !== false}
                                    onChange={(on) => patch({ exibirVoltar: on })}
                                />
                            </div>
                        </Secao>
                    )}

                    {aba === "ingressos" && (
                        <Secao
                            titulo="Ingressos"
                            descricao="Grupo é o setor, o ingresso é o tipo dentro dele e o lote é onde fica o preço. Só lote ativo chega ao totem."
                            onAdd={addGrupo}
                            addLabel="Adicionar grupo"
                            vazio="Nenhum grupo cadastrado."
                            temItens={cfg.gruposIngresso.length > 0}
                        >
                            {cfg.gruposIngresso.map((grupo, gi) => (
                                <GrupoCard
                                    key={grupo.id}
                                    grupo={grupo}
                                    onEditar={() => setEdicao({ tipo: "grupo", index: gi })}
                                    onRemover={() => remover("grupo", gi)}
                                    onEditarTipo={(ti) => setEdicao({ tipo: "tipoIngresso", grupo: gi, index: ti })}
                                    onAdicionarTipo={() => addTipoIngresso(gi)}
                                />
                            ))}
                        </Secao>
                    )}

                    {aba === "produtos" && (
                        <Secao titulo="Produtos" descricao="Itens extras oferecidos junto do ingresso." onAdd={addProduto} addLabel="Adicionar produto" vazio="Nenhum produto cadastrado." temItens={cfg.produtos.length > 0}>
                            {cfg.produtos.map((p, i) => (
                                <LinhaResumo key={p.id} onEditar={() => setEdicao({ tipo: "produto", index: i })} onRemover={() => remover("produto", i)}>
                                    {p.imagem && <img src={p.imagem} alt="" className="size-6 shrink-0 rounded object-cover ring-1 ring-border-secondary" />}
                                    <span className="truncate text-sm font-medium text-primary">{p.nome || "Produto"}</span>
                                    {p.preco != null && <span className="text-sm text-tertiary">{brl(p.preco)}</span>}
                                </LinhaResumo>
                            ))}
                        </Secao>
                    )}

                    {aba === "combosFixos" && (
                        <Secao titulo="Combos fixos" descricao="Pacotes de composição fechada e preço próprio." onAdd={addComboFixo} addLabel="Adicionar combo fixo" vazio="Nenhum combo fixo cadastrado." temItens={cfg.combosFixos.length > 0}>
                            {cfg.combosFixos.map((c, i) => (
                                <LinhaResumo key={c.id} onEditar={() => setEdicao({ tipo: "comboFixo", index: i })} onRemover={() => remover("comboFixo", i)}>
                                    {c.tab && <span className="rounded bg-secondary px-1.5 py-0.5 text-sm font-medium text-tertiary">{c.tab}</span>}
                                    <span className="truncate text-sm font-medium text-primary">{c.nome || "Combo fixo"}</span>
                                    <span className="text-sm text-tertiary">{brl(c.preco)}</span>
                                </LinhaResumo>
                            ))}
                        </Secao>
                    )}

                    {aba === "combosDinamicos" && (
                        <Secao titulo="Combos dinâmicos" descricao="O comprador monta o pacote dentro de um mínimo e um máximo." onAdd={addComboDinamico} addLabel="Adicionar combo dinâmico" vazio="Nenhum combo dinâmico cadastrado." temItens={cfg.combosDinamicos.length > 0}>
                            {/* Rótulo da aba: é propriedade desta coleção, não de uma tela de exibição. */}
                            <Input
                                size="sm"
                                label="Nome da aba no totem"
                                value={cfg.comboTabLabel}
                                onChange={(v) => patch({ comboTabLabel: v })}
                                placeholder="Ex.: Combo dinâmico"
                                className="max-w-xs"
                            />
                            {cfg.combosDinamicos.map((c, i) => (
                                <LinhaResumo key={c.id} onEditar={() => setEdicao({ tipo: "comboDinamico", index: i })} onRemover={() => remover("comboDinamico", i)}>
                                    <span className="truncate text-sm font-medium text-primary">{c.nome || "Combo dinâmico"}</span>
                                    <span className="text-sm text-tertiary">
                                        {c.datas.length} {c.datas.length === 1 ? "data" : "datas"} · {c.minItens}–{c.maxItens} itens
                                    </span>
                                </LinhaResumo>
                            ))}
                        </Secao>
                    )}

                    {aba === "perguntas" && (
                        <Secao titulo="Perguntas" descricao="Formulário preenchido na atribuição de cada ingresso." onAdd={addPergunta} addLabel="Adicionar pergunta" vazio="Nenhuma pergunta cadastrada." temItens={cfg.perguntas.length > 0}>
                            {cfg.perguntas.map((p, i) => (
                                <LinhaResumo key={p.id} onEditar={() => setEdicao({ tipo: "pergunta", index: i })} onRemover={() => remover("pergunta", i)}>
                                    <span className="truncate text-sm font-medium text-primary">{p.titulo || "Pergunta"}</span>
                                    <span className="text-sm text-tertiary">
                                        {TIPOS.find((t) => t.id === p.tipo)?.label}
                                        {p.obrigatoria ? " · obrigatória" : ""} · {p.vinculos.length} {p.vinculos.length === 1 ? "vínculo" : "vínculos"}
                                    </span>
                                </LinhaResumo>
                            ))}
                        </Secao>
                    )}

                    {aba === "cupons" && (
                        <Secao titulo="Cupons" descricao="Códigos aceitos na tela de seleção." onAdd={() => patch({ cupons: [...cfg.cupons, { codigo: "", ajuda: "" }] })} addLabel="Adicionar cupom" vazio="Nenhum cupom cadastrado." temItens={cfg.cupons.length > 0}>
                            {cfg.cupons.map((c, i) => (
                                <div key={i} className="flex items-end gap-3">
                                    <Input size="sm" label="Código" value={c.codigo} onChange={(v) => patch({ cupons: upd(cfg.cupons, i, { codigo: v }) })} className="w-40" />
                                    <Input size="sm" label="Texto de ajuda" value={c.ajuda} onChange={(v) => patch({ cupons: upd(cfg.cupons, i, { ajuda: v }) })} className="flex-1" />
                                    <ButtonUtility size="sm" color="tertiary" icon={Trash01} tooltip="Remover" className="mb-0.5" onClick={() => patch({ cupons: cfg.cupons.filter((_, j) => j !== i) })} />
                                </div>
                            ))}
                        </Secao>
                    )}

                    {aba === "termos" && (
                        <Secao titulo="Termos de uso" descricao="Texto do modal de aceite, antes de finalizar a compra. Deixe vazio para pular essa etapa.">
                            <textarea
                                value={cfg.termos}
                                onChange={(e) => patch({ termos: e.target.value })}
                                rows={14}
                                placeholder="Cole aqui os termos de uso do evento…"
                                className="w-full resize-y rounded-lg bg-primary px-3 py-2 text-sm whitespace-pre-line text-secondary ring-1 ring-border-secondary outline-hidden focus:ring-2 focus:ring-brand"
                            />
                        </Secao>
                    )}

                    {aba === "compartilhar" && (
                        <Secao titulo="Compartilhar" descricao="As alterações são salvas neste navegador. Gere um link curto para abrir esta configuração em outra máquina.">
                            {linkCurto ? (
                                <textarea readOnly value={linkCurto} rows={2} className="w-full resize-none rounded-lg bg-secondary px-3 py-2 font-mono text-sm break-all text-secondary ring-1 ring-border-secondary outline-hidden" />
                            ) : (
                                <span className="rounded-lg bg-secondary px-3 py-2 text-sm text-tertiary ring-1 ring-border-secondary">Nenhum link gerado ainda.</span>
                            )}
                            <div className="flex flex-wrap items-center gap-3">
                                <Button size="sm" color="primary" iconLeading={LinkExternal01} onClick={gerarLink} isLoading={gerando}>
                                    {linkCurto ? "Gerar novo link" : "Gerar link"}
                                </Button>
                                <Button size="sm" color="secondary" iconLeading={Copy01} onClick={copiar} isDisabled={!linkCurto}>
                                    Copiar link
                                </Button>
                                <Button size="sm" color="link-gray" className="ml-auto" onClick={restaurar}>
                                    Restaurar exemplo
                                </Button>
                            </div>
                        </Secao>
                    )}
                </div>
            </div>

        </TotemLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Estruturais                                                       */
/* ------------------------------------------------------------------ */

function upd<T>(arr: T[], i: number, p: Partial<T>): T[] {
    return arr.map((x, j) => (j === i ? { ...x, ...p } : x));
}

function Secao({
    titulo,
    descricao,
    children,
    onAdd,
    addLabel,
    vazio,
    temItens = true,
}: {
    titulo: string;
    descricao?: string;
    children: React.ReactNode;
    onAdd?: () => void;
    addLabel?: string;
    /** Texto do estado vazio, quando a seção é uma lista. */
    vazio?: string;
    temItens?: boolean;
}) {
    return (
        <section className="flex flex-col rounded-xl bg-primary ring-1 ring-border-secondary">
            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <h2 className="text-md font-semibold text-primary">{titulo}</h2>
                    {/* O que a seção controla, dito onde a dúvida aparece. */}
                    {descricao && <p className="text-sm text-tertiary">{descricao}</p>}
                </div>
                {/* Com a lista vazia a ação vive no estado vazio: dois botões iguais na mesma tela. */}
                {onAdd && temItens && (
                    <Button size="sm" color="secondary" iconLeading={Plus} className="shrink-0 max-sm:w-full" onClick={onAdd}>
                        {addLabel ?? "Adicionar"}
                    </Button>
                )}
            </div>
            <div className="flex flex-col gap-3 border-t border-secondary p-5">
                {temItens ? (
                    children
                ) : (
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                        <p className="text-sm text-tertiary">{vazio}</p>
                        {onAdd && (
                            <Button size="sm" color="secondary" iconLeading={Plus} onClick={onAdd}>
                                {addLabel ?? "Adicionar"}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/*  Ingressos: grupo > ingresso > lote (mesma leitura do Backstage)     */
/* ------------------------------------------------------------------ */

/** Card de um grupo com seus ingressos e, aninhados, os lotes de cada um. */
function GrupoCard({
    grupo,
    onEditar,
    onRemover,
    onEditarTipo,
    onAdicionarTipo,
}: {
    grupo: GrupoIngresso;
    onEditar: () => void;
    onRemover: () => void;
    onEditarTipo: (index: number) => void;
    onAdicionarTipo: () => void;
}) {
    const [aberto, setAberto] = useState(true);
    const lotesAtivos = grupo.ingressos.reduce((soma, t) => soma + (t.ativo ? t.lotes.filter((l) => l.ativo).length : 0), 0);

    return (
        <section className="flex flex-col overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
            <div className="flex items-center gap-2 px-4 py-3">
                <button type="button" onClick={() => setAberto((a) => !a)} aria-expanded={aberto} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                    <ChevronDown className={cx("size-4 shrink-0 text-fg-quaternary transition-transform", aberto && "rotate-180")} aria-hidden="true" />
                    <span className="truncate text-sm font-semibold text-primary">{grupo.nome || "Grupo sem nome"}</span>
                    {grupo.acesso && <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-sm text-tertiary">{grupo.acesso}</span>}
                    <span className="shrink-0 text-sm text-tertiary">
                        {grupo.ingressos.length} {grupo.ingressos.length === 1 ? "ingresso" : "ingressos"} · {lotesAtivos} à venda
                    </span>
                </button>
                <ButtonUtility size="sm" color="tertiary" icon={Edit01} tooltip="Editar grupo" onClick={onEditar} />
                <ButtonUtility size="sm" color="tertiary" icon={Trash01} tooltip="Remover grupo" onClick={onRemover} />
            </div>

            {aberto && (
                <div className="flex flex-col border-t border-secondary">
                    {grupo.ingressos.length === 0 ? (
                        <span className="px-4 py-5 text-center text-sm text-tertiary">Nenhum ingresso neste grupo.</span>
                    ) : (
                        grupo.ingressos.map((tipo, ti) => <TipoRow key={tipo.id} tipo={tipo} onEditar={() => onEditarTipo(ti)} />)
                    )}
                    <div className="border-t border-secondary px-4 py-3">
                        <Button size="sm" color="link-color" iconLeading={Plus} onClick={onAdicionarTipo}>
                            Novo ingresso
                        </Button>
                    </div>
                </div>
            )}
        </section>
    );
}

/** Linha de um tipo de ingresso, com os lotes indentados abaixo. */
function TipoRow({ tipo, onEditar }: { tipo: TipoIngresso; onEditar: () => void }) {
    const [aberto, setAberto] = useState(false);
    const ativos = tipo.lotes.filter((l) => l.ativo);
    const precos = ativos.map((l) => l.preco);

    return (
        <div className="flex flex-col border-b border-secondary last:border-b-0">
            <div className="flex items-center gap-2 px-4 py-2.5">
                <button
                    type="button"
                    onClick={() => setAberto((a) => !a)}
                    aria-expanded={aberto}
                    aria-label={`Lotes de ${tipo.nome}`}
                    className="shrink-0 rounded p-1 text-fg-quaternary transition hover:bg-secondary"
                >
                    <ChevronDown className={cx("size-4 transition-transform", aberto && "rotate-180")} aria-hidden="true" />
                </button>
                <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-primary">{tipo.nome || "Ingresso"}</span>
                        {!tipo.ativo && <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-sm text-tertiary">Inativo</span>}
                    </span>
                    <span className="text-sm text-tertiary">
                        {ativos.length} de {tipo.lotes.length} {tipo.lotes.length === 1 ? "lote à venda" : "lotes à venda"}
                    </span>
                </span>
                {precos.length > 0 && (
                    <span className="shrink-0 text-sm text-tertiary tabular-nums">
                        {precos.length > 1 ? `${brl(Math.min(...precos))} a ${brl(Math.max(...precos))}` : brl(precos[0])}
                    </span>
                )}
                <ButtonUtility size="sm" color="tertiary" icon={Edit01} tooltip="Editar ingresso" onClick={onEditar} />
            </div>

            {aberto && (
                <ul className="flex flex-col gap-1 pb-2 pl-12">
                    {tipo.lotes.length === 0 ? (
                        <li className="py-1 text-sm text-tertiary">Nenhum lote.</li>
                    ) : (
                        tipo.lotes.map((lote) => (
                            <li key={lote.id} className="flex items-center gap-2 py-1">
                                <span className={cx("text-sm", lote.ativo ? "text-secondary" : "text-quaternary line-through")}>{lote.nome}</span>
                                {lote.auto && <span className="rounded bg-brand-primary px-1.5 py-0.5 text-sm font-medium text-brand-secondary">Auto</span>}
                                {lote.virada && <span className="text-sm text-tertiary">vira em {lote.virada}</span>}
                                <span className="ml-auto text-sm text-tertiary tabular-nums">{brl(lote.preco)}</span>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
}

/** Tela do grupo: dados do setor e a lista de ingressos dentro dele. */
function GrupoFields({
    value,
    onPatch,
    onAbrirTipo,
    onAdicionarTipo,
    onRemoverTipo,
}: {
    value: GrupoIngresso;
    onPatch: (p: Partial<GrupoIngresso>) => void;
    onAbrirTipo: (index: number) => void;
    onAdicionarTipo: () => void;
    onRemoverTipo: (index: number) => void;
}) {
    return (
        <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input size="sm" label="Nome do grupo" value={value.nome} onChange={(v) => onPatch({ nome: v })} placeholder="Ex.: Camarote VIP" />
                <Input size="sm" label="Acesso" value={value.acesso} onChange={(v) => onPatch({ acesso: v })} placeholder="Ex.: Portão A" hint="Por onde se entra com este ingresso." />
            </div>

            <div className="flex flex-col gap-2 border-t border-secondary pt-4">
                <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-secondary">Ingressos deste grupo</span>
                    <Button size="sm" color="secondary" iconLeading={Plus} className="shrink-0" onClick={onAdicionarTipo}>
                        Novo ingresso
                    </Button>
                </div>
                {value.ingressos.length === 0 ? (
                    <span className="rounded-lg bg-secondary px-3 py-4 text-center text-sm text-tertiary">Nenhum ingresso neste grupo.</span>
                ) : (
                    <div className="flex flex-col gap-2">
                        {value.ingressos.map((tipo, i) => (
                            <div key={tipo.id} className="flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2.5 ring-1 ring-border-secondary">
                                <button type="button" onClick={() => onAbrirTipo(i)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                                    <span className="truncate text-sm font-medium text-primary">{tipo.nome || "Ingresso"}</span>
                                    <span className="text-sm text-tertiary">
                                        {tipo.lotes.length} {tipo.lotes.length === 1 ? "lote" : "lotes"}
                                    </span>
                                    {!tipo.ativo && <span className="rounded bg-secondary px-1.5 py-0.5 text-sm text-tertiary">Inativo</span>}
                                </button>
                                <ButtonUtility size="sm" color="tertiary" icon={Edit01} tooltip="Editar" onClick={() => onAbrirTipo(i)} />
                                <ButtonUtility size="sm" color="tertiary" icon={Trash01} tooltip="Remover" onClick={() => onRemoverTipo(i)} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

/** Tela do tipo de ingresso: nome, descrição e os lotes com preço. */
function TipoIngressoFields({ value, onPatch }: { value: TipoIngresso; onPatch: (p: Partial<TipoIngresso>) => void }) {
    const patchLotes = (lotes: LoteIngresso[]) => onPatch({ lotes });

    return (
        <>
            <Input size="sm" label="Nome" value={value.nome} onChange={(v) => onPatch({ nome: v })} placeholder="Ex.: Inteira" />
            <Input
                size="sm"
                label="Descrição (opcional)"
                value={value.descricao ?? ""}
                onChange={(v) => onPatch({ descricao: v })}
                placeholder="Ex.: Consumação inclusa"
            />
            <LinhaToggle
                label="Ingresso ativo"
                hint="Desligado, some do totem junto com todos os seus lotes."
                isSelected={value.ativo}
                onChange={(on) => onPatch({ ativo: on })}
            />

            <div className="flex flex-col gap-2 border-t border-secondary pt-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-secondary">Lotes</span>
                        <span className="text-sm text-tertiary">O preço mora aqui. Só o lote ativo aparece para o comprador.</span>
                    </div>
                    <Button
                        size="sm"
                        color="secondary"
                        iconLeading={Plus}
                        className="shrink-0"
                        onClick={() => patchLotes([...value.lotes, { id: uid(), nome: `Lote ${value.lotes.length + 1}`, preco: 0, ativo: true }])}
                    >
                        Adicionar
                    </Button>
                </div>

                {value.lotes.length === 0 ? (
                    <span className="rounded-lg bg-secondary px-3 py-4 text-center text-sm text-tertiary">Nenhum lote cadastrado.</span>
                ) : (
                    <div className="flex flex-col gap-2">
                        {value.lotes.map((lote, i) => {
                            const patchLote = (p: Partial<LoteIngresso>) => patchLotes(upd(value.lotes, i, p));
                            return (
                                <div key={lote.id} className="flex flex-col gap-3 rounded-lg bg-secondary/40 p-3 ring-1 ring-border-secondary">
                                    <div className="flex items-end gap-2">
                                        <Input size="sm" label={i === 0 ? "Nome" : undefined} className="flex-1" value={lote.nome} onChange={(v) => patchLote({ nome: v })} />
                                        <Input
                                            size="sm"
                                            label={i === 0 ? "Preço" : undefined}
                                            type="number"
                                            className="w-32"
                                            value={String(lote.preco)}
                                            onChange={(v) => patchLote({ preco: Math.max(0, Number(v) || 0) })}
                                        />
                                        <ButtonUtility size="sm" color="tertiary" icon={Trash01} tooltip="Remover lote" className="mb-0.5" onClick={() => patchLotes(value.lotes.filter((_, j) => j !== i))} />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                        <label className="flex items-center gap-2 text-sm text-secondary">
                                            <Toggle size="sm" isSelected={lote.ativo} onChange={(on) => patchLote({ ativo: on })} aria-label={`${lote.nome} à venda`} />
                                            À venda
                                        </label>
                                        <label className="flex items-center gap-2 text-sm text-secondary">
                                            <Toggle size="sm" isSelected={!!lote.auto} onChange={(on) => patchLote({ auto: on })} aria-label={`${lote.nome} com virada automática`} />
                                            Virada automática
                                        </label>
                                        <Input
                                            size="sm"
                                            placeholder="Ex.: 25/07 às 10:00"
                                            className="w-52"
                                            aria-label={`Virada do ${lote.nome}`}
                                            value={lote.virada ?? ""}
                                            onChange={(v) => patchLote({ virada: v })}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}

/** Uma opção de exibição: rótulo, explicação e o toggle na ponta. */
function LinhaToggle({
    label,
    hint,
    isSelected,
    onChange,
    children,
}: {
    label: string;
    hint: string;
    isSelected: boolean;
    onChange: (on: boolean) => void;
    /** Campo dependente, revelado quando a opção está ligada. */
    children?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3 py-3">
            <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-medium text-secondary">{label}</span>
                    <span className="text-sm text-tertiary">{hint}</span>
                </div>
                <Toggle size="sm" className="mt-0.5 shrink-0" isSelected={isSelected} onChange={onChange} aria-label={label} />
            </div>
            {children}
        </div>
    );
}

/** Linha resumida de um elemento da lista — abre a edição no slideout. */
function LinhaResumo({ children, onEditar, onRemover }: { children: React.ReactNode; onEditar: () => void; onRemover: () => void }) {
    return (
        <div className="flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2.5 ring-1 ring-border-secondary">
            <button type="button" onClick={onEditar} className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5 text-left">
                {children}
            </button>
            <ButtonUtility size="sm" color="tertiary" icon={Edit01} tooltip="Editar" onClick={onEditar} />
            <ButtonUtility size="sm" color="tertiary" icon={Trash01} tooltip="Remover" onClick={onRemover} />
        </div>
    );
}

function PickIds({ options, selected, onToggle, vazio }: { options: { id: string; nome: string }[]; selected: string[]; onToggle: (id: string) => void; vazio?: string }) {
    if (options.length === 0) return <span className="text-sm text-tertiary">{vazio ?? "Nada cadastrado."}</span>;
    return (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {options.map((o) => (
                <label key={o.id} className="flex items-center gap-1.5 text-sm text-secondary">
                    <Checkbox size="sm" isSelected={selected.includes(o.id)} onChange={() => onToggle(o.id)} />
                    {o.nome || o.id}
                </label>
            ))}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Formulários (dentro do slideout)                                  */
/* ------------------------------------------------------------------ */

function RichTextEditor({ label, value, onChange }: { label?: string; value: string; onChange: (html: string) => void }) {
    const ref = useRef<HTMLDivElement>(null);
    // Sincroniza o conteúdo inicial / quando muda externamente (sem sobrescrever enquanto digita).
    useEffect(() => {
        if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
    }, [value]);
    const exec = (cmd: string) => {
        ref.current?.focus();
        document.execCommand(cmd, false);
        onChange(ref.current?.innerHTML ?? "");
    };
    const Btn = ({ cmd, children }: { cmd: string; children: React.ReactNode }) => (
        <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(cmd)}
            className="flex size-7 items-center justify-center rounded-md text-sm text-secondary transition hover:bg-primary_hover"
        >
            {children}
        </button>
    );
    return (
        <div className="flex flex-col gap-1.5">
            {label && <span className="text-sm font-medium text-secondary">{label}</span>}
            <div className="overflow-clip rounded-lg ring-1 ring-border-primary focus-within:ring-2 focus-within:ring-brand">
                <div className="flex items-center gap-0.5 border-b border-secondary bg-secondary/40 px-1.5 py-1">
                    <Btn cmd="bold">
                        <span className="font-bold">B</span>
                    </Btn>
                    <Btn cmd="italic">
                        <span className="italic">I</span>
                    </Btn>
                    <Btn cmd="underline">
                        <span className="underline">U</span>
                    </Btn>
                    <Btn cmd="insertUnorderedList">•</Btn>
                </div>
                <div
                    ref={ref}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => onChange(e.currentTarget.innerHTML)}
                    className="min-h-[96px] px-3 py-2 text-sm text-primary outline-none [&_b]:font-semibold [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
                />
            </div>
        </div>
    );
}

function ProdutoFields({ value, onPatch }: { value: Produto; onPatch: (p: Partial<Produto>) => void }) {
    return (
        <>
            <Input size="sm" label="Nome" value={value.nome} onChange={(v) => onPatch({ nome: v })} />
            <Input size="sm" label="Selo" placeholder="Ex.: Últimas unidades" value={value.selo ?? ""} onChange={(v) => onPatch({ selo: v || undefined })} />
            <Input size="sm" label="Link da imagem do produto" placeholder="https://..." value={value.imagem ?? ""} onChange={(v) => onPatch({ imagem: v || undefined })} />
            {value.imagem && <img src={value.imagem} alt="" className="max-h-40 w-auto self-start rounded-lg object-cover ring-1 ring-border-secondary" />}
            <Input size="sm" label="Preço (R$)" type="number" value={value.preco != null ? String(value.preco) : ""} onChange={(v) => onPatch({ preco: v === "" ? undefined : Number(v) || 0 })} />
        </>
    );
}

const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
const SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/** Rótulo curto do horário do dia, para o fluxo: primeira sessão ou abertura. */
const rotuloHora = (d: Pick<DataEvento, "abertura" | "sessoes">) => {
    const base = d.sessoes?.[0]?.hora || d.abertura || "";
    return base ? base.replace(":", "h") : undefined;
};

function DataFields({ value, onPatch }: { value: DataEvento; onPatch: (p: Partial<DataEvento>) => void }) {
    /* O seletor guarda só a data: o horário do dia é a janela de abertura. */
    const setData = (iso: string) => {
        if (!iso) {
            onPatch({ iso: "" });
            return;
        }
        const [y, mo, d] = iso.split("-").map(Number);
        const dt = new Date(y, (mo || 1) - 1, d || 1);
        onPatch({
            iso,
            dia: String(d).padStart(2, "0"),
            mes: MESES[(mo || 1) - 1],
            ano: String(y),
            diaSemana: SEMANA[dt.getDay()],
        });
    };

    const sessoes = value.sessoes ?? [];
    const patchSessoes = (proximas: Sessao[]) => onPatch({ sessoes: proximas, hora: rotuloHora({ abertura: value.abertura, sessoes: proximas }) });
    /* Janela invertida faz toda sessão cair "fora": o erro a resolver é o da janela. */
    const janelaInvalida = Boolean(value.abertura && value.encerramento && value.encerramento <= value.abertura);

    return (
        <>
            <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-secondary">Dia</span>
                <input
                    type="date"
                    value={(value.iso ?? "").split("T")[0]}
                    onChange={(e) => setData(e.target.value)}
                    className="rounded-lg bg-primary px-3 py-2 text-sm text-primary ring-1 ring-border-primary outline-hidden focus:ring-2 focus:ring-brand"
                />
            </label>
            {value.diaSemana && value.dia && (
                <span className="text-sm text-tertiary">
                    {value.diaSemana}, {value.dia} {value.mes} {value.ano}
                </span>
            )}

            {/* A janela do dia é uma coisa só: dois campos lado a lado, não dois blocos. */}
            <div className="flex gap-3">
                <CampoHora
                    label="Abertura"
                    value={value.abertura ?? ""}
                    onChange={(v) => onPatch({ abertura: v, hora: rotuloHora({ abertura: v, sessoes }) })}
                />
                <CampoHora label="Encerramento" value={value.encerramento ?? ""} onChange={(v) => onPatch({ encerramento: v })} />
            </div>
            {janelaInvalida && (
                <span role="alert" className="text-sm text-error-primary">
                    O encerramento precisa ser depois da abertura.
                </span>
            )}

            <div className="flex flex-col gap-3 border-t border-secondary pt-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-secondary">Sessões</span>
                        <span className="text-sm text-tertiary">Horários dentro do dia. Sem sessões, o dia inteiro vale como uma só.</span>
                    </div>
                    <Button
                        size="sm"
                        color="secondary"
                        iconLeading={Plus}
                        className="shrink-0"
                        onClick={() => patchSessoes([...sessoes, { id: uid(), hora: value.abertura || "10:00" }])}
                    >
                        Adicionar
                    </Button>
                </div>

                {sessoes.length === 0 ? (
                    <span className="rounded-lg bg-secondary px-3 py-4 text-center text-sm text-tertiary">Nenhuma sessão cadastrada.</span>
                ) : (
                    <div className="flex flex-col gap-2">
                        {sessoes.map((sessao, i) => {
                            const foraDaJanela =
                                !janelaInvalida &&
                                Boolean((value.abertura && sessao.hora < value.abertura) || (value.encerramento && sessao.hora > value.encerramento));
                            const repetida = sessoes.some((outra, j) => j < i && outra.hora === sessao.hora);

                            return (
                                <div key={sessao.id} className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <CampoHora
                                            value={sessao.hora}
                                            onChange={(v) => patchSessoes(sessoes.map((x, j) => (j === i ? { ...x, hora: v } : x)))}
                                        />
                                        <ButtonUtility
                                            size="sm"
                                            color="tertiary"
                                            icon={Trash01}
                                            tooltip="Remover sessão"
                                            onClick={() => patchSessoes(sessoes.filter((_, j) => j !== i))}
                                        />
                                    </div>
                                    {foraDaJanela && (
                                        <span role="alert" className="text-sm text-error-primary">
                                            Essa sessão está fora da janela de {value.abertura} às {value.encerramento}.
                                        </span>
                                    )}
                                    {!foraDaJanela && repetida && (
                                        <span role="alert" className="text-sm text-error-primary">
                                            Já existe uma sessão às {sessao.hora} neste dia.
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}

/** Campo de hora com o mesmo enquadramento visual dos inputs do DS. */
function CampoHora({ label, value, onChange }: { label?: string; value: string; onChange: (v: string) => void }) {
    return (
        <label className="flex flex-col gap-1.5">
            {label && <span className="text-sm font-medium text-secondary">{label}</span>}
            <input
                type="time"
                value={value}
                aria-label={label ?? "Hora"}
                onChange={(e) => onChange(e.target.value)}
                className="w-[124px] rounded-lg bg-primary px-3 py-2 text-sm text-primary ring-1 ring-border-primary outline-hidden focus:ring-2 focus:ring-brand"
            />
        </label>
    );
}

function GripIcon() {
    return (
        <svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden="true">
            <circle cx="5.5" cy="4" r="1.3" />
            <circle cx="10.5" cy="4" r="1.3" />
            <circle cx="5.5" cy="8" r="1.3" />
            <circle cx="10.5" cy="8" r="1.3" />
            <circle cx="5.5" cy="12" r="1.3" />
            <circle cx="10.5" cy="12" r="1.3" />
        </svg>
    );
}

function DragHandle({ controls }: { controls: DragControls }) {
    return (
        <button
            type="button"
            onPointerDown={(e) => controls.start(e)}
            aria-label="Arrastar para reordenar"
            className="shrink-0 cursor-grab touch-none text-fg-quaternary transition hover:text-fg-secondary active:cursor-grabbing"
        >
            <GripIcon />
        </button>
    );
}

/** Lista empilhada com seleção e reordenação por arrasto — selecionados no topo. */
function SeletorOrdenavel({
    titulo,
    options,
    selected,
    onChange,
    vazio,
    renderControles,
}: {
    titulo: string;
    options: { id: string; nome: string; imagem?: string }[];
    selected: string[];
    onChange: (ids: string[]) => void;
    vazio?: string;
    renderControles?: (id: string) => React.ReactNode;
}) {
    const byId = new Map(options.map((o) => [o.id, o]));
    const naoSel = options.filter((o) => !selected.includes(o.id));
    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-tertiary">{titulo}</span>
            {options.length === 0 ? (
                <span className="text-sm text-tertiary">{vazio ?? "Nada cadastrado."}</span>
            ) : (
                <>
                    {selected.length > 0 && (
                        <Reorder.Group as="ul" axis="y" values={selected} onReorder={onChange} className="flex flex-col gap-1.5">
                            {selected.map((id, i) => {
                                const o = byId.get(id);
                                if (!o) return null;
                                return <ItemArrastavel key={id} id={id} index={i} item={o} onRemover={() => onChange(selected.filter((x) => x !== id))} controles={renderControles?.(id)} />;
                            })}
                        </Reorder.Group>
                    )}
                    {naoSel.length > 0 && (
                        <>
                            <span className="text-sm text-tertiary">Não selecionados</span>
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                                {naoSel.map((o) => (
                                    <label key={o.id} className="flex items-center gap-1.5 text-sm text-secondary">
                                        <Checkbox size="sm" isSelected={false} onChange={() => onChange([...selected, o.id])} />
                                        {o.nome || o.id}
                                    </label>
                                ))}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}

function ItemArrastavel({ id, index, item, onRemover, controles }: { id: string; index: number; item: { id: string; nome: string; imagem?: string }; onRemover: () => void; controles?: React.ReactNode }) {
    const controls = useDragControls();
    return (
        <Reorder.Item
            value={id}
            dragListener={false}
            dragControls={controls}
            className="flex items-center gap-2.5 rounded-lg bg-secondary/40 px-2.5 py-2 ring-1 ring-border-secondary"
        >
            <DragHandle controls={controls} />
            <Checkbox size="sm" isSelected onChange={onRemover} aria-label={`Remover ${item.nome}`} />
            <span className="w-4 text-center text-sm text-tertiary tabular-nums">{index + 1}</span>
            {item.imagem ? <img src={item.imagem} alt="" className="size-7 shrink-0 rounded object-cover ring-1 ring-border-secondary" /> : <Ticket01 className="size-4 shrink-0 text-fg-quaternary" />}
            <span className="min-w-0 flex-1 truncate text-sm text-primary">{item.nome || item.id}</span>
            {controles}
        </Reorder.Item>
    );
}

function ComboFixoFields({ value, onPatch }: { value: ComboFixo; onPatch: (p: Partial<ComboFixo>) => void }) {
    return (
        <>
            <Input size="sm" label="Nome da aba" placeholder="PASSAPORTE" value={value.tab} onChange={(v) => onPatch({ tab: v })} />
            <Input size="sm" label="Nome do combo" value={value.nome} onChange={(v) => onPatch({ nome: v })} />
            <div className="grid grid-cols-2 gap-2">
                <Input size="sm" label="Lote" placeholder="LOTE 2" value={value.lote ?? ""} onChange={(v) => onPatch({ lote: v })} />
                <Input size="sm" label="Preço (R$)" type="number" value={String(value.preco)} onChange={(v) => onPatch({ preco: Number(v) || 0 })} />
            </div>
            <Input size="sm" label="Descrição" value={value.descricao ?? ""} onChange={(v) => onPatch({ descricao: v })} />

            <span className="text-sm font-medium text-tertiary">Ingressos inclusos (Detalhes)</span>
            <Reorder.Group as="div" axis="y" values={value.inclui} onReorder={(novo) => onPatch({ inclui: novo })} className="flex flex-col gap-2">
                {value.inclui.map((inc, ii) => (
                    <IncluiCard key={inc.id} inc={inc} onChange={(p) => onPatch({ inclui: upd(value.inclui, ii, p) })} onRemove={() => onPatch({ inclui: value.inclui.filter((_, i) => i !== ii) })} />
                ))}
            </Reorder.Group>
            <Button size="sm" color="link-color" iconLeading={Plus} className="self-start" onClick={() => onPatch({ inclui: [...value.inclui, { id: uid(), titulo: "", sub: "", descricao: "", qtd: 1 }] })}>
                Adicionar ingresso
            </Button>
        </>
    );
}

function IncluiCard({ inc, onChange, onRemove }: { inc: ComboFixoInclui; onChange: (p: Partial<ComboFixoInclui>) => void; onRemove: () => void }) {
    const controls = useDragControls();
    return (
        <Reorder.Item as="div" value={inc} dragListener={false} dragControls={controls} className="flex flex-col gap-2 rounded-lg bg-secondary/40 p-3 ring-1 ring-border-secondary">
            <div className="flex items-center gap-2">
                <DragHandle controls={controls} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-secondary">{inc.titulo || "Ingresso incluso"}</span>
                <ButtonUtility size="sm" color="tertiary" icon={Trash01} tooltip="Remover" onClick={onRemove} />
            </div>
            <Input size="sm" label="Título" value={inc.titulo} onChange={(v) => onChange({ titulo: v })} />
            <div className="grid grid-cols-2 gap-2">
                <Input size="sm" label="Data/hora" placeholder="sáb, 08/08/26 • 14h00" value={inc.sub ?? ""} onChange={(v) => onChange({ sub: v })} />
                <Input size="sm" label="Qtd" type="number" value={String(inc.qtd)} onChange={(v) => onChange({ qtd: Number(v) || 1 })} />
            </div>
            <Input size="sm" label="Descrição" value={inc.descricao ?? ""} onChange={(v) => onChange({ descricao: v })} />
        </Reorder.Item>
    );
}

function ComboDinamicoFields({
    value,
    datas,
    ingressos,
    produtos,
    onPatch,
}: {
    value: ComboDinamico;
    datas: DataEvento[];
    ingressos: Ingresso[];
    produtos: Produto[];
    onPatch: (p: Partial<ComboDinamico>) => void;
}) {
    const toggleArr = (campo: "obrigatorios" | "precoVisivel" | "ocultos", id: string) => {
        const atual = value[campo] ?? [];
        onPatch({ [campo]: atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id] } as Partial<ComboDinamico>);
    };
    const qtdDe = (id: string) => value.quantidades?.[id] ?? { min: value.obrigatorios.includes(id) ? 1 : 0, max: value.maxItens };
    const patchQtd = (id: string, campo: "min" | "max", n: number) => {
        const cur = qtdDe(id);
        onPatch({ quantidades: { ...(value.quantidades ?? {}), [id]: { ...cur, [campo]: Math.max(0, n) } } });
    };
    const datasOpts = datas.map((d) => ({ id: d.id, nome: `${d.diaSemana} ${d.dia}/${d.mes}` }));

    // Itens herdados das datas selecionadas (união, sem repetir).
    const nomeById = new Map([...ingressos, ...produtos].map((x) => [x.id, x.nome] as const));
    const idsHerdados: string[] = [];
    for (const dId of value.datas) {
        const d = datas.find((x) => x.id === dId);
        if (d) for (const iid of [...d.itens, ...d.produtos]) if (!idsHerdados.includes(iid)) idsHerdados.push(iid);
    }

    return (
        <>
            <Input size="sm" label="Nome" value={value.nome} onChange={(v) => onPatch({ nome: v })} />
            <div className="grid grid-cols-2 gap-2">
                <Input size="sm" label="Desconto" placeholder="Ex.: 10% OFF" value={value.desconto ?? ""} onChange={(v) => onPatch({ desconto: v })} />
                <Input size="sm" label="Rótulo data" value={value.dataLabel} onChange={(v) => onPatch({ dataLabel: v })} />
            </div>
            <Input size="sm" label="Descrição" value={value.descricao ?? ""} onChange={(v) => onPatch({ descricao: v })} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Input size="sm" label="Rótulo sessões" value={value.sessoesLabel} onChange={(v) => onPatch({ sessoesLabel: v })} />
                <Input size="sm" label="Mín. itens" type="number" value={String(value.minItens)} onChange={(v) => onPatch({ minItens: Number(v) || 0 })} />
                <Input size="sm" label="Máx. itens" type="number" value={String(value.maxItens)} onChange={(v) => onPatch({ maxItens: Number(v) || 0 })} />
            </div>
            <Input size="sm" label="Tags (separadas por vírgula)" value={value.tags.join(", ")} onChange={(v) => onPatch({ tags: v.split(",").map((s) => s.trim()).filter(Boolean) })} />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[160px_1fr] sm:items-end">
                <Input
                    size="sm"
                    label="Preço do combo (R$)"
                    type="number"
                    value={value.preco != null ? String(value.preco) : ""}
                    onChange={(v) => onPatch({ preco: v === "" ? undefined : Number(v) || 0 })}
                />
                <label className="flex items-center gap-2 pb-2 text-sm text-tertiary">
                    <Toggle size="sm" isSelected={!!value.exibirPreco} onChange={(on) => onPatch({ exibirPreco: on })} aria-label="Exibir preço na seleção" />
                    Exibir preço no card de seleção
                </label>
            </div>

            <SeletorOrdenavel titulo="Datas (sessões) do combo" options={datasOpts} selected={value.datas} onChange={(ids) => onPatch({ datas: ids })} vazio="Cadastre datas primeiro." />

            <span className="text-sm font-medium text-tertiary">Itens herdados das datas</span>
            {idsHerdados.length === 0 ? (
                <span className="text-sm text-tertiary">Selecione datas com itens cadastrados.</span>
            ) : (
                <div className="flex flex-col gap-1.5">
                    {idsHerdados.map((id) => {
                        const oculto = (value.ocultos ?? []).includes(id);
                        return (
                            <div key={id} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-secondary/40 px-2.5 py-2 ring-1 ring-border-secondary">
                                <span className={cx("min-w-0 flex-1 truncate text-sm", oculto ? "text-tertiary line-through" : "text-primary")}>{nomeById.get(id) || id}</span>
                                <label className={cx("flex items-center gap-1.5 text-sm text-tertiary", oculto && "pointer-events-none opacity-40")}>
                                    <Checkbox size="sm" isSelected={value.obrigatorios.includes(id)} isDisabled={oculto} onChange={() => toggleArr("obrigatorios", id)} />
                                    Incluso
                                </label>
                                <label className={cx("flex items-center gap-1.5 text-sm text-tertiary", oculto && "pointer-events-none opacity-40")}>
                                    <Checkbox size="sm" isSelected={value.precoVisivel.includes(id)} isDisabled={oculto} onChange={() => toggleArr("precoVisivel", id)} />
                                    Mostrar preço
                                </label>
                                <label className="flex items-center gap-1.5 text-sm text-tertiary">
                                    <Checkbox size="sm" isSelected={oculto} onChange={() => toggleArr("ocultos", id)} />
                                    Ocultar
                                </label>
                                {!oculto && (
                                    <div className="flex items-center gap-2">
                                        <label className="flex items-center gap-1 text-sm text-tertiary">
                                            Mín
                                            <input
                                                type="number"
                                                min={0}
                                                value={qtdDe(id).min}
                                                onChange={(e) => patchQtd(id, "min", Number(e.target.value) || 0)}
                                                className="w-14 rounded-md bg-primary px-2 py-1 text-sm text-primary ring-1 ring-border-primary outline-none focus:ring-brand"
                                            />
                                        </label>
                                        <label className="flex items-center gap-1 text-sm text-tertiary">
                                            Máx
                                            <input
                                                type="number"
                                                min={0}
                                                value={qtdDe(id).max}
                                                onChange={(e) => patchQtd(id, "max", Number(e.target.value) || 0)}
                                                className="w-14 rounded-md bg-primary px-2 py-1 text-sm text-primary ring-1 ring-border-primary outline-none focus:ring-brand"
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}

function PerguntaFields({ value, itens, onPatch }: { value: PerguntaEvento; itens: { id: string; nome: string }[]; onPatch: (p: Partial<PerguntaEvento>) => void }) {
    const toggleVinculo = (id: string) => onPatch({ vinculos: value.vinculos.includes(id) ? value.vinculos.filter((x) => x !== id) : [...value.vinculos, id] });
    return (
        <>
            <Input size="sm" label="Título" value={value.titulo} onChange={(v) => onPatch({ titulo: v })} />
            <span className="text-sm font-medium text-tertiary">Tipo</span>
            <div className="flex flex-wrap items-center gap-2">
                {TIPOS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => onPatch({ tipo: t.id })}
                        className={cx("rounded-md px-2.5 py-1 text-sm font-medium ring-1 transition", value.tipo === t.id ? "bg-brand-primary text-primary ring-brand" : "text-tertiary ring-border-secondary hover:bg-primary_hover")}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
            {TIPOS_COM_OPCOES.includes(value.tipo) && (
                <Input
                    size="sm"
                    label="Opções (separadas por vírgula)"
                    value={(value.opcoes ?? []).join(", ")}
                    onChange={(v) => onPatch({ opcoes: v.split(",").map((s) => s.trim()).filter(Boolean) })}
                />
            )}
            <label className="flex items-center gap-2 text-sm text-tertiary">
                <Toggle size="sm" isSelected={value.obrigatoria} onChange={(on) => onPatch({ obrigatoria: on })} aria-label="Obrigatória" />
                Obrigatória
            </label>
            <span className="text-sm font-medium text-tertiary">Vincular a itens</span>
            <PickIds options={itens} selected={value.vinculos} onToggle={toggleVinculo} vazio="Cadastre ingressos/produtos para vincular." />
        </>
    );
}
