import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { ChevronRight, SearchLg } from "@untitledui/icons";
import { PaginationCardAdvanced } from "@/components/application/pagination/pagination";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { Toggle } from "@/components/base/toggle/toggle";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { ModalDesativar } from "../components/modal-desativar";
import { BarraUso, CabecalhoCotas, TemaCotas } from "../components/ui-cotas";
import { ITEM_POR_ID } from "../data/catalogo-evento";
import { limiteDoGrupo, plural, ROTULO_ATUACAO, useEquipeV3, usadasDoGrupo, type Atuacao, type GrupoCotas } from "../data/equipe-v3-store";

const BASE = "/backstage/equipe-de-operacao/v3";

type FiltroCanal = "todos" | Atuacao;
type FiltroStatus = "todos" | "ativos" | "inativos";

const CANAIS: Array<{ id: FiltroCanal; label: string }> = [
    { id: "todos", label: "Todos" },
    { id: "pdv", label: "PDV" },
    { id: "cortesia", label: "Cortesia" },
    { id: "bilheteria", label: "Bilheteria Online" },
];

const STATUS: Array<{ id: FiltroStatus; label: string }> = [
    { id: "todos", label: "Todos" },
    { id: "ativos", label: "Ativos" },
    { id: "inativos", label: "Inativos" },
];

/** Listagem do Gerenciamento de cotas: os grupos criados, com o uso da cota de cada um. */
export function EquipeDeOperacaoV3() {
    const navigate = useNavigate();
    const { grupos, setAtivo } = useEquipeV3();
    const [busca, setBusca] = useState("");
    const [canal, setCanal] = useState<FiltroCanal>("todos");
    const [status, setStatus] = useState<FiltroStatus>("todos");
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [desativando, setDesativando] = useState<GrupoCotas | null>(null);
    const reduzir = useReducedMotion();

    // Grupo recém-criado (vem da criação via state): entra animado e fica em destaque por alguns segundos.
    const location = useLocation();
    const [destaque] = useState<string | null>(() => (location.state as { destaque?: string } | null)?.destaque ?? null);
    useEffect(() => {
        if (!destaque) return;
        // Tira o state do histórico: voltar de um detalhe ou do navegador não repete a animação.
        navigate(location.pathname, { replace: true, state: null });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtrados = useMemo(() => {
        const q = busca.trim().toLowerCase();
        const lista = grupos.filter((g) => {
            if (canal !== "todos" && g.atuacao !== canal) return false;
            if (status === "ativos" && !g.ativo) return false;
            if (status === "inativos" && g.ativo) return false;
            if (!q) return true;
            return (
                g.nome.toLowerCase().includes(q) ||
                g.operadores.some((e) => e.toLowerCase().includes(q)) ||
                g.itens.some((id) => ITEM_POR_ID[id]?.nome.toLowerCase().includes(q))
            );
        });
        // Ativos primeiro, inativos no final; dentro de cada bloco a ordem original se mantém.
        return [...lista.filter((g) => g.ativo), ...lista.filter((g) => !g.ativo)];
    }, [grupos, busca, canal, status]);

    const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize));
    const safePage = Math.min(page, totalPages - 1);
    const inicio = safePage * pageSize;
    const visiveis = filtrados.slice(inicio, inicio + pageSize);

    const alternarAtivo = (g: GrupoCotas) => {
        if (g.ativo) return setDesativando(g);
        setAtivo(g.id, true);
    };

    const confirmarDesativar = () => {
        if (!desativando) return;
        setAtivo(desativando.id, false);
        setDesativando(null);
    };

    const resetarPagina = <T,>(set: (v: T) => void) => (v: T) => {
        set(v);
        setPage(0);
    };

    return (
        <BackstageLayout activeSection="gerenciamento-cotas" railVariant="gestao-operacao">
            <TemaCotas>
                {grupos.length === 0 ? (
                    <>
                        <CabecalhoCotas titulo="Gerenciamento de cotas" onVoltar={() => navigate("/backstage/")} />
                        <EstadoSemGrupos onCriar={() => navigate(`${BASE}/criar`)} />
                    </>
                ) : (
                    <>
                        <CabecalhoCotas
                            titulo="Gerenciamento de cotas"
                            alinhamento="esquerda"
                            onVoltar={() => navigate("/backstage/")}
                            acao={{ label: "Criar grupo", onClick: () => navigate(`${BASE}/criar`) }}
                        />

                        <main className="flex flex-1 flex-col gap-6 px-6 pt-6 pb-10">
                            <div className="flex flex-wrap items-end gap-6">
                                <div className="w-full max-w-[300px]">
                                    <Input
                                        size="sm"
                                        label="Busca"
                                        icon={SearchLg}
                                        placeholder="Buscar por grupo, operador ou item"
                                        value={busca}
                                        onChange={resetarPagina(setBusca)}
                                    />
                                </div>
                                <div className="w-36">
                                    <Select
                                        size="sm"
                                        label="Canais"
                                        popoverClassName="tema-cotas"
                                        selectedKey={canal}
                                        onSelectionChange={(k) => k && resetarPagina(setCanal)(k as FiltroCanal)}
                                        items={CANAIS}
                                    >
                                        {(item) => <Select.Item id={item.id} selectionIndicator="none">{item.label}</Select.Item>}
                                    </Select>
                                </div>
                                <div className="w-36">
                                    <Select
                                        size="sm"
                                        label="Status"
                                        popoverClassName="tema-cotas"
                                        selectedKey={status}
                                        onSelectionChange={(k) => k && resetarPagina(setStatus)(k as FiltroStatus)}
                                        items={STATUS}
                                    >
                                        {(item) => <Select.Item id={item.id} selectionIndicator="none">{item.label}</Select.Item>}
                                    </Select>
                                </div>
                            </div>

                            <p className="text-sm text-tertiary">
                                {filtrados.length === 0
                                    ? "Nenhum grupo encontrado"
                                    : `Exibindo ${inicio + 1}-${inicio + visiveis.length} de ${plural(filtrados.length, "grupo", "grupos")}`}
                            </p>

                            {filtrados.length === 0 ? (
                                <div className="rounded-xl bg-primary px-6 py-16 text-center text-sm text-tertiary ring-1 ring-border-secondary ring-inset">
                                    Nenhum grupo corresponde à busca ou aos filtros.
                                </div>
                            ) : (
                                <div className="-mt-3 flex flex-col gap-3">
                                    {visiveis.map((g, i) => {
                                        const novo = g.id === destaque;
                                        // Só na chegada de um grupo novo: ele desce para o topo e os outros entram em cascata depois.
                                        const entrada = destaque && !reduzir ? (novo ? { opacity: 0, y: -20, scale: 0.98 } : { opacity: 0, y: 8 }) : false;
                                        return (
                                            // `layout`: ao desativar/reativar, o card desliza até a nova posição em vez de pular.
                                            <motion.div
                                                key={g.id}
                                                layout={!reduzir}
                                                initial={entrada}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                transition={{
                                                    layout: { duration: 0.45, ease: EASE_SUAVE },
                                                    default: { duration: novo ? 0.55 : 0.35, ease: EASE_SUAVE, delay: novo ? 0.1 : 0.35 + i * 0.04 },
                                                }}
                                            >
                                                <LinhaGrupo
                                                    grupo={g}
                                                    destaque={novo}
                                                    onToggle={() => alternarAtivo(g)}
                                                    onAbrir={() => navigate(`${BASE}/${g.id}`)}
                                                />
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}

                            {filtrados.length > 0 && (
                                <div className="overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary ring-inset">
                                    <PaginationCardAdvanced
                                        className="border-t-0"
                                        page={safePage + 1}
                                        total={totalPages}
                                        pageSize={pageSize}
                                        onPageChange={(p) => setPage(Math.max(0, p - 1))}
                                        onPageSizeChange={(s) => {
                                            setPageSize(s);
                                            setPage(0);
                                        }}
                                    />
                                </div>
                            )}
                        </main>
                    </>
                )}

                <ModalDesativar
                    aberto={Boolean(desativando)}
                    titulo="Desativar grupo?"
                    descricao="Ao desativar, os operadores deste grupo deixam de ter acesso aos ingressos vinculados. Você poderá ativá-lo novamente quando quiser."
                    acao="Desativar grupo"
                    onCancelar={() => setDesativando(null)}
                    onConfirmar={confirmarDesativar}
                />
            </TemaCotas>
        </BackstageLayout>
    );
}

/* ------------------------------ Linha ------------------------------- */

const EASE_SUAVE = [0.22, 1, 0.36, 1] as const;

const LinhaGrupo = ({ grupo, destaque = false, onToggle, onAbrir }: { grupo: GrupoCotas; destaque?: boolean; onToggle: () => void; onAbrir: () => void }) => {
    const usadas = usadasDoGrupo(grupo);
    const limite = limiteDoGrupo(grupo);
    const apagado = cx("transition-opacity duration-300 ease-out", !grupo.ativo && "opacity-50");

    return (
        <div
            role="link"
            tabIndex={0}
            onClick={onAbrir}
            onKeyDown={(e) => {
                if (e.key === "Enter") onAbrir();
            }}
            className="group relative flex min-h-[72px] cursor-pointer items-center rounded-xl outline-focus-ring focus-visible:outline-2"
        >
            {/*
             * Inativo: o card inteiro fica a 50% e só o toggle segue a 100%. Como a opacidade
             * de um pai apagaria o toggle junto, ela é aplicada ao fundo e a cada parte, não ao card.
             */}
            <span
                aria-hidden="true"
                className={cx(
                    "absolute inset-0 rounded-xl bg-primary ring-1 ring-border-secondary ring-inset group-hover:ring-2 group-hover:ring-border-primary",
                    apagado,
                )}
            />

            {/* Grupo recém-criado: contorno vermelho de marca com brilho que acende, segura e some. */}
            {destaque && (
                <motion.span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-xl"
                    // Contorno de 2px + halo + brilho numa só sombra (um ring do Tailwind seria sobrescrito aqui).
                    style={{ boxShadow: "inset 0 0 0 2px var(--cotas-brand-claro), 0 0 0 4px rgb(255 74 64 / 0.16), 0 0 28px rgb(255 74 64 / 0.28)" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 2.8, times: [0, 0.12, 0.75, 1], delay: 0.35, ease: "easeInOut" }}
                />
            )}

            <div className="relative flex min-w-0 flex-1 items-center gap-3 px-6 py-4">
                {/* O toggle não abre o detalhe. */}
                <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} className="flex">
                    <Toggle size="sm" isSelected={grupo.ativo} onChange={onToggle} aria-label={grupo.ativo ? `Desativar ${grupo.nome}` : `Ativar ${grupo.nome}`} />
                </span>
                <div className={cx("flex min-w-0 flex-col", apagado)}>
                    <span className="truncate text-sm font-medium text-primary">{grupo.nome}</span>
                    <span className="truncate text-sm text-tertiary">
                        {ROTULO_ATUACAO[grupo.atuacao]} • {plural(grupo.operadores.length, "operador", "operadores")}
                    </span>
                </div>
            </div>

            <div className={cx("relative flex w-[280px] shrink-0 items-center justify-end gap-3 px-6 py-4", apagado)}>
                {limite === null ? (
                    <span className="text-sm font-medium text-primary">Sem limite de cotas: {plural(usadas, "emissão", "emissões")}</span>
                ) : (
                    <>
                        <BarraUso usadas={usadas} total={limite} className="w-[150px]" />
                        <span className="min-w-[70px] text-sm font-medium whitespace-nowrap text-secondary tabular-nums">
                            {usadas} de {limite}
                        </span>
                    </>
                )}
            </div>

            <div className={cx("relative flex w-[60px] shrink-0 justify-center p-4", apagado)}>
                <ChevronRight
                    className="size-4 text-fg-quaternary transition duration-100 ease-linear group-hover:translate-x-0.5 group-hover:text-fg-quaternary_hover"
                    aria-hidden="true"
                />
            </div>
        </div>
    );
};

/* --------------------------- Estado vazio --------------------------- */

const EstadoSemGrupos = ({ onCriar }: { onCriar: () => void }) => (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden py-16">
        <div className="z-10 flex flex-col items-center gap-6 text-center">
            <div className="flex flex-col items-center gap-4">
                {/* As duas linhas se sobrepõem 12px — é assim no Figma. */}
                <div className="flex flex-col items-center -space-y-3">
                    {/* No Figma a primeira linha é Inter Italic (não Elza). */}
                    <p className="font-body text-[48px] leading-none tracking-[-0.025em] text-tertiary italic">Defina como seus itens</p>
                    <h2 className="text-[60px] leading-[72px] font-semibold tracking-[-0.02em] text-primary">poderão ser utilizados</h2>
                </div>
                <p className="text-sm text-tertiary">Selecione os itens, vincule um grupo e configure as cotas de uso.</p>
            </div>

            <Button size="lg" color="primary" onClick={onCriar}>
                Gerenciar cotas
            </Button>
        </div>
    </main>
);
