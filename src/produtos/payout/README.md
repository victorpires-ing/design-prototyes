# PayOut

Produto de **saída de dinheiro** — a contraparte do PayIn: repasses aos
organizadores, estornos e afins.

A superfície do produto é o painel administrativo **Cashout**. O shell
compartilhado entre os projetos vive em `components/cashout-shell.tsx`
(sidebar com Produtoras · Eventos · Inputs · Painel de Controle).

## Projetos

### `contrato-quick-win-finance/`

Associação de contratos a eventos. Implementa o refinamento do Figma
(`Contrato - Quick Wins`, section "Refinamento", node `4108:811`):

- **Eventos** (`/payout/contrato-quick-win-finance`) — tabela de eventos com a
  situação do contrato associado (ativo, em renegociação, ativo por meta de
  GMV, sem contrato, inativo) e o drawer de associação em 2 steps
- **Produtoras** (`/payout/contrato-quick-win-finance/produtoras`) — tabela de
  produtoras com a linha expansível listando os contratos de cada uma

## Estrutura

```
payout/
├── components/
│   └── cashout-shell.tsx     # sidebar do Cashout, compartilhada entre projetos
└── contrato-quick-win-finance/
    ├── pages/                # eventos.tsx · produtoras.tsx
    ├── components/           # kit local (ui), drawer, capas, grid de condições
    ├── data/                 # cashout.ts — mocks e tipos
    └── utils/
```

Para criar um projeto novo no PayOut, duplique `_projeto/` de
`src/produtos/_template/` aqui dentro, reaproveite o `CashoutShell` de
`components/` e registre as rotas em `src/app/App.tsx`.
