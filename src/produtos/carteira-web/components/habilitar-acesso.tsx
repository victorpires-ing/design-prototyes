import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft } from "@untitledui/icons";
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { Button } from "@/components/base/buttons/button";
import { PinInput } from "@/components/base/input/pin-input";
import { cx } from "@/utils/cx";
import { EU, iniciarHabilitacao, marcarTelaDeHabilitacao, primeiroNome, useDependentes, type Dependente } from "../data/dependentes";
import { VoltarTitulo } from "./evento-desktop";
import { IconeErroSincronizar } from "./icone-erro-sincronizar";
import { UsersAnimation } from "./users-animation";

type Etapa = "codigo" | "processando";
type ErroCodigo = "incorreto" | "expirado" | null;

/* Códigos do protótipo: 000000 = incorreto, 111111 = expirado, qualquer outro = válido. */
const CODIGO_INCORRETO = "000000";
const CODIGO_EXPIRADO = "111111";
const REENVIO_S = 30;
/** Telefone da conta mascarado (mesmo do app). */
const TELEFONE = `(${EU.telefone.slice(1, 3)}) •••••-${EU.telefone.slice(-4)}`;

/**
 * Habilitar acesso ao perfil do dependente, depois da explicação (diálogo na lista):
 * confirmação de identidade por código → preparando o perfil → sucesso (ou falha). Mesmos textos do app.
 * No desktop fica num cartão central; no celular ocupa o frame, com a barra de ações embaixo.
 */
export function HabilitarAcesso({
    dependente,
    compact,
    onVoltar,
    onEntrar,
}: {
    dependente: Dependente;
    compact: boolean;
    onVoltar: () => void;
    onEntrar: () => void;
}) {
    useDependentes();
    const dep = dependente;
    const nome = primeiroNome(dep);

    const [etapa, setEtapa] = useState<Etapa>(() => (dep.acesso === "preparando" ? "processando" : "codigo"));
    const [codigo, setCodigo] = useState("");
    const [validando, setValidando] = useState(false);
    const [erro, setErro] = useState<ErroCodigo>(null);
    const [espera, setEspera] = useState(REENVIO_S);
    // Sucesso: o ícone toca sozinho e só depois surgem o texto e as ações.
    const [mostrarSucesso, setMostrarSucesso] = useState(false);
    const campoRef = useRef<HTMLDivElement>(null);

    // Enquanto esta tela está aberta, o fim da preparação não vira toast.
    useEffect(() => {
        marcarTelaDeHabilitacao(dep.id);
        return () => marcarTelaDeHabilitacao(null);
    }, [dep.id]);

    useEffect(() => {
        if (etapa !== "codigo" || espera <= 0) return;
        const t = window.setTimeout(() => setEspera((s) => s - 1), 1000);
        return () => window.clearTimeout(t);
    }, [espera, etapa]);

    const validar = (valor: string) => {
        if (valor.length < 6 || validando) return;
        // Sai do foco ao completar: o contorno do campo ativo some de uma vez e as bordas não mudam durante a validação
        (document.activeElement as HTMLElement | null)?.blur();
        setValidando(true);
        setErro(null);
        window.setTimeout(() => {
            setValidando(false);
            if (valor === CODIGO_INCORRETO) return setErro("incorreto");
            if (valor === CODIGO_EXPIRADO) return setErro("expirado");
            iniciarHabilitacao(dep.id);
            setEtapa("processando");
        }, 1200);
    };

    const reenviar = () => {
        setCodigo("");
        setErro(null);
        setEspera(REENVIO_S);
        // Sem aviso: a contagem reinicia e o primeiro campo volta a esperar o código
        requestAnimationFrame(() => campoRef.current?.querySelector("input")?.focus());
    };

    /* ------------------------- Preparando / resultado ------------------------- */
    if (etapa === "processando") {
        const pronto = dep.acesso === "pronto";
        const falhou = dep.acesso === "falhou";

        // Empilhados no celular e no desktop: primário em cima, secundário embaixo
        const linhaDeBotoes = "flex flex-col gap-3";
        const acoes = pronto ? (
            <AnimatePresence>
                {mostrarSucesso && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
                        className={linhaDeBotoes}
                    >
                        <Button size="lg" color="primary" className="w-full" onClick={onEntrar}>
                            Entrar no perfil
                        </Button>
                        <Button size="lg" color="secondary" className="w-full" onClick={onVoltar}>
                            Voltar aos dependentes
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        ) : (
            <div className={linhaDeBotoes}>
                {falhou && (
                    <Button size="lg" color="primary" className="w-full" onClick={() => iniciarHabilitacao(dep.id)}>
                        Tentar novamente
                    </Button>
                )}
                <Button size="lg" color={falhou ? "secondary" : "primary"} className="w-full" onClick={onVoltar}>
                    {/* Enquanto prepara, sair é pedir o aviso: o toast chega quando terminar */}
                    {falhou ? "Voltar aos dependentes" : "Avise-me quando estiver pronto"}
                </Button>
            </div>
        );

        const conteudo = (
            <div className="flex flex-col items-center text-center" role="status" aria-live="polite">
                {pronto ? (
                    <>
                        <motion.div layout transition={{ type: "spring", stiffness: 220, damping: 26 }}>
                            <UsersAnimation plays={2} onDone={() => setMostrarSucesso(true)} />
                        </motion.div>
                        <AnimatePresence>
                            {mostrarSucesso && (
                                <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
                                    <h1 className="mt-2 text-xl font-bold text-primary">Acesso habilitado</h1>
                                    <p className="mt-2 text-sm leading-relaxed text-tertiary">
                                        Agora você pode acessar o perfil de {nome} e os ingressos disponíveis pela sua conta.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                ) : falhou ? (
                    <>
                        <IconeErroSincronizar className="size-16 text-fg-quaternary" />
                        <h1 className="mt-4 text-2xl font-bold text-primary">Algo deu errado</h1>
                        <p className="mt-2 text-md text-tertiary">
                            Não foi possível habilitar o acesso.
                            <br />
                            Tente novamente em alguns instantes.
                        </p>
                    </>
                ) : (
                    <>
                        <LoadingIndicator type="line-simple" size="md" />
                        <h1 className="mt-5 text-xl font-bold text-primary">Preparando o perfil de {nome}</h1>
                        <p className="mt-2 text-sm leading-relaxed text-tertiary">Isso pode levar alguns instantes</p>
                    </>
                )}
            </div>
        );

        if (compact) {
            return (
                <div className="relative flex min-h-0 flex-1 flex-col bg-secondary">
                    {falhou && (
                        <div className="px-5 pt-4">
                            <BotaoVoltar onClick={onVoltar} />
                        </div>
                    )}
                    <div className="flex flex-1 items-center justify-center px-8 pb-40">{conteudo}</div>
                    {/* Barra de ações (fundo branco e borda no topo, como no Figma) */}
                    <div className="absolute inset-x-0 bottom-0 border-t border-secondary bg-primary px-5 pt-3 pb-6">{acoes}</div>
                </div>
            );
        }

        // Desktop: como "Troca concluída" no Figma — conteúdo solto no centro (sem cartão) e o CTA de 396px abaixo
        return (
            <div className="flex min-h-[calc(100vh-5rem)] flex-col">
                <VoltarTitulo titulo="Habilitar acesso" onBack={onVoltar} />
                <div className="flex flex-1 flex-col items-center justify-center px-4 pb-28">
                    <ConteudoAberto pronto={pronto} falhou={falhou} nome={nome} mostrarSucesso={mostrarSucesso} onIconeTerminou={() => setMostrarSucesso(true)} />
                    {/* 396px, como o CTA de "Troca concluída" no Figma */}
                    <div className="mt-[88px] w-[396px] max-w-full">{acoes}</div>
                </div>
            </div>
        );
    }

    /* --------------------------------- Código --------------------------------- */
    const dica =
        erro === "incorreto" ? "Código incorreto. Confira e tente novamente." : erro === "expirado" ? "Esse código expirou. Peça um novo para continuar." : undefined;

    const confirmar = (
        <Button size="lg" color="primary" className="w-full" isLoading={validando} isDisabled={codigo.length < 6 || erro === "expirado"} onClick={() => validar(codigo)}>
            Confirmar
        </Button>
    );

    const campo = (
        <div ref={campoRef} className={cx("flex flex-col items-center gap-4 rounded-2xl bg-primary p-5", compact && "ring-1 ring-border-secondary")}>
                        {/* Sem "disabled" na validação (desabilitar troca as bordas e os campos parecem encolher; só ignoramos a digitação).
                            items-center: a mensagem de erro, mais larga que os campos, não empurra os campos para a esquerda */}
                        <PinInput size="xs" invalid={Boolean(erro)} className="items-center">
                <PinInput.Group
                    maxLength={6}
                    value={codigo}
                    inputMode="numeric"
                    autoFocus
                    onChange={(v) => {
                        if (validando) return;
                        setCodigo(v.replace(/\D/g, ""));
                        if (erro === "incorreto") setErro(null);
                    }}
                    onComplete={validar}
                >
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <PinInput.Slot
                            key={i}
                            index={i}
                            // Números, cursor e anel de foco em preto; o contorno fica no cinza do campo vazio
                            className={cx(
                                "[&_.animate-caret-blink]:bg-fg-primary",
                                !erro && "outline-fg-primary",
                                !erro && i < codigo.length && "text-primary",
                                !erro && i <= codigo.length && "ring-primary",
                            )}
                        />
                    ))}
                </PinInput.Group>
                {/* Linha da mensagem sempre reservada: no erro o cartão não cresce, só aparece o texto (e as bordas mudam de cor) */}
                <PinInput.Description isInvalid className={cx("min-h-5 text-center", !dica && "invisible")} aria-hidden={!dica}>
                    {dica ?? "\u00A0"}
                </PinInput.Description>
            </PinInput>
            {espera > 0 && erro !== "expirado" ? (
                <p className="text-sm text-tertiary tabular-nums">Reenviar código em 0:{String(espera).padStart(2, "0")}</p>
            ) : (
                <Button size="sm" color="link-color" onClick={reenviar}>
                    Reenviar código
                </Button>
            )}
        </div>
    );

    const textos = (
        <>
            <h1 className="text-xl font-bold text-primary">Confirme que é você</h1>
            <p className="mt-1 text-sm text-tertiary">
                Enviamos um código de 6 dígitos por SMS para <span className="font-semibold text-secondary">{TELEFONE}</span>.
            </p>
        </>
    );

    if (compact) {
        return (
            <div className="relative flex min-h-0 flex-1 flex-col bg-secondary">
                <div className="scrollbar-hide flex-1 overflow-y-auto">
                    <div className="px-5 pt-4">
                        <BotaoVoltar onClick={onVoltar} disabled={validando} />
                    </div>
                    <div className="px-5 pt-4">{textos}</div>
                    <div className="px-5 pt-6 pb-32">{campo}</div>
                </div>
                <div className="absolute inset-x-0 bottom-0 border-t border-secondary bg-primary px-5 pt-3 pb-6">{confirmar}</div>
            </div>
        );
    }

    return (
        <CartaoDesktop onVoltar={validando ? undefined : onVoltar}>
            {textos}
            <div className="mt-6 rounded-2xl ring-1 ring-border-secondary">{campo}</div>
            <div className="mt-6">{confirmar}</div>
        </CartaoDesktop>
    );
}

const BotaoVoltar = ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
    <button
        type="button"
        aria-label="Voltar"
        disabled={disabled}
        onClick={onClick}
        className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary disabled:opacity-50"
    >
        <ArrowLeft className="size-5" />
    </button>
);

/** Desktop: o código fica num cartão central, abaixo da faixa com voltar + título. */
const CartaoDesktop = ({ onVoltar, children }: { onVoltar?: () => void; children: ReactNode }) => (
    <div className="pb-28">
        {/* Sem voltar (ex.: validando o código), o espaço do topo se mantém para o cartão não pular */}
        {/* Faixa branca com voltar + título (padrão das páginas internas); validando, o voltar some mas a faixa fica */}
        {onVoltar ? <VoltarTitulo titulo="Confirmação de identidade" onBack={onVoltar} /> : <div className="h-16 bg-primary" />}
        <div className="mx-auto w-full max-w-[480px] px-4 pt-10">
            <div className="rounded-2xl bg-primary p-8 shadow-sm ring-1 ring-border-secondary">{children}</div>
        </div>
    </div>
);

/** Preparando / sucesso / falha no desktop, nos tamanhos de "Troca concluída": ícone ~100px, título 30px e apoio 14px. */
function ConteudoAberto({
    pronto,
    falhou,
    nome,
    mostrarSucesso,
    onIconeTerminou,
}: {
    pronto: boolean;
    falhou: boolean;
    nome: string;
    mostrarSucesso: boolean;
    onIconeTerminou: () => void;
}) {
    const textos = (titulo: string, apoio: ReactNode) => (
        <div className="mt-6 flex flex-col gap-2.5">
            <h1 className="text-display-sm font-semibold text-primary">{titulo}</h1>
            <p className="text-md text-tertiary">{apoio}</p>
        </div>
    );
    return (
        <div className="flex flex-col items-center text-center" role="status" aria-live="polite">
            {pronto ? (
                <>
                    <motion.div layout transition={{ type: "spring", stiffness: 220, damping: 26 }}>
                        <UsersAnimation plays={2} onDone={onIconeTerminou} />
                    </motion.div>
                    <AnimatePresence>
                        {mostrarSucesso && (
                            <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
                                {textos(
                                    "Acesso habilitado",
                                    <>
                                        Agora você pode acessar o perfil de {nome}
                                        <br />e os ingressos disponíveis pela sua conta.
                                    </>,
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            ) : falhou ? (
                <>
                    <IconeErroSincronizar className="size-24 text-fg-quaternary" />
                    {textos(
                        "Algo deu errado",
                        <>
                            Não foi possível habilitar o acesso.
                            <br />
                            Tente novamente em alguns instantes.
                        </>,
                    )}
                </>
            ) : (
                <>
                    <div className="flex size-24 items-center justify-center">
                        <LoadingIndicator type="line-simple" size="md" />
                    </div>
                    {textos(`Preparando o perfil de ${nome}`, "Isso pode levar alguns instantes")}
                </>
            )}
        </div>
    );
}
