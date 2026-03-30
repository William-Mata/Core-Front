# Tela de Despesa

## Objetivo
Documentar o contrato atual do front-end da tela de despesa para integração com a API.

Arquivo principal:
- `app/principal/financeiro/despesa.tsx`

## Rotas do front
- listagem: `/principal/financeiro/despesa`
- visualização: `/principal/financeiro/despesa?id={id}`

## Modos da tela
- `lista`
- `novo`
- `edicao`
- `visualizacao`
- `efetivacao`

## Catálogos consumidos ao abrir a tela
### Amigos
- `GET /api/financeiro/amigos`

Exemplo:
```json
[
  { "id": 2, "nome": "Alex", "email": "alex@email.com" }
]
```

### Áreas e subáreas
- `GET /api/financeiro/areas-subareas`

Exemplo:
```json
[
  {
    "id": 1,
    "nome": "Alimentacao",
    "tipo": "despesa",
    "subAreas": [
      { "id": 10, "nome": "Almoco" }
    ]
  }
]
```

Regra no front:
- a tela de despesa usa apenas áreas com `tipo = "despesa"`
- ao selecionar uma área, o front lista apenas as subáreas daquela área
- se o par `areaId` e `subAreaId` não for válido, o front bloqueia o envio

## Campos da despesa usados pelo front
```json
{
  "id": 1,
  "descricao": "Almoco com cliente",
  "observacao": "Reuniao comercial no centro.",
  "dataLancamento": "2026-03-10",
  "dataVencimento": "2026-03-15",
  "dataEfetivacao": "2026-03-15",
  "tipoDespesa": "alimentacao",
  "tipoPagamento": "pix",
  "recorrencia": "Mensal",
  "recorrenciaFixa": false,
  "quantidadeRecorrencia": 6,
  "valorTotal": 150.0,
  "valorLiquido": 145.0,
  "desconto": 5.0,
  "acrescimo": 0.0,
  "imposto": 0.0,
  "juros": 0.0,
  "valorEfetivacao": 145.0,
  "status": "efetivada",
  "rateiosAmigos": [
    { "amigo": "Alex", "valor": 50.0 }
  ],
  "rateiosAreaSubarea": [
    { "area": "Alimentacao", "subarea": "Almoco", "valor": 100.0 }
  ],
  "anexoDocumento": "recibo-almoco.pdf",
  "logs": []
}
```

## Enumeradores usados no front
### Status
- `pendente`
- `efetivada`
- `cancelada`

### Tipo de pagamento
- `pix`
- `cartaoCredito`
- `cartaoDebito`
- `boleto`
- `transferencia`
- `dinheiro`

### Frequência de recorrência
- `Unica`
- `Diaria`
- `Semanal`
- `Quinzenal`
- `Mensal`
- `Trimestral`
- `Semestral`
- `Anual`

## Regras de recorrência no front
### Despesa sem cartão
Payload enviado:
- `recorrencia`: frequência da série
- `recorrenciaFixa`: `true` ou `false`
- `quantidadeRecorrencia`: inteiro ou `null`

Regras:
- se `recorrencia = Unica`
  - `recorrenciaFixa = false`
  - `quantidadeRecorrencia = null`
- se `recorrencia != Unica` e `recorrenciaFixa = false`
  - `quantidadeRecorrencia` é obrigatória
  - `quantidadeRecorrencia > 0`
  - `quantidadeRecorrencia <= 100`
- se `recorrencia != Unica` e `recorrenciaFixa = true`
  - `quantidadeRecorrencia = null`

### Despesa com cartão
Quando `tipoPagamento = cartaoCredito` ou `cartaoDebito`:
- o front oculta o seletor de recorrência
- o front exibe `quantidadeParcelas`
- o payload envia:
  - `tipoPagamento`
  - `quantidadeParcelas`
  - `recorrencia = "Mensal"`
  - `recorrenciaFixa = false`
  - `quantidadeRecorrencia = null`

## Rateio enviado pelo front
### Amigos
```json
[
  { "nome": "Alex", "valor": 50.0 }
]
```

### Área e subárea
```json
[
  { "areaId": 1, "subAreaId": 10, "valor": 100.0 }
]
```

## Payload de criação e edição
### Despesa recorrente comum
```json
{
  "descricao": "Academia",
  "observacao": "Plano mensal",
  "dataLancamento": "2026-03-10",
  "dataVencimento": "2026-03-10",
  "tipoDespesa": "saude",
  "tipoPagamento": "pix",
  "recorrencia": "Mensal",
  "recorrenciaFixa": false,
  "quantidadeRecorrencia": 6,
  "valorTotal": 120.0,
  "valorLiquido": 120.0,
  "desconto": 0.0,
  "acrescimo": 0.0,
  "imposto": 0.0,
  "juros": 0.0,
  "amigos": [],
  "areasRateio": [
    { "areaId": 1, "subAreaId": 10, "valor": 120.0 }
  ],
  "anexoDocumento": "academia.pdf"
}
```

### Despesa recorrente fixa
```json
{
  "descricao": "Internet",
  "observacao": "Conta recorrente",
  "dataLancamento": "2026-03-10",
  "dataVencimento": "2026-03-10",
  "tipoDespesa": "servicos",
  "tipoPagamento": "boleto",
  "recorrencia": "Mensal",
  "recorrenciaFixa": true,
  "quantidadeRecorrencia": null,
  "valorTotal": 99.9,
  "valorLiquido": 99.9,
  "desconto": 0.0,
  "acrescimo": 0.0,
  "imposto": 0.0,
  "juros": 0.0,
  "amigos": [],
  "areasRateio": [],
  "anexoDocumento": ""
}
```

### Despesa parcelada no cartão
```json
{
  "descricao": "Notebook",
  "observacao": "Compra parcelada",
  "dataLancamento": "2026-03-10",
  "dataVencimento": "2026-03-10",
  "tipoDespesa": "servicos",
  "tipoPagamento": "cartaoCredito",
  "recorrencia": "Mensal",
  "recorrenciaFixa": false,
  "quantidadeRecorrencia": null,
  "quantidadeParcelas": 10,
  "valorTotal": 5000.0,
  "valorLiquido": 5000.0,
  "desconto": 0.0,
  "acrescimo": 0.0,
  "imposto": 0.0,
  "juros": 0.0,
  "amigos": [],
  "areasRateio": [],
  "anexoDocumento": "nota-fiscal.pdf"
}
```

## Validações de front
Campos obrigatórios:
- `descricao`
- `dataLancamento`
- `dataVencimento`
- `tipoDespesa`
- `tipoPagamento`
- `valorTotal`

Regras adicionais:
- `valorLiquido` é calculado automaticamente
- `valorLiquido` permanece bloqueado
- `dataVencimento` não pode ser maior que `dataLancamento`
- na efetivação, `dataEfetivacao` não pode ser maior que `dataLancamento`
- para cartão, `quantidadeParcelas` é obrigatória e maior que zero
- para recorrência normal, `quantidadeRecorrencia` deve ser maior que zero e no máximo 100

## Efetivação
Payload esperado na efetivação:
```json
{
  "dataEfetivacao": "2026-03-15",
  "tipoPagamento": "pix",
  "valorTotal": 150.0,
  "valorLiquido": 145.0,
  "desconto": 5.0,
  "acrescimo": 0.0,
  "imposto": 0.0,
  "juros": 0.0,
  "anexoDocumento": "comprovante.pdf"
}
```

Regras:
- `valorEfetivacao` é sempre igual a `valorLiquido`
- `valorLiquido` e `valorEfetivacao` ficam bloqueados
- apenas despesas pendentes podem ser efetivadas

## Cancelamento e estorno
- cancelamento: apenas `pendente`
- estorno: apenas `efetivada`
- após estorno, o front volta o status para `pendente`

## UX de criação de série
Se a criação gerar série recorrente ou parcelamento:
- o front considera sucesso com a primeira ocorrência
- a mensagem exibida é equivalente a: `Primeira ocorrência criada. As demais estão sendo geradas.`