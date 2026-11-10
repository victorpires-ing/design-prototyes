import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowDown, ArrowLeft, ChevronRight, XClose } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { AppShell } from "../../components/AppShell";
import { BottomSheet } from "../../components/BottomSheet";
import { StatusBar } from "../../components/StatusBar";
import { BankCardSendAnimation } from "../components/BankCardSendAnimation";
import { Zigzag } from "../../components/Zigzag";
import { getCombo, getEvento, getItem } from "../data/eventos";
import { CampoFormulario, formatarResposta, respostaVazia, valorPadrao } from "../components/CampoFormulario";
import { getFormulario } from "../data/formulario-store";
import alertAmareloIcon from "../../assets/alert-amarelo.png";

const DESTINATARIO = "Mariana Costa Lima";
const INICIAIS = "MC";

export function TransferirIngresso() {
    const navigate = useNavigate();
    const { eventId, id } = useParams();
    const evento = getEvento(eventId);
    const combo = getCombo(eventId, id);
    const item = getItem(eventId, id);
    const isCombo = !!combo;

    const evNome = evento.title;
    const title = item?.title ?? "Ingresso";
    const sessao = evento.sessao;

    const [email, setEmail] = useState("");
    const [searched, setSearched] = useState(false);
    const [confirming, setConfirming] = useState(false);
    // Config de transferência por ingresso: paga (com taxa) e/ou primeira gratuita
    const [paidOpen, setPaidOpen] = useState(false);
    const transferenciaPaga = !!item?.transferenciaPaga;
    const primeiraGratis = !!item?.primeiraTransferenciaGratis;
    const recebidoDe = item?.recebidoDe;
    const taxa = item?.taxaTransferencia ?? 0;
    const taxaLabel = `R$ ${taxa.toFixed(2).replace(".", ",")}`;

    // Questionário (apenas eventos que pedem formulário, ex.: São Silvestre)
    const [formOpen, setFormOpen] = useState(false);
    // O estoque aqui é só leitura: a transferência não consome vaga, quem consome é a edição do formulário.
    const perguntas = getFormulario(combo?.id, combo?.questionario ?? []);
    const [respostas, setRespostas] = useState<Record<string, string>>(() =>
        Object.fromEntries(perguntas.map((q) => [q.pergunta, valorPadrao(q)])),
    );
    const temFormulario = perguntas.length > 0;
    const faltando = perguntas.filter((q) => respostaVazia(q, respostas[q.pergunta] ?? ""));
    const formOk = faltando.length === 0;

    // Ao buscar, o teclado fecha e a tela desce até a conta encontrada (dá para subir e corrigir o e-mail).
    const resultRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!searched) return;
        // Espera o teclado recolher para calcular a rolagem com a altura final da tela
        const t = window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 300);
        return () => window.clearTimeout(t);
    }, [searched]);

    // Teclado aberto: campo + botão "Encontrar conta" sempre visíveis logo acima dele, em qualquer altura de tela.
    // O visualViewport diz quanto da tela sobrou; se o bloco do e-mail ficar por baixo do teclado, rolamos o
    // conteúdo até a borda dele encostar no topo do teclado. O espaçador no fim garante folga para rolar.
    const buscaRef = useRef<HTMLDivElement>(null);
    const [focado, setFocado] = useState(false);
    const [teclado, setTeclado] = useState(0);
    useEffect(() => {
        const vv = window.visualViewport;
        if (!focado || !vv) {
            setTeclado(0);
            return;
        }
        let frame = 0;
        const ajustar = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const bloco = buscaRef.current;
                if (!bloco) return;
                const visivelTopo = vv.offsetTop;
                const visivelBase = vv.offsetTop + vv.height;
                setTeclado(Math.max(0, window.innerHeight - vv.height));
                const scroller = bloco.closest<HTMLElement>(".overflow-y-auto");
                const r = bloco.getBoundingClientRect();
                const folga = 12;
                let delta = 0;
                if (r.bottom + folga > visivelBase) delta = r.bottom + folga - visivelBase;
                // Tela muito baixa: prioriza o topo do campo, sem esconder o título do bloco
                if (r.top - delta < visivelTopo + folga) delta = r.top - visivelTopo - folga;
                if (Math.abs(delta) > 1 && scroller) scroller.scrollBy({ top: delta, behavior: "smooth" });
            });
        };
        ajustar();
        vv.addEventListener("resize", ajustar);
        vv.addEventListener("scroll", ajustar);
        return () => {
            cancelAnimationFrame(frame);
            vv.removeEventListener("resize", ajustar);
            vv.removeEventListener("scroll", ajustar);
        };
    }, [focado]);

    const buscar = () => {
        if (email.trim() === "") return;
        (document.activeElement as HTMLElement | null)?.blur();
        setSearched(true);
    };

    const destino = isCombo ? `/ingresse-app/ingressos/combo/${evento.id}/${id}` : `/ingresse-app/ingressos/detalhe/${evento.id}/${id}`;
    const voltar = () => navigate(destino);

    const confirmarTransferencia = () => {
        setConfirming(false);
        navigate(`/ingresse-app/ingressos/transferir-pagamento/${evento.id}/${id}/sucesso`);
    };

    return (
        <AppShell showTabBar={false}>
            {formOpen ? (
                /* Tela de formulário do participante (tela cheia, não modal) */
                <div className="flex min-h-full flex-col bg-secondary">
                    <StatusBar tone="dark" />

                    <div className="px-5 pt-2">
                        <button
                            type="button"
                            aria-label="Voltar"
                            onClick={() => setFormOpen(false)}
                            className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                        >
                            <ArrowLeft className="size-5" />
                        </button>
                        <h1 className="pt-4 text-xl font-bold text-primary">Formulário do participante</h1>
                    </div>

                    <div className="flex flex-1 flex-col px-5 pt-4 pb-8">
                        <p className="text-sm text-tertiary">Para concluir, responda as mesmas perguntas da inscrição com os dados de {DESTINATARIO}.</p>

                        {/* Para quem está transferindo */}
                        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-primary p-4 ring-1 ring-border-secondary">
                            <Avatar size="md" initials={INICIAIS} alt={DESTINATARIO} />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-tertiary">Transferindo para</p>
                                <p className="text-sm font-bold text-primary">{DESTINATARIO}</p>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-5">
                            {perguntas.map((q) => (
                                <CampoFormulario
                                    key={q.pergunta}
                                    pergunta={q}
                                    valor={respostas[q.pergunta] ?? ""}
                                    isInvalid={faltando.includes(q)}
                                    onChange={(v) => setRespostas((r) => ({ ...r, [q.pergunta]: v }))}
                                />
                            ))}
                        </div>

                        {faltando.length > 0 && (
                            <p className="mt-5 text-sm text-error-primary">
                                {faltando.length === 1 ? "Falta responder 1 pergunta obrigatória." : `Falta responder ${faltando.length} perguntas obrigatórias.`}
                            </p>
                        )}

                        <Button
                            size="lg"
                            color="primary"
                            className="mt-6 w-full rounded-full"
                            isDisabled={!formOk}
                            onClick={() => {
                                setFormOpen(false);
                                setConfirming(true);
                            }}
                        >
                            Continuar
                        </Button>
                    </div>
                </div>
            ) : (
            <div className="flex min-h-full flex-col bg-secondary">
                <StatusBar tone="dark" />

                {/* Top bar + título */}
                <div className="px-5 pt-2">
                    <button
                        type="button"
                        aria-label="Voltar"
                        onClick={voltar}
                        className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <h1 className="pt-4 text-xl font-bold text-primary">Transferir ingresso</h1>
                </div>

                <div className="px-5 pt-5 pb-8">
                    {/* Card do ingresso (compacto) */}
                    <div className="rounded-3xl bg-primary shadow-sm ring-1 ring-border-secondary">
                        {isCombo && combo ? (
                            <>
                                <div className="p-5">
                                    <p className="text-xs font-medium tracking-wide text-tertiary uppercase">{evento.title}</p>
                                    <div className="my-3 border-t border-tertiary" />
                                    <p className="text-2xl leading-tight font-bold text-primary">{combo.nome}</p>
                                    <p className="mt-1.5 text-sm text-tertiary">{combo.dataEvento}</p>
                                </div>

                                <div className="relative py-1">
                                    <div className="absolute top-1/2 -left-2.5 size-5 -translate-y-1/2 rounded-full bg-secondary" />
                                    <div className="absolute top-1/2 -right-2.5 size-5 -translate-y-1/2 rounded-full bg-secondary" />
                                    <div className="px-3">
                                        <Zigzag />
                                    </div>
                                </div>

                                <div className="p-5">
                                    <p className="text-xs font-semibold text-tertiary">{combo.inclusosTitulo ?? "Itens do combo"}</p>
                                    <div className="mt-3 flex flex-col gap-3">
                                        {combo.inclusos?.map((inc, i) => (
                                            <div key={i} className={i > 0 ? "border-t border-tertiary pt-3" : ""}>
                                                <p className="text-sm font-bold text-primary">{inc.grupo ? `${inc.grupo} | ${inc.nome}` : inc.nome}</p>
                                                {inc.data && <p className="mt-0.5 text-sm text-tertiary">{inc.data}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="p-5">
                                <p className="text-sm text-tertiary">{evNome}</p>
                                <div className="my-3 border-t border-tertiary" />
                                <p className="text-2xl leading-tight font-bold text-primary">{title}</p>
                                <p className="mt-1.5 text-sm text-tertiary">Data do evento: {sessao}</p>
                            </div>
                        )}
                    </div>

                    {/* Conector */}
                    <div className="flex justify-center py-3">
                        <span className="flex size-12 items-center justify-center rounded-full bg-primary text-fg-secondary ring-1 ring-border-secondary">
                            <ArrowDown className="size-5" />
                        </span>
                    </div>

                    {/* Busca por e-mail */}
                    <div ref={buscaRef} className="scroll-mt-4 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                        <p className="text-md font-bold text-primary">E-mail de quem vai receber</p>
                        <div className="mt-3">
                            <Input
                                type="email"
                                inputMode="email"
                                enterKeyHint="search"
                                autoComplete="email"
                                placeholder="Este e-mail precisa estar cadastrado"
                                value={email}
                                onFocus={() => setFocado(true)}
                                // Solta a folga com um respiro: o botão não "foge" do dedo enquanto o teclado fecha
                                onBlur={() => window.setTimeout(() => setFocado(false), 250)}
                                onKeyDown={(e) => e.key === "Enter" && buscar()}
                                onChange={(v) => {
                                    // Mexeu no e-mail: a conta encontrada sai e o botão volta
                                    setEmail(v);
                                    setSearched(false);
                                }}
                            />
                        </div>
                        {primeiraGratis && (
                            <div className="mt-2 flex items-center gap-2">
                                <img src={alertAmareloIcon} alt="" aria-hidden="true" className="size-[38px] shrink-0 object-contain" />
                                <span className="text-sm text-tertiary">Esta transferência é gratuita. As próximas deste ingresso terão uma taxa.</span>
                            </div>
                        )}

                        {/* Depois da busca o botão sai: o próximo passo é a conta encontrada logo abaixo */}
                        {!searched && (
                            <Button
                                size="lg"
                                color="primary"
                                className="mt-4 w-full rounded-full"
                                isDisabled={email.trim() === ""}
                                onClick={buscar}
                            >
                                Encontrar conta
                            </Button>
                        )}
                    </div>

                    {/* Resultados da busca */}
                    {searched && (
                        <div
                            ref={resultRef}
                            className="mt-4 scroll-mt-6 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary duration-300 animate-in fade-in slide-in-from-bottom-3"
                        >
                            <p className="text-md font-bold text-primary">Conta encontrada</p>
                            <p className="mt-1 text-sm text-tertiary">Confira o nome e o e-mail antes de continuar.</p>

                            <div className="my-4 border-t border-tertiary" />

                            <button
                                type="button"
                                onClick={() => (transferenciaPaga ? setPaidOpen(true) : temFormulario ? setFormOpen(true) : setConfirming(true))}
                                className="flex w-full items-center gap-3 text-left transition duration-100 ease-linear active:opacity-70"
                            >
                                <Avatar size="md" initials={INICIAIS} alt={DESTINATARIO} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-primary">{DESTINATARIO}</p>
                                    <p className="truncate text-sm text-tertiary">{email}</p>
                                </div>
                                <ChevronRight className="size-5 shrink-0 text-fg-quaternary" />
                            </button>
                        </div>
                    )}

                    {/* Folga do tamanho do teclado: deixa rolar o bloco do e-mail até acima dele */}
                    {focado && teclado > 0 && <div aria-hidden="true" style={{ height: teclado }} />}
                </div>
            </div>
            )}

            {/* Bottom sheet: transferência com pagamento (feature paga) */}
            <BottomSheet isOpen={paidOpen} onClose={() => setPaidOpen(false)}>
                <div className="flex justify-end">
                    <button
                        type="button"
                        aria-label="Fechar"
                        onClick={() => setPaidOpen(false)}
                        className="shrink-0 text-fg-quaternary transition duration-100 ease-linear active:text-fg-secondary"
                    >
                        <XClose className="size-6" />
                    </button>
                </div>
                <div className="flex flex-col items-center text-center">
                    {paidOpen && <BankCardSendAnimation />}
                    <h2 className="mt-2 text-lg font-bold text-primary">Esta transferência agora tem um valor</h2>
                    <p className="mt-1 text-sm leading-relaxed text-tertiary">
                        Você recebeu este ingresso de {recebidoDe}. Para transferi-lo novamente, será cobrada uma taxa de
                        <br />
                        <span className="text-md font-medium whitespace-nowrap text-secondary">{taxaLabel}</span>.
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-tertiary">
                        Após o pagamento, o ingresso será transferido para <span className="font-medium text-secondary">{DESTINATARIO}</span>.
                    </p>
                </div>
                <Button
                    size="lg"
                    color="primary"
                    className="mt-5 w-full rounded-full"
                    onClick={() => navigate(`/ingresse-app/ingressos/transferir-pagamento/${evento.id}/${id}`)}
                >
                    Continuar para o pagamento
                </Button>
            </BottomSheet>

            {/* Bottom sheet: confirmar transferência */}
            <BottomSheet isOpen={confirming} onClose={() => setConfirming(false)}>
                <div className="flex justify-end">
                    <button
                        type="button"
                        aria-label="Fechar"
                        onClick={() => setConfirming(false)}
                        className="text-fg-quaternary transition duration-100 ease-linear active:text-fg-secondary"
                    >
                        <XClose className="size-6" />
                    </button>
                </div>

                <h2 className="text-lg font-bold text-primary">Tudo certo para transferir?</h2>
                <p className="mt-1 text-sm leading-relaxed text-tertiary">
                    Você está transferindo este ingresso para <span className="font-semibold text-secondary">{DESTINATARIO}</span>. Depois de confirmar, não será
                    possível desfazer a transferência.
                </p>

                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-primary p-4 ring-1 ring-border-secondary">
                    <Avatar size="md" initials={INICIAIS} alt={DESTINATARIO} />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-primary">{DESTINATARIO}</p>
                        <p className="truncate text-sm text-tertiary">{email}</p>
                    </div>
                </div>

                {/* Recap das respostas do formulário */}
                {temFormulario && (
                    <div className="mt-4 divide-y divide-border-secondary overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
                        {perguntas.map((q) => (
                            <div key={q.pergunta} className="p-3">
                                <p className="text-sm text-tertiary">{q.pergunta}</p>
                                <p className="mt-0.5 text-sm font-semibold text-primary">
                                    {formatarResposta(q, respostas[q.pergunta] ?? "") || "Não respondido"}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                <Button size="lg" color="primary" className="mt-5 w-full rounded-full" onClick={confirmarTransferencia}>
                    Confirmar transferência
                </Button>
                <Button
                    size="lg"
                    color="secondary"
                    className="mt-3 w-full rounded-full"
                    onClick={() => {
                        setConfirming(false);
                        if (temFormulario) setFormOpen(true);
                    }}
                >
                    Cancelar
                </Button>
            </BottomSheet>
        </AppShell>
    );
}
