import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { animate } from "motion/react";
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
import { FOTO_MINHA_CONTA, entrarNoPerfil, sairDoPerfil, usePerfilAtivo } from "../../components/perfil-ativo";
import { StatusBar } from "../../components/StatusBar";
import { EU, useDependentes } from "../data/dependentes";

/** Tempo do loading na linha escolhida antes de o card se refazer com o novo perfil. */
const TROCA_MS = 700;
/** Depois do loading, o novo perfil aparece devagar no destaque (só opacidade, nada se desloca). */
const ENTRADA = { duration: 0.6, ease: "easeOut" } as const;
/** Ordem da lista de outros perfis: quem sai do destaque fica no lugar de quem entrou (vale durante a sessão). */
let ordemOutros: string[] = [];

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
    // Atalho secundário para os perfis de dependentes que já estão com o acesso habilitado
    const perfis = useDependentes().filter((d) => d.acesso === "pronto");
    const ativo = usePerfilAtivo();
    const dependenteAtivo = perfis.find((d) => d.id === ativo?.id);

    // O perfil em uso é o principal; trocar fica no Perfil
    const [trocandoPara, setTrocandoPara] = useState<string | null>(null);
    const topoRef = useRef<HTMLDivElement>(null);
    const linhasRef = useRef(new Map<string, HTMLLIElement>());
    const trocar = (id: string, aplicar: () => void) => {
        setTrocandoPara(id);
        // Loading curto na linha escolhida; a troca acontece no lugar e o novo destaque surge devagar
        window.setTimeout(() => {
            const saindo = principal.id;
            ordemOutros = outros.map((o) => (o.id === id ? saindo : o.id));
            flushSync(() => {
                aplicar();
                setTrocandoPara(null);
            });
            if (topoRef.current) animate(topoRef.current, { opacity: [0, 1] }, ENTRADA);
            const nova = linhasRef.current.get(saindo);
            if (nova) animate(nova, { opacity: [0, 1] }, ENTRADA);
        }, TROCA_MS);
    };
    const posicao = (id: string) => (ordemOutros.includes(id) ? ordemOutros.indexOf(id) : Number.MAX_SAFE_INTEGER);
    const principal = dependenteAtivo
        ? { id: dependenteAtivo.id, foto: undefined, iniciais: dependenteAtivo.iniciais, nome: dependenteAtivo.nome, linhas: [dependenteAtivo.parentesco, `CPF ${dependenteAtivo.cpf}`] }
        : { id: EU.id, foto: FOTO_MINHA_CONTA, iniciais: EU.iniciais, nome: EU.nome, linhas: [EU.email, EU.telefone] };
    const outros = [
        ...(dependenteAtivo ? [{ id: EU.id, foto: FOTO_MINHA_CONTA, iniciais: EU.iniciais, nome: EU.nome, legenda: "Sua conta", trocar: sairDoPerfil }] : []),
        ...perfis
            .filter((d) => d.id !== dependenteAtivo?.id)
            .map((d) => ({
                id: d.id,
                foto: undefined,
                iniciais: d.iniciais,
                nome: d.nome,
                legenda: d.parentesco,
                trocar: () => {
                    entrarNoPerfil({ id: d.id, nome: d.nome, iniciais: d.iniciais, cpf: d.cpf, carteira: d.carteira });
                },
            })),
    ].sort((a, b) => posicao(a.id) - posicao(b.id));

    return (
        <AppShell activeTab="perfil">
            <div className="min-h-full bg-secondary">
                <StatusBar tone="dark" />

                <h1 className="px-5 pt-4 pb-2 text-2xl font-bold text-primary">Perfil</h1>

                {/* Card do perfil: o perfil em uso fica em destaque e os demais (inclusive a própria conta) ficam na lista */}
                <div className="px-5 pt-3">
                    <div className="overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
                        <div ref={topoRef} className="relative flex items-center gap-4 p-4">
                            <Avatar size="xl" src={principal.foto} initials={principal.iniciais} alt={principal.nome} />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-lg font-bold text-primary">{principal.nome}</p>
                                {principal.linhas.map((l) => (
                                    <p key={l} className="truncate text-sm text-tertiary">
                                        {l}
                                    </p>
                                ))}
                            </div>
                        </div>

                        {/* Outros perfis: em segundo plano, sem título — só a lista com nome e legenda (dependentes podem não ter e-mail) */}
                        {outros.length > 0 && (
                            <ul className="border-t border-secondary px-4 py-1">
                                {outros.map((o) => (
                                    <li
                                        key={o.id}
                                        ref={(el) => {
                                            if (el) linhasRef.current.set(o.id, el);
                                            else linhasRef.current.delete(o.id);
                                        }}
                                    >
                                        <button
                                            type="button"
                                            disabled={Boolean(trocandoPara)}
                                            onClick={() => trocar(o.id, o.trocar)}
                                            className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-2.5 text-left transition duration-100 ease-linear enabled:active:bg-secondary"
                                        >
                                            <Avatar size="sm" src={o.foto} initials={o.iniciais} alt={o.nome} />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-primary">{o.nome}</p>
                                                <p className="truncate text-xs text-tertiary">{o.legenda}</p>
                                            </div>
                                            {trocandoPara === o.id ? (
                                                <span
                                                    className="size-4 shrink-0 animate-spin rounded-full border-2 border-tertiary border-t-fg-brand-primary"
                                                    aria-label="Trocando de perfil"
                                                />
                                            ) : (
                                                <ChevronRight className="size-4 shrink-0 text-fg-quaternary" />
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
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
                        {/* No protótipo, "Sair" simula sair e entrar de novo: abre a seleção de perfil do login */}
                        <SettingRow
                            icon={LogOut01}
                            title="Sair"
                            subtitle="Sair deste dispositivo"
                            destructive
                            onClick={() => {
                                sairDoPerfil();
                                navigate("/ingresse-app/perfil/selecionar");
                            }}
                        />
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
