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

## Estrutura

```
checkout/
├── components/                 # vazio: ainda não há shell compartilhado entre projetos
└── melhorias-de-compra/
    ├── pages/                  # pagamento.tsx · cartao.tsx · nao-autorizado.tsx
    ├── components/             # checkout-shell (topo + resumo), pix-card, qr-pix, topo, icones
    ├── data/                   # pedido.ts (valores, parcelas) · checkout-store.ts
    ├── utils/                  # cartao.ts (máscaras e validação) · hooks.ts
    └── assets/                 # capa do evento e ícone do Pix
```
