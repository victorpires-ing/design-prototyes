import { useEffect, useState, type FC, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { CheckCircle, ChevronDown, ChevronRight, GraduationHat01, HeartHand, MinusCircle, Phone01, PlusCircle, Scales02, User01, Wallet02 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { Badge } from "@/components/base/badges/badges";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { useTheme } from "@/providers/theme-provider";
import bannerFoto from "../assets/foto2.png";
import cieFoto from "../assets/carteirinhas.png";

const INGRESSE_LOGO = "https://auth.prod.ingresse.com/resources/2ibrw/login/custom/img/ingresse-light.svg";

const SECOES = [
    { id: "quem-tem-direito", label: "Quem tem direito" },
    { id: "cie", label: "Carteira estudantil" },
    { id: "fiscalizacao", label: "Fiscalização" },
    { id: "legislacao", label: "Legislação" },
    { id: "faq", label: "Dúvidas frequentes" },
];

const irPara = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

/* ------------------------------------------------------------------ */
/*  Blocos                                                             */
/* ------------------------------------------------------------------ */

function Accordion({ items }: { items: { titulo: string; conteudo: ReactNode }[] }) {
    const [aberto, setAberto] = useState<number | null>(null);
    return (
        <div className="divide-y divide-border-secondary overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
            {items.map((it, i) => {
                const on = aberto === i;
                return (
                    <div key={i}>
                        <button
                            type="button"
                            onClick={() => setAberto(on ? null : i)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition duration-100 ease-linear hover:bg-secondary md:px-5"
                        >
                            <span className="text-md font-semibold text-primary">{it.titulo}</span>
                            <ChevronDown className={cx("size-5 shrink-0 text-fg-quaternary transition duration-200", on && "rotate-180")} />
                        </button>
                        {on && <div className="px-4 pb-5 text-sm leading-relaxed text-tertiary md:px-5">{it.conteudo}</div>}
                    </div>
                );
            })}
        </div>
    );
}

/* FAQ no estilo "Accordion 02" do DS: ícone ＋/－ à esquerda, item aberto com fundo. */
function FaqAccordion02({ items }: { items: { titulo: string; conteudo: ReactNode }[] }) {
    const [aberto, setAberto] = useState<number | null>(0);
    return (
        <div className="flex flex-col gap-1">
            {items.map((it, i) => {
                const on = aberto === i;
                const Icon = on ? MinusCircle : PlusCircle;
                return (
                    <div key={i} className={cx("rounded-2xl transition duration-100 ease-linear", on && "bg-primary ring-1 ring-border-secondary")}>
                        <button type="button" onClick={() => setAberto(on ? null : i)} className="flex w-full items-start gap-4 px-4 py-4 text-left md:px-6 md:py-5">
                            <Icon className="mt-0.5 size-6 shrink-0 text-fg-quaternary" />
                            <div className="flex-1">
                                <span className="text-md font-semibold text-primary">{it.titulo}</span>
                                {on && <div className="mt-2 text-md leading-relaxed text-tertiary">{it.conteudo}</div>}
                            </div>
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

/* Categoria — item horizontal: ícone em quadradinho + título, descrição e documento. */
function CategoriaItem({
    icon: Icon,
    titulo,
    descricao,
    documento,
}: {
    icon: FC<{ className?: string }>;
    titulo: string;
    descricao: string;
    documento: string;
}) {
    return (
        <div className="flex flex-col gap-3 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
            <div className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg text-fg-secondary ring-1 ring-border-primary">
                    <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-primary">{titulo}</h3>
                    <p className="mt-1 text-md text-tertiary">{descricao}</p>
                </div>
            </div>
            <div className="pl-15">
                <p className="text-sm text-secondary">Documento aceito</p>
                <Badge size="md" color="indigo" type="pill-color" className="mt-1.5">
                    {documento}
                </Badge>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Página (adaptação da Landing page 04)                             */
/* ------------------------------------------------------------------ */

export function MeiaEntrada() {
    const [params] = useSearchParams();
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        const prev = theme;
        setTheme("light");
        return () => setTheme(prev);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const secao = params.get("secao");
        if (secao) {
            const t = setTimeout(() => irPara(secao), 200);
            return () => clearTimeout(t);
        }
    }, [params]);

    const elementosCIE = [
        "Nome completo",
        "Data de nascimento",
        "Foto",
        "Identificação da instituição de ensino",
        "Grau de escolaridade",
        "Data de validade",
        "Demais elementos obrigatórios previstos em lei",
    ];

    const orgaos = [
        { nome: "PROCON [UF]", telefone: "0800 000 0000" },
        { nome: "[Órgão responsável pela fiscalização]", telefone: "(00) 0000-0000" },
    ];

    return (
        <div className="min-h-screen bg-primary text-primary">
            {/* Header claro: logo Ingresse + links das seções */}
            <header className="sticky top-0 z-30 border-b border-secondary bg-primary">
                <div className="mx-auto flex h-16 w-full max-w-container items-center gap-8 px-4 md:px-8">
                    <a href="#" onClick={(e) => e.preventDefault()} className="flex shrink-0 items-center">
                        <img src={INGRESSE_LOGO} alt="Ingresse" className="h-6 w-auto md:h-7" style={{ filter: "invert(1)" }} />
                    </a>
                    <nav className="flex flex-1 items-center gap-6 overflow-x-auto">
                        {SECOES.map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => irPara(s.id)}
                                className="text-sm font-semibold whitespace-nowrap text-secondary transition duration-100 ease-linear hover:text-primary"
                            >
                                {s.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            {/* Hero */}
            <section className="relative overflow-hidden py-16 md:py-24">
                <div className="mx-auto w-full max-w-container px-4 md:px-8">
                    <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
                        <h1 className="text-display-md font-semibold text-primary md:text-display-lg lg:text-display-xl">Meia-entrada</h1>
                        <p className="mt-4 max-w-2xl text-lg text-tertiary md:mt-6 md:text-xl">
                            Confira quem tem direito ao benefício, quais documentos são aceitos e outras informações importantes para utilizar sua meia-entrada.
                        </p>
                    </div>

                    {/* Banner */}
                    <div className="mt-10 overflow-hidden rounded-2xl md:mt-14">
                        <img src={bannerFoto} alt="Público entrando no evento" className="h-64 w-full object-cover sm:h-80 md:h-[460px]" />
                    </div>
                </div>
            </section>

            {/* Quem tem direito — categorias à esquerda, foto à direita */}
            <section id="quem-tem-direito" className="scroll-mt-24 bg-secondary py-16 md:py-24">
                <div className="mx-auto w-full max-w-container px-4 md:px-8">
                    <div className="max-w-3xl">
                        <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Quem tem direito à meia-entrada?</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5">Cada categoria já indica o documento necessário para comprovar o benefício.</p>
                    </div>

                    {/* Categorias em grid 2×2 */}
                    <div className="mt-8 grid grid-cols-1 gap-4 md:mt-10 md:grid-cols-2">
                        <CategoriaItem
                            icon={GraduationHat01}
                            titulo="Estudante"
                            descricao="Estudantes regularmente matriculados têm direito ao pagamento de meia-entrada."
                            documento="Carteira de Identificação Estudantil (CIE) válida"
                        />
                        <CategoriaItem
                            icon={HeartHand}
                            titulo="Pessoa com deficiência"
                            descricao="Pessoas com deficiência e, quando aplicável, seu acompanhante têm direito ao benefício."
                            documento="Documentação comprobatória do benefício"
                        />
                        <CategoriaItem
                            icon={Wallet02}
                            titulo="Jovem de baixa renda"
                            descricao="Jovens de baixa renda que atendam aos critérios previstos em lei têm direito à meia-entrada."
                            documento="Documentação comprobatória do benefício"
                        />
                        <CategoriaItem
                            icon={User01}
                            titulo="Pessoa idosa"
                            descricao="Pessoas idosas têm direito à meia-entrada mediante apresentação de documento oficial."
                            documento="Documento oficial com foto"
                        />
                    </div>

                    <div className="mt-4 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                        <h3 className="text-md font-bold text-primary">Outros benefícios regionais</h3>
                        <p className="mt-1 text-sm leading-relaxed text-tertiary">
                            Alguns estados e municípios possuem regras adicionais de meia-entrada. Consulte os benefícios aplicáveis ao local do evento.
                        </p>
                    </div>
                </div>
            </section>

            {/* Carteira de Identificação Estudantil */}
            <section id="cie" className="scroll-mt-24 bg-primary py-16 md:py-24">
                <div className="mx-auto grid w-full max-w-container grid-cols-1 items-center gap-10 px-4 md:px-8 lg:grid-cols-2 lg:gap-16">
                    <div className="flex flex-col">
                        <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Como identificar uma CIE válida</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5">
                            Para comprovar a meia-entrada de estudante, apresente uma Carteira de Identificação Estudantil válida. Confira os elementos que devem
                            constar no documento:
                        </p>
                        <ul className="mt-6 flex flex-col gap-3">
                            {elementosCIE.map((el) => (
                                <li key={el} className="flex items-start gap-3 text-md text-secondary">
                                    <CheckCircle className="mt-0.5 size-5 shrink-0 text-fg-success-primary" />
                                    {el}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="overflow-hidden rounded-2xl bg-secondary p-4 ring-1 ring-border-secondary md:p-6">
                        <img src={cieFoto} alt="Exemplo ilustrativo de uma Carteira de Identificação Estudantil (frente e verso)" className="w-full rounded-lg" />
                    </div>
                </div>
            </section>

            {/* Órgãos de fiscalização */}
            <section id="fiscalizacao" className="scroll-mt-24 bg-secondary py-16 md:py-24">
                <div className="mx-auto w-full max-w-container px-4 md:px-8">
                    <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                        <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Órgãos de fiscalização</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5">
                            Em caso de dúvidas ou irregularidades relacionadas à concessão da meia-entrada, entre em contato com os órgãos responsáveis.
                        </p>
                    </div>
                    <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
                        {orgaos.map((o) => (
                            <div key={o.nome} className="flex items-center gap-3 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                                <FeaturedIcon icon={Phone01} color="gray" theme="modern" size="md" className="shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-primary">{o.nome}</p>
                                    <a href={`tel:${o.telefone.replace(/\D/g, "")}`} className="text-sm font-semibold text-brand-secondary">
                                        {o.telefone}
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Legislação */}
            <section id="legislacao" className="scroll-mt-24 bg-primary py-16 md:py-24">
                <div className="mx-auto grid w-full max-w-container grid-cols-1 gap-10 px-4 md:px-8 lg:grid-cols-2 lg:gap-16">
                    <div className="flex flex-col">
                        <h2 className="text-display-sm font-semibold text-primary md:text-display-md">O que diz a lei</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5">
                            O direito à meia-entrada é regulamentado pela Lei nº 12.933/2013, pelo Decreto nº 8.537/2015 e por outras legislações aplicáveis.
                        </p>
                    </div>
                    <div>
                        <Accordion
                            items={[
                                {
                                    titulo: "Lei nº 12.933/2013 — Art. 1º",
                                    conteudo: (
                                        <p>
                                            [Placeholder — transcrição integral do artigo pendente de validação jurídica.] Espaço reservado para o texto completo do
                                            Art. 1º da Lei nº 12.933/2013, que dispõe sobre o benefício da meia-entrada.
                                        </p>
                                    ),
                                },
                            ]}
                        />
                        <div className="mt-4 rounded-2xl bg-secondary p-5">
                            <h3 className="text-md font-bold text-primary">Outras legislações aplicáveis</h3>
                            <ul className="mt-3 flex flex-col divide-y divide-border-secondary">
                                {["Decreto nº 8.537/2015", "Legislação relacionada à pessoa idosa", "Legislações estaduais e municipais aplicáveis"].map((l) => (
                                    <li key={l} className="flex items-center justify-between gap-3 py-2.5">
                                        <span className="flex items-center gap-2 text-sm text-secondary">
                                            <Scales02 className="size-4 shrink-0 text-fg-quaternary" />
                                            {l}
                                        </span>
                                        <ChevronRight className="size-4 shrink-0 text-fg-quaternary" />
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-2 text-xs text-quaternary">Links e textos legais pendentes de validação jurídica.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dúvidas frequentes (Accordion 02) */}
            <section id="faq" className="scroll-mt-24 bg-secondary py-16 md:py-24">
                <div className="mx-auto grid w-full max-w-container grid-cols-1 gap-10 px-4 md:px-8 lg:grid-cols-2 lg:gap-16">
                    <div className="flex flex-col">
                        <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Dúvidas frequentes</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5">Tudo o que você precisa saber sobre o uso da meia-entrada.</p>
                    </div>
                    <div>
                        <FaqAccordion02
                            items={[
                                { titulo: "Preciso apresentar o documento no acesso ao evento?", conteudo: <p>[Placeholder] Sim — no acesso ao evento é necessário apresentar o documento válido que comprove o benefício.</p> },
                                { titulo: "Outra pessoa pode usar minha meia-entrada?", conteudo: <p>[Placeholder] O benefício é pessoal e intransferível; o documento apresentado deve ser do portador do ingresso.</p> },
                                { titulo: "Comprei a categoria de meia-entrada errada. O que faço?", conteudo: <p>[Placeholder] Descrever o procedimento de correção/troca disponível no produto.</p> },
                                { titulo: "Meu documento precisa estar válido no dia do evento?", conteudo: <p>[Placeholder] Sim — o documento deve estar válido na data do evento.</p> },
                                { titulo: "Posso apresentar o documento pelo celular?", conteudo: <p>[Placeholder] Informar se a versão digital do documento é aceita.</p> },
                                { titulo: "O que acontece se eu não conseguir comprovar o benefício?", conteudo: <p>[Placeholder] Descrever a regra aplicável quando o benefício não é comprovado no acesso.</p> },
                            ]}
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-primary-solid py-12">
                <div className="mx-auto flex w-full max-w-container flex-col gap-8 px-4 md:flex-row md:items-center md:justify-between md:px-8">
                    <div className="flex flex-col gap-4">
                        <img src={INGRESSE_LOGO} alt="Ingresse" className="h-7 w-auto self-start" />
                        <p className="max-w-sm text-sm text-white/70">Informações sobre meia-entrada para utilizar seu benefício no acesso ao evento.</p>
                    </div>
                    <nav className="flex flex-wrap gap-x-6 gap-y-3">
                        {SECOES.map((s) => (
                            <button key={s.id} type="button" onClick={() => irPara(s.id)} className="text-sm font-medium text-white/75 transition hover:text-white">
                                {s.label}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="mx-auto mt-10 max-w-container border-t border-white/10 px-4 pt-6 md:px-8">
                    <p className="text-sm text-white/50">Conteúdos legais sujeitos a validação. © Ingresse.</p>
                </div>
            </footer>
        </div>
    );
}
