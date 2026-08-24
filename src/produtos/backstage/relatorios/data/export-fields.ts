// Campos disponíveis para exportação de transações, agrupados como exibidos no modal de
// gerenciar colunas.

export interface ExportField {
    id: string;
    label: string;
}

export interface ExportFieldSubgroup {
    title: string;
    fields: ExportField[];
}

export interface ExportFieldGroup {
    id: string;
    title: string;
    fields: ExportField[];
    /** Subdivisões visuais dentro do grupo (não são colapsáveis — só organizam os campos). */
    subgroups?: ExportFieldSubgroup[];
    /** Se o card do grupo já abre expandido no slideout. Default: true. */
    defaultExpanded?: boolean;
}

export const EXPORT_FIELD_GROUPS: ExportFieldGroup[] = [
    {
        id: "pedido",
        title: "Dados do pedido",
        fields: [
            { id: "pedido_id", label: "ID do Pedido" },
            { id: "pedido_dataCriacao", label: "Data de criação" },
            { id: "pedido_ultimaAtualizacao", label: "Última atualização" },
            { id: "pedido_status", label: "Status" },
            { id: "pedido_formaPagamento", label: "Forma de pagamento" },
            { id: "pedido_canal", label: "Canal" },
            { id: "pedido_operadorVendas", label: "Operador de vendas" },
            { id: "pedido_comprador", label: "Comprador" },
            { id: "pedido_documentoComprador", label: "Documento do comprador" },
            { id: "pedido_emailComprador", label: "E-mail do comprador" },
            { id: "pedido_telefoneComprador", label: "Telefone do comprador" },
            { id: "pedido_cupom", label: "Cupom" },
            { id: "pedido_passkey", label: "Passkey" },
            { id: "pedido_quantidade", label: "Quantidade" },
            { id: "pedido_valorUnitario", label: "Valor unitário" },
            { id: "pedido_valorDesconto", label: "Valor desconto" },
            { id: "pedido_valorTotal", label: "Valor total" },
        ],
    },
    {
        id: "inscricao",
        title: "Dados da inscrição",
        fields: [
            { id: "inscricao_item", label: "Item" },
            { id: "inscricao_nomeItem", label: "Nome do item" },
            { id: "inscricao_categoria", label: "Categoria" },
            { id: "inscricao_lote", label: "Lote" },
        ],
    },
    {
        id: "atleta",
        title: "Dados do atleta",
        fields: [
            { id: "atleta_nome", label: "Atleta" },
            { id: "atleta_documento", label: "Documento do atleta" },
            { id: "atleta_email", label: "E-mail do atleta" },
            { id: "atleta_telefone", label: "Telefone do atleta" },
        ],
    },
    {
        id: "grupo",
        title: "Compra em grupo",
        fields: [
            { id: "grupo_nomeEquipe", label: "Nome da equipe" },
            { id: "grupo_responsavel", label: "Responsável pelo pedido" },
            { id: "grupo_emailResponsavel", label: "E-mail do responsável pelo pedido" },
            { id: "grupo_celularResponsavel", label: "Celular do responsável pelo pedido" },
        ],
    },
    {
        id: "perguntas",
        title: "Perguntas",
        fields: [
            { id: "pergunta_pace", label: "Pace" },
            { id: "pergunta_distanciaProva", label: "Distância da prova" },
            { id: "pergunta_tempoEstimado", label: "Tempo estimado de conclusão" },
            { id: "pergunta_jaCorreuProva", label: "Já correu esta prova antes?" },
            { id: "pergunta_categoriaParticipacao", label: "Categoria de participação" },
            { id: "pergunta_tamanhoCamisa", label: "Tamanho da camisa" },
            { id: "pergunta_faixaEtaria", label: "Faixa etária" },
            { id: "pergunta_convenioMedico", label: "Convênio médico" },
            { id: "pergunta_comoConheceuEvento", label: "Como conheceu o evento" },
            { id: "pergunta_metaTempo", label: "Meta de tempo" },
            { id: "pergunta_anoInicioCorrida", label: "Ano que começou a correr" },
            { id: "pergunta_termoResponsabilidade", label: "Aceite do termo de responsabilidade" },
            { id: "pergunta_contatoEmergencia", label: "Contato de emergência" },
            { id: "pergunta_melhorTempoPessoal", label: "Melhor tempo pessoal (PR)" },
            { id: "pergunta_qtdParticipacoes", label: "Quantidade de participações anteriores" },
            { id: "pergunta_assessoriaEsportiva", label: "Assessoria esportiva" },
            { id: "pergunta_federadoCBAt", label: "Federado pela CBAt" },
            { id: "pergunta_grupoPace", label: "Grupo de pace" },
            { id: "pergunta_equipeRevezamento", label: "Equipe de revezamento" },
            { id: "pergunta_funcaoRevezamento", label: "Função no revezamento" },
            { id: "pergunta_retiradaKitTerceiros", label: "Retirada de kit por terceiros" },
            { id: "pergunta_medicacaoContinua", label: "Usa medicação contínua" },
            { id: "pergunta_doencaPreExistente", label: "Possui doença pré-existente" },
            { id: "pergunta_peso", label: "Peso (kg)" },
            { id: "pergunta_numeracaoCalcado", label: "Numeração do calçado" },
        ],
    },
];
