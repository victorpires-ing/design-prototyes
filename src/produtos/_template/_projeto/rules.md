# <Nome da feature>: regras

> **Rotas:** `/produto/feature`, `/produto/feature/:id`
> **No menu:** onde a pessoa encontra a feature (ex.: Backstage › menu do evento › Itens › Ingressos)
> **Versão em uso:** pasta e rota da versão atual, quando houver v1/v2/v3
> **Revisado em:** AAAA-MM-DD

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

Uma a três frases: para quem é, que problema resolve, o que a pessoa consegue fazer.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Evento em contexto | `@/plataforma` (`useEventoAtual`) | não |
| Exemplo de mock | `data/exemplo.ts` (mock local) | só em memória |

Dado de evento, ingresso, pedido ou carteira vem de `@/plataforma`. Mock local só para o que a
plataforma ainda não tem; quando existir, diga aqui.

## Regras

Uma regra por linha, curta e verificável na tela. ID com prefixo da feature (3 letras) e número,
que nunca é reaproveitado: regra removida fica riscada. As faixas são guia, não limite: feature
grande pode passar de 19 regras de comportamento e seguir numerando sem colidir com as outras
seções (ex.: comportamento 01+, validações 20+, estados 40+, permissões 60+).

### Comportamento
- **ABC-01** Regra. _(arquivo.tsx)_
- **ABC-02** ~~Regra removida~~ substituída por ABC-07.

### Validações
- **ABC-10** Campo obrigatório, limite, formato, mensagem de erro.

### Estados
- **ABC-20** Vazio: o que aparece e qual a ação.
- **ABC-21** Carregando, erro, sem permissão, encerrado, quando se aplicarem.

### Permissões
- **ABC-30** Quem vê e quem altera (só se a feature tratar disso).

## Depende de / afeta

- **Depende de:** features ou dados que precisam existir antes.
- **Afeta:** telas de outros produtos que mudam quando esta muda (site, checkout, carteira, app).

## Em aberto

- Decisões pendentes, divergências com a especificação, partes ainda mockadas.

## Fontes

Links de Figma, Confluence, Jira ou reunião que embasam as regras. Só cite o que existir.
