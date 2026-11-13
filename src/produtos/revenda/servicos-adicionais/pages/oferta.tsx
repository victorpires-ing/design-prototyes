import { useEffect } from "react";
import { Navigate, useParams } from "react-router";
import { useForceLightTheme } from "../../utils/use-force-light-theme";
import { MosaicoOferta } from "../components/mosaico-oferta";
import { OfertaServico } from "../components/oferta-servico";
import { FundoPagina } from "../components/fundo-pagina";
import { Topo, TopoComImagem } from "../components/topo";
import { SERVICOS, type ServicoId } from "../data/servicos";

/**
 * Página de oferta individual — destino do link enviado por push, WhatsApp ou e-mail.
 * /revenda/servicos-adicionais/uber · /revenda/servicos-adicionais/meep
 */
export function Oferta() {
    useForceLightTheme();
    const { servico: id } = useParams();
    const servico = SERVICOS[id as ServicoId];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    if (!servico) return <Navigate to="/revenda/servicos-adicionais" replace />;

    return (
        <FundoPagina className="lg:bg-primary lg:pb-16">
            {/* Mobile: header vazado sobre a foto; o card da oferta desliza por cima dela */}
            <TopoComImagem />
            <div className="hidden lg:block">
                <Topo comEvento={false} />
            </div>
            {/* Desktop: mosaico de fotos à esquerda e conteúdo da oferta (sem moldura de card) à direita, centralizados na vertical */}
            <main className="relative z-10 mx-auto -mt-6 grid w-full max-w-[1264px] grid-cols-1 items-start px-0 lg:mt-0 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-6 lg:pt-16">
                {/* key: trocar de serviço reinicia a seleção */}
                <OfertaServico key={servico.id} servico={servico} />
                <div className="hidden lg:order-first lg:block">
                    <MosaicoOferta />
                </div>
            </main>
        </FundoPagina>
    );
}
