import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router";
import { AlertTriangle, CheckCircle, ChevronDown, HelpCircle, LayoutRight, InfoCircle, Minus, Package, Plus, QrCode01, Send01, Tag01, Ticket01, Trash01, XClose } from "@untitledui/icons";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Avatar } from "@/components/base/avatar/avatar";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { MarketplaceLayout, accentVars } from "../../components/MarketplaceLayout";
import { LoginModal } from "../../components/LoginModal";
import { AbasCarrossel, ChipLegenda, type AbaItem } from "../components/abas-carrossel";
import { BarraTotal } from "../components/barra-total";
import { CupomModal } from "../components/CupomModal";
import { MeiaSlideout, TaxaSlideout } from "../components/info-slideouts";
import { PrecoBloco, PrecoPar } from "../components/preco-bloco";
import { SelecaoItensModal, type ItemSelecao } from "../components/SelecaoItensModal";
import { TermosModal } from "../components/TermosModal";
import { precoExtraDoItem, TAXA_PRODUTO_PADRAO } from "../data/combos";
import type { Beneficio, ComboDinamico, ComboDinamicoView, ComboFixo, DataEvento, Item, PerguntaEvento, Produto, Quantitativo, TaxaProduto, TaxaServico } from "../data/combos";
import { DEFAULT_CONFIG, STORAGE_KEY, decodeConfig, resolverLinkCurto, type EventConfig } from "../data/config";
import {
    brl,
    escalar,
    faceBeneficio,
    multiplicar,
    PRECO_ZERO,
    precoComTaxa,
    precoDoCombo,
    precoDoProduto,
    nomeDaTaxa,
    ratear,
    somar,
    type Preco,
} from "../utils/preco";

const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

/** Máscara de data DD/MM/AAAA a partir de dígitos (melhor no mobile que o seletor nativo). */
const maskData = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 8);
    if (d.length <= 2) return d;
    if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
    return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};

const TRANSICAO = { duration: 0.18, ease: "easeOut" } as const;

/** Entra pelo lado de onde veio e sai pelo oposto. */
const SLIDE_FADE: Variants = {
    enter: (direcao: number) => ({ opacity: 0, x: direcao * 24 }),
    center: { opacity: 1, x: 0 },
    exit: (direcao: number) => ({ opacity: 0, x: direcao * -24 }),
};

/** Sinal da troca: avançar na tira desliza para um lado, voltar para o outro. */
const useDirecao = (indice: number) => {
    const anterior = useRef(indice);
    const direcao = indice >= anterior.current ? 1 : -1;
    useEffect(() => {
        anterior.current = indice;
    }, [indice]);
    return direcao;
};

/**
 * Caixa do resumo, igual nas três etapas. 3:4 na coluna de 360px dá 480px, que
 * é a altura do cartaz na seleção. Constante única para as etapas não voltarem
 * a divergir quando uma delas for mexida.
 */
const CAIXA_RESUMO = "aspect-[3/4] w-full";

const MESES_EXT = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const dataPorExtenso = (d: DataEvento) => (d.iso ? `${+d.iso.slice(8, 10)} de ${MESES_EXT[+d.iso.slice(5, 7) - 1]} de ${d.iso.slice(0, 4)}` : `${d.dia} ${d.mes} ${d.ano}`);

interface CartSubline {
    nome: string;
    sub?: string;
    qtd: number;
    /** Rateio do valor do pacote nesta sub-linha, não o preço de catálogo do item. */
    valor?: number;
}
interface CartGroup {
    nome: string;
    lote?: string;
    sub?: string;
    /** Preço UNITÁRIO decomposto. O subtotal é derivado, nunca armazenado. */
    preco: Preco;
    qtd: number;
    /** Produto não tem taxa acessória e é separado no resumo. */
    isProduto?: boolean;
    beneficio?: Beneficio;
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
            const saved = localStorage.getItem(STORAGE_KEY);
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

    const taxa = config.taxaServico;

    // Catálogo resolvido por id (ingressos + produtos → Item unificado).
    // A face do ingresso com benefício é DERIVADA da base: face digitada à mão
    // deixa um operador produzir razão diferente de 50% sem o sistema reclamar.
    const itemById = useMemo(() => {
        const map = new Map<string, Item>();
        const faceDoIngresso = (id: string, visitados: string[] = []): number => {
            const ing = config.ingressos.find((x) => x.id === id);
            if (!ing || visitados.includes(id)) return 0;
            if (ing.beneficio === "meia-entrada" && ing.baseId) {
                return faceBeneficio(faceDoIngresso(ing.baseId, [...visitados, id]), ing.percentualBeneficio ?? 0.5);
            }
            return ing.preco ?? 0;
        };
        for (const i of config.ingressos) {
            map.set(i.id, {
                id: i.id,
                nome: i.nome,
                grupo: i.grupo,
                lote: i.lote,
                descricao: i.descricao,
                preco: faceDoIngresso(i.id),
                imagem: i.imagem,
                beneficio: i.beneficio,
                cotaEsgotada: i.cotaEsgotada,
            });
        }
        for (const p of config.produtos) map.set(p.id, { id: p.id, nome: p.nome, preco: p.preco, imagem: p.imagem, isProduto: true });
        return map;
    }, [config]);

    /** Preço all-in de um ingresso ou combo. */
    const precoIngresso = (face: number): Preco => precoComTaxa(face, taxa.aliquota, taxa.nome);
    /** Produto tem cobrança acessória própria: outra alíquota, outro nome. */
    const taxaProduto = config.taxaProduto ?? TAXA_PRODUTO_PADRAO;
    const precoProduto = (face: number): Preco => precoDoProduto(face, taxaProduto);


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
                        // `precoVisivel` não é mais consultado: todo valor que entra no
                        // carrinho aparece na tela antes de entrar (art. 7º §2º).
                        return {
                            ...it,
                            obrigatorio,
                            qtdMin: q?.min ?? (obrigatorio ? 1 : 0),
                            qtdMax: q?.max ?? combo.maxItens,
                        };
                    }),
            }));
        return { id: combo.id, nome: combo.nome, minItens: combo.minItens, maxItens: combo.maxItens, preco: combo.preco, sessoes };
    };

    /**
     * "A partir de" é a menor combinação VÁLIDA: os obrigatórios mais o mínimo
     * de opcionais necessário para satisfazer `minItens`, pelos mais baratos.
     * Anunciar só a base seria subdeclaração, ou seja, drip pricing dentro de
     * um desenho feito para eliminá-lo.
     */
    const precoDoComboDinamico = (combo: ComboDinamico) => {
        const itens = resolverCombo(combo).sessoes.flatMap((s) => s.itens);
        const jaInclusos = itens.reduce((acc, it) => acc + (it.obrigatorio ? (it.qtdMin ?? 1) : 0), 0);
        const faltam = Math.max(0, combo.minItens - jaInclusos);
        const disponiveis = itens
            .filter((it) => !it.obrigatorio)
            .flatMap((it) => Array.from({ length: Math.max(1, it.qtdMax ?? 1) }, () => precoExtraDoItem(it)))
            .sort((a, b) => a - b);
        return {
            preco: precoDoCombo(combo.preco ?? 0, disponiveis.slice(0, faltam), taxa.aliquota),
            /** Há opcional pago capaz de aumentar o valor depois da montagem. */
            variavel: disponiveis.slice(faltam).some((v) => v > 0),
        };
    };

    // Itens resolvidos de uma data (ingressos + produtos).
    const itensDaData = (d: DataEvento): Item[] => [...d.itens, ...d.produtos].map((id) => itemById.get(id)).filter((it): it is Item => !!it);

    const [aba, setAba] = useState<string>(abaInicial);
    const [cupomOpen, setCupomOpen] = useState(false);
    const [cupom, setCupom] = useState<{ codigo: string; ajuda: string } | null>(null);
    const [comboSelecao, setComboSelecao] = useState<ComboDinamicoView | null>(null);
    const [cart, setCart] = useState<Record<string, CartGroup>>({});
    /**
     * Último item adicionado, para o resumo rolar até ele.
     *
     * Carrega um nonce porque o gatilho é a ADIÇÃO, não o estado do carrinho:
     * depender de `cart` fazia a remoção reexecutar o efeito com a chave antiga
     * e rolar sem motivo. E adicionar o mesmo item duas vezes precisa disparar
     * de novo, o que a chave sozinha não garante.
     */
    const [ultimoItem, setUltimoItem] = useState<{ chave: string; n: number } | null>(null);
    const contadorAdicao = useRef(0);
    const marcarAdicao = (chave: string) => setUltimoItem({ chave, n: ++contadorAdicao.current });
    const resumoCorpoRef = useRef<HTMLDivElement>(null);

    /**
     * Rola o resumo até o item recém-adicionado. Só age quando o miolo de fato
     * transborda: com o carrinho curto não há o que rolar, e no primeiro item a
     * medição aconteceria em pleno giro do cartaz, com as caixas já rotacionadas.
     */
    useEffect(() => {
        if (!ultimoItem) return;
        const cont = resumoCorpoRef.current;
        if (!cont || cont.scrollHeight <= cont.clientHeight) return;
        const alvo = [...cont.querySelectorAll<HTMLElement>("[data-item]")].find((el) => el.dataset.item === ultimoItem.chave);
        if (!alvo) return;
        const caixa = alvo.getBoundingClientRect();
        const janela = cont.getBoundingClientRect();
        if (caixa.top < janela.top) cont.scrollBy({ top: caixa.top - janela.top - 12, behavior: "smooth" });
        else if (caixa.bottom > janela.bottom) cont.scrollBy({ top: caixa.bottom - janela.bottom + 12, behavior: "smooth" });
    }, [ultimoItem]);

    const [detalhes, setDetalhes] = useState<Record<string, boolean>>({});
    const [resumoAberto, setResumoAberto] = useState(false);
    // Painéis de informação legal. Abrem sobre a tela para não destruir o carrinho.
    const [taxaOpen, setTaxaOpen] = useState(false);
    const [meiaOpen, setMeiaOpen] = useState(false);
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
    const setFixo = (combo: ComboFixo, delta: number) => {
        if (delta > 0) marcarAdicao(`fixo:${combo.id}`);
        setCart((prev) => {
            const key = `fixo:${combo.id}`;
            const novo = Math.max(0, (prev[key]?.qtd ?? 0) + delta);
            const next = { ...prev };
            if (novo === 0) delete next[key];
            else {
                // Sub-linhas exibem o RATEIO do preço do pacote, não o preço de
                // catálogo de cada item: o pacote tem desconto e listar catálogo
                // abriria um buraco visível entre as linhas e o total.
                const partes = ratear(combo.preco, combo.inclui.map((i) => i.qtd));
                next[key] = {
                    nome: combo.nome,
                    lote: combo.lote,
                    preco: precoIngresso(combo.preco),
                    qtd: novo,
                    // Sub-linha guarda o valor de UM pacote. A multiplicação pela
                    // quantidade do grupo acontece na renderização, que lê a `qtd`
                    // viva: gravar já multiplicado deixava a discriminação velha
                    // sempre que a quantidade mudasse por outro caminho — o "+" do
                    // resumo não repassa por aqui.
                    sublines: combo.inclui.map((i, idx) => ({ nome: i.titulo, sub: i.sub, qtd: i.qtd, valor: partes[idx] })),
                };
            }
            return next;
        });
    };

    const setData = (data: DataEvento, item: Item, delta: number) => {
        if (delta > 0) marcarAdicao(`data:${data.id}:${item.id}`);
        setCart((prev) => {
            const key = `data:${data.id}:${item.id}`;
            const novo = Math.max(0, (prev[key]?.qtd ?? 0) + delta);
            const next = { ...prev };
            if (novo === 0) delete next[key];
            else
                next[key] = {
                    nome: item.nome,
                    lote: item.grupo,
                    sub: `${data.diaSemana.slice(0, 3).toLowerCase()}, ${data.dia}/${data.mes}${data.hora ? ` · ${data.hora}` : ""}`,
                    preco: precoIngresso(item.preco ?? 0),
                    qtd: novo,
                    beneficio: item.beneficio,
                };
            return next;
        });
    };

    const confirmarSelecao = (combo: ComboDinamicoView, selecoes: ItemSelecao[]) => {
        const itemDoCombo = (sessaoId: string, itemId: string) => combo.sessoes.find((x) => x.id === sessaoId)?.itens.find((x) => x.id === itemId);
        // Mesmo predicado e mesma função de preço que o modal usa: os dois não podem divergir.
        const extras = selecoes.map((s) => {
            const item = itemDoCombo(s.sessaoId, s.itemId);
            return item ? precoExtraDoItem(item) * s.quantidade : 0;
        });
        const preco = precoDoCombo(combo.preco ?? 0, extras, taxa.aliquota);
        const pesos = selecoes.map((s) => (itemDoCombo(s.sessaoId, s.itemId)?.preco ?? 0) * s.quantidade);
        const partes = ratear(preco.face, pesos);
        marcarAdicao(`din:${combo.id}`);
        setCart((prev) => {
            const next: Record<string, CartGroup> = {};
            for (const [k, v] of Object.entries(prev)) if (k !== `din:${combo.id}`) next[k] = v;
            next[`din:${combo.id}`] = {
                nome: combo.nome,
                preco,
                qtd: 1,
                sublines: selecoes.map((s, i) => ({ nome: s.nome, sub: `${s.data} • ${s.hora}`, qtd: s.quantidade, valor: partes[i] })),
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
    const adicionarUnidade = (key: string) => {
        marcarAdicao(key);
        setCart((prev) => {
            const g = prev[key];
            if (!g) return prev;
            return { ...prev, [key]: { ...g, qtd: g.qtd + 1 } };
        });
    };

    const grupos = Object.entries(cart);
    const totalItens = grupos.reduce((acc, [, g]) => acc + g.qtd, 0);

    /**
     * Total do carrinho. A taxa agregada é SOMA das taxas unitárias, nunca
     * recálculo sobre o subtotal, senão o total diverge da soma das linhas.
     */
    const totalPreco = useMemo(() => somar(Object.values(cart).map((g) => multiplicar(g.preco, g.qtd))), [cart]);

    /**
     * Cobranças acessórias agrupadas POR NOME, na ordem em que aparecem no
     * carrinho. Uma linha por cobrança: taxa de serviço do ingresso e
     * licenciamento do produto são cobranças distintas e não podem sair somadas
     * sob um rótulo só (art. 6º).
     */
    const taxasDoPedido = useMemo(() => {
        const porNome = new Map<string, number>();
        for (const g of Object.values(cart)) {
            const p = multiplicar(g.preco, g.qtd);
            if (p.taxa <= 0) continue;
            const nome = nomeDaTaxa(p);
            porNome.set(nome, (porNome.get(nome) ?? 0) + p.taxa);
        }
        return Array.from(porNome, ([nome, valor]) => ({ nome, valor: Math.round(valor * 100) / 100 }));
    }, [cart]);

    /**
     * Espaçador do rodapé mobile medido, não cravado.
     * Era `h-36` calibrado à mão para o rodapé antigo; a barra nova é mais alta
     * e o valor fixo passaria a cobrir o fim da página. Congela enquanto o
     * resumo está aberto, senão o espaçador saltaria junto com o accordion.
     */
    const rodapeRef = useRef<HTMLDivElement | null>(null);
    const [rodapeAltura, setRodapeAltura] = useState(0);
    useEffect(() => {
        if (totalItens === 0) {
            setRodapeAltura(0);
            return;
        }
        const el = rodapeRef.current;
        if (!el) return;
        const medir = () => {
            if (!resumoAberto) setRodapeAltura(el.offsetHeight);
        };
        const ro = new ResizeObserver(medir);
        ro.observe(el);
        medir();
        return () => ro.disconnect();
    }, [totalItens, resumoAberto]);


    // Produtos no carrinho (soma de todas as variações).
    const prodQtd = (id: string) => grupos.filter(([k]) => k === `prod:${id}` || k.startsWith(`prod:${id}:`)).reduce((a, [, g]) => a + g.qtd, 0);
    const setProd = (prod: Produto, size: string | null, delta: number) => {
        if (delta > 0) marcarAdicao(size ? `prod:${prod.id}:${size}` : `prod:${prod.id}`);
        setCart((prev) => {
            const key = size ? `prod:${prod.id}:${size}` : `prod:${prod.id}`;
            const novo = Math.max(0, (prev[key]?.qtd ?? 0) + delta);
            const next = { ...prev };
            if (novo === 0) delete next[key];
            else next[key] = { nome: prod.nome, sub: size ? `Tamanho ${size}` : undefined, preco: precoProduto(prod.preco ?? 0), qtd: novo, isProduto: true };
            return next;
        });
    };
    const setProdQtd = (prod: Produto, size: string | null, n: number) => {
        const chave = size ? `prod:${prod.id}:${size}` : `prod:${prod.id}`;
        // Só rola quando a quantidade SOBE: este mesmo caminho atende o "−".
        if (n > (cart[chave]?.qtd ?? 0)) marcarAdicao(chave);
        setCart((prev) => {
            const key = size ? `prod:${prod.id}:${size}` : `prod:${prod.id}`;
            const next = { ...prev };
            if (!n || n <= 0) delete next[key];
            else next[key] = { nome: prod.nome, sub: size ? `Tamanho ${size}` : undefined, preco: precoProduto(prod.preco ?? 0), qtd: n, isProduto: true };
            return next;
        });
    };
    const temProdutos = config.produtos.length > 0;

    const fixoTabAtiva = fixoTabs.find((t) => t.id === aba);
    const dataAtiva = datasVenda.find((d) => d.id === aba);

    // Se a aba ativa deixou de existir (ex: desmarcar "Datas" ou "Combo"),
    // volta automaticamente para a primeira aba válida.
    const abaValida = !!fixoTabAtiva || (aba === "combo" && temDinamicos) || !!dataAtiva;
    useEffect(() => {
        if (!abaValida) setAba(abaInicial);
    }, [abaValida, abaInicial]);

    // Para o teste: todas as perguntas do evento aparecem em cada item comprado (combo conta como 1).
    const perguntasDoGrupo = (_key: string) => config.perguntas;

    // Cada unidade (ingresso ou produto) vira um item atribuível. Produtos não têm questionário.
    const unidades = grupos.flatMap(([key, g]) => {
        const isProduto = key.startsWith("prod:");
        const imagem = isProduto ? config.produtos.find((p) => p.id === key.split(":")[1])?.imagem : undefined;
        return Array.from({ length: g.qtd }, (_, i) => ({
            id: `${key}#${i}`,
            key,
            nome: g.nome,
            sub: g.sub,
            isProduto,
            imagem,
            ehMeia: g.beneficio === "meia-entrada",
        }));
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
        // Art. 7º caput: o valor também tem de existir na última fase da compra.
        sp.set("t", totalPreco.total.toFixed(2));
        sp.set("x", totalPreco.taxa.toFixed(2));
        // Discriminação nominal, não só o agregado: na última fase o comprador
        // precisa ver a mesma decomposição que viu na barra, e um agregado de
        // duas cobranças rotulado com o nome de uma delas é cobrança trocada.
        if (taxasDoPedido.length) sp.set("xd", JSON.stringify(taxasDoPedido));
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
    // Uma fileira só, que rola. Empilhado, o seletor deixava de ler como um
    // controle único e empurrava o catálogo para baixo da dobra no mobile.
    const itensAba: AbaItem[] = [
        // Sem classe de cor nas linhas principais: elas herdam do chip, que inverte.
        ...fixoTabs.map((t) => ({
            id: t.id,
            conteudo: () => <span className="px-2 text-sm font-semibold">{t.label}</span>,
        })),
        ...(temDinamicos
            ? [
                  {
                      id: "combo",
                      conteudo: () => <span className="px-2 text-sm font-semibold">{config.comboTabLabel || "Combo dinâmico"}</span>,
                  },
              ]
            : []),
        ...datasVenda.map((d) => ({
            id: d.id,
            conteudo: (ativo: boolean) => (
                <>
                    <ChipLegenda ativo={ativo}>{d.diaSemana}</ChipLegenda>
                    <span className="text-md font-bold">
                        {d.dia} {d.mes}
                    </span>
                    <ChipLegenda ativo={ativo}>{d.ano}</ChipLegenda>
                </>
            ),
        })),
    ];

    const abas = <AbasCarrossel abas={itensAba} ativa={aba} ariaLabel="Datas e combos à venda" onSelecionar={setAba} />;
    const direcaoAba = useDirecao(itensAba.findIndex((i) => i.id === aba));

    const conteudoItens = fixoTabAtiva ? (
        <div className="mt-6 flex flex-col gap-4">
            {fixoTabAtiva.combos.map((combo) => (
                <ComboFixoView
                    key={combo.id}
                    combo={combo}
                    taxa={taxa}
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
            {config.combosDinamicos.map((combo) => {
                const { preco, variavel } = precoDoComboDinamico(combo);
                return (
                    <ComboDinamicoCard
                        key={combo.id}
                        combo={combo}
                        preco={preco}
                        variavel={variavel}
                        taxa={taxa}
                        onSelecionar={() => setComboSelecao(resolverCombo(combo))}
                    />
                );
            })}
        </div>
    ) : dataAtiva ? (
        <ItensPorData
            data={dataAtiva}
            itens={itensDaData(dataAtiva)}
            cart={cart}
            taxa={taxa}
            quantitativo={config.quantitativoPorGrupo}
            onInc={(it) => setData(dataAtiva, it, 1)}
            onDec={(it) => setData(dataAtiva, it, -1)}
            onAbrirMeia={() => setMeiaOpen(true)}
        />
    ) : (
        <div className="mt-6 flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-secondary px-6 text-center text-sm text-tertiary">
            Nada configurado para esta aba.
        </div>
    );

    const conteudo = (
        <div className="flex flex-col">
            {/*
              `mode="wait"` e a key da aba: a lista antiga sai inteira antes de a nova
              entrar, e a remontagem devolve os agrupadores ao estado fechado.
            */}
            <AnimatePresence mode="wait" initial={false} custom={direcaoAba}>
                <motion.div
                    key={aba}
                    custom={direcaoAba}
                    variants={SLIDE_FADE}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={TRANSICAO}
                >
                    {conteudoItens}
                </motion.div>
            </AnimatePresence>
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

    const barraTotal = (variante: "desktop" | "mobile", comoCard?: boolean) => (
        <BarraTotal variante={variante} total={totalPreco} taxas={taxasDoPedido} continuarDisabled={continuarDisabled} comoCard={comoCard} onAvancar={avancar} onAbrirTaxa={() => setTaxaOpen(true)} />
    );
    const totalBar = barraTotal("desktop");

    const ingressosCart = grupos.filter(([k]) => !k.startsWith("prod:"));
    const produtosCart = grupos.filter(([k]) => k.startsWith("prod:"));
    const limparIngressos = () => setCart((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => k.startsWith("prod:"))));
    const limparProdutos = () => setCart((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith("prod:"))));

    const SecaoHeader = ({ titulo, onLimpar }: { titulo: string; onLimpar: () => void }) => (
        <div className="flex items-center gap-3">
            <span className="shrink-0 text-sm font-semibold text-tertiary">{titulo}</span>
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
                            <CartGroupRow key={key} chave={key} grupo={g} onInc={() => adicionarUnidade(key)} onDec={() => removerUnidade(key)} />
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
                                <CartGroupRow
                                    key={key}
                                    chave={key}
                                    grupo={g}
                                    imagem={produto?.imagem}
                                    onInc={() => produto && setProdQtd(produto, size ?? null, g.qtd + 1)}
                                    onDec={() => produto && setProdQtd(produto, size ?? null, g.qtd - 1)}
                                />
                            );
                        })}
                    </ul>
                </section>
            )}
        </>
    );

    /**
     * Miolo do resumo. Fonte única do card lateral (atribuição e produtos) e do
     * verso do cartaz: o layout sem mapa tinha uma cópia que já havia perdido o
     * scroll interno e o teto de altura.
     */
    const resumoInterno = (
        <>
            <header className="flex shrink-0 items-baseline justify-between gap-3 border-b border-secondary px-4 py-3.5">
                <h3 className="text-sm font-semibold text-primary">Resumo da compra</h3>
                {totalItens > 0 && (
                    <span className="text-sm text-tertiary tabular-nums">
                        {totalItens} {totalItens === 1 ? "item" : "itens"}
                    </span>
                )}
            </header>
            <div ref={resumoCorpoRef} className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
                {resumoSecoes}
            </div>
            <div className="shrink-0">{totalBar}</div>
        </>
    );

    /*
      Mesma caixa 3:4 do cartaz que vira na seleção (360 × 480 na coluna), e não
      `max-h`, que fazia o card crescer e encolher com o carrinho e mudar de
      tamanho na troca de etapa. O miolo já rola por dentro.

      O miolo vai em `absolute inset-0`, exatamente como a face de trás do
      cartaz. Em fluxo normal o `aspect-ratio` é só altura PREFERIDA: a altura
      mínima automática do flex item é a de min-content, então o carrinho
      empurrava o card para além de 480 e produto e atribuição ficavam mais
      altos que a seleção. Fora do fluxo não existe min-content para empurrar.
    */
    const resumoCard = (
        <div className={cx(CAIXA_RESUMO, "relative hidden lg:block")}>
            <div className="absolute inset-0 flex flex-col overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">{resumoInterno}</div>
        </div>
    );

    const progresso = unidades.length > 0 ? Math.round((unidadesProntas / unidades.length) * 100) : 0;
    /**
     * Mesma caixa da seleção, para a troca de etapa não deslocar a página.
     * Com mapa a seleção é full-bleed (grid 1fr + 640px), sem mapa ela são duas
     * colunas de 640 e 360 centralizadas.
     */
    const colunaEtapa = config.mapa ? "lg:flex-1" : "lg:w-[640px]";
    const atribuicaoLayout = (
        <div className="mx-auto flex w-full flex-col gap-6 lg:flex-row lg:justify-center">
            <div className={cx("flex w-full flex-col gap-8 px-4 md:px-0", colunaEtapa)}>
                <h2 className="text-lg font-bold text-primary">{unidades.length > 1 ? "Para quem são essas inscrições?" : "Para quem é essa inscrição?"}</h2>

                {unidades.map((u) =>
                    config.modoAtribuicao === "accordion" ? (
                        <AtribuicaoAccordionCard
                            key={u.id}
                            unidade={u}
                            valor={atrib[u.id]}
                            perguntas={perguntasDaUnidade(u)}
                            getResposta={(pid) => respostas[`${u.id}:${pid}`] ?? ""}
                            onResposta={(pid, val) => setRespostas((p) => ({ ...p, [`${u.id}:${pid}`]: val }))}
                            onAtrib={(v) => setAtrib((p) => ({ ...p, [u.id]: v }))}
                            onRemover={() => removerUnidade(u.key)}
                        />
                    ) : (
                        <AtribuicaoCard
                            key={u.id}
                            unidade={u}
                            valor={atrib[u.id]}
                            perguntas={perguntasDaUnidade(u)}
                            getResposta={(pid) => respostas[`${u.id}:${pid}`] ?? ""}
                            onAtrib={(v) => setAtrib((p) => ({ ...p, [u.id]: v }))}
                            onAbrirPerguntas={() => setPerguntaModalUnidade(u.id)}
                            onRemover={() => removerUnidade(u.key)}
                        />
                    ),
                )}
            </div>
            <div className="flex w-full flex-col gap-4 lg:sticky lg:top-4 lg:w-[360px] lg:shrink-0 lg:self-start">{grupos.length > 0 && resumoCard}</div>
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
            <div className="h-[260px] overflow-clip bg-secondary lg:h-full lg:rounded-2xl lg:ring-1 lg:ring-border-secondary">
                {config.mapa ? (
                    <img src={config.mapa} alt="Mapa do local" className="h-full w-full object-cover" />
                ) : (
                    <BannerEvento capa={config.capa} nome={config.nome} />
                )}
            </div>
            <div className="flex w-full flex-col gap-4 lg:h-full lg:min-h-0 lg:max-w-[640px]">
                {cupomBlock}
                <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1">
                    <div className="flex flex-col px-4 md:px-0 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                        {dataHeader}
                        {conteudo}
                    </div>
                    {totalItens > 0 && <div className="hidden lg:block">{barraTotal("desktop", true)}</div>}
                </div>
            </div>
        </div>
    );

    const produtosLayout = (
        <div className="mx-auto flex w-full flex-col gap-6 lg:flex-row lg:justify-center">
            <div className={cx("flex w-full flex-col gap-4 px-4 md:px-0", colunaEtapa)}>
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-xl font-bold text-primary">Leve mais do que o ingresso</h2>
                    <p className="text-sm text-tertiary">Compre online e retire no dia do evento.</p>
                </div>
                <div className={cx("grid grid-cols-2 gap-4 lg:grid-cols-3", config.mapa && "xl:grid-cols-4")}>
                    {config.produtos.map((p) => (
                        <ProdutoCard key={p.id} produto={p} taxaProduto={taxaProduto} qtd={prodQtd(p.id)} onAbrirVariacao={() => setVariacaoProduto(p)} onSetQtd={(n) => setProdQtd(p, null, n)} />
                    ))}
                </div>
            </div>
            <div className="flex w-full flex-col gap-4 lg:sticky lg:top-4 lg:w-[360px] lg:shrink-0 lg:self-start">{grupos.length > 0 && resumoCard}</div>
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
                    <div className="h-[320px] overflow-clip bg-secondary lg:h-full lg:rounded-2xl lg:ring-1 lg:ring-border-secondary">
                        <img src={config.mapa} alt="Mapa do local" className="h-full w-full object-cover" />
                    </div>

                    <div className="flex w-full flex-col gap-4 lg:h-full lg:min-h-0 lg:max-w-[640px]">
                        {cupomBlock}
                        <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1">
                            <div className="flex flex-col px-4 md:px-0 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                                {abas}
                                {conteudo}
                            </div>
                            {totalItens > 0 && <div className="hidden lg:block">{barraTotal("desktop", true)}</div>}
                        </div>
                    </div>
                </div>
            ) : (
                /* Layout sem mapa: seleção à esquerda, capa + cupom + resumo à direita */
                <div className="flex w-full flex-col gap-6 lg:flex-row lg:justify-center">
                    <div className="flex w-full flex-col px-4 md:px-0 lg:w-[640px]">
                        {abas}
                        {conteudo}
                    </div>

                    {/* `self-start` é o que faz o sticky funcionar: sem ele o item do
                        flex estica até a altura da linha e nunca tem para onde grudar.
                        Só em lg, porque no mobile a coluna é uma pilha normal. */}
                    <div className="flex w-full flex-col gap-4 lg:sticky lg:top-4 lg:w-[360px] lg:shrink-0 lg:self-start">
                        {cupomBlock}
                        <CartazComVerso
                            virado={grupos.length > 0}
                            frente={<BannerEvento capa={config.capa} nome={config.nome} />}
                            verso={resumoInterno}
                        />
                    </div>
                </div>
            )}

            {/* Resumo fixo no rodapé — apenas mobile, expansível. Em portal no body para ir de ponta a ponta. */}
            {totalItens > 0 && <div className="lg:hidden" style={{ height: rodapeAltura }} aria-hidden="true" />}
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
                                ref={rodapeRef}
                                className="fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-2xl bg-primary shadow-lg ring-1 ring-border-secondary lg:hidden"
                                style={accentVars(config.corDestaque || undefined)}
                            >
                        <button
                            type="button"
                            onClick={() => setResumoAberto((o) => !o)}
                            className="flex items-center justify-between gap-3 border-b border-secondary px-4 py-3"
                        >
                            <span className="flex items-baseline gap-2 text-sm font-semibold text-primary">
                                Resumo da compra
                                <span className="text-sm font-normal text-tertiary tabular-nums">
                                    {totalItens} {totalItens === 1 ? "item" : "itens"}
                                </span>
                            </span>
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

                        {/* Total e composição ficam FORA do accordion: com o resumo fechado,
                            que é o estado inicial, a tela já precisa mostrar o valor. */}
                        {barraTotal("mobile")}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>,
                document.body,
            )}

            <VariacaoModal
                produto={variacaoProduto}
                taxaProduto={taxaProduto}
                getQtd={(size) => (variacaoProduto ? (cart[`prod:${variacaoProduto.id}:${size}`]?.qtd ?? 0) : 0)}
                onAdd={(size) => variacaoProduto && setProd(variacaoProduto, size, 1)}
                onSetQtd={(size, n) => variacaoProduto && setProdQtd(variacaoProduto, size, n)}
                onClose={() => setVariacaoProduto(null)}
            />
            <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} logoEvento={config.logo || undefined} onSucesso={aoLogar} />
            <SelecaoItensModal combo={comboSelecao} taxa={taxa} onClose={() => setComboSelecao(null)} onConfirmar={confirmarSelecao} />
            <CupomModal isOpen={cupomOpen} onClose={() => setCupomOpen(false)} onAplicar={aplicarCupom} />
            <TaxaSlideout isOpen={taxaOpen} onClose={() => setTaxaOpen(false)} taxa={taxa} taxaProduto={taxaProduto} />
            <MeiaSlideout
                isOpen={meiaOpen}
                onClose={() => setMeiaOpen(false)}
                quantitativo={config.quantitativoPorGrupo}
                percentualVendido={config.percentualMeiaVendido}
            />
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

/* ------------------------------------------------------------------ */
/*  Informações da meia-entrada                                       */
/* ------------------------------------------------------------------ */

const ACESSOS_MEIA = [
    {
        secao: "quem-tem-direito",
        titulo: "Regras da meia-entrada",
        descricao: "Quem tem direito e quais são as condições previstas em lei.",
        acao: "Conferir regras da meia-entrada",
    },
    {
        secao: "cie",
        titulo: "Documento comprobatório",
        descricao: "Confira o documento aceito e saiba como identificar uma CIE válida.",
        acao: "Conferir exemplo da CIE",
    },
    {
        secao: "fiscalizacao",
        titulo: "Órgãos de fiscalização",
        descricao: "Consulte os contatos dos órgãos responsáveis pela fiscalização.",
        acao: "Conferir contatos",
    },
];

/**
 * Informações da meia-entrada, dentro do card da unidade e só quando a unidade
 * é de meia. Antes era um bloco único no topo da etapa, que aparecia mesmo
 * quando nenhuma unidade do pedido tinha o benefício e não dizia a qual
 * ingresso se referia.
 *
 * `-mx-4` sangra a faixa até as bordas do card, que tem `p-4`.
 */
function InfoMeiaEntrada() {
    return (
        <div className="-mx-4 flex gap-3 border-y border-secondary bg-secondary px-4 py-3.5">
            <InfoCircle className="mt-0.5 size-5 shrink-0 text-fg-quaternary" />
            <div className="grid flex-1 gap-x-6 gap-y-4 sm:grid-cols-3">
                {ACESSOS_MEIA.map((a) => (
                    <div key={a.secao} className="flex min-w-0 flex-col gap-1">
                        <span className="text-sm font-semibold text-primary">{a.titulo}</span>
                        <p className="flex-1 text-sm leading-relaxed text-tertiary">{a.descricao}</p>
                        {/* Nova aba: sair da rota aqui custaria o carrinho inteiro. */}
                        <a
                            href={`/marketplace/meia-entrada?secao=${a.secao}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-primary underline-offset-2 transition duration-100 ease-linear hover:underline"
                        >
                            {a.acao}
                        </a>
                    </div>
                ))}
            </div>
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
}: {
    unidade: { id: string; key: string; nome: string; sub?: string; isProduto?: boolean; imagem?: string; ehMeia?: boolean };
    valor?: { tipo: "meu" | "outro"; email: string; confirmado?: boolean };
    perguntas: PerguntaEvento[];
    getResposta: (pid: string) => string;
    onAtrib: (v: { tipo: "meu" | "outro"; email: string; confirmado?: boolean }) => void;
    onAbrirPerguntas: () => void;
    onRemover: () => void;
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
        <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="flex flex-col gap-4 rounded-xl bg-primary p-4 ring-1 ring-border-secondary">
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

            {unidade.ehMeia && <InfoMeiaEntrada />}

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

        </motion.div>
    );
}

/** Badge compacto de status do formulário exibido no cabeçalho de cada linha do accordion. */
function FormBadge({ ok }: { ok: boolean }) {
    return (
        <span
            className={cx(
                "shrink-0 rounded-md px-2 py-0.5 text-sm font-medium",
                ok ? "bg-success-secondary text-success-primary" : "bg-warning-secondary text-warning-primary",
            )}
        >
            {ok ? "Formulário completo" : "Responda o formulário"}
        </span>
    );
}

/**
 * Variante da atribuição em accordion: cada opção é uma linha expansível e o
 * questionário aparece inline (sem modal). Usada quando config.modoAtribuicao === "accordion".
 */
function AtribuicaoAccordionCard({
    unidade,
    valor,
    perguntas,
    getResposta,
    onResposta,
    onAtrib,
    onRemover,
}: {
    unidade: { id: string; key: string; nome: string; sub?: string; isProduto?: boolean; imagem?: string; ehMeia?: boolean };
    valor?: { tipo: "meu" | "outro"; email: string; confirmado?: boolean };
    perguntas: PerguntaEvento[];
    getResposta: (pid: string) => string;
    onResposta: (pid: string, val: string) => void;
    onAtrib: (v: { tipo: "meu" | "outro"; email: string; confirmado?: boolean }) => void;
    onRemover: () => void;
}) {
    const tipo = valor?.tipo;
    const email = valor?.email ?? "";
    const confirmado = !!valor?.confirmado;
    const obrigatoriasOk = perguntas.filter((p) => p.obrigatoria).every((p) => getResposta(p.id).trim() !== "");
    const emailInvalido = tipo === "outro" && email.trim() !== "" && !emailValido(email);
    const [enviando, setEnviando] = useState(false);
    const [aberta, setAberta] = useState<"meu" | "outro" | null>(tipo ?? null);

    // Enviar convite: loading simulado, depois confirma o destinatário.
    const enviar = () => {
        if (!emailValido(email) || enviando) return;
        setEnviando(true);
        setTimeout(() => {
            setEnviando(false);
            onAtrib({ tipo: "outro", email, confirmado: true });
        }, 900);
    };

    const opcoes: { id: "meu" | "outro"; label: string }[] = [
        { id: "meu", label: unidade.isProduto ? "Meu produto" : "Meu ingresso" },
        { id: "outro", label: "Atribuir a outro usuário" },
    ];

    // Clique no cabeçalho: seleciona a opção (se ainda não for a atual) e abre; se já for a atual, alterna aberto/fechado.
    const aoClicarCabecalho = (id: "meu" | "outro") => {
        if (tipo !== id) {
            onAtrib(id === "meu" ? { tipo: "meu", email } : { tipo: "outro", email, confirmado });
            setAberta(id);
        } else {
            setAberta((a) => (a === id ? null : id));
        }
    };

    // Questionário inline + botão "Salvar respostas" (recolhe a linha ao salvar).
    const questionario = perguntas.length > 0 && (
        <div className="flex flex-col gap-4">
            <span className="text-md font-bold text-primary">Formulário do atleta</span>
            {perguntas.map((p) => (
                <CampoPergunta key={p.id} pergunta={p} valor={getResposta(p.id)} onChange={(v) => onResposta(p.id, v)} />
            ))}
            <Button size="md" color="primary" className="w-full" onClick={() => setAberta(null)}>
                Salvar respostas
            </Button>
        </div>
    );

    return (
        <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="flex flex-col gap-4">
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

            {unidade.ehMeia && <InfoMeiaEntrada />}

            <div className="overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
                {opcoes.map((o, i) => {
                    const selecionado = tipo === o.id;
                    const expandida = aberta === o.id;
                    const mostrarBadge = selecionado && perguntas.length > 0 && (o.id === "meu" || confirmado);
                    return (
                        <div key={o.id} className={cx(i > 0 && "border-t border-secondary")}>
                            <button type="button" onClick={() => aoClicarCabecalho(o.id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                                <span className={cx("flex size-5 shrink-0 items-center justify-center rounded-full ring-2", selecionado ? "ring-brand" : "ring-secondary")}>
                                    {selecionado && <span className="size-2.5 rounded-full bg-brand-solid" />}
                                </span>
                                <span className={cx("min-w-0 flex-1 text-sm font-medium", selecionado ? "text-primary" : "text-tertiary")}>{o.label}</span>
                                {mostrarBadge && <FormBadge ok={obrigatoriasOk} />}
                                <ChevronDown className={cx("size-5 shrink-0 text-fg-quaternary transition duration-200", expandida && "rotate-180")} />
                            </button>

                            <AnimatePresence initial={false}>
                                {expandida && (
                                    <motion.div key="body" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="overflow-hidden">
                                        <div className="flex flex-col gap-4 px-4 pb-4">
                                            {o.id === "meu" && questionario}

                                            {o.id === "outro" && !confirmado && (
                                                <div className="flex flex-col gap-1.5">
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
                                            )}

                                            {o.id === "outro" && confirmado && (
                                                <>
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
                                                    {questionario}
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

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

function ProdutoCard({ produto, taxaProduto, qtd, onAbrirVariacao, onSetQtd }: { produto: Produto; taxaProduto: TaxaProduto; qtd: number; onAbrirVariacao: () => void; onSetQtd: (n: number) => void }) {
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
                {/* Mesmo bloco de valor da linha de ingresso: total em cima, item e taxa embaixo. */}
                {produto.preco != null && (
                    <PrecoPar preco={precoDoProduto(produto.preco, taxaProduto)} className="mt-0.5" />
                )}
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
    taxaProduto,
    getQtd,
    onAdd,
    onSetQtd,
    onClose,
}: {
    produto: Produto | null;
    taxaProduto: TaxaProduto;
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
    const totalEscolhido = escolhidas.reduce((acc, v) => acc + getQtd(v) * (produto.preco ?? 0), 0);

    return (
        <ModalOverlay isOpen={produto !== null} onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal className="sm:max-w-[760px]">
                <Dialog>
                    <div className="flex max-h-[85vh] w-full flex-col overflow-clip rounded-2xl bg-primary shadow-xl ring-1 ring-border-secondary md:flex-row">
                        {produto.imagem && <img src={produto.imagem} alt="" className="aspect-square w-full shrink-0 object-cover md:max-h-[440px] md:w-1/2" />}
                        <div className="flex min-h-0 flex-1 flex-col">
                            <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-2">
                                <div className="flex flex-col gap-1">
                                    <h2 className="text-lg font-semibold text-primary">{produto.nome}</h2>
                                    {produto.preco != null && (
                                        <PrecoPar preco={precoDoProduto(produto.preco, taxaProduto)} />
                                    )}
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

                            {/* O modal somava quantidades sem exibir valor nenhum. */}
                            <div className="flex shrink-0 items-end justify-between gap-3 border-t border-secondary px-6 py-4">
                                <PrecoBloco preco={precoDoProduto(totalEscolhido, taxaProduto)} rotulo="Total selecionado" />
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

function Stepper({
    qtd,
    canDec = true,
    canInc = true,
    rotulo,
    onInc,
    onDec,
}: {
    qtd: number;
    canDec?: boolean;
    canInc?: boolean;
    /** Nome do item. Sem ele, um grupo de 4 ingressos anuncia 4 pares idênticos. */
    rotulo?: string;
    onInc: () => void;
    onDec: () => void;
}) {
    const sufixo = rotulo ? ` quantidade de ${rotulo}` : "";
    return (
        <div className="flex shrink-0 items-center gap-2">
            <button
                type="button"
                onClick={onDec}
                disabled={qtd === 0 || !canDec}
                aria-label={`Diminuir${sufixo}`}
                className="flex size-9 items-center justify-center rounded-md bg-brand-solid text-white transition hover:bg-brand-solid_hover disabled:cursor-not-allowed disabled:bg-secondary disabled:text-fg-quaternary"
            >
                <Minus className="size-4" />
            </button>
            <span className="w-5 text-center text-sm font-semibold text-primary tabular-nums">{qtd}</span>
            <button
                type="button"
                onClick={onInc}
                disabled={!canInc}
                aria-label={`Aumentar${sufixo}`}
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
    taxa,
    aberto,
    onToggleDetalhes,
    onInc,
    onDec,
}: {
    combo: ComboFixo;
    qtd: number;
    taxa: TaxaServico;
    aberto: boolean;
    onToggleDetalhes: () => void;
    onInc: () => void;
    onDec: () => void;
}) {
    const datas = combo.inclui.map((i) => i.sub).filter(Boolean) as string[];
    const preco = precoComTaxa(combo.preco, taxa.aliquota, taxa.nome);
    // Rateio do preço do pacote, com o resíduo na última linha: a lista sempre
    // fecha com o total impresso logo abaixo dela.
    const partes = ratear(combo.preco, combo.inclui.map((i) => i.qtd));
    return (
        <div className="flex flex-col overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
            {/* Duas faixas, como na linha de ingresso: identificação em cima e,
                embaixo, preço e stepper juntos. Com o stepper ao lado do nome ele
                ficava longe do valor que controla, e a distância crescia com as
                tags de data e a descrição. */}
            <div className="flex flex-col px-4 py-4">
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
                </div>
                {/* Mesmo bloco de valor da linha de ingresso: total em cima, composicao
                    embaixo. Passaporte e ingresso sao a mesma decisao de compra e nao
                    podem apresentar o preco de duas formas na mesma tela (art. 7). */}
                <div className="mt-3 flex items-end justify-between gap-4">
                    <PrecoPar preco={preco} />
                    <Stepper qtd={qtd} rotulo={combo.nome} onInc={onInc} onDec={onDec} />
                </div>
            </div>

            {aberto && (
                <div className="border-t border-secondary">
                    {combo.inclui.map((i, idx) => (
                        <div key={i.id} className="flex items-start gap-3 px-4 py-3">
                            <Ticket01 className="mt-0.5 size-4 shrink-0 text-fg-brand-primary" />
                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <span className="text-sm font-semibold text-primary">{i.titulo}</span>
                                {i.sub && <span className="text-sm text-tertiary">{i.sub}</span>}
                                {i.descricao && <p className="text-sm text-tertiary">{i.descricao}</p>}
                            </div>
                            <span className="shrink-0 text-sm text-primary tabular-nums">{brl(partes[idx])}</span>
                        </div>
                    ))}
                    {/* Taxa e total formam um par, sem régua entre eles: ratear a taxa por
                        dia exporia 19,998% numa superfície cujo propósito é justamente
                        demonstrar proporcionalidade. */}
                    <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-1">
                        <span className="text-sm text-secondary">{taxa.nome} do combo</span>
                        <span className="shrink-0 text-sm text-primary tabular-nums">{brl(preco.taxa)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 px-4 pt-1 pb-3">
                        <span className="text-sm font-bold text-primary">Total do combo</span>
                        <span className="shrink-0 text-sm font-bold text-primary tabular-nums">{brl(preco.total)}</span>
                    </div>
                </div>
            )}

            {combo.inclui.length > 0 && (
                <button type="button" onClick={onToggleDetalhes} className="flex items-center justify-between gap-2 border-t border-secondary px-4 py-3 text-sm font-medium text-secondary transition hover:bg-primary_hover">
                    Detalhes
                    <ChevronDown className={cx("size-4 text-fg-quaternary transition-transform", aberto && "rotate-180")} />
                </button>
            )}
        </div>
    );
}

function ComboDinamicoCard({
    combo,
    preco,
    variavel,
    taxa,
    onSelecionar,
}: {
    combo: ComboDinamico;
    preco: Preco;
    variavel: boolean;
    taxa: TaxaServico;
    onSelecionar: () => void;
}) {
    return (
        <div className="flex items-start justify-between gap-4 rounded-xl bg-primary px-4 py-4 ring-1 ring-border-secondary">
            <div className="flex min-w-0 flex-col gap-2">
                {/* O badge de desconto saiu: `totalValor` nunca consultou o cupom, então
                    anunciar "10% OFF" ao lado de um total ostensivo que não desconta nada
                    seria pior do que não anunciar. Volta quando o cupom entrar no cálculo. */}
                <span className="text-sm font-bold text-primary">{combo.nome}</span>
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
                <PrecoBloco preco={preco} tamanho="lg" prefixo={variavel ? "A partir de" : undefined} className="mt-1" />
            </div>
            <Button size="md" color="secondary" className="shrink-0" onClick={onSelecionar}>
                Selecionar
            </Button>
        </div>
    );
}

function ItensPorData({
    data,
    itens,
    cart,
    taxa,
    quantitativo,
    onInc,
    onDec,
    onAbrirMeia,
}: {
    data: DataEvento;
    itens: Item[];
    cart: Record<string, CartGroup>;
    taxa: TaxaServico;
    quantitativo?: Record<string, Quantitativo>;
    onInc: (it: Item) => void;
    onDec: (it: Item) => void;
    onAbrirMeia: () => void;
}) {
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
                    Limite de {data.limite} {data.limite === 1 ? "ingresso" : "ingressos"} por data atingido. Não é limite de meia-entrada.
                </p>
            )}
            {grupos.map((g) => (
                <GrupoIngressos key={g.nome} nome={g.nome} quantitativo={quantitativo?.[g.nome]}>
                    {g.itens.map((it) => {
                        const qtd = cart[`data:${data.id}:${it.id}`]?.qtd ?? 0;
                        return (
                            <IngressoRow
                                key={it.id}
                                it={it}
                                qtd={qtd}
                                taxa={taxa}
                                canInc={!limiteAtingido}
                                onInc={() => onInc(it)}
                                onDec={() => onDec(it)}
                                onAbrirMeia={onAbrirMeia}
                            />
                        );
                    })}
                </GrupoIngressos>
            ))}
        </div>
    );
}

/**
 * Accordion de um grupo de ingressos.
 *
 * O grupo é moldura, não protagonista: com nomes reais em caixa alta
 * ("ARQUIBANCADA SUPERIOR COBERTA" sobre "INTEIRA") dois títulos do mesmo peso
 * disputavam a mesma linha de leitura. O agrupamento passa a ser sinalizado por
 * fundo e espaço, e o nome do grupo recua para rótulo.
 */
function GrupoIngressos({ nome, quantitativo, children }: { nome: string; quantitativo?: Quantitativo; children: React.ReactNode }) {
    // Fechado por padrão. A troca de aba remonta a árvore (key no AnimatePresence),
    // então o estado também volta ao fechado a cada data ou combo.
    const [aberto, setAberto] = useState(false);

    /*
      `ofertados` é o TOTAL do grupo e já contém as meias. Como a linha agora
      descreve uma partição ("regulares" e "meia-entrada"), o primeiro número é
      a diferença: rotular o total como "regulares" faria 1.200 + 500 somar
      1.700 onde existem 1.200.
    */
    const regulares = quantitativo ? Math.max(0, quantitativo.ofertados - quantitativo.ofertadosMeia) : 0;
    return (
        <div className="overflow-clip rounded-2xl bg-primary ring-1 ring-border-secondary">
            {/*
              O header inteiro é o controle, então o hover cobre as duas linhas.
              O quantitativo do art. 11 fica dentro do <button> e entra no nome
              acessível: verboso, mas é informação que o leitor de tela precisa
              ter, e deixá-la fora criaria uma área com hover que não clica.
              Spans e não <p>/<div>, que são inválidos dentro de <button>.
            */}
            <button
                type="button"
                onClick={() => setAberto((v) => !v)}
                aria-expanded={aberto}
                className="flex w-full flex-col gap-0.5 border-b border-secondary bg-primary px-4 py-3 text-left transition duration-100 ease-linear hover:bg-primary_hover"
            >
                <span className="flex w-full items-center gap-2.5">
                    <QrCode01 className="size-4 shrink-0 text-fg-quaternary" />
                    <span className="flex-1 text-sm font-semibold tracking-wide text-secondary">{nome}</span>
                    <ChevronDown className={cx("size-5 shrink-0 text-fg-quaternary transition-transform", aberto && "rotate-180")} />
                </span>
                {quantitativo && quantitativo.ofertados > 0 && (
                    <span className="pl-6.5 text-sm text-quaternary tabular-nums">
                        {regulares.toLocaleString("pt-BR")} ingressos regulares
                        {quantitativo.ofertadosMeia > 0 && `, ${quantitativo.ofertadosMeia.toLocaleString("pt-BR")} meia-entrada`}
                    </span>
                )}
            </button>
            {aberto && <div className="divide-y divide-secondary">{children}</div>}
        </div>
    );
}

/**
 * Linha de ingresso em duas faixas: identificação + stepper em cima, bloco de
 * preço em largura total embaixo.
 *
 * A coluna de texto da faixa de cima mede 177px em uma tela de 375px (91px com
 * imagem), onde nenhuma legenda de preço cabe. Separar as faixas devolve a
 * largura inteira ao preço e é pré-requisito, não refinamento.
 */
function IngressoRow({
    it,
    qtd,
    taxa,
    canInc = true,
    onInc,
    onDec,
    onAbrirMeia,
}: {
    it: Item;
    qtd: number;
    taxa: TaxaServico;
    canInc?: boolean;
    onInc: () => void;
    onDec: () => void;
    onAbrirMeia: () => void;
}) {
    const preco = precoComTaxa(it.preco ?? 0, taxa.aliquota, taxa.nome);
    const ehMeia = it.beneficio === "meia-entrada";
    const esgotado = !!it.cotaEsgotada;
    const rotulo = [it.grupo, it.nome].filter(Boolean).join(" ");

    return (
        <div
            role="group"
            aria-label={rotulo}
            className={cx("flex flex-col px-4 py-4", esgotado && "opacity-50")}
        >
            {/* Faixa 1: identificação. Cresce livremente com nome em caixa alta e descrição longa. */}
            <div className="flex items-start gap-4">
                {it.imagem && <img src={it.imagem} alt="" aria-hidden="true" className="size-16 shrink-0 rounded-lg object-cover ring-1 ring-border-secondary" />}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-md font-semibold text-primary">{it.nome}</span>
                        {esgotado && (
                            <Badge size="sm" color="gray" type="modern">
                                Esgotado
                            </Badge>
                        )}
                        {/* Ícone, não link: um terceiro alvo em texto competia com o stepper. */}
                        {ehMeia && (
                            <button
                                type="button"
                                onClick={onAbrirMeia}
                                aria-label="Ver regras da meia-entrada"
                                className="rounded-full text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary"
                            >
                                <HelpCircle className="size-4" />
                            </button>
                        )}
                    </div>
                    {it.lote && <span className="text-sm text-tertiary">{it.lote}</span>}
                    {it.descricao && (
                        <div
                            className="text-sm leading-relaxed text-tertiary [&_b]:font-semibold [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-4"
                            dangerouslySetInnerHTML={{ __html: it.descricao }}
                        />
                    )}
                </div>
            </div>

            {/* Faixa 2: preço e ação juntos. Antes o stepper ficava quatro linhas acima do
                valor que ele controla, e com descrição longa a distância só crescia.

                Sem régua aqui: um traço igual ao que separa os itens do grupo tornava
                ambíguo onde um item termina. Um boundary, uma régua. A faixa se liga ao
                item pela proximidade (12px contra 32px entre itens).

                Total em cima e a composição embaixo: empilhado cabe em qualquer largura
                sem container query, e o stepper fica ao lado do par inteiro. */}
            <div className="mt-3 flex items-end justify-between gap-4">
                {it.preco != null ? (
                    <PrecoPar preco={preco} />
                ) : (
                    <span />
                )}
                <Stepper qtd={qtd} canInc={canInc && !esgotado} rotulo={rotulo} onInc={onInc} onDec={onDec} />
            </div>
        </div>
    );
}

/**
 * Linha única do resumo, para ingresso, combo e produto.
 * Antes havia duas (`CartGroupRow` imprimia subtotal, `ProdutoResumoRow`
 * imprimia unitário), e a mesma camisa aparecia com dois valores dependendo de
 * qual layout do resumo estava na tela.
 */
function CartGroupRow({ grupo, chave, imagem, onInc, onDec }: { grupo: CartGroup; chave?: string; imagem?: string; onInc: () => void; onDec: () => void }) {
    // `truncate` cortava "ARQUIBANCADA SUPERIOR C…", que é justamente o que
    // identifica o ingresso. Nome em caixa alta estoura 360px por definição.
    // Grupo e data ficam em linhas distintas: juntos, o clamp comia a data.
    return (
        <li data-item={chave} className="flex flex-col gap-2">
            <div className="flex items-start gap-3">
                {imagem && <img src={imagem} alt="" aria-hidden="true" className="size-11 shrink-0 rounded-md object-cover ring-1 ring-border-secondary" />}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="line-clamp-2 text-md font-semibold text-primary">{grupo.nome}</span>
                    {grupo.lote && <span className="line-clamp-2 text-sm text-tertiary">{grupo.lote}</span>}
                    {grupo.sub && <span className="text-sm text-quaternary">{grupo.sub}</span>}
                    <PrecoBloco preco={grupo.preco} qtd={grupo.qtd} tamanho="sm" mostrarTaxa={false} className="mt-1" />
                </div>
                <ResumoQtd qtd={grupo.qtd} onInc={onInc} onDec={onDec} />
            </div>
            {grupo.sublines && grupo.sublines.length > 0 && (
                <ul className="flex flex-col gap-2 pl-7">
                    {grupo.sublines.map((sl, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                            <span className="pt-0.5 text-sm text-tertiary tabular-nums">{sl.qtd * grupo.qtd}</span>
                            <div className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate text-sm font-medium text-secondary">{sl.nome}</span>
                                {sl.sub && <span className="truncate text-sm text-tertiary">{sl.sub}</span>}
                            </div>
                            {sl.valor != null && (
                                <span className="shrink-0 pt-0.5 text-sm text-tertiary tabular-nums">{brl(escalar(sl.valor, grupo.qtd))}</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
}

/**
 * Capa do evento, com imagem padrão quando o produtor não configurou nenhuma.
 *
 * O fallback em tokens que existia antes lia como placeholder; um pôster real
 * mostra a proporção e o peso visual que a caixa vai ter de verdade, que é o
 * que importa num protótipo de layout.
 */
const CAPA_PADRAO = "https://kraken.ingresse.com/event/posters/108467/large/1790120499.9730182.jpg";

function BannerEvento({ capa, nome }: { capa?: string; nome: string }) {
    return <img src={capa || CAPA_PADRAO} alt={`Capa de ${nome}`} className="size-full object-cover" />;
}

/**
 * Cartaz do evento com o resumo da compra no verso: ao entrar o primeiro item
 * no carrinho a caixa vira, e ao esvaziar ela desvira.
 *
 * A virada é CSS, não `motion`. `motion` escreve `transform` inline, que não
 * conhece breakpoint, e abaixo de lg não existe verso (lá o resumo é o rodapé
 * fixo em portal): o cartaz giraria sozinho mostrando o nada. Com a variante
 * `lg:` a virada só existe onde há verso, e `motion-reduce` desliga o
 * movimento sem desligar a troca.
 *
 * Detalhes que quebram se forem mexidos:
 * - `perspective` fica no PAI, nunca no elemento que gira, senão cada face
 *   ganha o próprio ponto de fuga.
 * - arredondamento e recorte vão NAS FACES. `overflow` diferente de `visible`
 *   no elemento que gira achata o contexto 3D e mata o `preserve-3d`.
 * - 500ms e não os 100ms da convenção do repo: aquela regra é para hover e
 *   cor. Um giro de 180 graus em 100ms não é lido como giro, é lido como corte.
 */
function CartazComVerso({ virado, frente, verso }: { virado: boolean; frente: ReactNode; verso: ReactNode }) {
    const versoRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = versoRef.current;
        if (!el) return;
        // `backface-visibility` esconde aos olhos, não ao teclado nem ao leitor
        // de tela. React 18 não tem a prop `inert`, então vai por atributo.
        if (virado) el.removeAttribute("inert");
        else el.setAttribute("inert", "");
    }, [virado]);

    return (
        <div className="[perspective:1600px]">
            <div
                className={cx(
                    CAIXA_RESUMO,
                    "relative transition-transform duration-500 ease-in-out [transform-style:preserve-3d] motion-reduce:transition-none",
                    virado && "lg:[transform:rotateY(180deg)]",
                )}
            >
                <div
                    className={cx(
                        "absolute inset-0 overflow-clip rounded-xl ring-1 ring-border-secondary [backface-visibility:hidden]",
                        virado && "lg:pointer-events-none",
                    )}
                >
                    {frente}
                </div>
                {/* Abaixo de lg o verso é display:none, então já sai do tab e do leitor. */}
                <div
                    ref={versoRef}
                    className={cx(
                        "absolute inset-0 hidden flex-col overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary [backface-visibility:hidden] [transform:rotateY(180deg)] lg:flex",
                        !virado && "pointer-events-none",
                    )}
                >
                    {verso}
                </div>
            </div>
        </div>
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
