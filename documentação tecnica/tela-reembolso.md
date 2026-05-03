# Tela de Reembolso

## Objetivo
Documentar o contrato atual da tela de reembolso com API e regras de negocio aplicadas no front.

## Rota do front
- `/financeiro/reembolsos`

## Modos da tela
- `lista`
- `novo`
- `edicao`
- `visualizacao`
- `efetivacao`
- `estorno`

## Endpoints consumidos
Reembolso:
- `GET /api/financeiro/reembolsos`
- `GET /api/financeiro/reembolsos/{id}`
- `POST /api/financeiro/reembolsos`
- `PUT /api/financeiro/reembolsos/{id}`
- `POST /api/financeiro/reembolsos/{id}/efetivar`
- `POST /api/financeiro/reembolsos/{id}/estornar`

Dependencias:
- `GET /api/financeiro/despesas`
- `GET /api/financeiro/contas-bancarias`
- `GET /api/financeiro/cartoes`

## Filtros e competencia
Filtros de consulta:
- `id`, `descricao`, `dataInicio`, `dataFim`, `competencia`.

Regras:
- consulta acontece ao acionar `Consultar`.
- `competencia` e obrigatoria para salvar no front.
- existe filtro local adicional apos retorno da API.

## Regras de status para acoes
- `Editar`: somente `pendente`
- `Efetivar`: somente `pendente`
- `Estornar`: somente `efetivada`
- `Cancelar`: somente `pendente` (feito por `PUT` alterando status para `CANCELADA`)

## Regras de validacao no front
- `descricao` obrigatoria.
- ao menos uma despesa vinculada.
- nao permite despesa vinculada em mais de um reembolso.
- `competencia` obrigatoria.
- para `tipoRecebimento` com conta (`pix`, `transferencia`, `contaCorrente`), `contaBancariaId` obrigatoria.
- para `tipoRecebimento` com cartao (`cartaoCredito`, `cartaoDebito`), `cartaoId` obrigatorio.

## Efetivacao
Payload enviado:
- `dataEfetivacao`
- `valorEfetivacao` (soma das despesas vinculadas)
- `observacaoHistorico` (opcional)
- `documentos`

Regras:
- apenas `pendente`.
- `dataEfetivacao >= dataLancamento`.

## Estorno
Payload enviado:
- `dataEstorno`
- `observacaoHistorico` (opcional)
- `ocultarDoHistorico` (opcional)

Regras:
- apenas `efetivada`.
- `dataEstorno >= dataLancamento`.
- se houver `dataEfetivacao`, `dataEstorno >= dataEfetivacao`.

## Cancelamento
- sem endpoint dedicado de cancelamento.
- fluxo atual: busca detalhe (`GET /{id}`) e envia `PUT /{id}` com `status = CANCELADA`.
- antes de cancelar, o front exige confirmacao explicita em modal destrutiva.
- a modal de cancelamento exibe mensagem contextual, alerta de impacto e botoes `Cancelar` e `Confirmar`.
- ao cancelar no modal, nenhuma alteracao e enviada para API.

## Regras importantes para integracao
- status aceito pelo front para serializacao: `PENDENTE`, `EFETIVADA`, `CANCELADA`.
- payload de salvar/editar inclui `despesasVinculadas`, `valorTotal`, `contaBancariaId`, `cartaoId`, `documentos`.

## Fora do escopo atual da tela
- exclusao fisica de reembolso pelo usuario (`DELETE` nao e usado na tela).

## Rastreabilidade no codigo
- `app/(principal)/financeiro/reembolsos.tsx:542`
- `app/(principal)/financeiro/reembolsos.tsx:614`
- `app/(principal)/financeiro/reembolsos.tsx:655`
- `app/(principal)/financeiro/reembolsos.tsx:707`
- `src/utils/reembolsoStatus.ts:21`
- `src/utils/reembolso.ts:6`
- `src/servicos/financeiro/index.ts:643`
- `src/servicos/financeiro/index.ts:665`
- `src/servicos/financeiro/index.ts:677`

