import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, SearchLg } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { InputBase } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { Aviso, CampoMotivo, MOTIVO_INICIAL, Regra, ResumoFinanceiro, SetaParaBaixo, iniciaisDe, formatarCPF, mascararEmail } from "../pos-compra-ui";
import {
    COBRANCA_TROCA_PERGUNTAS,
    buscarContas,
    calcularTrocaTitularidade,
    criarSolicitacao,
    disponivelPara,
    formatarMoeda,
    getConta,
    getFormulario,
    getItem,
    motivoValido,
    titularDaLinha,
    usePerguntas,
    uuidCurto,
    validarNovoTitular,
    type Conta,
    type Motivo,
    type Pedido,
    type PedidoItem,
    type Pergunta,
} from "../../data/pos-compra-store";
import { WizardShell } from "./WizardShell";
import { EditorResposta } from "../respostas-ui";
import { ResumoUnidades, SeletorUnidades, detalheDoItem, identidadeDaLinha } from "./seletor-unidades";

/*
  Sem etapa de formulário: a titularidade NÃO altera respostas. O novo possuidor
  herda todas (576978948 §4 e H-23); mudar resposta é a Troca de perguntas, feita
  depois e como operação separada (§10, C12).
*/
type Etapa = "itens" | "destinatario" | "formulario" | "revisao";

const TITULO_ETAPA: Record<Etapa, string> = {
    itens: "Itens",
    destinatario: "Destinatário",
    formulario: "Formulário",
    revisao: "Confirmar",
};

/** Só o primeiro nome. O rótulo da etapa divide uma faixa de 560px com outros dois e, com o nome
 *  inteiro, "Itens para Ana Paula Souza" empurra o stepper para duas linhas. */
const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0];

/** "a alteração" / "as 3 alterações": a frase da revisão muda de número com o que foi mexido. */
const contarAlteradas = (quantas: number) => (quantas === 1 ? "a alteração" : `as ${quantas} alterações`);

/** "A, B e C". Em português o último nome entra com "e", não com vírgula. */
const listarNomes = (nomes: string[]) => (nomes.length < 2 ? nomes.join("") : `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`);

/** Teto da lista quando há espaço de sobra, e o respiro até a borda que a recorta. */
const ALTURA_SUGESTOES = 288;
const FOLGA_SUGESTOES = 12;
/** Cerca de duas sugestões. Abaixo disso compensa abrir a lista para cima. */
const MINIMO_SUGESTOES = 132;

/**
 * Até onde a lista pode descer sem ser recortada: a janela, interceptada com todo
 * ancestral que esconde o que passa da borda. O overlay é um desses — a lista nascia
 * com 288px fixos, era pintada para fora dele e as sugestões de baixo não recebiam
 * clique nenhum (elementFromPoint devolvia nada nelas).
 *
 * A base vem do viewport VISUAL, não de `window.innerHeight`: no iOS o teclado não muda
 * `innerHeight`, então a conta achava que havia tela sobrando embaixo do campo e desenhava
 * metade da lista atrás do teclado, justamente quando ele está aberto, que é o tempo todo
 * nesta busca.
 */
const areaVisivel = (no: HTMLElement) => {
    let topo = 0;
    const vv = window.visualViewport;
    let base = vv ? vv.offsetTop + vv.height : window.innerHeight;
    for (let pai = no.parentElement; pai; pai = pai.parentElement) {
        const estilo = getComputedStyle(pai);
        if (estilo.overflowY === "visible" && estilo.overflowX === "visible") continue;
        const caixa = pai.getBoundingClientRect();
        topo = Math.max(topo, caixa.top);
        base = Math.min(base, caixa.bottom);
    }
    return { topo, base };
};

interface TransferirTitularidadeWizardProps {
    pedido: Pedido;
    linhasIniciais: string[];
    onFechar: () => void;
    /** Cobrança criada: o pedido rola até o cartão novo. */
    onEnviado: (solicitacaoId: string) => void;
}

/** E-mail e CPF de uma conta. No telefone o CPF ganha linha própria: na mesma linha do e-mail
 *  sobravam 210px para 46 caracteres, e o pedaço que o truncate comia era o documento, que é
 *  justamente como o atendente separa duas contas de mesmo nome. */
const IdentidadeConta = ({ conta }: { conta: Conta }) => (
    <>
        <span className="block truncate text-sm text-tertiary">
            {conta.email}
            {conta.cpf && <span className="hidden md:inline"> · CPF {formatarCPF(conta.cpf)}</span>}
        </span>
        {conta.cpf && <span className="block text-sm tabular-nums text-tertiary md:hidden">CPF {formatarCPF(conta.cpf)}</span>}
    </>
);

/**
 * As respostas de uma unidade, para conferir e corrigir. Mexer numa resposta que já existia
 * cobra a troca de perguntas, uma vez por operação; preencher pergunta em branco não cobra.
 *
 * Recolhida quando há mais de uma unidade: o formulário completo tem vinte perguntas, e três
 * unidades abertas viram sessenta linhas antes do botão.
 */
const RespostasDaUnidade = ({
    pedido,
    linha,
    perguntas,
    aberto,
    valorDe,
    alterada,
    onChange,
}: {
    pedido: Pedido;
    linha: PedidoItem;
    perguntas: Pergunta[];
    aberto: boolean;
    valorDe: (perguntaId: string) => string;
    alterada: (perguntaId: string) => boolean;
    onChange: (perguntaId: string, valor: string) => void;
}) => {
    const item = getItem(linha.itemId);
    const semResposta = perguntas.filter((p) => !valorDe(p.id).trim()).length;
    const mexidas = perguntas.filter((p) => alterada(p.id)).length;

    return (
        <details open={aberto} className="group w-full overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 transition duration-100 ease-linear hover:bg-primary_hover max-md:min-h-11 [&::-webkit-details-marker]:hidden">
                <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold text-primary">{item?.nome}</span>
                    <span className="truncate text-sm text-tertiary">{identidadeDaLinha(pedido, linha).nome}</span>
                </span>
                {mexidas > 0 ? (
                    <span className="shrink-0 text-sm text-brand-secondary">{mexidas === 1 ? "1 alterada" : `${mexidas} alteradas`}</span>
                ) : (
                    semResposta > 0 && <span className="shrink-0 text-sm text-tertiary">{semResposta === 1 ? "1 sem resposta" : `${semResposta} sem resposta`}</span>
                )}
                <ChevronDown className="size-5 shrink-0 text-fg-quaternary transition-transform duration-100 ease-linear group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="flex flex-col gap-4 border-t border-secondary px-4 py-4">
                {perguntas.map((pergunta) => (
                    <EditorResposta
                        key={pergunta.id}
                        pergunta={pergunta}
                        valor={valorDe(pergunta.id)}
                        valorOriginal={linha.respostas[pergunta.id] ?? ""}
                        onChange={(valor) => onChange(pergunta.id, valor)}
                    />
                ))}
            </div>
        </details>
    );
};

/** Quem recebe, com o caminho de volta para trocar de pessoa sem mexer no stepper. */
const CartaoDestinatario = ({ conta, onAlterar }: { conta: Conta; onAlterar: () => void }) => (
    <div className="flex w-full items-center gap-3 rounded-xl bg-primary p-4 ring-1 ring-border-secondary">
        <Avatar size="md" initials={iniciaisDe(conta.nome)} alt={conta.nome} />
        {/* Mesma identidade da busca, CPF incluído. Sem ele a conferência final, que acontece
            na tela que autoriza a cobrança e troca o dono do ingresso, era por nome e e-mail:
            com duas "Ana Paula Souza" na base, o documento é o que separa as duas. O nome sobe
            um degrau para parar de pesar igual ao lote do ingresso logo acima. */}
        <div className="min-w-0 flex-1">
            <p className="truncate text-md font-semibold text-primary">{conta.nome}</p>
            <IdentidadeConta conta={conta} />
        </div>
        {/* `link-color` carrega `p-0!`, então padding não pega: a altura mínima é o que leva o
            alvo aos 44px sem tocar o design system. */}
        <Button size="sm" color="link-color" className="max-md:min-h-11 max-md:px-2" onClick={onAlterar}>
            Alterar
        </Button>
    </div>
);

export function TransferirTitularidadeWizard({ pedido, linhasIniciais, onFechar, onEnviado }: TransferirTitularidadeWizardProps) {
    const perguntas = usePerguntas();
    const linhasDisponiveis = pedido.itens.filter((l) => disponivelPara(pedido, l, "transferir"));

    /* Sempre pela porta da frente. Antes, vir do kebab de uma linha pulava para a etapa 2 porque
       o item já era conhecido; com o destinatário primeiro, a unidade escolhida só aparece
       pré-marcada na etapa de itens e a entrada é uma só. */
    const [indice, setIndice] = useState(0);
    const buscaRef = useRef<HTMLDivElement>(null);
    const [sugerindo, setSugerindo] = useState(false);
    /* Pedido de cursor para o campo de busca, consumido quando ele entra no DOM.

       Pelo ref e não por efeito: a etapa troca com animação, e no efeito o campo da etapa que
       está entrando ainda não existe — o foco caía no vazio e o cursor ficava na seta de voltar.
       O ref roda no instante em que o campo monta, seja qual for a duração da animação.

       Só a pedido, nunca na montagem do fluxo: abrir a transferência já com o teclado do celular
       aberto cobriria o stepper. */
    const focarBusca = useRef(false);
    const montarBusca = useCallback((no: HTMLDivElement | null) => {
        buscaRef.current = no;
        if (!no || !focarBusca.current) return;
        focarBusca.current = false;
        no.querySelector("input")?.focus();
    }, []);
    const [buscando, setBuscando] = useState(false);
    const timerBusca = useRef<number | null>(null);
    const [encaixe, setEncaixe] = useState({ altura: ALTURA_SUGESTOES, acima: false });
    const [focado, setFocado] = useState(0);
    const [busca, setBusca] = useState("");
    const [motivo, setMotivo] = useState<Motivo>(MOTIVO_INICIAL);
    const [selecionada, setSelecionada] = useState<Conta | null>(null);
    /* Trava a etapa do formulário depois que o fluxo passa por ela: desmarcar a última unidade
       com formulário encolheria o stepper com a pessoa dentro dele. */
    const [conferiuFormulario, setConferiuFormulario] = useState(false);
    /* Respostas mexidas nesta transferência, por unidade. Só o que difere do que já estava. */
    const [respostasNovas, setRespostasNovas] = useState<Record<string, Record<string, string>>>({});
    /* Conta clicada que não recebe nada do pedido: não vira destinatário e não avança. Uma frase
       só, que a etapa mostra abaixo do campo de busca. */
    const [recusada, setRecusada] = useState<string | null>(null);
    const [selecao, setSelecao] = useState<Record<string, boolean>>(() => Object.fromEntries(linhasIniciais.map((id) => [id, true])));
    const [aberta, setAberta] = useState<string | null>(null);
    const destino = selecionada?.email ?? "";

    const linhas = linhasDisponiveis.filter((l) => selecao[l.id]);
    const comprador = getConta(pedido.compradorId);
    /* De quem as unidades saem. O cabeçalho do fluxo mostra o COMPRADOR e o resumo mostra só o
       item, então o nome de quem PERDE o ingresso não aparecia em tela nenhuma: num pedido com
       dois titulares dava para confirmar a cobrança sem saber que a unidade estava com a Carol,
       que a recebeu por transferência, e não com quem comprou. */
    const titularesDeOrigem = [...new Set(linhas.map((l) => titularDaLinha(pedido, l)?.nome ?? "Comprador"))];


    /* ------------------------------------------------------------------ */
    /*  Destinatário: busca por nome, e-mail ou CPF, contra toda a base     */
    /* ------------------------------------------------------------------ */

    const termo = busca.trim();
    const encontradas = buscarContas(termo);
    const bloqueiosDaConta = (conta: Conta, contra: PedidoItem[] = linhas) =>
        contra.map((linha) => ({ linha, bloqueio: validarNovoTitular(pedido, linha, conta, linhas) })).filter((b) => b.bloqueio);
    /* Na etapa do destinatário nada está marcado ainda, então a sugestão é medida contra tudo que
       o pedido tem de transferível: só vira selo quem não pode receber NADA — o comprador, por
       exemplo. O que cabe unidade a unidade é assunto da etapa seguinte. */
    const naoRecebeNada = (conta: Conta) => linhasDisponiveis.length > 0 && bloqueiosDaConta(conta, linhasDisponiveis).length === linhasDisponiveis.length;
    /* Abre assim que há termo: a espera e o vazio também são resposta, e some os dois deixava
       o campo mudo enquanto a busca acontecia. */
    const sugestoesAbertas = sugerindo && termo.length > 0;

    /* A busca real vai ter latência; o protótipo mostra a mesma espera, entre 1s e 2s, para a
       lista não aparecer instantânea e dar uma impressão que a tela pronta não vai cumprir. */
    const agendarBusca = () => {
        if (timerBusca.current) window.clearTimeout(timerBusca.current);
        setBuscando(true);
        timerBusca.current = window.setTimeout(() => setBuscando(false), 1000 + Math.random() * 1000);
    };
    useEffect(() => () => void (timerBusca.current && window.clearTimeout(timerBusca.current)), []);

    const bloqueiosPorLinha = selecionada ? bloqueiosDaConta(selecionada) : [];

    /* O que a linha bloqueada mostra. Era só o `curto`, duas palavras ("Restrito", "Já vinculado")
       que o atendente lia como defeito do ingresso e repetia ao telefone como "esse ingresso não
       pode ser transferido", quando o mesmo ingresso iria sem problema para outra pessoa. A frase
       inteira do store diz de quem é o impedimento; onde ela chama a pessoa de "essa conta" entra
       o nome, que é como ela está sendo chamada na ligação. */
    const motivoDaConta = (conta: Conta, linha: PedidoItem): string | null => {
        const bloqueio = validarNovoTitular(pedido, linha, conta, linhas);
        if (!bloqueio) return null;
        /* Sem "a titular": o nome na frente deixa a concordância errada metade das vezes. */
        if ((linha.titularId ?? pedido.compradorId) === conta.id) return `${conta.nome} já está com esta unidade.`;
        return bloqueio.descricao.replace(/essa conta/g, conta.nome);
    };
    /* A forma que o seletor de unidades espera: a pessoa já escolhida, linha a linha. */
    const motivoParaDestinatario = (linha: PedidoItem): string | null => (selecionada ? motivoDaConta(selecionada, linha) : null);

    /* Nada do pedido pode ir para esta pessoa. Os motivos entram sem repetição: o aviso usava a
       descrição da primeira unidade como se valesse para todas, e com três unidades barradas por
       três razões diferentes ele afirmava uma e escondia duas. */
    const motivosDeTudo = selecionada && linhasDisponiveis.length > 0 ? linhasDisponiveis.map((l) => motivoParaDestinatario(l)) : [];
    const nadaPodeIr = motivosDeTudo.length > 0 && motivosDeTudo.every(Boolean);
    const motivosDistintos = nadaPodeIr ? [...new Set(motivosDeTudo as string[])] : [];

    /* ------------------------------------------------------------------ */
    /*  Formulários                                                        */
    /* ------------------------------------------------------------------ */

    const perguntasDaLinha = (linha: PedidoItem): Pergunta[] => (getFormulario(getItem(linha.itemId)?.formularioId)?.perguntaIds ?? []).map((id) => perguntas.find((p) => p.id === id)).filter(Boolean) as Pergunta[];
    const comFormulario = linhas.filter((linha) => perguntasDaLinha(linha).length > 0);
    const valorDaResposta = (linha: PedidoItem, perguntaId: string) => respostasNovas[linha.id]?.[perguntaId] ?? linha.respostas[perguntaId] ?? "";
    /* Só conta como alteração mexer no que já tinha resposta: preencher pergunta em branco é
       completar o cadastro, não trocar o que o participante respondeu. A cobrança segue essa
       distinção, e por isso ela mora aqui e não num "mudou alguma coisa". */
    const respostaAlterada = (linha: PedidoItem, perguntaId: string) => {
        const original = (linha.respostas[perguntaId] ?? "").trim();
        return original !== "" && valorDaResposta(linha, perguntaId).trim() !== original;
    };
    const alteradas = comFormulario.flatMap((linha) => perguntasDaLinha(linha).filter((p) => respostaAlterada(linha, p.id)).map((p) => ({ linha, pergunta: p })));
    const respostasPorItem = Object.fromEntries(
        comFormulario
            .map((linha) => [linha.id, Object.fromEntries(perguntasDaLinha(linha).map((p) => [p.id, valorDaResposta(linha, p.id)]))] as const)
            .filter(([linhaId]) => Object.keys(respostasNovas[linhaId] ?? {}).length > 0),
    );
    /* Depois dos derivados que ele usa: declarado antes, `alteradas` ainda estaria na zona morta
       e a etapa quebrava na montagem. */
    const calculo = calcularTrocaTitularidade(linhas, alteradas.length > 0);
    /* ------------------------------------------------------------------ */
    /*  Etapas                                                             */
    /* ------------------------------------------------------------------ */

    /* O formulário não é opcional: a titularidade não altera resposta nenhuma, mas quem recebe
       herda tudo como está, e isso precisa ser visto antes de a cobrança sair. A etapa é de
       leitura — editar resposta é a outra operação, e o rodapé da revisão diz como.

       Ela existe quando alguma unidade em transferência tem formulário, e fica fixa depois que o
       fluxo passa por ela, para o stepper não mudar de tamanho no meio do caminho.

       "Itens" é sempre a primeira etapa: vindo de uma linha, ela já nasce concluída e o fluxo
       começa no destinatário, mas "Alterar" e "Voltar" levam até ela sem fechar o overlay. */
    const temEtapaFormulario = conferiuFormulario || comFormulario.length > 0;
    const etapas: Etapa[] = ["destinatario", "itens", ...(temEtapaFormulario ? (["formulario"] as Etapa[]) : []), "revisao"];
    const etapa = etapas[Math.min(indice, etapas.length - 1)];

    /*
      Semântica de combobox no <input> real. O `Input` do DS espalha os props no
      wrapper do TextField, não no elemento, então `role` e `aria-*` passados por
      prop não chegam ao leitor de tela — conferido: voltavam null. Daí o ref.
    */
    useEffect(() => {
        const campo = buscaRef.current?.querySelector("input");
        if (!campo) return;
        campo.setAttribute("role", "combobox");
        campo.setAttribute("aria-autocomplete", "list");
        campo.setAttribute("aria-controls", "sugestoes-destinatario");
        campo.setAttribute("aria-expanded", String(sugestoesAbertas));
    }, [sugestoesAbertas, etapa]);

    /* A lista só cabe onde o overlay deixa. Mede o espaço livre abaixo do campo,
       vira para cima quando lá embaixo cabe menos, e limita a altura ao que sobrou —
       o resto a lista rola por dentro, com toda sugestão ao alcance do clique.
       Antes era um scrollIntoView("nearest") que não dava conta: a lista continuava
       maior que a área visível e metade dela ficava fora, morta. */
    useLayoutEffect(() => {
        if (!sugestoesAbertas) return;
        const medir = () => {
            const campo = buscaRef.current;
            if (!campo) return;
            const caixa = campo.getBoundingClientRect();
            const { topo, base } = areaVisivel(campo);
            const abaixo = base - caixa.bottom - FOLGA_SUGESTOES;
            const acima = caixa.top - topo - FOLGA_SUGESTOES;
            const paraCima = abaixo < MINIMO_SUGESTOES && acima > abaixo;
            setEncaixe({ altura: Math.max(96, Math.min(ALTURA_SUGESTOES, paraCima ? acima : abaixo)), acima: paraCima });
        };
        medir();
        /* O overlay rola e a janela muda de tamanho: a lista acompanha o campo,
           mas o espaço livre embaixo dele não é o mesmo. Captura pega o scroll
           do container interno, que não borbulha. */
        window.addEventListener("resize", medir);
        document.addEventListener("scroll", medir, true);
        /* Abrir e fechar o teclado no iOS não dispara `resize` na janela, só no viewport visual. */
        window.visualViewport?.addEventListener("resize", medir);
        window.visualViewport?.addEventListener("scroll", medir);
        return () => {
            window.removeEventListener("resize", medir);
            document.removeEventListener("scroll", medir, true);
            window.visualViewport?.removeEventListener("resize", medir);
            window.visualViewport?.removeEventListener("scroll", medir);
        };
    }, [sugestoesAbertas, encontradas.length]);

    /* Fecha ao clicar fora, como qualquer sugestão de busca. */
    useEffect(() => {
        if (!sugestoesAbertas) return;
        const fora = (e: MouseEvent) => {
            if (!buscaRef.current?.contains(e.target as Node)) setSugerindo(false);
        };
        document.addEventListener("mousedown", fora);
        return () => document.removeEventListener("mousedown", fora);
    }, [sugestoesAbertas]);

    /* Setas percorrem, Enter escolhe, Esc fecha sem perder o que foi digitado. */
    const aoTeclar = (e: ReactKeyboardEvent) => {
        if (buscando) return;
        if (!sugestoesAbertas) {
            if (e.key === "ArrowDown" && encontradas.length > 0) setSugerindo(true);
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setFocado((n) => (n + 1) % encontradas.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setFocado((n) => (n - 1 + encontradas.length) % encontradas.length);
        } else if (e.key === "Enter") {
            e.preventDefault();
            const alvo = encontradas[focado];
            if (alvo) escolherDestinatario(alvo);
        } else if (e.key === "Escape") {
            e.preventDefault();
            setSugerindo(false);
        }
    };

    const podeAvancar =
        etapa === "destinatario"
            ? Boolean(selecionada)
            : etapa === "itens"
              ? linhas.length > 0 && bloqueiosPorLinha.length === 0
              : etapa === "formulario"
                ? true
                : /* A revisão também exige unidade: outra operação pode levar as unidades no meio
                    do caminho, e sem isso o envio da cobrança liberava com zero unidades. */
                Boolean(selecionada) && linhas.length > 0 && motivoValido(motivo);

    const rotuloAvancar =
        etapa === "destinatario" ? "Escolher itens" : etapa === "itens" && temEtapaFormulario ? "Conferir formulário" : "Revisar transferência";

    /* O que a casca pergunta antes de descartar. Ela deduz sozinha, mas aqui dá para ser exato:
       as unidades que já vieram marcadas do kebab não são trabalho de ninguém, e o motivo escrito
       é trabalho que a dedução não enxerga. */
    const temTrabalho = Boolean(selecionada) || motivoValido(motivo) || linhas.some((l) => !linhasIniciais.includes(l.id));

    /* Fechar sai do fluxo. Não há rascunho: a solicitação, com a cobrança, é a primeira coisa
       que o pedido registra, como nas três EFs. */
    const fechar = () => onFechar();

    const avancar = () => {
        if (etapa === "itens" && comFormulario.length > 0) setConferiuFormulario(true);
        setIndice((i) => i + 1);
    };

    /* Voltar para o destinatário é voltar para escolher outra pessoa: escolher alguém já avança
       sozinho, então não existe outro motivo para estar nesta etapa de novo. Ela volta ao estado
       de busca vazia, com o cursor esperando no campo.

       Antes ela reaparecia dizendo duas coisas ao mesmo tempo: o campo guardava o termo digitado,
       que já não abria lista nenhuma, e embaixo dele ficava o cartão verde de quem estava
       escolhido. Um dizia que nada tinha sido escolhido, o outro que alguém tinha. */
    const reiniciarDestinatario = () => {
        if (timerBusca.current) window.clearTimeout(timerBusca.current);
        setSelecionada(null);
        setRecusada(null);
        setBusca("");
        setSugerindo(false);
        setBuscando(false);
        setFocado(0);
        focarBusca.current = true;
    };

    const voltar = () => {
        if (indice === 0) return fechar();
        /* Índice 1 é "itens": recuar dele cai no destinatário. O voltar do navegador passa por
           aqui também, pela casca. */
        if (indice === 1) reiniciarDestinatario();
        setIndice((i) => i - 1);
    };
    const incluir = (ids: string[]) => setSelecao((atual) => ({ ...atual, ...Object.fromEntries(ids.map((id) => [id, true])) }));

    /* Escolher a pessoa avança para os itens, menos quando ela não pode receber NADA do pedido:
       aí o fluxo fica na etapa e diz por quê. O caso de sempre é transferir para quem já porta
       a unidade, e mandar esse clique para a etapa seguinte entregava uma lista inteira barrada
       para o atendente descobrir sozinho o que tinha feito de errado.

       Bloqueio parcial continua avançando: com três unidades e uma barrada, quem decide o que
       vai é a etapa de itens, que marca a barrada e explica linha a linha. */
    const escolherDestinatario = (conta: Conta) => {
        if (naoRecebeNada(conta)) {
            const jaPorta = linhasDisponiveis.every((l) => (l.titularId ?? pedido.compradorId) === conta.id);
            /* A saída vem primeiro, o porquê depois: é o que a pessoa precisa fazer agora. */
            setRecusada(
                jaPorta
                    ? `Escolha outra pessoa para receber a transferência. ${conta.nome} já possui esses itens.`
                    : `Escolha outra pessoa para receber a transferência. ${[...new Set(linhasDisponiveis.map((l) => motivoDaConta(conta, l)).filter(Boolean) as string[])].join(" ")}`,
            );
            /* A lista sai de cena: ela vira para cima quando falta espaço embaixo do campo, e aí
               cobria justamente o aviso que o clique acabou de produzir. Volta num clique no
               campo, com o termo que já estava escrito. */
            setSugerindo(false);
            return;
        }
        setRecusada(null);
        setSelecionada(conta);
        setSugerindo(false);
        setIndice((i) => i + 1);
    };

    const confirmar = () => {
        if (!selecionada) return;

        /* H-23: o novo possuidor herda as respostas como estão. A titularidade não as altera. */
        /* Agrupado por item E por titular de origem. Só por item, duas saídas de pessoas
           diferentes viravam uma linha só e o registro ficava sem dizer de quem cada unidade
           saiu. O nome entra apenas quando há mais de um titular: com um só ele repetiria a
           mesma pessoa em toda linha. */
        const porGrupo = new Map<string, { itemId: string; titular: string; quantidade: number }>();
        linhas.forEach((l) => {
            const titular = titularDaLinha(pedido, l)?.nome ?? "Comprador";
            const chave = `${l.itemId}|${titular}`;
            const grupo = porGrupo.get(chave) ?? { itemId: l.itemId, titular, quantidade: 0 };
            grupo.quantidade += 1;
            porGrupo.set(chave, grupo);
        });
        const detalhes = [...porGrupo.values()].map(({ itemId, titular, quantidade }) => {
            const item = getItem(itemId);
            return [`${quantidade}x ${item?.nome}`, detalheDoItem(item), titularesDeOrigem.length > 1 && `de ${titular}`].filter(Boolean).join(" · ");
        });
        /* Uma mudança por unidade, com o portador de origem de cada uma: num pedido com dois
           titulares, dizer "De Fulano" no singular atribuía a saída inteira a um só. */
        const mudancas = linhas.map((l) => ({
            escopo: [getItem(l.itemId)?.nome, detalheDoItem(getItem(l.itemId))].filter(Boolean).join(" · "),
            de: titularDaLinha(pedido, l)?.nome ?? "Comprador",
            para: selecionada.nome,
        }));

        const id = criarSolicitacao({
            pedidoId: pedido.id,
            tipo: "troca-titularidade",
            detalhes,
            mudancas,
            linhasAfetadas: linhas.map((l) => l.id),
            resumo: `${linhas.length} ${linhas.length === 1 ? "item transferido" : "itens transferidos"} para ${selecionada.nome}. Comprador original preservado.`,
            calculo,
            /* Só o possuidor muda. As respostas seguem como estão, herdadas (H-23). */
            aplicar: {
                titularPorLinha: Object.fromEntries(linhas.map((l) => [l.id, selecionada.id])),
                /* As respostas mexidas vão junto: sem isto a cobrança da troca de perguntas saía
                   e a correção morria na tela. */
                respostasPorItem: Object.keys(respostasPorItem).length > 0 ? respostasPorItem : undefined,
            },
            reservas: [],
            canalEnvio: "email",
            destinatarioEnvio: destino,
            motivo,
        });
        if (!id) {
            toast.error("Uma das unidades entrou em outra alteração enquanto você montava esta. Confira o pedido e tente de novo.");
            return;
        }

        toast.success(calculo.total > 0 ? `Cobrança de ${formatarMoeda(calculo.total)} enviada para ${destino}.` : "Transferência aplicada. Sem valor a pagar, nada foi enviado.");
        onEnviado(id);
    };

    const colunaEstreita = etapa === "destinatario" || etapa === "revisao";

    return (
        <WizardShell
            onClose={fechar}
            titulo="Transferir"
            subtitulo={`${comprador?.nome ?? "Comprador"} · Pedido ${uuidCurto(pedido.id)}`}
            /* A etapa 2 carrega o nome de quem recebe. O subtítulo logo acima é o COMPRADOR, e
               só "Itens" deixava as duas pessoas do fluxo reduzidas a uma. */
            etapas={etapas.map((e) => (e === "itens" && selecionada ? `Itens para ${primeiroNome(selecionada.nome)}` : TITULO_ETAPA[e]))}
            indiceAtual={indice}
            podeAvancar={podeAvancar}
            /* Sem rodapé ao escolher quem recebe: o clique na sugestão já avança, e a etapa nunca
               fica parada com alguém escolhido — voltar a ela a devolve vazia. Um "Escolher itens"
               aqui seria um botão que nunca tem o que fazer. */
            ocultarRodape={etapa === "destinatario"}
            trabalhoEmAndamento={temTrabalho}
            rotuloAvancar={rotuloAvancar}
            ultimaEtapa={etapa === "revisao"}
            rotuloConfirmar="Enviar cobrança"
            rotuloContinuar="Continuar transferindo"
            /* O que custa e para quem fica acima do botão, não dentro dele: a frase inteira
               enchia três linhas de um botão de largura total no telefone. */
            infoRodape={etapa === "revisao" ? `${formatarMoeda(calculo.total)} para ${mascararEmail(destino)}` : undefined}
            onVoltar={voltar}
            onAvancar={avancar}
            onConfirmar={confirmar}
        >
            <div className={cx("flex w-full flex-col gap-5", colunaEstreita && "items-center")}>

                {etapa === "itens" && selecionada && (
                    <div className="flex w-full flex-col gap-4">
                        {/* Quem recebe é nomeado no próprio stepper, "Itens para Juliana", e não
                            num cartão em cima da lista: o cartão foi removido daqui de propósito,
                            porque ocupava o topo inteiro da etapa. O nome precisa estar na tela
                            para o atendente não ler o bloqueio como propriedade do ingresso, mas
                            cabe no rótulo da etapa. */}
                        {/* O caso em que NADA cabe vem ANTES da lista: embaixo dela, o atendente já
                            tinha lido a lista vazia e concluído que o pedido é intransferível. O
                            problema é a pessoa, e é a primeira coisa a dizer. */}
                        {nadaPodeIr && (
                            <div role="alert" className="flex flex-col gap-2">
                                <Aviso titulo={`Nenhuma unidade pode ir para ${selecionada.nome}`} descricao={motivosDistintos.length === 1 ? motivosDistintos[0] : undefined} />
                                {/* Motivos diferentes viram linhas diferentes: uma frase só teria
                                    de escolher um deles e calar os outros. */}
                                {motivosDistintos.length > 1 && (
                                    <ul className="flex flex-col gap-1 pl-11 text-sm text-tertiary">
                                        {motivosDistintos.map((texto) => (
                                            <li key={texto}>{texto}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        <SeletorUnidades pedido={pedido} verbo="transferir" selecao={selecao} onChange={setSelecao} bloqueioExtra={motivoParaDestinatario} />
                    </div>
                )}

                {etapa === "destinatario" && (
                    <>
                        {/*
                          Mesma arquitetura do passo 1 da nova venda da bilheteria: o campo mora
                          num card, com rótulo próprio em cima e a dica embaixo, e o resultado vem
                          num card separado com o ícone de estado.

                          A interação continua a nossa: a lista é um popover ancorado no input,
                          que aparece enquanto se digita. Sem botão "Buscar" — aqui o operador
                          procura por nome, não tem o documento de cor, e esperar um submit só
                          colocaria um passo entre ele e a lista.
                        */}
                        <div className="flex w-full flex-col gap-1.5 rounded-xl bg-primary p-4 ring-1 ring-border-secondary md:p-5">
                            <label htmlFor="destinatario-busca" className="text-sm font-medium text-secondary">
                                Quem vai receber?
                            </label>
                            <div ref={montarBusca} className="relative w-full">
                                <InputBase
                                    id="destinatario-busca"
                                    size="md"
                                    icon={SearchLg}
                                    placeholder="Nome completo, e-mail ou CPF"
                                    value={busca}
                                    onChange={(evento) => {
                                        setBusca(evento.target.value);
                                        setSelecionada(null);
                                        setRecusada(null);
                                        setSugerindo(true);
                                        setFocado(0);
                                        agendarBusca();
                                    }}
                                    onKeyDown={aoTeclar}
                                    /* Clicar no campo traz a lista de volta sem redigitar: é o
                                       caminho de saída depois de uma conta recusada. Pelo clique
                                       e não pelo foco, porque escolher na lista não tira o foco
                                       do campo e o `focus` nunca dispararia de novo. */
                                    onClick={() => termo.length > 0 && setSugerindo(true)}
                                    autoComplete="off"
                                />

                                {sugestoesAbertas && (
                                    <ul
                                        id="sugestoes-destinatario"
                                        role="listbox"
                                        aria-label="Contas encontradas"
                                        style={{ maxHeight: encaixe.altura }}
                                        className={cx(
                                            "absolute right-0 left-0 z-20 overflow-y-auto rounded-xl bg-primary py-1 shadow-lg ring-1 ring-border-secondary",
                                            encaixe.acima ? "bottom-full mb-1" : "top-full mt-1",
                                        )}
                                    >
                                        {buscando &&
                                            [0, 1, 2].map((i) => (
                                                <li key={`esqueleto-${i}`} aria-hidden="true" className="flex items-center gap-3 px-4 py-3">
                                                    <span className="size-10 shrink-0 animate-pulse rounded-full bg-secondary" />
                                                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                                                        <span className="h-3.5 w-40 animate-pulse rounded bg-secondary" />
                                                        <span className="h-3 w-56 animate-pulse rounded bg-secondary" />
                                                    </span>
                                                </li>
                                            ))}
                                        {buscando && (
                                            <li role="status" className="sr-only">
                                                Buscando contas
                                            </li>
                                        )}

                                        {/* Buscou e não achou: a resposta é uma linha da própria lista. O cartão
                                            grande que dizia isso saiu. */}
                                        {!buscando && encontradas.length === 0 && (
                                            <li className="px-4 py-3 text-sm text-tertiary">Nenhuma conta encontrada para “{termo}”.</li>
                                        )}

                                        {!buscando &&
                                            encontradas.map((conta, i) => {
                                            const impedida = naoRecebeNada(conta) ? bloqueiosDaConta(conta, linhasDisponiveis)[0]?.bloqueio : undefined;
                                            return (
                                            <li key={conta.id} role="option" aria-selected={i === focado}>
                                                <button
                                                    type="button"
                                                    tabIndex={-1}
                                                    onMouseEnter={() => setFocado(i)}
                                                    /* No mouse, escolhe ao apertar: se a lista se mexer entre o mousedown
                                                       e o mouseup, por rolagem ou reposicionamento, o clique nunca chega.
                                                       É o que o combobox do React Aria também faz.

                                                       No toque, não: `pointerdown` é o começo de TODO gesto, inclusive o
                                                       de arrastar para rolar a lista, e escolher ali fazia o dedo que
                                                       procurava a pessoa certa selecionar quem estivesse embaixo dele e
                                                       pular para a etapa 2. O dedo vai pelo `click`, que o browser só
                                                       emite quando o gesto não virou rolagem. */
                                                    onPointerDown={(e) => {
                                                        if (e.pointerType !== "mouse") return;
                                                        e.preventDefault();
                                                        escolherDestinatario(conta);
                                                    }}
                                                    onClick={(e) => {
                                                        if ((e.nativeEvent as PointerEvent).pointerType === "mouse") return;
                                                        escolherDestinatario(conta);
                                                    }}
                                                    className={cx(
                                                        "flex w-full items-center gap-3 px-4 py-3 text-left transition duration-100 ease-linear",
                                                        i === focado ? "bg-secondary" : "hover:bg-primary_hover",
                                                        impedida && "opacity-60",
                                                    )}
                                                >
                                                    <Avatar size="md" initials={iniciaisDe(conta.nome)} alt={conta.nome} />
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block text-sm font-semibold text-primary">{conta.nome}</span>
                                                        <IdentidadeConta conta={conta} />
                                                    </span>
                                                    {impedida ? (
                                                        <span className="shrink-0 text-sm text-warning-primary">{impedida.curto}</span>
                                                    ) : (
                                                        <ChevronRight className="size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                                    )}
                                                </button>
                                            </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                            <p className="text-sm text-tertiary">Busque pelo nome, não precisa saber o e-mail ou CPF de cor.</p>
                        </div>

                        {/* Abaixo do card, não dentro nem acima: a lista de sugestões vira para
                            cima quando falta espaço embaixo do campo, e por isso ela fecha ao
                            recusar. Com a lista fechada este é o lugar onde o olho já está. */}
                        {recusada && (
                            <p role="alert" className="text-sm text-error-primary">
                                {recusada}
                            </p>
                        )}
                    </>
                )}

                {etapa === "formulario" && (
                    <>
                        {comFormulario.length === 0 ? (
                            /* A etapa fica fixa depois que o fluxo passa por ela, então a escolha
                               pode mudar e deixá-la sem nada. */
                            <p className="w-full rounded-xl bg-primary px-4 py-8 text-center text-sm text-tertiary ring-1 ring-border-secondary">
                                Nenhuma unidade escolhida tem formulário. Pode seguir para a revisão.
                            </p>
                        ) : (
                            <>
                                <Regra>
                                    As respostas seguem com a unidade. Corrija o que precisar antes de enviar a cobrança: mudar uma resposta que já existia
                                    soma {formatarMoeda(COBRANCA_TROCA_PERGUNTAS)} ao total, uma vez só, não importa quantas mudem. Preencher pergunta em
                                    branco não custa nada.
                                </Regra>
                                {comFormulario.map((linha) => (
                                    <RespostasDaUnidade
                                        key={linha.id}
                                        pedido={pedido}
                                        linha={linha}
                                        perguntas={perguntasDaLinha(linha)}
                                        aberto={comFormulario.length === 1}
                                        valorDe={(perguntaId) => valorDaResposta(linha, perguntaId)}
                                        alterada={(perguntaId) => respostaAlterada(linha, perguntaId)}
                                        onChange={(perguntaId, valor) =>
                                            setRespostasNovas((atual) => ({ ...atual, [linha.id]: { ...(atual[linha.id] ?? {}), [perguntaId]: valor } }))
                                        }
                                    />
                                ))}
                            </>
                        )}
                    </>
                )}

                {etapa === "revisao" && selecionada && (
                    <>
                        {/* De quem as unidades saem, antes de dizer para onde vão. O cartão lista
                            só o item, e sem esta linha dava para autorizar a cobrança sem saber
                            que o ingresso estava com a Carol, que o recebeu por transferência, e
                            não com o comprador que aparece no cabeçalho. */}
                        {titularesDeOrigem.length > 0 && <p className="w-full text-sm font-medium text-secondary">Sai de {listarNomes(titularesDeOrigem)}</p>}
                        {/* O que sai em cima, quem recebe embaixo: a seta lê "estas unidades vão
                            para esta pessoa", na ordem em que a frase acontece. */}
                        <ResumoUnidades
                            pedido={pedido}
                            linhas={linhas}
                            verbo="transferir"
                            titulo="Transferindo"
                            onAlterar={() => setIndice(1)}
                            onIncluir={incluir}
                            bloqueioExtra={motivoParaDestinatario}
                        />
                        <SetaParaBaixo />
                        <CartaoDestinatario
                            conta={selecionada}
                            onAlterar={() => {
                                reiniciarDestinatario();
                                setIndice(0);
                            }}
                        />

                        <CampoMotivo valor={motivo} onChange={setMotivo} />

                        {/* O mesmo cartão da troca: título sem régua embaixo nem faixa própria, o
                            peso da fonte já separa, e a letra miúda mora junto da conta a que ela
                            se refere. O `p-0` tira o recuo que o resumo carrega para quando ele
                            mora num container com faixa. */}
                        <div className="flex w-full flex-col gap-3 rounded-xl bg-primary p-4 ring-1 ring-border-secondary md:p-5 [&_dl]:p-0">
                            <p className="text-sm font-semibold text-primary">Resumo da cobrança</p>
                            <ResumoFinanceiro linhas={calculo.linhas} semMoldura />
                        </div>

                        {/* A herança das respostas, fora do cartão e por último: o resumo é a
                            conta, e isto é o que acontece com o formulário. A frase dizia "sem
                            alteração" e mandava fazer uma troca de perguntas depois; desde que a
                            etapa do formulário aceita edição, as duas metades eram falsas. */}
                        {comFormulario.length > 0 && (
                            <p className="w-full text-sm text-tertiary">
                                {alteradas.length === 0
                                    ? "O destinatário herda as respostas do formulário como estão hoje."
                                    : `O destinatário herda as respostas do formulário com ${contarAlteradas(alteradas.length)} que você corrigiu.`}
                            </p>
                        )}
                    </>
                )}
            </div>
        </WizardShell>
    );
}
