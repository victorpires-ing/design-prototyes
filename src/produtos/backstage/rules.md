# Backstage: regras do produto

> **Rotas:** `/backstage/*` (`/backstage` é a seleção de organização)
> **No menu:** card Backstage na seleção de produtos
> **Revisado em:** 2026-11-11

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
- **BKS-04** Menu da organização, na ordem: Eventos, Membros, Finanças, Pedidos, Produtos, Público, Ajustes. Comissários saiu em 12/11/2026: o comissário é um grupo de Equipe e Comissários (ECO-09, ECO-25). _(components/Backstage.tsx)_
- **BKS-05** Item de menu sem tela (Finanças, Ajustes; Público só na shell Novo) aparece, mas não navega. _(components/Backstage.tsx)_
- **BKS-06** Telas da organização passam `showEventContext={false}`; telas do evento mostram o card do evento e o menu do evento. _(components/Backstage.tsx)_
- **BKS-07** Menu do evento, nesta ordem (desde 12/11/2026): Informações do evento; Itens (destino único, BKS-17); Emissão de ingressos (destino único, BKS-25); Equipe e Comissários (destino único, ECO-01; até 12/11/2026 eram "Equipe de operação" e "Comissários"); Questionário (destino único, BKS-18); Marketing (destino único, BKS-25); Relatórios (destino único, BKS-25). O reagrupamento por tarefa (Montar a venda, Vender e emitir) foi desfeito em 11/11/2026 a pedido do design. A seção da tela atual abre expandida. _(components/Backstage.tsx)_
- **BKS-08** Selo "Novo" só no que acabou de chegar (hoje, Comissários); o Relatório personalizado mostra o selo de IA. _(components/Backstage.tsx)_
- **BKS-09** ~~Combos e Produtos em Itens ficam desabilitados no menu.~~ ~~Itens tem Ingressos, Produtos, Combos e Agenda de vendas no menu.~~ Substituída por BKS-17.
- **BKS-10** ~~A variante de menu `gestao-operacao` da Equipe de operação v3.~~ Removida em 11/11/2026: a Equipe de operação usa o menu padrão. _(components/Backstage.tsx)_
- **BKS-11** No mobile, o menu vira gaveta pelo botão do topo; fecha com Esc e trava a rolagem da página enquanto aberta. _(components/Backstage.tsx)_
- **BKS-16** O rail da organização (shell Clássica) tem largura fixa de 100 px com 4 px de respiro nas laterais, no Backstage e no Freepass: o rótulo mais longo cabe sem encostar na borda. _(components/Backstage.tsx)_
- **BKS-17** Itens é uma página só: no menu do evento, um item "Itens" (abre Ingressos). No topo, o título "Itens", o subtítulo e os botões "Aberturas de vendas" e "Configurações", com nome visível também no celular (lá, "Aberturas", para os dois caberem lado a lado em 390 px); abaixo, três abas, uma por coisa que o evento vende: Ingressos, Produtos e Combos (produto e combo nunca dividem a aba). No celular as três dividem a largura e cabem numa linha em 390 px; no desktop cada aba tem a largura do nome. Cada aba tem a própria rota (`/backstage/catalogo/...`), então a aba fica na URL e o voltar do navegador funciona. Aberturas de vendas (`/backstage/catalogo/aberturas-de-vendas`) e Configurações de ingressos (`/backstage/catalogo/configuracoes`) são páginas próprias, com "Itens" para voltar, título e subtítulo. `/backstage/catalogo` abre Ingressos. As telas de detalhe (ingresso, produto, combo) continuam páginas próprias. As três abas ficam numa rota-pai (`itens/pages/layout-de-itens.tsx`) que mantém a moldura montada; cada rota renderiza só o conteúdo da aba. _(components/abas-de-itens.tsx, components/Backstage.tsx)_
- **BKS-18** Questionário não faz parte de Itens: tem item próprio no menu do evento, depois de Equipe e Comissários (BKS-07), e tela com título próprio (`/backstage/catalogo/questionario`). _(components/Backstage.tsx, questionario/pages/Questionario.tsx)_
- **BKS-19** O conteúdo da tela não alarga a página na horizontal: o que passa da largura (como os círculos decorativos do estado vazio do DS) é cortado, sem barra de rolagem. Antes, no celular, isso empurrava a página e cortava os painéis fixos, como o Guia de configuração. _(components/Backstage.tsx)_
- **BKS-15** Trocar de tela anima a entrada: a tela desliza de leve da direita, os blocos sobem um depois do outro e o título aparece com escala, desfoque e opacidade. Com redução de movimento, não anima. Abas que são rotas da mesma tela (Ingressos, Produtos e Combos em Itens) contam como uma tela só: rail, menu, título e abas ficam montados e só o conteúdo da aba sobe (`chaveDaTela` no `BackstageLayout`, `.bs-aba`). _(components/transicao-de-tela.css, components/Backstage.tsx)_
- **BKS-12** A gaveta mobile usa outra lista da organização: Eventos, Pedidos, Permissão, Produtos, Público, Ajustes. _(components/Backstage.tsx, `PRODUCER_NAV`)_

### Evento em contexto
- **BKS-20** Há sempre um evento em contexto, da organização em contexto. Sem escolha salva (ou se o salvo é de outra organização), vale o primeiro da lista. _(eventos/data/eventos.ts)_
- **BKS-21** Abrir um evento na lista de Eventos troca o evento em contexto para todas as telas do evento. _(eventos/data/eventos.ts)_
- **BKS-22** O card do evento mostra capa, selo de status, data, ID, nome e produtora. _(components/Backstage.tsx)_
- **BKS-23** O botão de pré-visualizar o evento fica desabilitado ("em breve"). _(components/Backstage.tsx)_
- **BKS-24** No desktop, a capa do evento fica no topo do card do evento (BKS-22), acima do nome, na largura toda do card e sem espaçamento, no formato do banner (4:5). ID, nome, data e status vêm embaixo; o nome da produtora saiu em 12/11/2026. Ao lado do nome, o ícone de link externo ("Abrir página do evento") abre a página do evento no site em outra aba. _(components/Backstage.tsx)_
- **BKS-25** Emissão de ingressos, Relatórios e Marketing são um item só no menu do evento. Emissão abre Cortesia e, no topo das listas (`/backstage/cortesias` e `/backstage/bilheteria`; os passos dos fluxos não têm), mostra o título "Emitir ingressos" e as abas Cortesia e Bilheteria online, como Itens; o título de cada aba ("Cortesias", "Bilheteria online") fica só para leitor de tela e a ação da lista ("Emitir cortesia", "Vender ingressos") fica à direita, abaixo das abas. No Freepass, sem abas, cada tela mantém o próprio título; o item fica marcado também na Bilheteria. Relatórios mudou para a organização (BKS-26). Marketing abre direto Chave de acesso. _(components/Backstage.tsx, components/navegacao-de-secao.tsx)_
- **BKS-26** Relatórios é da organização: item "Relatórios" no menu da organização, logo depois de Eventos (ícone animado "Bar chart" do Iconly, sem as estrelas de IA e com o quadrado fechado). A tela não tem o menu do evento: título "Relatórios" no tamanho padrão de título de página, a lista empilhada dos relatórios à esquerda (Vendas, Transações, Acesso, Borderô, Transferências, Comparativos, Respostas do questionário, Relatório personalizado; no celular, botões que quebram linha, acima) e, ao lado, o evento selecionado no topo (o componente de evento com troca do Freepass) e o relatório. O título de cada relatório some da tela (fica para leitor de tela). Pelo menu do evento, Relatórios abre com "Voltar para o evento", que volta para a última tela do evento aberta (ou Informações do evento); pelo menu da organização, sem voltar. _(components/Backstage.tsx, components/navegacao-de-secao.tsx)_
- **BKS-27** O seletor do topo dos Relatórios tem "Todos os eventos" (padrão) e os eventos da organização. Em Todos, Vendas e Borderô somam os eventos da organização, com cada setor identificado pelo evento ("Pista (Nome do evento)"); os outros relatórios, que ainda leem um evento só, mostram o aviso "Este relatório ainda não soma todos os eventos: mostra só o último evento aberto." A escolha vale na sessão do navegador, ao trocar de relatório. Entrar pelo item Relatórios do menu do evento (`?de=evento`) troca o seletor para esse evento; entrar por fora do evento (menu da organização) abre sempre em "Todos os eventos". Trocar de relatório dentro dos Relatórios mantém a escolha do topo. _(components/escopo-dos-relatorios.ts, relatorios/data/vendas-banco.ts, components/navegacao-de-secao.tsx)_
- **BKS-28** Fuso e moeda ("Horário de Brasília (GMT-3)" e "Moeda: BRL (R$)") aparecem em todos os relatórios, na mesma linha do evento selecionado, alinhados à direita. Saíram da faixa de filtros de cada relatório, que agora mostra só os filtros aplicados. _(components/navegacao-de-secao.tsx, relatorios/components/RelatorioPageHeader.tsx)_
- **BKS-29** O rail do evento entra deslizando da esquerda para a direita quando a pessoa vai de uma tela da organização para uma do evento, e sai deslizando da direita para a esquerda (encolhendo, com o conteúdo ocupando o espaço) no caminho inverso. Entre telas do mesmo contexto, fica parado. Com "reduzir movimento" ligado no sistema, troca sem animação. _(components/Backstage.tsx)_
- **BKS-34** ~~Membros e Comissários são um item só no menu da organização ("Membros e Comissários", abre Membros). As listas `/backstage/membros` e `/backstage/comissarios` mostram no topo as abas sublinhadas Membros e Comissários, cada uma com a própria rota; as telas internas (cargo, cadastro e detalhe do comissário) não têm abas, mas deixam o item marcado. No celular, as abas também são sublinhadas.~~ substituída por ECO-25 e COM-110: o item volta a ser só Membros, sem abas, e Comissários virou relatório em Relatórios.
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

### Painel Freepass
- **BKS-60** O Freepass é o Backstage com acessos e funcionalidades a menos, não um produto à parte: mesma shell (`BackstageLayout`) e mesmas telas, em `/freepass/...`. O painel vem da URL. _(components/painel.ts, components/Backstage.tsx)_
- **BKS-61** Telas compartilhadas navegam com o caminho do Backstage; no Freepass, o caminho troca para `/freepass` quando a tela existe lá (cortesias e bilheteria) e o fluxo não sai do painel. _(components/painel.ts, `useNavegarNoPainel`)_
- **BKS-62** Menu da organização no Freepass: depende da visualização (FCO-85). Por evento: Eventos; por funcionalidade: uma entrada por funcionalidade. Recebimentos só para quem vende pelo link. O logo leva para o início da visualização. _(components/Backstage.tsx)_
- **BKS-63** No Freepass não há troca de organização nem ⌘K: no lugar da organização fica a pessoa logada, e a lista de eventos junta todas as organizações que a liberaram. Abrir um evento põe a organização e o evento em contexto. _(components/Backstage.tsx, freepass/data/minhas-vendas.ts)_
- **BKS-64** No Freepass o status do evento é só leitura (selo no card) e o Remix não aparece. _(components/Backstage.tsx)_
- **BKS-65** Menu do evento no Freepass (visualização por evento): Minhas vendas, quando tem link de venda, e, em Emissão de ingressos, só os canais que a produtora liberou (Cortesia, Bilheteria online). Pausado, só Minhas vendas. Na visualização por funcionalidade não há menu do evento. _(components/Backstage.tsx, `navDoFreepass`)_

### Remix
- **BKS-50** O assistente Remix vive na shell: abre de qualquer tela do Backstage (não no Freepass, BKS-64) e sabe se o contexto é a organização ou o evento em contexto. _(components/remix/remix-context.tsx)_

## Depende de / afeta

- **Afeta:** tudo que o Backstage grava na plataforma aparece no site (`/novo-site`), no link de compra (`/e/<slug>`), no checkout e nas carteiras web e do app.

## Em aberto

- Duas shells convivem (Clássica e Novo). Falta decidir qual segue.
- Várias features têm versões paralelas (membros, membros-v2, equipe-e-permissoes; transações 1, 2, 3). Cada `rules.md` diz qual está no menu.
- Membros, equipes e a maior parte dos relatórios (Transações, Acesso, Transferências, Comparativos, Questionários, Relatório personalizado) ainda usam mocks próprios.
- Finanças e Ajustes não têm tela.
- O menu da organização no desktop (BKS-04) e na gaveta mobile (BKS-12) divergem: o mobile não tem Membros nem Finanças e tem Permissão e Produtos. Falta escolher uma lista só.
- Freepass: abrir um evento troca a organização em contexto do navegador, então voltar ao Backstage abre essa organização. Não há tela de entrada nem convite (ver `freepass/rules.md`).
- Freepass: Bilheteria online usa a tela do Backstage, mas a venda ainda não é atribuída ao comissário.

## Índice das features

| Pasta | Feature |
| --- | --- |
| `organizacoes/` | Seleção e troca de organização, busca de organização ou evento |
| `eventos/` | Lista de eventos, visão geral, informações do evento e status |
| `guia-de-configuracao/` | Guia de configuração do evento: painel com o que falta para vender, holofote pós-criação e alerta de abertura |
| `ingressos/`, `catalogo/`, `aberturas-de-vendas/` | Itens: ingressos, catálogo e aberturas de vendas |
| `perguntas/`, `pesquisas/` | Perguntas e pesquisas do formulário |
| `alteracoes-pos-compra/` | Pedidos e alterações depois da compra |
| `bilheteria/`, `bilheteria-online/` | Venda pela bilheteria |
| `cortesias/` | Emissão de cortesias |
| `marketing/`, `chave-de-acesso/` | Pré-venda e chave de acesso |
| `membros/`, `membros-v2/`, `equipe-e-permissoes/` | Membros e cargos da organização |
| `equipe-e-comissarios/` | Equipe e Comissários do evento (grupos com canais, itens, cotas, pessoas e comissário opcional) |
| `equipe-de-operacao/` | Só o histórico: rules.md e pesquisa da antiga Equipe de operação, substituída por `equipe-e-comissarios/` |
| `permissao-envio/` | Permissão de envio |
| `publico/` | Público, formulários e solicitações de participação |
| `relatorios/` | Relatórios |
| `comissarios/` | Peças de Comissários reaproveitadas (condições, métricas, repasse) e as regras de cálculo; o comissário é um grupo de `equipe-e-comissarios/` |
| `freepass/` | Painel Freepass: eventos, minhas vendas no evento e recebimentos de quem vende para a organização |
