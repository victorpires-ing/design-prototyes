# Equipe de operação (Gerenciamento de cotas): regras

> **Substituída em 12/11/2026 por Equipe e Comissários** (`../equipe-e-comissarios/rules.md`, ECO-*). As telas, o store em memória e o wizard de 4 etapas saíram; seletor de operadores, catálogo do evento, Membros, grupos de exemplo, cota editável e cota por item foram para `equipe-e-comissarios/`. As rotas abaixo redirecionam para `/backstage/evento/equipe`. As regras ficam aqui como histórico; a correspondência está em cada uma.

> **Rotas:** `/backstage/equipe-de-operacao`, `/backstage/equipe-de-operacao/criar`, `/backstage/equipe-de-operacao/:grupoId`, `/backstage/equipe-de-operacao/:grupoId/editar` (com `?etapa=itens` abre só a seleção de itens). Os endereços antigos `/v2/*` e `/v3/*` redirecionam para a lista.
> **No menu:** Backstage › menu do evento › Equipe de operação › Grupos de operação. Também se chega pelos comissários ("Criar grupo para <comissário>", COM-72).
> **Versão em uso:** única e oficial (era a v3). A v1 (só cortesia) e a v2 (várias permissões por grupo) foram removidas em 11/11/2026 (decisão Victor).
> **Revisado em:** 2026-11-12

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

O produtor cria grupos que operam itens do evento num canal (PDV, Cortesia ou Bilheteria Online). É o único lugar que define quem emite cortesia e vende na bilheteria, com quais itens e qual cota; os comissários leem daqui (COM-70).
Os operadores vêm de grupos de Membros e de e-mails avulsos, e a cota pode ser sem limite,
compartilhada ou por item.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Grupos de cotas | `data/equipe-v3-store.tsx` (context, começa vazio) | só em memória |
| Grupos de exemplo (6) | `data/grupos-exemplo.ts` (mock com uso simulado) | só em memória |
| Grupos de Membros | `components/membros-store.ts` (cadastro de Membros), espelhado em `data/membros.ts` | só em memória |
| Catálogo do evento (sessões, setores, ingressos, produtos, combos) | `@/plataforma`, evento em contexto (`data/catalogo-evento.ts` espelha) | não |
| Estoque por item | lotes do ingresso, estoque do produto, limite do combo | não |

O catálogo vem de `@/plataforma`; os grupos de operação ainda ficam só em memória.

## Regras

### Comportamento
- **EO3-01** ~~O fluxo usa o tema, as cores e a fonte do Backstage, sem tema próprio e sem forçar o escuro (o `tema-cotas.css` saiu em 11/11/2026, UI-DS-002).~~ substituída por ECO-11.
- **EO3-02** ~~Lista: título "Equipe de operação", sem seta de voltar (é destino do menu) e com "Criar grupo". Cada grupo mostra toggle, nome, selo "Inativo" quando desligado, canal, operadores e uso (barra do DS com "X de Y", ou "Sem limite"); no celular o uso vem embaixo do nome. Clicar abre o detalhe.~~ substituída por ECO-02.
- **EO3-03** ~~Filtros: Busca (grupo, e-mail de operador ou nome de item), Canais (Todos, PDV, Cortesia, Bilheteria Online) e Status (Todos, Ativos, Inativos). Mudar filtro volta para a página 1.~~ substituída por ECO-03.
- **EO3-04** ~~Ativos primeiro e inativos no fim; inativo leva o selo "Inativo", sem baixar a opacidade (UI-A11Y-001). Contador "Exibindo A-B de N grupos" e paginação.~~ substituída por ECO-02.
- **EO3-05** ~~Desativar um grupo pede confirmação ("Desativar grupo?"); reativar é direto pelo toggle.~~ substituída por ECO-05.
- **EO3-06** ~~O primeiro grupo criado chega à lista junto com 6 grupos de exemplo; o novo fica no topo, com destaque animado. Exemplo com o mesmo nome do novo é omitido.~~ substituída por ECO-06.
- **EO3-07** ~~Criar: 4 etapas (Grupo, Itens, Cotas, Revisão) com o cabeçalho da Emissão de cortesias (voltar para a etapa anterior, título "Novo grupo de operação" e a ação) e o stepper do DS; no celular, "Etapa 2 de 4: Itens" e o título numa linha própria. Volta-se pelo voltar ou pelo Editar da revisão.~~ substituída por ECO-07.
- **EO3-08** ~~Etapa Grupo, num cartão só: canal num controle segmentado (um por grupo), nome e operadores.~~ substituída por ECO-07.
- **EO3-09** ~~Operadores = membros dos grupos de Membros escolhidos + e-mails avulsos, sem repetição. A lista mostra uma seção por grupo (remove o grupo inteiro) e "Adicionadas individualmente" (remove um a um).~~ substituída por ECO-08.
- **EO3-10** ~~Grupos de Membros: dropdown com busca e múltipla escolha, mostra "N membros" de cada um e mantém a ordem de escolha.~~ substituída por ECO-08.
- **EO3-11** ~~Etapa Itens: as linhas Ingressos, Produtos e Combos (estas só quando o evento tem), cada uma com o resumo e Escolher ou Editar. Ingressos abre o mesmo painel do Questionário e dos Comissários; Produtos e Combos, o seletor de lista dos Itens. Evento sem nada: aviso para criar em Itens.~~ substituída por ECO-14.
- **EO3-12** ~~A revisão resume cada tipo com a contagem e os primeiros nomes ("Pista Inteira, Camarote Inteira e mais 12"); a cota por item mostra os 10 primeiros e quantos faltam.~~ substituída por ECO-13.
- **EO3-13** ~~Etapa Cotas: Sem limite definido (até o estoque real), Cota compartilhada (campo "Cota total do grupo") ou Cota por item, com o RadioButton do DS. A cota por item tem "Mesma cota para vários itens" (preenche de uma vez os itens listados, ou os da busca), busca por nome, setor ou sessão e 20 itens por vez com "Mostrar mais". Padrão: sem limite.~~ substituída por ECO-14.
- **EO3-14** ~~Revisão: cartões Grupo, Itens e Cotas, cada um com "Editar". Editar a partir da revisão troca o CTA para "Salvar alterações" e volta à revisão; se algo ficou pendente, para na etapa pendente.~~ substituída por ECO-07.
- **EO3-15** ~~Salvar cria o grupo ativo, com uso zerado, guardando o evento em contexto, e volta à lista com destaque. Não há toast.~~ substituída por ECO-07.
- **EO3-23** ~~Criar a partir de um comissário (COM-72) já vem com o nome e os e-mails dele e, ao salvar, volta para a configuração do comissário.~~ substituída por ECO-09.
- **EO3-16** ~~Detalhe: voltar para "Equipe de operação", o nome do grupo como título e, embaixo, o selo "Inativo", o canal, os operadores e o tipo de cota; abas Itens e Operadores com contagem.~~ substituída por ECO-11.
- **EO3-17** ~~Aba Itens: título "Canal · tipo de cota", itens por tipo. Por item: uso e cota por item com lápis. Compartilhada: cota do grupo no topo com lápis e "N emissões" por item. Sem limite: "uso de estoque emissões" por item, só leitura, com tooltip explicando que o limite é o estoque.~~ substituída por ECO-18.
- **EO3-18** ~~Editar cota no detalhe: Enter ou clicar fora valida (com loading simulado), Esc cancela; sucesso mostra check por 3 s; erro mostra tooltip por 15 s.~~ substituída por ECO-18.
- **EO3-19** ~~"Editar itens" abre só a seleção de itens e salva direto ("Salvar alterações"), voltando ao detalhe com destaque.~~ substituída por ECO-14.
- **EO3-20** ~~Aba Operadores: um bloco por grupo de Membros (toggle do grupo inteiro) e um bloco de avulsos; cada operador tem toggle e "N emitidos". "Editar operadores" abre modal com o mesmo seletor da criação.~~ substituída por ECO-22.
- **EO3-21** ~~Desligar grupo de Membros ou operador pede confirmação; religar é direto.~~ substituída por ECO-22.
- **EO3-22** ~~Salvar edição mantém uso por item e emissões por operador; quem saiu do grupo perde o estado "desligado".~~ substituída por ECO-22.

- **EO3-50** ~~Os itens são os ingressos (por sessão e setor), produtos e combos do evento em contexto, lidos do banco; o estoque é o dos lotes, do produto ou do combo. Os grupos de Membros vêm do cadastro de Membros (`components/membros-store.ts`), que ganhou os grupos de exemplo que antes eram só deste fluxo. Os grupos de exemplo usam itens reais do evento.~~ substituída por ECO-45.

### Validações
- **EO3-30** ~~Etapa Grupo: canal escolhido, nome preenchido, nome até 40 caracteres ("Use até 40 caracteres."), nome único sem diferenciar maiúsculas ("Já existe um grupo com esse nome.") e ao menos um operador.~~ substituída por ECO-30.
- **EO3-31** ~~E-mail avulso precisa de domínio com 2+ letras. Recusas: "X não é um e-mail válido.", "X já foi adicionado.", "X já faz parte de <grupo>." Os recusados ficam no campo; os válidos entram.~~ substituída por ECO-08.
- **EO3-32** ~~Etapa Itens: ao menos um item.~~ substituída por ECO-32.
- **EO3-33** ~~Etapa Cotas: compartilhada exige total maior que 0; por item exige todos os itens com cota maior que 0. Campos aceitam só dígitos, até 6.~~ substituída por ECO-33.
- **EO3-34** ~~O botão da etapa nunca fica desativado: com pendência, mostra o aviso "Revise o que falta para continuar.", rola até o primeiro problema e cada campo diz o que fazer (canal, nome, operadores, itens, cota total, itens sem cota).~~ substituída por ECO-33.
- **EO3-35** ~~Cota editada no detalhe: maior que 0 ("Cota inválida") e não menor que o já emitido ("Cota menor que o já emitido. Informe N ou mais.").~~ substituída por ECO-34.
- **EO3-36** ~~"Salvar alterações" do modal de operadores fica desabilitado se não sobrar nenhum operador.~~ substituída por ECO-22.

### Estados
- **EO3-40** ~~Sem grupos: "Nenhum grupo de operação neste evento", com o que o grupo faz e "Criar grupo" (EmptyState do DS).~~ substituída por ECO-40.
- **EO3-41** ~~Filtro sem resultado: "Nenhum grupo corresponde à busca ou aos filtros."~~ substituída por ECO-41.
- **EO3-42** ~~Aba de itens vazia: "Este evento não tem <tipo>."; busca sem resultado: "Nenhum item corresponde à busca."~~ substituída por ECO-32.
- **EO3-43** ~~Grupo inexistente: "Grupo não encontrado." com "Voltar para a listagem".~~ substituída por ECO-43.
- **EO3-44** ~~Recarregar a página apaga os grupos; recarregar numa tela interna volta para a lista.~~ substituída por ECO-44.
- **EO3-45** ~~Itens que saíram do catálogo são ignorados na contagem, no uso e no limite.~~ substituída por ECO-45.

### Permissões
- **EO3-60** ~~Um grupo atua em um só canal: PDV, Cortesia ou Bilheteria Online.~~ substituída por ECO-17.
- **EO3-61** ~~Sem limite: o teto de cada item é o estoque. Compartilhada: um saldo único para todos os itens. Por item: limite por item, e o limite do grupo é a soma.~~ substituída por ECO-61.
- **EO3-62** ~~Operador está ativo se não foi desligado sozinho e entra por um caminho ligado: e-mail avulso ou grupo de Membros ativo.~~ substituída por ECO-60.
- **EO3-63** ~~Com o grupo de Membros desligado, os membros dele ficam desligados e o toggle de cada um trava até religar o grupo.~~ substituída por ECO-60.
- **EO3-64** ~~Grupo desativado: "os operadores deste grupo deixam de ter acesso aos ingressos vinculados".~~ substituída por ECO-05.
- **EO3-65** ~~Um e-mail que já vem de um grupo de Membros escolhido não pode ser incluído de novo como avulso.~~ substituída por ECO-08.

## Depende de / afeta

- **Depende de:** grupos de Membros (hoje mock local em `data/membros.ts`) e itens do evento (mock).
- **Afeta:** acesso dos operadores ao PDV, ao portal de cortesia e à bilheteria online, fora do Backstage (não implementado no protótipo).

## Em aberto

- Grupos de Membros são mock próprio e não leem o store de `membros` (`../components/membros-store.ts`). Os grupos de lá não aparecem aqui.
- "Editar itens" com cota por item salva itens novos com cota 0, sem passar pela etapa Cotas.
- A rota `/:grupoId/editar` sem `?etapa=itens` abre o wizard completo, mas nenhum botão leva a ela.
- Grupos de exemplo entram só quando o primeiro grupo é criado; o uso deles é simulado.
- Estoque do modo "sem limite" é mock.
- Comentário do catálogo fala em salvar no localStorage, mas o store é só memória.

## Fontes

- Pesquisa e decisões de UX: [`PESQUISA-E-BOAS-PRATICAS.md`](PESQUISA-E-BOAS-PRATICAS.md)
- O código cita o Figma ("seção Proposta", "como no Figma") sem link _(components/ui-cotas.tsx, pages/CriarGrupoV3.tsx)_.
