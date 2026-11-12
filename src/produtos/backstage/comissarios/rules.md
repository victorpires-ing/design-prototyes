# Comissários: regras

> **Rotas:** `/backstage/relatorios/comissarios` (relatório). `/backstage/comissarios*` (lista, detalhe e cadastro antigos) leva ao relatório; `/backstage/evento/comissarios*`, a Equipe e Comissários; `/backstage/suas-vendas`, a `/freepass/eventos`.
> **No menu:** Backstage › menu da organização › Relatórios › Comissários. O comissário é um grupo de Equipe e Comissários com o canal Comissário (`../equipe-e-comissarios/rules.md`, ECO-09) e "Comissário" é cargo das pessoas (ECO-24); o painel Freepass fica em `freepass/rules.md`.
> **Versão em uso:** única (`comissarios/`), papel de pão para o discovery (Q1/2027)
> **Revisado em:** 2026-11-12

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

> **12/11/2026 (decisão Victor):** não existe mais cadastro de comissário na organização. Ligar o canal Comissário num grupo de Equipe e Comissários transforma o próprio grupo em comissário (nome e pessoas do grupo, código, responsável e condições); cada grupo, em cada evento, é um comissário próprio; "Comissário" virou um cargo aplicado às pessoas do grupo. Saíram `ComissariosOrganizacao.tsx`, `ComissarioForm.tsx` e `ComissarioDetalhe.tsx`. Ficaram aqui as peças reaproveitadas (`components/comuns.tsx`, `components/condicoes.tsx`, `components/RegistrarRepasseModal.tsx`, `data/comissarios.ts`) e as regras de cálculo, repasse e condições abaixo.

Promoters, atléticas e coletivos que vendem ingressos de um evento e ganham comissão por isso. A
organização cadastra o comissário uma vez, com condições padrão, e puxa para cada evento, onde pode
mudar as condições, os canais e os ingressos. Produtor acompanha por evento e somando todos os
eventos; o comissário acompanha as próprias vendas no Freepass, em Minhas vendas.

**Comissário não é sub-evento.** O comprador compra o mesmo evento; o que muda é a atribuição da
venda e quanto o comissário ganha. Sub-evento (evento vinculado que herda ingressos, informações e
validação, como "Anitta em BH") é outra feature. As duas funcionam juntas em formaturas e atléticas:
cada sub-evento é um evento e recebe seus comissários como qualquer evento (decisão Victor e
Viviane, 09/11/2026).

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Organização e eventos | `@/plataforma` (`useOrganizacaoAtual`, `useEventoAtual`) | não |
| Ingressos e setores do evento | `@/plataforma` (`useDoc("eventos", id)`: o espelho de `useEventoAtual` não traz o catálogo) | não |
| Grupos do evento, vendas atribuídas e repasses; comissário e vínculo são leituras do grupo com o canal Comissário | `@/plataforma/comissarios` (store único com Equipe e Comissários, semeado por organização, lido também pelo Freepass); `data/comissarios.ts` é o adaptador | sim, `localStorage` `backstage-comissarios-v11` |

Vendas atribuídas são mock: a plataforma ainda não tem comissário nem `comissario_id` no pedido.

## Regras

### Relatório de Comissários
- **COM-110** O antigo painel de Comissários da organização é um relatório em Relatórios › Comissários (selo "Novo"), dentro do layout dos Relatórios, sem "Cadastrar comissário". _(pages/relatorio-comissarios.tsx, ../components/navegacao-de-secao.tsx)_
- **COM-111** Soma os grupos-comissário do escopo dos Relatórios: "Todos os eventos" soma a organização (com a coluna Evento); um evento escolhido mostra só os dele. _(pages/relatorio-comissarios.tsx)_
- **COM-112** Métricas: comissários ativos (com o total de grupos-comissário), vendido por comissários, comissão gerada (com o estornado) e a repassar (com o já repassado). _(pages/relatorio-comissarios.tsx)_
- **COM-113** Lista: comissário (nome do grupo, código e condição), evento, vendido, comissão e a repassar. Ordena por Mais vendas (padrão, com a posição), A repassar ou Nome; grupos inativos no fim, com o selo "Grupo inativo". Busca por nome, código, e-mail ou evento; "Mostrar mais" acima de 20. No celular, tabela-lista. _(pages/relatorio-comissarios.tsx)_
- **COM-114** Clicar num comissário põe o evento dele em contexto e abre o grupo em Equipe e Comissários, na aba Vendas. _(pages/relatorio-comissarios.tsx)_
- **COM-115** Sem grupo-comissário no escopo: "Nenhum comissário na organização" (ou "neste evento"), explicando que um grupo vira comissário pelo canal Comissário. _(pages/relatorio-comissarios.tsx)_

### Organização (cadastro e painel)
- **COM-01** ~~Comissários entra no menu da organização, depois de Membros.~~ substituída por COM-110 (o painel virou relatório em Relatórios; "Membros e Comissários" voltou a ser só Membros).
- **COM-02** ~~O painel soma todos os eventos da organização: comissários ativos, vendido por comissários, comissão gerada (com o estornado) e a repassar (com o já repassado). O topo tem só o título e "Cadastrar comissário".~~ substituída por ECO-02.
- **COM-06** ~~Todos os números de Comissários usam o componente de métricas do DS (MetricsIcon03, sem variação nem menu), com ícone por tipo de número e o apoio no rodapé.~~ substituída por ECO-02.
- **COM-03** ~~A lista ordena por Mais vendas (padrão, com a posição no ranking), A repassar ou Nome. Pausados ficam no fim.~~ substituída por ECO-25.
- **COM-04** ~~Busca por nome, código ou e-mail. "Mostrar mais" acima de 20 (UI-LST-001).~~ substituída por ECO-25.
- **COM-05** ~~No celular e com pouco espaço, a tabela vira tabela-lista e o toque abre o comissário (UI-MOB-005).~~ substituída por ECO-25.
- **COM-07** ~~Link direto para um comissário (detalhe ou edição) de outra organização troca a organização em contexto para a dele.~~ substituída por ECO-25.
- **COM-10** ~~Cadastro: nome, e-mail do responsável e telefone; código; condições padrão; vendedores.~~ substituída por ECO-09.
- **COM-11** ~~O código nasce da última palavra do nome e pode ser editado. Só letras e números, em maiúsculas, de 3 a 20, único na organização.~~ substituída por ECO-36.
- **COM-12** O código vira o link de venda (`ingresse.com/e/<evento>?ref=<CODIGO>`) e funciona como cupom no checkout. _(components/comuns.tsx)_
- **COM-13** O comissário ganha de um de três jeitos: porcentagem do ingresso (sobre o valor pago já com desconto, sem a taxa de serviço), valor fixo por ingresso ou valor a mais no ingresso. _(components/condicoes.tsx, @/plataforma/comissarios)_
- **COM-16** Valor a mais no ingresso: quem compra com o código paga o preço do ingresso mais esse valor (ex.: R$ 100,00 com R$ 20,00 a mais sai por R$ 120,00), e a diferença é a comissão dele. Vale no link, no cupom e na bilheteria dele. Com valor a mais não há desconto. _(components/condicoes.tsx, @/plataforma/comissarios)_
- **COM-14** Desconto é opcional, em %, e vale no link e no cupom, só nos ingressos que o comissário pode vender. _(components/condicoes.tsx)_
- **COM-15** ~~Vendedores: pessoas que vendem pelo comissário (membros de uma atlética). O responsável vê tudo do comissário; cada vendedor vê só o que vendeu. Vendedor é só o e-mail: o nome vem da conta Ingresse, e quem não tem cria ao receber o convite; até lá, aparece o e-mail. Cada vendedor entra e sai deslizando; remover um e-mail preenchido oferece "Desfazer".~~ substituída por ECO-24.
- **COM-17** ~~"Colar e-mails" adiciona vários vendedores de uma vez: um por linha ou separados por vírgula, ponto e vírgula ou espaço. O que não é e-mail fica de fora (a tela diz quantos), e e-mail repetido ou do responsável não entra de novo.~~ substituída por ECO-08.
- **COM-18** ~~Sair do cadastro com alterações (Cancelar ou voltar) pede confirmação: "Continuar editando" ou "Descartar alterações"; fechar a aba avisa pelo navegador.~~ substituída por ECO-25.
- **COM-19** ~~O cabeçalho e a barra de ações ocupam a área de conteúdo; só as seções ficam no limite de 732 px. Editar por link, enquanto carrega, mostra o esqueleto das seções.~~ substituída por ECO-25.
- **COM-20** ~~Detalhe: vendido, comissão gerada, repassado e a repassar somando os eventos; abas Eventos, Repasses e Pessoas.~~ substituída por ECO-25.
- **COM-21** ~~Aba Eventos: condição em cada evento ("Igual ao cadastro" ou "Só neste evento"), vendido, comissão e a repassar. Abrir troca o evento em contexto e leva ao grupo dele em Equipe e Comissários, na aba Vendas.~~ substituída por ECO-25.
- **COM-24** ~~Na aba Eventos, cada evento mostra o banner ao lado do nome e da data, na tabela e na lista do celular.~~ substituída por ECO-25.
- **COM-22** ~~Pausar pede confirmação e vale em todos os eventos: link e cupom param de dar desconto e de contar vendas, bilheteria e cortesias ficam bloqueadas. O já vendido e o saldo continuam. Reativar é direto.~~ substituída por ECO-05.
- **COM-23** ~~Editar o cadastro muda as condições dos eventos que usam as do cadastro, só para as próximas vendas. Antes de salvar, a seção Condições padrão diz quantos eventos mudam e quantos têm condição própria.~~ substituída por ECO-20.

### Evento

> Desde 12/11/2026 o comissário no evento vive num grupo de Equipe e Comissários (`../equipe-e-comissarios/rules.md`, ECO-*). `ComissariosEvento.tsx`, `ComissarioNoEvento.tsx` e `data/operacao.ts` (ponte COM-70) saíram. O vínculo no evento virou leitura do grupo (`vinculoDoGrupo`).
- **COM-30** ~~Comissários é uma seção própria no menu do evento, com o item Comissários do evento (BKS-07).~~ substituída por ECO-01 (Equipe e Comissários).
- **COM-31** ~~Painel do evento: vendido por comissários (ingressos no link e na bilheteria), cortesias enviadas, comissão gerada e a repassar.~~ substituída por ECO-02 (Equipe e Comissários).
- **COM-32** ~~Lista: comissário com a condição valendo ("só neste evento" quando foi mudada), canais (link do vínculo; cortesia e bilheteria dos grupos de operação, COM-70), vendido, cortesias ("X de Y" com a cota dos grupos), comissão e a repassar. Pausados no fim.~~ substituída por ECO-02 (Equipe e Comissários).
- **COM-33** ~~"Adicionar comissários" escolhe entre os ativos da organização que ainda não estão no evento, com busca acima de 8. Entram com as condições do cadastro, vendendo pelo link em todos os ingressos.~~ substituída por ECO-09 (Equipe e Comissários).
- **COM-34** ~~Do modal dá para ir cadastrar um comissário novo na organização.~~ substituída por ECO-10 (Equipe e Comissários).
- **COM-50** ~~Comissário no evento: abas Vendas e Configuração; copiar link de venda (com o canal ligado) e registrar repasse no topo.~~ substituída por ECO-11 (Equipe e Comissários).
- **COM-51** ~~Vendas: métricas, "Venda por canal" (Link de venda, Bilheteria e Cortesia, sempre com o mesmo contraste, mesmo zerado ou sem canal) e os pedidos (data, pedido e comprador, ingresso, canal, vendedor quando há mais de um, valor com desconto ou valor a mais e comissão).~~ substituída por ECO-70 (Equipe e Comissários).
- **COM-53** ~~Pedidos filtram por número do pedido (uuid; a busca acha por qualquer trecho), canal e vendedor; canal e vendedor só aparecem quando há mais de um. A tabela mostra os 8 primeiros caracteres do pedido ("#daf72950") e o detalhe, o número inteiro. Filtro sem resultado: "Nenhum pedido com esses filtros." com "Limpar filtros".~~ substituída por ECO-70 (Equipe e Comissários).
- **COM-52** ~~Pedido cancelado mostra a comissão "Estornada" e não entra no saldo.~~ substituída por ECO-72 (Equipe e Comissários).
- **COM-60** ~~Condições: "Usar as do cadastro" (acompanha o cadastro) ou "Definir só para este evento", com o mesmo editor do cadastro.~~ substituída por ECO-20 (Equipe e Comissários).
- **COM-61** ~~Canais: Link de venda, Bilheteria e Cortesia, cada um com toggle.~~ substituída por COM-70. No comissário, só o link: "Vende pelo link e pelo cupom". _(pages/ComissarioNoEvento.tsx)_
- **COM-62** ~~Cortesia com cota no comissário.~~ substituída por COM-71. Cortesia não gera comissão.
- **COM-70** ~~Uma permissão, um lugar: quem emite cortesia ou vende na bilheteria (PDV ou Bilheteria Online), com quais ingressos e qual cota, é definido na Equipe de operação. O comissário tem acesso a esses canais quando alguma pessoa dele (e-mail) está ligada num grupo ativo do evento, e o que ela faz pelo grupo conta para ele.~~ substituída por ECO-17 (Equipe e Comissários).
- **COM-71** ~~Seção só de leitura "Cortesia e bilheteria".~~ substituída por COM-75.
- **COM-72** ~~"Configurar" (COM-75) abre a criação de grupo da Equipe de operação já com o canal, o nome ("Cortesia: <comissário>") e os e-mails do comissário; ao salvar, volta para a configuração dele.~~ substituída por ECO-09 (Equipe e Comissários).
- **COM-75** ~~Canais de venda: Link de venda, Cortesia e Bilheteria numa lista só. O link liga e desliga no próprio comissário. Cortesia e Bilheteria (PDV conta como bilheteria) dependem da Equipe de operação: sem grupo, a linha diz "Não configurado" e tem "Configurar"; com grupo, vira toggle com o grupo, o uso e a cota, e o link "Editar itens e cota no grupo". Desligar o toggle desliga as pessoas dele no grupo (os outros operadores seguem); grupo desativado na Equipe deixa o toggle travado, com o aviso. A mudança entra no rascunho e só vale ao salvar.~~ substituída por ECO-13 (Equipe e Comissários).
- **COM-73** ~~Na aba Vendas, "Por canal" e "Cortesias enviadas" usam os mesmos grupos: canal sem grupo aparece como "Sem grupo de operação"; a cota é a soma das cotas dos grupos de cortesia.~~ substituída por ECO-71 (Equipe e Comissários).
- **COM-67** ~~A lista de ingressos vem do catálogo gravado no banco; evento sem ingressos mostra "Este evento ainda não tem ingressos" com o caminho para Itens › Ingressos.~~ substituída por ECO-14 (Equipe e Comissários).
- **COM-63** ~~Ingressos: "Todos" (inclui os criados depois) ou "Só os escolhidos". Os escolhidos ficam numa linha "Ingressos" com o resumo ("3 ingressos em 2 setores") e "Escolher" ou "Editar", que abre o mesmo painel de seleção do Questionário e das Aberturas de vendas (sessão, setor e ingresso, com busca e Selecionados). Os demais ingressos continuam à venda, sem contar para ele.~~ substituída por ECO-15 (Equipe e Comissários).
- **COM-64** ~~Não há pausa própria do evento: os Canais de venda são o único controle. Sem nenhum canal ligado (link desligado e nenhum grupo de operação ativo), o comissário aparece como "Pausado neste evento" no topo e "Pausado" na lista do evento; pausado na organização, "Pausado na organização". O antigo "Pode vender neste evento" saiu em 11/11/2026 porque repetia os canais. O campo `ativo` do vínculo ficou no modelo, mas nenhuma tela lê nem grava.~~ substituída por ECO-05 (Equipe e Comissários).
- **COM-65** ~~Bloco "Remover do evento": remove só sem vendas, com confirmação; com vendas, orienta a desligar os canais de venda (histórico e saldo continuam).~~ substituída por ECO-23 (Equipe e Comissários).
- **COM-66** ~~Mudanças ficam em rascunho com a barra de salvar. Salvar vale para as próximas vendas; as feitas mantêm a condição da hora da venda.~~ substituída por ECO-21 (Equipe e Comissários).

### Repasse
- **COM-40** O pagamento da comissão é feito por fora da Ingresse (Pix, transferência) e registrado aqui para o saldo bater. _(components/RegistrarRepasseModal.tsx)_
- **COM-41** O repasse é de um comissário num evento; o modal sugere o saldo do evento escolhido. _(components/RegistrarRepasseModal.tsx)_
- **COM-42** A repassar = comissão gerada (pedidos confirmados) menos repassado. _(data/comissarios.ts)_

### Visão do comissário
- **COM-80** ~~Suas vendas no Backstage, com o seletor "Protótipo: ver como".~~ substituída por COM-85.
- **COM-85** O comissário não é membro da organização: acompanha as vendas no Freepass, o painel do Backstage com acessos a menos (`/freepass/eventos`, regras FCO em `freepass/rules.md`). Sem atalho no Backstage: o botão "Ver como comissário" saiu em 11/11/2026; o Freepass abre pela seleção de produtos.

### Validações
- **COM-90** ~~Nome e e-mail do responsável obrigatórios; e-mail válido ("Informe o e-mail do responsável.").~~ substituída por ECO-36.
- **COM-91** ~~Código de 3 a 20 letras ou números e único: "X já é de outro comissário. Escolha outro código."~~ substituída por ECO-36.
- **COM-92** Comissão maior que zero; porcentagem até 100%. Desconto ligado precisa de valor maior que zero e menor que 100%. _(components/condicoes.tsx)_
- **COM-93** ~~Vendedor precisa de e-mail válido, diferente do e-mail do responsável e sem repetir outro da lista.~~ substituída por ECO-08.
- **COM-94** ~~No evento: ao menos um ingresso escolhido quando é "Só os escolhidos". Link desligado é permitido (ele pode atuar só pelos grupos de operação). A cota é validada na Equipe de operação.~~ substituída por ECO-32 (Equipe e Comissários).
- **COM-95** Repasse maior que zero e até o saldo do evento. _(components/RegistrarRepasseModal.tsx)_
- **COM-96** Salvar com erro mostra os erros nos campos, um toast e rola até o primeiro. _(pages/ComissarioForm.tsx, pages/ComissarioNoEvento.tsx)_

### Estados
- **COM-100** ~~Organização sem comissários: "Nenhum comissário ainda" com "Cadastrar comissário".~~ substituída por ECO-40.
- **COM-101** Evento sem comissários: "Nenhum comissário neste evento" com "Adicionar comissários" (ou "Cadastrar comissário", se a organização não tem nenhum). _(pages/ComissariosEvento.tsx)_
- **COM-102** Comissário sem vendas no evento: "Nenhuma venda ainda." _(pages/ComissarioNoEvento.tsx)_
- **COM-103** Comissário inexistente ou fora do evento em contexto: mensagem e volta para a lista. _(pages/ComissarioDetalhe.tsx, pages/ComissarioNoEvento.tsx)_
- **COM-104** ~~Carregando: esqueleto enquanto a organização é semeada.~~ substituída por ECO-42.
- **COM-107** A primeira visita de cada organização (no Backstage ou no Freepass) cria, em até 3 eventos (primeiro os que estão vendendo), grupos-comissário de exemplo com os canais, código, responsável, pessoas, vendas e repasses; o Vitor Almeida (persona do Freepass) está na Anitta e em algumas outras, e nos eventos além do principal só emite (canal Comissário desligado). _(@/plataforma/comissarios `semear`)_
- **COM-106** ~~Na semente, cada comissário de um evento vira um grupo de Equipe e Comissários com ele, com os canais que ele tinha (link em todos os ingressos, bilheteria com comissão nos ingressos do evento, cortesia nos 3 primeiros com cota 20 ou sem limite) e o uso tirado das vendas semeadas.~~ substituída por COM-107.
- **COM-105** ~~A primeira visita de cada organização (no Backstage ou no Freepass) cria 7 comissários de exemplo (1 pausado), com vendas em até 3 eventos, primeiro os que estão vendendo. O Vitor Almeida (persona do Freepass) está na Anitta e em algumas outras; nas demais, o primeiro exemplo é Lucas Mendes. Nos eventos além do principal, o primeiro exemplo só emite (bilheteria e cortesia, ou só cortesia), sem link e sem vendas.~~ substituída por COM-107.

## Depende de / afeta

- **Depende de:** organização e eventos em `@/plataforma`; catálogo de ingressos do evento.
- **Afeta (ainda não feito):** pedido precisa guardar `comissario_id`, tipo e valor da comissão (MKT-262); Pedidos, Bilheteria, Cortesia e Relatórios precisam mostrar de qual comissário veio a venda; checkout e página do evento precisam ler o `?ref=` e o cupom (MKT-333).

## Em aberto

- **Organização x evento:** este protótipo segue a proposta da Viviane (cadastro na organização, condição própria no evento). A "Proposta 2 - Estrutura de Venda por Grupos" (Confluence, Renata) faz tudo dentro do evento, com "salvar como modelo". Decidir na reunião com a Jana.
- **Comissão por lote:** o MKT-262 pede configuração por evento, lote e comissário. Aqui é por evento e comissário; a comissão por lote ou por ingresso (ex.: VIP visível sem comissão) ficou de fora.
- **Comissão sobre cortesia:** assumido que não gera. A Ingresso Nacional pagaria por cortesia emitida (fala da Viviane, 20/10); falta confirmar.
- **Atribuição:** último clique vence e só conta pedido confirmado (MKT-262). Falta definir a janela (o ticket cita 24h) e se o cupom digitado no checkout ganha do link.
- **Repasse e contrato:** a Viviane ainda vai fechar como os comissários entram no contrato e se o repasse passa pela Ingresse. Aqui é registro manual de pagamento feito por fora, por evento, para não sacar o mesmo dinheiro duas vezes (caso relatado pela BT).
- **Venda sem transação:** emissão na bilheteria sem pagamento (Pix por fora) com trava configurável e taxas diferentes por canal foram pedidas pela operação (#produto-ingresse, 21/10). É configuração interna; não está no protótipo.
- **Valor a mais (COM-16):** falta definir se há teto, como o comprador vê o preço maior que o do site (página do evento e checkout, MKT-333) e se a bilheteria do Freepass mostra o preço com o valor a mais (hoje só o cálculo da comissão considera).
- **Acesso do comissário:** a jornada foi para o painel Freepass (o comissário não é membro da organização, como nas Propostas 2 e 3). Falta definir o login (e-mail com código) e o convite. Hoje o paliativo em produção é cadastrar como membro "Vendedor".
- **Metas, ranking com prêmio e sub-comissários:** fora do escopo, como na Proposta 2.
- **Exposição no fluxo de compra** ("Você está comprando com {nome}", MKT-262 e MKT-333): não faz parte deste protótipo.
- Tabelas são `<table>` feitas à mão e a tabela-lista vem de `relatorios/components/TabelaLista.tsx`, como nos relatórios. Conferir no AFTER DS.
- Sair do cadastro pelo menu lateral não pede confirmação: o protótipo usa `BrowserRouter`, sem bloqueio de navegação; só Cancelar, voltar e fechar a aba avisam.
- Grupo sem nome do responsável: a pessoa responsável recebe o nome do comissário (ex.: a atlética). Como nos vendedores, o nome poderia vir da conta Ingresse.

## Fontes

- Reunião "Comissários", Victor e Viviane, 09/11/2026 (transcrição).
- DM Victor e Viviane no Slack (D0A9KAKAMS9), 14/10 a 10/11/2026.
- Jira MKT-262 "Comissários/Grupo de eventos (Atléticas)" e POR-111 "Sistema de Comissários/Grupo de eventos"; MKT-333 "[DESIGN] Fluxo de Compra — Comissários".
- Transcrições "Discovery - Features para Comissários" de 20/10 (operação BT) e 28/10 (Ingresse Live).
- Confluence (Renata Waltrick): "Backstage - Sistema de Comissários", "Proposta 2 - Estrutura de Venda por Grupos", "Proposta 3 - Promotores de Venda", "Validação de Hipóteses com stakeholder", "Entrevista com o time de operações".
- "Bench Comissários — Ticketeiras" (Viviane, 16/10/2026).
