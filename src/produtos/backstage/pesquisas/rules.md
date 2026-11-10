# Pesquisas (Perguntas por ingresso): regras

> **Rotas:** `/backstage/pesquisas`, `/backstage/pesquisas/:perguntaId/vinculos`
> **No menu:** sem item de menu (órfã). A página marca a seção `pesquisas` ("Coleta de dados") do evento, mas o menu desktop padrão não tem essa seção, e no menu da Equipe de operação v3 "Coleta de dados" fica desabilitado. Só abre pela URL.
> **Versão em uso:** única (`pesquisas/`)
> **Revisado em:** 2026-11-07

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

Perguntas que o comprador responde na compra, por ingresso do evento. O produtor cria perguntas,
define a ordem do formulário, liga e desliga cada uma e escolhe em quais ingressos ela aparece.
Opções de resposta podem ter limite de respostas.

## Dados

| Dado | De onde vem | Grava? |
| --- | --- | --- |
| Perguntas | `data/pesquisas-store.tsx` (começa vazio) | só em memória |
| Ingressos vinculáveis | `data/pesquisas-store.tsx` (10 ingressos mock, 2 datas) | não |
| Vínculos pergunta › ingresso | `data/pesquisas-store.tsx` (começa vazio) | só em memória |
| Respostas e consumo por opção | número mock estável por id, só quando a pergunta tem vínculo | não |
| Perguntas parecidas | `utils/similaridade.ts` (modelo de embeddings baixado do Hugging Face no navegador) | não |

O provider fica em `app/App.tsx`: os dados sobrevivem à navegação, mas não ao recarregar. Não lê
`@/plataforma`; os ingressos não são os do evento em contexto.

## Regras

### Comportamento
- **PSQ-01** A página "Perguntas por ingresso" lista as perguntas na ordem do formulário do comprador. _(pages/Pesquisas.tsx)_
- **PSQ-02** A ordem muda arrastando pela alça à esquerda da linha. _(pages/Pesquisas.tsx, data/pesquisas-store.tsx)_
- **PSQ-03** Cada linha mostra toggle, título, tipo e vínculo: "Sem itens vinculados", "Vinculado a N itens" ou "Vinculado a todos os itens". _(pages/Pesquisas.tsx)_
- **PSQ-04** Desligar a pergunta deixa a linha esmaecida e mostra "Pergunta desativada. Ela não aparece mais na compra dos itens vinculados."; ligar mostra "Pergunta ativada…". _(pages/Pesquisas.tsx)_
- **PSQ-05** Opções esgotadas e perto do limite (80% ou mais) aparecem como badges na linha. _(pages/Pesquisas.tsx, data/pesquisas-store.tsx)_
- **PSQ-06** Tipos: Texto curto, Texto longo, Número, Data, Hora, Data e hora, Telefone, Seleção única, Seleção múltipla, Dropdown, Upload de arquivo. Só Seleção única, Seleção múltipla e Dropdown têm opções. _(data/pesquisas-store.tsx)_
- **PSQ-07** Ao escolher um tipo com opções, o editor já cria duas opções vazias. _(components/PerguntaEditorModal.tsx)_
- **PSQ-08** Cada opção tem "Limite de respostas"; vazio significa ilimitado e o campo só aceita dígitos. _(components/PerguntaEditorModal.tsx)_
- **PSQ-09** Pergunta nova nasce ativa e obrigatória; toast "Pergunta criada" e um convite "Pergunta criada!" com "Agora não" ou "Vincular itens". _(components/PerguntaEditorModal.tsx, pages/Pesquisas.tsx)_
- **PSQ-10** Ao digitar o título (4+ caracteres), o editor procura perguntas parecidas e avisa "Você já tem uma pergunta chamada “…” cadastrada. Deseja continuar assim mesmo?" sem bloquear. Na edição, só procura se o título mudar. _(components/PerguntaEditorModal.tsx, utils/similaridade.ts)_
- **PSQ-11** Pergunta com respostas (em uso): não pode ser excluída nem mudar de tipo; o editor avisa e mostra quantas vezes cada opção já foi escolhida, com barra de consumo. _(components/PerguntaEditorModal.tsx)_
- **PSQ-12** Mudar o limite de uma pergunta em uso pede confirmação: "Alterar limite de respostas?". _(components/PerguntaEditorModal.tsx)_
- **PSQ-13** Excluir pede confirmação ("Excluir pergunta?") e desvincula a pergunta de todos os itens. _(pages/Pesquisas.tsx, data/pesquisas-store.tsx)_
- **PSQ-14** "Editar vínculos" abre a tela de vínculos da pergunta, com ingressos agrupados por data › grupo, em acordeões abertos. _(pages/VinculosPergunta.tsx)_
- **PSQ-15** Na tela de vínculos, a busca filtra por nome do ingresso ou do grupo e abre todos os acordeões. _(pages/VinculosPergunta.tsx)_
- **PSQ-16** Marcar o grupo marca todos os ingressos dele; o resumo lateral (desktop) lista os selecionados com "Remover" e "Remover todos". _(pages/VinculosPergunta.tsx)_
- **PSQ-17** "Salvar vínculos" grava e volta para a lista, com o toast "Vínculos atualizados"; sem nenhum item, avisa que a pergunta não será exibida em nenhum item. _(pages/VinculosPergunta.tsx)_
- **PSQ-18** Vínculo novo herda a obrigatoriedade da pergunta; mudar a obrigatoriedade da pergunta vale para todos os vínculos. _(data/pesquisas-store.tsx)_

### Validações
- **PSQ-20** Título obrigatório; tipo com opções exige ao menos 2 opções preenchidas. Sem isso, salvar fica desabilitado. _(components/PerguntaEditorModal.tsx)_
- **PSQ-21** Título igual a outra pergunta (sem diferenciar maiúsculas) bloqueia: "Já existe uma pergunta com este título. Por favor, escolha um título diferente." _(components/PerguntaEditorModal.tsx)_
- **PSQ-22** Não dá para remover opção quando só restam 2. _(components/PerguntaEditorModal.tsx)_
- **PSQ-23** Em uso, o limite não pode ficar abaixo do já consumido: "O limite deve ser N ou maior. Esta opção já foi selecionada N vezes." _(components/PerguntaEditorModal.tsx)_
- **PSQ-24** Excluir fica desabilitado em pergunta com respostas, com a dica "Tem respostas — não dá para excluir". _(pages/Pesquisas.tsx)_

### Estados
- **PSQ-30** Sem perguntas: "Conheça melhor quem está comprando" com "Criar pergunta". _(pages/Pesquisas.tsx)_
- **PSQ-31** Sem ingressos no evento: "Nenhum ingresso no evento" com "Cadastrar ingressos". _(pages/Pesquisas.tsx)_
- **PSQ-32** Procurando parecidas: "Procurando perguntas parecidas…" _(components/PerguntaEditorModal.tsx)_
- **PSQ-33** Opção no limite: "Limite atingido"; perto: "Selecionada N vezes · perto do limite". _(components/PerguntaEditorModal.tsx)_
- **PSQ-34** Vínculos: busca sem resultado mostra "Nenhum item corresponde à busca."; resumo vazio mostra "Sem itens vinculados a essa pergunta". _(pages/VinculosPergunta.tsx)_

## Depende de / afeta

- **Depende de:** nada da plataforma; ingressos são mock próprio.
- **Afeta:** nada fora da feature. Perguntas e vínculos não chegam ao checkout, ao formulário de compra nem às carteiras.

## Em aberto

- O toggle "Resposta obrigatória" por item na tela de vínculos não é gravado: salvar usa a obrigatoriedade da pergunta.
- O banco começa vazio e não há como carregar o mock (`restaurarBanco`, `esvaziarBanco` e `SimuladorEstados` não são usados).
- Estado "Nenhum ingresso no evento" não acontece (ingressos fixos); "Cadastrar ingressos" só mostra um toast.
- Produtos mock existem no store, mas não entram nos itens vinculáveis.
- O editor prevê várias perguntas de uma vez, mas não há botão para adicionar outra.
- Não há campo para "texto de apoio" (`ajuda`) nem para obrigatoriedade no editor.
- `AssociacaoSlideout`, `VincularEmLoteSlideout` e `FormularioPreviewModal` não são usados por nenhuma tela (título do formulário, ordem por ingresso, vínculo em lote e prévia ficam inacessíveis).
- O aviso de pergunta parecida baixa um modelo externo no navegador; sem internet, o aviso não aparece.
- Duas features para o mesmo assunto: Perguntas (`/backstage/perguntas`) e esta. Falta decidir qual vale.
- Vínculos com `perguntaId` inexistente mostram o título genérico "Pergunta", sem estado de erro.

## Fontes

Nenhum link de Figma, Confluence ou Jira no código desta pasta.
