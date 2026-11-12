import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, CheckCircle, Edit01, XClose } from "@untitledui/icons";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { BarraUso } from "./ui-cotas";

/* ------------------------------------------------------------------ */
/*  Cota editável no lugar (ECO-18): o lápis abre o campo; Enter ou    */
/*  clicar fora valida com loading simulado, Esc cancela. Sucesso      */
/*  mostra check por 3 s; erro, um tooltip por 15 s.                   */
/* ------------------------------------------------------------------ */

const soNumero = (v: string) => Number(v.replace(/\D/g, "").slice(0, 6)) || 0;

/** Tempo simulado da validação no servidor e quanto tempo cada feedback fica na tela. */
const TEMPO_VALIDANDO = 900;
const TEMPO_ERRO = 15000;
const TEMPO_SUCESSO = 3000;

type Estado = "exibindo" | "editando" | "validando" | "erro";

/**
 * Uso e barra da cota, com o lápis ao lado. Serve à linha de item (cota por item) e ao topo
 * do card (cota compartilhada); no topo o status fica à direita, para a barra seguir alinhada ao título.
 * O lápis abre um campo no lugar do uso; Enter ou
 * clicar fora valida (com loading), e o resultado aparece à esquerda: check de sucesso, ou
 * ícone de erro com tooltip já aberto, que some em 15s ou no X. Esc cancela.
 */
export const CotaEditavel = ({
    variante = "item",
    nome,
    uso,
    cota,
    editando,
    onEditar,
    onCancelar,
    onSalvar,
}: {
    variante?: "item" | "topo";
    nome: string;
    uso: number;
    cota: number;
    editando: boolean;
    onEditar: () => void;
    onCancelar: () => void;
    onSalvar: (n: number) => void;
}) => {
    const [valor, setValor] = useState(cota);
    const [estado, setEstado] = useState<Estado>("exibindo");
    const [erro, setErro] = useState<{
        titulo: string;
        descricao: string;
    } | null>(null);
    const [sucesso, setSucesso] = useState(false);
    const tentado = useRef<number | null>(null);
    // Esc desmonta o campo; o blur que vem junto não deve validar.
    const cancelado = useRef(false);

    // Outra linha começou a editar: esta volta a exibir.
    useEffect(() => {
        if (!editando) {
            setEstado("exibindo");
            setErro(null);
        }
    }, [editando]);

    useEffect(() => {
        if (!erro) return;
        const t = setTimeout(() => setErro(null), TEMPO_ERRO);
        return () => clearTimeout(t);
    }, [erro]);

    useEffect(() => {
        if (!sucesso) return;
        const t = setTimeout(() => setSucesso(false), TEMPO_SUCESSO);
        return () => clearTimeout(t);
    }, [sucesso]);

    const abrir = () => {
        setValor(cota);
        setErro(null);
        setSucesso(false);
        tentado.current = null;
        cancelado.current = false;
        setEstado("editando");
        onEditar();
    };

    const validar = () => {
        if (cancelado.current || estado === "validando") return;
        // Sem mudança: só fecha o campo.
        if (valor === cota) return onCancelar();
        // Mesmo valor que acabou de dar erro: não valida de novo.
        if (estado === "erro" && valor === tentado.current) return;

        tentado.current = valor;
        setErro(null);
        setEstado("validando");
        setTimeout(() => {
            if (valor <= 0) {
                setErro({
                    titulo: "Cota inválida",
                    descricao: "Informe uma quantidade maior que zero.",
                });
                return setEstado("erro");
            }
            if (valor < uso) {
                setErro({
                    titulo: "Cota menor que o já emitido",
                    descricao: `Informe ${uso} ou mais.`,
                });
                return setEstado("erro");
            }
            onSalvar(valor);
            setSucesso(true);
        }, TEMPO_VALIDANDO);
    };

    const teclas = (e: KeyboardEvent) => {
        if (e.key === "Enter") validar();
        if (e.key === "Escape") {
            cancelado.current = true;
            onCancelar();
        }
    };

    const noCampo = editando && estado !== "exibindo";

    const topo = variante === "topo";

    // Slot de status: loading, erro ou sucesso.
    const status = (
        <span className="relative flex size-5 shrink-0 items-center justify-center">
            <AnimatePresence mode="wait" initial={false}>
                {noCampo && estado === "validando" && (
                    <motion.span key="validando" {...fade} className="flex">
                        <Spinner />
                    </motion.span>
                )}
                {noCampo && estado === "erro" && (
                    <motion.span key="erro" {...fade} className="flex">
                        <AlertCircle className="size-5 text-fg-error-secondary" aria-hidden="true" />
                    </motion.span>
                )}
                {!noCampo && sucesso && (
                    <motion.span key="sucesso" {...fade} className="flex">
                        <CheckCircle className="size-5 text-fg-success-secondary" aria-label="Cota atualizada" />
                    </motion.span>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {noCampo && erro && (
                    <motion.div
                        role="alert"
                        initial={{ opacity: 0, y: 4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute bottom-full left-1/2 z-20 mb-2.5 flex w-max max-w-64 -translate-x-1/2 items-start gap-2 rounded-lg bg-primary-solid py-3 pr-2 pl-3 shadow-lg"
                    >
                        <span className="flex flex-col gap-1">
                            <span className="text-sm font-semibold text-white">{erro.titulo}</span>
                            <span className="text-sm font-normal text-tooltip-supporting-text">{erro.descricao}</span>
                        </span>
                        <button
                            type="button"
                            aria-label="Fechar"
                            // mousedown: não tira o foco do campo (senão o blur validaria de novo).
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setErro(null)}
                            className="flex rounded text-tooltip-supporting-text transition duration-100 ease-linear hover:text-white"
                        >
                            <XClose className="size-4" aria-hidden="true" />
                        </button>
                        <svg viewBox="0 0 100 100" className="absolute top-full left-1/2 size-2.5 -translate-x-1/2 fill-bg-primary-solid" aria-hidden="true">
                            <path d="M0,0 L35.858,35.858 Q50,50 64.142,35.858 L100,0 Z" />
                        </svg>
                    </motion.div>
                )}
            </AnimatePresence>
        </span>
    );

    const conteudo = (
        <AnimatePresence mode="wait" initial={false}>
            {noCampo ? (
                <motion.div key="campo" {...fade} className={topo ? "w-[167px]" : "min-w-[167px] flex-1"}>
                    <Input
                        size="sm"
                        inputMode="numeric"
                        aria-label={`Cota de ${nome}`}
                        value={valor ? String(valor) : ""}
                        placeholder="0"
                        onChange={(v) => setValor(soNumero(v))}
                        onKeyDown={teclas}
                        onBlur={validar}
                        isReadOnly={estado === "validando"}
                        wrapperClassName={cx("bg-primary_alt", estado === "erro" && "ring-error_subtle")}
                        autoFocus
                    />
                </motion.div>
            ) : topo ? (
                <motion.div key="uso" {...fade} className="flex items-center gap-3">
                    {/* Barra com largura fixa: um número grande alarga o texto, nunca encolhe a barra. */}
                    <BarraUso usadas={uso} total={cota} className="w-60 shrink-0" />
                    <span className="flex items-center gap-1">
                        <span className="text-sm font-medium whitespace-nowrap text-secondary tabular-nums">
                            {uso} de {cota}
                        </span>
                        <ButtonUtility size="sm" color="tertiary" icon={Edit01} tooltip="Editar cota" aria-label="Editar cota do grupo" onClick={abrir} />
                    </span>
                </motion.div>
            ) : (
                <motion.div key="uso" {...fade} className="flex flex-1 items-center gap-1">
                    <span className="flex min-w-[131px] flex-1 flex-col gap-2">
                        {/* Nunca quebra: o número de referência fica sempre numa linha. */}
                        <span className="text-sm font-medium whitespace-nowrap text-secondary tabular-nums">
                            {uso} de {cota} emissões
                        </span>
                        <BarraUso usadas={uso} total={cota} />
                    </span>
                    <ButtonUtility size="sm" color="tertiary" icon={Edit01} tooltip="Editar cota" aria-label={`Editar cota de ${nome}`} onClick={abrir} />
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="flex items-center gap-2">
            {topo ? (
                <>
                    {conteudo}
                    {status}
                </>
            ) : (
                <>
                    {status}
                    {conteudo}
                </>
            )}
        </div>
    );
};

const fade = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.15, ease: "easeOut" },
} as const;

/** Spinner pequeno no padrão "line-simple" do DS (o LoadingIndicator começa em 32px). */
const Spinner = () => (
    <svg className="size-5 animate-spin" viewBox="0 0 32 32" fill="none" role="status" aria-label="Validando">
        <circle className="stroke-bg-tertiary" cx="16" cy="16" r="13" strokeWidth="4" />
        <circle className="stroke-fg-brand-primary" cx="16" cy="16" r="13" strokeWidth="4" strokeDasharray="82" strokeDashoffset="60" strokeLinecap="round" />
    </svg>
);
