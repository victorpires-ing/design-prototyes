import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { MetodosPagamento } from "../components/metodos-pagamento";
import { ModalTaxas } from "../components/modal-taxas";
import { ProtecaoCard } from "../components/protecao-card";
import { ResumoDesktop, ResumoMobile } from "../components/resumo";
import { Cabecalho, TituloFinalizar } from "../components/topo";
import type { Protecao } from "../data/pedido";
import "../styles/tokens.css";
import { useIsMobile, useTemaClaro } from "../utils/hooks";
import { SMART_ANIMATE } from "../utils/transicao";

/** Tempo do skeleton "Carregando proteção" antes de a oferta aparecer. */
const CARREGAMENTO_MS = 1200;

/**
 * /checkout/novo-decreto — "v.1 - Oferta no checkout".
 * A tela abre carregando a proteção e cai na decisão. `?cenario=sem-oferta` simula o
 * comprador inelegível (ou a seguradora fora do ar): o card some e o pagamento fica livre.
 */
export function Pagamento() {
    useTemaClaro();
    const isMobile = useIsMobile();
    const [params] = useSearchParams();
    const semOferta = params.get("cenario") === "sem-oferta";

    const [protecao, setProtecao] = useState<Protecao>("carregando");
    const [modalTaxas, setModalTaxas] = useState(false);

    useEffect(() => {
        setProtecao("carregando");
        const id = window.setTimeout(() => setProtecao(semOferta ? "sem-oferta" : "pendente"), CARREGAMENTO_MS);
        return () => window.clearTimeout(id);
    }, [semOferta]);

    const card = (
        <AnimatePresence initial={false}>
            {protecao !== "sem-oferta" && (
                <motion.div
                    key="protecao"
                    initial={false}
                    exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                    transition={SMART_ANIMATE}
                    className={isMobile ? "mb-6 px-4" : "mb-6"}
                >
                    <ProtecaoCard isMobile={isMobile} protecao={protecao} onChange={setProtecao} />
                </motion.div>
            )}
        </AnimatePresence>
    );

    if (isMobile) {
        return (
            <div className="ck-decreto min-h-screen bg-(--ck-bg-tertiary) pb-16 [overflow-anchor:none]">
                <Cabecalho isMobile />
                <div className="px-4 pt-4">
                    <TituloFinalizar isMobile />
                </div>
                <div className="px-4 pt-[34px] pb-8">
                    <ResumoMobile protecao={protecao} onInfoTaxas={() => setModalTaxas(true)} />
                </div>
                {card}
                <MetodosPagamento isMobile protecao={protecao} />
                <ModalTaxas isOpen={modalTaxas} onClose={() => setModalTaxas(false)} />
            </div>
        );
    }

    return (
        <div className="ck-decreto min-h-screen bg-(--ck-surface-low) pb-20 [overflow-anchor:none]">
            <Cabecalho isMobile={false} />
            <div className="mx-auto w-full max-w-[1188px] px-4 pt-4">
                <TituloFinalizar isMobile={false} />
                <div className="mt-6 grid grid-cols-[minmax(0,684px)_448px] items-start justify-between gap-6">
                    <main className="min-w-0">
                        {card}
                        <MetodosPagamento isMobile={false} protecao={protecao} />
                    </main>
                    <ResumoDesktop protecao={protecao} onInfoTaxas={() => setModalTaxas(true)} />
                </div>
            </div>
            <ModalTaxas isOpen={modalTaxas} onClose={() => setModalTaxas(false)} />
        </div>
    );
}
