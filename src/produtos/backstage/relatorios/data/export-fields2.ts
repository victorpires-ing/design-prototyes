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
            { id: "pedido_id", label: "ID do pedido" },
            { id: "pedido_dataCriacao", label: "Data de criação" },
            { id: "pedido_ultimaAtualizacao", label: "Última atualização" },
            { id: "pedido_status", label: "Status" },
            { id: "pedido_formaPagamento", label: "Tipo de pagamento" },
            { id: "pedido_canal", label: "Canal" },
            { id: "pedido_operadorVendas", label: "Operador de vendas" },
            { id: "pedido_comprador", label: "Comprador" },
            { id: "pedido_tipoDocumentoComprador", label: "Doc. do comprador" },
            { id: "pedido_documentoComprador", label: "Nº de doc. do comprador" },
            { id: "pedido_emailComprador", label: "E-mail do comprador" },
            { id: "pedido_telefoneComprador", label: "Telefone do comprador" },
            { id: "pedido_dataNascimentoComprador", label: "Data de nasc. do comprador" },
            { id: "pedido_cupom", label: "Cupom" },
            { id: "pedido_passkey", label: "Passkey" },
            { id: "pedido_quantidade", label: "Quantidade" },
            { id: "pedido_valorUnitario", label: "Valor original" },
            { id: "pedido_valorDesconto", label: "Valor do desconto" },
            { id: "pedido_valorTotal", label: "Valor final" },
            { id: "pedido_idInscricao", label: "ID da inscrição" },
        ],
    },
    {
        id: "inscricao",
        title: "Dados da inscrição",
        fields: [
            { id: "inscricao_item", label: "Item vendido" },
            { id: "inscricao_categoria", label: "Categoria" },
            { id: "inscricao_modalidade", label: "Modalidade" },
            { id: "inscricao_lote", label: "Lote" },
        ],
    },
    {
        id: "atleta",
        title: "Dados do atleta",
        fields: [
            { id: "atleta_nome", label: "Atleta" },
            { id: "atleta_tipoDocumento", label: "Doc. do atleta" },
            { id: "atleta_documento", label: "Nº de doc. do atleta" },
            { id: "atleta_email", label: "E-mail do atleta" },
            { id: "atleta_telefone", label: "Telefone do atleta" },
            { id: "atleta_dataNascimento", label: "Data de nasc. do atleta" },
        ],
    },
    {
        id: "grupo",
        title: "Compra em grupo",
        fields: [
            { id: "grupo_compraEmGrupo", label: "Compra em grupo?" },
            { id: "grupo_nomeGrupo", label: "Nome do grupo" },
            { id: "grupo_liderGrupo", label: "Líder do grupo" },
            { id: "grupo_telefoneLider", label: "Telefone do líder" },
            { id: "grupo_emailLider", label: "E-mail do líder" },
            { id: "grupo_docLider", label: "Doc. do líder" },
            { id: "grupo_numDocLider", label: "Nº de doc. do líder" },
            { id: "grupo_dataNascLider", label: "Data de nasc. do líder" },
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
            { id: "pergunta_marcaTenis", label: "Marca de tênis favorita" },
        ],
    },
];
