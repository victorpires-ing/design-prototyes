# Permissão de envio: regras

> **Rotas:** `/backstage/permissao-envio`, `/backstage/permissao-envio/nova`, `/backstage/permissao-envio/:id/editar`
> **No menu:** só no menu mobile da organização (gaveta) › Permissão. No desktop não há entrada. A tela marca a seção "Cortesias" do menu do evento, mas nenhum item de Cortesias abre esta rota.
> **Versão em uso:** pasta única, sem v2. O mesmo problema (quem emite cortesia e com que cota) também é tratado por `equipe-de-operacao` (v1/v2/v3) e por `equipe-e-permissoes`. Ver **Em aberto**.
> **Revisado em:** 2026-11-07

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

O produtor define quem pode emitir cortesias, quais ingressos e o limite de cada um. A permissão
é de um grupo (vários emissores) ou individual (uma pessoa).

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Permissões | `data/permissoes.ts` (store mock, começa vazio) | só em memória |
| Ingressos (4) | `TICKETS` em `data/permissoes.ts` (mock) | não |

Nada vem de `@/plataforma`.

## Regras

### Comportamento
- **PEN-01** Lista com métricas: Grupos, Emissores com permissão (soma) e Cortesias alocadas (soma dos totais). _(pages/PermissaoEnvio.tsx)_
- **PEN-02** Filtros Todos, Grupos, Individuais e busca por nome ou e-mail. _(pages/PermissaoEnvio.tsx)_
- **PEN-03** Tabela: Nome (com subtítulo), Tipo, Ingressos liberados ("Nome ×qtd", "/ emissor" quando por emissor), Cota (usadas / total) e ações Editar e Remover. _(pages/PermissaoEnvio.tsx)_
- **PEN-04** Barra de cota: verde abaixo de 85%, amarela de 85% a 99%, vermelha em 100%. _(data/permissoes.ts, pages/PermissaoEnvio.tsx)_
- **PEN-05** Remover pede confirmação ("Essa ação não pode ser desfeita") e remove sem toast. _(pages/PermissaoEnvio.tsx)_
- **PEN-06** Nova permissão: 4 passos (Tipo, Ingressos & cotas, Emissores, Revisão). _(pages/NovaPermissao.tsx)_
- **PEN-07** Tipo: Grupo (vários emissores, "10 a 1000+ pessoas") ou Individual (cota dedicada), mais o nome. Escolher Individual força cota compartilhada. _(pages/NovaPermissao.tsx)_
- **PEN-08** Grupo escolhe "Como a cota funciona": Compartilhada pelo grupo (um bolo único) ou Por emissor (cada emissor recebe a mesma cota; o total multiplica pelo nº de emissores). _(pages/NovaPermissao.tsx)_
- **PEN-09** Ingressos: marcar sugere 10; botões − e + mudam de 10 em 10; o rodapé soma a cota ("Total liberado por grupo", "Cota por emissor" ou "Cota da pessoa"). _(pages/NovaPermissao.tsx)_
- **PEN-10** Emissores do grupo: Enter, Espaço, botão ou colar lista; "Remover todos" sem confirmação; "Deletar" por linha. Individual: um campo "E-mail do responsável". _(pages/NovaPermissao.tsx)_
- **PEN-11** "Importar planilha (.xlsx/.csv)" adiciona 1.240 e-mails de exemplo e mostra toast "1.240 e-mails importados da planilha". _(pages/NovaPermissao.tsx)_
- **PEN-12** Revisão: permissão, ingressos com cota e total ("X por emissor · Y no total" quando por emissor), e até 10 emissores ("+ N outros"). _(pages/NovaPermissao.tsx)_
- **PEN-13** "Criar permissão" abre confirmação com o total de cortesias e emissores; confirmar grava, mostra toast "Permissão criada com sucesso" ou "Permissão atualizada com sucesso" e volta à lista. _(pages/NovaPermissao.tsx)_
- **PEN-14** Na edição, o uso já registrado (`usadas`) é mantido e o total é recalculado. _(pages/NovaPermissao.tsx)_

### Validações
- **PEN-20** Passo Tipo: tipo escolhido e nome preenchido. _(pages/NovaPermissao.tsx)_
- **PEN-21** Passo Ingressos: soma das cotas maior que 0. Ingresso marcado com 0 não entra na permissão. _(pages/NovaPermissao.tsx)_
- **PEN-22** Passo Emissores: grupo com ao menos um e-mail; individual com e-mail válido. _(pages/NovaPermissao.tsx)_
- **PEN-23** E-mails do grupo: inválidos e repetidos são ignorados sem aviso; tudo em minúsculas. _(pages/NovaPermissao.tsx)_
- **PEN-24** Quantidade só aceita dígitos e nunca fica negativa; sem limite máximo. _(pages/NovaPermissao.tsx)_
- **PEN-25** "Avançar" fica desabilitado enquanto o passo é inválido. _(pages/NovaPermissao.tsx)_

### Estados
- **PEN-40** Vazio: "Nenhuma permissão criada" com "Nova permissão". _(pages/PermissaoEnvio.tsx)_
- **PEN-41** Filtro sem resultado: "Nenhuma permissão encontrada para esse filtro." _(pages/PermissaoEnvio.tsx)_
- **PEN-42** Recarregar apaga tudo (memória). _(data/permissoes.ts)_

### Permissões
- **PEN-60** A permissão libera só emissão de cortesias, por ingresso, com limite. _(pages/PermissaoEnvio.tsx, data/permissoes.ts)_
- **PEN-61** Grupo compartilhado: total = soma das cotas. Grupo por emissor: total = soma × nº de emissores. Individual: total = soma. _(pages/NovaPermissao.tsx)_

## Depende de / afeta

- **Depende de:** ingressos do evento (mock fixo).
- **Afeta:** nada no protótipo. Não grava em `membros` nem em `equipe-de-operacao`.

## Em aberto

- Sobreposição de features: emissão de cortesia com cota também existe em `equipe-de-operacao` (v1/v2/v3) e `equipe-e-permissoes`. Decidir qual fica.
- Entrada só no menu mobile; no desktop só por URL.
- Importar planilha é mock: não abre seletor de arquivo e sempre adiciona 1.240 e-mails fictícios.
- Na edição dá para trocar o tipo (grupo ↔ individual) e a cota pode ficar abaixo do já usado; nada impede.
- Remover não mostra toast; criar e editar mostram.
- Abrir `/:id/editar` com id inexistente cai no fluxo de criação, sem aviso.
- Diverge de `equipe-e-permissoes` (cota por ingresso só no grupo inteiro, não por emissor) e da v1 de `equipe-de-operacao` (modo individual descrito como "cada operador recebe a própria cota", mas sem multiplicar).

## Fontes

Nenhum link de Figma, Confluence ou Jira no código desta feature.
