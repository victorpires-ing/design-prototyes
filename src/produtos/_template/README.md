# Template de produto

Esta pasta é um **modelo** para criar protótipos novos. A organização é em duas camadas:

```
produtos/
└── <produto>/              # ex: backstage, ingresse-app, organizador
    ├── components/         # componentes compartilhados ENTRE projetos do produto
    │                       # (layouts, navegação, header — coisas que todo projeto reusa)
    └── <projeto>/          # ex: cortesias, ingressos, financeiro
        ├── pages/          # telas/rotas do projeto
        ├── components/     # componentes exclusivos DESTE projeto
        ├── data/           # mocks, stores e tipos do projeto
        └── utils/          # auxiliares usados só por este projeto
```

## Como criar um produto novo

1. **Duplique a pasta `_template/`** dentro de `src/produtos/` e renomeie com o nome do produto em `kebab-case` (ex: `meu-produto/`).
2. Dentro dele, renomeie `_projeto/` para o nome do seu primeiro projeto (também `kebab-case`).
3. Registre as páginas como rotas em `src/app/App.tsx`.
4. **NÃO altere a pasta `_template/` original** — ela é a referência para os próximos designers.

## Como adicionar um projeto novo a um produto existente

Duplique a pasta `_projeto/` dentro do produto e renomeie. Reaproveite os componentes compartilhados em `<produto>/components/` (layout, navegação, etc.) — não duplique.

## Exemplo real

`src/produtos/backstage/` é o produto Backstage. Ele tem:
- `components/Backstage.tsx` — layout compartilhado (sidebar + rail de evento) usado por todos os projetos do Backstage
- `components/ThemeToggle.tsx` — toggle de tema compartilhado
- `cortesias/` — projeto de emissão de cortesias (pages, components, data, utils próprios)

Quando um projeto novo entrar no Backstage (ex: `relatorios/`), ele será uma pasta irmã de `cortesias/` e poderá importar `../components/Backstage` para usar o mesmo layout.

## Regras importantes

- **Não importe** de outro produto (`src/produtos/outro-produto/...`). Cada produto é auto-contido — se dois produtos precisam do mesmo componente, **duplique** e converse com o time antes de promover para o design system.
- **Não importe** de outro projeto do mesmo produto, exceto através de `<produto>/components/` (que existe justamente para isso).
- **Não altere** `src/components/` — essa pasta é o design system, compartilhada por todos.
- **Pode importar livremente** de:
  - `@/components/base/*` — componentes base do design system
  - `@/components/application/*` — componentes de aplicação do design system
  - `@/components/foundations/*` — ícones e elementos visuais base
  - `@/utils/cx` — utilitário de classes
  - `@/providers/theme-provider` — tema (light/dark)
  - bibliotecas externas (`react-aria-components`, `@untitledui/icons`, `motion/react`, `sonner`, etc.)

## Convenções

- **Nomes de arquivo**: `kebab-case` (ex: `minha-pagina.tsx`, não `MinhaPagina.tsx`).
- **Componentes React Aria** devem ser importados com prefixo `Aria*` (ex: `import { Button as AriaButton } from "react-aria-components"`).
- Use as classes semânticas de cor (`text-primary`, `bg-brand-solid`, etc.) — não use cores cruas como `text-gray-900`.
