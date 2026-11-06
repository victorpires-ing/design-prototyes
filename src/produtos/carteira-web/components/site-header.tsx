import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, ChevronRight, MarkerPin01, SearchLg } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { cx } from "@/utils/cx";
import logoBlack from "../../../assets/Company logo_black.svg";
import bandeiraBrasil from "../../../assets/Brazil flag.svg";
import fotoPerfil from "../assets/foto-perfil.jpg";
import { EU, pronomeDe, primeiroNome, useDependentes } from "../data/dependentes";
import { Confirmacao } from "./dialogo";
import { entrarNoPerfil, sairDoPerfil, usePerfilAtivo } from "../data/perfil-ativo";

/** Conta logada (mesma pessoa do app). */
export const CONTA = { nome: EU.nome, iniciais: EU.iniciais, foto: fotoPerfil };

/** Mesmo loading curto da troca de perfil no app. */
const TROCA_MS = 700;

/** Divisória vertical em brand, como no header do site. */
const Divisoria = () => <span aria-hidden="true" className="w-px self-stretch bg-fg-brand-primary" />;

type PerfilOpcao = { id: string; nome: string; iniciais: string; foto?: string; legenda: string; entrar: () => void };

/** Perfil em uso + os outros perfis que essa conta pode acessar (a própria conta e os dependentes com acesso pronto). */
function usePerfis() {
    const ativo = usePerfilAtivo();
    const prontos = useDependentes().filter((d) => d.acesso === "pronto");
    const dep = prontos.find((d) => d.id === ativo?.id);
    const minha: PerfilOpcao = { id: EU.id, nome: EU.nome, iniciais: EU.iniciais, foto: fotoPerfil, legenda: "Sua conta", entrar: sairDoPerfil };
    const deps: PerfilOpcao[] = prontos.map((d) => ({
        id: d.id,
        nome: d.nome,
        iniciais: d.iniciais,
        legenda: d.parentesco,
        entrar: () => entrarNoPerfil({ id: d.id, nome: d.nome, iniciais: d.iniciais, cpf: d.cpf, carteira: d.carteira }),
    }));
    const atual = dep ? deps.find((p) => p.id === dep.id)! : minha;
    const outros = [minha, ...deps].filter((p) => p.id !== atual.id);
    return { atual, outros };
}

const FotoPerfil = ({ p, size }: { p: { nome: string; iniciais: string; foto?: string }; size: "sm" | "md" }) => (
    <Avatar size={size} src={p.foto} initials={p.iniciais} alt={p.nome} />
);

/** Menu da conta (aberto pelo avatar): perfil em uso, troca de perfil e os atalhos do site. */
function MenuConta({ className, onFechar, onConfirmarTroca }: { className?: string; onFechar: () => void; onConfirmarTroca: (p: PerfilOpcao) => void }) {
    const navigate = useNavigate();
    const { atual, outros } = usePerfis();
    const [trocandoPara, setTrocandoPara] = useState<string | null>(null);

    const ir = (rota: string) => {
        onFechar();
        navigate(rota);
    };
    const trocar = (p: PerfilOpcao) => {
        // Entrar no perfil de um dependente pede confirmação; voltar para a própria conta é direto
        if (p.id !== EU.id) {
            onFechar();
            onConfirmarTroca(p);
            return;
        }
        setTrocandoPara(p.id);
        window.setTimeout(() => {
            p.entrar();
            setTrocandoPara(null);
            ir("/carteira-web");
        }, TROCA_MS);
    };

    const itens: { label: string; rota?: string }[] = [
        { label: "Meus dados" },
        { label: "Meus dependentes", rota: "/carteira-web/dependentes" },
        { label: "Dispositivos verificados" },
        { label: "Formas de pagamentos" },
        { label: "Minhas compras" },
        { label: "Privacidade e segurança" },
    ];

    return (
        <div className={cx("z-40 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary", className)} role="menu">
            {/* Perfil em uso */}
            <div className="flex items-center gap-2">
                <FotoPerfil p={atual} size="md" />
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-primary">{atual.nome}</p>
                    {atual.id !== EU.id && <p className="truncate text-xs text-tertiary">{atual.legenda}</p>}
                </div>
            </div>

            {/* Outros perfis que dá para acessar: troca no lugar, com o loading curto do app */}
            {outros.length > 0 && (
                <ul className="-mx-2 mt-3 border-t border-secondary pt-2">
                    {outros.map((p) => (
                        <li key={p.id}>
                            <button
                                type="button"
                                role="menuitem"
                                disabled={Boolean(trocandoPara)}
                                onClick={() => trocar(p)}
                                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition duration-100 ease-linear enabled:hover:bg-secondary"
                            >
                                <FotoPerfil p={p} size="sm" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-primary">{p.nome}</p>
                                    <p className="truncate text-xs text-tertiary">{p.legenda}</p>
                                </div>
                                {trocandoPara === p.id ? (
                                    <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-tertiary border-t-fg-brand-primary" aria-label="Trocando de perfil" />
                                ) : (
                                    <ChevronRight className="size-4 shrink-0 text-fg-quaternary" />
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <ul className={cx("flex flex-col gap-4", outros.length > 0 ? "mt-3 border-t border-secondary pt-4" : "mt-5")}>
                {itens.map((item) => (
                    <li key={item.label}>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => item.rota && ir(item.rota)}
                            className="text-sm text-primary transition duration-100 ease-linear hover:text-fg-brand-primary"
                        >
                            {item.label}
                        </button>
                    </li>
                ))}
            </ul>
            <div className="mt-6 flex flex-col gap-2">
                <button
                    type="button"
                    className="h-[42px] rounded-md bg-primary-solid text-xs font-semibold tracking-wide text-white uppercase transition duration-100 ease-linear hover:opacity-90"
                >
                    Criar evento
                </button>
                {/* No protótipo, "Sair" simula sair e entrar de novo: abre a escolha de perfil do login */}
                <button
                    type="button"
                    onClick={() => {
                        sairDoPerfil();
                        ir("/carteira-web/selecionar");
                    }}
                    className="h-[42px] rounded-md bg-primary text-xs font-semibold tracking-wide text-primary uppercase ring-2 ring-fg-primary ring-inset transition duration-100 ease-linear hover:bg-secondary"
                >
                    Sair
                </button>
            </div>
        </div>
    );
}

/** Fecha o menu ao clicar fora ou apertar Esc. */
function useMenu() {
    const [aberto, setAberto] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!aberto) return;
        const fora = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setAberto(false);
        const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
        document.addEventListener("mousedown", fora);
        document.addEventListener("keydown", esc);
        return () => {
            document.removeEventListener("mousedown", fora);
            document.removeEventListener("keydown", esc);
        };
    }, [aberto]);
    return { aberto, setAberto, ref };
}

const linkTopo = "text-xs font-medium tracking-wide text-fg-brand-primary uppercase transition duration-100 ease-linear hover:opacity-80";

/**
 * Header do site da Ingresse (logado), igual ao de produção.
 * No perfil de um dependente, o avatar vira as iniciais dele (como a aba Perfil do app).
 * `compact` = versão do celular: logo, busca e avatar; o menu abre em largura total.
 */
export function SiteHeader({ compact = false, semConta = false }: { compact?: boolean; semConta?: boolean }) {
    const navigate = useNavigate();
    const { aberto, setAberto, ref } = useMenu();
    const { atual } = usePerfis();
    const [aConfirmar, setAConfirmar] = useState<PerfilOpcao | null>(null);
    const [confirmando, setConfirmando] = useState(false);
    const confirmarTroca = () => {
        if (!aConfirmar) return;
        setConfirmando(true);
        // Mesmo loading curto da troca, agora no botão da confirmação
        window.setTimeout(() => {
            aConfirmar.entrar();
            setConfirmando(false);
            setAConfirmar(null);
            navigate("/carteira-web");
        }, TROCA_MS);
    };
    const confirmacao = (
        <Confirmacao
            aberto={Boolean(aConfirmar)}
            compact={compact}
            titulo={`Trocar para o perfil de ${aConfirmar ? primeiroNome(aConfirmar) : ""}?`}
            descricao={aConfirmar && `Você poderá navegar pela Ingresse e realizar ações no perfil ${pronomeDe({ parentesco: aConfirmar.legenda })}.`}
            confirmar="Trocar perfil"
            carregando={confirmando}
            onConfirmar={confirmarTroca}
            onCancelar={() => setAConfirmar(null)}
        />
    );

    const avatar = (
        <button
            type="button"
            aria-label="Menu da conta"
            aria-expanded={aberto}
            onClick={() => setAberto((v) => !v)}
            className="flex items-center gap-2 rounded-full transition duration-100 ease-linear hover:opacity-90"
        >
            <FotoPerfil p={atual} size="sm" />
            <ChevronDown className={cx("size-4 text-fg-primary transition duration-100 ease-linear", aberto && "rotate-180")} />
        </button>
    );

    const logo = (
        <button type="button" aria-label="Ir para a carteira" onClick={() => navigate("/carteira-web")}>
            <img src={logoBlack} alt="Ingresse" className={compact ? "h-6 w-auto" : "h-7 w-auto"} />
        </button>
    );

    // Escolha de perfil logo depois do login: ainda não há perfil em uso, então sem avatar, menu e atalhos
    if (semConta) {
        return (
            <header className={cx("z-30 shrink-0 border-b border-secondary bg-primary", !compact && "sticky top-0")}>
                <div className={cx("mx-auto flex items-center justify-between", compact ? "h-16 px-5" : "h-20 max-w-[1440px] px-14")}>
                    <img src={logoBlack} alt="Ingresse" className={compact ? "h-6 w-auto" : "h-7 w-auto"} />
                    <span className="flex items-center gap-2 text-sm font-medium text-primary">
                        <img src={bandeiraBrasil} alt="" className="size-4" />
                        <span>PT-BR</span>
                    </span>
                </div>
            </header>
        );
    }

    if (compact) {
        return (
            <>
                <header ref={ref} className="relative z-30 shrink-0 border-b border-secondary bg-primary">
                    <div className="flex h-16 items-center justify-between px-5">
                        {logo}
                        <div className="flex items-center gap-4">
                            <button type="button" aria-label="Buscar" className="text-fg-brand-primary transition duration-100 ease-linear hover:opacity-80">
                                <SearchLg className="size-5" />
                            </button>
                            {avatar}
                        </div>
                    </div>
                    {aberto && <MenuConta className="absolute inset-x-3 top-full mt-2" onFechar={() => setAberto(false)} onConfirmarTroca={setAConfirmar} />}
                </header>
                {/* Fora do header: no celular a confirmação vira o bottom sheet preso ao frame */}
                {confirmacao}
            </>
        );
    }

    return (
        <>
            <header className="sticky top-0 z-30 border-b border-secondary bg-primary">
                <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-6 px-14">
                    {logo}

                    <div className="flex h-12 items-stretch gap-6">
                        <div className="flex items-center gap-6">
                            <button type="button" aria-label="Buscar" className="text-fg-brand-primary transition duration-100 ease-linear hover:opacity-80">
                                <SearchLg className="size-5" />
                            </button>
                            <button type="button" className={cx(linkTopo, "flex items-center gap-1.5")}>
                                <MarkerPin01 className="size-5" />
                                <span>Rio de Janeiro</span>
                                <ChevronDown className="size-4" />
                            </button>
                        </div>
                        <Divisoria />
                        <nav className="flex items-center gap-8">
                            <button type="button" className={linkTopo}>
                                Revenda
                            </button>
                            <button type="button" onClick={() => navigate("/carteira-web")} className={linkTopo}>
                                Meus ingressos
                            </button>
                            <div ref={ref} className="relative">
                                {avatar}
                                {aberto && <MenuConta className="absolute top-full right-[-40px] mt-4 w-[300px]" onFechar={() => setAberto(false)} onConfirmarTroca={setAConfirmar} />}
                            </div>
                        </nav>
                        <Divisoria />
                        <button type="button" className="flex items-center gap-2 text-sm font-medium text-primary">
                            <img src={bandeiraBrasil} alt="" className="size-4" />
                            <span>PT-BR</span>
                        </button>
                    </div>
                </div>
            </header>
            {confirmacao}
        </>
    );
}
