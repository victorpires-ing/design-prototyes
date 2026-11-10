# Backstage: regras do produto

> **Rotas:** `/backstage/*` (`/backstage` é a seleção de organização)
> **No menu:** card Backstage na seleção de produtos
> **Revisado em:** 2026-11-07

Regras que valem para todas as features do Backstage: shell, navegação, evento em contexto e
ligação com o resto da plataforma. Cada feature tem o próprio `rules.md` na pasta dela (índice
no fim). Mudou uma regra no código, mude o `rules.md` no mesmo commit.

## O que é

Painel da produtora. A organização cria e gerencia eventos, ingressos, equipe, emissões e
relatórios. É a origem dos dados que o site, o link de compra, o checkout e as carteiras
mostram.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Eventos, catálogo de ingressos e status | `@/plataforma` (espelhado em `eventos/data/eventos.ts`) | sim, no banco |
| Pedidos e ingressos emitidos (site, link, bilheteria, cortesia) | `@/plataforma` | sim: bilheteria, cortesias e transferência em Pedidos |
| Histórico de vendas dos eventos da seed | `@/plataforma` (coleção `historico`) | não |
| Organizações | `@/plataforma` (coleção `organizacoes`) | não |
| Organização em contexto | `sessionStorage` e `localStorage` (ver `organizacoes/rules.md`) | sim, no navegador |
| Evento em contexto | `localStorage` `backstage-evento-atual` | sim, no navegador |
| Variante de shell | `localStorage` `backstage-layout-variant` | sim, no navegador |
| Membros, equipes, relatórios (menos Vendas e Borderô) | mocks locais de cada feature | só em memória |

## Regras

### Shell e navegação
- **BKS-00** ~~Não há tela de início: entrar no Backstage abre Eventos.~~ substituída por BKS-13.
- **BKS-13** Entrar no Backstage abre a seleção de organização; quem já escolheu nesta sessão vai direto para Eventos (ORG-01 a ORG-04). _(src/app/App.tsx, organizacoes/)_
- **BKS-14** Há sempre uma organização em contexto. Tudo que o Backstage lista (eventos, métricas, pedidos) é dela; a troca fica no avatar, no chip ou em ⌘K (ORG-20 a ORG-23). _(organizacoes/data/organizacao-atual.ts)_
- **BKS-01** Toda tela do Backstage usa `BackstageLayout`. Não monte rail ou cabeçalho próprio. _(components/Backstage.tsx)_
- **BKS-02** Duas shells: **Clássica** (rail da organização à esquerda) e **Novo** (barra da organização no topo). A escolhida persiste entre páginas. _(components/Backstage.tsx)_
- **BKS-03** O seletor de shell é ferramenta de protótipo: fica oculto e aparece com Shift+L, fora de campos de texto. _(components/Backstage.tsx)_
- **BKS-04** Menu da organização, na ordem: Eventos, Membros, Finanças, Pedidos, Público, Ajustes. _(components/Backstage.tsx)_
- **BKS-05** Item de menu sem tela (Finanças, Ajustes; Público só na shell Novo) aparece, mas não navega. _(components/Backstage.tsx)_
- **BKS-06** Telas da organização passam `showEventContext={false}`; telas do evento mostram o card do evento e o menu do evento. _(components/Backstage.tsx)_
- **BKS-07** Menu do evento, na ordem: Informações do evento, Equipe de operação, Itens, Emissão de ingressos, Relatórios, Marketing. A seção da tela atual abre expandida. _(components/Backstage.tsx)_
- **BKS-08** Itens de menu marcados `novo` mostram selo "Novo"; o Relatório personalizado mostra selo de IA. _(components/Backstage.tsx)_
- **BKS-09** ~~Combos e Produtos em Itens ficam desabilitados no menu.~~ Itens tem Ingressos, Produtos, Combos e Agenda de vendas, todos ativos (ver `itens/rules.md`). _(components/Backstage.tsx)_
- **BKS-10** A variante de menu `gestao-operacao` é usada só pela Equipe de operação v3 e troca a lista de seções. _(components/Backstage.tsx)_
- **BKS-11** No mobile, o menu vira gaveta pelo botão do topo; fecha com Esc e trava a rolagem da página enquanto aberta. _(components/Backstage.tsx)_
- **BKS-12** A gaveta mobile usa outra lista da organização: Eventos, Pedidos, Permissão, Produtos, Público, Ajustes. _(components/Backstage.tsx, `PRODUCER_NAV`)_

### Evento em contexto
- **BKS-20** Há sempre um evento em contexto, da organização em contexto. Sem escolha salva (ou se o salvo é de outra organização), vale o primeiro da lista. _(eventos/data/eventos.ts)_
- **BKS-21** Abrir um evento na lista de Eventos troca o evento em contexto para todas as telas do evento. _(eventos/data/eventos.ts)_
- **BKS-22** O card do evento mostra capa, selo de status, data, ID, nome e produtora. _(components/Backstage.tsx)_
- **BKS-23** O botão de pré-visualizar o evento fica desabilitado ("em breve"). _(components/Backstage.tsx)_

### Status do evento
- **BKS-30** Status, na ordem: Rascunho, Privado, Publicado, Encerrado. _(eventos/components/AlterarStatusModal.tsx)_
- **BKS-31** Rascunho não vende. Privado vende só pelo link de compra. Publicado vende e aparece no site. Encerrado para de vender. _(src/plataforma/regras.ts)_
- **BKS-32** Existe um único modal de status por tela. O card, o topo mobile e Informações do evento só pré-selecionam a escolha; quem confirma é o modal. _(components/Backstage.tsx)_
- **BKS-33** Encerrado é definitivo: o seletor de status fica desabilitado, com o aviso "Evento encerrado. O status não pode mais ser alterado." _(components/Backstage.tsx)_

### Plataforma
- **BKS-40** Evento, ingresso, lote, pedido e ingresso emitido vêm de `@/plataforma`. Feature nova não cria mock próprio desses dados. _(src/plataforma/README.md)_
- **BKS-41** Vendido e emissões são derivados dos ingressos emitidos mais o histórico de vendas, nunca digitados. Use `useVendidos()`. _(src/plataforma/vendidos.ts)_
- **BKS-43** Toda venda ou emissão feita no Backstage (bilheteria, cortesia) vira pedido no banco e aparece em Pedidos, nas métricas e na carteira de quem recebe. _(src/plataforma/acoes.ts)_
- **BKS-42** O lote à venda é o primeiro com saldo. _(src/plataforma/regras.ts)_

### Remix
- **BKS-50** O assistente Remix vive na shell: abre de qualquer tela e sabe se o contexto é a organização ou o evento em contexto. _(components/remix/remix-context.tsx)_

## Depende de / afeta

- **Afeta:** tudo que o Backstage grava na plataforma aparece no site (`/novo-site`), no link de compra (`/e/<slug>`), no checkout e nas carteiras web e do app.

## Em aberto

- Duas shells convivem (Clássica e Novo). Falta decidir qual segue.
- Várias features têm versões paralelas (membros, membros-v2, equipe-e-permissoes; equipe de operação v1, v2, v3; transações 1, 2, 3). Cada `rules.md` diz qual está no menu.
- Membros, equipes e a maior parte dos relatórios (Transações, Acesso, Transferências, Comparativos, Questionários, Relatório personalizado) ainda usam mocks próprios.
- Finanças e Ajustes não têm tela.
- O menu da organização no desktop (BKS-04) e na gaveta mobile (BKS-12) divergem: o mobile não tem Membros nem Finanças e tem Permissão e Produtos. Falta escolher uma lista só.

## Índice das features

| Pasta | Feature |
| --- | --- |
| `organizacoes/` | Seleção e troca de organização, busca de organização ou evento |
| `eventos/` | Lista de eventos, visão geral, informações do evento e status |
| `ingressos/`, `catalogo/`, `aberturas-de-vendas/` | Itens: ingressos, catálogo e aberturas de vendas |
| `perguntas/`, `pesquisas/` | Perguntas e pesquisas do formulário |
| `alteracoes-pos-compra/` | Pedidos e alterações depois da compra |
| `bilheteria/`, `bilheteria-online/` | Venda pela bilheteria |
| `cortesias/` | Emissão de cortesias |
| `marketing/`, `chave-de-acesso/` | Pré-venda e chave de acesso |
| `membros/`, `membros-v2/`, `equipe-e-permissoes/` | Membros e cargos da organização |
| `equipe-de-operacao/` (v1, v2, v3) | Equipe de operação do evento |
| `permissao-envio/` | Permissão de envio |
| `publico/` | Público, formulários e solicitações de participação |
| `relatorios/` | Relatórios |
