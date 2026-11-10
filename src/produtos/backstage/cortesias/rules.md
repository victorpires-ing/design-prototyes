# Cortesias: regras

> **Rotas:** `/backstage/cortesias` (relatório), `/backstage/itens` (passo 1), `/backstage/destinatarios` (passo 2), `/backstage/verificacao` (passo 3)
> **No menu:** Backstage › menu do evento › Emissão de ingressos › Cortesia
> **Versão em uso:** única, pasta `cortesias`
> **Revisado em:** 2026-11-07

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

O produtor emite itens sem custo (ingressos, produtos, combos) para uma lista de e-mails e
acompanha o que foi enviado: por pedido e destinatário, ou item a item, com cancelamento e
reenvio.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Pedidos e itens emitidos | `@/plataforma`: um pedido por destinatário no canal `cortesia`, agrupados pelo envio (`pedido.envio`) | sim, no banco |
| Catálogo de itens (sessões, grupos, ingressos) | `@/plataforma`, catálogo do evento em contexto (`data/plataforma.ts`) | estoque, ao emitir |
| Tipos e status de item | `data/item-types.ts` | não |
| Emissor | fixo, "Victor Pires" | não |
| Grupos parceiros e cotas | `data/parceiros.ts` (usado só por `pages/GruposParceiros.tsx`, sem rota) | só em memória |

A tela mostra só as cortesias do evento em contexto.

## Regras

### Banco
- **COR-90** Enviar grava um pedido por destinatário, sem cobrança (método "cortesia"), e emite os ingressos no lote atual, na carteira do e-mail. _(src/plataforma/acoes.ts, `emitirCortesias`)_
- **COR-91** Item Aceito = destinatário com conta (usuário no banco); Pendente de cadastro = sem conta. Cancelado = ingresso cancelado. _(data/cortesias-store.tsx)_
- **COR-92** Cancelar o pedido cancela os pedidos de todos os destinatários do envio; cancelar um item cancela só aquele ingresso. Renomear muda o envio em todos. _(data/cortesias-store.tsx)_

### Relatório (`/backstage/cortesias`)
- **COR-01** Sem pedidos: "Distribua itens para convidados especiais" e botão "Emitir cortesias". _(pages/RelatorioPedidos.tsx)_
- **COR-02** Com pedidos: título "Cortesias", botão "Emitir cortesia" e abas Pedidos e Itens. _(pages/RelatorioPedidos.tsx)_
- **COR-03** Aba Pedidos: uma linha por destinatário de cada pedido (pedido + e-mail), com métricas "Pedidos emitidos" e "Pedidos cancelados". _(pages/RelatorioPedidos.tsx)_
- **COR-04** Aba Pedidos: busca por ID ou nome do pedido, e-mail ou documento; filtros Status (Emitido, Cancelado) e Emissor responsável. _(pages/RelatorioPedidos.tsx)_
- **COR-05** O nome do pedido é editável na própria linha; Enter salva, Esc descarta, nome vazio não é salvo. _(pages/RelatorioPedidos.tsx, data/cortesias-store.tsx)_
- **COR-06** Cancelar destinatário cancela todos os itens dele naquele pedido, com confirmação: "Os QR codes serão invalidados e essa ação não pode ser desfeita." _(pages/RelatorioPedidos.tsx)_
- **COR-07** Seleção múltipla com "Limpar seleção" e "Cancelar destinatários selecionados"; linhas canceladas não são selecionáveis. _(pages/RelatorioPedidos.tsx)_
- **COR-08** Aba Itens: uma linha por item emitido, com métricas Itens totais, Itens com cadastro pendente, Itens cancelados e Itens validados. _(pages/RelatorioPedidos.tsx)_
- **COR-09** Aba Itens: busca por ID, nome do item, e-mail ou documento; filtros Status, Tipo do item (Ingresso, Combo, Produto) e Emissor. _(pages/RelatorioPedidos.tsx, data/item-types.ts)_
- **COR-10** Status de item: Aceito, Cancelado, Pendente de cadastro, Processando, Erro. Item transferido mostra ícone "Transferido". _(data/item-types.ts, pages/RelatorioPedidos.tsx)_
- **COR-11** Item cancelado ou com erro não é selecionável; "Cancelar" fica desabilitado em item cancelado. _(pages/RelatorioPedidos.tsx)_
- **COR-12** "Reenviar" só mostra o toast "Cortesia reenviada". _(pages/RelatorioPedidos.tsx)_
- **COR-13** Detalhe do item com erro mostra a mensagem de erro no lugar das ações. _(components/ItemDetailsSlideOut.tsx)_
- **COR-14** Paginação com 100 linhas por página por padrão nas duas abas. _(pages/RelatorioPedidos.tsx)_

### Emissão, passo 1: Itens (`/backstage/itens`)
- **COR-20** Lista de sessões com grupos e ingressos, abertas por padrão; busca por nome de grupo, item ou data da sessão. _(pages/SelecaoItens.tsx)_
- **COR-21** Máximo de 10 itens selecionados; ao atingir, os demais ficam desabilitados. Painel mostra "N de 10 cortesias selecionadas". _(data/cortesia-items.ts, pages/SelecaoItens.tsx, components/CortesiaSelectionPanel.tsx)_
- **COR-22** Seções Combos e Produtos só aparecem quando há itens; hoje os dois catálogos estão vazios. _(pages/SelecaoItens.tsx, data/cortesia-items.ts)_
- **COR-23** "Avançar" exige ao menos um item. Busca sem resultado: "Nenhum item corresponde à busca." _(pages/SelecaoItens.tsx)_

### Emissão, passo 2: Destinatários (`/backstage/destinatarios`)
- **COR-30** E-mails digitados ou colados, separados por espaço, vírgula, ponto e vírgula ou Enter. _(components/EmailListManager.tsx)_
- **COR-31** Limite de 100 e-mails; o contador mostra "N de 100 e-mails adicionados" e "limite atingido". _(components/EmailListManager.tsx)_
- **COR-32** E-mail com formato inválido fica marcado e bloqueia o avanço. _(components/EmailListManager.tsx)_
- **COR-33** Duplicados são aceitos e marcados: "E-mails repetidos receberão cortesias para cada ocorrência na lista". _(components/EmailListManager.tsx)_
- **COR-34** Importar planilha (.csv, .xlsx, .txt, também arrastando): exige coluna "email" com ao menos um contato; não pode passar de 100 nem do espaço restante na lista. Cada caso tem mensagem própria. _(components/EmailListManager.tsx, components/ImportEmailsModal.tsx)_
- **COR-35** "Limpar todos" pede confirmação. _(components/EmailListManager.tsx)_
- **COR-36** "Avançar" exige ao menos um e-mail e nenhum inválido. _(components/EmailListManager.tsx, pages/EmissaoCortesias.tsx)_

### Emissão, passo 3: Verificação final (`/backstage/verificacao`)
- **COR-40** Mostra os itens por tipo, a quantidade por destinatário e a lista de e-mails únicos, sem cadastro primeiro. _(pages/VerificacaoFinal.tsx)_
- **COR-41** Filtro de cadastro (Todos, Apenas cadastrados, Apenas sem cadastro) e busca por e-mail; 10 por página. _(pages/VerificacaoFinal.tsx)_
- **COR-42** Remover e-mail pede confirmação e tira todas as ocorrências dele. _(pages/VerificacaoFinal.tsx)_
- **COR-43** Editar e-mail só existe para quem não tem cadastro; salvar exige texto não vazio e junta duplicados. _(pages/VerificacaoFinal.tsx, components/EmailModals.tsx)_
- **COR-44** "Enviar" abre "Confirmar envio de cortesias" com "Nome do pedido" (padrão "Envio de cortesia"; vazio volta ao padrão) e a opção "Enviar QR Code por e-mail". _(components/EmailModals.tsx)_
- **COR-45** Confirmar cria o pedido, mostra "Pedido enviado" e volta para o relatório. _(pages/VerificacaoFinal.tsx)_
- **COR-46** Cada e-mail recebe um item por item selecionado, contando cada ocorrência repetida. _(data/cortesias-store.tsx)_
- **COR-47** Aberta sem dados de navegação, a tela usa 24 e-mails e itens de exemplo. _(pages/VerificacaoFinal.tsx)_

## Depende de / afeta

- **Depende de:** catálogo de ingressos, produtos e combos do evento; cadastro de usuários (com ou sem conta).
- **Afeta:** carteira dos destinatários (ingressos emitidos), estoque, relatórios de acesso e de vendas.

## Em aberto

- Status Processando e Erro não acontecem mais (a emissão é imediata no banco). Documento aparece sempre "—": o modelo não guarda documento.
- "Tem cadastro" é calculado por duas funções diferentes: na verificação ~60% têm cadastro; no relatório ~30%. O mesmo e-mail pode aparecer com e sem cadastro. _(pages/VerificacaoFinal.tsx, data/cortesias-store.tsx)_
- Cancelar na aba Pedidos cancela os itens, mas a linha continua "Emitido" (o status vem do pedido) e o botão segue ativo. O status do pedido nunca muda pela tela, então "Pedidos cancelados" só conta os sorteados.
- "Cancelar pedido completo" no detalhe cancela só os itens daquele destinatário.
- A aba Pedidos agrupa por pedido + e-mail, então duplicados viram uma linha só, embora tenham recebido itens repetidos.
- "Exportar em CSV" só escreve no console.
- "Reenviar" fica ativo em item cancelado na tabela (no detalhe, fica desabilitado).
- "Enviar QR Code por e-mail" não é gravado nem muda nada.
- Voltar da verificação para destinatários perde a lista de e-mails; voltar do passo 1 leva para `/`, a home do protótipo.
- Editar e-mail não valida formato.
- Importar aceita .xlsx, mas o arquivo é lido como texto.
- `pages/GruposParceiros.tsx` (grupos parceiros e cotas) não tem rota: está órfã.

## Fontes

Nenhum link de Figma, Confluence ou Jira no código desta pasta.
