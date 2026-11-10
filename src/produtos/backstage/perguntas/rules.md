# Perguntas: regras

> **Rotas:** `/backstage/perguntas`, `/backstage/perguntas/nova`, `/backstage/perguntas/:id/editar`
> **No menu:** sem item de menu (órfã). A página usa `activeProducer="perguntas"`, que não existe no rail da organização; só abre pela URL. `?vazio=1` abre no estado vazio.
> **Versão em uso:** única (`perguntas/`). A versão mais nova do mesmo assunto é Pesquisas (`/backstage/pesquisas`).
> **Revisado em:** 2026-11-07

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

Banco de perguntas da organização, sem contexto de evento. O produtor cria, edita, ativa e
desativa perguntas que o comprador responde.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Perguntas | `data/perguntas.ts` (6 perguntas mock), em `data/perguntas-store.tsx` | só em memória |

O provider fica em `app/App.tsx`, então as perguntas sobrevivem à navegação, mas não ao recarregar.

## Regras

### Comportamento
- **PRG-01** A lista mostra Pergunta, Tipo da resposta (com ícone) e Status com toggle Ativo/Desativado. _(components/PerguntasList.tsx)_
- **PRG-02** Tipos de resposta: Texto aberto, Seleção única, Multipla seleção, Anexar arquivo. _(data/perguntas.ts)_
- **PRG-03** A busca filtra pelo título, sem diferenciar maiúsculas, e volta para a página 1. _(components/PerguntasList.tsx)_
- **PRG-04** Paginação de 10, 25 ou 50 por página, com Anterior e Próximo e "Página X de Y". _(components/PerguntasList.tsx)_
- **PRG-05** O toggle de status muda na hora, sem confirmação. _(components/PerguntasList.tsx, data/perguntas-store.tsx)_
- **PRG-06** "Nova pergunta" abre o formulário; a pergunta criada entra no topo da lista e ativa. _(pages/Perguntas.tsx, data/perguntas-store.tsx)_
- **PRG-07** Editar abre o formulário com título e tipo preenchidos. Salvar volta para a lista. _(pages/PerguntaForm.tsx)_
- **PRG-08** A lixeira da lista exclui na hora, sem confirmação. _(components/PerguntasList.tsx)_
- **PRG-09** Pergunta em uso mostra no formulário "Esta pergunta está em uso" / "Não será possível deletar, apenas editar a pergunta." e "Excluir pergunta" fica desabilitado. _(pages/PerguntaForm.tsx)_
- **PRG-10** "Voltar" da lista volta para a página anterior do navegador; o do formulário volta para a lista. _(pages/Perguntas.tsx, pages/PerguntaForm.tsx)_

### Validações
- **PRG-20** Título e Tipo da resposta são obrigatórios; Salvar fica desabilitado sem eles. Espaços nas pontas do título são removidos. _(pages/PerguntaForm.tsx)_

### Estados
- **PRG-30** Lista vazia: "Obtenha respostas para seus eventos" com botão Nova pergunta; o botão do topo some. _(pages/Perguntas.tsx, components/PerguntasEmptyState.tsx)_
- **PRG-31** Busca sem resultado: "Nenhuma pergunta encontrada." _(components/PerguntasList.tsx)_

## Depende de / afeta

- **Depende de:** nada além do layout do Backstage.
- **Afeta:** nada. Não chega ao checkout nem às carteiras.

## Em aberto

- A lixeira da lista exclui pergunta em uso, que o formulário de edição bloqueia.
- Excluir na lista e no formulário não pede confirmação.
- Rota órfã, sem item de menu. Pesquisas (`/backstage/pesquisas`) cobre o mesmo assunto com regras diferentes (tipos, limite por opção, vínculo a ingressos); falta decidir qual vale.
- `/backstage/perguntas/:id/editar` com id inexistente abre como "Nova pergunta".
- Texto do estado vazio fala de "convites exclusivos", que não é o assunto da tela.
- Rótulo "Multipla seleção" sem acento.
- `emUso` vem fixo do mock; pergunta nova nunca fica em uso.

## Fontes

Nenhum link de Figma, Confluence ou Jira no código desta pasta.
