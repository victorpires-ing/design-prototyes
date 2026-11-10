# Chave de acesso: regras

> **Rotas:** `/backstage/marketing/chave-de-acesso`, `/backstage/marketing/chave-de-acesso/vincular-itens`, `/backstage/marketing/chave-de-acesso/lista`
> **No menu:** Backstage › menu do evento › Marketing › Chave de acesso
> **Versão em uso:** única, pasta `chave-de-acesso`
> **Revisado em:** 2026-11-07

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

O produtor cria códigos que liberam itens ocultos do evento só para quem tem a chave ou chega
por um link especial. Cria as chaves (geradas ou próprias), vincula os itens que elas liberam e
gerencia a lista: status, limite de uso, vínculos e remoção.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Itens do evento (sessões, grupos, ingressos, lotes, produtos, combos) | `data/itens-evento.ts` (mock de Réveillon) | não |
| Chaves da lista | 95 linhas geradas em `pages/ListaChaves.tsx` | só em memória; recarregar volta ao mock |
| Chaves digitadas ou importadas na criação | estado de `pages/ChaveDeAcesso.tsx` | não; somem ao avançar |
| Itens marcados no vínculo | estado de `pages/VincularItens.tsx` | não |

Não lê nada de `@/plataforma`.

## Regras

### Entrada
- **CHA-01** Sem chave: "Crie chaves de acesso para liberar ingressos ocultos" com "Criar chave de acesso". _(pages/ChaveDeAcesso.tsx)_
- **CHA-02** "Nova chave de acesso", na lista, abre direto a criação. _(pages/ListaChaves.tsx, pages/ChaveDeAcesso.tsx)_

### Criação
- **CHA-10** Duas formas, uma por vez: "Criar automaticamente" ou "Criar manualmente". _(pages/ChaveDeAcesso.tsx)_
- **CHA-11** As chaves usam só letras e números, sem símbolos ou emojis, e não distinguem maiúsculas de minúsculas. _(pages/ChaveDeAcesso.tsx)_
- **CHA-12** Automática: Limite de uso (opcional, vazio = ilimitado), Quantidade e Prefixo (opcional). Mostra exemplos dos códigos com o prefixo em maiúsculas. _(pages/ChaveDeAcesso.tsx)_
- **CHA-13** Automática: quantidade acima de 5.000 mostra "O seu total de chaves de acesso no evento não pode ser maior que 5 mil." e bloqueia o avanço. _(pages/ChaveDeAcesso.tsx)_
- **CHA-14** Manual: Limite de uso (opcional) e até 1.000 chaves separadas por vírgula, com contador "N / 1.000". _(pages/ChaveDeAcesso.tsx)_
- **CHA-15** Importar planilha (.csv, .xlsx, .xls; até 1.000 chaves). Acima disso: "A planilha ultrapassa o limite de 1.000 chaves por importação." _(components/ImportarPlanilhaModal.tsx)_
- **CHA-16** Depois de importar, as chaves viram chips editáveis (clique edita, vazio remove, Enter ou vírgula adiciona, Backspace apaga a última), com carregamento de 1,8 s. _(pages/ChaveDeAcesso.tsx)_
- **CHA-17** Chip com símbolo é inválido e bloqueia o avanço: "Chave de acesso inválida encontrada. Ajuste o formato dos destacados para continuar." _(pages/ChaveDeAcesso.tsx)_
- **CHA-18** Chip repetido (sem diferenciar maiúsculas) é marcado e não bloqueia: "N chaves estão duplicadas e não serão consideradas ao continuar." Chips com problema vão para o início. _(pages/ChaveDeAcesso.tsx)_
- **CHA-19** "Criar e vincular itens" exige: automática com quantidade entre 1 e 5.000; manual com ao menos uma chave, sem carregamento e sem chip inválido. _(pages/ChaveDeAcesso.tsx)_

### Vincular itens
- **CHA-20** Filtro Todos, Ingressos, Combos, Produtos. Ingressos por sessão › grupo › ingresso › lote, com "Selecionar todos" por sessão e marcação parcial nos níveis acima. _(pages/VincularItens.tsx, data/itens-evento.ts)_
- **CHA-21** Painel à direita lista o que foi vinculado, com "remover todos" para ingressos e combos e limpar para produtos. _(pages/VincularItens.tsx)_
- **CHA-22** "Salvar" exige ao menos um item e leva para a lista. _(pages/VincularItens.tsx)_
- **CHA-23** Vindo da lista ("Adicionar vínculos"), o título é "Adicionar vínculos" com "Esta ação apenas adiciona novos vínculos. Itens já vinculados não serão alterados." e voltar leva para a lista. _(pages/VincularItens.tsx)_

### Lista de chaves
- **CHA-30** Busca por código; filtro Todas, Ativas, Inativas; 10 linhas por página. _(pages/ListaChaves.tsx)_
- **CHA-31** Cada linha: status (toggle), código, "N ingressos associados", uso "X de Y" (∞ quando ilimitado) e ações: Copiar link, Editar vínculo, Desvincular tudo, Remover. _(pages/ListaChaves.tsx)_
- **CHA-32** Ao abrir, as chaves aparecem "Preparando chave de acesso..." e ficam prontas e ativas uma a uma, em até 6 s. Em preparo não podem ser selecionadas nem alternadas. _(pages/ListaChaves.tsx)_
- **CHA-33** Editar limite na linha: o novo limite não pode ser menor que o uso: "Limite não alterado. O novo limite não pode ser menor que a quantidade de vezes que o código já foi usado." O aviso some em 15 s. Vazio cancela. _(pages/ListaChaves.tsx)_
- **CHA-34** Ações em massa aparecem com 2 ou mais selecionadas: Ativar (se houver inativa), Desativar (se houver ativa), Editar limite, Adicionar vínculos, Desvincular, Remover. Cada uma confirma em modal e mostra "N chaves de acesso …s com sucesso." _(pages/ListaChaves.tsx, components/ConfirmModal.tsx)_
- **CHA-35** Editar limite em massa: vazio = ilimitado. _(components/EditarLimiteModal.tsx)_
- **CHA-36** Textos de efeito: desativar mantém os itens ocultos e para a liberação; desvincular ou remover deixa os itens visíveis se não tiverem outra chave; atingir o limite mantém os itens ocultos. _(pages/ListaChaves.tsx, components/EditarLimiteModal.tsx)_

## Depende de / afeta

- **Depende de:** catálogo do evento (ingressos, lotes, produtos, combos) e itens marcados como ocultos.
- **Afeta:** fluxo de compra (site e link do evento): itens ocultos aparecem para quem informa a chave ou chega pelo link.

## Em aberto

- Não usa `@/plataforma`: itens deveriam vir do catálogo do evento em contexto, e as chaves e vínculos deveriam ser gravados no evento para o site e o checkout respeitarem.
- Nada criado é guardado: a lista é sempre o mock de 95 chaves iguais ("W3X931LG", 5 ingressos), não as chaves criadas.
- Chaves digitadas no campo de texto manual não são validadas (formato, duplicidade, limite de 1.000); só os chips importados são.
- Importar planilha substitui o que foi digitado no campo de texto.
- Os campos Quantidade e Limite de uso aceitam qualquer texto; só os dígitos contam.
- "Baixar modelo de importação", "Exportar" e "Copiar link" não fazem nada.
- Desvincular (linha e massa) só mostra o toast; a contagem de ingressos não muda.
- Editar limite em massa não checa se o novo limite é menor que o uso, diferente da edição na linha.
- Toda chave termina ativa depois do preparo, inclusive as que nasceram inativas: o filtro Inativas fica vazio sem ação do usuário.
- A busca em Vincular itens não filtra nada.
- Com uma só chave selecionada não aparece barra de ação em massa.

## Fontes

Nenhum link de Figma, Confluence ou Jira no código desta pasta.
