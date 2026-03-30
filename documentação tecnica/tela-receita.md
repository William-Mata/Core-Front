# Tela de Receita

## Objetivo
Documentar o contrato atual do front-end da tela de receita para integração com a API.

Arquivo principal:
- `app/principal/financeiro/receita.tsx`

## Rotas do front
- listagem: `/principal/financeiro/receita`
- visualização: `/principal/financeiro/receita?id={id}`

## Modos da tela
- `lista`
- `novo`
- `edicao`
- `visualizacao`
- `efetivacao`

## Catálogos consumidos ao abrir a tela
### Amigos
- `GET /api/financeiro/amigos`

### Áreas e subáreas
- `GET /api/financeiro/areas-subareas`

Regra no front:
- a tela de receita usa apenas áreas com `tipo = "receita"`
- ao selecionar uma área, o front lista apenas as subáreas daquela área
- se o par `areaId` e `subAreaId` não for válido, o envio é bloqueado

## Campos da receita usados pelo front
```json
{
  "id": 1,
  "descricao": "Freelance",
  "observacao": "Projeto pontual",
  "dataLancamento": "2026-03-10",
  "dataVencimento": "2026-03-15",
  "dataEfetivacao": "2026-03-15",
  "tipoReceita": "freelance",
  "tipoRecebimento": "pix",
  "recorrencia": "Semanal",
  "recorrenciaFixa": true,
  "quantidadeRecorrencia": null,
  "valorTotal": 1000.0,
  "valorLiquido": 1000.0,
  "desconto": 0.0,
  "acrescimo": 0.0,
  "imposto": 0.0,
  "juros": 0.0,
  "valorEfetivacao": 1000.0,
  "status": "efetivada",
  "rateiosAmigos": [
    { "amigo": "Alex", "valor": 250.0 }
  ],
  "rateiosAreaSubarea": [
    { "area": "Salario", "subarea": "Holerite", "valor": 750.0 }
  ],
  "contaBancaria": "Conta Principal",
  "anexoDocumento": "contrato.pdf",
  "logs": []
}
```

## Enumeradores usados no front
### Status
- `pendente`
- `efetivada`
- `cancelada`

### Tipo de recebimento
- `pix`
- `transferencia`
- `contaCorrente`
- `dinheiro`
- `boleto`

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

## Rateio enviado pelo front
### Amigos
```json
[
  { "nome": "Alex", "valor": 250.0 }
]
```

### Área e subárea
```json
[
  { "areaId": 2, "subAreaId": 20, "valor": 750.0 }
]
```

## Payload de criação e edição
### Receita recorrente comum
```json
{
  "descricao": "Freelance mensal",
  "observacao": "Contrato de manutenção",
  "dataLancamento": "2026-03-10",
  "dataVencimento": "2026-03-15",
  "tipoReceita": "freelance",
  "tipoRecebimento": "pix",
  "recorrencia": "Mensal",
  "recorrenciaFixa": false,
  "quantidadeRecorrencia": 6,
  "valorTotal": 1500.0,
  "valorLiquido": 1500.0,
  "desconto": 0.0,
  "acrescimo": 0.0,
  "imposto": 0.0,
  "juros": 0.0,
  "amigos": [],
  "areasRateio": [
    { "areaId": 2, "subAreaId": 20, "valor": 1500.0 }
  ],
  "contaBancaria": "Conta Principal",
  "anexoDocumento": "contrato.pdf"
}
```

### Receita recorrente fixa
```json
{
  "descricao": "Assinatura recebida",
  "observacao": "Plano recorrente",
  "dataLancamento": "2026-03-10",
  "dataVencimento": "2026-03-10",
  "tipoReceita": "outros",
  "tipoRecebimento": "transferencia",
  "recorrencia": "Semanal",
  "recorrenciaFixa": true,
  "quantidadeRecorrencia": null,
  "valorTotal": 250.0,
  "valorLiquido": 250.0,
  "desconto": 0.0,
  "acrescimo": 0.0,
  "imposto": 0.0,
  "juros": 0.0,
  "amigos": [],
  "areasRateio": [],
  "contaBancaria": "Conta Principal",
  "anexoDocumento": ""
}
```

## Validações de front
Campos obrigatórios:
- `descricao`
- `dataLancamento`
- `dataVencimento`
- `tipoReceita`
- `tipoRecebimento`
- `valorTotal`

Regras adicionais:
- `contaBancaria` é obrigatória quando `tipoRecebimento` for `pix` ou `transferencia`
- `valorLiquido` é calculado automaticamente
- `valorLiquido` permanece bloqueado
- `dataVencimento` não pode ser maior que `dataLancamento`
- na efetivação, `dataEfetivacao` não pode ser maior que `dataLancamento`
- para recorrência normal, `quantidadeRecorrencia` deve ser maior que zero e no máximo 100

## Efetivação
Payload esperado na efetivação:
```json
{
  "dataEfetivacao": "2026-03-15",
  "tipoRecebimento": "pix",
  "contaBancaria": "Conta Principal",
  "valorTotal": 1000.0,
  "valorLiquido": 1000.0,
  "desconto": 0.0,
  "acrescimo": 0.0,
  "imposto": 0.0,
  "juros": 0.0,
  "anexoDocumento": "comprovante.pdf"
}
```

Regras:
- `valorEfetivacao` é sempre igual a `valorLiquido`
- `valorLiquido` e `valorEfetivacao` ficam bloqueados
- apenas receitas pendentes podem ser efetivadas

## Cancelamento e estorno
- cancelamento: apenas `pendente`
- estorno: apenas `efetivada`
- após estorno, o front volta o status para `pendente`

## UX de criação de série
Se a criação gerar série recorrente:
- o front considera sucesso com a primeira ocorrência
- a mensagem exibida é equivalente a: `Primeira ocorrência criada. As demais estão sendo geradas.`