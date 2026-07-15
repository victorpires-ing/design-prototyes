import type { ReactNode } from "react";
import { toast } from "sonner";
import { CheckCircle, InfoCircle, XClose } from "@untitledui/icons";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";

interface ToastCardProps {
    variant: "success" | "error";
    title: ReactNode;
    description?: ReactNode;
    onClose: () => void;
}

const ToastCard = ({ variant, title, description, onClose }: ToastCardProps) => (
    <div className="relative flex w-[400px] max-w-[calc(100vw-2rem)] items-start gap-4 rounded-xl bg-primary_alt p-4 pr-11 shadow-lg ring-1 ring-border-secondary_alt">
        <FeaturedIcon
            icon={variant === "success" ? CheckCircle : InfoCircle}
            color={variant === "success" ? "success" : "brand"}
            theme="outline"
            size="md"
            className="mt-0.5 ml-1"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
            <p className="text-sm font-semibold text-primary">{title}</p>
            {description && <p className="text-sm text-secondary">{description}</p>}
        </div>
        <ButtonUtility
            size="sm"
            color="tertiary"
            icon={XClose}
            tooltip="Fechar"
            onClick={onClose}
            className="absolute top-2 right-2"
        />
    </div>
);

export function showSuccessToast(title: ReactNode, description?: ReactNode) {
    toast.custom(
        (id) => (
            <ToastCard
                variant="success"
                title={title}
                description={description}
                onClose={() => toast.dismiss(id)}
            />
        ),
        { duration: 5000, position: "top-right" },
    );
}

export function showErrorToast(title: ReactNode, description?: ReactNode) {
    toast.custom(
        (id) => (
            <ToastCard
                variant="error"
                title={title}
                description={description}
                onClose={() => toast.dismiss(id)}
            />
        ),
        { duration: 6500, position: "top-right" },
    );
}
