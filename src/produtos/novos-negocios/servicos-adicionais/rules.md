# Serviços adicionais: regras

> **Rotas:** `/novos-negocios/servicos-adicionais`, `/novos-negocios/servicos-adicionais/checklist`, `/novos-negocios/servicos-adicionais/:servico`, `/novos-negocios/servicos-adicionais/:servico/checkout`, `/novos-negocios/servicos-adicionais/:servico/confirmacao`
> **No menu:** fora do menu; cada oferta abre pelo link de uma comunicação (push, WhatsApp, e-mail). A lista em `/novos-negocios/servicos-adicionais` é só a entrada do protótipo.
> **Revisado em:** 2026-11-13

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

Compra de serviços de parceiros independente da compra de ingressos. O principal é o crédito
Uber com desconto: a pessoa escolhe o valor, paga no checkout da Ingresse e ativa o crédito na
Uber pelo app ou por código. A oferta não depende de evento nem de a pessoa ter ingresso.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Serviços (Uber, Meep): textos, valores, desconto, condições, resgate | `data/servicos.ts` (mock local) | não |
| Usuário (nome, e-mail) | `data/servicos.ts` (`USUARIO`, mock local) | não |
| Valor escolhido e forma de pagamento | query string (`?valor=`, `&forma=`) entre checkout e confirmação | não |
| Código de resgate | gerado no front a partir de valor + forma (ilustrativo) | não |

Valores, descontos e condições são ilustrativos, não condições comerciais fechadas com os parceiros.

## Regras

### Oferta
- **SAD-06** Mobile (ofertas e Checklist): o header da Ingresse é fixo e sempre vazado sobre a imagem do topo. O card da página sobe por cima da imagem até encostar no header; daí em diante a rolagem segue por baixo do header, que continua mostrando a faixa de cima da imagem, então o conteúdo nunca aparece através dele. _(components/topo.tsx, components/painel-checklist.tsx)_
- **SAD-01** A oferta não mostra evento: no desktop, conteúdo de um lado e mosaico de fotos do outro (mosaico à esquerda); no mobile, foto no topo e o card da oferta desliza por cima. _(pages/oferta.tsx, components/mosaico-oferta.tsx, components/topo.tsx)_
- **SAD-02** Topo da oferta: selo do parceiro com nome e categoria, título e benefícios com ícones do Iconly (Light). Sem legenda abaixo do título. _(components/apresentacao-servico.tsx, components/icones-iconly.tsx)_
- **SAD-03** A oferta sempre abre sem valor selecionado, inclusive ao recarregar ou voltar do checkout. _(utils/use-selecao-valor.ts)_
- **SAD-04** Cada card de valor mostra o valor do crédito e quanto a pessoa paga com desconto ("por R$ …"), sem selo de % OFF. _(components/seletor-valor.tsx)_
- **SAD-07** Serviços de crédito ou recarga (Uber, Meep) têm "Outro valor" em largura total abaixo dos valores sugeridos; ao escolher, o botão dá lugar ao campo (tocar num valor sugerido traz o botão de volta) e o CTA só habilita com um valor válido. O campo aceita reais inteiros entre o mínimo e o máximo do serviço e, no crédito com desconto, mostra a faixa e quanto a pessoa paga; na recarga (Meep) não há legenda embaixo do campo, só a mensagem de erro quando o valor está fora do mínimo ou máximo. Pacotes (fotos, seguro) não têm. _(components/seletor-valor.tsx, utils/use-selecao-valor.ts)_
- **SAD-05** O CTA aparece desde o início, desabilitado até a escolha do valor; no desktop fica no fim do conteúdo e no mobile numa barra fixa no rodapé. _(components/oferta-servico.tsx)_

### Checklist do rolê (vitrine de serviços)
- **SAD-50** ~~Vitrine na mesma estrutura da oferta (mosaico + card)~~ substituída por SAD-56.
- **SAD-51** Cada serviço é um card com selo, nome, benefício principal (só texto, sem ícone) e o botão "Eu quero" (sem preço); no mobile o botão vai embaixo, na largura toda. _(components/checklist-servicos.tsx)_
- **SAD-56** Estrutura própria, diferente das ofertas: header, banner largo só com a foto; abaixo, o título "Seu ingresso é só o começo. Encontre serviços e benefícios disponíveis para o seu evento.", sem legenda, e uma linha do tempo com os momentos do rolê numerados (círculo branco com contorno cinza e número em preto) (Antes de sair: seguro; Ida e volta: Uber; No evento: Meep e fotos). _(pages/checklist.tsx, components/checklist-servicos.tsx, data/servicos.ts `MOMENTOS`)_
- **SAD-57** Card rotativo sem foto: um card de vidro (camada fosca com desfoque, reflexo e borda clara, sobre brilhos coloridos na cor do serviço da vez) que passa sozinho pelos serviços a cada 15 s (selo, nome, categoria e benefícios), com indicadores que levam direto a um serviço; o mouse em cima pausa e, com "reduzir movimento", não roda sozinho. Desktop: à esquerda, centralizado na altura do conteúdo (título e linha do tempo à direita). Mobile: mesmo esquema das ofertas (SAD-06), sem foto — o card rotativo de vidro ocupa o topo (400px) atrás do header vazado, que mostra a mesma faixa girando junto, e o conteúdo sobe por cima num card branco. Os cards dos serviços ganham borda preta no hover. _(pages/checklist.tsx, components/painel-checklist.tsx)_
- **SAD-58** Quem abre uma oferta pelo Checklist (`?de=checklist`) vê "← Voltar" (desktop: no canto superior esquerdo, acima do mosaico, sem mudar a altura da página; mobile: no topo do card), que volta para a vitrine; a marcação segue para o checkout e volta com o "voltar". Quem chega pela comunicação não vê o botão. _(pages/oferta.tsx, components/oferta-servico.tsx, components/checklist-servicos.tsx, pages/checkout.tsx)_
- **SAD-52** ~~Resumo e CTA único para vários serviços~~ substituída por SAD-54.
- **SAD-53** ~~Checkout e confirmação com vários serviços~~ substituída por SAD-54.
- **SAD-54** "Eu quero" abre a página de contratação do serviço (a mesma oferta individual); cada serviço é contratado e pago separadamente. _(components/checklist-servicos.tsx)_
- **SAD-55** Serviços vendidos em pacote (fotos, seguro) mostram o nome do pacote nas opções e no resumo, com o preço embaixo. _(components/seletor-valor.tsx, utils/pedido.ts)_

### Checkout
- **SAD-10** Segue o formato do checkout em produção (barra com voltar, "Finalizar pedido" com tempo restante, métodos em lista, resumo à direita), sem proteção de compra e sem dados do evento: no lugar do evento entram a logo e o nome do crédito. _(pages/checkout.tsx)_
- **SAD-11** Resumo: item, desconto e "Total a pagar". Sem taxas. _(pages/checkout.tsx)_
- **SAD-12** Valor ausente ou fora do mínimo/máximo do serviço (ou pacote inexistente) volta para a página de origem. _(pages/checkout.tsx, utils/pedido.ts)_
- **SAD-13** Protótipo: escolher PIX leva à confirmação "pago com Pix"; Crédito, Google Pay e Click to Pay levam à confirmação "pago com cartão". _(pages/checkout.tsx)_

### Confirmação
- **SAD-20** Sem card do evento e sem sugestão de outro serviço. _(pages/confirmacao.tsx)_
- **SAD-21** Uber: "Crédito Uber comprado!", resumo (crédito e valor pago), código de resgate com "Copiar código" (secundário) e "Ativar crédito na Uber" (principal), mais uma orientação curta de que são alternativas. Sem "Concluir". _(pages/confirmacao.tsx)_
- **SAD-22** "Copiar código" copia o código e mostra "Código copiado!" por 2 s. No mobile o código fica em cima e o botão embaixo. _(pages/confirmacao.tsx)_
- **SAD-23** Depois de ativar pela Uber, o código aparece riscado, o copiar fica desabilitado e a tela informa que o código já foi resgatado. A tela nunca afirma que o crédito já está na carteira Uber antes da ativação. _(pages/confirmacao.tsx)_
- **SAD-24** Serviços sem resgate (Meep) mostram os passos e o "Concluir". _(pages/confirmacao.tsx)_

### Estados
- **SAD-40** Serviço inexistente na URL volta para a lista de serviços. _(pages/oferta.tsx, pages/checkout.tsx, pages/confirmacao.tsx)_

## Depende de / afeta

- **Depende de:** `novos-negocios/utils/use-force-light-theme` (todas as telas ficam em tema claro).
- **Afeta:** nada fora da pasta; as rotas estão em `src/app/App.tsx` (as antigas `/revenda/...` redirecionam para `/novos-negocios/...`).

## Em aberto

- "Fotos do rolê" e "Seguro de celular" são serviços ilustrativos, sem parceiro definido; pacotes, preços e regras são exemplos.

- Ativação pelo app é simulada; o link de resgate em `data/servicos.ts` é placeholder. Falta definir o comportamento quando o app da Uber não está instalado.
- Resgate pelo código no app da Uber não é detectado pela tela (depende da integração).
- Checkout sem seção de taxas: confirmar se a compra de crédito tem taxa de serviço/processamento.
- A lista `/novos-negocios/servicos-adicionais` ainda usa a capa do Festival Aurora nos cards, o que diverge de SAD-01.
- A oferta da Meep é de consumo no evento e usa a mesma página sem evento (mosaico e textos de rolê).
- Direito de imagem das fotos do mosaico e do topo do mobile.
