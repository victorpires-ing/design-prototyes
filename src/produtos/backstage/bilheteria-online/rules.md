# Bilheteria online (pasta vazia): regras

> **Rotas:** nenhuma
> **No menu:** nenhum. O item "Bilheteria online" do menu do evento abre `/backstage/bilheteria`, da pasta `bilheteria`.
> **Versão em uso:** a feature mora em `src/produtos/backstage/bilheteria`
> **Revisado em:** 2026-11-07

Este arquivo é a fonte da verdade do comportamento da feature. Mudou uma regra no código, mude
aqui no mesmo commit. Achou divergência entre código e este arquivo, registre em **Em aberto**
em vez de escolher um lado em silêncio.

## O que é

Pasta sem código: só existe o diretório `utils/`, vazio. Nenhuma rota, import ou menu aponta
para ela. As regras da Bilheteria online estão em
[`../bilheteria/rules.md`](../bilheteria/rules.md).

## Dados

Nenhum.

## Regras

Nenhuma. Não há comportamento implementado nesta pasta.

## Depende de / afeta

- **Depende de:** nada.
- **Afeta:** nada.

## Em aberto

- Decidir se a pasta é removida ou se a feature `bilheteria` passa a morar aqui, já que o menu chama a tela de "Bilheteria online".

## Fontes

Nenhuma.
