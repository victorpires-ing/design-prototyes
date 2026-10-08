import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChartSquare02,
  Calendar,
  ChevronLeft,
  ChevronRight,
  DotsGrid,
  CurrencyDollarCircle,
  Percent03,
  Plus,
  Receipt,
  SearchLg,
  Sliders02,
  SwitchHorizontal01,
  Ticket01,
  TrendUp01,
  Users01,
  XClose,
} from "@untitledui/icons";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  LabelList,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Dialog as AriaDialog,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
} from "react-aria-components";
import type { Key } from "react-aria-components";
import {
  ButtonGroup,
  ButtonGroupItem,
} from "@/components/base/button-group/button-group";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Select } from "@/components/base/select/select";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { RelatorioPageHeader } from "../components/RelatorioPageHeader";
import { buscarEventos } from "../utils/busca-eventos";
import {
  currencyFormatter,
  numberFormatter,
  parseEventDate,
} from "../data/event";
import {
  eventos as EVENTOS_DA_HOME,
  useEventoAtual,
} from "../../eventos/data/eventos";

/* ------------------------------------------------------------------ */
/*  Catálogo: os mesmos eventos que a home lista                      */
/* ------------------------------------------------------------------ */

interface DiaSerie {
  vendas: number; // bruto do dia
  ingressos: number;
  transacoes: number;
}

interface EventoComparativo {
  id: string;
  nome: string;
  curto: string;
  /** Cartaz do evento, o mesmo que a home mostra. */
  cartaz: string;
  dataAbertura: string;
  dataEvento: string;
  capacidade: number;
  janelaDias: number;
  taxaPct: number; // taxa retida (bruto → líquido)
  serie: DiaSerie[];
  /** Escada de lotes: preço praticado a partir de cada dia da janela. */
  precos: DegrauPreco[];
}

/** Um evento já com a cor da série, atribuída pela ordem de seleção. */
type EventoSerie = EventoComparativo & { cor: string; traco: string };

/** Um degrau da escada de preços: vale do `dia` até o próximo degrau. */
interface DegrauPreco {
  dia: number;
  valor: number;
  /** Nome do lote, como o produtor o chama. */
  nome: string;
}

const ordinalLote = (i: number) => `${i + 1}º lote`;

/**
 * Lotes de um evento. Os degraus ficam mais próximos perto da data, que é
 * quando o produtor costuma virar lote com mais frequência.
 */
function buildPrecos(
  janelaDias: number,
  ticket: number,
  seed: number,
): DegrauPreco[] {
  const rand = mulberry32(seed * 7 + 3);
  const degraus = 5 + Math.floor(rand() * 4);
  // Elasticidade realista: o topo costuma ficar entre +70% e +120% do 1º lote.
  const inicial = Math.round(ticket * 0.72);
  const topo = Math.round(inicial * (1.7 + rand() * 0.5));

  return Array.from({ length: degraus }, (_, i) => {
    const t = i / (degraus - 1);
    return {
      dia: Math.round(Math.pow(t, 0.75) * (janelaDias - 1)),
      valor: Math.round(inicial + (topo - inicial) * Math.pow(t, 1.35)),
      nome: ordinalLote(i),
    };
  });
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Peak {
  center: number;
  width: number;
  height: number;
}

function buildSerie(
  janelaDias: number,
  totalIngressos: number,
  ticketBase: number,
  seed: number,
  peaks: Peak[],
): DiaSerie[] {
  const rng = mulberry32(seed);
  const N = janelaDias;
  const pesos: number[] = [];
  for (let d = 0; d < N; d++) {
    const prox = N === 1 ? 1 : d / (N - 1);
    let w = Math.exp(-d / 6) * 4.5 + Math.pow(prox, 3) * 4 + 0.8;
    for (const p of peaks)
      w +=
        p.height *
        Math.exp(-((prox - p.center) ** 2) / (2 * p.width * p.width));
    if (d === N - 1) w += 7;
    if (d === N - 2) w += 3;
    w *= 0.88 + 0.24 * rng();
    pesos.push(Math.max(0.05, w));
  }
  const soma = pesos.reduce((s, x) => s + x, 0) || 1;
  return pesos.map((w, d) => {
    const prox = N === 1 ? 1 : d / (N - 1);
    const ingressos = Math.round((totalIngressos * w) / soma);
    const ticket = ticketBase * (0.8 + 0.45 * prox);
    return {
      vendas: Math.round(ingressos * ticket),
      ingressos,
      transacoes: Math.max(
        ingressos > 0 ? 1 : 0,
        Math.round(ingressos / (1.2 + 0.5 * rng())),
      ),
    };
  });
}

/**
 * Cores de série. A ordem importa: as quatro primeiras são as que mais se
 * separam entre si, inclusive para quem não distingue vermelho e verde.
 * A cor é atribuída pela ORDEM DE SELEÇÃO, não pela posição na lista de
 * eventos, para que a comparação mais comum (dois eventos) sempre caia nas
 * duas cores mais distantes.
 */
const PALETTE = [
  "var(--color-utility-blue-500)",
  "var(--color-utility-orange-500)",
  "var(--color-utility-purple-500)",
  "var(--color-utility-green-500)",
  "var(--color-utility-pink-500)",
  "var(--color-utility-indigo-500)",
  "var(--color-utility-yellow-500)",
  "var(--color-utility-brand-600)",
];

/** Canal redundante à cor (WCAG 1.4.1): cada série tem também um traço próprio. */
const DASHES = ["0", "7 4", "2 3", "11 4", "4 3 1 3", "14 5", "1 3", "9 3 2 3"];

/** Teto de eventos comparáveis ao mesmo tempo. */
const MAX_EDICOES = 4;

const addDias = (base: string, dias: number) => {
  const d = parseEventDate(base)!;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + dias);
};

const dataCurta = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

/** Rótulo curto para eixos, legendas e tabelas: o nome cheio não cabe. */
const CURTO: Record<string, string> = {
  "6704": "Mochakk",
  "2871": "Rave the World",
  "3390": "In da Club",
  "5518": "Freak Chic",
  "4102": "Inception",
};

/** Perfil de venda por evento. Fixo por id para a página não mudar a cada render. */
const PERFIL: Record<
  string,
  {
    janelaDias: number;
    capacidade: number;
    ingressos: number;
    ticket: number;
    taxaPct: number;
    seed: number;
    peaks: Peak[];
  }
> = {
  "6704": {
    janelaDias: 118,
    capacidade: 9000,
    ingressos: 7842,
    ticket: 185,
    taxaPct: 0.1,
    seed: 11,
    peaks: [
      { center: 0.45, width: 0.05, height: 8 },
      { center: 0.92, width: 0.04, height: 9 },
    ],
  },
  "2871": {
    janelaDias: 96,
    capacidade: 14000,
    ingressos: 12310,
    ticket: 240,
    taxaPct: 0.08,
    seed: 23,
    peaks: [
      { center: 0.38, width: 0.04, height: 11 },
      { center: 0.86, width: 0.05, height: 7 },
    ],
  },
  "3390": {
    janelaDias: 74,
    capacidade: 1800,
    ingressos: 1544,
    ticket: 95,
    taxaPct: 0.1,
    seed: 37,
    peaks: [{ center: 0.72, width: 0.06, height: 10 }],
  },
  "5518": {
    janelaDias: 62,
    capacidade: 2200,
    ingressos: 1987,
    ticket: 80,
    taxaPct: 0.1,
    seed: 43,
    peaks: [
      { center: 0.55, width: 0.05, height: 7 },
      { center: 0.9, width: 0.04, height: 9 },
    ],
  },
  "4102": {
    janelaDias: 88,
    capacidade: 1600,
    ingressos: 1203,
    ticket: 110,
    taxaPct: 0.1,
    seed: 59,
    peaks: [{ center: 0.64, width: 0.05, height: 9 }],
  },
};

const doisDigitos = (n: number) => String(n).padStart(2, "0");
const paraBR = (d: Date) =>
  `${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)}/${d.getFullYear()}`;

/**
 * O catálogo é o mesmo da home: só os eventos que a organização de fato tem.
 * Todos usam o perfil acima. Puxar os números do evento em contexto da fonte
 * única (src/reports) foi tentado e descartado: aquela base é de um réveillon
 * de dezenas de milhares de ingressos, e colada num clube de 1.600 lugares ela
 * fazia a âncora aparecer centenas de por cento acima de todo o resto.
 */
function construirCatalogo(): EventoComparativo[] {
  return EVENTOS_DA_HOME.filter((ev) => PERFIL[ev.id]).map((ev) => {
    const p = PERFIL[ev.id];
    const dataEvento = new Date(ev.data);
    const dataAbertura = new Date(dataEvento);
    dataAbertura.setDate(dataAbertura.getDate() - (p.janelaDias - 1));

    return {
      id: ev.id,
      nome: ev.nome,
      curto: CURTO[ev.id] ?? ev.nome,
      cartaz: ev.cover,
      dataAbertura: paraBR(dataAbertura),
      dataEvento: paraBR(dataEvento),
      capacidade: p.capacidade,
      janelaDias: p.janelaDias,
      taxaPct: p.taxaPct,
      serie: buildSerie(p.janelaDias, p.ingressos, p.ticket, p.seed, p.peaks),
      precos: buildPrecos(p.janelaDias, p.ticket, p.seed),
    };
  });
}

type Metric = "faturamento" | "ingressos" | "transacoes";
type Alignment = "abertura" | "evento";
type Mode = "acumulado" | "diario";

const METRIC_FIELD: Record<Metric, keyof DiaSerie> = {
  faturamento: "vendas",
  ingressos: "ingressos",
  transacoes: "transacoes",
};
const METRIC_LABEL: Record<Metric, string> = {
  faturamento: "Faturamento líquido",
  ingressos: "Ingressos",
  transacoes: "Transações",
};

const METRIC_OPTIONS: { id: Metric; label: string }[] = [
  { id: "faturamento", label: "Faturamento líquido" },
  { id: "ingressos", label: "Ingressos" },
  { id: "transacoes", label: "Transações" },
];

const fmtMetric = (v: number, metric: Metric) =>
  metric === "faturamento"
    ? currencyFormatter.format(v)
    : numberFormatter.format(v);

/** Dinheiro em forma curta, para eixos e rótulos. Nunca imprime "R$0k". */
const fmtDinheiroCurto = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000)
    return `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (abs >= 1_000)
    return `R$ ${(v / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mil`;
  return `R$ ${Math.round(v)}`;
};

const fmtMetricCurto = (v: number, metric: Metric) =>
  metric === "faturamento"
    ? fmtDinheiroCurto(v)
    : numberFormatter.format(Math.round(v));

function windowRange(ev: EventoComparativo): [number, number] {
  return [0, ev.janelaDias - 1];
}

/**
 * Valores da série dentro da janela.
 * No modo acumulado, o acúmulo acontece DENTRO da janela, para que o último
 * ponto da curva seja o mesmo número que a tabela mostra para aquele recorte.
 */
function seriesValues(
  ev: EventoComparativo,
  metric: Metric,
  mode: Mode,
  range: [number, number],
): number[] {
  const field = METRIC_FIELD[metric];
  const slice = ev.serie.slice(range[0], range[1] + 1).map((s) => s[field]);
  let result: number[];
  if (mode === "diario") {
    result = slice;
  } else {
    const cum: number[] = [];
    let acc = 0;
    for (const v of slice) {
      acc += v;
      cum.push(acc);
    }
    result = cum;
  }
  if (metric === "faturamento") return result.map((v) => v * (1 - ev.taxaPct)); // líquido
  return result;
}

interface EventoTotais {
  bruto: number;
  taxas: number;
  liquido: number;
  ingressos: number;
  transacoes: number;
  /** Preço médio pago por ingresso, antes da taxa. */
  ticketMedio: number;
  /** O que sobra para o produtor por ingresso, depois da taxa. */
  repassePorIngresso: number;
  pctCapacidade: number;
  /** Melhor dia, já líquido, para ficar na mesma unidade das outras linhas. */
  melhorDiaLiquido: number;
  diasNoRecorte: number;
}

function totaisDe(
  ev: EventoComparativo,
  range: [number, number],
): EventoTotais {
  const slice = ev.serie.slice(range[0], range[1] + 1);
  const bruto = slice.reduce((s, d) => s + d.vendas, 0);
  const liquido = bruto * (1 - ev.taxaPct);
  const ingressos = slice.reduce((s, d) => s + d.ingressos, 0);
  const transacoes = slice.reduce((s, d) => s + d.transacoes, 0);
  const picoBruto = slice.reduce((m, d) => Math.max(m, d.vendas), 0);
  return {
    bruto,
    taxas: bruto - liquido,
    liquido,
    ingressos,
    transacoes,
    ticketMedio: ingressos === 0 ? 0 : bruto / ingressos,
    repassePorIngresso: ingressos === 0 ? 0 : liquido / ingressos,
    pctCapacidade: ev.capacidade === 0 ? 0 : (ingressos / ev.capacidade) * 100,
    melhorDiaLiquido: picoBruto * (1 - ev.taxaPct),
    diasNoRecorte: slice.length,
  };
}

const metricValor = (t: EventoTotais, metric: Metric) =>
  metric === "faturamento"
    ? t.liquido
    : metric === "ingressos"
      ? t.ingressos
      : t.transacoes;

/** Duas medidas empatam na prática quando a diferença relativa é menor que o piso. */
const empateTecnico = (a: number, b: number, tolerancia = 0.01) => {
  const maior = Math.max(Math.abs(a), Math.abs(b));
  if (maior === 0) return true;
  return Math.abs(a - b) / maior <= tolerancia;
};

const JANELA_LABEL = "no período total de vendas";

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function Comparativos() {
  // O evento em contexto no Backstage é a âncora: tudo é lido contra ele.
  const atualId = useEventoAtual().id;
  const catalogo = useMemo(() => construirCatalogo(), []);
  const atual = catalogo.find((e) => e.id === atualId) ?? catalogo[0];

  // Abre já comparando com um evento, em vez de pedir uma decisão antes de
  // mostrar qualquer coisa.
  const [comparadosIds, setComparadosIds] = useState<string[]>(() => {
    const primeiro = catalogo.find((e) => e.id !== atualId);
    return primeiro ? [primeiro.id] : [];
  });
  const [metric, setMetric] = useState<Metric>("faturamento");
  const [alignment, setAlignment] = useState<Alignment>("evento");

  // A âncora é sempre a primeira, então fica sempre com a primeira cor da
  // paleta e é sempre a referência das variações.
  const selectedIds = useMemo(
    () => [
      atual.id,
      ...comparadosIds.filter(
        (id) => id !== atual.id && catalogo.some((e) => e.id === id),
      ),
    ],
    [atual.id, comparadosIds, catalogo],
  );

  const selectedEvents = useMemo<EventoSerie[]>(
    () =>
      selectedIds
        .map((id) => catalogo.find((e) => e.id === id))
        .filter((e): e is EventoComparativo => Boolean(e))
        .map((ev, i) => ({
          ...ev,
          cor: PALETTE[i % PALETTE.length],
          traco: DASHES[i % DASHES.length],
        })),
    [selectedIds, catalogo],
  );

  const corPorId = useMemo(
    () => Object.fromEntries(selectedEvents.map((e) => [e.id, e.cor])),
    [selectedEvents],
  );

  const noLimite = selectedIds.length >= MAX_EDICOES;

  const adicionar = (id: string) =>
    setComparadosIds((prev) =>
      id === atual.id || prev.includes(id) || prev.length >= MAX_EDICOES - 1
        ? prev
        : [...prev, id],
    );

  const remover = (id: string) =>
    setComparadosIds((prev) => prev.filter((x) => x !== id));

  const trocar = (antigo: string, novo: string) =>
    setComparadosIds((prev) =>
      prev.includes(novo) ? prev : prev.map((x) => (x === antigo ? novo : x)),
    );

  const toggleEvent = (id: string) => {
    if (id === atual.id) return; // a âncora não sai da comparação
    setComparadosIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_EDICOES - 1) return prev;
      return [...prev, id];
    });
  };

  return (
    <BackstageLayout activeSection="relatorios" activeItem="comparativos">
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
          <RelatorioPageHeader
            title="Comparativos"
            withFilters={false}
          />

          <ComparacaoCards
            catalogo={catalogo}
            atual={atual}
            selectedIds={selectedIds}
            corPorId={corPorId}
            noLimite={noLimite}
            onAdicionar={adicionar}
            onRemover={remover}
            onTrocar={trocar}
          />

          <ComparativoControls
            metric={metric}
            onChangeMetric={setMetric}
            alignment={alignment}
            onChangeAlignment={setAlignment}
          />

          {selectedEvents.length < 2 ? (
            <EmptyState
              catalogo={catalogo}
              atual={atual}
              onSelect={toggleEvent}
            />
          ) : (
            <>
              <InsightCards
                events={selectedEvents}
                metric={metric}
              />
              <ComparativoChart
                events={selectedEvents}
                metric={metric}
                alignment={alignment}
              />
              <FaturamentoPorMes
                events={selectedEvents}
                metric={metric}
              />
              <RitmoPorFaixa
                events={selectedEvents}
                metric={metric}
                alignment={alignment}
              />
              <PrecoEAmplitude
                events={selectedEvents}
                alignment={alignment}
              />
              <ComparativoTable
                events={selectedEvents}
                metric={metric}
              />
            </>
          )}
        </main>
      </div>
    </BackstageLayout>
  );
}

/* ------------------------------------------------------------------ */
/*  Seleção dos eventos comparados                                    */
/* ------------------------------------------------------------------ */

/**
 * Seleção no modelo do Google Trends: um slot por evento, lado a lado, e o
 * card de adicionar vira o próprio campo de busca no lugar, em vez de abrir
 * um painel à parte. O evento atual é a âncora, o primeiro slot, e não tem
 * menu: não sai da comparação. Tudo é lido contra ele, nunca entre si.
 */

const SLOT = "min-w-64 flex-1 basis-0";

/** O slot em busca: input já focado e a lista ancorada logo abaixo dele. */
const SlotBusca = ({
  catalogo,
  indisponiveis,
  inicial,
  onEscolher,
  onCancelar,
}: {
  catalogo: EventoComparativo[];
  indisponiveis: string[];
  inicial?: string;
  onEscolher: (id: string) => void;
  onCancelar: () => void;
}) => {
  const [busca, setBusca] = useState(inicial ?? "");
  const [ativo, setAtivo] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);

  // Ao trocar, o texto já vem selecionado: digitar substitui de uma vez.
  useEffect(() => {
    inputRef.current?.focus();
    if (inicial) inputRef.current?.select();
  }, [inicial]);

  const { itens, total, modo } = useMemo(
    () => buscarEventos(catalogo, indisponiveis, busca),
    [catalogo, indisponiveis, busca],
  );

  useEffect(() => setAtivo(0), [busca]);

  // Navegar de teclado precisa trazer a linha para dentro da área visível.
  useEffect(() => {
    listaRef.current
      ?.querySelector(`[data-indice="${ativo}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [ativo]);

  const cortados = total - itens.length;

  return (
    <div
      className="relative h-full"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null))
          onCancelar();
      }}
    >
      <div className="flex h-full items-center gap-3 rounded-2xl bg-primary px-5 py-4 ring-2 ring-brand ring-inset">
        <SearchLg
          aria-hidden="true"
          className="size-5 shrink-0 text-fg-quaternary"
        />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Buscar evento para comparar"
          aria-expanded={itens.length > 0}
          aria-controls="comparacao-opcoes"
          aria-activedescendant={
            itens[ativo] ? `comparacao-op-${itens[ativo].id}` : undefined
          }
          placeholder="Busque um evento"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setAtivo((i) => Math.min(i + 1, itens.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setAtivo((i) => Math.max(i - 1, 0));
            }
            if (e.key === "Enter" && itens[ativo]) {
              e.preventDefault();
              onEscolher(itens[ativo].id);
            }
            if (e.key === "Escape") {
              e.preventDefault();
              onCancelar();
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-md text-primary outline-hidden placeholder:text-placeholder"
        />
        <button
          type="button"
          aria-label="Cancelar"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onCancelar}
          className="flex size-10 shrink-0 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-fg-quaternary_hover"
        >
          <XClose className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div className="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-2xl bg-primary shadow-lg ring-1 ring-border-secondary">
        {/* Sem busca o catálogo inteiro não cabe, então a abertura são os
            próximos eventos. Com busca, a lista é ordenada por relevância. */}
        <p className="border-b border-secondary px-4 py-2.5 text-sm text-tertiary">
          {modo === "recentes"
            ? total > itens.length
              ? `Eventos mais recentes. Busque entre os ${total}.`
              : "Eventos mais recentes"
            : total === 0
              ? "Nenhum evento encontrado"
              : `${total} ${total === 1 ? "evento" : "eventos"}`}
        </p>

        <ul
          ref={listaRef}
          id="comparacao-opcoes"
          role="listbox"
          aria-label="Eventos para comparar"
          className="max-h-88 overflow-y-auto py-1"
        >
          {itens.map((ev, i) => (
            <li
              key={ev.id}
              id={`comparacao-op-${ev.id}`}
              data-indice={i}
              role="option"
              aria-selected={i === ativo}
            >
              <button
                type="button"
                onMouseEnter={() => setAtivo(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onEscolher(ev.id)}
                className={cx(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition duration-100 ease-linear",
                  i === ativo && "bg-primary_hover",
                )}
              >
                <img
                  src={ev.cartaz}
                  alt=""
                  aria-hidden="true"
                  className="size-10 shrink-0 rounded-lg object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-md font-medium text-primary">
                    {ev.nome}
                  </span>
                  <span className="block truncate text-sm text-tertiary">
                    {ev.dataEvento}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* O corte nunca é silencioso: dizer quanto ficou de fora é o que
            faz a pessoa refinar em vez de achar que a lista acabou. */}
        {cortados > 0 && modo === "busca" && (
          <p className="border-t border-secondary px-4 py-2.5 text-sm text-tertiary">
            Mostrando {itens.length}. Refine a busca para chegar nos outros{" "}
            {cortados}.
          </p>
        )}
      </div>
    </div>
  );
};

/** O slot preenchido: a bolinha é a mesma cor da série no gráfico. */
const SlotEvento = ({
  ev,
  cor,
  secundario,
  onRemover,
  onTrocar,
}: {
  ev: EventoComparativo;
  cor: string;
  secundario: string;
  onRemover?: () => void;
  onTrocar?: () => void;
}) => (
  <div className="group flex h-full items-center gap-3.5 rounded-2xl bg-primary px-5 py-4 ring-1 ring-border-secondary transition duration-100 ease-linear ring-inset hover:bg-secondary">
    <span
      aria-hidden="true"
      className="size-2.5 shrink-0 rounded-full"
      style={{ background: cor }}
    />
    <span className="min-w-0 flex-1">
      <span className="block truncate text-md font-semibold text-primary">
        {ev.nome}
      </span>
      <span className="block truncate text-sm text-tertiary">{secundario}</span>
    </span>
    {onRemover && onTrocar && (
      // Sem hover no toque, o menu fica sempre visível no mobile.
      <span className="flex size-10 shrink-0 items-center justify-center md:opacity-0 md:transition md:duration-100 md:ease-linear md:group-focus-within:opacity-100 md:group-hover:opacity-100">
        <Dropdown.Root>
          <Dropdown.DotsButton />
          <Dropdown.Popover placement="bottom end" className="w-auto min-w-52">
            <Dropdown.Menu
              onAction={(k) => {
                if (k === "trocar") onTrocar();
                if (k === "remover") onRemover();
              }}
            >
              <Dropdown.Item
                id="trocar"
                icon={SwitchHorizontal01}
                label="Trocar evento"
              />
              <Dropdown.Item id="remover" icon={XClose} label="Remover" />
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown.Root>
      </span>
    )}
  </div>
);

/** O slot vazio, que vira o campo de busca ao ser clicado. */
const SlotAdicionar = ({
  rotulo,
  onClick,
}: {
  rotulo: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex h-full w-full items-center justify-center gap-2.5 rounded-2xl bg-brand-secondary px-5 py-4 text-md font-semibold text-brand-secondary ring-inset transition duration-100 ease-linear hover:ring-2 hover:ring-brand"
  >
    <Plus aria-hidden="true" className="size-6" />
    {rotulo}
  </button>
);

const ComparacaoCards = ({
  catalogo,
  atual,
  selectedIds,
  corPorId,
  noLimite,
  onAdicionar,
  onRemover,
  onTrocar,
}: {
  catalogo: EventoComparativo[];
  atual: EventoComparativo;
  selectedIds: string[];
  corPorId: Record<string, string>;
  noLimite: boolean;
  onAdicionar: (id: string) => void;
  onRemover: (id: string) => void;
  onTrocar: (antigo: string, novo: string) => void;
}) => {
  const [editando, setEditando] = useState<"novo" | { id: string } | null>(null);

  const porId = useMemo(
    () => new Map(catalogo.map((e) => [e.id, e])),
    [catalogo],
  );
  const comparados = selectedIds
    .filter((id) => id !== atual.id)
    .map((id) => porId.get(id))
    .filter((e): e is EventoComparativo => Boolean(e));

  return (
    <ul className="flex flex-wrap items-stretch gap-3">
      <li className={SLOT}>
        <SlotEvento ev={atual} cor={corPorId[atual.id]} secundario="Referência" />
      </li>

      {comparados.map((ev) =>
        typeof editando === "object" && editando?.id === ev.id ? (
          <li key={ev.id} className={SLOT}>
            <SlotBusca
              catalogo={catalogo}
              indisponiveis={selectedIds.filter((id) => id !== ev.id)}
              inicial={ev.nome}
              onEscolher={(novo) => {
                onTrocar(ev.id, novo);
                setEditando(null);
              }}
              onCancelar={() => setEditando(null)}
            />
          </li>
        ) : (
          <li key={ev.id} className={SLOT}>
            <SlotEvento
              ev={ev}
              cor={corPorId[ev.id]}
              secundario={ev.dataEvento}
              onRemover={() => onRemover(ev.id)}
              onTrocar={() => setEditando({ id: ev.id })}
            />
          </li>
        ),
      )}

      {editando === "novo" ? (
        <li className={SLOT}>
          <SlotBusca
            catalogo={catalogo}
            indisponiveis={selectedIds}
            onEscolher={(id) => {
              onAdicionar(id);
              setEditando(null);
            }}
            onCancelar={() => setEditando(null)}
          />
        </li>
      ) : (
        !noLimite && (
          <li className={SLOT}>
            <SlotAdicionar
              rotulo={comparados.length === 0 ? "Comparar" : "Adicionar comparação"}
              onClick={() => setEditando("novo")}
            />
          </li>
        )
      )}
    </ul>
  );
};

/* ------------------------------------------------------------------ */
/*  Controles (inline desktop / bottom sheet mobile)                  */
/* ------------------------------------------------------------------ */

interface ControlsProps {
  metric: Metric;
  onChangeMetric: (m: Metric) => void;
  alignment: Alignment;
  onChangeAlignment: (a: Alignment) => void;
}

const Campo = ({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cx("flex flex-col gap-1.5", className)}>
    <span className="text-sm font-medium text-secondary">{label}</span>
    {children}
  </div>
);

const MetricField = ({
  metric,
  onChange,
  className,
}: {
  metric: Metric;
  onChange: (m: Metric) => void;
  className?: string;
}) => (
  <Select
    size="md"
    aria-label="O que comparar"
    className={className}
    items={METRIC_OPTIONS}
    selectedKey={metric}
    onSelectionChange={(k: Key | null) => k && onChange(String(k) as Metric)}
  >
    {(item: { id: Metric; label: string }) => (
      <Select.Item id={item.id}>{item.label}</Select.Item>
    )}
  </Select>
);

const AlignmentField = ({
  alignment,
  onChange,
  className,
}: {
  alignment: Alignment;
  onChange: (a: Alignment) => void;
  className?: string;
}) => (
  <ButtonGroup
    size="md"
    aria-label="Como alinhar os eventos no tempo"
    selectedKeys={[alignment]}
    onSelectionChange={(k: Set<React.Key> | "all") =>
      k !== "all" && onChange([...k][0] as Alignment)
    }
    className={className}
  >
    <ButtonGroupItem id="evento">Dia do evento</ButtonGroupItem>
    <ButtonGroupItem id="abertura">Abertura</ButtonGroupItem>
  </ButtonGroup>
);

const ComparativoControls = (props: ControlsProps) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="hidden flex-wrap items-end gap-5 rounded-2xl bg-primary px-5 py-4 ring-1 ring-border-secondary ring-inset lg:flex">
        <Campo label="Medir por">
          <MetricField
            metric={props.metric}
            onChange={props.onChangeMetric}
            className="w-60"
          />
        </Campo>
        <Campo label="Alinhar">
          <AlignmentField
            alignment={props.alignment}
            onChange={props.onChangeAlignment}
          />
        </Campo>
      </div>

      <Button
        size="md"
        color="secondary"
        iconLeading={Sliders02}
        className="lg:hidden"
        onClick={() => setOpen(true)}
      >
        Ajustar
      </Button>

      <AriaModalOverlay
        isOpen={open}
        onOpenChange={setOpen}
        isDismissable
        className="fixed inset-0 z-50 flex justify-end outline-hidden"
      >
        <AriaModal
          className={({ isEntering, isExiting }) =>
            cx(
              "h-full w-full max-w-[520px] bg-primary shadow-xl outline-hidden",
              isEntering &&
                "duration-300 ease-out animate-in slide-in-from-right",
              isExiting &&
                "duration-200 ease-in animate-out slide-out-to-right",
            )
          }
        >
          <AriaDialog className="flex h-full flex-col outline-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-secondary px-6 py-5">
              <h2 className="text-lg font-semibold text-primary">
                Ajustar comparação
              </h2>
              <ButtonUtility
                size="sm"
                color="tertiary"
                icon={XClose}
                tooltip="Fechar"
                onClick={() => setOpen(false)}
              />
            </div>
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
              <Campo label="Medir por">
                <MetricField
                  metric={props.metric}
                  onChange={props.onChangeMetric}
                  className="w-full"
                />
              </Campo>
              <Campo label="Alinhar">
                <AlignmentField
                  alignment={props.alignment}
                  onChange={props.onChangeAlignment}
                  className="w-full"
                />
                <span className="text-sm text-tertiary">
                  {props.alignment === "evento"
                    ? "As curvas terminam juntas no dia do show de cada evento."
                    : "As curvas começam juntas no dia em que cada venda abriu."}
                </span>
              </Campo>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-secondary px-6 py-4">
              <Button size="sm" color="primary" onClick={() => setOpen(false)}>
                Ver comparação
              </Button>
            </div>
          </AriaDialog>
        </AriaModal>
      </AriaModalOverlay>
    </>
  );
};

/* ------------------------------------------------------------------ */
/*  Estado vazio, com um caminho em vez de só uma regra               */
/* ------------------------------------------------------------------ */

const EmptyState = ({
  catalogo,
  atual,
  onSelect,
}: {
  catalogo: EventoComparativo[];
  atual: EventoComparativo;
  onSelect: (id: string) => void;
}) => {
  const sugestoes = catalogo.filter((e) => e.id !== atual.id).slice(0, 3);

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl bg-primary px-6 py-12 ring-1 ring-border-secondary">
      <FeaturedIcon
        icon={BarChartSquare02}
        color="gray"
        theme="modern"
        size="lg"
      />
      <p className="text-sm font-semibold text-primary">
        Escolha um evento para comparar com {atual.curto}
      </p>
      <ul className="flex flex-wrap items-center justify-center gap-3">
        {sugestoes.map((ev) => (
          <li key={ev.id}>
            <button
              type="button"
              onClick={() => onSelect(ev.id)}
              className="flex items-center gap-2 rounded-lg bg-secondary py-1.5 pr-3 pl-1.5 ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-secondary_hover"
            >
              <img
                src={ev.cartaz}
                alt=""
                aria-hidden="true"
                className="size-9 shrink-0 rounded-md object-cover"
              />
              <span className="text-sm font-medium text-primary">
                {ev.curto}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Leituras em linguagem simples                                     */
/* ------------------------------------------------------------------ */

interface LeituraStat {
  ev: EventoSerie;
  total: EventoTotais;
  valorMetrica: number;
  diasMetade: number | null;
  concentracao: number | null;
  diasFinal: number;
}

const InsightCards = ({
  events,
  metric,
}: {
  events: EventoSerie[];
  metric: Metric;
}) => {
  const stats = useMemo<LeituraStat[]>(
    () =>
      events.map((ev) => {
        const range = windowRange(ev);
        const total = totaisDe(ev, range);
        const slice = ev.serie.slice(range[0], range[1] + 1);

        // Dias até atingir metade dos ingressos do próprio recorte.
        let diasMetade: number | null = null;
        if (total.ingressos > 0) {
          const metade = total.ingressos / 2;
          let cum = 0;
          for (let d = 0; d < slice.length; d++) {
            cum += slice[d].ingressos;
            if (cum >= metade) {
              diasMetade = d + 1;
              break;
            }
          }
        }

        // Concentração no fim do recorte. O corte acompanha o tamanho do
        // recorte, para não falar de "15 dias" dentro de uma janela de 7.
        const diasFinal = Math.min(15, slice.length);
        const finalIngressos = slice
          .slice(slice.length - diasFinal)
          .reduce((s, x) => s + x.ingressos, 0);
        const concentracao =
          total.ingressos > 0 ? finalIngressos / total.ingressos : null;

        return {
          ev,
          total,
          valorMetrica: metricValor(total, metric),
          diasMetade,
          concentracao,
          diasFinal,
        };
      }),
    [events, metric],
  );

  const lider = (
    sel: (s: LeituraStat) => number | null,
    maiorVence: boolean,
  ) => {
    const validos = stats.filter((s) => sel(s) != null);
    if (validos.length === 0) return null;
    const ord = [...validos].sort((a, b) =>
      maiorVence ? sel(b)! - sel(a)! : sel(a)! - sel(b)!,
    );
    const topo = ord[0];
    const segundo = ord[1];
    const empatou =
      segundo != null && empateTecnico(sel(topo)!, sel(segundo)!, 0.01);
    return { topo, segundo, empatou };
  };

  const volume = lider((s) => s.valorMetrica, true);
  const ritmo = lider((s) => s.diasMetade, false);
  const fim = lider((s) => s.concentracao, true);

  const cards: {
    icon: typeof Ticket01;
    eyebrow: string;
    corpo: React.ReactNode;
  }[] = [];

  if (volume) {
    cards.push({
      icon:
        metric === "faturamento"
          ? CurrencyDollarCircle
          : metric === "ingressos"
            ? Ticket01
            : Receipt,
      eyebrow: `Maior ${METRIC_LABEL[metric].toLowerCase()}`,
      corpo: volume.empatou ? (
        <EmpateTecnico
          a={volume.topo.ev}
          b={volume.segundo!.ev}
          texto={`${fmtMetric(volume.topo.valorMetrica, metric)} nos dois, diferença menor que 1%`}
        />
      ) : (
        <Fato
          ev={volume.topo.ev}
          texto={`${fmtMetric(volume.topo.valorMetrica, metric)}${
            volume.segundo
              ? `, ${Math.abs(Math.round((volume.topo.valorMetrica / volume.segundo.valorMetrica - 1) * 100))}% acima de ${volume.segundo.ev.curto}`
              : ""
          }`}
        />
      ),
    });
  }

  if (ritmo && ritmo.topo.diasMetade != null) {
    cards.push({
      icon: TrendUp01,
      eyebrow: "Vendeu mais rápido",
      corpo:
        ritmo.empatou && ritmo.segundo ? (
          <EmpateTecnico
            a={ritmo.topo.ev}
            b={ritmo.segundo.ev}
            texto={`Metade dos ingressos no ${ritmo.topo.diasMetade}º dia nos dois`}
          />
        ) : (
          <Fato
            ev={ritmo.topo.ev}
            texto={`Metade dos ingressos no ${ritmo.topo.diasMetade}º dia`}
          />
        ),
    });
  }

  if (fim && fim.topo.concentracao != null) {
    cards.push({
      icon: Percent03,
      eyebrow: "Mais concentrado no fim",
      corpo:
        fim.empatou && fim.segundo ? (
          <EmpateTecnico
            a={fim.topo.ev}
            b={fim.segundo.ev}
            texto={`${Math.round(fim.topo.concentracao * 100)}% nos últimos ${fim.topo.diasFinal} dias nos dois`}
          />
        ) : (
          <Fato
            ev={fim.topo.ev}
            texto={`${Math.round(fim.topo.concentracao * 100)}% dos ingressos nos últimos ${fim.topo.diasFinal} dias`}
          />
        ),
    });
  }

  if (cards.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.eyebrow}
            className="flex items-start gap-3 rounded-xl bg-primary p-4 ring-1 ring-border-secondary md:p-5"
          >
            <FeaturedIcon
              icon={c.icon}
              color="gray"
              theme="modern"
              size="md"
              className="shrink-0"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-sm font-medium text-tertiary">
                {c.eyebrow}
              </span>
              {c.corpo}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const Fato = ({ ev, texto }: { ev: EventoSerie; texto: string }) => (
  <>
    <span className="flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className="size-2.5 shrink-0 rounded-full"
        style={{ background: ev.cor }}
      />
      <span className="truncate text-md font-semibold text-primary">
        {ev.nome}
      </span>
    </span>
    <span className="text-sm text-tertiary">{texto}</span>
  </>
);

const EmpateTecnico = ({
  a,
  b,
  texto,
}: {
  a: EventoSerie;
  b: EventoSerie;
  texto: string;
}) => (
  <>
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="text-md font-semibold text-primary">Empate técnico</span>
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="size-2.5 shrink-0 rounded-full"
          style={{ background: a.cor }}
        />
        <span className="text-sm text-secondary">{a.curto}</span>
        <span
          aria-hidden="true"
          className="ml-1 size-2.5 shrink-0 rounded-full"
          style={{ background: b.cor }}
        />
        <span className="text-sm text-secondary">{b.curto}</span>
      </span>
    </span>
    <span className="text-sm text-tertiary">{texto}</span>
  </>
);

/* ------------------------------------------------------------------ */
/*  Gráfico comparativo (tempo relativo)                              */
/* ------------------------------------------------------------------ */

/** Geometria da área de plotagem, para o badge cair exatamente sobre o ponto. */
const PLOT_MARGEM_ESQ = 8;
const PLOT_EIXO_Y = 84;
const PLOT_ESQ = PLOT_MARGEM_ESQ + PLOT_EIXO_Y;
const PLOT_DIR = 24;
const PLOT_TOPO = 8;

/** Perto das bordas o badge ancora pela ponta, para não vazar do cartão. */
const ancoraBadge = (pct: number) =>
  pct < 0.18
    ? "translateX(0)"
    : pct > 0.82
      ? "translateX(-100%)"
      : "translateX(-50%)";

const formatXRelativo = (x: number, alignment: Alignment) => {
  if (x === 0) return alignment === "abertura" ? "Abertura" : "Dia do evento";
  return alignment === "abertura" ? `Dia ${x + 1}` : `D-${Math.abs(x)}`;
};

const labelTempo = (x: number, alignment: Alignment) => {
  if (alignment === "abertura")
    return x === 0 ? "Primeiro dia de venda" : `Dia ${x + 1} de venda`;
  if (x === 0) return "Dia do evento";
  const n = Math.abs(x);
  return `${n} ${n === 1 ? "dia" : "dias"} antes do evento (D-${n})`;
};

/** Data de calendário em que o evento viveu aquele dia relativo. */
const dataDoPonto = (ev: EventoComparativo, x: number, alignment: Alignment) =>
  alignment === "abertura"
    ? addDias(ev.dataAbertura, x)
    : addDias(ev.dataEvento, x);

const ComparativoChart = ({
  events,
  metric,
  alignment,
}: {
  events: EventoSerie[];
  metric: Metric;
  alignment: Alignment;
}) => {
  // Acumulado como padrão: é a leitura que responde "quem está à frente" sem
  // nenhum clique, e o padrão é o que a maioria vai ver.
  const [mode, setMode] = useState<Mode>("acumulado");
  // Índice sob o cursor. Null significa "o fim da série", que é o que fica
  // visível quando ninguém está apontando para nada.
  const [indiceAtivo, setIndiceAtivo] = useState<number | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const plotRef = useRef<HTMLDivElement>(null);

  const { rows, xMin, xMax, labelAnchors } = useMemo(() => {
    const rowMap = new Map<number, Record<string, number>>();
    let min = 0;
    let max = 0;
    for (const ev of events) {
      const range = windowRange(ev);
      const vals = seriesValues(ev, metric, mode, range);
      vals.forEach((v, j) => {
        const dayFromOpen = range[0] + j;
        const x =
          alignment === "abertura"
            ? dayFromOpen
            : dayFromOpen - (ev.janelaDias - 1);
        min = Math.min(min, x);
        max = Math.max(max, x);
        const row = rowMap.get(x) ?? { x };
        row[ev.id] = v;
        rowMap.set(x, row);
      });
    }
    const rows = Array.from(rowMap.values()).sort((a, b) => a.x - b.x);

    // Rótulo direto no ponto em que a série mais se separa das outras, em vez
    // do último ponto: com alinhamento pelo evento todas terminam no mesmo x
    // e os rótulos cairiam uns sobre os outros.
    const anchors: Record<string, number> = {};
    const lo = Math.floor(rows.length * 0.12);
    const hi = Math.max(lo + 1, Math.floor(rows.length * 0.92));
    for (const ev of events) {
      let melhor = -1;
      let melhorIdx = Math.floor(rows.length * 0.6);
      for (let i = lo; i < hi; i++) {
        const v = rows[i]?.[ev.id];
        if (v == null) continue;
        let menorDist = Infinity;
        for (const outro of events) {
          if (outro.id === ev.id) continue;
          const w = rows[i]?.[outro.id];
          if (w == null) continue;
          menorDist = Math.min(menorDist, Math.abs(v - w));
        }
        if (menorDist === Infinity) menorDist = 0;
        if (menorDist > melhor) {
          melhor = menorDist;
          melhorIdx = i;
        }
      }
      anchors[ev.id] = melhorIdx;
    }

    return { rows, xMin: min, xMax: max, labelAnchors: anchors };
  }, [events, metric, alignment, mode]);

  const formatY = (v: number | string) => fmtMetricCurto(Number(v), metric);

  const tituloMetrica = METRIC_LABEL[metric];
  const descricao =
    alignment === "abertura"
      ? "Contado a partir do primeiro dia de venda de cada evento."
      : "Contado a partir do dia de cada evento.";

  // Leitura sempre visível, no padrão de /eventos: começa no fim da série e
  // acompanha o cursor, em vez de só aparecer no hover.
  const idx = Math.min(
    Math.max(indiceAtivo ?? rows.length - 1, 0),
    Math.max(rows.length - 1, 0),
  );
  /**
   * Arrasto da alça. O passo vem da largura real da plotagem dividida pelo
   * número de pontos, para o dedo andar o mesmo tanto que o cursor andaria
   * sobre o próprio gráfico.
   */
  const iniciarArrasto = (e: React.PointerEvent<HTMLSpanElement>) => {
    const largura = (plotRef.current?.clientWidth ?? 0) - PLOT_ESQ - PLOT_DIR;
    const passoPx =
      rows.length > 1 && largura > 0 ? largura / (rows.length - 1) : 8;
    const inicioX = e.clientX;
    const inicioIdx = idx;
    e.currentTarget.setPointerCapture(e.pointerId);
    setArrastando(true);

    const mover = (ev: PointerEvent) => {
      const delta = Math.round((ev.clientX - inicioX) / passoPx);
      setIndiceAtivo(Math.min(Math.max(inicioIdx + delta, 0), rows.length - 1));
    };
    const soltar = () => {
      setArrastando(false);
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", soltar);
  };

  // Forma funcional: dois cliques seguidos no mesmo tick não podem partir do
  // índice antigo.
  const andar = (passo: number) =>
    setIndiceAtivo((prev) => {
      const atual = Math.min(
        Math.max(prev ?? rows.length - 1, 0),
        rows.length - 1,
      );
      return Math.min(Math.max(atual + passo, 0), rows.length - 1);
    });
  const linhaAtiva = rows[idx];
  const xAtivo = linhaAtiva ? Number(linhaAtiva.x) : 0;
  const pctAtivo = xMax === xMin ? 0 : (xAtivo - xMin) / (xMax - xMin);

  const useFill = events.length <= 2;
  const resumoAcessivel = `${tituloMetrica} ${mode === "acumulado" ? "acumulado" : "por dia"} ${JANELA_LABEL}, comparando ${events.map((e) => e.curto).join(", ")}.`;

  return (
    <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
      <header className="flex flex-col gap-3 border-b border-secondary px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-md font-semibold text-primary">
            {tituloMetrica} {mode === "acumulado" ? "acumulado" : "por dia"}
          </h3>
          <p className="text-sm text-tertiary">
            {descricao} Recorte {JANELA_LABEL}.
          </p>
        </div>
        <ButtonGroup
          size="sm"
          aria-label="Curva acumulada ou por dia"
          selectedKeys={[mode]}
          onSelectionChange={(k: Set<React.Key> | "all") =>
            k !== "all" && setMode([...k][0] as Mode)
          }
        >
          <ButtonGroupItem id="acumulado">Acumulado</ButtonGroupItem>
          <ButtonGroupItem id="diario">Por dia</ButtonGroupItem>
        </ButtonGroup>
      </header>

      <div aria-live="polite" className="sr-only">
        {resumoAcessivel}
      </div>

      {/* O reset fica no contêiner: sair do SVG nem sempre dispara o
                onMouseLeave do próprio gráfico. */}
      <div
        className="w-full px-2 pt-4 pb-2 text-tertiary md:px-4"
        onMouseLeave={() => !arrastando && setIndiceAtivo(null)}
      >
        {/* Banda do badge, acima da área de plotagem e alinhada com ela:
                    os mesmos offsets do eixo Y e das margens do gráfico. */}
        <div className="relative z-20 h-[84px]">
          {linhaAtiva && (
            <div
              className="absolute top-0"
              style={{
                left: `calc(${PLOT_ESQ}px + (100% - ${PLOT_ESQ + PLOT_DIR}px) * ${pctAtivo})`,
                transform: ancoraBadge(pctAtivo),
              }}
            >
              <div className="flex w-max flex-col gap-1 rounded-lg bg-primary-solid px-3 py-2 shadow-lg">
                <span className="text-sm font-semibold whitespace-nowrap text-white">
                  {labelTempo(xAtivo, alignment)}
                </span>
                <ul className="flex flex-col gap-0.5">
                  {events.map((ev) => {
                    const v = linhaAtiva[ev.id];
                    return (
                      <li
                        key={ev.id}
                        className="flex items-baseline gap-2 text-sm whitespace-nowrap"
                      >
                        <span
                          aria-hidden="true"
                          className="size-2 shrink-0 translate-y-0.5 rounded-full"
                          style={{ background: ev.cor }}
                        />
                        <span className="text-tooltip-supporting-text">
                          {ev.curto}
                        </span>
                        <span className="ml-auto pl-3 font-semibold text-white tabular-nums">
                          {v == null
                            ? "sem venda"
                            : fmtMetric(Number(v), metric)}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {/* Só no mobile: sem hover, a alça e as setas são o que permite
                    percorrer a série. No desktop o ponteiro já faz isso, então o
                    badge fica só com os valores. */}
                <div className="mt-0.5 flex items-center justify-between gap-3 border-t border-white/10 pt-1.5 md:hidden">
                  <button
                    type="button"
                    onClick={() => andar(-1)}
                    disabled={idx === 0}
                    aria-label="Ponto anterior"
                    className="flex size-6 items-center justify-center rounded text-white/60 transition duration-100 ease-linear hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                  </button>
                  <span
                    role="slider"
                    tabIndex={0}
                    aria-label="Arraste para percorrer a série"
                    aria-valuemin={0}
                    aria-valuemax={rows.length - 1}
                    aria-valuenow={idx}
                    aria-valuetext={labelTempo(xAtivo, alignment)}
                    onPointerDown={iniciarArrasto}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowLeft") {
                        e.preventDefault();
                        andar(-1);
                      }
                      if (e.key === "ArrowRight") {
                        e.preventDefault();
                        andar(1);
                      }
                    }}
                    className={cx(
                      "flex size-6 touch-none items-center justify-center rounded text-white/40 transition duration-100 ease-linear hover:bg-white/10 hover:text-white/70",
                      arrastando ? "cursor-grabbing text-white/70" : "cursor-grab",
                    )}
                  >
                    <DotsGrid className="size-4" aria-hidden="true" />
                  </span>
                  <button
                    type="button"
                    onClick={() => andar(1)}
                    disabled={idx === rows.length - 1}
                    aria-label="Próximo ponto"
                    className="flex size-6 items-center justify-center rounded text-white/60 transition duration-100 ease-linear hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div ref={plotRef} className="relative z-0 h-[260px] w-full md:h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={rows}
              className="[&_.recharts-text]:text-sm"
              margin={{
                top: PLOT_TOPO,
                right: PLOT_DIR,
                bottom: 4,
                left: PLOT_MARGEM_ESQ,
              }}
              desc={resumoAcessivel}
              onMouseMove={(estado: {
                activeTooltipIndex?: number | string;
              }) => {
                const i = Number(estado?.activeTooltipIndex);
                if (Number.isFinite(i)) setIndiceAtivo(i);
              }}
              onMouseLeave={() => !arrastando && setIndiceAtivo(null)}
              onTouchMove={(estado: {
                activeTooltipIndex?: number | string;
              }) => {
                const i = Number(estado?.activeTooltipIndex);
                if (Number.isFinite(i)) setIndiceAtivo(i);
              }}
            >
              <defs>
                {events.map((ev) => (
                  <linearGradient
                    key={ev.id}
                    id={`vgrad-${ev.id}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={ev.cor} stopOpacity={0.24} />
                    <stop offset="85%" stopColor={ev.cor} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="currentColor"
                className="text-utility-neutral-100"
              />
              <XAxis
                dataKey="x"
                type="number"
                domain={[xMin, xMax]}
                tickFormatter={(x: number) => formatXRelativo(x, alignment)}
                fill="currentColor"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={32}
              />
              <YAxis
                tickFormatter={formatY}
                fill="currentColor"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                // 72 quebrava "R$ 800 mil" em duas linhas no celular.
                width={84}
              />
              {/* Marca o ponto que a leitura acima está mostrando. */}
              {linhaAtiva && (
                <ReferenceLine
                  x={xAtivo}
                  stroke="var(--color-border-primary)"
                  strokeWidth={2}
                />
              )}
              <ReferenceLine
                x={0}
                stroke="var(--color-border-primary)"
                strokeDasharray="3 3"
              >
                <Label
                  value={alignment === "abertura" ? "Abertura" : "Evento"}
                  // A linha fica na borda, então o rótulo precisa cair para dentro.
                  position={
                    alignment === "abertura"
                      ? "insideTopLeft"
                      : "insideTopRight"
                  }
                  className="fill-current text-sm text-tertiary"
                />
              </ReferenceLine>
              {events.map((ev) => (
                <Area
                  key={ev.id}
                  type={mode === "acumulado" ? "monotone" : "linear"}
                  dataKey={ev.id}
                  name={ev.curto}
                  stroke={ev.cor}
                  strokeWidth={2.5}
                  strokeDasharray={ev.traco === "0" ? undefined : ev.traco}
                  fill={useFill ? `url(#vgrad-${ev.id})` : "none"}
                  dot={false}
                  isAnimationActive={false}
                  activeDot={false}
                >
                  <LabelList
                    dataKey={ev.id}
                    content={(p: { x?: number; y?: number; index?: number }) =>
                      p.index === labelAnchors[ev.id] &&
                      p.x != null &&
                      p.y != null ? (
                        <text
                          x={p.x}
                          y={p.y}
                          dy={-10}
                          className="text-sm"
                          fontWeight={600}
                          fill={ev.cor}
                          textAnchor="middle"
                        >
                          {ev.curto}
                        </text>
                      ) : null
                    }
                  />
                </Area>
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  Por mês de calendário                                             */
/* ------------------------------------------------------------------ */

const MESES_CURTO = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

/**
 * Quando, no calendário, cada evento faturou.
 * A versão anterior deste bloco agrupava por `getMonth()`, ou seja, pelo índice
 * do mês sem o ano, então outubro de 2025 e outubro de 2026 caíam na mesma
 * barra. Aqui a chave é ano mais mês e o eixo só mostra os meses em que alguém
 * de fato vendeu, em ordem cronológica.
 */
const FaturamentoPorMes = ({
  events,
  metric,
}: {
  events: EventoSerie[];
  metric: Metric;
}) => {
  const { rows, totais } = useMemo(() => {
    const campo = METRIC_FIELD[metric];
    const chaves = new Set<string>();
    const porEvento = new Map<string, Map<string, number>>();

    for (const ev of events) {
      const range = windowRange(ev);
      const meses = new Map<string, number>();
      for (let d = range[0]; d <= range[1]; d++) {
        const s = ev.serie[d];
        if (!s) continue;
        const data = addDias(ev.dataAbertura, d);
        const chave = `${data.getFullYear()}-${String(data.getMonth()).padStart(2, "0")}`;
        chaves.add(chave);
        const valor =
          metric === "faturamento" ? s[campo] * (1 - ev.taxaPct) : s[campo];
        meses.set(chave, (meses.get(chave) ?? 0) + valor);
      }
      porEvento.set(ev.id, meses);
    }

    const rows = [...chaves].sort().map((chave) => {
      const [ano, mes] = chave.split("-").map(Number);
      const row: Record<string, number | string> = {
        chave,
        label: `${MESES_CURTO[mes]}/${String(ano).slice(2)}`,
      };
      for (const ev of events) {
        const v = porEvento.get(ev.id)?.get(chave);
        if (v != null) row[ev.id] = v;
      }
      return row;
    });

    const totais = events.map((ev) => ({
      ev,
      total: [...(porEvento.get(ev.id)?.values() ?? [])].reduce(
        (a, b) => a + b,
        0,
      ),
      meses: porEvento.get(ev.id)?.size ?? 0,
    }));

    return { rows, totais };
  }, [events, metric]);

  const ChartTooltip = ({
    active,
    label,
    payload,
  }: {
    active?: boolean;
    label?: string;
    payload?: { payload: Record<string, number | string> }[];
  }) => {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return (
      <div className="flex flex-col gap-1.5 rounded-lg bg-primary-solid px-3 py-2.5 shadow-lg">
        <p className="text-sm font-semibold text-white">{String(label)}</p>
        <ul className="flex flex-col gap-1">
          {events.map((ev) => {
            const v = row[ev.id];
            return (
              <li key={ev.id} className="flex items-center gap-2 text-sm">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: ev.cor }}
                />
                <span className="text-tooltip-supporting-text">{ev.curto}</span>
                <span className="ml-auto pl-3 font-semibold text-white tabular-nums">
                  {/* Fora da janela e venda zerada são coisas diferentes. */}
                  {v == null
                    ? "fora da janela"
                    : Number(v) === 0
                      ? "sem venda"
                      : fmtMetric(Number(v), metric)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
      <header className="flex flex-col gap-1 border-b border-secondary px-4 py-4 md:px-5">
        <h3 className="text-md font-semibold text-primary">
          {METRIC_LABEL[metric]} por mês
        </h3>
        <p className="text-sm text-tertiary">
          Quando, no calendário, cada evento faturou.
        </p>
      </header>

      <div className="h-60 w-full px-1 pt-4 pb-2 text-tertiary md:h-[340px] md:px-4 md:pt-5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            className="[&_.recharts-text]:text-sm"
            margin={{ top: 12, right: 12, bottom: 4, left: 0 }}
            desc={`${METRIC_LABEL[metric]} por mês de calendário, comparando ${events.map((e) => e.curto).join(", ")}.`}
          >
            <CartesianGrid
              vertical={false}
              stroke="currentColor"
              className="text-utility-neutral-100"
            />
            <XAxis
              dataKey="label"
              fill="currentColor"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis
              tickFormatter={(v) => fmtMetricCurto(Number(v), metric)}
              fill="currentColor"
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              width={84}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: "var(--color-bg-secondary)", opacity: 0.5 }}
            />
            {events.map((ev) => (
              <Bar
                key={ev.id}
                dataKey={ev.id}
                name={ev.curto}
                fill={ev.cor}
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* A cor sozinha não identifica a barra (WCAG 1.4.1), então o total de
                cada evento vem escrito aqui embaixo. */}
      <ul className="flex flex-col divide-y divide-secondary border-t border-secondary">
        {totais.map(({ ev, total, meses }) => (
          <li
            key={ev.id}
            className="flex items-baseline justify-between gap-3 px-4 py-3 md:px-5"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: ev.cor }}
              />
              <span className="truncate text-sm font-medium text-secondary">
                {ev.curto}
              </span>
            </span>
            <span className="shrink-0 text-sm text-tertiary tabular-nums">
              {fmtMetric(total, metric)} em {meses}{" "}
              {meses === 1 ? "mês" : "meses"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  Ritmo por faixa de dias (barras, não mapa de calor)               */
/* ------------------------------------------------------------------ */

interface Faixa {
  id: string;
  label: string;
  lo: number;
  hi: number;
  /** Faixa de largura aberta: não é comparável em área com as demais. */
  aberta?: boolean;
}

/**
 * Cinco faixas. A mais próxima do evento tem 15 dias, que é a janela em que a
 * venda costuma decidir; as de trás vão alargando, porque ali o dia a dia
 * importa menos. Como as larguras diferem, o rótulo da coluna traz o intervalo
 * em dias: uma faixa de 30 dias naturalmente acumula mais que uma de 15.
 */
const FAIXAS: Faixa[] = [
  { id: "f1", lo: 0, hi: 14, label: "1 a 15" },
  { id: "f2", lo: 15, hi: 29, label: "16 a 30" },
  { id: "f3", lo: 30, hi: 59, label: "31 a 60" },
  { id: "f4", lo: 60, hi: 89, label: "61 a 90" },
  { id: "f5", lo: 90, hi: Infinity, label: "Mais de 90", aberta: true },
];

const RitmoPorFaixa = ({
  events,
  metric,
  alignment,
}: {
  events: EventoSerie[];
  metric: Metric;
  alignment: Alignment;
}) => {
  const field = METRIC_FIELD[metric];
  // No alinhamento pelo evento o tempo corre da faixa mais distante para o dia do show.
  const faixas = alignment === "abertura" ? FAIXAS : [...FAIXAS].reverse();

  const { rows, maxPct } = useMemo(() => {
    let maior = 0;
    const rows = events.map((ev) => {
      const range = windowRange(ev);
      const values: Record<string, number> = {};
      const presente: Record<string, boolean> = {};
      let total = 0;
      for (let d = range[0]; d <= range[1]; d++) {
        const s = ev.serie[d];
        if (!s) continue;
        total += s[field];
        const rel = alignment === "abertura" ? d - range[0] : range[1] - d;
        const f = FAIXAS.find((f) => rel >= f.lo && rel <= f.hi);
        if (f) {
          values[f.id] = (values[f.id] ?? 0) + s[field];
          presente[f.id] = true;
        }
      }
      const pcts: Record<string, number> = {};
      for (const f of FAIXAS) {
        if (!presente[f.id]) continue;
        const pct = total > 0 ? (values[f.id] ?? 0) / total : 0;
        pcts[f.id] = pct;
        maior = Math.max(maior, pct);
      }
      const pico = FAIXAS.filter((f) => presente[f.id]).sort(
        (a, b) => (pcts[b.id] ?? 0) - (pcts[a.id] ?? 0),
      )[0];
      return { ev, total, pcts, presente, pico, dias: range[1] - range[0] + 1 };
    });
    return { rows, maxPct: maior || 1 };
  }, [events, field, alignment]);

  const sufixo =
    alignment === "abertura" ? "dias após a abertura" : "dias antes do evento";

  return (
    <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
      <header className="flex flex-col gap-1 border-b border-secondary px-4 py-4">
        <h3 className="text-md font-semibold text-primary">
          Em que momento cada evento vendeu
        </h3>
        <p className="text-sm text-tertiary">
          Fatia do total de cada evento por faixa de {sufixo}.
        </p>
      </header>

      {/* Base: faixa como título e os eventos embaixo, que é a mesma forma
                da lista de "Os números" e cabe em 375px sem rolagem lateral. */}
      <ul className="flex flex-col divide-y divide-secondary md:hidden">
        {faixas.map((f) => (
          <li key={f.id} className="flex flex-col gap-2 px-4 py-3">
            <span className="text-sm font-medium text-secondary">
              {f.label} {sufixo}
            </span>
            <ul className="flex flex-col gap-2">
              {rows.map((row) => {
                const presente = row.presente[f.id];
                const pct = row.pcts[f.id] ?? 0;
                return (
                  <li key={row.ev.id} className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: row.ev.cor }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-secondary">
                      {row.ev.curto}
                    </span>
                    {presente ? (
                      <>
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-20 shrink-0 overflow-clip rounded-full bg-quaternary"
                        >
                          <span
                            className="block h-full rounded-full"
                            style={{
                              width: `${(pct / maxPct) * 100}%`,
                              background: row.ev.cor,
                            }}
                          />
                        </span>
                        <span
                          className={cx(
                            "w-11 shrink-0 text-right text-sm tabular-nums",
                            row.pico?.id === f.id
                              ? "font-semibold text-primary"
                              : "text-secondary",
                          )}
                        >
                          {Math.round(pct * 100)}%
                        </span>
                      </>
                    ) : (
                      <span className="shrink-0 text-sm text-quaternary">
                        fora da janela
                        <span className="sr-only"> de vendas deste evento</span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto overflow-y-clip md:block">
        <table className="w-full border-collapse">
          <caption className="sr-only">
            Fatia do total de cada evento por faixa de {sufixo},{" "}
            {JANELA_LABEL}.
          </caption>
          <thead className="bg-secondary">
            <tr className="border-b border-secondary text-left">
              <th
                scope="col"
                className="sticky left-0 z-10 whitespace-nowrap bg-secondary px-4 py-3 text-sm font-semibold text-tertiary"
              >
                Evento
              </th>
              {faixas.map((f) => (
                <th
                  key={f.id}
                  scope="col"
                  className="whitespace-nowrap px-3 py-3 text-right text-sm font-semibold text-tertiary"
                >
                  {f.label}
                  {f.aberta && (
                    <span className="sr-only">
                      {" "}
                      dias, faixa de duração aberta
                    </span>
                  )}
                </th>
              ))}
              <th
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-tertiary"
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.ev.id}
                className={cx(
                  i !== rows.length - 1 && "border-b border-secondary",
                )}
              >
                <th
                  scope="row"
                  className="sticky left-0 z-10 whitespace-nowrap bg-primary px-4 py-3 text-left font-normal"
                >
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: row.ev.cor }}
                    />
                    <span className="text-sm font-medium text-primary">
                      {row.ev.curto}
                    </span>
                  </span>
                </th>
                {faixas.map((f) => {
                  const presente = row.presente[f.id];
                  const pct = row.pcts[f.id] ?? 0;
                  return (
                    <td key={f.id} className="px-3 py-3 align-middle">
                      {presente ? (
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={cx(
                              "text-sm tabular-nums",
                              row.pico?.id === f.id
                                ? "font-semibold text-primary"
                                : "text-secondary",
                            )}
                          >
                            {Math.round(pct * 100)}%
                          </span>
                          <span
                            aria-hidden="true"
                            className="flex h-1.5 w-full min-w-10 justify-end rounded-full bg-quaternary"
                          >
                            <span
                              className="h-full rounded-full"
                              style={{
                                width: `${(pct / maxPct) * 100}%`,
                                background: row.ev.cor,
                              }}
                            />
                          </span>
                        </div>
                      ) : (
                        <span
                          className="block text-right text-sm text-quaternary"
                          title="Fora da janela de vendas deste evento"
                        >
                          fora
                          <span className="sr-only">
                            {" "}
                            da janela de vendas deste evento
                          </span>
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-primary tabular-nums">
                  {fmtMetric(
                    metric === "faturamento"
                      ? row.total * (1 - row.ev.taxaPct)
                      : row.total,
                    metric,
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  Preço: escada de lotes com a amplitude anotada na própria linha    */
/* ------------------------------------------------------------------ */

const PrecoEAmplitude = ({
  events,
  alignment,
}: {
  events: EventoSerie[];
  alignment: Alignment;
}) => {
  const { rows, xMin, xMax, resumo } = useMemo(() => {
    const xs = new Set<number>();
    const janelas = new Map<string, [number, number]>();
    for (const ev of events) {
      const range = windowRange(ev);
      janelas.set(ev.id, range);
      const paraX = (dia: number) =>
        alignment === "abertura" ? dia : dia - (ev.janelaDias - 1);
      xs.add(paraX(range[0]));
      xs.add(paraX(range[1]));
      for (const degrau of ev.precos) {
        if (degrau.dia < range[0] || degrau.dia > range[1]) continue;
        xs.add(paraX(degrau.dia));
      }
    }
    const ordenados = [...xs].sort((a, b) => a - b);

    const rows = ordenados.map((x) => {
      const row: Record<string, number> = { x };
      for (const ev of events) {
        const range = janelas.get(ev.id)!;
        const dia = alignment === "abertura" ? x : x + (ev.janelaDias - 1);
        if (dia < range[0] || dia > range[1]) continue;
        const vigente = [...ev.precos]
          .reverse()
          .find((degrau) => degrau.dia <= dia);
        if (vigente) row[ev.id] = vigente.valor;
      }
      return row;
    });

    const resumo = events.map((ev) => {
      const range = janelas.get(ev.id)!;
      const noRecorte = ev.precos.filter(
        (d) => d.dia >= range[0] && d.dia <= range[1],
      );
      const vigenteNoInicio = [...ev.precos]
        .reverse()
        .find((d) => d.dia <= range[0]);
      const inicial = vigenteNoInicio?.valor ?? noRecorte[0]?.valor ?? 0;
      const topo = noRecorte.at(-1)?.valor ?? inicial;
      const viradas = noRecorte.filter((d) => d.dia > range[0]).length;
      return {
        ev,
        inicial,
        topo,
        alta: inicial ? topo / inicial - 1 : 0,
        viradas,
        degraus: ev.precos,
      };
    });

    return {
      rows,
      xMin: ordenados[0] ?? 0,
      xMax: ordenados.at(-1) ?? 0,
      resumo,
    };
  }, [events, alignment]);

  const ChartTooltip = ({
    active,
    label,
    payload,
  }: {
    active?: boolean;
    label?: number;
    payload?: { dataKey: string; value: number }[];
  }) => {
    if (!active || !payload?.length) return null;
    const porId = new Map(payload.map((p) => [p.dataKey, p]));
    const linhas = events
      .map((ev) => ({ ev, entry: porId.get(ev.id) }))
      .filter((l) => l.entry != null);
    if (linhas.length === 0) return null;
    const x = Number(label);

    return (
      <div className="flex flex-col gap-1.5 rounded-lg bg-primary-solid px-3 py-2.5 shadow-lg">
        <p className="text-sm font-semibold text-white">
          {labelTempo(x, alignment)}
        </p>
        <ul className="flex flex-col gap-1">
          {linhas.map(({ ev, entry }) => {
            const dia = alignment === "abertura" ? x : x + (ev.janelaDias - 1);
            const vigente = [...ev.precos].reverse().find((d) => d.dia <= dia);
            return (
              <li key={ev.id} className="flex items-center gap-2 text-sm">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: ev.cor }}
                />
                <span className="text-tooltip-supporting-text">
                  {ev.curto}
                  {vigente ? ` · ${vigente.nome}` : ""}
                </span>
                <span className="ml-auto pl-3 font-semibold text-white tabular-nums">
                  {currencyFormatter.format(Number(entry!.value))}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
      <header className="flex flex-col gap-1 border-b border-secondary px-5 py-4">
        <h3 className="text-md font-semibold text-primary">
          Preço praticado e viradas de lote
        </h3>
        <p className="text-sm text-tertiary">
          O preço vigente a cada momento da venda. Compare com a curva acima
          para ver se o ritmo reagiu a cada virada de lote.
        </p>
      </header>

      <div className="h-60 w-full px-1 pt-4 pb-2 text-tertiary md:h-[340px] md:px-4 md:pt-5">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={rows}
            className="[&_.recharts-text]:text-sm"
            margin={{ top: 12, right: 12, bottom: 4, left: 0 }}
            desc={`Preço praticado por ${events.map((e) => e.curto).join(", ")} ao longo da venda.`}
          >
            <CartesianGrid
              vertical={false}
              stroke="currentColor"
              className="text-utility-neutral-100"
            />
            <XAxis
              dataKey="x"
              type="number"
              domain={[xMin, xMax]}
              tickFormatter={(x: number) => formatXRelativo(x, alignment)}
              fill="currentColor"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={32}
            />
            <YAxis
              // Sem centavos: "R$ 280,00" comia um terço da largura no celular.
              tickFormatter={(v) => fmtDinheiroCurto(Number(v))}
              fill="currentColor"
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              width={64}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: "var(--color-border-primary)", strokeWidth: 2 }}
            />
            {events.map((ev) => (
              <Line
                key={ev.id}
                type="stepAfter"
                dataKey={ev.id}
                name={ev.curto}
                stroke={ev.cor}
                strokeWidth={2.5}
                strokeDasharray={ev.traco === "0" ? undefined : ev.traco}
                dot={false}
                isAnimationActive={false}
              />
            ))}
            {/* Marco de cada virada de lote, sobre a própria curva. */}
            {resumo.flatMap(({ ev, degraus }) =>
              degraus
                .filter((d) => {
                  const x =
                    alignment === "abertura"
                      ? d.dia
                      : d.dia - (ev.janelaDias - 1);
                  return x >= xMin && x <= xMax;
                })
                .map((d) => (
                  <ReferenceDot
                    key={`${ev.id}-${d.dia}`}
                    x={
                      alignment === "abertura"
                        ? d.dia
                        : d.dia - (ev.janelaDias - 1)
                    }
                    y={d.valor}
                    r={3.5}
                    fill="var(--color-bg-primary)"
                    stroke={ev.cor}
                    strokeWidth={2}
                    isFront
                  />
                )),
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ul className="flex flex-col divide-y divide-secondary border-t border-secondary">
        {resumo.map(({ ev, inicial, topo, alta, viradas }) => (
          <li key={ev.id} className="flex flex-col gap-1 px-4 py-3 md:px-5">
            <span className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: ev.cor }}
                />
                <span className="truncate text-sm font-medium text-secondary">
                  {ev.curto}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-primary tabular-nums">
                {alta >= 0 ? "+" : ""}
                {Math.round(alta * 100)}%
              </span>
            </span>
            <span className="text-sm text-tertiary tabular-nums">
              {currencyFormatter.format(inicial)} a{" "}
              {currencyFormatter.format(topo)} em {viradas}{" "}
              {viradas === 1 ? "virada" : "viradas"} de lote
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  Tabela comparativa (métrica × evento), com referência e variação   */
/* ------------------------------------------------------------------ */

type Direcao = "maiorMelhor" | "neutra";

interface LinhaTabela {
  label: string;
  icon: typeof CurrencyDollarCircle;
  direcao: Direcao;
  valor: (x: { ev: EventoSerie; t: EventoTotais }) => number;
  texto: (x: { ev: EventoSerie; t: EventoTotais }) => string;
  /** Variação em pontos percentuais, não em porcentagem relativa. */
  pontosPercentuais?: boolean;
  /** Linhas em que comparar não significa nada (a própria linha já é uma diferença). */
  semVariacao?: boolean;
}

const LINHAS: LinhaTabela[] = [
  {
    label: "Faturamento bruto",
    icon: CurrencyDollarCircle,
    direcao: "maiorMelhor",
    valor: ({ t }) => t.bruto,
    texto: ({ t }) => currencyFormatter.format(t.bruto),
  },
  {
    label: "Taxas retidas",
    icon: Percent03,
    direcao: "neutra",
    semVariacao: true,
    valor: ({ t }) => t.taxas,
    texto: ({ ev, t }) =>
      `${currencyFormatter.format(t.taxas)} (${(ev.taxaPct * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%)`,
  },
  {
    label: "Faturamento líquido",
    icon: CurrencyDollarCircle,
    direcao: "maiorMelhor",
    valor: ({ t }) => t.liquido,
    texto: ({ t }) => currencyFormatter.format(t.liquido),
  },
  {
    label: "Ingressos vendidos",
    icon: Ticket01,
    direcao: "maiorMelhor",
    valor: ({ t }) => t.ingressos,
    texto: ({ t }) => numberFormatter.format(t.ingressos),
  },
  {
    label: "Transações",
    icon: Receipt,
    direcao: "maiorMelhor",
    valor: ({ t }) => t.transacoes,
    texto: ({ t }) => numberFormatter.format(t.transacoes),
  },
  {
    label: "Ticket médio",
    icon: Receipt,
    direcao: "neutra",
    valor: ({ t }) => t.ticketMedio,
    texto: ({ t }) => currencyFormatter.format(t.ticketMedio),
  },
  {
    label: "Repasse por ingresso",
    icon: CurrencyDollarCircle,
    direcao: "maiorMelhor",
    valor: ({ t }) => t.repassePorIngresso,
    texto: ({ t }) => currencyFormatter.format(t.repassePorIngresso),
  },
  {
    label: "Ocupação",
    icon: Users01,
    direcao: "maiorMelhor",
    pontosPercentuais: true,
    valor: ({ t }) => t.pctCapacidade,
    texto: ({ ev, t }) =>
      `${t.pctCapacidade.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% de ${numberFormatter.format(ev.capacidade)}`,
  },
  {
    label: "Melhor dia",
    icon: TrendUp01,
    direcao: "maiorMelhor",
    valor: ({ t }) => t.melhorDiaLiquido,
    texto: ({ t }) => currencyFormatter.format(t.melhorDiaLiquido),
  },
  {
    label: "Dias de venda no recorte",
    icon: Calendar,
    direcao: "neutra",
    semVariacao: true,
    valor: ({ t }) => t.diasNoRecorte,
    texto: ({ t }) => `${t.diasNoRecorte} dias`,
  },
];

type ItemTotais = { ev: EventoSerie; t: EventoTotais };

/** Variação de uma linha contra a referência, já resolvida para render. */
function variacaoDe(linha: LinhaTabela, item: ItemTotais, base: ItemTotais) {
  if (item.ev.id === base.ev.id || linha.semVariacao) return null;
  const v = linha.valor(item);
  const vBase = linha.valor(base);
  const delta = linha.pontosPercentuais
    ? v - vBase
    : vBase === 0
      ? null
      : v / vBase - 1;
  if (delta == null) return null;
  const comDirecao = linha.direcao !== "neutra";
  const positivo = delta > 0;
  const numero = linha.pontosPercentuais
    ? `${Math.abs(delta).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} p.p.`
    : `${comDirecao ? Math.abs(Math.round(delta * 100)) : Math.round(delta * 100)}%`;
  return {
    positivo,
    comDirecao,
    texto: `${comDirecao ? (positivo ? "▲ +" : "▼ ") : positivo ? "+" : ""}${numero}`,
    classe: !comDirecao
      ? "text-tertiary"
      : positivo
        ? "text-success-primary"
        : "text-error-primary",
  };
}

/** Variação em texto, com a direção também fora da cor (WCAG 1.4.1). */
const Variacao = ({
  v,
  referencia,
}: {
  v: ReturnType<typeof variacaoDe>;
  referencia: string;
}) =>
  v ? (
    <span className={cx("text-sm tabular-nums", v.classe)}>
      {v.texto}
      <span className="sr-only">
        {v.positivo ? " acima de " : " abaixo de "}
        {referencia}
      </span>
    </span>
  ) : null;

const ComparativoTable = ({
  events,
  metric,
}: {
  events: EventoSerie[];
  metric: Metric;
}) => {
  const totais = events.map((ev) => ({
    ev,
    t: totaisDe(ev, windowRange(ev)),
  }));
  // A referência é sempre o evento atual, que é sempre o primeiro da seleção.
  const base = totais[0];

  // A linha da métrica escolhida no topo fica destacada, para ligar a tabela ao resto da página.
  const linhaDaMetrica =
    metric === "faturamento"
      ? "Faturamento líquido"
      : metric === "ingressos"
        ? "Ingressos vendidos"
        : "Transações";

  return (
    <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
      <header className="flex flex-col gap-1 border-b border-secondary px-4 py-4">
        <h3 className="text-md font-semibold text-primary">Os números</h3>
        <p className="text-sm text-tertiary">
          Valores {JANELA_LABEL}. As variações são contra{" "}
          {base.ev.curto}.
        </p>
      </header>
      {/* Base: uma lista por métrica, que cabe em 375px sem rolagem lateral. */}
      <ul className="flex flex-col divide-y divide-secondary md:hidden">
        {LINHAS.map((linha) => (
          <li
            key={linha.label}
            className={cx(
              "flex flex-col gap-2 px-4 py-3",
              linha.label === linhaDaMetrica && "bg-secondary_subtle",
            )}
          >
            <span className="flex items-center gap-2">
              <linha.icon
                aria-hidden="true"
                className="size-4 shrink-0 text-fg-quaternary"
              />
              <span
                className={cx(
                  "text-sm",
                  linha.label === linhaDaMetrica
                    ? "font-semibold text-primary"
                    : "font-medium text-secondary",
                )}
              >
                {linha.label}
              </span>
            </span>
            <ul className="flex flex-col gap-1.5">
              {totais.map((item) => (
                <li
                  key={item.ev.id}
                  className="flex items-baseline justify-between gap-3"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: item.ev.cor }}
                    />
                    <span className="truncate text-sm text-secondary">
                      {item.ev.curto}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-baseline gap-2">
                    <span className="text-sm font-medium text-primary tabular-nums">
                      {linha.texto(item)}
                    </span>
                    <Variacao
                      v={variacaoDe(linha, item, base)}
                      referencia={base.ev.nome}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto overflow-y-clip md:block">
        <table className="w-full border-collapse">
          <caption className="sr-only">
            Métricas de cada evento {JANELA_LABEL}, com a
            variação contra {base.ev.nome}.
          </caption>
          <thead className="sticky top-0 z-20 bg-secondary">
            <tr className="border-b border-secondary text-left">
              <th
                scope="col"
                className="sticky left-0 z-10 bg-secondary px-4 py-3 text-sm font-semibold text-tertiary"
              >
                Métrica
              </th>
              {totais.map(({ ev }) => (
                <th
                  key={ev.id}
                  scope="col"
                  className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-tertiary"
                >
                  <span className="inline-flex flex-col items-end gap-0.5">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className="size-2.5 rounded-full"
                        style={{ background: ev.cor }}
                      />
                      {ev.curto}
                    </span>
                    {ev.id === base.ev.id && (
                      <span className="font-normal text-quaternary">
                        Referência
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LINHAS.map((linha, i) => (
              <tr
                key={linha.label}
                className={cx(
                  i !== LINHAS.length - 1 && "border-b border-secondary",
                  linha.label === linhaDaMetrica && "bg-secondary_subtle",
                )}
              >
                <th
                  scope="row"
                  className="sticky left-0 z-10 whitespace-nowrap bg-primary px-4 py-3.5 text-left text-sm font-normal text-secondary"
                >
                  <span className="flex items-center gap-2">
                    <linha.icon
                      aria-hidden="true"
                      className="size-4 shrink-0 text-fg-quaternary"
                    />
                    <span
                      className={cx(
                        linha.label === linhaDaMetrica &&
                          "font-semibold text-primary",
                      )}
                    >
                      {linha.label}
                    </span>
                  </span>
                </th>
                {totais.map((item) => (
                  <td
                    key={item.ev.id}
                    className="whitespace-nowrap px-4 py-3.5 text-right align-top"
                  >
                    <span className="flex flex-col items-end gap-0.5">
                      <span className="text-sm font-medium text-primary tabular-nums">
                        {linha.texto(item)}
                      </span>
                      <Variacao
                        v={variacaoDe(linha, item, base)}
                        referencia={base.ev.nome}
                      />
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
