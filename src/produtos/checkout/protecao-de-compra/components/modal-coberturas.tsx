import { type CSSProperties, type FC, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Bus, HeartRounded, Home02, Scales02 } from "@untitledui/icons";
import { Heading as AriaHeading } from "react-aria-components";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Tag, TagGroup, TagList } from "@/components/base/tags/tags";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";

/**
 * "Ver coberturas": em produção é uma lista de checks dentro do card. Aqui vira um modal informativo com as
 * mesmas coberturas de produção (sem nada além delas), agrupadas em 4 caixas com ícone. A decisão fica no
 * resumo da compra; aqui o único CTA é "Entendi", para sair (como o "_Modal actions" do DS: botão md de ponta a ponta).
 *
 * Espelha o componente Modal (Type=Stacked left aligned) do AFTER DS (2.0) usado no Figma: 560px (largura travada no
 * componente), header 24/16 (desktop/celular) sem featured icon, conteúdo a 12px do header e "_Modal actions" a 32/24.
 * Desktop: 2 colunas, a da esquerda com 258px para a tag mais longa ("COVID-19 ou…") caber. Celular: card no rodapé, 1 coluna.
 * Etiquetas = Tag sm; ícones = Featured icon modern.
 * O divisor do "_Modal actions" fica sempre visível acima do "Entendi". Quando o conteúdo não cabe (celular), uma barra
 * de rolagem fina e clara (bg-tertiary) indica que há mais embaixo.
 */

interface Cobertura {
    icone: FC<{ className?: string }>;
    titulo: string;
    casos: string[];
}

// Os casos de produção agrupados por tipo de imprevisto, com a copy revisada (cada caso vira uma Tag).
const COBERTURAS: Cobertura[] = [
    { icone: HeartRounded, titulo: "Saúde", casos: ["Acidente, doença ou lesão", "Condição médica preexistente", "COVID-19 ou necessidade de isolamento"] },
    { icone: Bus, titulo: "Imprevistos no caminho", casos: ["Problemas no transporte público", "Problemas com veículo particular"] },
    { icone: Home02, titulo: "Emergências em casa", casos: ["Emergência doméstica", "Atendimento emergencial"] },
    { icone: Scales02, titulo: "Documentos e questões judiciais", casos: ["Roubo de documentos", "Intimação judicial"] },
];

/**
 * O tema global do protótipo pinta "brand" de preto/cinza (Backstage). No checkout o AFTER DS (2.0) usa o vermelho
 * Ingresse: bg-brand-solid #ff271a e bg-brand-solid_hover #c81f14. Os tokens são redeclarados só no rodapé do modal.
 */
const MARCA_CHECKOUT = {
    "--color-bg-brand-solid": "#ff271a",
    "--background-color-brand-solid": "#ff271a",
    "--color-bg-brand-solid_hover": "#c81f14",
    "--background-color-brand-solid_hover": "#c81f14",
    "--color-text-white": "#ffffff",
    "--text-color-white": "#ffffff",
} as CSSProperties;

export function ModalCoberturas({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
    // Celular: ancorado embaixo com 64px (padrão do componente) e 96px livres em cima, para não colar no topo
    return (
        <ModalOverlay isOpen={aberto} onOpenChange={(abrir) => !abrir && onFechar()} isDismissable className="max-sm:pt-24 max-sm:pb-16">
            <Modal className="max-w-[560px]">
                <Dialog>
                    {({ close }) => (
                        <div className="relative flex max-h-[calc(100dvh-160px)] sm:max-h-[calc(100dvh-96px)] w-full flex-col overflow-hidden rounded-2xl bg-primary font-['Elza'] shadow-xl">
                            {/* Header fixo (como o "_Modal header" do DS): só o conteúdo abaixo rola */}
                            <header className="relative flex shrink-0 flex-col gap-0.5 px-4 pt-4 sm:px-6 sm:pt-6">
                                <CloseButton size="sm" label="Fechar" onPress={close} className="absolute top-3 right-3 sm:top-4 sm:right-4" />
                                <AriaHeading slot="title" className="pr-10 text-md font-semibold text-balance text-primary">
                                    Proteção para quando você não puder ir
                                </AriaHeading>
                                <p className="text-sm text-tertiary">
                                    Se um destes imprevistos acontecer, você pode solicitar o reembolso conforme as condições da proteção.
                                </p>
                            </header>

                            <AreaRolavel onFechar={close}>
                                <section className="flex flex-col gap-3" aria-labelledby="titulo-coberturas">
                                    <h3 id="titulo-coberturas" className="text-sm text-tertiary">
                                        Situações cobertas
                                    </h3>
                                    <ul className="grid gap-3 sm:grid-cols-[258px_1fr]">
                                        {COBERTURAS.map((c) => (
                                            <CaixaCobertura key={c.titulo} {...c} />
                                        ))}
                                    </ul>
                                </section>
                            </AreaRolavel>
                        </div>
                    )}
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

/**
 * Conteúdo rolável do modal + barra fina na lateral (a nativa fica escondida — no celular ela só aparece enquanto o
 * dedo rola). O rodapé, com o divisor fixo, fica fora da rolagem.
 */
function AreaRolavel({ children, onFechar }: { children: ReactNode; onFechar: () => void }) {
    const ref = useRef<HTMLDivElement>(null);
    const [barra, setBarra] = useState({ rolavel: false, topo: 0, altura: 0 });

    const medir = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        const { scrollTop, scrollHeight, clientHeight } = el;
        const rolavel = scrollHeight > clientHeight + 1;
        const altura = rolavel ? Math.max(32, (clientHeight / scrollHeight) * clientHeight) : 0;
        const topo = rolavel ? (scrollTop / (scrollHeight - clientHeight)) * (clientHeight - altura) : 0;
        setBarra({ rolavel, topo, altura });
    }, []);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        medir();
        const obs = new ResizeObserver(medir);
        obs.observe(el);
        for (const filho of Array.from(el.children)) obs.observe(filho);
        return () => obs.disconnect();
    }, [medir]);

    return (
        <>
            <div className="relative flex min-h-0 flex-col">
                <div
                    ref={ref}
                    onScroll={medir}
                    className="flex min-h-0 flex-col overflow-y-auto px-4 pt-3 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden"
                >
                    {children}
                </div>
                {/* Barra de rolagem fina (só quando rola) */}
                {barra.rolavel && (
                    <span aria-hidden="true" className="pointer-events-none absolute top-2 right-1 bottom-2 w-1">
                        <span className="absolute inset-x-0 rounded-full bg-tertiary" style={{ top: barra.topo, height: barra.altura }} />
                    </span>
                )}
            </div>
            <RodapeModal onFechar={onFechar} />
        </>
    );
}

function RodapeModal({ onFechar }: { onFechar: () => void }) {
    return (
        <footer
            // Como o "_Modal actions" com Divider: 24/32px acima da linha (celular/desktop), linha de ponta a ponta, 24px abaixo
            className="px-4 pt-6 pb-4 sm:px-6 sm:pt-8 sm:pb-6"
            style={MARCA_CHECKOUT}
        >
            <div aria-hidden="true" className="-mx-4 mb-6 border-t border-secondary sm:-mx-6" />
            <Button size="md" color="primary" className="w-full" onClick={onFechar}>
                Entendi
            </Button>
        </footer>
    );
}

function CaixaCobertura({ icone, titulo, casos }: Cobertura) {
    return (
        <li className="flex flex-col gap-3 rounded-xl bg-secondary p-3">
            <span className="flex items-center gap-3">
                <FeaturedIcon icon={icone} color="gray" theme="modern" size="md" />
                <span className="text-sm font-semibold text-primary">{titulo}</span>
            </span>
            <TagGroup label={titulo} size="sm">
                <TagList className="flex flex-col items-start gap-1.5">
                    {casos.map((caso) => (
                        <Tag key={caso} id={caso}>
                            {caso}
                        </Tag>
                    ))}
                </TagList>
            </TagGroup>
        </li>
    );
}
