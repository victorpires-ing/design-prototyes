import { useEffect } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { useForceLightTheme } from "../../utils/use-force-light-theme";
import { MosaicoOferta } from "../components/mosaico-oferta";
import { OfertaServico } from "../components/oferta-servico";
import { FundoPagina } from "../components/fundo-pagina";
import { Topo, TopoComImagem } from "../components/topo";
import { SERVICOS, type ServicoId } from "../data/servicos";

/**
 * Página de oferta individual — destino do link enviado por push, WhatsApp ou e-mail.
 * /novos-negocios/servicos-adicionais/uber · /novos-negocios/servicos-adicionais/meep
 */
export function Oferta() {
    useForceLightTheme();
    const { servico: id } = useParams();
    const servico = SERVICOS[id as ServicoId];
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const doChecklist = params.get("de") === "checklist";

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    if (!servico) return <Navigate to="/novos-negocios/servicos-adicionais" replace />;

    return (
        <FundoPagina className="lg:bg-primary lg:pb-16">
            {/* Mobile: header vazado sobre a foto; o card da oferta desliza por cima dela */}
            <TopoComImagem />
            <div className="hidden lg:block">
                <Topo comEvento={false} />
            </div>
            {/* Desktop: mosaico de fotos à esquerda e conteúdo da oferta (sem moldura de card) à direita, centralizados na vertical */}
            {/* Mobile: -208px = RECUO_CARD_MOBILE do topo (o card começa 24px sobre a foto) */}
            <main className="relative z-10 mx-auto -mt-[208px] grid w-full max-w-[1264px] grid-cols-1 items-start px-0 lg:mt-0 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-6 lg:pt-16">
                {/* key: trocar de serviço reinicia a seleção */}
                <OfertaServico key={servico.id} servico={servico} />
                <div className="relative hidden lg:order-first lg:block">
                    {/* Desktop: voltar no canto superior esquerdo, acima do mosaico. Fica fora do fluxo
                        (no respiro do topo da página) para não mudar a altura nem criar rolagem */}
                    {doChecklist && (
                        <Button
                            size="sm"
                            color="link-gray"
                            iconLeading={ArrowLeft}
                            className="absolute bottom-full left-0 mb-4"
                            onClick={() => navigate("/novos-negocios/servicos-adicionais/checklist")}
                        >
                            Voltar
                        </Button>
                    )}
                    <MosaicoOferta />
                </div>
            </main>
        </FundoPagina>
    );
}
