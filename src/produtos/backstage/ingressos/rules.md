# Ingressos: regras

> **Rotas:** `/backstage/catalogo/ingressos`, `/backstage/catalogo/ingressos/editar-grupos`, `/backstage/catalogo/ingressos/formulario`
> **No menu:** Backstage › menu do evento › Itens › Ingressos. Editar grupos abre pelo botão da página. Formulário não tem link: só pela URL.
> **Versão em uso:** única (`ingressos/`)
> **Revisado em:** 2026-11-07

> **Fora do menu desde 08/11/2026:** substituída pelo novo menu Itens (`itens/`, ver `itens/rules.md`). Rotas antigas em `/backstage/catalogo-anterior/*`.

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

Catálogo de ingressos do evento em contexto, organizado em sessão › grupo › ingresso › lote. O
produtor cria ingressos, liga e desliga a venda de cada um, reordena e duplica para outros grupos.
Editar grupos e Formulário são protótipos à parte, ainda sem banco.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Evento em contexto | `eventos/data/eventos.ts` (`useEventoAtual`) | não |
| Catálogo (sessões, grupos, ingressos, lotes) | `@/plataforma` (`useDoc("eventos")`), convertido por `data/catalogo-banco.ts` | sim (`salvarCatalogo`) |
| Vendidos por lote | `@/plataforma` (coleção `ingressos`, `vendidosPorLote`) | não |
| Grupos em Editar grupos | mock local em `pages/EditarGrupos.tsx` | só em memória |
| Perguntas do Formulário | `data/formularios.ts` (mock local) | só em memória |

`data/ingressos.ts` hoje só fornece os tipos de tela; o mock `SESSOES` dele não é usado.

## Regras

### Comportamento
- **ING-01** A página lista as sessões do evento em contexto; cada sessão é um card com data, hora e dia da semana. _(pages/Ingressos.tsx, data/catalogo-banco.ts)_
- **ING-02** Cada grupo mostra Emissões (vendidos de total), Pendentes e Acesso; abre e fecha ao clicar. O primeiro grupo da primeira sessão começa aberto. _(pages/Ingressos.tsx)_
- **ING-03** Linha do ingresso: toggle ativo, nome, resumo dos lotes, virada de lote, preço, emissões e estoque, ações. _(pages/Ingressos.tsx)_
- **ING-04** Resumo dos lotes: "Sem lotes", "N de M lotes à venda" ou "Esgotado". _(data/catalogo-banco.ts)_
- **ING-05** Lote à venda é o primeiro, na ordem, com saldo. Cancelado devolve ao estoque. _(plataforma/regras.ts)_
- **ING-06** Virada de lote: "Por quantidade" com mais de um lote, "Individual" com um. _(data/catalogo-banco.ts)_
- **ING-07** Preço mostra o do lote atual; com mais de um lote, mostra "até" o maior preço. _(data/catalogo-banco.ts)_
- **ING-08** Ao expandir, cada lote mostra nome, situação (À venda, Aguardando, Esgotado), preço e vendidos de quantidade. O primeiro lote leva a badge "Auto". _(pages/Ingressos.tsx, data/catalogo-banco.ts)_
- **ING-09** O toggle do ingresso liga ou desliga a venda e grava no banco na hora. _(pages/Ingressos.tsx, data/catalogo-banco.ts)_
- **ING-10** Grupos se reordenam dentro da sessão e ingressos dentro do grupo, arrastando pela alça que aparece no hover. _(pages/Ingressos.tsx)_
- **ING-11** Ao soltar com ordem diferente, abre "Confirmar alteração da ordem dos grupos?" (ou "dos ingressos?"); Confirmar grava, Cancelar ou fechar volta à ordem anterior. _(pages/Ingressos.tsx)_
- **ING-12** "Criar ingresso" (topo) e "Novo ingresso" (rodapé do grupo) abrem o mesmo modal; pelo grupo, já vem com a sessão e o grupo dele. _(pages/Ingressos.tsx)_
- **ING-13** O ingresso criado tem um lote único ("1º lote") e entra ativo. _(data/catalogo-banco.ts)_
- **ING-14** Se o nome do grupo já existir na sessão (sem diferenciar maiúsculas), o ingresso entra nele; senão, cria o grupo. _(data/catalogo-banco.ts)_
- **ING-15** "Criar também a meia-entrada" vem marcado e cria junto "Meia-entrada" com metade do preço e 40% da quantidade (mínimo 1). _(components/CriarIngressoModal.tsx, data/catalogo-banco.ts)_
- **ING-16** O modal abre com nome "Inteira" e o primeiro grupo existente, ou "Pista" se não houver grupo. O campo Sessão só aparece com mais de uma sessão. _(components/CriarIngressoModal.tsx)_
- **ING-17** "Duplicar" abre a escolha de grupos de destino, de todas as sessões, exceto o grupo de origem. Grupo que já tem ingresso com o mesmo nome mostra "Já possui este ingresso", mas pode ser escolhido. _(pages/Ingressos.tsx)_
- **ING-18** A cópia leva configurações e lotes, não leva vínculos e herda o estado ativo da origem. Grava no banco. _(pages/Ingressos.tsx, data/catalogo-banco.ts)_
- **ING-19** A cópia ganha a badge "cópia de ingresso" por 30 s e um ícone com "Duplicado de <ingresso> · <grupo> · Sessão <data>"; a tela rola até ela. _(pages/Ingressos.tsx)_
- **ING-20** Mudanças no banco feitas em outra aba ou aparelho aparecem na tela, menos durante um arraste ou com a confirmação de ordem aberta. _(pages/Ingressos.tsx)_
- **ING-21** Editar grupos: cada sessão lista grupos com Nome, Nome do acesso (opcional), Tipo (Código QR, Facial, Código de barras), Mapping de acesso e Estoque. _(pages/EditarGrupos.tsx)_
- **ING-22** Editar grupos: dá para adicionar e remover grupo, duplicar um grupo ou todos os grupos de uma sessão para outras sessões, e remover a sessão inteira com confirmação. _(pages/EditarGrupos.tsx)_
- **ING-23** Formulário: perguntas vêm só da lista já cadastrada; cada uma pode ser obrigatória, subir, descer ou ser deletada. _(pages/Formulario.tsx, components/AdicionarPerguntaModal.tsx)_
- **ING-24** Formulário: "Pré-visualizar" mostra o formulário como o comprador vê, com "*" nas obrigatórias. _(components/PreviewFormularioModal.tsx)_

### Validações
- **ING-30** Criar ingresso: Grupo, Nome, Preço e Quantidade obrigatórios; preço 0 ou maior (aceita gratuito); quantidade inteira maior que 0. Sem isso, o botão fica desabilitado. _(components/CriarIngressoModal.tsx)_
- **ING-31** "Criar ingresso" no topo fica desabilitado enquanto o evento não carrega do banco. _(pages/Ingressos.tsx)_
- **ING-32** Duplicar ingresso: botão desabilitado sem grupo escolhido; com escolha, vira "Duplicar em N grupo(s)". _(pages/Ingressos.tsx)_
- **ING-33** Editar grupos: duplicar a sessão fica desabilitado quando ela não tem grupos. _(pages/EditarGrupos.tsx)_
- **ING-34** Formulário: perguntas desativadas e as já adicionadas não podem ser escolhidas; "Adicionar (N)" fica desabilitado sem seleção. _(components/AdicionarPerguntaModal.tsx)_
- **ING-35** Formulário: "Para cima" desabilitado na primeira pergunta e "Para baixo" na última. _(pages/Formulario.tsx)_

### Estados
- **ING-40** Evento sem ingresso: "Crie o primeiro ingresso" / "Sem ingresso, o evento não aparece para venda no site nem no link de compra." com botão Criar ingresso. _(pages/Ingressos.tsx)_
- **ING-41** Duplicar sem outro grupo: "Nenhum grupo disponível" / "Não há outros grupos para duplicar este ingresso." _(pages/Ingressos.tsx)_
- **ING-42** Editar grupos sem outra sessão: "Nenhuma sessão disponível". _(pages/EditarGrupos.tsx)_
- **ING-43** Formulário vazio: "Nenhum formulário criado" com "Criar formulário"; sem perguntas, "Nenhuma pergunta adicionada". _(pages/Formulario.tsx)_
- **ING-44** Busca de perguntas sem resultado: "Nenhuma pergunta encontrada." _(components/AdicionarPerguntaModal.tsx)_

## Depende de / afeta

- **Depende de:** evento em contexto (Eventos); banco unificado `@/plataforma`.
- **Afeta:** link de compra `/e/<slug>` e seleção (`/comprar/:id`) só vendem ingresso ativo, no lote atual; site mostra "a partir de" com o menor preço à venda e marca o evento publicado como esgotado quando nada está à venda; checkout e carteiras recebem os ingressos emitidos desses lotes. Informações do evento troca o texto do link quando o evento não tem ingresso.

## Em aberto

- Toggle do lote não funciona de verdade: lotes começam desligados, a mudança não é gravada no banco e some ao atualizar.
- Botões sem ação: "Filtrar por data", "Ajustar abertura de vendas" (não leva a Aberturas de vendas), Editar, Vincular códigos e Excluir na linha do ingresso, Vincular códigos no lote.
- Pendentes é sempre "0". A badge "Auto" vai sempre no primeiro lote, sem regra de virada.
- A origem da cópia ("Duplicado de") não é gravada no banco; o ícone some ao recarregar.
- O empty state diz que sem ingresso o evento não aparece no site, mas o site lista todo evento publicado (como esgotado).
- Modal de criar não pede descrição nem acesso do grupo, embora o modelo aceite.
- Editar grupos é mock próprio (sessões e grupos fixos), não lê nem grava o catálogo do evento; "Salvar alterações" não faz nada.
- Formulário é mock: "Salvar" e "Salvar formulário" só mostram toast, não grava nem liga a ingresso; nome do formulário é obrigatório na tela, mas não é validado.
- Menu mobile: Combos e Produtos levam para Ingressos; no desktop ficam desabilitados.
- `data/ingressos.ts` tem o mock `SESSOES` (Botafogo x Chapecoense) sem uso.

## Fontes

Nenhum link de Figma, Confluence ou Jira no código desta pasta.
