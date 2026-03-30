# Tela de Reembolso

## Objetivo
Documentar o contrato atual do front-end para a tela de reembolso.

Arquivo principal:
- `app/principal/financeiro/reembolso.tsx`

## Rota da tela
- `/principal/financeiro/reembolso`

## Endpoints consumidos
- `GET /api/financeiro/reembolsos`
- `GET /api/financeiro/despesas`
- `POST /api/financeiro/reembolsos`
- `PUT /api/financeiro/reembolsos/{id}`
- `DELETE /api/financeiro/reembolsos/{id}`

## Estrutura esperada de Reembolso (resposta)
```json
{
  "id": 1,
  "descricao": "Viagem comercial - semana 2",
  "solicitante": "Joao Silva",
  "dataSolicitacao": "2026-03-18",
  "despesasVinculadas": [1, 3],
  "valorEfetivacao": 274.9,
  "status": "PENDENTE"
}
```

Observacoes:
- `status` pode vir em maiusculo ou minusculo.
- `despesasVinculadas` pode vir como array de ids ou objetos com `id`.

## Estrutura esperada de Despesa (para selecao)
```json
{
  "id": 10,
  "titulo": "Combustivel viagem",
  "valor": 185.0,
  "data": "2026-03-15"
}
```

## Payload de criacao/edicao enviado pelo front
```json
{
  "descricao": "Viagem comercial - semana 2",
  "solicitante": "Joao Silva",
  "dataSolicitacao": "2026-03-18",
  "despesasVinculadas": [1, 3],
  "valorTotal": 274.9,
  "status": "PENDENTE"
}
```

## Efetivacao
Na efetivacao, o front envia `PUT` com:
```json
{
  "status": "EFETIVADA",
  "valorEfetivacao": 274.9
}
```

Regras de front:
- apenas reembolso `pendente` pode ser efetivado
- `valorEfetivacao` e bloqueado e acompanha o total das despesas vinculadas

## Estorno
No estorno, o front envia `PUT` com:
```json
{
  "status": "PENDENTE"
}
```

Regras de front:
- apenas reembolso `efetivada` pode ser estornado
- apos estorno, status volta para `pendente`

## Regras de validacao no front
- `descricao` obrigatoria
- `despesasVinculadas` com pelo menos 1 item
- regra de unicidade:
  - uma despesa so pode estar vinculada a um unico reembolso
  - em edicao, o reembolso atual e ignorado na checagem
  - em conflito, o front bloqueia o save e exibe erro

## Regras de calculo
- `valorTotal` e calculado no front pela soma das despesas vinculadas
- `valorTotal` nao e digitavel

## Filtro da listagem
Campos:
- `id`
- `descricao`
- `dataInicio`
- `dataFim`

Regras:
- `id`: correspondencia parcial
- `descricao`: busca em `descricao` e `solicitante`
- periodo: aplicado sobre `dataSolicitacao`

## Tratamento de erro
- erros de API exibidos via parser RFC 7807 do projeto
- fallback de mensagem:
  - `financeiro.reembolso.mensagens.falhaCarregar`
  - `financeiro.reembolso.mensagens.falhaSalvar`

## Observacao de integracao
- a tela usa apenas dados da API
- `GET /api/financeiro/despesas` deve retornar despesas elegiveis para o seletor multiplo