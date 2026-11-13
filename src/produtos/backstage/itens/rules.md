# Itens (catálogo do evento): regras

> **Rotas:** `/backstage/catalogo/ingressos`, `/backstage/catalogo/configuracoes`, `/backstage/catalogo/ingressos/:id` (`novo`), `/backstage/catalogo/produtos`, `/backstage/catalogo/produtos/:id` (`novo`), `/backstage/catalogo/combos`, `/backstage/catalogo/combos/:id` (`novo`), `/backstage/catalogo/agenda`
> **No menu:** Backstage › menu do evento › Itens (página única com as abas Ingressos, Produtos e Combos, e os botões Aberturas de vendas e Configurações no topo; `backstage/rules.md` BKS-17; Aberturas de vendas tem regras em `aberturas-de-vendas/rules.md`).
> **Versão em uso:** `itens/` (redesign de 08/11/2026). A versão anterior (`ingressos/`, `aberturas-de-vendas/`, `catalogo/`) saiu do menu e fica em `/backstage/catalogo-anterior/*`.
> **Revisado em:** 2026-11-12

> **Página única (12/11/2026):** Ingressos, Produtos, Combos e Configurações são abas da página Itens, junto com Aberturas de vendas (`backstage/rules.md` BKS-17). Cada tela perdeu o título próprio (vira `h2` só para leitor de tela) e mantém descrição e ações.

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

Catálogo do evento para self-service: o **item é o centro**. Tudo o que define o que é vendido
(preço, lotes, estoque, regras de venda, visibilidade, acesso, perguntas) é visto e editado a
partir do item, numa página só. Nasceu da critique do catálogo anterior (nota 50/100: item não
editável, configuração espalhada em 7+ telas, estados contraditórios, setor por texto livre).

Decisões de produto (Victor, 08/11/2026):
- Combo é um pacote de itens já existentes do evento, vendidos juntos com preço definido pelo combo.
- Produto é da organização (biblioteca reaproveitada entre eventos); cada evento escolhe quais vende.
- Self-service para qualquer produtor e qualquer tipo de evento.
- Tudo do item pode ser configurado e alterado, mesmo depois de vender.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Sessões, setores, ingressos e lotes | `@/plataforma` (documento do evento, `sessoes`) | sim (`salvarSessoes`) |
| Capacidade, acesso e tipo de acesso do setor | `Grupo.capacidade` (obrigatória), `Grupo.acesso` (opcional), `Grupo.tipoAcesso` (`qr` ou `facial`, obrigatório) | sim |
| Campos avançados do ingresso | `TipoIngresso.itemVendido`, `.transferencia`, `.portador`, `.vendaVinculada`, `.segmentos`, `.taxas`, `.chaves`; `Lote.dataLimite`, `Lote.chaves` | sim |
| Chaves de acesso | `data/exemplos.ts` (`CHAVES_DE_EXEMPLO`, 600 códigos fictícios), no lugar de Marketing › Chave de acesso | não |
| Segmentações | menu Público da organização (`SEGMENTACOES` de `publico/components/DecisaoModal`) | não |
| Regras de venda | `TipoIngresso.vendas` (mínimo e máximo por pedido); o mesmo em produto e combo. `inicio`, `fim`, `canais`, `publico`, `visivel` e `perguntas` seguem no modelo, mas o catálogo não lê nem edita | sim |
| Biblioteca de produtos | `Organizacao.produtos` (nome, descrição, imagem, preço sugerido, `vendas`), editada em Produtos da organização; sem ela, 4 produtos iniciais de exemplo (`data/catalogo.ts`) | sim (`salvarBiblioteca`) |
| Produtos do evento | `Evento.produtos` (`ProdutoNoEvento`: preço, estoque, `transferencia`, ativo) | sim (`salvarProdutosDoEvento`) |
| Combos | `Evento.combos` | sim (`salvarCombos`) |
| Vendidos por lote | `@/plataforma` (`useVendidos`) | não |

## Regras

### Ingressos (lista)
- **ITM-01** Cada setor é um cartão com nome, "N de M vendidos", capacidade ("Capacidade de N") e acesso ("Entrada: Portão A, com código QR", ou só "Código QR" sem portão), sem símbolo separador. Com mais de uma sessão, os setores ficam sob o título da sessão; com uma só, o título some. _(pages/Ingressos.tsx)_
- **ITM-02** Cada ingresso é uma linha clicável (abre o detalhe) com nome, estado (badge só quando foge do normal: À venda e Pausado o toggle já diz; ITM-12), lote à venda, regras de venda em uma frase, "N chaves de acesso" quando o ingresso ou algum lote tem chave, preço (faixa "R$ 220 a R$ 264" quando há lotes com preços diferentes, sem centavos quando inteiro) e "vendidos de total". _(pages/Ingressos.tsx)_
- **ITM-03** O toggle da linha pausa ou volta a vender na hora, grava e mostra "<ingresso> pausado. Ele para de vender na hora." ou "<ingresso> voltou a vender.", com "Desfazer", igual ao toggle do detalhe (ITM-32). Área de toque de 44 px em volta do toggle e da caixa de seleção, sem mudar o desenho (WCAG 2.5.8). _(pages/Ingressos.tsx)_
- **ITM-04** "Novo setor" e o lápis do setor abrem o modal do setor: nome obrigatório e único na sessão (sem diferenciar maiúsculas), "Como as pessoas entram" obrigatório (Código QR ou Reconhecimento facial; vale para todos os ingressos do setor; sem escolha, "Escolha como as pessoas entram neste setor."), capacidade obrigatória (inteiro maior que zero; vazia, "Informe a lotação do setor.") e acesso na portaria opcional. Como tipo de acesso e capacidade são obrigatórios, não existe setor sem eles: os setores de exemplo gravados antes da regra são lidos como código QR e com a capacidade igual à soma dos lotes (`comTipoDeAcesso`), e a próxima gravação salva os campos. Remover setor só sem ingressos, com "Desfazer" no toast. Fim do setor criado por texto livre. Os modais do setor e das ações em lote têm o título como nome acessível. _(pages/Ingressos.tsx)_
- **ITM-05** Se a soma dos lotes do setor passa da capacidade, o cartão mostra "Os lotes somam N, acima da capacidade de M. Ajuste os lotes ou a capacidade." _(pages/Ingressos.tsx)_
- **ITM-06** "Criar ingresso" abre o detalhe em modo novo; "Novo ingresso no setor" já vem com o setor escolhido. _(pages/Ingressos.tsx)_
- **ITM-08** A ordem dos setores na sessão e dos ingressos no setor é a ordem do fluxo de compra. Ordena-se arrastando pela alça de 6 bolinhas (padrão do Backstage), que aparece no hover do setor ou do ingresso no desktop e fica sempre visível no toque. Pelo teclado: foco na alça e setas para cima e para baixo (alternativa a arrastar, WCAG 2.5.7). Soltar grava na hora e mostra "Ordem salva. A compra já mostra a nova ordem." com "Desfazer". Com filtro ativo não há alça (a posição ficaria ambígua); setor com um só ingresso não mostra alça no ingresso, mas guarda o espaço dela, para a caixa de seleção e o nome alinharem com os outros setores. No celular, preço, vendidos e o toggle descem alinhados ao nome. _(pages/Ingressos.tsx, components/Alca.tsx)_
- **ITM-09** O toggle da linha tem o rótulo visível "À venda" acima dele, como Preço e Vendidos ao lado (UI-FRM-005). _(pages/Ingressos.tsx)_
- **ITM-07** Estados: carregando (esqueleto), sem setor ("Crie o primeiro ingresso" com "Novo setor"), setor sem ingresso ("Nenhum ingresso neste setor."), filtro sem resultado ("Nenhum ingresso encontrado" com "Limpar filtros" no próprio vazio). _(pages/Ingressos.tsx)_

### Escala de 1 a milhares (UI-LST-001)
- **ITM-80** Busca e filtros (estado, sessão, setor) e a contagem "N de M" só aparecem com mais de 8 itens; com poucos itens, nada sobra. _(components/escala.tsx)_
- **ITM-81** Com várias sessões, cada sessão é recolhível com a contagem no título ("Sessão de 17 de outubro de 2026 às 22:00, 40 ingressos"); as duas primeiras começam abertas. Setor com mais de 20 ingressos mostra os primeiros e "Mostrar mais 20" com "Faltam N itens". _(pages/Ingressos.tsx, components/escala.tsx)_
- **ITM-82** Seleção múltipla (só com mais de 1 item): caixa em cada linha e, ao selecionar, a barra de lote com "N selecionados", "Selecionar todos os N do filtro" e "Limpar seleção". Ingressos: Pausar, Voltar a vender, Ajustar preço e Aplicar regras de venda, numa gravação só, com toast no plural e "Desfazer". Pausar pede confirmação com o número e o efeito ("Pausar 300 ingressos?", "Eles param de vender na hora, em todas as aberturas. Dá para desfazer logo depois."). Trocar filtro limpa a seleção. _(pages/Ingressos.tsx, components/escala.tsx)_
- **ITM-83** Ajustar preço em lote: aumentar ou diminuir, em porcentagem ou em reais (campos com rótulo visível; o valor começa vazio e "Aplicar preço" só libera com um número), só o lote à venda ou todos os lotes, com prévia de antes e depois de até 3 ingressos e "E mais N ingressos." _(pages/Ingressos.tsx)_
- **ITM-84** Aplicar regras de venda em lote substitui as regras de cada ingresso selecionado. "Aplicar regras" só libera depois de mexer nos campos: aplicar o formulário intocado apagaria os limites de todos sem a pessoa perceber. _(pages/Ingressos.tsx)_
- **ITM-85** `?escala=N` (até 5.000) abre, para a sessão do navegador, um catálogo simulado com N ingressos em sessões diárias de 40, setores (QR e facial), chaves de exemplo em ingressos e lotes, produtos e combos, só na memória; a faixa "Catálogo simulado… Nada do que você mudar aqui é gravado." tem "Sair da simulação" (`?escala=0` também sai). Nenhuma gravação acontece nesse modo. _(data/catalogo.ts, components/escala.tsx)_
- **ITM-86** Produtos: busca, filtro de estado, seleção e lote com Pausar, Voltar a vender e Remover do evento (confirmação no plural: "Remover 12 produtos do evento?"). O seletor "Adicionar produtos" ganha busca, "N de M", "Selecionar todos os N da busca" e "Mostrar mais" acima do limiar. _(pages/Produtos.tsx)_
- **ITM-87** Combos: busca (também por item, setor e sessão), filtro de estado, seleção e lote com Pausar, Voltar a vender e Excluir. O seletor "Adicionar itens" tem filtros de sessão e setor, contexto em cada ingresso ("Pista, sessão de 18 de out."), "Selecionar todos os N do filtro" e "Mostrar mais" por seção. Na composição, ingressos de mesmo nome levam setor e sessão entre parênteses. _(pages/Combos.tsx, pages/ComboDetalhe.tsx)_

### Estados (um nome por estado)
- **ITM-10** Item: À venda, Esgotado, Pausado (desligado ou sem lote ligado), Sem estoque. O item não tem período próprio: quando vende é decidido pelo lote ligado e pela abertura de vendas. Lote mostra só "Esgotado"; o resto o toggle diz. _(data/catalogo.ts, data/textos-itens.ts)_
- **ITM-12** Na lista de ingressos, o estado considera as aberturas de vendas (`estadoComAbertura`): ligado e com lote à venda só fica "À venda" dentro de uma abertura que inclui o ingresso; com abertura futura, "Agendado" e a linha "Abre em <data e hora>"; com todas já passadas, "Vendas encerradas"; sem abertura, "Sem abertura de vendas". Assim a lista concorda com o alerta "Nada programado para entrar à venda" (GDC-10). O filtro de estado lista só estados que existem: À venda, Agendado, Sem abertura de vendas, Vendas encerradas, Pausado, Esgotado e Sem estoque. _(data/catalogo.ts, pages/Ingressos.tsx)_
- **ITM-11** Só um lote vende por vez: o lote ligado ("À venda") que ainda tem saldo. Não há data limite, pausa separada nem virada automática para o próximo lote. _(plataforma/regras.ts, pages/IngressoDetalhe.tsx)_

### Detalhe do ingresso
- **ITM-20** Uma página com cartões sempre abertos e com título, como Criar evento: Informações, Preço e lotes e Vendas; só Avançado fica recolhido (Accordion do DS, "Já vêm preenchidas. Mude só se precisar."), por ser opcional e raro (UI-FRM-006). Salvar com erro rola até o primeiro campo inválido. O topo segue ITM-32, com "<lote> à venda por <preço>." e os números do estoque (ITM-34) de subtítulo. Sem Acesso na portaria (é do setor, ITM-04), sem Perguntas ao comprador (configuradas em outro lugar) e sem Visibilidade (o ingresso só aparece no fluxo de compra). _(pages/IngressoDetalhe.tsx, components/comuns.tsx)_
- **ITM-21** Informações: nome (obrigatório, até 70 caracteres com contador), item vendido (Ingresso, Check-in ou Pacote), tipo (Inteira ou Meia-entrada), transferência (Sempre permitir, Nunca permitir, Somente na compra), setor e descrição (até 1.000 caracteres com contador). Até 8 setores, o setor é uma lista; acima disso, um campo com busca, com a sessão como texto de apoio (UI-LST-001). _(pages/IngressoDetalhe.tsx)_
- **ITM-22** Lotes: nome, preço e quantidade editáveis na própria linha; toggle "À venda" no cabeçalho do lote (rótulo visível, UI-FRM-005) e remover. Ligar um lote desliga o que estava vendendo e avisa "Ao salvar, <anterior> deixa de vender e <lote> passa a vender. Só um lote vende por vez."; desligar deixa nenhum lote vendendo; lote esgotado não liga. Lote novo entra desligado (o primeiro, ligado). "Chaves do <lote>" vincula chaves só àquele lote. Lote com vendas não pode ser removido; a quantidade não fica abaixo do vendido. Sem ordem (subir e descer), sem "Pausar" e sem "Parar de vender numa data". No celular, cada lote é um cartão empilhado. _(pages/IngressoDetalhe.tsx)_
- **ITM-23** A seção de lotes diz só "Só um lote vende por vez." e, com vendas, "As mudanças valem para as próximas vendas." _(pages/IngressoDetalhe.tsx)_
- **ITM-24** A conferência de capacidade usa o rascunho: o aviso aparece enquanto se edita. _(pages/IngressoDetalhe.tsx)_
- **ITM-27** Avançado: Tipo de portador (Somente o usuário ou Usuário e dependentes), Venda vinculada (só compra quem levar um dos ingressos escolhidos; o seletor mostra setor e sessão de cada um), Segmentação (públicos do menu Público da organização) e Pagamento de taxas (Comprador ou Organização). _(pages/IngressoDetalhe.tsx)_
- **ITM-28** Transferência forçada: com dependentes, fica em Nunca permitir; com segmentação, em Somente na compra. O campo fica desabilitado com a dica do motivo, e o valor forçado é o que se grava. _(pages/IngressoDetalhe.tsx)_
- **ITM-29** Chaves de acesso no ingresso (Vendas › "Vincular chaves") ou no lote, pelo seletor de lista (busca, "N de M", "Selecionar todos os N do filtro", "Mostrar mais 50"). Não existe "Quem pode comprar": vincular chave já restringe quem vê e compra. O resumo de Vendas diz "… N chaves de acesso vinculadas." _(pages/IngressoDetalhe.tsx, components/SeletorDeLista.tsx)_
- **ITM-26** Remover ingresso só sem vendas, com confirmação; com vendas, a tela explica que é preciso desligar À venda. _(pages/IngressoDetalhe.tsx)_

### Regras de venda e visibilidade (ingresso, produto e combo)
- **ITM-30** A única regra de venda é "Limitar quantidade por pedido" (mínimo e máximo; o mínimo não passa do máximo). Sem regra, o resumo fica vazio: o padrão não vira frase (UI-TXT-011). Sem datas de início e fim no item: a venda é controlada pelo lote e pela abertura de vendas. _(components/comuns.tsx)_
- **ITM-31** Itens (ingresso, produto e combo) não têm "Onde vende", "Quem pode comprar" nem "Mostrar na página do evento": o item só aparece no fluxo de compra, e quem compra é restringido por chave de acesso (ITM-29). _(components/comuns.tsx)_
- **ITM-32** Detalhe de ingresso, produto e combo usam o mesmo cabeçalho (`CabecalhoDoItem`): voltar, título e um subtítulo, com o toggle "À venda" na mesma linha do título, à direita (também no celular, área de toque de 44 px). Ele grava na hora, como o toggle da lista, com toast ("<item> à venda." ou "<item> pausado. Ele para de vender na hora.") e "Desfazer"; o resto do rascunho continua. Item novo: entra no rascunho. O badge só aparece para Esgotado e Sem estoque; ligado sem vender mostra o motivo ("Ligado, mas nenhum lote está à venda: ligue um lote em Preço e lotes."). _(components/comuns.tsx, pages/IngressoDetalhe.tsx, pages/ProdutoDetalhe.tsx, pages/ComboDetalhe.tsx)_ (UI-VIS-015)
- **ITM-33** "N chaves de acesso" na linha do ingresso (chaves distintas do ingresso e dos lotes) abre a consulta só de leitura: "Todo o ingresso" e um grupo por lote com a contagem, códigos em grade que quebra linha, busca acima de 8 chaves, "Mostrar mais 50" por grupo e "Editar no ingresso". _(components/VerChaves.tsx, pages/Ingressos.tsx)_
- **ITM-34** O ingresso mostra disponíveis, pendentes e vendidos, no topo e em cada lote ("120 disponíveis, 8 pendentes e 372 vendidos."), numa frase, sem separador (UI-TXT-010). Pendentes são compras aguardando pagamento ou reservadas, criadas há menos de 15 minutos (`PRAZO_DA_COMPRA_PENDENTE_MIN`, padrão do back); só aparecem quando há, e no topo têm um tooltip com o prazo. A compra pendente segura o ingresso: disponíveis = quantidade − vendidos − pendentes, e lote e ingresso esgotam quando vendidos + pendentes chegam à quantidade (o mapa `vendidos` do catálogo já soma os dois; `pagosDoLote` separa). A quantidade do lote não fica abaixo de vendidos + pendentes, e lote com pendente não é removido. Na lista, "Vendidos" conta só os pagos. _(data/catalogo.ts, pages/IngressoDetalhe.tsx, pages/Ingressos.tsx, plataforma/regras.ts, plataforma/vendidos.ts)_
- **ITM-35** Escolher em lista (chaves de acesso, venda vinculada, produtos e combos da abertura) é sempre o mesmo slideout (`SeletorDeLista`): à direita no desktop, tela cheia no celular, com busca, "N de M", "Selecionar todos os N do filtro", Todos ou Selecionados acima de 8 opções, 50 por vez e "N selecionados" no rodapé (UI-NAV-001, UI-LST-001). _(components/SeletorDeLista.tsx)_

### Salvar
- **ITM-42** Um só campo de preço no catálogo (`CampoPreco`, prefixo "R$" do DS); com `opcional`, vazio vale "usa o preço base", diferente de R$ 0 (UI-DS-003). _(components/comuns.tsx)_
- **ITM-43** Datas, números e plurais usam o idioma do contexto (`useTextosItens`: `plural`, `dataLonga`, `dataCurta`, `quando`); nada de "pt-BR" fixo nas telas (UI-TXT-009). _(data/textos-itens.ts)_
- **ITM-40** Edição em rascunho: a barra "Alterações não salvas" com Descartar e Salvar alterações aparece quando há mudança, no fundo da página e na largura da área de conteúdo. Salvar grava e mostra "Alterações salvas."; erro mostra "Tente de novo: não foi possível salvar as alterações." _(components/comuns.tsx)_
- **ITM-41** Voltar com mudança pede confirmação ("Sair sem salvar?"). Tentar salvar com erro destaca a seção e mostra "Revise os campos destacados para salvar o ingresso." _(pages/IngressoDetalhe.tsx)_

### Produtos
- **ITM-50** A lista mostra os produtos escolhidos para o evento: imagem, nome, preço no evento, "N disponíveis" e estado. No celular, a linha empilha. _(pages/Produtos.tsx)_
- **ITM-51** "Adicionar produtos" abre o seletor da biblioteca da organização: busca, imagem, nome, preço base e marcação; os que já estão no evento aparecem marcados e desabilitados ("Já no evento"); rodapé "N selecionados". O produto entra pausado, com estoque 0, até o produtor definir estoque e ligar. "Criar produto na organização" leva a Produtos da organização (`/backstage/produtos/novo`). _(pages/Produtos.tsx)_
- **ITM-52** Produto no evento: só o que é do evento. Topo com imagem e nome (ITM-32); um cartão com Preço (vazio usa o preço sugerido), Estoque e Transferência (Sempre permitir, Nunca permitir, Somente na compra); "Editar produto na organização" (leva a Produtos da organização, com confirmação se houver mudança) e "Remover do evento". Nome, descrição, imagem, preço sugerido e quantidade por pedido ficam em `produtos-organizacao/`. _(pages/ProdutoDetalhe.tsx)_
- **ITM-53** Vazio: "Nenhum produto neste evento" com "Adicionar produtos". _(pages/Produtos.tsx)_

### Combos
- **ITM-60** A lista mostra nome, composição em uma frase do idioma ("1 Inteira, 2 Copo oficial e 1 Sacochila"), preço, "R$ X a menos que avulso" (só se mais barato), "N disponíveis" e estado. _(pages/Combos.tsx)_
- **ITM-61** Detalhe do combo: Nome e descrição; O que vem no combo (itens com quantidade −/+, preço avulso e remover; "Adicionar itens" abre o seletor com ingressos por setor, com preço do lote à venda e disponíveis, e produtos do evento); Preço (compara com o avulso e mostra a economia; avisa, sem bloquear, quando o combo fica mais caro); Estoque ("Dá para vender N combos", o item que limita, aviso de item esgotado ou pausado e limite próprio opcional); Vendas; topo conforme ITM-32; "Excluir combo" com confirmação ("Os itens do combo continuam à venda separadamente."). _(pages/ComboDetalhe.tsx)_
- **ITM-62** Combos disponíveis = o menor entre (disponível de cada item ÷ quantidade no combo) e o limite do combo. Item pausado ou esgotado zera o combo. _(data/catalogo.ts)_
- **ITM-63** Validação: nome obrigatório, pelo menos um item e preço ≥ 0; ao salvar com erro, a seção com erro abre e aparece "Revise os campos destacados para salvar o combo." _(pages/ComboDetalhe.tsx)_
- **ITM-64** Vazio: "Nenhum combo ainda"; se o evento não tem ingresso nem produto, o vazio pede para criar ingressos ou adicionar produtos primeiro, e "Criar combo" some. _(pages/Combos.tsx)_
- **ITM-65** Ingressos recebe do Guia de configuração: o alerta "Nada programado para entrar à venda" abaixo do cabeçalho e `?novoSetor=1`, que abre o modal "Novo setor" ao chegar (`guia-de-configuracao/rules.md` GDC-10 e GDC-11). _(pages/Ingressos.tsx)_
- **ITM-66** Configurações de ingressos (`/backstage/catalogo/configuracoes`, página própria aberta pelo botão "Configurações" no topo de Itens, com "Itens" para voltar): compras em diferentes grupos (Permitir ou Proibir), estoque devolvido de lotes esgotados, troca de setor, reserva na compra, limite por comprador na Bilheteria online, política, acesso por face e QR code no e-mail. Ficam no bloco "Compra e acesso". Valem para o evento todo, começam no padrão da criação (`eventos/rules.md` EVT-59) e gravam na hora, com o toast "Configuração salva.". _(pages/Configuracoes.tsx, components/configuracoes-de-ingressos.tsx)_
- **ITM-88** "Permitir troca de setor" só aparece em evento de futebol com mapa de assentos (assento marcado); "Acesso por face" só aparece em evento de futebol. Nos outros eventos, as linhas não existem. _(components/configuracoes-de-ingressos.tsx)_
- **ITM-89** O nível acima do ingresso se chama **grupo**, não setor (grupo > ingresso > lote), em todo o Backstage menos Relatórios: Novo grupo, Editar grupo, "Nome do grupo", filtro Grupo, "60 ingressos em 7 grupos" no seletor de ingressos, "Crie os grupos do evento" no guia. O grupo mantém capacidade, acesso na portaria e tipo de acesso. Setor continua só onde é a área física: troca de setor no futebol, mapa ("com setores e acessos") e nomes como "Setor Visitante". O tipo de acesso "Reconhecimento facial" só existe no futebol; nos outros eventos o grupo entra por código QR e a escolha não aparece. _(pages/Ingressos.tsx e telas que mostram ingressos)_
- **ITM-90** Campo de preço (R$) com máscara: só dígitos, que entram pelos centavos ("1234" vira "12,34"), com separador de milhar e até R$ 9.999.999,99. Vale para todo campo de preço do Backstage que usa o mesmo componente (ingressos, produtos, combos, comissão em valor fixo, repasse). _(components/comuns.tsx `CampoPreco`)_
- **ITM-91** Salvar um ingresso, novo ou editado, volta para a lista de Itens › Ingressos, com o toast de salvo. _(pages/IngressoDetalhe.tsx)_
- **ITM-67** Limites por pessoa, em Configurações de ingressos: uma linha por categoria (Inteira, Meia-entrada, Gratuidade, Convidado, Sócio torcedor só no futebol, Ingresso ou Inscrição no esportivo, Combo, Produto), com o título no degrau dos títulos de linha (Text sm Semibold) e o controle segmentado "Sem limite" (padrão) ou "Limitar", com nome acessível "Limite de <categoria>". "Limitar" mostra deslizando o campo "Máximo de <categoria> por pessoa" (só dígitos, até 6, sem valor sugerido); grava ao sair do campo e só com número maior que zero. Sem número, o erro "Informe um número para salvar o limite." fica na tela e nada é gravado. "Sem limite" grava na hora. Toast "Limite salvo.". _(components/configuracoes-de-ingressos.tsx)_
- **ITM-68** Ingressos não tem "Criar ingresso" no topo: ingresso nasce dentro de um setor, pelo "Novo ingresso no setor" de cada cartão. O topo só tem "Novo setor" (primário). _(pages/Ingressos.tsx)_


## Depende de / afeta

- **Depende de:** evento em contexto (Eventos); banco `@/plataforma`; chaves fictícias de `data/exemplos.ts`.
- **Afeta:** link de compra e seleção só vendem ingresso ativo, no lote à venda (lote pausado agora fica de fora). Mínimo e máximo por pedido, chaves, venda vinculada, segmentação, portador, transferência e taxas **ainda não** são aplicados na compra nem no ingresso emitido; produtos e combos **ainda não** são vendidos no site nem no checkout.

## Em aberto

- ITM-12 vale só na lista de Ingressos. O detalhe do ingresso, os combos e as aberturas ainda usam o estado sem a abertura (`estadoDoIngresso`); levar o mesmo estado para lá. O checkout também ainda não lê as aberturas (`aberturas-de-vendas/rules.md`).

- LACUNA (ITM-34): o checkout do protótipo não respeita a reserva: o saldo do site ainda ignora os pendentes, e o pedido que expira não é cancelado. O status "reservado" ainda não existe no modelo; confirmar o nome com o back.

- Agenda de vendas (ITM-70, 71, 88) saiu em 08/11/2026: era montada das datas de cada item, que não existem mais. Quando vende é decidido em Aberturas de vendas e pelo lote ligado; `/backstage/catalogo/agenda` redireciona para Aberturas.
- Aplicar na compra as regras de venda (mínimo e máximo, chaves, venda vinculada, segmentação) e a transferência do produto.
- Quando o lote ligado esgota, nada vende até o produtor ligar outro (sem virada automática). Confirmar com Produto se deve abrir o próximo sozinho.
- Chaves vêm de uma lista fictícia; ligar a Marketing › Chave de acesso. Tipo de acesso (QR ou facial) ainda não chega à portaria.
- O significado de cada "Item vendido" (Ingresso, Check-in, Pacote) na dica é suposição; confirmar com Produto.
- Vender produtos e combos no checkout; hoje o estoque deles é só configuração (vendidos sempre 0).
- Hipótese a validar com Produto: o produto tem preço base na organização e o evento pode vender por outro.
- Hipótese a validar com Produto e Jurídico: mudanças valem para as próximas vendas; quem já comprou não é afetado.
- Variações de produto (tamanho da camiseta) não existem: cada variação vira um produto.
- Dados antigos com `canais`, `publico: "chave"` ou `visivel: false` continuam gravados, mas não aparecem nem valem mais; limpar numa migração.
- Mapa de assentos, cupons, Gerenciamento de cotas e Estratégias de venda ficam fora deste redesign.
- Remover um produto do evento não mexe nos combos que o incluem.
- Voltar pelo navegador não pede confirmação de saída (o app usa `BrowserRouter`, sem `useBlocker`).
- Dados de teste: o evento em contexto (Laroc) ficou com Camiseta oficial (estoque 50) e Sacochila, pausados.
- Caixas de seleção (Checkbox do DS) não marcaram com clique simulado no navegador de teste, só com teclado ou via script; o mesmo acontece no modal antigo de Duplicar. Conferir com clique manual.
- Arrastar com o mouse não foi testado automaticamente; o teclado (setas na alça) foi.
- Sem pesquisa com produtores: validar o protótipo com 5 a 8 produtores de portes diferentes (ver critique de 08/11/2026).

## Fontes

- Critique do catálogo anterior (08/11/2026) e respostas do Victor na mesma data.
- Referências Mobbin: Calendly (seções com resumo), Square (variações editáveis na linha), Shopify (seletor de itens), Flodesk (opções que aparecem ao ligar).
