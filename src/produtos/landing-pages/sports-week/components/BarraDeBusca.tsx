import { useEffect, useState, type FC, type ReactNode } from "react";
import { motion } from "motion/react";
import { Calendar, ChevronDown, MarkerPin01, SearchLg, Tag01, Trophy01, XClose } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { MODALIDADES } from "../data/modalidades";
import { CIDADES, FAIXAS_DE_DESCONTO, PERIODOS, type Filtros } from "../utils/filtros";
import { T_SNAP } from "../utils/motion-tokens";
import { useSwMotion } from "../utils/use-sw-motion";

/* Barra de busca de eventos.
   É o atalho principal da campanha: na home ela atravessa o rodapé do hero e leva
   direto para a listagem já filtrada; na listagem ela é o cabeçalho da busca.
   Por isso é um formulário com submit e não um filtro ao vivo: quem está no hero
   ainda está montando a consulta e não quer ver a tela reagir a cada campo.
   O filtro ao vivo continua existindo na listagem, nos chips de modalidade. */

interface CampoProps {
    icone: FC<{ className?: string }>;
    rotulo: string;
    children: ReactNode;
    className?: string;
}

function Campo({ icone: Icone, rotulo, children, className }: CampoProps) {
    return (
        <label className={cx("group relative flex min-w-0 flex-1 items-center gap-2.5 px-3.5 py-2.5 @5xl/sw:py-3", className)}>
            <Icone className="size-5 shrink-0" />
            <span className="sr-only">{rotulo}</span>
            {children}
        </label>
    );
}

/* Select nativo: no mobile abre a roda do sistema, que é melhor do que qualquer
   dropdown custom, e no desktop se comporta como combobox com teclado de graça.
   O `appearance-none` existe só para a seta ser a do design. */
function Seletor({
    valor,
    onChange,
    padrao,
    opcoes,
    rotulo,
}: {
    valor: string | null;
    onChange: (v: string | null) => void;
    padrao: string;
    opcoes: { id: string; label: string }[];
    rotulo: string;
}) {
    return (
        <>
            <select
                value={valor ?? ""}
                onChange={(e) => onChange(e.target.value || null)}
                aria-label={rotulo}
                className={cx(
                    "sw-ui min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-5 text-sm font-semibold outline-none",
                    valor ? "text-[var(--sw-navy)]" : "text-[var(--sw-navy)]/60",
                )}
            >
                <option value="">{padrao}</option>
                {opcoes.map((o) => (
                    <option key={o.id} value={o.id}>
                        {o.label}
                    </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 size-4 opacity-50" />
        </>
    );
}

export function BarraDeBusca({
    valores,
    onBuscar,
    className,
    comModalidade = true,
    empilhado = false,
}: {
    valores: Filtros;
    onBuscar: (filtros: Filtros) => void;
    className?: string;
    /** Desligue onde já existe outro seletor de modalidade na mesma tela. */
    comModalidade?: boolean;
    /** Um campo por linha, sempre, ignorando a largura do container.
        É o formato da folha de baixo: lá a barra é a tela inteira, não um
        cabeçalho, e dentro dela a pessoa percorre uma lista de decisões. */
    empilhado?: boolean;
}) {
    const { reduce } = useSwMotion();
    const [rascunho, setRascunho] = useState(valores);

    /* A listagem pode mudar os filtros por fora (chips, limpar, voltar do histórico).
       Quando isso acontece, a barra precisa refletir o estado novo. */
    useEffect(() => setRascunho(valores), [valores]);

    const mexer = (parcial: Partial<Filtros>) => setRascunho((f) => ({ ...f, ...parcial }));

    const divisoria = empilhado ? "hidden" : "hidden @5xl/sw:block h-7 w-px shrink-0 bg-[var(--sw-navy)]/15";

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onBuscar(rascunho);
            }}
            role="search"
            aria-label="Buscar eventos da Sports Week"
            className={cx(
                "flex flex-col gap-2 rounded-3xl border-2 p-2",
                !empilhado &&
                    "@5xl/sw:flex-row @5xl/sw:items-center @5xl/sw:gap-0 @5xl/sw:rounded-full @5xl/sw:p-1.5 @5xl/sw:pl-3",
                className,
            )}
            style={{ backgroundColor: "var(--sw-white)", borderColor: "var(--sw-navy)", color: "var(--sw-navy)" }}
        >
            <Campo icone={SearchLg} rotulo="Procurar eventos" className={empilhado ? undefined : "@5xl/sw:flex-[1.4]"}>
                <input
                    type="search"
                    value={rascunho.busca}
                    onChange={(e) => mexer({ busca: e.target.value })}
                    placeholder="Procurar eventos..."
                    className="sw-ui min-w-0 flex-1 bg-transparent text-sm font-semibold text-[var(--sw-navy)] outline-none placeholder:font-medium placeholder:text-[var(--sw-navy)]/60"
                />
                {rascunho.busca ? (
                    <button
                        type="button"
                        aria-label="Limpar busca"
                        onClick={() => mexer({ busca: "" })}
                        className="shrink-0 opacity-50 hover:opacity-100"
                    >
                        <XClose className="size-4" />
                    </button>
                ) : null}
            </Campo>

            <span aria-hidden="true" className={divisoria} />

            {/* Na página os quatro seletores viram duas colunas assim que cabem: um
                por linha deixaria a barra mais alta que o hero. Na folha de baixo
                `empilhado` desliga isso e devolve uma decisão por linha. */}
            <div
                className={cx(
                    "grid grid-cols-1 gap-y-0.5",
                    !empilhado && "@3xl/sw:grid-cols-2 @3xl/sw:gap-x-2 @5xl/sw:contents",
                )}
            >
                <Campo icone={MarkerPin01} rotulo="Onde">
                    <Seletor
                        valor={rascunho.cidade}
                        onChange={(cidade) => mexer({ cidade })}
                        padrao="Todo o Brasil"
                        opcoes={CIDADES.map((c) => ({ id: c, label: c }))}
                        rotulo="Filtrar por cidade"
                    />
                </Campo>

                <span aria-hidden="true" className={divisoria} />

                <Campo icone={Tag01} rotulo="Desconto">
                    <Seletor
                        valor={rascunho.desconto}
                        onChange={(desconto) => mexer({ desconto })}
                        padrao="Todos os descontos"
                        opcoes={FAIXAS_DE_DESCONTO}
                        rotulo="Filtrar por faixa de desconto"
                    />
                </Campo>

                <span aria-hidden="true" className={divisoria} />

                <Campo icone={Calendar} rotulo="Quando">
                    <Seletor
                        valor={rascunho.periodo}
                        onChange={(periodo) => mexer({ periodo })}
                        padrao="Todas as datas"
                        opcoes={PERIODOS}
                        rotulo="Filtrar por período"
                    />
                </Campo>

                {comModalidade ? (
                    <>
                        <span aria-hidden="true" className={divisoria} />

                        <Campo icone={Trophy01} rotulo="Modalidade">
                            <Seletor
                                valor={rascunho.modalidades[0] ?? null}
                                onChange={(slug) => mexer({ modalidades: slug ? [slug as Filtros["modalidades"][number]] : [] })}
                                padrao="Todas as modalidades"
                                opcoes={MODALIDADES.map((m) => ({ id: m.slug, label: m.nome }))}
                                rotulo="Filtrar por modalidade"
                            />
                        </Campo>
                    </>
                ) : null}
            </div>

            <motion.button
                type="submit"
                whileHover={reduce ? undefined : { scale: 1.02 }}
                whileTap={reduce ? undefined : { scale: 0.97 }}
                transition={T_SNAP}
                className="sw-ui shrink-0 rounded-full px-7 py-3.5 text-sm font-extrabold tracking-[0.08em] uppercase @5xl/sw:ml-1"
                style={{ backgroundColor: "var(--sw-lime)", color: "var(--sw-navy)" }}
            >
                Procurar
            </motion.button>
        </form>
    );
}
