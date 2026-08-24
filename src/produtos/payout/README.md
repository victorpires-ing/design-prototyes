# PayOut

Produto de **saída de dinheiro** — a contraparte do PayIn: repasses aos
organizadores, estornos e afins.

Ainda **vazio**. Para começar o primeiro projeto, duplique
`_template/_projeto/` de `src/produtos/_template/` aqui dentro e renomeie em
`kebab-case` (ex: `repasses/`), depois registre as páginas como rotas em
`src/app/App.tsx` e adicione o card do produto em
`src/app/components/ProductSelection.tsx`.

## Estrutura

```
payout/
├── components/          # componentes compartilhados entre projetos do produto
└── <projeto>/           # a criar
    ├── pages/
    ├── components/
    ├── data/
    └── utils/
```
