import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Trash03 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { CymaticsFill } from "@/components/application/loading-indicator/cymatics-loader";
import { BackstageLayout } from "../../components/Backstage";
import { RelatorioPageHeader } from "../components/RelatorioPageHeader";
import { RelatorioFiltersProvider, useRelatorioFilters } from "../components/relatorio-filters";
import { RelatorioIABlocks } from "../components/RelatorioIABlocks";
import { ComposerIA, useRelatorioChat } from "../components/RelatorioIAChat";
import { PERIODO_PADRAO, type Bloco } from "../data/relatorio-ia";

interface ItemRelatorio {
    id: string;
    bloco: Bloco;
}

/** Mensagens temáticas (cymatics/áudio) que giram enquanto a figura se transforma. */
const MENSAGENS_GERANDO = [
    "Analisando frequência…",
    "Equalizando resultados…",
    "Ressoando os dados…",
    "Mapeando linhas nodais…",
    "Sintonizando o padrão…",
    "Amplificando o sinal…",
    "Compondo o gráfico…",
];

/** Texto rotativo que muda junto com o gráfico, com fade + slide pra cima. */
function MensagemGerando() {
    const [i, setI] = useState(0);
    useEffect(() => {
        const id = window.setInterval(() => setI((p) => (p + 1) % MENSAGENS_GERANDO.length), 2000);
        return () => window.clearInterval(id);
    }, []);

    return (
        <span className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-primary px-3 py-1 shadow-xs ring-1 ring-border-secondary">
            <AnimatePresence mode="wait" initial={false}>
                <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="block whitespace-nowrap text-sm font-medium text-secondary"
                >
                    {MENSAGENS_GERANDO[i]}
                </motion.span>
            </AnimatePresence>
        </span>
    );
}

const COMPOSER_TRANSITION = { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const };

function Body() {
    const { dateRange } = useRelatorioFilters();
    const [itens, setItens] = useState<ItemRelatorio[]>([]);
    const [pending, setPending] = useState(false);
    const seq = useRef(0);
    const pendingRef = useRef<HTMLDivElement>(null);
    const scrollAlvo = useRef<string | null>(null);

    const adicionar = (_resposta: string, novos: Bloco[]) => {
        if (!novos.length) {
            toast("Não consegui gerar um gráfico para esse pedido. Tente reformular.");
            return;
        }
        // Não repete gráficos idênticos (mesmo tipo/título/dados), nem entre si nem com os já exibidos.
        const vistos = new Set(itens.map((x) => JSON.stringify(x.bloco)));
        const add: ItemRelatorio[] = [];
        for (const bloco of novos) {
            const chave = JSON.stringify(bloco);
            if (vistos.has(chave)) continue;
            vistos.add(chave);
            add.push({ id: `b${seq.current++}`, bloco });
        }
        if (!add.length) {
            toast("Esses dados já estão no relatório.");
            return;
        }
        // Rola até o primeiro bloco novo (métrica no topo ou gráfico no fim → posição correta).
        scrollAlvo.current = add[0].id;
        setItens((prev) => [...prev, ...add]);
    };
    const remover = (i: number) => setItens((prev) => prev.filter((_, idx) => idx !== i));
    const limpar = () => setItens([]);

    const chat = useRelatorioChat({ periodo: dateRange, onResult: adicionar, onPendingChange: setPending });
    const temConteudo = itens.length > 0 || pending;

    // Ao começar a gerar, rola até o container de loading.
    useEffect(() => {
        if (pending) requestAnimationFrame(() => pendingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
    }, [pending]);

    // Quando um bloco novo entra, rola até a posição real dele (topo se virou métrica, fim se gráfico).
    useEffect(() => {
        const id = scrollAlvo.current;
        if (!id) return;
        scrollAlvo.current = null;
        requestAnimationFrame(() => {
            document.querySelector(`[data-block-id="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
    }, [itens]);

    return (
        <div className="flex min-w-0 flex-1 flex-col">
            <main className="flex flex-1 flex-col px-4 py-6 md:px-6">
                {temConteudo && (
                    <RelatorioPageHeader
                        title="Relatório personalizado"
                        withFilters
                        filter="period"
                        actions={
                            itens.length > 0 ? (
                                <Button size="md" color="secondary" iconLeading={Trash03} onClick={limpar}>
                                    Limpar relatório
                                </Button>
                            ) : undefined
                        }
                    />
                )}

                {temConteudo ? (
                    <div className="flex flex-1 flex-col gap-4 pt-6 pb-44">
                        {itens.length > 0 && <RelatorioIABlocks blocos={itens.map((x) => x.bloco)} ids={itens.map((x) => x.id)} onRemover={remover} />}
                        {/* Placeholder com o loading cymatics enquanto a IA gera o próximo bloco. */}
                        <AnimatePresence>
                            {pending && (
                                <motion.div
                                    ref={pendingRef}
                                    key="pending"
                                    layout
                                    initial={{ opacity: 0, y: 14, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                                    className="relative flex h-60 scroll-mt-28 items-center justify-center overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary"
                                >
                                    <div className="relative aspect-square w-full shrink-0">
                                        <CymaticsFill className="absolute inset-0" />
                                    </div>
                                    <MensagemGerando />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    // Empty state: chamada provocativa + input centralizado + exemplos.
                    <div className="flex flex-1 flex-col items-center justify-center gap-10 pb-10">
                        <div className="flex flex-col items-center gap-5 text-center">
                            <span className="size-16 rounded-full bg-gradient-to-br from-brand-300 to-brand-600 shadow-lg shadow-brand-600/30" aria-hidden="true" />
                            <h1 className="text-display-sm font-semibold text-primary md:text-display-md">
                                O que você quer <span className="text-brand-secondary">descobrir?</span>
                            </h1>
                        </div>
                        <motion.div layoutId="composer-ia" transition={COMPOSER_TRANSITION} className="w-full">
                            <ComposerIA chat={chat} attached={false} />
                        </motion.div>
                    </div>
                )}
            </main>

            {/* Composer colado na base quando já há relatório — anima do centro para cá. */}
            {temConteudo && (
                <div className="pointer-events-none sticky bottom-0 z-30 px-4 pt-4 pb-6 md:px-6">
                    <motion.div layoutId="composer-ia" transition={COMPOSER_TRANSITION} className="pointer-events-auto">
                        <ComposerIA chat={chat} attached />
                    </motion.div>
                </div>
            )}
        </div>
    );
}

export function RelatorioPersonalizado() {
    return (
        <BackstageLayout activeSection="relatorios" activeItem="relatorio-personalizado">
            <RelatorioFiltersProvider initialDateRange={PERIODO_PADRAO}>
                <Body />
            </RelatorioFiltersProvider>
        </BackstageLayout>
    );
}
