# Eventos: regras

> **Rotas:** `/backstage/eventos`, `/backstage/eventos/novo`, `/backstage/informacoes-evento`, `/backstage/evento/visao-geral`
> **No menu:** Backstage › rail da organização (ou barra do topo na shell "Novo") › Eventos. Informações do evento: menu do evento › Informações do evento. Visão geral não tem item de menu; só é aberta pelas ações do Remix (`components/remix/remix-respostas.ts`).
> **Versão em uso:** única (`eventos/`)
> **Revisado em:** 2026-11-07

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

Painel da organização com a lista de eventos e as métricas de venda, mais as telas do evento em
contexto: dados gerais, status (rascunho, privado, publicado, encerrado), link de compra e o painel
operacional (Visão geral). O produtor cria eventos e controla se e onde eles vendem.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Lista de eventos | `@/plataforma` (coleção `eventos`), espelhada em `data/eventos.ts` | sim (criar, status) |
| Evento em contexto | `data/eventos.ts` (`useEventoAtual`, id em `localStorage` `backstage-evento-atual`) | só no navegador |
| Link de compra (slug) | `@/plataforma` (`useDoc("eventos", id)`) | não |
| Métricas de venda, meta, pagamentos | `@/plataforma`: coleção `historico` (vendas anteriores ao gêmeo, eventos 6704, 2871, 3390, 5518) + pedidos pagos, calculadas em `data/vendas.ts` | não |
| Marcos & anotações | `data/marcos.ts` (mock com seed, `localStorage` `backstage-marcos`) | só no navegador |

Antes do banco carregar, a lista mostra o mock de `data/eventos.ts`; depois passa a refletir o banco.

## Regras

### Métricas (banco)
- **EVT-90** Vendidos, faturamento, série diária e pagamentos somam o histórico do evento e os pedidos pagos do banco. _(data/vendas.ts)_
- **EVT-91** Canais: Ingresse (site, link, app), Bilheteria e Cortesias. Faturamento usa o valor de face pago; cortesia e "só a taxa" entram com R$ 0. _(data/vendas.ts)_
- **EVT-92** Capacidade por setor = soma dos lotes de cada grupo; evento com várias sessões agrupa por sessão. _(data/vendas.ts, pages/VisaoGeralEvento.tsx)_

### Comportamento
- **EVT-01** A lista mostra os eventos do banco da organização em contexto (ORG-12), mais recentes (por criação) primeiro. _(data/eventos.ts)_
- **EVT-02** O subtítulo conta só eventos ativos: privado ou publicado ("N eventos ativos"). _(pages/Eventos.tsx)_
- **EVT-03** Os cartões Faturamento confirmado (antes "GMV confirmado", jargão; a Visão geral já usa "Faturamento confirmado"), Produtos vendidos e Ingressos vendidos somam só eventos ativos e olham os últimos 7 dias **completos** (até ontem) contra os 7 anteriores. O dia de hoje fica fora: ainda não fechou e puxava a curva para zero, sugerindo uma queda que não aconteceu. _(pages/Eventos.tsx, data/vendas.ts, components/CartaoMetrica.tsx)_
- **EVT-04** A busca filtra por nome, produtor ou local, sem diferenciar maiúsculas. _(pages/Eventos.tsx)_
- **EVT-05** Ordenação: Data do evento (mais próxima primeiro, padrão), Ocupação, Faturamento ou Ritmo de vendas (maior primeiro). _(pages/Eventos.tsx)_
- **EVT-06** O cartão do evento mostra capa, data no formato do idioma ("17 de out. de 2026"), badge de status e nome (até 3 linhas). _(pages/Eventos.tsx)_
- **EVT-07** Entrar no evento (clicar no cartão em Eventos ou escolher o evento na busca de organização e evento) torna o evento o evento em contexto e abre Itens › Ingressos (`/backstage/catalogo/ingressos`). Antes abria Relatórios › Vendas; mudou em 12/11/2026 (pedido Victor). _(pages/Eventos.tsx, ../organizacoes/components/BuscaOrganizacaoEvento.tsx)_
- **EVT-08** Menu "…" do cartão: Editar abre Informações do evento. ~~Excluir mostrava um toast de erro~~ Excluir saiu do menu até existir regra de exclusão (UI-EST-005: opção sem destino). _(pages/Eventos.tsx)_
- **EVT-09** ~~"Criar evento" abre um modal~~ substituída por EVT-50.
- **EVT-10** Ao criar, o evento vira o evento em contexto e a pessoa vai para Itens › Ingressos. ~~Toast "Evento criado como rascunho. Agora crie os ingressos."~~ No lugar do toast, o holofote do Guia de configuração apresenta o guia (`guia-de-configuracao/rules.md` GDC-14). _(pages/CriarEvento.tsx)_
- **EVT-11** O slug do link de compra vem do nome; se já existir, ganha sufixo `-2`, `-3`… _(plataforma/acoes.ts)_
- **EVT-12** O campo Local é separado em local e cidade pelo primeiro "·" ou "•". _(data/eventos.ts)_
- **EVT-13** Sem banner, o evento novo recebe uma imagem fixa por id. _(plataforma/acoes.ts)_
- **EVT-14** Informações do evento mostra capa, Nome, ID, Produtor, Data e horário e Local, só leitura. _(pages/InformacoesEvento.tsx)_
- **EVT-15** O status pode ser alterado em três lugares: botão "Alterar status" em Informações do evento, dropdown "Status do evento" no cartão do menu do evento e seta ao lado do badge no mobile. Todos abrem o mesmo modal. _(pages/InformacoesEvento.tsx, components/Backstage.tsx)_
- **EVT-16** O dropdown do cartão do evento lista os 4 status com legenda curta; o atual fica desabilitado. Escolher um abre o modal já com o destino escolhido, sem a lista de opções. _(components/Backstage.tsx, components/AlterarStatusModal.tsx)_
- **EVT-17** O modal explica o efeito antes de aplicar: ligar ou desligar a venda, abrir para qualquer pessoa ou restringir a quem tem o link. _(components/AlterarStatusModal.tsx)_
- **EVT-18** Botão de confirmar muda com o destino: "Abrir para todo mundo", "Tornar privado", "Voltar para rascunho" ou "Encerrar evento" (vermelho). _(components/AlterarStatusModal.tsx)_
- **EVT-19** Status e venda: rascunho não vende; privado vende só pelo link; publicado vende pelo link e aparece no site; encerrado não vende. _(data/eventos.ts, plataforma/regras.ts)_
- **EVT-20** Encerrado é terminal: o banco ignora qualquer troca de status de um evento encerrado. _(data/eventos.ts, plataforma/acoes.ts)_
- **EVT-21** Link de compra exibido: `<origem>/e/<slug>`, com "Copiar" (toast "Link copiado.") e "Abrir" em nova aba. _(pages/InformacoesEvento.tsx)_
- **EVT-22** Texto do link: sem ingresso, "Crie um ingresso para o link vender alguma coisa."; publicado, "Vendendo pelo link e no site da Ingresse."; privado, "Vendendo só por este link. O evento não aparece no site."; demais, "Publique ou deixe o evento privado para o link começar a vender." _(pages/InformacoesEvento.tsx)_
- **EVT-23** Visão geral: faturamento confirmado contra a meta, com marcador da projeção no ritmo atual; a projeção não passa de capacidade × ticket médio. _(pages/VisaoGeralEvento.tsx, data/vendas.ts)_
- **EVT-24** Badge de ocupação: verde a partir de 70%, amarelo a partir de 40%, vermelho abaixo. Sessão com menos de 35% de ocupação tem o percentual em vermelho. _(pages/VisaoGeralEvento.tsx)_
- **EVT-25** Capacidade por sessão: barra dividida por canal (Ingresse, parceiro, cortesia), agrupada por ambiente quando há mais de um. _(pages/VisaoGeralEvento.tsx)_
- **EVT-26** Velocidade de vendas: ritmo dos últimos 7 e 30 dias, ticket médio e gráfico dos últimos 60 dias. A variação só aparece se for de 5% ou mais. _(pages/VisaoGeralEvento.tsx)_
- **EVT-27** Marcos & anotações: data (padrão hoje), tipo (Virada de lote, Anúncio de atração, Ação de marketing, Evento externo), título e descrição opcional; lista do mais recente para o mais antigo, com remover. _(pages/VisaoGeralEvento.tsx, data/marcos.ts)_
- **EVT-28** Métodos de pagamento: quantidade e percentual de Cartão de crédito, Pix, Boleto e Saldo do produtor. _(pages/VisaoGeralEvento.tsx, data/vendas.ts)_

### Criar evento (`/backstage/eventos/novo`)
- **EVT-50** "Criar evento" em Eventos abre um menu com os tipos (Futebol, Shows e festas, Evento esportivo); cada um abre a tela de criação dele (`/backstage/eventos/novo?tipo=`). Ícones animados do Iconly em traço (Sport ticket, Music ticket, Star medal) tocam uma vez no hover ou foco do item; com reduzir movimento, ficam parados. _(data/tipos-evento.ts, components/foundations/icone-animado.tsx)_ O evento nasce em rascunho, na organização em contexto; o Produtor é o nome da organização. _(pages/Eventos.tsx, data/tipos-evento.ts)_
- **EVT-51** A tela de criação não troca de tipo: o título diz qual é ("Criar evento de futebol", "Criar show ou festa", "Criar evento esportivo"). Sem tipo válido na URL, volta para Eventos. _(pages/CriarEvento.tsx)_
- **EVT-52** ~~Seções empilhadas (Partida, Informações, Datas, Venda, Divulgação, Configurações avançadas)~~ substituída por EVT-85.
- **EVT-53** Partida: Time mandante e Time visitante obrigatórios; Campeonato e Programa de membros opcionais. O visitante não lista o mandante. _(pages/CriarEvento.tsx)_
- **EVT-54** Futebol: o Nome segue "Mandante x Visitante" enquanto a pessoa não digitar outro nome. _(pages/CriarEvento.tsx)_
- **EVT-55** Evento esportivo: Modalidade obrigatória (Corrida, Natação, Trilha, Ciclismo) e vocabulário de inscrição: "Limite geral por participante", "Cronograma de largadas", categoria "Inscrição" no lugar de "Ingresso". _(pages/CriarEvento.tsx)_
- **EVT-56** ~~Cronograma com "Adicionar sessão" e lista de datas~~ substituída por EVT-89.
- **EVT-57** ~~Limites geral e por categoria na criação~~ Limites saíram da criação em 12/11/2026: o evento nasce ilimitado (`geral: null`, nenhuma categoria) e os limites por categoria se definem em Itens › Configurações de ingressos (`itens/rules.md` ITM-67). _(pages/CriarEvento.tsx)_
- **EVT-58** Mapa: "Enviar imagem" ou "Mapa de assentos" (escolhe um mapa da lista do back-end). _(pages/CriarEvento.tsx)_
- **EVT-59** Configurações avançadas, com padrão: compras em grupos diferentes Permitir; estoque devolvido Manter no lote de origem; troca de setor desligada; reserva na compra desligada; Bilheteria online Sem limite; política padrão da organização; acesso por face Não usar; QR code no e-mail Incluir. Gravadas na criação com esse padrão; só a política se escolhe na criação (EVT-84). _(data/configuracoes-avancadas.ts)_
- **EVT-62** Campeonatos, times, programas de membros, moedas, políticas, serviços de acesso por face e mapas de assentos vêm do back-end (no protótipo, chamada simulada). Enquanto carregam, os campos ficam desabilitados com "Carregando…". _(data/opcoes-evento.ts)_
- **EVT-63** Banner e mapa: PNG ou JPG, gravados no evento (o recorte do banner vira a capa, EVT-81). O banner não tem limite de tamanho (o gravado é o recorte de 1080 × 1350); o mapa também não (desde 13/11/2026) e, enviado, mostra a imagem inteira, sem corte, com o nome, trocar e remover embaixo, como o banner. Outro formato ou imagem que não abre é recusado com aviso. _(pages/CriarEvento.tsx)_
- **EVT-64** Com algo preenchido, Cancelar e "← Eventos" pedem confirmação: "Descartar o evento?", com "Continuar editando" e "Descartar". _(pages/CriarEvento.tsx)_
- **EVT-79** Banner na página do evento (EVT-85). A partir de 1024 px ocupa a coluna da esquerda, fixa ao rolar, sem rótulo nem borda, com fundo `bg-primary_alt`. Vazio, o bloco 4:5 inteiro é o botão de envio, sobre o campo de partículas: "Clique para enviar o banner", "ou arraste a imagem para cá" e "PNG ou JPG" / "1080 × 1350 px". Partículas translúcidas (alfa 0,132 no escuro e 0,12 no claro). No hover, o fundo vai para o cinza de hover a 10% de opacidade (250 ms) e as partículas passam aos poucos (250 ms) para o vermelho da marca, `#ff271a` (os tokens `brand` deste tema são neutros), sem reiniciar a figura. _(components/campo-banner.tsx, pages/CriarEvento.tsx)_
- **EVT-80** Abaixo de 1024 px, o banner vem antes do formulário, na versão enxuta do desktop: uma caixa sem padding com o banner pequeno (4:5) à esquerda e o texto à direita, centralizado na altura. Vazia, a caixa inteira é o botão de envio ("Enviar o banner", "PNG ou JPG, 1080 × 1350 px", aceita arrastar), sobre o mesmo campo de partículas, que some para a direita. Enviado, a miniatura recortada, o nome, "Ajustar recorte", "Trocar imagem" e remover. Até 13/11/2026 era a área de envio do DS depois de Quando e Onde. _(components/campo-banner.tsx)_
- **EVT-81** Enviar a imagem abre o modal de recorte do DS ("Recortar banner": `Cropper` de `shared-assets/image-cropper`, no layout do exemplo `image-crop-modal` do Untitled UI PRO) com a área travada em 4:5, começando no maior recorte centralizado. "Aplicar recorte" confirma; "Cancelar", X ou Esc descartam a imagem nova (ou mantêm o recorte anterior, num ajuste). A prévia mostra só a parte recortada. Ao criar, o recorte vira um JPEG de 1080 × 1350 gravado como capa. _(components/campo-banner.tsx, pages/CriarEvento.tsx)_
- **EVT-82** Na prévia do desktop: clicar na imagem ou em "Ajustar recorte" reabre o modal com o recorte atual; "Trocar imagem" abre o seletor de novo (e o modal); "Remover banner" volta ao estado vazio. _(components/campo-banner.tsx)_
- **EVT-83** Local: escolher um resultado da busca fixa o local; o campo mostra "Local, Cidade" e não volta a acusar erro. Antes, o ComboBox tirava o item escolhido da lista e isso apagava a escolha. Apagar ou mudar o texto desfaz a escolha. _(pages/CriarEvento.tsx)_
- **EVT-84** Das configurações avançadas, a criação só mostra a Política (em Detalhes do evento › Venda). O resto foi para Itens › Configurações de ingressos (`itens/rules.md` ITM-66). _(pages/CriarEvento.tsx)_
- **EVT-85** A criação tem o formato da página do evento, editável no lugar (o que se vê é o que o comprador vê): cabeçalho com "← Eventos" e, embaixo, o título da tela ("Criar show ou festa"), sem selo nem descrição; banner à esquerda; à direita, o nome num campo do DS ("Nome do evento", com ícone ao lado como as outras linhas); depois dele, no futebol, uma linha com Time mandante e Time visitante lado a lado e uma para Campeonato e outra para Programa de membros, no esportivo a Modalidade e no show ou festa a Categoria, todas com o ícone ao lado como as outras linhas; Quando (dias e horários, EVT-88), Local (cada linha com o ícone do DS alinhado ao campo) e "Sobre o evento". Abaixo, "Detalhes do evento" ("Não aparecem na página do evento, mas definem como ele vende."), com os blocos empilhados: cronograma de sessões (só com mais de um dia), Venda (moeda, idade mínima e política) e Mapa. Usa a largura toda da tela. O banner tem a altura limitada à tela (sem encostar na barra de Criar evento), por isso fica um pouco mais estreito que a coluna em telas baixas. _(pages/CriarEvento.tsx)_ Desde 13/11/2026, à direita do banner os blocos ficam empilhados em cartões: "Informações do evento" (nome, categoria ou partida, Quando, Onde e Sobre o evento, num cartão só) e, abaixo, "Detalhes do evento" com Cronograma, Venda e Mapa. No desktop, a largura do banner sai da altura da tela, para ele e as opções embaixo (nome, ajustar, trocar, remover) caberem acima da barra de Criar evento; o formulário ocupa o resto, à mesma distância do banner que a margem da direita, e para de esticar em telas acima de 1920 px. Os campos não têm ícone ao lado (o padrão não se repetia em outra tela); só Dias do evento (calendário) e Categoria (etiqueta) têm ícone, dentro do campo. Os cartões não têm subtítulo.
- **EVT-86** "Sobre o evento" é obrigatório ("Conte o que vai acontecer no evento.") e é uma linha como Quando e Onde (rótulo do mesmo tamanho) e é rich text do DS (`TextEditor`), com a barra de formatação dentro da caixa de texto, com negrito, itálico, sublinhado, alinhar à esquerda, centralizar e lista; sem cor, fonte nem link. Grava o HTML em `vitrine.descricaoHtml` e o texto em parágrafos em `vitrine.descricao`, para quem só lê texto. A barra também insere imagem (PNG ou JPG, sem limite de tamanho, gravada como data URL junto do texto); a imagem se redimensiona pelas alças dos cantos, mantendo a proporção, com o visual do recorte do banner (contorno em `utility-brand-600` e alças quadradas brancas), e a largura vai junto no HTML. _(pages/CriarEvento.tsx)_
- **EVT-87** Ao abrir a criação, o cursor já está no nome do evento. _(pages/CriarEvento.tsx)_
- **EVT-88** Quando, no jeito de passagem de ida e volta: "Dias do evento" abre um calendário de intervalo do DS (dois meses no desktop, um no celular, sem datas passadas). O primeiro clique marca o primeiro dia; o segundo, o último. Aplicar só com o primeiro clique vale como evento de um dia ("Sex, 20 de nov, um dia só. Para um período, clique no último dia."); o rodapé diz o intervalo ("Sex, 13 de nov até dom, 15 de nov" ou "evento de um dia só") e só vale ao Aplicar. Depois aparecem "Começa às (dia)" e "Termina às (dia)". Os campos de hora informam o tema ao navegador (`color-scheme`), para o relógio nativo ter contraste no claro e no escuro. Começa às 20:00; no mesmo dia, termina 4 h depois (até 23:59); em dias diferentes, no mesmo horário do início. Trocar o período tira as sessões que ficaram de fora. Um clique num dia e Aplicar vale como evento de um dia: o primeiro dia é o clicado, não o dia sob o cursor (com o primeiro dia marcado, o hover pré-visualiza o intervalo e move o foco). _(components/periodo-do-evento.tsx)_
- **EVT-89** Cronograma de sessões só existe quando o evento tem mais de um dia, e nada é criado sozinho: o bloco é opcional e começa só com o cartão "Adicionar sessão" ("largada" no esportivo), um retângulo tracejado do tamanho dos cartões de dia, sempre no fim da lista. Adicionar abre um modal do DS ("Nova sessão", com Cancelar, X ou Esc para fechar): Dia (até 9 dias, um cartão por dia do período, "Sex" e "13 Nov"; a partir de 10 dias, o calendário do DS na largura toda do modal, só com os dias do período liberados e os dias que já têm sessão marcados), Começa às e Termina às (fim antes do início = termina no dia seguinte); recusa dia ou horário vazio, fim igual ao início e sessão repetida. As sessões aparecem em cartões por dia, com os horários embaixo ("20:00 às 23:00"); um dia pode ter mais de uma, e cada uma tem "×" para remover. Com sessões, elas são as sessões do evento; sem nenhuma, o evento tem uma sessão só, no início. Trocar o período tira as sessões que ficaram de fora. _(components/cronograma-de-sessoes.tsx, pages/CriarEvento.tsx)_ Desde 13/11/2026 o cronograma só aparece com "Em sessões" (EVT-98), dentro de Quando, inclusive num dia só, e deixa de ser opcional: pede ao menos uma sessão. Num evento de um dia, o modal já vem com o dia escolhido, sem a escolha de dia, e o subtítulo diz a data ("Qua, 9 Dez. Escolha os horários de início e de fim.").
- **EVT-93** A barra de Cancelar e Criar evento mostra uma instrução por vez: o próximo campo obrigatório que falta, na ordem da tela (nome, times, modalidade, categoria, dias, horário de fim, local, sobre o evento, sessões, mapa), com o texto da validação ("Dê um nome ao evento.", "Escolha quando o evento acontece.", "Busque e escolha o local do evento."). Clicar leva ao campo. Sem pendência: "Tudo pronto para criar o evento.". _(pages/CriarEvento.tsx)_
- **EVT-94** Idade mínima com as caixas da classificação indicativa (L verde, 10 azul, 12 amarela, 14 laranja, 16 vermelha, 18 preta), na lista e no campo depois de escolher. Cores e siglas do padrão oficial, valores fixos. _(components/classificacao-indicativa.tsx)_
- **EVT-97** Show ou festa: Categoria obrigatória, logo depois do nome. A lista vem do back-end com as outras opções da criação e é gravada em `evento.categoria` (o id). Futebol e esportivo não têm categoria. _(pages/CriarEvento.tsx, data/opcoes-evento.ts)_
- **EVT-98** Escolhidos os dias (um ou vários), aparece "Como o evento acontece" (controle segmentado do DS, sem texto de apoio) num fundo `bg-secondary` que guarda tudo o que vem depois do campo de dias; o campo de dias fica fora dele. Opções: "Direto, do início ao fim" ("Um horário" num dia só, padrão), que pede o horário de início e de fim, ou "Em sessões" ("Em largadas" no esportivo), que tira os horários gerais deslizando e mostra ali o cronograma (EVT-89), com ao menos uma sessão ("Adicione ao menos uma sessão."). Em sessões, o evento começa na primeira sessão e termina no fim da última; num dia só também dá para ter várias sessões. Direto, as sessões não são gravadas. Mudar os dias com sessões fora do novo intervalo avisa no rodapé do calendário antes do Aplicar ("2 sessões ficam fora destes dias e saem ao aplicar."). _(pages/CriarEvento.tsx, components/periodo-do-evento.tsx)_
- **EVT-99** Organização sem evento mostra Eventos vazio ("Nenhum evento ainda"), sem herdar os eventos da organização anterior. _(data/eventos.ts, data/vendas.ts)_
- **EVT-100** Organização sem evento: Eventos mostra só o título, o subtítulo e o vazio com "Criar evento". Os números do topo, o "Criar evento" do cabeçalho, a busca e a ordenação saem deslizando e voltam quando há evento. _(pages/Eventos.tsx)_
- **EVT-65** ~~Local e Cidade são campos separados~~ Local é um campo só, com busca de endereço (API; no protótipo, `buscarLocais` simulada em `data/opcoes-evento.ts`), conforme UI-FRM-004: a partir de 2 letras busca; a lista abre só com resultados; "Buscando…" e "Nenhum local encontrado" aparecem dentro do campo; escolher um local leva "Local, Cidade" inteiro para o campo, sem nada no hint. A descrição grava os parágrafos como foram digitados. Datas usam o seletor de data e hora do DS (`DateTimePicker`), conforme UI-FRM-001: clicar em qualquer ponto do campo abre o calendário e o foco fica no campo, para digitar dia, mês, ano e seguir para hora e minuto (24 h); clicar num dia leva o foco ao horário, no próprio calendário, e Aplicar fecha; escolher o dia sem horário não grava meia-noite; o calendário tem a largura do campo e, sem espaço abaixo (celular), o campo sobe antes de abrir. _(pages/CriarEvento.tsx)_
- **EVT-67** Data final: vazia, segue o início + 4 h, com a dica "Sugerida 4 h depois do início. Ajuste se precisar."; editada pela pessoa, deixa de seguir o início. _(pages/CriarEvento.tsx)_
- **EVT-68** Dropdowns opcionais (Campeonato, Programa de membros) mostram um × dentro do campo, só com algo escolhido, que volta ao vazio ("Limpar campeonato"), conforme UI-FRM-003. Campos com padrão (Moeda, Idade mínima, Políticas, Acesso por face) não têm ×. _(pages/CriarEvento.tsx)_
- **EVT-69** ~~O cabeçalho traz a prévia viva do ingresso~~ Removida (decisão Victor, 08/11/2026): a tela não tem prévia do ingresso. _(pages/CriarEvento.tsx)_
- **EVT-71** Cabeçalho da página e das seções só com título e, se preciso, subtítulo, sem sobretítulo nem número de seção (UI-VIS-014). A barra de ações (Cancelar, Criar evento) tem o fundo da página, `bg-primary_alt`, separada por borda, e ocupa a largura da área de conteúdo, fora do limite de 732 px do formulário (UI-VIS-009, UI-VIS-013). Informações não se separam por símbolo: os mapas de assentos mostram o nome e, como texto de apoio, os setores (UI-TXT-010). _(pages/CriarEvento.tsx, data/opcoes-evento.ts)_
- **EVT-72** Data e local dos eventos sem símbolo separador (UI-TXT-010): a data é uma frase do idioma ("6 de dezembro de 2026 às 16:00") e local e cidade vão separados por vírgula ("Estádio Nilton Santos, Rio de Janeiro, RJ"). Vale para Informações do evento, Visão geral e busca, que leem `dataLabel` e `local`. _(data/eventos.ts)_
- **EVT-73** No celular, os três cartões de métrica ficam empilhados, todos visíveis, com gráfico; no desktop, em três colunas. Sem faixa que rola para o lado nem seletor que esconde métricas (UI-MOB-004). _(pages/Eventos.tsx)_
- **EVT-74** Buscar e reordenar fazem os cartões de evento deslizarem até o novo lugar; o estado "Nenhum evento encontrado" entra e sai deslizando. Com movimento reduzido, só troca (UI-VIS-008). _(pages/Eventos.tsx)_
- **EVT-75** Textos da página em `data/textos-eventos.ts`: frases inteiras, plural pelo idioma ("1 evento ativo", "N eventos ativos"), datas, números e percentuais pelo locale. Períodos sem repetir o mês ("De 1 a 7 de nov."); eixo do gráfico com o mês só nas pontas. A busca tem 320 px no desktop para o placeholder caber inteiro (UI-TXT-009). _(data/textos-eventos.ts, components/CartaoMetrica.tsx)_
- **EVT-76** Enquanto o banco carrega, a página mostra esqueleto no subtítulo, nas métricas e na lista, nunca "0 eventos" nem "Nenhum evento encontrado". Se a sincronização falha depois de carregar, os dados ficam e aparece o aviso "Sem conexão com o banco: os números podem estar desatualizados. A página tenta de novo sozinha." (UI-EST-007). _(pages/Eventos.tsx)_
- **EVT-77** O cartão de evento mostra o contorno de foco quando o botão que o cobre recebe foco pelo teclado (WCAG 2.4.7). Títulos escondidos visualmente organizam a página: "Resumo das vendas dos eventos ativos" e "Lista de eventos". _(pages/Eventos.tsx)_
- **EVT-78** Moeda e números pelo idioma (`useFormatos` em `data/textos-eventos.ts`): ritmo compacto "R$ 8,4 mil", sem o "K"; rótulos de ordenação, status e tipo de evento vêm dos textos da página (UI-TXT-009). _(data/textos-eventos.ts)_
- **EVT-70** Textos da tela em `data/textos-criar-evento.ts`: frases inteiras com variáveis nomeadas, vocabulário por tipo em frases completas e datas pelo locale do contexto (UI-TXT-009). `DateTimePicker` recebe `textos` por idioma. _(data/textos-criar-evento.ts)_
- **EVT-66** Textos de ajuda só repetem o que a especificação diz; regra não confirmada (o que cada configuração avançada faz na compra) não aparece na tela. _(pages/CriarEvento.tsx)_

### Validações
- **EVT-60** Criar evento: o clique valida, marca cada campo com a mensagem (ligada ao campo), rola até o primeiro. ~~Toast "Revise os campos destacados para criar o evento."~~ Saiu em 12/11/2026: os campos marcados e a instrução da barra (EVT-93) já dizem o que falta. _(pages/CriarEvento.tsx)_
- **EVT-61** Obrigatórios: Nome, Local, Data e hora inicial e final (o fim depois do início); no futebol, mandante e visitante diferentes; no esportivo, Modalidade; no show ou festa, Categoria; local escolhido na busca; sessões extras preenchidas e entre o início e o fim (cada uma marcada); limite desligado com quantidade; mapa de assentos escolhido quando essa for a origem. _(pages/CriarEvento.tsx)_
- **EVT-30** ~~Criar evento: Nome, Data e horário, Local e Produtor obrigatórios, botão desabilitado~~ substituída por EVT-60 e EVT-61.
- **EVT-31** Alterar status: confirmar fica desabilitado enquanto o destino for o status atual. _(components/AlterarStatusModal.tsx)_
- **EVT-32** Encerrar exige marcar "Entendo que essa ação não pode ser desfeita"; o aviso diz "O evento será encerrado e as vendas serão interrompidas. Essa ação não pode ser desfeita." _(components/AlterarStatusModal.tsx)_
- **EVT-33** Marco: "Salvar" fica desabilitado sem título. _(pages/VisaoGeralEvento.tsx)_

### Estados
- **EVT-46** Criar evento: falha ao carregar as listas mostra "Não foi possível carregar as listas (times, moedas, políticas)." e "Tentar de novo". _(pages/CriarEvento.tsx)_
- **EVT-40** Dois vazios: busca sem resultado mostra "Nenhum evento encontrado" / "Tente outro nome, produtor ou local."; organização sem nenhum evento mostra "Nenhum evento ainda" / "Crie o primeiro evento da organização para começar a vender." com o botão "Criar evento" e o menu de tipos (UI-EST-006). _(pages/Eventos.tsx)_
- **EVT-41** Encerrado: Informações do evento troca o botão por "Evento encerrado. O status não pode mais ser alterado."; o dropdown do menu fica desabilitado e a seta do mobile some. _(pages/InformacoesEvento.tsx, components/Backstage.tsx)_
- **EVT-42** Link de compra não aparece enquanto o documento do evento não carrega do banco. _(pages/InformacoesEvento.tsx)_
- **EVT-43** Visão geral sem dados de venda: só o título e "Este evento ainda não tem vendas para acompanhar." _(pages/VisaoGeralEvento.tsx)_
- **EVT-44** Marcos vazio: "Nenhuma anotação ainda." _(pages/VisaoGeralEvento.tsx)_
- **EVT-45** Visão geral mostra "faltam N dias" ou "evento realizado" quando a data já passou. _(pages/VisaoGeralEvento.tsx)_

## Medição (Criar evento)

- **Hipótese:** Observamos que o produtor cria eventos com campos que não fazem sentido para o tipo (ex.: futebol sem times). Acreditamos que escolher o tipo antes do formulário reduz eventos criados com dados errados. Para verificar, medindo os erros de validação por campo e as edições feitas logo depois de criar. Estaremos certos se as edições na primeira hora após criar caírem. > LACUNA: valor atual dessas edições; buscar no Backstage em produção.
- **Métricas:** tempo do menu até "Criar evento" concluído; erros de validação por campo; taxa de descarte (EVT-64).
- **Eventos a instrumentar:** `evento_tipo_escolhido` (tipo), `evento_criacao_erro` (campos), `evento_criacao_descartada` (tipo, campos preenchidos), `evento_criado` (tipo, tem sessões extras, limites usados, avançadas alteradas).
- **Validar com:** 3 a 5 produtores, um de cada tipo (clube de futebol, casa de shows, organizador de corrida), criando um evento real deles no protótipo.

## Depende de / afeta

- **Depende de:** banco unificado `@/plataforma` (eventos); mock `data/vendas.ts` para métricas.
- **Afeta:** site (só lista publicados, via `apareceNoSite`); link de compra `/e/<slug>` e seleção (`/comprar/:id`) só vendem em privado ou publicado (`vendeNoLink`); checkout e carteiras recebem pedidos só desses eventos. O evento em contexto escolhido aqui alimenta Ingressos, Informações do evento e o cartão do menu do evento.

## Em aberto

- Categorias de show ou festa (EVT-97): a lista (Show, Festa, Festival, Balada, Teatro, Stand-up, Infantil, Gastronomia) é de exemplo; falta a lista real do back-end e se a categoria aparece no site.
- Sessões: o horário de fim de cada sessão fica só na criação; o modelo `Sessao` ainda não tem fim e o banco grava só o início.
- Página do evento do novo site (`ingresse-novo-site-prototipo.vercel.app/Evento.dc.html`): hero escuro com pôster, título grande, Quando/Onde/Atração em rótulos pequenos, "Antes de ir" e cartão de compra fixo. A criação ainda não segue esse visual.

- Modal de recorte: o exemplo `src/components/application/modals/image-crop-modal.tsx` do Untitled UI PRO foi instalado como veio (é uma demonstração: galeria fixa, reabre sozinho) e não é usado direto; o modal do banner reproduz o layout dele com o `Cropper` do DS. A CLI também atualizava `modal.tsx`, `button.tsx`, `close-button.tsx`, `file-upload-trigger.tsx`, `featured-icon.tsx`, `is-react-component.ts` e as versões de `react-aria-components`, `@untitledui/icons` e `tailwind-merge`; isso foi desfeito para não mudar as outras telas. Ficou só a dependência nova `react-image-crop`.

- Banner no desktop: no futebol, os times vêm antes do nome, então o banner fica ao lado dos times e do nome.
- Rich text: o site e o checkout ainda mostram `vitrine.descricao` em texto; ninguém lê `descricaoHtml` além da criação.

- **Traduções pt-PT, inglês e espanhol** da página de Eventos (`data/textos-eventos.ts`) e da criação de evento: a estrutura está em `data/textos-criar-evento.ts`; faltam os textos (sem tradução, cai no pt-BR). O resto da tela (rótulos de campos, opções e validações) ainda está em pt-BR no código.

- Evento sem histórico e sem pedido pago continua no estado sem vendas; não tem meta (meta só existe no histórico da seed).
- O histórico da seed termina sempre ontem (acompanha o relógio); pedidos reais entram no dia em que foram pagos.
- Status encerrado mostra no link de compra "Publique ou deixe o evento privado…", mas encerrado não pode mais mudar de status.
- Rascunho pode ir direto para encerrado; não há regra que impeça.
- Excluir evento não existe (a opção saiu do menu, EVT-08): falta a regra de quem pode excluir o quê. Editar só leva a uma tela de leitura: nome, data, local e capa não são editáveis.
- Visão geral não tem item de menu, e `activeSection="visao-geral"` não existe no tipo `BackstageSection` de `components/Backstage.tsx`.
- `alertas()` e `alertasPorEvento()` de `data/vendas.ts` não são usados por nenhuma tela.
- Marcos ficam só no `localStorage` do navegador, fora do banco compartilhado.
- O comentário em `pages/Eventos.tsx` diz que o status também muda pela listagem, mas a listagem não tem esse atalho.

- Criar evento: as listas (campeonatos, times, programas, moedas, políticas, acesso por face, mapas de assentos) são simuladas até existir o endpoint. Idade mínima usa as faixas da classificação indicativa (Livre, 10 a 18); confirmar se é a regra.
- Criar evento: o limite de 400 KB das imagens é do protótipo (o banco local guarda a imagem); o limite real depende do back-end.
- Criar evento: sair pelo menu lateral ou pelo voltar do navegador não pede confirmação (só Cancelar e "← Eventos").
- Criar evento: os campos novos (tipo, fim, moeda, limites, idade mínima, mapa, partida, avançadas) são gravados no banco, mas ainda não aparecem em Informações do evento, nem são aplicados no site, no checkout ou na bilheteria.

## Fontes

Nenhum link de Figma, Confluence ou Jira no código desta pasta. Campos e configurações de Criar evento: especificação enviada pelo Victor em 2026-11-07.
