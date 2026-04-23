# Tela Compras - Listas e Detalhe

## Objetivo
Permitir criacao, consulta e manutencao de listas de compras compartilhadas.

## Endpoints utilizados
- `GET /compras/listas`
- `POST /compras/listas`
- `PUT /compras/listas/{listaId}`
- `POST /compras/listas/{listaId}/duplicar`
- `DELETE /compras/listas/{listaId}`
- `GET /compras/listas/{listaId}/itens`
- `POST /compras/listas/{listaId}/itens`
- `PUT /compras/listas/{listaId}/itens/{itemId}`
- `PATCH /compras/listas/{listaId}/itens/{itemId}/rapido`
- `DELETE /compras/listas/{listaId}/itens/{itemId}`
- `POST /compras/listas/{listaId}/acoes-lote`
- `GET /compras/sugestoes-itens`

## Regras de negocio
- Sugestoes de item so sao buscadas com 3 caracteres ou mais.
- `valorTotal` do item e calculado por `quantidade * valorUnitario`.
- Toda acao destrutiva em lote exige confirmacao.
- Itens podem ser filtrados por comprado e ordenados por alfabetica, preco ou cor.

## Compartilhamento e tempo real
- Modelo de permissao: dono, editor e leitor.
- Eventos de atualizacao via SignalR (`CompraEventoRecebido`).
- Em conflito de versao, a tela deve reconsultar itens da lista.
