# Organizações: regras

> **Rotas:** `/backstage` (tela de seleção); modal de troca em qualquer tela do Backstage
> **No menu:** entrada do Backstage (card Backstage na seleção de produtos); avatar do rail clássico, chip da barra do topo, chip da gaveta mobile ou ⌘K / Ctrl+K
> **Versão em uso:** única (`organizacoes/`)
> **Revisado em:** 2026-11-07

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

Porta de entrada do Backstage. Quem tem acesso a várias organizações escolhe em qual vai
trabalhar, ou busca um evento e vai direto para ele. A mesma busca, em modal, troca de organização
de qualquer tela.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Organizações | `@/plataforma` (coleção `organizacoes`) | não (sem tela de criar) |
| Eventos de cada organização | `@/plataforma` (`organizacaoDoEvento`) | não |
| Organização escolhida nesta sessão | `sessionStorage` `backstage-organizacao-sessao` | sim, no navegador |
| Última organização (links diretos) | `localStorage` `backstage-organizacao-atual` | sim, no navegador |
| Recentes | `localStorage` `backstage-organizacoes-recentes` | sim, no navegador |

## Regras

### Entrada (`/backstage`)
- **ORG-01** Entrar pelo `/backstage` mostra a tela "Escolha onde trabalhar". _(pages/SelecaoOrganizacao.tsx)_
- **ORG-02** Já escolheu nesta sessão do navegador: `/backstage` vai direto para Eventos, sem perguntar. Sessão nova (outra aba depois de fechar, outro navegador) pergunta de novo. _(pages/SelecaoOrganizacao.tsx, data/organizacao-atual.ts)_
- **ORG-03** Com uma organização só, a tela é pulada: ela vira a escolhida e a pessoa vai para Eventos. _(pages/SelecaoOrganizacao.tsx)_
- **ORG-04** Link direto (ex.: `/backstage/eventos`) usa a última organização escolhida. Sem nenhuma, vale a do evento em contexto salvo ou a do evento mais recente, sem contar como escolha. _(eventos/data/eventos.ts)_

### Busca
- **ORG-05** Sem texto, a lista mostra, nesta ordem: Organização selecionada (só no modal), Recentes (até 4, sem repetir a selecionada), Todas as organizações (A–Z) e Todos os eventos. _(components/BuscaOrganizacaoEvento.tsx)_
- **ORG-06** Com texto, dois grupos: Organizações (nome ou sigla) e Eventos (nome, local, cidade ou ID exato). Sem acento e sem caixa. _(components/BuscaOrganizacaoEvento.tsx)_
- **ORG-07** Eventos vêm do mais próximo de hoje para o mais distante. _(components/BuscaOrganizacaoEvento.tsx)_
- **ORG-08** Linha de organização: avatar com a sigla, nome e "N eventos ativos" (privado ou publicado). Linha de evento: capa, nome, organização · data · cidade e selo de status. _(components/BuscaOrganizacaoEvento.tsx)_
- **ORG-09** Teclado: ↑ ↓ navegam, Enter escolhe; o campo já abre focado. _(components/BuscaOrganizacaoEvento.tsx)_

### Escolha
- **ORG-10** Escolher uma organização: ela vira a escolhida (sessão, última e recentes) e a pessoa vai para Eventos. _(components/BuscaOrganizacaoEvento.tsx)_
- **ORG-11** Escolher um evento: a organização dele vira a escolhida, ele vira o evento em contexto e a pessoa vai para Relatórios › Vendas (mesmo destino do cartão em Eventos, EVT-07). _(components/BuscaOrganizacaoEvento.tsx)_
- **ORG-12** Trocar de organização troca o que o Backstage mostra: Eventos, métricas e Pedidos passam a ser os dela. Se o evento em contexto não é dela, vale o primeiro evento dela. _(eventos/data/eventos.ts)_

### Troca (modal)
- **ORG-20** O avatar do rail clássico, o chip da barra do topo e o chip da gaveta mobile mostram a organização em contexto e abrem o modal de troca. _(components/Backstage.tsx)_
- **ORG-21** ⌘K (Mac) ou Ctrl+K abre e fecha o modal em qualquer tela do Backstage. _(components/SeletorOrganizacaoModal.tsx)_
- **ORG-22** O modal usa a mesma busca da tela (ORG-05 a ORG-11) e fecha ao escolher, com Esc ou clicando fora. Reabre sempre com a busca vazia. _(components/SeletorOrganizacaoModal.tsx)_
- **ORG-23** Criar evento usa a organização em contexto; o campo Produtor começa com o nome dela. _(components/CriarEventoModal.tsx, eventos/data/eventos.ts)_

### Estados
- **ORG-40** Carregando o banco: linhas em esqueleto. _(components/BuscaOrganizacaoEvento.tsx)_
- **ORG-41** Busca sem resultado: "Nenhuma organização ou evento com “<termo>”." e o botão "Limpar busca". _(components/BuscaOrganizacaoEvento.tsx)_
- **ORG-42** Erro ao ler o banco sem nada em cache: "Não foi possível carregar as organizações." e "Tentar de novo". _(components/BuscaOrganizacaoEvento.tsx)_

## Depende de / afeta

- **Depende de:** coleção `organizacoes` e `Evento.organizacaoId` (`src/plataforma`).
- **Afeta:** Eventos (lista, métricas, evento em contexto), Pedidos e Criar evento. Site, checkout e carteiras não mudam: o site mostra eventos de todas as organizações.

## Em aberto

- Permissão por organização: hoje todo mundo vê todas (perfil Ingresse Interno). Falta definir o que um produtor com uma ou poucas organizações enxerga.
- Remover item dos Recentes (o "×" do seletor atual em produção) ficou fora: botão dentro de opção de lista quebra a navegação por teclado. Decidir se vale outro jeito.
- Lista com centenas de organizações: sem paginação. Precisa do número real de organizações por usuário interno.
- As organizações da seed vêm das produtoras dos eventos; as do site são o nome do artista (ex.: "by Johnnie Walker").
- Pedidos dos eventos de demonstração da pós-compra (fora do banco) aparecem em qualquer organização (PED-92).
- Membros, Público e os relatórios fora de Vendas e Borderô ainda não filtram pela organização.

## Fontes

- Seletor atual do Backstage em produção ("Buscar organizações", ⌘K): print enviado pelo Victor em 2026-11-07.
