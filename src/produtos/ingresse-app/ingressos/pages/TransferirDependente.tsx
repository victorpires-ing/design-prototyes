import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowDown, ArrowLeft, ChevronRight, InfoCircle, UserPlus01, XClose } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { AppShell } from "../../components/AppShell";
import { BottomSheet } from "../../components/BottomSheet";
import { StatusBar } from "../../components/StatusBar";
import { getEvento, getItem } from "../data/eventos";
import { atribuirDependente } from "../data/transfer-store";
import { getDependentes, type Dependente } from "../data/dependentes-store";

const maskEmail = (e: string) => {
    const [local, domain] = e.split("@");
    if (!domain || local.length < 4) return e;
    return `${local.slice(0, 1)}*****${local.slice(-3)}@${domain}`;
};

/** Contato exibido do dependente: e-mail mascarado ou CPF. */
const contatoDep = (d: Dependente) => (d.email ? maskEmail(d.email) : `CPF: ${d.cpf}`);

export function TransferirDependente() {
    const navigate = useNavigate();
    const { eventId, id } = useParams();
    const evento = getEvento(eventId);
    const item = getItem(eventId, id);

    const evNome = evento.title;
    const title = item?.title ?? "Ingresso";
    const dataEvento = item?.data ?? evento.sessao;

    const [selecionado, setSelecionado] = useState<Dependente | null>(null);
    const [confirming, setConfirming] = useState(false);
    const [done, setDone] = useState(false);

    const destino = `/ingresse-app/ingressos/detalhe/${evento.id}/${id}`;
    const voltar = () => navigate(destino);

    const escolher = (dep: Dependente) => {
        setSelecionado(dep);
        setConfirming(true);
    };
    const confirmarTransferencia = () => {
        if (selecionado) atribuirDependente(id, selecionado);
        setConfirming(false);
        setDone(true);
    };
    const concluir = () => {
        setDone(false);
        navigate(destino);
    };

    // A tela "Ingresso atribuído" fica visível por 3s e então vai para o detalhe do ingresso.
    useEffect(() => {
        if (!done) return;
        const t = setTimeout(() => navigate(destino), 3000);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [done]);

    return (
        <AppShell showTabBar={false}>
            <div className="flex min-h-full flex-col bg-secondary">
                <StatusBar tone="dark" />

                {/* Top bar (voltar + info) */}
                <div className="flex items-center justify-between px-5 pt-2">
                    <button
                        type="button"
                        aria-label="Voltar"
                        onClick={voltar}
                        className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <button
                        type="button"
                        aria-label="Informações"
                        className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                    >
                        <InfoCircle className="size-5" />
                    </button>
                </div>

                <div className="px-5 pt-4 pb-8">
                    {/* Card do ingresso */}
                    <div className="rounded-3xl bg-primary p-5 shadow-sm ring-1 ring-border-secondary">
                        <p className="text-sm text-tertiary">{evNome}</p>
                        <div className="my-3 border-t border-tertiary" />
                        <p className="text-2xl leading-tight font-bold text-primary">{title}</p>
                        <p className="mt-1.5 text-sm text-tertiary">Data do evento: {dataEvento}</p>
                    </div>

                    {/* Conector */}
                    <div className="flex justify-center py-3">
                        <span className="flex size-12 items-center justify-center rounded-full bg-primary text-fg-secondary ring-1 ring-border-secondary">
                            <ArrowDown className="size-5" />
                        </span>
                    </div>

                    {/* Lista de dependentes */}
                    <div className="rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                        <p className="text-md font-bold text-primary">Escolha um dependente</p>
                        <p className="mt-1 text-sm text-tertiary">Selecione uma pessoa vinculada à sua conta para receber o ingresso.</p>

                        <div className="mt-4 flex flex-col gap-1 border-t border-tertiary pt-2">
                            {getDependentes().map((dep) => (
                                <button
                                    key={dep.id}
                                    type="button"
                                    onClick={() => escolher(dep)}
                                    className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 text-left transition duration-100 ease-linear active:bg-secondary"
                                >
                                    <Avatar size="md" initials={dep.iniciais} alt={dep.nome} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-primary">{dep.nome}</p>
                                        <p className="truncate text-sm text-tertiary">CPF: {dep.cpf}</p>
                                    </div>
                                    <ChevronRight className="size-5 shrink-0 text-fg-quaternary" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* CTA: cadastrar dependente (fora do card, terciário) */}
                    <div className="mt-5 flex justify-center">
                        <Button
                            size="lg"
                            color="tertiary"
                            iconLeading={UserPlus01}
                            onClick={() => navigate(`/ingresse-app/ingressos/cadastrar-dependente/${evento.id}/${id}`)}
                        >
                            Cadastrar dependente
                        </Button>
                    </div>
                </div>
            </div>

            {/* Bottom sheet: confirmar atribuição */}
            <BottomSheet isOpen={confirming} onClose={() => setConfirming(false)}>
                <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-bold text-primary">Tudo certo para atribuir este ingresso?</h2>
                    <button
                        type="button"
                        aria-label="Fechar"
                        onClick={() => setConfirming(false)}
                        className="shrink-0 text-fg-quaternary transition duration-100 ease-linear active:text-fg-secondary"
                    >
                        <XClose className="size-6" />
                    </button>
                </div>
                <p className="mt-1 text-sm text-tertiary">
                    Você está atribuindo este ingresso para <span className="font-semibold text-secondary">{selecionado?.nome}</span>, dependente cadastrado na
                    sua conta.
                </p>

                {selecionado && (
                    <div className="mt-4 flex items-center gap-3 rounded-2xl bg-primary p-4 ring-1 ring-border-secondary">
                        <Avatar size="md" initials={selecionado.iniciais} alt={selecionado.nome} />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-primary">{selecionado.nome}</p>
                            <p className="truncate text-sm text-tertiary">{contatoDep(selecionado)}</p>
                        </div>
                    </div>
                )}

                <Button size="lg" color="primary" className="mt-5 w-full rounded-full" onClick={confirmarTransferencia}>
                    Atribuir a este dependente
                </Button>
                <Button size="lg" color="secondary" className="mt-3 w-full rounded-full" onClick={() => setConfirming(false)}>
                    Cancelar
                </Button>
            </BottomSheet>

            {/* Bottom sheet: atribuição concluída */}
            <BottomSheet isOpen={done} onClose={concluir}>
                <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-bold text-primary">Ingresso atribuído</h2>
                    <button
                        type="button"
                        aria-label="Fechar"
                        onClick={concluir}
                        className="shrink-0 text-fg-quaternary transition duration-100 ease-linear active:text-fg-secondary"
                    >
                        <XClose className="size-6" />
                    </button>
                </div>
                <p className="mt-1 text-sm text-tertiary">
                    O ingresso foi vinculado a <span className="font-semibold text-secondary">{selecionado?.nome}</span> e já está disponível para esse
                    dependente.
                </p>

                {selecionado && (
                    <div className="mt-4 flex items-center gap-3 rounded-2xl bg-primary p-4 ring-1 ring-border-secondary">
                        <Avatar size="md" initials={selecionado.iniciais} alt={selecionado.nome} />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-primary">{selecionado.nome}</p>
                            <p className="truncate text-sm text-tertiary">{contatoDep(selecionado)}</p>
                        </div>
                    </div>
                )}
            </BottomSheet>
        </AppShell>
    );
}
