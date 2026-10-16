import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertTriangle, ArrowLeft } from "@untitledui/icons";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import type { ProgressIconType } from "@/components/application/progress-steps/progress-types";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { EtapaCompacta, FOCO_ESCOPO } from "../pos-compra-ui";

/**
 * A etapa no endereço, para o voltar do navegador ser uma etapa para trás.
 *
 * O fluxo virou tela justamente para ter endereço, mas só as unidades viajavam nele: a etapa era
 * estado do componente, e o gesto de voltar do trackpad saía do fluxo inteiro, levando junto a
 * seleção e as respostas já digitadas, sem perguntar nada. Agora cada avanço deixa uma entrada
 * `?etapa=N` no histórico, e voltar no navegador recua uma etapa, igual à seta do cabeçalho.
 *
 * Quem guarda o índice continua sendo cada fluxo; aqui ele só é espelhado. Para o recarregar cair
 * no mesmo passo falta a outra metade, que é cada wizard nascer lendo `?etapa=`.
 */
function useEtapaNaUrl(indiceAtual: number, onVoltar: () => void, sincronizar: boolean) {
    const [params, setParams] = useSearchParams();
    const naUrl = params.has("etapa") ? Number(params.get("etapa")) : null;
    /* Último índice que nós mesmos escrevemos: é ele que separa "o fluxo mudou de etapa" de
       "a URL mudou sozinha", que é o voltar do navegador. */
    const escrito = useRef(indiceAtual);
    /* O fluxo recria `onVoltar` a cada render; a ref tira isso das dependências do efeito. */
    const voltarRef = useRef(onVoltar);
    voltarRef.current = onVoltar;

    useEffect(() => {
        if (!sincronizar || naUrl === indiceAtual) {
            escrito.current = indiceAtual;
            return;
        }

        if (escrito.current === indiceAtual && naUrl !== null && naUrl < indiceAtual) {
            /* Voltou no navegador: o fluxo recua uma etapa por vez até alcançar a URL. */
            escrito.current = indiceAtual - 1;
            voltarRef.current();
            return;
        }

        /* O fluxo mudou de etapa, ou o avançar do navegador pediu uma etapa que não dá para
           refazer daqui, porque ela pode nem estar liberada: a URL passa a dizer onde o fluxo
           está. Avançar empilha, para o voltar ter o que consumir; recuar substitui, senão
           sobram duas entradas de histórico apontando para a mesma etapa. */
        const empilhar = indiceAtual > escrito.current;
        escrito.current = indiceAtual;
        const proximos = new URLSearchParams(params);
        proximos.set("etapa", String(indiceAtual));
        setParams(proximos, { replace: !empilhar });
    }, [sincronizar, indiceAtual, naUrl, params, setParams]);
}

/**
 * Casca compartilhada dos três fluxos de alteração (troca, transferência, formulário).
 *
 * É uma TELA, não um modal, como na bilheteria: o fluxo tem rota própria, então recarregar não
 * perde o endereço e o link leva um colega ao mesmo lugar. O fundo vem do BackstageLayout, que
 * já é `bg-primary_alt`.
 *
 * Voltar tem um comportamento só: uma etapa para trás, e para fora do fluxo quando já está na
 * primeira. O voltar do navegador faz o mesmo, e sair com trabalho em andamento pergunta antes.
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
    trabalhoEmAndamento,
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
    /** Há algo a perder se o fluxo fechar ou a aba recarregar agora. Por padrão a casca deduz
     *  do que ela mesma enxerga; um fluxo que saiba exatamente o que é trabalho diz aqui. */
    trabalhoEmAndamento?: boolean;
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

    useEtapaNaUrl(indiceAtual, onVoltar, etapas.length > 1);

    /* Enquanto a cobrança não é criada não existe rascunho, então sair é descartar. Sem o aviso
       do fluxo, a casca deduz do que ela mesma enxerga: já passou da primeira etapa, ou o botão
       de avançar liberou, que nos três fluxos é o que acende quando o atendente escolheu ou
       digitou alguma coisa. Numa casca de etapa única não há o que guardar. */
    const temTrabalho = trabalhoEmAndamento ?? (etapas.length > 1 && (indiceAtual > 0 || podeAvancar));
    const [confirmandoSaida, setConfirmandoSaida] = useState(false);

    /* Recarregar e fechar a aba levam o fluxo junto, e o aviso do navegador é a única chance de
       segurar o gesto antes que ele aconteça. Num fluxo recém-aberto seria pedágio sem motivo. */
    useEffect(() => {
        if (!temTrabalho) return;
        const aoDescarregar = (evento: BeforeUnloadEvent) => {
            evento.preventDefault();
            evento.returnValue = "";
        };
        window.addEventListener("beforeunload", aoDescarregar);
        return () => window.removeEventListener("beforeunload", aoDescarregar);
    }, [temTrabalho]);

    /* Na primeira etapa, voltar é sair do fluxo: aí a pergunta vem antes. Nas outras é só uma
       etapa para trás, que não perde nada. */
    const voltar = () => (indiceAtual === 0 && temTrabalho ? setConfirmandoSaida(true) : onVoltar());

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
                <ButtonUtility size="sm" color="tertiary" className="max-md:size-11" icon={ArrowLeft} tooltip={indiceAtual === 0 ? "Voltar para o pedido" : "Voltar uma etapa"} onClick={voltar} />
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

            {/* Sair daqui descarta o que foi montado, e o atendente está ao telefone: a pergunta
                diz o que se perde e abre com a ação de ficar, que é a saída segura. Fechar no Esc
                ou no fundo é continuar montando, não sair. */}
            <ModalOverlay isOpen={confirmandoSaida} onOpenChange={(aberto) => !aberto && setConfirmandoSaida(false)} isDismissable>
                <Modal>
                    <Dialog>
                        <div className={cx("w-full max-w-lg rounded-xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary", FOCO_ESCOPO)}>
                            <div className="flex items-start gap-4">
                                <FeaturedIcon icon={AlertTriangle} color="warning" theme="light" size="md" />
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-lg font-semibold text-primary">Sair e descartar esta alteração?</h2>
                                    <p className="mt-1 text-sm text-tertiary">O que foi escolhido e digitado aqui não fica guardado. Nada foi cobrado e nada fica registrado no pedido.</p>
                                </div>
                            </div>
                            {/* No telefone a ação de ficar sobe para o alcance do polegar, e as duas
                                ocupam a linha inteira. */}
                            <div className="mt-6 flex justify-end gap-3 max-md:flex-col-reverse">
                                <Button
                                    size="md"
                                    color="secondary-destructive"
                                    className="max-md:w-full"
                                    onClick={() => {
                                        setConfirmandoSaida(false);
                                        onVoltar();
                                    }}
                                >
                                    Sair e descartar
                                </Button>
                                <Button size="md" autoFocus className="max-md:w-full" onClick={() => setConfirmandoSaida(false)}>
                                    Continuar montando
                                </Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </div>
    );
}
