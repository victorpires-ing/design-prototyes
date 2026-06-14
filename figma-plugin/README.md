# AFTER DS — Importar do site (plugin Figma)

Reconstrói uma tela do protótipo dentro do Figma, **instanciando os componentes reais
da biblioteca AFTER DS** (Button, Badge, Input…) e recriando o resto como frames/texto
com auto-layout. Determinístico, offline, **sem IA e sem o Desktop Bridge**.

## Fluxo de uso (time)

1. Abra o protótipo com **`?figma=true`** na URL (ex.: `…/backstage/pesquisas?figma=true`).
   Um botão **“Exportar p/ Figma”** aparece no canto inferior esquerdo (fica ligado ao
   navegar; desliga com `?figma=false`).
2. Navegue até a tela desejada e clique em **Exportar** → o JSON é copiado para a área de
   transferência.
3. No Figma, rode o plugin **AFTER DS — Importar do site**, **cole o JSON** e clique em
   **Importar**. A tela é criada numa Section ao lado do conteúdo atual.

## Instalação

**Dev (cada pessoa):** Figma Desktop → menu **Plugins → Development → Import plugin from
manifest…** → selecione `figma-plugin/manifest.json`.

**Distribuição pro time:** publicar como **plugin privado da organização** (Figma
Organization/Enterprise → Publish → Only for your organization). Aí todos instalam pela
Community interna sem importar manifesto.

## Como funciona

- A captura no app (`src/lib/figma-export/`) percorre o DOM e, via **fiber do React**,
  detecta a raiz de cada componente do DS — já resolvendo a **key da biblioteca + as
  variantes** (ver `registry.ts`). O resto vira `frame`/`text`/`image`.
- O plugin (`code.js`) lê esse JSON e:
  - **nós DS** → `importComponentSetByKeyAsync(key)` + `createInstance()` +
    `setProperties(variantes)` + texto do label;
  - **frames** → auto-layout a partir do flexbox + cor/borda/raio (converte
    `oklch`/`oklab`/`rgb` → sRGB);
  - **texto** → fonte (Inter por peso) + cor + tamanho;
  - **imagem** → placeholder cinza (v1).

> Para crescer a cobertura de componentes, edite **`src/lib/figma-export/registry.ts`**
> (no app) — o plugin é genérico e não precisa mudar.

## O que já vem aplicado

- **Tokens de cor**: fills/texto/borda de elementos genéricos são **bindados às variáveis
  da lib** (coleções Color modes + Tailwind Colors) quando o valor casa com um token;
  senão, cai em cor literal.
- **Fonte**: textos genéricos usam **Elza** (a fonte do DS), com fallback para Inter.
- **Templates do produto**: rail do produtor, card do evento e menu de funcionalidades
  entram como **instâncias** (`_backstage naveigation`, `event-details-card`,
  `event-functionalities-list`) — não são reconstruídos do DOM.

## Limitações / próximos passos

- **Ícones avulsos** e **imagens** entram como placeholder. Próximo: mapa de ícones por
  nome + fetch de imagem.
- Sombras (box-shadow) não são recriadas.
- O matching de token é por valor de cor (pode colidir quando dois tokens têm o mesmo
  valor — escolhe o primeiro).
