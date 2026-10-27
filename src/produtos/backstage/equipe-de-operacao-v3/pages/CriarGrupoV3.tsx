import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { SeletorGrupoMembros } from "../components/seletor-grupo-membros";
import { SelecaoIngressos } from "../components/SelecaoIngressos";
import { BadgeTipo, CabecalhoCotas, CardSessao, RadioBolinha, TemaCotas, TituloSecao } from "../components/ui-cotas";
import { agruparPorSessao, ITEM_POR_ID, type ItemCatalogo } from "../data/catalogo-evento";
import { ATUACOES, useEquipeV3, type Atuacao, type DadosGrupo, type TipoCota } from "../data/equipe-v3-store";
import { GRUPO_MEMBROS_POR_ID } from "../data/membros";

const ETAPAS = ["Grupo", "Itens", "Cotas"] as const;
const BASE = "/backstage/equipe-de-operacao/v3";

const soNumero = (v: string) => {
    const n = Number(v.replace(/\D/g, "").slice(0, 6));
    return Number.isFinite(n) ? n : 0;
};

export function CriarGrupoV3() {
    const navigate = useNavigate();
    const { grupoId } = useParams();
    const [params] = useSearchParams();
    const { grupos, criarGrupo, atualizarGrupo, getGrupo } = useEquipeV3();
    const grupo = grupoId ? getGrupo(grupoId) : undefined;
    const emEdicao = Boolean(grupo);

    // Abrir o fluxo (ou "Editar itens" vindo do detalhe rolado) sempre começa do topo.
    useEffect(() => {
        window.scrollTo({ top: 0 });
    }, []);

    // "Editar itens" no detalhe abre só a seleção de itens, sem o wizard, e salva direto.
    const soItens = Boolean(grupo) && params.get("etapa") === "itens";
    const [etapa, setEtapa] = useState(() => (soItens ? 1 : 0));
    const [atuacao, setAtuacao] = useState<Atuacao | undefined>(grupo?.atuacao);
    const [grupoMembrosId, setGrupoMembrosId] = useState<string | undefined>(grupo?.grupoMembrosId);
    const [itens, setItens] = useState<string[]>(grupo?.itens.filter((id) => ITEM_POR_ID[id]) ?? []);
    const [tipoCota, setTipoCota] = useState<TipoCota>(grupo?.cota.tipo ?? "sem-limite");
    const [total, setTotal] = useState(grupo?.cota.total ?? 0);
    const [porItem, setPorItem] = useState<Record<string, number>>(grupo?.cota.porItem ?? {});

    /* ----------------------------- validação ----------------------------- */
    // O grupo herda o nome e os membros do grupo de Membros vinculado.
    const grupoMembros = grupoMembrosId ? GRUPO_MEMBROS_POR_ID[grupoMembrosId] : undefined;
    const nome = grupoMembros?.nome ?? "";
    const operadores = grupoMembros?.emails ?? [];
    // Cada grupo de Membros vincula um grupo só (senão a listagem teria dois com o mesmo nome).
    const jaVinculados = grupos.filter((g) => g.id !== grupo?.id).map((g) => g.grupoMembrosId);
    const etapaGrupoOk = Boolean(atuacao) && operadores.length > 0 && !jaVinculados.includes(grupoMembrosId!);
    const etapaItensOk = itens.length > 0;
    const etapaCotasOk =
        tipoCota === "sem-limite" || (tipoCota === "compartilhada" && total > 0) || (tipoCota === "por-item" && itens.every((id) => (porItem[id] ?? 0) > 0));
    const etapaOk = [etapaGrupoOk, etapaItensOk, etapaCotasOk][etapa];

    /* ------------------------------- ações ------------------------------- */
    const voltar = () => {
        if (soItens) return navigate(`${BASE}/${grupo!.id}`);
        if (etapa > 0) return setEtapa((e) => e - 1);
        navigate(grupo ? `${BASE}/${grupo.id}` : BASE);
    };

    const concluir = () => {
        const dados: DadosGrupo = {
            nome,
            atuacao: atuacao!,
            grupoMembrosId: grupoMembrosId!,
            operadores,
            itens,
            cota: {
                tipo: tipoCota,
                total: tipoCota === "compartilhada" ? total : 0,
                porItem: tipoCota === "por-item" ? Object.fromEntries(itens.map((id) => [id, porItem[id] ?? 0])) : {},
            },
        };

        if (grupo) {
            atualizarGrupo(grupo.id, dados);
            // O detalhe usa `atualizado` para mostrar que a lista foi recarregada (halo + cascata).
            return navigate(`${BASE}/${grupo.id}`, { state: { atualizado: true } });
        }
        const novo = criarGrupo(dados);
        // A listagem usa `destaque` para animar a chegada do grupo e marcá-lo por alguns segundos.
        navigate(BASE, { state: { destaque: novo.id } });
    };

    const avancar = () => {
        if (!etapaOk) return;
        if (soItens) return concluir();
        if (etapa < ETAPAS.length - 1) {
            setEtapa((e) => e + 1);
            window.scrollTo({ top: 0 });
            return;
        }
        concluir();
    };

    const rotuloAcao = soItens ? "Salvar alterações" : etapa < ETAPAS.length - 1 ? "Continuar" : emEdicao ? "Salvar alterações" : "Salvar configurações";

    return (
        <BackstageLayout activeSection="gerenciamento-cotas" railVariant="gestao-operacao">
            <TemaCotas>
                <CabecalhoCotas titulo="Gerenciar cotas" onVoltar={voltar} acao={{ label: rotuloAcao, onClick: avancar, desabilitada: !etapaOk }} />

                <main className="flex flex-1 flex-col items-center gap-12 px-6 pt-6 pb-16">
                    {!soItens && <Stepper atual={etapa} onIr={(i) => i < etapa && setEtapa(i)} />}

                    {etapa === 0 && (
                        <div className="flex w-full max-w-[800px] flex-col gap-6">
                            <Bloco titulo="Onde este grupo poderá atuar?">
                                {/* Um canal por grupo: escolher outro troca a seleção. */}
                                <div
                                    role="radiogroup"
                                    aria-label="Onde este grupo poderá atuar"
                                    className="grid grid-cols-1 gap-4 rounded-xl bg-primary p-4 ring-1 ring-border-secondary ring-inset sm:grid-cols-3"
                                >
                                    {ATUACOES.map((a) => {
                                        const on = atuacao === a.id;
                                        return (
                                            <button
                                                key={a.id}
                                                type="button"
                                                role="radio"
                                                aria-checked={on}
                                                onClick={() => setAtuacao(a.id)}
                                                className={cx(
                                                    "flex h-10 items-center justify-center gap-1 rounded-lg px-3.5 text-sm font-semibold text-secondary shadow-xs ring-1 ring-border-primary outline-focus-ring transition duration-100 ease-linear ring-inset focus-visible:outline-2 focus-visible:outline-offset-2",
                                                    // Selecionado: fundo mais escuro (bg-primary_alt), como no Figma.
                                                    on ? "bg-primary_alt" : "bg-primary hover:bg-primary_hover",
                                                )}
                                            >
                                                <RadioBolinha selecionado={on} tamanho="sm" />
                                                <span className="px-0.5">{a.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </Bloco>

                            <Bloco titulo="Qual grupo será vinculado?">
                                <SeletorGrupoMembros valor={grupoMembrosId} onChange={setGrupoMembrosId} indisponiveis={jaVinculados} />
                            </Bloco>
                        </div>
                    )}

                    {etapa === 1 && (
                        <div className="flex w-full max-w-[1024px] flex-col gap-4">
                            <TituloSecao>Selecione os itens que o grupo poderá operar</TituloSecao>
                            <SelecaoIngressos selecionados={itens} onChange={setItens} />
                        </div>
                    )}

                    {etapa === 2 && (
                        <div className="flex w-full max-w-[800px] flex-col gap-6">
                            <TituloSecao apoio="Escolha se o grupo terá um limite de uso dos itens selecionados.">Defina como as cotas serão controladas</TituloSecao>

                            <div role="radiogroup" aria-label="Tipo de cota" className="flex flex-col gap-4">
                                <OpcaoCota
                                    titulo="Sem limite definido"
                                    descricao="O grupo poderá utilizar os itens selecionados até o limite do estoque disponível."
                                    selecionado={tipoCota === "sem-limite"}
                                    onSelect={() => setTipoCota("sem-limite")}
                                />

                                <OpcaoCota
                                    titulo="Cota compartilhada"
                                    descricao="Defina uma quantidade total para o grupo, compartilhada entre todos os itens selecionados."
                                    selecionado={tipoCota === "compartilhada"}
                                    onSelect={() => setTipoCota("compartilhada")}
                                >
                                    <div className="w-48">
                                        <Input
                                            size="sm"
                                            label="Cota total do grupo"
                                            inputMode="numeric"
                                            placeholder="0"
                                            value={total ? String(total) : ""}
                                            onChange={(v) => setTotal(soNumero(v))}
                                            wrapperClassName="bg-primary_alt"
                                            autoFocus
                                        />
                                    </div>
                                </OpcaoCota>

                                <OpcaoCota
                                    titulo="Cota por item"
                                    descricao="Defina uma quantidade máxima para cada item selecionado."
                                    selecionado={tipoCota === "por-item"}
                                    onSelect={() => setTipoCota("por-item")}
                                >
                                    <CotasPorItem itens={itens} valores={porItem} onValor={(id, n) => setPorItem((p) => ({ ...p, [id]: n }))} />
                                </OpcaoCota>
                            </div>
                        </div>
                    )}

                </main>
            </TemaCotas>
        </BackstageLayout>
    );
}

/* ------------------------------- Blocos -------------------------------- */

const Bloco = ({ titulo, children, gap = "gap-4" }: { titulo: string; children: ReactNode; gap?: string }) => (
    <section className={cx("flex flex-col", gap)}>
        <h2 className="text-lg font-semibold text-primary">{titulo}</h2>
        {children}
    </section>
);

/* ------------------------------ Stepper -------------------------------- */

/** Passos com círculo de 24px ligados por linha pontilhada, como no Figma. */
const Stepper = ({ atual, onIr }: { atual: number; onIr: (i: number) => void }) => (
    <ol className="relative grid w-full max-w-[764px] grid-cols-3">
        {/* Linha atrás dos círculos, do centro do primeiro ao centro do último. */}
        <span aria-hidden="true" className="absolute top-3.5 right-[16.667%] left-[16.667%] border-t-2 border-dotted border-primary" />
        {ETAPAS.map((titulo, i) => {
            const status = i < atual ? "completo" : i === atual ? "atual" : "pendente";
            return (
                <li key={titulo} className="relative flex justify-center">
                    <button
                        type="button"
                        disabled={status !== "completo"}
                        onClick={() => onIr(i)}
                        aria-current={status === "atual" ? "step" : undefined}
                        className="flex flex-col items-center gap-3 outline-none disabled:cursor-default"
                    >
                        <span
                            className={cx(
                                "flex size-7 items-center justify-center rounded-full text-xs font-medium tabular-nums",
                                status === "completo" && "bg-[var(--color-fg-quaternary)]",
                                status === "atual" && "bg-primary text-secondary ring-2 ring-fg-brand-primary ring-inset",
                                status === "pendente" && "bg-primary text-tertiary ring-1 ring-border-secondary ring-inset",
                            )}
                        >
                            {status === "completo" ? <Check className="size-3 text-white" strokeWidth={3} aria-hidden="true" /> : i + 1}
                        </span>
                        <span className={cx("text-sm font-semibold", status === "pendente" ? "text-tertiary" : "text-secondary")}>{titulo}</span>
                    </button>
                </li>
            );
        })}
    </ol>
);

/* ---------------------------- Opção de cota ---------------------------- */

const OpcaoCota = ({
    titulo,
    descricao,
    selecionado,
    onSelect,
    children,
}: {
    titulo: string;
    descricao: string;
    selecionado: boolean;
    onSelect: () => void;
    children?: ReactNode;
}) => {
    const reduzir = useReducedMotion();

    return (
        <div
            className={cx(
                "rounded-xl bg-primary_alt p-4 ring-inset transition-shadow duration-200 ease-out",
                selecionado ? "ring-2 ring-brand" : "ring-1 ring-border-secondary hover:ring-border-primary",
            )}
        >
            <button type="button" role="radio" aria-checked={selecionado} onClick={onSelect} className="flex w-full gap-3 text-left outline-none">
                <span className="pt-1">
                    <RadioBolinha selecionado={selecionado} />
                </span>
                <span className="flex flex-col">
                    <span className="text-lg font-semibold text-secondary">{titulo}</span>
                    {/* font-normal: dentro do botão a descrição herdava peso 500; no Figma é Regular. */}
                    <span className="text-md font-normal text-secondary">{descricao}</span>
                </span>
            </button>

            {/* Abre a altura com o conteúdo deslizando e aparecendo por cima; fecha mais rápido do que abre. */}
            <AnimatePresence initial={false}>
                {selecionado && children && (
                    <motion.div
                        key="campos"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                            height: "auto",
                            opacity: 1,
                            transition: reduzir
                                ? { duration: 0.15 }
                                : { height: { duration: 0.4, ease: EASE_ABRIR }, opacity: { duration: 0.25, delay: 0.08 } },
                        }}
                        exit={{
                            height: 0,
                            opacity: 0,
                            transition: reduzir ? { duration: 0.1 } : { height: { duration: 0.25, ease: EASE_FECHAR }, opacity: { duration: 0.12 } },
                        }}
                        className="overflow-hidden"
                    >
                        <motion.div
                            initial={reduzir ? false : { y: -8 }}
                            animate={{ y: 0, transition: { duration: 0.4, ease: EASE_ABRIR } }}
                            className="pt-3 pl-8"
                        >
                            {children}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/** Desacelera longo no fim: o painel "assenta" em vez de parar seco. */
const EASE_ABRIR = [0.22, 1, 0.36, 1] as const;
const EASE_FECHAR = [0.4, 0, 1, 1] as const;

/* ---------------------------- Cota por item ---------------------------- */

const CotasPorItem = ({ itens, valores, onValor }: { itens: string[]; valores: Record<string, number>; onValor: (id: string, n: number) => void }) => {
    const sessoes = useMemo(() => agruparPorSessao(itens.map((id) => ITEM_POR_ID[id]).filter((i): i is ItemCatalogo => Boolean(i))), [itens]);

    const reduzir = useReducedMotion();

    if (sessoes.length === 0) return <p className="text-sm text-tertiary">Selecione itens na etapa anterior para definir as cotas.</p>;

    return (
        <div className="flex flex-col gap-3">
            {sessoes.map(({ sessao, grupos }, i) => (
                // Os cards de sessão entram em cascata, logo depois do painel abrir.
                <motion.div
                    key={sessao.id}
                    initial={reduzir ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: EASE_ABRIR, delay: 0.12 + i * 0.07 }}
                >
                    <CardSessao rotulo={sessao.rotulo} fundo="medio">
                        {grupos.map((grupo) => (
                            <div key={grupo.nome} className="flex flex-col">
                                <p className="flex h-8 items-center text-sm font-semibold text-primary">{grupo.nome}</p>
                                {grupo.itens.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between gap-2 px-2 py-3">
                                        <span className="flex min-w-0 items-center gap-2">
                                            <span className="truncate text-sm font-medium text-secondary">{item.nome}</span>
                                            <BadgeTipo>{item.tipo === "produto" ? "Produto" : item.tipo === "ingresso" ? "Ingresso" : item.categoria}</BadgeTipo>
                                            {item.tipo === "ingresso" && item.lote && <span className="text-sm text-tertiary">{item.lote}</span>}
                                        </span>
                                        <div className="w-[78px] shrink-0">
                                            <Input
                                                size="sm"
                                                inputMode="numeric"
                                                placeholder="0"
                                                aria-label={`Cota de ${item.nome}`}
                                                value={valores[item.id] ? String(valores[item.id]) : ""}
                                                onChange={(v) => onValor(item.id, soNumero(v))}
                                                wrapperClassName="bg-primary_alt"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </CardSessao>
                </motion.div>
            ))}
        </div>
    );
};
