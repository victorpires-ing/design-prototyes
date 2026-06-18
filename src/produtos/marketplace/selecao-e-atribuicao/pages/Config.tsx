import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Copy01, Edit01, LinkExternal01, Plus, Ticket01, Trash01 } from "@untitledui/icons";
import { Reorder, useDragControls } from "motion/react";
import type { DragControls } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Toggle } from "@/components/base/toggle/toggle";
import { cx } from "@/utils/cx";
import { MarketplaceLayout } from "../../components/MarketplaceLayout";
import { Slideout } from "../components/Slideout";
import type { ComboDinamico, ComboFixo, ComboFixoInclui, DataEvento, Ingresso, PerguntaEvento, Produto, TipoPergunta } from "../data/combos";
import { DEFAULT_CONFIG, buildShareUrl, decodeConfig, encodeConfig, type EventConfig } from "../data/config";

const STORAGE_KEY = "marketplace:lastConfig";
const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : `id-${Math.round(performance.now())}`);
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const TIPOS: { id: TipoPergunta; label: string }[] = [
    { id: "texto-curto", label: "Texto curto" },
    { id: "texto-longo", label: "Texto longo" },
    { id: "escolha-unica", label: "Escolha única" },
    { id: "multipla-escolha", label: "Múltipla escolha" },
];

type Tipo = "ingresso" | "produto" | "data" | "comboFixo" | "comboDinamico" | "pergunta";
interface Edicao {
    tipo: Tipo;
    index: number;
}

export function Config() {
    const navigate = useNavigate();
    const [params] = useSearchParams();

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
    const itensVinculaveis = useMemo(() => [...cfg.ingressos, ...cfg.produtos].map((x) => ({ id: x.id, nome: x.nome })), [cfg.ingressos, cfg.produtos]);

    const url = buildShareUrl(cfg);
    const copiar = async () => {
        try {
            await navigator.clipboard.writeText(url);
            toast.success("Link copiado");
        } catch {
            toast.error("Não foi possível copiar");
        }
    };
    const abrirSelecao = () => navigate(`/marketplace/event?cfg=${encodeURIComponent(encodeConfig(cfg))}`);
    const restaurar = () => {
        setCfg(structuredClone(DEFAULT_CONFIG));
        toast.success("Configuração restaurada para o exemplo");
    };

    /* ---- adicionar abre o slideout no novo elemento ---- */
    const addIngresso = () => {
        setEdicao({ tipo: "ingresso", index: cfg.ingressos.length });
        patch({ ingressos: [...cfg.ingressos, { id: uid(), nome: "", descricao: "", preco: 0 }] });
    };
    const addProduto = () => {
        setEdicao({ tipo: "produto", index: cfg.produtos.length });
        patch({ produtos: [...cfg.produtos, { id: uid(), nome: "", imagem: "", preco: 0 }] });
    };
    const addData = () => {
        setEdicao({ tipo: "data", index: cfg.datas.length });
        patch({ datas: [...cfg.datas, { id: uid(), diaSemana: "Sexta", dia: "01", mes: "JAN", ano: "2026", hora: "20h00", itens: [], produtos: [] }] });
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
                { id: uid(), nome: "Novo combo dinâmico", desconto: "", descricao: "", dataLabel: "", sessoesLabel: "", tags: [], minItens: 1, maxItens: 4, datas: [], obrigatorios: [], precoVisivel: [] },
            ],
        });
    };
    const addPergunta = () => {
        setEdicao({ tipo: "pergunta", index: cfg.perguntas.length });
        patch({ perguntas: [...cfg.perguntas, { id: uid(), titulo: "Nova pergunta", tipo: "texto-curto", obrigatoria: true, vinculos: [] }] });
    };

    const remover = (tipo: Tipo, i: number) => {
        if (tipo === "ingresso") patch({ ingressos: cfg.ingressos.filter((_, j) => j !== i) });
        if (tipo === "produto") patch({ produtos: cfg.produtos.filter((_, j) => j !== i) });
        if (tipo === "data") patch({ datas: cfg.datas.filter((_, j) => j !== i) });
        if (tipo === "comboFixo") patch({ combosFixos: cfg.combosFixos.filter((_, j) => j !== i) });
        if (tipo === "comboDinamico") patch({ combosDinamicos: cfg.combosDinamicos.filter((_, j) => j !== i) });
        if (tipo === "pergunta") patch({ perguntas: cfg.perguntas.filter((_, j) => j !== i) });
    };

    /* ---- conteúdo do slideout conforme o alvo em edição ---- */
    const slide = (() => {
        if (!edicao) return null;
        const { tipo, index } = edicao;
        if (tipo === "ingresso" && cfg.ingressos[index]) {
            const it = cfg.ingressos[index];
            return { title: "Editar ingresso", body: <IngressoFields value={it} onPatch={(p) => patch({ ingressos: upd(cfg.ingressos, index, p) })} /> };
        }
        if (tipo === "produto" && cfg.produtos[index]) {
            const it = cfg.produtos[index];
            return { title: "Editar produto", body: <ProdutoFields value={it} onPatch={(p) => patch({ produtos: upd(cfg.produtos, index, p) })} /> };
        }
        if (tipo === "data" && cfg.datas[index]) {
            const it = cfg.datas[index];
            return { title: "Editar data", body: <DataFields value={it} ingressos={cfg.ingressos} produtos={cfg.produtos} onPatch={(p) => patch({ datas: upd(cfg.datas, index, p) })} /> };
        }
        if (tipo === "comboFixo" && cfg.combosFixos[index]) {
            const it = cfg.combosFixos[index];
            return { title: "Editar combo fixo", body: <ComboFixoFields value={it} onPatch={(p) => patch({ combosFixos: upd(cfg.combosFixos, index, p) })} /> };
        }
        if (tipo === "comboDinamico" && cfg.combosDinamicos[index]) {
            const it = cfg.combosDinamicos[index];
            return { title: "Editar combo dinâmico", body: <ComboDinamicoFields value={it} datas={cfg.datas} ingressos={cfg.ingressos} produtos={cfg.produtos} onPatch={(p) => patch({ combosDinamicos: upd(cfg.combosDinamicos, index, p) })} /> };
        }
        if (tipo === "pergunta" && cfg.perguntas[index]) {
            const it = cfg.perguntas[index];
            return { title: "Editar pergunta", body: <PerguntaFields value={it} itens={itensVinculaveis} onPatch={(p) => patch({ perguntas: upd(cfg.perguntas, index, p) })} /> };
        }
        return null;
    })();

    return (
        <MarketplaceLayout title="Configurar evento" logo={cfg.logo || undefined} onBack={() => navigate("/")}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
                <div className="flex flex-col gap-5">
                    {/* Evento */}
                    <Secao titulo="Evento">
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
                    </Secao>

                    {/* Exibição na venda */}
                    <Secao titulo="Exibição na venda">
                        <p className="text-xs text-tertiary">Escolha o que aparece para o comprador na tela do evento.</p>
                        <div className="flex flex-col gap-2.5">
                            <Checkbox size="sm" label="Datas (venda avulsa por data)" isSelected={cfg.exibir.datas} onChange={(on) => patch({ exibir: { ...cfg.exibir, datas: on } })} />
                            <Checkbox size="sm" label="Combos fixos" isSelected={cfg.exibir.combosFixos} onChange={(on) => patch({ exibir: { ...cfg.exibir, combosFixos: on } })} />
                            <Checkbox size="sm" label="Combos dinâmicos" isSelected={cfg.exibir.combosDinamicos} onChange={(on) => patch({ exibir: { ...cfg.exibir, combosDinamicos: on } })} />
                        </div>
                    </Secao>

                    {/* Ingressos */}
                    <Secao titulo="Ingressos" resumo={`${cfg.ingressos.length}`} onAdd={addIngresso} addLabel="Adicionar ingresso">
                        {cfg.ingressos.map((it, i) => (
                            <LinhaResumo key={it.id} onEditar={() => setEdicao({ tipo: "ingresso", index: i })} onRemover={() => remover("ingresso", i)}>
                                <span className="truncate text-sm font-medium text-primary">{it.nome || "Ingresso"}</span>
                                {it.preco != null && <span className="text-xs text-tertiary">{brl(it.preco)}</span>}
                            </LinhaResumo>
                        ))}
                    </Secao>

                    {/* Produtos */}
                    <Secao titulo="Produtos" resumo={`${cfg.produtos.length}`} onAdd={addProduto} addLabel="Adicionar produto">
                        {cfg.produtos.map((p, i) => (
                            <LinhaResumo key={p.id} onEditar={() => setEdicao({ tipo: "produto", index: i })} onRemover={() => remover("produto", i)}>
                                {p.imagem && <img src={p.imagem} alt="" className="size-6 shrink-0 rounded object-cover ring-1 ring-border-secondary" />}
                                <span className="truncate text-sm font-medium text-primary">{p.nome || "Produto"}</span>
                                {p.preco != null && <span className="text-xs text-tertiary">{brl(p.preco)}</span>}
                            </LinhaResumo>
                        ))}
                    </Secao>

                    {/* Datas */}
                    <Secao titulo="Datas" resumo={`${cfg.datas.length}`} onAdd={addData} addLabel="Adicionar data">
                        {cfg.datas.map((d, i) => (
                            <LinhaResumo key={d.id} onEditar={() => setEdicao({ tipo: "data", index: i })} onRemover={() => remover("data", i)}>
                                <span className="truncate text-sm font-medium text-primary">
                                    {d.diaSemana}, {d.dia} {d.mes} {d.ano}
                                    {d.hora ? ` • ${d.hora}` : ""}
                                </span>
                                <span className="text-xs text-tertiary">{d.itens.length + d.produtos.length} itens</span>
                            </LinhaResumo>
                        ))}
                    </Secao>

                    {/* Combos fixos */}
                    <Secao titulo="Combos fixos" resumo={`${cfg.combosFixos.length}`} onAdd={addComboFixo} addLabel="Adicionar combo fixo">
                        {cfg.combosFixos.map((c, i) => (
                            <LinhaResumo key={c.id} onEditar={() => setEdicao({ tipo: "comboFixo", index: i })} onRemover={() => remover("comboFixo", i)}>
                                {c.tab && <span className="rounded bg-secondary px-1.5 py-0.5 text-xs font-medium text-tertiary">{c.tab}</span>}
                                <span className="truncate text-sm font-medium text-primary">{c.nome || "Combo fixo"}</span>
                                <span className="text-xs text-tertiary">{brl(c.preco)}</span>
                            </LinhaResumo>
                        ))}
                    </Secao>

                    {/* Combos dinâmicos */}
                    <Secao titulo="Combos dinâmicos" resumo={`${cfg.combosDinamicos.length}`} onAdd={addComboDinamico} addLabel="Adicionar combo dinâmico">
                        {cfg.combosDinamicos.map((c, i) => (
                            <LinhaResumo key={c.id} onEditar={() => setEdicao({ tipo: "comboDinamico", index: i })} onRemover={() => remover("comboDinamico", i)}>
                                <span className="truncate text-sm font-medium text-primary">{c.nome || "Combo dinâmico"}</span>
                                <span className="text-xs text-tertiary">
                                    {c.datas.length} {c.datas.length === 1 ? "data" : "datas"} · {c.minItens}–{c.maxItens} itens
                                </span>
                            </LinhaResumo>
                        ))}
                    </Secao>

                    {/* Perguntas */}
                    <Secao titulo="Perguntas" resumo={`${cfg.perguntas.length}`} onAdd={addPergunta} addLabel="Adicionar pergunta">
                        {cfg.perguntas.map((p, i) => (
                            <LinhaResumo key={p.id} onEditar={() => setEdicao({ tipo: "pergunta", index: i })} onRemover={() => remover("pergunta", i)}>
                                <span className="truncate text-sm font-medium text-primary">{p.titulo || "Pergunta"}</span>
                                <span className="text-xs text-tertiary">
                                    {TIPOS.find((t) => t.id === p.tipo)?.label}
                                    {p.obrigatoria ? " · obrigatória" : ""} · {p.vinculos.length} {p.vinculos.length === 1 ? "vínculo" : "vínculos"}
                                </span>
                            </LinhaResumo>
                        ))}
                    </Secao>

                    {/* Cupons (inline — simples) */}
                    <Secao titulo="Cupons" resumo={`${cfg.cupons.length}`} onAdd={() => patch({ cupons: [...cfg.cupons, { codigo: "", ajuda: "" }] })} addLabel="Adicionar cupom">
                        {cfg.cupons.map((c, i) => (
                            <div key={i} className="flex items-end gap-3">
                                <Input size="sm" label="Código" value={c.codigo} onChange={(v) => patch({ cupons: upd(cfg.cupons, i, { codigo: v }) })} className="w-40" />
                                <Input size="sm" label="Texto de ajuda" value={c.ajuda} onChange={(v) => patch({ cupons: upd(cfg.cupons, i, { ajuda: v }) })} className="flex-1" />
                                <ButtonUtility size="sm" color="tertiary" icon={Trash01} tooltip="Remover" className="mb-0.5" onClick={() => patch({ cupons: cfg.cupons.filter((_, j) => j !== i) })} />
                            </div>
                        ))}
                    </Secao>

                    {/* Termos de uso */}
                    <Secao titulo="Termos de uso">
                        <p className="text-xs text-tertiary">Texto exibido no modal de aceite, antes de finalizar a compra. Deixe vazio para pular essa etapa.</p>
                        <textarea
                            value={cfg.termos}
                            onChange={(e) => patch({ termos: e.target.value })}
                            rows={6}
                            placeholder="Cole aqui os termos de uso do evento…"
                            className="w-full resize-y rounded-lg bg-primary px-3 py-2 text-sm whitespace-pre-line text-secondary ring-1 ring-border-secondary outline-hidden focus:ring-2 focus:ring-brand"
                        />
                    </Secao>
                </div>

                {/* Painel de compartilhamento */}
                <div className="flex flex-col gap-3">
                    <div className="sticky top-6 flex flex-col gap-3 rounded-xl bg-primary p-4 ring-1 ring-border-secondary">
                        <h3 className="text-sm font-semibold text-primary">Link compartilhável</h3>
                        <p className="text-xs text-tertiary">Suas alterações são salvas automaticamente neste navegador. O link abre a seleção com esta configuração.</p>
                        <textarea readOnly value={url} rows={4} className="w-full resize-none rounded-lg bg-secondary px-3 py-2 font-mono text-xs break-all text-secondary ring-1 ring-border-secondary outline-hidden" />
                        <Button size="sm" color="secondary" iconLeading={Copy01} onClick={copiar}>
                            Copiar link
                        </Button>
                        <Button size="sm" color="primary" iconLeading={LinkExternal01} onClick={abrirSelecao}>
                            Abrir seleção
                        </Button>
                        <Button size="sm" color="link-gray" onClick={restaurar}>
                            Restaurar exemplo
                        </Button>
                    </div>
                </div>
            </div>

            {/* Slideout de edição */}
            <Slideout
                isOpen={!!slide}
                title={slide?.title ?? ""}
                onClose={() => setEdicao(null)}
                footer={
                    edicao && (
                        <>
                            <Button size="md" color="tertiary-destructive" iconLeading={Trash01} onClick={() => { remover(edicao.tipo, edicao.index); setEdicao(null); }}>
                                Remover
                            </Button>
                            <Button size="md" color="primary" onClick={() => setEdicao(null)}>
                                Concluir
                            </Button>
                        </>
                    )
                }
            >
                {slide?.body}
            </Slideout>
        </MarketplaceLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Estruturais                                                       */
/* ------------------------------------------------------------------ */

function upd<T>(arr: T[], i: number, p: Partial<T>): T[] {
    return arr.map((x, j) => (j === i ? { ...x, ...p } : x));
}

function Secao({ titulo, resumo, children, onAdd, addLabel, defaultOpen = true }: { titulo: string; resumo?: string; children: React.ReactNode; onAdd?: () => void; addLabel?: string; defaultOpen?: boolean }) {
    const [aberto, setAberto] = useState(defaultOpen);
    return (
        <section className="flex flex-col rounded-xl bg-primary ring-1 ring-border-secondary">
            <div className="flex items-center gap-3 px-4 py-3 md:px-5">
                <button type="button" onClick={() => setAberto((a) => !a)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <ChevronToggle aberto={aberto} />
                    <h2 className="text-md font-semibold text-primary">{titulo}</h2>
                    {resumo && <span className="truncate text-xs text-tertiary">{resumo}</span>}
                </button>
                {onAdd && (
                    <Button size="sm" color="link-color" iconLeading={Plus} onClick={onAdd}>
                        {addLabel ?? "Adicionar"}
                    </Button>
                )}
            </div>
            {aberto && <div className="flex flex-col gap-3 border-t border-secondary p-4 md:p-5">{children}</div>}
        </section>
    );
}

function ChevronToggle({ aberto }: { aberto: boolean }) {
    return (
        <svg viewBox="0 0 12 8" className={cx("size-3 shrink-0 text-fg-quaternary transition-transform", aberto && "rotate-180")} fill="none" aria-hidden="true">
            <path d="M1 1.5 6 6.5l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
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
    if (options.length === 0) return <span className="text-xs text-tertiary">{vazio ?? "Nada cadastrado."}</span>;
    return (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {options.map((o) => (
                <label key={o.id} className="flex items-center gap-1.5 text-xs text-secondary">
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

function IngressoFields({ value, onPatch }: { value: Ingresso; onPatch: (p: Partial<Ingresso>) => void }) {
    return (
        <>
            <Input size="sm" label="Nome" value={value.nome} onChange={(v) => onPatch({ nome: v })} />
            <Input size="sm" label="Descrição" value={value.descricao ?? ""} onChange={(v) => onPatch({ descricao: v })} />
            <Input size="sm" label="Preço (R$)" type="number" value={value.preco != null ? String(value.preco) : ""} onChange={(v) => onPatch({ preco: v === "" ? undefined : Number(v) || 0 })} />
        </>
    );
}

function ProdutoFields({ value, onPatch }: { value: Produto; onPatch: (p: Partial<Produto>) => void }) {
    return (
        <>
            <Input size="sm" label="Nome" value={value.nome} onChange={(v) => onPatch({ nome: v })} />
            <Input size="sm" label="Link da imagem do produto" placeholder="https://..." value={value.imagem ?? ""} onChange={(v) => onPatch({ imagem: v || undefined })} />
            {value.imagem && <img src={value.imagem} alt="" className="max-h-40 w-auto self-start rounded-lg object-cover ring-1 ring-border-secondary" />}
            <Input size="sm" label="Preço (R$)" type="number" value={value.preco != null ? String(value.preco) : ""} onChange={(v) => onPatch({ preco: v === "" ? undefined : Number(v) || 0 })} />
        </>
    );
}

const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
const SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function DataFields({ value, ingressos, produtos, onPatch }: { value: DataEvento; ingressos: Ingresso[]; produtos: Produto[]; onPatch: (p: Partial<DataEvento>) => void }) {
    const setDateTime = (iso: string) => {
        if (!iso) {
            onPatch({ iso: "" });
            return;
        }
        const [dp, tp] = iso.split("T");
        const [y, mo, d] = dp.split("-").map(Number);
        const [hh, mm] = (tp || "00:00").split(":").map(Number);
        const dt = new Date(y, (mo || 1) - 1, d || 1, hh || 0, mm || 0);
        onPatch({
            iso,
            dia: String(d).padStart(2, "0"),
            mes: MESES[(mo || 1) - 1],
            ano: String(y),
            hora: `${String(hh).padStart(2, "0")}h${String(mm).padStart(2, "0")}`,
            diaSemana: SEMANA[dt.getDay()],
        });
    };
    return (
        <>
            <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-secondary">Data e hora</span>
                <input
                    type="datetime-local"
                    value={value.iso ?? ""}
                    onChange={(e) => setDateTime(e.target.value)}
                    className="rounded-lg bg-primary px-3 py-2 text-sm text-primary ring-1 ring-border-primary outline-hidden focus:ring-2 focus:ring-brand"
                />
            </label>
            {value.diaSemana && value.dia && (
                <span className="text-xs text-tertiary">
                    {value.diaSemana}, {value.dia} {value.mes} {value.ano}
                    {value.hora ? ` • ${value.hora}` : ""}
                </span>
            )}
            <SeletorOrdenavel titulo="Ingressos à venda nesta data" options={ingressos} selected={value.itens} onChange={(ids) => onPatch({ itens: ids })} vazio="Cadastre ingressos primeiro." />
            <SeletorOrdenavel titulo="Produtos à venda nesta data" options={produtos} selected={value.produtos} onChange={(ids) => onPatch({ produtos: ids })} vazio="Cadastre produtos primeiro." />
        </>
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
            <span className="text-xs font-medium text-tertiary">{titulo}</span>
            {options.length === 0 ? (
                <span className="text-xs text-tertiary">{vazio ?? "Nada cadastrado."}</span>
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
                            <span className="text-xs text-tertiary">Não selecionados</span>
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                                {naoSel.map((o) => (
                                    <label key={o.id} className="flex items-center gap-1.5 text-xs text-secondary">
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
            <span className="w-4 text-center text-xs text-tertiary tabular-nums">{index + 1}</span>
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

            <span className="text-xs font-medium text-tertiary">Ingressos inclusos (Detalhes)</span>
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
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-secondary">{inc.titulo || "Ingresso incluso"}</span>
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
    const toggleArr = (campo: "obrigatorios" | "precoVisivel", id: string) =>
        onPatch({ [campo]: value[campo].includes(id) ? value[campo].filter((x) => x !== id) : [...value[campo], id] } as Partial<ComboDinamico>);
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

            <SeletorOrdenavel titulo="Datas (sessões) do combo" options={datasOpts} selected={value.datas} onChange={(ids) => onPatch({ datas: ids })} vazio="Cadastre datas primeiro." />

            <span className="text-xs font-medium text-tertiary">Itens herdados das datas</span>
            {idsHerdados.length === 0 ? (
                <span className="text-xs text-tertiary">Selecione datas com itens cadastrados.</span>
            ) : (
                <div className="flex flex-col gap-1.5">
                    {idsHerdados.map((id) => (
                        <div key={id} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-secondary/40 px-2.5 py-2 ring-1 ring-border-secondary">
                            <span className="min-w-0 flex-1 truncate text-sm text-primary">{nomeById.get(id) || id}</span>
                            <label className="flex items-center gap-1.5 text-xs text-tertiary">
                                <Checkbox size="sm" isSelected={value.obrigatorios.includes(id)} onChange={() => toggleArr("obrigatorios", id)} />
                                Incluso
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-tertiary">
                                <Checkbox size="sm" isSelected={value.precoVisivel.includes(id)} onChange={() => toggleArr("precoVisivel", id)} />
                                Mostrar preço
                            </label>
                        </div>
                    ))}
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
            <span className="text-xs font-medium text-tertiary">Tipo</span>
            <div className="flex flex-wrap items-center gap-2">
                {TIPOS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => onPatch({ tipo: t.id })}
                        className={cx("rounded-md px-2.5 py-1 text-xs font-medium ring-1 transition", value.tipo === t.id ? "bg-brand-primary text-primary ring-brand" : "text-tertiary ring-border-secondary hover:bg-primary_hover")}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
            <label className="flex items-center gap-2 text-xs text-tertiary">
                <Toggle size="sm" isSelected={value.obrigatoria} onChange={(on) => onPatch({ obrigatoria: on })} aria-label="Obrigatória" />
                Obrigatória
            </label>
            <span className="text-xs font-medium text-tertiary">Vincular a itens</span>
            <PickIds options={itens} selected={value.vinculos} onToggle={toggleVinculo} vazio="Cadastre ingressos/produtos para vincular." />
        </>
    );
}
