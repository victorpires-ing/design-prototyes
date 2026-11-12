# Equipe e Comissários (do evento): regras

> **Rotas:** `/backstage/evento/equipe` (lista), `/backstage/evento/equipe/:grupoId` (`?aba=pessoas`, `?aba=vendas`, `?aba=repasses`). `/backstage/equipe-de-operacao*` redireciona para a lista; `/backstage/evento/comissarios` também; `/backstage/evento/comissarios/:id` leva ao grupo do comissário no evento em contexto.
> **No menu:** Backstage › menu do evento › Equipe e Comissários (destino único, substitui "Equipe de operação" e "Comissários").
> **Versão em uso:** única (`equipe-e-comissarios/`), nasceu em 12/11/2026 da fusão da Equipe de operação (`../equipe-de-operacao/rules.md`, EO3-*) com os Comissários do evento (`../comissarios/rules.md`, COM-30 a COM-75).
> **Revisado em:** 2026-11-12

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

No evento, o produtor monta grupos: quem opera, em quais canais (Comissário, PDV, Bilheteria
online, Cortesia), com quais itens e qual cota. Ligar o canal Comissário transforma o próprio grupo
em comissário: ele vende pelo link e pelo cupom e ganha comissão pelo que vende. Não existe mais
cadastro de comissário na organização; "Comissário" é um cargo aplicado às pessoas do grupo. A Equipe responde "o
que a pessoa pode fazer e quanto"; o comissário, "quem ganha pela venda". O comissário é um dos canais do grupo, configurado como os outros. Antes eram duas telas
que repetiam pessoas, itens, canais e pausa.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Grupos do evento (pessoas, canais, itens, cotas, uso, comissário, condições no evento) | `@/plataforma/comissarios` (store único), modelo em `@/plataforma/equipe`; `data/equipe.ts` é o adaptador | sim, `localStorage` `backstage-comissarios-v11` |
| Comissários | leitura dos grupos com o canal Comissário (`comissarioDoGrupo`, em `@/plataforma/equipe`); o id do comissário é o do grupo | não (vem do grupo) |
| Vendas atribuídas, repasses | `@/plataforma/comissarios`, o mesmo store (lido também pelo Freepass) | sim, a mesma chave |
| Grupos de Membros | `../components/membros-store.ts`, espelhado em `data/membros.ts` | não |
| Catálogo do evento (ingressos, produtos, combos) | `@/plataforma`, evento em contexto (`data/catalogo-evento.ts`) | não |
| Grupos de exemplo (6) | `data/grupos-exemplo.ts`, semeados no store | sim |

O "vínculo" do comissário no evento (`ComissarioNoEvento`) não é mais gravado: é a leitura do grupo
com comissário (`vinculoDoGrupo`), para o Freepass seguir lendo canais,
ingressos e cota. Vendas atribuídas seguem mock (o pedido ainda não tem `comissario_id`).

## Regras

### Comportamento
- **ECO-01** O menu do evento tem um item só, "Equipe e Comissários", no lugar de "Equipe de operação" e "Comissários". _(../components/Backstage.tsx)_
- **ECO-02** Lista: título, apoio, "Criar grupo" e, quando há grupo-comissário, as métricas somadas (vendido por comissários, cortesias enviadas, comissão gerada com o estornado, a repassar com o já repassado). Cada grupo mostra toggle, nome, selo "Inativo", selo "Comissário <código>", canais ligados, pessoas, uso da cota e, se é comissário, vendido e comissão. Clicar abre o grupo. _(pages/equipe-e-comissarios.tsx)_
- **ECO-03** Filtros: Busca (grupo, comissário, e-mail ou item), Canais (Todos, Comissário, PDV, Bilheteria online, Cortesia) e Status. Mudar filtro volta para a página 1. Ativos primeiro, inativos no fim. Endereços antigos redirecionam (ver Rotas). _(pages/equipe-e-comissarios.tsx, pages/redirecionar-comissario.tsx, src/app/App.tsx)_
- **ECO-04** Uso na lista: soma dos canais ligados; "X de Y" com barra quando todos os canais ligados têm limite, senão "Sem limite: N emissões"; sem canal ligado, "Configure os canais" (ativo) ou "Sem canal ligado" (inativo). _(pages/equipe-e-comissarios.tsx, @/plataforma/equipe `usoDoGrupo`)_
- **ECO-05** Desativar pede confirmação; com comissário, avisa que o link para de contar vendas e que o já vendido e o saldo continuam. Reativar é direto. Grupo desativado não tem canal ligado. _(pages/equipe-e-comissarios.tsx)_
- **ECO-06** Os 6 grupos de exemplo (sem comissário, um canal cada) entram num evento que já tem grupos semeados na primeira abertura da lista; num evento vazio, chegam com o primeiro grupo criado, sem repetir o nome dele. _(data/equipe.ts, @/plataforma/comissarios `criarGrupo`, `semearExemplosDaEquipe`)_
- **ECO-07** "Criar grupo" é um modal curto: só nome e pessoas. Não escolhe comissário, canal, item nem cota; ao criar, abre o grupo na aba Configuração com o aviso "Grupo criado. Agora configure os canais...". As 4 etapas da antiga Equipe saíram. _(components/modal-criar-grupo.tsx)_
- **ECO-08** Pessoas = membros dos grupos de Membros escolhidos + e-mails avulsos, sem repetição, com o mesmo seletor da antiga Equipe (EO3-09, EO3-10, EO3-31, EO3-65). _(components/seletor-operadores.tsx)_
- **ECO-09** O canal Comissário transforma o próprio grupo em comissário: configurar pede o código do link e do cupom (sugerido da última palavra do nome), o responsável (uma pessoa do grupo) e as condições, além dos ingressos do link e da cota. Não se escolhe comissário de cadastro nenhum: o nome é o do grupo e as pessoas são as do grupo. _(components/modal-canal.tsx, @/plataforma/comissarios `tornarComissario`, @/plataforma/equipe `comissarioDoGrupo`)_
- **ECO-10** ~~O comissário vem dos ativos da organização sem grupo no evento.~~ substituída por ECO-09 (o grupo é o comissário).
- **ECO-11** Grupo: voltar para "Equipe e Comissários", nome como título, selos (Inativo, "Comissário <código>"), canais e pessoas; se é comissário, "Copiar link de venda" (com o canal ligado) e "Registrar repasse". Abas Configuração e Pessoas; se é comissário, também Vendas e Repasses. _(pages/grupo.tsx)_
- **ECO-12** Configuração lista um cartão por canal, sempre nesta ordem: Comissário, PDV, Bilheteria online, Cortesia. O de Comissário configurado mostra o código, a condição e os ingressos do link. _(pages/grupo.tsx, components/cartao-canal.tsx)_
- **ECO-13** Canal não configurado: o que ele faz e "Configurar". Configurado: toggle que liga e desliga direto, selo "Desligado", selo "Gera comissão"/"Sem comissão" em PDV e Bilheteria de grupo com comissário, resumo dos itens e do tipo de cota, uso, "Editar" e "Ver itens e uso". _(components/cartao-canal.tsx)_
- **ECO-14** Configurar ou editar abre um modal do canal: itens (Ingressos no mesmo painel do Questionário e das Aberturas de vendas; Produtos e Combos no seletor de lista dos Itens) e cota (sem limite, compartilhada ou por item, com "Mesma cota para vários itens"). Salvar grava direto; o primeiro salvar liga o canal. _(components/modal-canal.tsx, components/cotas-por-item.tsx)_
- **ECO-15** No canal Comissário os itens são só ingressos: "Todos os ingressos" (inclui os criados depois) ou "Só os escolhidos". _(components/modal-canal.tsx)_
- **ECO-16** PDV e Bilheteria online de grupo com comissário têm "Gera comissão": ligado, a venda das pessoas do grupo no canal conta para o comissário, com a condição dele. O canal Comissário sempre gera; Cortesia nunca. _(components/modal-canal.tsx, @/plataforma/equipe `geraComissao`)_
- **ECO-17** Cada canal tem itens, cota e uso próprios. Não há limite por pessoa em lugar nenhum: a cota é do canal do grupo. _(@/plataforma/equipe)_
- **ECO-18** Itens do canal: por item, uso e cota com lápis; compartilhada, a cota do canal no topo com lápis; sem limite, "uso de estoque emissões" só leitura, com tooltip. Enter ou clicar fora valida (loading simulado), Esc cancela; sucesso mostra check por 3 s, erro um tooltip por 15 s (EO3-18). _(components/cartao-canal.tsx, components/cota-editavel.tsx)_
- **ECO-20** As condições do comissário são do grupo e ficam no modal do canal Comissário, com o editor de condições (porcentagem, valor fixo ou valor a mais, e desconto). Não há "usar as do cadastro": cada grupo, em cada evento, é um comissário próprio. _(components/modal-canal.tsx)_
- **ECO-21** Salvar o canal Comissário grava código, responsável e condições direto; mudar as condições vale para as próximas vendas, as feitas mantêm a da hora da venda (COM-66). _(components/modal-canal.tsx)_
- **ECO-22** Pessoas: um bloco por grupo de Membros (toggle do grupo inteiro) e as avulsas; cada pessoa tem toggle, "N emitidos" e, em grupo-comissário, o cargo (ECO-24). "Editar pessoas" abre o seletor da criação. _(pages/grupo.tsx, components/modal-editar-operadores.tsx)_
- **ECO-24** "Comissário" é um cargo, não um cadastro: em grupo-comissário, toda pessoa aparece com o cargo "Comissário" e o responsável com "Comissário, responsável". O cargo também está na aba Cargos de Membros (cargo do sistema, por feature). O responsável vê tudo e recebe os repasses; as outras pessoas veem só o que venderam (FCO-60). _(pages/grupo.tsx, ../components/membros-store.ts, @/plataforma/equipe `pessoasDoGrupo`)_
- **ECO-25** O cadastro de comissários da organização saiu: o menu da organização volta a ser só "Membros", sem a aba Comissários, e `/backstage/comissarios*` leva ao relatório de Comissários. _(src/app/App.tsx, ../components/Backstage.tsx, ../components/navegacao-de-secao.tsx)_
- **ECO-26** O painel da organização virou o relatório Relatórios › Comissários, que soma os grupos-comissário e abre o grupo ao clicar (`../comissarios/rules.md`, COM-110 a COM-115). _(../comissarios/pages/relatorio-comissarios.tsx)_
- **ECO-23** "Deixar de ser comissário" fica no modal do canal Comissário, com confirmação, só sem vendas no evento: o canal volta para não configurado, link e cupom param, PDV e Bilheteria deixam de gerar comissão e as pessoas perdem o cargo; elas continuam no grupo. _(components/modal-canal.tsx, @/plataforma/comissarios `tornarComissario`)_
- **ECO-70** Vendas (com comissário): métricas, "Venda por canal" (Link de venda, PDV e bilheteria, Cortesia, mesmo zerados) e os pedidos com filtros por pedido, canal e vendedor (COM-51 a COM-53). _(components/aba-vendas.tsx)_
- **ECO-71** "Cortesias enviadas" usa a cota do canal Cortesia do grupo ("X de Y"); sem cota, "Sem limite no canal Cortesia"; desligado, "Canal Cortesia desligado". _(components/aba-vendas.tsx)_
- **ECO-72** Pedido cancelado mostra a comissão "Estornada" e não entra no saldo (COM-52). _(components/aba-vendas.tsx)_
- **ECO-73** Repasses (com comissário): o que já foi repassado e o que falta, a lista de repasses do evento e "Registrar repasse", com o modal de repasse dos Comissários (COM-40 a COM-42, COM-95). _(pages/grupo.tsx, ../comissarios/components/RegistrarRepasseModal.tsx)_

### Validações
- **ECO-30** Nome obrigatório, até 40 caracteres ("Use até 40 caracteres.") e único no evento sem diferenciar maiúsculas ("Já existe um grupo com esse nome neste evento."). _(components/modal-criar-grupo.tsx)_
- **ECO-31** Ao menos uma pessoa, por grupo de Membros ou por e-mail. _(components/modal-criar-grupo.tsx)_
- **ECO-32** Canal: ao menos um item (no Link, ao menos um ingresso quando é "Só os escolhidos"). _(components/modal-canal.tsx)_
- **ECO-33** Cota compartilhada maior que 0; por item, todos os itens com cota maior que 0; campos só com dígitos, até 6. Com pendência, o botão não trava: toast "Revise o que falta para salvar." e cada campo diz o que fazer. _(components/modal-canal.tsx)_
- **ECO-34** Cota editada no lugar: maior que 0 e não menor que o já emitido (EO3-35). _(components/cota-editavel.tsx)_
- **ECO-36** Canal Comissário: código de 3 a 20 letras ou números, único no evento ("X já é de outro grupo neste evento. Escolha outro código."); responsável obrigatório, entre as pessoas do grupo; condições válidas (COM-92). _(components/modal-canal.tsx)_
- **ECO-35** Cada grupo, em cada evento, é um comissário próprio: a mesma atlética em 3 eventos são 3 grupos-comissário, com código e condições de cada um. _(@/plataforma/equipe)_

### Estados
- **ECO-40** Evento sem grupos: "Nenhum grupo neste evento" com "Criar grupo" (EmptyState do DS). _(pages/equipe-e-comissarios.tsx)_
- **ECO-41** Filtro sem resultado: "Nenhum grupo corresponde à busca ou aos filtros." _(pages/equipe-e-comissarios.tsx)_
- **ECO-42** Carregando (organização sendo semeada): esqueleto. _(pages/*.tsx)_
- **ECO-43** Grupo de outro evento ou inexistente: "Grupo não encontrado" com "Ver grupos do evento". _(pages/grupo.tsx)_
- **ECO-44** Os grupos ficam no navegador: recarregar não apaga (antes, EO3-44, apagava). _(@/plataforma/comissarios)_
- **ECO-45** Itens que saíram do catálogo não contam no resumo, no uso nem no limite. _(data/equipe.ts `itemValido`)_

### Permissões
- **ECO-60** Pessoa ligada: não foi desligada sozinha e entra por um e-mail avulso ou por um grupo de Membros ligado; com o grupo de Membros desligado, o toggle dela trava (EO3-62, EO3-63). _(data/equipe.ts `operadorAtivo`, pages/grupo.tsx)_
- **ECO-61** Sem limite: o teto de cada item é o estoque. Compartilhada: um saldo único para os itens do canal. Por item: limite por item, e o do canal é a soma. _(@/plataforma/equipe)_
- **ECO-62** O link de venda só existe com comissário: é o canal Comissário. _(@/plataforma/equipe `canaisPossiveis`)_
- **ECO-80** No Freepass, o grupo do comissário libera Minhas vendas (Link ligado ou vendas já feitas), Cortesia e Bilheteria online (canais ligados); outros grupos ativos em que a pessoa está ligada também liberam Cortesia e Bilheteria. PDV não vira funcionalidade do Freepass. A cota de cortesia é a soma das cotas do canal Cortesia desses grupos, menos o uso. _(../freepass/data/funcoes.ts, ../freepass/data/minhas-vendas.ts, @/plataforma/equipe `gruposDaPessoa`, `emissoesDoGrupo`)_
- **ECO-81** Cortesia emitida pelo Freepass entra nas vendas do comissário e soma no uso do canal Cortesia do grupo dele quando o item está no canal. _(@/plataforma/comissarios `registrarCortesias`, ../cortesias/pages/VerificacaoFinal.tsx)_

## Depende de / afeta

- **Depende de:** peças de `../comissarios/` (condições, métricas, repasse), grupos de Membros, catálogo do evento.
- **Afeta:** Freepass (funcionalidades e cota por evento), Membros (cargo Comissário), PDV e portal de cortesia fora do Backstage (não implementados).

## Em aberto

- Venda no PDV e na bilheteria é registrada como canal "bilheteria" nas vendas atribuídas: o PDV não aparece separado em "Venda por canal".
- O uso do Link de venda e da Bilheteria vem das vendas semeadas; vendas novas pela bilheteria do Freepass ainda não são atribuídas ao comissário nem somam no uso.
- Os itens do envio de cortesia (`cortesias/data/cortesia-items.ts`) são um catálogo próprio: o `itemId` raramente bate com os itens do canal, então o uso da Cortesia quase nunca sobe pelo Freepass. O saldo do Freepass usa o uso do canal, não as cortesias enviadas.
- No Freepass, pessoa vinda de grupo de Membros conta como ligada enquanto algum grupo de Membros do grupo seguir ligado (a plataforma não lê o cadastro de Membros); o Backstage faz a conta exata.
- Grupo não se apaga e não se renomeia depois de criado.
- Desligar um canal com comissão não pede confirmação.
- O relatório de Comissários lista um grupo-comissário por evento: quem vende em vários eventos aparece em várias linhas, sem soma por pessoa.
- O cargo Comissário aparece no seletor de cargos de Membros e pode ser dado à mão a um membro, sem efeito: o que vale é estar num grupo-comissário.
- Quem é comissário em mais de um evento aparece no Freepass com um comissário por evento (o código pode repetir entre eventos).
- Pausar o comissário é desativar o grupo ou desligar o canal Comissário: não há mais pausa na organização.
- Grupos de exemplo usam itens reais do evento, com uso simulado.

## Fontes

- Decisões do Victor de 12/11/2026 na sessão que pediu a fusão: unidade é o grupo, sem limite por pessoa; grupo com vários canais, cada um com itens e cota; criar pede só nome e pessoas; o comissário é um canal, e ligá-lo transforma o próprio grupo em comissário, sem escolher cadastro (decisões de 12/11/2026); não há cadastro na organização, "Comissário" vira cargo das pessoas; cada grupo é um comissário próprio; PDV e Bilheteria podem gerar comissão, Link sempre, Cortesia não; Link só com comissário; menu "Equipe e Comissários"; um único store.
- `../equipe-de-operacao/PESQUISA-E-BOAS-PRATICAS.md` e as fontes de `../comissarios/rules.md`.
