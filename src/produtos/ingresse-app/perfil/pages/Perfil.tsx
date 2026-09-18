import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { FC, ReactNode } from "react";
import {
    ChevronRight,
    CreditCard01,
    Globe01,
    HelpCircle,
    InfoCircle,
    LogOut01,
    MarkerPin01,
    Monitor04,
    Moon01,
    Shield01,
    ShoppingBag03,
    UserSquare,
    Users01,
} from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { Avatar } from "@/components/base/avatar/avatar";
import { Toggle } from "@/components/base/toggle/toggle";
import { useTheme } from "@/providers/theme-provider";
import { AppShell } from "../../components/AppShell";
import { StatusBar } from "../../components/StatusBar";

export function Perfil() {
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const [systemDark, setSystemDark] = useState(() => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false);

    useEffect(() => {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => setSystemDark(mq.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    const isDark = theme === "system" ? systemDark : theme === "dark";

    return (
        <AppShell activeTab="perfil">
            <div className="min-h-full bg-secondary">
                <StatusBar tone="dark" />

                <h1 className="px-5 pt-4 pb-2 text-2xl font-bold text-primary">Perfil</h1>

                {/* Card do usuário */}
                <div className="px-5 pt-3">
                    <div className="flex items-center gap-4 rounded-2xl bg-primary p-4 ring-1 ring-border-secondary">
                        <Avatar size="xl" initials="JS" alt="Janaina Nascimento de Souza" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-lg font-bold text-primary">Janaina Nascimento de So...</p>
                            <p className="truncate text-sm text-tertiary">janaina.souza@ingresse.com</p>
                            <p className="truncate text-sm text-tertiary">(21) 96693-7195</p>
                        </div>
                    </div>
                </div>

                {/* Minha conta */}
                <p className="px-5 pt-7 pb-2 text-md font-bold text-primary">Minha conta</p>
                <div className="px-5">
                    <div className="overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
                        <SettingRow
                            icon={UserSquare}
                            title="Minhas informações"
                            subtitle="Ajuste nome, e-mail, telefone e outros dados"
                        />
                        <SettingRow icon={ShoppingBag03} title="Minhas compras" subtitle="Confira seus itens" />
                        <SettingRow
                            icon={Users01}
                            title="Dependentes"
                            subtitle="Inclua e exclua quem pode ser associado a ingressos"
                            onClick={() => navigate("/ingresse-app/perfil/dependentes")}
                        />
                        <SettingRow icon={CreditCard01} title="Cartões" subtitle="Adicione até 3 cartões para comprar com 1 clique" />
                        <SettingRow icon={MarkerPin01} title="Meus endereços" subtitle="Adicione um endereço à sua conta" />
                        <SettingRow icon={Shield01} title="Login e segurança" subtitle="Biometria e proteção da conta" />
                        <SettingRow
                            icon={Monitor04}
                            title="Dispositivos cadastrados"
                            subtitle="Controle os aparelhos onde sua conta está conectada"
                        />
                    </div>
                </div>

                {/* Ajustes e suporte */}
                <p className="px-5 pt-7 pb-2 text-md font-bold text-primary">Ajustes e suporte</p>
                <div className="px-5 pb-6">
                    <div className="overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
                        <SettingRow icon={Globe01} title="Idioma" subtitle="Ajuste o idioma do app" />
                        <SettingRow icon={HelpCircle} title="Fale com a gente" subtitle="Encontre respostas e fale com a Ingresse" />
                        <SettingRow icon={InfoCircle} title="Sobre o app" subtitle="Versão, build e informações do sistema" />
                        {/* Aparência — configuração de tema preservada */}
                        <SettingRow
                            icon={Moon01}
                            title="Aparência"
                            subtitle={isDark ? "Modo escuro ativado" : "Modo escuro desativado"}
                            trailing={<Toggle size="md" isSelected={isDark} onChange={(checked) => setTheme(checked ? "dark" : "light")} />}
                        />
                        <SettingRow icon={LogOut01} title="Sair" subtitle="Sair deste dispositivo" destructive />
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

const SettingRow = ({
    icon: Icon,
    title,
    subtitle,
    destructive,
    onClick,
    trailing,
}: {
    icon: FC<{ className?: string }>;
    title: string;
    subtitle: string;
    destructive?: boolean;
    onClick?: () => void;
    trailing?: ReactNode;
}) => {
    const interactive = !trailing;
    const Wrapper = interactive ? "button" : "div";
    return (
        <Wrapper
            {...(interactive ? { type: "button" as const, onClick } : {})}
            className={cx(
                "flex w-full items-center gap-3.5 border-b border-secondary p-4 text-left last:border-0",
                interactive && "transition duration-100 ease-linear active:bg-secondary",
            )}
        >
            <span
                className={cx(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl",
                    destructive ? "bg-error-secondary" : "bg-secondary",
                )}
            >
                <Icon className={cx("size-5", destructive ? "text-fg-error-primary" : "text-fg-brand-primary")} />
            </span>
            <div className="min-w-0 flex-1">
                <p className={cx("text-md font-semibold", destructive ? "text-error-primary" : "text-primary")}>{title}</p>
                <p className="mt-0.5 text-sm text-tertiary">{subtitle}</p>
            </div>
            {trailing ?? <ChevronRight className="size-5 shrink-0 text-fg-quaternary" />}
        </Wrapper>
    );
};
