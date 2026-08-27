# Equipe de operação v2 — pesquisa de referências e boas práticas

> Documento de apoio para a rodada de melhoria de usabilidade da tela
> `/backstage/equipe-de-operacao/v2`. Reúne (1) o diagnóstico do fluxo atual,
> (2) referências de produtos com proposta semelhante, (3) bibliografia de
> suporte e (4) as boas práticas derivadas, já traduzidas em recomendações
> para esta tela.
>
> Última atualização: agosto de 2026.

---

## 1. O que o fluxo pede do usuário hoje

O produtor precisa criar um **grupo de operação**. Um grupo carrega, ao mesmo tempo,
quatro decisões independentes:

| # | Decisão | Onde acontece hoje |
|---|---------|--------------------|
| 1 | **O que o grupo pode fazer** — Cortesia, PDV, Bilheteria (1 a 3 permissões) | Tela pré-wizard (`PermissoesSelector`) |
| 2 | **Como a cota é contada** em cada permissão — uma cota para o grupo, ou uma cota por item | Radio dentro do cartão da permissão, na mesma tela |
| 3 | **Quais itens** cada permissão libera, e **quanto** de cada um | Passo 1 do wizard (`ConfiguracaoGrupo`) — tabela com uma coluna por permissão |
| 4 | **Quem** são os operadores e **como o grupo se chama** | Passos 2 e 3 do wizard |

O ponto crítico é que **as decisões 1, 2 e 3 estão acopladas**: a escolha do modo de
cota (decisão 2) muda o significado da coluna da tabela (decisão 3) — checkbox vira
campo numérico — e essa consequência é escolhida numa tela e revelada na seguinte.

### Sintomas prováveis do "não entendo como funciona"

1. **A escolha mais abstrata vem primeiro.** "Uma cota para o grupo" × "uma cota para
   cada item" é pedida antes de o usuário ver um único item. Ele decide sobre um
   mecanismo que ainda não tem referente concreto.
2. **Três eixos numa grade só.** A tabela do passo 1 cruza *item* × *permissão* e, em
   algumas colunas, embute também a *quantidade*. Duas colunas podem ter semânticas
   diferentes lado a lado (checkbox × stepper) — o usuário não tem como saber por que.
3. **Regra implícita sem feedback.** Na cota por item, "quantidade > 0" é o que libera
   o item; não há checkbox. É uma regra que só se aprende errando.
4. **Vocabulário de plataforma, não do produtor.** "Permissão", "cota", "modo",
   "item" são termos do modelo de dados. O produtor pensa em "o patrocinador pode dar
   30 cortesias de Pista" — uma frase, não quatro campos.
5. **Nenhum estado do resultado antes do fim.** O resumo (`ResumoPermissoes`) só
   aparece no passo 3. Até lá, não existe uma frase que responda "o que este grupo vai
   poder fazer?".
6. **Ausência de ponto de partida.** Todo grupo nasce em branco. Não há preset
   ("Patrocinador", "Equipe de venda", "Bilheteria do local") para ancorar a decisão.

---

## 2. Referências de produto analisadas

### 2.1 Square — Team Management / Advanced Access
Permissões são criadas como **conjuntos nomeados** (*permission sets*), e a criação
começa por um **nível pré-definido — Standard, Enhanced, Full** — com um botão
"Customize" para quem precisar ajustar item a item.
*O que aproveitar:* o caminho padrão é "escolha o perfil pronto"; a granularidade é a
exceção, escondida atrás de um clique.
🔗 [Create and edit permission sets](https://squareup.com/help/us/en/article/5822-employee-permissions) ·
[Advanced Access](https://squareup.com/us/en/staff/advanced-access)

### 2.2 Shopify POS — POS roles
O Shopify **impede** atribuir permissões soltas a um funcionário de PDV: só se atribui
um **papel**. Existe um papel padrão ("Associate"), que não pode ser apagado, e que já
vem selecionado ao adicionar alguém.
*O que aproveitar:* forçar a reutilização de configuração em vez de recriar do zero a
cada pessoa; um default sempre pré-selecionado.
🔗 [Give staff permissions with POS roles](https://help.shopify.com/en/manual/sell-in-person/shopify-pos/staff-management/pos-roles) ·
[Understanding POS staff management](https://help.shopify.com/en/manual/sell-in-person/shopify-pos/staff-management/understanding-pos-staff-management)

### 2.3 Eventbrite — Team management
Quatro papéis padrão (Owner, Admin, Check-in attendees, Check-in attendees and guests)
e criação de papel customizado como caminho secundário. O papel é criado **antes** e
independentemente de convidar as pessoas — duas tarefas, dois momentos.
*O que aproveitar:* separar "definir o que o papel pode fazer" de "colocar gente nele".
🔗 [Manage roles and permissions](https://www.eventbrite.com/help/en-us/articles/509534/how-to-manage-roles-and-permissions/) ·
[Permissions glossary](https://www.eventbrite.com/help/en-us/articles/362073/permissions-definitions/)

### 2.4 Spektrix — venda por agentes (*allocations*)
No vocabulário de bilheteria, dar estoque a um terceiro chama-se **allocation** (ou
*hold* / *set-aside*): um lote reservado, com devolução do não vendido. O produto
distingue explicitamente "allocation ticketed" (estoque fatiado por agente) de "acesso
ao inventário vivo".
*O que aproveitar:* o conceito de cota já tem nome consagrado no setor — e a métrica que
o operador de bilheteria acompanha é **"quanto sobrou"**, não "quanto foi configurado".
🔗 [Introduction to selling tickets through agents](https://support.spektrix.com/hc/en-us/articles/14251606731549-Introduction-to-Selling-Tickets-through-Agents) ·
[Guide for ticket agents](https://integrate.spektrix.com/docs/agentguide)

### 2.5 Matriz papel × recurso × ação (padrão RBAC de mercado)
A literatura de RBAC recomenda a **matriz papel–recurso–ação** como artefato de
configuração e auditoria, com duas cautelas repetidas: manter o número de papéis
pequeno e **evitar o padrão "um usuário, um papel"**. Aparece também a prática de
**preview por papel** — ver o produto como aquele papel veria, antes de salvar.
🔗 [Access control matrix — best practices](https://frontegg.com/blog/access-control-matrix) ·
[10 RBAC best practices](https://www.osohq.com/learn/rbac-best-practices) ·
[Role-based access control guide](https://budibase.com/blog/app-building/role-based-access-control/)

### 2.6 Totem Ingresse — seleção de ingressos (referência interna)
🔗 [Figma — Totem, node 4-21017](https://www.figma.com/design/L8xe7v1efjyJaQYsdUFuht/Totem?node-id=4-21017) ·
protótipo navegável em `/totem` (configuração do evento) → `/totem/event` (jornada de compra),
no produto `src/produtos/totem/`.

É a tela onde **o que o produtor configura vira ação**: o operador/comprador escolhe
sessão, grupo, ingresso e lote. Padrões relevantes:

- **Sessão como aba horizontal no topo**, com **badge de contagem** do que já foi
  selecionado naquela sessão, e sessões esgotadas visivelmente desabilitadas em vez de
  ocultas.
- **Itens agrupados por grupo de ingresso** (`{Nome do grupo}` + acordeão), com lote,
  preço e stepper **na própria linha** — mesma estrutura de dados da tela de configuração.
- **Painel lateral fixo "Resumo da compra"**, sempre visível, com o que foi escolhido,
  subtotais, descontos, total e CTA. O resumo não é um passo final: é um acompanhante.
- **Estados por item declarados no item**: `Esgotado`, `Não habilitado` (com "Ler mais"
  explicando o que falta), `Resgatado`. A restrição é explicada onde ela morde.

*O que aproveitar:* a configuração do grupo deveria ter **a mesma forma** da tela em que
ela é consumida — abas de sessão com contagem, itens agrupados, e um resumo lateral vivo.
Hoje o produtor configura numa gramática (tabela item × permissão, resumo só no fim) e o
resultado aparece em outra. Aproximar as duas reduz a tradução mental que ele precisa
fazer para prever o efeito da configuração.

### 2.7 Síntese das referências

| Padrão observado | Square | Shopify POS | Eventbrite | Spektrix | Totem | Equipe de operação v2 |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Começa por perfil pronto / preset | ✅ | ✅ | ✅ | — | — | ❌ |
| Configuração reutilizável entre pessoas | ✅ | ✅ (obrigatório) | ✅ | ✅ | — | ✅ |
| Granularidade escondida atrás de "customizar" | ✅ | parcial | ✅ | — | — | ❌ (é o caminho único) |
| Define permissão antes de escolher pessoas | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Resumo/preview do efeito antes de salvar | parcial | — | — | ✅ | ✅ (lateral, vivo) | só no último passo |
| Vocabulário do domínio (não do modelo) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

**Nenhuma das referências pede ao usuário que escolha o *mecanismo de contagem* antes
de ver o conteúdo.** Esse é o ponto em que o fluxo atual se descola do mercado.

---

## 3. Bibliografia de suporte

### 3.1 Autoria de política de acesso (o problema exato desta tela)

- **Reeder, R. W.; Bauer, L.; Cranor, L. F.; Reiter, M. K.; Bacon, K.; How, K.;
  Strong, H. (2008). *Expandable Grids for Visualizing and Authoring Computer Security
  Policies*. CHI '08.**
  Interfaces de política baseadas em **lista de regras** falham porque não conseguem
  mostrar a *interação* entre regras — cada regra só é vista isoladamente. A alternativa
  testada foi uma **matriz interativa** (sujeitos nas linhas, permissões nas colunas)
  em que o **estado efetivo** da política é sempre visível na própria grade. Em estudo
  com 36 participantes, superou de forma ampla a interface nativa do Windows XP em
  precisão e tempo, numa variedade de tarefas de autoria.
  → Valida a **grade** como forma; e condiciona o ganho a **mostrar o efeito resultante
  dentro da grade**, não só o input.
  🔗 [PDF (CMU)](https://users.ece.cmu.edu/~lbauer/papers/2008/chi08-grids.pdf) ·
  [ACM DL](https://dl.acm.org/doi/10.1145/1357054.1357285)

- **Karat, C.-M.; Karat, J.; Brodie, C.; Feng, J. — SPARCLE Policy Workbench (IBM).**
  Autoria de política em **linguagem natural estruturada** ("*[papel]* pode *[ação]*
  sobre *[recurso]*"), com o sistema fazendo o parsing para a estrutura formal.
  → Valida escrever a regra como **frase**, e usar a frase como resumo verificável.

### 3.2 Carga cognitiva e forma do formulário

- **Nielsen, J. (1995 →). *Progressive Disclosure*, Nielsen Norman Group.**
  Adiar o avançado; mostrar primeiro o que atende à maioria. A variante linear é a
  *staged disclosure* — o wizard.
  🔗 [nngroup.com/videos/progressive-disclosure](https://www.nngroup.com/videos/progressive-disclosure/)

- **Nielsen Norman Group — *4 Principles to Reduce Cognitive Load in Forms*.**
  Agrupar o relacionado, evitar decisões cujo efeito não é observável, reduzir o número
  de elementos competindo por atenção na mesma tela.
  🔗 [nngroup.com/articles/4-principles-reduce-cognitive-load](https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/)

- **GOV.UK Design System / Service Manual — *One thing per page*.**
  Uma pergunta por tela; erros ficam triviais de localizar e corrigir porque o contexto
  é único. Aplicável quando as decisões são independentes — que **não** é o caso das
  decisões 2 e 3 aqui, e por isso elas deveriam estar **juntas**, não separadas.

- **Nielsen, J. — *10 Usability Heuristics*.** Três se aplicam diretamente:
  **#2 Correspondência com o mundo real** (vocabulário do produtor, não do banco),
  **#6 Reconhecer em vez de lembrar** (não fazer o usuário guardar o modo escolhido na
  tela anterior), **#1 Visibilidade do estado do sistema** (o efeito da configuração
  precisa estar sempre à vista).

- **Wroblewski, L. (2008). *Web Form Design: Filling in the Blanks*.**
  Rótulo, campo e ajuda no mesmo eixo visual; validação inline no momento da decisão,
  não na tentativa de avançar.

- **Cooper, A.; Reimann, R.; Cronin, D. — *About Face*.**
  Conceito de **excise**: trabalho que a interface impõe e que não pertence ao objetivo
  do usuário. Escolher "modo de cota" é excise puro se o sistema puder inferir o modo a
  partir de como o usuário preenche.

- **Krug, S. — *Don't Make Me Think*.**
  Cada decisão sem consequência visível é uma pergunta sem resposta; o usuário abandona
  ou chuta.

---

## 4. Boas práticas derivadas

### BP1 — Comece por um preset, não por uma folha em branco
Todas as referências de mercado abrem com perfis prontos. Traduzir para cá:
**"Patrocinador"** (só cortesia, cota por grupo), **"Equipe de venda"** (PDV, cota por
grupo), **"Bilheteria do local"** (bilheteria, cota por item) e **"Começar do zero"**.
O preset preenche permissões + modo de cota; tudo continua editável.
*(Square, Shopify POS, Eventbrite; NN/g progressive disclosure)*

### BP2 — Nunca peça o mecanismo antes do conteúdo
Remova a pergunta "como contar a cota" da tela inicial. Deixe o usuário marcar itens
primeiro; ofereça a cota por item como um **refinamento** dentro da própria tabela
("definir quantidade por item"), com o total do grupo como padrão.
*(About Face — excise; Reeder et al. — o efeito mora na grade)*

### BP3 — Uma frase por permissão, sempre visível
Cada permissão concedida deve render uma linha em português corrente, atualizada em
tempo real: **"Cortesia — até 50 no total, entre 6 itens de 2 sessões."** Essa frase é o
que o usuário confere; os campos são só o meio de produzi-la.
*(SPARCLE — política como linguagem natural; heurística #1)*

### BP4 — O estado efetivo pertence à grade
A tabela deve mostrar o resultado, não apenas coletar o input: totais por coluna,
contagem de itens liberados por sessão, e destaque visual da linha/coluna ativa.
Colunas com semânticas diferentes (checkbox × quantidade) precisam de um rótulo que
declare a diferença — e não de um radio numa tela anterior.
*(Reeder et al., CHI '08)*

### BP5 — Vocabulário do produtor
| Termo do modelo | Termo sugerido |
|---|---|
| Permissão | O que o grupo pode fazer / Cortesia · PDV · Bilheteria |
| Cota / modo de cota | Quantidade liberada / Limite |
| Modo "grupo" | Um limite para o grupo todo |
| Modo "item" | Um limite para cada item |
| Item liberado | Ingresso, produto ou combo que o grupo pode usar |
*(Heurística #2; Spektrix — "allocation" é o termo do setor, mas o produtor brasileiro
diz "cota"/"liberação")*

### BP6 — Validação no lugar da decisão
Hoje os erros aparecem no painel lateral e na barra fixa após tentar avançar. O erro
deve nascer **junto do controle** que o resolve (a célula, a coluna, o campo), e o
resumo lateral deve apenas contabilizar quantos pontos ainda faltam, com link para o
primeiro deles.
*(Wroblewski; GOV.UK — erro fácil de localizar)*

### BP7 — Reutilização acima de recriação
Ofereça **"duplicar grupo"** a partir da lista e do detalhe. É o equivalente aos
*permission sets* reutilizáveis do Square e ao papel obrigatório do Shopify.
*(RBAC: evitar "um usuário, um papel")*

### BP9 — Espelhe a superfície de consumo
A tela de configuração e o Totem descrevem o mesmo objeto. Use a **mesma gramática nos
dois lados**: sessão no topo com contagem, itens agrupados por grupo de ingresso, e
resumo lateral permanente. Quando o produtor reconhece a forma do Totem na configuração,
ele consegue prever o efeito sem simular mentalmente.
*(Totem; heurística #6 — reconhecer em vez de lembrar)*

### BP8 — Preview antes de salvar
Além do resumo textual, mostrar o que o operador verá no portal ("Você pode emitir até
30 cortesias de Pista · Inteira"). É o *preview por papel* do padrão RBAC, e converte a
configuração abstrata em consequência observável.
*(RBAC best practices — role-based previewing)*

---

## 5. Recomendações priorizadas para a tela

| Prioridade | Mudança | Boas práticas | Arquivos |
|---|---|---|---|
| **P0** | Tirar o radio "como contar a cota" da tela inicial; a tela 1 vira só "o que o grupo pode fazer" | BP2, BP5 | `PermissoesSelector.tsx`, `CriarGrupoV2.tsx` |
| **P0** | Mover a escolha do limite para dentro do passo de itens, por permissão, com "um limite para o grupo" como padrão e "limite por item" como refinamento | BP2, BP4 | `ConfiguracaoGrupo.tsx` |
| **P0** | Frase-resumo por permissão, ao vivo, no painel lateral e na barra mobile | BP3 | `ConfiguracaoGrupo.tsx`, `ResumoPermissao.tsx` |
| **P1** | Presets de grupo na entrada do fluxo (Patrocinador, Equipe de venda, Bilheteria, do zero) | BP1 | `PermissoesSelector.tsx`, `equipe-v2-store.tsx` |
| **P1** | Totais por coluna e contagem por sessão dentro da tabela | BP4 | `ConfiguracaoGrupo.tsx` |
| **P1** | Alinhar a gramática com o Totem: contagem por sessão, agrupamento por grupo de ingresso, resumo lateral permanente | BP9 | `ConfiguracaoGrupo.tsx` |
| **P1** | Erros ancorados na célula/coluna, com "ir para o primeiro pendente" | BP6 | `ConfiguracaoGrupo.tsx` |
| **P2** | Duplicar grupo na lista e no detalhe | BP7 | `EquipeDeOperacaoV2.tsx`, `DetalheGrupoV2.tsx` |
| **P2** | Bloco "o que o operador vai ver" na revisão | BP8 | `ResumoPermissao.tsx` |
| **P2** | Passada de copy completa com o glossário da BP5 | BP5 | todos |

---

### 5.1 O que já foi aplicado (agosto/2026)

| Mudança | Onde |
|---|---|
| ✅ **P0** — a tela 1 virou só "o que este grupo pode fazer"; a escolha de como contar o limite saiu de lá | [`PermissoesSelector.tsx`](components/PermissoesSelector.tsx) |
| ✅ **P0** — a escolha do limite (grupo × por item) passou para o painel de limites, ao lado da tabela que ela transforma | [`ConfiguracaoGrupo.tsx`](components/ConfiguracaoGrupo.tsx) |
| ✅ **P0** — frase-resumo ao vivo por permissão ("Até 50 cortesias no total, em 6 itens de 2 sessões"), no painel, na barra do mobile e na revisão | `frasePermissao()` em [`equipe-v2-store.tsx`](data/equipe-v2-store.tsx) |
| ✅ **P1** — cada coluna da tabela declara o que coleta ("marque os itens" × "quantidade por item") | [`ConfiguracaoGrupo.tsx`](components/ConfiguracaoGrupo.tsx) |
| ✅ Vocabulário: "cota" → "limite" nos rótulos, mensagens de erro e resumo | todos |
| ✅ Correção: `<label>` aninhado dentro de `Checkbox`/`RadioButton` (que já são `<label>`) fazia o clique em cima do controle alternar duas vezes | `PermissoesSelector.tsx`, `ConfiguracaoGrupo.tsx` |
| ✅ Modo foco (`focusMode`) no fluxo de criar/editar: abaixo de `xl` a página ocupa a tela inteira, sem os rails do Backstage — é o que permite testar em tablet antes do totem | [`Backstage.tsx`](../components/Backstage.tsx) |
| ✅ Atalho e ilustração do totem na lista de grupos | [`TotemIllustration.tsx`](../components/TotemIllustration.tsx), [`EquipeDeOperacaoV2.tsx`](pages/EquipeDeOperacaoV2.tsx) |

Pendentes: presets de grupo (BP1), erros ancorados na célula (BP6), duplicar grupo (BP7),
bloco "o que o operador vai ver" (BP8) e o alinhamento completo com a gramática do Totem (BP9).

---

## 6. Como validar a melhoria

Tarefa de teste (5 produtores, moderado, 20 min):

1. *"Um patrocinador vai dar 30 cortesias de Pista. Configure isso."* — sucesso sem
   ajuda; medir tempo até a primeira ação correta.
2. *"Agora a bilheteria do local pode vender 100 Pista e 20 Camarote."* — mede se a
   passagem para limite por item é descoberta sozinha.
3. *"Sem salvar, me diga o que esse grupo vai poder fazer."* — mede a BP3/BP8: o
   usuário consegue ler a configuração de volta?

Métrica de saída: taxa de acerto na tarefa 2 (é onde o modelo atual quebra) e número de
idas e voltas entre passos.

---

## 7. Fontes

**Produtos**
- [Square — Create and edit permission sets](https://squareup.com/help/us/en/article/5822-employee-permissions)
- [Square — Advanced Access / custom permission sets](https://squareup.com/us/en/staff/advanced-access)
- [Shopify — Give staff permissions with POS roles](https://help.shopify.com/en/manual/sell-in-person/shopify-pos/staff-management/pos-roles)
- [Shopify — Understanding POS staff management](https://help.shopify.com/en/manual/sell-in-person/shopify-pos/staff-management/understanding-pos-staff-management)
- [Shopify — Point of Sale permissions](https://help.shopify.com/en/manual/your-account/users/roles/permissions/pos-permissions)
- [Eventbrite — Manage roles and permissions](https://www.eventbrite.com/help/en-us/articles/509534/how-to-manage-roles-and-permissions/)
- [Eventbrite — Permissions glossary](https://www.eventbrite.com/help/en-us/articles/362073/permissions-definitions/)
- [Spektrix — Introduction to selling tickets through agents](https://support.spektrix.com/hc/en-us/articles/14251606731549-Introduction-to-Selling-Tickets-through-Agents)
- [Spektrix — Guide for ticket agents](https://integrate.spektrix.com/docs/agentguide)
- [Totem Ingresse — seleção de ingressos (Figma, node 4-21017)](https://www.figma.com/design/L8xe7v1efjyJaQYsdUFuht/Totem?node-id=4-21017)

**Padrões RBAC**
- [Frontegg — Access control matrix: components & best practices](https://frontegg.com/blog/access-control-matrix)
- [Oso — 10 RBAC best practices](https://www.osohq.com/learn/rbac-best-practices)
- [Budibase — Role-based access control guide](https://budibase.com/blog/app-building/role-based-access-control/)

**Bibliografia**
- Reeder, Bauer, Cranor, Reiter, Bacon, How, Strong — *Expandable Grids for Visualizing and Authoring Computer Security Policies*, CHI 2008 — [PDF](https://users.ece.cmu.edu/~lbauer/papers/2008/chi08-grids.pdf) · [ACM](https://dl.acm.org/doi/10.1145/1357054.1357285)
- Karat, Karat, Brodie, Feng — *Evaluating interfaces for privacy policy rule authoring* (SPARCLE), CHI 2006
- [NN/g — Progressive Disclosure](https://www.nngroup.com/videos/progressive-disclosure/)
- [NN/g — 4 Principles to Reduce Cognitive Load in Forms](https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/)
- [NN/g — 10 Usability Heuristics for User Interface Design](https://www.nngroup.com/articles/ten-usability-heuristics/)
- GOV.UK Service Manual — *Structuring forms: one thing per page*
- Wroblewski, L. — *Web Form Design: Filling in the Blanks* (Rosenfeld, 2008)
- Cooper, Reimann, Cronin — *About Face: The Essentials of Interaction Design* (4ª ed.)
- Krug, S. — *Don't Make Me Think, Revisited* (3ª ed.)
