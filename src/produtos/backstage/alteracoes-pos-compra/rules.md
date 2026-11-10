# Pedidos (alterações pós-compra): regras

> **Rotas:** `/backstage/pedidos`, `/backstage/pedidos/:pedidoId`, `/backstage/pedidos/:pedidoId/transferir`, `/backstage/pedidos/:pedidoId/trocar`, `/backstage/pedidos/:pedidoId/formulario`
> **No menu:** Backstage › barra da organização › Pedidos (sem contexto de evento)
> **Versão em uso:** única, pasta `alteracoes-pos-compra`
> **Revisado em:** 2026-11-07

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

A auditoria contra as três especificações funcionais (troca de item, troca de titularidade,
troca de perguntas) e as decisões da reunião de 14/10/2026 estão em [REGRAS.md](./REGRAS.md).
A auditoria mobile está em [MOBILE.md](./MOBILE.md). As duas são de 15/10/2026 e parte do que
apontam já mudou no código; vale o que está aqui.

## O que é

Tela do atendimento para achar um pedido e alterá-lo depois da compra: transferir unidades para
outra pessoa, trocar unidades por outros itens e editar as respostas do formulário. Cada
alteração gera uma cobrança com link e prazo, e só é aplicada quando o pagamento entra.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Pedidos, itens, histórico, solicitações | `data/pos-compra-store.ts` (mock local) | só em memória; recarregar volta à seed |
| Eventos, sessões, catálogo, estoque | `data/pos-compra-store.ts` (`EVENTOS`, `SESSOES`, `CATALOGO`) | estoque só em memória |
| Contas (compradores e destinatários) | `data/pos-compra-store.ts` (`CONTAS`, `CONTAS_EXTRA`) | não |
| Perguntas e formulários | `data/pos-compra-store.ts` (`PERGUNTAS`, `FORMULARIOS`) | estoque de opção só em memória |

Pedidos pagos do banco (`@/plataforma`) entram na lista com evento, sessões, catálogo e contas reais. Os eventos de demonstração (corridas, nomes com "(demonstração)") seguem no mock para exercitar formulário e segmentação.

## Regras

### Banco
- **PED-90** Todo pedido pago ou cancelado do banco (site, link, app, bilheteria, cortesia) aparece na lista; cada ingresso emitido vira uma linha. _(data/pos-compra-store.ts, `espelharBanco`)_
- **PED-91** Transferência de titularidade aplicada num pedido do banco muda o titular do ingresso no banco; a carteira do novo titular recebe. _(data/pos-compra-store.ts, `gravarTransferencias`)_
- **PED-92** A lista e o filtro de eventos mostram só pedidos de eventos da organização em contexto. Pedidos dos eventos de demonstração (fora do banco) aparecem em qualquer organização. _(pages/Pedidos.tsx)_

### Lista de pedidos
- **PED-01** Lista todos os pedidos da organização, sem contexto de evento. _(pages/Pedidos.tsx)_
- **PED-02** Busca por ID do pedido, nome do comprador ou nome do evento, sem diferenciar maiúsculas. _(pages/Pedidos.tsx)_
- **PED-03** Filtro por evento, com "Todos os eventos" como padrão. _(pages/Pedidos.tsx)_
- **PED-04** Busca, evento, página e itens por página ficam na URL; voltar do detalhe devolve a lista como estava. _(pages/Pedidos.tsx)_
- **PED-05** Mudar busca, evento ou itens por página volta para a página 1. _(pages/Pedidos.tsx)_
- **PED-06** Itens por página: 10, 25 (padrão), 50 ou 100. O seletor só aparece a partir de md. _(pages/Pedidos.tsx)_
- **PED-07** Colunas no desktop: Pedido (ID completo), Comprador (nome e e-mail), Evento, Total pago. No celular, cartão com nome, total, evento, nº de itens e ID curto (8 caracteres). _(pages/Pedidos.tsx)_
- **PED-08** "Total pago" na lista é a soma do valor pago das linhas. _(pages/Pedidos.tsx)_
- **PED-09** Faixa "N pedidos precisam de atenção agora" acima da lista: pedidos em falha e cobranças aguardando que expiram em até 15 minutos, ordenadas pelo menor prazo. Atualiza a cada 15 s e some quando não há nada. No celular nasce recolhida. _(components/FaixaAtencaoPedidos.tsx)_

### Detalhe do pedido
- **PED-10** Duas abas: Itens e Histórico. _(pages/DetalhePedido.tsx)_
- **PED-11** Itens agrupados em ingressos por sessão (ordem cronológica), Produtos e Combos. Em evento de esporte, "Ingressos" vira "Categorias" e "formulário" vira "ficha de inscrição". _(pages/DetalhePedido.tsx, data/pos-compra-store.ts)_
- **PED-12** Sessão que já começou mostra "Sessão realizada. Só a transferência continua disponível." _(pages/DetalhePedido.tsx)_
- **PED-13** Cada unidade é uma linha, com item, grupo/lote, valor pago, portador e, se houver, selo "Exclusivo feminino" ou "Exclusivo sócios". Combo abre "Detalhes" com os itens que contém. _(pages/DetalhePedido.tsx)_
- **PED-14** Pagamento: Itens, Taxa de serviço, Proteção do pedido e Total pago. "Itens sem desconto" e cupom só aparecem quando houve cupom com desconto. Pedido de cortesia ou de total zero mostra "Cortesia, sem valor pago". _(pages/DetalhePedido.tsx)_
- **PED-15** Botões "Transferir …" e "Trocar …" no cabeçalho aparecem só quando ao menos uma unidade aceita o verbo; o rótulo diz os tipos alcançados (ingressos, produtos, combos). _(pages/DetalhePedido.tsx)_
- **PED-16** "Editar formulário" fica na própria unidade e só aparece se o item tem formulário e a unidade está livre. _(pages/DetalhePedido.tsx)_
- **PED-17** Unidade com alteração aberta mostra o estado no lugar da ação: "Aguardando pagamento da … até HH:MM", "Pagamento registrado. Aplicando…", "… paga e não aplicada" ou "Reprovada na revalidação…". _(pages/DetalhePedido.tsx)_
- **PED-18** Seção "Alterações em andamento (N)" lista um cartão por solicitação aberta, com contador de prazo, "Copiar link", "Reenviar" e "Mais ações" (Registrar pagamento recebido, Cancelar alteração). _(pages/DetalhePedido.tsx, components/CartaoOperacao.tsx)_
- **PED-19** Histórico agrupa as entradas por alteração, mais recente primeiro, e a compra fica por último. Mostra 10 alterações e "Mostrar mais N alterações". Sem alterações: "Nenhuma alteração registrada no Backstage desde a compra." _(pages/DetalhePedido.tsx)_
- **PED-20** Toda entrada do histórico grava autor; o operador é fixo, "Renata Lopes". _(data/pos-compra-store.ts)_

### Disponibilidade da unidade
- **PED-21** Uma unidade presa em solicitação aguardando, processando ou em falha não entra em outra alteração. Reprovada libera a unidade. _(data/pos-compra-store.ts)_
- **PED-22** Troca: bloqueada quando a sessão da unidade já começou ("Sessão realizada"). Transferir e editar formulário continuam liberados. _(data/pos-compra-store.ts)_
- **PED-23** Editar formulário: bloqueado quando o item não tem formulário ("Sem formulário"). _(data/pos-compra-store.ts)_
- **PED-24** Ter recebido a unidade por transferência não bloqueia nenhuma ação. _(data/pos-compra-store.ts)_

### Transferir
- **PED-30** Etapas: Destinatário, Itens, Formulário (só se alguma unidade tem formulário) e Revisão. _(components/wizard/TransferirTitularidadeWizard.tsx)_
- **PED-31** Busca de conta com resultado simulado em 1 a 2 s; sem resultado: "Nenhuma conta encontrada para “termo”". _(components/wizard/TransferirTitularidadeWizard.tsx)_
- **PED-32** Um destinatário por solicitação, com várias unidades. _(components/wizard/TransferirTitularidadeWizard.tsx)_
- **PED-33** Bloqueia a unidade quando a conta já é a titular, quando o item é nominal e a conta já tem ou vai receber uma unidade do mesmo item, ou quando o item é exclusivo feminino ou de sócios e a conta não atende. _(data/pos-compra-store.ts)_
- **PED-34** Ingresso é nominal por padrão; produto e combo não, salvo configuração do item. _(data/pos-compra-store.ts)_
- **PED-35** Taxa da transferência: R$ 15,00 por unidade. Mudar resposta que já existia soma R$ 10,00 de taxa de edição; completar resposta em branco não cobra. _(data/pos-compra-store.ts)_
- **PED-36** O link vai para o e-mail do novo titular, que é quem paga. _(components/wizard/TransferirTitularidadeWizard.tsx, components/CartaoOperacao.tsx)_

### Trocar
- **PED-40** Etapas: Saem, Entram, Formulários (se algum item que entra tem formulário) e Revisão. _(components/wizard/TrocarItensWizard.tsx)_
- **PED-41** A quantidade que entra precisa ser igual à que sai, e a seleção não pode ser idêntica à atual. O rodapé diz o que falta ("Escolha mais N", "Tire N…", "Escolha ao menos um diferente do atual"). _(components/wizard/TrocarItensWizard.tsx)_
- **PED-42** Item de destino bloqueado com selo: "Item atual", "Já vinculado" (nominal), "Esgotado", "Sessão encerrada" ou "Restrito" (feminino/sócio). Item esgotado aparece na lista, não selecionável. _(data/pos-compra-store.ts, components/wizard/TrocarItensWizard.tsx)_
- **PED-43** Pareamento: unidades que saem e itens que entram são ordenados do menor para o maior valor e casados nessa ordem. _(data/pos-compra-store.ts)_
- **PED-44** Total = máx(0, Σ(preço integral do novo − valor pago) + Σ máx(0, taxa do novo − taxa paga) + R$ 20,00 da troca [+ R$ 10,00 se mudou resposta existente]). Taxa de serviço padrão 10%, o item pode ter a sua. _(data/pos-compra-store.ts)_
- **PED-45** A cobrança da troca (R$ 20,00) é uma por operação: R$ 15,00 produtor e R$ 5,00 Ingresse. _(data/pos-compra-store.ts)_
- **PED-46** Downgrade com sobra: a sobra não volta e a revisão exige o aceite "Confirmo, em nome do comprador, que R$ X não serão devolvidos"; o aceite vai para a nota do motivo. _(components/wizard/TrocarItensWizard.tsx)_
- **PED-47** No formulário do item novo, pergunta igual herda a resposta; pergunta nova vem em branco e é obrigatória antes da revisão. _(components/wizard/TrocarItensWizard.tsx)_
- **PED-48** O estoque do item de destino é reservado (−1) quando a cobrança é criada e devolvido se ela expira, é cancelada ou reprovada. _(data/pos-compra-store.ts)_
- **PED-49** O link vai para o e-mail do comprador. _(components/wizard/TrocarItensWizard.tsx, components/CartaoOperacao.tsx)_

### Editar formulário
- **PED-50** Uma unidade por vez. Etapas: Respostas e Revisão; só avança com ao menos uma resposta alterada. _(components/wizard/editar-formulario-wizard.tsx)_
- **PED-51** Opção esgotada de pergunta com estoque fica desabilitada, salvo se já é a resposta atual. _(components/respostas-ui.tsx)_
- **PED-52** Cobrança: R$ 10,00 por operação, independente de quantas respostas mudam. Link para o e-mail do comprador. _(data/pos-compra-store.ts, components/wizard/editar-formulario-wizard.tsx)_
- **PED-53** Link sem `?linhas=` abre a escolha da unidade antes do formulário. _(pages/AlterarPedido.tsx)_

### Validações comuns aos fluxos
- **PED-60** Motivo obrigatório na revisão: número do chamado e categoria (Pedido do cliente, Erro de cadastro, Erro do operador, Outro). Nenhuma categoria vem marcada. Em "Outro" a descrição é obrigatória. _(data/pos-compra-store.ts, components/pos-compra-ui.tsx)_
- **PED-61** Sair do fluxo com algo montado pergunta "Sair e descartar esta alteração?"; recarregar dispara o aviso do navegador. Não há rascunho. _(components/wizard/WizardShell.tsx, pages/AlterarPedido.tsx)_
- **PED-62** Se outra alteração pegou a unidade enquanto o fluxo estava aberto, o envio falha com toast e nada é criado. _(data/pos-compra-store.ts, components/wizard/*)_
- **PED-63** Total zero não gera link nem prazo: a alteração é aplicada na hora e o histórico registra "… sem cobrança". _(data/pos-compra-store.ts)_
- **PED-64** Reenviar link: só e-mail, começa no último destino usado, valida o formato ("Confira o e-mail.") e não reinicia o prazo. _(components/CartaoOperacao.tsx)_
- **PED-65** Registrar pagamento recebido exige referência com no mínimo 4 caracteres e não pode ser desfeito. _(components/CartaoOperacao.tsx)_

### Estados da solicitação
- **PED-70** Aguardando: prazo exibido como "15 minutos", mas expira em 60 s de relógio (acelerado para demo). Ao expirar, libera reservas e o pedido fica "Alteração expirada". _(data/pos-compra-store.ts, components/CartaoOperacao.tsx)_
- **PED-71** Processando: depois de registrar o pagamento, as regras são revalidadas em ~1,4 s. Passou: aplica, devolve o estoque da origem e o pedido vira "Já alterados". _(data/pos-compra-store.ts)_
- **PED-72** Reprovada: a revalidação falhou; o histórico registra estorno integral e nada muda no pedido. _(data/pos-compra-store.ts)_
- **PED-73** Cancelar: "O link para de funcionar, a reserva é liberada e nada é cobrado." _(components/CartaoOperacao.tsx)_
- **PED-74** Status do pedido é derivado: falha > processando > aguardando ("Alteração em andamento") > status de base ("Sem alterações" ou "Já alterados"). Entrar num fluxo de pedido expirado volta o pedido ao status de base. _(data/pos-compra-store.ts, pages/AlterarPedido.tsx)_
- **PED-75** Pedido inexistente na URL: "Pedido não encontrado." com "Voltar para pedidos". _(pages/DetalhePedido.tsx, pages/AlterarPedido.tsx)_
- **PED-76** Lista sem resultado: "Nenhum pedido encontrado. Revise a busca ou volte o filtro para todos os eventos." _(pages/Pedidos.tsx)_

## Depende de / afeta

- **Depende de:** catálogo, sessões e formulários do evento; contas de usuário; finance (valores de cobrança, hoje constantes).
- **Afeta:** carteira do comprador e do novo titular (titularidade, item e respostas), estoque de itens e de opções de resposta, relatórios de transferência.

## Em aberto

- Pedidos do banco: transferência de titularidade aplicada grava no banco; troca de item e edição de respostas ainda ficam só em memória. Pedido do banco já na tela não é atualizado por mudanças posteriores no banco.
- Solicitação reprovada fica em `pedido.solicitacoes` para sempre: o status do pedido continua "Alteração em andamento" e o cartão continua em "Alterações em andamento". _(data/pos-compra-store.ts, `comStatus`)_
- Nenhum fluxo gera solicitação em "falha", então a faixa de atenção e o status "Falha na alteração" nunca aparecem por uso. Não há ação de reprocessar; o cartão só diz "Será reprocessada". O histórico semente ainda tem "Troca paga e não aplicada" e "Financeiro notificado", de um estado que saiu do código.
- Valor pago da linha após a troca é `máx(valor pago, preço integral do novo)`, mas o comentário diz "o da compra mais a diferença paga agora". Em downgrade a linha mantém o valor antigo como crédito para a próxima troca. _(data/pos-compra-store.ts, `aplicarSolicitacao`)_
- Taxa da transferência multiplicada por unidade (R$ 15 × N); as EFs falam em cobrança por operação. Ver REGRAS.md, item 2.
- Reserva do destino na criação da cobrança; a reunião de 14/10 decidiu reserva de ~5 min a partir do clique no link.
- "Registrar pagamento recebido" efetiva sem confirmação real; a reunião decidiu que é controle só do protótipo e deve parecer fora do design. Hoje está no menu "Mais ações" com visual normal.
- Sessão realizada só bloqueia a troca; as EFs mandam bloquear transferência e edição em evento encerrado.
- Mensagem "Todas as unidades estão em outra alteração ou com outro titular" cita titular, mas ter outro titular não bloqueia transferência.
- Item esgotado ou restrito aparece bloqueado no catálogo de destino; a EF manda não listar (esgotado) ou listar e barrar só na efetivação (segmentação).
- Nominalidade checa só o mesmo item dentro do pedido; a EF fala em um item de acesso por sessão.
- Nenhuma permissão por perfil: qualquer operador faz tudo, inclusive registrar pagamento.
- Tudo em memória: recarregar a página perde as alterações.
- Lista não tem coluna nem filtro de status, embora o código mencione "filtro de situação".

## Fontes

- [EF Troca de item](https://ingresse-team.atlassian.net/wiki/spaces/TS/pages/575995905)
- [EF Troca de titularidade](https://ingresse-team.atlassian.net/wiki/spaces/TS/pages/576978948)
- [EF Troca de perguntas do formulário](https://ingresse-team.atlassian.net/wiki/spaces/TS/pages/575635517)
- Reunião "Gestão de pedidos", 14/10/2026 (resumo em REGRAS.md)
