import { useEffect, useRef, useState, type ReactNode } from "react";

const TITLE_FONT = "'Outfit', -apple-system, 'Segoe UI', Roboto, sans-serif";
const BODY_FONT = "'Work Sans', -apple-system, 'Segoe UI', Roboto, sans-serif";
const ACCENT = "#0099FF";
const LINK = "#0099FF";
const TOTAL_ITENS = 4;

/** Observa todos os itens e mantém o índice do que está sendo lido (cruzando uma faixa fina no centro vertical da viewport). */
function useLeituraAtual(total: number) {
    const [ativo, setAtivo] = useState(0);
    const elementos = useRef<(HTMLElement | null)[]>([]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    const indice = elementos.current.findIndex((el) => el === entry.target);
                    if (indice !== -1) setAtivo(indice);
                });
            },
            { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
        );
        elementos.current.forEach((el) => el && observer.observe(el));
        return () => observer.disconnect();
    }, [total]);

    const registrar = (indice: number) => (el: HTMLDivElement | null) => {
        elementos.current[indice] = el;
    };

    return { ativo, registrar };
}

function InfoItem({
    titulo,
    ativo,
    children,
    itemRef,
}: {
    titulo?: string;
    ativo?: boolean;
    children: ReactNode;
    itemRef?: (el: HTMLDivElement | null) => void;
}) {
    return (
        <div
            ref={itemRef}
            className="flex w-full flex-col gap-4 bg-white py-4 pl-6 transition-[border-color] duration-300 ease-linear"
            style={{ borderLeft: `4px solid ${ativo ? ACCENT : "#F5F5F5"}` }}
        >
            {titulo && (
                <p className="text-lg font-semibold" style={{ fontFamily: BODY_FONT, color: "#171717" }}>
                    {titulo}
                </p>
            )}
            <div className="flex flex-col gap-4 text-base leading-[1.5]" style={{ fontFamily: BODY_FONT, color: "#404040" }}>
                {children}
            </div>
        </div>
    );
}

function Link({ href, children }: { href?: string; children: ReactNode }) {
    return (
        <a href={href} target={href ? "_blank" : undefined} rel={href ? "noreferrer" : undefined} className="font-medium" style={{ color: LINK }}>
            {children}
        </a>
    );
}

export function InformacoesSection() {
    const { ativo, registrar } = useLeituraAtual(TOTAL_ITENS);

    return (
        <section id="informacoes" className="relative bg-white">
            <div className="relative mx-auto max-w-[1240px] px-6 py-[72px]">
                <div className="max-w-[740px]">
                    <h2
                        className="sticky top-16 z-10 bg-white pt-6 pb-6 text-2xl font-black uppercase tracking-[-1px] md:text-[48px] md:tracking-[-1.5px]"
                        style={{ fontFamily: TITLE_FONT, color: "#171717" }}
                    >
                        Informações Gerais
                    </h2>

                    <div className="mt-6 flex flex-col">
                    <InfoItem ativo={ativo === 0} itemRef={registrar(0)}>
                        <p>
                            A 100ª Corrida Internacional de São Silvestre, criada pelo jornalista Cásper Líbero, será realizada no dia 31 de dezembro de 2025, com largada na Avenida
                            Paulista, na cidade de São Paulo/SP, e percurso de 15 km.
                        </p>
                        <p>
                            O evento é destinado a participantes de todos os sexos, devidamente inscritos e aptos para a prática esportiva. A corrida é uma propriedade da Fundação
                            Cásper Líbero (FCL), com realização do site Gazeta Esportiva, promoção da TV Gazeta e organização Vega Sports (Vega).
                        </p>
                        <p>
                            Regulamento oficial disponível em: <Link href="https://www.saosilvestre.com.br/">www.saosilvestre.com.br</Link>
                            <br />
                            Informações sobre anúncios: <Link href="https://tvgazeta.business/produtos/sao-silvestre/">tvgazeta.business/produtos/sao-silvestre</Link>
                        </p>
                        <p>
                            <span className="font-semibold">Realização:</span> Fundação Cásper Líbero
                            <br />
                            <span className="font-semibold">Organização:</span> Vega Sports
                            <br />
                            <span className="font-semibold">Vendas:</span> <span className="text-[#525252]">TicketSports by Ingresse</span>
                        </p>
                    </InfoItem>

                    <InfoItem titulo="Horários de largada previstos" ativo={ativo === 1} itemRef={registrar(1)}>
                        <p className="whitespace-pre-line">
                            07h25 Pelotão PCDs (Cadeirantes – CAD){"\n"}
                            07h40 Pelotão Elite A/B (Feminino){"\n"}
                            08h05 Pelotão Elite A/B (Masculino){"\n"}
                            08h06 Pelotão PCDs (demais modalidades){"\n"}
                            08h08 Pelotão Premium (Feminino e Masculino){"\n"}
                            08h10 Pelotão Geral (Feminino e Masculino)
                        </p>
                    </InfoItem>

                    <InfoItem titulo="Programação" ativo={ativo === 2} itemRef={registrar(2)}>
                        <ul className="flex list-none flex-col gap-3">
                            <li>
                                <span className="font-medium">1 Tempo de conclusão de prova abaixo de 1h15</span>
                                <br />
                                <span className="text-[#737373]">Pace abaixo de 5' (Pelotão Azul – lado par)</span>
                            </li>
                            <li>
                                <span className="font-medium">2 Tempo de conclusão de prova até 1h23</span>
                                <br />
                                <span className="text-[#737373]">Pace 5:01 até 5:30 (Pelotão Azul – lado ímpar)</span>
                            </li>
                            <li>
                                <span className="font-medium">3 Tempo de conclusão de prova até 1h30</span>
                                <br />
                                <span className="text-[#737373]">Pace 5:31 até 6:00 (Pelotão Verde – lado par)</span>
                            </li>
                            <li>
                                <span className="font-medium">4 Tempo de conclusão de prova até 1h38</span>
                                <br />
                                <span className="text-[#737373]">Pace 6:00 até 6:30 (Pelotão Verde – lado ímpar)</span>
                            </li>
                            <li>
                                <span className="font-medium">5 Tempo de conclusão de prova até 1h45</span>
                                <br />
                                <span className="text-[#737373]">Pace 6:30 até 7:00 (Pelotão Vermelho – lado par)</span>
                            </li>
                            <li>
                                <span className="font-medium">6 Tempo de conclusão de prova até 2h20</span>
                                <br />
                                <span className="text-[#737373]">Pace acima de 7:00 (Pelotão Vermelho – lado ímpar)</span>
                            </li>
                        </ul>
                        <p>
                            As largadas do Pelotão Geral serão feitas em ondas de acordo com o pace escolhido na hora da inscrição e será divulgado com antecedência no site e no
                            e-mail de cadastro de cada atleta.
                        </p>
                        <p>
                            Os atletas deverão dirigir-se ao local de sua largada com pelo menos 45 minutos de antecedência. O atleta que iniciar o evento após o horário previsto
                            para a largada poderá ser desclassificado e impedido de participar do evento.
                        </p>
                    </InfoItem>

                    <InfoItem titulo="Participação de atletas com 60 anos ou mais" ativo={ativo === 3} itemRef={registrar(3)}>
                        <p>
                            Idosos acima de 60 anos terão desconto de 50% sobre o valor do Kit Básico, de acordo com o período do lote, não se aplicando ao Kit Centenário ou
                            Premium.
                        </p>
                        <p>
                            Visando a melhor experiência dos participantes e considerando o aumento no número de fraudes publicamente presenciadas e divulgadas em edições
                            anteriores, em que uma pessoa com 60 anos ou mais se inscreve e cede posteriormente a inscrição a terceiros, neste ano haverá uma área especial na
                            entrega de kit para melhor atender e realizar a verificação de documentos da pessoa inscrita nesta categoria. Para efeito de classificação, fácil
                            reconhecimento e monitoramento, o número de peito desta categoria será diferenciado. A chegada da prova também contará com câmeras para identificação
                            de todos os atletas participantes.
                        </p>
                        <p>
                            Nossos canais de atendimentos exclusivos para solução de casos dessa natureza estão à sua disposição:{" "}
                            <Link href="mailto:faleconosco@saosilvestre.com.br">faleconosco@saosilvestre.com.br</Link>
                        </p>
                    </InfoItem>
                    </div>
                </div>
            </div>
        </section>
    );
}
