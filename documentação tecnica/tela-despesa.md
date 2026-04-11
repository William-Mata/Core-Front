# Tela de Despesa

## Objetivo
Documentar o comportamento atual do front-end da tela de despesa e os contratos realmente consumidos.

Arquivo principal:
- `app/principal/financeiro/despesa.tsx`

## Rota do front
- `/principal/financeiro/despesa`

## Modos da tela
- `lista`
- `novo`
- `edicao`
- `visualizacao`
- `efetivacao`
- `estorno`

## Endpoints consumidos pelo front
- `GET /api/financeiro/despesas`
- `GET /api/financeiro/despesas/{id}`
- `POST /api/financeiro/despesas`
- `PUT /api/financeiro/despesas/{id}`
- `POST /api/financeiro/despesas/{id}/efetivar`
- `POST /api/financeiro/despesas/{id}/cancelar`
- `POST /api/financeiro/despesas/{id}/estornar`
- `POST /api/financeiro/despesas/{id}/aprovar`
- `POST /api/financeiro/despesas/{id}/rejeitar`

Dependencias de apoio:
- `GET /api/financeiro/amigos`
- `GET /api/financeiro/areas-subareas` (com fallback para `/api/areas-subareas`)
- `GET /api/financeiro/contas-bancarias`
- `GET /api/financeiro/cartoes`

## Filtros e competencia
Filtros enviados na consulta:
- `id`
- `descricao`
- `dataInicio`
- `dataFim`
- `competencia` (`YYYY-MM`)
- `VerificarUltimaRecorrencia` (true)

Comportamento:
- a tela so consulta quando o usuario aciona `Consultar`
- a navegacao de competencia altera o periodo consultado
- alem da consulta na API, existe filtro local adicional na lista

## Regras de status para acoes
- `Editar`: apenas `pendente`
- `Efetivar`: apenas `pendente`
- `Cancelar`: apenas `pendente`
- `Estornar`: apenas `efetivada`
- `Aceitar`: apenas `pendenteAprovacao`
- `Rejeitar`: apenas `pendenteAprovacao`

## Regras de validacao no front
- campos obrigatorios: descricao, datas, tipo de despesa, tipo de pagamento e valor total
- data de efetivacao nao pode ser menor que a data de lancamento
- `pix` e `transferencia` exigem `contaBancariaId`
- `cartaoCredito` e `cartaoDebito` exigem `cartaoId`
- conta e cartao nao podem ser informados ao mesmo tempo
- recorrencia normal exige quantidade (limite maximo de 100)
- para pagamento com cartao, recorrencia vira mensal com quantidade de parcelas

## Recorrencia (edicao e cancelamento)
Quando a despesa e recorrente, o front envia `escopoRecorrencia`:
- `1`: apenas esta
- `2`: esta e proximas
- `3`: todas pendentes

Aplicacao:
- `PUT /despesas/{id}` (edicao)
- `POST /despesas/{id}/cancelar` (cancelamento)

## Efetivacao
O front usa `POST /despesas/{id}/efetivar` com:
- `dataEfetivacao`
- `observacaoHistorico` (opcional)
- `tipoPagamento`
- valores monetarios
- `contaBancariaId` / `cartaoId`
- `documentos`

Regras de fluxo:
- apenas despesa com status `pendente`
- `dataEfetivacao` nao pode ser menor que `dataLancamento`

## Estorno
O front usa `POST /despesas/{id}/estornar` com:
- `dataEstorno` (obrigatorio)
- `observacaoHistorico` (opcional)
- `ocultarDoHistorico` (opcional, padrao `true`)

Regras de fluxo:
- apenas despesa com status `efetivada`
- `dataEstorno` nao pode ser menor que `dataLancamento`
- quando existir `dataEfetivacao`, `dataEstorno` nao pode ser menor que `dataEfetivacao`

## Regras de rateio no front
- rateio por amigos e por area/subarea deve fechar exatamente com os totais informados
- ids de amigos, areas e subareas precisam existir nas opcoes carregadas

## Fora do escopo atual da tela
- exclusao fisica de despesa
- filtro sem acionar o botao `Consultar`
