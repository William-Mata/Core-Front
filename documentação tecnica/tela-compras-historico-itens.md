# Tela Compras - Historico de Itens

## Objetivo
Exibir evolucao de preco por item e unidade de medida considerando uso do usuario e listas compartilhadas.

## Endpoint utilizado
- `GET /compras/historico-itens`

## Filtros
- Descricao do item
- Unidade de medida (suporte no endpoint)
- Periodo (suporte no endpoint)

## Indicadores exibidos
- Ultimo valor
- Menor valor
- Media de valor
- Variacao percentual
- Data da ultima compra
- Quantidade de registros

## Regras de negocio
- Historico e agrupado por `descricao + unidadeMedida`.
- Valores zerados nao entram em estatisticas de preco.
