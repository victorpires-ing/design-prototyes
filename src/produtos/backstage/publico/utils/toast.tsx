import type { ReactNode } from "react";
import { toast } from "sonner";
import { CheckCircle, InfoCircle, SlashCircle01, XClose } from "@untitledui/icons";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";

interface ToastCardProps {
    variant: "success" | "error" | "neutral";
    title: ReactNode;
    description?: ReactNode;
    onClose: () => void;
}

const ICON_POR_VARIANTE = { success: CheckCircle, error: SlashCircle01, neutral: InfoCircle } as const;
const COR_POR_VARIANTE = { success: "success", error: "error", neutral: "gray" } as const;

const ToastCard = ({ variant, title, description, onClose }: ToastCardProps) => (
    <div className="flex w-[400px] max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl bg-primary p-4 shadow-xl ring-1 ring-border-secondary">
        <FeaturedIcon icon={ICON_POR_VARIANTE[variant]} color={COR_POR_VARIANTE[variant]} theme="gradient" size="md" />
        <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-primary">{title}</p>
            {description && <p className="mt-1 text-sm text-tertiary">{description}</p>}
        </div>
        <ButtonUtility size="xs" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
    </div>
);

export function showSuccessToast(title: ReactNode, description?: ReactNode) {
    toast.custom(
        (id) => <ToastCard variant="success" title={title} description={description} onClose={() => toast.dismiss(id)} />,
        { duration: 2000, position: "top-right" },
    );
}

export function showErrorToast(title: ReactNode, description?: ReactNode) {
    toast.custom(
        (id) => <ToastCard variant="error" title={title} description={description} onClose={() => toast.dismiss(id)} />,
        { duration: 2000, position: "top-right" },
    );
}

export function showNeutralToast(title: ReactNode, description?: ReactNode) {
    toast.custom(
        (id) => <ToastCard variant="neutral" title={title} description={description} onClose={() => toast.dismiss(id)} />,
        { duration: 2000, position: "top-right" },
    );
}
