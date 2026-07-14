/** Documento "Termos de Serviço" — página clara, rolável na íntegra (substitui o mock de imagem). */
export function TermosPreview() {
    return (
        <div className="mx-auto w-full max-w-[720px] rounded-lg bg-white px-10 py-12 text-gray-800 shadow-lg">
            {/* Cabeçalho */}
            <div className="flex flex-col items-center gap-1 text-center">
                <div className="text-lg font-black tracking-tight text-gray-900">◭ INGRESSE</div>
                <span className="text-[11px] font-semibold tracking-[0.12em] text-[#ff271a] uppercase">
                    Sobre a Ingresse
                </span>
            </div>

            <p className="mt-6 text-center text-sm italic text-gray-500">
                Essa página apresenta, abaixo, o "Termos de Serviço" em três idiomas: português, espanhol e inglês.
                <br />
                Esta página presenta, a continuación, los "Términos y Condiciones del Servicio" en los tres idiomas:
                português, español e inglés.
                <br />
                This page presents, below, the "Terms of Service" in three languages: Portuguese, Spanish, and English.
            </p>

            <h1 className="mt-8 text-center text-2xl font-bold text-gray-900">Termos de Serviço</h1>
            <p className="mt-2 text-center text-sm italic text-gray-500">Atualizado pela última vez em 10 de janeiro de 2024.</p>

            <p className="mt-6 text-sm leading-6 text-gray-700">
                O presente acordo tem por finalidade explicitar as regras e condições que regerão o relacionamento entre a
                INGRESSE — INGRESSOS PARA EVENTOS S.A. ("Ingresse") e os USUÁRIOS da plataforma para divulgação e organização
                de eventos e disponibilização de INGRESSOS para compra e venda no endereço eletrônico INGRESSE.COM, aplicando-se
                a todos os nossos serviços de licenciamento e manutenção da plataforma da Ingresse disponibilizados aos usuários,
                sejam compradores ou vendedores. Ao entrar, navegar e utilizar o nosso website ou qualquer outro aplicativo através
                de qualquer meio (aqui referido, de forma geral, como "plataforma"), você aceita ter lido e estar de acordo com os
                termos e condições citados abaixo (inclusive a Política de Privacidade).
            </p>

            <Secao numero="1" titulo="Definição do serviço">
                A Ingresse é uma plataforma tecnológica online disponibilizada aos seus usuários compradores e vendedores para que
                eles possam divulgar seus eventos e transacionar ingressos entre si. A Ingresse não está envolvida diretamente na
                organização de quaisquer dos eventos anunciados, atuando exclusivamente como intermediadora da relação entre
                organizadores e compradores.
            </Secao>

            <Secao numero="2" titulo="Cadastro e conta de usuário">
                Para utilizar a plataforma, o usuário deverá realizar um cadastro fornecendo informações verdadeiras, exatas e
                atualizadas. O usuário é o único responsável pela guarda e confidencialidade de suas credenciais de acesso,
                respondendo por todas as atividades realizadas em sua conta. A Ingresse poderá, a seu critério, recusar,
                suspender ou cancelar cadastros que violem estes termos.
            </Secao>

            <Secao numero="3" titulo="Compra e venda de ingressos">
                As transações realizadas na plataforma estão sujeitas à disponibilidade e às condições estabelecidas pelo
                organizador do evento. O comprador declara estar ciente de que o ingresso adquirido é pessoal e intransferível,
                salvo quando a funcionalidade de transferência for expressamente disponibilizada. Os valores, taxas de serviço e
                formas de pagamento serão apresentados de forma clara antes da conclusão da compra.
            </Secao>

            <Secao numero="4" titulo="Política de reembolso">
                O reembolso seguirá as regras definidas pelo organizador e a legislação aplicável, incluindo o direito de
                arrependimento previsto no Código de Defesa do Consumidor. Solicitações de reembolso deverão ser realizadas pelos
                canais oficiais, dentro dos prazos indicados para cada evento.
            </Secao>

            <Secao numero="5" titulo="Responsabilidades e limitações">
                A Ingresse envidará seus melhores esforços para manter a plataforma disponível e segura, mas não garante o
                funcionamento ininterrupto ou livre de erros. A Ingresse não se responsabiliza pela realização, qualidade,
                cancelamento ou alteração dos eventos, que são de responsabilidade exclusiva dos organizadores.
            </Secao>

            <Secao numero="6" titulo="Proteção de dados">
                O tratamento de dados pessoais observará a Lei Geral de Proteção de Dados (LGPD) e a Política de Privacidade da
                Ingresse. Ao utilizar a plataforma, o usuário concorda com a coleta e o uso de seus dados nos termos ali descritos.
            </Secao>

            <Secao numero="7" titulo="Disposições gerais">
                A Ingresse poderá alterar estes termos a qualquer momento, comunicando os usuários por meio da própria plataforma.
                O uso continuado após as alterações implica concordância com a nova versão. Fica eleito o foro da Comarca de São
                Paulo/SP para dirimir eventuais controvérsias decorrentes destes termos.
            </Secao>

            <p className="mt-8 text-center text-xs text-gray-400">Ingresse — Ingressos para Eventos S.A. · Documento gerado automaticamente.</p>
        </div>
    );
}

function Secao({ numero, titulo, children }: { numero: string; titulo: string; children: React.ReactNode }) {
    return (
        <div className="mt-6">
            <h2 className="text-base font-bold text-[#ff271a]">
                {numero}. {titulo}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-700">{children}</p>
        </div>
    );
}
