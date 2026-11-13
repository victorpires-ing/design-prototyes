import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Settings02 } from "@untitledui/icons";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Select } from "@/components/base/select/select";
import { Toggle } from "@/components/base/toggle/toggle";
import { PERFIS, type PerfilId, reiniciar, setPerfil, setSim, useTroca } from "../data/troca-store";

const PERFIL_ITENS = (Object.keys(PERFIS) as PerfilId[]).map((id) => ({ id, label: PERFIS[id].nome }));

/**
 * Controles do protótipo (perfil logado e simulações). Ficam fora da interface:
 * Shift+P mostra ou esconde, como o seletor de layout (Shift+L).
 */
export function ControlesPrototipo({ extras }: { extras?: React.ReactNode }) {
    const S = useTroca();
    const [aberto, setAberto] = useState(false);
    const [visivel, setVisivel] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!e.shiftKey || e.key.toLowerCase() !== "p" || e.metaKey || e.ctrlKey || e.altKey) return;
            const alvo = e.target as HTMLElement;
            if (alvo.closest("input, textarea, [contenteditable=true]")) return;
            setVisivel((v) => !v);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    if (!visivel) return null;

    return (
        <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2">
            {aberto && (
                <div className="flex w-72 motion-safe:animate-in flex-col gap-4 rounded-xl bg-primary p-4 shadow-lg ring-1 ring-border-secondary duration-150 motion-safe:fade-in motion-safe:slide-in-from-bottom-1">
                    <div>
                        <p className="text-sm font-semibold text-primary">Controles do protótipo</p>
                        <p className="text-xs text-tertiary">Shift+P esconde este botão.</p>
                    </div>
                    <Select
                        label="Perfil logado"
                        size="sm"
                        selectedKey={S.perfil}
                        onSelectionChange={(k) => setPerfil(k as PerfilId)}
                        items={PERFIL_ITENS}
                    >
                        {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                    </Select>
                    <Toggle size="sm" label="Vagas acabam antes de abrir o link" isSelected={!!S.simSemVaga} onChange={(v) => setSim("simSemVaga", v)} />
                    <Toggle size="sm" label="Camiseta esgota antes de abrir o link" isSelected={!!S.simCamiseta} onChange={(v) => setSim("simCamiseta", v)} />
                    <Toggle size="sm" label="Vagas acabam ao confirmar" isSelected={!!S.simEsgotar} onChange={(v) => setSim("simEsgotar", v)} />
                    <Toggle size="sm" label="Muitos pedidos (2.400)" isSelected={S.volume} onChange={(v) => setSim("volume", v)} />
                    <Toggle size="sm" label="Evento exige facial" isSelected={S.eventoFacial} onChange={(v) => setSim("eventoFacial", v)} />
                    {extras}
                    <div className="flex flex-col gap-1.5 border-t border-secondary pt-3">
                        <p className="text-xs font-semibold text-tertiary">Ir para</p>
                        <div className="flex flex-wrap gap-1.5">
                            {(
                                [
                                    ["Pedidos", "/backstage/troca-de-inscricao"],
                                    ["Editar evento", "/backstage/evento/editar"],
                                    ["Transações", "/backstage/troca-de-inscricao/relatorios/transacoes"],
                                    ["Borderô", "/backstage/troca-de-inscricao/relatorios/bordero"],
                                    ["E-mails", "/backstage/troca-de-inscricao/emails"],
                                    ["Carteira", "/carteira-web/inscricoes"],
                                ] as const
                            ).map(([t, href]) => (
                                <Button key={href} size="xs" color="secondary" onClick={() => navigate(href)}>
                                    {t}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <Button
                        size="sm"
                        color="secondary"
                        onClick={() => {
                            reiniciar();
                            toast.success("Protótipo reiniciado");
                        }}
                    >
                        Reiniciar dados
                    </Button>
                </div>
            )}
            <ButtonUtility
                size="sm"
                color="secondary"
                icon={Settings02}
                tooltip={aberto ? "Fechar controles do protótipo" : "Controles do protótipo"}
                onClick={() => setAberto((a) => !a)}
                className="shadow-lg"
            />
        </div>
    );
}
