# Tela de Cartao

## Objetivo
Documentar o contrato atual da tela de cartao e regras aplicadas no front para integracao com API.

## Rota do front
- `/principal/financeiro/cartao`

## Modos da tela
- `lista`
- `novo`
- `edicao`
- `visualizacao`

## Endpoints consumidos
Cadastro/listagem:
- `GET /api/financeiro/cartoes`
- `GET /api/financeiro/cartoes/{id}`
- `POST /api/financeiro/cartoes`
- `PUT /api/financeiro/cartoes/{id}`
- `POST /api/financeiro/cartoes/{id}/inativar`
- `POST /api/financeiro/cartoes/{id}/ativar`

Detalhe mensal:
- `GET /api/financeiro/cartoes/{id}/lancamentos?competencia=YYYY-MM` (debito)
- `GET /api/financeiro/faturas-cartao/detalhes?competencia=YYYY-MM` (credito)
- `POST /api/financeiro/faturas-cartao/{faturaCartaoId}/efetivar`
- `POST /api/financeiro/faturas-cartao/{faturaCartaoId}/estornar`

## Regras por tipo
Credito:
- exige `limite`, `diaVencimento`, `dataVencimentoCartao`.
- detalhe abre como fatura.

Debito:
- nao exige campos de vencimento.
- detalhe abre como extrato.

## Filtros da listagem
- `id`, `descricao`, `dataInicio`, `dataFim`.

Regras:
- consulta de lista usa API com filtros de `id` e `descricao`.
- front aplica filtro local complementar por periodo.
- data base do filtro local: `dataVencimentoCartao` (quando houver), senao primeira data de log.

## Regras de validacao
- obrigatorios: `descricao`, `bandeira`, `tipo`.
- no modo `novo`, `saldoDisponivel` obrigatorio.
- se tipo for credito: `limite`, `diaVencimento`, `dataVencimentoCartao` obrigatorios.
- em `edicao`, `saldoDisponivel` fica bloqueado e o front preserva o valor atual.

## Regras de status e pendencias
- `Inativar` apenas quando status atual e `ativo`.
- `Ativar` apenas quando status atual e `inativo`.
- inativacao e bloqueada quando existe pendencia no mapa local `transacoesPendentesPorCartao`.

## Regras de fatura/extrato
- navegacao mensal por `YYYY-MM`.
- para credito, status de fatura tratado no front: `aberta`, `fechada`, `efetivada`, `estornada`.
- para credito:
  - `efetivar` disponivel para `aberta`, `fechada` e `estornada`.
  - `estornar` disponivel para `efetivada`.

## Regras de formatacao
- datas em ISO no payload.
- valores monetarios como numero no payload e formatacao por locale na exibicao.

## Fora do escopo atual da tela
- persistir mes selecionado por cartao fora da sessao atual.

## Rastreabilidade no codigo
- `app/principal/financeiro/cartao.tsx:328`
- `app/principal/financeiro/cartao.tsx:412`
- `app/principal/financeiro/cartao.tsx:478`
- `app/principal/financeiro/cartao.tsx:513`
- `app/principal/financeiro/cartao.tsx:725`
- `src/servicos/financeiro/index.ts:892`
- `src/servicos/financeiro/index.ts:938`
- `src/servicos/financeiro/index.ts:959`
- `src/servicos/financeiro/index.ts:972`
- `src/servicos/financeiro/index.ts:981`
