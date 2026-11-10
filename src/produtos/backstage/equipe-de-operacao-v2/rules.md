# Equipe de operação v2: regras

> **Rotas:** `/backstage/equipe-de-operacao/v2`, `/backstage/equipe-de-operacao/v2/criar`, `/backstage/equipe-de-operacao/v2/:grupoId`, `/backstage/equipe-de-operacao/v2/:grupoId/editar`
> **No menu:** não aparece. Só por URL. As telas marcam "Equipe de operação" no menu do evento, mas esse item abre a v1.
> **Versão em uso:** não é a versão em uso. O menu padrão abre a v1 (`equipe-de-operacao`); a v3 (`equipe-de-operacao-v3`, "Gerenciamento de cotas") é a evolução seguinte desta pasta e reaproveita a mesma pesquisa.
> **Revisado em:** 2026-11-07

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

Evolução da v1: o grupo de operadores deixa de ser só de cortesia e ganha uma ou mais permissões
(Cortesia, PDV, Bilheteria), cada uma com seu tipo de cota, seus itens e seus limites.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Grupos | `data/equipe-v2-store.tsx` (context, começa vazio) | só em memória |
| Catálogo do evento | `data/equipe-data.ts` (cópia idêntica do mock da v1) | não |
| Uso da cota | `usadas`, começa em 0 | só em memória |

Nada vem de `@/plataforma`.

## Regras

### Comportamento
- **EO2-01** Lista igual à da v1 (toggle, nome, operadores, busca por nome ou e-mail, paginação), com uma barra de uso por permissão concedida no card. Título leva o selo "v2". _(pages/EquipeDeOperacaoV2.tsx)_
- **EO2-02** Card "Link de acesso dos operadores" (`freepass.ingresse.com/operador`) com copiar e compartilhar. _(pages/EquipeDeOperacaoV2.tsx)_
- **EO2-03** Atalho "Totem" leva a `/totem` ("Configurar o evento e simular a compra"). _(pages/EquipeDeOperacaoV2.tsx)_
- **EO2-04** Criar começa em "O que este grupo pode fazer?": Emitir cortesias, Vender pelo PDV, Vender pela bilheteria. Marcar uma abre "Como distribuir a cota": Por uso (padrão) ou Por item. _(components/PermissoesSelector.tsx, pages/CriarGrupoV2.tsx)_
- **EO2-05** Depois vem o wizard: Cotas e itens, Operadores, Revisão. _(pages/CriarGrupoV2.tsx)_
- **EO2-06** Cotas e itens: tabela de itens por sessão em que cada coluna é uma permissão. Por uso: checkbox por item e um campo de cota no painel. Por item: campo de quantidade na célula; quantidade acima de 0 libera o item. _(components/ConfiguracaoGrupo.tsx, pages/CriarGrupoV2.tsx)_
- **EO2-07** Painel de cotas (desktop) e barra fixa (mobile) mostram, por permissão, a cota ou a soma por item e "N itens selecionados"; o mobile lista o que falta, permissão por permissão. _(components/ConfiguracaoGrupo.tsx)_
- **EO2-08** Operadores: mesmo editor da v1; "Remover todos os e-mails" fica no fim da lista e oferece "Desfazer" no toast. _(components/OperadoresEditor.tsx)_
- **EO2-09** Revisão: nome, operadores e o cartão "Permissões e cotas" com unidade, total e itens de cada permissão. _(pages/CriarGrupoV2.tsx, components/ResumoPermissao.tsx)_
- **EO2-10** Criar mostra toast "Grupo criado" (`"X" já está valendo para N operadores.`) e volta à lista. _(pages/CriarGrupoV2.tsx)_
- **EO2-11** Detalhe: badges das permissões, "Editar configuração", toggle "Grupo ativo/desativado", cartão de permissões com uso e lista de operadores com toggle. _(pages/DetalheGrupoV2.tsx)_
- **EO2-12** Editar reabre o wizard direto em Cotas e itens, sem a escolha de permissões; salvar mostra toast "Alterações salvas" e mantém o uso já registrado. _(pages/CriarGrupoV2.tsx)_
- **EO2-13** O botão de avançar nunca fica desabilitado: clicar com pendência mostra o que falta. _(pages/CriarGrupoV2.tsx)_

### Validações
- **EO2-20** Escolha de permissões: ao menos uma. Erro: "Marque ao menos uma permissão para continuar." _(pages/CriarGrupoV2.tsx)_
- **EO2-21** Por uso: ao menos um item ("Marque ao menos um item para X.") e cota maior que 0 ("Informe a cota de X.") e até 99.999 ("A cota de X não pode passar de 99.999."). _(pages/CriarGrupoV2.tsx)_
- **EO2-22** Por item: ao menos um item com quantidade ("Informe a quantidade de ao menos um item para X.") e nenhum acima de 99.999. _(pages/CriarGrupoV2.tsx)_
- **EO2-23** Os erros só aparecem depois da primeira tentativa de avançar. _(pages/CriarGrupoV2.tsx)_
- **EO2-24** Operadores: ao menos um, todos com e-mail válido. _(pages/CriarGrupoV2.tsx)_
- **EO2-25** Nome: obrigatório, até 20 caracteres e único. Mensagens: "Já existe um grupo com esse nome." e "Use até 20 caracteres." _(pages/CriarGrupoV2.tsx)_

### Estados
- **EO2-40** Sem itens no evento: "Cadastre itens antes de montar a equipe" com "Configurar itens". _(pages/EquipeDeOperacaoV2.tsx)_
- **EO2-41** Sem grupos: "Defina regras para a distribuição de ingressos" com "Criar grupo". _(pages/EquipeDeOperacaoV2.tsx)_
- **EO2-42** Busca sem resultado: "Nenhum grupo encontrado."; busca de itens sem resultado: "Nenhum item com esse nome. Tente outro termo ou troque de aba." _(pages/EquipeDeOperacaoV2.tsx, components/ConfiguracaoGrupo.tsx)_
- **EO2-43** Grupo inexistente: "Grupo não encontrado." com "Voltar". _(pages/DetalheGrupoV2.tsx)_

### Permissões
- **EO2-60** Um grupo pode ter várias permissões ao mesmo tempo: Cortesia (portal do operador, sem cobrar), PDV (presencial: dinheiro, Pix ou cartão) e Bilheteria (online: link de pagamento ou saldo do produtor). _(data/equipe-v2-store.tsx)_
- **EO2-61** Cada permissão tem itens, tipo de cota e limite próprios. _(data/equipe-v2-store.tsx)_
- **EO2-62** Por uso: um limite para a permissão, consumido por qualquer item liberado. Por item: um limite por item; o total é a soma. _(data/equipe-v2-store.tsx, components/PermissoesSelector.tsx)_

## Depende de / afeta

- **Depende de:** itens do evento (mock copiado da v1).
- **Afeta:** link do operador e o protótipo do Totem (`/totem`), só por atalho.

## Em aberto

- Fora do menu; a v3 seguiu adiante. Decidir se a pasta é arquivada.
- Na edição não dá para adicionar ou tirar permissões (o passo de escolha é pulado).
- Na edição a cota pode ficar abaixo do já usado; a v1 bloqueia isso.
- No passo Operadores, clicar em avançar com lista vazia ou e-mail inválido não mostra mensagem.
- Toggle de operador no detalhe é estado local e se perde ao sair.
- A pesquisa cita `frasePermissao()` em `equipe-v2-store.tsx` como entregue, mas a função não existe no código.
- Diverge da v1 (só cortesia, modo único) e da v3 (um canal por grupo, opção "sem limite", operadores vindos de grupos de Membros). Ver a lista em `../equipe-de-operacao/rules.md`.

## Fontes

- Pesquisa e decisões de UX: [`PESQUISA-E-BOAS-PRATICAS.md`](PESQUISA-E-BOAS-PRATICAS.md)
- Figma citado na pesquisa: [Totem, node 4-21017](https://www.figma.com/design/L8xe7v1efjyJaQYsdUFuht/Totem?node-id=4-21017)
