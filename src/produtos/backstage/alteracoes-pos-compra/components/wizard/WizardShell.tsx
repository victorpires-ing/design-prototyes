import { useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft } from "@untitledui/icons";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import type { ProgressIconType } from "@/components/application/progress-steps/progress-types";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { EtapaCompacta } from "../pos-compra-ui";

/**
 * Casca compartilhada dos três fluxos de alteração (troca, transferência, formulário).
 *
 * É uma TELA, não um modal, como na bilheteria: o fluxo tem rota própria, então recarregar não
 * perde o endereço e o link leva um colega ao mesmo lugar. O fundo vem do BackstageLayout, que
 * já é `bg-primary_alt`.
 *
 * Voltar tem um comportamento só: uma etapa para trás, e para fora do fluxo quando já está na
 * primeira.
 */
export function WizardShell({
    onClose,
    titulo,
    subtitulo,
    etapas,
    indiceAtual,
    podeAvancar,
    rotuloAvancar,
    ultimaEtapa,
    rotuloConfirmar,
    onVoltar,
    onAvancar,
    onConfirmar,
    ocultarRodape = false,
    infoRodape,
    children,
}: {
    /** Sai do fluxo inteiro e volta para o pedido. */
    onClose: () => void;
    titulo: string;
    /** Sobre quem é a alteração: "{Comprador} · Pedido {id curto}". */
    subtitulo?: string;
    etapas: string[];
    indiceAtual: number;
    podeAvancar: boolean;
    rotuloAvancar: string;
    ultimaEtapa: boolean;
    /** Diz o que acontece e com quanto: "Enviar cobrança de R$ 15,30 para c***@email.com". */
    rotuloConfirmar: string;
    /** Uma etapa para trás, ou para fora do fluxo quando já está na primeira. */
    onVoltar: () => void;
    onAvancar: () => void;
    onConfirmar: () => void;
    /** Esconde a barra de ação, para etapas onde a própria escolha já avança (ex.: clicar num
     *  card de destinatário), sem um "Avançar" redundante embaixo. */
    ocultarRodape?: boolean;
    /** Estado do progresso ao lado do botão: "0 de 2 escolhidos". Fica na barra porque
     *  é ali que a pessoa procura o que falta quando o botão não libera. */
    infoRodape?: ReactNode;
    children: ReactNode;
}) {
    /* Direção do slide: avançar entra pela direita, voltar entra pela esquerda. O movimento
       acompanha o stepper e diz, sem texto, se a pessoa foi para frente ou para trás. */
    const ultimoIndice = useRef(indiceAtual);
    const direcao = useRef(1);
    if (indiceAtual !== ultimoIndice.current) {
        direcao.current = indiceAtual > ultimoIndice.current ? 1 : -1;
        ultimoIndice.current = indiceAtual;
    }
    const semMovimento = useReducedMotion();
    const deslocamento = semMovimento ? 0 : 48;

    const progressItems: ProgressIconType[] = etapas.map((titulo, i) => ({
        title: titulo,
        description: "",
        status: i < indiceAtual ? "complete" : i === indiceAtual ? "current" : "incomplete",
    }));

    return (
        <div className="flex min-w-0 flex-1 flex-col">
            {/* Mesmo cabeçalho da venda de ingressos: voltar à esquerda e o título centrado na
                página por posicionamento absoluto, que volta a ser estático no mobile, onde
                centrar ao lado do botão desalinharia os dois. */}
            <header className="relative flex items-center justify-between gap-3 px-4 py-6 max-md:justify-start md:px-6">
                {/* Uma etapa para trás, e para fora do fluxo quando já está na primeira: é o que
                    `onVoltar` sempre significou nos quatro chamadores. A seta chamava `onClose`,
                    então não havia como voltar uma etapa em lugar nenhum; o stepper do DS não é
                    clicável e os links "Alterar" que compensavam isso saíram das etapas 2. */}
                {/* `md` no telefone: é o único caminho de volta do fluxo e, em `sm`, o alvo é de
                    32px no canto mais longe do polegar. */}
                <ButtonUtility size="sm" color="tertiary" className="max-md:size-11" icon={ArrowLeft} tooltip={indiceAtual === 0 ? "Voltar para o pedido" : "Voltar uma etapa"} onClick={onVoltar} />
                <div className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 flex-col items-center text-center max-md:static max-md:translate-x-0 max-md:items-start max-md:text-left">
                    <h1 className="text-display-xs font-bold text-primary">{titulo}</h1>
                    {subtitulo && <p className="text-sm text-tertiary">{subtitulo}</p>}
                </div>
            </header>

            <div className="flex flex-1 flex-col items-center gap-6 px-4 pb-6 md:px-6">
                {etapas.length > 1 && (
                    <>
                        <Progress.IconsWithText items={progressItems} type="number" size="md" orientation="horizontal" className="max-w-[560px] max-md:hidden" />
                        <EtapaCompacta atual={indiceAtual} titulos={etapas} className="md:hidden" />
                    </>
                )}
                {/* Cada etapa nova começa do topo: sem isso, avançar de uma lista longa abria
                    a próxima etapa no meio. Agora quem rola é a página, então o alvo é a janela. */}
                <AnimatePresence
                    mode="wait"
                    initial={false}
                    custom={direcao.current}
                    onExitComplete={() => window.scrollTo({ top: 0, behavior: semMovimento ? "auto" : "smooth" })}
                >
                    <motion.section
                        key={indiceAtual}
                        custom={direcao.current}
                        variants={{
                            entra: (d: number) => ({ x: d * deslocamento, opacity: 0 }),
                            centro: { x: 0, opacity: 1 },
                            sai: (d: number) => ({ x: d * -deslocamento, opacity: 0 }),
                        }}
                        initial="entra"
                        animate="centro"
                        exit="sai"
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="flex w-full max-w-2xl flex-col gap-5 pb-6"
                    >
                        {children}
                    </motion.section>
                </AnimatePresence>
            </div>

            {/* Barra de ação colada no fim da janela, como a barra de total da bilheteria: a página
                rola por baixo dela e o botão nunca sai de alcance numa lista longa. */}
            <AnimatePresence>
                {!ocultarRodape && (
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        /* Abaixo de md a barra empilha: o texto em cima, o botão ocupando a linha. Em
                           fileira única o botão não encolhe nem quebra, e um rótulo como "Enviar cobrança
                           de R$ 120,00 para a***@email.com" passava da largura da tela e levava a ação
                           principal para fora dela, com rolagem lateral na barra colada no rodapé. */
                        className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-secondary bg-primary_alt px-4 py-4 max-md:flex-col max-md:items-stretch max-md:gap-2 md:px-6"
                    >
                        {/* Só existe quando tem o que dizer: empilhada, a div vazia abria um vão acima do botão. */}
                        {infoRodape && <div className="min-w-0 text-sm text-tertiary">{infoRodape}</div>}
                        {/* `whitespace-normal` deixa o rótulo quebrar em duas linhas em vez de estourar a
                           barra: todo botão do DS é nowrap, e quem passa o rótulo é cada fluxo. */}
                        {ultimaEtapa ? (
                            <Button size="md" className="max-md:w-full max-md:whitespace-normal md:ml-auto" isDisabled={!podeAvancar} onClick={onConfirmar}>
                                {rotuloConfirmar}
                            </Button>
                        ) : (
                            <Button size="md" className="max-md:w-full max-md:whitespace-normal md:ml-auto" isDisabled={!podeAvancar} onClick={onAvancar}>
                                {rotuloAvancar}
                            </Button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
