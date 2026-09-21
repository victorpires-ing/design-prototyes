import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { AlertCircle, CheckCircle, Monitor01, Phone01, Plus, SearchLg, XClose } from "@untitledui/icons";
import { AlertFloating } from "@/components/application/alerts/alerts";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { cx } from "@/utils/cx";
import { useTheme } from "@/providers/theme-provider";
import patternBahia from "../assets/Pattern-Bahia.png";
import escudoBahia from "../assets/Escudo-Bahia-848x1024.png";
import {
    DATA_LIBERACAO,
    DATA_LIMITE,
    MAX_BENEFICIARIOS,
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
const BORDA_CARD = "#3560b8"; // stroke azul do card principal e dos cards de pessoa
const VERMELHO_ERRO = "#e5342b"; // badge de número em estado de erro
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

/* Alterna a pré-visualização entre Desktop e Mobile. */
function PreviewToggle({ preview, onChange }: { preview: "desktop" | "mobile"; onChange: (v: "desktop" | "mobile") => void }) {
    return (
        <div className="fixed right-4 bottom-4 z-[60] flex items-center gap-1 rounded-full bg-black/70 p-1 shadow-lg ring-1 ring-white/15 backdrop-blur">
            {(["desktop", "mobile"] as const).map((v) => (
                <button
                    key={v}
                    type="button"
                    onClick={() => onChange(v)}
                    className={cx(
                        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition duration-100 ease-linear",
                        preview === v ? "bg-white text-gray-900" : "text-white/70 hover:text-white",
                    )}
                >
                    {v === "desktop" ? <Monitor01 className="size-4" /> : <Phone01 className="size-4" />}
                    {v === "desktop" ? "Desktop" : "Mobile"}
                </button>
            ))}
        </div>
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
    // Contagem exibida "X de 5": cadastrados + válidos preenchidos em andamento.
    const contagem = beneficiarios.length + novos.length;

    const [confirmando, setConfirmando] = useState(false);

    // Abre o modal de confirmação antes de salvar de fato.
    const salvarLista = () => {
        if (!podeSalvar) return;
        setConfirmando(true);
    };

    // Confirma: adiciona todos os CPFs válidos, fecha campos e modal.
    const confirmarCadastro = () => {
        setBeneficiarios((prev) => [...prev, ...novos]);
        setLinhas([]);
        setConfirmando(false);
    };

    // Pré-visualização Desktop/Mobile. Dentro do iframe (?frame=1) não mostra o toggle.
    const emFrame = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("frame") === "1";
    const [preview, setPreview] = useState<"desktop" | "mobile">("desktop");

    // Modo mobile: renderiza a própria página dentro de um "celular" (iframe), com viewport estreita real.
    if (preview === "mobile" && !emFrame) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#05070d] p-6">
                <PreviewToggle preview={preview} onChange={setPreview} />
                <div className="h-[844px] w-[390px] max-w-full overflow-hidden rounded-[2.5rem] shadow-2xl ring-8 ring-black/60">
                    <iframe src={`${window.location.pathname}?frame=1`} title="Pré-visualização mobile" className="size-full border-0" />
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                ...BAHIA_DARK,
                backgroundColor: "#040e28",
                backgroundImage: `linear-gradient(180deg, rgba(4,14,40,0.45) 0%, rgba(2,8,20,0.60) 100%), url(${patternBahia})`,
                backgroundSize: "auto, 420px",
                backgroundRepeat: "no-repeat, repeat",
                backgroundAttachment: "fixed, fixed",
            }}
            className="min-h-screen overflow-x-hidden text-primary"
        >
            {emFrame && (
                <style>{`html,body{scrollbar-width:none;-ms-overflow-style:none}html::-webkit-scrollbar,body::-webkit-scrollbar{display:none;width:0;height:0}`}</style>
            )}
            {!emFrame && <PreviewToggle preview={preview} onChange={setPreview} />}
            {/* Cabeçalho — duas faixas vermelhas (tricolor Bahia), escudo atravessa ambas */}
            <header className="sticky top-0 z-20">
                {/* Faixa superior (vermelho mais claro) */}
                <div style={{ backgroundColor: VERMELHO_CLARO }}>
                    <div className="mx-auto flex h-16 w-full max-w-3xl items-center px-5">
                        <div className="leading-tight pl-[108px] lg:pl-0">
                            <p className="text-sm font-bold text-white">Esporte Clube Bahia</p>
                            <p className="text-xs font-semibold text-white/80">Lounge Premium</p>
                        </div>
                    </div>
                </div>
                {/* Faixa inferior (vermelho mais escuro) */}
                <div style={{ backgroundColor: VERMELHO_ESCURO }}>
                    <div className="mx-auto flex h-10 w-full max-w-3xl items-center px-5">
                        <p className="pl-[108px] lg:pl-0 text-xs font-semibold tracking-wide text-white/85 uppercase">Meus beneficiários</p>
                    </div>
                </div>
                {/* Escudo sobre as duas faixas: topo com respiro, base ultrapassando pro navy (como no print) */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="mx-auto flex h-full w-full max-w-5xl items-start px-5 pt-1.5">
                        <img src={escudoBahia} alt="Escudo do Esporte Clube Bahia" className="h-[120px] w-auto" />
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-3xl px-5 py-8 md:py-10">
                {/* Título da página */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-primary md:text-3xl">Compartilhe seus ingressos na temporada {TEMPORADA}</h1>
                    <p className="mt-1.5 text-sm text-tertiary">
                        Escolha <span className="font-semibold text-secondary">até {MAX_BENEFICIARIOS} pessoas</span> para receber suas transferências ao longo da
                        temporada.
                        <span className="mt-2 block font-semibold" style={{ color: AMARELO }}>
                            Adicione pessoas até {DATA_LIMITE}.
                        </span>
                    </p>
                </div>

                <section className="overflow-hidden rounded-2xl border p-6 shadow-sm md:p-7" style={{ borderColor: BORDA_CARD, backgroundColor: "#0b1f45" }}>
                    {/* Cabeçalho da seção + botão de cadastrar */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-primary">
                                Sua lista ({contagem} de {MAX_BENEFICIARIOS})
                            </h2>
                            {!completo && (
                                <p className="mt-0.5 text-sm text-tertiary">
                                    {cadastrando || beneficiarios.length === 0
                                        ? "Você pode completar a lista aos poucos."
                                        : `Você ainda pode cadastrar mais ${vagas} ${vagas === 1 ? "pessoa" : "pessoas"}.`}
                                </p>
                            )}
                        </div>
                        {!cadastrando && (
                            <Button
                                size="md"
                                color="primary"
                                iconLeading={Plus}
                                className="hidden shrink-0 sm:inline-flex"
                                isDisabled={!podeAdicionar}
                                onClick={abrirCampos}
                            >
                                Cadastrar nova pessoa
                            </Button>
                        )}
                    </div>

                    {/* Progresso */}
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary sm:mt-4">
                        <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${(contagem / MAX_BENEFICIARIOS) * 100}%`, backgroundColor: AMARELO }}
                        />
                    </div>

                    {/* Botão de cadastrar no mobile (abaixo da progress bar, full-width) */}
                    {!cadastrando && (
                        <Button
                            size="md"
                            color="primary"
                            iconLeading={Plus}
                            className={cx("relative z-10 w-full sm:hidden", beneficiarios.length > 0 ? "mt-6" : "mt-2")}
                            isDisabled={!podeAdicionar}
                            onClick={abrirCampos}
                        >
                            Cadastrar nova pessoa
                        </Button>
                    )}

                    {/* Campos das vagas (abertos de uma vez ao clicar em cadastrar) */}
                    {cadastrando && (
                        <div className="mt-5 flex flex-col gap-4">
                            {linhas.map((cpf, i) => {
                                const r = resultados[i];
                                // Enquanto digita (vazio/incompleto) o campo fica em estado normal; só vira erro num CPF completo inválido.
                                const erro = r.status !== "ok" && r.status !== "vazio" && r.status !== "incompleto";
                                const ok = r.status === "ok";
                                return (
                                    <div key={i} className="flex gap-3">
                                        <span
                                            className={cx(
                                                "mt-1.5 flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white transition duration-100",
                                                !ok && !erro && "ring-1 ring-[#33538f]",
                                            )}
                                            style={{ backgroundColor: ok ? AZUL : erro ? VERMELHO_ERRO : "#122a58" }}
                                        >
                                            {i + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="relative">
                                                <input
                                                    value={cpf}
                                                    onChange={(e) => alterarLinha(i, e.target.value)}
                                                    inputMode="numeric"
                                                    autoFocus={i === 0}
                                                    placeholder="000.000.000-00"
                                                    aria-label={`CPF do beneficiário ${i + 1}`}
                                                    style={{ backgroundColor: "#ffffff" }}
                                                    className={cx(
                                                        "w-full rounded-lg px-3.5 py-2.5 pr-10 text-sm text-gray-900 ring-1 outline-none transition duration-100 placeholder:text-gray-400",
                                                        erro ? "ring-error focus:ring-2 focus:ring-error" : "ring-transparent focus:ring-2 focus:ring-brand",
                                                    )}
                                                />
                                                {ok && <CheckCircle className="absolute top-1/2 right-3 size-5 -translate-y-1/2 text-fg-success-primary" />}
                                                {erro && <AlertCircle className="absolute top-1/2 right-3 size-5 -translate-y-1/2 text-fg-error-secondary" />}
                                            </div>
                                            {ok && "socio" in r && (
                                                <p className="mt-1.5 pl-1 text-sm text-tertiary">
                                                    <span className="font-semibold text-primary">{r.socio.nome}</span> · {r.socio.plano}
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
                                <li key={b.cpf} className="flex items-center gap-3 rounded-xl border p-4" style={{ borderColor: BORDA_CARD, backgroundColor: "#001235" }}>
                                    <Avatar size="md" initials={iniciais(b.nome)} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-bold text-primary">{b.nome}</p>
                                            {b.ativo ? (
                                                <Badge size="sm" color="success" type="pill-color">
                                                    Plano ativo
                                                </Badge>
                                            ) : (
                                                <Badge size="sm" color="error" type="pill-color">
                                                    Plano inativo
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="mt-1 text-sm text-tertiary">
                                            CPF {formatarCpf(b.cpf)} · {b.plano}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Estado vazio — nenhum cadastrado e nenhuma linha aberta */}
                    {beneficiarios.length === 0 && linhas.length === 0 && (
                        <div className="mt-4 -mb-8 flex justify-center pt-20 sm:mt-4 sm:mb-0 sm:pt-40">
                            <EmptyState size="lg" className="max-w-3xl">
                                <EmptyState.Header pattern="none" className="scale-[0.86] sm:scale-100">
                                    <EmptyState.AvatarRadius avatars={AVATARES} />
                                    <span
                                        className="relative z-10 flex size-14 items-center justify-center rounded-2xl shadow-sm ring-1 ring-white/10"
                                        style={{ backgroundColor: "#081228" }}
                                    >
                                        <SearchLg className="size-6 text-white" />
                                    </span>
                                </EmptyState.Header>
                                <EmptyState.Content className="max-w-3xl" style={{ marginTop: 72 }}>
                                    <EmptyState.Title>Nenhum beneficiário cadastrado</EmptyState.Title>
                                    <EmptyState.Description className="sm:whitespace-nowrap">
                                        Clique em “Cadastrar nova pessoa” para adicionar o primeiro CPF.
                                    </EmptyState.Description>
                                </EmptyState.Content>
                            </EmptyState>
                        </div>
                    )}

                    {/* Alert informativo — regra de imutabilidade (só quando há cadastro em andamento ou pessoas na lista) */}
                    {(linhas.length > 0 || beneficiarios.length > 0) && (
                        <div
                            className="mt-6"
                            style={{ "--background-color-primary_alt": "transparent", "--border-color-primary": "#4f74c4" } as CSSProperties}
                        >
                            <AlertFloating
                                color="warning"
                                title="Você só poderá alterar a lista na próxima temporada"
                                confirmLabel=""
                                description={
                                    <span className="block whitespace-normal">
                                        {cadastrando ? "Após confirmar, os" : "Os"} beneficiários não poderão ser editados ou removidos até {DATA_LIBERACAO}.
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

            {/* Modal de confirmação de cadastro */}
            {confirmando && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-overlay/60 p-0 sm:items-center sm:p-5" role="dialog" aria-modal="true">
                    <div
                        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl shadow-xl ring-1 ring-border-secondary sm:rounded-2xl"
                        style={{ background: "linear-gradient(180deg, #040e28 0%, #01060f 100%)" }}
                    >
                        <div className="flex items-start justify-between gap-3 p-6 pb-4">
                            <div>
                                <h2 className="text-lg font-bold text-primary">
                                    Adicionar {novos.length === 1 ? novos[0].nome : `${novos.length} pessoas`} à sua lista?
                                </h2>
                                <p className="mt-1 text-sm leading-relaxed text-secondary">
                                    {novos.length === 1
                                        ? `Depois de confirmar, ${novos[0].nome.split(" ")[0]} será uma das suas beneficiárias da temporada e não poderá ser removida ou substituída até ${DATA_LIBERACAO}.`
                                        : `Depois de confirmar, essas pessoas serão suas beneficiárias da temporada e não poderão ser removidas ou substituídas até ${DATA_LIBERACAO}.`}
                                </p>
                            </div>
                            <button
                                type="button"
                                aria-label="Fechar"
                                onClick={() => setConfirmando(false)}
                                className="-mt-1 -mr-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary"
                            >
                                <XClose className="size-5" />
                            </button>
                        </div>

                        <ul className="flex-1 space-y-2 overflow-y-auto px-6 pb-2">
                            {novos.map((b) => (
                                <li key={b.cpf} className="flex items-center gap-3 rounded-xl border p-3.5" style={{ borderColor: BORDA_CARD, backgroundColor: "#001235" }}>
                                    <Avatar size="sm" initials={iniciais(b.nome)} />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-primary">{b.nome}</p>
                                        <p className="truncate text-xs text-tertiary">
                                            CPF {formatarCpf(b.cpf)} · {b.plano}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className="flex flex-col-reverse gap-3 p-6 pt-4 sm:flex-row sm:justify-end sm:gap-2">
                            <Button
                                size="lg"
                                color="secondary"
                                className="w-full bg-white text-gray-900 ring-transparent hover:bg-gray-100 sm:w-auto"
                                style={{ backgroundColor: "#ffffff", color: "#111827" }}
                                onClick={() => setConfirmando(false)}
                            >
                                Cancelar
                            </Button>
                            <Button size="lg" color="primary" className="w-full sm:w-auto" onClick={confirmarCadastro}>
                                Confirmar cadastro
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ------------------------ Mensagens de validação ------------------------ */

const MENSAGENS: Record<string, string> = {
    incompleto: "CPF incompleto",
    invalido: "CPF inválido",
    "nao-encontrado": "CPF não encontrado",
    inativo: "Sócio com plano inativo",
    duplicado: "Este CPF já foi adicionado",
};

