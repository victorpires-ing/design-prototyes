# Membros: regras

> **Rotas:** `/backstage/membros`, `/backstage/membros/criar-cargo`, `/backstage/membros/cargos/:id/editar`
> **No menu:** Backstage › barra da organização › Membros (rail lateral e barra do topo apontam para `/backstage/membros`). Até 12/11/2026 era "Membros e Comissários", com abas (BKS-34); Comissários virou relatório (COM-110).
> **Versão em uso:** esta pasta (`membros`, rota `/backstage/membros`). `membros-v2` e `equipe-e-permissoes` são explorações fora do menu.
> **Revisado em:** 2026-11-07

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

Área da organização para gerenciar quem acessa o Backstage. O admin adiciona membros por e-mail,
dá a eles cargos (o que podem fazer) e grupos (em quais eventos), e cria cargos próprios numa
matriz de permissões.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Membros, grupos, cargos customizados | `../components/membros-store.ts` (mock local, compartilhado com Cortesias e com a Equipe de operação, que usa os grupos como origem de operadores) | só em memória |
| Cargos padrão (7) | `CARGOS` em `../components/membros-store.ts` | não |
| Eventos dos selects (6) | `EVENTOS` em `../components/membros-store.ts` (mock) | não |
| Catálogo de permissões dos cargos | `data/permissoes-catalogo.ts` ("lista de 06/10/2026") | não |

Nada vem de `@/plataforma`. Eventos são uma lista fixa local, não os eventos da organização.

## Regras

### Comportamento
- **MEM-01** A tela tem três abas: Membros, Grupos e Cargos, cada uma com a contagem total no rótulo. _(pages/Membros.tsx)_
- **MEM-02** O botão do topo muda com a aba: "Adicionar membro", "Novo grupo" ou "Novo cargo". _(pages/Membros.tsx)_
- **MEM-03** Trocar de aba limpa a busca e as seleções. _(pages/Membros.tsx)_
- **MEM-04** Busca: Membros por e-mail; Grupos por nome do grupo ou nome de evento; Cargos por nome. _(pages/Membros.tsx)_
- **MEM-05** Aba Membros mostra e-mail, cargos (badges), nº de grupos e nº de eventos; o lápis abre "Editar membro". _(pages/Membros.tsx)_
- **MEM-06** Aba Grupos mostra nome, nº de usuários e nº de eventos; grupos não têm ação de editar. _(pages/Membros.tsx)_
- **MEM-07** Aba Cargos mostra nome e informações: resumo de níveis (cargo com `permissions`), ou descrição e "N permissões" (cargo com `acoes`). Cargo "Parceiro" leva badge "Por feature". _(pages/Membros.tsx)_
- **MEM-08** "Remover (N)" aparece só nas abas Membros e Grupos e fica desabilitado sem seleção. _(pages/Membros.tsx)_
- **MEM-09** Remover membros apaga os membros e tira os ids deles dos grupos. Toast: "Membro removido" ou "N membros removidos". _(pages/Membros.tsx, ../components/membros-store.ts)_
- **MEM-10** Excluir grupos apaga os grupos e tira o vínculo dos membros. Toast: "Grupo excluído" ou "N grupos excluídos". _(pages/Membros.tsx, ../components/membros-store.ts)_
- **MEM-11** Excluir cargo pede confirmação com quantos membros perdem as permissões; ao confirmar, o cargo sai dos membros. Toast: `Cargo "X" excluído`. _(pages/Membros.tsx, ../components/membros-store.ts)_
- **MEM-12** Adicionar membro aceita vários e-mails: Enter, vírgula, colar lista ou sair do campo transformam o texto em chips; Backspace no campo vazio apaga o último chip. _(../components/CriarMembroModal.tsx)_
- **MEM-13** Cada e-mail adicionado vira um membro com os mesmos cargos e grupos escolhidos, e entra nos grupos escolhidos. _(../components/CriarMembroModal.tsx, ../components/membros-store.ts)_
- **MEM-14** Editar membro mostra o e-mail só para leitura e troca apenas cargos e grupos; a troca se reflete nos grupos. Toast: `Membro "X" atualizado`. _(../components/CriarMembroModal.tsx)_
- **MEM-15** Criar grupo: nome, eventos e membros (opcional). Toast: `Grupo "X" criado`. _(../components/CriarGrupoModal.tsx)_
- **MEM-16** Criar/editar cargo é uma tela com nome, descrição e uma tabela por seção do catálogo (Organização, Configurações do evento, Equipe de operação, Ingressos e produtos, Emissão de ingressos, Relatórios, Marketing, Coleta de dados, Finanças). _(pages/CriarCargo.tsx, data/permissoes-catalogo.ts)_
- **MEM-17** As colunas padrão são Visualizar, Editar, Criar, Excluir; Emissão usa Visualizar, Editar, Emitir, Cancelar; Relatórios usa Visualizar, Exportar; Finanças usa Visualizar, Solicitar, Cancelar. Célula sem a ação fica desabilitada. _(data/permissoes-catalogo.ts, pages/CriarCargo.tsx)_
- **MEM-18** Marcar Editar, Criar, Excluir (ou uma linha de ação) marca também o Visualizar exigido. Desmarcar o Visualizar desmarca o que depende dele. _(data/permissoes-catalogo.ts)_
- **MEM-19** Checkbox de seção e de coluna marcam ou desmarcam o conjunto; ficam parciais quando só parte está marcada. Linha pai agrega os sub-itens recuados. _(pages/CriarCargo.tsx)_
- **MEM-20** Passar o mouse num checkbox pré-visualiza (meia opacidade) o que seria marcado junto. _(pages/CriarCargo.tsx)_
- **MEM-21** O rodapé fixo conta "N permissões selecionadas". _(pages/CriarCargo.tsx)_
- **MEM-22** "Criar cargo" / "Salvar alterações" abre um resumo antes de gravar. Na criação lista o que o cargo pode fazer por seção e as seções "Sem acesso"; na edição mostra só "Passa a poder" e "Deixa de poder", com quantos membros têm o cargo. _(components/resumo-cargo-modal.tsx)_
- **MEM-23** Confirmar no resumo grava o cargo, mostra toast `Cargo "X" criado` ou `"X" atualizado` e volta para `/backstage/membros`. "Voltar e ajustar" fecha o resumo. _(pages/CriarCargo.tsx, components/resumo-cargo-modal.tsx)_

### Validações
- **MEM-30** E-mail precisa casar com `nome@dominio.ext`; inválidos são descartados sem aviso. E-mails são gravados em minúsculas e sem repetição. _(../components/CriarMembroModal.tsx)_
- **MEM-31** Máximo de 30 e-mails por vez; o contador "N/30" fica vermelho ao chegar no limite e o excedente é ignorado. _(../components/CriarMembroModal.tsx)_
- **MEM-32** Salvar membro exige ao menos um e-mail (na criação), um cargo e um grupo; senão o botão fica desabilitado. _(../components/CriarMembroModal.tsx)_
- **MEM-33** Criar grupo exige nome e ao menos um evento; membros são opcionais. _(../components/CriarGrupoModal.tsx)_
- **MEM-34** Cargo exige nome e descrição: o botão fica desabilitado sem eles, e o toast diz "Informe o nome do cargo" ou "Informe a descrição do cargo". _(pages/CriarCargo.tsx)_
- **MEM-35** Cargo pode ser salvo sem nenhuma permissão; o resumo avisa "Este cargo está sem permissões" (ou "vai ficar sem permissões" na edição). _(components/resumo-cargo-modal.tsx)_

### Estados
- **MEM-40** Inicial: 1 membro (`admin@ingresse.com`, Administrador), 1 grupo ("Todos os eventos", padrão) e 8 cargos padrão. _(../components/membros-store.ts)_
- **MEM-41** Busca sem resultado: "Nenhum resultado" com "Não encontramos membros/grupos/cargos para essa busca." _(pages/Membros.tsx)_
- **MEM-42** Recarregar a página volta ao estado inicial (store em memória). _(../components/membros-store.ts)_
- **MEM-43** Editar cargo inexistente ou padrão pela URL redireciona para `/backstage/membros`. _(pages/CriarCargo.tsx)_
- **MEM-44** Resumo de edição sem mudanças: "Nenhuma permissão foi alterada". _(components/resumo-cargo-modal.tsx)_

### Permissões
- **MEM-60** Um membro pode ter vários cargos e vários grupos. Cargo define o que faz; grupo define em quais eventos. _(../components/membros-store.ts, ../components/CriarMembroModal.tsx)_
- **MEM-61** Cargos padrão: Administrador, Editor de eventos, Financeiro, Financeiro (conta padrão), Marketing, Visualizador, Parceiro e Comissário (aplicado às pessoas dos grupos-comissário de Equipe e Comissários, ECO-24). Não podem ser editados nem excluídos (ícone de cadeado com tooltip "Cargo padrão"). _(../components/membros-store.ts, pages/Membros.tsx)_
- **MEM-62** Cargo "Parceiro" não tem permissão explícita; os limites são configurados por feature (ex.: Cortesias). _(../components/membros-store.ts)_
- **MEM-63** Cargos criados pela organização guardam ações no formato `recurso:acao` (ex.: `events.courtesies:emit`). _(pages/CriarCargo.tsx, data/permissoes-catalogo.ts)_
- **MEM-64** O grupo padrão "Todos os eventos" cobre todos os eventos, tem badge "Padrão" e não pode ser selecionado para exclusão. _(pages/Membros.tsx, ../components/membros-store.ts)_
- **MEM-65** A seção "Equipe de operação" do catálogo controla Operadores, Grupos de cota, Ativar grupos de cota, Emissões e Emissores (ativar, validar). _(data/permissoes-catalogo.ts)_
- **MEM-66** Finanças separa "Repasses para qualquer conta" de "Repasses para a conta padrão"; não há Editar em finanças. _(data/permissoes-catalogo.ts)_

## Depende de / afeta

- **Depende de:** lista de eventos mock (`EVENTOS`) do store compartilhado.
- **Afeta:** Cortesias › Grupos parceiros (`../cortesias/pages/GruposParceiros.tsx`) lê e grava no mesmo store: cria membros com cargo "Parceiro" e grupos sem eventos, que aparecem aqui. `membros-v2` reaproveita `EVENTOS`.

## Em aberto

- Nenhum dado de membro/evento vem da plataforma; tudo é mock em memória.
- Coluna "Eventos" do membro é um número fixo (`eventosCount`): novos membros sempre mostram "0 eventos", mesmo com grupo. Não é calculado dos grupos.
- Grupos não podem ser editados (sem ação na aba Grupos); só criados e excluídos.
- Criar grupo não checa nome repetido nem oferece "Todos os eventos".
- Adicionar membro não avisa e-mail inválido descartado nem e-mail que já é membro (cria duplicado). O texto "Use e-mail cadastrado na Ingresse" não é verificado.
- Ícone de link externo ao lado do e-mail não faz nada.
- Dois modelos de cargo convivem: `permissions` (níveis Visualizador/Editor/Admin por feature, via `components/criar-cargo-modal.tsx` + `permission-accordion.tsx`) e `acoes` (matriz da tela Criar cargo). O modal antigo não é usado por nenhuma tela. Decidir qual fica e apagar o outro.
- `FEATURES` do store (usado pelo modal antigo) não bate com `CATALOGO_PERMISSOES` da matriz.
- Cargos padrão só têm descrição, sem `acoes`: não dá para ver na matriz o que eles concedem.
- Versões divergem: aqui há cargo + grupo separados; `membros-v2` remove cargo e configura acesso por pessoa dentro do grupo (níveis Sem acesso/Ver/Gerenciar); `equipe-e-permissoes` é por evento, com módulos e cotas. Time precisa escolher o modelo.

## Fontes

Nenhum link de Figma, Confluence ou Jira no código desta feature. O catálogo cita "lista de 06/10/2026" sem link _(data/permissoes-catalogo.ts)_.
