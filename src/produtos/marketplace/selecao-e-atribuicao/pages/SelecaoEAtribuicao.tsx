import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ChevronDown, Minus, Plus, Tag01, Ticket01, XClose } from "@untitledui/icons";
import { toast } from "sonner";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { MarketplaceLayout } from "../../components/MarketplaceLayout";
import { CupomModal } from "../components/CupomModal";
import { SelecaoItensModal, type ItemSelecao } from "../components/SelecaoItensModal";
import { TermosModal } from "../components/TermosModal";
import type { ComboDinamico, ComboDinamicoView, ComboFixo, DataEvento, Item } from "../data/combos";
import { DEFAULT_CONFIG, decodeConfig } from "../data/config";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface CartSubline {
    nome: string;
    sub?: string;
    qtd: number;
}
interface CartGroup {
    nome: string;
    lote?: string;
    sub?: string;
    precoUnit: number;
    qtd: number;
    sublines?: CartSubline[];
}

export function SelecaoEAtribuicao() {
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const config = useMemo(() => {
        const raw = params.get("cfg");
        if (raw) {
            const d = decodeConfig(raw);
            if (d) return d;
        }
        try {
            const saved = localStorage.getItem("marketplace:lastConfig");
            if (saved) {
                const d = decodeConfig(saved);
                if (d) return d;
            }
        } catch {
            /* ignore */
        }
        return DEFAULT_CONFIG;
    }, [params]);

    // Catálogo resolvido por id (ingressos + produtos → Item unificado).
    const itemById = useMemo(() => {
        const map = new Map<string, Item>();
        for (const i of config.ingressos) map.set(i.id, { id: i.id, nome: i.nome, descricao: i.descricao, preco: i.preco });
        for (const p of config.produtos) map.set(p.id, { id: p.id, nome: p.nome, preco: p.preco, imagem: p.imagem });
        return map;
    }, [config]);

    // Abas de combo fixo (agrupadas pelo rótulo configurável), respeitando "exibir".
    const fixoTabs = useMemo(() => {
        if (!config.exibir.combosFixos) return [];
        const map = new Map<string, ComboFixo[]>();
        for (const c of config.combosFixos) {
            if (!map.has(c.tab)) map.set(c.tab, []);
            map.get(c.tab)!.push(c);
        }
        return Array.from(map, ([label, combos]) => ({ id: `fixo:${label}`, label, combos }));
    }, [config]);

    const temDinamicos = config.exibir.combosDinamicos && config.combosDinamicos.length > 0;
    const datasVenda = config.exibir.datas ? config.datas : [];
    const abaInicial = fixoTabs[0]?.id ?? (temDinamicos ? "combo" : (datasVenda[0]?.id ?? ""));

    // Resolve um combo dinâmico: cada sessão herda os itens da sua data.
    const resolverCombo = (combo: ComboDinamico): ComboDinamicoView => {
        const sessoes = combo.datas
            .map((id) => config.datas.find((d) => d.id === id))
            .filter((d): d is DataEvento => !!d)
            .map((d) => ({
                id: d.id,
                data: `${d.dia} ${d.mes} ${d.ano}`,
                hora: d.hora ?? "",
                itens: [...d.itens, ...d.produtos]
                    .map((iid) => itemById.get(iid))
                    .filter((it): it is Item => !!it)
                    .map((it) => ({ ...it, obrigatorio: combo.obrigatorios.includes(it.id), mostrarPreco: combo.precoVisivel.includes(it.id) })),
            }));
        return { id: combo.id, nome: combo.nome, minItens: combo.minItens, maxItens: combo.maxItens, sessoes };
    };

    // Itens resolvidos de uma data (ingressos + produtos).
    const itensDaData = (d: DataEvento): Item[] => [...d.itens, ...d.produtos].map((id) => itemById.get(id)).filter((it): it is Item => !!it);

    const [aba, setAba] = useState<string>(abaInicial);
    const [cupomOpen, setCupomOpen] = useState(false);
    const [cupom, setCupom] = useState<{ codigo: string; ajuda: string } | null>(null);
    const [comboSelecao, setComboSelecao] = useState<ComboDinamicoView | null>(null);
    const [cart, setCart] = useState<Record<string, CartGroup>>({});
    const [detalhes, setDetalhes] = useState<Record<string, boolean>>({});
    const [mapaAberto, setMapaAberto] = useState(false);
    const [termosOpen, setTermosOpen] = useState(false);
    const [termosAceito, setTermosAceito] = useState(false);
    const [pendenteFinalizar, setPendenteFinalizar] = useState(false);

    // Termos de uso aparecem assim que o usuário chega na tela (se configurados).
    useEffect(() => {
        if (config.termos.trim()) setTermosOpen(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const aplicarCupom = (codigo: string) => {
        const achado = config.cupons.find((c) => c.codigo.toLowerCase() === codigo.toLowerCase());
        if (!achado) return false;
        setCupom({ codigo: achado.codigo, ajuda: achado.ajuda });
        return true;
    };

    /* ---- carrinho ---- */
    const setFixo = (combo: ComboFixo, delta: number) =>
        setCart((prev) => {
            const key = `fixo:${combo.id}`;
            const novo = Math.max(0, (prev[key]?.qtd ?? 0) + delta);
            const next = { ...prev };
            if (novo === 0) delete next[key];
            else
                next[key] = {
                    nome: combo.nome,
                    lote: combo.lote,
                    precoUnit: combo.preco,
                    qtd: novo,
                    sublines: combo.inclui.map((i) => ({ nome: i.titulo, sub: i.sub, qtd: i.qtd * novo })),
                };
            return next;
        });

    const setData = (data: DataEvento, item: Item, delta: number) =>
        setCart((prev) => {
            const key = `data:${data.id}:${item.id}`;
            const novo = Math.max(0, (prev[key]?.qtd ?? 0) + delta);
            const next = { ...prev };
            if (novo === 0) delete next[key];
            else next[key] = { nome: item.nome, sub: `${data.diaSemana.toLowerCase()}, ${data.dia}/${data.mes}${data.hora ? ` • ${data.hora}` : ""}`, precoUnit: item.preco ?? 0, qtd: novo };
            return next;
        });

    const confirmarSelecao = (combo: ComboDinamicoView, selecoes: ItemSelecao[]) => {
        setCart((prev) => {
            const next: Record<string, CartGroup> = {};
            for (const [k, v] of Object.entries(prev)) if (!k.startsWith(`din:${combo.id}:`)) next[k] = v;
            for (const s of selecoes) {
                const item = combo.sessoes.find((x) => x.id === s.sessaoId)?.itens.find((x) => x.id === s.itemId);
                next[`din:${combo.id}:${s.sessaoId}:${s.itemId}`] = { nome: `${combo.nome} · ${s.nome}`, sub: `${s.data} • ${s.hora}`, precoUnit: item?.preco ?? 0, qtd: s.quantidade };
            }
            return next;
        });
        setComboSelecao(null);
    };

    const remover = (key: string) => setCart((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key)));

    const grupos = Object.entries(cart);
    const totalItens = grupos.reduce((acc, [, g]) => acc + g.qtd, 0);
    const totalValor = grupos.reduce((acc, [, g]) => acc + g.qtd * g.precoUnit, 0);

    const fixoTabAtiva = fixoTabs.find((t) => t.id === aba);
    const dataAtiva = config.datas.find((d) => d.id === aba);

    const continuar = () => {
        if (totalItens === 0) return;
        if (config.termos.trim() && !termosAceito) {
            setPendenteFinalizar(true);
            setTermosOpen(true);
        } else finalizar();
    };
    const finalizar = () => {
        toast.success("Pedido confirmado", { description: `${totalItens} ${totalItens === 1 ? "item" : "itens"} • ${brl(totalValor)} + taxas` });
    };
    // Aceite dos termos: libera a navegação; se veio do "Continuar", finaliza em seguida.
    const aceitarTermos = () => {
        setTermosAceito(true);
        setTermosOpen(false);
        if (pendenteFinalizar) {
            setPendenteFinalizar(false);
            finalizar();
        }
    };

    /* ---- blocos reutilizados pelos dois layouts ---- */
    const abas = (
        <div className="flex flex-wrap gap-3">
            {fixoTabs.map((t) => (
                <TabButton key={t.id} active={aba === t.id} onClick={() => setAba(t.id)}>
                    <span className="px-2 text-sm font-semibold text-primary">{t.label}</span>
                </TabButton>
            ))}
            {temDinamicos && (
                <TabButton active={aba === "combo"} onClick={() => setAba("combo")}>
                    <span className="px-2 text-sm font-semibold text-primary">Combo dinâmico</span>
                </TabButton>
            )}
            {datasVenda.map((d) => (
                <TabButton key={d.id} active={aba === d.id} onClick={() => setAba(d.id)}>
                    <span className="text-xs text-tertiary">{d.diaSemana}</span>
                    <span className="text-md font-bold text-primary">
                        {d.dia} {d.mes}
                    </span>
                    <span className="text-xs text-tertiary">{d.ano}</span>
                </TabButton>
            ))}
        </div>
    );

    const conteudo = fixoTabAtiva ? (
        <div className="mt-6 flex flex-col gap-4">
            {fixoTabAtiva.combos.map((combo) => (
                <ComboFixoView
                    key={combo.id}
                    combo={combo}
                    qtd={cart[`fixo:${combo.id}`]?.qtd ?? 0}
                    aberto={!!detalhes[combo.id]}
                    onToggleDetalhes={() => setDetalhes((p) => ({ ...p, [combo.id]: !p[combo.id] }))}
                    onInc={() => setFixo(combo, 1)}
                    onDec={() => setFixo(combo, -1)}
                />
            ))}
        </div>
    ) : aba === "combo" ? (
        <div className="mt-6 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-primary">Monte seu combo</h2>
            {config.combosDinamicos.map((combo) => (
                <ComboDinamicoCard key={combo.id} combo={combo} cupomAplicado={!!cupom} onSelecionar={() => setComboSelecao(resolverCombo(combo))} />
            ))}
        </div>
    ) : dataAtiva ? (
        <ItensPorData data={dataAtiva} itens={itensDaData(dataAtiva)} cart={cart} onInc={(it) => setData(dataAtiva, it, 1)} onDec={(it) => setData(dataAtiva, it, -1)} />
    ) : (
        <div className="mt-6 flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-secondary px-6 text-center text-sm text-tertiary">
            Nada configurado para esta aba.
        </div>
    );

    const cupomBlock = cupom ? (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-primary px-4 py-3 ring-1 ring-border-secondary">
                <span className="flex items-center gap-2 text-sm text-secondary">
                    <Tag01 className="size-4 text-fg-quaternary" />
                    código/cupom: <span className="font-bold text-brand-secondary">{cupom.codigo}</span>
                </span>
                <button type="button" onClick={() => setCupom(null)} aria-label="Remover cupom" className="text-fg-quaternary transition hover:text-fg-secondary">
                    <XClose className="size-4" />
                </button>
            </div>
            <p className="px-1 text-xs text-tertiary">{cupom.ajuda}</p>
        </div>
    ) : (
        <button
            type="button"
            onClick={() => setCupomOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-medium text-secondary ring-1 ring-border-secondary transition hover:bg-primary_hover"
        >
            <Tag01 className="size-4 text-fg-quaternary" />
            Adicionar código ou cupom
        </button>
    );

    const totalBar = (
        <div className="flex items-center justify-between gap-3 border-t border-secondary px-4 py-4">
            <div className="flex flex-col gap-0.5">
                <span className="text-md font-bold text-primary tabular-nums">
                    {brl(totalValor)} <span className="text-sm font-normal text-tertiary">+ taxas</span>
                </span>
                <span className="flex items-center gap-2 text-xs text-tertiary tabular-nums">
                    {totalItens} {totalItens === 1 ? "item" : "itens"}
                    {totalItens > 0 && (
                        <button type="button" onClick={() => setCart({})} className="font-medium text-brand-secondary underline transition hover:text-brand-secondary_hover">
                            Remover {totalItens === 1 ? "item" : "itens"}
                        </button>
                    )}
                </span>
            </div>
            <Button size="lg" color="primary" isDisabled={totalItens === 0} onClick={continuar}>
                Continuar
            </Button>
        </div>
    );

    return (
        <MarketplaceLayout title={config.nome} badge={config.selo || undefined} logo={config.logo || undefined} onBack={() => navigate("/marketplace")}>
            {config.mapa ? (
                /* Layout com mapa: mapa grande à esquerda, seleção + barra de total à direita */
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => setMapaAberto(true)}
                        className="group relative block h-fit overflow-clip rounded-2xl ring-1 ring-border-secondary lg:sticky lg:top-6"
                    >
                        <img src={config.mapa} alt="Mapa do local" className="w-full object-cover" />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-sm font-semibold text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                            Ampliar mapa
                        </span>
                    </button>

                    <div className="flex flex-col gap-4">
                        {cupomBlock}
                        <div className="flex flex-col overflow-clip rounded-2xl bg-primary ring-1 ring-border-secondary">
                            <div className="flex flex-col p-4 md:p-5">
                                {abas}
                                {conteudo}
                            </div>
                            {totalBar}
                        </div>
                    </div>
                </div>
            ) : (
                /* Layout sem mapa: seleção à esquerda, capa + cupom + resumo à direita */
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
                    <div className="flex flex-col rounded-2xl bg-primary p-4 ring-1 ring-border-secondary md:p-5">
                        {abas}
                        {conteudo}
                    </div>

                    <div className="flex flex-col gap-4">
                        {config.capa && <img src={config.capa} alt="Capa do evento" className="w-full rounded-xl object-cover ring-1 ring-border-secondary" />}
                        {cupomBlock}

                        <div className="flex flex-col rounded-xl bg-primary ring-1 ring-border-secondary">
                            <header className="border-b border-secondary px-4 py-3.5">
                                <h3 className="text-sm font-semibold text-primary">Resumo da compra</h3>
                            </header>

                            {grupos.length > 0 ? (
                                <div className="flex flex-col gap-4 px-4 py-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="flex-1 border-t border-dashed border-secondary" aria-hidden="true" />
                                        <span className="text-xs font-semibold tracking-wide text-tertiary uppercase">Ingressos</span>
                                        <span className="flex-1 border-t border-dashed border-secondary" aria-hidden="true" />
                                        <Button size="sm" color="link-color" onClick={() => setCart({})}>
                                            Limpar tudo
                                        </Button>
                                    </div>
                                    <ul className="flex flex-col gap-4">
                                        {grupos.map(([key, g]) => (
                                            <CartGroupRow key={key} grupo={g} onRemover={() => remover(key)} />
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-1 px-6 py-10 text-center">
                                    <CartGlyph className="mb-2 size-9 text-fg-quaternary" />
                                    <p className="text-sm text-secondary">Seu carrinho está vazio,</p>
                                    <p className="text-sm text-tertiary">Escolha um item.</p>
                                </div>
                            )}

                            {totalBar}
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox do mapa */}
            {mapaAberto && config.mapa && (
                <div
                    role="dialog"
                    aria-label="Mapa do local"
                    onClick={() => setMapaAberto(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/80 p-4 backdrop-blur-[2px] duration-200 animate-in fade-in"
                >
                    <button type="button" aria-label="Fechar" className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60">
                        <XClose className="size-5" />
                    </button>
                    <img src={config.mapa} alt="Mapa do local" onClick={(e) => e.stopPropagation()} className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain" />
                </div>
            )}

            <SelecaoItensModal combo={comboSelecao} onClose={() => setComboSelecao(null)} onConfirmar={confirmarSelecao} />
            <CupomModal isOpen={cupomOpen} onClose={() => setCupomOpen(false)} onAplicar={aplicarCupom} />
            <TermosModal isOpen={termosOpen} termos={config.termos} onClose={() => setTermosOpen(false)} onConfirmar={aceitarTermos} />
        </MarketplaceLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Subcomponentes                                                    */
/* ------------------------------------------------------------------ */

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cx(
                "flex h-[72px] min-w-[96px] flex-col items-center justify-center rounded-xl px-3 transition duration-100 ease-linear",
                active ? "bg-brand-primary ring-2 ring-brand" : "ring-1 ring-border-secondary hover:bg-primary_hover",
            )}
        >
            {children}
        </button>
    );
}

function Stepper({ qtd, canDec = true, onInc, onDec }: { qtd: number; canDec?: boolean; onInc: () => void; onDec: () => void }) {
    return (
        <div className="flex shrink-0 items-center gap-2">
            <button
                type="button"
                onClick={onDec}
                disabled={qtd === 0 || !canDec}
                aria-label="Diminuir"
                className="flex size-9 items-center justify-center rounded-md bg-brand-solid text-white transition hover:bg-brand-solid_hover disabled:cursor-not-allowed disabled:bg-secondary disabled:text-fg-quaternary"
            >
                <Minus className="size-4" />
            </button>
            <span className="w-5 text-center text-sm font-semibold text-primary tabular-nums">{qtd}</span>
            <button
                type="button"
                onClick={onInc}
                aria-label="Aumentar"
                className="flex size-9 items-center justify-center rounded-md bg-brand-solid text-white transition hover:bg-brand-solid_hover"
            >
                <Plus className="size-4" />
            </button>
        </div>
    );
}

function ComboFixoView({
    combo,
    qtd,
    aberto,
    onToggleDetalhes,
    onInc,
    onDec,
}: {
    combo: ComboFixo;
    qtd: number;
    aberto: boolean;
    onToggleDetalhes: () => void;
    onInc: () => void;
    onDec: () => void;
}) {
    const datas = combo.inclui.map((i) => i.sub).filter(Boolean) as string[];
    return (
        <div className="flex flex-col overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
            <div className="flex items-start justify-between gap-4 px-4 py-4">
                <div className="flex min-w-0 flex-col gap-2">
                    <span className="text-md font-bold text-primary">{combo.nome}</span>
                    {datas.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {datas.map((d) => (
                                <span key={d} className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-tertiary">
                                    {d}
                                </span>
                            ))}
                        </div>
                    )}
                    {combo.lote && <span className="text-xs text-tertiary">{combo.lote}</span>}
                    {combo.descricao && <p className="text-sm text-tertiary">{combo.descricao}</p>}
                    <span className="text-md font-bold text-primary">{brl(combo.preco)}</span>
                </div>
                <Stepper qtd={qtd} onInc={onInc} onDec={onDec} />
            </div>

            {aberto &&
                combo.inclui.map((i) => (
                    <div key={i.id} className="flex items-start gap-3 border-t border-secondary px-4 py-3">
                        <Ticket01 className="mt-0.5 size-4 shrink-0 text-fg-brand-primary" />
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="text-sm font-semibold text-primary">{i.titulo}</span>
                            {i.sub && <span className="text-xs text-tertiary">{i.sub}</span>}
                            {i.descricao && <p className="text-sm text-tertiary">{i.descricao}</p>}
                        </div>
                        <span className="shrink-0 text-xs text-tertiary">
                            {i.qtd} {i.qtd === 1 ? "item" : "itens"}
                        </span>
                    </div>
                ))}

            {combo.inclui.length > 0 && (
                <button type="button" onClick={onToggleDetalhes} className="flex items-center justify-between gap-2 border-t border-secondary px-4 py-3 text-sm font-medium text-secondary transition hover:bg-primary_hover">
                    Detalhes
                    <ChevronDown className={cx("size-4 text-fg-quaternary transition-transform", aberto && "rotate-180")} />
                </button>
            )}
        </div>
    );
}

function ComboDinamicoCard({ combo, cupomAplicado, onSelecionar }: { combo: ComboDinamico; cupomAplicado: boolean; onSelecionar: () => void }) {
    return (
        <div className="flex items-start justify-between gap-4 rounded-xl bg-primary px-4 py-4 ring-1 ring-border-secondary">
            <div className="flex min-w-0 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-primary">{combo.nome}</span>
                    {cupomAplicado && combo.desconto && (
                        <Badge size="sm" color="success" type="pill-color">
                            {combo.desconto}
                        </Badge>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {combo.dataLabel && <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-tertiary">{combo.dataLabel}</span>}
                    {combo.sessoesLabel && <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-tertiary">{combo.sessoesLabel}</span>}
                </div>
                {combo.tags.map((t) => (
                    <span key={t} className="text-sm text-tertiary">
                        {t}
                    </span>
                ))}
                {combo.descricao && <p className="text-sm text-tertiary">{combo.descricao}</p>}
            </div>
            <Button size="md" color="secondary" className="shrink-0" onClick={onSelecionar}>
                Selecionar
            </Button>
        </div>
    );
}

function ItensPorData({ data, itens, cart, onInc, onDec }: { data: DataEvento; itens: Item[]; cart: Record<string, CartGroup>; onInc: (it: Item) => void; onDec: (it: Item) => void }) {
    return (
        <div className="mt-6 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-primary">
                {data.diaSemana}, {data.dia} {data.mes} {data.hora && `• ${data.hora}`}
            </h2>
            {itens.length === 0 && <p className="text-sm text-tertiary">Nenhum item para esta data.</p>}
            {itens.map((it) => {
                const qtd = cart[`data:${data.id}:${it.id}`]?.qtd ?? 0;
                return (
                    <div key={it.id} className="flex items-center gap-3 rounded-xl px-4 py-3.5 ring-1 ring-border-secondary">
                        {it.imagem && <img src={it.imagem} alt="" aria-hidden="true" className="size-11 shrink-0 rounded-md object-cover ring-1 ring-border-secondary" />}
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="text-sm font-semibold text-primary">{it.nome}</span>
                            {it.descricao && <span className="text-xs text-tertiary">{it.descricao}</span>}
                            {it.preco != null && <span className="text-sm font-bold text-primary">{brl(it.preco)}</span>}
                        </div>
                        <Stepper qtd={qtd} onInc={() => onInc(it)} onDec={() => onDec(it)} />
                    </div>
                );
            })}
        </div>
    );
}

function CartGroupRow({ grupo, onRemover }: { grupo: CartGroup; onRemover: () => void }) {
    return (
        <li className="flex flex-col gap-2">
            <div className="flex items-start gap-2.5">
                <span className="pt-0.5 text-sm font-semibold text-primary tabular-nums">{grupo.qtd}</span>
                <Ticket01 className="mt-0.5 size-4 shrink-0 text-fg-quaternary" />
                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                        <span className="min-w-0 truncate text-sm font-bold text-primary">{grupo.nome}</span>
                        <span className="shrink-0 text-sm font-bold text-primary tabular-nums">{brl(grupo.precoUnit * grupo.qtd)}</span>
                    </div>
                    {grupo.lote && <span className="text-xs text-tertiary">{grupo.lote}</span>}
                    {grupo.sub && <span className="text-xs text-tertiary">{grupo.sub}</span>}
                    <button type="button" onClick={onRemover} className="mt-0.5 self-start text-xs font-medium text-brand-secondary underline transition hover:text-brand-secondary_hover">
                        Remover
                    </button>
                </div>
            </div>
            {grupo.sublines && grupo.sublines.length > 0 && (
                <ul className="flex flex-col gap-2 pl-7">
                    {grupo.sublines.map((sl, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                            <span className="pt-0.5 text-xs text-tertiary tabular-nums">{sl.qtd}</span>
                            <div className="flex min-w-0 flex-col">
                                <span className="truncate text-xs font-medium text-secondary">{sl.nome}</span>
                                {sl.sub && <span className="truncate text-xs text-tertiary">{sl.sub}</span>}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
}

/** Ícone simples de "resumo" para o empty state do carrinho. */
function CartGlyph({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" />
            <path d="M7 9h4M7 13h2M7 17h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M15 9.5v6M14 12.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    );
}
