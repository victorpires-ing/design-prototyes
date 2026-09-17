import type { ModalOverlayProps as AriaModalOverlayProps } from "react-aria-components";
import { Dialog, Modal, ModalOverlay as ModalOverlayBase } from "@/components/application/modals/modal";
import { cx } from "@/utils/cx";
import { useTotemPortal } from "./TotemLayout";

export { Dialog, Modal };

/**
 * Overlay preso à tela do totem.
 *
 * O overlay do DS é portado para o `body` e dimensionado em `dvh`: dentro da
 * moldura isso o jogaria para fora do painel, na escala da janela. Aqui ele é
 * portado para dentro da caixa transformada do totem, onde `fixed` passa a ser
 * relativo ao painel, e a altura volta a ser a da tela e não a da janela.
 */
export const ModalOverlay = (props: AriaModalOverlayProps) => {
    const container = useTotemPortal();

    return (
        <ModalOverlayBase
            {...props}
            UNSTABLE_portalContainer={container ?? undefined}
            className={(state) =>
                cx(
                    container && "absolute min-h-0 py-8",
                    typeof props.className === "function" ? props.className(state) : props.className,
                )
            }
        />
    );
};
