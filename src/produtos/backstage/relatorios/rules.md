# Relatórios: regras

> **Rotas:** `/backstage/relatorios/vendas-por-grupo`, `/backstage/relatorios/transacoes`, `/backstage/relatorios/transacoes2`, `/backstage/relatorios/transacoes3`, `/backstage/relatorios/acesso`, `/backstage/relatorios/bordero`, `/backstage/relatorios/transferencias`, `/backstage/relatorios/comparativos`, `/backstage/relatorios/questionarios`, `/backstage/relatorios/relatorio-personalizado`
> **No menu:** Backstage › menu do evento › Relatórios › Vendas, Transações, Acesso, Borderô, Transferências, Comparativos (selo "Novo"), Respostas do questionário, Relatório personalizado (selo "IA"). O mesmo grupo aparece no menu da variante Equipe de operação, sem o selo "Novo".
> **Versão em uso:** Transações tem três versões. O menu aponta para `/backstage/relatorios/transacoes` (`pages/Transacoes.tsx`, v1). `transacoes2` (`pages/Transacoes2.tsx`) e `transacoes3` (`pages/Transacoes3.tsx`) só abrem pela URL e destacam o mesmo item "Transações" no menu. Os demais relatórios têm versão única.
> **Revisado em:** 2026-11-08

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

Relatórios do evento para o produtor: vendas, transações, acesso, borderô, transferências,
respostas de questionários, comparação com outros eventos e um relatório montado por pedido em
linguagem natural (IA). Todos são de leitura; as versões 2 e 3 de Transações simulam edição de pedido.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Vendas e Borderô | `@/plataforma`, evento em contexto: histórico + pedidos pagos (`data/vendas-banco.ts`), no mesmo formato do dataset estático | não |
| Acesso, totais de transferência, Relatório personalizado | `@/reports/event-dataset` (JSON em `src/reports/data`, evento "Réveillon Carneiros 2027", vendas de 01/10 a 31/12/2026) | não |
| Meta do evento nos chips (fuso, moeda) e sessões | `data/event.ts` (mock "Botafogo x Chapecoense", vendas 14 a 21/06/2026) | não |
| 12.500 transações (inscrições de corrida) | gerador determinístico dentro de `pages/Transacoes*.tsx` (mock local) | não |
| 247 portadores da lista de acesso | gerador dentro de `pages/Acesso.tsx` (mock local) | não |
| Lista de transferências e histórico | mock em `pages/Transferencias.tsx` | não |
| Respostas de questionário | `data/questionarios.ts` (mock local) | edição só no estado do painel |
| Combos, produtos, cupons, árvore de detalhamento de Vendas | mocks em `pages/VendasPorGrupo.tsx`, escalados pelo período | não |
| Eventos de Comparativos | `../eventos/data/eventos` (espelho de `@/plataforma`) + perfil de venda mock `PERFIL` em `pages/Comparativos.tsx` | não |
| Colunas exportáveis | `data/export-fields.ts` (v1, v3) e `data/export-fields2.ts` (v2) | seleção só em memória |
| Relatório personalizado | `@/reports` + OpenRouter (`data/relatorio-ia.ts`) ou roteamento local | blocos só em memória |

Só Vendas e Borderô leem `@/plataforma`. O resto ainda é mock.

## Regras

### Comum a todos
- **REL-01** Todo relatório abre dentro do `BackstageLayout`, com o item do menu do evento destacado. _(pages/*.tsx)_
- **REL-02** O botão "Filtros" abre um painel com Período, Sessão (só se o relatório passar sessões) e um campo por filtro do relatório. _(components/RelatorioFilterSlideout.tsx)_
- **REL-03** As mudanças no painel são rascunho; só valem ao clicar "Aplicar", que mostra a contagem entre parênteses. _(components/RelatorioFilterSlideout.tsx)_
- **REL-04** O botão "Filtros" mostra um contador com o número de filtros aplicados (período, sessão e campos com valor). _(components/relatorio-filters.tsx, components/RelatorioFilterSlideout.tsx)_
- **REL-05** "Limpar tudo" volta ao período inicial do relatório, sessão "Todas" e sem campos. _(components/relatorio-filters.tsx)_
- **REL-06** Filtros de lista fechada são multisseleção: a linha passa se bater com qualquer valor marcado. _(components/RelatorioFilterSlideout.tsx, components/relatorio-filters.tsx)_
- **REL-07** Filtro de texto usa "contém", sem diferenciar maiúsculas. _(components/RelatorioFilterSlideout.tsx, components/relatorio-filters.tsx)_
- **REL-08** Período inclui o dia final inteiro (até 23:59:59). _(components/relatorio-filters.tsx)_
- **REL-09** Abaixo do título, uma faixa mostra "Horário de Brasília (GMT-3)", "Moeda: BRL (R$)" e um chip removível por filtro aplicado, mais "Limpar tudo". _(components/RelatorioPageHeader.tsx)_
- **REL-10** Relatórios com só o botão de período (Vendas, Relatório personalizado) aplicam a data na hora e não mostram a faixa de chips. _(components/RelatorioPageHeader.tsx, components/RelatorioFilterSlideout.tsx)_
- **REL-11** O menu "Exportar" lista "Arquivo Excel", "Arquivo .CSV" e "Arquivo PDF", ou o subconjunto que o relatório passar. _(components/RelatorioPageHeader.tsx)_
- **REL-12** Exportar não gera arquivo: só mostra um toast "Exportando {FORMATO}". _(pages/Acesso.tsx, pages/Bordero.tsx, pages/Transacoes*.tsx)_
- **REL-13** Cabeçalho ordenável: primeiro clique ordena crescente, o seguinte inverte; seta indica a direção. _(utils/useSortableTable.ts, components/SortableHeader.tsx)_
- **REL-14** Texto ordena em pt-BR com números naturais; datas e valores ordenam como número. _(utils/useSortableTable.ts)_
- **REL-15** Valores em R$ e números em pt-BR. _(data/event.ts)_

### Tabelas no celular (tabela-lista, UI-MOB-005)
- **REL-182** Abaixo de 768 px, nenhuma tabela rola para o lado: a página e cada contêiner cabem em 390 px. _(components/TabelaLista.tsx)_
- **REL-183** Lista de Transações, Produtos e Ingressos com cupom viram tabela-lista no celular: título, uma linha de apoio, valor à direita e seta; o toque abre "Detalhes" em tela cheia com todas as colunas. _(components/TabelaLista.tsx, pages/Transacoes.tsx, pages/VendasPorGrupo.tsx)_
- **REL-184** Em Transações, os detalhes mostram as colunas escolhidas em "Editar colunas", na mesma ordem. _(pages/Transacoes.tsx)_
- **REL-185** Tabelas em árvore (Ocupação, Tickets avulso, Combo, Borderô, Validação por grupo): o grupo abre e fecha pela linha; no celular, a linha final abre os detalhes com as colunas escondidas, e o subtítulo diz de onde ela é ("ONLINE · Pista"). No desktop, a linha final não abre nada. _(pages/VendasPorGrupo.tsx, pages/Bordero.tsx, pages/Acesso.tsx)_
- **REL-186** Tabelas pequenas em que tudo cabe (status e meios de pagamento de Transações) descem a contagem para baixo do nome no celular, sem clique. _(pages/Transacoes.tsx)_
- **REL-187** Na lista de portadores de Acesso, o status desce para baixo do CPF no celular. Em Transferências, o código e o selo ficam numa linha, o fluxo comprador → portador embaixo, sem avatar. _(pages/Acesso.tsx, pages/Transferencias.tsx)_

### Editar colunas (listas de Transações)
- **REL-16** "Editar colunas" abre o modal com duas áreas: opções agrupadas e colunas selecionadas. _(components/ManageColumnsModal.tsx, components/ManageColumnsModal2.tsx)_
- **REL-17** "ID do Pedido" é fixa e sempre a primeira; tooltip "Esta opção não pode ser removida.". _(components/ManageColumnsModal.tsx)_
- **REL-18** Há busca nas duas áreas, "Selecionar todas"/"Limpar seleção" geral e por grupo, remoção por X e reordenação por arraste. _(components/ManageColumnsModal.tsx)_
- **REL-19** Com mais de 50 colunas, "Salvar" fica desabilitado com o tooltip "Para mais de 50 colunas, exporte como .CSV". _(components/ManageColumnsModal.tsx)_
- **REL-20** "Exportar .csv" fica em "Exportando..." por 5 s e mostra o toast "Exportação concluída" / "N colunas foram exportadas.". Nenhum arquivo é gerado. _(components/ManageColumnsModal.tsx, pages/Transacoes*.tsx)_
- **REL-21** "Restaurar padrão" volta à seleção padrão. Fechar sem salvar descarta o rascunho; Esc fecha. _(components/ManageColumnsModal.tsx)_
- **REL-22** No celular, o modal vira painel inferior. _(components/ManageColumnsModal.tsx)_

### Vendas
- **REL-30** Título "Vendas", só com o botão de período, que abre no período completo de vendas. _(pages/VendasPorGrupo.tsx)_
- **REL-31** Métricas: Valor total (bruto), Valor total c/ desconto, Desconto, Ticket médio, Quantidade de itens e Ocupação. _(pages/VendasPorGrupo.tsx)_
- **REL-32** Desconto = valor total − valor c/ desconto, nunca negativo. _(pages/VendasPorGrupo.tsx)_
- **REL-33** Ticket médio = valor total bruto ÷ quantidade de itens (ingressos, combos e produtos); 0 sem itens. _(pages/VendasPorGrupo.tsx)_
- **REL-34** Ocupação = ingressos vendidos ÷ capacidade somada dos grupos, em %. _(pages/VendasPorGrupo.tsx)_
- **REL-35** Gráfico "Total transacionado e número de ingressos": barras de valor por dia e área de quantidade. _(pages/VendasPorGrupo.tsx, components/TransacionadoChart.tsx)_
- **REL-36** "Mix de receita" divide Ingressos, Combos e Produtos com quantidade, bruto, desconto e valor c/ desconto. _(pages/VendasPorGrupo.tsx)_
- **REL-37** No mix, valor c/ desconto = bruto × 0,97. _(pages/VendasPorGrupo.tsx)_
- **REL-38** "Detalhamento das vendas" abre em colunas: Sessão › Tipo do item › Grupo › Tipo de ingresso › Lote; "Limpar seleção" volta ao início. _(pages/VendasPorGrupo.tsx)_
- **REL-39** "Ocupação por grupo" lista Grupo • Ingresso • Lote, Estoque, Ingressos e barra de ocupação; a linha do grupo expande. _(pages/VendasPorGrupo.tsx)_
- **REL-40** Tabelas "Combo", "Produtos", "Tickets Avulso" e "Quantidade de ingressos com cupom"; Combo e cupom expandem por lote. _(pages/VendasPorGrupo.tsx)_
- **REL-41** A tabela de cupons abre ordenada por quantidade, decrescente. _(pages/VendasPorGrupo.tsx)_
- **REL-42** Combos, produtos, cupons e detalhamento são escalados pela fração do período (itens do período ÷ itens totais). _(pages/VendasPorGrupo.tsx)_
- **REL-43** Sem botão de exportar. _(pages/VendasPorGrupo.tsx)_

### Transações v1 (em uso no menu)
- **REL-50** Título "Transações", abre no período completo de vendas. _(pages/Transacoes.tsx)_
- **REL-51** Filtros: Status, Meio de pagamento, Canal (Bilheteria, Cortesia, Online), Tipo de produto (Inscrição, Produto, Combo) e Cupom (texto). Sem filtro de sessão. _(pages/Transacoes.tsx)_
- **REL-52** Status tem a opção extra "Aprovados hoje ({data})", em que "hoje" é o dia da transação mais recente do mock. _(pages/Transacoes.tsx)_
- **REL-53** Rótulos de status: Aprovado, Pendente, Carrinho Abandonado, Cancelado (estornado) e Reembolso. _(pages/Transacoes.tsx)_
- **REL-54** "Total transacionado" = soma do valor final das linhas filtradas. _(pages/Transacoes.tsx)_
- **REL-55** "Quantidade de Inscrições e Valor por status" mostra só status com linhas; canal vira "Online + PDV" quando há mais de um; % = valor do status ÷ valor total, arredondado. _(pages/Transacoes.tsx)_
- **REL-56** "Meio de Pagamentos" mostra só Pix e Cartão de Crédito, com % de transações, de inscrições e de valor. _(pages/Transacoes.tsx)_
- **REL-57** Dois gráficos: diário e acumulado de valor e inscrições. _(pages/Transacoes.tsx)_
- **REL-58** "Lista de transações" mostra o total de linhas, busca por ID, status, setor, comprador, CPF, telefone ou e-mail, e pagina com 50 por página. _(pages/Transacoes.tsx)_
- **REL-59** Buscar ou mudar filtro volta à página 1. _(pages/Transacoes.tsx)_
- **REL-60** CPF e telefone aparecem formatados, sem máscara de ocultação. _(pages/Transacoes.tsx)_
- **REL-61** Exportar da lista oferece só Excel, .CSV e "Editar colunas e exportar". _(pages/Transacoes.tsx)_
- **REL-62** Linha da lista não abre detalhe. _(pages/Transacoes.tsx)_
- **REL-63** Vazio: "Nenhuma transação corresponde aos filtros aplicados.", "Nenhum status corresponde aos filtros." e "Nenhum meio corresponde aos filtros.". _(pages/Transacoes.tsx)_

### Transações v2 e v3 (comum, fora do menu)
- **REL-70** Mesmos cards, filtros e gráficos da v1. _(pages/Transacoes2.tsx, pages/Transacoes3.tsx)_
- **REL-71** Valor total, valor por status e contagem de transações somam uma vez por pedido; quantidade de inscrições soma por linha. _(pages/Transacoes2.tsx, pages/Transacoes3.tsx)_
- **REL-72** A lista vira "Registro de vendas", com abas "Item" e "Transação"; abre em "Transação". _(pages/Transacoes2.tsx, pages/Transacoes3.tsx)_
- **REL-73** Aba Transação: uma linha por pedido, colunas próprias (padrão: ID do pedido, Status, Informações do comprador, Valor final, Quantidade), editáveis no mesmo modal. _(pages/Transacoes3.tsx)_
- **REL-74** Na aba Transação a busca ignora o setor. _(pages/Transacoes3.tsx)_
- **REL-75** Clicar numa linha da aba Transação abre o painel "Transação" com Dados do comprador, Dados da compra e Itens. _(pages/Transacoes2.tsx, pages/Transacoes3.tsx)_
- **REL-76** "Cupom ou passkey" mostra o cupom; sem cupom, mostra a passkey. _(pages/Transacoes3.tsx)_
- **REL-77** O botão "Editar" só aparece para pedido Aprovado sem link de pagamento pendente. _(pages/Transacoes2.tsx, pages/Transacoes3.tsx)_
- **REL-78** Pedido Reembolso, Cancelado ou Carrinho Abandonado não permite editar respostas do item. _(pages/Transacoes3.tsx)_
- **REL-79** Pedido com link de pagamento pendente mostra o card "Aguardando pagamento" com link copiável e contagem regressiva de 48 h; copiar mostra "Copiado" por 2 s e o toast "Link copiado". _(pages/Transacoes3.tsx)_

### Transações v2: edição dentro do painel
- **REL-80** "Editar" abre a edição de todos os itens no próprio painel: Portador, Item (data › categoria › modalidade) e respostas do questionário. _(pages/Transacoes2.tsx)_
- **REL-81** "Salvar e pagar" exige escolher "Quem pagará pela edição?": "A organização" ou "O comprador"; sem escolha, erro "Selecione quem pagará pela edição" e rolagem até o campo. _(pages/Transacoes2.tsx)_
- **REL-82** Sem alteração, "Salvar e pagar" não faz nada e mostra o tooltip "Nenhuma edição foi feita". _(pages/Transacoes2.tsx)_
- **REL-83** Salvar leva 3 s ("Salvando..."). _(pages/Transacoes2.tsx)_
- **REL-84** Organização paga: aplica na hora e mostra "Respostas atualizadas". _(pages/Transacoes2.tsx)_
- **REL-85** Comprador paga: mostra antes → depois, gera link de pagamento com prazo de 48 h, marca o item "Em edição" e mostra "Pagamento gerado". _(pages/Transacoes2.tsx)_
- **REL-86** Custo de edição por item = 5% do valor final do item (novo valor, se trocou de item). _(pages/Transacoes2.tsx)_
- **REL-87** Marca de tênis esgotada (Mizuno) exige marcar "Aumentar estoque para continuar"; contato de emergência vazio bloqueia o salvamento. _(pages/Transacoes2.tsx)_
- **REL-88** "Cancelar" desfaz as edições de todos os itens. _(pages/Transacoes2.tsx)_

### Transações v3: edição em página própria
- **REL-90** "Editar" (ou "Ver edição", se o pedido já está em edição) fecha o painel e abre a página "O que você quer mudar?", com os itens em acordeão, um aberto por vez. _(pages/Transacoes3.tsx)_
- **REL-91** Cada item edita Portador (e-mail), Item (Sessão › Categoria › Modalidade, já preenchidos) e Questionário. _(pages/Transacoes3.tsx)_
- **REL-92** Portador: e-mail válido dispara validação após 0,5 s, spinner por 2 s e confirmação com os dados do novo portador. _(pages/Transacoes3.tsx)_
- **REL-93** Trocar a sessão limpa categoria e modalidade; cada campo só habilita depois do anterior. _(pages/Transacoes3.tsx)_
- **REL-94** Categoria "PCD", modalidade "Corrida 42km" e marca "Mizuno" aparecem esgotadas; trocar para elas exige "Aumentar estoque para continuar". Manter a opção original não exige. _(pages/Transacoes3.tsx)_
- **REL-95** Erros só aparecem depois do primeiro clique em "Salvar e gerar pagamento": "Informe um e-mail válido para continuar", "Selecione uma categoria/modalidade para continuar", "Sem estoque, aumente ou troque a seleção", "Informe um contato de emergência para continuar". _(pages/Transacoes3.tsx)_
- **REL-96** O cabeçalho do item mostra "N erro(s)"; o resumo mostra "Resolva os erros dos itens para continuar.". _(pages/Transacoes3.tsx)_
- **REL-97** "Desfazer edições" de um item pede confirmação e volta o item ao original. _(pages/Transacoes3.tsx)_
- **REL-98** Resumo: Valor original (fixo), Valor atual, Excedente = máx(0, atual − original); queda de valor não gera reembolso. _(pages/Transacoes3.tsx)_
- **REL-99** Custo de edição = 5% do valor de cada item alterado (novo valor, se trocou de item). _(pages/Transacoes3.tsx)_
- **REL-100** Taxa da organização = 2% do excedente (produtor com taxa cadastrada, fixo no mock). _(pages/Transacoes3.tsx)_
- **REL-101** Total = excedente + custo de edição + taxa da organização. _(pages/Transacoes3.tsx)_
- **REL-102** "Quem pagará?" é obrigatório: sem escolha, "Selecione quem pagará para continuar". _(pages/Transacoes3.tsx)_
- **REL-103** Com o comprador pagando, "Absorver custo de edição" separa "Total para o comprador" (excedente + taxa) e "Total para organização" (custo de edição). _(pages/Transacoes3.tsx)_
- **REL-104** "Salvar e gerar pagamento" fica desabilitado sem alteração. _(pages/Transacoes3.tsx)_
- **REL-105** Organização paga: toast "Edição enviada" e modal "Edição enviada" com "Ver como ficou a edição" e "Voltar para Transações". _(pages/Transacoes3.tsx)_
- **REL-106** Comprador paga: gera link `https://cart.ingresse.com/pagamento/{id}` com prazo de 48 h, toast "Link de pagamento gerado" e modal "Aguardando pagamento" com 3 passos. _(pages/Transacoes3.tsx)_
- **REL-107** "Cancelar edição" com link pendente pede confirmação; confirmar invalida o link e tira o pedido de "Em edição". _(pages/Transacoes3.tsx)_
- **REL-108** Voltar da página de edição à lista zera os filtros do relatório. _(pages/Transacoes3.tsx)_

### Acesso
- **REL-110** Título "Acesso", exportação em Excel, .CSV e PDF. _(pages/Acesso.tsx)_
- **REL-111** Filtros: Canal, Grupo, Tipo de ingresso e Status (Validado, Não validado). _(pages/Acesso.tsx)_
- **REL-112** Métricas: Validados, Não validados e % de validação = validados ÷ (validados + não validados), arredondado. _(pages/Acesso.tsx)_
- **REL-113** "Entradas por faixa de horário" destaca a faixa de pico. _(pages/Acesso.tsx)_
- **REL-114** "Validação por grupo" divide cada grupo em Inteira (60%) e Meia-entrada (40%) e só responde ao filtro Grupo. _(pages/Acesso.tsx)_
- **REL-115** Lista de entradas busca por nome, comprador, IDs, Code, grupo, canal, tipo ou CPF (só dígitos); 100 por página; colunas ordenáveis. _(pages/Acesso.tsx)_
- **REL-116** Clicar numa entrada abre "Detalhes da entrada" com Portador, Ingresso (Code, IDs, sessão, canal, grupo, tipo, portão) e Comprador. _(pages/Acesso.tsx)_
- **REL-117** Vazio: "Nenhum grupo corresponde aos filtros." e "Nenhuma entrada corresponde aos filtros.". _(pages/Acesso.tsx)_

### Borderô
- **REL-120** Título "Borderô", abre no período completo, exportação em Excel, .CSV e PDF. _(pages/Bordero.tsx)_
- **REL-121** Métricas: Total faturado, Total de ingressos e Ticket médio = faturado ÷ ingressos (visão macro). _(pages/Bordero.tsx)_
- **REL-122** "Detalhamento do borderô" tem três visões: "Visão macro" (Canal › Grupo › Ingresso), "Por PDV" e "Por meios de pagamento". _(pages/Bordero.tsx)_
- **REL-123** Visão macro divide em ONLINE (96%) e BILHETERIA (4%); cada grupo vira Inteira (60%) e Meia-entrada (40%). _(pages/Bordero.tsx)_
- **REL-124** Linhas expandem; os nós de topo ordenam por coluna; a tabela mostra total geral. _(pages/Bordero.tsx)_
- **REL-125** Aviso "Borderô atualizado": "N transações alteraram o borderô desde o fim do evento.", com "Detalhes" e "Marcar como visto". _(pages/Bordero.tsx)_
- **REL-126** "Detalhes" abre "Transações desde o fim do evento" com tipo (Venda, Cancelamento, Estorno), canal, descrição e variação em ingressos, produtos e valor. _(pages/Bordero.tsx)_
- **REL-127** "Marcar como visto" esconde o aviso até recarregar a página. _(pages/Bordero.tsx)_

### Transferências
- **REL-130** Título "Transferências do Evento", sem exportação. _(pages/Transferencias.tsx)_
- **REL-131** Métricas: Total de transferências, Ingressos transferidos (% = transferências ÷ ingressos vendidos) e Compradores que transferiram (82% das transferências). _(pages/Transferencias.tsx)_
- **REL-132** Filtros de texto: código, nome/e-mail/CPF do comprador, do portador anterior e do atual. _(pages/Transferencias.tsx)_
- **REL-133** "Transferências realizadas" lista cards Comprador → Portador com quantas vezes o ingresso trocou de mão; 10 por página, rolando ao topo ao trocar de página. _(pages/Transferencias.tsx)_
- **REL-134** Filtrar volta à página 1. Vazio: "Nenhuma transferência corresponde aos filtros aplicados.". _(pages/Transferencias.tsx)_
- **REL-135** Clicar num card abre Identificação, Comprador original (CPF formatado) e Histórico de transferência. _(pages/Transferencias.tsx)_

### Comparativos
- **REL-140** Título "Comparativos", sem filtros nem exportação. _(pages/Comparativos.tsx)_
- **REL-141** O evento em contexto é a âncora: primeiro slot, primeira cor, sem opção de remover, base de todas as variações. _(pages/Comparativos.tsx)_
- **REL-142** Abre já comparando com o primeiro outro evento do catálogo. _(pages/Comparativos.tsx)_
- **REL-143** No máximo 4 eventos ao mesmo tempo, contando a âncora. _(pages/Comparativos.tsx)_
- **REL-144** Sem comparação, a tela mostra "Escolha um evento para comparar" e a busca aberta. _(pages/Comparativos.tsx)_
- **REL-145** Busca sem texto mostra os 6 eventos mais recentes; com texto, ordena por relevância (nome exato, começo, começo de palavra, trecho, data) e corta em 50. _(utils/busca-eventos.ts)_
- **REL-146** Busca ignora acentos e maiúsculas e não lista eventos já escolhidos. Sem resultado: "Nenhum evento encontrado". _(utils/busca-eventos.ts, pages/Comparativos.tsx)_
- **REL-147** "Medir por": Faturamento líquido, Ingressos ou Transações. "Alinhar": Dia do evento (D-N) ou Abertura (Dia N). _(pages/Comparativos.tsx)_
- **REL-148** Faturamento líquido = bruto × (1 − taxa retida); taxa de 10% no mock. _(pages/Comparativos.tsx)_
- **REL-149** Cada série tem cor e traço próprios, atribuídos pela ordem de seleção. _(pages/Comparativos.tsx)_
- **REL-150** Seções: leituras, gráfico acumulado/diário, por mês, "Em que momento cada evento vendeu" (faixas 1-15, 16-30, 31-60, 61-90, mais de 90 dias), "Preço praticado e viradas de lote" e "Os números". _(pages/Comparativos.tsx)_
- **REL-151** Diferença relativa até 1% é mostrada como "Empate técnico". _(pages/Comparativos.tsx)_
- **REL-152** "Os números": bruto, taxas retidas, líquido, ingressos, transações, ticket médio, repasse por ingresso, ocupação, melhor dia e dias de venda. _(pages/Comparativos.tsx)_

### Respostas do questionário
- **REL-160** Título "Respostas do questionário" (no menu, o mesmo nome, para não confundir com Itens › Questionário), abas "Resumo" e "Respostas". _(pages/Questionarios.tsx)_
- **REL-161** Filtro por pergunta: escolher pergunta, operador "inclui"/"não inclui" e valor; várias perguntas somam condições. _(pages/Questionarios.tsx)_
- **REL-162** Resumo mostra só perguntas de escolha (única e múltipla), 15 por página, com "Exibindo X-Y de N perguntas". _(pages/Questionarios.tsx)_
- **REL-163** % de cada opção = respostas da opção ÷ respondentes da pergunta, recalculado pelo filtro. _(pages/Questionarios.tsx)_
- **REL-164** Clicar numa opção do resumo aplica o filtro daquela pergunta e abre a aba Respostas. _(pages/Questionarios.tsx)_
- **REL-165** Respostas lista participantes únicos, busca por nome, e-mail ou documento, 10 por página. Vazio: "Nenhum participante encontrado.". _(pages/Questionarios.tsx)_
- **REL-166** O painel do participante mostra Portador e, por ingresso, Comprador e respostas; um ingresso aberto por vez. _(pages/Questionarios.tsx)_
- **REL-167** Resposta existente pode ser editada, menos anexo; pergunta sem resposta não. "Editar" pede "Confirmar alteração desta resposta?" e mostra o toast "Resposta alterada". _(pages/Questionarios.tsx)_
- **REL-168** Sem resposta: "Não respondeu". Anexo tem botão de baixar que só mostra o toast "Baixando {arquivo}". _(pages/Questionarios.tsx)_

### Relatório personalizado (IA)
- **REL-170** Sem conteúdo, a tela mostra "O que você quer descobrir?", o campo de pedido e sugestões. _(pages/RelatorioPersonalizado.tsx, components/RelatorioIAChat.tsx)_
- **REL-171** Enviar fica desabilitado com campo vazio ou enquanto gera. _(components/RelatorioIAChat.tsx)_
- **REL-172** Cada pedido usa o período escolhido e gera um ou mais blocos (métrica, medidor, barras, linha, pizza, tabela, dispersão). _(data/relatorio-ia.ts)_
- **REL-173** Com chave OpenRouter (`VITE_OPENROUTER_API_KEY` ou localStorage), envia o pedido e o resumo do período ao OpenRouter; testa o modelo escolhido e dois gratuitos de reserva. _(data/relatorio-ia.ts)_
- **REL-174** Sem chave, se todos os modelos falharem, ou em perguntas frequentes (gênero, pagamentos, saldo, por lote, ao longo do ano, todos os eventos), responde localmente. _(data/relatorio-ia.ts)_
- **REL-175** Localmente, o pedido é dividido em partes por "e", vírgula, ponto e vírgula, "também" e "mais"; correlação fica inteira. _(data/relatorio-ia.ts)_
- **REL-176** Gerar segura mais 2 s de animação e gira mensagens a cada 2 s. _(data/relatorio-ia.ts, pages/RelatorioPersonalizado.tsx)_
- **REL-177** Sem bloco: toast "Não consegui gerar um gráfico para esse pedido. Tente reformular.". Bloco repetido: toast "Esses dados já estão no relatório.". _(pages/RelatorioPersonalizado.tsx)_
- **REL-178** Métricas ficam no topo, gráficos abaixo; a tela rola até o bloco novo. _(components/RelatorioIABlocks.tsx, pages/RelatorioPersonalizado.tsx)_
- **REL-179** Cada bloco tem "Remover do relatório"; "Limpar relatório" apaga todos. _(components/RelatorioIABlocks.tsx, pages/RelatorioPersonalizado.tsx)_
- **REL-180** Após cada pedido, as sugestões giram para as próximas 3 de uma lista de 12. _(components/RelatorioIAChat.tsx)_
- **REL-181** Erro sem resposta mostra a mensagem em vermelho abaixo do campo. _(components/RelatorioIAChat.tsx)_

### Permissões
- Não tratadas em nenhum relatório.

## Depende de / afeta

- **Depende de:** evento em contexto (`useEventoAtual`) só em Comparativos. Os outros relatórios ignoram o evento aberto.
- **Afeta:** nada. Nenhum relatório grava em `@/plataforma`; edições de pedido em Transações v2/v3 e de respostas em Questionários ficam só na tela.

## Em aberto

- Transações v2 e v3 (fora do menu) ainda rolam para o lado no celular; não receberam a tabela-lista (REL-182).
- As tabelas dos relatórios são `<table>` feitas à mão, não o `Table` do DS; a tabela-lista também não tem par no DS. Conferir no AFTER DS.
- No celular, a linha de grupo das árvores mostra só a última coluna; os subtotais do grupo não têm detalhe (só a linha final abre).

- **Ligar à plataforma:** Vendas e Borderô já leem o banco (período padrão = da primeira venda até a data do evento ou hoje). Faltam Comparativos, transações (Transações v1-v3, Questionários) e acesso (Acesso, Transferências) deveriam vir de `@/plataforma` (pedidos e ingressos emitidos do evento em contexto). Hoje são mocks de outros eventos.
- **Qual Transações vale:** o menu aponta para a v1, que não tem detalhe nem edição. v2 (edição no painel) e v3 (edição em página) só abrem pela URL. Falta decidir a versão.
- **Dados de eventos diferentes na mesma tela:** chips e sessões vêm do "Botafogo x Chapecoense" (`data/event.ts`); números vêm do "Réveillon Carneiros 2027" (`src/reports`); transações são inscrições de corrida; Borderô e Vendas têm trechos de estádio. O detalhamento de Vendas usa as sessões de junho e grupos de estádio.
- `dateRangeFraction` usa a janela de junho de `data/event.ts`; o período padrão é outubro a dezembro.
- Acesso: período aparece como filtro aplicado, mas não filtra nada; métricas e faixas de horário ignoram todos os filtros; a lista tem 247 linhas contra dezenas de milhares nos totais.
- Transferências: o painel de filtros mostra Período, mas ele é ignorado; as métricas não mudam com filtros.
- Borderô: colunas "Bundle" e "Produto" sempre 0; filtro de sessão é lido mas não usado; o aviso de alterações é fixo (5 transações).
- Transações: meios de pagamento listam só Pix e Cartão de Crédito, embora o filtro tenha 8 meios. Rótulo "Cancelado" é o status estornado e "Carrinho Abandonado" é o cancelado.
- Transações v1 soma valores por linha; v2/v3 somam por pedido. Com mais de um item por pedido, os totais divergem.
- Vale-troca (seleção de itens, taxa de 10%, "Vale-troca gerado") existe em v2 e v3, mas nenhum botão abre esse modo.
- v3: tooltip do custo de edição diz "5% do valor do pedido atualizado"; o rodapé diz "5% do valor das inscrições editadas"; o cálculo é por item alterado.
- v3: portador aceita qualquer e-mail válido como conta existente, com nome aleatório. Não há caso "sem conta Ingresse".
- v2 e v3 geram links de pagamento com domínios diferentes (`pagamento.ingresse.com/editar/...` e `cart.ingresse.com/pagamento/...`).
- Taxa do produtor (2%) e esgotados (PCD, Corrida 42km, Mizuno) são fixos no código.
- Questionários: "Exportar" não tem ação (nem toast); respostas editadas somem ao fechar o painel.
- Relatório personalizado: blocos já gerados não mudam quando o período muda. O resumo do evento vai para um serviço externo (OpenRouter) quando há chave.
- Mix de receita com desconto fixo de 3%; lotes de combo divididos 60/40 com desconto de 8% só no 1º lote.
- Exportação em todos os relatórios é só toast.
- `pages/SocioDemografico.tsx` importa `components/demografia-geo`, que não existe, e não tem rota.
- Texto do modal de colunas: "Selecione até 50 colunas que para exibir" (erro de digitação).

## Fontes

Nenhum link de Figma, Confluence ou Jira no código ou na pasta.
