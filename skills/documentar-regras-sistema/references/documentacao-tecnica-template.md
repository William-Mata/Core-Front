# Tela de {NOME DA TELA}

## Objetivo
Documentar o contrato atual do front-end da tela de {nome da tela} para integracao com API.

## Rota do front
- listagem da tela:
- visualizacao por id:

## Modos da tela
- `lista`
- `novo`
- `edicao`
- `visualizacao`
- `efetivacao` (quando aplicavel)

## Estrutura esperada de {entidade}
```json
{}
```

## Enumeracoes esperadas pelo front
### Status
- `pendente`
- `efetivada`
- `cancelada`

### Tipos do dominio
- listar enums usados na tela

## Filtros da listagem
- campos de filtro
- regra de busca
- regra de periodo

## Regras de validacao no cadastro e edicao
- campos obrigatorios
- regras condicionais
- formula de calculo (se houver)

## Regras de cadastro
- comportamento ao salvar
- payload recomendado para criacao

## Regras de edicao
- quando pode editar
- comportamento ao confirmar

## Regras de visualizacao
- blocos exibidos
- campos bloqueados
- historico/logs

## Regras de efetivacao
- campos exigidos
- regras condicionais
- atualizacoes de status/valores

## Regras de cancelamento
- condicoes para cancelar
- efeito esperado

## Regras de estorno
- condicoes para estornar
- efeito esperado

## Regras de upload
- formatos aceitos
- limite de tamanho (se aplicavel)

## Regras de formatacao
- datas
- moeda
- locale

## Regras importantes para integracao
- dependencias obrigatorias de API para front funcionar
- lacunas nao confirmadas

## Fora do escopo atual da tela
- comportamentos nao implementados no front
