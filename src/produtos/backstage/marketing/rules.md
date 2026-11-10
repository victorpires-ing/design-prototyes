# Pré-venda: regras

> **Rotas:** `/backstage/marketing/pre-venda`
> **No menu:** não tem. A tela só é aberta pela URL; o menu do evento › Marketing só lista "Chave de acesso".
> **Versão em uso:** única, pasta `marketing`
> **Revisado em:** 2026-11-07

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

O produtor cria uma pré-venda para um evento de alta demanda: define período, itens
participantes, valor mínimo da oferta e limite de emissões. O público faz ofertas e o produtor
acompanha quantas ofertas entraram e o ticket médio antes de abrir os lotes oficiais.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Itens elegíveis (sessões, grupos, inteira/meia, combos) | árvore fixa em `components/SelecionarItensSlideOut.tsx` (mock local) | não |
| Configuração da pré-venda (datas, itens, valores, limites) | estado da página `pages/PreVenda.tsx` | só em memória; sair da tela perde |
| Ofertas, ticket médio, gráfico | valores fixos e gerados por hash em `pages/PreVenda.tsx` | não |

Não lê nada de `@/plataforma` nem do evento em contexto. `data/pre-venda-itens.ts` só fornece o tipo `ItemTipo`; a lista de 100 itens dele não é usada.

## Regras

### Entrada
- **MKT-01** Sem pré-venda: "Antecipe vendas em eventos concorridos" com "Como funciona?" e "Criar pré-venda". _(pages/PreVenda.tsx)_
- **MKT-02** "Como funciona?" abre um modal de 4 passos que termina em "Criar pré-venda". _(components/ComoFuncionaModal.tsx)_
- **MKT-03** Toda troca de etapa (vazio, configuração, criada) mostra um carregamento de 1,6 s. _(pages/PreVenda.tsx)_
- **MKT-04** A tela abre sem o contexto do evento e sem o menu do evento. _(pages/PreVenda.tsx)_

### Configuração
- **MKT-10** Campos gerais: Data de início e Data de fim (obrigatórias, com hora, 24 h), "Limite de emissões do evento" (inteiro, opcional; vazio usa o limite de cada item) e "Compartilhar valor do primeiro lote" (marcado como Recomendado, desmarcado por padrão). _(pages/PreVenda.tsx)_
- **MKT-11** Itens participantes vêm de um painel lateral em árvore: Ingressos › sessão › grupo › Inteira/Meia, e Combos › grupo › Inteira/Meia. Busca filtra a árvore; salvar exige ao menos um item. _(components/SelecionarItensSlideOut.tsx)_
- **MKT-12** Depois de confirmar os itens, a tabela mostra carregamento de 3 s. _(pages/PreVenda.tsx)_
- **MKT-13** Tabela de itens: abas Todos, Ingressos, Combos; busca por nome ou grupo; colunas Nome, Valor mínimo (moeda), Limite (inteiro) e remover. _(pages/PreVenda.tsx)_
- **MKT-14** O botão de estrela ao lado de um valor ou limite preenchido copia esse dado para os outros itens: "Para todos os itens" (sobrescreve) ou só para os vazios. Fica desabilitado com o campo vazio. _(pages/PreVenda.tsx, components/CompartilharValorModal.tsx)_
- **MKT-15** Remover item pede confirmação: "Remover item da pré-venda?" _(components/RemoverItemModal.tsx)_
- **MKT-16** Voltar: ao criar, volta para o vazio; ao editar, volta para a pré-venda criada. _(pages/PreVenda.tsx)_

### Validações
- **MKT-20** "Salvar" sem data de início ou de fim marca o campo com "Campo obrigatório". _(pages/PreVenda.tsx)_
- **MKT-21** "Salvar" sem itens destaca o bloco em vermelho e mostra o toast "Adicione ao menos um item". _(pages/PreVenda.tsx)_
- **MKT-22** Valor mínimo e limite por item são opcionais. _(pages/PreVenda.tsx)_

### Pré-venda criada
- **MKT-30** Título "Pré-venda" com selo "Rascunho" e o período "Disponível entre … e …". _(pages/PreVenda.tsx)_
- **MKT-31** Alerta: "Publique o evento para ativar a pré-venda no período definido". _(pages/PreVenda.tsx)_
- **MKT-32** Métricas Ofertas, Ticket médio e Maior oferta, zeradas enquanto não está em andamento. _(pages/PreVenda.tsx)_
- **MKT-33** Tabela de itens com Nome, Ofertas, Ticket médio, Valor mínimo e Limite, ordenável por coluna; sem valor ou limite mostra "—". _(pages/PreVenda.tsx)_
- **MKT-34** "Cancelar pré-venda" só aparece enquanto não está em andamento. "Editar" volta à configuração com os dados preenchidos. _(pages/PreVenda.tsx)_
- **MKT-35** Em andamento (só simulado), aparecem o gráfico "Acompanhamento de ofertas" e ofertas por item; a faixa de preço nunca começa abaixo do valor mínimo do item. _(pages/PreVenda.tsx)_

### Estados
- **MKT-40** Busca sem resultado: "Não encontramos resultados para “termo”." com "Limpar busca". Aba sem itens: "Sua pré-venda não possui combos/ingressos selecionados." _(pages/PreVenda.tsx)_

## Depende de / afeta

- **Depende de:** evento publicado; catálogo de ingressos, sessões e combos do evento.
- **Afeta:** site e página do evento (selo de pré-venda, oferta do comprador), checkout das ofertas aceitas.

## Em aberto

- Sem entrada no menu: a rota é órfã. Decidir se entra em Marketing, ao lado de Chave de acesso.
- Não usa `@/plataforma`: os itens deveriam vir do catálogo do evento em contexto e a pré-venda deveria ser gravada no evento.
- `publicado` é fixo em `false`: o selo é sempre "Rascunho" e o estado "Em andamento" nunca é alcançável (o atalho de simulação está no selo "Agendada", que não aparece).
- O período exibido é fixo ("01/02/2026 às 10:00" a "07/02/2026 às 10:00"), não as datas configuradas.
- Não valida data de fim depois da data de início.
- "Cancelar pré-venda" e o menu "Mais opções" da métrica Ofertas não fazem nada.
- "Limite de emissões do evento" e "Compartilhar valor do primeiro lote" são guardados, mas não aparecem nem têm efeito depois de salvar.
- Itens e sessões da árvore são fixos (Grupo A/B/C, 05 e 06/06/2026) e não batem com as datas do gráfico (01 a 07/02).
- `data/pre-venda-itens.ts` gera 100 itens que nada usa.

## Fontes

Nenhum link de Figma, Confluence ou Jira no código desta pasta.
