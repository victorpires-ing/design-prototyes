import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router";
import { AlertTriangle, CheckCircle, ChevronDown, ChevronLeft, Copy01, Minus, Package, Plus, QrCode01, Send01, Tag01, Ticket01, Trash01, XClose } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { toast } from "sonner";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Avatar } from "@/components/base/avatar/avatar";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { MarketplaceLayout, accentVars } from "../../components/MarketplaceLayout";
import { LoginModal } from "../../components/LoginModal";
import { CupomModal } from "../components/CupomModal";
import { SelecaoItensModal, type ItemSelecao } from "../components/SelecaoItensModal";
import { TermosModal } from "../components/TermosModal";
import type { ComboDinamico, ComboDinamicoView, ComboFixo, DataEvento, Item, PerguntaEvento, Produto } from "../data/combos";
import { DEFAULT_CONFIG, decodeConfig, resolverLinkCurto, type EventConfig } from "../data/config";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

/** Máscara de data DD/MM/AAAA a partir de dígitos (melhor no mobile que o seletor nativo). */
const maskData = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 8);
    if (d.length <= 2) return d;
    if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
    return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};

const MESES_EXT = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const dataPorExtenso = (d: DataEvento) => (d.iso ? `${+d.iso.slice(8, 10)} de ${MESES_EXT[+d.iso.slice(5, 7) - 1]} de ${d.iso.slice(0, 4)}` : `${d.dia} ${d.mes} ${d.ano}`);

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

    // Config inicial síncrona: ?cfg= (link longo) → localStorage → DEFAULT.
    const configInicial = useMemo(() => {
        const raw = params.get("cfg");
        if (raw) {
            const d = decodeConfig(raw);
            if (d) return d;
        }
        try {
            const saved = localStorage.getItem("marketplace:lastConfig:v2");
            if (saved) {
                const d = decodeConfig(saved);
                if (d) return d;
            }
        } catch {
            /* ignore */
        }
        return DEFAULT_CONFIG;
    }, [params]);

    const [config, setConfig] = useState<EventConfig>(configInicial);
    // Link curto (?e=<id>): resolve o cfg no Redis de forma assíncrona.
    const [carregandoLink, setCarregandoLink] = useState(() => !!params.get("e"));
    useEffect(() => {
        const e = params.get("e");
        if (!e) {
            setConfig(configInicial);
            return;
        }
        let vivo = true;
        setCarregandoLink(true);
        resolverLinkCurto(e).then((c) => {
            if (!vivo) return;
            if (c) setConfig(c);
            setCarregandoLink(false);
        });
        return () => {
            vivo = false;
        };
    }, [params, configInicial]);

    // Catálogo resolvido por id (ingressos + produtos → Item unificado).
    const itemById = useMemo(() => {
        const map = new Map<string, Item>();
        for (const i of config.ingressos) map.set(i.id, { id: i.id, nome: i.nome, grupo: i.grupo, lote: i.lote, descricao: i.descricao, preco: i.preco, imagem: i.imagem });
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
                data: d.iso
                    ? `${d.diaSemana}, ${d.iso.slice(8, 10)}/${d.iso.slice(5, 7)}/${d.iso.slice(0, 4)}`
                    : `${d.diaSemana}, ${d.dia} ${d.mes} ${d.ano}`,
                hora: d.hora ?? "",
                itens: [...d.itens, ...d.produtos]
                    .filter((iid) => !(combo.ocultos ?? []).includes(iid))
                    .map((iid) => itemById.get(iid))
                    .filter((it): it is Item => !!it)
                    .map((it) => {
                        const obrigatorio = combo.obrigatorios.includes(it.id);
                        const q = combo.quantidades?.[it.id];
                        return {
                            ...it,
                            obrigatorio,
                            qtdMin: q?.min ?? (obrigatorio ? 1 : 0),
                            qtdMax: q?.max ?? combo.maxItens,
                            mostrarPreco: combo.precoVisivel.includes(it.id),
                        };
                    }),
            }));
        return { id: combo.id, nome: combo.nome, minItens: combo.minItens, maxItens: combo.maxItens, preco: combo.preco, sessoes };
    };

    // Itens resolvidos de uma data (ingressos + produtos).
    const itensDaData = (d: DataEvento): Item[] => [...d.itens, ...d.produtos].map((id) => itemById.get(id)).filter((it): it is Item => !!it);

    const [aba, setAba] = useState<string>(abaInicial);
    const [cupomOpen, setCupomOpen] = useState(false);
    const [cupom, setCupom] = useState<{ codigo: string; ajuda: string } | null>(null);
    const [comboSelecao, setComboSelecao] = useState<ComboDinamicoView | null>(null);
    const [cart, setCart] = useState<Record<string, CartGroup>>({});
    const [detalhes, setDetalhes] = useState<Record<string, boolean>>({});
    const [resumoAberto, setResumoAberto] = useState(false);
    const [termosOpen, setTermosOpen] = useState(false);
    const [termosAceito, setTermosAceito] = useState(false);
    const [pendenteFinalizar, setPendenteFinalizar] = useState(false);
    const [etapa, setEtapa] = useState<"selecao" | "produtos" | "atribuicao">("selecao");
    const [atrib, setAtrib] = useState<Record<string, { tipo: "meu" | "outro"; email: string; confirmado?: boolean }>>({});
    const [respostas, setRespostas] = useState<Record<string, string>>({});
    const [perguntaModalUnidade, setPerguntaModalUnidade] = useState<string | null>(null);
    const [variacaoProduto, setVariacaoProduto] = useState<Produto | null>(null);
    // Sessão começa sempre deslogada.
    const [usuario, setUsuario] = useState<string | null>(null);
    const [loginOpen, setLoginOpen] = useState(false);
    const [loginPendente, setLoginPendente] = useState(false);

    // Trava o scroll do fundo enquanto o resumo (mobile) estiver aberto.
    useEffect(() => {
        if (!resumoAberto) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [resumoAberto]);

    // Cor de destaque também no <html> — alcança modais que renderizam em portal (fora do layout).
    useEffect(() => {
        const vars = accentVars(config.corDestaque);
        if (!vars) return;
        const el = document.documentElement;
        const entries = Object.entries(vars as Record<string, string>);
        for (const [k, v] of entries) el.style.setProperty(k, v);
        return () => {
            for (const [k] of entries) el.style.removeProperty(k);
        };
    }, [config.corDestaque]);

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
        // Itens extras (opcionais com preço) somam ao valor base do combo.
        const itemDoCombo = (sessaoId: string, itemId: string) => combo.sessoes.find((x) => x.id === sessaoId)?.itens.find((x) => x.id === itemId);
        const extras = selecoes.reduce((acc, s) => {
            const item = itemDoCombo(s.sessaoId, s.itemId);
            if (item && !item.obrigatorio && (item.preco ?? 0) > 0) return acc + (item.preco ?? 0) * s.quantidade;
            return acc;
        }, 0);
        setCart((prev) => {
            const next: Record<string, CartGroup> = {};
            for (const [k, v] of Object.entries(prev)) if (k !== `din:${combo.id}`) next[k] = v;
            // Valor base do combo + extras escolhidos; itens como sub-linhas.
            next[`din:${combo.id}`] = {
                nome: combo.nome,
                precoUnit: (combo.preco ?? 0) + extras,
                qtd: 1,
                sublines: selecoes.map((s) => ({ nome: s.nome, sub: `${s.data} • ${s.hora}`, qtd: s.quantidade })),
            };
            return next;
        });
        setComboSelecao(null);
    };

    // Remove uma unidade do grupo (decrementa a quantidade).
    const removerUnidade = (key: string) =>
        setCart((prev) => {
            const g = prev[key];
            if (!g) return prev;
            const next = { ...prev };
            if (g.qtd <= 1) delete next[key];
            else next[key] = { ...g, qtd: g.qtd - 1 };
            return next;
        });

    // Adiciona uma unidade ao grupo (incrementa a quantidade).
    const adicionarUnidade = (key: string) =>
        setCart((prev) => {
            const g = prev[key];
            if (!g) return prev;
            return { ...prev, [key]: { ...g, qtd: g.qtd + 1 } };
        });

    const grupos = Object.entries(cart);
    const totalItens = grupos.reduce((acc, [, g]) => acc + g.qtd, 0);
    const totalValor = grupos.reduce((acc, [, g]) => acc + g.qtd * g.precoUnit, 0);

    // Produtos no carrinho (soma de todas as variações).
    const prodQtd = (id: string) => grupos.filter(([k]) => k === `prod:${id}` || k.startsWith(`prod:${id}:`)).reduce((a, [, g]) => a + g.qtd, 0);
    const setProd = (prod: Produto, size: string | null, delta: number) =>
        setCart((prev) => {
            const key = size ? `prod:${prod.id}:${size}` : `prod:${prod.id}`;
            const novo = Math.max(0, (prev[key]?.qtd ?? 0) + delta);
            const next = { ...prev };
            if (novo === 0) delete next[key];
            else next[key] = { nome: prod.nome, sub: size ? `Tamanho ${size}` : undefined, precoUnit: prod.preco ?? 0, qtd: novo };
            return next;
        });
    const setProdQtd = (prod: Produto, size: string | null, n: number) =>
        setCart((prev) => {
            const key = size ? `prod:${prod.id}:${size}` : `prod:${prod.id}`;
            const next = { ...prev };
            if (!n || n <= 0) delete next[key];
            else next[key] = { nome: prod.nome, sub: size ? `Tamanho ${size}` : undefined, precoUnit: prod.preco ?? 0, qtd: n };
            return next;
        });
    const temProdutos = config.produtos.length > 0;

    const fixoTabAtiva = fixoTabs.find((t) => t.id === aba);
    const dataAtiva = config.datas.find((d) => d.id === aba);

    // Para o teste: todas as perguntas do evento aparecem em cada item comprado (combo conta como 1).
    const perguntasDoGrupo = (_key: string) => config.perguntas;

    // Cada unidade (ingresso ou produto) vira um item atribuível. Produtos não têm questionário.
    const unidades = grupos.flatMap(([key, g]) => {
        const isProduto = key.startsWith("prod:");
        const imagem = isProduto ? config.produtos.find((p) => p.id === key.split(":")[1])?.imagem : undefined;
        return Array.from({ length: g.qtd }, (_, i) => ({ id: `${key}#${i}`, key, nome: g.nome, sub: g.sub, isProduto, imagem }));
    });
    const perguntasDaUnidade = (u: { key: string; isProduto: boolean }) => (u.isProduto ? [] : perguntasDoGrupo(u.key));

    // Sem ingressos (produtos/atribuição) → volta para a seleção.
    useEffect(() => {
        if (etapa === "atribuicao" && unidades.length === 0) setEtapa("selecao");
        else if (etapa === "produtos" && totalItens === 0) setEtapa("selecao");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [etapa, unidades.length, totalItens]);

    const unidadeOk = (u: { id: string; key: string; isProduto: boolean }) => {
        const a = atrib[u.id];
        const okAtrib = !!a && (a.tipo === "meu" || (a.tipo === "outro" && emailValido(a.email) && !!a.confirmado));
        if (!okAtrib) return false;
        return perguntasDaUnidade(u)
            .filter((p) => p.obrigatoria)
            .every((p) => (respostas[`${u.id}:${p.id}`] ?? "").trim() !== "");
    };
    const unidadesProntas = unidades.filter(unidadeOk).length;
    const podeFinalizar = unidades.length > 0 && unidadesProntas === unidades.length;

    // Replica a atribuição + respostas de uma unidade para os demais ingressos.
    const aplicarATodos = (origemId: string) => {
        const origem = unidades.find((u) => u.id === origemId);
        const a = atrib[origemId];
        if (!origem || !a) return;
        const pergs = perguntasDaUnidade(origem);
        setAtrib((prev) => {
            const next = { ...prev };
            for (const u of unidades) if (!u.isProduto) next[u.id] = { ...a };
            return next;
        });
        setRespostas((prev) => {
            const next = { ...prev };
            for (const u of unidades) {
                if (u.isProduto || u.id === origemId) continue;
                for (const p of pergs) next[`${u.id}:${p.id}`] = prev[`${origemId}:${p.id}`] ?? "";
            }
            return next;
        });
        toast.success("Dados aplicados a todos os ingressos");
    };

    // Etapas: seleção → produtos (se houver) → atribuição.
    const irProximo = () => {
        setTermosOpen(false);
        setEtapa(temProdutos ? "produtos" : "atribuicao");
        window.scrollTo({ top: 0 });
    };

    // Após login (ou já logado): aplica termos e segue para a próxima etapa.
    const prosseguirSelecao = () => {
        if (config.termos.trim() && !termosAceito) {
            setPendenteFinalizar(true);
            setTermosOpen(true);
        } else irProximo();
    };

    const continuar = () => {
        if (totalItens === 0) return;
        // Passar da seleção para produtos/atribuição exige login.
        if (!usuario) {
            setLoginPendente(true);
            setLoginOpen(true);
            return;
        }
        prosseguirSelecao();
    };

    // Cadastro concluído (aceita qualquer código): grava o usuário e segue o fluxo pendente.
    const aoLogar = (nome: string) => {
        setUsuario(nome || "Victor Pires da Costa");
        setLoginOpen(false);
        if (loginPendente) {
            setLoginPendente(false);
            prosseguirSelecao();
        }
    };
    // Aceite dos termos: libera a navegação; se veio do "Continuar", segue para a próxima etapa.
    const aceitarTermos = () => {
        setTermosAceito(true);
        setTermosOpen(false);
        if (pendenteFinalizar) {
            setPendenteFinalizar(false);
            irProximo();
        }
    };
    const finalizarPedido = () => {
        const sp = new URLSearchParams(params);
        if (usuario) sp.set("u", usuario);
        const qs = sp.toString();
        navigate(`/marketplace/sucesso${qs ? `?${qs}` : ""}`);
    };
    const avancar = () => {
        if (etapa === "selecao") return continuar();
        if (etapa === "produtos") {
            setEtapa("atribuicao");
            window.scrollTo({ top: 0 });
            return;
        }
        if (podeFinalizar) finalizarPedido();
    };
    const continuarDisabled = etapa === "selecao" ? totalItens === 0 : etapa === "atribuicao" ? !podeFinalizar : false;
    const voltarEtapa = () => {
        if (etapa === "atribuicao") {
            setEtapa(temProdutos ? "produtos" : "selecao");
            window.scrollTo({ top: 0 });
        } else if (etapa === "produtos") {
            setEtapa("selecao");
            window.scrollTo({ top: 0 });
        } else navigate("/marketplace");
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
                    <span className="px-2 text-sm font-semibold text-primary">{config.comboTabLabel || "Combo dinâmico"}</span>
                </TabButton>
            )}
            {datasVenda.map((d) => (
                <TabButton key={d.id} active={aba === d.id} onClick={() => setAba(d.id)}>
                    <span className="text-sm text-tertiary">{d.diaSemana}</span>
                    <span className="text-md font-bold text-primary">
                        {d.dia} {d.mes}
                    </span>
                    <span className="text-sm text-tertiary">{d.ano}</span>
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
            <p className="px-1 text-sm text-tertiary">{cupom.ajuda}</p>
        </div>
    ) : (
        <button
            type="button"
            onClick={() => setCupomOpen(true)}
            className="flex w-fit items-center gap-2 self-start rounded-xl bg-primary px-4 py-3.5 text-sm font-medium text-secondary ring-1 ring-border-secondary transition hover:bg-primary_hover"
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
                <span className="flex items-center gap-2 text-sm text-tertiary tabular-nums">
                    {totalItens} {totalItens === 1 ? "item" : "itens"}
                    {totalItens > 0 && (
                        <button type="button" onClick={() => setCart({})} className="text-sm text-quaternary underline transition hover:text-tertiary">
                            Remover {totalItens === 1 ? "item" : "itens"}
                        </button>
                    )}
                </span>
            </div>
            <Button size="lg" color="primary" isDisabled={continuarDisabled} onClick={avancar}>
                Continuar
            </Button>
        </div>
    );

    const ingressosCart = grupos.filter(([k]) => !k.startsWith("prod:"));
    const produtosCart = grupos.filter(([k]) => k.startsWith("prod:"));
    const limparIngressos = () => setCart((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => k.startsWith("prod:"))));
    const limparProdutos = () => setCart((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith("prod:"))));

    const SecaoHeader = ({ titulo, valor, onLimpar }: { titulo: string; valor?: string; onLimpar: () => void }) => (
        <div className="flex items-center gap-3">
            <span className="shrink-0 text-sm font-semibold text-tertiary">{titulo}</span>
            {valor && <span className="shrink-0 text-sm font-bold text-primary tabular-nums">{valor}</span>}
            <span className="flex-1 border-t border-dashed border-secondary" aria-hidden="true" />
            <Button size="sm" color="link-color" onClick={onLimpar}>
                Limpar tudo
            </Button>
        </div>
    );

    const resumoSecoes = (
        <>
            {ingressosCart.length > 0 && (
                <section className="flex flex-col gap-4">
                    <SecaoHeader titulo="Ingressos" onLimpar={limparIngressos} />
                    <ul className="flex flex-col gap-4">
                        {ingressosCart.map(([key, g]) => (
                            <CartGroupRow key={key} grupo={g} onInc={() => adicionarUnidade(key)} onDec={() => removerUnidade(key)} />
                        ))}
                    </ul>
                </section>
            )}
            {produtosCart.length > 0 && (
                <section className="flex flex-col gap-4">
                    <SecaoHeader titulo="Produtos" onLimpar={limparProdutos} />
                    <ul className="flex flex-col gap-4">
                        {produtosCart.map(([key, g]) => {
                            const [, id, size] = key.split(":");
                            const produto = config.produtos.find((p) => p.id === id);
                            return (
                                <ProdutoResumoRow
                                    key={key}
                                    nome={g.nome}
                                    sub={g.sub}
                                    preco={g.precoUnit}
                                    imagem={produto?.imagem}
                                    qtd={g.qtd}
                                    onSetQtd={(n) => produto && setProdQtd(produto, size ?? null, n)}
                                />
                            );
                        })}
                    </ul>
                </section>
            )}
        </>
    );

    const resumoCard = (
        <div className="hidden max-h-[660px] flex-col rounded-xl bg-primary ring-1 ring-border-secondary lg:flex">
            <header className="shrink-0 border-b border-secondary px-4 py-3.5">
                <h3 className="text-sm font-semibold text-primary">Resumo da compra</h3>
            </header>
            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">{resumoSecoes}</div>
            {totalBar}
        </div>
    );

    const totalIngressosUnid = unidades.filter((u) => !u.isProduto).length;
    const progresso = unidades.length > 0 ? Math.round((unidadesProntas / unidades.length) * 100) : 0;
    const atribuicaoLayout = (
        <div className="mx-auto flex w-full max-w-[1446px] flex-col gap-6 lg:flex-row lg:justify-center">
            <div className="flex w-full flex-col gap-4 rounded-2xl bg-primary p-4 ring-1 ring-border-secondary md:p-5 lg:w-[1062px]">
                <h2 className="text-lg font-bold text-primary">Quem usará estes itens?</h2>

                {/* Progresso da atribuição */}
                <div className="flex flex-col gap-2 rounded-xl bg-primary p-0">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-primary">
                            {unidadesProntas} de {unidades.length} {unidades.length === 1 ? "item definido" : "itens definidos"}
                        </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-quaternary">
                        <div className="h-full rounded-full bg-brand-solid transition-all duration-200 ease-linear" style={{ width: `${progresso}%` }} />
                    </div>
                </div>

                {unidades.map((u) => (
                    <AtribuicaoCard
                        key={u.id}
                        unidade={u}
                        valor={atrib[u.id]}
                        perguntas={perguntasDaUnidade(u)}
                        getResposta={(pid) => respostas[`${u.id}:${pid}`] ?? ""}
                        onAtrib={(v) => setAtrib((p) => ({ ...p, [u.id]: v }))}
                        onAbrirPerguntas={() => setPerguntaModalUnidade(u.id)}
                        onRemover={() => removerUnidade(u.key)}
                        podeAplicarTodos={!u.isProduto && totalIngressosUnid > 1 && unidadeOk(u)}
                        onAplicarTodos={() => aplicarATodos(u.id)}
                    />
                ))}
            </div>
            <div className="flex w-full flex-col gap-4 lg:w-[360px] lg:shrink-0">{grupos.length > 0 && resumoCard}</div>
        </div>
    );

    // Layout dedicado a "uma única data e horário": capa + cabeçalho com hora/data por extenso.
    const soUmaData = datasVenda.length === 1 && fixoTabs.length === 0 && !temDinamicos && !!dataAtiva;
    const dataHeader = dataAtiva ? (
        <div className="flex flex-col gap-1">
            <span className="text-sm text-tertiary">
                {dataAtiva.diaSemana.toLowerCase()}
                {dataAtiva.hora ? `, ${dataAtiva.hora}` : ""}
            </span>
            <h2 className="text-xl font-bold text-primary md:text-2xl">{dataPorExtenso(dataAtiva)}</h2>
        </div>
    ) : null;
    const umaDataLayout = (
        <div className="grid w-full grid-cols-1 gap-6 lg:h-full lg:grid-cols-[1fr_640px] lg:overflow-hidden">
            <div className="-mx-4 -mt-4 h-[260px] overflow-clip bg-secondary lg:mx-0 lg:mt-0 lg:h-full lg:rounded-2xl lg:ring-1 lg:ring-border-secondary">
                {config.mapa ? (
                    <img src={config.mapa} alt="Mapa do local" className="h-full w-full object-cover" />
                ) : (
                    config.capa && <img src={config.capa} alt="Capa do evento" className="h-full w-full object-cover" />
                )}
            </div>
            <div className="flex w-full flex-col gap-4 lg:h-full lg:min-h-0 lg:max-w-[640px]">
                {cupomBlock}
                <div className="flex flex-col overflow-clip rounded-2xl bg-primary ring-1 ring-border-secondary lg:min-h-0 lg:flex-1">
                    <div className="flex flex-col px-4 pt-4 pb-4 md:px-5 md:pt-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                        {dataHeader}
                        {conteudo}
                    </div>
                    {totalItens > 0 && <div className="hidden lg:block">{totalBar}</div>}
                </div>
            </div>
        </div>
    );

    const produtosLayout = (
        <div className="mx-auto flex w-full max-w-[1446px] flex-col gap-6 lg:flex-row lg:justify-center">
            <div className="flex w-full flex-col gap-4 rounded-2xl bg-primary p-4 ring-1 ring-border-secondary md:p-5 lg:w-[1062px]">
                <button type="button" onClick={voltarEtapa} className="flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-secondary transition hover:text-brand-secondary_hover">
                    <ChevronLeft className="size-4" />
                    Voltar para seleção de ingressos
                </button>
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-xl font-bold text-primary">Leve mais do que o ingresso</h2>
                    <p className="text-sm text-tertiary">Compre online e retire no dia do evento.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {config.produtos.map((p) => (
                        <ProdutoCard key={p.id} produto={p} qtd={prodQtd(p.id)} onAbrirVariacao={() => setVariacaoProduto(p)} onSetQtd={(n) => setProdQtd(p, null, n)} />
                    ))}
                </div>
            </div>
            <div className="flex w-full flex-col gap-4 lg:w-[360px] lg:shrink-0">{grupos.length > 0 && resumoCard}</div>
        </div>
    );

    if (carregandoLink) {
        return (
            <MarketplaceLayout title="Carregando…" usuario={usuario ?? undefined}>
                <div className="flex h-full items-center justify-center py-20">
                    <span className="size-8 animate-spin rounded-full border-2 border-border-secondary border-t-fg-brand-primary" />
                </div>
            </MarketplaceLayout>
        );
    }

    return (
        <MarketplaceLayout
            title={config.nome}
            badge={config.selo || undefined}
            logo={config.logo || undefined}
            accent={config.corDestaque || undefined}
            onBack={etapa === "selecao" && config.exibirVoltar === false ? undefined : voltarEtapa}
            usuario={usuario ?? undefined}
            onAcessar={() => !usuario && setLoginOpen(true)}
        >
            {etapa === "atribuicao" ? (
                atribuicaoLayout
            ) : etapa === "produtos" ? (
                produtosLayout
            ) : soUmaData ? (
                umaDataLayout
            ) : config.mapa ? (
                /* Layout com mapa: container em altura total; mapa ocupa o resto, seleção fixa em 640px com scroll interno */
                <div className="grid w-full grid-cols-1 gap-6 lg:h-full lg:grid-cols-[1fr_640px] lg:overflow-hidden">
                    <div className="-mx-4 -mt-4 h-[320px] overflow-clip bg-secondary lg:mx-0 lg:mt-0 lg:h-full lg:rounded-2xl lg:ring-1 lg:ring-border-secondary">
                        <img src={config.mapa} alt="Mapa do local" className="h-full w-full object-cover" />
                    </div>

                    <div className="flex w-full flex-col gap-4 lg:h-full lg:min-h-0 lg:max-w-[640px]">
                        {cupomBlock}
                        <div className="flex flex-col overflow-clip rounded-2xl bg-primary ring-1 ring-border-secondary lg:min-h-0 lg:flex-1">
                            <div className="flex flex-col p-4 md:p-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                                {abas}
                                {conteudo}
                            </div>
                            {totalItens > 0 && <div className="hidden lg:block">{totalBar}</div>}
                        </div>
                    </div>
                </div>
            ) : (
                /* Layout sem mapa: seleção à esquerda, capa + cupom + resumo à direita */
                <div className="flex w-full flex-col gap-6 lg:flex-row lg:justify-center">
                    <div className="flex w-full flex-col rounded-2xl bg-primary p-4 ring-1 ring-border-secondary md:p-5 lg:w-[640px]">
                        {abas}
                        {conteudo}
                    </div>

                    <div className="flex w-full flex-col gap-4 lg:w-[360px] lg:shrink-0">
                        {config.capa && <img src={config.capa} alt="Capa do evento" className="w-full rounded-xl object-cover ring-1 ring-border-secondary" />}
                        {cupomBlock}

                        {grupos.length > 0 && (
                            <div className="hidden flex-col rounded-xl bg-primary ring-1 ring-border-secondary lg:flex">
                                <header className="border-b border-secondary px-4 py-3.5">
                                    <h3 className="text-sm font-semibold text-primary">Resumo da compra</h3>
                                </header>

                                <div className="flex flex-col gap-4 px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <span className="shrink-0 text-sm font-semibold text-tertiary">Ingressos</span>
                                        <span className="flex-1 border-t border-dashed border-secondary" aria-hidden="true" />
                                        <Button size="sm" color="link-color" onClick={() => setCart({})}>
                                            Limpar tudo
                                        </Button>
                                    </div>
                                    <ul className="flex flex-col gap-4">
                                        {grupos.map(([key, g]) => (
                                            <CartGroupRow key={key} grupo={g} onInc={() => adicionarUnidade(key)} onDec={() => removerUnidade(key)} />
                                        ))}
                                    </ul>
                                </div>

                                {totalBar}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Resumo fixo no rodapé — apenas mobile, expansível. Em portal no body para ir de ponta a ponta. */}
            {totalItens > 0 && <div className="h-36 lg:hidden" aria-hidden="true" />}
            {createPortal(
                <>
                    <AnimatePresence>
                        {resumoAberto && totalItens > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 z-40 bg-overlay/60 lg:hidden"
                                onClick={() => setResumoAberto(false)}
                            />
                        )}
                    </AnimatePresence>
                    <AnimatePresence>
                        {totalItens > 0 && (
                            <motion.div
                                key="footer"
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", stiffness: 320, damping: 34 }}
                                className="fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-2xl bg-primary shadow-lg ring-1 ring-border-secondary lg:hidden"
                                style={accentVars(config.corDestaque || undefined)}
                            >
                        <button
                            type="button"
                            onClick={() => setResumoAberto((o) => !o)}
                            className="flex items-center justify-between gap-3 border-b border-secondary px-4 py-3"
                        >
                            <span className="text-sm font-semibold text-primary">Resumo da compra</span>
                            <ChevronDown className={cx("size-5 text-fg-quaternary transition-transform", resumoAberto && "rotate-180")} />
                        </button>

                        <AnimatePresence initial={false}>
                            {resumoAberto && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: "easeOut" }}
                                    className="overflow-hidden"
                                >
                                    <div className="flex max-h-[55vh] flex-col gap-5 overflow-y-auto px-4 py-4">{resumoSecoes}</div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex items-center justify-between gap-3 border-t border-secondary px-4 pt-3 pb-9">
                            <div className="flex flex-col">
                                <span className="text-md font-bold text-primary tabular-nums">
                                    {brl(totalValor)} <span className="text-sm font-normal text-tertiary">+ taxas</span>
                                </span>
                                <span className="text-sm text-tertiary tabular-nums">
                                    {totalItens} {totalItens === 1 ? "item" : "itens"}
                                </span>
                            </div>
                            <Button size="lg" color="primary" isDisabled={continuarDisabled} onClick={avancar}>
                                Continuar
                            </Button>
                        </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>,
                document.body,
            )}

            <VariacaoModal
                produto={variacaoProduto}
                getQtd={(size) => (variacaoProduto ? (cart[`prod:${variacaoProduto.id}:${size}`]?.qtd ?? 0) : 0)}
                onAdd={(size) => variacaoProduto && setProd(variacaoProduto, size, 1)}
                onSetQtd={(size, n) => variacaoProduto && setProdQtd(variacaoProduto, size, n)}
                onClose={() => setVariacaoProduto(null)}
            />
            <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} logoEvento={config.logo || undefined} onSucesso={aoLogar} />
            <SelecaoItensModal combo={comboSelecao} onClose={() => setComboSelecao(null)} onConfirmar={confirmarSelecao} />
            <CupomModal isOpen={cupomOpen} onClose={() => setCupomOpen(false)} onAplicar={aplicarCupom} />
            <TermosModal isOpen={termosOpen} termos={config.termos} onClose={() => setTermosOpen(false)} onConfirmar={aceitarTermos} />

            {(() => {
                const u = unidades.find((x) => x.id === perguntaModalUnidade);
                return (
                    <PerguntasModal
                        isOpen={!!u}
                        titulo={u?.nome ?? ""}
                        perguntas={u ? perguntasDaUnidade(u) : []}
                        getResposta={(pid) => (u ? respostas[`${u.id}:${pid}`] ?? "" : "")}
                        onResposta={(pid, val) => u && setRespostas((p) => ({ ...p, [`${u.id}:${pid}`]: val }))}
                        onClose={() => setPerguntaModalUnidade(null)}
                    />
                );
            })()}
        </MarketplaceLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Atribuição                                                        */
/* ------------------------------------------------------------------ */

function OpcaoRadio({ selected, label, onClick, children }: { selected: boolean; label: string; onClick: () => void; children?: React.ReactNode }) {
    return (
        <div className={cx("rounded-xl px-4 py-3 transition", selected ? "ring-2 ring-primary" : "ring-1 ring-secondary")}>
            <button type="button" onClick={onClick} className="flex w-full items-center gap-3 text-left">
                <span className={cx("flex size-5 shrink-0 items-center justify-center rounded-full ring-2", selected ? "ring-primary" : "ring-secondary")}>
                    {selected && <span className="size-2.5 rounded-full bg-primary-solid" />}
                </span>
                <span className={cx("text-sm font-medium", selected ? "text-primary" : "text-tertiary")}>{label}</span>
            </button>
            {children}
        </div>
    );
}

function AtribuicaoCard({
    unidade,
    valor,
    perguntas,
    getResposta,
    onAtrib,
    onAbrirPerguntas,
    onRemover,
    podeAplicarTodos = false,
    onAplicarTodos,
}: {
    unidade: { id: string; key: string; nome: string; sub?: string; isProduto?: boolean; imagem?: string };
    valor?: { tipo: "meu" | "outro"; email: string; confirmado?: boolean };
    perguntas: PerguntaEvento[];
    getResposta: (pid: string) => string;
    onAtrib: (v: { tipo: "meu" | "outro"; email: string; confirmado?: boolean }) => void;
    onAbrirPerguntas: () => void;
    onRemover: () => void;
    podeAplicarTodos?: boolean;
    onAplicarTodos?: () => void;
}) {
    const tipo = valor?.tipo;
    const selecionado = !!tipo;
    const email = valor?.email ?? "";
    const confirmado = !!valor?.confirmado;
    const obrigatorias = perguntas.filter((p) => p.obrigatoria);
    const obrigatoriasOk = obrigatorias.every((p) => getResposta(p.id).trim() !== "");
    const emailInvalido = tipo === "outro" && email.trim() !== "" && !emailValido(email);
    const [enviando, setEnviando] = useState(false);

    // Enviar convite: loading simulado, depois confirma o destinatário.
    const enviar = () => {
        if (!emailValido(email) || enviando) return;
        setEnviando(true);
        setTimeout(() => {
            setEnviando(false);
            onAtrib({ tipo: "outro", email, confirmado: true });
        }, 900);
    };

    // O questionário só aparece após definir o titular (meu, ou outro confirmado).
    const mostrarQuestionario = selecionado && perguntas.length > 0 && (tipo === "meu" || confirmado);

    return (
        <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="flex flex-col gap-4 rounded-xl p-4 ring-1 ring-border-secondary">
            <div className="flex items-start gap-3">
                {unidade.imagem ? (
                    <img src={unidade.imagem} alt="" aria-hidden="true" className="size-12 shrink-0 rounded-lg object-cover ring-1 ring-border-secondary" />
                ) : unidade.isProduto ? (
                    <Package className="mt-0.5 size-5 shrink-0 text-fg-brand-primary" />
                ) : (
                    <QrCode01 className="mt-0.5 size-5 shrink-0 text-fg-brand-primary" />
                )}
                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-bold text-primary">{unidade.nome}</span>
                    {unidade.sub && <span className="text-sm text-tertiary">{unidade.sub}</span>}
                </div>
                <button type="button" onClick={onRemover} aria-label="Remover" className="shrink-0 text-fg-error-primary transition hover:opacity-80">
                    <Trash01 className="size-5" />
                </button>
            </div>

            <div className="flex flex-col gap-2">
                <OpcaoRadio selected={tipo === "meu"} label={unidade.isProduto ? "Meu produto" : "Meu ingresso"} onClick={() => onAtrib({ tipo: "meu", email })} />
                <OpcaoRadio selected={tipo === "outro"} label="Atribuir a outro usuário" onClick={() => onAtrib({ tipo: "outro", email, confirmado })}>
                    <AnimatePresence initial={false} mode="wait">
                        {tipo === "outro" && !confirmado && (
                            <motion.div key="form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="overflow-hidden">
                                <div className="mt-3 flex flex-col gap-1.5 px-0.5 pb-1.5">
                                    <div className={cx("flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2.5 ring-1 transition focus-within:ring-2 focus-within:ring-brand", emailInvalido ? "ring-error" : "ring-border-primary")}>
                                        <input
                                            type="email"
                                            aria-label="E-mail"
                                            placeholder="Digite o e-mail"
                                            value={email}
                                            disabled={enviando}
                                            onChange={(e) => onAtrib({ tipo: "outro", email: e.target.value, confirmado: false })}
                                            onKeyDown={(e) => e.key === "Enter" && enviar()}
                                            className="min-w-0 flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-placeholder disabled:opacity-50"
                                        />
                                        <button
                                            type="button"
                                            onClick={enviar}
                                            disabled={!emailValido(email) || enviando}
                                            aria-label="Enviar"
                                            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-fg-brand-primary transition hover:bg-primary_hover disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            {enviando ? <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Send01 className="size-5" />}
                                        </button>
                                    </div>
                                    {emailInvalido && <span className="text-sm text-error-primary">Informe um e-mail válido.</span>}
                                </div>
                            </motion.div>
                        )}
                        {tipo === "outro" && confirmado && (
                            <motion.div key="ok" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="overflow-hidden">
                                <div className="mt-3 flex flex-col gap-3 px-0.5 pb-1.5">
                                    <div className="flex items-center gap-3 rounded-xl bg-secondary px-3.5 py-2.5">
                                        <Avatar size="sm" initials={(email.trim()[0] ?? "?").toUpperCase()} alt="" />
                                        <div className="flex min-w-0 flex-1 flex-col">
                                            <span className="truncate text-sm font-semibold text-primary">{email}</span>
                                            <span className="text-sm text-success-primary">Convite será enviado para este e-mail.</span>
                                        </div>
                                    </div>
                                    <Button size="md" color="secondary" className="w-full" onClick={() => onAtrib({ tipo: "outro", email, confirmado: false })}>
                                        Trocar titular
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </OpcaoRadio>
            </div>

            <AnimatePresence initial={false}>
                {mostrarQuestionario && (
                    <motion.div key="quest" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="overflow-hidden">
                        <div className="flex flex-col gap-3 border-t border-secondary pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0 flex-1">
                                <AnimatePresence initial={false} mode="wait">
                                    {obrigatoriasOk ? (
                                        <motion.div key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                                            <StatusBadge tone="success">Questionário do atleta já respondido</StatusBadge>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="warn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                                            <StatusBadge tone="warning">Responda o questionário do atleta para concluir a inscrição</StatusBadge>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <Button size="md" color={obrigatoriasOk ? "secondary" : "primary"} className="shrink-0" onClick={onAbrirPerguntas}>
                                {obrigatoriasOk ? "Revisar" : "Responder"}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {podeAplicarTodos && onAplicarTodos && (
                <Button size="sm" color="link-color" iconLeading={Copy01} className="self-start" onClick={onAplicarTodos}>
                    Aplicar estes dados a todos os ingressos
                </Button>
            )}
        </motion.div>
    );
}

/** Aviso de status do questionário — quebra em várias linhas e traz ícone (warning/success). */
function StatusBadge({ tone, children }: { tone: "warning" | "success"; children: React.ReactNode }) {
    const ok = tone === "success";
    const Icon = ok ? CheckCircle : AlertTriangle;
    return (
        <div className={cx("flex items-start gap-2 rounded-lg px-3 py-2 text-sm font-medium", ok ? "bg-success-secondary text-success-primary" : "bg-warning-secondary text-warning-primary")}>
            <Icon className="mt-0.5 size-4 shrink-0" />
            <span>{children}</span>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Produtos                                                          */
/* ------------------------------------------------------------------ */

/** Barra de quantidade full-width — track bg-secondary, botão "−" branco e "+" em destaque. size "xs" = botões menores + padding 8/4. */
function QtdBar({ qtd, canInc = true, size = "md", onInc, onDec }: { qtd: number; canInc?: boolean; size?: "md" | "xs"; onInc: () => void; onDec: () => void }) {
    const xs = size === "xs";
    const track = cx("flex w-full items-center justify-between gap-2 rounded-lg bg-secondary", xs ? "px-1.5 py-1.5" : "p-1.5");
    const btn = cx("flex shrink-0 items-center justify-center transition disabled:cursor-not-allowed disabled:opacity-40", xs ? "size-8 rounded-lg" : "size-11 rounded-xl");
    return (
        <div className={track}>
            <button type="button" onClick={onDec} disabled={qtd === 0} aria-label="Diminuir" className={cx(btn, "bg-primary text-fg-secondary ring-1 ring-border-primary hover:bg-primary_hover")}>
                <Minus className="size-4" />
            </button>
            <span className="flex-1 text-center text-sm font-semibold text-primary tabular-nums">{qtd}</span>
            <button type="button" onClick={onInc} disabled={!canInc} aria-label="Aumentar" className={cx(btn, "bg-brand-solid text-white hover:bg-brand-solid_hover")}>
                <Plus className="size-4" />
            </button>
        </div>
    );
}

/** Controle compacto do resumo — lixeira (remove) vira "−" quando há 2+ unidades; número ao centro e "+". */
function ResumoQtd({ qtd, onInc, onDec }: { qtd: number; onInc: () => void; onDec: () => void }) {
    const podeMenos = qtd >= 2;
    return (
        <div className="flex shrink-0 items-center rounded-lg ring-1 ring-border-secondary">
            <button
                type="button"
                onClick={onDec}
                aria-label={podeMenos ? "Diminuir" : "Remover"}
                className="flex size-9 items-center justify-center rounded-l-lg text-fg-quaternary transition hover:bg-primary_hover hover:text-fg-secondary"
            >
                {podeMenos ? <Minus className="size-4" /> : <Trash01 className="size-4" />}
            </button>
            <span className="w-7 text-center text-sm font-semibold text-primary tabular-nums">{qtd}</span>
            <button
                type="button"
                onClick={onInc}
                aria-label="Aumentar"
                className="flex size-9 items-center justify-center rounded-r-lg text-fg-quaternary transition hover:bg-primary_hover hover:text-fg-secondary"
            >
                <Plus className="size-4" />
            </button>
        </div>
    );
}

function ProdutoResumoRow({ nome, sub, preco, imagem, qtd, onSetQtd }: { nome: string; sub?: string; preco: number; imagem?: string; qtd: number; onSetQtd: (n: number) => void }) {
    return (
        <li className="flex items-center gap-3">
            {imagem ? (
                <img src={imagem} alt="" aria-hidden="true" className="size-11 shrink-0 rounded-md object-cover ring-1 ring-border-secondary" />
            ) : (
                <span className="size-11 shrink-0 rounded-md bg-secondary ring-1 ring-border-secondary" />
            )}
            <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-primary">{nome}</span>
                {sub && <span className="truncate text-sm text-tertiary">{sub}</span>}
                <span className="text-sm font-bold text-primary">{brl(preco)}</span>
            </div>
            <ResumoQtd qtd={qtd} onInc={() => onSetQtd(qtd + 1)} onDec={() => onSetQtd(qtd - 1)} />
        </li>
    );
}

function ProdutoCard({ produto, qtd, onAbrirVariacao, onSetQtd }: { produto: Produto; qtd: number; onAbrirVariacao: () => void; onSetQtd: (n: number) => void }) {
    const temVar = (produto.variacoes?.length ?? 0) > 0;
    const [verMais, setVerMais] = useState(false);
    const selecionado = qtd > 0;
    return (
        <div className={cx("flex flex-col overflow-clip rounded-xl ring-1 transition", selecionado ? "ring-border ring-brand" : "ring-border-secondary")}>
            <div className="relative">
                {produto.imagem && <img src={produto.imagem} alt="" className="aspect-square w-full object-cover" />}
                {produto.selo && (
                    <span className="absolute top-3 left-3 rounded-full bg-brand-solid px-2.5 py-1 text-sm font-semibold text-white">{produto.selo}</span>
                )}
            </div>
            <div className="flex flex-1 flex-col gap-1 p-3">
                <span className="text-sm font-semibold text-primary">{produto.nome}</span>
                {produto.descricao && (
                    <div className="flex flex-col items-start">
                        <p className={cx("text-sm text-tertiary", !verMais && "line-clamp-2")}>{produto.descricao}</p>
                        <button type="button" onClick={() => setVerMais((v) => !v)} className="text-sm font-medium text-brand-secondary transition hover:text-brand-secondary_hover">
                            {verMais ? "Ver menos" : "Ver mais"}
                        </button>
                    </div>
                )}
                {produto.preco != null && <span className="mt-0.5 text-sm font-bold text-primary">{brl(produto.preco)}</span>}
                <div className="mt-auto pt-2">
                    {temVar ? (
                        <Button size="lg" color="secondary" iconLeading={Plus} className="w-full" onClick={onAbrirVariacao}>
                            {qtd > 0 ? `Adicionar (${qtd})` : "Adicionar"}
                        </Button>
                    ) : qtd > 0 ? (
                        <QtdBar qtd={qtd} size="xs" onInc={() => onSetQtd(qtd + 1)} onDec={() => onSetQtd(qtd - 1)} />
                    ) : (
                        <Button size="lg" color="secondary" iconLeading={Plus} className="w-full" onClick={() => onSetQtd(1)}>
                            Adicionar
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

function VariacaoModal({
    produto,
    getQtd,
    onAdd,
    onSetQtd,
    onClose,
}: {
    produto: Produto | null;
    getQtd: (size: string) => number;
    onAdd: (size: string) => void;
    onSetQtd: (size: string, n: number) => void;
    onClose: () => void;
}) {
    const [tam, setTam] = useState<string | null>(null);
    useEffect(() => {
        setTam(null);
    }, [produto?.id]);

    if (!produto) return null;
    const variacoes = produto.variacoes ?? [];
    const escolhidas = variacoes.filter((v) => getQtd(v) > 0);

    return (
        <ModalOverlay isOpen={produto !== null} onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal className="sm:max-w-[760px]">
                <Dialog>
                    <div className="flex max-h-[85vh] w-full flex-col overflow-clip rounded-2xl bg-primary shadow-xl ring-1 ring-border-secondary md:flex-row">
                        {produto.imagem && <img src={produto.imagem} alt="" className="aspect-square w-full shrink-0 object-cover md:max-h-[440px] md:w-1/2" />}
                        <div className="flex min-h-0 flex-1 flex-col">
                            <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-2">
                                <div className="flex flex-col gap-0.5">
                                    <h2 className="text-lg font-semibold text-primary">{produto.nome}</h2>
                                    {produto.preco != null && <p className="text-md font-bold text-primary">{brl(produto.preco)}</p>}
                                </div>
                                <ButtonUtility size="sm" color="tertiary" icon={XClose} onClick={onClose} tooltip="Fechar" />
                            </div>

                            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pb-4">
                                {produto.descricao && <p className="text-sm text-tertiary">{produto.descricao}</p>}
                                <div className="flex flex-col gap-2">
                                    <span className="text-sm font-medium text-secondary">Selecione o tamanho</span>
                                    <div className="flex flex-wrap gap-2">
                                        {variacoes.map((v) => (
                                            <button
                                                key={v}
                                                type="button"
                                                onClick={() => setTam(v)}
                                                className={cx(
                                                    "min-w-11 rounded-lg px-3 py-2 text-sm font-semibold ring-1 transition",
                                                    tam === v ? "bg-brand-primary text-primary ring-brand" : "text-secondary ring-border-secondary hover:bg-primary_hover",
                                                )}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <Button size="sm" color="secondary" iconLeading={Plus} className="self-start" isDisabled={!tam} onClick={() => tam && onAdd(tam)}>
                                    Adicionar
                                </Button>

                                {escolhidas.length > 0 && (
                                    <div className="flex flex-col gap-2 border-t border-secondary pt-3">
                                        {escolhidas.map((v) => (
                                            <div key={v} className="flex items-center justify-between gap-3">
                                                <span className="text-sm text-primary">Tamanho {v}</span>
                                                <div className="w-[140px]">
                                                    <QtdBar qtd={getQtd(v)} onInc={() => onSetQtd(v, getQtd(v) + 1)} onDec={() => onSetQtd(v, getQtd(v) - 1)} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex shrink-0 justify-end border-t border-secondary px-6 py-4">
                                <Button size="md" color="primary" onClick={onClose}>
                                    Concluir Seleção
                                </Button>
                            </div>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

function CampoPergunta({ pergunta, valor, onChange }: { pergunta: PerguntaEvento; valor: string; onChange: (v: string) => void }) {
    const { tipo, titulo, obrigatoria, opcoes = [] } = pergunta;
    const Label = (
        <span className="text-sm font-medium text-secondary">
            {titulo}
            {obrigatoria && <span className="text-brand-secondary"> *</span>}
        </span>
    );

    if (tipo === "numero") return <Input size="md" type="text" inputMode="numeric" label={titulo} isRequired={obrigatoria} placeholder="0" value={valor} onChange={(v: string) => onChange(v.replace(/\D/g, ""))} />;
    if (tipo === "data") return <Input size="md" type="text" inputMode="numeric" label={titulo} isRequired={obrigatoria} placeholder="DD/MM/AAAA" value={valor} onChange={(v: string) => onChange(maskData(v))} />;
    if (tipo === "dropdown")
        return (
            <label className="flex flex-col gap-1.5">
                {Label}
                <select
                    value={valor}
                    onChange={(e) => onChange(e.target.value)}
                    className="rounded-lg bg-primary px-3 py-2.5 text-sm text-primary ring-1 ring-border-primary outline-hidden focus:ring-2 focus:ring-brand"
                >
                    <option value="">Selecione</option>
                    {opcoes.map((o) => (
                        <option key={o} value={o}>
                            {o}
                        </option>
                    ))}
                </select>
            </label>
        );
    if (tipo === "radio")
        return (
            <fieldset className="flex flex-col gap-2">
                <legend className="mb-1.5">{Label}</legend>
                {opcoes.map((o) => (
                    <label key={o} className="flex items-center gap-2.5 text-sm text-primary">
                        <input type="radio" name={pergunta.id} checked={valor === o} onChange={() => onChange(o)} className="size-4" style={{ accentColor: "var(--color-bg-brand-solid)" }} />
                        {o}
                    </label>
                ))}
            </fieldset>
        );
    if (tipo === "checkbox") {
        const sel = valor ? valor.split("|") : [];
        const toggle = (o: string) => onChange((sel.includes(o) ? sel.filter((x) => x !== o) : [...sel, o]).join("|"));
        return (
            <fieldset className="flex flex-col gap-2.5">
                <legend className="mb-1.5">{Label}</legend>
                {opcoes.map((o) => (
                    <label key={o} className="flex items-start gap-2.5 text-sm text-primary">
                        <Checkbox size="sm" isSelected={sel.includes(o)} onChange={() => toggle(o)} />
                        {o}
                    </label>
                ))}
            </fieldset>
        );
    }
    return <Input size="md" label={titulo} isRequired={obrigatoria} placeholder="Sua resposta" value={valor} onChange={onChange} />;
}

function PerguntasModal({
    isOpen,
    titulo,
    perguntas,
    getResposta,
    onResposta,
    onClose,
}: {
    isOpen: boolean;
    titulo: string;
    perguntas: PerguntaEvento[];
    getResposta: (pid: string) => string;
    onResposta: (pid: string, val: string) => void;
    onClose: () => void;
}) {
    const obrigatoriasOk = perguntas.filter((p) => p.obrigatoria).every((p) => getResposta(p.id).trim() !== "");
    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal className="sm:max-w-[480px]">
                <Dialog>
                    {/* Altura travada na viewport (dvh): só o footer é fixo; header rola com o conteúdo. */}
                    <div className="flex max-h-[85dvh] w-full flex-col overflow-clip rounded-2xl bg-primary shadow-xl ring-1 ring-border-secondary">
                        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pt-5 pb-2">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex flex-col gap-0.5">
                                    <h2 className="text-lg font-semibold text-primary">Questionário do atleta</h2>
                                    <p className="text-sm text-tertiary">{titulo}</p>
                                </div>
                                <ButtonUtility size="sm" color="tertiary" icon={XClose} onClick={onClose} tooltip="Fechar" />
                            </div>
                            {perguntas.map((p) => (
                                <CampoPergunta key={p.id} pergunta={p} valor={getResposta(p.id)} onChange={(v) => onResposta(p.id, v)} />
                            ))}
                        </div>

                        <div className="flex shrink-0 justify-end border-t border-secondary px-6 py-4">
                            <Button size="md" color="primary" isDisabled={!obrigatoriasOk} onClick={onClose}>
                                Concluir
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
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

function Stepper({ qtd, canDec = true, canInc = true, onInc, onDec }: { qtd: number; canDec?: boolean; canInc?: boolean; onInc: () => void; onDec: () => void }) {
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
                disabled={!canInc}
                aria-label="Aumentar"
                className="flex size-9 items-center justify-center rounded-md bg-brand-solid text-white transition hover:bg-brand-solid_hover disabled:cursor-not-allowed disabled:bg-secondary disabled:text-fg-quaternary"
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
                                <span key={d} className="rounded-md bg-secondary px-2 py-0.5 text-sm font-medium text-tertiary">
                                    {d}
                                </span>
                            ))}
                        </div>
                    )}
                    {combo.lote && <span className="text-sm text-tertiary">{combo.lote}</span>}
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
                            {i.sub && <span className="text-sm text-tertiary">{i.sub}</span>}
                            {i.descricao && <p className="text-sm text-tertiary">{i.descricao}</p>}
                        </div>
                        <span className="shrink-0 text-sm text-tertiary">
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
                    {combo.dataLabel && <span className="rounded-md bg-secondary px-2 py-0.5 text-sm font-medium text-tertiary">{combo.dataLabel}</span>}
                    {combo.sessoesLabel && <span className="rounded-md bg-secondary px-2 py-0.5 text-sm font-medium text-tertiary">{combo.sessoesLabel}</span>}
                </div>
                {combo.tags.map((t) => (
                    <span key={t} className="text-sm text-tertiary">
                        {t}
                    </span>
                ))}
                {combo.descricao && <p className="text-sm text-tertiary">{combo.descricao}</p>}
                {combo.exibirPreco && combo.preco != null && <span className="text-md font-bold text-primary">{brl(combo.preco)}</span>}
            </div>
            <Button size="md" color="secondary" className="shrink-0" onClick={onSelecionar}>
                Selecionar
            </Button>
        </div>
    );
}

function ItensPorData({ data, itens, cart, onInc, onDec }: { data: DataEvento; itens: Item[]; cart: Record<string, CartGroup>; onInc: (it: Item) => void; onDec: (it: Item) => void }) {
    // Agrupa por grupo (mantendo a ordem). Só ingressos com grupo aparecem;
    // grupos separados por vírgula colocam o ingresso em vários grupos.
    const grupos: { nome: string; itens: Item[] }[] = [];
    for (const it of itens) {
        if (!it.grupo) continue;
        const nomes = it.grupo
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        for (const nome of nomes) {
            let g = grupos.find((x) => x.nome === nome);
            if (!g) {
                g = { nome, itens: [] };
                grupos.push(g);
            }
            g.itens.push(it);
        }
    }

    if (grupos.length === 0) return <p className="mt-6 text-sm text-tertiary">Nenhum ingresso com grupo definido para esta data.</p>;

    // Total já selecionado nesta data — usado para o limite por data.
    const totalData = Object.entries(cart)
        .filter(([k]) => k.startsWith(`data:${data.id}:`))
        .reduce((acc, [, g]) => acc + g.qtd, 0);
    const limiteAtingido = data.limite != null && data.limite > 0 && totalData >= data.limite;

    return (
        <div className="mt-6 flex flex-col gap-4">
            {limiteAtingido && (
                <p className="text-sm text-tertiary">
                    Limite de {data.limite} {data.limite === 1 ? "ingresso" : "ingressos"} por data atingido.
                </p>
            )}
            {grupos.map((g) => (
                <GrupoIngressos key={g.nome} nome={g.nome}>
                    {g.itens.map((it) => {
                        const qtd = cart[`data:${data.id}:${it.id}`]?.qtd ?? 0;
                        return <IngressoRow key={it.id} it={it} qtd={qtd} canInc={!limiteAtingido} onInc={() => onInc(it)} onDec={() => onDec(it)} />;
                    })}
                </GrupoIngressos>
            ))}
        </div>
    );
}

/** Accordion de um grupo de ingressos (cabeçalho com ícone + nome + chevron). */
function GrupoIngressos({ nome, children }: { nome: string; children: React.ReactNode }) {
    const [aberto, setAberto] = useState(true);
    return (
        <div className="overflow-clip rounded-2xl ring-1 ring-border-secondary">
            <button type="button" onClick={() => setAberto((v) => !v)} aria-expanded={aberto} className="flex w-full items-center gap-2.5 px-4 py-3.5 text-left transition hover:bg-primary_hover">
                <QrCode01 className="size-5 shrink-0 text-fg-brand-primary" />
                <span className="flex-1 text-sm font-bold text-primary">{nome}</span>
                <ChevronDown className={cx("size-5 shrink-0 text-fg-quaternary transition-transform", aberto && "rotate-180")} />
            </button>
            {aberto && <div className="border-t border-secondary px-4">{children}</div>}
        </div>
    );
}

/** Linha de ingresso: nome → lote → descrição → preço + stepper. */
function IngressoRow({ it, qtd, canInc = true, onInc, onDec }: { it: Item; qtd: number; canInc?: boolean; onInc: () => void; onDec: () => void }) {
    return (
        <div className="flex items-center gap-4 border-b border-secondary py-4 last:border-b-0">
            {it.imagem && <img src={it.imagem} alt="" aria-hidden="true" className="size-20 shrink-0 self-start rounded-lg object-cover ring-1 ring-border-secondary" />}
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="text-sm font-bold text-primary">{it.nome}</span>
                {it.lote && <span className="text-sm text-tertiary">{it.lote}</span>}
                {it.descricao && (
                    <div
                        className="text-sm text-tertiary [&_b]:font-semibold [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-4"
                        dangerouslySetInnerHTML={{ __html: it.descricao }}
                    />
                )}
                {it.preco != null && <span className="text-sm font-bold text-primary">{brl(it.preco)}</span>}
            </div>
            <div className="self-end">
                <Stepper qtd={qtd} canInc={canInc} onInc={onInc} onDec={onDec} />
            </div>
        </div>
    );
}

function CartGroupRow({ grupo, onInc, onDec }: { grupo: CartGroup; onInc: () => void; onDec: () => void }) {
    return (
        <li className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-bold text-primary">{grupo.nome}</span>
                    {grupo.lote && <span className="truncate text-sm text-tertiary">{grupo.lote}</span>}
                    {grupo.sub && <span className="truncate text-sm text-tertiary">{grupo.sub}</span>}
                    <span className="text-sm font-bold text-primary tabular-nums">{brl(grupo.precoUnit * grupo.qtd)}</span>
                </div>
                <ResumoQtd qtd={grupo.qtd} onInc={onInc} onDec={onDec} />
            </div>
            {grupo.sublines && grupo.sublines.length > 0 && (
                <ul className="flex flex-col gap-2 pl-7">
                    {grupo.sublines.map((sl, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                            <span className="pt-0.5 text-sm text-tertiary tabular-nums">{sl.qtd}</span>
                            <div className="flex min-w-0 flex-col">
                                <span className="truncate text-sm font-medium text-secondary">{sl.nome}</span>
                                {sl.sub && <span className="truncate text-sm text-tertiary">{sl.sub}</span>}
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
