# Guia de configuração do evento: regras

> **Rotas:** sem rota própria. Aparece em toda tela do Backstage com contexto de evento (`BackstageLayout`, `showEventContext`), menos no Freepass.
> **No menu:** não tem item de menu. Painel no canto inferior direito; o alerta fica em Itens › Ingressos (`/backstage/catalogo/ingressos`).
> **Versão em uso:** única (`guia-de-configuracao/`)
> **Revisado em:** 2026-11-12

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

Painel "Guia de configuração" que mostra ao produtor o que falta para o evento vender: setores,
ingressos, abertura de vendas e publicação. Cada passo lê o estado real do evento e leva à tela que o
resolve. Porte da branch `feat/event-setup-journey` do `awa-backstage-web` (MKT-1051). Não substitui a
criação de evento (`eventos/`, `/backstage/eventos/novo`): entra logo depois dela.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Setores, ingressos e aberturas do evento | `@/plataforma` (`useDoc("eventos", id)`: `sessoes[].grupos[].ingressos`, `aberturas`) | não |
| Status do evento | `@/plataforma` (`Evento.status`) | não (publicar usa o modal de status, `eventos/`) |
| Fechado, minimizado, holofote pendente | `localStorage` `backstage-guia-configuracao:<marca>:<eventoId>` (`data/memoria.ts`) | só no navegador |

## Regras

### Comportamento
- **GDC-01** O guia monta no `BackstageLayout` (as duas shells, clássica e topo) e acompanha o produtor por todas as telas do evento. No Freepass não aparece. _(components/Backstage.tsx, components/guia-de-configuracao.tsx)_
- **GDC-02** Passos, nesta ordem: "Crie os setores do evento" (Criar), "Crie ingressos com preço e lote" (Criar), "Programe o início das vendas" (Programar), "Publique o evento" (Publicar). A lista vai até publicar porque o guia some quando acaba, e sumir com o evento em rascunho diria que está tudo certo. _(data/passos.ts)_
- **GDC-03** Cada passo é feito pelo estado real do evento, sem contador guardado: setores = existe setor em alguma sessão; ingressos = existe ingresso em algum setor; abertura = existe abertura de vendas com ao menos um ingresso do evento (abertura vazia não vende nada); publicar = status privado, publicado ou encerrado (só rascunho fica pendente). Desfazer reabre o passo sozinho. _(data/passos.ts, data/use-guia.ts)_
- **GDC-04** Enquanto o banco carrega, o guia não aparece. Melhor calar do que cobrar um passo talvez já feito. _(data/passos.ts)_
- **GDC-05** Dependências declaradas: ingressos precisa de setor; abertura precisa de setor e ingresso; publicar precisa de setor e ingresso. A abertura não bloqueia publicar (evento publicado antes da abertura é a página "em breve"). Passo feito nunca é bloqueado. _(data/passos.ts)_
- **GDC-06** Passo atual = primeiro pendente e desbloqueado. Só ele mostra a ação ("Criar", "Programar", "Publicar") à direita. A linha inteira é o botão. _(data/passos.ts, components/painel-do-guia.tsx)_
- **GDC-07** Marcadores: feito com o check verde, atual e pendente com o número (`IconLeftNumber` do DS, tamanho md), bloqueado com cadeado no lugar do número e desabilitado. O nome acessível do bloqueado é o passo mais o motivo ("Precisa de um setor antes", "Precisa de setor e ingresso criados antes", "Precisa de ingressos criados antes"). _(components/painel-do-guia.tsx)_
- **GDC-08** Minimizar recolhe o painel à faixa do título (o corpo fica inerte para o Tab); expandir reabre. A escolha fica gravada por evento. _(components/painel-do-guia.tsx, data/memoria.ts)_
- **GDC-09** O painel sobe de fora da tela ao aparecer e desce ao ser fechado; o título entra palavra a palavra e os passos em cascata. Com reduzir movimento, tudo nasce no lugar. _(components/painel-do-guia.tsx)_
- **GDC-10** Fechar (X) é definitivo para o evento: o painel não volta. Se o passo atual trava a venda (só a abertura de vendas), Itens › Ingressos mostra o alerta "Nada programado para entrar à venda" com "Programar abertura de vendas", que leva a Aberturas de vendas. O alerta não tem X; some quando a abertura existe. Faltando ingresso ou só publicar, nada fica na tela (o rascunho já aparece no selo do evento). _(components/guia-de-configuracao.tsx, itens/pages/Ingressos.tsx)_
- **GDC-11** Ações: setores abre Itens › Ingressos com o modal "Novo setor" aberto (`?novoSetor=1`, consumido ao abrir); ingressos abre Criar ingresso (`/backstage/catalogo/ingressos/novo`); abertura abre Aberturas de vendas; publicar abre o modal de status já em Publicado ("Abrir para todo mundo"). _(components/guia-de-configuracao.tsx, itens/pages/Ingressos.tsx)_
- **GDC-12** A faixa do título tem um campo de partículas (figura de Chladni em canvas 2D nativo) que some à esquerda, onde fica o título. No escuro as partículas são brancas; no claro, pretas, translúcidas. _(backstage/components/campo-de-particulas.tsx, compartilhado com o banner da criação de evento; utils/cor-das-particulas.ts)_
- **GDC-13** Com o painel na tela, os toasts do canto inferior direito sobem para cima dele (a partir de 640px). _(components/guia-de-configuracao.tsx)_
- **GDC-14** Holofote de apresentação: só logo depois de criar o evento em "Criar evento" (a criação marca o evento novo). A tela escurece a partir do canto do painel, acende com partículas e mostra "Evento criado! Agora, configure as vendas" e "Siga as etapas do guia para criar os ingressos, programar as vendas e publicar o evento.". Some em 9 s ou ao clicar no painel, e não volta. Não bloqueia cliques e não é lido por leitor de tela. Nas outras visitas, e em eventos que não acabaram de ser criados, aparece só o painel. Substitui o toast de evento criado (EVT-10). _(components/holofote-do-guia.tsx, data/memoria.ts, eventos/pages/CriarEvento.tsx)_
- **GDC-15** No celular (abaixo de 640 px) o painel começa recolhido na faixa do título, porque aberto cobre boa parte da tela; expandir fica gravado por evento. Logo depois de criar o evento ele abre, também no celular, e não recolhe quando o holofote acaba. No desktop nada muda. _(data/use-guia.ts, data/memoria.ts)_

### Estados
- **GDC-40** Carregando: sem painel, sem alerta, sem holofote (GDC-04).
- **GDC-41** Tudo feito: sem painel e sem alerta.
- **GDC-42** Celular: o painel ocupa a largura, 16 px das bordas.

## Depende de / afeta

- **Depende de:** catálogo do evento (`itens/`), aberturas de vendas (`aberturas-de-vendas/`), modal de status (`eventos/components/AlterarStatusModal.tsx`).
- **Afeta:** criação de evento (EVT-10, sem toast), Itens › Ingressos (alerta e `?novoSetor=1`).

## Em aberto

- Vocabulário: a branch diz "grupos de ingressos"; o protótipo chama de setor ("Novo setor"), então o passo diz "Crie os setores do evento".
- Evento esportivo: o guia diz "ingressos" mesmo quando o catálogo fala em inscrições (o toast antigo trocava a palavra).
- Qualquer evento incompleto mostra o painel, não só o recém-criado (igual à branch). O holofote, ao contrário da branch, toca só na criação (decisão Victor, 12/11/2026).
- O cadeado do passo bloqueado não diz o motivo na tela, só para leitor de tela (igual à branch).
- Partículas e textos do holofote usam cor fixa (branco e preto translúcidos, `#fff`): canvas não lê token, e `text-white` do AFTER DS v8 inverte no escuro.
- Fora do porte: transição de tela em cortejo e entrada do rail do evento da mesma branch.

## Fontes

- Branch `feat/event-setup-journey` de `ingresse/awa-backstage-web` (MKT-1051): `src/shared/events/setup-journey/`, `src/components/composite/event-setup-journey/`, `src/components/layout/event-shell/journey-overlay.tsx`, `src/components/ui/cymatic-field/`.
