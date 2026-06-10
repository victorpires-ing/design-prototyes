import { useState } from "react";
import { MinusCircle, PlusCircle, QrCode01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Toggle } from "@/components/base/toggle/toggle";
import { cx } from "@/utils/cx";
import type { Combo, EventoIncluso, IngressoAvulso, StatusEvento, Transferencia } from "../data/ingressos";

/* ------------------------------------------------------------------ */
/*  Peças compartilhadas                                              */
/* ------------------------------------------------------------------ */

const STATUS_BADGE: Record<StatusEvento, { label: string; color: "gray" | "success" | "blue" }> = {
    finalizado: { label: "Finalizado", color: "gray" },
    "em-andamento": { label: "Em andamento", color: "success" },
    proximo: { label: "Próximo", color: "blue" },
};

const QrBlock = ({ valor, legenda }: { valor: string; legenda?: string }) => (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-primary p-4 ring-1 ring-border-secondary">
        {legenda && (
            <p className="text-center text-sm font-semibold text-error-primary">{legenda}</p>
        )}
        <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=0&data=${encodeURIComponent(valor)}`}
            alt="QR Code do ingresso"
            className="aspect-square w-full max-w-[260px] rounded-lg"
        />
    </div>
);

/** Versão web: não mostra o QR, direciona para o app/mobile. */
const QrBanner = () => (
    <div className="flex items-center gap-3 rounded-xl border border-warning bg-warning-primary p-4">
        <QrCode01 className="size-6 shrink-0 text-warning-primary" />
        <p className="text-sm font-semibold text-warning-primary">
            Consulte as versões Mobile ou App para visualizar o QR Code.
        </p>
    </div>
);

const ExpandButton = ({ aberto, onClick }: { aberto: boolean; onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        aria-label={aberto ? "Recolher" : "Expandir"}
        className="flex size-7 shrink-0 items-center justify-center text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary"
    >
        {aberto ? <MinusCircle className="size-6" /> : <PlusCircle className="size-6" />}
    </button>
);

const TransferenciaBox = ({ titulo, dados }: { titulo: string; dados: Transferencia }) => (
    <div className="flex flex-col gap-2">
        <h4 className="text-sm font-semibold text-primary">{titulo}</h4>
        <div className="flex flex-col gap-0.5 rounded-xl bg-primary p-3 ring-1 ring-border-secondary">
            <span className="text-sm font-semibold text-error-primary">Transferido para:</span>
            <span className="text-sm text-secondary">
                Titular: <span className="font-semibold text-primary">{dados.titular}</span>
            </span>
            <span className="text-sm text-secondary">
                CPF: <span className="font-semibold text-primary">{dados.cpf}</span>
            </span>
        </div>
    </div>
);

const EventoInclusoCard = ({ evento }: { evento: EventoIncluso }) => {
    const badge = STATUS_BADGE[evento.status];
    const isFinalizado = evento.status === "finalizado";
    return (
        <div
            className={cx(
                "flex flex-col gap-2 rounded-xl p-3 ring-1",
                evento.status === "em-andamento"
                    ? "ring-2 ring-success-solid"
                    : "ring-border-secondary",
                isFinalizado && "bg-secondary",
            )}
        >
            <Badge size="sm" type="pill-color" color={badge.color}>
                {badge.label}
            </Badge>
            <div className="flex items-start justify-between gap-3">
                <div className={cx("flex flex-col gap-0.5", isFinalizado && "opacity-60")}>
                    <p className="text-sm text-secondary">
                        {evento.grupo} | <span className="font-semibold text-primary">{evento.ingresso}</span>
                    </p>
                    <p className={cx("text-sm text-tertiary", isFinalizado && "line-through")}>
                        Data do evento: {evento.data}
                    </p>
                </div>
                <p className="shrink-0 text-right text-sm text-tertiary">
                    Acesso por
                    <br />
                    <span className="font-semibold text-primary">{evento.acesso}</span>
                </p>
            </div>
        </div>
    );
};

const GoogleWalletButton = () => (
    <button
        type="button"
        className="flex w-max items-center gap-3 rounded-xl bg-black px-4 py-2.5 text-left transition duration-100 ease-linear hover:opacity-90"
    >
        <span className="grid size-7 shrink-0 grid-cols-2 grid-rows-2 overflow-hidden rounded-md">
            <span className="bg-[#4285F4]" />
            <span className="bg-[#EA4335]" />
            <span className="bg-[#FBBC05]" />
            <span className="bg-[#34A853]" />
        </span>
        <span className="flex flex-col leading-tight text-white">
            <span className="text-[11px]">Adicionar a</span>
            <span className="text-sm font-semibold">Carteira do Google</span>
        </span>
    </button>
);

const AcoesRapidas = () => (
    <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
            <h4 className="text-sm font-semibold text-primary">Ações rápidas</h4>
            <p className="text-sm text-tertiary">Baixe o app e vem viver o melhor do ao vivo com a gente:</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
            <GoogleWalletButton />
            <Button size="sm" color="secondary">Transferir Ingresso</Button>
            <Button size="sm" color="secondary">Associar Face</Button>
            <Button size="sm" color="secondary">Revender Ingresso</Button>
        </div>
    </div>
);

const ImportanteNote = () => (
    <div className="flex flex-col gap-1.5 border-t border-secondary pt-4">
        <h4 className="text-sm font-semibold text-primary">Importante</h4>
        <p className="text-sm text-tertiary">
            Ao chegar no local do evento, para sua maior comodidade, procure sempre as entradas dos ingressos
            indicadas pela Ingresse. Esse ingresso é nominal. Para mais informações ou esclarecimentos sobre este
            evento, entre em contato através do nosso link:
        </p>
        <button type="button" className="w-max text-sm font-semibold text-error-primary underline">
            Fale com a Ingresse
        </button>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Card de combo                                                     */
/* ------------------------------------------------------------------ */

export const ComboCard = ({ combo, web = false }: { combo: Combo; web?: boolean }) => {
    const [aberto, setAberto] = useState(Boolean(combo.defaultAberto));
    const [meuIngresso, setMeuIngresso] = useState(combo.meuIngresso);

    return (
        <div className="flex flex-col rounded-2xl bg-secondary ring-1 ring-border-secondary">
            {web ? (
                <div className="flex items-start justify-between gap-3 p-4">
                    <div className="flex flex-col gap-0.5">
                        <h3 className="text-md font-bold text-primary">{combo.nome}</h3>
                        <p className="text-sm text-tertiary">Data do evento: {combo.dataEvento}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2.5">
                            <Toggle isSelected={meuIngresso} onChange={setMeuIngresso} aria-label="Meu ingresso" />
                            <span className="text-sm text-secondary">Meu ingresso</span>
                        </div>
                        <ExpandButton aberto={aberto} onClick={() => setAberto((v) => !v)} />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-0.5">
                            <h3 className="text-md font-bold text-primary">{combo.nome}</h3>
                            <p className="text-sm text-tertiary">Data do evento: {combo.dataEvento}</p>
                        </div>
                        <ExpandButton aberto={aberto} onClick={() => setAberto((v) => !v)} />
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Toggle isSelected={meuIngresso} onChange={setMeuIngresso} aria-label="Meu ingresso" />
                        <span className="text-sm text-secondary">Meu ingresso</span>
                    </div>
                </div>
            )}

            {aberto && (
                <div className="flex flex-col gap-5 px-4 pb-4">
                    {web ? (
                        <QrBanner />
                    ) : (
                        <QrBlock
                            valor={combo.qrCode}
                            legenda="Todos os ingressos inclusos neste combo utilizam o mesmo QR Code abaixo:"
                        />
                    )}
                    {combo.transferidoPara && <TransferenciaBox titulo="Informações" dados={combo.transferidoPara} />}
                    {combo.historicoTransferencia && (
                        <TransferenciaBox titulo="Histórico de transferência" dados={combo.historicoTransferencia} />
                    )}

                    {combo.eventosInclusos.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <h4 className="text-sm font-semibold text-primary">Eventos inclusos</h4>
                            {combo.eventosInclusos.map((dia) => (
                                <div key={dia.data} className="flex flex-col gap-2">
                                    <p className="text-sm font-semibold text-primary">
                                        {dia.data.split(" - ")[0]}{" "}
                                        <span className="font-normal text-tertiary">
                                            - {dia.data.split(" - ")[1]}
                                        </span>
                                    </p>
                                    {dia.eventos.map((evento, i) => (
                                        <EventoInclusoCard key={i} evento={evento} />
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}

                    <AcoesRapidas />
                    <ImportanteNote />
                </div>
            )}
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Card de ingresso avulso                                           */
/* ------------------------------------------------------------------ */

export const IngressoCard = ({ ingresso, web = false }: { ingresso: IngressoAvulso; web?: boolean }) => {
    const [aberto, setAberto] = useState(Boolean(ingresso.defaultAberto));

    return (
        <div className="flex flex-col rounded-2xl bg-secondary ring-1 ring-border-secondary">
            <div className="flex items-start justify-between gap-3 p-4">
                <div className="flex flex-col gap-0.5">
                    <p className="text-sm text-secondary">
                        {ingresso.grupo} | <span className="font-semibold text-primary">{ingresso.ingresso}</span>
                    </p>
                    <p className="text-sm text-tertiary">
                        Acesso por: <span className="font-semibold text-primary">{ingresso.acesso}</span>
                    </p>
                </div>
                <ExpandButton aberto={aberto} onClick={() => setAberto((v) => !v)} />
            </div>

            {aberto && (
                <div className="flex flex-col gap-5 px-4 pb-4">
                    {web ? <QrBanner /> : <QrBlock valor={ingresso.qrCode} />}
                    {ingresso.transferidoPara && (
                        <TransferenciaBox titulo="Informações" dados={ingresso.transferidoPara} />
                    )}
                    <AcoesRapidas />
                    <ImportanteNote />
                </div>
            )}
        </div>
    );
};
