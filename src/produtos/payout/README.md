# PayOut

Produto de **repasses**: acompanhamento e liberação dos valores devidos aos
organizadores após a venda de ingressos (a contraparte de saída do PayIn).

## Projetos

- `repasses/` — fila de repasses por evento: acompanhamento de status
  (agendado, em processamento, pago, bloqueado), detalhe do cálculo
  (bruto → taxas → líquido) e liberação manual.

## Estrutura

```
payout/
├── components/          # shell compartilhado entre projetos do produto
└── repasses/
    ├── pages/           # telas/rotas
    ├── components/      # componentes exclusivos do projeto
    ├── data/            # mocks e tipos
    └── utils/           # auxiliares
```

## Rotas

| Rota                       | Página        |
| -------------------------- | ------------- |
| `/payout/repasses`         | `Repasses`    |
| `/payout/repasses/:id`     | `DetalheRepasse` |

Registradas em `src/app/App.tsx`.
