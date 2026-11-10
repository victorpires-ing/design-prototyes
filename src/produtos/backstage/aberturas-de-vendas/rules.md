# Aberturas de vendas: regras

> **Rotas:** `/backstage/catalogo/aberturas-de-vendas`
> **No menu:** Backstage › menu do evento › Itens › Aberturas de vendas (desktop e mobile).
> **Versão em uso:** única (`aberturas-de-vendas/`)
> **Revisado em:** 2026-11-08 (ligada ao catálogo)

> **De volta ao menu em 08/11/2026:** os itens não têm mais datas de venda próprias, então a abertura de vendas e o lote ligado decidem quando cada item vende (`itens/rules.md` ITM-11 e ITM-30). Substitui a Agenda de vendas; `/backstage/catalogo/agenda` e `/backstage/catalogo-anterior/aberturas-de-vendas` redirecionam para cá.

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

Quando os itens do evento vendem. Cada abertura tem nome (visto pelo comprador), início, fim e os
ingressos, produtos e combos incluídos. Sem público nem canais: quem compra é restringido por chave de
acesso, e o item só aparece no fluxo de compra (`itens/rules.md` ITM-31).
Os itens não têm datas próprias (`itens/rules.md` ITM-30); a abertura e o lote ligado decidem.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Aberturas | `Evento.aberturas` (`AberturaDeVendas`: nome, início, fim, `itens`) do evento em contexto; dados antigos com `configuracoes` são lidos por `itensDaAbertura` e regravados sem elas | sim (`salvarAberturas`, na hora) |
| Itens para escolher | ingressos das sessões, produtos do evento e combos (`useCatalogo`) | não |

## Regras

- **ABV-01** Título "Aberturas de vendas" e subtítulo "Quando cada ingresso, produto e combo vende." (UI-VIS-014); "Nova abertura" no topo quando já há aberturas. Lista por data de início. _(pages/AberturasDeVendas.tsx)_
- **ABV-02** Cada abertura é um cartão com nome, estado (Aberta agora, Agendada, Encerrada, pela hora atual), "De <início> até <fim>" e, sempre visíveis, Ingressos, Produtos e Combos incluídos (três colunas no desktop, empilhados no celular, UI-MOB-004). Vazio: "Nenhum ingresso", "Nenhum produto", "Nenhum combo"; sem nenhum item, aviso "Escolha os itens: sem eles, esta abertura não vende nada." Ações Duplicar, Editar e Excluir. _(pages/AberturasDeVendas.tsx)_
- **ABV-03** "Nova abertura" e Editar abrem o modal com Nome (obrigatório, "Aparece para o comprador."), Começa em e Termina em (calendário com hora, aceita digitação) e a data do evento como referência. Erros: "Dê um nome à abertura.", "Escolha data e hora.", "Escolha um fim depois do começo." A abertura nova nasce sem itens. _(pages/AberturasDeVendas.tsx)_
- **ABV-04** "Escolher ingressos", "Escolher produtos" e "Escolher combos" abrem o mesmo padrão: slideout à direita (tela cheia no celular, UI-NAV-001 e UI-NAV-003) com busca, filtro Todos ou Selecionados, "Mostrar mais" e resumo no rodapé. Produtos e combos: lista com "N de M" e "Selecionar todos os N do filtro" (`SeletorDeLista`). Ingressos, feitos para milhares de setores com centenas de ingressos: sessão › setor › ingresso; "Toda a sessão de <data>" e cada setor com caixa de seleção (parcial mostra "7 de 8 ingressos"); setores recolhidos, 30 por vez, e ingressos do setor aberto 50 por vez; a busca por ingresso abre o setor que o tem; resumo "60 ingressos em 7 setores". O cartão mostra até 5 nomes; acima disso, a contagem. _(pages/AberturasDeVendas.tsx, components/SeletorDeIngressos.tsx, itens/components/SeletorDeLista.tsx)_
- **ABV-09** A abertura grava só os ingressos marcados. Marcar a sessão ou o setor marca os ingressos que ele tem agora; ingresso criado depois não entra sozinho (decisão Victor, 08/11/2026), e o slideout avisa: "Ingressos criados depois não entram sozinhos." O resumo conta ingressos e setores ("60 ingressos em 7 setores"). _(components/SeletorDeIngressos.tsx, pages/AberturasDeVendas.tsx)_
- **ABV-05** Sem público ("Vender para"), sem canais e sem várias configurações por abertura (removidos em 08/11/2026). _(pages/AberturasDeVendas.tsx)_
- **ABV-06** Duplicar cria "Cópia de <nome>" com os mesmos itens, sem confirmação, com toast. Excluir pede confirmação ("Os itens dela deixam de vender neste período. Esta ação não pode ser desfeita."). _(pages/AberturasDeVendas.tsx)_
- **ABV-07** Cada ação confirmada grava na hora e mostra toast ("Alterações salvas.", "<nome> criada.", "<nome> excluída."); erro mostra "Tente de novo: não foi possível salvar." _(pages/AberturasDeVendas.tsx)_
- **ABV-08** Estados: carregando (esqueleto), vazio ("Nenhuma abertura programada" com "Nova abertura"); busca por nome e "Mostrar mais" só com mais de 8 aberturas. _(pages/AberturasDeVendas.tsx)_

## Depende de / afeta

- **Depende de:** evento em contexto e catálogo (`itens/`).
- **Afeta:** **ainda não** afeta a compra: o site, o link de compra e o checkout não leem as aberturas.

## Em aberto

- Ingresso criado depois num setor que já está numa abertura fica fora dela até ser marcado. Avisar no cadastro do ingresso? A combinar.

- Aplicar as aberturas na compra (período e itens) junto com o lote ligado.
- Item fora de qualquer abertura: vende ou não? Hoje a tela não diz; confirmar com Produto.
- Remover um ingresso, produto ou combo do catálogo não o tira das aberturas (o seletor só mostra os que existem).

## Fontes

Nenhum link de Figma, Confluence ou Jira no código desta pasta.
