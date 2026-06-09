import { useMemo, useState, type ReactNode } from "react";
import { CheckCircle, ChevronRight, ClockFastForward, SearchLg, XClose } from "@untitledui/icons";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { Bar, CartesianGrid, Cell, ComposedChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MetricsIcon03 } from "@/components/application/metrics/metrics";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { RelatorioPageHeader } from "../components/RelatorioPageHeader";

/* ------------------------------------------------------------------ */
/*  Formatters                                                        */
/* ------------------------------------------------------------------ */

const numberFormatter = new Intl.NumberFormat("pt-BR");

const HIDE_TREND_AND_MENU = "[&_.top-4.right-4]:hidden [&_.md\\:top-5]:hidden [&_p+div]:hidden";

/* ------------------------------------------------------------------ */
/*  Mock data                                                         */
/* ------------------------------------------------------------------ */

interface SetorAcesso {
    id: string;
    nome: string;
    vendidos: number;
    validados: number;
}

const setores: SetorAcesso[] = [
    { id: "pista", nome: "Pista", vendidos: 1240, validados: 951 },
    { id: "pista-premium", nome: "Pista Premium", vendidos: 612, validados: 495 },
    { id: "camarote-a", nome: "Camarote A", vendidos: 148, validados: 124 },
    { id: "camarote-b", nome: "Camarote B", vendidos: 86, validados: 73 },
    { id: "camarote-central", nome: "Camarote Central", vendidos: 54, validados: 52 },
    { id: "mesa-vip", nome: "Mesa VIP", vendidos: 32, validados: 31 },
];

// Check-ins por faixa de 15 min — abertura 19:00, pico às 22:00.
interface Faixa {
    hora: string;
    checkins: number;
}

const faixas: Faixa[] = [
    { hora: "19:00", checkins: 20 },
    { hora: "19:15", checkins: 35 },
    { hora: "19:30", checkins: 60 },
    { hora: "19:45", checkins: 95 },
    { hora: "20:00", checkins: 130 },
    { hora: "20:15", checkins: 150 },
    { hora: "20:30", checkins: 160 },
    { hora: "20:45", checkins: 150 },
    { hora: "21:00", checkins: 130 },
    { hora: "21:15", checkins: 110 },
    { hora: "21:30", checkins: 95 },
    { hora: "21:45", checkins: 140 },
    { hora: "22:00", checkins: 451 },
];

/* ------------------------------------------------------------------ */
/*  Derived totals                                                    */
/* ------------------------------------------------------------------ */

const TOTAL_VENDIDOS = setores.reduce((s, x) => s + x.vendidos, 0);
const TOTAL_VALIDADOS = setores.reduce((s, x) => s + x.validados, 0);
const TOTAL_PENDENTES = TOTAL_VENDIDOS - TOTAL_VALIDADOS;

const picoFaixa = faixas.reduce((a, b) => (b.checkins > a.checkins ? b : a), faixas[0]);

const BAR_COLOR = "var(--color-brand-600)";

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function Acesso() {
    return (
        <BackstageLayout activeSection="relatorios" activeItem="acesso">
            <div className="flex min-w-0 flex-1 flex-col">
                <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
                    <RelatorioPageHeader title="Acesso" />

                    <MetricsRow />
                    <EntradasPorFaixaCard />
                    <ValidacaoPorSetorCard />
                    <ControleDeAcessoCard />
                </main>
            </div>
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Métricas                                                          */
/* ------------------------------------------------------------------ */

const MetricsRow = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricsIcon03
            icon={CheckCircle}
            title={numberFormatter.format(TOTAL_VALIDADOS)}
            subtitle="Validados"
            change={null}
            changeTrend="positive"
            actions={false}
            className={HIDE_TREND_AND_MENU}
        />
        <MetricsIcon03
            icon={ClockFastForward}
            title={numberFormatter.format(TOTAL_PENDENTES)}
            subtitle="Não validados"
            change={null}
            changeTrend="positive"
            actions={false}
            className={HIDE_TREND_AND_MENU}
        />
        <ValidacaoMetric />
    </div>
);

const ValidacaoMetric = () => {
    const pct = Math.round((TOTAL_VALIDADOS / TOTAL_VENDIDOS) * 100);
    const legendas = [
        { label: "Validado", pct, className: "bg-fg-brand-primary" },
        { label: "Não validado", pct: 100 - pct, className: "bg-quaternary" },
    ];

    return (
        <div className="rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset">
            <div className="flex h-full items-center gap-6 px-4 py-5 md:px-5">
                <ValidacaoDonut value={pct} />
                <ul className="flex min-w-0 flex-1 flex-col gap-2.5">
                    {legendas.map((item) => (
                        <li key={item.label} className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-2 text-sm text-secondary">
                                <span className={cx("size-2.5 shrink-0 rounded-full", item.className)} />
                                {item.label}
                            </span>
                            <span className="text-sm font-semibold text-primary tabular-nums">{item.pct}%</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const ValidacaoDonut = ({ value }: { value: number }) => {
    const size = 92;
    const stroke = 12;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    style={{ stroke: "var(--color-bg-quaternary)" }}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="stroke-fg-brand-primary transition-[stroke-dashoffset] duration-500"
                />
            </svg>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Entradas por faixa de horário                                     */
/* ------------------------------------------------------------------ */

interface ChartTooltipProps {
    active?: boolean;
    label?: string;
    payload?: { value: number | string }[];
}

const ChartTooltip = ({ active, label, payload }: ChartTooltipProps) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
        <div className="rounded-lg bg-primary-solid px-3 py-2.5 shadow-xl ring-1 ring-secondary_alt">
            <p className="mb-1 text-sm font-semibold text-white">{label}</p>
            <p className="text-xs text-white/70">
                <span className="font-semibold text-white">{numberFormatter.format(Number(payload[0].value))}</span> check-ins
            </p>
        </div>
    );
};

const EntradasPorFaixaCard = () => (
    <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
        <header className="border-b border-secondary px-5 py-4">
            <h3 className="text-md font-semibold text-primary">Entradas por faixa de horário</h3>
        </header>

        <div className="h-[280px] w-full px-2 pt-5 pb-2 md:h-[320px] md:px-4">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={faixas} margin={{ top: 24, right: 12, bottom: 4, left: 4 }}>
                    <CartesianGrid stroke="var(--color-border-secondary)" strokeDasharray="2 4" strokeOpacity={0.6} vertical={false} />
                    <XAxis
                        dataKey="hora"
                        tick={{ fill: "var(--color-text-tertiary)", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        interval="preserveStartEnd"
                        minTickGap={16}
                    />
                    <YAxis
                        tickFormatter={(v) => numberFormatter.format(Number(v))}
                        tick={{ fill: "var(--color-text-tertiary)", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        width={40}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-bg-secondary)", opacity: 0.6 }} />
                    <Bar dataKey="checkins" name="Check-ins" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false}>
                        <LabelList
                            dataKey="checkins"
                            position="top"
                            offset={6}
                            fontSize={10}
                            fontWeight={600}
                            fill="var(--color-text-secondary)"
                            formatter={(v) => numberFormatter.format(Number(v))}
                        />
                        {faixas.map((f) => (
                            <Cell key={f.hora} fill={BAR_COLOR} fillOpacity={f.hora === picoFaixa.hora ? 1 : 0.32} />
                        ))}
                    </Bar>
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    </section>
);

/* ------------------------------------------------------------------ */
/*  Validação por setor                                               */
/* ------------------------------------------------------------------ */

const ValidacaoPorSetorCard = () => (
    <Card title="Validação por setor">
        <table className="w-full table-fixed border-collapse">
            <colgroup>
                <col className="w-[42%] md:w-auto" />
                <col className="hidden md:table-column" />
                <col className="hidden md:table-column" />
                <col />
            </colgroup>
            <thead className="bg-secondary">
                <tr className="border-b border-secondary text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-tertiary">Setor</th>
                    <th className="hidden px-4 py-3 text-right text-xs font-semibold text-tertiary md:table-cell">Vendidos</th>
                    <th className="hidden px-4 py-3 text-right text-xs font-semibold text-tertiary md:table-cell">Validados</th>
                    <th className="px-4 py-3 text-xs font-semibold text-tertiary">Taxa de validação</th>
                </tr>
            </thead>
            <tbody>
                {setores.map((setor, i) => {
                    const isLast = i === setores.length - 1;
                    return (
                        <tr
                            key={setor.id}
                            className={cx("transition duration-100 ease-linear hover:bg-primary_hover", !isLast && "border-b border-secondary")}
                        >
                            <td className="px-4 py-4 text-sm text-primary">
                                <span className="line-clamp-2">{setor.nome}</span>
                            </td>
                            <td className="hidden px-4 py-4 text-right text-sm text-tertiary md:table-cell">
                                {numberFormatter.format(setor.vendidos)}
                            </td>
                            <td className="hidden px-4 py-4 text-right text-sm text-tertiary md:table-cell">
                                {numberFormatter.format(setor.validados)}
                            </td>
                            <td className="px-4 py-4">
                                <OccupancyBar value={setor.validados} total={setor.vendidos} />
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </Card>
);

interface OccupancyBarProps {
    value: number;
    total: number;
}

const OccupancyBar = ({ value, total }: OccupancyBarProps) => {
    const pct = total === 0 ? 0 : Math.round((value / total) * 100);
    const clamped = Math.min(100, Math.max(0, pct));
    return (
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-tertiary/90">
                <div className="h-full rounded-full bg-brand-solid transition-all" style={{ width: `${clamped}%` }} />
            </div>
            <span className="w-10 shrink-0 text-right text-sm text-tertiary">{clamped}%</span>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Controle de acesso — lista por portador                           */
/* ------------------------------------------------------------------ */

type StatusAcesso = "validado" | "pendente";

const ACESSO_STATUS: Record<StatusAcesso, { label: string; color: "success" | "gray" }> = {
    validado: { label: "Validado", color: "success" },
    pendente: { label: "Não validado", color: "gray" },
};

interface PortadorAcesso {
    id: string;
    portador: string;
    emailPortador: string;
    cpf: string; // apenas dígitos
    comprador: string;
    emailComprador: string;
    idTransacao: string;
    idIngresso: string;
    grupo: string;
    portao?: string;
    status: StatusAcesso;
    horario?: string;
}

const portadores: PortadorAcesso[] = [
    { id: "1", portador: "João Barbosa", emailPortador: "joao.barbosa@gmail.com", cpf: "31280455012", comprador: "João Barbosa", emailComprador: "joao.barbosa@gmail.com", idTransacao: "TRX-840192", idIngresso: "ING-0451", grupo: "Pista", portao: "Portão A", status: "validado", horario: "21:58" },
    { id: "2", portador: "Mariana Lopes Ferreira", emailPortador: "mariana.lopes@gmail.com", cpf: "32145678912", comprador: "Roberto Santos Júnior", emailComprador: "roberto.sj@yahoo.com", idTransacao: "TRX-840175", idIngresso: "ING-0448", grupo: "Camarote A", portao: "Portão VIP", status: "validado", horario: "21:54" },
    { id: "3", portador: "Gabriel Souza", emailPortador: "gabriel.souza@hotmail.com", cpf: "50332360830", comprador: "Gabriel Souza", emailComprador: "gabriel.souza@hotmail.com", idTransacao: "TRX-839902", idIngresso: "ING-0442", grupo: "Pista", portao: "Portão A", status: "validado", horario: "21:47" },
    { id: "4", portador: "Rafael Silva", emailPortador: "rafael.silva@gmail.com", cpf: "45659058841", comprador: "Larissa Almeida", emailComprador: "lari.almeida@hotmail.com", idTransacao: "TRX-839870", idIngresso: "ING-0439", grupo: "Pista Premium", portao: "Portão B", status: "validado", horario: "21:45" },
    { id: "5", portador: "Camila Rodrigues", emailPortador: "camila.rodrigues@gmail.com", cpf: "98765432100", comprador: "Camila Rodrigues", emailComprador: "camila.rodrigues@gmail.com", idTransacao: "TRX-839844", idIngresso: "ING-0431", grupo: "Mesa VIP", portao: "Portão VIP", status: "validado", horario: "21:38" },
    { id: "6", portador: "Pedro Henrique Costa", emailPortador: "pedrohcosta@outlook.com", cpf: "78912345607", comprador: "Pedro Henrique Costa", emailComprador: "pedrohcosta@outlook.com", idTransacao: "TRX-839810", idIngresso: "ING-0427", grupo: "Pista", status: "pendente" },
    { id: "7", portador: "Beatriz Carvalho", emailPortador: "bia.carvalho@gmail.com", cpf: "11180301412", comprador: "Adriano Albuquerque", emailComprador: "adrianofilho2009@gmail.com", idTransacao: "TRX-839788", idIngresso: "ING-0420", grupo: "Camarote B", portao: "Portão B", status: "validado", horario: "21:30" },
    { id: "8", portador: "Davi Marinho da Silva", emailPortador: "davim222@hotmail.com", cpf: "65498712345", comprador: "Davi Marinho da Silva", emailComprador: "davim222@hotmail.com", idTransacao: "TRX-839755", idIngresso: "ING-0415", grupo: "Pista Premium", status: "pendente" },
    { id: "9", portador: "Vinicius Cayres", emailPortador: "cayres2000@gmail.com", cpf: "12378945612", comprador: "Vinicius Cayres", emailComprador: "cayres2000@gmail.com", idTransacao: "TRX-839700", idIngresso: "ING-0409", grupo: "Camarote Central", portao: "Portão B", status: "validado", horario: "21:18" },
    { id: "10", portador: "Letícia Andrade", emailPortador: "leticia.andrade@gmail.com", cpf: "23456789011", comprador: "Marcos Andrade", emailComprador: "marcos.andrade@gmail.com", idTransacao: "TRX-839682", idIngresso: "ING-0402", grupo: "Pista", portao: "Portão A", status: "validado", horario: "21:05" },
    { id: "11", portador: "Thiago Nogueira", emailPortador: "thiago.nogueira@gmail.com", cpf: "34567890122", comprador: "Thiago Nogueira", emailComprador: "thiago.nogueira@gmail.com", idTransacao: "TRX-839640", idIngresso: "ING-0398", grupo: "Pista", status: "pendente" },
    { id: "12", portador: "Aline Ribeiro", emailPortador: "aline.ribeiro@gmail.com", cpf: "45678901233", comprador: "Aline Ribeiro", emailComprador: "aline.ribeiro@gmail.com", idTransacao: "TRX-839611", idIngresso: "ING-0391", grupo: "Camarote A", portao: "Portão VIP", status: "validado", horario: "20:52" },
];

/** Aplica a máscara 000.000.000-00 a uma string de dígitos. */
const formatCPF = (raw: string) => {
    const d = raw.replace(/\D/g, "").slice(0, 11);
    if (d.length > 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
    if (d.length > 6) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    if (d.length > 3) return `${d.slice(0, 3)}.${d.slice(3)}`;
    return d;
};

/** Iniciais a partir do nome completo. */
const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const ControleDeAcessoCard = () => {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<PortadorAcesso | null>(null);

    // Só faz sentido listar quem efetivamente entrou (validados).
    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        const digits = search.replace(/\D/g, "");

        return portadores.filter((p) => {
            if (p.status !== "validado") return false;
            if (term) {
                const haystack = [p.portador, p.comprador, p.idTransacao, p.idIngresso, p.grupo].join(" ").toLowerCase();
                const cpfMatch = digits.length > 0 && p.cpf.includes(digits);
                if (!haystack.includes(term) && !cpfMatch) return false;
            }
            return true;
        });
    }, [search]);

    return (
        <Card
            title={
                <>
                    Entradas
                    <Badge size="sm" color="gray" type="pill-color">
                        {numberFormatter.format(filtered.length)}
                    </Badge>
                </>
            }
        >
            {/* Toolbar: busca por nome, CPF ou IDs */}
            <div className="border-b border-secondary px-4 py-3">
                <Input
                    size="sm"
                    icon={SearchLg}
                    aria-label="Buscar entradas"
                    placeholder="Buscar por nome, CPF, ID da transação ou ingresso"
                    value={search}
                    onChange={setSearch}
                    className="w-full max-w-[400px]"
                />
            </div>

            <div className="overflow-x-auto overflow-y-clip">
                <table className="w-full border-collapse">
                    <thead className="bg-secondary">
                        <tr className="border-b border-secondary text-left">
                            <th className="px-4 py-3 text-xs font-semibold text-tertiary">Portador</th>
                            <th className="hidden px-4 py-3 text-xs font-semibold text-tertiary md:table-cell">Grupo de Ingressos</th>
                            <th className="hidden px-4 py-3 text-xs font-semibold text-tertiary lg:table-cell">Portão</th>
                            <th className="px-4 py-3 text-xs font-semibold text-tertiary">Horário de entrada</th>
                            <th className="px-4 py-3" aria-hidden="true" />
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-12 text-center text-sm text-tertiary">
                                    Nenhuma entrada corresponde à busca.
                                </td>
                            </tr>
                        )}
                        {filtered.map((p, i) => {
                            const isLast = i === filtered.length - 1;
                            return (
                                <tr
                                    key={p.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setSelected(p)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            setSelected(p);
                                        }
                                    }}
                                    className={cx(
                                        "group cursor-pointer transition duration-100 ease-linear hover:bg-primary_hover",
                                        !isLast && "border-b border-secondary",
                                    )}
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar size="sm" initials={getInitials(p.portador)} status={p.status === "validado" ? "online" : undefined} />
                                            <div className="flex min-w-0 flex-col">
                                                <span className="truncate text-sm font-medium text-primary">{p.portador}</span>
                                                <span className="truncate text-xs text-tertiary tabular-nums">{formatCPF(p.cpf)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden px-4 py-3 text-sm text-tertiary md:table-cell">{p.grupo}</td>
                                    <td className="hidden px-4 py-3 text-sm text-tertiary lg:table-cell">{p.portao ?? "—"}</td>
                                    <td className="px-4 py-3 text-sm text-secondary tabular-nums">{p.horario ?? "—"}</td>
                                    <td className="px-4 py-3 text-right">
                                        <ChevronRight
                                            aria-hidden="true"
                                            className="ml-auto size-5 text-fg-quaternary transition-transform duration-100 ease-linear group-hover:translate-x-0.5"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <AcessoDetailsSlideOut isOpen={selected !== null} row={selected} onClose={() => setSelected(null)} />
        </Card>
    );
};

/* ------------------------------------------------------------------ */
/*  Slideout — detalhes da entrada                                    */
/* ------------------------------------------------------------------ */

const AcessoDetailsSlideOut = ({ isOpen, row, onClose }: { isOpen: boolean; row: PortadorAcesso | null; onClose: () => void }) => (
    <AriaModalOverlay
        isOpen={isOpen}
        onOpenChange={(open) => {
            if (!open) onClose();
        }}
        isDismissable
        className={({ isEntering, isExiting }) =>
            cx(
                "fixed inset-0 z-50 flex justify-end bg-overlay/70 outline-hidden backdrop-blur-[2px]",
                isEntering && "duration-300 ease-out animate-in fade-in",
                isExiting && "duration-200 ease-in animate-out fade-out",
            )
        }
    >
        <AriaModal
            className={({ isEntering, isExiting }) =>
                cx(
                    "h-full w-full max-w-[480px] bg-primary shadow-xl outline-hidden",
                    isEntering && "duration-300 ease-out animate-in slide-in-from-right",
                    isExiting && "duration-200 ease-in animate-out slide-out-to-right",
                )
            }
        >
            <AriaDialog className="flex h-full flex-col outline-hidden">
                <div className="flex items-center justify-between gap-4 border-b border-secondary px-6 py-5">
                    <h2 className="text-lg font-semibold text-primary">Detalhes da entrada</h2>
                    <ButtonUtility size="sm" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                </div>

                <div className="flex flex-1 flex-col overflow-y-auto">
                    {row && (
                        <>
                            <div className="flex items-center gap-4 px-6 pt-6 pb-5">
                                <Avatar size="lg" initials={getInitials(row.portador)} status={row.status === "validado" ? "online" : undefined} />
                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                    <span className="truncate text-md font-semibold text-primary">{row.portador}</span>
                                    <BadgeWithDot size="sm" color={ACESSO_STATUS[row.status].color} type="pill-color" className="w-fit">
                                        {ACESSO_STATUS[row.status].label}
                                        {row.horario ? ` · ${row.horario}` : ""}
                                    </BadgeWithDot>
                                </div>
                            </div>

                            <div className="mx-6 border-t border-secondary" />

                            <div className="flex flex-col gap-3 px-6 pt-5 pb-4">
                                <h3 className="text-md font-semibold text-primary">Portador</h3>
                                <dl className="flex flex-col gap-2.5">
                                    <DetailRow label="Nome" value={row.portador} />
                                    <DetailRow label="E-mail" value={row.emailPortador} isEmail />
                                    <DetailRow label="CPF" value={formatCPF(row.cpf)} />
                                </dl>
                            </div>

                            <div className="mx-6 border-t border-secondary" />

                            <div className="flex flex-col gap-3 px-6 pt-5 pb-4">
                                <h3 className="text-md font-semibold text-primary">Ingresso</h3>
                                <dl className="flex flex-col gap-2.5">
                                    <DetailRow label="ID do ingresso" value={row.idIngresso} isMono />
                                    <DetailRow label="ID da transação" value={row.idTransacao} isMono />
                                    <DetailRow label="Grupo de ingressos" value={row.grupo} />
                                    <DetailRow label="Portão de entrada" value={row.portao ?? "—"} />
                                </dl>
                            </div>

                            <div className="mx-6 border-t border-secondary" />

                            <div className="flex flex-col gap-3 px-6 pt-5 pb-6">
                                <h3 className="text-md font-semibold text-primary">Comprador</h3>
                                <dl className="flex flex-col gap-2.5">
                                    <DetailRow label="Nome" value={row.comprador} />
                                    <DetailRow label="E-mail" value={row.emailComprador} isEmail />
                                </dl>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-secondary px-6 py-4">
                    <Button size="sm" color="secondary" onClick={onClose}>
                        Fechar
                    </Button>
                </div>
            </AriaDialog>
        </AriaModal>
    </AriaModalOverlay>
);

const DetailRow = ({ label, value, isEmail = false, isMono = false }: { label: string; value: string; isEmail?: boolean; isMono?: boolean }) => (
    <div className="flex flex-col gap-0.5">
        <dt className="text-xs text-tertiary">{label}</dt>
        <dd className={cx("text-sm break-words", isEmail ? "text-brand-secondary" : "text-secondary", isMono && "font-mono text-xs text-primary")}>
            {value}
        </dd>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Shared primitives                                                 */
/* ------------------------------------------------------------------ */

interface CardProps {
    title: ReactNode;
    children: ReactNode;
    headerRight?: ReactNode;
}

const Card = ({ title, children, headerRight }: CardProps) => (
    <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
        <header className="flex items-center justify-between gap-3 border-b border-secondary px-4 py-4">
            <h3 className="flex items-center gap-2 text-md font-semibold text-primary">{title}</h3>
            {headerRight}
        </header>
        {children}
    </section>
);
