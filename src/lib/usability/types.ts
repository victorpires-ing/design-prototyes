/**
 * Tipos do sistema de teste de usabilidade.
 *
 * Modelo de BLOCOS (inspirado no Maze): um teste é uma sequência de blocos
 * — sempre começa com `welcome` e termina com `obrigado`; no meio entram
 * blocos de `atividade` (website test) e `pergunta`.
 *
 * O teste roda POR CIMA dos protótipos reais deste repo: blocos de atividade
 * levam o participante às telas reais e uma camada global (TestRunnerLayer) mede
 * a jornada. A gravação de tela/heatmap fica a cargo do Microsoft Clarity.
 */

export type CriterioTipo = "rota" | "clique" | "auto";

export interface Criterio {
    id: string;
    tipo: CriterioTipo;
    /**
     * - `rota`: pathname alvo; concluída ao atingir essa rota (match por prefixo).
     * - `clique`: seletor CSS; concluída ao clicar num elemento que casa com ele.
     * - `auto`: sem detecção — o participante declara "Concluí".
     */
    valor?: string;
    /** Rótulo amigável do alvo (ex.: texto do botão capturado), só para exibição. */
    rotulo?: string;
}

export type BlocoTipo = "welcome" | "atividade" | "pergunta" | "sus" | "obrigado";

interface BlocoBase {
    id: string;
    tipo: BlocoTipo;
}

export interface BlocoWelcome extends BlocoBase {
    tipo: "welcome";
    titulo: string;
    texto: string;
}

export interface BlocoObrigado extends BlocoBase {
    tipo: "obrigado";
    titulo: string;
    texto: string;
}

export interface BlocoAtividade extends BlocoBase {
    tipo: "atividade";
    /** Título curto do bloco (lista lateral). */
    titulo: string;
    /** Frase da tarefa exibida ao participante. */
    enunciado: string;
    /** Detalhes adicionais (opcional). */
    descricao?: string;
    /** Rota onde a tarefa começa. */
    rotaInicial: string;
    /** Concluída quando QUALQUER critério é satisfeito (critérios são combináveis). */
    criterios: Criterio[];
    /** Mensagem exibida ao concluir com sucesso (opcional). */
    mensagemSucesso?: string;
    /** Quando exibir o bloco de declaração (Desisti/Concluí): 0 = sempre em tela; >0 = após N segundos. */
    declaracaoApos: number;
    /** Pede justificativa ao participante ao clicar em "Desisti". */
    pedirJustificativaDesistencia: boolean;
}

export type PerguntaFormato = "aberta" | "unica" | "multipla";

export interface BlocoPergunta extends BlocoBase {
    tipo: "pergunta";
    /** Título curto do bloco (lista lateral). */
    titulo: string;
    /** Enunciado da pergunta exibido ao participante. */
    enunciado: string;
    /** Descrição/ajuda opcional exibida abaixo do enunciado. */
    descricao?: string;
    formato: PerguntaFormato;
    /** Opções para `unica`/`multipla`. */
    opcoes: string[];
    obrigatoria: boolean;
}

export interface BlocoSus extends BlocoBase {
    tipo: "sus";
    /** Título curto do bloco (lista lateral). */
    titulo: string;
    /** Enunciado/contexto exibido acima das 10 afirmações (opcional). */
    enunciado: string;
}

export type Bloco = BlocoWelcome | BlocoObrigado | BlocoAtividade | BlocoPergunta | BlocoSus;

export type TesteStatus = "rascunho" | "ativo" | "encerrado";

export interface Teste {
    id: string;
    nome: string;
    status: TesteStatus;
    blocos: Bloco[];
    /** Se true, o teste só pode ser executado uma vez por dispositivo. */
    umaVezPorDispositivo: boolean;
    /** Logo de marca parceira exibida ao lado da Ingresse no topo (opcional). */
    logoParceira?: string;
    criadoEm: string;
}

export type ResultadoTarefa = "sucesso" | "desistencia" | "abandono";

export interface EventoBloco {
    blocoId: string;
    tipo: BlocoTipo;
    iniciadaEm: string;
    concluidaEm?: string;
    /** Para atividades. */
    resultado?: ResultadoTarefa;
    duracaoMs?: number;
    comoConcluiu?: CriterioTipo;
    /** Para desistências: justificativa do participante (opcional). */
    justificativa?: string;
    /** Para perguntas e SUS: resposta(s) do participante (no SUS, 10 valores "1".."5"). */
    resposta?: string[];
    /** Resposta salva parcialmente (autosave) — ainda não confirmada pelo participante. */
    parcial?: boolean;
}

export interface SessaoTeste {
    id: string;
    testeId: string;
    deviceId: string;
    iniciadaEm: string;
    finalizadaEm?: string;
    /** Momento em que o participante fechou/abandonou sem concluir (autosave). */
    abandonadaEm?: string;
    userAgent: string;
    /** Viewport no início da sessão, ex.: "1280x800". */
    viewport: string;
    eventos: EventoBloco[];
    concluida: boolean;
}

/** Estado de uma execução em andamento (persistido em sessionStorage). */
export interface RunAtivo {
    teste: Teste;
    sessaoId: string;
    /** Índice do bloco atual em `teste.blocos`. */
    blocoIndex: number;
    iniciadaEmBloco: string;
    /**
     * Execução de pré-visualização: não grava sessão/eventos, não dispara o
     * Clarity e não conta para a trava de "uma vez por dispositivo".
     */
    preview?: boolean;
}

export interface UsabilityStore {
    listTestes(): Promise<Teste[]>;
    getTeste(id: string): Promise<Teste | null>;
    saveTeste(teste: Teste): Promise<Teste>;
    removeTeste(id: string): Promise<void>;
    criarSessao(sessao: SessaoTeste): Promise<SessaoTeste>;
    atualizarSessao(sessao: SessaoTeste): Promise<SessaoTeste>;
    listSessoes(testeId: string): Promise<SessaoTeste[]>;
}
