# Equipe de operação (v1): regras

> **Rotas:** `/backstage/equipe-de-operacao`, `/backstage/equipe-de-operacao/criar`, `/backstage/equipe-de-operacao/:grupoId`, `/backstage/equipe-de-operacao/:grupoId/editar-itens`, `/backstage/equipe-de-operacao/:grupoId/editar-operadores`
> **No menu:** Backstage › menu do evento › Equipe de operação (desktop) e Equipe de operação › Grupos de operação (mobile), badge "Novo".
> **Versão em uso:** esta pasta é a que o menu padrão do evento abre. A v2 (`/backstage/equipe-de-operacao/v2`) não está em menu nenhum. A v3 (`/backstage/equipe-de-operacao/v3`, "Gerenciamento de cotas") só aparece no menu variante `gestao-operacao`, que só é mostrado dentro das próprias telas da v3. Ver **Em aberto**.
> **Revisado em:** 2026-11-07

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

O produtor cria grupos de operadores (por e-mail) que emitem cortesias do evento pelo portal do
operador, com uma cota compartilhada pelo grupo ou uma cota por item.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Grupos de operação | `data/equipe-store.tsx` (context, começa vazio) | só em memória |
| Catálogo do evento (2 sessões: ingressos, produtos, combos) | `data/equipe-data.ts` (mock) | não |
| Evento tem itens? | `EVENTO_TEM_ITENS` em `data/equipe-data.ts` (fixo `true`) | não |
| Cortesias emitidas | mock: 40% da cota ao criar | só em memória |

Nada vem de `@/plataforma`.

## Regras

### Comportamento
- **EOP-01** Lista de grupos em cards: toggle ativo, avatar com iniciais, nome, nº de operadores, barra "emitidas de cota" e seta para o detalhe. Grupo desligado leva badge "Desativado". _(pages/EquipeDeOperacao.tsx)_
- **EOP-02** O toggle do card liga/desliga o grupo sem abrir o detalhe e sem confirmação. _(pages/EquipeDeOperacao.tsx)_
- **EOP-03** Busca por nome do grupo ou e-mail de operador; volta para a página 1. Paginação com tamanho de página ajustável (padrão 10). _(pages/EquipeDeOperacao.tsx)_
- **EOP-04** Card "Portal do operador" (`freepass.ingresse.com/emitir-cortesia`) com copiar link e compartilhar (Web Share; sem suporte, copia). Toast "Link copiado". _(pages/EquipeDeOperacao.tsx)_
- **EOP-05** Criar grupo começa pela escolha do modo de cota: Compartilhada ("usada em conjunto por todos os operadores") ou Individual ("cada operador recebe a própria cota"). Escolher já entra no wizard. _(pages/CriarGrupo.tsx)_
- **EOP-06** Wizard de 3 passos: Itens e cota, Operadores, Revisão. Voltar no passo 1 volta à escolha do modo. _(pages/CriarGrupo.tsx)_
- **EOP-07** Itens: catálogo por abas (Ingressos, Produtos, Combos), agrupado por sessão em accordion e por grupo de item; busca por nome, grupo ou tipo abre todas as sessões. _(components/ItensCotasSelector.tsx)_
- **EOP-08** Compartilhada: um campo "Cota do grupo" vale para todos os itens marcados. Individual: cada item marcado tem o próprio campo de quantidade. _(components/ItensCotasSelector.tsx)_
- **EOP-09** Painel Resumo lista os itens marcados por tipo (combos mostram o que vem neles), com remover item e "Remover todos". _(components/ItensCotasSelector.tsx)_
- **EOP-10** Operadores: digitar ou colar e-mails separados por espaço, vírgula ou ponto e vírgula; "Importar e-mails" lê planilha; "Remover e-mails" apaga todos os removíveis sem confirmação. _(components/OperadoresEditor.tsx)_
- **EOP-11** Lista de operadores põe os e-mails inválidos no topo, em vermelho. _(components/OperadoresEditor.tsx)_
- **EOP-12** Importar e-mails: arquivo .CSV, .XLSX ou .TXT, por clique ou arraste; usa a coluna `email`/`e-mail` ou uma lista simples de e-mails. Há link para planilha de exemplo (`/test-emails-80.csv`). _(components/ImportarEmailsModal.tsx)_
- **EOP-13** Revisão: nome do grupo, operadores (removíveis) e itens com cota. Criar mostra toast "Grupo de operação criado" e volta à lista. _(pages/CriarGrupo.tsx)_
- **EOP-14** Detalhe: breadcrumb, nome, nº de operadores, modo de cota e barra "Cortesias emitidas X de Y" (vermelha em 100%). _(pages/DetalheGrupo.tsx)_
- **EOP-15** Detalhe › Itens e cota: individual mostra "emitidas de cota" por item; compartilhada mostra "N emitidos" por item. Link "Editar itens e cota". _(pages/DetalheGrupo.tsx)_
- **EOP-16** Detalhe › Operadores: toggle por operador e link "Adicionar operador" (abre a edição de operadores). _(pages/DetalheGrupo.tsx)_
- **EOP-17** Editar itens e cota salva com "Salvar configuração" e toast "Itens atualizados"; editar operadores salva com "Atualizar operadores" e toast "Operadores atualizados". Ambos voltam ao detalhe. _(pages/EditarItensCotas.tsx, pages/EditarOperadores.tsx)_
- **EOP-18** O modo de cota não muda depois de criado. _(pages/EditarItensCotas.tsx)_

### Validações
- **EOP-20** Passo Itens: ao menos um item e cota até 99.999 (por item ou do grupo). Mensagem: "A quantidade máxima é 99.999". _(pages/CriarGrupo.tsx, components/ItensCotasSelector.tsx, data/equipe-data.ts)_
- **EOP-21** Passo Operadores: ao menos um e todos com e-mail válido. _(pages/CriarGrupo.tsx)_
- **EOP-22** Nome do grupo: obrigatório, até 20 caracteres (contador "N/20") e único sem diferenciar maiúsculas. Erros: "O nome do grupo deve ser único." e "O nome do grupo deve ter 20 ou menos caracteres." _(pages/CriarGrupo.tsx, data/equipe-store.tsx)_
- **EOP-23** Edição de cota não aceita valor menor que o já emitido: "A cota não pode ser menor que N (já emitidos)". _(pages/EditarItensCotas.tsx, components/ItensCotasSelector.tsx)_
- **EOP-24** Edição de operadores: os que já estavam no grupo ficam travados (cadeado) e não podem ser removidos. _(pages/EditarOperadores.tsx, components/OperadoresEditor.tsx)_
- **EOP-25** Importação: formato fora de .csv/.xlsx/.txt dá "Formato inválido. Use um arquivo .CSV, .XLSX ou .TXT."; sem coluna email, "Não encontramos uma coluna chamada email no arquivo."; vazio, "O arquivo não tem nenhum contato." _(components/ImportarEmailsModal.tsx)_
- **EOP-26** O botão de avançar/salvar fica desabilitado enquanto o passo é inválido. _(pages/CriarGrupo.tsx, components/WizardHeader.tsx)_

### Estados
- **EOP-40** Sem itens no evento: "Configure algum item antes de gerir operadores", botão "Configurar itens" (vai para Ingressos) e sem "Criar grupo". _(pages/EquipeDeOperacao.tsx)_
- **EOP-41** Sem grupos: "Configure grupos de operação" com "Criar grupo". _(pages/EquipeDeOperacao.tsx)_
- **EOP-42** Busca sem resultado: "Nenhum grupo encontrado." _(pages/EquipeDeOperacao.tsx)_
- **EOP-43** Grupo inexistente no detalhe ou na edição: "Grupo não encontrado." _(pages/DetalheGrupo.tsx, pages/EditarItensCotas.tsx, pages/EditarOperadores.tsx)_
- **EOP-44** Resumo vazio: "Você ainda não liberou itens". _(components/ItensCotasSelector.tsx)_
- **EOP-45** Na edição de operadores, e-mail fora do padrão ganha badge "E-mail inválido" e conta sem cadastro ganha "Sem cadastro Ingresse". _(components/OperadoresEditor.tsx)_

### Permissões
- **EOP-60** O grupo só emite cortesias; não há PDV nem bilheteria nesta versão. _(data/equipe-store.tsx, pages/EquipeDeOperacao.tsx)_
- **EOP-61** Compartilhada: uma cota única, consumida em conjunto por todos os operadores, vale para qualquer item liberado. _(data/equipe-store.tsx)_
- **EOP-62** Individual: cota por item; a descrição diz "cada operador recebe a própria cota". _(pages/CriarGrupo.tsx, data/equipe-store.tsx)_
- **EOP-63** Grupo desativado continua listado com badge "Desativado". _(pages/EquipeDeOperacao.tsx)_

## Depende de / afeta

- **Depende de:** itens cadastrados no evento (Ingressos, Produtos, Combos). Hoje mock fixo.
- **Afeta:** portal do operador (`freepass.ingresse.com/emitir-cortesia`), fora do Backstage. Cargo "Equipe de operação" no catálogo de `membros` controla quem gerencia isto.

## Em aberto

- Qual versão está em uso: o menu padrão abre esta v1, mas v2 e v3 são mais recentes e a v3 tem menu próprio ("Gerenciamento de cotas"). Decidir e apontar o menu para uma só.
- Cortesias emitidas são mock (40% da cota no momento da criação).
- Modo Individual: a descrição diz "cada operador recebe a própria cota", mas o dado é cota por item, sem multiplicar por operador. Divergência entre texto e regra.
- Toggle de operador no detalhe é estado local da tela: some ao sair e não bloqueia nada.
- "Adicionar operador" abre a edição completa de operadores.
- Status "Sem cadastro Ingresse" é mock: e-mail que começa com "novo" ou o 3º operador da lista.
- .XLSX é aceito, mas o arquivo é lido como texto; planilha real não funciona. O limite "até 100 contatos" do texto não é verificado.
- Busca não procura por item, apesar de o card ter dados de item.
- Versões divergem: nome até 20 caracteres (v1, v2) vs 40 (v3); cota máxima 99.999 (v1, v2) vs 6 dígitos (v3); modos compartilhada/individual (v1) vs por uso/por item (v2) vs sem limite/compartilhada/por item (v3); só cortesia (v1) vs cortesia + PDV + bilheteria, várias por grupo (v2) vs um canal por grupo (v3); operadores por e-mail (v1, v2) vs grupos de Membros + e-mails (v3).

## Fontes

Nenhum link de Figma, Confluence ou Jira no código desta versão. Pesquisa de referência da evolução: [`../equipe-de-operacao-v2/PESQUISA-E-BOAS-PRATICAS.md`](../equipe-de-operacao-v2/PESQUISA-E-BOAS-PRATICAS.md).
