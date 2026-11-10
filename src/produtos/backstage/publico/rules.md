# Público: regras

> **Rotas:** `/backstage/publico`, `/backstage/publico/formularios`, `/backstage/publico/solicitacoes`
> **No menu:** Backstage › rail da organização › Público (`ProducerRailItem` com `href`). Na barra superior da organização (`ORG_NAV`) o item Público existe, mas sem `href`.
> **Versão em uso:** versão única (`pages/Publico.tsx`, `pages/FormulariosParticipacao.tsx`, `pages/SolicitacoesParticipacao.tsx`)
> **Revisado em:** 2026-11-07

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

Área da organização para gerir o público. Hoje tem o formulário de participação: o produtor cria
um formulário por evento, controla o recebimento e o limite de pedidos, e analisa cada pedido
(dados pessoais, documento e laudo) para aprovar numa segmentação PNE ou reprovar com justificativa.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Formulários de participação | `data/formularios.ts` (array mutável em módulo) | só em memória; some ao recarregar |
| Pedidos de participação (12 pessoas) | `data/solicitacoes.ts` (mock local, dados fictícios) | decisão só no estado da página; some ao sair dela |
| Eventos para novo formulário (20) | `EVENTOS_DISPONIVEIS` em `components/SelecionarEventoModal.tsx` (mock local) | não |
| Segmentações (7 PNE) e justificativas (5) | `SEGMENTACOES` e `JUSTIFICATIVAS` em `components/DecisaoModal.tsx` | não |
| Anexos | imagem fixa `components/assets/documento-identificacao.png` e laudo em branco `components/LaudoView.tsx` | não |

Nada vem de `@/plataforma`. Os eventos do seletor não são os eventos do Backstage.

## Regras

### Público (landing)
- **PUB-01** Mostra dois cards: "Segmentações" e "Formulário de participação". _(pages/Publico.tsx)_
- **PUB-02** "Formulário de participação" leva a `/backstage/publico/formularios`. _(pages/Publico.tsx)_
- **PUB-03** "Segmentações" não tem destino: o clique não faz nada. _(pages/Publico.tsx)_

### Lista de formulários
- **PUB-10** Cada formulário mostra imagem, título, data, status e contagem de solicitações. _(pages/FormulariosParticipacao.tsx)_
- **PUB-11** Status "Inativo" quando o recebimento está desligado. _(pages/FormulariosParticipacao.tsx)_
- **PUB-12** Status "Pausado" quando o limite é "Limitado" e recebidas ≥ limite. _(pages/FormulariosParticipacao.tsx)_
- **PUB-13** Nos demais casos, status "Disponível". _(pages/FormulariosParticipacao.tsx)_
- **PUB-14** Com limite: "X de Y solicitações recebidas". Sem limite: "X solicitação(ões) recebida(s)", com singular para 1. _(pages/FormulariosParticipacao.tsx)_
- **PUB-15** Clicar num formulário abre `/backstage/publico/solicitacoes` com o id do formulário no estado da navegação. _(pages/FormulariosParticipacao.tsx)_
- **PUB-16** "Voltar" leva a `/backstage/publico`. _(pages/FormulariosParticipacao.tsx)_

### Novo formulário
- **PUB-20** "Novo formulário" abre o modal de seleção de evento, com busca por título (sem diferenciar maiúsculas). _(components/SelecionarEventoModal.tsx)_
- **PUB-21** Busca sem resultado mostra "Nenhum evento encontrado.". _(components/SelecionarEventoModal.tsx)_
- **PUB-22** "Continuar" fica desabilitado até escolher um evento. _(components/SelecionarEventoModal.tsx)_
- **PUB-23** Busca e seleção zeram a cada abertura do modal. _(components/SelecionarEventoModal.tsx)_
- **PUB-24** Depois do evento, abre o modal de configuração com recebimento ativo e limite "Ilimitado". _(pages/FormulariosParticipacao.tsx)_
- **PUB-25** Ao salvar, o formulário entra no fim da lista com título do evento, data futura aleatória (30 a 365 dias), imagem padrão e marcado como rascunho. _(pages/FormulariosParticipacao.tsx)_
- **PUB-26** O novo formulário já nasce com 12 solicitações recebidas (total do mock). _(pages/FormulariosParticipacao.tsx)_
- **PUB-27** Toast de sucesso: "Formulário criado!" / "O novo formulário já está disponível para o público.". _(pages/FormulariosParticipacao.tsx)_

### Configuração do formulário (recebimento e limite)
- **PUB-30** Toggle liga e desliga o recebimento; o texto muda entre "Recebimento ativo" e "Recebimento inativo". _(components/FormularioParticipacaoModal.tsx)_
- **PUB-31** Limite é "Ilimitado" ou "Limitado"; o campo de quantidade só aparece em "Limitado". _(components/FormularioParticipacaoModal.tsx)_
- **PUB-32** A quantidade aceita só dígitos e recebe máscara de milhar pt-BR. _(components/FormularioParticipacaoModal.tsx)_
- **PUB-33** "Limitado" sem quantidade: erro "Campo obrigatório" e não salva. _(components/FormularioParticipacaoModal.tsx)_
- **PUB-34** Quantidade menor que as solicitações já recebidas: erro "O limite deve ser maior ou igual a N, que é o total de solicitações já recebidas." e não salva. _(components/FormularioParticipacaoModal.tsx)_
- **PUB-35** Trocar a opção de limite ou digitar limpa o erro. _(components/FormularioParticipacaoModal.tsx)_
- **PUB-36** O modal reabre sempre com os valores salvos do formulário. _(components/FormularioParticipacaoModal.tsx)_
- **PUB-37** A engrenagem na tela de pedidos abre o mesmo modal; salvar atualiza o formulário e mostra o toast "Tudo certo!". _(pages/SolicitacoesParticipacao.tsx)_

### Pedidos de participação: lista
- **PUB-40** Cabeçalho mostra "Formulário de participação" e o título do formulário aberto. _(pages/SolicitacoesParticipacao.tsx)_
- **PUB-41** Abas "Pendente", "Aprovado" e "Reprovado"; cada uma lista só os pedidos daquele status. _(pages/SolicitacoesParticipacao.tsx)_
- **PUB-42** Cada aba mostra contador quando há pedidos; acima de 999 mostra "999+". Só a aba Pendente usa cor de aviso. _(pages/SolicitacoesParticipacao.tsx)_
- **PUB-43** Busca por nome ou e-mail, sem diferenciar maiúsculas, dentro da aba atual. _(pages/SolicitacoesParticipacao.tsx)_
- **PUB-44** Cada linha mostra nome, e-mail e data da solicitação (DD/MM/AAAA). _(pages/SolicitacoesParticipacao.tsx)_
- **PUB-45** Ao entrar, o primeiro pedido do mock já vem selecionado. _(pages/SolicitacoesParticipacao.tsx)_
- **PUB-46** "Voltar" leva a `/backstage/publico/formularios`. _(pages/SolicitacoesParticipacao.tsx)_

### Pedidos de participação: detalhe e dados pessoais
- **PUB-50** O detalhe mostra nome, status, e-mail e "Solicitado em / Aprovado em / Reprovado em" + data + "às 12:00". _(pages/SolicitacoesParticipacao.tsx)_
- **PUB-51** "Informações do participante" mostra sem máscara: Nome, CPF ou passaporte, E-mail, Data de nascimento, Telefone e Data do laudo. _(pages/SolicitacoesParticipacao.tsx)_
- **PUB-52** O CID existe no dado do pedido, mas não aparece na tela. _(data/solicitacoes.ts, pages/SolicitacoesParticipacao.tsx)_
- **PUB-53** "Anexos (2)": "Documento de identificação" (imagem) e "Laudo ou documento comprobatório" (laudo em branco). _(data/solicitacoes.ts, pages/SolicitacoesParticipacao.tsx)_
- **PUB-54** O cabeçalho dos anexos mostra "Os anexos serão excluídos 15 dias após a validação.". _(pages/SolicitacoesParticipacao.tsx)_
- **PUB-55** Clicar no anexo ou em "Expandir" abre o visualizador em tela cheia com nome, arquivo e tamanho. _(components/AnexoViewerModal.tsx)_
- **PUB-56** Zoom do visualizador vai de 50% a 200%, em passos de 25%, e volta a 100% a cada anexo aberto. _(components/AnexoViewerModal.tsx)_
- **PUB-57** Não há download nem impressão de anexo. _(components/AnexoViewerModal.tsx)_
- **PUB-58** Aprovado mostra "Adicionado em: {segmentação}"; reprovado mostra "Justificativa: {motivo}". _(pages/SolicitacoesParticipacao.tsx)_
- **PUB-59** Pedido decidido mostra no rodapé "Aprovado por" ou "Reprovado por" + e-mail fixo `thais.silva@vegasports.com.br` + data da solicitação às 12:00. _(pages/SolicitacoesParticipacao.tsx)_

### Decisão (aprovar ou reprovar)
- **PUB-60** "Rejeitar" e "Aprovar" só aparecem para pedido pendente. Decidido não volta a pendente. _(pages/SolicitacoesParticipacao.tsx)_
- **PUB-61** Aprovar abre "Selecione a segmentação em que a pessoa será incluída", com busca e 7 segmentações PNE. _(components/DecisaoModal.tsx)_
- **PUB-62** Busca de segmentação sem resultado mostra "Nenhuma segmentação encontrada.". _(components/DecisaoModal.tsx)_
- **PUB-63** "Aprovar solicitação" fica desabilitado até escolher uma segmentação. _(components/DecisaoModal.tsx)_
- **PUB-64** Rejeitar abre "Rejeitar solicitação" com 5 justificativas: Documentação ilegível, Documento inválido, Dados inconsistentes, Laudo insuficiente, Outro motivo. _(components/DecisaoModal.tsx)_
- **PUB-65** "Outro motivo" abre campo de texto livre com no máximo 60 caracteres. _(components/DecisaoModal.tsx)_
- **PUB-66** Ao bater 60 caracteres, o campo fica inválido e mostra por 2 s o tooltip "Você não pode inserir mais que 60 caracteres.". _(components/DecisaoModal.tsx)_
- **PUB-67** "Rejeitar solicitação" fica desabilitado sem justificativa, ou com "Outro motivo" e texto vazio. _(components/DecisaoModal.tsx)_
- **PUB-68** Os modais de decisão zeram seleção, busca e texto a cada abertura. _(components/DecisaoModal.tsx)_
- **PUB-69** Aprovar muda o status, grava a segmentação, troca para a aba Aprovado e mostra o toast "Pedido aprovado" / "{nome} foi adicionado(a) ao segmento {segmentação}.". _(pages/SolicitacoesParticipacao.tsx)_
- **PUB-70** Reprovar muda o status, grava o motivo, troca para a aba Reprovado e mostra o toast "Pedido reprovado" / "{nome} foi reprovado com o motivo: {motivo}.". _(pages/SolicitacoesParticipacao.tsx)_
- **PUB-71** Com "Outro motivo", o motivo gravado é o texto digitado (sem espaços nas pontas). _(components/DecisaoModal.tsx, pages/SolicitacoesParticipacao.tsx)_

### Estados
- **PUB-80** Ao abrir a tela de pedidos, spinner de 1,5 s antes do conteúdo. _(pages/SolicitacoesParticipacao.tsx)_
- **PUB-81** Trocar de pedido ou confirmar decisão mostra spinner de 1,5 s no detalhe. _(pages/SolicitacoesParticipacao.tsx)_
- **PUB-82** Aba vazia sem busca: "Não há pedidos pendentes", "Não há pedidos aprovados" ou "Não há pedidos reprovados". _(pages/SolicitacoesParticipacao.tsx)_
- **PUB-83** Busca sem resultado: "Pessoa não encontrada", "Verifique o nome ou e-mail inserido e tente novamente." e botão "Limpar busca". _(pages/SolicitacoesParticipacao.tsx)_
- **PUB-84** Sem pedido selecionado: "Selecione um pedido.". _(pages/SolicitacoesParticipacao.tsx)_
- **PUB-85** Toasts somem em 2 s. _(utils/toast.tsx, pages/FormulariosParticipacao.tsx)_

### Permissões
- Não tratadas. Qualquer pessoa no Backstage vê os dados pessoais e decide.

## Depende de / afeta

- **Depende de:** nada da plataforma. Segmentações e eventos são listas fixas.
- **Afeta:** nada fora desta área. Aprovação não cria membro em segmentação real, e não há envio de e-mail.

## Em aberto

- Todos os formulários mostram os mesmos 12 pedidos: o mock não separa pedidos por formulário ou evento.
- Decisões ficam só no estado da página. Sair e voltar devolve todos os pedidos a "Pendente".
- Formulários criados ou editados somem ao recarregar (array em memória).
- Novo formulário já nasce com 12 solicitações recebidas e exige limite ≥ 12, mesmo sem nenhum pedido real.
- Toast de criação diz "já está disponível para o público" mesmo se o recebimento for salvo desligado.
- O modal de evento diz que o evento "pode já ter sido selecionado", mas a lista não esconde eventos que já têm formulário.
- "Pausado" é só rótulo calculado: o recebimento não é desligado ao atingir o limite.
- Datas de aprovação e reprovação reusam a data da solicitação e "12:00" fixo; quem decidiu é um e-mail fixo, não o usuário logado.
- O modal de aprovação promete e-mail de confirmação, e o de reprovação diz que a justificativa vai ao comprador. Nenhum envio existe.
- "Os anexos serão excluídos 15 dias após a validação." é só texto: não há exclusão nem contagem de prazo.
- Dados sensíveis (CPF sem máscara, data do laudo, laudo médico) aparecem sem controle de acesso nem registro de quem viu.
- CID está no dado, mas não aparece no detalhe. `DadosCadastraisForm` (mostra CID) e `TermosPreview` existem e não são usados.
- O laudo exibido é um modelo em branco, igual para todos. O documento é a mesma imagem para todos.
- Abrir `/backstage/publico/solicitacoes` direto (sem vir da lista) deixa o título do formulário vazio e a engrenagem sem efeito.
- Card "Segmentações" e o item Público da barra superior (`ORG_NAV`) não navegam.
- Comentário do código fala em loading de 2 s; o tempo real é 1,5 s.

## Fontes

Nenhum link de Figma, Confluence ou Jira no código ou na pasta.
