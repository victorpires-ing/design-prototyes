import { useEffect, useState } from "react";
import { ChevronRight, CreditCard01, LogOut01, Moon01, Settings01, User01 } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Toggle } from "@/components/base/toggle/toggle";
import { useTheme } from "@/providers/theme-provider";
import { AppShell } from "../../components/AppShell";
import { StatusBar } from "../../components/StatusBar";

export function Perfil() {
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

                <h1 className="px-5 pt-4 pb-2 text-xl font-bold text-primary">Perfil</h1>

                {/* Card do usuário */}
                <div className="px-5 pt-3">
                    <div className="flex items-center gap-3 rounded-2xl bg-primary p-4 ring-1 ring-border-secondary">
                        <Avatar size="lg" initials="JS" alt="Janaina Nascimento de Souza" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-primary">Janaina Nascimento de Souza</p>
                            <p className="truncate text-sm text-tertiary">janaina.souza@ingresse.com</p>
                        </div>
                        <ChevronRight className="size-5 shrink-0 text-fg-quaternary" />
                    </div>
                </div>

                {/* Aparência */}
                <p className="px-5 pt-6 pb-2 text-xs font-semibold tracking-wide text-tertiary uppercase">Aparência</p>
                <div className="px-5">
                    <div className="flex items-center gap-3 rounded-2xl bg-primary p-4 ring-1 ring-border-secondary">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-fg-secondary">
                            <Moon01 className="size-5" />
                        </span>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-primary">Modo escuro</p>
                            <p className="text-xs text-tertiary">{isDark ? "Ativado" : "Desativado"}</p>
                        </div>
                        <Toggle size="md" isSelected={isDark} onChange={(checked) => setTheme(checked ? "dark" : "light")} />
                    </div>
                </div>

                {/* Conta */}
                <p className="px-5 pt-6 pb-2 text-xs font-semibold tracking-wide text-tertiary uppercase">Conta</p>
                <div className="px-5 pb-6">
                    <div className="overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
                        <SettingRow icon={User01} label="Meus dados" />
                        <SettingRow icon={CreditCard01} label="Pagamentos" />
                        <SettingRow icon={Settings01} label="Configurações" />
                        <SettingRow icon={LogOut01} label="Sair" destructive />
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

const SettingRow = ({ icon: Icon, label, destructive }: { icon: typeof User01; label: string; destructive?: boolean }) => (
    <button
        type="button"
        className="flex w-full items-center gap-3 border-b border-secondary p-4 text-left transition duration-100 ease-linear last:border-0 active:bg-secondary"
    >
        <Icon className={`size-5 shrink-0 ${destructive ? "text-fg-error-primary" : "text-fg-quaternary"}`} />
        <span className={`flex-1 text-sm font-medium ${destructive ? "text-error-primary" : "text-primary"}`}>{label}</span>
        {!destructive && <ChevronRight className="size-5 shrink-0 text-fg-quaternary" />}
    </button>
);
