# Regras da aba de pedidos: o que vem da especificação e o que nós criamos

Levantamento feito em 15/10/2026 contra as três especificações funcionais, todas revisadas
em 08–09/10/2026 e marcadas PRONTO PARA REFINAMENTO:

- [EF Troca de item](https://ingresse-team.atlassian.net/wiki/spaces/TS/pages/575995905)
- [EF Troca de titularidade](https://ingresse-team.atlassian.net/wiki/spaces/TS/pages/576978948)
- [EF Troca de perguntas do formulário](https://ingresse-team.atlassian.net/wiki/spaces/TS/pages/575635517)

Pendências sem resposta nas EFs foram conferidas contra a transcrição da reunião
**Gestão de pedidos, 14/10/2026** (Victor, Diego, Viviane).

## Recorte

Só entra aqui regra que **a aba de pedidos executa ou mostra**. Regra que mora em outra
funcionalidade foi lida e deixada de fora do placar, porque não é nossa para implementar nem
para corrigir:

| Fora | Dono |
| --- | --- |
| Estoque de resposta: validação, reserva, devolução | Formulário |
| Valor da cobrança e divisão produtor/Ingresse | Finance |
| Período, limites e disponibilidade da transferência | Transferência paga, configurada no item |
| Item marcado como não transferível | Configuração de ingresso |
| Alterar resposta pela carteira (EF-06/10) | Carteira |
| E-mails, relatórios, integrações, repasse, facial, QR | Notificações / Dados / Access |
| Quem tem permissão de quê | Permissionamento |

## Placar

| Especificação | Regras lidas | No nosso escopo | Conforme | Divergente | Ausente |
| --- | ---: | ---: | ---: | ---: | ---: |
| Troca de item | 204 | 114 | 52 | 29 | 33 |
| Troca de titularidade | 167 | 73 | 37 | 25 | 11 |
| Troca de perguntas do formulário | 171 | 89 | 51 | 20 | 18 |
| **Total** | **542** | **276** | **140** | **74** | **62** |

"Ausente" quase sempre quer dizer que o protótipo ainda não chegou lá, não que esteja errado:
é um protótipo de design, não o produto.

## Regras que nós criamos

Comportamento do protótipo que decide o que pode, quanto custa ou quando muda, e que **não
vem de nenhuma das três especificações**. Esta é a lista que o segundo commit ataca.

### 1. A troca para um item só é permitida se a sessão de destino começar em mais de 24 horas; dentro desse prazo o item aparece bloqueado com "Prazo de troca encerrado".

- **Onde:** src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:38 (PRAZO_TROCA_HORAS = 24), :1602-1604 (dentroDoPrazoDeTroca), :1668-1673 (bloqueio em validarTrocaItem)
- **Contraria:** §6.3 disponibilidade (troca de item): as condições são pedido pago, evento não encerrado e abertura Pós-venda vigente. Nenhuma das três EFs prevê antecedência mínima; o período é governado pela abertura Pós-venda, que o protótipo não tem.
- **Risco:** Recusa trocas legítimas na véspera e no dia (justamente o pico de atendimento) e cria um prazo paralelo que o produtor não configurou e não consegue desligar. Substitui, de fato, a abertura Pós-venda por um número fixo escondido no código.

### 2. A cobrança da troca de titularidade é multiplicada pelo número de unidades transferidas (R$ 15,00 × quantidade).

- **Onde:** src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1540 (arredondar(quantidade * COBRANCA_TITULARIDADE)); components/wizard/TransferirTitularidadeWizard.tsx:150
- **Contraria:** 576978948 §6 e H-01/H-24: o valor segue a configuração da transferência paga, e a mecânica de cobrança das EFs é "uma vez por operação" (575995905 §10.1, 575635517 §9.1). Nenhum documento autoriza multiplicar por unidade.
- **Risco:** Cobra valores que o finance não configurou. Uma assessoria transferindo 40 inscrições recebe uma cobrança de R$ 600,00 que nenhuma regra documentada sustenta, e a diferença entre "por operação" e "por unidade" é dinheiro real repassado a produtor e Ingresse.

### 3. Os três fluxos operam em lote: o operador seleciona N unidades do pedido e uma única solicitação troca, transfere ou altera todas de uma vez (inclusive com atalho "Incluir as outras N unidades").

- **Onde:** src/produtos/backstage/alteracoes-pos-compra/components/wizard/seletor-unidades.tsx:94-105 (seleção por quantidade) e :243-247 (incluir irmãs); components/wizard/TrocarItensWizard.tsx:191-192
- **Contraria:** 576978948 §18: "Fora do escopo do MVP: troca de vários itens em uma única solicitação (troca em lote para Grupos)". As EFs modelam a solicitação como sendo de UM item (unicidade por item, §12.1/§11.1).
- **Risco:** Toda a modelagem de solicitação, cobrança, reserva e histórico do protótipo pressupõe lote. Se o MVP sair 1 a 1, a tela inteira (seleção, pareamento, resumo, cartão da operação) precisa ser refeita; se sair em lote, decisões financeiras (cobrança por operação ou por unidade) e de atomicidade estão sendo tomadas sem documento.

### 4. Quando há N itens saindo e N entrando, o protótipo pareia linhas e destinos ordenados por valor, do menor para o maior, explicitamente para produzir o menor total possível.

- **Onde:** src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1465-1471 (parearTroca); components/wizard/TrocarItensWizard.tsx:191
- **Contraria:** Nenhuma EF trata troca N para N, portanto não define pareamento. A regra inventada decide quanto o cliente paga: com piso zero por par, a ordem do pareamento muda o total.
- **Risco:** O sistema escolhe sozinho, em favor do cliente, qual item antigo vira qual item novo, e com isso define a diferença cobrada e quanto crédito de downgrade fica com a Ingresse. É uma decisão financeira automática sem dono e sem documento.

### 5. A troca só avança se a quantidade de itens que entram for exatamente igual à quantidade que sai, e se a seleção inteira não for idêntica à atual.

- **Onde:** src/produtos/backstage/alteracoes-pos-compra/components/wizard/TrocarItensWizard.tsx:247 (totalEntram === totalSaem && !selecaoIgual)
- **Contraria:** Decorre do lote inventado. As EFs só exigem que o destino seja diferente do item atual (V07, §7.1), unidade a unidade; não existe regra de paridade de quantidade.
- **Risco:** Impede trocar 2 ingressos por 1 combo (caso previsto pela matriz §5, que admite combo como destino) e, ao checar "seleção igual" só no conjunto, deixa passar uma troca em que uma das unidades vai para o mesmo item dela (V07 escapa por unidade).

### 6. Em "Mais ações" o operador pode "Registrar pagamento recebido": digita uma referência de comprovante (mínimo 4 caracteres) e a solicitação vai para processando e é efetivada, sem nenhuma confirmação de pagamento real.

- **Onde:** src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:2076-2135 (registrarPagamento); components/CartaoOperacao.tsx:300-345 (ModalRegistrarPagamento)
- **Contraria:** 575995905 §12.1/§12.2 e §16 B6: a efetivação é disparada pela confirmação do pagamento do link/checkout. Nenhuma das três EFs prevê confirmação manual de pagamento pelo Backstage; o painel só tem Cancelar e Reprocessar (§17).
- **Risco:** Dá ao atendimento o poder de efetivar troca, transferência e alteração de respostas sem dinheiro recebido, com um campo de texto livre como única evidência. É fraude a um clique e sem reversão (o próprio modal avisa que não dá para desfazer). O protótipo até criou um cenário de escalonamento chamado "pagamento registrado por engano", o que mostra que o buraco é conhecido.

### 7. Quando a revalidação pós-pagamento reprova, nada é revertido: a solicitação fica em "falha" (paga e não aplicada), as unidades seguem bloqueadas e a única saída é "Notificar financeiro", que move a solicitação para o estado "aguardando-financeiro", somente leitura.

- **Onde:** src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:254 (estado aguardando-financeiro), :2106-2131 (falha sem reversão), :2210-2232 (notificarFinanceiro); components/CartaoOperacao.tsx:388-436
- **Contraria:** H-06 e §12.1 REPROVADA (nas três EFs): pagamento confirmado com revalidação reprovada gera estorno integral automático e estado final REPROVADA. O documento também separa FALHA DE PROCESSAMENTO (erro técnico, com Reprocessar restrito ao Admin Ingresse, §17) de REPROVADA (regra de negócio), e o protótipo funde as duas e não tem Reprocessar.
- **Risco:** Inventa um estado terminal fora da máquina de estados documentada e troca um estorno automático por um processo manual fora do sistema. O cliente fica pago e sem o item por tempo indeterminado, e as unidades ficam travadas para qualquer outra operação enquanto isso.

### 8. O link de pagamento pode ser enviado e reenviado por WhatsApp, com escolha de canal e número de destino.

- **Onde:** src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:60 (CanalEnvio) e :1828 (canalLabel); components/wizard/EtapaEnvio.tsx:48; components/CartaoOperacao.tsx:273
- **Contraria:** 575995905 §25: "Envio automático do link por WhatsApp está fora do escopo (o operador pode copiar e colar o link)". §15 define e-mail como canal das notificações.
- **Risco:** Promete um canal que o MVP não vai ter e que depende de integração e de consentimento. O histórico grava "enviado por WhatsApp para <número>" como se o disparo tivesse acontecido, criando prova falsa de notificação num fluxo que envolve dinheiro.

### 9. Na troca de titularidade a cobrança é endereçada ao novo possuidor: o link vai para o e-mail de quem recebe, e o cartão da operação mostra "Aguardando pagamento de <novo titular>".

- **Onde:** src/produtos/backstage/alteracoes-pos-compra/components/wizard/TransferirTitularidadeWizard.tsx:147 (destino = selecionada?.email); components/CartaoOperacao.tsx:35-37 (quemPaga)
- **Contraria:** 576978948 §13 e H-24/H-03: quem paga segue a configuração da transferência paga e a notificação de cobrança vai para o pagador; não existe campo "quem paga" definido pela tela. §13 ainda manda avisar o possuidor ATUAL (H-28), o que o protótipo não faz.
- **Risco:** A tela decide, por conta própria, que o destinatário é o pagador. Se o finance configurar o contrário, a cobrança vai para a pessoa errada e o possuidor atual descobre a transferência pelo item sumindo da carteira.

### 10. Ao efetivar uma troca, o valor pago da linha passa a ser o maior entre o que já estava pago e o preço integral do novo item.

- **Onde:** src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:2013 (valorPago: Math.max(linha.valorPago, precoNovo))
- **Contraria:** §10.1: o crédito do item atual é o valor efetivamente pago, e §10.2: no downgrade a sobra não vira crédito nem saldo e fica com a Ingresse. Nenhuma EF define o valor pago da linha depois da troca.
- **Risco:** Depois de um downgrade de R$ 150 para R$ 80, a linha continua valendo R$ 150 de crédito. Na troca seguinte o cliente recupera, como abatimento, exatamente a sobra que o documento diz que ficou com a Ingresse. Duas trocas em sequência devolvem o que uma não devolve.

### 11. Quando a sessão da unidade já aconteceu, só a troca é bloqueada; transferir titularidade e editar o formulário continuam disponíveis, e a tela diz isso em texto ("Sessão realizada. Só a transferência continua disponível").

- **Onde:** src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1776 (motivoIndisponivel só bloqueia o verbo "trocar"); pages/DetalhePedido.tsx:588-589
- **Contraria:** 576978948 V03/C05 ("Este evento foi encerrado; o item não pode mais mudar de possuidor") e 575635517 V03/§6.1 (evento encerrado bloqueia a troca de respostas). O protótipo troca "evento encerrado" por "sessão realizada" e libera dois fluxos que a EF manda bloquear.
- **Risco:** Permite transferir titularidade e trocar respostas de um ingresso já usado ou de uma sessão que acabou, exatamente o que H-05 e V06 existem para impedir. Como não há bloqueio por check-in nem por kit retirado, essa é a única barreira de "item já consumido" que o protótipo tem, e ela está aberta para dois dos três fluxos.

### 12. O motivo obrigatório é uma categoria pré-selecionada ("Pedido do cliente") entre quatro opções fixas; a nota em texto só é exigida quando a categoria é "Outro". Na prática, só o número do chamado precisa ser digitado.

- **Onde:** src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:195-196 (motivoValido); components/pos-compra-ui.tsx:208 (MOTIVO_INICIAL com categoria já marcada)
- **Contraria:** H-07, nas três EFs: "motivo da troca e número do chamado são obrigatórios". Com a categoria pré-marcada, o motivo é preenchido por padrão e deixa de ser uma informação que o operador forneceu. A taxonomia de quatro categorias também não vem de nenhum documento.
- **Risco:** A obrigatoriedade do motivo vira decorativa: todo histórico sai com "Pedido do cliente" por omissão, e a auditoria perde justamente o campo que liga a alteração ao que aconteceu no atendimento.

### 13. No catálogo de destino, a elegibilidade de cada item é calculada contra uma linha de referência escolhida pelo tipo do item (a primeira linha que sai com o mesmo tipo), não contra a linha que o pareamento vai de fato usar.

- **Onde:** src/produtos/backstage/alteracoes-pos-compra/components/wizard/TrocarItensWizard.tsx:177 (referenciaDoItem) e :594 (validarTrocaItem sobre linhaReferencia)
- **Contraria:** §8 e o CA "todas as validações são feitas sobre o possuidor do item": a elegibilidade é da dupla possuidor + item de destino. Validar contra outra unidade, de outro possuidor, não está em lugar nenhum.
- **Risco:** Com unidades de titulares diferentes na mesma troca, um item restrito aparece liberado porque foi testado contra a pessoa errada. O operador escolhe, o cliente paga e a revalidação pós-pagamento reprova, caindo no estado "paga e não aplicada" que o protótipo não sabe reverter.

### 14. O store expõe criação de conta (criarConta) e existe um formulário de cadastro inline do novo titular que coleta, inclusive, os dados de segmentação (gênero e vínculo de sócio) que a validação usa; o detalhe do pedido ainda exibe "Aguardando o cadastro de <nome>" num rascunho.

- **Onde:** src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1323-1337 (criarConta) e :308 (aguardandoCadastroDe); components/wizard/CadastroContaInline.tsx:35; pages/DetalhePedido.tsx:484
- **Contraria:** 576978948 §4 ("o fluxo não cria conta, não cadastra facial e não edita dados do cadastro global"), §8 E2 (sem conta, a operação é bloqueada) e §18 (criação de conta fora do escopo do MVP).
- **Risco:** A capacidade está no modelo e o componente está escrito (hoje sem ser renderizado): basta ligar para o Backstage passar a criar contas e, pior, para o operador declarar gênero e vínculo de sócio do destinatário e com isso satisfazer a própria regra de segmentação que deveria barrá-lo.

### Não contam como regra inventada

Decisão de forma ou dado do mock, sem efeito sobre o que pode ou quanto custa:

- **Operações em montagem viram rascunhos persistidos no pedido, visíveis para qualquer operador, retomáveis por URL, com "Descartar" e "Desfazer" e aviso** (decisao-de-ux) — src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:281-312 (Rascunho) e :2235-2259 (salvar/remover/restaurar); pages/DetalhePedido.tsx:456-500
- **A lista de pedidos tem uma faixa "N pedidos precisam de atenção agora", que junta falhas e cobranças a menos de 15 minutos de expirar, calculada no cl** (decisao-de-ux) — src/produtos/backstage/alteracoes-pos-compra/components/FaixaAtencaoPedidos.tsx:7 (JANELA_URGENTE_MS) e :29-39
- **O PEDIDO tem status próprio derivado das solicitações ("Sem alterações", "Já alterados", "Alteração em andamento", "Alteração expirada", "Falha na alt** (decisao-de-ux) — src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1383-1390 (comStatus) e :2198-2199 (retomarPedido); pages/AlterarPedido.tsx:56
- **O prazo de pagamento roda acelerado: 60 segundos de relógio real, enquanto a tela escreve "15 minutos".** (dado-ficticio) — src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:36 (PRAZO_DEMO_SEGUNDOS = 60) e :1933 (expiraEm)
- **Os valores de cobrança são constantes no código: R$ 20,00 na troca de item (R$ 15 produtor / R$ 5 Ingresse), R$ 10,00 na troca de perguntas, R$ 15,00 ** (dado-ficticio) — src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:16-31
- **A segmentação de item é modelada como duas regras concretas, "feminino" (comparada com o gênero da conta) e "socio" (comparada com um booleano da cont** (dado-ficticio) — src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:126 (segmentacao?: "feminino" | "socio"), :1676-1690 e :1716-1727; pages/DetalhePedido.tsx:613-616

## O que a reunião de 14/10 decidiu

A reunião resolveu pontos que as especificações deixam em aberto e, em alguns casos, decidiu
**contra** a EF. Onde isso acontece, vale a reunião: ela é posterior e é do time.

| Assunto | Decisão |
| --- | --- |
| §12.1 | O prazo foi redefinido em duas peças: o link tem um prazo só para não ficar órfão (não precisa ser curto) e NÃO segura estoque; a reserva de verdade é de ~5 minutos, contados do clique no link, e é esse tempo que vai para o gateway. Meios de pagamento não foram tratados. |
| H-38 (A validar) | A premissa foi RESOLVIDA e corrigida: a reserva não começa na criação da solicitação. Ela começa quando o comprador abre o link e dura ~5 minutos; o prazo do link é outra coisa e não segura estoque. |
| §8 E1 | Decidido o contrário da EF e a favor de uma porta única com etapas invertidas: primeiro o destinatário, depois a seleção das unidades, depois a revisão — reaproveitando o fluxo da bilheteria. A ação não parte de cada item. |
| §8 E2 | Decidido NÃO mascarar o CPF no Backstage: o dado é do produtor, que já exporta a lista com CPF e sempre tem acesso. Ressalvas registradas: verificar se o caso Ingresse (fora Ticket Sports) tem termo de uso diferente, e o liga/desliga precisa ser no back, não só no front. |
| §8 E3 | Decidido que a nominalidade é validada no destinatário (e não só dentro do pedido), bloqueando o avanço conforme quantas unidades ele pode receber. A leitura preferida é o limite por pessoa configurado no item, em vez de varrer a carteira. Recorte 'por sessão' não foi discutido. |
| §8 E3 | Decidido que a facial trava a transferência e que quem responde se pode ou não transferir é a própria plataforma/carteira — o Backstage consome essa resposta em vez de recriar a regra. O link de cadastro não foi discutido. |
| §11.3 | Decidido registrar também o lado do recebimento: além de 'transferiu para', o histórico precisa ter a entrada invertida ('recebeu de fulano em tal dia'), preservando o rastro dos dois lados. Victor reconheceu que hoje só grava um lado. |
| V04 | Decidido que a disponibilidade da transferência vem da configuração do item na plataforma: o Backstage lê se o sistema libera ou não e não cria regra própria em cima disso. |
| §13 | Decidido que o pagador é o destinatário (novo possuidor) e é para ele que vai a cobrança — e é por isso que a solicitação é de um destinatário por vez. |
| C04 | Mesma decisão do V04: a indisponibilidade vem da configuração de transferência da plataforma; o protótipo lê o 'libera ou não libera' em vez de modelar período e limite por conta própria. |
| H-03 | A reunião definiu quem paga: é o destinatário (novo possuidor). Foi decisão explícita do time, e é o motivo de a solicitação ser de um destinatário por vez (dividir entre dois exigiria N links com valores quebrados, o que foi descartado). |
| H-05 | Decidido não escrever regra própria: vale a configuração do item na plataforma. O exemplo tratado foi o combo/passaporte com um dia já usado — se a configuração não permite picotar, já não é transferível hoje, e isso vem da plataforma. |
| §18 | A reunião manteve a seleção de várias unidades numa única solicitação, desde que todas vão para o MESMO destinatário. O caso validado foi o de quem comprou 4 itens no próprio nome e quer mandar 2. O que ficou proibido é dividir uma solicitação entre destinatários diferentes. |
| §11.1 | Decidido separar as duas contagens: o prazo da solicitação existe só para o status não ficar órfão e NÃO segura estoque; o relógio que importa é a reserva de ~5 minutos iniciada no clique do link, que é o tempo repassado ao gateway. |
| H-09 | O número foi revisto: o que precisa existir é a reserva de ~5 minutos a partir do clique no link (tempo repassado ao gateway). O prazo da solicitação é outro relógio, apenas para o status não ficar aberto para sempre, e não reserva nada. |
| H-38 (A validar) | Premissa RESOLVIDA: a reserva não parte da criação. Ela nasce no clique do link e dura ~5 minutos; o prazo do link não tem relação com reserva de estoque. |
| 295. INVENTADO | Mantido em parte, com limite claro: várias unidades numa mesma solicitação só valem para UM destinatário. Dividir entre duas pessoas foi recusado (exigiria N links com valores quebrados). E o atalho de agregar/'quantidade' cai: os itens passam a ser desagregados, uma linha por unidade, com o portado |
| 298. INVENTADO | Decidido que não é regra de produto: é um controle só do protótipo. No produto esse botão não existe e a transferência só acontece quando o pagamento ocorre. Enquanto ficar no protótipo, deve ter aparência propositalmente fora do design para ninguém confundir com funcionalidade. |
| 301. INVENTADO | CONFIRMADO pela reunião: quem paga a transferência é o destinatário, e é justamente por isso que a solicitação atende um destinatário por vez. Deixa de ser regra inventada. |

Decisões da reunião que não nasceram de pendência da EF e também valem para esta tela:

- Renomear 'Pago na compra' para 'Total pago' no detalhe do pedido (o bloco deve mostrar valor sem desconto, cupom aplicado e total pago).
- Desagregar os itens do pedido: cada unidade vira uma linha, com o portador identificado. Nada de agregador com stepper de quantidade — o operador precisa saber exatamente qual unidade está mexendo. Exceção que poderia agregar (mesmo item, mesma pessoa) foi descartada para não ter dois comportamentos.
- Inverter as etapas da transferência: destinatário primeiro, depois a seleção dos itens, depois a revisão — reaproveitando as telas que já existem na bilheteria (que já tem validação de facial). Só a revisão é desenho novo. As etapas deixam de ser modal e viram telas únicas.
- A linha do item precisa trazer as mesmas informações da carteira: grupo (não só o nome do ingresso, porque há nomes iguais em grupos diferentes), nome do item, assento marcado quando houver, indicação de facial e o nome de quem está portando.
- Uma solicitação atende um destinatário por vez. Selecionar duas unidades e mandar para duas pessoas diferentes foi descartado (exigiria gerar N links com valores quebrados).
- Na transferência, as respostas do formulário vão junto com o item, inclusive o estoque já reservado por elas (camiseta etc.). Não se refaz o formulário na transferência.
- Na troca de item, o operador responde o formulário do novo item dentro do fluxo (pergunta igual herda a resposta anterior, pergunta nova vem em branco) e o formulário precisa estar completo antes de gerar o link de checkout. Ficou descartada a ideia de transferir e deixar o participante responder depois no app.
- Na revisão da troca, a linha 'Taxa de serviço proporcional' passa a se chamar só 'Taxa de serviço' (taxa do novo item sobre o valor integral, descontada a já paga no item atual, nunca negativa). A cobrança da troca continua como linha separada.
- A validação de estoque fica deliberadamente ANTES do pagamento (no clique do link), para não existir caminho de pagar e depois precisar estornar.
- Enxugar as telas e o histórico: muita informação junta, pesada de ler. O histórico deve vir fechado e expandir sob demanda, com o básico do básico à vista, e usar 'A → B' com seta em vez de frases verbosas de/para.
- A transferência de combo/passaporte segue a configuração do item: há configuração item a item e configuração do combo inteiro. O Backstage não cria regra própria sobre o que pode ou não ser transferido — lê se o sistema libera.
- Escopo do time: Backstage (troca de item, transferência/titularidade e troca de respostas) fica com este time; troca de respostas na carteira web e no mobile vai para o time core, com outra designer (Jana).
- Ficou em aberto (sem decisão): se a troca de perguntas deve ser embutida no fluxo de transferência (proposta da Viviane) ou seguir como fluxo separado (preferência do Diego, por complexidade de estoque), e se nesse caso se cobra a transferência e a troca juntas.

## Divergências no nosso escopo

O protótipo trata o assunto, de um jeito diferente do que a especificação manda.

### Troca de item

- **§3.2** — Nada muda antes do pagamento: item atual, respostas e estoques permanecem intactos; o usuário é avisado de que a troca só se efetiva após o pagamento e está sujeita a estoque.
  <br>O pedido, o item atual e suas respostas ficam intactos (conforme), e o aviso existe na revisão (TrocarItensWizard:549-554). Mas criarSolicitacao já decrementa o estoque do item de DESTINO na criação, antes de qualquer pagamento. A regra manda não mexer em estoque nenhum nesse momento (§11).
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1865`
- **§5 itens de acesso** — Itens de acesso são ingresso, inscrição e combo; produto não é item de acesso.
  <br>nominalDoItem = item.nominal ?? item.tipo === 'ingresso'. Combo fica fora da regra de item de acesso por padrão, quando a EF o inclui. Produto fora está correto.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:143`
- **§7.1 sem estoque não é listado** — Item, lote ou opção sem estoque não é listado no catálogo de destino.
  <br>A regra manda não listar. O protótipo LISTA o item esgotado, com opacidade reduzida e um badge vermelho 'Esgotado' (bloqueio vindo de store:1654-1660), impedindo a seleção. Itens semente esgotados: it-mar-21k e it-trail-42k (estoque 0).
  <br>`src/produtos/backstage/alteracoes-pos-compra/components/wizard/TrocarItensWizard.tsx:624`
- **§7.1 item atual não é destino** — O item atual não pode ser escolhido como destino.
  <br>Com uma unidade só funciona (itemAtual trava a linha). Com várias unidades saindo, bloqueado exclui explicitamente o impedimento 'Item atual' e itemAtual só é verdadeiro quando saindo === totalSaem, então o item atual continua selecionável e parearTroca (store:1465-1469) pode casar a linha com o mesmo item que ela já tem.
  <br>`src/produtos/backstage/alteracoes-pos-compra/components/wizard/TrocarItensWizard.tsx:594-599`
- **§7.2 segmentação do item** — Item com tipo de portador segmentado é listado e selecionável, mas a troca só se efetiva se o possuidor atender ao critério; caso contrário, erro de público específico.
  <br>A validação sobre o possuidor existe (feminino e sócio). Mas o protótipo bloqueia já na LISTA, com badge 'Restrito' e item não selecionável (TrocarItensWizard:594-599), quando a regra manda listar e selecionável e só barrar na efetivação. Só dois critérios são simulados; idade, PCD, membership e lista de documentos não existem.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1676-1689`
- **§8 nominalidade** — Em evento nominal, o possuidor só pode ter 1 item de acesso por sessão; o item atual, que será substituído, não conta como duplicidade; produto não entra na regra.
  <br>A regra é por SESSÃO e por item de acesso. O código compara apenas l.itemId === novoItem.id dentro do mesmo pedido: dois itens de acesso diferentes na mesma sessão passam, e duplicidade em outro pedido do mesmo documento passa. O 'item atual não conta' está correto (l.id !== linha.id) e produto está corretamente fora (nominalDoItem).
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1642-1653`
- **§8 segmentação do item** — O possuidor precisa pertencer ao público do novo item: idade, PCD, membership, lista manual de documentos e demais segmentações existentes.
  <br>Só existem dois critérios simulados: 'feminino' (contra conta.genero) e 'socio' (contra conta.socio). Idade, PCD, membership e lista de documentos não têm representação no modelo.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:125-126`
- **§8 estoque** — Elegibilidade inclui estoque disponível no grupo, no item, no lote e nas respostas com estoque do destino.
  <br>Valida só o estoque do ITEM (novoItem.estoque <= 0). Não valida grupo (não existe estoque de grupo), nem lote (não existe), nem as respostas com estoque do destino — a etapa de formulário da troca não impede escolher uma opção esgotada e não consome o estoque dela.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1654-1660`
- **§10.2 downgrade não devolve** — No downgrade o crédito abate primeiro a cobrança da troca; a sobra não é devolvida, não vira crédito nem saldo e fica com a Ingresse. A tela informa isso e exige aceite explícito.
  <br>O cálculo está certo (naoDevolvido, store:1505), o aviso aparece (TrocarItensWizard:529-535) e há um Checkbox de aceite que bloqueia a confirmação (podeAvancar, linha 250). Mas o aceite NÃO é gravado: aceitouSobra é estado local e não é enviado a criarSolicitacao (336-351), apesar de o hint prometer 'O aceite fica registrado no histórico'.
  <br>`src/produtos/backstage/alteracoes-pos-compra/components/wizard/TrocarItensWizard.tsx:541-548`
- **§10.4 tabela de exemplos** — Os oito exemplos da tabela produzem exatamente os totais indicados (R$108, R$20, R$10, R$0 com R$30 não devolvidos, R$108, R$88, R$111,60 e R$0 com R$30 não devolvidos).
  <br>Os cinco exemplos com cobrança de R$20 e taxa 10% batem (upgrade 108, mesmo valor 20, downgrade com pagamento 10, downgrade sem pagamento 0/30, compra com desconto 108). Não são reproduzíveis: 'sem cobrança da troca' (constante fixa em 20) e 'taxa do destino 12%' (o campo taxaServicoPercent existe em store:122 mas nenhum item do catálogo o usa).
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1489-1530`
- **§11 exibição e seleção** — Na exibição e seleção, só o que tem estoque é listado e a seleção valida a disponibilidade.
  <br>A seleção valida (maximo limitado por item.estoque e bloqueio de esgotado), mas o esgotado continua listado em vez de sumir, como já apontado em §7.1.
  <br>`src/produtos/backstage/alteracoes-pos-compra/components/wizard/TrocarItensWizard.tsx:596`
- **§11 pagamento confirmado** — Pagamento confirmado e efetivado: estoque do destino consumido definitivamente e estoque do item atual devolvido, com as respostas descontinuadas.
  <br>A devolução do estoque de origem acontece no momento certo (devolverEstoqueDasOrigens antes de aplicar). O consumo do destino, porém, já tinha acontecido na criação. E o estoque das respostas descontinuadas não volta na troca de item (§9).
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:2134`
- **§12.1 unicidade** — Só pode existir uma solicitação em AGUARDANDO PAGAMENTO, PAGO/PROCESSANDO ou FALHA DE PROCESSAMENTO por item; depois de EXPIRADA, CANCELADA ou REPROVADA uma nova pode ser criada.
  <br>A unicidade enquanto a solicitação está aberta funciona (ocupada → retorna null). A segunda metade não: depois de uma 'falha' (que representa a REPROVADA da EF) a solicitação nunca sai da lista, então a unidade fica bloqueada para sempre (motivoIndisponivel:1769) e nenhuma nova solicitação pode ser criada.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1860-1861`
- **§12.1 prazo e meios** — Prazo de 15 minutos; meios de pagamento conforme o evento, sem boleto.
  <br>O prazo de 15 minutos é declarado e exibido (PRAZO_REAL_LABEL, usado em TrocarItensWizard:553), com timer acelerado assumido como recurso de demonstração. Os meios de pagamento da cobrança não existem no protótipo: não há checkout, então 'sem boleto' não é verificável.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:32-36`
- **§12.4 conteúdo da solicitação** — A solicitação contém pedido, comprador, possuidor, item atual e novo com tipo, lote, respostas atuais e novas, valores e taxas, diferença, taxa proporcional, cobrança e divisão, total, aceite de não devolução, canal, motivo e chamado, responsável, datas e status.
  <br>Presentes: pedido, linhas afetadas, trocas origem→destino, respostas novas, linhas de valor, total, canal e destinatário, motivo com chamado, operador, criadoEm/expiraEm, estado e referência de pagamento. Ausentes: lote, valor e taxa pagos antes como campos próprios, divisão produtor/Ingresse, valor não devolvido e o aceite de não devolução.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:232-279`
- **§13 mensagem com ação** — A mensagem indica a solicitação em aberto e oferece a ação de cancelá-la.
  <br>A mensagem identifica a operação ('Em troca', 'Em transferência para Fulano', 'Troca paga e não aplicada'), mas não oferece a ação de cancelar ali. O operador precisa sair do fluxo e achar o cartão da alteração no detalhe do pedido, onde 'Cancelar alteração' está dentro de 'Mais ações'.
  <br>`src/produtos/backstage/alteracoes-pos-compra/components/wizard/seletor-unidades.tsx:188-197`
- **§16 B5 aceite do downgrade** — Em downgrade a tela informa que a diferença não será devolvida e exige aceite explícito do operador em nome do comprador; o aceite fica no histórico.
  <br>Informa e exige o aceite (checkbox que trava a confirmação), com o texto 'Confirmo, em nome do comprador, que R$ X não serão devolvidos'. Mas aceitouSobra nunca sai do componente: não vai para criarSolicitacao nem para o histórico, ao contrário do que o próprio hint afirma.
  <br>`src/produtos/backstage/alteracoes-pos-compra/components/wizard/TrocarItensWizard.tsx:103`
- **V06** — Operação pendente sobre o item, em B1: 'Existe uma operação em andamento ({tipo}). Conclua ou cancele antes de prosseguir.'
  <br>O bloqueio existe e o texto nomeia o tipo ('Em troca', 'Em transferência para X', 'Em edição do formulário'), mas não diz 'conclua ou cancele antes de prosseguir' nem dá o caminho para cancelar dentro do fluxo.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1767-1775`
- **V07** — Destino igual ao atual, em B2: 'Selecione um item diferente do atual.'
  <br>Com uma unidade, o item atual não é selecionável. Com várias, o aviso só dispara quando o conjunto de destinos é IDÊNTICO ao de origem (selecaoIgual, 197-206); misturando itens, parearTroca pode casar uma linha com o próprio item dela e a solicitação é criada — a recusa só vem na revalidação pós-pagamento (store:1637-1639).
  <br>`src/produtos/backstage/alteracoes-pos-compra/components/wizard/TrocarItensWizard.tsx:437`
- **V08** — Nominalidade, em B3: 'O possuidor já possui um item de acesso nesta sessão do evento vinculado ao mesmo documento.'
  <br>A mensagem existe ('Fulano já tem uma unidade de X neste pedido') mas afirma coisa diferente: a verificação é por item idêntico dentro do mesmo pedido, não por item de acesso na mesma sessão vinculado ao mesmo documento.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1646-1652`
- **V13** — Estoque acabou durante a operação, em B2/B4/B6: 'A opção {item ou resposta} esgotou durante a operação. Escolha entre as opções disponíveis.' Sem nenhuma opção: 'Estoque esgotado.'
  <br>Em B2 há bloqueio e badge 'Esgotado' no item, mas é o estado inicial, não o 'esgotou durante a operação'. Em B4 a opção de resposta esgotada aparece desabilitada, sem a mensagem. Em B6 não há verificação nenhuma: criarSolicitacao decrementa sem checar, então o esgotamento na confirmação passa em silêncio.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1654-1660`
- **C06** — Downgrade sem pagamento: cobrança R$50, item pago R$150, destino R$80, aceite registrado → total R$0, troca efetivada na hora e R$20 de sobra ficam com a Ingresse.
  <br>A mecânica de total zero aplicando na hora funciona e a sobra é calculada. Dois desvios: a cobrança de R$50 não é configurável, e o aceite exigido pelo cenário não é registrado em lugar nenhum.
  <br>`src/produtos/backstage/alteracoes-pos-compra/components/wizard/TrocarItensWizard.tsx:103`
- **C13** — Segmentação do item: item com segmentação PCD selecionado para possuidor não PCD → troca bloqueada com a mensagem de público específico.
  <br>O bloqueio por segmentação do item existe, mas com outros critérios (feminino, sócio) e aplicado já na listagem, não na seleção. PCD não existe.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1676-1689`
- **C16** — Nominalidade por sessão: bloqueia trocar um produto por uma inscrição na sessão em que o possuidor já tem ingresso, e permite trocar o próprio ingresso de sábado por outro ingresso de sábado.
  <br>A segunda metade funciona (o item atual não conta). A primeira não: trocar um produto por uma inscrição numa sessão onde o possuidor já tem outro item de acesso passa, porque a comparação é por itemId igual, não por sessão.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1642-1653`
- **C23** — Operação concorrente: com uma troca pendente sobre um item, a tentativa de trocar a titularidade dele é bloqueada e a opção de cancelar a solicitação pendente é oferecida.
  <br>O bloqueio acontece para os três verbos. A oferta de cancelar a pendente não aparece junto da mensagem: o operador tem que sair do fluxo e usar 'Mais ações' no cartão da alteração.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1767-1775`
- **§25 sem WhatsApp automático** — Envio automático do link por WhatsApp está fora do escopo (o operador pode copiar e colar o link).
  <br>O protótipo implementa envio por WhatsApp como canal de reenvio, com seleção de canal e campo de telefone validado, e o tipo CanalEnvio (store:60) trata WhatsApp como um dos 'únicos dois canais'. A EF põe isso fora do escopo do MVP.
  <br>`src/produtos/backstage/alteracoes-pos-compra/components/CartaoOperacao.tsx:271-281`
- **CA: Item, lote ou opção sem estoque não aparece** — Critério de aceite de catálogo.
  <br>Item esgotado aparece bloqueado com badge; opção de resposta esgotada aparece desabilitada (respostas-ui.tsx:150). A regra manda não aparecer.
  <br>`src/produtos/backstage/alteracoes-pos-compra/components/wizard/TrocarItensWizard.tsx:624`
- **CA: Na efetivação, o estoque anterior é devolvido e o do novo consumido, na mesma transação** — Critério de aceite de estoque.
  <br>A devolução acontece na efetivação, mas o consumo do novo aconteceu lá atrás, na criação, e as duas atualizações de estado não formam uma transação.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:2134-2139`
- **CA: Toda tentativa aparece no histórico com canal, autor, valores, divisão e movimentações** — Critério de aceite de histórico.
  <br>Canal, autor, data e valores estão lá, e toda tentativa (aplicada, expirada, cancelada, falha) gera entrada. Faltam a divisão produtor/Ingresse e as movimentações de estoque.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1946-1961`

### Troca de titularidade

- **§8 E1 ação por item** — Cada item exibe a ação "Trocar titular" quando todas as condições forem verdadeiras.
  <br>A regra põe a ação em cada item. O protótipo tem uma única porta no topo da lista ("Transferir itens") e a escolha das unidades acontece dentro do fluxo; o cartão da unidade só oferece "Editar formulário".
  <br>`src/produtos/backstage/alteracoes-pos-compra/pages/DetalhePedido.tsx:716`
- **§8 E1 motivo visível** — Quando a ação não estiver disponível, o sistema mostra o motivo em vez de esconder o botão.
  <br>A regra proíbe esconder o botão. O protótipo esconde (verbos é filtrado por elegiveis(verbo) > 0) e mostra um motivoGeral ao lado — o motivo aparece, o botão não. Dentro do wizard o comportamento é melhor: as unidades indisponíveis aparecem com o motivo escrito (seletor-unidades.tsx:182-199).
  <br>`src/produtos/backstage/alteracoes-pos-compra/pages/DetalhePedido.tsx:536`
- **§8 E2 precisa ter conta** — O novo possuidor precisa ter conta; sem conta a operação é bloqueada e o operador orienta o cadastro.
  <br>Bloqueia de fato (sem conta não há como avançar), mas a mensagem é só "Nenhuma conta encontrada para "{termo}"." — não orienta o cadastro como a regra e a V08 exigem.
  <br>`src/produtos/backstage/alteracoes-pos-compra/components/wizard/TransferirTitularidadeWizard.tsx:487`
- **§8 E3 nominalidade** — Em evento nominal o novo possuidor só pode ter 1 item de acesso por sessão do evento; produto não entra nessa regra.
  <br>A regra é por SESSÃO. O código compara l.itemId === item.id (mesmo item do catálogo) e só dentro do mesmo pedido: o novo possuidor pode receber dois ingressos diferentes da mesma sessão, e nada enxerga itens que ele já tenha em outro pedido. O recorte de produto está certo (nominalDoItem, store:143).
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1706`
- **§8 E3 segmentação** — O novo possuidor precisa atender ao critério do item: idade, PCD, membership, lista manual de documentos e demais segmentações.
  <br>A regra lista idade, PCD, membership e lista manual. O catálogo só tem segmentacao?: "feminino" | "socio" e validarNovoTitular (store:1717-1730) só checa gênero e flag socio. O exemplo da própria EF (60+ não vai para alguém de 30) não é verificável: Conta tem nascimento mas ninguém o lê.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:126`
- **§8 E5 estado inicial** — Cria a solicitação de troca vinculada ao pedido, item, possuidor atual e novo possuidor, em AGUARDANDO PAGAMENTO, com os valores congelados.
  <br>A solicitação nasce em estado "aguardando" com pedido, linhas afetadas, novo possuidor e valores congelados — mas o possuidor ATUAL não é gravado na solicitação; ele é derivado da linha, e depois da efetivação deixa de ser recuperável pela solicitação.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1916`
- **§11.1 unicidade** — Só pode existir uma solicitação em AGUARDANDO PAGAMENTO, PAGO/PROCESSANDO ou FALHA DE PROCESSAMENTO por item.
  <br>A unicidade é garantida por LINHA do pedido (solicitacaoDaLinha sobre linhasAfetadas), não por item do catálogo: duas linhas do mesmo item do catálogo podem estar em duas solicitações abertas ao mesmo tempo.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1860`
- **§11.2 mensagem com ação** — A mensagem indica a solicitação em aberto e oferece a ação de cancelá-la.
  <br>A regra pede a ação de cancelar junto da mensagem. A linha da unidade mostra só a frase de estado; o comentário do código diz que o "Ver alteração" foi retirado de propósito, e cancelar fica apenas no cartão da operação, acima das abas.
  <br>`src/produtos/backstage/alteracoes-pos-compra/pages/DetalhePedido.tsx:737`
- **H-08** — A chave de bloqueio entre operações pós-compra é o item do catálogo (ingresso, inscrição, produto ou combo).
  <br>A regra diz item do catálogo; solicitacaoDaLinha casa por linhaId (a unidade do pedido). O comentário em motivoIndisponivel (1765) até cita H-08, mas a implementação usa outra chave: um pedido com duas unidades do mesmo item pode ter duas operações abertas sobre o mesmo item do catálogo.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1737`
- **§11.3 cadeia preservada** — A troca nunca apaga nem sobrescreve o possuidor anterior; sempre é possível saber quem comprou, quem foram os possuidores anteriores e quem é o atual.
  <br>Não existe estrutura de cadeia: a linha guarda só titularId atual e sobrescreve transferidoEmLabel/transferidoPor a cada troca. O rastro anterior só sobrevive solto no histórico do pedido, na frase "De {X} para {Y}" gravada em detalhes (wizard:344).
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:2018`
- **V03** — Evento encerrado (E1/E6): "Este evento foi encerrado; o item não pode mais mudar de possuidor."
  <br>A regra manda bloquear. motivoIndisponivel só bloqueia sessão realizada para o verbo "trocar"; para "transferir" o protótipo faz o oposto e anuncia "As sessões deste pedido já aconteceram. Só a transferência continua disponível." (DetalhePedido.tsx:539).
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1778`
- **V11** — Nominalidade (E3/E6): "O novo participante já possui um item de acesso nesta sessão do evento vinculado ao mesmo documento."
  <br>Existe a validação e a mensagem ("Ingresso nominal: uma unidade por pessoa"), mas o escopo é outro: mesmo ITEM e mesmo PEDIDO, não "item de acesso na mesma sessão" nem por documento em toda a base. Roda também na revalidação (store:2063), como a regra pede.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1706`
- **V12** — Segmentação não atendida (E3/E6): "O novo participante não atende ao critério exigido por este item: {critério}."
  <br>Existe a mensagem com o critério ("restrito ao público feminino", "exclusivo para sócios"), mas só para dois critérios inventados; idade, PCD, membership e lista manual de documentos não são verificáveis.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1717`
- **V15** — Motivo ou chamado não informado (E4): "Informe o motivo e o número do chamado para continuar."
  <br>A obrigatoriedade é real para o chamado (botão desabilitado), mas não há a mensagem da regra: o operador só vê o botão inerte. Além disso o motivo nunca bloqueia, porque CampoMotivo já nasce com a categoria "pedido-cliente" pré-selecionada (MOTIVO_INICIAL, pos-compra-ui.tsx:208).
  <br>`src/produtos/backstage/alteracoes-pos-compra/components/pos-compra-ui.tsx:177`
- **C05** — Evento encerrado: a ação Trocar titular aparece indisponível com V03.
  <br>O protótipo faz o contrário: com as sessões já realizadas a transferência continua a única ação oferecida, com o texto "Só a transferência continua disponível".
  <br>`src/produtos/backstage/alteracoes-pos-compra/pages/DetalhePedido.tsx:539`
- **C14** — Novo participante sem cadastro: a operação é bloqueada com V08 e nenhuma conta é criada.
  <br>O wizard hoje bloqueia e não cria conta, mas a mensagem não é a de V08 (não orienta o cadastro) e o protótipo ainda carrega a capacidade de criar conta (criarConta, CadastroContaInline) que a EF proíbe.
  <br>`src/produtos/backstage/alteracoes-pos-compra/components/wizard/TransferirTitularidadeWizard.tsx:487`
- **C16** — Evento nominal em que o destinatário já tem um item de acesso na mesma sessão: a troca é bloqueada com V11.
  <br>Só bloqueia se for o MESMO item do catálogo e dentro do mesmo pedido. Dois ingressos diferentes da mesma sessão, ou um item que a pessoa já tenha em outro pedido, passam.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1706`
- **C23** — Item que passou por Maria, João e Pedro: o operador vê o comprador original e os três possuidores em ordem, com data, canal, autor e valor de cada troca.
  <br>O popover mostra só o portador atual e a última transferência. A sequência completa só pode ser inferida lendo entrada por entrada do histórico do pedido, sem ordenação por item, sem canal e sem a figura do comprador original ao lado.
  <br>`src/produtos/backstage/alteracoes-pos-compra/pages/DetalhePedido.tsx:766`
- **H-28** — O possuidor atual não precisa dar anuência prévia; ele é avisado quando a solicitação é criada e quando a troca é efetivada, e o motivo/chamado fica registrado. (A validar)
  <br>Duas metades, só uma cumprida: não há anuência prévia (alinhado) e o motivo/chamado fica registrado na solicitação e no histórico (alinhado), mas nenhum aviso ao possuidor atual existe, nem como marca na tela. Premissa ainda "A validar" na EF.
  <br>`src/produtos/backstage/alteracoes-pos-compra/components/wizard/TransferirTitularidadeWizard.tsx:333`
- **§18 lote** — Fora do escopo do MVP: troca de vários itens em uma única solicitação (troca em lote para Grupos).
  <br>O protótipo implementa exatamente o que a EF excluiu do MVP: seleção múltipla com campo de quantidade por grupo, cálculo quantidade × 15 (store:1540) e uma solicitação com várias linhasAfetadas.
  <br>`src/produtos/backstage/alteracoes-pos-compra/components/wizard/seletor-unidades.tsx:161`
- **§18 criação de conta** — Fora do escopo do MVP: criação de conta, convite de cadastro ou edição do cadastro global.
  <br>Existe no código um cadastro inline de conta ("Cadastrar quem vai receber") e a função criarConta no store. Hoje é código morto (nenhum wizard importa CadastroContaInline), mas é regra que o protótipo criou contra a EF.
  <br>`src/produtos/backstage/alteracoes-pos-compra/components/wizard/CadastroContaInline.tsx:19`
- **CA: Sem conta, a operação é bloqueada com orientação de cadastro; o fluxo não cria conta** — Bloqueio com orientação explícita de cadastro, sem criar conta.
  <br>Bloqueia e (hoje) não cria conta, mas não dá a orientação de cadastro exigida; e a função criarConta segue exportada no store.
  <br>`src/produtos/backstage/alteracoes-pos-compra/components/wizard/TransferirTitularidadeWizard.tsx:487`
- **CA: Novo possuidor que não atende à segmentação, nominalidade ou limites é bloqueado antes de qualquer cobrança, com o motivo** — Bloqueio pré-cobrança com motivo explícito nas três famílias de validação.
  <br>O bloqueio pré-cobrança funciona e mostra o motivo por unidade, mas só para nominalidade (recorte reduzido) e duas segmentações; limites não existem.
  <br>`src/produtos/backstage/alteracoes-pos-compra/components/wizard/TransferirTitularidadeWizard.tsx:285`
- **CA: O resumo informa se o novo possuidor poderá alterar respostas e até quando** — O resumo precisa dizer se dá para alterar e qual é a data limite.
  <br>O resumo afirma sempre que não dá para alterar, sem condicional e sem data limite; o texto cita "§8 E4" num comentário mas cumpre só metade da regra.
  <br>`src/produtos/backstage/alteracoes-pos-compra/components/wizard/TransferirTitularidadeWizard.tsx:571`
- **CA: Sem cobrança, a troca efetiva na hora, com histórico** — Cobrança zero gera efetivação imediata com registro.
  <br>Implementado em criarSolicitacao, mas inalcançável pela titularidade (total sempre ≥ 15).
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1873`

### Troca de perguntas do formulário

- **§6.1** — A ação é bloqueada quando o evento foi encerrado.
  <br>A regra manda bloquear. O código só checa a sessão realizada quando o verbo é "trocar": `if (verbo === "trocar" && linhaEncerrada(linha))`. Com verbo "formulario" a checagem é pulada, então uma unidade cuja sessão já aconteceu continua mostrando o botão "Editar formulário" (DetalhePedido.tsx:637) e aceita criar solicitação.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1776`
- **E1** — Quando a ação não estiver disponível, o sistema mostra o motivo em vez de esconder o botão.
  <br>A regra manda mostrar o motivo. O código esconde o rodapé inteiro quando `podeFormulario` é falso. O motivo só aparece quando a causa é solicitação pendente, por outro caminho (FatosDaUnidade/EstadoDaUnidade, linha 663). Quando a causa é "Sem formulário" — o texto existe em motivoIndisponivel, pos-compra-store.ts:1777 — nada é exibido no cartão.
  <br>`src/produtos/backstage/alteracoes-pos-compra/pages/DetalhePedido.tsx:666`
- **E3** — Resposta com controle de estoque: a seleção valida a disponibilidade da nova opção; a opção anterior continua consumida até a efetivação.
  <br>A segunda metade está conforme: a opção anterior só é devolvida em devolverEstoqueDasOrigens, chamada na efetivação (pos-compra-store.ts:2134). A primeira não: a disponibilidade é checada só na RENDERIZAÇÃO do Select (isDisabled calculado a partir de `o.estoque <= 0`), não no ato da seleção nem depois. Entre abrir o wizard e confirmar, nada revalida.
  <br>`src/produtos/backstage/alteracoes-pos-compra/components/respostas-ui.tsx:150`
- **E4** — O resumo avisa que a troca só será efetivada após o pagamento e está sujeita à disponibilidade de estoque.
  <br>A regra pede as duas condições. O texto é "As respostas novas valem assim que o pagamento for confirmado. O link vai para {destino}" — fala só do pagamento, omite a sujeição ao estoque. O wizard de troca de item traz a frase completa (TrocarItensWizard.tsx:553), então a omissão é desta tela.
  <br>`src/produtos/backstage/alteracoes-pos-compra/components/wizard/editar-formulario-wizard.tsx:122`
- **E4** — O resumo informa o prazo de pagamento de 15 minutos, o destinatário do link e oferece copiar o link.
  <br>Na revisão aparece só o destinatário. O prazo não é mencionado (PRAZO_REAL_LABEL é usado no wizard de troca de item, não aqui) e não há "Copiar link" — o link só nasce depois, no CartaoOperacao do pedido (CartaoOperacao.tsx:172).
  <br>`src/produtos/backstage/alteracoes-pos-compra/components/wizard/editar-formulario-wizard.tsx:122`
- **§9.1** — Cobrança da troca: opcional, cobrada uma vez por operação independentemente de quantas respostas forem alteradas, dividida entre produtor e Ingresse.
  <br>"Uma vez por operação" está conforme e até explicitado no texto da regra da linha ("as N respostas alteradas juntas custam o mesmo que uma"). "Opcional" e "dividida entre produtor e Ingresse" não existem: valor fixo, sem configuração e sem divisão.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1565`
- **§9.2** — Total zero: sem pagamento, a troca é efetivada na hora.
  <br>A mecânica existe no store mas o total nunca é zero neste fluxo, porque a cobrança é constante. Ver E7.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1873`
- **§9.3** — Os quatro exemplos da tabela produzem exatamente os totais e a divisão indicados (R$ 20,00 com R$ 15,00 produtor e R$ 5,00 Ingresse; três respostas pelo mesmo total; 100% produtor; sem cobrança igual a R$ 0,00 com efetivação imediata).
  <br>Nenhum dos quatro é reproduzível: o total é R$ 10,00 fixo em vez de R$ 20,00, não há divisão produtor/Ingresse para conferir, não há configuração 100% produtor e o caso sem cobrança é inalcançável. O comportamento que o exemplo 2 testa (três respostas, um total) está conforme.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1565`
- **§10** — Troca sem cobrança: a nova resposta é revalidada e consumida no ato e a anterior é devolvida na mesma transação.
  <br>O consumo e a devolução na mesma transação estão implementados (linhas 1865 e 1893), mas sem revalidação e, de novo, por caminho inalcançável — a cobrança nunca é zero neste fluxo.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1893`
- **§11.1** — Estado AGUARDANDO PAGAMENTO: solicitação criada e cobrança gerada com valores congelados, respostas atuais vigentes, prazo de 15 minutos.
  <br>Tudo bate menos o prazo: `expiraEm: agora + PRAZO_DEMO_SEGUNDOS * 1000`, com PRAZO_DEMO_SEGUNDOS = 60. São 60 segundos, não 15 minutos. A constante correta existe (PRAZO_REAL_LABEL = "15 minutos", linha 34) e é usada só em textos (EtapaEnvio.tsx:68, TrocarItensWizard.tsx:553), nunca no relógio.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1933`
- **§11.1** — Estado CANCELADA: cancelada antes do pagamento pelo operador ou por estoque esgotado na abertura do link, estado final.
  <br>O cancelamento pelo operador está conforme (cancelarSolicitacao, mesma reversão da expiração, marco "cancelada"). O segundo gatilho da regra — cancelamento automático por estoque esgotado na abertura do link — não existe. Ver H-39 e C03.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:2186`
- **§13** — A mensagem indica a solicitação em aberto e oferece a ação de cancelá-la.
  <br>A mensagem indica a solicitação ("Aguardando pagamento da edição do formulário até {hora}", EstadoDaUnidade) mas não oferece o cancelar ali. O cancelamento está noutro lugar da página, dentro do dropdown "Mais ações" do CartaoOperacao, sem link entre os dois pontos.
  <br>`src/produtos/backstage/alteracoes-pos-compra/pages/DetalhePedido.tsx:689`
- **V03** — Evento encerrado, em E1: "Este evento foi encerrado; as respostas não podem mais ser alteradas."
  <br>A regra manda bloquear com mensagem. O código tem a infraestrutura (`linhaEncerrada`, `sessaoRealizada`) mas só a aplica ao verbo "trocar": `if (verbo === "trocar" && linhaEncerrada(linha)) return "Sessão realizada"`. Para "formulario" não há checagem nem mensagem, e a edição fica disponível numa sessão já realizada.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1776`
- **H-09** — Prazo de pagamento de 15 minutos.
  <br>PRAZO_DEMO_SEGUNDOS = 60 é o valor usado em `expiraEm` (linha 1933). O prazo real está declarado só como rótulo de texto (PRAZO_REAL_LABEL). A divergência é deliberada e documentada no comentário ("No protótipo o timer roda acelerado"), mas registro porque a regra é numérica.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:36`
- **H-19** — Todas as perguntas são editáveis no Backstage; quando a pergunta é critério de segmentação do item (PCD, faixa etária, membership, assessoria), a nova resposta passa pela mesma validação de elegibilidade da compra, sobre o possuidor, e é bloqueada se ele deixar de atender.
  <br>Primeira metade conforme: todas as perguntas do formulário do item são renderizadas como editáveis, incluindo texto livre e anexo. Segunda metade ausente: não há marca de pergunta como critério de segmentação, e o formulário completo tem justamente "Categoria etária" e "Equipe / assessoria" (pos-compra-store.ts:470 e 426), que a regra cita como exemplos, sem nenhuma validação ao trocá-las.
  <br>`src/produtos/backstage/alteracoes-pos-compra/components/wizard/editar-formulario-wizard.tsx:103`
- **H-20** — Não há período de troca no Backstage: a troca fica disponível até o encerramento do evento, a retirada do kit ou o check-in.
  <br>"Não há período de troca" está conforme — PRAZO_TROCA_HORAS não é aplicado ao verbo "formulario". Mas as três fronteiras que substituem o período não existem para este fluxo: encerramento do evento não é checado (só para "trocar"), e kit/check-in não existem no modelo.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1776`
- **CA: A ação Trocar respostas está disponível sem configuração e sem período, desde que o evento não esteja encerrado, o pedido pago, o item ativo, kit não retirado, check-in não realizado e sem operação pendente; caso contrário o motivo é exibido** — Conjunto completo das condições de disponibilidade mais a exibição do motivo.
  <br>Das sete condições, duas são verificadas (item com formulário e sem operação pendente). Evento encerrado é verificado para outro verbo e não para este; pedido pago, item ativo, kit retirado e check-in não existem no modelo. E quando a ação fica indisponível o botão desaparece em vez de exibir o motivo.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1776`
- **C04** — Troca sem cobrança: evento sem cobrança configurada, o estoque de G é revalidado, a troca é efetivada na hora, sem link, G é consumida, M volta ao estoque e a operação é registrada.
  <br>O caminho existe e faz tudo isso (menos revalidar), mas é inalcançável: a cobrança de perguntas é fixa em R$ 10,00.
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1873`
- **C12** — Dado cadastral: ao tentar alterar o CPF do possuidor, o campo não é editável e o sistema exibe V11.
  <br>O efeito protegido está garantido (CPF não é editável porque não é campo do formulário), mas o cenário como descrito não é reproduzível: não há campo cadastral exibido no formulário e, portanto, nem o estado não-editável nem a mensagem V11.
  <br>`src/produtos/backstage/alteracoes-pos-compra/components/wizard/editar-formulario-wizard.tsx:103`
- **C20** — Operação concorrente: com solicitação de troca de respostas pendente, a operação é bloqueada com V07 e com a opção de cancelar a solicitação pendente.
  <br>O bloqueio acontece e o motivo com o tipo da operação é exibido. Falta a segunda parte: a mensagem não oferece cancelar a solicitação pendente — a ação existe, mas em outro ponto da página (dropdown do CartaoOperacao).
  <br>`src/produtos/backstage/alteracoes-pos-compra/data/pos-compra-store.ts:1769`

## Ausências no nosso escopo

A regra não aparece em lugar nenhum do protótipo.

### Troca de item

- **§6.2** — A abertura Pós-venda tem nome, público, canal, itens, data inicial e data final, e define quais itens podem ser destino.
- **§6.3 disponibilidade** — A troca só está disponível quando, ao mesmo tempo: pedido pago, evento não encerrado e abertura Pós-venda vigente.
- **§6.3 encerrar abertura** — Encerrar ou desativar a abertura impede novas solicitações; as pendentes seguem até pagamento, expiração ou cancelamento.
- **§7.1 itens da abertura** — Somente itens da abertura Pós-venda vigente são listados como destino.
- **§7.1 lote vigente** — Somente o lote vigente de cada item (ativo e com estoque) é listado; havendo dois lotes vigentes, os dois são exibidos e quem opera escolhe.
- **§7.1 passkey** — Itens ocultos por passkey aparecem no Backstage com a sinalização 'oculto por passkey'.
- **§7.2 segmentação da abertura** — Item de abertura segmentada só é listado se o possuidor pertence ao público (segmentação de visibilidade).
- **§8 limites** — Limites de quantidade por documento/usuário configurados no novo item são validados.
- **§8 benefício** — Item com meia-entrada ou outro benefício exige a mesma comprovação de uma compra normal; o que é validado é o novo item.
- **§10.4 cobrança de R$ 50,00** — Com cobrança da troca de R$ 50,00: item de R$100 → R$80 paga R$30; item de R$150 → R$80 não paga nada e R$20 ficam com a Ingresse.
- **§16 B2 catálogo e passkey** — Escolher o novo item e o lote conforme a seção 7; no Backstage os itens ocultos por passkey aparecem com a sinalização 'oculto por passkey'.
- **§17 painel de solicitações** — Existe no Backstage um painel de solicitações, por evento e por organização, com as solicitações dos dois canais.
- **§17 colunas** — Colunas do painel: solicitação, canal, pedido, possuidor, item atual → novo item, total, status, criada em, expira em, responsável.
- **V03** — Sem abertura Pós-venda vigente, em B1: 'A troca de item não está disponível neste evento no momento', com o período da próxima abertura se houver.
- **V04** — Pedido não pago ou item inativo, em B1: 'Este item não pode ser trocado: {pedido pendente / item cancelado / item reembolsado}.'
- **V05** — Check-in realizado ou kit retirado, em B1: 'Este item já foi utilizado e não pode ser trocado.'
- **V10** — Limite por documento/usuário, em B3: 'O possuidor atingiu o limite de aquisição deste item.'
- **V14** — Falha ao gerar a cobrança, em B6: 'Não foi possível gerar a cobrança por {motivo}. Nenhuma alteração foi feita. Tente novamente.'
- **C03** — Estoque esgotado ao abrir o link: a solicitação vai para CANCELADA com motivo estoque esgotado, nada é cobrado e o pedido fica intacto.
- **C05** — Downgrade com pagamento: cobrança de R$50, item pago R$100, destino R$80 → total R$30.
- **C08** — Sem cobrança da troca: upgrade de R$100 para R$180 num evento sem cobrança configurada → total R$88.
- **C09** — Dois lotes vigentes: os dois são exibidos, quem opera escolhe um e o valor segue o lote escolhido.
- **C12** — Segmentação da abertura: com abertura para público 60+ e possuidor de 35 anos, os itens dessa abertura não são listados.
- **C17** — Fora do período: evento sem abertura Pós-venda vigente → a ação de troca aparece indisponível com o motivo.
- **C25** — Passkey no Backstage: item de destino oculto por passkey aparece com a sinalização 'oculto por passkey' e pode ser escolhido.
- **H-05** — Item com check-in realizado ou kit retirado não pode ser trocado.
- **H-16** — Trocar para item com meia-entrada ou benefício exige a mesma comprovação de uma compra normal; o que é validado é o novo item.
- **H-39** — Sem estoque na abertura do link ou do checkout, a solicitação vai para CANCELADA com motivo estoque esgotado e o comprador é avisado. (A validar)
- **CA: A troca só é oferecida com pedido pago, evento não encerrado e abertura vigente; caso contrário o motivo é exibido** — Critério de aceite comum de configuração.
- **CA: Só itens da abertura Pós-venda aparecem como destino** — Critério de aceite de catálogo.
- **CA: Só aparece o lote vigente; com dois lotes vigentes, os dois aparecem para escolha** — Critério de aceite de catálogo.
- **CA: Atendimento, Admin da organização e Admin Ingresse executam e cancelam; só Admin Ingresse reprocessa** — Critério de aceite Backstage.
- **CA: O painel lista as solicitações dos dois canais com status correto e ações conforme o estado** — Critério de aceite Backstage.

### Troca de titularidade

- **§8 E3 conta válida** — Conta ativa, com os dados obrigatórios exigidos pelo item.
- **§11.3 visualização da cadeia** — A tela mostra o comprador original e todos os possuidores em ordem, com data, canal, autor e valor de cada troca.
- **V05** — Pedido não pago ou item inativo (E1): "Este item não pode ter o possuidor alterado: {pedido pendente / cancelado / reembolsado}."
- **V06** — Check-in realizado ou kit retirado (E1): "Este item já foi utilizado e não pode mudar de possuidor."
- **V10** — Conta inativa ou incompleta (E3): "A conta do novo participante não está apta a receber este item: {motivo}."
- **V13** — Limite por documento/usuário (E3): "O novo participante atingiu o limite de aquisição deste item."
- **V16** — Falha ao gerar a cobrança (E5): "Não foi possível gerar a cobrança por {motivo}. Nenhuma alteração foi feita. Tente novamente."
- **§14 painel de solicitações** — Existe um painel de solicitações com colunas Solicitação, tipo, pedido, item, possuidor atual → novo possuidor, total, status, criada em, expira em e responsável.
- **C06** — Item com check-in realizado: a ação Trocar titular aparece indisponível com V06.
- **C15** — Inscrição da categoria 60+ para participante de 30 anos: a troca é bloqueada com V12 antes de qualquer cobrança.
- **H-05** — Item com check-in realizado ou kit retirado não pode mudar de possuidor.

### Troca de perguntas do formulário

- **§6.1** — A ação é bloqueada quando o pedido não está pago.
- **§6.1** — A ação é bloqueada quando o item está cancelado ou reembolsado.
- **§6.1** — A ação é bloqueada quando o kit foi retirado ou o check-in foi realizado.
- **E2** — Para cada pergunta o operador vê se a pergunta é obrigatória.
- **E3** — Pergunta obrigatória não pode ficar em branco.
- **E3** — Pergunta usada como critério de segmentação do item: o sistema revalida a elegibilidade do possuidor com a nova resposta e bloqueia a alteração se ele deixar de ser elegível.
- **§12** — Painel de solicitações compartilhado com a Troca de item, com colunas: solicitação, tipo, pedido, possuidor, respostas alteradas, total, status, criada em, expira em, responsável.
- **V04** — Pedido não pago ou item inativo, em E1: "Este item não pode ser alterado: {pedido pendente / item cancelado / item reembolsado}."
- **V06** — Kit retirado ou check-in realizado, em E1: "Este item já foi utilizado; as respostas não podem mais ser alteradas."
- **V09** — Pergunta obrigatória em branco, em E3: "Responda todas as perguntas obrigatórias para continuar."
- **V10** — Nova resposta tira a elegibilidade, em E3/E6: "Com essa resposta o possuidor deixa de atender ao critério do item: {critério}. Para mudar de item, use a Troca de item."
- **V14** — Falha ao gerar a cobrança, em E5: "Não foi possível gerar a cobrança por {motivo}. Nenhuma alteração foi feita. Tente novamente."
- **H-05** — Item com check-in realizado ou kit retirado não pode ter respostas trocadas.
- **H-22** — O acesso do operador a respostas com dado sensível (saúde, contato de emergência) fica registrado no histórico do item. (A validar)
- **H-39** — Se não houver estoque na abertura do link, a solicitação vai para CANCELADA com motivo estoque esgotado, e o comprador é avisado. (A validar)
- **C03** — Estoque esgotado ao abrir o link: a solicitação vai para CANCELADA com motivo estoque esgotado, nada é cobrado e a resposta continua M.
- **C11** — Pergunta que define elegibilidade: item restrito à faixa 60+ com resposta 60+, alterar para 30–39 é bloqueado com V10 e o operador é orientado a usar a Troca de item.
- **C13** — Kit já retirado: ao abrir o pedido, a ação Trocar respostas aparece indisponível com V06.


## O que foi feito depois do levantamento

### Removido

| Regra nossa | Por quê |
| --- | --- |
| Prazo de 24 horas de antecedência para troca | Nenhuma EF prevê antecedência: o período vem do encerramento do evento e da abertura Pós-venda |
| Envio do link por WhatsApp | §25 da EF de troca põe o envio automático fora do escopo; §15 define e-mail |
| Criação de conta dentro do fluxo | §4 e §18 da EF de titularidade põem fora do escopo, e o formulário coletava gênero e vínculo de sócio, que são o que a segmentação usa para bloquear |
| Rascunho de alteração | Nenhuma EF menciona, e a máquina de estados começa em AGUARDANDO PAGAMENTO: não existe nada antes da solicitação criada com cobrança. A reunião de 14/10 também não tratou do assunto |

### Corrigido para seguir a especificação

| Regra | O que mudou |
| --- | --- |
| H-06 | Pagamento aprovado com revalidação reprovada agora estorna integral e termina em REPROVADA. Havia um `aguardando-financeiro` no lugar, fora da máquina documentada |
| H-07 | O motivo não vem mais pré-marcado: com a categoria já escolhida, todo histórico saía "Pedido do cliente" por omissão |
| §8, elegibilidade | O catálogo de troca validava contra a unidade de mesmo tipo, não contra a que receberia o item |

### Mantido como decisão de protótipo, declarada

Lote de unidades numa solicitação e cobrança endereçada ao destinatário: as duas foram
confirmadas na reunião de 14/10, então deixam de contar como invenção.

`PRAZO_DEMO_SEGUNDOS = 60` contra os 15 minutos da EF: deliberado, para a expiração ser visível
numa demonstração.

"Registrar pagamento recebido": a reunião decidiu que não é regra de produto, é controle só do
protótipo, e pediu aparência propositalmente fora do design. **A aparência ainda não foi feita.**

### Em aberto, sem decisão

Cobrança da transferência multiplicada pela quantidade · pareamento N→N por valor · exigência de
mesma quantidade entrando e saindo · `valorPago` pós-troca igual ao maior entre pago e preço novo ·
"sessão realizada" bloqueando só a troca · a ausência do conceito de abertura de vendas no canal
Pós-venda, que é a maior lacuna isolada das EFs.
