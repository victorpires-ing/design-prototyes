import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronRight, SwitchHorizontal01, Ticket01, Users01, XClose } from "@untitledui/icons";
import {
    Dialog as AriaDialog,
    Modal as AriaModal,
    ModalOverlay as AriaModalOverlay,
} from "react-aria-components";
import { MetricsIcon03 } from "@/components/application/metrics/metrics";
import { PaginationCardAdvanced } from "@/components/application/pagination/pagination";
import { Avatar } from "@/components/base/avatar/avatar";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { RelatorioPageHeader } from "../components/RelatorioPageHeader";
import { RelatorioFiltersProvider, matchRow, useRelatorioFilters, type FilterFieldDef } from "../components/relatorio-filters";
import { numberFormatter } from "../data/event";

/* ------------------------------------------------------------------ */
/*  Mock data                                                         */
/* ------------------------------------------------------------------ */

interface Transferencia {
    id: string;
    code: string;
    nomeComprador: string;
    emailComprador: string;
    cpfComprador: string;
    portadorAnteriorNome: string;
    portadorAnteriorEmail: string;
    portadorAnteriorCpf: string;
    portadorAtualNome: string;
    portadorAtualEmail: string;
    portadorAtualCpf: string;
}

// Quantas vezes cada ingresso (code) já trocou de mão (mock) — default 1.
const VEZES_TRANSFERIDO: Record<string, number> = {
    "26BK5XGKXN6JHL": 5,
    "26BP6X3IUH6QF1": 3,
    "26DCDHZ1QQACP4": 2,
    "2693K0XNE0QNR0": 4,
    "2680YQA69RR2VK": 2,
    "266U4R6ZTPQCFT": 3,
    "26HRPK4LXNVCQE": 5,
    "26JZKL9MN4PXVT": 2,
    "26LPN8R4MA0YQW": 2,
    "26MRO9S5NB1ZRX": 3,
    "26OTQ1U7PD3BTZ": 4,
};
const vezesDe = (code: string): number => VEZES_TRANSFERIDO[code] ?? 1;

const transferencias: Transferencia[] = [
    {
        id: "8131c921-794f-4b3b-9b41-d13ac8587225",
        code: "26BK5XGKXN6JHL",
        nomeComprador: "Ana Lívia Moreira Mendes",
        emailComprador: "mendesanamendes42@gmail.com",
        cpfComprador: "16774105742",
        portadorAnteriorNome: "Ana Lívia Moreira Mendes",
        portadorAnteriorEmail: "mendesanamendes42@gmail.com",
        portadorAnteriorCpf: "16774105742",
        portadorAtualNome: "Beatriz Mendes Carvalho",
        portadorAtualEmail: "bia.mendes@gmail.com",
        portadorAtualCpf: "98745632101",
    },
    {
        id: "8131c921-794f-4b3b-9b41-d13ac8587225",
        code: "2640G5GMOQI58N",
        nomeComprador: "Ana Lívia Moreira Mendes",
        emailComprador: "mendesanamendes42@gmail.com",
        cpfComprador: "16774105742",
        portadorAnteriorNome: "Ana Lívia Moreira Mendes",
        portadorAnteriorEmail: "mendesanamendes42@gmail.com",
        portadorAnteriorCpf: "16774105742",
        portadorAtualNome: "Caio Henrique Souza",
        portadorAtualEmail: "caio.souza@outlook.com",
        portadorAtualCpf: "32198745612",
    },
    {
        id: "8131c921-794f-4b3b-9b41-d13ac8587225",
        code: "26BP6X3IUH6QF1",
        nomeComprador: "Ana Lívia Moreira Mendes",
        emailComprador: "mendesanamendes42@gmail.com",
        cpfComprador: "16774105742",
        portadorAnteriorNome: "Ana Lívia Moreira Mendes",
        portadorAnteriorEmail: "mendesanamendes42@gmail.com",
        portadorAnteriorCpf: "16774105742",
        portadorAtualNome: "Daniel Pereira",
        portadorAtualEmail: "daniel.p@gmail.com",
        portadorAtualCpf: "65432109876",
    },
    {
        id: "8131c921-794f-4b3b-9b41-d13ac8587225",
        code: "267CT81YTKMD6X",
        nomeComprador: "Ana Lívia Moreira Mendes",
        emailComprador: "mendesanamendes42@gmail.com",
        cpfComprador: "16774105742",
        portadorAnteriorNome: "Ana Lívia Moreira Mendes",
        portadorAnteriorEmail: "mendesanamendes42@gmail.com",
        portadorAnteriorCpf: "16774105742",
        portadorAtualNome: "Eduarda Lima",
        portadorAtualEmail: "edu.lima@yahoo.com",
        portadorAtualCpf: "78912345601",
    },
    {
        id: "abcf9197-7acc-4857-8d9a-242cf007deff",
        code: "26DCDHZ1QQACP4",
        nomeComprador: "Vanessa Lemos de Carvalho Santos",
        emailComprador: "vanessalcs@yahoo.com.br",
        cpfComprador: "28909582804",
        portadorAnteriorNome: "Vanessa Lemos de Carvalho Santos",
        portadorAnteriorEmail: "vanessalcs@yahoo.com.br",
        portadorAnteriorCpf: "28909582804",
        portadorAtualNome: "Felipe Cardoso",
        portadorAtualEmail: "felipe.cardoso@gmail.com",
        portadorAtualCpf: "45612378901",
    },
    {
        id: "abcf9197-7acc-4857-8d9a-242cf007deff",
        code: "265Z7GJNM6PEPF",
        nomeComprador: "Vanessa Lemos de Carvalho Santos",
        emailComprador: "vanessalcs@yahoo.com.br",
        cpfComprador: "28909582804",
        portadorAnteriorNome: "Vanessa Lemos de Carvalho Santos",
        portadorAnteriorEmail: "vanessalcs@yahoo.com.br",
        portadorAnteriorCpf: "28909582804",
        portadorAtualNome: "Gabriela Nunes",
        portadorAtualEmail: "gabi.nunes@hotmail.com",
        portadorAtualCpf: "23456789012",
    },
    {
        id: "5fa1d660-c5b7-4839-92ac-ca3a97d7f0b0",
        code: "2693K0XNE0QNR0",
        nomeComprador: "Kamurata Araújo",
        emailComprador: "kamugata@gmail.com",
        cpfComprador: "46333817848",
        portadorAnteriorNome: "Kamurata Araújo",
        portadorAnteriorEmail: "kamugata@gmail.com",
        portadorAnteriorCpf: "46333817848",
        portadorAtualNome: "Henrique Tanaka",
        portadorAtualEmail: "h.tanaka@gmail.com",
        portadorAtualCpf: "11223344556",
    },
    {
        id: "541fbf99-bb19-4396-88b0-3f324d822b3c",
        code: "26A6SZZHCC8ZY2",
        nomeComprador: "Andressa Alves",
        emailComprador: "asa.andressa@gmail.com",
        cpfComprador: "38410929856",
        portadorAnteriorNome: "Andressa Alves",
        portadorAnteriorEmail: "asa.andressa@gmail.com",
        portadorAnteriorCpf: "38410929856",
        portadorAtualNome: "Isabela Ramos",
        portadorAtualEmail: "isabela.ramos@gmail.com",
        portadorAtualCpf: "99887766554",
    },
    {
        id: "e4dc45a2-a14b-4e64-a87b-184ceb5bc4a8",
        code: "2680YQA69RR2VK",
        nomeComprador: "Murilo Manzoni",
        emailComprador: "manzonimurilo@hotmail.com",
        cpfComprador: "46945053865",
        portadorAnteriorNome: "Murilo Manzoni",
        portadorAnteriorEmail: "manzonimurilo@hotmail.com",
        portadorAnteriorCpf: "46945053865",
        portadorAtualNome: "João Pedro Lima",
        portadorAtualEmail: "jp.lima@outlook.com",
        portadorAtualCpf: "55443322110",
    },
    {
        id: "64d572bf-fd42-44d3-936b-2fa4ece137f5",
        code: "266U4R6ZTPQCFT",
        nomeComprador: "Carlos Frederico Marques de Lemos",
        emailComprador: "cf.marques@live.com",
        cpfComprador: "14017922783",
        portadorAnteriorNome: "Carlos Frederico Marques de Lemos",
        portadorAnteriorEmail: "cf.marques@live.com",
        portadorAnteriorCpf: "14017922783",
        portadorAtualNome: "Luana Ferreira",
        portadorAtualEmail: "luana.f@gmail.com",
        portadorAtualCpf: "88776655443",
    },
    {
        id: "64d572bf-fd42-44d3-936b-2fa4ece137f5",
        code: "269YZ6H3KTTD4Q",
        nomeComprador: "Carlos Frederico Marques de Lemos",
        emailComprador: "cf.marques@live.com",
        cpfComprador: "14017922783",
        portadorAnteriorNome: "Carlos Frederico Marques de Lemos",
        portadorAnteriorEmail: "cf.marques@live.com",
        portadorAnteriorCpf: "14017922783",
        portadorAtualNome: "Mariana Costa",
        portadorAtualEmail: "mari.costa@yahoo.com",
        portadorAtualCpf: "33445566778",
    },
    {
        id: "f8a3c4d2-9b1e-4f5a-b6c7-d8e9f0a1b2c3",
        code: "26FXJ3WCKL9PRM",
        nomeComprador: "Ricardo Almeida Junior",
        emailComprador: "ricardo.jr@gmail.com",
        cpfComprador: "52341897612",
        portadorAnteriorNome: "Ricardo Almeida Junior",
        portadorAnteriorEmail: "ricardo.jr@gmail.com",
        portadorAnteriorCpf: "52341897612",
        portadorAtualNome: "Natália Vieira",
        portadorAtualEmail: "natalia.v@outlook.com",
        portadorAtualCpf: "11998877665",
    },
    {
        id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        code: "26GHTM8LXP2WBN",
        nomeComprador: "Patricia Santos Lima",
        emailComprador: "pat.santos@hotmail.com",
        cpfComprador: "78965412309",
        portadorAnteriorNome: "Patricia Santos Lima",
        portadorAnteriorEmail: "pat.santos@hotmail.com",
        portadorAnteriorCpf: "78965412309",
        portadorAtualNome: "Otávio Borges",
        portadorAtualEmail: "otavio.b@gmail.com",
        portadorAtualCpf: "44556677889",
    },
    {
        id: "b3c5d7e9-f1a2-4b3c-9d8e-7f6a5b4c3d2e",
        code: "26HRPK4LXNVCQE",
        nomeComprador: "Felipe Cardoso Macedo",
        emailComprador: "felipecmacedo@gmail.com",
        cpfComprador: "63245718902",
        portadorAnteriorNome: "Felipe Cardoso Macedo",
        portadorAnteriorEmail: "felipecmacedo@gmail.com",
        portadorAnteriorCpf: "63245718902",
        portadorAtualNome: "Paula Henriques",
        portadorAtualEmail: "paula.h@yahoo.com.br",
        portadorAtualCpf: "22334455667",
    },
    {
        id: "c2d4e6f8-a3b5-4c7d-8e9f-0a1b2c3d4e5f",
        code: "26JZKL9MN4PXVT",
        nomeComprador: "Renata Oliveira Costa",
        emailComprador: "renata.oc@gmail.com",
        cpfComprador: "89012345678",
        portadorAnteriorNome: "Renata Oliveira Costa",
        portadorAnteriorEmail: "renata.oc@gmail.com",
        portadorAnteriorCpf: "89012345678",
        portadorAtualNome: "Rafael Mendes",
        portadorAtualEmail: "rafa.mendes@gmail.com",
        portadorAtualCpf: "66778899001",
    },
    {
        id: "d4e6f8a0-b2c4-4d6e-8f0a-1b2c3d4e5f60",
        code: "26KQW7M3LZ9XPV",
        nomeComprador: "Bruno Azevedo Lima",
        emailComprador: "bruno.azevedo@gmail.com",
        cpfComprador: "11122233344",
        portadorAnteriorNome: "Bruno Azevedo Lima",
        portadorAnteriorEmail: "bruno.azevedo@gmail.com",
        portadorAnteriorCpf: "11122233344",
        portadorAtualNome: "Sofia Cardoso",
        portadorAtualEmail: "sofia.cardoso@outlook.com",
        portadorAtualCpf: "55566677788",
    },
    {
        id: "e5f7a9b1-c3d5-4e7f-9a0b-2c3d4e5f6071",
        code: "26LPN8R4MA0YQW",
        nomeComprador: "Carolina Freitas",
        emailComprador: "carol.freitas@gmail.com",
        cpfComprador: "22233344455",
        portadorAnteriorNome: "Carolina Freitas",
        portadorAnteriorEmail: "carol.freitas@gmail.com",
        portadorAnteriorCpf: "22233344455",
        portadorAtualNome: "Eduardo Ramos",
        portadorAtualEmail: "edu.ramos@hotmail.com",
        portadorAtualCpf: "66677788899",
    },
    {
        id: "f6a8b0c2-d4e6-4f8a-0b1c-3d4e5f607182",
        code: "26MRO9S5NB1ZRX",
        nomeComprador: "Marcelo Tavares",
        emailComprador: "marcelo.tavares@live.com",
        cpfComprador: "33344455566",
        portadorAnteriorNome: "Marcelo Tavares",
        portadorAnteriorEmail: "marcelo.tavares@live.com",
        portadorAnteriorCpf: "33344455566",
        portadorAtualNome: "Bianca Teixeira",
        portadorAtualEmail: "bianca.teixeira@gmail.com",
        portadorAtualCpf: "77788899900",
    },
    {
        id: "a7b9c1d3-e5f7-4a9b-1c2d-4e5f60718293",
        code: "26NSP0T6OC2ASY",
        nomeComprador: "Patrícia Gomes",
        emailComprador: "patricia.gomes@gmail.com",
        cpfComprador: "44455566677",
        portadorAnteriorNome: "Patrícia Gomes",
        portadorAnteriorEmail: "patricia.gomes@gmail.com",
        portadorAnteriorCpf: "44455566677",
        portadorAtualNome: "Rodrigo Nunes",
        portadorAtualEmail: "rodrigo.nunes@outlook.com",
        portadorAtualCpf: "88899900011",
    },
    {
        id: "b8c0d2e4-f6a8-4b0c-2d3e-5f6071829304",
        code: "26OTQ1U7PD3BTZ",
        nomeComprador: "Gustavo Pinto",
        emailComprador: "gustavo.pinto@gmail.com",
        cpfComprador: "55566677788",
        portadorAnteriorNome: "Gustavo Pinto",
        portadorAnteriorEmail: "gustavo.pinto@gmail.com",
        portadorAnteriorCpf: "55566677788",
        portadorAtualNome: "Vivian Castro",
        portadorAtualEmail: "vivian.castro@hotmail.com",
        portadorAtualCpf: "99900011122",
    },
];

/* ------------------------------------------------------------------ */
/*  Big numbers                                                       */
/* ------------------------------------------------------------------ */

const HIDE_TREND_AND_MENU = "[&_.top-4.right-4]:hidden [&_.md\\:top-5]:hidden [&_p+div]:hidden";

// Total de ingressos vendidos no evento (mock) — base para o % de transferidos.
const TOTAL_INGRESSOS_EVENTO = 412;

const TOTAL_TRANSFERENCIAS = transferencias.length;
const PCT_TRANSFERIDOS = (TOTAL_TRANSFERENCIAS / TOTAL_INGRESSOS_EVENTO) * 100;
const COMPRADORES_QUE_TRANSFERIRAM = new Set(transferencias.map((t) => t.cpfComprador)).size;

const pctFormatter = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const TransferenciasMetricsRow = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricsIcon03
            icon={SwitchHorizontal01}
            subtitle="Total de transferências"
            title={numberFormatter.format(TOTAL_TRANSFERENCIAS)}
            change={null}
            changeTrend="positive"
            actions={false}
            className={HIDE_TREND_AND_MENU}
        />
        <MetricsIcon03
            icon={Ticket01}
            subtitle="Ingressos transferidos"
            title={`${pctFormatter.format(PCT_TRANSFERIDOS)}%`}
            change={null}
            changeTrend="positive"
            actions={false}
            className={HIDE_TREND_AND_MENU}
        />
        <MetricsIcon03
            icon={Users01}
            subtitle="Compradores que transferiram"
            title={numberFormatter.format(COMPRADORES_QUE_TRANSFERIRAM)}
            change={null}
            changeTrend="positive"
            actions={false}
            className={HIDE_TREND_AND_MENU}
        />
    </div>
);

/* ------------------------------------------------------------------ */
/*  Filter config                                                     */
/* ------------------------------------------------------------------ */

const FILTER_FIELDS: FilterFieldDef[] = [
    { id: "code", label: "Código" },
    { id: "nomeComprador", label: "Nome Comprador" },
    { id: "emailComprador", label: "Email Comprador" },
    { id: "cpfComprador", label: "CPF Comprador" },
    { id: "portadorAnteriorNome", label: "Portador Anterior Nome" },
    { id: "portadorAnteriorEmail", label: "Portador Anterior Email" },
    { id: "portadorAnteriorCpf", label: "Portador Anterior CPF" },
    { id: "portadorAtualNome", label: "Portador Atual Nome" },
    { id: "portadorAtualEmail", label: "Portador Atual Email" },
    { id: "portadorAtualCpf", label: "Portador Atual CPF" },
];

function getFieldValue(t: Transferencia, field: string): string {
    return (t as unknown as Record<string, string>)[field] ?? "";
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function Transferencias() {
    return (
        <BackstageLayout activeSection="relatorios" activeItem="transferencias">
            <RelatorioFiltersProvider fields={FILTER_FIELDS}>
                <div className="flex min-w-0 flex-1 flex-col">
                    <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
                        <TransferenciasBody />
                    </main>
                </div>
            </RelatorioFiltersProvider>
        </BackstageLayout>
    );
}

const TransferenciasBody = () => {
    const { filters } = useRelatorioFilters();

    const filteredTransferencias = useMemo(() => {
        const valid = filters.filter((f) => f.field && f.value);
        return transferencias.filter((t) => matchRow(t, valid, getFieldValue));
    }, [filters]);

    return (
        <>
            <RelatorioPageHeader title="Transferências do Evento" />

            <TransferenciasMetricsRow />

            <TransferenciasCards rows={filteredTransferencias} />
        </>
    );
};

/* ------------------------------------------------------------------ */
/*  Paginação: anima a troca e rola suave até o topo da lista          */
/* ------------------------------------------------------------------ */

const PAGE_SIZE_INICIAL = 10;

/**
 * Devolve um ref para ancorar o topo da lista. Sempre que `page` muda (exceto na
 * 1ª montagem), rola suavemente até esse topo — assim o usuário nunca cai no meio
 * da lista nova. Combine com `key={page}` no container para reanimar a entrada.
 */
function useScrollToTopOnPageChange<T extends HTMLElement = HTMLElement>(page: number) {
    const topRef = useRef<T>(null);
    const primeiraRenderizacao = useRef(true);
    useEffect(() => {
        if (primeiraRenderizacao.current) {
            primeiraRenderizacao.current = false;
            return;
        }
        topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [page]);
    return topRef;
}

const PAGE_TRANSITION = "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200 motion-safe:ease-out";

/* ------------------------------------------------------------------ */
/*  Transferências cards (portador flow)                              */
/* ------------------------------------------------------------------ */

const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatCpf = (cpf: string): string => {
    const digits = cpf.replace(/\D/g, "").padStart(11, "0").slice(0, 11);
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const TransferenciasCards = ({ rows }: { rows: Transferencia[] }) => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZE_INICIAL);
    const [selected, setSelected] = useState<Transferencia | null>(null);

    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const visibleRows = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return rows.slice(start, start + pageSize);
    }, [rows, safePage, pageSize]);

    const topRef = useScrollToTopOnPageChange<HTMLHeadingElement>(safePage);
    // Filtro mudou (nova referência de `rows`) → volta para a 1ª página.
    useEffect(() => setPage(1), [rows]);

    return (
        <>
            <h3 ref={topRef} className="scroll-mt-6 text-md font-semibold text-primary">
                Transferências realizadas
            </h3>
            {visibleRows.length === 0 ? (
                <div className="rounded-xl bg-primary px-4 py-12 text-center text-sm text-tertiary ring-1 ring-border-secondary">
                    Nenhuma transferência corresponde aos filtros aplicados.
                </div>
            ) : (
                <div key={safePage} className={cx("flex flex-col gap-3", PAGE_TRANSITION)}>
                    {visibleRows.map((row) => (
                        <TransferenciaCard
                            key={`${row.id}-${row.code}`}
                            row={row}
                            isSelected={selected?.id === row.id && selected?.code === row.code}
                            onClick={() => setSelected(row)}
                        />
                    ))}
                </div>
            )}

            <div className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
                <PaginationCardAdvanced
                    className="[&]:border-t-0"
                    page={safePage}
                    total={totalPages}
                    pageSize={pageSize}
                    onPageChange={(p: number) => setPage(p)}
                    onPageSizeChange={(size: number) => {
                        setPageSize(size);
                        setPage(1);
                    }}
                />
            </div>

            <TransferenciaDetailsSlideOut
                isOpen={selected !== null}
                row={selected}
                onClose={() => setSelected(null)}
            />
        </>
    );
};

const TransferCountBadge = ({ count }: { count: number }) => (
    <BadgeWithDot size="sm" color="gray" type="pill-color" className="w-fit">
        {count}× {count === 1 ? "transferência" : "transferências"}
    </BadgeWithDot>
);

/** Bloco "De"/"Para" em linha (avatar + label + nome). */
const HolderInline = ({ label, name, emphasis = false }: { label: string; name: string; emphasis?: boolean }) => (
    <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <Avatar size="sm" initials={getInitials(name)} />
        <div className="flex min-w-0 flex-col">
            <span className="text-xs text-tertiary">{label}</span>
            <span className={cx("truncate text-sm", emphasis ? "font-semibold text-primary" : "font-medium text-secondary")}>{name}</span>
        </div>
    </div>
);

const TransferenciaCard = ({
    row,
    isSelected = false,
    onClick,
}: {
    row: Transferencia;
    isSelected?: boolean;
    onClick: () => void;
}) => {
    const count = vezesDe(row.code);
    return (
        <button
            type="button"
            onClick={onClick}
            aria-current={isSelected || undefined}
            className={cx(
                "group flex w-full items-center gap-4 rounded-xl px-4 py-4 text-left transition duration-100 ease-linear hover:bg-primary_hover sm:gap-6 sm:px-5",
                // Item aberto: fundo de hover + anel da marca (sem escurecer o resto).
                isSelected ? "bg-primary_hover ring-2 ring-brand" : "bg-primary ring-1 ring-border-secondary",
            )}
        >
            {/* Código + selo de quantas vezes foi transferido */}
            <div className="flex w-32 shrink-0 flex-col gap-1.5 sm:w-44">
                <span className="truncate font-mono text-xs font-medium text-tertiary">{row.code}</span>
                <TransferCountBadge count={count} />
            </div>

            {/* Fluxo De → Para, na horizontal */}
            <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                <HolderInline label="Comprador" name={row.portadorAnteriorNome} />
                <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-fg-quaternary" />
                <HolderInline label="Portador" name={row.portadorAtualNome} emphasis />
            </div>

            <ChevronRight
                aria-hidden="true"
                className="size-5 shrink-0 text-fg-quaternary transition-transform duration-100 ease-linear group-hover:translate-x-0.5"
            />
        </button>
    );
};

/* ------------------------------------------------------------------ */
/*  Histórico de transferência (cadeia completa de portadores)         */
/* ------------------------------------------------------------------ */

interface HolderHistorico {
    nome: string;
    email: string;
    cpf: string;
    data: string;
}

const POOL_HISTORICO = [
    "Lucas Pereira", "Juliana Martins", "Bruno Azevedo", "Patrícia Gomes", "Marcelo Tavares",
    "Carolina Freitas", "Eduardo Ramos", "Sofia Cardoso", "Henrique Moraes", "Larissa Almeida",
    "Diego Fernandes", "Bianca Teixeira", "Rodrigo Nunes", "Vivian Castro",
];
const PROVS = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com"];
const pad2 = (n: number) => String(n).padStart(2, "0");
const pad11 = (n: number) => String(n).padStart(11, "0");
const pick = <T,>(arr: T[], i: number): T => arr[((i % arr.length) + arr.length) % arr.length];
const codeHash = (code: string): number => Array.from(code).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

/**
 * Reconstrói a cadeia completa de portadores (mock). O nº de transferências =
 * vezesDe(code) → cadeia com (n+1) portadores: comprador original → intermediários
 * → portador atual, em ordem cronológica.
 */
function buildHistorico(row: Transferencia): HolderHistorico[] {
    const n = vezesDe(row.code);
    const h = codeHash(row.code);
    const holders: HolderHistorico[] = [];

    holders.push({ nome: row.nomeComprador, email: row.emailComprador, cpf: row.cpfComprador, data: "" });
    for (let i = 1; i < n; i++) {
        const nome = pick(POOL_HISTORICO, h + i * 7);
        const primeiro = nome.split(" ")[0].toLowerCase();
        const ultimo = nome.split(" ").slice(-1)[0].toLowerCase();
        holders.push({
            nome,
            email: `${primeiro}.${ultimo}@${pick(PROVS, h + i)}`,
            cpf: pad11((h * 7919 + i * 31408) % 100000000000),
            data: "",
        });
    }
    holders.push({ nome: row.portadorAtualNome, email: row.portadorAtualEmail, cpf: row.portadorAtualCpf, data: "" });

    // Datas crescentes (mock) dentro da janela de vendas (maio/2026).
    const base = (h % 8) + 1;
    holders.forEach((holder, i) => {
        holder.data = `${pad2(base + i * 3)}/05/2026`;
    });
    return holders;
}

const HistoricoHolder = ({ holder, emphasis = false }: { holder: HolderHistorico; emphasis?: boolean }) => (
    <div className={cx("flex items-start gap-3 rounded-lg bg-secondary p-3 ring-1 ring-border-secondary", emphasis && "ring-2 ring-brand")}>
        <Avatar size="md" initials={getInitials(holder.nome)} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-xs text-tertiary tabular-nums">{holder.data}</span>
            <span className={cx("truncate text-sm text-primary", emphasis ? "font-semibold" : "font-medium")}>{holder.nome}</span>
            <span className="truncate text-xs text-brand-secondary">{holder.email}</span>
            <span className="text-xs text-tertiary tabular-nums">{formatCpf(holder.cpf)}</span>
        </div>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Transferência details slideout                                    */
/* ------------------------------------------------------------------ */

const TransferenciaDetailsSlideOut = ({
    isOpen,
    row,
    onClose,
}: {
    isOpen: boolean;
    row: Transferencia | null;
    onClose: () => void;
}) => (
    <AriaModalOverlay
        isOpen={isOpen}
        onOpenChange={(open) => {
            if (!open) onClose();
        }}
        isDismissable
        className="fixed inset-0 z-50 flex justify-end outline-hidden"
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
                    <h2 className="text-lg font-semibold text-primary">
                        Detalhes da transferência
                    </h2>
                    <ButtonUtility
                        size="sm"
                        color="tertiary"
                        icon={XClose}
                        tooltip="Fechar"
                        onClick={onClose}
                    />
                </div>

                <div className="flex flex-1 flex-col overflow-y-auto">
                    {row && (
                        <>
                            <div className="flex flex-col gap-3 px-6 pt-6 pb-5">
                                <div className="flex items-start justify-between gap-3">
                                    <h3 className="text-md font-semibold text-primary">Identificação</h3>
                                    <TransferCountBadge count={vezesDe(row.code)} />
                                </div>
                                <dl className="flex flex-col gap-2.5">
                                    <DetailRow label="Código do ingresso" value={row.code} isMono />
                                    <DetailRow label="ID da transação" value={row.id} isMono />
                                </dl>
                            </div>

                            <div className="mx-6 border-t border-secondary" />

                            {/* Comprador original vem antes do histórico */}
                            <div className="flex flex-col gap-3 px-6 pt-5 pb-4">
                                <h3 className="text-md font-semibold text-primary">
                                    Comprador original
                                </h3>
                                <dl className="flex flex-col gap-2.5">
                                    <DetailRow label="Nome" value={row.nomeComprador} />
                                    <DetailRow label="E-mail" value={row.emailComprador} isEmail />
                                    <DetailRow label="CPF" value={formatCpf(row.cpfComprador)} />
                                </dl>
                            </div>

                            <div className="mx-6 border-t border-secondary" />

                            {/* Histórico completo: todas as transferências, em ordem */}
                            <div className="flex flex-col gap-3 px-6 pt-5 pb-6">
                                <h3 className="text-md font-semibold text-primary">
                                    Histórico de transferência
                                </h3>
                                {buildHistorico(row).map((holder, i, arr) => (
                                    <Fragment key={i}>
                                        <HistoricoHolder holder={holder} emphasis={i === arr.length - 1} />
                                        {i < arr.length - 1 && (
                                            <div className="flex items-center gap-2 pl-1.5 text-tertiary">
                                                <ArrowRight aria-hidden="true" className="size-4 rotate-90 text-fg-quaternary" />
                                                <span className="text-xs">transferido para</span>
                                            </div>
                                        )}
                                    </Fragment>
                                ))}
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

const DetailRow = ({
    label,
    value,
    isEmail = false,
    isMono = false,
}: {
    label: string;
    value: string;
    isEmail?: boolean;
    isMono?: boolean;
}) => (
    <div className="flex flex-col gap-0.5">
        <dt className="text-xs text-tertiary">{label}</dt>
        <dd
            className={cx(
                "text-sm break-words",
                isEmail ? "text-brand-secondary" : "text-secondary",
                isMono && "font-mono text-xs text-primary",
            )}
        >
            {value}
        </dd>
    </div>
);
