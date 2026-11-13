# Freepass (painel do Backstage para quem vende): regras

> **Rotas:** `/freepass` (início da visualização), `/freepass/eventos`, `/freepass/vendas`, `/freepass/cortesias/eventos`, `/freepass/bilheteria/eventos`, `/freepass/recebimentos`, `/freepass/evento/vendas`; cortesia e bilheteria com as telas do Backstage em `/freepass/cortesias`, `/freepass/itens`, `/freepass/destinatarios`, `/freepass/verificacao`, `/freepass/bilheteria` (`/freepass/comissarios/*` e `/freepass/distribuicao-cortesias/*` redirecionam para Eventos)
> **No menu:** card Freepass na seleção de produtos
> **Versão em uso:** única (`freepass/`)
> **Revisado em:** 2026-11-11

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

O Freepass é o Backstage com acessos e funcionalidades a menos (BKS-60 a BKS-65 em
`../rules.md`). Quem vende para uma produtora (comissário, promoter, atlética) não é membro da
organização: entra com o e-mail e vê, de todas as organizações que o liberaram, os eventos, o
link de cada um, quanto ganha por ingresso, as vendas e o que tem a receber. Envia cortesias e
vende na bilheteria pelas mesmas telas do Backstage, dentro do que a produtora liberou. O lado
da produtora está em `../comissarios/rules.md`.

Substitui o Freepass antigo (cabeçalho próprio e envio de cortesia próprio, com pack de
cortesias, reenvio e resgate), removido em 2026-11-11.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Eventos e organizações | `@/plataforma` (`useColecao`) | não |
| Comissários, grupos de Equipe e Comissários, vendas atribuídas, repasses | `@/plataforma/comissarios` e `@/plataforma/equipe` (o mesmo store do Backstage) | sim: cortesias emitidas pelo Freepass |
| Cortesias e vendas na bilheteria | `@/plataforma`, pelas telas do Backstage | sim, no banco |
| Quem está logado | `data/usuario.ts` (`USUARIO`: Vitor Almeida, vitor.almeida@email.com) | não |
| Visualização (por evento ou por funcionalidade) | `localStorage` `freepass-visualizacao` (`data/funcoes.ts`) | sim, no navegador |

## Regras

### Funcionalidades e visualizações
- **FCO-80** ~~Funcionalidades pelo vínculo e pelos grupos da Equipe de operação (COM-70).~~ substituída por FCO-87.
- **FCO-87** Cada evento libera funcionalidades pelo store único de Equipe e Comissários (ECO-80): Minhas vendas pelo Link de venda do grupo do comissário ou por vendas já feitas (fica mesmo pausado, pelo histórico); Cortesias e Bilheteria pelos canais ligados do grupo dele e dos outros grupos ativos em que a pessoa está ligada (PDV não conta). Pausado é a pausa da organização ou nenhum canal ligado. A cota de cortesia é a do canal Cortesia desses grupos, menos o uso. _(data/funcoes.ts, data/minhas-vendas.ts)_
- **FCO-81** Quem não vende pelo link não vê dinheiro: sem resumo de vendas, sem Recebimentos. _(pages/eventos.tsx, ../components/Backstage.tsx)_
- **FCO-82** O cartão do evento mostra o que importa para o que a pessoa faz ali: vendido e a receber (vendas) ou cortesias enviadas e quanto ainda pode enviar (cortesia). Na visão por evento, lista as funcionalidades do evento como rótulos. _(pages/eventos.tsx)_
- **FCO-84** Visualização por evento (padrão, como o Backstage): menu com Eventos (e Recebimentos); abrir um evento leva à primeira funcionalidade dele, e o menu do evento mostra as outras. _(pages/eventos.tsx, ../components/Backstage.tsx)_
- **FCO-85** Visualização por funcionalidade: menu com uma entrada por funcionalidade que a pessoa tem (Minhas vendas, Cortesias, Bilheteria) e Recebimentos. Cada uma lista só os eventos dela; abrir leva direto à tela, sem menu do evento. Acima da tela, o evento atual com a troca para os outros eventos da mesma funcionalidade. _(pages/eventos.tsx, ../components/Backstage.tsx)_
- **FCO-86** A engrenagem no canto superior direito alterna as duas visualizações (protótipo, para comparar). Numa tela de evento, fica nela; numa lista, vai para o início da outra visualização. No celular, fica na barra do topo. _(../components/Backstage.tsx)_

### Eventos (início da visão por evento)
- **FCO-01** O Freepass usa a shell do Backstage, com a pessoa logada no lugar da organização e sem troca de organização (BKS-62, BKS-63). _(../components/Backstage.tsx)_
- **FCO-02** Para quem vende pelo link, o resumo (componente de métricas do DS) responde primeiro quanto falta receber (o maior número), com o já recebido e o atalho para Recebimentos; depois vendido, comissão gerada (com o estornado) e cortesias enviadas. _(pages/eventos.tsx)_
- **FCO-03** Eventos em três abas: Todos (padrão; os que vêm aí e depois os que já passaram), Vem aí e Já passou. Cada aba mostra a contagem num badge, inclusive quando é 0. Já passou segue o status Encerrado do evento. _(pages/eventos.tsx, data/minhas-vendas.ts)_
- **FCO-04** Cada cartão mostra organizador, nome, data e local, os números de FCO-82 e, para quem vende pelo link, o botão Copiar link, que copia sem abrir o evento. O resto do cartão abre o evento e põe a organização e o evento em contexto. _(pages/eventos.tsx)_
- **FCO-05** Cartão pausado mostra "Pausado pelo organizador" e não tem Copiar link; evento encerrado mostra "Vendas encerradas". _(pages/eventos.tsx)_
- **FCO-06** O subtítulo diz de quantos organizadores são os eventos, quando são mais de um. _(pages/eventos.tsx)_
- **FCO-07** O resumo de cima (FCO-02) soma só os eventos da aba escolhida. Ele fica na tela mesmo se a aba não tiver venda pelo link (aí os valores ficam zerados), para a tela não pular ao trocar de aba. _(pages/eventos.tsx)_

### Evento (menu do evento)
- **FCO-62** Na visão por evento, o menu do evento tem Minhas vendas (com link de venda) e, em Emissão de ingressos, só os canais liberados para a pessoa no evento: Cortesia e Bilheteria online. Pausado, só Minhas vendas. O card do evento mostra o status como selo, sem trocar. _(../components/Backstage.tsx)_

### Minhas vendas no evento (`/freepass/evento/vendas`)
- **FCO-10** O link de venda fica no topo, com Copiar e Compartilhar (o compartilhar nativo do aparelho; sem suporte, só Copiar). Embaixo, o cupom para digitar no pagamento e a regra do último link. A tela ocupa toda a largura do conteúdo. _(pages/vendas-no-evento.tsx)_
- **FCO-11** O texto do link diz o desconto de quem compra por ele, quando há. _(pages/vendas-no-evento.tsx)_
- **FCO-12** Sem o canal Link de venda, o topo diz por quais canais ele vende aqui. Pausado: "Vendas pausadas", com o que muda e para falar com o organizador. Encerrado: "Vendas encerradas". _(pages/vendas-no-evento.tsx)_
- **FCO-13** Resultado no evento: a receber (com já recebido), vendido, comissão gerada e cortesias ("X de Y" com cota). _(pages/vendas-no-evento.tsx)_
- **FCO-14** Quanto você ganha: a regra da comissão e, para cada ingresso que ele pode vender, o preço com o código (com desconto ou com o valor a mais) e quanto ganha por ingresso. Com valor a mais, o texto do link diz que o ingresso sai mais caro por ele e que a diferença é dele. _(pages/vendas-no-evento.tsx, utils/formato.ts)_
- **FCO-15** Vendas, da mais nova para a mais antiga, com filtro por canal quando há mais de um: ingresso, quem comprou (nome curto, "Ana R."), canal, data e a comissão de cada pedido. Mostra 15 por vez. _(pages/vendas-no-evento.tsx)_
- **FCO-16** Pedido cancelado aparece como "Cancelado", com a comissão estornada; cortesia aparece sem comissão. _(pages/vendas-no-evento.tsx)_
- **FCO-17** Com o canal cortesia liberado, evento à venda e sem pausa, o resultado tem o atalho "Enviar cortesias". _(pages/vendas-no-evento.tsx)_
- **FCO-18** O link e o cupom do topo são os da pessoa: o vendedor vê o próprio código; o responsável, o código do grupo (ECO-27). O subtítulo diz "por <grupo>, seu código <X>" quando o grupo tem mais de uma pessoa. O cartão do evento copia o link da pessoa. _(pages/vendas-no-evento.tsx, pages/eventos.tsx, data/minhas-vendas.ts)_

### Cortesia e bilheteria
- **FCO-70** Cortesia e Bilheteria online são as telas do Backstage, sem mudança de fluxo (COR-*, regras da bilheteria). _(../cortesias/, ../bilheteria/)_
- **FCO-71** Na cortesia, a pessoa vê só o que emitiu e não passa da cota que a produtora deu no evento (COR-93, COR-94). _(../cortesias/)_
- **FCO-72** Cortesia emitida pelo Freepass entra nas vendas do comissário como cortesia, sem comissão, e soma no uso do canal Cortesia do grupo dele quando o item está no canal (ECO-81). _(@/plataforma/comissarios, `registrarCortesias`)_

### Recebimentos
- **FCO-30** A receber, já recebido e comissão gerada somando todos os organizadores. A tela ocupa toda a largura do conteúdo. _(pages/recebimentos.tsx)_
- **FCO-31** Por organizador: a receber e já recebido, com os eventos que ainda têm saldo (cada um abre Minhas vendas do evento). _(pages/recebimentos.tsx)_
- **FCO-32** Pagamentos recebidos: evento, organizador, data e observação que o organizador registrou. _(pages/recebimentos.tsx)_
- **FCO-33** A tela diz que o pagamento é combinado com o organizador, fora da Ingresse, e que divergência se resolve com ele. _(pages/recebimentos.tsx)_

### Permissões
- **FCO-60** Responsável vê tudo do comissário, o a receber e os recebimentos. Vendedor vê só as vendas que fez e a comissão delas; Recebimentos diz que o pagamento vai para o responsável. _(data/minhas-vendas.ts, pages/*.tsx)_
- **FCO-61** O comissário nunca vê o nome completo nem o contato de quem comprou. _(data/minhas-vendas.ts)_

### Estados
- **FCO-40** Sem nenhum evento: "Você ainda não tem acesso a nenhum evento" (ou "Nenhum evento em <funcionalidade>"), explicando que o evento aparece quando um organizador liberar. _(pages/eventos.tsx)_
- **FCO-41** Aba sem eventos: mensagem própria de cada aba. Evento sem vendas: "Nenhuma venda ainda. Compartilhe seu link para começar." Filtro sem vendas: "Nenhuma venda neste canal." _(pages/eventos.tsx, pages/vendas-no-evento.tsx)_
- **FCO-42** Evento em contexto em que ele não está (removido pelo organizador): "Você não vende este evento", com o botão para os eventos dele. _(pages/vendas-no-evento.tsx)_
- **FCO-43** Carregando: esqueleto. _(pages/*.tsx)_

## Depende de / afeta

- **Depende de:** cadastro e configuração do comissário no Backstage (`../comissarios/rules.md`); telas de cortesia e bilheteria do Backstage.
- **Afeta:** cortesias e vendas na bilheteria vão para o banco, como no Backstage; cortesias entram nas vendas do comissário.

## Em aberto

- Login e convite: o comissário entra com o e-mail (código por e-mail, como nas Propostas 2 e 3)? O convite sai do cadastro no Backstage, mas a tela de entrada não existe.
- "Já passou" segue o status Encerrado, não a data: as datas da seed estão no passado e o Backstage segue vendendo esses eventos.
- Abrir um evento troca a organização em contexto do navegador (a mesma do Backstage).
- Cortesia e bilheteria abertas por endereço direto num evento que não é dele não bloqueiam: o menu esconde, a tela não.
- Venda na bilheteria pelo Freepass não é atribuída ao comissário, e a tela de bilheteria mostra todos os pedidos do evento, não só os dele; cancelar cortesia não devolve a cota.
- Quem só emite (cortesia, bilheteria) é cadastrado na produtora como comissário sem link de venda. Falta decidir se vira um cadastro próprio ("emissor").
- Qual das duas visualizações segue: por evento ou por funcionalidade.
- O Freepass antigo tinha resgatar cortesias para si e reenviar com histórico; no fluxo do Backstage não existem.
- Quem é responsável e quem é vendedor no mesmo grupo vê a mesma tela, com dados diferentes; não há tela para o responsável gerenciar os vendedores.
- Mostrar o nome curto de quem comprou é proposta (dado pessoal do comprador): validar com jurídico.
- Exportar as vendas (planilha) não existe.

## Fontes

As mesmas de `../comissarios/rules.md`, principalmente a reunião de 09/11/2026 (dashboard do próprio comissário com todos os eventos, quanto vendeu e quanto tem a receber), o MKT-262 e as Propostas 2 e 3 (comissário fora da organização, portal próprio). Decisão de 11/11/2026 (Victor): o Freepass é um painel do Backstage com acessos e funcionalidades removidas, que reaproveita a shell e os fluxos, como o envio de cortesia.
