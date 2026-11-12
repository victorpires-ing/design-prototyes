# Bilheteria online: regras

> **Rotas:** `/backstage/bilheteria`, `/backstage/bilheteria/vender`, `/backstage/bilheteria/ingresso-pdf`; as mesmas telas em `/freepass/bilheteria...` no painel Freepass (BKS-60)
> **No menu:** Backstage › menu do evento › Emissão de ingressos › Bilheteria online; Freepass › menu do evento, quando a produtora libera a bilheteria para o comissário
> **Versão em uso:** única, pasta `bilheteria` (a pasta `bilheteria-online` está vazia)
> **Revisado em:** 2026-11-11

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

Venda feita pelo produtor no Backstage, no balcão ou para convidados. O operador identifica o
comprador, monta o carrinho e escolhe entre gerar um link de pagamento ou emitir na hora,
cobrando do produtor só a taxa da bilheteria. A lista acompanha os pedidos emitidos.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Pedidos da bilheteria | `@/plataforma` (pedido no canal `bilheteria`, status e valor); tipo, emissor, link e reenvios em `data/pedidos-store.ts` (`localStorage` `bilheteria-pedidos:v2`) | sim, no banco |
| Ingressos à venda (sessões, grupos, lote atual) | `@/plataforma`, catálogo do evento em contexto (`data/plataforma.ts`) | estoque, ao vender |
| Produtos e combos | `data/catalogo.ts` (mock local) | entram no pedido como produto, sem emitir ingresso |
| Compradores conhecidos | `data/catalogo.ts` (`knownBuyers`, 4 contas) | não |
| Configuração do evento (limite, identificação, validade do link) | `data/catalogo.ts` (`EVENTO`) | não |
| Operador (emissor) | fixo, `operacao@exemplo.com` em `pages/VenderIngressos.tsx` | não |

A lista mostra só os pedidos do evento em contexto. Os pedidos de exemplo antigos saíram: a lista começa vazia.

## Regras

### Banco
- **BIL-90** O passo Itens lista os ingressos ativos do evento em contexto, no lote atual; sem ingresso à venda, mostra "Nenhum ingresso à venda neste evento" com atalho para Ingressos. _(data/plataforma.ts, pages/VenderIngressos.tsx)_
- **BIL-91** Link de pagamento: grava o pedido aguardando pagamento; o link abre o checkout de verdade (`/checkout/melhorias-de-compra?pedido=<id>`). Pagar lá aprova o pedido e emite os ingressos. _(data/plataforma.ts)_
- **BIL-92** Só a taxa: grava o pedido já pago (método "saldo"), com face R$ 0 e a taxa cobrada da produtora; os ingressos saem na hora. _(data/plataforma.ts)_
- **BIL-93** Cancelar cancela o pedido e os ingressos no banco; o estoque volta. _(data/pedidos-store.ts)_
- **BIL-94** O PDF usa o nome do evento do pedido. _(utils/gerar-ingressos.ts)_

### Lista de pedidos
- **BIL-01** Sem nada salvo, a lista nasce com 21 pedidos de exemplo. _(data/pedidos-store.ts, data/pedidos.ts)_
- **BIL-02** Cartões de resumo: Pedidos aprovados, Pedidos pendentes, Links expirados, Pedidos cancelados, contados sobre todos os pedidos. _(pages/Pedidos.tsx)_
- **BIL-03** Busca por ID do pedido ou destinatário. _(pages/Pedidos.tsx)_
- **BIL-04** Filtros: Status (Todos, Pendente, Aprovado, Expirado, Cancelado) e Emissor responsável (e-mails presentes na lista). No celular ficam atrás do botão "Filtros". _(pages/Pedidos.tsx)_
- **BIL-05** Ordenação por data da venda, decrescente por padrão; o cabeçalho da coluna alterna. _(pages/Pedidos.tsx)_
- **BIL-06** Colunas: Pagamento (status), Tipo, Pedido, Emissor responsável, Data da venda, Valor, ações. Paginação de 10 por página por padrão. _(pages/Pedidos.tsx)_
- **BIL-07** Tipos: "Link de pagamento" e "Só a taxa da bilheteria". _(data/pedidos.ts)_
- **BIL-08** Cores de status: Pendente amarelo, Aprovado verde, Cancelado cinza, Expirado vermelho. _(data/pedidos.ts)_
- **BIL-09** "Cancelar pedido" fica desabilitado em pedido cancelado. Confirma em modal: "Os itens voltam para o estoque e o comprador perde o acesso. Essa ação não pode ser desfeita." _(pages/Pedidos.tsx, components/CancelPedidosModal.tsx)_

### Detalhe do pedido (painel lateral)
- **BIL-10** Link de pagamento com "Copiar" aparece em pedido com link que não expirou; o QR do link só em pedido pendente. _(components/PedidoDetailsSlideOut.tsx)_
- **BIL-11** Pedido expirado: "O link venceu sem pagamento, 3 dias depois da venda." e botão "Refazer a venda", que abre uma venda nova. _(components/PedidoDetailsSlideOut.tsx)_
- **BIL-12** Pedido cancelado ou expirado não mostra o bloco Ações. _(components/PedidoDetailsSlideOut.tsx)_
- **BIL-13** Pedido "Só a taxa da bilheteria" oferece Baixar PDF, Imprimir na zebra e Baixar .csv. _(components/PedidoDetailsSlideOut.tsx)_
- **BIL-14** Enviar por e-mail ou WhatsApp abre modal para informar o destino; cada envio vai para o Histórico do pedido. Com mais de um envio, avisa que todas as cópias têm o mesmo QR. _(components/PedidoDetailsSlideOut.tsx, data/pedidos-store.ts)_
- **BIL-15** Envio: e-mail precisa ter formato válido; telefone precisa de 10 dígitos ou mais. _(components/EnviarModal.tsx)_

### Venda: passo 1, Comprador
- **BIL-20** Busca por documento ou e-mail, com resultado simulado em 1,2 s. "Buscar" fica desabilitado com o campo vazio. _(pages/VenderIngressos.tsx, components/BuyerStep.tsx)_
- **BIL-21** Texto com "@" e formato inválido: "E-mail inválido, confira se o e-mail está digitado corretamente." _(components/BuyerStep.tsx)_
- **BIL-22** Uma conta: "Conta encontrada". E-mail usado por mais de uma conta: "N contas usam esse e-mail" e o operador escolhe uma. _(components/BuyerStep.tsx, data/catalogo.ts)_
- **BIL-23** E-mail sem conta: segue a venda como "Comprador ainda sem conta"; os ingressos vão para esse e-mail. _(components/BuyerStep.tsx, components/PaymentStep.tsx)_
- **BIL-24** Documento sem conta: "Documento não encontrado" e orientação para buscar por e-mail ou pular a identificação. Não avança. _(components/BuyerStep.tsx, pages/VenderIngressos.tsx)_
- **BIL-25** "Pular identificação" pede confirmação: sem link de pagamento e sem acesso por face; o limite por documento deixa de valer. Fica desabilitado se o evento exige identificação. _(components/BuyerStep.tsx, components/SkipIdentificationModal.tsx)_
- **BIL-26** Avança com conta escolhida, com e-mail sem conta ou com identificação pulada. _(pages/VenderIngressos.tsx)_

### Venda: passo 2, Itens
- **BIL-30** Abas Ingressos, Produtos e Combos, com busca por grupo ou item. _(components/ItemsStep.tsx)_
- **BIL-31** Data ou sessão esgotada aparece como "Esgotado" e não é selecionável. _(components/ItemsStep.tsx)_
- **BIL-32** Limite de 4 ingressos por documento, só com comprador identificado. Ao atingir, o "+" trava. Produto e combo não contam. _(pages/VenderIngressos.tsx, data/catalogo.ts)_
- **BIL-33** Venda sem identificação bloqueia ingresso com acesso por face: selo "Bloqueado" e "Acesso por face: indisponível sem identificação do comprador." _(components/ItemsStep.tsx)_
- **BIL-34** Avança com ao menos um item no carrinho. No celular, o resumo fica numa barra fixa com o total "+ taxas". _(pages/VenderIngressos.tsx)_

### Venda: passo 3, Meio de pagamento
- **BIL-40** Ao entrar, "Link de pagamento" já vem marcado; sem identificação, vem "Cobrar só a taxa da bilheteria do produtor" e o link fica desabilitado. _(pages/VenderIngressos.tsx, components/PaymentStep.tsx)_
- **BIL-41** Link: o comprador paga subtotal + 10% de taxa de serviço; aviso "O pedido será criado antes do pagamento". _(components/PaymentStep.tsx)_
- **BIL-42** Taxa da bilheteria: "O comprador não paga nada. Os ingressos saem emitidos na hora." _(components/PaymentStep.tsx)_
- **BIL-43** "Vender ingresso" mostra "Processando compra" por 2,2 s e cria o pedido. Link nasce Pendente; taxa da bilheteria nasce Aprovado. _(pages/VenderIngressos.tsx, data/pedidos-store.ts)_
- **BIL-44** Valor gravado no pedido: subtotal + 10%, nos dois tipos. _(data/pedidos-store.ts)_

### Venda concluída
- **BIL-50** "Pedido emitido!" com o ID. Link: QR, link com "Copiar", envio por WhatsApp ou e-mail e "O link vale por 3 dias. Enquanto não for pago, os ingressos seguem reservados para este pedido." _(components/OrderSuccess.tsx)_
- **BIL-51** Taxa da bilheteria: download em PDF (uma página A4 por unidade), Zebra ou planilha .csv (uma linha por unidade). _(components/OrderSuccess.tsx, utils/gerar-ingressos.ts)_
- **BIL-52** Zebra mostra "Impressão Zebra ainda não está disponível neste protótipo". _(pages/VenderIngressos.tsx, pages/Pedidos.tsx)_
- **BIL-53** Voltar só existe durante o fluxo; no passo 1 volta para a lista. _(pages/VenderIngressos.tsx)_

### Estados
- **BIL-60** Sem pedidos: "Venda ingressos online para seu evento" com "Comece a vender". Com `?sem-itens=1`: "Configure algum item antes de vender." e o botão leva para o catálogo de ingressos. _(pages/Pedidos.tsx)_
- **BIL-61** Filtro sem resultado: "Nenhum pedido encontrado para os filtros." _(pages/Pedidos.tsx)_
- **BIL-62** Busca de itens sem resultado: "Nenhum item encontrado para a busca.", ou indica em qual aba há resultado. _(components/ItemsStep.tsx)_
- **BIL-63** Expirado e cancelado não acontecem pela venda. Para testar: vender para `expirado@mail.com` cria pedido expirado; em dev, `window.bilheteria.expirar()`, `reabrir()` e `limpar()`. _(data/pedidos-store.ts)_

### Pré-visualização do PDF
- **BIL-70** `/backstage/bilheteria/ingresso-pdf` mostra uma moldura de visualizador de PDF com dados de placeholder; zoom de 50% a 200%. Só é acessível pela URL. _(pages/IngressoPdf.tsx)_

## Depende de / afeta

- **Depende de:** catálogo de ingressos, produtos e combos do evento; contas de usuário; configuração de limite por documento e de identificação obrigatória.
- **Afeta:** carteira do comprador (ingressos emitidos), estoque, checkout (link de pagamento), relatórios de vendas e borderô (taxa da bilheteria).

## Em aberto

- "Expirado" ainda é só local: o banco não expira link (`window.bilheteria.expirar()` em dev).
- Produtos e combos da bilheteria são mock e não emitem ingresso, nem o combo.
- Comprador sem conta (e-mail não encontrado): o passo 1 diz que itens com acesso por face não poderão ser vendidos, mas o bloqueio só existe ao pular a identificação. _(components/BuyerStep.tsx, components/ItemsStep.tsx)_
- `contaPendente` é gravado no pedido mas não aparece em nenhuma tela.
- Venda sem identificação emite os ingressos para `bilheteria@exemplo.com`.
- Combo emite ingressos mas não conta para o limite por documento.
- O envio pela tela de sucesso só mostra toast; não fica no Histórico do pedido, diferente do envio pelo painel.
- Busca na lista diz "pedido ou e-mail do comprador", mas todos os pedidos de exemplo têm o mesmo destinatário. Mudar a busca não volta para a página 1.
- A pré-visualização `ingresso-pdf` não tem link em nenhuma tela.
- O modal de cancelamento aceita vários pedidos, mas a lista não tem seleção múltipla.

## Fontes

Nenhum link de Figma, Confluence ou Jira no código desta pasta.
