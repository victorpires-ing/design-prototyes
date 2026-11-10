# Equipe e Permissões: regras

> **Rotas:** `/backstage/equipe-e-permissoes`, `/backstage/equipe-e-permissoes/novo`, `/backstage/equipe-e-permissoes/:id/editar`
> **No menu:** não aparece. A tela abre no contexto do evento (`activeSection="equipe-e-permissoes"`), mas nenhum item do menu do evento leva a ela. Só por URL.
> **Versão em uso:** não é a versão em uso. Hoje o menu aponta para `membros` (Membros da organização) e para `equipe-de-operacao` (Equipe de operação do evento). Esta é uma exploração anterior, por evento.
> **Revisado em:** 2026-11-07

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

Exploração de equipe por evento: o produtor adiciona um indivíduo ou um grupo/empresa, escolhe
os módulos que ele acessa (Cortesias, Relatórios) e configura cota de cortesias por ingresso e
relatórios liberados, num wizard de 4 passos.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Membros da equipe | `data/membros.ts` (store mock, começa vazio) | só em memória |
| Módulos, relatórios e ingressos | `MODULOS`, `RELATORIOS`, `TICKETS` em `data/membros.ts` (mock) | não |

Nada vem de `@/plataforma`; ingressos são 4 fixos.

## Regras

### Comportamento
- **EEP-01** Lista com três métricas: Total de membros, Indivíduos e Grupos. _(pages/EquipeEPermissoes.tsx)_
- **EEP-02** Busca por nome (e-mail/CPF do indivíduo ou nome do grupo). _(pages/EquipeEPermissoes.tsx)_
- **EEP-03** Cada membro é um card expansível com badge "Indivíduo" ou "Grupo", Editar e Remover. Expandido mostra módulos, consumo de cortesias por ingresso, relatórios liberados e, no grupo, até 12 e-mails ("+ N outros"). _(pages/EquipeEPermissoes.tsx)_
- **EEP-04** Barra de cota: verde abaixo de 85%, amarela de 85% a 99%, vermelha em 100%. _(data/membros.ts, pages/EquipeEPermissoes.tsx)_
- **EEP-05** Remover pede confirmação ("Essa ação não pode ser desfeita") e remove sem toast. _(pages/EquipeEPermissoes.tsx)_
- **EEP-06** Adicionar começa pela escolha do tipo: Indivíduo ("e-mail ou CPF e cota dedicada") ou Grupo / Empresa ("vários emissores"). _(pages/NovoMembro.tsx)_
- **EEP-07** Wizard de 4 passos: Identificação, Permissões, Configuração, Revisão. Voltar no passo 1 volta à escolha do tipo (na edição, sai para a lista). _(pages/NovoMembro.tsx)_
- **EEP-08** Indivíduo: um campo "E-mail ou CPF do usuário". Grupo: nome do grupo e lista de e-mails (Enter, Espaço, botão ou colar lista); membros do grupo podem ficar para depois. _(pages/NovoMembro.tsx)_
- **EEP-09** Módulos: "Gestão e Envio de Cortesias" (vem marcado), "Relatórios e Dashboards" e "Controle de Portaria / Check-in" (desabilitado, badge "Em breve"). _(data/membros.ts, pages/NovoMembro.tsx)_
- **EEP-10** Configuração mostra só os módulos marcados; com dois módulos, um accordion por módulo com resumo. _(pages/NovoMembro.tsx)_
- **EEP-11** Cortesias: marcar um ingresso sugere cota 10; o total de cortesias soma as cotas. Ingresso marcado com cota 0 não entra. _(pages/NovoMembro.tsx)_
- **EEP-12** Relatórios liberáveis: Vendas por grupo, Borderô financeiro, Acesso / Check-in, Transações. _(data/membros.ts)_
- **EEP-13** Revisão mostra membro, níveis de acesso em árvore (ingressos com cota e total, relatórios) e, no grupo, os e-mails. _(pages/NovoMembro.tsx)_
- **EEP-14** "Confirmar e Convidar" abre um modal de confirmação; confirmar grava, mostra toast "Membro adicionado à equipe" ou "Membro atualizado" e volta à lista. _(pages/NovoMembro.tsx)_
- **EEP-15** Na edição, o consumo já usado de cada ingresso é mantido. _(pages/NovoMembro.tsx)_

### Validações
- **EEP-20** Identificação: indivíduo precisa de mais de 3 caracteres; grupo precisa de nome. O CPF não é validado. _(pages/NovoMembro.tsx)_
- **EEP-21** Permissões: ao menos um módulo. _(pages/NovoMembro.tsx)_
- **EEP-22** Configuração: com Cortesias, ao menos um ingresso com cota maior que 0; com Relatórios, ao menos um relatório. _(pages/NovoMembro.tsx)_
- **EEP-23** E-mails do grupo: inválidos e repetidos são ignorados sem aviso; tudo em minúsculas. _(pages/NovoMembro.tsx)_
- **EEP-24** Cota aceita só dígitos e nunca fica negativa. Sem limite máximo. _(pages/NovoMembro.tsx)_
- **EEP-25** "Avançar" fica desabilitado enquanto o passo não é válido. _(pages/NovoMembro.tsx)_

### Estados
- **EEP-40** Vazio: "Nenhum membro na equipe" com "Adicionar membro". _(pages/EquipeEPermissoes.tsx)_
- **EEP-41** Busca sem resultado: "Nenhum membro encontrado para essa busca." _(pages/EquipeEPermissoes.tsx)_
- **EEP-42** Convite fantasma: indivíduo com e-mail válido fora de `@ingresse.com` mostra "Usuário não cadastrado" e recebe badge "Convite pendente"; o card mostra "Convite de ativação pendente". _(pages/NovoMembro.tsx, pages/EquipeEPermissoes.tsx)_
- **EEP-43** Recarregar apaga tudo (memória). _(data/membros.ts)_

### Permissões
- **EEP-60** Acesso é por evento e por módulo; não há cargo nem nível de leitura/escrita. _(data/membros.ts)_
- **EEP-61** Cortesias: cota por ingresso; no grupo, a cota é do grupo (não por e-mail). _(pages/NovoMembro.tsx)_
- **EEP-62** Relatórios: lista do que pode visualizar. _(pages/NovoMembro.tsx)_

## Depende de / afeta

- **Depende de:** nada além do mock local.
- **Afeta:** nada. Não grava no store de Membros.

## Em aberto

- Fora do menu; o mesmo problema hoje é tratado por `membros` (org) e `equipe-de-operacao` (evento). Decidir se a pasta é arquivada.
- "Convite pendente" é heurística mock: qualquer e-mail fora de `@ingresse.com` é tratado como não cadastrado.
- O modal de confirmação do indivíduo sem convite pendente diz "receberá acesso de gerenciamento de cortesias" mesmo quando só Relatórios foi liberado.
- Grupo sem e-mails pode ser salvo; a cota de cortesias fica sem emissores.
- Remover não mostra toast; criar e editar mostram.
- Abrir `/:id/editar` com id inexistente cai no fluxo de criação, sem aviso.
- Diverge de `permissao-envio` (mesmo tipo Grupo/Individual, mas lá a cota pode ser por emissor) e de `membros` (cargo + grupo de eventos na organização).

## Fontes

Nenhum link de Figma, Confluence ou Jira no código desta feature.
