# Questionário: regras

> **Rotas:** `/backstage/catalogo/questionario` e `/backstage/catalogo/questionario/:id` (`nova` para criar)
> **No menu:** Backstage › menu do evento › Itens › Questionário (desktop e mobile).
> **Versão em uso:** única (`questionario/`)
> **Revisado em:** 2026-11-08 (primeira versão)

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

Perguntas do evento que quem compra responde, uma vez por ingresso ou combo, na compra e na
transferência. Principal uso: o formulário do atleta em eventos esportivos. Cada pergunta escolhe
em quais ingressos e combos aparece; perguntas que se repetem são vinculadas a vários itens, e as
exclusivas, só ao item delas. Responder, editar na Carteira e o relatório de respostas ficam fora
desta pasta (o relatório já existe em Relatórios › Respostas do questionário).

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Perguntas | `Evento.perguntas` (`Pergunta`), na ordem do formulário | sim (`salvarPerguntas`) |
| Edição na carteira | `Evento.edicaoNaCarteira` (início, fim, ids das perguntas); `null` desligada | sim (`salvarEdicaoNaCarteira`) |
| Ingressos e combos para escolher | sessões, setores e combos do evento (`useCatalogo`) | não |

Decisões do Victor (08/11/2026): a pergunta vive no evento (de um evento para o outro há
variações); é respondida por ingresso ou combo; na compra e na transferência e, se a edição geral
estiver ligada, editada na Carteira dentro da janela e só nas perguntas escolhidas; opções podem ter estoque; tipos: texto curto, texto longo, opção única,
múltipla escolha, número, telefone e anexo.

## Regras

- **QST-01** Título "Questionário" e subtítulo "Perguntas que quem compra responde, uma vez por ingresso ou combo." (UI-VIS-014); "Nova pergunta" no topo quando já há perguntas. Vazio: "Nenhuma pergunta ainda" com "Nova pergunta". Carregando: esqueleto. _(pages/Questionario.tsx)_
- **QST-02** A lista é a ordem do formulário. Cada linha: alça de arrastar (setas no teclado), título que abre a pergunta (a linha inteira é clicável), tipo, Obrigatória ou Opcional, "Editável na carteira" quando vale e onde aparece ("Aparece em 60 ingressos em 7 setores e 2 combos"), sem símbolo separador (UI-TXT-010). Sem item: "Não aparece em nenhum ingresso ou combo", em aviso. Ações na linha: Duplicar e Excluir; sem lápis, porque a linha já abre a pergunta (UI-VIS-016). Mover grava na hora. _(pages/Questionario.tsx)_
- **QST-03** Acima de 8 perguntas, busca pelo texto com "N de M". Na busca a alça some e o contador diz "Limpe a busca para mudar a ordem." _(pages/Questionario.tsx)_
- **QST-04** Duplicar cria "Cópia de <pergunta>" logo abaixo, com as mesmas opções e itens, sem confirmação, com toast. Excluir pede confirmação ("Ela sai do formulário de todos os ingressos e combos. Esta ação não pode ser desfeita."), na lista e na página. _(pages/Questionario.tsx, pages/PerguntaDetalhe.tsx)_
- **QST-05** A pergunta abre como página (não modal): tem três seções e escolher itens abre um slideout por cima (UI-NAV-001, UI-NAV-002). Rascunho com barra de salvar e confirmação ao sair, como o detalhe do ingresso. Pergunta que não existe: "Pergunta não encontrada". _(pages/PerguntaDetalhe.tsx)_
- **QST-06** Seção Pergunta: texto obrigatório (até 200 caracteres, "Escreva a pergunta.") e tipo de resposta; sem texto de apoio (decisão do Victor, 08/11/2026). Opção única e múltipla escolha mostram as opções (nome e estoque, vazio é "Sem limite", 0 mostra "Esgotada"), começam com duas vazias e somem ao trocar para outro tipo. Erros: "Crie pelo menos 2 opções.", "Dê um nome a cada opção.", "Duas opções têm o mesmo nome." (sem diferenciar maiúsculas). No celular, nome em cima e estoque embaixo (UI-MOB-004). _(pages/PerguntaDetalhe.tsx, data/questionario.ts)_
- **QST-07** Seção Onde aparece: Ingressos abre o slideout agrupado por sessão e setor das aberturas (ABV-04), com "Ingressos criados depois não entram sozinhos."; Combos abre o seletor de lista (ITM-35). Sem item: aviso "Sem ingressos nem combos, a pergunta não aparece para ninguém.", sem bloquear o salvar. Grava só os itens marcados. _(pages/PerguntaDetalhe.tsx)_
- **QST-08** Seção Resposta: "Obrigatória" ("Sem resposta, a compra não termina."). Pergunta nova nasce obrigatória. A edição na carteira não fica na pergunta: é geral (QST-10). _(pages/PerguntaDetalhe.tsx)_
- **QST-09** Salvar: "Pergunta criada." (vai para a página dela) ou "Alterações salvas."; com erro de campo, "Corrija os campos destacados para salvar." e a seção marcada; falha, "Tente de novo: não foi possível salvar." _(pages/PerguntaDetalhe.tsx)_
- **QST-10** Edição na carteira é geral do evento (`Evento.edicaoNaCarteira`: início, fim e perguntas), decisão do Victor em 08/11/2026. Cartão no topo da lista: desligada, "Desligada. Depois da compra, as respostas não mudam." com "Configurar"; ligada, estado (Aberta agora, Agendada, Encerrada, pela hora atual), "De <início> até <fim>" e "N perguntas podem mudar" (com os nomes até 3), com "Editar" e "Desligar" (grava na hora, toast com "Desfazer"). _(components/EdicaoNaCarteira.tsx, pages/Questionario.tsx)_
- **QST-11** "Configurar" e "Editar" abrem um slideout (tela cheia no celular) com Começa em, Termina em e "Perguntas que podem mudar" marcadas ali mesmo, sem outro overlay (UI-NAV-002); acima de 8 perguntas, busca, "N de M" e "Marcar todas as N". Erros: "Escolha data e hora.", "Escolha um fim depois do começo.", "Marque pelo menos uma pergunta." Grava as perguntas na ordem do questionário. _(components/EdicaoNaCarteira.tsx)_
- **QST-12** A linha da pergunta mostra "Editável na carteira" quando ela está na edição geral. Pergunta excluída sai da edição. _(pages/Questionario.tsx, components/EdicaoNaCarteira.tsx)_
- **QST-13** Formulário da pergunta sem accordion: três cartões abertos (UI-FRM-006); salvar com erro rola até o primeiro campo inválido. _(pages/PerguntaDetalhe.tsx, itens/components/comuns.tsx)_

## Depende de / afeta

- **Depende de:** evento em contexto e catálogo (`itens/`); seletores `SeletorDeIngressos` (aberturas) e `SeletorDeLista` (itens).
- **Afeta:** **ainda não** afeta a compra: checkout, transferência e Carteira não leem `Evento.perguntas`. `TipoIngresso.perguntas` (ids) é antigo e não é usado.

## Em aberto

- Produtos recebem perguntas? Hoje só ingressos e combos (resposta do Victor citou só os dois).
- Ingresso ou combo criado depois não entra sozinho nas perguntas; avisar no cadastro do item? A combinar.
- Mudar ou excluir pergunta já respondida: o que acontece com as respostas no relatório? Confirmar com o back.
- A janela da edição na carteira é por datas fixas; confirmar se o produto quer prazo relativo (ex.: até X dias antes do evento).
- Estoque da opção: o protótipo não mostra quantas já foram escolhidas (depende das respostas).
- Ligar o checkout, a transferência e a Carteira (`carteira-web`, `marketplace/selecao-e-atribuicao`) a `Evento.perguntas`.

## Fontes

- Protótipos anteriores: `marketplace/selecao-e-atribuicao` (`PerguntaEvento` com vínculos) e `carteira-web` (tipos e opções com estoque).
- Referências: Posh (limitar pergunta a ingressos), Cal.com (criar pergunta), via Mobbin.
