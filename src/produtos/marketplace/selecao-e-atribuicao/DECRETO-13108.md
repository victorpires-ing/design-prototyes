<!-- Especificação de adequação ao Decreto nº 13.108, de 31 de agosto de 2026.
     Texto oficial: planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/d13108.htm
     Escopo: src/produtos/marketplace/selecao-e-atribuicao/ -->

# Recomendação final: preço total, taxa de serviço e quantitativo na tela de seleção e atribuição

---

## 1. Resposta direta à sua dúvida

**Some. E discrimine. Não são alternativas, são dois deveres simultâneos, e eles não competem pelo mesmo pixel.**

A tensão que você sentiu é falsa porque os dois artigos pedem coisas em níveis diferentes:

- O art. 4º VI e o art. 7º pedem **o preço total, de forma clara, destacada e ostensiva**. "Destacada" é comparativo: alguma coisa precisa ser a maior da tela. Se face e total têm o mesmo peso, nenhum está destacado, e a ordem de leitura decide a favor da face. Logo, o total tem que ser maior.
- Os mesmos artigos pedem **"discriminadas todas as taxas acessórias"**. Isso é dever autônomo, não nota de rodapé. Embutir a taxa e não dizer o valor (modelo Dice) resolve metade e falha na outra.

Sua ideia original, `R$ 336,00 (+ 67,20)`, falha nos dois: nenhum dos números é o total, e você pede soma mental. É exatamente o layout pelo qual a FTC condenou a StubHub em abril de 2026 (listar as taxas e não somar foi violação por si só) e é o que a Sympla ainda faz hoje.

A solução não é escolher um lado, é usar **dois níveis tipográficos**:

| Nível | O quê | Papel |
|---|---|---|
| Dominante | `R$ 403,20` | o total, a decisão |
| Secundário, colado, sempre visível | `R$ 336,00 + R$ 67,20 de taxa` | a prova, a conferência |

A decomposição deixa de ser **aritmética obrigatória** e vira **conferência opcional**. O comprador que quer só saber quanto vai pagar lê um número. O comprador (ou o fiscal) que quer auditar lê a linha de baixo. Nenhum dos dois clica em nada.

**Por que não só o total (all-in puro):** três artigos ficam inauditáveis na tela. O art. 9º (proporcionalidade) só é verificável quando se vê R$ 67,20 contra R$ 33,60. O art. 8º III (taxa que cerceia a meia-entrada) idem. E o art. 6º condiciona a licitude da própria cobrança a ela estar "devidamente discriminada".

**Por que não só face mais taxa:** o art. 7º diz literalmente "inclusive o valor total a ser pago", e a evidência comportamental é consistente (Morwitz, Greenleaf & Johnson 1998 e a revisão de 2016: no formato particionado o consumidor ancora no primeiro número e subestima o total; o efeito é maior quando a sobretaxa é percentual, por isso a composição vai sempre em reais, nunca em "+20%").

---

## 2. A regra de ouro

> **Em toda superfície que mostra dinheiro, o maior número é o que a pessoa paga por aquilo, e a linha logo abaixo dele diz, em reais e sem nenhum clique, de que ele é feito.**

Dois corolários que valem como regra de code review:

1. **Nunca itemização sem total.** Mata o `"+ taxas"` de hoje e o card da Sympla.
2. **Nunca total sem itemização.** Mata o modelo Dice.

**Teste de aceite operacional, que qualquer pessoa roda sem conhecer a lei:** tire print de qualquer tela do fluxo sem clicar em nada. Se o print não contém um total e um valor de taxa em reais, a tela está irregular.

E a regra de hierarquia: **nenhum número monetário de um bloco pode ser maior, mais pesado ou mais contrastado que o total daquele bloco.** Isso inclui preço de face, parcela, preço riscado de lote anterior e badge promocional.

---

## 3. Especificação por superfície

### Tokens (vale para tudo)

| Papel | Classe |
|---|---|
| Total, escopo item ou linha de carrinho | `text-md font-bold text-primary tabular-nums` |
| Total, escopo card de combo e rodapé de modal | `text-lg font-bold text-primary tabular-nums` |
| Total, barra de total | `text-xl font-bold text-primary tabular-nums` |
| **Composição** | `text-sm font-medium text-tertiary tabular-nums` |
| Metadado (lote, grupo, sessão) | `text-sm text-tertiary` |
| Rótulo "Total a pagar" | `text-sm font-medium text-tertiary` |
| Nome do item | `text-sm font-bold text-primary` |
| Link | `Button color="link-color" size="sm"` |
| Aviso de cota | `text-sm text-tertiary` (nunca warning, ver seção 5) |

A composição leva `font-medium` de propósito: hoje ela usaria o token idêntico ao do lote e da descrição, e a prova ficaria camuflada como metadado. `gap-0.5` entre total e composição, `gap-1.5` para o resto, para que os dois leiam como um bloco só.

**Duas formas da legenda, por largura:**

| Forma | Texto | Onde |
|---|---|---|
| curta | `R$ 336,00 + R$ 67,20 de taxa` | linha de ingresso, linha de carrinho, sub-linhas |
| completa | `R$ 336,00 + R$ 67,20 de taxa de serviço` | card de combo, rodapé do modal, barra de total, detalhamento |

O nome completo "taxa de serviço" aparece em superfícies não opcionais (faixa de contexto, barra de total, detalhamento), então a forma curta não cria ambiguidade e economiza 48px por linha, que é a diferença entre caber e quebrar em 375px.

---

### 3.0 Faixa de contexto (nova, uma vez por etapa de seleção)

Logo abaixo das abas, antes do primeiro grupo. Garante que o nome e a natureza do serviço existam na mesma fase do primeiro contato, mesmo com carrinho vazio.

```
Os preços dos ingressos já incluem a taxa de serviço. Produtos não têm taxa de serviço.
O que é a taxa de serviço
```

`text-sm text-tertiary` + link. A segunda frase é obrigatória: sem ela o enunciado é categoricamente falso acima de um catálogo que contém produtos.

### 3.0.1 Estado vazio (hoje a tela não tem nenhum valor antes do primeiro item)

Faixa acima das abas, com valor em reais e hierarquia correta:

```
Ingressos a partir de R$ 180,00
R$ 150,00 + R$ 30,00 de taxa de serviço
```

Valor em `text-lg font-bold text-primary`, composição em `text-sm font-medium text-tertiary`. **Nunca `R$ 0,00` como número dominante.** O mínimo é calculado sobre ingressos sem benefício (meia-entrada fora do "a partir de"), no escopo da aba ou data corrente.

---

### a. Linha de ingresso (`IngressoRow`, `pages/SelecaoEAtribuicao.tsx:1715`)

**Mudança estrutural obrigatória:** hoje é `flex items-center gap-4` com texto e stepper lado a lado. A coluna de texto mede **177px reais em 375px** (91px quando o ingresso tem imagem). Qualquer legenda de preço quebra em duas ou quatro linhas ali.

Vire a linha em duas faixas: faixa de cima com texto + stepper, faixa de baixo com o **bloco de preço ocupando a largura total**. Isso devolve 343px para a legenda no mobile e remove o problema de raiz.

```
┌─────────────────────────────────────────────────────────┐
│ Meia-entrada                              ┌───┬─┬───┐   │  text-sm font-bold text-primary
│ Lote 2                                    │ − │1│ + │   │  text-sm text-tertiary
│ Consulte quem tem direito e quais         └───┴─┴───┘   │  text-sm text-tertiary
│ documentos valem                                        │
│ Ver regras da meia-entrada                              │  link-color sm, abre Slideout
├─────────────────────────────────────────────────────────┤
│ R$ 201,60                                               │  text-md font-bold text-primary
│ R$ 168,00 + R$ 33,60 de taxa                            │  text-sm font-medium text-tertiary
└─────────────────────────────────────────────────────────┘
```

Inteira, mesma estrutura: `R$ 403,20` / `R$ 336,00 + R$ 67,20 de taxa`.

**Copy exata:**
- Total: `R$ 201,60`
- Composição: `R$ 168,00 + R$ 33,60 de taxa`
- Descrição da meia (substitui o ponteiro quebrado de `data/combos.ts:154`, que manda para termos que não falam de meia-entrada): `Consulte quem tem direito e quais documentos valem`
- Link: `Ver regras da meia-entrada`

**O link precisa de prop própria.** A descrição hoje é renderizada com `dangerouslySetInnerHTML` (`:1731`), então o link não pode vir do campo de texto. Adicione `linkMeia?: boolean` ao `Item` derivado, ou derive de `beneficio === "meia-entrada"`.

**O link abre `Slideout` (já existe em `components/Slideout.tsx`), nunca `navigate()`.** Hoje `:592` desmonta a tela e o carrinho é `useState` puro: exercer o benefício custa refazer a compra inteira. Painel sobre a tela preserva o carrinho por construção e dispensa persistência.

### Cabeçalho do grupo (`GrupoIngressos`, `:1700`)

Hoje é só ícone, nome e chevron. Ganha uma segunda linha:

```
Arquibancada
2.000 ingressos disponibilizados, 800 com meia-entrada
```

Nome `text-sm font-bold text-primary`, quantitativo `text-sm text-tertiary`. O botão hoje é um único `<button>` com os filhos dentro: a linha do quantitativo precisa ficar **fora** dele, senão entra no nome acessível.

---

### b. Combo fixo (`ComboFixoView`, `:1559`) e combo dinâmico (`ComboDinamicoCard`, `:1621`)

#### Combo fixo

```
┌─────────────────────────────────────────────────────────┐
│ PASSAPORTE - SÁBADO + DOMINGO - LOTE 2    [ − ] 1 [ + ] │  text-md font-bold text-primary
│ [sáb, 08/08/26 • 14h00] [dom, 09/08/26 • 14h00]         │  chips text-sm text-tertiary
│ LOTE 2                                                  │  text-sm text-tertiary
│ Os ingressos de PASSAPORTE são válidos para...          │  text-sm text-tertiary
│                                                         │
│ R$ 619,16                                               │  text-lg font-bold text-primary
│ R$ 515,97 + R$ 103,19 de taxa de serviço                │  text-sm font-medium text-tertiary
│                                                         │
│ A taxa de serviço é cobrada uma vez sobre o valor do    │  text-sm text-tertiary
│ combo.                                                  │
├─────────────────────────────────────────────────────────┤
│ 08.08 | LOTE 2 • PASSAPORTE - 08.08 - LOTE 2            │  text-sm font-semibold text-primary
│ sáb, 08/08/26 • 14h00                        R$ 257,99  │  text-sm text-tertiary / valor text-sm text-primary
│ 09.08 | LOTE 2 • PASSAPORTE - 09.08 - LOTE 2            │
│ dom, 09/08/26 • 14h00                        R$ 257,98  │
│ Taxa de serviço do combo                     R$ 103,19  │
│ Total do combo                               R$ 619,16  │  font-bold
│ Os valores por dia são o rateio do preço do passaporte. │  text-sm text-tertiary
├─────────────────────────────────────────────────────────┤
│ Detalhes                                            ⌄   │
└─────────────────────────────────────────────────────────┘
```

Fecha exato: 257,99 + 257,98 + 103,19 = 619,16. Isso mata o ponto em que hoje cada incluso diz só `"1 item"` e o comprador não consegue atribuir valor a nenhum dos dois dias.

**A nota antiduplicidade fica fora do accordion e fora do `<button>` "Detalhes".** Hoje essa linha inteira é um botão; pôr a frase dentro faz dela parte do nome acessível.

**Dentro do accordion a taxa aparece em uma linha só**, nunca rateada por dia. 51,59 sobre 257,98 é 19,998%, e exibir isso numa superfície cujo propósito é demonstrar proporcionalidade é contraproducente.

#### Combo dinâmico

`exibirPreco` deixa de existir. Hoje `pages/Config.tsx:130` cria todo combo dinâmico novo sem a flag, ou seja, oculto por padrão: um valor que entra no carrinho sem o comprador nunca ter visto é art. 7º §2º na forma mais direta.

**Preço firme** (sem opcionais pagos):
```
SPECIAL PASS 3 MASCULINO
Consumação inclusa
R$ 540,00                                      [ Selecionar ]
R$ 450,00 + R$ 90,00 de taxa de serviço
```

**Preço variável:**
```
SPECIAL PASS 3 FEMININO
Consumação inclusa
A partir de R$ 480,00                          [ Selecionar ]
R$ 400,00 + R$ 80,00 de taxa de serviço
Itens opcionais aumentam o valor. Você vê o total ao montar.
```

`A partir de` em `text-sm text-tertiary` colado ao número em `text-lg font-bold`.

**Regra do "a partir de":** é a menor combinação **válida**, ou seja, obrigatórios mais o mínimo de opcionais necessário para satisfazer `minItens`, escolhendo os mais baratos. Base pura é subdeclaração e vira drip pricing dentro de uma proposta antidrip.

**O badge de desconto sai do ar no mesmo commit.** Hoje `totalValor` (`:278`) soma `qtd * precoUnit` e nunca consulta `cupom`: anunciar "10% OFF" ao lado de um total grande e ostensivo que não desconta nada é pior do que hoje. Só volta quando o desconto existir no cálculo, e aí com valor em reais ao lado do percentual.

#### Modal de montagem (`components/SelecaoItensModal.tsx`)

É a fase em que o preço mais muda e a única hoje sem nenhum valor na tela.

```
├─────────────────────────────────────────────────────────┤
│ Camarote VIP Inteira                            1×      │
│ Arquibancada • Lote 2                    incluso        │
│                                                         │
│ Pista Premium                            [ − ] 1 [ + ]  │
│ Pista Premium • Lote 2                 + R$ 180,00      │  text-sm font-semibold text-primary
├─────────────────────────────────────────────────────────┤
│ Total do combo                                          │  text-sm font-medium text-tertiary
│ R$ 660,00                                               │  text-lg font-bold text-primary
│ R$ 550,00 + R$ 110,00 de taxa de serviço                │  text-sm font-medium text-tertiary
│ [              Confirmar              ]                 │
│ [              Cancelar               ]                 │
└─────────────────────────────────────────────────────────┘
```

**Copy:** `Total do combo`, `+ R$ 180,00` (incremento all-in), `incluso` (substitui `Grátis`, que sugere valor de mercado zero).

Dois bugs de conformidade que morrem aqui:

1. **`mostrarPreco` e `precoVisivel` saem.** Hoje `:237-241` soma `item.preco * quantidade` para todo opcional com preço maior que zero **sem checar `mostrarPreco`**. No mock, `special-feminino` tem `precoVisivel: ["camiseta"]`, então cada Pista escolhida soma R$ 150,00 invisíveis: o comprador vê R$ 400,00 no card e R$ 550,00 no carrinho sem nenhuma linha explicando.
2. **Rótulo e cálculo passam a usar o mesmo predicado.** Hoje `SelecaoItensModal.tsx:90` monta o label só a partir de `it.preco`, enquanto o redutor só soma quando `!item.obrigatorio && preco > 0`. Em `special-masculino`, `pista` é obrigatório com `qtdMax: 3`: ao expor todos os preços, o modal mostraria `+ R$ 150,00` em até três unidades que somam R$ 0,00. Extraia `precoExtraDoItem(item)`, que devolve 0 para obrigatório, e use nos dois lugares. Item obrigatório mostra `incluso`, nunca um valor.

**O incremento é diferença, não cálculo independente:** `+ R$ 180,00` = `totalComboCom(item) - totalComboSem(item)`. Garante por construção que a soma dos incrementos exibidos iguale o rodapé.

---

### c. Linha do carrinho (`CartGroupRow` `:1737` e `ProdutoResumoRow` `:1261`)

Hoje as duas divergem: `ProdutoResumoRow` recebe `g.precoUnit` (unitário, `:549`) e `CartGroupRow` imprime `precoUnit * qtd` (subtotal, `:1745`). A mesma camisa aparece como R$ 119,90 no resumo lateral e R$ 239,80 no resumo inline sem mapa (`:755-757`). **Uma linha só, mesma regra para ingresso, combo e produto.**

Regra: o número em negrito é **sempre o subtotal da linha**; o unitário vive na composição.

**Com quantidade maior que 1:**
```
Inteira                                       [ − ] 2 [ + ]
Arquibancada • Lote 2
R$ 806,40
2 × R$ 403,20, inclui R$ 134,40 de taxa
```

**Com quantidade 1:**
```
Meia-entrada                                  [ − ] 1 [ + ]
Arquibancada • Lote 2
R$ 201,60
R$ 168,00 + R$ 33,60 de taxa
```

Manter o `2 × R$ 403,20` é o que preserva a comparação meia contra inteira no carrinho: sem ele, duas meias e uma inteira imprimem exatamente os mesmos três números e a prova do art. 9º some justamente na tela de conferência.

**Produto:**
```
[img] Camisa Oficial #BGS26                   [ − ] 2 [ + ]
      Tamanho M
      R$ 239,80
      2 × R$ 119,90
```

**Combo, com sub-linhas finalmente valoradas:**
```
SPECIAL PASS 3 FEMININO                       [ − ] 1 [ + ]
R$ 660,00
R$ 550,00 + R$ 110,00 de taxa
   1  Camarote VIP · Inteira         R$ 281,25
      26/12 • 10h30
   1  Pista Premium · Inteira        R$ 168,75
      26/12 • 10h30
   1  Camisa Oficial #BGS26          R$ 100,00
```

**As sub-linhas exibem o rateio do preço de venda do combo, não o preço de catálogo dos componentes.** Esse é o ponto em que a maioria das versões errou: `combo.preco` (450) não é a soma das faces de catálogo (250 + 150 = 400), porque o combo desconta. Listar preço de catálogo abre um buraco visível de R$ 50,00 na tela. Rateio pro rata pelas faces, resíduo de centavo no último.

A coluna de valor nas sub-linhas tem ~188px disponíveis no card de 360px e o nome já usa `truncate`. Se o truncamento ficar agressivo, a sub-linha vira duas linhas: nome na primeira, valor alinhado à direita na segunda.

**Cabeçalho de seção (`SecaoHeader`, `:513`, hoje aceita `valor?` e nunca recebe):**

```
Ingressos   R$ 1.008,00  ·················  Limpar tudo
inclui R$ 168,00 de taxa de serviço
1 meia-entrada neste pedido. Leve o documento comprobatório na entrada.
```

```
Produtos    R$ 119,90  ···················  Limpar tudo
Produtos não têm taxa de serviço.
```

Ligar o `valor` é uma linha de código e resolve a discriminação por seção sem poluir cada item com uma segunda linha de taxa. `Ingressos R$ 1.008,00` é **all-in**, consistente com as linhas acima.

E o resumo inline do layout sem mapa (`:748`) para de rotular tudo como `"Ingressos"` e passa a usar `resumoSecoes`, igual às outras rotas.

---

### d. Barra de total, desktop e mobile

**Hoje são dois blocos de markup independentes e já divergentes:** `totalBar` em `:488-507`, montada em `:568`, `:661`, `:724` e `:761`, e uma cópia manual em `:818-830` dentro do `createPortal`. A cópia mobile não tem "Remover itens" e usa espaçamento diferente. Vira **um componente**, `components/barra-total.tsx`, com `variante: "desktop" | "mobile"`.

#### Desktop

```
┌─────────────────────────────────────────────────────────┐
│ Total a pagar                                           │  text-sm font-medium text-tertiary
│ R$ 1.127,90                        [    Continuar    ]  │  text-xl font-bold text-primary
│ inclui R$ 168,00 de taxa de serviço                     │  text-sm font-medium text-tertiary
│ R$ 1.127,90 é o valor final no Pix e no cartão à vista. │  text-sm text-tertiary
│ Ver detalhamento                                        │  link-color sm
│ 4 itens      Remover itens                              │  text-sm text-tertiary
└─────────────────────────────────────────────────────────┘
```

**Copy exata:** `Total a pagar` / `R$ 1.127,90` / `inclui R$ 168,00 de taxa de serviço` / `R$ 1.127,90 é o valor final no Pix e no cartão à vista.` / `Ver detalhamento` (alterna com `Ocultar detalhamento`) / `4 itens` / `Remover itens`.

A string `+ taxas` desaparece de `:492` e `:821`. O total nunca carrega sufixo, asterisco ou qualificador dentro do próprio bloco tipográfico.

#### Mobile

Mesma componente, mesmas strings, duas diferenças de layout: botão full width em segunda linha (as linhas secundárias não cabem ao lado dele em 375px) e a frase de pagamento na forma curta.

```
┌──────────────────────────────────────────────┐
│ Resumo da compra                          ⌄  │
├──────────────────────────────────────────────┤
│ (accordion: resumoSecoes + Remover itens)    │
├──────────────────────────────────────────────┤
│ Total a pagar                                │
│ R$ 1.127,90                                  │  text-xl font-bold
│ inclui R$ 168,00 de taxa de serviço          │
│ Valor final no Pix e no cartão à vista       │
│ Ver detalhamento              4 itens        │
│ [             Continuar              ]       │
└──────────────────────────────────────────────┘
```

**Duas correções de ostensividade que não são opcionais:**

1. **Total e linha de taxa ficam fora do accordion.** Hoje `resumoAberto` inicia `false` (`:157`) e todo preço por item fica atrás de um toque, em todas as etapas. Com o bloco de valor fora, o estado fechado já satisfaz a regra de ouro.
2. **O espaçador `h-36` (`:769`) precisa virar medido.** São 144px fixos calibrados à mão para o rodapé atual (~138px). O rodapé novo mede ~165px a ~180px, então 30px ou mais de conteúdo do fim da página ficam permanentemente cobertos. Use `ResizeObserver` no `div` do portal gravando a altura numa CSS custom property, ou no mínimo recalibre com comentário amarrando o valor ao layout.

---

### e. Bloco de detalhamento

Abre em `Ver detalhamento`, no lugar, nos dois breakpoints. É a **única** expansão de preço do desenho inteiro, e nunca é a primeira aparição de nenhum fato: a taxa já está na barra.

```
Detalhamento do valor

Ingressos (3)                                    R$ 1.008,00
   Valor dos ingressos, sem a taxa                 R$ 840,00
   Taxa de serviço, 20% sobre o valor do ingresso  R$ 168,00
       Arquibancada · Inteira      2 × R$ 67,20    R$ 134,40
       Arquibancada · Meia-entrada 1 × R$ 33,60     R$ 33,60

Produtos (1)                                       R$ 119,90
   Produtos não têm taxa de serviço.

Total a pagar                                    R$ 1.127,90

R$ 1.127,90 é o valor final no Pix e no cartão à vista.
No parcelado, o valor das parcelas e o total com juros aparecem antes
de você confirmar.
Se o evento for cancelado, adiado ou sofrer alteração relevante,
devolvemos o valor do ingresso e a taxa de serviço.

O que é a taxa de serviço
Como definimos a taxa de serviço
```

**Ponto crítico de coerência:** o rótulo `Ingressos` imprime **R$ 1.008,00**, o mesmo número do `SecaoHeader`. A face aparece numa linha **explicitamente rotulada** (`Valor dos ingressos, sem a taxa`). Nunca dois números diferentes sob o mesmo rótulo na mesma tela.

O percentual aparece **aqui e só aqui**, sempre ao lado do valor absoluto.

Tipografia: título `text-md font-bold text-primary`, rótulos de seção `text-sm font-semibold text-tertiary`, valores `text-sm text-primary tabular-nums`, `Total a pagar` em `text-lg font-bold text-primary`.

**Sheet "O que é a taxa de serviço":**

```
A taxa de serviço remunera a emissão e a validação do ingresso,
o atendimento ao comprador e a operação da bilheteria digital.

É uma taxa só. Não cobramos taxa de conveniência, de processamento
nem de entrega sobre o ingresso.

Ela corresponde a 20% do valor do ingresso, sempre no mesmo percentual
para inteira e meia-entrada. Por isso a meia continua custando
exatamente metade: R$ 201,60 contra R$ 403,20.

Produtos não têm taxa de serviço.

Se o evento for cancelado, adiado ou sofrer alteração relevante,
devolvemos o valor do ingresso e a taxa de serviço.
```

**Todos os números dessa sheet são derivados da config, nunca literais.** O protótipo monta qualquer evento por URL: número legal cravado em string vira informação falsa no segundo evento.

`Como definimos a taxa de serviço` (art. 7º §3º) **só vai ao ar quando o documento existir**. Link quebrado é pior que link ausente.

---

### f. Produtos: tratar igual na forma, diferente no conteúdo

**Igual:** o número grande é o que a pessoa paga, com a mesma classe tipográfica. Como o produto não tem taxa, o preço já é o total: `ProdutoCard` (`:1301`) e `VariacaoModal` (`:1352`) não mudam de número, só de hierarquia.

**Diferente:** não ganham linha de composição. Um `Sem taxa de serviço` repetido em cada card de uma grade de quatro colunas e em cada linha do carrinho é oito ou mais repetições de uma negativa.

**A ausência de taxa é discriminada em exatamente dois lugares:** na faixa de contexto (seção 3.0) e no cabeçalho da seção Produtos do carrinho. No detalhamento aparece uma terceira vez, mas ali é o razonete.

`VariacaoModal` ganha subtotal: hoje o modal soma quantidades de P, M, G e GG (`:1381-1392`) e não mostra nenhum valor.

**Produto não ganha campo de isenção no modelo.** A ausência de taxa é regra do cálculo (`precoProduto` devolve `taxa: 0`), não flag editável. Flag editável seria convite a cobrar taxa de produto em algum evento e quebrar a gramática da tela.

---

## 4. Taxa de processamento do SDK

### A regra arquitetural

**Nada obrigatório pode viver fora do total exibido.** O total desta tela precisa ser o valor completo para pelo menos um caminho de pagamento real, e esse caminho precisa ser o padrão e sem acréscimo.

O custo de parcelamento não é taxa acessória: o art. 3º V define taxa acessória como cobrança **incidente sobre o preço de face do ingresso** para remunerar serviço prestado. Juros decorrem de uma escolha que o comprador ainda não fez, num instrumento de pagamento, e são regidos pelo CDC art. 52. Logo ficam fora do total desta tela **e fora do modelo de dados** (criar um campo para eles é criar o gancho para alguém reimprimir "+ taxas").

### Copy exata recomendada

**Barra de total, desktop:**
```
R$ 1.127,90 é o valor final no Pix e no cartão à vista.
```

**Barra de total, mobile (forma curta):**
```
Valor final no Pix e no cartão à vista
```

**Detalhamento:**
```
R$ 1.127,90 é o valor final no Pix e no cartão à vista.
No parcelado, o valor das parcelas e o total com juros aparecem antes
de você confirmar.
```

**Primeira linha da tela de pagamento, no handoff:**
```
Total a pagar R$ 1.127,90
É o mesmo valor que você viu no resumo da compra.
```

Por que essa redação e não `Parcelamento pode ter juros`:

- **Tem magnitude.** Repete o número e diz que ele é final para um caminho concreto. `"pode ter"` sem valor é o mesmo vício do `"+ taxas"` que estamos matando.
- **Nomeia a condição evitável** (parcelado), não o genérico "meio de pagamento", então o comprador sabe o que fazer para não pagar mais.
- **Diz quando o número aparece** e que aparece antes da confirmação, que é literalmente o que o art. 7º §2º pede como ciência prévia.
- **Não usa a palavra "taxa"** para os juros, evitando a hipótese de similaridade do art. 6º.

### Condição para subir

Essa frase só vai ao ar com confirmação de que **nada é somado no caminho à vista**: gateway, antifraude e parceiros. É afirmação, não ressalva, e afirmação falsa sobre preço é pior que omissão (CDC arts. 30 e 37). Trave com contrato técnico: o SDK recebe o total como valor fechado e o front assume erro visível se divergir do snapshot.

**Se o negócio exigir tarifa obrigatória por meio de pagamento** (boleto com R$ 3,00, por exemplo), não existe terceira saída. Ou a plataforma absorve, ou o meio de pagamento vira **passo zero** do fluxo e o preço exibido já é o do método escolhido.

### Proibido em qualquer cenário

- `+ taxas`, `+ taxas conforme o meio de pagamento`, `taxas podem variar`, `valores sujeitos a alteração`
- Asterisco ou qualquer sufixo dentro do bloco tipográfico do total
- Valor de parcela nesta tela, em qualquer lugar. No card da Sympla o elemento mais destacado é `em até 12x R$ 64,28`, cuja soma (R$ 771,36) é 24% acima do total à vista de R$ 621,50. No checkout o formato obrigatório é `12x de R$ 94,00, total R$ 1.248,00, com juros`, nunca mais proeminente que o total à vista
- Toggle "incluir taxas". O caso StubHub mostra que preferência opt-in não protege: all-in é o default e o único estado
- Add-on pré-marcado (seguro, doação, entrega)

### Risco residual honesto

O decreto brasileiro não tem carve-out textual de cobrança evitável como o CMA209 do Reino Unido. A separação entre taxa acessória e custo de instrumento é leitura defensável, não certeza. **Leve ao jurídico como pergunta antes de escrever a string**, porque as duas saídas são arquiteturalmente diferentes: se o custo de parcelamento for taxa acessória, ele precisa de valor na tela e a escolha do meio de pagamento sobe para antes desta etapa.

---

## 5. Quantitativo e meia-entrada (art. 11)

### A premissa não se sustenta como está, mas está a um passo

O art. 11 tem núcleo e extensão. Núcleo: "o quantitativo **total** de ingressos disponibilizados". Extensão: "**inclusive** aqueles com o benefício da meia-entrada". "Inclusive" acrescenta, não substitui.

Mais importante que a letra: **um número de meias sem denominador é numerador solto.** "Restam 12 meias" não deixa ninguém verificar nada. O art. 11 combinado com o art. 8º I existe para tornar a cota de 40% auditável pelo consumidor. A informação que você quer dar é justamente a que não cumpre a função; a que você quer omitir é a que cumpre.

**A boa notícia:** as duas coexistem e o custo é dois inteiros.

| Superfície | O quê | Papel |
|---|---|---|
| Cabeçalho do grupo | par estático | **cumpre o art. 11** |
| Carrinho, seção Ingressos | contador do pedido | extra de UX, seu pedido |
| Página `/marketplace/meia-entrada` | par estático do evento + por grupo | reforço e art. 11 p.ú. |

### Formato: par estático, nunca contador vivo

"Disponibilizados" é particípio de disponibilizar, ou seja, ofertado, não saldo. Quatro razões no próprio texto: o art. 8º I fala em restrição da **oferta**; o art. 13 §2º mostra que, quando o decreto quer tempo real, ele diz "em tempo real"; o parágrafo único compara vendidos contra universo fixo; e um número caindo durante o preenchimento vira obstáculo do art. 8º II e colide com o congelamento do art. 13 §1º.

### Copy exata

**a) Cabeçalho do grupo** (ancorado no grupo porque os 40% só são comparáveis entre assentos equivalentes):
```
Arquibancada
2.000 ingressos disponibilizados, 800 com meia-entrada
```

**b) Carrinho, fim da seção Ingressos:**
```
1 meia-entrada neste pedido. Leve o documento comprobatório na entrada.
```
Plural: `2 meias-entrada neste pedido. Leve o documento comprobatório na entrada.`
Se houver zero meias, nada aparece. Oferecer meia a quem não pediu é presumir elegibilidade.

**c) Página de meia-entrada, card "Disponibilidade" (`pages/MeiaEntrada.tsx:318-328`)**, que hoje enuncia os 40% em prosa sem um único número do evento:
```
Neste evento
3.500 ingressos disponibilizados
1.400 com meia-entrada, 40% do total

Por grupo
Arquibancada     2.000 disponibilizados    800 com meia-entrada
Pista Premium    1.200 disponibilizados    480 com meia-entrada
Camarote VIP       300 disponibilizados    120 com meia-entrada

Até 30 dias após o evento, publicamos aqui o percentual de ingressos
vendidos com o benefício.
```

A última frase é o art. 11 parágrafo único e resolve a promessa vazia da FAQ atual (`:565-570`), que hoje o código não tem como produzir.

### Cota esgotada

A linha **continua na tela**, com stepper desabilitado. Sumir com a linha é restrição artificiosa da oferta na forma mais literal (art. 8º I).

```
Meia-entrada
Lote 2
A cota de meia-entrada deste grupo já foi integralmente vendida.
Entenda a cota de meia-entrada
R$ 201,60
R$ 168,00 + R$ 33,60 de taxa
                                        [ − ] 0 [ + ]  (desabilitado)
```

O qualificador `já foi integralmente vendida` é necessário para não contradizer o `800 com meia-entrada` que está no cabeçalho do mesmo grupo. Disponibilizado é oferta histórica, vendida é estado atual, e as duas frases precisam deixar isso claro lado a lado.

### Três consertos de acesso antes de qualquer número

1. **A meia hoje não é comprável.** `INGRESSOS` tem `inteira` e `meia` (`data/combos.ts:152-154`), mas as quatro datas trazem `itens: ["vip", "pista"]` (`:176-179`) e nenhum combo os referencia. Oferta de ingressos elegíveis igual a zero, enquanto a tela de atribuição exibe um bloco inteiro de "Informações da meia-entrada" (`:578-608`). As datas do mock precisam incluir `inteira` e `meia`.
2. **O `limite` por data desabilita o "+" da meia junto com todos os outros** (`:1678-1691`). O limite genérico nunca pode ser o motivo de a meia estar bloqueada enquanto a inteira está disponível. E a mensagem passa a ser `Limite de 4 ingressos por data atingido. Não é limite de meia-entrada.`
3. **O bloco de meia-entrada sai da atribuição e entra na seleção.** Hoje ele só existe em `atribuicaoLayout`, e `continuar()` (`:355-363`) bloqueia a saída da seleção sem login: o comprador precisa criar conta para descobrir quais documentos valem. O art. 8º II nomeia expressamente "obstáculos cadastrais".

### Dois cuidados sobre os números

- **Promocionais ficam fora do denominador** (art. 10 p.ú.). O protótipo tem cupom e combos com desconto; sem essa exclusão o "40%" nasce falso por construção.
- **O percentual é calculado em tempo de render** a partir dos dois inteiros, nunca digitado. E a UI falha visivelmente quando um grupo de ingresso não tem quantitativo correspondente.

---

## 6. O que você não pediu e o decreto exige nesta mesma tela

### Gate (resolver antes de implementar qualquer coisa): art. 1º §2º, evento esportivo

O mock **é esportivo** (Arquibancada, Camarote VIP, Pista Premium, questionário com pace, equipe, tipo sanguíneo em `PERGUNTAS`, copy "Para quem são essas inscrições?"). O decreto não se aplica a evento esportivo, regido pela Lei 14.597/2023, que **ninguém levantou ainda**. A recomendação de UI única no padrão mais estrito só é defensável depois de confirmado que o padrão do decreto é superconjunto do que a Lei Geral do Esporte exige. Se ela pedir nominalidade, cota ou identificação do portador, o padrão mais estrito do decreto não cobre e o desenho fica em falta sem perceber. **Uma tarde de leitura jurídica antes de uma semana de implementação.**

### Em ordem de risco

| # | Artigo | Situação | O que fazer |
|---|---|---|---|
| 1 | **Art. 13 §1º e §2º** (reserva com preço congelado e contador em tempo real) | **Não conforme.** Em vigor desde 21/09/2026. Zero ocorrências de reserva, timer ou expiração no código. Agravante: ao derivar a taxa da face em tempo de render, uma virada de lote passa a mover dois números em vez de um. | Hold no servidor com TTL ao adicionar o primeiro item, snapshot de `{faceUnit, taxaUnit, aliquota}` gravado no `CartGroup`, contador visível na barra de total das duas variantes (`Seus ingressos estão reservados por 09:42`), e recálculo proibido durante a janela. É o único artigo cujo veredito não tem margem interpretativa. |
| 2 | **Art. 9º** (taxa proporcional ao preço de venda) | **Conforme por construção se o tipo impedir o contrário.** Taxa fixa de R$ 30,00 derruba o desconto da meia de 50% para 45,90%; teto de R$ 20,00 sobre 10% leva a razão a 51,91%; piso de R$ 20,00 leva a 50,87%. | `TaxaServico` singular com `aliquota: number` e **sem** campos de valor, piso ou teto. E, criticamente, **a face da meia deixa de ser digitada à mão**: vira derivada do ingresso base. Hoje um operador que digitar 200 em vez de 168 produz razão de 59,5% e o sistema não diz nada. |
| 3 | **Art. 7º §2º** (serviços adicionais e taxas sem concordância prévia e expressa) | **Parcialmente conforme.** Preço oculto sai com `exibirPreco`/`mostrarPreco`, mas nada hoje proíbe pré-seleção. | Todo item opcional abre com quantidade zero. Seguro, doação e entrega entram desmarcados, com valor em reais ao lado do checkbox. Preço visível não supre consentimento. |
| 4 | **Art. 20** (restituição integral, incluídas as taxas) | **Não conforme.** O termo padrão (`data/config.ts:54-55`) diz o oposto do espírito do artigo e não menciona reembolso; `Sucesso.tsx` (86 linhas) não exibe um único valor. | A frase entra no detalhamento com **as três hipóteses** (`cancelado, adiado ou sofrer alteração relevante`) e com o caso parcelado (`a devolução segue o valor efetivamente pago`). E o `termos` padrão precisa de string substituta: sheet amigável sobre cláusula contratual contraditória piora a posição em fiscalização. |
| 5 | **Art. 7º caput, fases fora do escopo deste PR** | Sucesso, listagem, landing, e-mail de confirmação não têm valor nenhum. | Mínimo nesta entrega: `Sucesso.tsx` passa a exibir total pago e taxa paga. Exige canal de dados entre as rotas (hoje `Sucesso` só recebe `?cfg=`), então não é mudança de componente. |
| 6 | **Art. 7º §3º** (documentação dos critérios) | Não existe. | Campo `criteriosUrl` no modelo, link só renderizado quando preenchido, e o artefato versionado fora do front. Texto de tela não é prova de critério. |

---

## 7. Plano de implementação

Cinco PRs, verificáveis isoladamente. **PR 1 e PR 2 já satisfazem a regra de ouro em todas as telas do fluxo de compra.**

### PR 1: modelo de taxa e exibição all-in

**`data/combos.ts`**
```ts
/** Única taxa acessória. Singular e ad valorem por construção (art. 6º e 9º). */
export interface TaxaServico {
    nome: string;          // "Taxa de serviço"
    aliquota: number;      // 0.20. Sem piso, sem teto, sem valor absoluto.
    descricao: string;     // serviço remunerado (art. 3º V)
    criteriosUrl?: string; // art. 7º §3º
    /** Escopo. Default ["ingresso","combo"]. Mantém produto isento sem hardcode. */
    aplicaA: ("ingresso" | "combo" | "produto")[];
}

/** Art. 11. Par estático por grupo, chaveado pelo nome do grupo que o editor enumera. */
export interface Quantitativo { ofertados: number; ofertadosMeia: number }

export interface Ingresso {
    // ...existentes
    /** "promocional" não entra na cota de meia (art. 10 p.ú.). */
    beneficio?: "inteira" | "meia-entrada" | "promocional" | "cortesia";
    /** Obrigatório quando beneficio === "meia-entrada": id do ingresso base. */
    baseId?: string;
    /** Default 0.5. A face da meia é DERIVADA, nunca digitada. */
    percentualBeneficio?: number;
    cotaEsgotada?: boolean;
}

export interface ComboFixoInclui { /* ...existentes */ }
// ComboDinamico: REMOVER exibirPreco e precoVisivel
// Item: REMOVER mostrarPreco
```

**`data/config.ts`**
```ts
export interface EventConfig {
    // ...existentes
    v: 3;                                  // versão do payload, hoje inexistente
    categoria: "cultural" | "esportivo";   // art. 1º §2º
    taxaServico: TaxaServico;
    quantitativoPorGrupo?: Record<string, Quantitativo>;
    percentualMeiaVendido?: number | null; // art. 11 p.ú.
}
```

`decodeConfig` (`:92-131`) ganha migração explícita: payload sem `v` recebe `taxaServico` com alíquota 0.20 e `categoria: "cultural"` (regime mais estrito), e tolera `exibirPreco`/`mostrarPreco`/`precoVisivel` ignorando-os. `STORAGE_KEY` em `pages/Config.tsx:18` sobe para `marketplace:lastConfig:v3`.
**Decisão consciente:** links `?cfg=` e `?e=` já compartilhados passam a exibir 20% de taxa. É mudança silenciosa de preço, mas o default alternativo (zero) renderiza o estado que o próprio desenho declara irregular, o que destrói a demo. Registre isso em uma linha de comentário no `decodeConfig`.

**`utils/preco.ts` (novo, kebab-case conforme CLAUDE.md, fonte única)**
```ts
export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const cent = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const floorCent = (n: number) => Math.floor(n * 100 + 1e-9) / 100;

export interface Preco { face: number; taxa: number; total: number }

/** Face do ingresso de meia: FLOOR em centavos. Garante 2 × totalMeia <= totalInteira. */
export const faceBeneficio = (faceBase: number, pct = 0.5) => floorCent(faceBase * pct);

/** Taxa arredondada por UNIDADE. 2 × R$ 67,20 = R$ 134,40 sempre fecha. */
export const precoIngresso = (face: number, aliquota: number): Preco => {
    const taxa = cent(face * aliquota);
    return { face, taxa, total: cent(face + taxa) };
};
export const precoProduto = (face: number): Preco => ({ face, taxa: 0, total: face });

/** Agregado é SOMA de taxas unitárias, NUNCA recálculo sobre o subtotal. */
export const somar = (ps: Preco[]): Preco => /* ... */;

/** Rateia valor por pesos preservando a soma exata. Resíduo na última posição. */
export const ratear = (valor: number, pesos: number[]): number[] => /* ... */;

/** Legenda. Discriminante é a NATUREZA do item, não taxa === 0 (cortesia existe). */
export const legenda = (p: Preco, forma: "curta" | "completa") => /* ... */;
```

Não exporte nada que aceite `subtotal + aliquota`: o caminho errado não deve existir na API do módulo.

**Pontos de render a alterar** (todos em `pages/SelecaoEAtribuicao.tsx` salvo indicado):

| Linha | Componente | Mudança |
|---|---|---|
| 22 | `brl` | remove, importa de `utils/preco` |
| 42-49 | `CartGroup` | `precoUnit` vira `faceUnit`, `taxaUnit`, `totalUnit` (9 call sites: `:217`, `:230`, `:248`, `:278`, `:288`, `:296`, `:549`, `:1745`) |
| 237-241 | extras do combo | usa `precoExtraDoItem`, para de somar opcional oculto |
| 248 | combo dinâmico | para de fundir base e extras; sub-linhas com rateio |
| 278 | `totalValor` | vira objeto de três colunas |
| 513-523 | `SecaoHeader` | passa `valor` nas duas chamadas (`:529`, `:539`), mais linha de taxa e contador de meia |
| 1261-1277 | `ProdutoResumoRow` | some, absorvido por `CartGroupRow` com slot de imagem |
| 1301 | `ProdutoCard` | hierarquia |
| 1352 | `VariacaoModal` | hierarquia + subtotal da seleção |
| 1559-1619 | `ComboFixoView` | total, composição, nota antiduplicidade, rateio no accordion |
| 1621-1650 | `ComboDinamicoCard` | total, composição, "a partir de" válido, badge fora |
| 1700-1712 | `GrupoIngressos` | linha de quantitativo fora do `<button>` |
| 1715-1735 | `IngressoRow` | reestrutura em duas faixas, bloco de preço full width, prop de link da meia |
| 1737-1765 | `CartGroupRow` | subtotal + composição, sub-linhas valoradas, slot de imagem |
| `components/SelecaoItensModal.tsx:27` | `brl` | remove |
| `components/SelecaoItensModal.tsx:90-103` | label do item | `precoExtraDoItem`, `incluso`, incremento all-in |
| `components/SelecaoItensModal.tsx:216-224` | rodapé | total ao vivo + composição |

### PR 2: barra de total unificada

Criar `components/barra-total.tsx`. Remove `totalBar` (`:488-507`) e o markup manual (`:818-830`). Montagem em `:568`, `:661`, `:724`, `:761` e no portal. A interface tem ~12 props porque hoje o `totalBar` fecha sobre `totalValor`, `totalItens`, `setCart`, `continuarDisabled`, `avancar`, `etapa`, e o mobile ainda sobre `accentVars`, `config`, `resumoSecoes` e `resumoAberto`. Inclui o conserto do espaçador `h-36` (`:769`) e o bloco de detalhamento.

Criar `components/preco-bloco.tsx`: a **única** forma de renderizar dinheiro na tela do consumidor. Sem isso as superfícies divergem de novo, como `ProdutoResumoRow` e `CartGroupRow` já divergiram.

### PR 3: carrinho que sobrevive à navegação

Links de meia-entrada abrem `Slideout` (`components/Slideout.tsx`, já existe) em vez de `navigate()` (`:592`). Isso preserva o carrinho por construção e dispensa persistência. Persistir `cart`, `atrib` e `respostas` em `sessionStorage` continua desejável para refresh e botão voltar, mas é segundo passo.

### PR 4: quantitativo (art. 11)

`quantitativoPorGrupo` no modelo, editor enumerando os grupos distintos encontrados em `cfg.ingressos` (sem campo de texto livre, sem typo possível), render no `GrupoIngressos`, no `SecaoHeader` e em `pages/MeiaEntrada.tsx:318-328`. Mais os três consertos de acesso da seção 5.

### PR 5: cupom na matemática

`Cupom` hoje é `{ codigo, ajuda }`. Ganha `tipo: "percentual" | "fixo"`, `valor: number`, `escopo`. A taxa incide sobre a face **com desconto** (senão a proporcionalidade do art. 9º quebra no cupom). Só então o badge volta, com valor em reais ao lado do percentual.

### Campos novos em `pages/Config.tsx` (890 linhas)

| Onde | Campo |
|---|---|
| Evento | **Taxa de serviço (%)**, com preview vivo ao lado: `Arquibancada Inteira: R$ 336,00 + R$ 67,20 = R$ 403,20. Meia: R$ 168,00 + R$ 33,60 = R$ 201,60.` |
| Evento | **O que a taxa remunera** (textarea) e **Link dos critérios** |
| Evento | **Categoria**: cultural / esportivo |
| Por grupo (lista derivada) | **Ingressos disponibilizados** e **Com meia-entrada**, com aviso quando `meia < 0,4 × total` |
| Ingresso (`:461-476`) | **Tipo** (inteira / meia-entrada / promocional / cortesia); quando meia, **Ingresso base** (select) e **Percentual** (default 50%), com o campo de preço **desabilitado e derivado** |
| Rótulos `:476`, `:538`, `:702`, `:788` | `Preço (R$)` vira `Preço de face (R$)`, com leitura ao lado: `Com taxa de serviço: R$ 403,20` |
| Remover | toggle `exibirPreco` (`:794`), checkboxes `precoVisivel` (`:816`), `precoVisivel: []` no `addComboDinamico` (`:130`) |

**Nomes de arquivo:** `utils/preco.ts`, `components/barra-total.tsx`, `components/preco-bloco.tsx`, seguindo o CLAUDE.md. A pasta fica mista com os PascalCase existentes (`SelecaoItensModal`, `CupomModal`, `Slideout`, `TermosModal`); renomear os antigos fica para um PR de limpeza.

---

## 8. Armadilhas

**Arredondamento.** A taxa é calculada **por unidade** e o agregado é a **soma das unitárias**, nunca recálculo sobre o subtotal. Com face de R$ 119,93 e três unidades: soma dos arredondados = R$ 71,97, recálculo no agregado = R$ 71,96. O razonete é exatamente onde alguém escreve `totalFace * aliquota` por reflexo, e aí ele deixa de fechar com o `Total a pagar` duas linhas abaixo. Linha que não fecha é falha de art. 7º, não bug de UI.

**Proporcionalidade além do exemplo.** `201,60 / 403,20 = 50%` é um caso particular, não teorema. Com face de centavo ímpar o arredondamento pode jogar a meia acima de metade. Por isso a face da meia é **floor** em centavos e derivada da base. Teste de propriedade obrigatório: percorrer faces de R$ 1,00 a R$ 5.000,00 em passos de R$ 0,01 e assegurar `2 × totalMeia <= totalInteira` sempre.

**Combo: uma regra só.** Taxa calculada **uma vez** sobre o preço de venda do combo e rateada pro rata pelas faces, resíduo na última linha. Calcular por componente e somar dá R$ 103,20 contra os R$ 103,19 de 20% sobre R$ 515,97. E as sub-linhas exibem **o rateio**, não o preço de catálogo: `combo.preco` (450) não é a soma das faces (400), e listar catálogo abre um buraco visível de R$ 50,00.

**Combo com meia dentro.** O rateio é pro rata **sobre as faces**, nunca por cabeça. Taxa por cabeça dentro de combo dilui o benefício e reintroduz o art. 8º III por via indireta, com o agravante de o total do combo continuar correto (bug silencioso).

**Cupom antes de congelar o formato do carrinho.** Quando o desconto atingir só a unidade de maior valor, uma linha de 2 unidades deixa de ser `qtd × unitário`, e `2 × R$ 403,20` vira literalmente falso. Ou a linha suporta unidades heterogêneas desde já (quebra em duas sub-linhas quando os unitários divergem), ou o cupom fica fora da v1 e o badge sai do ar.

**Mobile 375px.** A coluna de texto do `IngressoRow` tem **177px reais** (91px com imagem) e a do `CartGroupRow` tem ~223px. Nenhuma legenda de preço cabe ali: a reestruturação em duas faixas com o bloco de preço full width não é refinamento, é pré-requisito. O espaçador `h-36` precisa virar medido antes de qualquer linha nova no rodapé. E a variante de uma linha com sinal de igual não existe neste layout: a coluna mais larga do desktop mede 444px.

**Acessibilidade, três itens que a mudança agrava se forem ignorados.** O `Stepper` (`:1533`) tem `aria-label` genérico "Aumentar"/"Diminuir": num grupo de quatro ingressos o leitor anuncia quatro pares idênticos, e agora com três números soltos em volta de cada um. Dê `aria-label` dinâmico (`Aumentar quantidade de Arquibancada Meia-entrada`), envolva total e composição num elemento com `aria-label` completo (`R$ 201,60, sendo R$ 168,00 de ingresso mais R$ 33,60 de taxa de serviço`) marcando os spans visuais como `aria-hidden`, e associe a linha ao stepper com `role="group"` e `aria-labelledby`. O sinal `+` não é anunciado de forma confiável em pt-BR.

**Erosão do invariante.** Nada impede um PR futuro de mover a linha de taxa para dentro do "Ver detalhamento" por falta de espaço. No dia em que isso acontecer o desenho vira partitioned-then-dripped sem ninguém perceber. Defesas: componente único, um teste que falhe se a barra renderizar total sem valor de taxa, e o teste de print no checklist de revisão.

**Números legais em string literal.** O protótipo monta qualquer evento por URL. `Ingressos a partir de R$ 180,00`, `2.000 ingressos disponibilizados`, `20% sobre os ingressos` e os exemplos da sheet são **todos derivados da config**. Cravar qualquer um deles produz informação legal falsa no segundo evento, que é a falha de art. 7º e art. 11 na forma mais barata de produzir.

**Quantitativo que envelhece.** Se o produtor abrir novos lotes ou vender além do ofertado, `2.000 / 800` passa a mentir, e mentir é pior que omitir. Regra de atualização no editor e bloqueio de venda acima do ofertado.

**Conversão.** Onde a Sympla mostra R$ 565,00 o seu card vai mostrar R$ 621,50, e o teste de campo da própria StubHub (segurar taxas até o checkout rendeu 21% mais gasto e 14% mais conversão) vai aparecer na primeira discussão interna. O delta é real. A resposta é que é exatamente o efeito que três jurisdições declararam ilícito e que custou US$ 10 milhões à StubHub em abril de 2026. Tenha a resposta pronta antes do primeiro A/B, porque ela não é de produto, é de conformidade.