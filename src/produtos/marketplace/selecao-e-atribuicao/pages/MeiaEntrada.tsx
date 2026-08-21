import { useEffect, useState, type FC, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "react-router";
import { CheckCircle, ChevronDown, GraduationHat01, HeartHand, Phone01, Scales02, User01, Wallet02 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { useTheme } from "@/providers/theme-provider";
import bannerFoto from "../assets/foto2.png";
import cieFoto from "../assets/carteirinha-1.png";
import logoUne from "../assets/logo-ube.png";
import logoUbes from "../assets/logo-ubes.png";
import logoAnpg from "../assets/logo-anpg.png";

const INGRESSE_LOGO = "https://auth.prod.ingresse.com/resources/2ibrw/login/custom/img/ingresse-light.svg";

const SECOES = [
    { id: "quem-tem-direito", label: "Quem tem direito" },
    { id: "cie", label: "Carteira de Identificação Estudantil" },
    { id: "fiscalizacao", label: "Fiscalização" },
    { id: "legislacao", label: "Legislação" },
    { id: "faq", label: "Dúvidas frequentes" },
];

const irPara = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

// Redes sociais da Ingresse (ícones de marca inline).
const SOCIAIS: { label: string; href: string; path: string }[] = [
    { label: "Instagram", href: "#", path: "M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.974.974 1.246 2.241 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.974.974-2.241 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.974-.974-1.246-2.241-1.308-3.608C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608C4.515 2.568 5.782 2.296 7.148 2.234 8.416 2.175 8.796 2.163 12 2.163zm0 1.802c-3.15 0-3.523.012-4.767.069-.96.044-1.482.204-1.83.339-.46.179-.788.393-1.133.738-.345.345-.559.673-.738 1.133-.135.348-.295.87-.339 1.83-.057 1.244-.069 1.617-.069 4.767s.012 3.523.069 4.767c.044.96.204 1.482.339 1.83.179.46.393.788.738 1.133.345.345.673.559 1.133.738.348.135.87.295 1.83.339 1.244.057 1.617.069 4.767.069s3.523-.012 4.767-.069c.96-.044 1.482-.204 1.83-.339.46-.179.788-.393 1.133-.738.345-.345.559-.673.738-1.133.135-.348.295-.87.339-1.83.057-1.244.069-1.617.069-4.767s-.012-3.523-.069-4.767c-.044-.96-.204-1.482-.339-1.83a3.05 3.05 0 0 0-.738-1.133 3.05 3.05 0 0 0-1.133-.738c-.348-.135-.87-.295-1.83-.339-1.244-.057-1.617-.069-4.767-.069zm0 3.064A4.971 4.971 0 1 0 12 17a4.971 4.971 0 0 0 0-9.971zm0 8.2A3.229 3.229 0 1 1 12 8.77a3.229 3.229 0 0 1 0 6.459zm6.336-8.418a1.162 1.162 0 1 1-2.324 0 1.162 1.162 0 0 1 2.324 0z" },
    { label: "Facebook", href: "#", path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
    { label: "X", href: "#", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" },
    { label: "YouTube", href: "#", path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
    { label: "TikTok", href: "#", path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" },
    { label: "LinkedIn", href: "#", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
];

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
                        {on && (
                            <div className="border-t border-border-secondary bg-secondary px-4 pt-6 pb-5 text-sm leading-relaxed text-tertiary md:px-5 md:pb-6">
                                {it.conteudo}
                            </div>
                        )}
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
                return (
                    <div key={i} className={cx("rounded-2xl transition-colors duration-200 ease-out", on && "bg-primary ring-1 ring-border-secondary")}>
                        <button
                            type="button"
                            onClick={() => setAberto(on ? null : i)}
                            className="flex w-full items-center gap-4 px-4 py-4 text-left md:px-6 md:py-5"
                            aria-expanded={on}
                        >
                            <span className="relative flex size-6 shrink-0 items-center justify-center rounded-full text-fg-quaternary ring-[1.5px] ring-current">
                                {/* traço horizontal (sempre) + vertical que some ao abrir = ＋/－ animado */}
                                <span className="absolute h-[1.5px] w-2.5 rounded-full bg-current" />
                                <motion.span
                                    className="absolute h-2.5 w-[1.5px] rounded-full bg-current"
                                    animate={{ rotate: on ? 90 : 0, opacity: on ? 0 : 1 }}
                                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                                />
                            </span>
                            <span className="flex-1 text-md font-semibold text-primary">{it.titulo}</span>
                        </button>
                        <AnimatePresence initial={false}>
                            {on && (
                                <motion.div
                                    key="conteudo"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }, opacity: { duration: 0.2, ease: "easeOut" } }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-4 pb-5 pl-14 text-md leading-relaxed text-tertiary md:px-6 md:pb-6 md:pl-16">{it.conteudo}</div>
                                </motion.div>
                            )}
                        </AnimatePresence>
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
    labelDoc,
    documentos,
}: {
    icon: FC<{ className?: string }>;
    titulo: string;
    descricao: string;
    labelDoc: string;
    documentos: string[];
}) {
    return (
        <div className="flex gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-primary">
                <Icon className="size-5" />
            </span>
            <div className="min-w-0">
                <h3 className="text-lg font-semibold text-primary">{titulo}</h3>
                <p className="mt-1 text-md leading-relaxed text-tertiary">{descricao}</p>
                <p className="mt-3 text-md leading-relaxed text-tertiary">{labelDoc}:</p>
                <p className="mt-0.5 text-md font-medium leading-relaxed text-secondary">{documentos.join(", ")}</p>
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
        "Nome completo e data de nascimento",
        "Foto recente",
        "Nome da instituição de ensino",
        "Grau de escolaridade",
        "Data de validade",
    ];

    // NOTA: contatos usados como referência no protótipo. A composição final
    // (órgãos, UFs e telefones) deve ser validada pelo Jurídico.
    const orgaos = [
        { nome: "PROCON-SP", telefone: "151", apoio: "Atendimento telefônico para chamadas originadas no município de São Paulo." },
        { nome: "Secretaria Nacional do Consumidor — Senacon", telefone: "(61) 2025-3112", apoio: "Atendimento ao consumidor em âmbito nacional." },
    ];

    // Entidades emissoras da CIE (contatos de referência — validar com Jurídico).
    const entidades = [
        { nome: "União Nacional dos Estudantes", logo: logoUne, email: "contato@une.org.br" },
        { nome: "União Brasileira dos Estudantes Secundaristas", logo: logoUbes, email: "sae@documentodoestudante.com.br" },
        { nome: "Associação Nacional de Pós-Graduandos", logo: logoAnpg, email: "comunicacao@anpg.org.br" },
    ];

    return (
        <div className="min-h-screen bg-primary text-primary">
            {/* Header claro: logo Ingresse + links das seções */}
            <header className="sticky top-0 z-30 px-4 pt-4 md:px-8">
                <div className="mx-auto flex h-16 w-full max-w-container items-center gap-8 rounded-2xl bg-primary px-5 shadow-sm ring-1 ring-border-secondary md:px-6">
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
            <section className="relative overflow-hidden pt-12 md:pt-16">
                <div className="mx-auto w-full max-w-container px-4 md:px-8">
                    <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
                        <h1 className="text-display-md font-semibold text-primary md:text-display-lg lg:text-display-xl">Meia-entrada</h1>
                        <p className="mt-4 max-w-2xl text-lg text-tertiary md:mt-6 md:text-xl">
                            Confira quem tem direito à meia-entrada, quais documentos comprovam o benefício e as regras para utilização no acesso ao evento.
                        </p>
                    </div>
                </div>

                {/* Banner full-width */}
                <img src={bannerFoto} alt="Público entrando no evento" className="mt-10 h-72 w-full object-cover sm:h-96 md:mt-14 md:h-[560px]" />
            </section>

            {/* Quem tem direito — categorias à esquerda, informações complementares à direita */}
            <section id="quem-tem-direito" className="scroll-mt-24 bg-secondary py-16 md:py-24">
                <div className="mx-auto w-full max-w-container px-4 md:px-8">
                    <div className="max-w-3xl">
                        <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Quem tem direito à meia-entrada?</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5">Confira quem tem direito ao benefício e qual documento deve ser apresentado para comprovação.</p>
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-10 md:mt-12 lg:grid-cols-[1fr_360px] lg:gap-16">
                        {/* Categorias */}
                        <div className="flex flex-col gap-8">
                            <CategoriaItem
                                icon={GraduationHat01}
                                titulo="Estudante"
                                descricao="Estudantes regularmente matriculados nos níveis e modalidades de ensino previstos em lei têm direito à meia-entrada."
                                labelDoc="Documento para comprovação"
                                documentos={["Carteira de Identificação Estudantil (CIE) válida"]}
                            />
                            <CategoriaItem
                                icon={HeartHand}
                                titulo="Pessoa com deficiência"
                                descricao="Pessoas com deficiência têm direito à meia-entrada. Quando houver necessidade de acompanhamento, o acompanhante também tem direito ao benefício."
                                labelDoc="Documentos para comprovação"
                                documentos={["Cartão do Benefício de Prestação Continuada (BPC)", "Documento do INSS previsto em lei", "Documento oficial com foto"]}
                            />
                            <CategoriaItem
                                icon={Wallet02}
                                titulo="Jovem de baixa renda"
                                descricao="Jovens de 15 a 29 anos pertencentes a famílias com renda mensal de até dois salários mínimos e inscritos no CadÚnico têm direito à meia-entrada."
                                labelDoc="Documentos para comprovação"
                                documentos={["Identidade Jovem (ID Jovem)", "Documento oficial com foto"]}
                            />
                            <CategoriaItem
                                icon={User01}
                                titulo="Pessoa idosa"
                                descricao="Pessoas com 60 anos ou mais têm direito a desconto de pelo menos 50% no ingresso para eventos artísticos, culturais, esportivos e de lazer."
                                labelDoc="Documento para comprovação"
                                documentos={["Documento oficial que comprove a idade"]}
                            />
                        </div>

                        {/* Informações complementares — cards centralizados verticalmente */}
                        <div className="flex flex-col justify-center gap-4">
                            <div className="rounded-2xl bg-primary p-6 ring-1 ring-border-secondary">
                                <h3 className="text-md font-bold text-primary">Outros benefícios regionais</h3>
                                <p className="mt-2 text-md leading-relaxed text-tertiary">
                                    Estados e municípios podem ter regras próprias de meia-entrada. Consulte as condições do local do evento.
                                </p>
                            </div>
                            <div className="rounded-2xl bg-primary p-6 ring-1 ring-border-secondary">
                                <h3 className="text-md font-bold text-primary">Disponibilidade</h3>
                                <p className="mt-2 text-md leading-relaxed text-tertiary">
                                    A legislação destina até 40% dos ingressos de cada evento à meia-entrada. A disponibilidade pode variar por categoria.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Carteira de Identificação Estudantil */}
            <section id="cie" className="scroll-mt-24 bg-primary py-16 md:py-24">
                <div className="mx-auto grid w-full max-w-container grid-cols-1 items-stretch gap-10 px-4 md:px-8 lg:grid-cols-2 lg:gap-16">
                    <div className="flex flex-col">
                        <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Como identificar uma CIE válida</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5">
                            Para utilizar a meia-entrada de estudante, é necessário apresentar uma Carteira de Identificação Estudantil (CIE) válida na compra e no
                            acesso ao evento. Confira as informações que devem constar no documento:
                        </p>
                        <ul className="mt-6 flex flex-col gap-3">
                            {elementosCIE.map((el) => (
                                <li key={el} className="flex items-start gap-3 text-md text-secondary">
                                    <CheckCircle className="mt-0.5 size-5 shrink-0 text-fg-success-primary" />
                                    {el}
                                </li>
                            ))}
                        </ul>
                        <p className="mt-6 text-md leading-relaxed text-tertiary">
                            A Carteira de Identificação Estudantil é válida da data de sua emissão até 31 de março do ano seguinte.
                        </p>
                        <p className="mt-4 text-md leading-relaxed text-tertiary">
                            Não serão aceitos em nenhuma hipótese boleto bancário, declarações, comprovante de mensalidade, carteirinhas vencidas e/ou quaisquer
                            documentos que não estejam de acordo com a legislação vigente.
                        </p>
                        <div className="mt-6">
                            <Button color="secondary" size="lg" onClick={() => irPara("faq")}>
                                Verificar se minha carteirinha está válida
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-1 items-center justify-center rounded-2xl bg-secondary p-6 md:p-10">
                            <img
                                src={cieFoto}
                                alt="Exemplo ilustrativo de uma Carteira de Identificação Estudantil (frente e verso)"
                                className="w-full rounded-xl"
                            />
                        </div>
                        <p className="text-xs text-quaternary">Imagem meramente ilustrativa. O layout da CIE pode variar conforme a entidade emissora.</p>
                    </div>
                </div>
            </section>

            {/* Órgãos de fiscalização */}
            <section id="fiscalizacao" className="scroll-mt-24 bg-secondary py-16 md:py-24">
                <div className="mx-auto w-full max-w-container px-4 md:px-8">
                    <div className="max-w-3xl">
                        <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Órgãos de fiscalização</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5">
                            Em caso de dúvidas ou irregularidades relacionadas à meia-entrada, entre em contato com os órgãos públicos responsáveis pela fiscalização.
                        </p>
                    </div>
                    <div className="mt-10 grid grid-cols-1 gap-4 md:mt-12 md:grid-cols-2">
                        {orgaos.map((o) => (
                            <div key={o.nome} className="flex flex-col rounded-2xl bg-primary p-6 ring-1 ring-border-secondary">
                                <FeaturedIcon icon={Phone01} color="brand" theme="dark" size="lg" className="shrink-0" />
                                <p className="mt-5 text-md font-bold text-primary">{o.nome}</p>
                                {o.apoio && <p className="mt-1 text-sm leading-relaxed text-tertiary">{o.apoio}</p>}
                                <a href={`tel:${o.telefone.replace(/\D/g, "")}`} className="mt-3 text-sm font-semibold text-brand-secondary">
                                    {o.telefone}
                                </a>
                            </div>
                        ))}
                    </div>

                    {/* Entidades emissoras da CIE */}
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {entidades.map((e) => (
                            <div key={e.nome} className="flex flex-col rounded-2xl bg-primary p-6 ring-1 ring-border-secondary">
                                <img src={e.logo} alt={e.nome} className="h-24 w-auto max-w-full self-start object-contain" />
                                <a href={`mailto:${e.email}`} className="mt-6 text-sm font-semibold break-all text-brand-secondary">
                                    {e.email}
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Legislação */}
            <section id="legislacao" className="scroll-mt-24 bg-primary py-16 md:py-24">
                <div className="mx-auto w-full max-w-container px-4 md:px-8">
                    <div className="max-w-3xl">
                        <h2 className="text-display-sm font-semibold text-primary md:text-display-md">O que diz a lei</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5">
                            A meia-entrada possui regras definidas pela legislação federal e pode ser complementada por leis estaduais e municipais. Consulte abaixo as
                            principais normas relacionadas ao benefício.
                        </p>
                    </div>
                    <div className="mt-8 md:mt-10">
                        <Accordion
                            items={[
                                {
                                    titulo: "Entenda a legislação da meia-entrada",
                                    conteudo: (
                                        <div className="flex flex-col gap-4">
                                            <p>
                                                Em 05 de agosto de 2013, foi publicada a Lei Federal nº 12.852/2013 que cria o “Estatuto da Juventude”, dispondo sobre
                                                os direitos dos jovens e os princípios das políticas públicas de juventude, garantindo o acesso à cultura como uma de
                                                suas diretrizes fundamentais. Para proporcionar tal acesso, a lei assegura o direito à meia-entrada, possibilitando aos
                                                estudantes o pagamento do ingresso pela metade de seu valor, mediante a apresentação da Carteira de Identificação
                                                Estudantil (CIE).
                                            </p>
                                            <p>
                                                Neste contexto, a Lei Federal nº 12.933/2013 trata especificamente sobre o benefício ao pagamento de meia-entrada em
                                                espetáculos artísticos, culturais e esportivos, trazendo outras regras para o exercício regular e efetivo do direito. A
                                                lei reitera o direito à meia-entrada mediante a apresentação da Carteira de Identificação Estudantil (CIE), emitida
                                                conforme modelo único nacionalmente padronizado e publicamente disponibilizado pela Associação Nacional de
                                                Pós-Graduandos (ANPG), pela União Nacional dos Estudantes (UNE), pela União Brasileira dos Estudantes Secundaristas
                                                (UBES) e pelo Instituto Nacional de Tecnologia da Informação (ITI), este último responsável pela definição dos
                                                parâmetros da certificação digital da carteira.
                                            </p>
                                            <p>
                                                Regulamentando ambas as leis, o decreto federal nº 8.537/2015 reafirma a necessidade de emissão da Carteira de
                                                Identificação Estudantil (CIE) conforme modelo único nacionalmente padronizado e com certificação digital, visando
                                                evitar a criação de documentos falsos, a emissão por entidades não autorizadas e fraudes.
                                            </p>
                                            <p>
                                                Mais do que simplesmente padronizar a Carteira de Identificação Estudantil (CIE), as normas em vigor exigem dos
                                                estabelecimentos responsáveis pelos eventos a necessidade de comunicação, de forma clara e ostensiva, sobre quais são os
                                                requisitos para a concessão do benefício da meia-entrada, e o exijam para que o estudante faça jus ao citado benefício.
                                                A Lei nº 13.179/2015, por sua vez, estende este dever de comunicação a todas as formas de comercialização de ingressos
                                                on-line.
                                            </p>
                                        </div>
                                    ),
                                },
                            ]}
                        />
                        <div className="mt-4 rounded-2xl bg-secondary p-6">
                            <h3 className="text-md font-semibold text-primary">Outras leis aplicáveis</h3>
                            <ul className="mt-4 flex flex-col divide-y divide-border-secondary">
                                {[
                                    { nome: "Decreto nº 8.537/2015", desc: "Regulamenta as condições, documentos e procedimentos relacionados à meia-entrada." },
                                    {
                                        nome: "Estatuto da Pessoa Idosa — Lei nº 10.741/2003",
                                        desc: "Assegura desconto de pelo menos 50% a pessoas com 60 anos ou mais em eventos artísticos, culturais, esportivos e de lazer.",
                                    },
                                    { nome: "Legislações estaduais e municipais", desc: "Outras regras podem ser aplicáveis conforme o local de realização do evento." },
                                ].map((l) => (
                                    <li key={l.nome} className="py-3.5 first:pt-0 last:pb-0">
                                        <div className="flex items-center gap-2">
                                            <Scales02 className="size-4 shrink-0 text-fg-quaternary" />
                                            <p className="text-sm font-semibold text-primary">{l.nome}</p>
                                        </div>
                                        <p className="mt-1 text-sm leading-relaxed text-tertiary">{l.desc}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dúvidas frequentes (Accordion 02) */}
            <section id="faq" className="scroll-mt-24 bg-secondary py-16 md:py-24">
                <div className="mx-auto w-full max-w-container px-4 md:px-8">
                    <div className="max-w-3xl">
                        <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Dúvidas frequentes</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5">Tudo o que você precisa saber sobre o uso da meia-entrada.</p>
                    </div>
                    <div className="mt-8 md:mt-10">
                        <FaqAccordion02
                            items={[
                                {
                                    titulo: "Preciso apresentar o documento no acesso ao evento?",
                                    conteudo: (
                                        <p>
                                            Sim. O documento necessário para comprovar o benefício deve ser apresentado na portaria ou na entrada do evento. Confira
                                            nesta página qual documento corresponde à sua categoria de meia-entrada.
                                        </p>
                                    ),
                                },
                                {
                                    titulo: "Outra pessoa pode usar minha meia-entrada?",
                                    conteudo: (
                                        <p>
                                            O benefício deve ser utilizado pela pessoa que possui o direito à meia-entrada e deverá ser comprovado com a documentação
                                            correspondente no acesso ao evento. No caso da pessoa com deficiência que necessite de acompanhamento, o acompanhante
                                            também pode ter direito ao benefício nos termos da legislação.
                                        </p>
                                    ),
                                },
                                {
                                    titulo: "Comprei a categoria de meia-entrada errada. O que eu faço?",
                                    conteudo: (
                                        <p>
                                            A documentação apresentada deve corresponder à categoria de meia-entrada adquirida. Caso tenha escolhido a categoria
                                            errada, consulte as opções disponíveis para o seu pedido antes do evento.
                                        </p>
                                    ),
                                },
                                {
                                    titulo: "Meu documento precisa estar válido no dia do evento?",
                                    conteudo: (
                                        <p>
                                            Sim. Apresente a documentação válida exigida para sua categoria de meia-entrada no acesso ao evento. No caso da CIE, a
                                            validade vai até 31 de março do ano seguinte ao de sua emissão.
                                        </p>
                                    ),
                                },
                                {
                                    titulo: "Posso apresentar o documento pelo celular?",
                                    conteudo: (
                                        <p>
                                            Documentos digitais podem ser aceitos quando emitidos em formato oficial e passível de validação. Fotos, capturas de tela
                                            ou cópias do documento podem não ser aceitas. Consulte as regras do documento utilizado para comprovar o benefício.
                                        </p>
                                    ),
                                },
                                {
                                    titulo: "O que acontece se eu não conseguir comprovar o benefício?",
                                    conteudo: (
                                        <p>
                                            Caso não seja possível comprovar o direito à meia-entrada com a documentação exigida, o benefício poderá não ser
                                            reconhecido no acesso ao evento. Consulte previamente as regras do evento e os canais de atendimento da Ingresse.
                                        </p>
                                    ),
                                },
                            ]}
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-secondary bg-primary py-8">
                <div className="mx-auto flex w-full max-w-container flex-col items-center gap-6 px-4 md:flex-row md:justify-between md:px-8">
                    <p className="text-sm text-tertiary">© 2026 Ingresse. Todos os direitos reservados.</p>
                    <div className="flex items-center gap-5">
                        {SOCIAIS.map((s) => (
                            <a
                                key={s.label}
                                href={s.href}
                                aria-label={s.label}
                                className="text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="size-5" aria-hidden="true">
                                    <path d={s.path} />
                                </svg>
                            </a>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
}
