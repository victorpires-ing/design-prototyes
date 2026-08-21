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
        id: "item",
        title: "Dados do Item",
        fields: [
            { id: "item_tipo", label: "Tipo de item" },
            { id: "item_nome", label: "Nome" },
            { id: "item_setor", label: "Setor" },
            { id: "item_lote", label: "Lote" },
            { id: "item_valorOriginal", label: "Valor original" },
            { id: "item_valorComDesconto", label: "Valor com desconto" },
            { id: "item_passkey", label: "Passkey" },
            { id: "item_cupom", label: "Cupom" },
        ],
    },
    {
        id: "pedido",
        title: "Dados do pedido",
        fields: [
            { id: "pedido_id", label: "ID do pedido" },
            { id: "pedido_dataCriacao", label: "Data de criação" },
            { id: "pedido_ultimaAtualizacao", label: "Última atualização" },
            { id: "pedido_status", label: "Status" },
            { id: "pedido_tipoPagamento", label: "Tipo de pagamento" },
            { id: "pedido_canal", label: "Canal" },
        ],
    },
    {
        id: "portador",
        title: "Dados do portador",
        fields: [
            { id: "portador_nome", label: "Nome" },
            { id: "portador_tipoDocumento", label: "Tipo de documento" },
            { id: "portador_documento", label: "Documento" },
            { id: "portador_email", label: "E-mail" },
            { id: "portador_telefone", label: "Telefone" },
        ],
    },
    {
        id: "perguntas",
        title: "Perguntas e respostas",
        fields: [
            { id: "pergunta_pace", label: "Pace" },
            { id: "pergunta_corTamanhoCamisa", label: "Cor e tamanho de camisa" },
            { id: "pergunta_tenis", label: "Tênis que usa" },
            { id: "pergunta_contatoEmergencia", label: "Contato de emergência" },
            { id: "pergunta_distanciaProva", label: "Distância da prova" },
            { id: "pergunta_tempoEstimado", label: "Tempo estimado de conclusão" },
            { id: "pergunta_melhorTempoPessoal", label: "Melhor tempo pessoal (PR)" },
            { id: "pergunta_jaCorreuProva", label: "Já correu esta prova antes?" },
            { id: "pergunta_qtdParticipacoes", label: "Quantidade de participações na prova" },
            { id: "pergunta_assessoriaEsportiva", label: "Clube ou assessoria esportiva" },
            { id: "pergunta_federadoCBAt", label: "Federado pela CBAt?" },
            { id: "pergunta_grupoPace", label: "Grupo de pace" },
            { id: "pergunta_categoriaParticipacao", label: "Categoria de participação" },
            { id: "pergunta_faixaEtaria", label: "Faixa etária" },
            { id: "pergunta_modalidade", label: "Modalidade (corrida ou caminhada)" },
            { id: "pergunta_equipeRevezamento", label: "Equipe de revezamento" },
            { id: "pergunta_funcaoRevezamento", label: "Função no revezamento" },
            { id: "pergunta_retiradaKitTerceiros", label: "Retirada de kit por terceiros" },
            { id: "pergunta_nomeCertificado", label: "Nome para gravação no certificado" },
            { id: "pergunta_tipoSanguineo", label: "Tipo sanguíneo" },
            { id: "pergunta_alergias", label: "Alergias conhecidas" },
            { id: "pergunta_medicacaoContinua", label: "Uso de medicação contínua" },
            { id: "pergunta_doencaPreExistente", label: "Doença pré-existente" },
            { id: "pergunta_marcaPasso", label: "Uso de marca-passo" },
            { id: "pergunta_convenioMedico", label: "Convênio médico" },
            { id: "pergunta_peso", label: "Peso (kg)" },
            { id: "pergunta_altura", label: "Altura (cm)" },
            { id: "pergunta_numeracaoCalcado", label: "Numeração do calçado" },
            { id: "pergunta_correAcompanhado", label: "Corre acompanhado?" },
            { id: "pergunta_nomeAcompanhante", label: "Nome do acompanhante" },
            { id: "pergunta_comoConheceuEvento", label: "Como conheceu o evento" },
            { id: "pergunta_metaTempo", label: "Meta de tempo para a prova" },
            { id: "pergunta_anoInicioCorrida", label: "Ano de início na corrida de rua" },
            { id: "pergunta_termoResponsabilidade", label: "Aceite do termo de responsabilidade" },
        ],
    },
    {
        id: "assentos",
        title: "Mapa de assentos",
        fields: [
            { id: "assento_setor", label: "Setor" },
            { id: "assento_fileira", label: "Fileira" },
            { id: "assento_numero", label: "Assento" },
            { id: "assento_categoria", label: "Categoria" },
        ],
    },
    {
        id: "grupos_assessorias",
        title: "Grupos e assessorias",
        fields: [
            { id: "grupo_gestor", label: "Gestor" },
            { id: "grupo_emailGestor", label: "E-mail do gestor" },
            { id: "grupo_telefoneGestor", label: "Telefone do gestor" },
        ],
    },
    {
        id: "bilheteria",
        title: "Bilheteria",
        fields: [
            { id: "bilheteria_operadorNome", label: "Nome do operador de vendas" },
            { id: "bilheteria_operadorEmail", label: "E-mail do operador de vendas" },
        ],
    },
];
