# Tela de Despesa

## Objetivo
Documentar o comportamento atual do front-end da tela de despesa e os contratos realmente consumidos.

Arquivo principal:
- `app/(principal)/financeiro/despesas.tsx`

## Rota do front
- `/financeiro/despesas`

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
- `competencia` (`yyyy-MM`)
- `VerificarUltimaRecorrencia` (true)

Comportamento:
- a tela so consulta quando o usuario aciona `Consultar`
- `competencia` e a fonte de verdade para cadastro, edicao e listagem
- quando `competencia` nao for informada, a API assume a competencia atual
- a navegacao de competencia altera a competencia consultada
- alem da consulta na API, existe filtro local adicional na lista

## Regras de status para acoes
- `Editar`: apenas `pendente`
- `Efetivar`: apenas `pendente`
- `Cancelar`: apenas `pendente`
- `Estornar`: apenas `efetivada`
- `Aceitar`: apenas `pendenteAprovacao`
- `Rejeitar`: apenas `pendenteAprovacao`

## Confirmacao de acoes criticas
- Cancelamento de despesa abre modal de confirmacao antes de enviar `POST /api/financeiro/despesas/{id}/cancelar`.
- Modal de cancelamento segue padrao destrutivo:
  - titulo de confirmacao
  - mensagem contextual de cancelamento
  - alerta de impacto irreversivel
  - botoes `Cancelar` e `Confirmar`
- Se o usuario cancelar, nenhuma chamada de cancelamento e executada.

## Regras de validacao no front
- campos obrigatorios: descricao, datas, tipo de despesa, tipo de pagamento e valor total
- data de efetivacao nao pode ser menor que a data de lancamento
- `pix` e `transferencia` exigem `contaBancariaId`
- `contaDestinoId` e opcional
- `contaDestinoId` so e exibido e so pode ser enviado quando `tipoPagamento = transferencia` ou `tipoPagamento = pix`
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
- `contaDestinoId` (opcional, somente quando `tipoPagamento = transferencia` ou `tipoPagamento = pix`)
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
- `contaDestinoId` nao participa do payload de estorno

## Regra de transferencia (cadastro e edicao)
- no cadastro e na edicao, `contaDestinoId` e opcional
- no cadastro e na edicao, `contaDestinoId` so e incluido no payload quando `tipoPagamento = transferencia` ou `tipoPagamento = pix`

## Regras de rateio no front
- rateio por amigos e por area/subarea deve fechar exatamente com os totais informados
- ids de amigos, areas e subareas precisam existir nas opcoes carregadas

## Fora do escopo atual da tela
- exclusao fisica de despesa
- filtro sem acionar o botao `Consultar`

## Fonte no front (confirmacao critica)
- `app/(principal)/financeiro/despesas.tsx`
- `src/componentes/comuns/ModalConfirmacao/index.tsx`

