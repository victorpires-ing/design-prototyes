# Produtos da organização: regras

> **Rotas:** `/backstage/produtos`, `/backstage/produtos/:id` (`novo` cria)
> **No menu:** Backstage › menu da organização › Produtos (rail, barra do topo e gaveta mobile)
> **Versão em uso:** única (`produtos-organizacao/`)
> **Revisado em:** 2026-11-08

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

A biblioteca de produtos da organização (camiseta, copo, estacionamento). Aqui se define o que vale
para todos os eventos. Cada evento só escolhe quais vender e define preço, estoque, transferência e
se está à venda (Itens › Produtos, `itens/rules.md` ITM-50 a 53).

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Produtos | `Organizacao.produtos` da organização em contexto; sem ela, 4 produtos iniciais de exemplo | sim (`salvarBiblioteca`) |
| Em quantos eventos | `Evento.produtos` dos eventos da organização | não |

## Regras

- **POR-01** A lista mostra imagem, nome, "Em N eventos" (ou "Em nenhum evento") e "R$ X sugerido", por nome. Busca e "N de M" só com mais de 8 produtos; "Mostrar mais" acima de 20 (UI-LST-001). _(pages/ProdutosDaOrganizacao.tsx)_
- **POR-02** "Criar produto" abre o detalhe em modo novo. Vazio: "Nenhum produto ainda" com "Criar produto". _(pages/ProdutosDaOrganizacao.tsx)_
- **POR-03** Detalhe: Informações (nome obrigatório, descrição, imagem PNG/JPG até 400 KB, preço sugerido obrigatório, "Cada evento começa com este preço e pode mudar.") e Vendas (quantidade por pedido, igual à do catálogo). Edição em rascunho com a barra de salvar e confirmação ao sair. _(pages/ProdutoDaOrganizacaoDetalhe.tsx)_
- **POR-04** Excluir só produto que não está em nenhum evento, com confirmação; em uso, a tela diz "Está em N eventos: remova deles antes de excluir." _(pages/ProdutoDaOrganizacaoDetalhe.tsx)_
- **POR-05** Ícones do menu da organização são animações do Iconly em traço (Calendar, users, Wallet, Shopping Cart, bag, users group, Setting, Add user), que tocam uma vez no hover ou foco e ficam paradas com reduzir movimento (UI-DS-008). _(components/icones-organizacao.ts, components/Backstage.tsx)_

## Em aberto

- Variações de produto (tamanho da camiseta) não existem: cada variação vira um produto.
- Regras de venda antigas gravadas no produto do evento (`ProdutoNoEvento.vendas`) não são mais lidas; saem quando o produto do evento é salvo.
- Finanças e Ajustes seguem sem tela.
