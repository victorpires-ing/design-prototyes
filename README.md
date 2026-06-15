# Design Prototypes — Ingresse

Protótipos de produto construídos sobre o design system **AFTER DS (2.0)** (React 19 +
TypeScript + Tailwind v4 + React Aria). Cada fluxo vive em `src/produtos/<produto>/<projeto>/`.

Além dos protótipos, o repositório traz duas ferramentas internas:

1. **Plugin “Importar tela”** — leva uma tela do protótipo para o Figma já montada com os componentes reais do DS.
2. **Testes de usabilidade** — roda testes moderados/não-moderados por cima dos próprios protótipos.

## Rodando

```bash
npm i        # instala dependências
npm run dev  # servidor de desenvolvimento (http://localhost:5173)
npm run build
```

---

## Plugin: AFTER DS — Importar tela

Reconstrói uma tela do protótipo dentro do Figma **instanciando os componentes reais do
AFTER DS** (não como print, nem frames soltos). Determinístico, offline, sem IA e sem bridge.
Os arquivos ficam em [`figma-plugin/`](figma-plugin/) (`manifest.json`, `code.js`, `ui.html`).

### O que faz

- Detecta cada componente do DS via fiber do React e cria a **instância** correta, com
  variantes, estado, ícone e texto.
- Liga as cores às **variáveis da biblioteca** (Color modes + Tailwind) e aplica o **tema**
  escolhido (Light/Dark).
- Usa a fonte **Elza**, monta auto-layout a partir do flexbox e **limpa camadas vazias**.
- Reconstrói overlays (modal/slideout/dropdown), tabelas (por coluna) e o shell do backstage
  usando os **slots** dos componentes.

### Como usar

1. No protótipo, ligue o botão de export: abra a URL com **`?figma=true`** **ou** aperte
   **Shift+F**. Surge o botão **“Exportar p/ Figma”** no canto inferior esquerdo (funciona até
   com modal/slideout/dropdown abertos, sem fechá-los).
2. Navegue até a tela, abra o que precisar e clique em **Exportar** → o JSON vai para a área de
   transferência.
3. No Figma, rode o plugin **AFTER DS — Importar tela**, **cole o JSON**, escolha o **tema** e
   clique em **Importar**. A tela é criada na página atual, ao lado do viewport.

> Requer a biblioteca **AFTER DS (2.0)** publicada e habilitada no arquivo. Para publicar o
> plugin na organização, veja [`figma-plugin/README.md`](figma-plugin/README.md).

### Componentes mapeados

| Categoria | Componentes |
| --- | --- |
| Botões | Button, Button utility, Close button, Button group, Dropdown (menu) |
| Formulário | Input, Textarea, Select, ComboBox (search), Multi-select, Checkbox, Toggle, Radio (group/button), Slider |
| Conteúdo/feedback | Badge (+ dot/icon/flag), Badge group, Tag, Alert (full-width/floating), Tooltip, Loading indicator, Progress bar/circle, Ratings badge |
| Estrutura/nav | Tabs, Breadcrumbs, Pagination, Content divider, Avatar, Featured icon, Metrics |
| Overlays/containers | Modal, Slide out menu, Empty state (com background pattern), **Table** (montada por coluna no slot), **Backstage Template** (shell) |
| Ícones | 1.100+ ícones (`@untitledui/icons`) resolvidos por nome |

Overlays e tabela usam **slots** do DS (`slot.appendChild`); o shell do backstage entra como
instância do Backstage Template com a página injetada no slot `content` (modal no slot interno,
slideout instanciado e posicionado por cima).

### Ainda não mapeados (caem como frame/genérico)

- **Base:** text-editor, video-player.
- **Application:** activity-feed, app-navigation, calendar, carousel, charts, code-snippet,
  command-menus, date-picker, file-upload, filter-bar, color/gradient/image-picker, messaging,
  notifications, section-headers, section-footers, tree-view.
- **Foundations:** logo, payment-icons, dot-icon, rating-stars.

> São mapeados sob demanda: a detecção é por componente, então o que não está na lista importa
> como frame com tokens/auto-layout (não quebra o resto). Para adicionar, edite
> [`src/lib/figma-export/registry.ts`](src/lib/figma-export/registry.ts).

---

## Ferramenta de testes de usabilidade

Permite criar e rodar testes de usabilidade **sobre os protótipos reais** (híbrido), com
gravação de sessão via **Microsoft Clarity**. Código em
[`src/produtos/usabilidade/`](src/produtos/usabilidade/) e [`src/lib/usability/`](src/lib/usability/).
Acesso protegido por senha.

### Funcionalidades

- **Painel de testes** — lista os testes, status (rascunho/publicado/encerrado), e atalho para
  criar/editar/ver resultados.
- **Editor por blocos** — monta o teste com blocos:
  - **Welcome** — tela de entrada/boas-vindas.
  - **Atividade (tarefa)** — briefing em tela cheia; ao “Começar”, o participante usa as telas
    reais e um **bloco de declaração** arrastável (Concluí/Não consegui, com justificativa
    opcional) acompanha a tarefa. Conclusão automática por **rota** ou **clique** (critérios).
  - **Pergunta** — tela estilo **Typeform** (aberta ou múltipla escolha), com **barra de
    progresso** no topo, navegação **avançar/voltar** e validação de **obrigatória**.
  - **SUS** — as 10 afirmações da System Usability Scale, com cálculo do score no relatório.
  - **Obrigado** — tela final.
- **Roda por cima do protótipo** — o runner é uma camada global; o participante navega as telas
  reais enquanto o teste registra eventos.
- **Preview** — pré-visualização do teste sem gravar nada nem contar como participação.
- **Gravação (Clarity)** — carrega o Microsoft Clarity (exceto no preview), identifica a sessão
  e injeta tags (`teste_id`, `sessao_id`, bloco atual); encerra a gravação ao fim.
- **Uma vez por dispositivo** — trava opcional para o participante responder só uma vez.
- **Link compartilhável** — cada teste tem uma rota pública `/t/:id`.
- **Resultados** — painel com métricas de sessão, resultados por tarefa, respostas e SUS;
  heatmaps/gravações via Clarity.

### Rotas

| Rota | Tela |
| --- | --- |
| `/testes` | Painel de testes |
| `/testes/novo`, `/testes/:id/editar` | Editor |
| `/testes/:id/resultados` | Resultados |
| `/t/:id` | Entrada do teste (participante); `?preview=1` para pré-visualizar |
