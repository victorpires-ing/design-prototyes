# Auditoria de design mobile: aba de pedidos

Feita em 15/10/2026 a 390x844 (iPhone 14), sobre a lista, o detalhe e os três fluxos.
As medições são minhas, no browser; os defeitos foram levantados por quatro revisores, um por
superfície, e cada um passou por um cético que tentou derrubá-lo lendo o código.

## O estado medido

| Tela | Rolagem lateral | Altura | Alvos de toque | Abaixo de 44px |
| --- | --- | --- | --- | --- |
| Lista de pedidos | **59px** | 4621px | 39 | 14 |
| Detalhe do pedido | 0 | 2194px | 14 | **14** |
| Transferir, etapa 1 | 0 | 905px | 4 | **4** |
| Trocar, etapa 2 | 0 | 1033px | 11 | 6 |
| Editar formulário | 0 | 905px | 10 | **10** |

No detalhe, o primeiro item do pedido só aparece a **987px de rolagem**, 1,2 tela inteira.
As abas Itens e Histórico começam a 819px, logo abaixo da dobra. A capa do evento ocupa 199px.

Sobre os 44px: é a recomendação da Apple (a do Google é 48). Os botões `sm` e `xs` do Untitled
UI têm 36px, o que é escolha do design system e não erro nosso. O que está listado abaixo são
os alvos em que o tamanho vem da **ausência de padding na nossa linha**, não do componente:
radios de 20px, links de 20px, botões de copiar de 28px.

## Defeitos confirmados

27 no total: 10 altos, 14 médios, 3 baixos.

### Lista de pedidos

#### [alta] A fileira de paginação estoura 59px e é o único jeito de mudar de página

- **Onde:** pages/Pedidos.tsx:294-332. A nav é `flex items-center justify-between gap-1` sem `flex-wrap`. Soma dos filhos a 390px: Anterior (Button sm, px-3 + ícone 20 + texto, ~106px) + 5 números de `size-9` com `gap-0.5` (5x36 + 4x2 = 188px) + Próxima (~100px) + 2x gap-1 (8px) + px-4 do rodapé (32px) = ~434px de conteúdo. Bate com a medição: Próxima termina em x=450, overflow-x de 59px. Com ~112 pedidos e porPagina 25 são 5 páginas, e `paginasVisiveis` (linha 252) devolve os 5 números porque total <= 7.
- **Impacto:** Para alcançar Próxima o atendente arrasta a página inteira de lado, e enquanto arrasta a lista escorrega junto. Oito dos 14 alvos abaixo de 44px desta tela (5 números, Anterior, Próxima, seletor de itens por página) estão nesta fileira, que no telefone não deveria existir.
- **Correção:** Mínimo que resolve o estouro: `hidden md:flex` no grupo de números (div da linha 299) e esconder o bloco de itens por página (linhas 276-292) abaixo de md, deixando Anterior + um texto `Página 2 de 5` + Próxima (~310px, cabe). `flex-wrap` na nav também tira o estouro, mas gera duas fileiras de controle que ninguém quer no telefone. O certo é a troca por Carregar mais, na proposta.

#### [alta] 25 cartões de 164px: a lista é 89% da página e 5,5 telas de rolagem

- **Onde:** pages/Pedidos.tsx:36 (porPagina padrão 25) e 134-163. Cada cartão é p-4 (32px) + 5 linhas de text-sm (5 x 20px de line-height, uui-theme.css:11-12) + 4 x gap-2 (32px) = 164px. 25 x 164 = ~4.100px dos 4.621px medidos. 4.621 / 844 = 5,5 telas. Pela soma das alturas do código, o primeiro cartão só começa por volta de y=480 (topbar 57 + cabeçalho ~48 + faixa de atenção ~136 + bloco de filtros ~176 + gaps).
- **Impacto:** A tarefa é achar um pedido e o padrão oferecido é folhear uma parede. Os controles que mudam o recorte (página) ficam no fim dela, e a busca, que é o caminho real, fica 4,6k px acima. Na primeira tela cabem dois cartões.
- **Correção:** No telefone, linha de 2 linhas em vez de cartão de 5: nome + valor na primeira, evento + N itens + ID curto na segunda, py-4 = 72px, linha inteira tocável. 20 linhas = 1.440px no lugar de 4.100px. O campo de busca sobe para logo abaixo do título.

#### [media] O cartão lidera com o UUID de 36 caracteres, contra a convenção do próprio produto

- **Onde:** pages/Pedidos.tsx:147 imprime `pedido.id` inteiro, em mono, `break-all`, como primeira linha e única em `font-semibold`. Os IDs são UUID completo (data/pos-compra-store.ts:590-594). O resto do produto usa `uuidCurto` de 8 caracteres (store:598) nos títulos: TrocarItensWizard.tsx:319, TransferirTitularidadeWizard.tsx:328, editar-formulario-wizard.tsx:87; e DetalhePedido.tsx:222 usa o nome do comprador como h1. A tabela do desktop (linha 187) tem o mesmo problema, mas lá sobra largura.
- **Impacto:** 36 caracteres hexadecimais em mono de 14px ocupam ~302px dos 326px úteis do cartão e ficam no topo da hierarquia visual. O nome, que é o que o atendente tem na mão e o que a busca casa (linha 63), vem depois e com o mesmo peso de tamanho. No leitor de tela cada cartão se anuncia soletrando o hash antes de dizer de quem é o pedido.
- **Correção:** Nome em `font-medium` na primeira linha, `uuidCurto(pedido.id)` como metadado da segunda linha em `text-tertiary` mono. O ID inteiro continua disponível e copiável no detalhe (DetalhePedido.tsx:246).

#### [media] A faixa de atenção trunca quem é o pedido e tem linha de 36px

- **Onde:** components/FaixaAtencaoPedidos.tsx:60-68. A linha é `px-3 py-2` com uma linha de text-sm: 20 + 16 = 36px de altura. O `justify-between` põe um span `truncate` contra um span `shrink-0` com `expira em mm:ss` (~110px) ou `Falha na alteração` (~130px); com gap-3, sobram ~200px dos 326px para `nome · evento`. "Ana Beatriz Correia · Laroc apresenta: RAVE THE WORLD by Alok" tem 60 caracteres e corta por volta do 28.
- **Impacto:** É o widget mais urgente da tela, com prazo de 15 minutos, e no telefone ele mostra o nome e um pedaço do nome do evento. Dois pedidos do mesmo comprador em eventos diferentes viram duas linhas visualmente iguais. E a ação mais apressada da tela tem o alvo de 36px.
- **Correção:** Abaixo de md, empilhar em duas linhas (nome truncado na primeira; evento truncado + contagem na segunda) e `py-3`: vira ~64px de alvo e a identidade aparece inteira. Em cima disso, colapsar a faixa num resumo de uma linha de 44px com chevron, que expande no toque: devolve ~100px ao topo da tela sem esconder a urgência.

#### [baixa] O menor alvo da tela é o logo, com 20px

- **Onde:** components/Backstage.tsx:299, `<BrandLogo className="h-5" />` dentro do MobileTopBar. O botão (linhas 42-47) não tem padding nenhum, então o alvo é a altura da imagem: 20px. Confere com a medição do menor alvo.
- **Impacto:** É o voltar para a home. Errar o toque não causa dano, e numa tarefa de atendimento quase ninguém toca nele, então isso não trava trabalho. Está aqui porque é barato de resolver e porque é o número que aparece pior na auditoria.
- **Correção:** `className="-mx-1 px-1 py-3"` no botão do BrandLogo: 20 + 24 = 44px de alvo sem mudar nada do desenho. Arquivo compartilhado do produto, não do design system.

### Detalhe do pedido

#### [alta] O trilho do comprador vira um muro de ~670px antes do primeiro item, e some justamente quando é usado

- **Onde:** DetalhePedido.tsx:200 (`md:sticky md:top-[...]`, ou seja, nada de sticky abaixo de md) e o conteúdo em 211-271. Calculado para 390px: coluna de conteúdo 342px (shell `px-2` em Backstage.tsx:243 mais `p-4` da página em DetalhePedido.tsx:116); capa 199px (aspect 256/160 sobre 318px, linha 213); avatar `size-18` = 72px; nome + evento 44px; quatro contatos 128px (as três linhas com botão de cópia têm 28px, não 20); três estatísticas 189px. Total ≈670px, 30% dos 2194px medidos. As abas nascem em y≈754, abaixo da primeira tela, e a topbar sticky de 60px ainda cobre o topo.
- **Impacto:** Para chegar no primeiro item o atendente rola uma tela inteira de identidade. Pior que o custo de entrada: no desktop esse cartão existe porque é grudado, é a resposta permanente para "com quem eu estou falando"; no telefone ele perde o sticky e sai da tela no primeiro scroll. Conferir o CPF ou ditar o e-mail no meio da lista custa voltar ~700px e perder o lugar na lista, que não tem âncora de retorno.
- **Correção:** Abaixo de md, trocar o cartão por uma barra de identidade grudada de 56px (avatar, nome, "R$ 1.240,00 · 6 unidades") que abre a ficha completa numa folha inferior. A capa do evento sai no telefone (`max-md:hidden` no bloco 212-216: 199px de decoração na área mais cara da tela, que no desktop custa zero porque vive num trilho lateral). CPF, e-mail, celular, ID e os três números do `dl` viram linhas da folha. O `aside` atual continua intacto a partir de md.

#### [alta] Copiar ID, e-mail e celular são alvos de 28px colados a 2px de um texto select-all

- **Onde:** DetalhePedido.tsx:369 usa `ButtonUtility size="xs"`; em button-utility.tsx:92 o botão é `p-1.5` e em :97 o ícone xs é `size-4`, logo 16+12 = 28x28px. A folga até o texto é `gap-0.5` (2px, linha 365) e o valor do ID tem `select-all` (linha 366).
- **Impacto:** Copiar o ID do pedido e o e-mail é o gesto mais repetido de um atendimento por telefone e é a única ponte para outro sistema. Com 28px de alvo e 2px de folga, o toque que erra para a esquerda cai no texto e seleciona o ID inteiro em vez de copiar, e o único retorno de sucesso é a troca do ícone por um check de 16px e um `sr-only` (276-278): o atendente não sabe se copiou e cola o que estava antes na área de transferência.
- **Correção:** Abaixo de md, o alvo é a linha inteira, não o ícone: o `<li>` do `ItemDeContato` (330-335) vira um `<button>` de largura total e 48px que copia a linha e dispara um toast do sonner (já usado em CartaoOperacao.tsx:248), com o ícone de cópia à direita só como affordance. Não precisa de componente novo do design system, é o `<li>` do produto virando botão. A partir de md fica como está, e o caminho de falha de cópia (180-192) continua igual.

#### [media] As duas portas para o CPF do portador e para a quebra do pagamento são links de 20px de altura, e abrem popover de desktop

- **Onde:** `link-gray` tem `p-0!` (button.tsx:88), então todo Button link renderiza na altura do texto: 20px (text-sm é 14/20, uui-theme.css:11-12). A tela tem seis desses: voltar (122), Detalhes do pagamento (292), Detalhes da titularidade (715), Ver alteração (918), Mostrar mais (843), e o `<summary>` `w-fit` de "Detalhes da cobrança" em CartaoOperacao.tsx:210, que é controle fora do DS e tem a mesma altura. O da titularidade fica no meio de um parágrafo com `flex-wrap` (709-717), depois de um separador "|", numa coluna de texto de ~170px: ele cai sozinho numa linha quebrada. O que ele abre é um `AriaPopover` de `w-72` (288px) fixo, linha 729.
- **Impacto:** Confirmar quem porta a unidade (CPF e e-mail do portador) e conferir cupom e forma de pagamento são exatamente as duas perguntas que o cliente faz ao telefone, e as duas estão atrás de um alvo de 20px de altura num parágrafo que quebra. Quando abre, o popover de 288px cobre o próprio cartão com que se está comparando e fecha no primeiro toque fora, então conferir dois portadores seguidos é acertar o alvo de 20px duas vezes.
- **Correção:** Dos seis alvos de 20px, subir só os três que abrem conteúdo. "Portado por Fulano" (703-744) vira uma linha inteira tocável de 44px com chevron à direita, e os dois "Detalhes" mais o `<summary>` da cobrança viram linhas de largura total com `justify-between` e `py-3` (44px). Abaixo de md o destino é folha inferior, não popover: `ModalOverlay` já ancora no rodapé abaixo de sm (modal.tsx:12, `items-end ... sm:items-center`), então é trocar o `AriaPopover` por `ModalOverlay`+`Modal`+`Dialog` com o mesmo conteúdo. Voltar e "Mostrar mais" ficam em 20px: são toque único e têm alternativa (voltar do navegador, rolar).

#### [media] O cartão da unidade mantém as três colunas do desktop e sobra ~170px para todo o texto

- **Onde:** DetalhePedido.tsx:588-606. Largura interna do cartão a 390px: 342 menos `px-4` = 310px. Tirando a Miniatura de 40px (pos-compra-ui.tsx:405-408), dois gaps de 12px e o preço `shrink-0` (~70px para "R$ 180,00" em text-sm tabular), sobram ~170px para nome, badge de segmentação, grupo·lote, descrição e a linha do portador. Em 170px cabem ~23 caracteres por linha: "Aluguel de roupa de neoprene" (data/pos-compra-store.ts:536) ocupa 2 linhas, a descrição de 51 caracteres ocupa 3, e "Portado por Ana Beatriz Nogueira | Detalhes" ocupa 3. Uma unidade dá ~8 linhas de texto num cartão de ~200px de altura.
- **Impacto:** O preço, que é o que se varre numa conferência, fica numa coluna de 70px que nunca alinha com a de cima porque a altura da coluna de texto varia a cada unidade. E como cópias do mesmo ingresso não se agregam de propósito (comentário em 568-576), um pedido de seis unidades vira ~1.200px de cartões para dizer seis nomes e seis valores: a lista deixa de ser varrível no telefone.
- **Correção:** Abaixo de md, desmontar a fileira de três colunas: nome e preço na primeira linha (preço à direita, alinhado em todas as unidades porque a linha tem altura fixa), lote e portador na segunda, e `max-md:hidden` no que é detalhe de leitura (descrição, datas do combo, badge de segmentação), que passa a viver na folha da unidade. A linha inteira abre a folha. Resultado: 64px por unidade em vez de ~200px, com o preço sempre na mesma coluna.

#### [media] As abas Itens e Histórico têm 40x32px e 66x32px, e não acompanham a rolagem

- **Onde:** DetalhePedido.tsx:142-147, `Tabs.List type="underline" size="sm"`; em tabs.tsx:58 o item é `px-0.5 pb-2.5 pt-0` com text-sm, ou seja 20+10+2 = 32px de altura e a largura do texto mais 4px. Ficam encostadas à esquerda, em y≈754, sem `sticky`. A página mede 2194px.
- **Impacto:** Trocar de modo é uma das duas navegações desta tela, e no telefone ela é de mão única: depois de rolar a lista de itens, voltar para o Histórico (ou vice-versa) é rolar ~1.400px de volta até um alvo de 40px de largura no canto superior esquerdo, que fica no lado errado da tela para o polegar direito.
- **Correção:** Usar o `fullWidth` que já existe no DS (tabs.tsx:92 e 180, o item vira `w-full flex-1` com `justify-center`): abaixo de md as duas abas passam a ter ~163px cada, centradas. E grudar a fileira logo abaixo da barra de identidade (`sticky top-[56px]` dentro da coluna). A altura de 32px eu deixaria quieta: é escolha do DS, e com 163px de largura o alvo real já é confortável. Não vale forçar `size="md"` só para ganhar 2px.

#### [media] No cartão de operação, "Mais ações" cai embaixo de "Copiar link" e desfaz a separação que o desktop criou

- **Onde:** CartaoOperacao.tsx:169-201. Largura interna a 390px: 342 menos `p-5` = 302px. "Copiar link" ≈128px e "Reenviar" ≈106px cabem juntos na primeira linha (246px); a frase "Enviado por e-mail para b***@email.com" (~266px) toma a segunda; e o `Dropdown.Root`, segundo filho de um `flex flex-wrap justify-between`, quebra para a terceira linha, onde `justify-between` com um item só o encosta à esquerda, em x=0, ~24px abaixo do "Copiar link".
- **Impacto:** O comentário das linhas 182-183 diz por que o menu está longe: ele guarda "Registrar pagamento recebido", que aplica a alteração e não volta, e "Cancelar alteração". No desktop ele fica na ponta oposta da fileira; a 390px ele fica na mesma coluna do botão mais clicado, a um polegar de distância. A proteção existe só no desktop.
- **Correção:** Abaixo de md, trocar a fileira por uma pilha: "Copiar link" e "Reenviar" como dois botões de largura igual e 44px (`size="lg"`, que no DS dá py-2.5 + text-md/24 = 44px), a frase do destino abaixo deles em text-sm, e as duas saídas de exceção fora da fileira, atrás de um "Mais ações" de largura total que abre folha inferior com as opções como linhas de 48px e "Cancelar alteração" separada por divisor no fim. Os 36px dos botões sm só valem subir aqui e nas ações em massa, que são os botões realmente tocados com o polegar; não vale trocar todos os sm da tela.

### Transferência de titularidade

#### [alta] Rolar a lista de sugestões com o dedo já escolhe o destinatário e pula para a etapa 2

- **Onde:** components/wizard/TransferirTitularidadeWizard.tsx:443-446 (onPointerDown + preventDefault chamando escolherDestinatario, que faz setIndice(i+1) na linha 282). A lista tem maxHeight de 288px (ALTURA_SUGESTOES, linha 49) e cada linha mede 64px (Avatar md de 40px + py-3), ou seja 4,5 linhas visíveis. buscarContas devolve até 8 resultados (data/pos-compra-store.ts:1271). Então a lista rola sempre que a busca passa de 4 contas.
- **Impacto:** No mouse, escolher no mousedown é correto. No toque, pointerdown é o começo de TODO gesto, inclusive o de rolar. O atendente que arrasta o dedo para ver a quinta conta transfere o pedido para a conta que estava embaixo do dedo e cai na etapa 2 com o destinatário errado. Buscar por "silva" ou por um primeiro nome comum deixa de ser possível no telefone.
- **Correção:** Separar por pointerType: onPointerDown={(e) => { if (e.pointerType !== "mouse") return; e.preventDefault(); escolherDestinatario(conta); }} e onClick={(e) => { if (e.nativeEvent.pointerType === "mouse") return; escolherDestinatario(conta); }}. O click sintético só nasce quando o toque não virou rolagem, que é exatamente a regra que falta.

#### [alta] A lista de sugestões é medida contra window.innerHeight e desenha metade dela atrás do teclado

- **Onde:** components/wizard/TransferirTitularidadeWizard.tsx:62 (let base = window.innerHeight dentro de areaVisivel) e 206-209 (abaixo = base - caixa.bottom - 12; paraCima = abaixo < 132). Nenhum ancestral recorta (o BackstageLayout é min-h-screen sem overflow, components/Backstage.tsx:242-244), então base fica literalmente em 844. A lista só existe enquanto se digita (linha 152: sugerindo && termo.length > 0), isto é, sempre com o teclado em pé.
- **Impacto:** No iPhone 14 o teclado come cerca de 300px e o Safari NÃO muda window.innerHeight nem dispara o resize que a linha 215 escuta. O cálculo acha que sobram uns 550px, trava no teto de 288px e desenha a lista inteira para baixo. As duas últimas das 4,5 linhas visíveis ficam debaixo do teclado, e o ramo que viraria a lista para cima (linha 208) nunca dispara porque o espaço livre que ele compara é fictício.
- **Correção:** Medir a base pelo viewport visual: const vv = window.visualViewport; const base = vv ? vv.offsetTop + vv.height : window.innerHeight, e assinar vv.addEventListener("resize"|"scroll", medir) além dos dois listeners atuais. A correção de fundo é a proposta nativa: numa folha de tela cheia o teclado vira o chão da lista e essa conta some junto com as linhas 48-71 e 199-221.

#### [alta] O CPF, que é como o atendente confere identidade, é cortado pelo truncate no mobile

- **Onde:** components/wizard/TransferirTitularidadeWizard.tsx:456-459 (e-mail e CPF na mesma linha com `block truncate`) e 482 (mesmo par no `apoio` do CartaoResultado, também truncado). Largura real da linha a 390px: 390 menos 32 (px-4 da página) menos 32 (p-4 do card) menos 32 (px-4 da linha) menos 52 (Avatar md + gap-3) menos 32 (chevron size-5 + gap-3) = 210px. A string "carolina.sampaio@email.com · CPF 123.456.789-00" tem 46 caracteres: nem a 5px por caractere ela cabe em 210px.
- **Impacto:** Duas contas com o mesmo nome (o caso que justifica a busca por CPF existir) ficam indistinguíveis no telefone: o atendente vê "Juliana Prado / juliana.prado@email.c..." nas duas. No desktop a mesma linha tem a coluna de 672px e mostra tudo, então o defeito é exclusivo do mobile e justamente na decisão que não dá para desfazer sem uma segunda operação.
- **Correção:** Quebrar a identidade em duas linhas no mobile: e-mail numa linha com truncate, CPF numa linha própria sem truncate (`<span className="block tabular-nums">CPF {formatarCPF(conta.cpf)}</span>`). A linha passa de 64px para 76px, o que também aumenta o alvo de toque. Mesmo tratamento no `apoio` do CartaoResultado, que hoje recebe uma string única.

#### [media] As três navegações da revisão são links de 20px de altura

- **Onde:** "Alterar" em seletor-unidades.tsx:239 e em TransferirTitularidadeWizard.tsx:104, "Incluir as outras N unidades" em seletor-unidades.tsx:273. Todos são Button color="link-color", e o estilo de link aplica `p-0!` (components/base/buttons/button.tsx:80). Com text-sm o alvo fica em exatamente 20px de altura por cerca de 48px de largura, menos da metade dos 36px dos botões sm que você mediu e um quarto da área de um alvo de 44px.
- **Impacto:** Na etapa 3 esses três links são a única forma de corrigir o que está errado antes de mandar a cobrança: trocar as unidades, trocar a pessoa, incluir as unidades irmãs. São os cliques de correção, os que acontecem com o cliente reclamando no telefone, e são os menores alvos da tela. Errar o toque acerta o card, que não faz nada, ou o link vizinho.
- **Correção:** A linha inteira vira o alvo, não o texto. No cabeçalho de ResumoUnidades e no CartaoDestinatario, trocar o par <p> + link por um <button type="button" onClick={onAlterar} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left max-md:min-h-14"> com ChevronRight à direita. Para "Incluir as outras N unidades", trocar link-color sm por Button color="secondary" size="md" className="max-md:w-full": 40px de altura e a largura toda do card.

#### [media] As quatro opções de motivo têm 20px de alvo, e o motivo é obrigatório

- **Onde:** components/pos-compra-ui.tsx:192-196 monta o RadioGroup com RadioButton sem size, ou seja size="sm": círculo size-4 (16px) e rótulo text-sm (line-height 20px), num root que é só `flex items-start gap-2` (components/base/radio-buttons/radio-buttons.tsx:57 e 75). O alvo é de 20px de altura, e a className do grupo é `gap-3`, 12px entre um e outro. São quatro opções (CATEGORIA_MOTIVO_LABEL, data/pos-compra-store.ts:181-186).
- **Impacto:** Sem categoria o botão de enviar não libera (motivoValido, usado em TransferirTitularidadeWizard.tsx:263). O atendente é obrigado a acertar um alvo de 20px separado do vizinho por 12px, que é a geometria em que o dedo erra de opção, e o erro aqui é silencioso: registra o motivo errado no histórico do pedido sem nenhum aviso.
- **Correção:** Não mexer no DS: a className do RadioButton aceita função do estado (radio-buttons.tsx:73-79). Dar a cada opção a moldura dela, className={({isSelected}) => cx("w-full items-center rounded-lg px-4 py-3 ring-1 max-md:min-h-14", isSelected ? "bg-brand-primary ring-brand" : "bg-primary ring-border-secondary")}, e trocar o gap-3 do grupo por gap-2. Vira uma lista de cartões de 56px, que é o padrão de escolha única no telefone.

#### [media] O rótulo do botão de confirmar é uma frase de 47 caracteres num botão com whitespace-nowrap

- **Onde:** TransferirTitularidadeWizard.tsx:335 monta rotuloConfirmar=`Enviar cobrança de ${formatarMoeda(calculo.total)} para ${mascararEmail(destino)}`. Com os dados mockados isso dá "Enviar cobrança de R$ 15,00 para c***@email.com", 47 caracteres (mascararEmail sempre devolve 1 caractere + *** + domínio, pos-compra-ui.tsx:422-425). O botão tem `whitespace-nowrap` no root comum (components/base/buttons/button.tsx:11) e mora num `flex items-center justify-between` sem quebra (WizardShell.tsx:138-149), com 358px de linha útil a 390px. SEM MEDIDA DE BROWSER: a sua tabela não cobre a etapa 3 da transferência, só a etapa 1. Pelo código o botão não pode quebrar nem truncar, só empurrar.
- **Impacto:** Ou o botão estoura a largura e leva junto o overflow horizontal que você já viu na lista, ou, no melhor caso, fica um retângulo de 40px ocupando a linha inteira com uma frase de 14px dentro, que não é como se lê uma ação primária no telefone. Vale medir a etapa 3 antes de decidir o tamanho do problema.
- **Correção:** Tirar a frase de dentro do botão. O WizardShell já tem o slot infoRodape (linha 140) e a transferência não passa nada nele. Passar infoRodape={`${formatarMoeda(calculo.total)} para ${mascararEmail(destino)}`}, encurtar rotuloConfirmar para "Enviar cobrança", e empilhar a barra no mobile: `max-md:flex-col max-md:items-stretch max-md:gap-2` no div da linha 138 e `max-md:w-full` no Button.

#### [baixa] Tocar o campo de quantidade dá zoom no iOS e a página não volta

- **Onde:** components/wizard/seletor-unidades.tsx:159-171 usa InputNumber size="sm", cujo input é `px-3 py-2 text-sm` (components/base/input/input-number.tsx:27), ou seja 14px. O index.html:6 declara `width=device-width, initial-scale=1.0` sem maximum-scale, então o auto-zoom do Safari está ligado. Os botões de mais e menos medem 36x36 (data-icon-only:p-2 com ícone size-5, h-full sobre um wrapper de 36px).
- **Impacto:** O Safari dá zoom em qualquer campo focado com fonte abaixo de 16px e não desfaz o zoom ao sair. O atendente que toca o número em vez do mais fica com o resto do fluxo, incluindo a revisão e a cobrança, renderizado ampliado e com rolagem horizontal, e tem que fazer pinch para voltar. É a única fonte abaixo de 16px em campo editável do fluxo: os Input e TextArea do motivo são text-md, 16px.
- **Correção:** inputClassName="w-12 px-0 text-center tabular-nums max-md:text-md". O campo passa de 36px para 40px no mobile e os botões acompanham por h-full, o que também melhora o alvo. "40" continua cabendo nos 48px do w-12.

### Troca de item e formulário

#### [alta] A linha do catálogo é um alvo de 390x~130px, sem affordance no toque, que substitui a seleção inteira

- **Onde:** src/produtos/backstage/alteracoes-pos-compra/components/wizard/TrocarItensWizard.tsx:554 (onClick no <li>) e :252 (onTodas={() => setEntram({ [item.id]: totalSaem })}). Linha de ~120 a 150px de altura por 358px de largura a 390px: p-4 (32) + nome 20 + lote 20 + badges 30 + gap 12 + fileira de preço 36.
- **Impacto:** Com mais de uma unidade saindo, encostar em qualquer ponto da linha (nome, lote, badge, preço, espaço vazio) executa onTodas, que faz setEntram({...}) do zero e APAGA o que já tinha sido escolhido em outros itens. O stepper ao lado faz o contrário: soma ao mapa. Duas semânticas opostas na mesma linha, e a destrutiva é a que tem o alvo grande. No desktop o hover:bg-primary_hover e o cursor-pointer avisam que a linha faz algo; no toque não existe hover, o elemento é um <li> sem role, sem foco e sem teclado, então nada avisa. Não há desfazer. O atendente está ao telefone com o cliente e perde a seleção montada.
- **Correção:** Transformar a linha em <button type="button"> com role real, aria-pressed e min-h-16, e separar as duas ações: o toque na linha soma UMA unidade ao item (merge no mapa, igual ao stepper), nunca substitui o mapa. A troca em bloco vira ação explícita dentro da folha de quantidade ("Todas as 4"), não um clique mudo na linha. Estado visível à direita da linha: vazio, "1", "2" em Badge, mais bg-secondary quando escolhido.

#### [alta] Etapa Formulários da troca: janela de rolagem de 448px sobre um formulário de cerca de 2.080px, dentro de uma página que já rola

- **Onde:** src/produtos/backstage/alteracoes-pos-compra/components/wizard/TrocarItensWizard.tsx:422 (max-h-[28rem] overflow-y-auto) e :423 (perguntasDoItem(novoItem).map, renderiza TODAS as perguntas). O formulário f-completo tem 20 perguntas (data/pos-compra-store.ts:459-484) e está em 13 dos 14 itens do catálogo que têm formulário. Altura calculada pelas métricas do DS: 18 Selects x 66px + 6 hints x 40px + TextArea ~200px + anexo ~110px + 19 gaps de 16px = ~2.080px. 448px são 21% disso e 53% dos 844px do iPhone 14.
- **Impacto:** O cabeçalho do acordeão diz "Falta 1 resposta", e abrir revela uma janela de 448px com 20 campos, 19 deles já preenchidos pela unidade que sai. Para chegar ao único campo vazio o polegar tem que rolar DENTRO da caixa; a rolagem da página não leva até lá. No iOS a barra de rolagem é overlay, então a caixa parece uma lista cortada e não um scroller. Em telefone é a diferença entre responder uma pergunta e caçar uma pergunta.
- **Correção:** Tirar o max-h e o overflow-y-auto: quem rola é a página. E renderizar por padrão só as perguntas pendentes (faltando(linha, novoItem)), com uma linha "19 respostas vieram da unidade atual" e um botão de texto que revela as demais. Isso derruba a etapa de ~2.080px para ~70px no caso comum, que é o caso de 13 dos 14 itens.

#### [alta] Os quatro radios de "Motivo da alteração" têm 20px de altura e são obrigatórios em todo fluxo

- **Onde:** src/produtos/backstage/alteracoes-pos-compra/components/pos-compra-ui.tsx:192-196. RadioButton nasce size="sm" (src/components/base/radio-buttons/radio-buttons.tsx:50): raiz "relative flex items-start", sem padding, bolinha size-4 com mt-0.5 e label text-sm de 20px de altura. Altura do alvo = 20px, com apenas 12px de respiro entre eles (RadioGroup className="gap-3"). É o mesmo piso dos 20px que você mediu no link do logo.
- **Impacto:** Diferente do botão sm de 36px, que é escolha do design system, este alvo de 20px não é o tamanho do componente: é a ausência de padding na linha. Ele aparece na revisão da troca E na revisão do editar formulário, é obrigatório pela H-07 e é tocado uma vez em TODA alteração. 20px é 45% da recomendação da Apple, com 12px de separação: o erro de toque cai no radio vizinho e grava a categoria errada no histórico do pedido, que é justamente o campo que ninguém revisa depois.
- **Correção:** Aqui vale subir, e sai sem tocar no design system: <RadioButton className="py-3" /> leva a linha a 44px e o respiro efetivo a 24px. Melhor ainda para o polegar: cada opção vira uma linha de lista de largura total dentro do card do motivo (py-3, divide-y divide-border-secondary, bg-secondary quando marcada), do mesmo jeito que a lista de unidades já faz.

#### [media] Seletor de unidades: o stepper fixo de 120px deixa 110px para o texto que identifica a unidade

- **Onde:** src/produtos/backstage/alteracoes-pos-compra/components/wizard/seletor-unidades.tsx:129-172. A 390px: 358 de conteúdo, menos px-4 (32) = 326; menos gap-3 (12) e o InputNumber de 120px (botões de 36 + input w-12 de 48, linhas 158-171) = 194; menos a caixa do Checkbox md (20) e o gap-3 dele (12) = 162; menos a miniatura de 40 e o gap de 12 = 110px para a coluna de texto. O stepper, que precisa de uma linha, fica com 120px; a identidade, que tem até cinco linhas (nome, lote, sessão, titular, "N unidades no pedido"), fica com 110px.
- **Impacto:** Nada tem truncate, então tudo quebra. "Corrida 5 km classificatória" vira três linhas de 15 caracteres, "Sábado, 14 de março" vira duas, e a linha passa de ~56px para 160 a 200px de altura. O conteúdo que o atendente confere ao telefone fica numa fita estreita ao lado de um campo numérico quase vazio. É a etapa 1 da troca, a primeira coisa que ele vê.
- **Correção:** Abaixo de sm, tirar o stepper da linha: li com flex-col gap-3 sm:flex-row sm:items-center, e o InputNumber numa segunda linha com w-full sm:w-auto. Melhor ainda e coerente com a proposta: a quantidade não fica na linha, fica numa folha inferior que o toque na linha abre, e a linha devolve os 358px inteiros para a identidade.

#### [media] Os dois únicos campos de 14px do fluxo disparam o zoom automático do Safari iOS

- **Onde:** Busca do catálogo: components/wizard/TrocarItensWizard.tsx:362-369, InputBase size="sm" = px-3 py-2 text-sm (src/components/base/input/input.tsx:73), ou seja 14px de fonte e 36px de altura. Stepper: components/pos-compra-ui.tsx:293-303 e seletor-unidades.tsx:159-171, InputNumber size="sm" = text-sm (src/components/base/input/input-number.tsx:27). Todo o resto do fluxo é md: Input do chamado, TextArea e Select ficam em text-md, 16px, 40px de altura, que é o que você mediu.
- **Impacto:** O Safari no iPhone amplia a página quando o campo focado tem fonte menor que 16px, e não volta ao sair do campo. Tocar na busca do catálogo amplia a etapa inteira (1.033px de altura medidos) para ~1,14x e ela passa a ter rolagem horizontal até alguém dar pinça. Depois disso todas as medidas de toque encolhem na prática. É o mesmo sintoma dos 59px de estouro da lista, mas causado pelo navegador. Não é violação da regra da casa, que exige no mínimo 14px: é o limiar de 16px do iOS, que é outro número.
- **Correção:** Busca: InputBase size="md", que já é 40px e 16px, sem mudança de layout. Stepper: manter size="sm" e passar inputClassName="text-md text-center tabular-nums"; os botões são h-full, então o grupo sobe para 40px mantendo os 120px de largura e o w-12 ainda comporta dois dígitos. Nada disso toca src/components/.

#### [media] No carrossel de datas a seta nasce durante o arrasto e empurra o trilho 36px debaixo do dedo

- **Onde:** src/produtos/backstage/alteracoes-pos-compra/components/abas-carrossel.tsx:74 (setTemAnterior(trilho.scrollLeft > 1)) com a SetaAnimada de :23-39, que anima width de 0 para auto mais marginRight 8. O trilho é flex-1, então ele encolhe 28+8 = 36px no instante em que o scrollLeft passa de 1px. Com as duas setas o trilho cai de 358 para 286px, ou seja 20% da pista. As setas são ButtonUtility size="xs" (:114 e :156) = p-1.5 mais ícone size-4 = 28x28px, o menor controle de todo o fluxo depois do logo.
- **Impacto:** Um arrasto de 1px já satisfaz a condição: o conteúdo escorrega 36px para o lado contrário do gesto enquanto o dedo ainda está na tela, e o chip que estava sob o polegar deixa de estar. Como existe snap-mandatory, a pista ainda reacomoda depois. E as setas, que no toque são redundantes com o arrasto, cobram 72px de uma pista de 358px, o equivalente a mais de meio chip de 96px.
- **Correção:** Esconder as setas no toque e devolver os 72px: envolver cada SetaAnimada em um wrapper max-[640px]:hidden (ou @media (hover: hover)) e substituir a affordance por máscara de borda no trilho, mask-image linear-gradient aplicada só quando temProxima. Se a decisão for manter as setas no toque, elas precisam subir para size="sm" (32px) e o trilho precisa reservar o espaço delas desde o início, com a seta em opacity-0 em vez de width 0, para o trilho nunca mudar de largura.

#### [media] No cabeçalho do acordeão de formulários o rótulo de status ganha mais espaço que a identidade do item e da pessoa

- **Onde:** src/produtos/backstage/alteracoes-pos-compra/components/wizard/TrocarItensWizard.tsx:410-419. A 390px: 358 menos px-4 (32) = 326 para a fileira; menos o chevron size-5 e o gap-2 (28) = 298; menos a miniatura de 40 e dois gap-3 (24) = 234; o status é shrink-0 e "Faltam 3 respostas" mede ~126px a 14px, sobrando 108px para o bloco de nome do item e nome da pessoa, ambos com truncate.
- **Impacto:** 108px dão cerca de 15 caracteres. "Corrida 10 km feminina" vira "Corrida 10 km f…" e "Marcos Vinícius Leite" vira "Marcos Viníci…". Numa troca com três pares, as três linhas ficam visualmente iguais e o atendente não consegue dizer qual formulário é de quem sem abrir um por um. O que sobrevive inteiro é a contagem de pendências, que é a informação que ele menos precisa ler por extenso.
- **Correção:** Empilhar abaixo de sm: o status sai da fileira e vira uma terceira linha do bloco de texto, ou um Badge color="warning" size="md" com só o número ("3") alinhado ao chevron. Com isso a identidade passa de 108 para ~234px, que cabe o nome inteiro do item na primeira linha e o da pessoa na segunda.

#### [media] O rótulo do botão de confirmar tem de 46 a 50 caracteres, é whitespace-nowrap e não tem como encolher na fileira de 358px

- **Onde:** src/produtos/backstage/alteracoes-pos-compra/components/wizard/WizardShell.tsx:138 (sticky bottom-0 ... px-4, sem flex-wrap) e :141-149 (Button size="md"). O rótulo vem de TrocarItensWizard.tsx:325-331 e de editar-formulario-wizard.tsx:93: "Enviar cobrança de R$ 120,00 para a***@email.com" são 48 caracteres. Todo Button do DS tem whitespace-nowrap (src/components/base/buttons/button.tsx:11) e nenhum truncate, então a largura mínima do item flex é a largura do texto. Conta: disponível = 390 menos px-4 (32) = 358; largura do botão = texto mais px-3.5 (28) mais px-0.5 do span (4). Estoura acima de ~326px de texto, ou seja a partir de ~45 caracteres a 14px semibold. Calculado, não medido: a etapa de revisão dos dois fluxos não está na sua tabela, que mediu a etapa 2 da troca e o formulário.
- **Impacto:** É o mesmo mecanismo do estouro de 59px que você mediu na lista de pedidos: uma fileira que não quebra com um botão que não encolhe. Os únicos rótulos que cabem são "Enviar cobrança" (15) e "Aplicar troca sem cobrança" (26). Qualquer troca com valor, que é o caso normal, entrega a ação principal mais larga que a tela, com rolagem horizontal na barra que está colada no rodapé.
- **Correção:** Separar o que o botão diz do que o botão custa: o Button passa a dizer só "Enviar cobrança", e o valor com o destino sobem para a primeira linha do rodapé, num bloco de texto que pode quebrar em duas linhas ("R$ 120,00 para a***@email.com"). O rodapé vira flex-col gap-2 abaixo de md e o botão ganha w-full md:w-auto. Isso corrige o estouro pela estrutura, sem truncar o valor, e já é o rodapé de duas linhas da proposta.

#### [baixa] Na resposta de anexo o nome do arquivo fica com cerca de 45px de uma fileira de 294px, espremido por dois botões que não quebram

- **Onde:** src/produtos/backstage/alteracoes-pos-compra/components/respostas-ui.tsx:107-118. Dentro do card p-5 do editar formulário: 358 menos 40 = 318, menos px-3 da caixa = 294. Na fileira: clipe 16, gap 8, nome (min-w-0 flex-1), gap 8, Button "Substituir arquivo" ~147px, gap 8, Button "Desfazer" ~62px. Os dois botões são whitespace-nowrap, então não encolhem; o flex-wrap nunca dispara porque o span encolhe primeiro. Sobram ~45px, cerca de 6 caracteres.
- **Impacto:** "atestado-medico.pdf" aparece como "atest…". O único dado que o atendente precisa ler antes de substituir um anexo, que é qual arquivo está lá hoje, é o único que some. Com o "Desfazer" ainda não visível sobram ~107px, cerca de 14 caracteres, o que continua cortando a extensão.
- **Correção:** Dar a linha inteira ao nome: a caixa vira flex-col gap-2 abaixo de sm, com o nome em cima (ainda truncate, mas com 294px) e os botões numa segunda fileira; ou manter uma fileira e trocar "Substituir arquivo" por um ButtonUtility com ícone, que economiza ~115px. Na proposta esta edição acontece numa folha inferior, onde o nome tem a tela toda.

## O que cada superfície seria, desenhada para telefone primeiro

### Lista de pedidos

**Conceito.** A tela é uma busca com resultados, não uma tabela encolhida: o atendente chega com um nome, um e-mail ou um ID na mão, e sai com um pedido aberto. Nada aqui existe para ser folheado, então a lista deixa de ser o conteúdo padrão e passa a ser a consequência da consulta.

**Padrões:**

- Busca em primeiro plano, logo abaixo do título: Input `size="lg"` (44px exatos) com `type="search"`, que ganha o X de limpar nativo do navegador de graça. É a regra da casa de olhar o navegador antes da biblioteca, e é o padrão de qualquer app de contatos ou de e-mail no telefone: o campo manda, a lista obedece.
- Filtro de evento em chips roláveis na horizontal, reaproveitando o `AbasCarrossel` que já existe no produto (components/abas-carrossel.tsx) e que o atendente já usa no carrossel de datas da troca. Um toque troca o filtro, sem popover de 358px aberto por cima da lista. Alternativa ainda mais barata: o `NativeSelect` do design system (base/select/select-native.tsx), que no iOS abre a roda do sistema.
- Linha densa de duas linhas, 72px, no lugar do cartão de cinco linhas: nome e valor na primeira, `evento · N itens · ID curto` na segunda. A linha inteira é o alvo, bem acima dos 44px. Badge de situação só vira terceira linha quando há algo acontecendo (aguardando pagamento, falha, expirado), nunca para pedido normal.
- Contagem de resultados em cima da lista, não no rodapé: no telefone o rodapé está a telas de distância, e saber se a busca devolveu 3 ou 60 é o que decide se o atendente refina o termo.
- Carregar mais 20 (Button `size="lg"`, 44px) no lugar da paginação numerada. Paginação com números é navegação de tabela; no telefone o polegar já é a paginação, e isso apaga de uma vez 8 dos 14 alvos pequenos e os 59px de estouro horizontal.
- Faixa de atenção colapsada numa linha de 44px com a contagem e um chevron, expandindo no toque para linhas de duas linhas e 64px. A urgência continua sendo a primeira coisa depois da busca, sem comer 136px antes do primeiro resultado.
- Troca entre lista e tabela por container query (`@container` no wrapper e `@3xl:` no lugar de `md:`, nativo no Tailwind v4.1), para a tela responder à largura da coluna de conteúdo e não à da janela. É isso que faz a versão de telefone aparecer também dentro da moldura de 390px e dentro do Backstage com os dois trilhos abertos num laptop de 1024px.

```
+-- 390 x 844 --------------------------+
| Ingresse                         [=]  |  56  topbar do layout
+---------------------------------------+
| Pedidos                               |  28
| +-----------------------------------+ |
| | (o) Nome, e-mail ou ID        (x) | |  44  Input size=lg
| +-----------------------------------+ |      type="search"
| (Todos)(RAVE THE WORLD)(MOCHAKK C >>  |  40  chips, rolam ->
+---------------------------------------+
| ! 2 pedidos precisam de atencao   (v) |  44  faixa colapsada
+---------------------------------------+
| 112 pedidos                           |  20
+---------------------------------------+
| Ana Beatriz Correia         R$ 269,00 |
| RAVE THE WORLD . 3 itens . 4f2a1c9b   |  72  linha inteira
+---------------------------------------+      e o alvo
| Paulo Ventura             R$ 1.330,00 |
| MOCHAKK CALLING . 12 itens . 9c0b7e21 |  96
| [Aguardando pagamento]                |      +24 so quando
+---------------------------------------+      ha algo rolando
| Leticia Prado               R$ 420,00 |
| RAVE THE WORLD . 2 itens . b31d8a04   |  72
+---------------------------------------+
|           ... 17 linhas ...           |
+---------------------------------------+
| +-----------------------------------+ |
| |         Carregar mais 20          | |  44  Button size=lg
| +-----------------------------------+ |
+---------------------------------------+
  altura ~1.9k px   (hoje: 4.621 px)
  1o resultado em y~330 (hoje: ~480)
  alvos < 44px: 0 na tela (hoje: 14)

faixa de atencao depois do toque:
+---------------------------------------+
| ! 2 pedidos precisam de atencao   (^) |  44
| +-----------------------------------+ |
| | Ana Beatriz Correia               | |
| | RAVE THE WORLD . expira em 04:12  | |  64
| +-----------------------------------+ |
| | Paulo Ventura                     | |
| | MOCHAKK CALLING . falha           | |  64
| +-----------------------------------+ |
+---------------------------------------+
```

**Custo.** Nenhum componente do design system é tocado. Aproveita: Input (size lg + type search), Button lg, Badge, e o `AbasCarrossel` ou o `NativeSelect` que já existem, um no produto e outro no DS. Componente NOVO do produto, em alteracoes-pos-compra/components/: `LinhaPedidoMobile.tsx`, ~40 linhas, que a lista `md:hidden` passa a renderizar no lugar do cartão de cinco linhas (Pedidos.tsx:134-163). Em Pedidos.tsx, um parâmetro `limite` na URL (padrão 20) usado só pelo ramo mobile, com Carregar mais fazendo `definir({ limite: limite + 20 })`; o ramo desktop continua com `pagina`/`porPagina` e a tabela fica intacta: ~30 linhas, e a busca continua na URL como já está. Em FaixaAtencaoPedidos.tsx, estado colapsado e empilhamento abaixo de md: ~15 linhas. Container queries são mecânicas mas tocam ~12 classes da página e dá para deixar para um segundo passo sem perder nada do resto. Sobre a moldura de 390px das apresentações: a proposta não usa sticky, fixed nem vw, então nada quebra lá. O que não funciona na moldura é justamente a troca por media query de hoje, porque a moldura é uma coluna no fluxo e `md:` lê a janela, então a moldura mostraria a tabela do desktop; é por isso que o container query entra na proposta, e é por isso que `useBreakpoint` (src/hooks/use-breakpoint.ts) não serve aqui, já que também mede a janela. Enquanto o container query não entra, a revisão continua em devtools a 390x844, que foi como as medições saíram. Limitação herdada e honesta: a busca é client-side sobre os pedidos já carregados, igual à FaixaAtencao; se a base crescer, vira consulta de servidor e o Carregar mais vira cursor. E a lista hoje não tem ordenação explícita (sai na ordem do store), então qualquer promessa de mais recentes primeiro é regra nova, fora deste escopo.

**O que recusa.** Swipe na linha para agir (trocar item, transferir titularidade, editar respostas). É o padrão que todo mundo pede quando vê uma lista de telefone, e aqui ele está errado por três motivos: as três operações mexem em dinheiro (R$ 20 da troca, R$ 15 da titularidade, R$ 10 das respostas, pos-compra-store.ts:21-30) e nenhuma se desfaz com um segundo swipe, então escondê-las atrás de um gesto sem affordance é o mesmo erro de usar badge como gatilho; o gesto horizontal já está ocupado pela fileira de chips logo acima, e um arrasto ambíguo em cima de uma ação irreversível é pior que nenhum atalho; e as ações precisam do contexto que só o detalhe tem, qual item e qual unidade. A linha faz uma coisa só: abre o pedido. Pelo mesmo tipo de razão fica fora a barra de filtros presa no rodapé: além de quebrar dentro da moldura de 390px, numa tarefa de busca não há nada que mereça ocupar a faixa do polegar o tempo inteiro.

### Detalhe do pedido

**Conceito.** No telefone esta tela não é "duas colunas empilhadas": é uma camada de referência que nunca sai (quem é, quanto, o que está aberto) sobre uma lista densa em que cada unidade é uma linha tocável que abre uma folha com os dados e as ações dela.

**Padrões:**

- Barra de identidade grudada de 56px no lugar do cartão de 670px: avatar, nome e "R$ 1.240,00 · 6 unidades". Ela responde no scroll inteiro a pergunta que o desktop responde com um trilho sticky, e abre a ficha completa em folha inferior. A capa do evento não aparece no telefone.
- Folha inferior em vez de popover para tudo que hoje é "Detalhes": ficha do comprador, titularidade e quebra do pagamento. O `ModalOverlay` do DS já ancora no rodapé abaixo de sm (modal.tsx:12), traz backdrop, foco preso e Esc, e nasce na zona do polegar em vez de cobrir o cartão que se está comparando.
- Linha de duas alturas no lugar do cartão da unidade, 64px, linha inteira como alvo: nome e preço na primeira, lote e portador na segunda, chevron à direita. Preço sempre na mesma coluna, porque a altura é fixa. Seis unidades passam de ~1.200px para ~400px.
- Ações da unidade como lista de linhas de 48px no fim da folha dela: "Editar formulário", "Transferir esta unidade", "Trocar esta unidade". Hoje transferir e trocar só existem como verbos em massa no topo da lista (DetalhePedido.tsx:496-508); no telefone, agir sobre a unidade que você está olhando não deveria exigir rolar até o topo e reencontrá-la dentro do fluxo.
- Abas 50/50 grudadas logo abaixo da barra, com o `fullWidth` que o DS já tem, e cabeçalho de sessão grudado enquanto o grupo rola. Os dois modos da tela ficam sempre a um toque, e a sessão a que a unidade pertence não some durante a varredura.
- Faixa de alteração em andamento colada à barra de identidade, com o contador e um "Ver": é o único conteúdo que não pode ficar atrás de scroll, porque tem prazo. O cartão completo da operação continua existindo, mas o acesso a ele deixa de depender de onde a pessoa está na página.
- Ações em massa saem do topo da lista e viram barra de rodapé grudada na aba Itens, dois botões lg de 44px dividindo a largura. Topo da tela é leitura, base é ação.
- Histórico em linhas recolhidas de 56px (tipo · resultado, valor, data) que abrem no lugar. Hoje cada grupo imprime a linha do tempo inteira sempre aberta (DetalhePedido.tsx:902-914), e a aba vira um rolo.

```
390px  ·  Detalhe do pedido, aba Itens
┌──────────────────────────────────────────────┐
│ Backstage                                 ≡  │ 60  shell (já existe)
├──────────────────────────────────────────────┤
│ ‹  (AB) Ana Beatriz Nogueira              ⌄  │ 56  identidade, grudada
│         R$ 1.240,00 · 6 unidades             │     toque = ficha
├──────────────────────────────────────────────┤
│ ⏱ Transferência · expira em 42 min     Ver › │ 48  só quando há algo aberto
├───────────────────────┬──────────────────────┤
│      Itens  6         │      Histórico       │ 32  50/50, grudadas
├───────────────────────┴──────────────────────┤
│ Qua, 11 de nov., 06h00                       │ 28  sessão, gruda no grupo
├──────────────────────────────────────────────┤
│ Corrida 10 km feminina            R$ 180,00 ›│ 64  linha = alvo
│ Lote 2 · Ana Beatriz                         │
├──────────────────────────────────────────────┤
│ Corrida 10 km feminina            R$ 180,00 ›│ 64
│ Lote 2 · Marina Alves      ⏱ em transferência│
├──────────────────────────────────────────────┤
│ Camiseta extra do evento           R$ 80,00 ›│ 64
│ Produto · Ana Beatriz                        │
│                   ⋮                          │
├──────────────────────────────────────────────┤
│ [    Transferir    ]  [      Trocar      ]   │ 68  grudada no rodapé, 44px
└──────────────────────────────────────────────┘

Folha da unidade (toque na linha)      Ficha do comprador (toque na barra)
┌────────────────────────────────┐    ┌────────────────────────────────┐
│ ▔▔▔▔                           │    │ ▔▔▔▔                           │
│ Corrida 10 km feminina         │    │ Ana Beatriz Nogueira           │
│ Rua · Lote 2 · R$ 180,00       │    │ Maratona de Natal 2026         │
│ Exclusivo feminino             │    ├────────────────────────────────┤
│ Portado por Ana Beatriz     ›  │ 44 │ CPF 012.345.678-90          ⧉ │ 48
├────────────────────────────────┤    │ ana@email.com               ⧉ │ 48
│ Editar formulário           ›  │ 48 │ (84) 98812-4407             ⧉ │ 48
│ Transferir esta unidade     ›  │ 48 │ Pedido a1b2c3d4             ⧉ │ 48
│ Trocar esta unidade         ›  │ 48 ├────────────────────────────────┤
│ Histórico desta unidade     ›  │ 48 │ Pago  R$ 1.240,00 · cartão 3x  │
└────────────────────────────────┘    │ Compra online · 12/03/2026     │
     linha inteira copia ────────────▶└────────────────────────────────┘
```

**Custo.** Nada aqui pede componente novo no design system, e nenhuma biblioteca de sheet. Reaproveita: `ModalOverlay`/`Modal`/`Dialog`, que abaixo de sm já ancoram no rodapé com largura total (modal.tsx:12 e 26); `Tabs` com `fullWidth` (tabs.tsx:92 e 180); `Button size="lg"` = 44px; `Badge`, `AvatarProfilePhoto` e o toast do sonner. O que é novo é tudo componente do produto, em alteracoes-pos-compra/components/: `BarraDeIdentidade`, `FolhaDoComprador`, `LinhaDaUnidade` e `FolhaDaUnidade`, mais a conversão das duas folhas de "Detalhes" que hoje são popover. O grosso do trabalho é a folha da unidade e a lista densa; a barra, as abas full-width e o `max-md:hidden` da capa são baratos. O risco real é manter duas árvores (coluna no desktop, pilha no telefone): mitiga lendo tudo dos mesmos helpers que já existem (`lerUnidade`, `disponivelPara`, `caminhoDoItem`, `temFormulario`) e deixando as folhas renderizarem o mesmo conteúdo dos popovers atuais, para o conteúdo nunca divergir. Sobre as barras grudadas na moldura de 390px das apresentações: a de rodapé usa `sticky bottom-0` dentro da coluna, como o WizardShell já faz (WizardShell.tsx:138), nunca `fixed`, porque na moldura o `fixed` ancora no ancestral com transform e a página tem um `motion.div` na raiz (DetalhePedido.tsx:115). Se a moldura da apresentação usar `overflow-hidden`, o sticky morre em silêncio: por isso as três barras (identidade, abas, rodapé) saem de um componente com prop `semGrude`, que as renderiza como blocos normais no fluxo, e a apresentação não mostra barra quebrada.

**O que recusa.** Swipe na linha da unidade para revelar Transferir e Trocar. É o padrão móvel óbvio aqui, e eu recuso: as duas ações abrem cobrança e não voltam (o próprio código afasta "Registrar pagamento" do caminho comum por isso, CartaoOperacao.tsx:182-183), e swipe esconde a ação atrás de um gesto sem affordance, que o atendente descobre por acidente no meio de uma ligação ou não descobre nunca. A linha já tem um alvo legítimo de 64px que abre a folha com as ações escritas por extenso. Pela mesma razão não entra pull-to-refresh na lista nem barra de navegação inferior: a shell já resolve navegação pelo hambúrguer, e um segundo sistema de navegação no rodapé brigaria com a barra de ação em massa, que é onde o polegar precisa confiar.

### Transferência de titularidade

**Conceito.** As três etapas continuam telas roteadas e curtas, com uma barra de polegar presente em todas elas; as duas tarefas que exigem teclado ou escolha longa (achar a pessoa e registrar o motivo) saem para folhas de tela cheia, onde o teclado é o chão da lista em vez de tapá-la, e a revisão vira uma lista tocável de linhas inteiras em vez de cartões com links de 20px.

**Padrões:**

- Folha de tela cheia para a busca de destinatário, em vez de popover ancorado no input. O telefone não tem espaço para um dropdown e um teclado ao mesmo tempo: quem abre a folha entrega a tela inteira à tarefa, a lista ocupa tudo entre o campo e o teclado, e a altura vem de visualViewport.height, não de uma medição de espaço livre. Mata os defeitos 1, 2 e 3 de uma vez e apaga as linhas 48-71 e 199-221 do wizard.
- Linha de 76px por resultado, com nome, e-mail e CPF em três linhas próprias, nada truncado. É a densidade certa quando o critério de escolha é conferir identidade com o cliente ao telefone, e não varrer uma tabela com os olhos.
- Escolha no soltar do dedo, não no encostar. Mouse continua no pointerdown (a razão escrita na linha 440 é boa), toque vai pelo click sintético, que o browser só emite quando o gesto não virou rolagem.
- Barra de polegar fixa em todas as três etapas, com o voltar à esquerda e a ação primária à direita, ambos com 44px de altura mínima. Hoje a etapa 1 não tem barra nenhuma e o único controle está no canto mais longe do polegar.
- Valor acima do botão, não dentro dele. A barra tem duas linhas no mobile: "R$ 15,00 para c***@email.com" em cima, botão "Enviar cobrança" embaixo, largura toda. O slot infoRodape do WizardShell já existe para isso.
- Revisão como lista de linhas tocáveis com chevron, uma por bloco (Transferindo, Para, Motivo). A linha inteira é o alvo; "Alterar" deixa de ser um link de 20px e vira a affordance da linha.
- Motivo numa folha, não embutido na revisão. A revisão passa a caber numa tela e volta a ser o que o nome diz: conferir antes de cobrar. A folha traz o chamado, as quatro categorias como cartões de 56px e a observação.
- Acordeão explícito só onde já existe: o bloco de indisponíveis do seletor (details/summary, 44px de alvo, seletor-unidades.tsx:180-184) já está certo e fica como está.

```
390px de largura. Três painéis: etapa 1, a folha de busca aberta, e a etapa 3.

ETAPA 1 . DESTINATARIO                 FOLHA DE BUSCA (teclado em pe)
+-------------------------------------+   +-------------------------------------+
| [=]  Ingresse            (avatar)   |56 | Cancelar       Quem recebe          |56
+-------------------------------------+   +-------------------------------------+
| Transferir                          |   | [o] juliana|                        |48
| Carolina Sampaio . Pedido a1b2c3    |   +-------------------------------------+
| Etapa 1 de 3   (1)-(.)-(.)          |   | (JP) Juliana Prado                  |
+-------------------------------------+   |      juliana.prado@email.com        |76
|                                     |   |      CPF 123.456.789-00             |
| +---------------------------------+ |   +-------------------------------------+
| | Quem vai receber?               | |   | (JP) Juliana Prado Martins          |
| | +-----------------------------+ | |   |      j.martins@email.com            |76
| | | [o] Nome, e-mail ou CPF   > | |56|   |      CPF 987.654.321-00             |
| | +-----------------------------+ | |   +-------------------------------------+
| | Busque pelo nome.               | |   | (JB) Juliana Braga   Titular atual  |
| +---------------------------------+ |   |      j.braga@email.com              |76
|                                     |   |      CPF 456.789.123-00             |
|                                     |   +=====================================+
|                                     |   | q w e r t y u i o p                 |
|           (espaco vazio)            |   |  a s d f g h j k l     TECLADO      |~300
|                                     |   |   z x c v b n m                     |
+-------------------------------------+   +-------------------------------------+
|  [<]      [ Escolher itens       ]  |72       a lista para onde o teclado
+-------------------------------------+       comeca: visualViewport.height,
   44px       44px, largura restante           nunca 288px fixos

A linha do campo na etapa 1 nao e um input: e um gatilho de 56px que abre a folha.
Com destinatario ja escolhido ela vira a linha de confirmacao, com o nome, o CPF
e o chevron, e a barra de baixo aparece com "Escolher itens".

ETAPA 3 . REVISAO
+-------------------------------------+
| [=]  Ingresse            (avatar)   |56
+-------------------------------------+
| Transferir                          |
| Carolina Sampaio . Pedido a1b2c3    |
| Etapa 3 de 3   (v)-(v)-(3)          |
+-------------------------------------+
| +---------------------------------+ |
| | Transferindo                  > | |56  <- linha inteira e o alvo
| +---------------------------------+ |
| | 2x Pista Premium                | |
| |    Lote 2 . Sex 20/12           | |
| +---------------------------------+ |
| | Incluir as outras 3 unidades    | |44  <- secondary md, largura toda
| +---------------------------------+ |
|                (v)                  |44
| +---------------------------------+ |
| | Para                          > | |56
| +---------------------------------+ |
| | (JP) Juliana Prado              | |
| |      CPF 123.456.789-00         | |
| +---------------------------------+ |
| +---------------------------------+ |
| | Motivo                        > | |56  <- abre a folha do motivo
| | Nao informado                   | |
| +---------------------------------+ |
| +---------------------------------+ |
| | Cobranca da transferencia       | |
| |              2 un.    R$ 30,00  | |
| | Total                 R$ 30,00  | |
| +---------------------------------+ |
| O destinatario herda as respostas   |
| do formulario sem alteracao.        |
+-------------------------------------+
| R$ 30,00 para j***@email.com        |
| [<]   [ Enviar cobranca          ]  |72  <- duas linhas no mobile
+-------------------------------------+

FOLHA DO MOTIVO: mesma casca da folha de busca.
Cancelar / Motivo / Salvar no topo, campo "Numero do chamado" (16px, sem zoom),
quatro cartoes de 56px em escolha unica, e a observacao embaixo.
```

**Custo.** Reaproveita tudo do DS sem tocar em src/components/: Button, Checkbox, Input, TextArea, RadioButton (so com className nova, que o componente aceita como funcao do estado), Avatar, FeaturedIcon, InputNumber, Progress. UM componente novo do produto, em alteracoes-pos-compra/components/FolhaDeBaixo.tsx, cerca de 100 linhas, usado duas vezes aqui e reaproveitavel pela troca e pelo formulario. Ele NAO pode ser construido sobre @/components/application/modals/modal.tsx: aquele overlay e `fixed inset-0 ... min-h-dvh ... pb-[clamp(16px,8vh,64px)]` (modal.tsx:13), e fixed, dvh e vh sao exatamente o que quebra dentro da moldura de 390px das apresentacoes. Entao a folha usa Modal e Dialog direto do react-aria-components (1.18 no projeto) com UNSAFE_PortalProvider getContainer={() => raizRef.current} apontando para a raiz do WizardShell, posicionamento absolute inset-0 dentro dela, e max-height escrita como numero numa custom property a partir de visualViewport.height. Numeros, nunca unidades de viewport: sobrevive na moldura. A barra de acao continua `sticky bottom-0` como hoje, que ja funciona porque gruda no container de rolagem e nao na janela; so ganha `max-md:flex-col`. Edicoes em arquivo existente: WizardShell cerca de 8 linhas (barra em duas linhas, voltar duplicado na barra, ocultarRodape condicionado ao destinatario), TransferirTitularidadeWizard troca o popover pelo gatilho mais folha (saem cerca de 45 linhas de medicao: areaVisivel nas 48-71 e o useLayoutEffect nas 199-221, entram cerca de 60 de folha, saldo quase neutro), seletor-unidades cerca de 15 linhas nos cabecalhos tocaveis, pos-compra-ui cerca de 6 linhas na className dos radios. Nada disso muda o desktop alem de melhora-lo: as linhas tocaveis e os cartoes de motivo funcionam igual com mouse.

**O que recusa.** Transformar o fluxo inteiro em bottom sheet. E o padrao reflexo para wizard no telefone e seria errado aqui: o fluxo tem rota propria, e isso e uma decisao escrita no WizardShell (linhas 10-19), nao um acidente. Folha nao tem URL. No telefone o atendente alterna de app o tempo todo (a ligacao, o WhatsApp, o CRM), e o Safari descarta aba em segundo plano: sem rota, ele volta e cai na lista de pedidos, do zero, com o cliente na linha. Folha serve para as duas sub-tarefas (busca e motivo), que sao baratas de reabrir e nao carregam estado que doi perder. Tambem recuso swipe horizontal para andar entre etapas: colide com o edge-swipe de voltar do iOS, colide com o carrossel de datas que a troca usa, e o fluxo termina numa cobranca, onde gesto acidental nunca pode avancar.

### Troca de item e formulário

**Conceito.** Uma decisão por tela e uma folha de baixo para cada escolha: o catálogo vira uma lista contínua onde a linha é o botão e a quantidade mora numa folha, e o formulário deixa de ser formulário para virar uma lista de respostas que se edita uma pergunta por vez.

**Padrões:**

- Folha inferior (bottom sheet) para escolha única e para quantidade. Substitui o popover do Select, que abre com a largura do gatilho e no máximo 256px, e tira o stepper de 120px de dentro da linha. Na folha a opção é uma linha de 56px com o texto de apoio do estoque ("48 disponíveis", "Esgotado") à direita, que é justamente o que um <select> nativo não mostra.
- Cabeçalho de grupo sticky dentro de uma lista contínua, no lugar do acordeão. Sem estado aberto/fechado não há busca que falhe, não há AnimatePresence de altura e não há um toque extra por grupo para chegar ao item.
- Linha como botão de 64px com estado à direita (vazio, "1", "2"). Papel real, aria-pressed, foco e teclado, e uma semântica só: somar uma unidade. A escolha em bloco ("Todas as 4") é um atalho explícito dentro da folha.
- Ação no polegar, em rodapé de duas linhas: estado e dinheiro em cima ("2 de 2 escolhidos · +R$ 120,00"), ação de largura total embaixo. O valor passa a ser visível ENQUANTO se escolhe, que é o número que o atendente lê em voz alta no telefone, e o rótulo do botão volta a caber.
- Busca como navegação principal, com os filtros numa fileira só de chips. A 390px cabem ~4 linhas de catálogo por tela: rolar não é opção, filtrar é. Os três controles empilhados de hoje (busca, abas de tipo, carrossel de datas) somam 184px antes do primeiro item; o carrossel passa a aparecer só quando o tipo é Ingressos.
- Formulário lido como lista de respostas e editado em folha. 20 perguntas viram ~1.120px de linhas escaneáveis com busca, em vez de ~2.080px de campos; e cada edição é uma tela de um campo só, que é o que cabe num telefone com teclado aberto.
- Scroller horizontal mantido só onde ele é a metáfora certa, que é a tira de datas, com máscara de borda em vez de setas de 28px. Os chips de 72px x 96px já são o único alvo do fluxo acima de 44px: não se mexe neles.

```
390px

A) TROCA, ETAPA "o que entra"   (hoje: 184px de filtros antes do 1o item)
+----------------------------------------------+
| <   Trocar                        2 de 4     | 56   volta + passo, nada mais
+----------------------------------------------+
| +------------------------------------------+ |
| | (o) Buscar item, lote ou data            | | 48   fonte 16px, sem zoom iOS
| +------------------------------------------+ |
| (Ingressos) ( Produtos ) ( Combos )          | 40   chips, fileira unica
| +------++------++------++------+             | 72   datas: so se tipo=Ingressos
| | sab  || dom  || sex  || sab  |             |      scroller com mascara,
| |14 mar||15 mar||20 mar||21 mar|             |      sem setas de 28px
| +------++------++------++------+             |
+----------------------------------------------+
| PROVAS DE RUA                      4 itens   | 32   sticky, sem abrir/fechar
| +------------------------------------------+ |
| | Corrida 5 km                   R$ 120,00 | | 64   <button> aria-pressed
| | Lote 2 . 64 vagas                    ( ) | |      alvo 64px, estado a direita
| +------------------------------------------+ |
| | Corrida 10 km                  R$ 180,00 | | 64
| | Lote 2 . +R$ 60,00 por unidade       (2) | |      toque soma 1; toque no (2)
| +------------------------------------------+ |      abre a folha B
| | Meia maratona 21 km            R$ 260,00 | | 64
| | Esgotado                                 | |      bloqueio escrito, sem check
| +------------------------------------------+ |
| PROVAS LONGAS                      2 itens   | 32   sticky
| ...                                          |
+----------------------------------------------+
| 2 de 2 escolhidos        +R$ 120,00 e taxa   | 24   valor visivel ENQUANTO escolhe
| +------------------------------------------+ |
| |              Revisar troca               | | 48   largura total, polegar
| +------------------------------------------+ |
+----------------------------------------------+      rodape = 104px

B) FOLHA DE QUANTIDADE  (tira o stepper de 120px de dentro da linha)
+----------------------------------------------+
|                  ====                        |      alca
| Corrida 10 km                           (x)  | 56
| 4 unidades saindo . faltam 2                 |
+----------------------------------------------+
|   +------+         2         +------+        | 96   menos/mais de 56px
|   |  -   |                   |  +   |        |      numero em 32px
|   +------+                   +------+        |
|  ( 1 )   ( 2 )   ( 3 )   ( todas as 4 )      | 48   atalhos, 44px cada
+----------------------------------------------+
| +------------------------------------------+ |
| |              Confirmar 2                 | | 48
| +------------------------------------------+ |
+----------------------------------------------+

C) EDITAR FORMULARIO   (hoje: 20 campos num rolo de ~2.080px)
+----------------------------------------------+
| <   Formulario . Ana Beatriz        1 de 2   | 56
| Corrida 10 km . Lote 2                       |
+----------------------------------------------+
| +------------------------------------------+ |
| | (o) Buscar resposta                      | | 48   "camiseta" acha em 1 toque
| +------------------------------------------+ |
| ( Todas 20 ) ( Alteradas 1 ) ( Em branco 0 ) | 40
+----------------------------------------------+
| Tamanho da camiseta                      >   | 56   linha = resposta
| M                                            |
|----------------------------------------------|
| Local de retirada do kit                 >   | 56
| Arena das Dunas                              |
|----------------------------------------------|
| Atestado medico                          >   | 56
| atestado-medico.pdf                          |      nome inteiro: a linha e dele
|----------------------------------------------|
| Historico medico e observacoes           >   | 56
| "Cirurgia no joelho em 2021, liberado..."    |
+----------------------------------------------+
| +------------------------------------------+ |
| |          Revisar 1 alteracao             | | 48
| +------------------------------------------+ |
+----------------------------------------------+      ~1.120px no lugar de ~2.080

D) FOLHA DE UMA PERGUNTA  (no lugar do popover de 256px)
+----------------------------------------------+
|                  ====                        |
| Tamanho da camiseta                     (x)  | 56
| Resposta atual: M                            |
|----------------------------------------------|
| ( ) PP                       12 disponiveis  | 56
| ( ) P                              Esgotado  | 56   desabilitada, com o motivo
| (o) M                        48 disponiveis  | 56
| ( ) G                        31 disponiveis  | 56
| ( ) GG                        7 disponiveis  | 56
|----------------------------------------------|
| +------------------------------------------+ |
| |                Usar G                    | | 48
| +------------------------------------------+ |
+----------------------------------------------+

E) MOTIVO DA ALTERACAO, na revisao dos dois fluxos
+----------------------------------------------+
| Motivo da alteracao                          |
| Fica so no historico do pedido.              |
|----------------------------------------------|
| (o) Pedido do cliente                        | 44   hoje: 20px de altura
|----------------------------------------------|
| ( ) Erro de cadastro                         | 44
|----------------------------------------------|
| ( ) Erro do operador                         | 44
|----------------------------------------------|
| ( ) Outro                                    | 44
+----------------------------------------------+
```

**Custo.** Um componente novo do produto e quatro refatorações curtas; nenhuma linha em src/components/.  1. FolhaInferior, novo, em backstage/alteracoes-pos-compra/components/. Monta sobre ModalOverlay/Modal/Dialog de @/components/application/modals/modal.tsx, que abaixo de 640px já ancora embaixo (items-end sm:items-center, linha 13). O que se escreve é a alça, o canto arredondado no topo e o rodapé de ação: ~80 linhas. O padrão já existe funcionando no repo em produtos/landing-pages/sports-week/components/BuscaBottomSheet.tsx, com portal, inert e trava de rolagem. É cópia e não import, porque o repo proíbe um produto importar de outro, exatamente como o comentário do abas-carrossel.tsx já registra para o carrossel.  2. LinhaCatalogo vira <button>: troca de tag, aria-pressed, min-h-16 e a separação das duas ações. A lógica de maximo, bloqueado, itemAtual e das badges fica igual. ~30 linhas mexidas em TrocarItensWizard.tsx.  3. O Accordion local (TrocarItensWizard.tsx:596-618) sai e dá lugar a um cabeçalho de grupo sticky de ~10 linhas. Saem junto o estado aberto, o bug da busca e o AnimatePresence de altura. Saldo negativo de código.  4. EditarFormularioWizard vira lista mais folha. O EditorResposta (respostas-ui.tsx:82) entra inteiro dentro da folha, sem reescrita, e a linha de leitura já existe em RespostaLinha (respostas-ui.tsx:49). O que se escreve é a busca, os chips de filtro e a ligação linha/folha: ~90 linhas.  5. WizardShell: rodapé de duas linhas (flex-col gap-2 md:flex-row, botão w-full md:w-auto) e a nova prop para o valor. ~8 linhas.  Do design system entram sem adaptação: Button, Badge, Checkbox, RadioButton, Input, TextArea, Select (só dentro da folha, no desktop), ModalOverlay/Modal/Dialog, Progress.MinimalIcons. Tudo em token semântico, nada de cor solta.  Moldura de 390px das apresentações, que é onde isto normalmente quebra em silêncio: o rodapé já é sticky bottom-0 hoje, então continua dependendo de a moldura não ter overflow-hidden nem transform, e esse risco não aumenta. A FolhaInferior é fixed inset-0: ela PRECISA sair por createPortal para o document.body e marcar a página como inert enquanto está aberta, senão ancora na moldura em vez da janela e cobre o lugar errado. A largura da folha vem por contexto, em px, nunca em vw. É o mesmo arranjo que a folha do sports-week usa, então não há nada a descobrir, só a repetir.

**O que recusa.** Swipe na linha do catálogo para adicionar e remover, e swipe horizontal para andar entre as etapas do wizard. É o primeiro reflexo de "deixar nativo" e eu recuso os dois. O swipe é invisível: não existe estado vazio que o ensine, e esta superfície termina cobrando o cartão de um cliente que está ao telefone naquele momento. Uma ação sem rótulo, sem confirmação e sem desfazer num fluxo que gera cobrança é exatamente o defeito 1 outra vez, só que com gesto no lugar do clique mudo. E o swipe entre etapas colide de frente com os dois scrollers horizontais que já existem na mesma tela, a tira de datas e os chips de tipo, além de não ter como existir para frente, porque avançar depende de podeAvancar. Pelo mesmo motivo recuso o <select> nativo, que resolveria o zoom do iOS de graça: ele não mostra o texto de apoio de estoque ("48 disponíveis", "Esgotado"), e é essa informação que sustenta a regra de reserva. Barato no pixel, caro na decisão.

