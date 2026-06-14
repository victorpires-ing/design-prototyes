/**
 * Tipos do sistema de teste de usabilidade.
 *
 * O teste roda POR CIMA dos protótipos reais deste repo: o participante navega
 * nas telas de verdade e uma camada global (TestRunnerLayer) mede a jornada.
 * A gravação de tela/heatmap fica a cargo do Microsoft Clarity — aqui guardamos
 * só a configuração do teste e as métricas de tarefa.
 */

export type CriterioTipo = "rota" | "clique" | "auto";

export interface Criterio {
    id: string;
    tipo: CriterioTipo;
    /**
     * - `rota`: pathname alvo; a tarefa é concluída ao atingir essa rota (match por prefixo).
     * - `clique`: seletor CSS; concluída ao clicar num elemento que casa com o seletor.
     * - `auto`: sem detecção automática — o participante declara "Concluí".
     */
    valor?: string;
}

export interface Atividade {
    id: string;
    /** O que pedimos ao participante fazer. */
    enunciado: string;
    /** Mensagem de contexto antes de iniciar a tarefa (opcional). */
    mensagemInicio?: string;
    /** Mensagem exibida ao concluir a tarefa com sucesso (opcional). */
    mensagemSucesso?: string;
    /** Rota para onde o participante é levado ao iniciar a tarefa. */
    rotaInicial: string;
    /** A tarefa é concluída quando QUALQUER critério é satisfeito. */
    criterios: Criterio[];
}

export type TesteStatus = "rascunho" | "ativo" | "encerrado";

export interface Teste {
    id: string;
    nome: string;
    status: TesteStatus;
    introTitulo: string;
    introTexto: string;
    atividades: Atividade[];
    /** Se true, o teste só pode ser executado uma vez por dispositivo. */
    umaVezPorDispositivo: boolean;
    criadoEm: string;
}

export type ResultadoTarefa = "sucesso" | "desistencia" | "abandono";

export interface EventoTarefa {
    atividadeId: string;
    iniciadaEm: string;
    concluidaEm?: string;
    resultado?: ResultadoTarefa;
    duracaoMs?: number;
    /** Como a tarefa foi concluída (qual tipo de critério bateu). */
    comoConcluiu?: CriterioTipo;
}

export interface SessaoTeste {
    id: string;
    testeId: string;
    deviceId: string;
    iniciadaEm: string;
    finalizadaEm?: string;
    userAgent: string;
    /** Viewport no início da sessão, ex.: "1280x800". */
    viewport: string;
    eventos: EventoTarefa[];
    concluida: boolean;
}

/** Estado de uma execução em andamento (persistido em sessionStorage). */
export interface RunAtivo {
    teste: Teste;
    sessaoId: string;
    atividadeIndex: number;
    iniciadaEmTarefa: string;
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
