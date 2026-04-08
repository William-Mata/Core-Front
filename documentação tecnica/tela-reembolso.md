# Tela de Reembolso

## Objetivo
Documentar o comportamento atual do front-end da tela de reembolso e os contratos realmente consumidos.

Arquivo principal:
- `app/principal/financeiro/reembolso.tsx`

## Rota do front
- `/principal/financeiro/reembolso`

## Modos da tela
- `lista`
- `novo`
- `edicao`
- `visualizacao`
- `efetivacao`

## Endpoints consumidos pelo front
- `GET /api/financeiro/reembolsos`
- `GET /api/financeiro/reembolsos/{id}`
- `POST /api/financeiro/reembolsos`
- `PUT /api/financeiro/reembolsos/{id}`

Dependencias de apoio:
- `GET /api/financeiro/despesas`
- `GET /api/financeiro/contas-bancarias`
- `GET /api/financeiro/cartoes`

## Filtros e competencia
Filtros enviados na consulta:
- `id`
- `descricao`
- `dataInicio`
- `dataFim`
- `competencia` (`YYYY-MM`)

Comportamento:
- a tela so consulta quando o usuario aciona `Consultar`
- a navegacao de competencia altera o periodo consultado
- alem da consulta na API, existe filtro local adicional na lista

## Regras de status para acoes
- `Editar`: apenas `pendente`
- `Efetivar`: apenas `pendente`
- `Cancelar`: apenas `pendente`
- `Estornar`: apenas `efetivada`
- `Visualizar`: qualquer status

## Regras de validacao no front
- descricao obrigatoria
- precisa ter pelo menos uma despesa vinculada
- uma despesa nao pode estar vinculada a mais de um reembolso
- data de efetivacao nao pode ser anterior a data de lancamento
- `pix`, `transferencia` e `contaCorrente` exigem `contaBancariaId`
- `cartaoCredito` e `cartaoDebito` exigem `cartaoId`

## Efetivacao, estorno e cancelamento no estado atual
No front atual, essas operacoes sao feitas com `PUT /reembolsos/{id}`:

- efetivar:
  - `status = efetivada`
  - `dataEfetivacao`
  - `valorEfetivacao` (calculado pela soma das despesas vinculadas)
- estornar:
  - `status = pendente`
  - `dataEfetivacao = null`
  - `valorEfetivacao = null`
- cancelar:
  - `status = cancelada`
  - mantem os demais dados e limpa efetivacao

## Campos relevantes do payload no front
- `descricao`
- `solicitante`
- `dataLancamento`
- `despesasVinculadas` (array de ids)
- `valorTotal` (calculado no front)
- `documentos`
- `status`
- `contaBancariaId`
- `cartaoId`

## Fora do escopo atual da tela
- endpoint dedicado de `efetivar` para reembolso
- endpoint dedicado de `estornar` para reembolso
- exclusao de reembolso pela interface (o front nao usa `DELETE`)
