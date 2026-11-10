# Catálogo › Itens: regras

> **Rotas:** `/backstage/catalogo/itens`
> **No menu:** sem item de menu (órfã). O tipo `catalogo-itens` existe em `components/Backstage.tsx`, mas nenhum menu aponta para a rota; só abre pela URL.
> **Versão em uso:** única (`catalogo/`)
> **Revisado em:** 2026-11-07

> **Fora do menu desde 08/11/2026:** substituída pelo novo menu Itens (`itens/`, ver `itens/rules.md`). Rotas antigas em `/backstage/catalogo-anterior/*`.

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

Protótipo de uma lista de itens de um grupo (Réveillon) com foco em vincular chaves de acesso a
ingressos e lotes. Serve para testar o slide-out "Vincular chaves de acesso".

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Grupo, ingressos e lotes | mock em `pages/Itens.tsx` | só em memória (toggles) |
| Chaves de acesso | mock em `components/VincularChavesSlideOut.tsx` (24 chaves) | não |

Não lê `@/plataforma` nem o evento em contexto.

## Regras

### Comportamento
- **CAT-01** A página mostra um único grupo ("31/12 • Réveillon dos Milagres") com Lote, Emissões, Pendentes e Acesso; o grupo abre e fecha ao clicar. _(pages/Itens.tsx)_
- **CAT-02** Cada ingresso tem toggle ativo, nome, resumo, virada "Individual", faixa de preço, emissões e ações Editar item, chave de acesso e Remover item. _(pages/Itens.tsx)_
- **CAT-03** O ícone de chave mostra "Editar vínculos de chave de acesso" quando o item já tem chave e "Vincular chave de acesso" quando não tem. _(pages/Itens.tsx)_
- **CAT-04** Ingresso com lotes expande para mostrar cada lote com toggle, badge "Auto" e marca "Oculto" (lote com chave). "Camarote Open Bar" começa expandido. _(pages/Itens.tsx)_
- **CAT-05** Os toggles de ingresso e lote ligam e desligam só na tela. _(pages/Itens.tsx)_
- **CAT-06** O ícone de chave (ingresso ou lote) abre o slide-out "Vincular chaves de acesso" pela direita. _(pages/Itens.tsx, components/VincularChavesSlideOut.tsx)_
- **CAT-07** No slide-out, a busca filtra chaves pelo código e mostra "N chaves encontradas". _(components/VincularChavesSlideOut.tsx)_
- **CAT-08** Menu Opções: "Selecionar todos" e "Desmarcar todos" agem só sobre as chaves do filtro atual. _(components/VincularChavesSlideOut.tsx)_
- **CAT-09** Contador "N de 1.200 vinculada(s)". _(components/VincularChavesSlideOut.tsx)_
- **CAT-10** Salvar fecha o slide-out e mostra "1 chave de acesso vinculada com sucesso." ou "N chaves de acesso vinculadas com sucesso." _(pages/Itens.tsx)_

### Validações
- **CAT-20** Salvar fica desabilitado sem nenhuma chave marcada. _(components/VincularChavesSlideOut.tsx)_

### Estados
- **CAT-30** Busca sem resultado: "Nenhuma chave encontrada." _(components/VincularChavesSlideOut.tsx)_

## Depende de / afeta

- **Depende de:** nada além do layout do Backstage.
- **Afeta:** nada. Nenhuma mudança chega ao site, link de compra, checkout ou carteiras.

## Em aberto

- Rota órfã: nenhum menu leva até ela. Ingressos (`/backstage/catalogo/ingressos`) é a tela de catálogo em uso.
- Botões sem ação: "Ajustar abertura de vendas", "Editar grupos", "Novo item", Editar item e Remover item.
- O vínculo não é gravado: depois de salvar, o item não muda (subtítulo, ícone e "Oculto" continuam iguais).
- A seleção do slide-out não é limpa ao fechar ou salvar; reabrir mostra as chaves marcadas antes.
- Contador diz 1.200 chaves disponíveis, mas a lista tem 24.
- Ingressos sem lotes no mock (todos menos Camarote) expandem e não mostram nada.

## Fontes

Nenhum link de Figma, Confluence ou Jira no código desta pasta.
