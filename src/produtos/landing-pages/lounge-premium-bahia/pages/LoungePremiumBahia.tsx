import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { AlertCircle, CheckCircle, Plus, UserPlus01 } from "@untitledui/icons";
import { AlertFloating } from "@/components/application/alerts/alerts";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { cx } from "@/utils/cx";
import { useTheme } from "@/providers/theme-provider";
import {
    DATA_LIBERACAO,
    DATA_LIMITE,
    MAX_BENEFICIARIOS,
    SOCIO_LOGADO,
    TEMPORADA,
    formatarCpf,
    resolverSocio,
    soDigitos,
    validarCpf,
    type ResultadoCpf,
} from "../data/socios";

/* Identidade Bahia em dark mode: fundo azul-marinho bem escuro, texto claro e
   botões em azul vibrante de destaque. Sobrescreve as variáveis finais do DS
   (superfícies, texto, bordas e brand) só no escopo desta página. */
const AZUL = "#2f6bff"; // acento vibrante (botões, escudo, destaques)
const VERMELHO_CLARO = "#c23a2d"; // faixa superior do header (tricolor Bahia)
const VERMELHO_ESCURO = "#9f2a20"; // faixa inferior do header
const AMARELO = "#ffd23f"; // amarelo/dourado do Bahia (destaques pontuais)
const NAVY_BG = "linear-gradient(180deg, #040e28 0%, #01060f 100%)";
const BAHIA_DARK = {
    // superfícies navy
    "--background-color-primary": "#102a54",
    "--background-color-primary_hover": "#153564",
    "--background-color-secondary": "#0b1f45",
    "--background-color-secondary_hover": "#102a54",
    "--background-color-tertiary": "#0a1b3e",
    // texto claro
    "--text-color-primary": "#ffffff",
    "--text-color-secondary": "#cdd9f2",
    "--text-color-tertiary": "#9db0d6",
    "--text-color-quaternary": "#7b93bd",
    "--color-fg-secondary": "#cdd9f2",
    "--color-fg-quaternary": "#9db0d6",
    // bordas navy
    "--border-color-primary": "#2a4877",
    "--border-color-secondary": "#1e3a66",
    // acento (botões e brand)
    "--background-color-brand-solid": AZUL,
    "--background-color-brand-solid_hover": "#1c56e6",
    "--background-color-brand-secondary": "#16346b",
    "--text-color-brand-secondary": "#8bb0ff",
    "--text-color-brand-secondary_hover": "#a9c4ff",
    "--color-fg-brand-primary": "#8bb0ff",
    "--color-fg-brand-primary_alt": "#8bb0ff",
    "--border-color-brand": AZUL,
    "--outline-color-brand": AZUL,
    "--ring-color-brand": AZUL,
} as CSSProperties;

interface Beneficiario {
    cpf: string;
    nome: string;
    plano: string;
    ativo: boolean;
}

const criar = (cpf: string): Beneficiario => {
    const d = soDigitos(cpf);
    const s = resolverSocio(d);
    return { cpf: d, nome: s.nome, plano: s.plano, ativo: s.ativo };
};

/* Cenários de teste para navegar rápido pelos estados. */
const CENARIOS: Record<string, { label: string; lista: Beneficiario[] }> = {
    vazio: { label: "Vazio", lista: [] },
    parcial: { label: "Parcial (2)", lista: [criar("52998224725"), criar("16899535009")] },
    completo: {
        label: "Completo (5)",
        lista: [criar("11144477735"), criar("52998224725"), criar("16899535009"), criar("39877456014"), criar("24681357900")],
    },
    inativo: { label: "Com inativo", lista: [criar("11144477735"), criar("85274196300"), criar("16899535009")] },
};

const AVATARES = [
    { src: "https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80" },
    { src: "https://www.untitledui.com/images/avatars/lily-rose-chedjou?fm=webp&q=80" },
    { src: "https://www.untitledui.com/images/avatars/ammar-foley?fm=webp&q=80" },
    { src: "https://www.untitledui.com/images/avatars/sienna-hewitt?fm=webp&q=80" },
    { src: "https://www.untitledui.com/images/avatars/caitlyn-king?fm=webp&q=80" },
    { src: "https://www.untitledui.com/images/avatars/marco-kelly?fm=webp&q=80" },
    { src: "https://www.untitledui.com/images/avatars/mathilde-lewis?fm=webp&q=80" },
    { src: "https://www.untitledui.com/images/avatars/zahra-christensen?fm=webp&q=80" },
    { src: "https://www.untitledui.com/images/avatars/aliah-lane?fm=webp&q=80" },
];

const iniciais = (nome: string) =>
    nome
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase();

function Escudo({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
            <path d="M12 2.2 20 5v6.2c0 4.9-3.4 8.6-8 10.6-4.6-2-8-5.7-8-10.6V5l8-2.8Z" fill="currentColor" />
            <path d="M8.5 9.2h7M8.5 12h7M9.7 14.8h4.6" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
    );
}

export function LoungePremiumBahia() {
    const { setTheme } = useTheme();
    useEffect(() => {
        setTheme("dark");
        return () => setTheme("light");
    }, [setTheme]);

    const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>(CENARIOS.vazio.lista);
    // Linhas de CPF abertas para preenchimento (ainda não salvas).
    const [linhas, setLinhas] = useState<string[]>([]);

    const vagas = MAX_BENEFICIARIOS - beneficiarios.length;
    const completo = vagas === 0;
    // Ainda há espaço para abrir mais uma linha? (cadastrados + linhas abertas < máximo)
    const podeAdicionar = beneficiarios.length + linhas.length < MAX_BENEFICIARIOS;

    // Valida cada linha aberta, considerando os CPFs já cadastrados e os já preenchidos acima (duplicidade).
    const resultados: ResultadoCpf[] = useMemo(() => {
        const jaCadastrados = beneficiarios.map((b) => b.cpf);
        return linhas.map((cpf, i) => {
            const acima = linhas.slice(0, i).map(soDigitos).filter((d) => d.length === 11);
            return validarCpf(cpf, [...jaCadastrados, ...acima]);
        });
    }, [linhas, beneficiarios]);

    const cadastrando = linhas.length > 0;
    const alterarLinha = (i: number, v: string) => setLinhas((l) => l.map((x, idx) => (idx === i ? formatarCpf(v) : x)));

    // Abre todos os campos das vagas disponíveis de uma vez.
    const abrirCampos = () => setLinhas(Array.from({ length: Math.max(1, vagas) }, () => ""));
    const cancelarCadastro = () => setLinhas([]);

    // CPFs válidos preenchidos e regra para habilitar o salvar em lote.
    const novos: Beneficiario[] = linhas
        .map((cpf, i) => ({ cpf, r: resultados[i] }))
        .filter((x) => x.r?.status === "ok")
        .map((x) => criar(x.cpf));
    const podeSalvar = novos.length >= 1;

    // Salva a lista inteira: adiciona todos os CPFs válidos e fecha os campos.
    const salvarLista = () => {
        if (!podeSalvar) return;
        setBeneficiarios((prev) => [...prev, ...novos]);
        setLinhas([]);
    };

    return (
        <div style={{ ...BAHIA_DARK, background: NAVY_BG }} className="min-h-screen text-primary">
            {/* Cabeçalho — duas faixas vermelhas (tricolor Bahia) */}
            <header className="sticky top-0 z-20">
                {/* Faixa superior (vermelho mais claro) */}
                <div style={{ backgroundColor: VERMELHO_CLARO }}>
                    <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5">
                        <div className="flex items-center gap-3">
                            <span className="flex size-9 items-center justify-center" style={{ color: AZUL }}>
                                <Escudo className="size-9" />
                            </span>
                            <div className="leading-tight">
                                <p className="text-sm font-bold text-white">Esporte Clube Bahia</p>
                                <p className="text-xs font-semibold text-white/80">Lounge Premium</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="hidden text-right leading-tight sm:block">
                                <p className="text-sm font-semibold text-white">{SOCIO_LOGADO.nome}</p>
                                <p className="text-xs text-white/70">Sócio desde {SOCIO_LOGADO.desde}</p>
                            </div>
                            <Avatar size="sm" initials={iniciais(SOCIO_LOGADO.nome)} />
                        </div>
                    </div>
                </div>
                {/* Faixa inferior (vermelho mais escuro) */}
                <div style={{ backgroundColor: VERMELHO_ESCURO }}>
                    <div className="mx-auto flex h-10 w-full max-w-5xl items-center px-5">
                        <p className="text-xs font-semibold tracking-wide text-white/85 uppercase">Meus beneficiários</p>
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-3xl px-5 py-8 md:py-10">
                {/* Título da página */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-primary md:text-3xl">Beneficiários da temporada {TEMPORADA}</h1>
                    <p className="mt-1.5 text-sm text-tertiary">
                        Escolha quem poderá receber suas transferências durante a temporada.
                        <span className="mt-2 block font-semibold" style={{ color: AMARELO }}>
                            Você pode adicionar as pessoas até {DATA_LIMITE}.
                        </span>
                    </p>
                </div>

                <section className="rounded-2xl bg-primary p-6 shadow-sm ring-1 ring-border-secondary md:p-7">
                    {/* Cabeçalho da seção + botão de cadastrar */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-primary">
                                Você tem {beneficiarios.length} {beneficiarios.length === 1 ? "beneficiário cadastrado" : "beneficiários cadastrados"}
                            </h2>
                            <p className="mt-0.5 text-sm text-tertiary">
                                {completo
                                    ? "Sua lista está completa."
                                    : `Você ainda pode cadastrar mais ${vagas} ${vagas === 1 ? "pessoa" : "pessoas"}.`}
                            </p>
                        </div>
                        {!cadastrando && podeAdicionar && (
                            <Button size="md" color="primary" iconLeading={Plus} className="shrink-0" onClick={abrirCampos}>
                                Cadastrar nova pessoa
                            </Button>
                        )}
                    </div>

                    {/* Progresso */}
                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${(beneficiarios.length / MAX_BENEFICIARIOS) * 100}%`, backgroundColor: AMARELO }}
                        />
                    </div>

                    {/* Campos das vagas (abertos de uma vez ao clicar em cadastrar) */}
                    {cadastrando && (
                        <div className="mt-5 flex flex-col gap-4">
                            {linhas.map((cpf, i) => {
                                const r = resultados[i];
                                const erro = r.status !== "ok" && r.status !== "vazio";
                                const ok = r.status === "ok";
                                return (
                                    <div key={i} className="flex gap-3">
                                        <span
                                            className={cx(
                                                "mt-1.5 flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1 transition duration-100",
                                                ok ? "text-white ring-transparent" : "text-tertiary ring-border-secondary",
                                            )}
                                            style={ok ? { backgroundColor: AZUL } : undefined}
                                        >
                                            {beneficiarios.length + i + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="relative">
                                                <input
                                                    value={cpf}
                                                    onChange={(e) => alterarLinha(i, e.target.value)}
                                                    inputMode="numeric"
                                                    autoFocus={i === 0}
                                                    placeholder="000.000.000-00"
                                                    aria-label={`CPF do beneficiário ${beneficiarios.length + i + 1}`}
                                                    style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
                                                    className={cx(
                                                        "w-full rounded-lg px-3.5 py-2.5 pr-10 text-sm text-gray-900 ring-1 outline-none transition duration-100 placeholder:text-gray-400",
                                                        erro ? "ring-error focus:ring-2 focus:ring-error" : "ring-transparent focus:ring-2 focus:ring-brand",
                                                    )}
                                                />
                                                {ok && <CheckCircle className="absolute top-1/2 right-3 size-5 -translate-y-1/2 text-fg-success-primary" />}
                                                {erro && <AlertCircle className="absolute top-1/2 right-3 size-5 -translate-y-1/2 text-fg-error-secondary" />}
                                            </div>
                                            {ok && "socio" in r && (
                                                <p className="mt-1.5 flex items-center gap-1.5 pl-1 text-sm text-secondary">
                                                    <span className="font-semibold text-primary">{r.socio.nome}</span>
                                                    <span className="text-tertiary">· {r.socio.plano}</span>
                                                </p>
                                            )}
                                            {erro && MENSAGENS[r.status] && <p className="mt-1.5 pl-1 text-sm text-error-primary">{MENSAGENS[r.status]}</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Lista de cadastrados */}
                    {beneficiarios.length > 0 && (
                        <ul className="mt-5 flex flex-col gap-3">
                            {beneficiarios.map((b) => (
                                <li key={b.cpf} className="flex items-start gap-3 rounded-xl border bg-secondary p-4" style={{ borderColor: "#4f74c4" }}>
                                    <Avatar size="md" initials={iniciais(b.nome)} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-bold text-primary">{b.nome}</p>
                                            {b.ativo ? (
                                                <Badge size="sm" color="success" type="pill-color">
                                                    Ativo
                                                </Badge>
                                            ) : (
                                                <Badge size="sm" color="gray" type="pill-color">
                                                    Plano inativo
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="mt-0.5 text-sm text-tertiary">
                                            {b.plano} · CPF {formatarCpf(b.cpf)}
                                        </p>
                                        {!b.ativo && (
                                            <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-tertiary px-3 py-2 text-xs leading-relaxed text-tertiary">
                                                <AlertCircle className="mt-px size-3.5 shrink-0 text-fg-warning-primary" />
                                                Enquanto o plano estiver inativo, esta pessoa não poderá receber transferências. Ela permanece na sua lista e não
                                                pode ser substituída durante a temporada.
                                            </p>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Estado vazio — nenhum cadastrado e nenhuma linha aberta */}
                    {beneficiarios.length === 0 && linhas.length === 0 && (
                        <div className="mt-4 flex justify-center pt-40">
                            <EmptyState size="lg" className="max-w-3xl">
                                <EmptyState.Header pattern="none">
                                    <EmptyState.AvatarRadius avatars={AVATARES} />
                                    <EmptyState.FeaturedIcon icon={UserPlus01} color="gray" theme="modern" />
                                </EmptyState.Header>
                                <EmptyState.Content className="max-w-3xl" style={{ marginTop: 72 }}>
                                    <EmptyState.Title>Nenhum beneficiário cadastrado</EmptyState.Title>
                                    <EmptyState.Description className="whitespace-nowrap">
                                        Clique em “Cadastrar nova pessoa” para adicionar o primeiro CPF.
                                    </EmptyState.Description>
                                </EmptyState.Content>
                            </EmptyState>
                        </div>
                    )}

                    {/* Alert informativo — regra de imutabilidade (só quando há cadastro em andamento ou pessoas na lista) */}
                    {(linhas.length > 0 || beneficiarios.length > 0) && (
                        <div
                            className="mt-8"
                            style={{ "--background-color-primary_alt": "transparent", "--border-color-primary": "#4f74c4" } as CSSProperties}
                        >
                            <AlertFloating
                                color="warning"
                                title="Você só poderá alterar a lista na próxima temporada"
                                confirmLabel=""
                                description={
                                    <span className="block whitespace-normal">
                                        Após confirmar, os beneficiários não poderão ser editados ou removidos até {DATA_LIBERACAO}.
                                    </span>
                                }
                            />
                        </div>
                    )}

                    {/* Ações de cadastro — canto inferior direito, abaixo do alert */}
                    {cadastrando && (
                        <div className="mt-5 flex justify-end gap-2">
                            <Button size="lg" color="secondary" onClick={cancelarCadastro}>
                                Cancelar
                            </Button>
                            <Button size="lg" color="primary" isDisabled={!podeSalvar} onClick={salvarLista}>
                                Salvar minha lista
                            </Button>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

/* ------------------------ Mensagens de validação ------------------------ */

const MENSAGENS: Record<string, string> = {
    incompleto: "CPF incompleto.",
    invalido: "CPF inválido.",
    "nao-encontrado": "CPF não encontrado. Verifique o número.",
    inativo: "Apenas sócios com plano ativo podem ser cadastrados.",
    duplicado: "Este CPF já foi adicionado.",
};

