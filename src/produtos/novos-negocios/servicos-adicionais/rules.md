# Serviços adicionais: regras

> **Rotas:** `/novos-negocios/servicos-adicionais`, `/novos-negocios/servicos-adicionais/:servico`, `/novos-negocios/servicos-adicionais/:servico/checkout`, `/novos-negocios/servicos-adicionais/:servico/confirmacao`
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
- **SAD-01** A oferta não mostra evento: no desktop, conteúdo de um lado e mosaico de fotos do outro (mosaico à esquerda); no mobile, foto no topo e o card da oferta desliza por cima. _(pages/oferta.tsx, components/mosaico-oferta.tsx, components/topo.tsx)_
- **SAD-02** Topo da oferta: selo do parceiro com nome e categoria, título e benefícios com ícones do Iconly (Light). Sem legenda abaixo do título. _(components/apresentacao-servico.tsx, components/icones-iconly.tsx)_
- **SAD-03** A oferta sempre abre sem valor selecionado, inclusive ao recarregar ou voltar do checkout. _(utils/use-selecao-valor.ts)_
- **SAD-04** Cada card de valor mostra o valor do crédito e quanto a pessoa paga com desconto ("por R$ …"), sem selo de % OFF. _(components/seletor-valor.tsx)_
- **SAD-05** O CTA aparece desde o início, desabilitado até a escolha do valor; no desktop fica no fim do conteúdo e no mobile numa barra fixa no rodapé. _(components/oferta-servico.tsx)_

### Checkout
- **SAD-10** Segue o formato do checkout em produção (barra com voltar, "Finalizar pedido" com tempo restante, métodos em lista, resumo à direita), sem proteção de compra e sem dados do evento: no lugar do evento entram a logo e o nome do crédito. _(pages/checkout.tsx)_
- **SAD-11** Resumo: item, desconto e "Total a pagar". Sem taxas. _(pages/checkout.tsx)_
- **SAD-12** Valor ausente ou fora do mínimo/máximo do serviço volta para a oferta. _(pages/checkout.tsx)_
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

- Ativação pelo app é simulada; o link de resgate em `data/servicos.ts` é placeholder. Falta definir o comportamento quando o app da Uber não está instalado.
- Resgate pelo código no app da Uber não é detectado pela tela (depende da integração).
- Checkout sem seção de taxas: confirmar se a compra de crédito tem taxa de serviço/processamento.
- A lista `/novos-negocios/servicos-adicionais` ainda usa a capa do Festival Aurora nos cards, o que diverge de SAD-01.
- A oferta da Meep é de consumo no evento e usa a mesma página sem evento (mosaico e textos de rolê).
- Direito de imagem das fotos do mosaico e do topo do mobile.
