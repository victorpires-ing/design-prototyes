import { type FC, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
    Button as AriaButton,
    Dialog as AriaDialog,
    DialogTrigger as AriaDialogTrigger,
    ListBox as AriaListBox,
    ListBoxItem as AriaListBoxItem,
    Popover as AriaPopover,
    type Selection,
} from "react-aria-components";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, Plus, SearchLg, User01, Users01, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { CheckboxBase } from "@/components/base/checkbox/checkbox";
import { Input, InputBase } from "@/components/base/input/input";
import { InputGroup } from "@/components/base/input/input-group";
import { cx } from "@/utils/cx";
import { GRUPO_MEMBROS_POR_ID, GRUPOS_MEMBROS } from "../data/membros";

interface Props {
    /** Grupos de Membros vinculados (ids), na ordem em que foram escolhidos. */
    grupos: string[];
    onGrupos: (ids: string[]) => void;
    /** Pessoas incluídas uma a uma, por e-mail. */
    emails: string[];
    onEmails: (emails: string[]) => void;
    /** Dentro de um modal: sem o card em volta (o modal já é a moldura). */
    semMoldura?: boolean;
}

/** Junta os membros dos grupos e os e-mails avulsos, sem repetir quem aparece em mais de um lugar. */
export function operadoresDe(grupos: string[], emails: string[]) {
    return [...new Set([...grupos.flatMap((id) => GRUPO_MEMBROS_POR_ID[id]?.emails ?? []), ...emails])];
}

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * "Adicione operadores": um ou mais grupos de Membros (dropdown com busca e
 * múltipla escolha) e/ou pessoas incluídas uma a uma por e-mail. Abaixo, quem vira
 * operador, separado por grupo e com as pessoas avulsas numa seção própria.
 */
export function SeletorOperadores({ grupos, onGrupos, emails, onEmails, semMoldura = false }: Props) {
    const reduzir = useReducedMotion();
    const operadores = useMemo(() => operadoresDe(grupos, emails), [grupos, emails]);

    // Em quais grupos escolhidos cada e-mail já está (para barrar o mesmo e-mail como avulso).
    const origens = useMemo(() => {
        const mapa: Record<string, string[]> = {};
        for (const id of grupos) for (const e of GRUPO_MEMBROS_POR_ID[id]?.emails ?? []) (mapa[e] ??= []).push(GRUPO_MEMBROS_POR_ID[id].nome);
        return mapa;
    }, [grupos]);

    return (
        <div className={cx("flex flex-col gap-5", !semMoldura && "rounded-xl bg-primary p-6 ring-1 ring-border-secondary ring-inset")}>
            <div className="flex flex-col gap-1.5">
                <span id="rotulo-grupos" className="text-sm font-medium text-secondary">
                    Selecione grupos de membros
                </span>
                <DropdownGrupos valor={grupos} onChange={onGrupos} />
            </div>

            <CampoEmail emails={emails} origens={origens} onAdicionar={(novos) => onEmails([...emails, ...novos])} />

            {/* Quem vira operador: a área abre em altura quando entra o primeiro. */}
            <AnimatePresence initial={false}>
                {operadores.length > 0 && (
                    <motion.div
                        key="operadores"
                        initial={reduzir ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={reduzir ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={{ height: { duration: 0.4, ease: EASE }, opacity: { duration: 0.2 } }}
                        className="-mt-1 overflow-hidden"
                    >
                        <div className="flex flex-col gap-4 border-t border-secondary pt-5">
                            {/* Total do grupo novo, sem contar duas vezes quem está em mais de um grupo. */}
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-semibold text-primary">Operadores</span>
                                <span className="flex items-center gap-1.5 text-sm text-tertiary">
                                    <Users01 className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                    {operadores.length} {operadores.length === 1 ? "pessoa" : "pessoas"}
                                </span>
                            </div>

                            {/* Uma seção por grupo escolhido (na ordem de escolha) e, por último, quem entrou por e-mail. */}
                            <AnimatePresence initial={false}>
                                {grupos.map((id) => {
                                    const g = GRUPO_MEMBROS_POR_ID[id];
                                    if (!g) return null;
                                    return (
                                        <SecaoOperadores
                                            key={id}
                                            icone={Users01}
                                            titulo={g.nome}
                                            rotuloRemover="Remover grupo"
                                            onRemover={() => onGrupos(grupos.filter((x) => x !== id))}
                                            total={g.emails.length}
                                            unidade={["membro", "membros"]}
                                        >
                                            {g.emails.map((email) => (
                                                <LinhaOperador key={email} email={email} />
                                            ))}
                                        </SecaoOperadores>
                                    );
                                })}
                                {emails.length > 0 && (
                                    <SecaoOperadores
                                        key="individuais"
                                        icone={User01}
                                        titulo="Adicionadas individualmente"
                                        total={emails.length}
                                        unidade={["pessoa", "pessoas"]}
                                    >
                                        <AnimatePresence initial={false}>
                                            {emails.map((email) => (
                                                <LinhaOperador key={email} email={email} onRemover={() => onEmails(emails.filter((e) => e !== email))} />
                                            ))}
                                        </AnimatePresence>
                                    </SecaoOperadores>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ------------------------- Lista de operadores ------------------------- */

export function SecaoOperadores({
    icone: Icone,
    titulo,
    total,
    unidade,
    onRemover,
    rotuloRemover,
    children,
}: {
    icone: FC<{ className?: string }>;
    titulo: string;
    total: number;
    unidade: [string, string];
    /** Grupo: o "x" no canto desmarca o grupo inteiro. */
    onRemover?: () => void;
    rotuloRemover?: string;
    children: ReactNode;
}) {
    const reduzir = useReducedMotion();
    return (
        <motion.section
            layout={reduzir ? false : "position"}
            initial={reduzir ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.25, ease: EASE }}
            className="flex flex-col rounded-lg bg-primary_alt px-4 pt-3 pb-1 ring-1 ring-border-secondary ring-inset"
        >
            <div className="flex items-center gap-2 pb-1">
                <h3 className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium text-secondary">
                    <Icone className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                    <span>
                        {titulo} – {total} {total === 1 ? unidade[0] : unidade[1]}
                    </span>
                </h3>
                {onRemover && <ButtonUtility size="xs" color="tertiary" icon={Trash01} tooltip={rotuloRemover} onClick={onRemover} />}
            </div>
            <ul className="flex flex-col">{children}</ul>
        </motion.section>
    );
}

export function LinhaOperador({ email, onRemover }: { email: string; onRemover?: () => void }) {
    const reduzir = useReducedMotion();
    return (
        <motion.li
            initial={reduzir ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.25, ease: EASE }}
            className="flex min-h-10 items-center gap-2 border-t border-secondary py-1 text-sm text-secondary first:border-t-0"
        >
            <span className="min-w-0 flex-1 truncate">{email}</span>
            {/* Só quem entrou por e-mail sai daqui; quem vem de grupo sai desmarcando o grupo. */}
            {onRemover && <ButtonUtility size="xs" color="tertiary" icon={Trash01} tooltip="Remover" onClick={onRemover} />}
        </motion.li>
    );
}

/* ------------------------- Adicionar por e-mail ------------------------- */

function CampoEmail({ emails, origens, onAdicionar }: { emails: string[]; origens: Record<string, string[]>; onAdicionar: (novos: string[]) => void }) {
    const [valor, setValor] = useState("");
    const [erro, setErro] = useState<string>();

    // Aceita vários de uma vez (separados por espaço, vírgula ou ponto e vírgula). Os válidos entram;
    // os que não puderam entrar ficam no campo, com o motivo na legenda.
    const adicionar = () => {
        const digitados = [
            ...new Set(
                valor
                    .toLowerCase()
                    .split(/[\s,;]+/)
                    .filter(Boolean),
            ),
        ];
        if (digitados.length === 0) return;
        const novos: string[] = [];
        const recusados: string[] = [];
        let motivo = "";
        for (const email of digitados) {
            const problema = !EMAIL_VALIDO.test(email)
                ? `${email} não é um e-mail válido.`
                : emails.includes(email)
                  ? `${email} já foi adicionado.`
                  : origens[email]
                    ? `${email} já faz parte de ${origens[email].join(", ")}.`
                    : undefined;
            if (problema) {
                recusados.push(email);
                motivo ||= problema;
            } else novos.push(email);
        }
        if (novos.length) onAdicionar(novos);
        setValor(recusados.join(", "));
        setErro(recusados.length === 0 ? undefined : recusados.length === 1 ? motivo : `${recusados.length} e-mails não foram adicionados. ${motivo}`);
    };

    return (
        <div className="flex flex-col gap-1.5">
            <span id="rotulo-email" className="text-sm font-medium text-secondary">
                Adicione pessoas individualmente
            </span>
            <InputGroup
                aria-labelledby="rotulo-email"
                value={valor}
                onChange={(v) => {
                    setValor(v);
                    setErro(undefined);
                }}
                isInvalid={Boolean(erro)}
                hint={erro ?? "Digite ou cole os e-mails, separados por espaço ou vírgula."}
                trailingAddon={
                    <Button size="md" color="secondary" iconLeading={Plus} isDisabled={!valor.trim()} onClick={adicionar}>
                        Adicionar
                    </Button>
                }
            >
                <InputBase
                    placeholder="E-mail do operador"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            adicionar();
                        }
                    }}
                />
            </InputGroup>
        </div>
    );
}

/* ------------------------- Dropdown de grupos ------------------------- */

function DropdownGrupos({ valor, onChange }: { valor: string[]; onChange: (ids: string[]) => void }) {
    const [aberto, setAberto] = useState(false);
    const [busca, setBusca] = useState("");
    const lista = useRef<HTMLDivElement>(null);
    const gatilho = useRef<HTMLButtonElement>(null);

    // Sem o modo modal, fechar ao clicar fora e com Esc fica por nossa conta.
    useEffect(() => {
        if (!aberto) return;
        const fechar = () => {
            setAberto(false);
            setBusca("");
        };
        const fora = (e: PointerEvent) => {
            const alvo = e.target as Node;
            // A lista é identificada pela marcação no conteúdo (a ref do Popover não chega ao DOM).
            if ((alvo as Element).closest?.("[data-lista-grupos]") || gatilho.current?.contains(alvo)) return;
            fechar();
        };
        const esc = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            e.preventDefault();
            fechar();
            gatilho.current?.focus({ preventScroll: true });
        };
        document.addEventListener("pointerdown", fora, true);
        document.addEventListener("keydown", esc, true);
        return () => {
            document.removeEventListener("pointerdown", fora, true);
            document.removeEventListener("keydown", esc, true);
        };
    }, [aberto]);

    const visiveis = useMemo(() => {
        const q = busca.trim().toLowerCase();
        return q ? GRUPOS_MEMBROS.filter((g) => g.nome.toLowerCase().includes(q)) : GRUPOS_MEMBROS;
    }, [busca]);

    const resumo = valor.length === 0 ? undefined : valor.length === 1 ? GRUPO_MEMBROS_POR_ID[valor[0]]?.nome : `${valor.length} grupos selecionados`;

    // Mantém a ordem de escolha: quem já estava fica no lugar, quem entrou vai para o fim.
    const mudar = (sel: Selection) => {
        if (sel === "all") return;
        const ids = [...sel].map(String);
        onChange([...valor.filter((id) => ids.includes(id)), ...ids.filter((id) => !valor.includes(id))]);
    };

    return (
        <AriaDialogTrigger
            isOpen={aberto}
            onOpenChange={(abrir) => {
                setAberto(abrir);
                if (!abrir) setBusca("");
            }}
        >
            <AriaButton
                ref={gatilho}
                aria-labelledby="rotulo-grupos"
                // Com a lista aberta o destaque fica só na busca; o anel aparece só para quem navega pelo teclado.
                className={({ isFocusVisible }) =>
                    cx(
                        "flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg bg-primary px-3.5 text-left text-md shadow-xs ring-1 ring-border-primary outline-hidden transition duration-100 ease-linear ring-inset",
                        isFocusVisible && !aberto && "ring-2 ring-brand",
                    )
                }
            >
                <Users01 className="size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                <span className={cx("min-w-0 flex-1 truncate font-normal", resumo ? "text-primary" : "text-placeholder")}>
                    {resumo ?? "Selecione um ou mais grupos"}
                </span>
                <ChevronDown
                    className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-200 ease-out", aberto && "rotate-180")}
                    aria-hidden="true"
                />
            </AriaButton>

            <AriaPopover
                // Não modal: o modo modal trava a rolagem da página e a tela "pula" para o lado ao abrir/fechar.
                isNonModal
                placement="bottom start"
                // Sempre abaixo do campo: sem isso, ao marcar o primeiro grupo a lista de operadores aparece,
                // o espaço livre embaixo muda e a lista "pulava" para cima do campo.
                shouldFlip={false}
                offset={4}
                className={({ isEntering, isExiting }) =>
                    cx(
                        // Fica fora de .tema-cotas (portal): repete a classe para herdar fonte e cores.
                        "tema-cotas flex w-(--trigger-width) flex-col overflow-hidden rounded-lg bg-secondary shadow-[0_16px_40px_-8px_rgb(0_0_0/0.75),0_4px_12px_-4px_rgb(0_0_0/0.5)] ring-1 ring-border-primary outline-hidden",
                        isEntering && "duration-150 ease-out animate-in fade-in slide-in-from-top-1",
                        isExiting && "duration-100 ease-in animate-out fade-out",
                    )
                }
            >
                <AriaDialog aria-label="Grupos de membros" className="flex min-h-0 flex-col outline-hidden" data-lista-grupos>
                    <div className="shrink-0 p-1.5">
                        <Input
                            size="sm"
                            icon={SearchLg}
                            placeholder="Buscar grupo"
                            aria-label="Buscar grupo"
                            value={busca}
                            onChange={setBusca}
                            autoFocus
                            onKeyDown={(e) => {
                                // Seta para baixo leva da busca para a lista.
                                if (e.key === "ArrowDown") {
                                    e.preventDefault();
                                    lista.current?.querySelector<HTMLElement>("[role=option]")?.focus();
                                }
                            }}
                        />
                    </div>
                    {visiveis.length === 0 ? (
                        <p className="px-3 pt-2 pb-4 text-sm text-tertiary">Nenhum grupo encontrado.</p>
                    ) : (
                        <AriaListBox
                            ref={lista}
                            aria-label="Grupos de membros"
                            // Múltipla escolha: a lista fica aberta para marcar vários de uma vez.
                            selectionMode="multiple"
                            selectedKeys={valor}
                            onSelectionChange={mudar}
                            items={visiveis}
                            // Barra de rolagem própria: a global some no fundo desta lista. Fina (6px) como a do Figma.
                            className="max-h-[216px] min-h-0 overflow-y-auto px-1.5 pb-1.5 outline-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-0 [&::-webkit-scrollbar-thumb]:bg-[var(--color-border-primary)] hover:[&::-webkit-scrollbar-thumb]:bg-[var(--color-fg-quaternary)] [&::-webkit-scrollbar-track]:bg-transparent"
                        >
                            {(g) => (
                                <AriaListBoxItem
                                    id={g.id}
                                    textValue={g.nome}
                                    className={({ isFocused, isHovered }) =>
                                        cx(
                                            "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm outline-hidden transition duration-100 ease-linear",
                                            (isFocused || isHovered) && "bg-primary_hover",
                                        )
                                    }
                                >
                                    {({ isSelected }) => (
                                        <>
                                            <CheckboxBase isSelected={isSelected} />
                                            <span className="truncate font-medium text-primary">{g.nome}</span>
                                            <span className="shrink-0 text-tertiary">
                                                {g.emails.length} {g.emails.length === 1 ? "membro" : "membros"}
                                            </span>
                                        </>
                                    )}
                                </AriaListBoxItem>
                            )}
                        </AriaListBox>
                    )}
                </AriaDialog>
            </AriaPopover>
        </AriaDialogTrigger>
    );
}
