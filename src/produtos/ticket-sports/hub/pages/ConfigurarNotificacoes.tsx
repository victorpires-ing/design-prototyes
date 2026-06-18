import { useState } from "react";
import { ArrowLeft, Activity, Trophy01, Users03 } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { cx } from "@/utils/cx";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { Bloco } from "../components/Bloco";
import { CONFIG_NOTIFICACOES } from "../data/notificacoes";

const CATEGORIAS = [
    { titulo: "Atividade e treinos", icon: Activity, ids: ["treinos"] },
    { titulo: "Comunidade e interações", icon: Users03, ids: ["interacoes", "seguidores", "grupos", "comunidades"] },
    { titulo: "Conquistas e novidades", icon: Trophy01, ids: ["conquistas", "novidades"] },
];

const Switch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
        type="button"
        onClick={onChange}
        role="switch"
        aria-checked={checked}
        className={cx("relative h-6 w-11 shrink-0 rounded-full transition duration-150", checked ? "bg-[#7C3AED]" : "bg-tertiary")}
    >
        <span className={cx("absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition duration-150", checked && "translate-x-5")} />
    </button>
);

export function ConfigurarNotificacoes() {
    const navigate = useNavigate();
    const [config, setConfig] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(CONFIG_NOTIFICACOES.map((c) => [c.id, true])),
    );

    const toggle = (id: string) => setConfig((prev) => ({ ...prev, [id]: !prev[id] }));

    return (
        <TicketSportsLayout>
            <header className="flex items-center gap-2 border-b border-secondary bg-primary px-5 py-3.5 md:rounded-t-3xl">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    aria-label="Voltar"
                    className="flex size-9 items-center justify-center rounded-full text-fg-secondary hover:bg-secondary"
                >
                    <ArrowLeft className="size-5" />
                </button>
                <h1 className="text-xl font-bold text-primary">Configurar notificações</h1>
            </header>

            <div className="flex flex-1 flex-col gap-5 px-5 py-4 pb-10">
                <p className="text-md text-tertiary">Escolha o que você quer receber.</p>
                {CATEGORIAS.map((cat) => {
                    const itens = CONFIG_NOTIFICACOES.filter((c) => cat.ids.includes(c.id));
                    if (itens.length === 0) return null;
                    return (
                        <Bloco key={cat.titulo} icon={cat.icon} titulo={cat.titulo}>
                            <div className="flex flex-col rounded-2xl border border-secondary bg-primary">
                                {itens.map((c, i) => (
                                    <div
                                        key={c.id}
                                        className={cx("flex items-center justify-between gap-4 p-4", i > 0 && "border-t border-secondary")}
                                    >
                                        <div className="flex min-w-0 flex-col">
                                            <span className="text-sm font-semibold text-primary">{c.label}</span>
                                            <span className="text-sm text-tertiary">{c.descricao}</span>
                                        </div>
                                        <Switch checked={config[c.id]} onChange={() => toggle(c.id)} />
                                    </div>
                                ))}
                            </div>
                        </Bloco>
                    );
                })}
            </div>
        </TicketSportsLayout>
    );
}
