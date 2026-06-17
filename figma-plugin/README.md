# AFTER DS — Importar do site (plugin Figma)

Reconstrói uma tela do protótipo dentro do Figma, **instanciando os componentes reais da
biblioteca AFTER DS** (Button, Input, Select, Modal, Slideout, Dropdown, Table…) e recriando
o resto como frames/texto com auto-layout e **tokens bindados**. Determinístico, offline,
**sem IA e sem o Desktop Bridge**.

## Arquivos (é só isso que sobe)

- `manifest.json` — manifesto do plugin
- `code.js` — lógica (já com `TOKENS`/`SPACING`/`ICONS`/`componentes` **embutidos**; sem build)
- `ui.html` — UI (cola o JSON, escolhe o tema, importa)

Não há etapa de build nem dependências externas.

## Fluxo de uso (time)

1. No protótipo, ligue o botão de export: abra com **`?figma=true`** na URL **ou** aperte
   **Shift+F**. Um botão **“Exportar p/ Figma”** aparece no canto inferior esquerdo (funciona
   até com modal/slideout/dropdown abertos, sem fechá-los).
2. Navegue até a tela, abra o que precisar (overlays) e clique em **Exportar** → o JSON vai
   para a área de transferência.
3. No Figma, rode o plugin, **escolha o tema** (Light/Dark), **cole o JSON** e clique em
   **Importar**. A tela é criada na página atual, ao lado do viewport.

## Instalação (dev / cada pessoa)

Figma Desktop → **Plugins → Development → Import plugin from manifest…** → selecione
`figma-plugin/manifest.json`.

## Publicar para a organização (upload)

1. Garanta que a biblioteca **AFTER DS (2.0)** esteja **publicada** e habilitada — o plugin
   importa os componentes por *key* (`importComponentSetByKeyAsync`); sem a lib, cai em frames.
2. Importe o manifesto (passo acima) e teste em um arquivo real.
3. No menu do plugin em **Development**, clique em **Publish**. Em org Enterprise, escolha
   **“Only for your organization”** (plugin privado da empresa).
4. O Figma pede **ícone 128×128** (e arte de capa). Adicione um PNG e conclua. Na primeira
   publicação o Figma **atribui um `id`**; se pedir, atualize o `id` no `manifest.json` e
   republique.
5. Pronto: o time instala pela aba de plugins da organização, sem importar manifesto.

> Atualizações: editou `code.js`/`ui.html`? Rode **Publish** de novo para propagar a nova versão.

## Cobertura atual

- **Componentes DS** → instância real com variantes/estado/ícone/texto: Button, Button
  utility, Close button, Input, Textarea, Select, ComboBox (search), MultiSelect, Checkbox,
  Toggle, Radio, Badge(s), Tag, Avatar, Tabs, Tooltip, Featured icon, Empty state (com
  background pattern), Metrics, Alert, Pagination, Content divider, Loading indicator,
  Breadcrumbs, Progress bar/circle, Slider, Ratings badge.
- **Overlays** (slideout, modal, dropdown) → componente do DS com o conteúdo injetado no
  **slot**; itens de menu/opções clonados dos componentes internos (`_…` não publicáveis por key).
- **Tabela** → componente **Table**, montada **por coluna** no slot `Content` (header cell +
  body cells), reusando a detecção de tipo de célula.
- **Tokens**: fills/texto/borda bindados às variáveis da lib (Color modes + Tailwind Colors).
- **Tema**: Light/Dark aplicado via modo de variável da coleção `1. Color modes`.
- **Fonte**: textos genéricos usam **Elza** (fallback Inter).
- **Limpeza**: wrappers pass-through são colapsados e frames vazios sem valor visual descartados.

## Crescer a cobertura

Edite **`src/lib/figma-export/registry.ts`** (no app) para mapear novos componentes
React → key da lib + variantes. O `code.js` é genérico e raramente muda — exceto para
lógica específica de slot/conteúdo (ex.: blocos de Input/EmptyState/Dropdown/Table).

## Limitações

- Imagens entram como placeholder cinza.
- Box-shadow não é recriado.
- Avatares das opções de select usam o avatar padrão do item (sem troca de imagem).
