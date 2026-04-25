# Tela Compras - Planejamentos e Itens

## Objetivo
Permitir cadastro, edicao, visualizacao e manutencao de planejamentos de compras com participantes no proprio fluxo da lista, respeitando papeis de acesso e contrato atualizado da API.

## Endpoints utilizados
- `GET /compras/listas`
- `GET /compras/listas/{listaId}`
- `GET /compras/listas/{listaId}/detalhe`
- `POST /compras/listas`
- `PUT /compras/listas/{listaId}`
- `POST /compras/listas/{listaId}/duplicar`
- `POST /compras/listas/{listaId}/arquivar`
- `DELETE /compras/listas/{listaId}`
- `POST /compras/listas/{listaId}/itens`
- `PUT /compras/listas/{listaId}/itens/{itemId}`
- `PATCH /compras/listas/{listaId}/itens/{itemId}/edicao-rapida`
- `POST /compras/listas/{listaId}/itens/{itemId}/marcar-comprado`
- `POST /compras/listas/{listaId}/acoes-lote`
- `GET /compras/listas/{listaId}/logs`
- `GET /compras/listas/{listaId}/sugestoes-itens`

## Endpoints removidos no Front
- `POST /compras/listas/{listaId}/participantes`
- `DELETE /compras/listas/{listaId}/participantes/{participanteId}`

## Regras de integracao Front/API
- `participantes` e enviado no payload de:
  - `POST /compras/listas`
  - `PUT /compras/listas/{listaId}`
  - `POST /compras/listas/{listaId}/duplicar`
- Mapeamento de papel enviado:
  - `proprietario` -> `Proprietario`
  - `coproprietario` -> `CoProprietario`
  - `leitor` -> `Leitor`
- O front valida no formulario de cadastro/edicao que existe exatamente 1 participante com papel `proprietario`.
- Em edicao, quando `participantes` e enviado, o backend sincroniza com o payload.
- Detalhe da lista para tela de itens:
  - itens: `GET /compras/listas/{listaId}`
  - participantes + logs: `GET /compras/listas/{listaId}/detalhe`

## Regras de permissoes no Front
- `proprietario`:
  - visualizar, editar, duplicar, arquivar, excluir.
- `coproprietario`:
  - visualizar, editar, duplicar.
- `leitor`:
  - apenas visualizar.

## Regras de UX
- Menu de acoes por card na tela de planejamento:
  - visualizar
  - editar
  - duplicar
  - arquivar
  - excluir
- Acoes perigosas com confirmacao obrigatoria:
  - arquivar lista
  - excluir lista
- Card da lista exibe:
  - nome
  - categoria
  - status
  - papel do usuario
  - valor total
  - valor comprado
  - percentual comprado
  - quantidade de itens comprados/total
  - ultima atualizacao

## Logs e rastreabilidade
- Logs continuam visiveis na tela de itens (`app/principal/compras/lista.tsx`) em modo visualizacao e edicao.
- O front normaliza eventos de log tanto no formato legado (`evento`) quanto no formato novo (`acao`).

## SignalR
- Mantida escuta de `listaAtualizada` em `src/servicos/compras/tempoReal.ts`.
- Ao receber evento da lista ativa, a tela recarrega dados para sincronismo em tempo real.

## Fonte no front
- Tela de planejamentos: `app/principal/compras/index.tsx`
- Tela de itens do planejamento: `app/principal/compras/lista.tsx`
- Servico de compras: `src/servicos/compras/index.ts`
- Tipos do modulo: `src/tipos/compras.tipos.ts`
- Mocks: `src/mocks/manipuladores/compras.mock.ts`
