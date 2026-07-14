/** Conteúdo do anexo "Laudo ou documento comprobatório": laudo caracterizador de deficiência (scan). */
export function LaudoView() {
    return (
        <div className="mx-auto w-full max-w-[720px] rounded-lg bg-white px-10 py-10 text-gray-900 shadow-lg">
            {/* Título */}
            <h2 className="text-center text-base font-bold">LAUDO CARACTERIZADOR DE DEFICIÊNCIA</h2>
            <p className="mt-2 text-center text-[11px] leading-4 font-medium text-gray-700">
                De acordo com os dispositivos da Convenção sobre os Direitos das Pessoas com deficiência, Lei Brasileira
                de Inclusão – Estatuto da Pessoa com Deficiência - Lei 13.146/2015, Lei 12764/12, Decreto 3.298/1999 e da
                Instrução Normativa SIT/ MTE n.º 98 de 15/08/2012.
            </p>

            {/* Formulário (bordas) */}
            <div className="mt-4 border border-gray-800 text-[11px]">
                <div className="grid grid-cols-2">
                    <div className="border-r border-b border-gray-800 px-2 py-3">
                        <span className="font-semibold">Nome:</span>
                    </div>
                    <div className="border-b border-gray-800 px-2 py-3">
                        <span className="font-semibold">CPF:</span>
                    </div>
                </div>
                <div className="grid grid-cols-2">
                    <div className="border-r border-b border-gray-800 px-2 py-3">
                        <span className="font-semibold">CID:</span>
                    </div>
                    <div className="border-b border-gray-800 px-2 py-2">
                        <p className="font-semibold">Origem da deficiência:</p>
                        <p className="mt-1 text-[10px] text-gray-700">
                            Congênita &nbsp; Acid./Doença do trabalho &nbsp; Acid. Comum &nbsp; Doença comum &nbsp;
                            Adquirida pós operatório
                        </p>
                    </div>
                </div>
                <div className="border-b border-gray-800 px-2 py-3">
                    <p className="font-semibold">
                        Descrição <span className="underline">detalhada</span> dos impedimentos (alterações) nas funções e
                        estruturas do corpo (física, auditiva, visual, intelectual e mental - psicossocial).
                    </p>
                    <p className="mt-1 text-[10px] text-gray-600">
                        Utilizar folhas adicionais, se necessário. Adicionar as informações e exames complementares
                        solicitados abaixo para cada tipo de deficiência.
                    </p>
                    <div className="mt-6 space-y-3">
                        <div className="h-px w-full bg-gray-200" />
                        <div className="h-px w-full bg-gray-200" />
                        <div className="h-px w-full bg-gray-200" />
                    </div>
                </div>
                <div className="border-b border-gray-800 px-2 py-3">
                    <p className="font-semibold">
                        Descrição das limitações no desempenho de atividades da vida diária e restrições de participação
                        social, (informar se necessita de apoios – órteses, próteses, softwares, ajudas técnicas, cuidador
                        etc.). Utilizar folhas adicionais, se necessário.
                    </p>
                    <div className="mt-6 space-y-3">
                        <div className="h-px w-full bg-gray-200" />
                        <div className="h-px w-full bg-gray-200" />
                    </div>
                </div>
                <div className="grid grid-cols-2">
                    <div className="border-r border-gray-800 px-2 py-3">
                        <p className="font-bold">I- Deficiência Física</p>
                        <p className="mt-1 text-[10px] text-gray-700">
                            alteração completa ou parcial de um ou mais segmentos do corpo humano, acarretando o
                            <span className="underline"> comprometimento da função física</span>, apresentando-se sob a
                            forma de: paraplegia, paraparesia, monoplegia, monoparesia...
                        </p>
                    </div>
                    <div className="px-2 py-3">
                        <p className="font-bold">III a- Visão Monocular</p>
                        <p className="mt-1 text-[10px] text-gray-700">
                            conforme parecer CONJUR/MTE 444/11: cegueira, na qual a acuidade visual com a melhor correção
                            óptica é igual ou menor que 0,05 (20/400) em um olho (ou cegueira declarada por
                            oftalmologista).
                        </p>
                    </div>
                </div>
            </div>

            <p className="mt-6 text-center text-[10px] text-gray-400">
                Documento comprobatório enviado pelo solicitante · página 1
            </p>
        </div>
    );
}
