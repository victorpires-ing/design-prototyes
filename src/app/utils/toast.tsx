import type { ReactNode } from "react";
import { toast } from "sonner";
import { CheckCircle, SlashCircle01, XClose } from "@untitledui/icons";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";

interface ToastCardProps {
    variant: "success" | "error";
    title: ReactNode;
    description?: ReactNode;
    onClose: () => void;
}

const ToastCard = ({ variant, title, description, onClose }: ToastCardProps) => (
    <div className="flex w-[400px] max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl bg-primary p-4 shadow-xl ring-1 ring-border-secondary">
        <FeaturedIcon
            icon={variant === "success" ? CheckCircle : SlashCircle01}
            color={variant === "success" ? "success" : "error"}
            theme="dark"
            size="md"
        />
        <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-primary">{title}</p>
            {description && (
                <p className="mt-1 text-sm text-tertiary">{description}</p>
            )}
        </div>
        <ButtonUtility
            size="xs"
            color="tertiary"
            icon={XClose}
            tooltip="Fechar"
            onClick={onClose}
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
        { duration: 5000 },
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
        { duration: 6500 },
    );
}
