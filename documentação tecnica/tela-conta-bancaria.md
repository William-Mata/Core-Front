# Tela de Conta Bancaria

## Objetivo
Documentar o contrato atual da tela de conta bancaria para integracao com API.

## Rota do front
- `/financeiro/conta-bancaria`

## Modos da tela
- `lista`
- `novo`
- `edicao`
- `visualizacao`

## Endpoints consumidos
Cadastro/listagem:
- `GET /api/financeiro/contas-bancarias`
- `GET /api/financeiro/contas-bancarias/{id}`
- `POST /api/financeiro/contas-bancarias`
- `PUT /api/financeiro/contas-bancarias/{id}`
- `POST /api/financeiro/contas-bancarias/{id}/inativar`
- `POST /api/financeiro/contas-bancarias/{id}/ativar`

Extrato mensal:
- `GET /api/financeiro/contas-bancarias/{id}/lancamentos?competencia=YYYY-MM`

## Filtros da listagem
- `id`, `descricao`, `dataInicio`, `dataFim`.

Regras:
- consulta de lista usa API com filtros `id` e `descricao`.
- front aplica filtro local complementar por periodo usando `dataAbertura`.

## Regras de validacao
Obrigatorios:
- `descricao`
- `banco`
- `agencia`
- `numero`
- `dataAbertura`
- `saldoInicial`

Regras de saldo:
- no modo `novo`, saldo inicial e editavel e preenche saldo atual.
- no modo `edicao`, saldo inicial e saldo atual ficam bloqueados.

## Regras de status e pendencias
- `Inativar` apenas quando status e `ativa`.
- `Ativar` apenas quando status e `inativa`.
- inativacao e bloqueada quando existe pendencia no mapa local `transacoesPendentesPorConta`.
- antes de inativar, o front exige confirmacao explicita em modal.
- a modal de inativacao usa alerta de impacto e botoes `Cancelar` e `Inativar`.
- ao cancelar no modal, nenhuma chamada para `/inativar` e enviada.

## Regras de extrato
- detalhe abre por conta na propria lista.
- navegacao mensal por `YYYY-MM`.
- cada movimento usa tipo para sinal visual de entrada/saida.

## Regras de formatacao
- datas em ISO no payload.
- valores monetarios como numero no payload e formatacao por locale na exibicao.

## Fora do escopo atual da tela
- persistir mes selecionado por conta fora da sessao atual.

## Rastreabilidade no codigo
- `app/(principal)/financeiro/conta-bancaria.tsx:318`
- `app/(principal)/financeiro/conta-bancaria.tsx:344`
- `app/(principal)/financeiro/conta-bancaria.tsx:376`
- `app/(principal)/financeiro/conta-bancaria.tsx:502`
- `src/servicos/financeiro/index.ts:838`
- `src/servicos/financeiro/index.ts:854`
- `src/servicos/financeiro/index.ts:873`
- `src/servicos/financeiro/index.ts:883`

