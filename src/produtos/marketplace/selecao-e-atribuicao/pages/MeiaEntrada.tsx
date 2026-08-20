import { useEffect, useState, type FC, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "react-router";
import { CheckCircle, ChevronDown, GraduationHat01, HeartHand, Phone01, Scales02, User01, Wallet02 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { useTheme } from "@/providers/theme-provider";
import bannerFoto from "../assets/foto2.png";
import cieFoto from "../assets/carteirinha-1.png";

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
                <p className="text-sm leading-relaxed text-tertiary">
                    {labelDoc}: <span className="font-medium text-secondary">{documentos.join(", ")}</span>
                </p>
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
        { nome: "Secretaria Nacional do Consumidor — Senacon", telefone: "(61) 2025-3112", apoio: "" },
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
                            Confira quem tem direito à meia-entrada, quais documentos comprovam o benefício e as regras para utilização no acesso ao evento.
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
                        <p className="mt-4 text-lg text-tertiary md:mt-5">Confira quem tem direito ao benefício e qual documento deve ser apresentado para comprovação.</p>
                    </div>

                    {/* Categorias em grid 2×2 */}
                    <div className="mt-8 grid grid-cols-1 gap-4 md:mt-10 md:grid-cols-2">
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

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                            <h3 className="text-md font-bold text-primary">Outros benefícios regionais</h3>
                            <p className="mt-1 text-sm leading-relaxed text-tertiary">
                                Estados e municípios podem prever outros benefícios de meia-entrada. Consulte as regras aplicáveis ao local de realização do evento.
                            </p>
                        </div>
                        <div className="rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                            <h3 className="text-md font-bold text-primary">Sobre a disponibilidade</h3>
                            <p className="mt-1 text-sm leading-relaxed text-tertiary">
                                A legislação reserva aos beneficiários da meia-entrada até 40% do total de ingressos disponíveis para venda ao público em geral em
                                cada evento. A disponibilidade pode variar conforme a categoria do ingresso.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Carteira de Identificação Estudantil */}
            <section id="cie" className="scroll-mt-24 bg-primary py-16 md:py-24">
                <div className="mx-auto grid w-full max-w-container grid-cols-1 items-center gap-10 px-4 md:px-8 lg:grid-cols-2 lg:gap-16">
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
                        <div className="mt-6">
                            <p className="text-md font-semibold text-primary">Validade da CIE</p>
                            <p className="mt-1 text-md leading-relaxed text-tertiary">
                                A Carteira de Identificação Estudantil é válida da data de sua emissão até 31 de março do ano seguinte.
                            </p>
                        </div>
                        <div className="mt-5">
                            <p className="text-md font-semibold text-primary">Onde encontro o código da CIE?</p>
                            <p className="mt-1 text-md leading-relaxed text-tertiary">
                                O código da CIE fica disponível no documento estudantil e pode conter letras e números. Consulte a identificação indicada na sua
                                carteira física ou digital.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="overflow-hidden rounded-2xl bg-secondary p-4 ring-1 ring-border-secondary md:p-6">
                            <img src={cieFoto} alt="Exemplo ilustrativo de uma Carteira de Identificação Estudantil (frente e verso)" className="w-full rounded-lg" />
                        </div>
                        <p className="text-xs text-quaternary">Imagem meramente ilustrativa. O layout da CIE pode variar conforme a entidade emissora.</p>
                    </div>
                </div>
            </section>

            {/* Órgãos de fiscalização */}
            <section id="fiscalizacao" className="scroll-mt-24 bg-secondary py-16 md:py-24">
                <div className="mx-auto w-full max-w-container px-4 md:px-8">
                    <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                        <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Órgãos de fiscalização</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5">
                            Em caso de dúvidas ou irregularidades relacionadas à meia-entrada, entre em contato com os órgãos públicos responsáveis pela fiscalização.
                        </p>
                    </div>
                    <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
                        {orgaos.map((o) => (
                            <div key={o.nome} className="flex items-start gap-3 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                                <FeaturedIcon icon={Phone01} color="gray" theme="modern" size="md" className="shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-primary">{o.nome}</p>
                                    <a href={`tel:${o.telefone.replace(/\D/g, "")}`} className="text-sm font-semibold text-brand-secondary">
                                        {o.telefone}
                                    </a>
                                    {o.apoio && <p className="mt-1 text-xs leading-relaxed text-tertiary">{o.apoio}</p>}
                                </div>
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
                        <div className="mt-4 rounded-2xl bg-secondary p-5">
                            <h3 className="text-md font-bold text-primary">Outras legislações aplicáveis</h3>
                            <ul className="mt-3 flex flex-col divide-y divide-border-secondary">
                                {[
                                    { nome: "Decreto nº 8.537/2015", desc: "Regulamenta as condições, documentos e procedimentos relacionados à meia-entrada." },
                                    {
                                        nome: "Estatuto da Pessoa Idosa — Lei nº 10.741/2003",
                                        desc: "Assegura desconto de pelo menos 50% a pessoas com 60 anos ou mais em eventos artísticos, culturais, esportivos e de lazer.",
                                    },
                                    { nome: "Legislações estaduais e municipais", desc: "Outras regras podem ser aplicáveis conforme o local de realização do evento." },
                                ].map((l) => (
                                    <li key={l.nome} className="flex items-start gap-2.5 py-3">
                                        <Scales02 className="mt-0.5 size-4 shrink-0 text-fg-quaternary" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-secondary">{l.nome}</p>
                                            <p className="mt-0.5 text-sm leading-relaxed text-tertiary">{l.desc}</p>
                                        </div>
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
                                    titulo: "Comprei a categoria de meia-entrada errada. O que faço?",
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
