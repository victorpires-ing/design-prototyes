import { useMemo, useState } from "react";
import { ClipboardCheck } from "@untitledui/icons";
import { BotaoContorno, Topo } from "../components/topo";
import { ICONE_INGRESSO, ICONE_PROTECAO, type LinhaResumo, Resumo } from "../components/resumo";
import { SetorCard } from "../components/setor-card";
import { EVENTO, INGRESSO_POR_ID, PROTECAO_PERCENTUAL, SETORES } from "../data/evento";
import { useForceLightTheme } from "../utils/use-force-light-theme";

/**
 * Experimento de proteção de compra — /checkout/protecao-de-compra.
 * Reproduz a seleção de ingressos do carrinho em produção; ao escolher um ingresso,
 * a proteção entra no resumo como mais um item (com Remover) e o CTA vira "Continuar com proteção".
 * V2 (/checkout/protecao-de-compra/v2): a proteção aparece no resumo como card com radio, desligada,
 * e o rodapé volta ao original (total + "Continuar").
 * V3 (/checkout/protecao-de-compra/v3): a proteção fica na lista como os outros itens, com um radio no início, desligada;
 * rodapé com "Continuar com proteção" de ponta a ponta e "Prefiro correr o risco" embaixo.
 */
export function Selecao({ variante = "v1" }: { variante?: "v1" | "v2" | "v3" }) {
    useForceLightTheme();
    // V1: proteção já incluída (opt-out). V2 e V3: começa desligada e a pessoa ativa pelo radio (opt-in).
    const optIn = variante !== "v1";
    const cardV2 = variante === "v2";
    const [quantidades, setQuantidades] = useState<Record<string, number>>({});
    const [abertos, setAbertos] = useState<Set<string>>(new Set([SETORES[0].id]));
    // A proteção vem incluída; se a pessoa remover, fica de fora até ela esvaziar o carrinho.
    const [semProtecao, setSemProtecao] = useState(optIn);

    const selecionados = Object.entries(quantidades).filter(([, q]) => q > 0);
    const subtotal = selecionados.reduce((s, [id, q]) => s + INGRESSO_POR_ID[id].preco * q, 0);
    const qtdIngressos = selecionados.reduce((s, [, q]) => s + q, 0);
    const comProtecao = qtdIngressos > 0 && !semProtecao;
    const valorProtecao = Math.round(subtotal * PROTECAO_PERCENTUAL * 100) / 100;

    const linhas = useMemo<LinhaResumo[]>(() => {
        const ingressos = selecionados.map(([id, q]) => {
            const ing = INGRESSO_POR_ID[id];
            return { id, quantidade: q, titulo: ing.setor, subtitulo: ing.nome, valor: ing.preco * q, icone: ICONE_INGRESSO };
        });
        // V1 só lista a proteção quando incluída; V3 lista sempre (com o radio); V2 usa o card à parte
        if (cardV2 || (!comProtecao && variante === "v1") || qtdIngressos === 0) return ingressos;
        return [
            ...ingressos,
            {
                id: "protecao",
                quantidade: qtdIngressos,
                titulo: variante === "v3" ? "Seus planos podem mudar. Proteja sua compra." : "Proteção de compra",
                subtitulo: qtdIngressos === 1 ? "Cobre 1 ingresso" : `Cobre ${qtdIngressos} ingressos`,
                valor: valorProtecao,
                icone: ICONE_PROTECAO,
                link: "Ver coberturas",
            },
        ];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quantidades, comProtecao, valorProtecao, variante]);

    const mudarQuantidade = (id: string, qtd: number) => {
        const proximas = { ...quantidades, [id]: Math.max(0, qtd) };
        setQuantidades(proximas);
        if (Object.values(proximas).every((q) => q === 0)) setSemProtecao(optIn);
    };

    const remover = (id: string) => {
        if (id === "protecao") return setSemProtecao(true);
        mudarQuantidade(id, 0);
    };

    const alternarSetor = (id: string) =>
        setAbertos((a) => {
            const n = new Set(a);
            if (n.has(id)) n.delete(id);
            else n.add(id);
            return n;
        });

    return (
        <div className="min-h-screen bg-[#f6f6f6] font-['Elza'] text-[#1a1a1a]">
            <Topo />

            <main className="mx-auto grid max-w-[1408px] gap-6 px-4 pt-4 pb-8 lg:grid-cols-[minmax(0,1fr)_330px] lg:px-0 lg:pb-16">
                <section className="flex min-w-0 flex-col">
                    <p className="text-base text-[#7a7a7a]">{EVENTO.diaSemana}</p>
                    <p className="text-2xl font-bold text-[#1a1a1a]">{EVENTO.data}</p>

                    <div className="mt-8 flex flex-col gap-2">
                        {SETORES.map((s) => (
                            <SetorCard
                                key={s.id}
                                setor={s}
                                aberto={abertos.has(s.id)}
                                onAlternar={() => alternarSetor(s.id)}
                                quantidades={quantidades}
                                onQuantidade={mudarQuantidade}
                            />
                        ))}
                    </div>
                </section>

                <div className="flex flex-col gap-9 lg:pt-0">
                    <div className="flex lg:justify-start">
                        <BotaoContorno icone={ClipboardCheck} iconeAntes>
                            Adicionar código ou cupom
                        </BotaoContorno>
                    </div>
                    <div className="lg:sticky lg:top-4">
                        <Resumo
                            linhas={linhas}
                            total={subtotal + (comProtecao ? valorProtecao : 0)}
                            qtdItens={qtdIngressos}
                            comProtecao={comProtecao}
                            onRemover={remover}
                            onContinuarSemProtecao={() => setSemProtecao(true)}
                            protecaoOpcional={
                                cardV2 ? { ativa: comProtecao, qtdIngressos, valor: valorProtecao, onAtivar: () => setSemProtecao(false) } : undefined
                            }
                            protecaoRadio={variante === "v3" ? { ativa: comProtecao, onAtivar: () => setSemProtecao(false) } : undefined}
                            onRemoverTudo={() => {
                                setQuantidades({});
                                setSemProtecao(optIn);
                            }}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
