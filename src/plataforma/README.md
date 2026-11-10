# Plataforma: o gêmeo da Ingresse para protótipo

Um banco só e um modelo só para os produtos que fazem parte da mesma jornada:

```
Backstage (cria evento, ingressos, publica)
   └─► Site (lista os publicados)  ─┐
   └─► Link de compra /e/<slug>  ───┴─► Seleção e atribuição ─► Checkout ─► Carteira web e app
```

## Onde fica cada coisa

| Arquivo | O quê |
| --- | --- |
| `modelo.ts` | Tipos: `Evento` (com sessões > grupos > ingressos > lotes), `Pedido`, `IngressoEmitido`, `Usuario`, `HistoricoVendas` |
| `regras.ts` | Regras puras: lote atual, vendidos por lote, preço mínimo, quem vende no link, quem aparece no site |
| `acoes.ts` | Ações que gravam: criar evento, salvar catálogo, mudar status, criar, pagar e cancelar pedido, cancelar ingresso, emitir cortesias, transferir |
| `vendidos.ts` | `useVendidos()`: vendidos por lote de todo o banco (emitidos + histórico). Use sempre este, para todo produto contar o mesmo estoque |
| `sessao.ts` | Quem está logado como comprador neste navegador (o e-mail é a chave da carteira) |
| `carteira.ts` | Ingressos de quem está logado, agrupados por evento (base das duas carteiras) |
| `db/index.ts` | Cliente do banco: `useColecao`, `useDoc`, `salvar`, `resetarBanco` |
| `db/seed.ts` | Mundo inicial: eventos do Backstage e do novo site, cada um com catálogo gerado, e o histórico de vendas dos eventos publicados do Backstage |
| `../../api/db.ts` | API na Vercel, no mesmo Upstash Redis das outras APIs (namespace `design-prototyes:db:v1`) |

## Compartilhado ou local

- **Na Vercel**, o banco é **compartilhado**: todo mundo que abre o protótipo vê o mesmo mundo.
  Um evento criado no notebook aparece no site aberto no celular.
- **No `npm run dev`**, as funções de `api/` não rodam, então o banco vive no `localStorage` do
  navegador (modo local), com o mesmo comportamento. Para testar o compartilhado na máquina, use
  `vercel dev` com as variáveis do Redis.
- A tela atualiza na hora; outros aparelhos recebem a mudança ao focar a janela ou a cada 8 s.

## Histórico de vendas

A coleção `historico` dá aos eventos da seed um passado de vendas sem gravar milhares de pedidos:
vendidos por lote (entram no estoque), divisão por canal, pagamentos e a série diária. A série
termina sempre ontem, para o protótipo não envelhecer. Métricas e relatórios do Backstage somam
histórico e pedidos pagos.

## Organizações

A coleção `organizacoes` (id, nome, sigla) guarda as contas das produtoras. Cada evento aponta
para uma em `organizacaoId`; `produtora` continua com o nome, para vitrine e listagens. Eventos
gravados antes da coleção não têm o campo: use sempre `organizacaoDoEvento(evento)`, que cai no
id derivado do nome (`idDaOrganizacao`). O Backstage filtra tudo pela organização em contexto
(`src/produtos/backstage/organizacoes/rules.md`); site, checkout e carteiras mostram todas.

## Canais

`site`, `link` e `app` (compra do público), `bilheteria` (venda pelo Backstage; método `saldo`
quando a produtora paga só a taxa) e `cortesia` (sem cobrança, método `cortesia`).

## Regras para quem mexe

- **Produto lê e grava pela plataforma**, nunca monta documento do banco na mão. Precisa de algo
  novo? Crie a ação em `acoes.ts`.
- **Cada produto tem um adaptador** (`data/plataforma.ts` dentro do projeto) que converte o modelo
  da plataforma para os tipos da tela. Assim a tela não muda quando o modelo cresce.
- **Mudou a seed?** Suba `SEED_VERSAO`. O servidor só grava documentos que ainda não existem:
  nada criado por alguém é sobrescrito.
- **Dado fictício sempre.** O banco é aberto (sem login de verdade). Nunca grave nome, e-mail ou
  documento de cliente real.
- **Resetar o mundo** (`resetarBanco()`, também em `window.__banco` no console) apaga o que todo
  mundo criou no modo compartilhado. Avise o time antes.

## O que já está ligado

| Produto | Lê | Grava |
| --- | --- | --- |
| Backstage › Eventos e Visão geral | lista, evento em contexto, métricas (histórico + pedidos) | criar evento, status |
| Backstage › Ingressos | catálogo do evento, emissões | criar ingresso, ordem, ativar, copiar |
| Backstage › Informações do evento | link de compra | — |
| Backstage › Bilheteria | catálogo e lote atual | pedido (link ou só a taxa), cancelamento |
| Backstage › Cortesias | catálogo e lote atual | pedido por destinatário, cancelamento |
| Backstage › Pedidos | pedidos pagos, ingressos, usuários | transferência de titularidade |
| Backstage › Relatórios › Vendas e Borderô | histórico + pedidos pagos | — |
| Novo site | home, busca, categorias, artistas, detalhe | — |
| Seleção e atribuição (`/comprar/:id`, `/e/:slug`) | catálogo e lote atual | pedido |
| Checkout (melhorias de compra) | pedido | pagamento (Pix simulado e cartão), emissão |
| Carteira web e carteira do app | ingressos do e-mail logado | — |

Os demais protótipos continuam com os próprios mocks até alguém ligá-los aqui.
