# PayOut

Produto de **saída de dinheiro** — a contraparte do PayIn: repasses aos
organizadores, estornos e afins.

O produto já está registrado na aplicação:

- card na home em `src/app/components/ProductSelection.tsx` (ilustração `payout`)
- rota `/payout` em `src/app/App.tsx`, apontando para `pages/payout.tsx`

`pages/payout.tsx` é só a tela de entrada provisória — **ainda não existe
nenhum projeto**. Para criar o primeiro, duplique `_projeto/` de
`src/produtos/_template/` aqui dentro e renomeie em `kebab-case`
(ex: `repasses/`), registre as páginas como rotas em `src/app/App.tsx` e
aponte o `to` do card do produto para a primeira tela do projeto.

## Estrutura

```
payout/
├── components/          # componentes compartilhados entre projetos do produto
├── pages/
│   └── payout.tsx       # entrada provisória do produto (substituir pelo 1º projeto)
└── <projeto>/           # a criar
    ├── pages/
    ├── components/
    ├── data/
    └── utils/
```
