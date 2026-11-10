# Gerenciamento de cotas (Equipe de operação v3): regras

> **Rotas:** `/backstage/equipe-de-operacao/v3`, `/backstage/equipe-de-operacao/v3/criar`, `/backstage/equipe-de-operacao/v3/:grupoId`, `/backstage/equipe-de-operacao/v3/:grupoId/editar` (com `?etapa=itens` abre só a seleção de itens)
> **No menu:** Backstage › menu do evento (variante `gestao-operacao`) › Gerenciamento de cotas. Essa variante do menu só aparece dentro das telas da v3; o menu padrão do evento mostra "Equipe de operação", que abre a v1.
> **Versão em uso:** é a versão mais recente (sucede a v2), mas não é a que o menu padrão abre. Hoje a entrada pelo menu padrão leva à v1 (`equipe-de-operacao`). Ver **Em aberto**.
> **Revisado em:** 2026-11-07

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

O produtor cria grupos que operam itens do evento num canal (PDV, Cortesia ou Bilheteria Online).
Os operadores vêm de grupos de Membros e de e-mails avulsos, e a cota pode ser sem limite,
compartilhada ou por item.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Grupos de cotas | `data/equipe-v3-store.tsx` (context, começa vazio) | só em memória |
| Grupos de exemplo (6) | `data/grupos-exemplo.ts` (mock com uso simulado) | só em memória |
| Grupos de Membros (16) | `data/membros.ts` (mock local, não é o store de `membros`) | não |
| Catálogo do evento (3 sessões, ingressos, produtos, combos) | `data/catalogo-evento.ts` (mock) | não |
| Estoque por item | `estoqueDoItem` em `data/catalogo-evento.ts` (mock determinístico) | não |

Nada vem de `@/plataforma`.

## Regras

### Comportamento
- **EO3-01** As telas forçam o tema escuro e devolvem o tema anterior ao sair. _(components/ui-cotas.tsx)_
- **EO3-02** Lista: card por grupo com toggle, nome, canal, nº de operadores e uso ("X de Y" com barra, ou "Sem limite de cotas: N emissões"). Clicar abre o detalhe. _(pages/EquipeDeOperacaoV3.tsx)_
- **EO3-03** Filtros: Busca (grupo, e-mail de operador ou nome de item), Canais (Todos, PDV, Cortesia, Bilheteria Online) e Status (Todos, Ativos, Inativos). Mudar filtro volta para a página 1. _(pages/EquipeDeOperacaoV3.tsx)_
- **EO3-04** Ativos aparecem primeiro e inativos no fim; inativo fica a 50% de opacidade, menos o toggle. Contador "Exibindo A-B de N grupos" e paginação. _(pages/EquipeDeOperacaoV3.tsx)_
- **EO3-05** Desativar um grupo pede confirmação ("Desativar grupo?"); reativar é direto pelo toggle. _(pages/EquipeDeOperacaoV3.tsx, components/modal-desativar.tsx)_
- **EO3-06** O primeiro grupo criado chega à lista junto com 6 grupos de exemplo; o novo fica no topo, com destaque animado. Exemplo com o mesmo nome do novo é omitido. _(data/equipe-v3-store.tsx, pages/EquipeDeOperacaoV3.tsx)_
- **EO3-07** Criar: 4 etapas (Grupo, Itens, Cotas, Revisão). O stepper deixa voltar só para etapas concluídas. CTA no cabeçalho fixo: "Continuar", e "Salvar configurações" na revisão. _(pages/CriarGrupoV3.tsx)_
- **EO3-08** Etapa Grupo: canal (um só por grupo), nome e operadores. _(pages/CriarGrupoV3.tsx)_
- **EO3-09** Operadores = membros dos grupos de Membros escolhidos + e-mails avulsos, sem repetição. A lista mostra uma seção por grupo (remove o grupo inteiro) e "Adicionadas individualmente" (remove um a um). _(components/seletor-operadores.tsx)_
- **EO3-10** Grupos de Membros: dropdown com busca e múltipla escolha, mostra "N membros" de cada um e mantém a ordem de escolha. _(components/seletor-operadores.tsx)_
- **EO3-11** Etapa Itens: abas Ingressos, Produtos, Combos; busca; itens por sessão e grupo com checkbox de 3 estados. "Selecionar todos" vale só para o que está visível (aba + busca). Produto não tem sessão. _(components/SelecaoIngressos.tsx)_
- **EO3-12** Painel de resumo dos itens por tipo, com remover item e "Remover todos". _(components/SelecaoIngressos.tsx)_
- **EO3-13** Etapa Cotas: "Sem limite definido" (até o estoque), "Cota compartilhada" (campo "Cota total do grupo") ou "Cota por item" (campo por item, separados por tipo e sessão). Padrão: sem limite. _(pages/CriarGrupoV3.tsx)_
- **EO3-14** Revisão: cartões Grupo, Itens e Cotas, cada um com "Editar". Editar a partir da revisão troca o CTA para "Salvar alterações" e volta à revisão; se algo ficou pendente, para na etapa pendente. _(pages/CriarGrupoV3.tsx, components/resumo-grupo.tsx)_
- **EO3-15** Salvar cria o grupo ativo, com uso zerado, e volta à lista com destaque. Não há toast. _(pages/CriarGrupoV3.tsx, data/equipe-v3-store.tsx)_
- **EO3-16** Detalhe: breadcrumb, nome, badge "Inativo", "N operadores • tipo de cota" e abas Itens e Operadores com contagem. _(pages/DetalheGrupoV3.tsx)_
- **EO3-17** Aba Itens: título "Canal · tipo de cota", itens por tipo. Por item: uso e cota por item com lápis. Compartilhada: cota do grupo no topo com lápis e "N emissões" por item. Sem limite: "uso de estoque emissões" por item, só leitura, com tooltip explicando que o limite é o estoque. _(pages/DetalheGrupoV3.tsx)_
- **EO3-18** Editar cota no detalhe: Enter ou clicar fora valida (com loading simulado), Esc cancela; sucesso mostra check por 3 s; erro mostra tooltip por 15 s. _(pages/DetalheGrupoV3.tsx)_
- **EO3-19** "Editar itens" abre só a seleção de itens e salva direto ("Salvar alterações"), voltando ao detalhe com destaque. _(pages/CriarGrupoV3.tsx, pages/DetalheGrupoV3.tsx)_
- **EO3-20** Aba Operadores: um bloco por grupo de Membros (toggle do grupo inteiro) e um bloco de avulsos; cada operador tem toggle e "N emitidos". "Editar operadores" abre modal com o mesmo seletor da criação. _(pages/DetalheGrupoV3.tsx, components/modal-editar-operadores.tsx)_
- **EO3-21** Desligar grupo de Membros ou operador pede confirmação; religar é direto. _(pages/DetalheGrupoV3.tsx)_
- **EO3-22** Salvar edição mantém uso por item e emissões por operador; quem saiu do grupo perde o estado "desligado". _(data/equipe-v3-store.tsx)_

### Validações
- **EO3-30** Etapa Grupo: canal escolhido, nome preenchido, nome até 40 caracteres ("Use até 40 caracteres."), nome único sem diferenciar maiúsculas ("Já existe um grupo com esse nome.") e ao menos um operador. _(pages/CriarGrupoV3.tsx)_
- **EO3-31** E-mail avulso precisa de domínio com 2+ letras. Recusas: "X não é um e-mail válido.", "X já foi adicionado.", "X já faz parte de <grupo>." Os recusados ficam no campo; os válidos entram. _(components/seletor-operadores.tsx)_
- **EO3-32** Etapa Itens: ao menos um item. _(pages/CriarGrupoV3.tsx)_
- **EO3-33** Etapa Cotas: compartilhada exige total maior que 0; por item exige todos os itens com cota maior que 0. Campos aceitam só dígitos, até 6. _(pages/CriarGrupoV3.tsx)_
- **EO3-34** O CTA fica desabilitado enquanto a etapa é inválida; não há mensagem para cota vazia. _(pages/CriarGrupoV3.tsx, components/ui-cotas.tsx)_
- **EO3-35** Cota editada no detalhe: maior que 0 ("Cota inválida") e não menor que o já emitido ("Cota menor que o já emitido. Informe N ou mais."). _(pages/DetalheGrupoV3.tsx)_
- **EO3-36** "Salvar alterações" do modal de operadores fica desabilitado se não sobrar nenhum operador. _(components/modal-editar-operadores.tsx)_

### Estados
- **EO3-40** Sem grupos: "Defina como seus itens poderão ser utilizados" com "Gerenciar cotas". _(pages/EquipeDeOperacaoV3.tsx)_
- **EO3-41** Filtro sem resultado: "Nenhum grupo corresponde à busca ou aos filtros." _(pages/EquipeDeOperacaoV3.tsx)_
- **EO3-42** Aba de itens vazia: "Este evento não tem <tipo>."; busca sem resultado: "Nenhum item corresponde à busca." _(components/SelecaoIngressos.tsx)_
- **EO3-43** Grupo inexistente: "Grupo não encontrado." com "Voltar para a listagem". _(pages/DetalheGrupoV3.tsx)_
- **EO3-44** Recarregar a página apaga os grupos; recarregar numa tela interna volta para a lista. _(data/equipe-v3-store.tsx)_
- **EO3-45** Itens que saíram do catálogo são ignorados na contagem, no uso e no limite. _(data/equipe-v3-store.tsx)_

### Permissões
- **EO3-60** Um grupo atua em um só canal: PDV, Cortesia ou Bilheteria Online. _(data/equipe-v3-store.tsx, pages/CriarGrupoV3.tsx)_
- **EO3-61** Sem limite: o teto de cada item é o estoque. Compartilhada: um saldo único para todos os itens. Por item: limite por item, e o limite do grupo é a soma. _(data/equipe-v3-store.tsx)_
- **EO3-62** Operador está ativo se não foi desligado sozinho e entra por um caminho ligado: e-mail avulso ou grupo de Membros ativo. _(data/equipe-v3-store.tsx)_
- **EO3-63** Com o grupo de Membros desligado, os membros dele ficam desligados e o toggle de cada um trava até religar o grupo. _(pages/DetalheGrupoV3.tsx)_
- **EO3-64** Grupo desativado: "os operadores deste grupo deixam de ter acesso aos ingressos vinculados". _(pages/EquipeDeOperacaoV3.tsx)_
- **EO3-65** Um e-mail que já vem de um grupo de Membros escolhido não pode ser incluído de novo como avulso. _(components/seletor-operadores.tsx)_

## Depende de / afeta

- **Depende de:** grupos de Membros (hoje mock local em `data/membros.ts`) e itens do evento (mock).
- **Afeta:** acesso dos operadores ao PDV, ao portal de cortesia e à bilheteria online, fora do Backstage (não implementado no protótipo).

## Em aberto

- Qual versão está em uso: o menu padrão do evento abre a v1; a v3 só tem entrada pelo menu variante, que só aparece dentro dela. Apontar o menu padrão para uma versão só.
- Grupos de Membros são mock próprio e não leem o store de `membros` (`../components/membros-store.ts`). Os grupos de lá não aparecem aqui.
- "Editar itens" com cota por item salva itens novos com cota 0, sem passar pela etapa Cotas.
- A rota `/:grupoId/editar` sem `?etapa=itens` abre o wizard completo, mas nenhum botão leva a ela.
- Grupos de exemplo entram só quando o primeiro grupo é criado; o uso deles é simulado.
- Estoque do modo "sem limite" é mock.
- Comentário do catálogo fala em salvar no localStorage, mas o store é só memória.
- Criar e editar não mostram toast (v1 e v2 mostram).
- Versões divergem em nome (40 caracteres aqui, 20 na v1/v2), limite (6 dígitos aqui, 99.999 na v1/v2), canais (um por grupo aqui, vários na v2, só cortesia na v1) e origem dos operadores. Ver a lista em `../equipe-de-operacao/rules.md`.

## Fontes

- Pesquisa e decisões de UX: [`PESQUISA-E-BOAS-PRATICAS.md`](PESQUISA-E-BOAS-PRATICAS.md)
- Figma citado na pesquisa: [Totem, node 4-21017](https://www.figma.com/design/L8xe7v1efjyJaQYsdUFuht/Totem?node-id=4-21017)
- O código cita o Figma ("seção Proposta", "como no Figma") sem link _(components/ui-cotas.tsx, pages/CriarGrupoV3.tsx)_.
