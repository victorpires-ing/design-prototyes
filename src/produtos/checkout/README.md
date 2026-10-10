# Checkout

Produto da **jornada de pagamento** do comprador no site da Ingresse.

## Projetos

### `melhorias-de-compra/`

Implementa a "Fase 2 - Checkout PIX" do Figma (`Checkout AWA`, página
"Quick Win - Conversão PIX", section `9092:45108`), em desktop e mobile:

- **Pagamento** (`/checkout/melhorias-de-compra`) — proteção de compra e Pix
  já gerado por padrão; no mobile o código vem antes do QR (copy-first), com
  "Mostrar QR Code" sob demanda
- **Cartão** (`/checkout/melhorias-de-compra/cartao`, `?tipo=debito` para
  débito) — cartões salvos, formulário com validação no blur (Luhn, validade,
  nome e CVV) e parcelamento com "Mais popular"
- **Pagamento não autorizado** (`/checkout/melhorias-de-compra/nao-autorizado`)
  — o cartão recusado vira oferta de Pix com aprovação imediata e "Tentar
  outro cartão"

Todo cartão enviado cai em "não autorizado": é o caminho que o fluxo quer
mostrar. Marcar "Salvar cartão" faz ele aparecer na lista ao tentar de novo.

### `novo-decreto/`

Implementa "v.1 - Oferta no checkout" do Figma (`Checkout AWA`, section
`9592:2076`) em desktop e mobile, na rota `/checkout/novo-decreto`, com as
cores, fontes, ícones e medidas do arquivo (tokens em `styles/tokens.css`):

- **Carregando proteção** — skeleton do card enquanto a oferta chega; as formas
  de pagamento ficam bloqueadas
- **Decisão** — "Proteja-se de imprevistos" com as formas de pagamento a 50%;
  "Ver coberturas" abre as coberturas no card (desktop) ou num bottom sheet
  (mobile)
- **Proteger por R$ 10,00** — "Ingresso protegido", proteção em "Adicionais" no
  resumo e Pix com borda verde
- **Seguir sem proteção** — "Ingresso sem proteção", com atalho para proteger;
  **Remover** (no protegido) leva ao mesmo estado
- **Sem oferta** (`?cenario=sem-oferta`) — inelegível ou seguradora fora do ar:
  o card some e o pagamento fica livre
- **Taxas** — o ícone de informação abre "Entenda como calculamos os valores"

Toda troca é um Smart Animate (Ease In and Out, 450 ms — `utils/transicao.ts`)
na mesma página: a rolagem fica onde estava e quem clicou vê as formas de
pagamento passarem de bloqueadas para habilitadas.

## Estrutura

```
checkout/
├── components/                 # vazio: ainda não há shell compartilhado entre projetos
├── melhorias-de-compra/
│   ├── pages/                  # pagamento.tsx · cartao.tsx · nao-autorizado.tsx
│   ├── components/             # checkout-shell (topo + resumo), pix-card, qr-pix, topo, icones
│   ├── data/                   # pedido.ts (valores, parcelas) · checkout-store.ts
│   ├── utils/                  # cartao.ts (máscaras e validação) · hooks.ts
│   └── assets/                 # capa do evento e ícone do Pix
└── novo-decreto/
    ├── pages/                  # pagamento.tsx (decisão, protegido e sem proteção)
    ├── components/             # topo, resumo, protecao-card, metodos-pagamento, coberturas, modal-taxas, base
    ├── data/                   # pedido.ts (valores, coberturas, taxas)
    ├── styles/                 # tokens.css (variáveis do Figma, escopadas em .ck-decreto)
    ├── utils/                  # hooks.ts · transicao.ts (Smart Animate 450 ms)
    └── assets/                 # ícones e capa exportados do Figma
```
