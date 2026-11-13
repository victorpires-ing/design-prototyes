import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Clock } from "@untitledui/icons";
import { Radio as AriaRadio, RadioGroup as AriaRadioGroup } from "react-aria-components";
import LogoBlack from "@/assets/Company logo_black.svg";
import LogoWhite from "@/assets/Company logo_white.svg";
import { Button } from "@/components/base/buttons/button";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { cx } from "@/utils/cx";
import { Aviso } from "../components/aviso";
import { Linha } from "../components/quadro-cobranca";
import {
    EVENTO,
    abrirLink,
    ate,
    brl,
    encerrarSessao,
    grupoDe,
    lote,
    mod,
    nomeItem,
    nomes,
    pagarLink,
    ped,
    sol,
    tick,
    useTroca,
    vencerLink,
} from "../data/troca-store";

const mmss = (ms: number) => {
    const t = Math.max(0, ms);
    return `${String(Math.floor(t / 60000)).padStart(2, "0")}:${String(Math.floor(t / 1000) % 60).padStart(2, "0")}`;
};

/**
 * Página do link de pagamento da troca, aberta pelo comprador (TS-1818).
 * Ao abrir, valida o estoque de novo e reserva a vaga por 15 minutos.
 */
export function LinkPagamento() {
    useTroca();
    const { id } = useParams();
    const s = sol(id);
    const [agora, setAgora] = useState(Date.now());
    const [forma, setForma] = useState("Pix");
    const [verificando, setVerificando] = useState(false);

    // Relógio da sessão de pagamento e expiração.
    useEffect(() => {
        const t = setInterval(() => {
            setAgora(Date.now());
            tick();
        }, 1000);
        return () => clearInterval(t);
    }, []);

    // Primeira abertura: confere vagas e reserva.
    useEffect(() => {
        if (s && s.status === "AGUARDANDO" && !s.reservado && !s.abertoEm) {
            setVerificando(true);
            const t = setTimeout(() => {
                abrirLink(s.id);
                setVerificando(false);
            }, 900);
            return () => clearTimeout(t);
        }
    }, [s?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    let corpo: React.ReactNode;
    if (!s) corpo = <Cartao titulo="Link inválido" texto="Este link de troca não existe. Se você recebeu por e-mail, fale com o atendimento." />;
    else if (s.status === "CONCLUIDA") {
        const it = ped(s.pedido)!.itens.find((i) => i.id === s.itemId)!;
        corpo = (
            <Cartao
                titulo="Troca confirmada!"
                texto={`${nomes(it)} agora está na ${mod(s.destino)!.nome} do evento ${EVENTO.nome}. Enviamos o novo comprovante por e-mail, e o anterior não vale mais.`}
            />
        );
    } else if (s.status === "EXPIRADA") corpo = <Cartao titulo="O prazo para pagar terminou" texto="O link ficou válido por 24 horas e expirou. Nada foi alterado na sua inscrição. Se ainda quiser trocar, fale com o atendimento." />;
    else if (s.status === "CANCELADA") corpo = <Cartao titulo="Esta troca foi cancelada" texto={`${s.motivoFim ?? ""} Nada foi alterado na sua inscrição e nenhum valor foi cobrado.`} />;
    else if (s.status === "REPROVADA")
        corpo = <Cartao titulo="Não foi possível concluir a troca" texto={`${s.motivoFim ?? ""} O valor pago (${brl(s.val.total)}) será estornado integralmente em até 7 dias úteis. Sua inscrição continua como estava.`} />;
    else if (s.status === "FALHA") corpo = <Cartao titulo="Pagamento recebido" texto="Estamos finalizando a sua troca. Não é preciso pagar de novo. Você recebe um e-mail assim que ela for concluída." />;
    else if (s.status === "PROCESSANDO") corpo = <Cartao titulo="Pagamento confirmado" texto="Estamos processando a sua troca." carregando />;
    else if (verificando || (!s.reservado && !s.abertoEm)) corpo = <Cartao titulo="Verificando vagas" texto={`Conferindo a disponibilidade da ${mod(s.destino)!.nome}.`} carregando />;
    else if (!s.reservado)
        corpo = (
            <Cartao titulo="O tempo para pagar acabou" texto={`A vaga foi liberada. Você pode tentar de novo até ${ate(s.expira)}, e vamos conferir se ainda há vagas.`}>
                <Button size="lg" color="primary" className="mt-6" onClick={() => abrirLink(s.id)}>
                    Tentar de novo
                </Button>
            </Cartao>
        );
    else {
        const g = grupoDe(s);
        const p = ped(s.pedido)!;
        const f = g.reduce((a, x) => ({ dif: a.dif + x.val.dif, dt: a.dt + x.val.dt, tt: a.tt + x.val.tt, total: a.total + x.val.total, down: a.down || x.val.down }), { dif: 0, dt: 0, tt: 0, total: 0, down: false });
        corpo = (
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
                <header className="flex flex-col gap-1">
                    <h1 className="text-display-xs font-bold text-primary">Pagamento da troca de inscrição</h1>
                    <p className="text-md text-tertiary">{EVENTO.nome}, domingo, 14 de março de 2027, às 06:00</p>
                </header>
                <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
                    <div className="flex flex-col gap-6">
                        <section className="flex flex-col gap-3 rounded-xl bg-primary p-5 ring-1 ring-border-secondary">
                            <h2 className="text-lg font-semibold text-primary">{g.length > 1 ? `${g.length} trocas` : "Sua troca"}</h2>
                            {g.map((x) => {
                                const it = p.itens.find((i) => i.id === x.itemId)!;
                                const l = lote(mod(x.destino), x.lote)!;
                                const camisetas = x.resp.map((r) => r.camiseta).filter(Boolean);
                                return (
                                    <div key={x.id} className="border-t border-secondary pt-3 text-sm text-tertiary">
                                        <p className="font-semibold text-primary">{nomes(it)}</p>
                                        <p>
                                            Sai a {nomeItem(it)}, que custou {brl(it.pago)}. Entra a <b className="font-semibold text-primary">{mod(x.destino)!.nome}</b>, {l.nome}, por {brl(l.valor)}
                                            {camisetas.length ? `, camiseta ${camisetas.join(" e ")}` : ""}.
                                        </p>
                                    </div>
                                );
                            })}
                        </section>
                        <section className="flex flex-col gap-3 rounded-xl bg-primary p-5 ring-1 ring-border-secondary">
                            <h2 className="text-lg font-semibold text-primary">Forma de pagamento</h2>
                            <AriaRadioGroup aria-label="Forma de pagamento" value={forma} onChange={setForma} className="flex flex-col gap-3">
                                {["Pix", "Cartão de crédito"].map((o) => (
                                    <AriaRadio
                                        key={o}
                                        value={o}
                                        className={({ isSelected }) => cx("relative flex cursor-pointer items-center gap-3 rounded-xl p-4 ring-1 ring-border-secondary ring-inset", isSelected && "ring-2 ring-brand")}
                                    >
                                        {({ isSelected, isFocusVisible }) => (
                                            <>
                                                <RadioButtonBase isSelected={isSelected} isFocusVisible={isFocusVisible} />
                                                <span className="text-sm font-semibold text-primary">{o}</span>
                                            </>
                                        )}
                                    </AriaRadio>
                                ))}
                            </AriaRadioGroup>
                            <p className="text-sm text-tertiary">Boleto não está disponível para trocas.</p>
                        </section>
                    </div>
                    <aside className="flex flex-col gap-4 rounded-xl bg-primary p-5 ring-1 ring-border-secondary lg:sticky lg:top-6">
                        <h2 className="text-lg font-semibold text-primary">Resumo</h2>
                        <div>
                            <Linha rotulo="Diferença da inscrição" valor={f.dif < 0 ? `menos ${brl(-f.dif)} (não devolvida)` : brl(f.dif)} />
                            <Linha rotulo="Diferença da taxa de serviço" valor={brl(f.dt)} />
                            <Linha rotulo="Taxa de troca" valor={brl(f.tt)} />
                            <Linha rotulo="Total a pagar" valor={brl(f.total)} total />
                        </div>
                        {f.down && <p className="text-sm text-tertiary">A nova modalidade custa menos que o valor pago. A diferença não é devolvida, conforme o aceite registrado no atendimento.</p>}
                        <div role="timer" className="flex gap-2 rounded-lg bg-warning-primary p-3 text-sm text-warning-primary">
                            <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            <span>
                                Sua vaga está reservada por <b className="font-semibold">{mmss((s.reservaAte ?? 0) - agora)}</b>. A troca só acontece depois do pagamento.
                            </span>
                        </div>
                        <Button size="lg" color="primary" className="w-full" onClick={() => pagarLink(s.id, forma)}>
                            Pagar {brl(f.total)}
                        </Button>
                    </aside>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-dvh bg-secondary">
            <header className="flex h-16 items-center border-b border-secondary bg-primary px-4 md:px-8">
                <img src={LogoBlack} alt="Ingresse" className="block h-6 dark:hidden" />
                <img src={LogoWhite} alt="Ingresse" className="hidden h-6 dark:block" />
            </header>
            <main className="px-4 py-8 md:px-8">{corpo}</main>

            {s && (
<ControlesLink id={s.id} />
            )}
        </div>
    );
}

function Cartao({ titulo, texto, carregando, children }: { titulo: string; texto: string; carregando?: boolean; children?: React.ReactNode }) {
    return (
        <section className="mx-auto flex max-w-lg motion-safe:animate-in flex-col items-center rounded-xl bg-primary px-6 py-10 text-center ring-1 ring-border-secondary duration-200 motion-safe:fade-in" aria-busy={carregando}>
            <h1 className="text-display-xs font-bold text-primary">{titulo}</h1>
            <p className="mt-2 text-md text-tertiary">{texto}</p>
            {carregando && <div className="mt-5 h-2 w-60 animate-pulse rounded-full bg-tertiary" />}
            {children}
        </section>
    );
}

/** Atalhos do protótipo para o tempo passar e para o estoque acabar. */
function ControlesLink({ id }: { id: string }) {
    const [aberto, setAberto] = useState(false);
    return (
        <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2">
            {aberto && (
                <div className="w-72">
                    <Aviso titulo="Controles do protótipo">
                        <div className="mt-2 flex flex-col gap-3">
                            <Button size="sm" color="secondary" onClick={() => encerrarSessao(id)}>
                                Passar 15 minutos
                            </Button>
                            <Button size="sm" color="secondary" onClick={() => vencerLink(id)}>
                                Passar 24 horas
                            </Button>
                        </div>
                    </Aviso>
                </div>
            )}
            <Button size="sm" color="secondary" onClick={() => setAberto((a) => !a)} className="shadow-lg">
                {aberto ? "Fechar controles" : "Controles do protótipo"}
            </Button>
        </div>
    );
}
