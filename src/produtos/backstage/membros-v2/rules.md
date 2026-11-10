# Membros v2 (acesso por grupo): regras

> **Rotas:** `/backstage/membros-v2`, `/backstage/membros-v2/grupos/novo`
> **No menu:** não aparece. Só por URL.
> **Versão em uso:** não é a versão em uso. O menu Membros aponta para `membros` (`/backstage/membros`). Esta é uma exploração alternativa (badge "v2 · acesso por grupo") que não substituiu a v1.
> **Revisado em:** 2026-11-07

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

Exploração de permissionamento sem cargo. O grupo define os eventos; dentro dele, o admin
escolhe o que cada pessoa pode fazer em cada feature. O "cargo" vira um resumo derivado do acesso.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Pessoas (6 fixas) | `MEMBROS_V2` em `data/membros-v2-store.ts` (mock) | não |
| Grupos e acessos por pessoa | `data/membros-v2-store.ts` (mock com 5 grupos de exemplo) | só em memória |
| Eventos | `EVENTOS` de `../components/membros-store.ts` (mock) | não |

## Regras

### Comportamento
- **MV2-01** Abas Membros e Grupos, com contagem; a busca limpa ao trocar de aba. Membros busca por nome ou e-mail; Grupos por nome. _(pages/MembrosV2.tsx)_
- **MV2-02** Cada membro é uma linha expansível com os grupos em badges ("Nenhum grupo" se vazio). _(pages/MembrosV2.tsx)_
- **MV2-03** Expandido, o membro mostra um painel por grupo com o resumo do acesso e "Editar acesso" / "Ocultar acesso". _(pages/MembrosV2.tsx)_
- **MV2-04** "Adicionar a um grupo" lista só os grupos em que a pessoa ainda não está; escolher já adiciona. _(pages/MembrosV2.tsx)_
- **MV2-05** Cada grupo é uma linha expansível com escopo ("Todos os eventos" ou "N eventos") e "N pessoas". Expandido mostra o escopo editável, as pessoas com seus acessos e "Adicionar pessoa". _(pages/MembrosV2.tsx)_
- **MV2-06** Escopo do grupo: "Todos os eventos" (vale também para eventos futuros) ou "Eventos específicos" com checkbox por evento. A mudança grava na hora. _(pages/MembrosV2.tsx)_
- **MV2-07** Remover pessoa do grupo (lixeira) apaga também o acesso dela naquele grupo. Sem confirmação. _(pages/MembrosV2.tsx, data/membros-v2-store.ts)_
- **MV2-08** Editor de acesso: uma linha por feature com 3 níveis (Sem acesso / leitura / escrita), rotulados no vocabulário da feature. A mudança grava na hora. _(components/acesso-ui.tsx)_
- **MV2-09** Features e rótulos: Cortesias (Visualizar / Emissão), Relatórios (Sem dados financeiros / Completo), Ingressos e itens (Ver / Gerenciar), Eventos (Ver / Criar/editar), Financeiro (Ver saldos / Solicitar repasses), Marketing (Ver / Gerenciar). _(data/membros-v2-store.ts)_
- **MV2-10** Cortesias em Visualizar pede "O que pode visualizar": Apenas do próprio usuário (padrão) ou De todos os usuários. _(components/acesso-ui.tsx, data/membros-v2-store.ts)_
- **MV2-11** Cortesias em Emissão pede "Modo de emissão": Emissão total (padrão) ou Mediante aprovação. _(components/acesso-ui.tsx, data/membros-v2-store.ts)_
- **MV2-12** Relatórios com acesso pede quais relatórios pode ver (Vendas, Acesso, Transações, Borderô, Transferências, Questionários); ao ligar, todos vêm marcados. _(components/acesso-ui.tsx, data/membros-v2-store.ts)_
- **MV2-13** Voltar a "Sem acesso" apaga escopo, modo de emissão e lista de relatórios da feature. _(data/membros-v2-store.ts)_
- **MV2-14** Resumo do acesso em chips por feature (verde = escrita, azul = leitura), ex.: "Cortesias: Visualizar (do próprio usuário)", "Relatórios: Completo · todos". Sem nada: "Sem acesso configurado neste grupo." _(components/acesso-ui.tsx, data/membros-v2-store.ts)_
- **MV2-15** Novo grupo: nome, eventos do grupo e pessoas. "Todos os eventos" marca ou desmarca todos e fica parcial com seleção parcial; todos começam marcados. _(pages/NovoGrupoV2.tsx)_
- **MV2-16** Pessoas escolhidas num dropdown com checkbox; cada uma entra com tudo "Sem acesso" e com o editor "Acessos" aberto. _(pages/NovoGrupoV2.tsx)_
- **MV2-17** Criar grupo grava escopo, pessoas e acessos, mostra toast `Grupo "X" criado` e volta para a lista. Com todos os eventos marcados, o escopo vira "todos". _(pages/NovoGrupoV2.tsx, data/membros-v2-store.ts)_

### Validações
- **MV2-20** "Criar grupo" fica desabilitado sem nome ou sem ao menos um evento. _(pages/NovoGrupoV2.tsx)_
- **MV2-21** No escopo de um grupo existente, "Eventos específicos" aceita ficar sem nenhum evento. _(pages/MembrosV2.tsx)_

### Estados
- **MV2-40** Busca sem resultado: "Nenhum resultado" com "Não encontramos membros/grupos para essa busca." _(pages/MembrosV2.tsx)_
- **MV2-41** Membro sem grupo: "Ainda não está em nenhum grupo."; grupo sem pessoas: "Nenhuma pessoa neste grupo." _(pages/MembrosV2.tsx)_
- **MV2-42** Recarregar volta aos dados de exemplo (memória). _(data/membros-v2-store.ts)_

### Permissões
- **MV2-60** Não existe cargo: o acesso é por pessoa dentro de cada grupo, por feature. _(data/membros-v2-store.ts)_
- **MV2-61** Níveis por feature: none, read, write. _(data/membros-v2-store.ts)_
- **MV2-62** Grupo "Todos os eventos" é do sistema (ícone de estrela): ninguém sai dele pela aba Membros. _(pages/MembrosV2.tsx)_
- **MV2-63** Entre grupos vale a união, o mais permissivo vence: nível maior, escopo "todos" vence "próprio", emissão "total" vence "mediante aprovação", relatórios somam. _(data/membros-v2-store.ts)_

## Depende de / afeta

- **Depende de:** `EVENTOS` de `../components/membros-store.ts`.
- **Afeta:** nada. Não grava no store compartilhado da v1.

## Em aberto

- Não está no menu e não substituiu `membros`. Decidir se o modelo sem cargo avança ou se a pasta é arquivada.
- Não dá para convidar pessoa nova: o pool é fixo em 6 pessoas mock.
- Não dá para excluir grupo nem renomear.
- `acessoEfetivo` (união entre grupos, MV2-63) existe no store mas nenhuma tela usa; a regra não aparece na interface além do texto do cabeçalho.
- Grupo do sistema na aba Grupos ainda mostra a lixeira por pessoa; na aba Membros não mostra. Divergente.
- Grupo existente pode ficar com escopo vazio (MV2-21), mas a criação exige ao menos um evento.
- Edição grava na hora, sem salvar nem desfazer; remoção não pede confirmação.
- Diverge de `membros` (cargo + grupo) e de `equipe-e-permissoes` (por evento, com módulos e cota de cortesias). Também diverge nos níveis: aqui Cortesias tem escopo e aprovação; na v1 o catálogo usa Visualizar/Editar/Emitir/Cancelar.

## Fontes

Nenhum link de Figma, Confluence ou Jira no código desta feature.
