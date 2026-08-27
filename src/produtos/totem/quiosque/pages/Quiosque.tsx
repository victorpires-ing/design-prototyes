import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Minus, Plus, X } from "@untitledui/icons";
import { AnimatePresence, motion, useSpring, useTransform } from "motion/react";
import { cx } from "@/utils/cx";
import { TotemLayout } from "../../components/TotemLayout";
import { brl, CATEGORIAS, ITENS_POR_ID, type ItemQuiosque } from "../data/catalogo";

/*
 * Quiosque — seleção no ritmo de um balcão de autoatendimento.
 *
 * A referência é o totem de fast-food: categorias em cartões coloridos à
 * esquerda, o pedido sempre montado à direita, e o detalhe do item subindo
 * como uma folha por cima do resto. O que muda aqui é o vocabulário: a
 * categoria é o grupo de ingresso, o item é o lote, e "personalizar" é
 * escolher meia-entrada em vez de tirar picles.
 *
 * As três animações que fazem a tela parecer viva, em ordem de importância:
 *  1. o tom da tela acompanha a categoria — a cor diz onde você está;
 *  2. o preenchimento do cartão ativo VIAJA entre as categorias (layoutId),
 *     em vez de apagar aqui e acender ali;
 *  3. o pedido reage: a linha entra deslizando e o total corre até o novo valor.
 */

/** Quantidade por item — o pedido é um mapa id → quantidade. */
type Pedido = Record<string, number>;
/** Meia-entrada marcada por item. */
type Meias = Record<string, boolean>;

const MOLA = { type: "spring" as const, stiffness: 380, damping: 32 };

export function Quiosque() {
    const navigate = useNavigate();
    const [categoriaId, setCategoriaId] = useState(CATEGORIAS[0].id);
    const [pedido, setPedido] = useState<Pedido>({});
    const [meias, setMeias] = useState<Meias>({});
    /** Item aberto na folha de detalhe. */
    const [aberto, setAberto] = useState<ItemQuiosque | null>(null);

    const categoria = CATEGORIAS.find((c) => c.id === categoriaId)!;

    const linhas = useMemo(
        () => Object.entries(pedido).filter(([, q]) => q > 0).map(([id, q]) => ({ item: ITENS_POR_ID[id], quantidade: q })),
        [pedido],
    );
    const precoDe = (item: ItemQuiosque) => (meias[item.id] ? item.preco / 2 : item.preco);
    const total = linhas.reduce((soma, l) => soma + precoDe(l.item) * l.quantidade, 0);

    const somar = (id: string, delta: number) =>
        setPedido((atual) => ({ ...atual, [id]: Math.max(0, (atual[id] ?? 0) + delta) }));

    return (
        <TotemLayout
            title="Réveillon Carneiros 2027"
            badge="Quiosque"
            usuario="Victor"
            onBack={() => navigate("/totem")}
            accent="#ff271a"
        >
            <div className="relative flex h-full min-h-0 overflow-hidden bg-primary">
                {/*
                  Banho de cor da categoria. É o equivalente ao fundo do vídeo
                  mudando de vermelho para amarelo: a cor confirma a troca antes
                  de o texto ser lido.
                */}
                <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-[300px]"
                    animate={{ backgroundColor: categoria.tint }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    style={{ maskImage: "linear-gradient(to bottom, black, transparent)" }}
                />

                <main className="relative flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pt-4 pb-6">
                    <Saudacao vazio={linhas.length === 0} />

                    <div className="grid grid-cols-2 gap-2.5">
                        {CATEGORIAS.map((c) => (
                            <CartaoCategoria
                                key={c.id}
                                categoria={c}
                                ativa={c.id === categoriaId}
                                onClick={() => setCategoriaId(c.id)}
                            />
                        ))}
                    </div>

                    {/* O título grande é o marcador de que a lista abaixo mudou. */}
                    <AnimatePresence mode="wait">
                        <motion.h2
                            key={categoria.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.22 }}
                            className="pt-2 text-3xl leading-[1.1] font-bold tracking-tight text-primary"
                        >
                            {categoria.titulo[0]}
                            <br />
                            {categoria.titulo[1]}
                        </motion.h2>
                    </AnimatePresence>

                    <motion.div
                        key={`grid-${categoria.id}`}
                        initial="oculto"
                        animate="visivel"
                        variants={{ visivel: { transition: { staggerChildren: 0.04 } } }}
                        className="grid grid-cols-3 gap-x-3 gap-y-5"
                    >
                        {categoria.itens.map((item) => (
                            <CartaoItem
                                key={item.id}
                                item={item}
                                quantidade={pedido[item.id] ?? 0}
                                onClick={() => !item.esgotado && setAberto(item)}
                            />
                        ))}
                    </motion.div>
                </main>

                <PainelPedido
                    linhas={linhas}
                    total={total}
                    meias={meias}
                    onSomar={somar}
                    onContinuar={() => navigate("/totem/event")}
                />

                <AnimatePresence>
                    {aberto && (
                        <FolhaItem
                            item={aberto}
                            quantidade={pedido[aberto.id] ?? 0}
                            meia={Boolean(meias[aberto.id])}
                            onMeia={(on) => setMeias((m) => ({ ...m, [aberto.id]: on }))}
                            onSomar={(delta) => somar(aberto.id, delta)}
                            onFechar={() => setAberto(null)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </TotemLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Cabeçalho                                                          */
/* ------------------------------------------------------------------ */

const Saudacao = ({ vazio }: { vazio: boolean }) => (
    <div className="flex flex-col">
        <span className="text-2xl font-bold text-primary">E aí,</span>
        <span className="text-2xl font-light text-primary">{vazio ? "o que vai levar?" : "quer mais alguma coisa?"}</span>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Categorias                                                         */
/* ------------------------------------------------------------------ */

const CartaoCategoria = ({
    categoria,
    ativa,
    onClick,
}: {
    categoria: (typeof CATEGORIAS)[number];
    ativa: boolean;
    onClick: () => void;
}) => (
    <button
        type="button"
        onClick={onClick}
        aria-pressed={ativa}
        className="relative flex h-[88px] flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl bg-secondary px-2"
    >
        {/*
          Um único preenchimento com layoutId: ele desliza do cartão anterior
          para o novo. Dois cartões acendendo e apagando não contam essa história.
        */}
        {ativa && (
            <motion.span
                layoutId="categoria-ativa"
                transition={MOLA}
                className="absolute inset-0 rounded-2xl"
                style={{ backgroundColor: categoria.solid }}
            />
        )}

        {categoria.selo && (
            <span className="absolute top-2 right-2 z-10 rounded-full bg-primary px-1.5 py-0.5 text-xs font-bold text-primary">
                {categoria.selo}
            </span>
        )}

        <img
            src={categoria.imagem}
            alt=""
            aria-hidden="true"
            className="relative z-10 size-9 rounded-lg object-cover"
        />
        <span className={cx("relative z-10 text-center text-sm font-semibold", ativa ? "text-white" : "text-primary")}>
            {categoria.nome}
        </span>
    </button>
);

/* ------------------------------------------------------------------ */
/*  Itens                                                              */
/* ------------------------------------------------------------------ */

const CartaoItem = ({ item, quantidade, onClick }: { item: ItemQuiosque; quantidade: number; onClick: () => void }) => (
    <motion.button
        type="button"
        onClick={onClick}
        disabled={item.esgotado}
        variants={{ oculto: { opacity: 0, y: 12 }, visivel: { opacity: 1, y: 0 } }}
        whileTap={item.esgotado ? undefined : { scale: 0.96 }}
        className={cx("relative flex flex-col items-center gap-1 text-center", item.esgotado && "opacity-50")}
    >
        <span className="relative">
            <img src={item.imagem} alt="" aria-hidden="true" className="size-16 rounded-xl object-cover" />
            {/* O contador fica no item, não só na sacola: é onde o olho está. */}
            <AnimatePresence>
                {quantidade > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={MOLA}
                        className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-brand-solid text-xs font-bold text-white tabular-nums"
                    >
                        {quantidade}
                    </motion.span>
                )}
            </AnimatePresence>
        </span>
        <span className="text-sm leading-tight font-medium text-primary">{item.nome}</span>
        <span className="text-xs text-tertiary">{item.lote}</span>
        <span className="text-sm font-bold text-brand-secondary">{item.esgotado ? "Esgotado" : brl(item.preco)}</span>
    </motion.button>
);

/* ------------------------------------------------------------------ */
/*  Folha de detalhe                                                   */
/* ------------------------------------------------------------------ */

const FolhaItem = ({
    item,
    quantidade,
    meia,
    onMeia,
    onSomar,
    onFechar,
}: {
    item: ItemQuiosque;
    quantidade: number;
    meia: boolean;
    onMeia: (on: boolean) => void;
    onSomar: (delta: number) => void;
    onFechar: () => void;
}) => {
    /** Duas telas na mesma folha, trocadas no lugar — como o "Customize" da referência. */
    const [passo, setPasso] = useState<"quantidade" | "personalizar">("quantidade");

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onFechar}
                className="absolute inset-0 z-20 bg-overlay"
            />

            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: "12%" }}
                exit={{ y: "100%" }}
                transition={MOLA}
                className="absolute inset-x-0 bottom-0 z-30 flex h-full flex-col rounded-t-3xl bg-primary px-6 pt-4"
            >
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => (passo === "personalizar" ? setPasso("quantidade") : onFechar())}
                        aria-label={passo === "personalizar" ? "Voltar" : "Fechar"}
                        className="flex size-9 items-center justify-center rounded-full bg-secondary"
                    >
                        {passo === "personalizar" ? <ChevronLeft className="size-5" /> : <X className="size-5" />}
                    </button>
                    <span className="text-sm font-semibold text-tertiary">{item.lote}</span>
                </div>

                <AnimatePresence mode="wait">
                    {passo === "quantidade" ? (
                        <motion.div
                            key="quantidade"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18 }}
                            className="flex flex-col items-center gap-3 pt-4"
                        >
                            <img src={item.imagem} alt="" aria-hidden="true" className="size-32 rounded-2xl object-cover" />
                            <span className="text-xl font-bold text-primary">{item.nome}</span>
                            <span className="text-lg font-bold text-brand-secondary">
                                {brl(meia ? item.preco / 2 : item.preco)}
                            </span>

                            <Stepper valor={quantidade} onSomar={onSomar} />

                            <div className="flex items-center gap-3 pt-2">
                                {item.meia && (
                                    <button
                                        type="button"
                                        onClick={() => setPasso("personalizar")}
                                        className="rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-primary"
                                    >
                                        Personalizar
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (quantidade === 0) onSomar(1);
                                        onFechar();
                                    }}
                                    className="rounded-full bg-brand-solid px-7 py-2.5 text-sm font-semibold text-white"
                                >
                                    {quantidade === 0 ? "Adicionar" : "Pronto"}
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="personalizar"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18 }}
                            className="flex flex-col gap-4 pt-4"
                        >
                            <span className="text-lg font-bold text-primary">Tipo de entrada</span>
                            {[
                                { id: "inteira", nome: "Inteira", desc: "Sem comprovação", preco: item.preco },
                                { id: "meia", nome: "Meia-entrada", desc: "Documento na entrada", preco: item.preco / 2 },
                            ].map((opcao) => {
                                const marcada = (opcao.id === "meia") === meia;
                                return (
                                    <button
                                        key={opcao.id}
                                        type="button"
                                        onClick={() => onMeia(opcao.id === "meia")}
                                        className={cx(
                                            "flex items-center justify-between rounded-2xl px-4 py-3 ring-inset transition",
                                            marcada ? "bg-secondary ring-2 ring-brand" : "ring-1 ring-border-secondary",
                                        )}
                                    >
                                        <span className="flex flex-col text-left">
                                            <span className="text-sm font-semibold text-primary">{opcao.nome}</span>
                                            <span className="text-xs text-tertiary">{opcao.desc}</span>
                                        </span>
                                        <span className="text-sm font-bold text-primary">{brl(opcao.preco)}</span>
                                    </button>
                                );
                            })}
                            <button
                                type="button"
                                onClick={() => setPasso("quantidade")}
                                className="mt-2 self-center rounded-full bg-brand-solid px-7 py-2.5 text-sm font-semibold text-white"
                            >
                                Pronto
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </>
    );
};

const Stepper = ({ valor, onSomar }: { valor: number; onSomar: (delta: number) => void }) => (
    <div className="flex items-center gap-4">
        <button
            type="button"
            onClick={() => onSomar(-1)}
            disabled={valor === 0}
            aria-label="Diminuir"
            className="flex size-9 items-center justify-center rounded-full bg-secondary disabled:opacity-50"
        >
            <Minus className="size-4" />
        </button>
        <span className="w-6 text-center text-lg font-bold text-primary tabular-nums">{valor}</span>
        <button
            type="button"
            onClick={() => onSomar(1)}
            aria-label="Aumentar"
            className="flex size-9 items-center justify-center rounded-full bg-brand-solid text-white"
        >
            <Plus className="size-4" />
        </button>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Painel do pedido                                                   */
/* ------------------------------------------------------------------ */

const PainelPedido = ({
    linhas,
    total,
    meias,
    onSomar,
    onContinuar,
}: {
    linhas: Array<{ item: ItemQuiosque; quantidade: number }>;
    total: number;
    meias: Record<string, boolean>;
    onSomar: (id: string, delta: number) => void;
    onContinuar: () => void;
}) => {
    /* O total corre até o novo valor: o salto seco não mostra que algo entrou. */
    const mola = useSpring(0, { stiffness: 140, damping: 22 });
    const totalAnimado = useTransform(mola, (v) => brl(v));
    useEffect(() => mola.set(total), [total, mola]);

    return (
        <aside className="relative z-10 flex w-[176px] shrink-0 flex-col border-l border-secondary bg-secondary">
            <div className="flex flex-col px-4 pt-5">
                <span className="text-lg leading-tight font-bold text-primary">Seu pedido</span>
                <span className="text-xs text-tertiary">Retirada no local</span>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
                <AnimatePresence initial={false}>
                    {linhas.map(({ item, quantidade }) => (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 16 }}
                            transition={MOLA}
                            className="flex flex-col items-center gap-1 text-center"
                        >
                            <img src={item.imagem} alt="" aria-hidden="true" className="size-10 rounded-lg object-cover" />
                            <span className="text-xs leading-tight font-medium text-primary">{item.nome}</span>
                            {meias[item.id] && <span className="text-xs font-semibold text-brand-secondary">meia</span>}
                            <span className="text-xs text-tertiary">{brl(meias[item.id] ? item.preco / 2 : item.preco)}</span>
                            <div className="flex items-center gap-2 pt-0.5">
                                <button
                                    type="button"
                                    onClick={() => onSomar(item.id, -1)}
                                    aria-label={`Diminuir ${item.nome}`}
                                    className="flex size-5 items-center justify-center rounded-full bg-primary"
                                >
                                    <Minus className="size-3" />
                                </button>
                                <span className="text-xs font-bold text-primary tabular-nums">{quantidade}</span>
                                <button
                                    type="button"
                                    onClick={() => onSomar(item.id, 1)}
                                    aria-label={`Aumentar ${item.nome}`}
                                    className="flex size-5 items-center justify-center rounded-full bg-brand-solid text-white"
                                >
                                    <Plus className="size-3" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {linhas.length === 0 && (
                    <p className="pt-6 text-center text-xs text-tertiary">Toque em um ingresso para começar.</p>
                )}
            </div>

            <div className="flex flex-col gap-2 border-t border-secondary px-4 py-4">
                <span className="text-xs text-tertiary">Total</span>
                <motion.span className="text-lg font-bold text-primary tabular-nums">{totalAnimado}</motion.span>
                <button
                    type="button"
                    onClick={onContinuar}
                    disabled={linhas.length === 0}
                    className="rounded-full bg-brand-solid py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                    Continuar
                </button>
            </div>
        </aside>
    );
};
