import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ChevronRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { MarcaParceiro } from "../components/marca-parceiro";
import { SeloServico } from "../components/selo-servico";
import { CHECKLIST, EVENTO, INDIVIDUAIS, SERVICOS } from "../data/servicos";

/**
 * Entrada do protótipo de Serviços adicionais (nome interno).
 * Cada card abre a oferta como ela abriria a partir de um push, WhatsApp ou e-mail.
 */
export function ServicosAdicionais() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-primary px-4 py-12 md:px-6">
            <div className="mx-auto w-full max-w-3xl">
                <Button size="sm" color="link-gray" iconLeading={ArrowLeft} onClick={() => navigate("/novos-negocios")}>
                    Novos negócios
                </Button>

                <h1 className="mt-5 text-3xl font-bold text-primary">Serviços adicionais</h1>

                <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {INDIVIDUAIS.map((id) => {
                        const s = SERVICOS[id];
                        return (
                            <CartaoEntrada
                                key={id}
                                onPress={() => navigate(`/novos-negocios/servicos-adicionais/${id}`)}
                                selos={<MarcaParceiro id={s.id} nome={s.parceiro} />}
                                titulo={`${s.parceiro} · ${s.categoria}`}
                                descricao={s.descricao}
                            />
                        );
                    })}
                    {/* Página com vários serviços */}
                    <CartaoEntrada
                        onPress={() => navigate("/novos-negocios/servicos-adicionais/checklist")}
                        selos={
                            <span className="flex items-center">
                                {CHECKLIST.map((id, n) => (
                                    <SeloServico key={id} servico={SERVICOS[id]} tamanho="md" className={n > 0 ? "-ml-3 ring-2 ring-white" : undefined} />
                                ))}
                            </span>
                        }
                        titulo="Checklist do rolê · Vários serviços"
                        descricao="Uber, Meep, fotos e seguro de celular numa página só."
                    />
                </div>
            </div>
        </div>
    );
}

function CartaoEntrada({ onPress, selos, titulo, descricao }: { onPress: () => void; selos: ReactNode; titulo: string; descricao: string }) {
    return (
        <button
            type="button"
            onClick={onPress}
            className="group flex flex-col overflow-hidden rounded-2xl text-left ring-1 ring-border-secondary outline-focus-ring transition duration-150 ease-linear hover:-translate-y-1 hover:ring-brand focus-visible:outline-2 focus-visible:outline-offset-2"
        >
            <div className="relative flex h-36 items-end overflow-hidden p-4">
                <img src={EVENTO.cover} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover" />
                <span className="relative">{selos}</span>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-secondary bg-secondary/60 px-4 py-4">
                <div className="min-w-0">
                    <p className="text-md font-semibold text-primary">{titulo}</p>
                    <p className="truncate text-sm text-tertiary">{descricao}</p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-fg-quaternary transition group-hover:text-fg-secondary" aria-hidden="true" />
            </div>
        </button>
    );
}
