import { useState } from "react";
import { MinusCircle, PlusCircle } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { SOMBRA_BOTAO } from "../../components/RevendaHeader";

interface QA {
    q: string;
    /** Uma linha por parágrafo (o Figma quebra a 1ª resposta em 7 linhas). */
    a: string[];
}

/** Trechos que aparecem em Bold dentro das respostas. */
const NEGRITO = ["Pra sua galera:", "Pra nossa galera:", "Quer vender mais rápido?"];

const ITENS: QA[] = [
    {
        q: "Como posso vender meu ingresso pela Ingresse?",
        a: [
            "Acesse o evento em seus ingressos, toque no ingresso desejado e clique em “Vender”.",
            "Após definir o preço, você pode optar compartilhar o link para vender para seus amigos ou deixar que a Ingresse faça a tentativa de venda por você.",
            "Pra sua galera: geramos um link de venda que você pode compartilhar com quem quiser.",
            "Pra nossa galera: por padrão, deixamos ativa a venda automática e a Ingresse tenta vender pra você. Apenas mantenha a opção ativa para que isso aconteça.",
            "Quer vender mais rápido? Você também pode manter o Fastpass ativo para aumentar suas chances.",
            "A Ingresse gerencia todo o processo de pagamento e segurança, além de transferir a titularidade dos ingressos para evitar dor de cabeça na entrada do evento.",
            "A transação é totalmente protegida pela Ingresse para quem compra e quem vende.",
        ],
    },
    {
        q: "Qual preço eu posso cobrar na Revenda dos meus ingressos online?",
        a: ["Você define o preço respeitando o limite permitido pela plataforma e pela legislação — nunca acima do valor de face acrescido das taxas aplicáveis."],
    },
    {
        q: "Como sei se o ingresso foi revendido?",
        a: ["Assim que a venda é concluída, você recebe uma notificação e o valor é creditado conforme a forma de recebimento escolhida."],
    },
    {
        q: "Como recebo o dinheiro da Revenda Ingresse? É confiável?",
        a: ["O pagamento é processado com segurança pela Ingresse e repassado a você após a confirmação da venda. Todo o fluxo é protegido, sem contato direto com o comprador."],
    },
    {
        q: "Preciso falar com quem vai comprar ou vender ingressos?",
        a: ["Não. A Ingresse intermedia toda a negociação — pagamento, transferência de titularidade e segurança — sem necessidade de contato entre as partes."],
    },
    {
        q: "Qualquer ingresso pode ser revendido na Revenda Ingresse?",
        a: ["A revenda está disponível para eventos participantes. Alguns ingressos podem ter regras específicas definidas pelo organizador do evento."],
    },
    {
        q: "Quais são as melhores formas de vender meu ingresso?",
        a: ["Você pode compartilhar o link de venda com a sua galera ou ativar a venda automática para que a Ingresse encontre um comprador por você. O Fastpass aumenta suas chances de vender mais rápido."],
    },
    {
        q: "E se eu quiser desistir da venda do meu ingresso?",
        a: ["Enquanto o ingresso não for vendido, você pode cancelar a oferta a qualquer momento direto no seu painel de ingressos."],
    },
];

const Linha = ({ texto }: { texto: string }) => {
    const pre = NEGRITO.find((p) => texto.startsWith(p));
    if (!pre) return <p className="text-base leading-6 text-[#525252]">{texto}</p>;
    return (
        <p className="text-base leading-6 text-[#525252]">
            <strong className="font-bold">{pre}</strong>
            {texto.slice(pre.length)}
        </p>
    );
};

export function Faq({ onVender }: { onVender?: () => void }) {
    const [aberto, setAberto] = useState(0);

    return (
        <section className="bg-white pt-[72px] pb-[72px] lg:pt-8 lg:pb-24">
            {/* Título (frame próprio de 768px no Figma) */}
            <div className="mx-auto flex max-w-[768px] flex-col gap-2 px-4 text-center lg:px-6">
                <h2 className="text-[32px] leading-[1.2] font-bold text-black uppercase lg:text-4xl">Quer saber mais?</h2>
                <p className="text-xl leading-[30px] font-bold text-[#ff4a40]">A gente te explica</p>
            </div>

            {/* Acordeão */}
            <div className="mx-auto max-w-[1280px] px-4 lg:px-8">
                <div className="mt-16 flex flex-col gap-4">
                    {ITENS.map((item, i) => {
                        const open = aberto === i;
                        return (
                            <div key={item.q} className={cx("rounded-2xl p-6 transition duration-100 ease-linear", open ? "bg-[#f5f5f5]" : "bg-transparent")}>
                                <button
                                    type="button"
                                    onClick={() => setAberto(open ? -1 : i)}
                                    className="flex w-full items-start gap-4 text-left"
                                >
                                    {open ? (
                                        <MinusCircle className="size-6 shrink-0 text-[#a3a3a3]" aria-hidden="true" />
                                    ) : (
                                        <PlusCircle className="size-6 shrink-0 text-[#a3a3a3]" aria-hidden="true" />
                                    )}
                                    <span className="text-base leading-6 font-semibold text-[#171717]">{item.q}</span>
                                </button>

                                <div className={cx("overflow-hidden pl-10 transition-all duration-200 ease-linear", open ? "max-h-[900px]" : "max-h-0")}>
                                    <div className="mt-1 flex flex-col gap-1">
                                        {item.a.map((linha) => (
                                            <Linha key={linha} texto={linha} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-16 flex justify-center">
                    <button
                        type="button"
                        onClick={onVender}
                        className={`rounded-lg bg-[#ff271a] px-5 py-3 text-base leading-6 font-semibold text-white transition duration-100 ease-linear hover:bg-[#e11b10] ${SOMBRA_BOTAO}`}
                    >
                        Quero vender meu ingresso
                    </button>
                </div>
            </div>
        </section>
    );
}
