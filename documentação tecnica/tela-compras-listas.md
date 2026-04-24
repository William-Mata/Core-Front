# Tela Compras - Planejamentos e Itens

## Objetivo
Permitir criacao, consulta e manutencao de planejamentos de compras, incluindo itens, participantes e acoes por planejamento.

## Endpoints utilizados
- `GET /compras/listas`
- `GET /compras/listas/{listaId}`
- `POST /compras/listas`
- `PUT /compras/listas/{listaId}`
- `POST /compras/listas/{listaId}/duplicar`
- `DELETE /compras/listas/{listaId}`
- `POST /compras/listas/{listaId}/participantes`
- `DELETE /compras/listas/{listaId}/participantes/{participanteId}`
- `POST /compras/listas/{listaId}/itens`
- `PUT /compras/listas/{listaId}/itens/{itemId}`
- `PATCH /compras/listas/{listaId}/itens/{itemId}/edicao-rapida`
- `POST /compras/listas/{listaId}/itens/{itemId}/marcar-comprado`
- `POST /compras/listas/{listaId}/acoes-lote`
- `GET /compras/listas/{listaId}/sugestoes-itens`

## Regras de integracao Front/API
- Nomenclatura de UI do modulo: `Planejamentos` (lista) e `Planejamento` (item).
- Cada card de planejamento possui menu de acoes em dropdown flutuante com:
  - `Duplicar`
  - `Excluir`
  - `Compartilhar com amigos`
- A acao `Duplicar` abre modal com os mesmos campos do cadastro de planejamento:
  - `nome`
  - `observacao`
  - `categoria`
- Na confirmacao da duplicacao, o front envia os campos no proprio `POST /compras/listas/{listaId}/duplicar` (chamada unica).
- Cadastro de planejamento (`POST /compras/listas`) envia:
  - `nome`
  - `observacao` (quando informado)
  - `categoria`
- Cadastro e edicao de item usam campo `observacao` com entrada multiline (`text-area`) no front.
- Sugestoes de item so sao buscadas com 3 caracteres ou mais.
- `valorTotal` do item e derivado de `quantidade * valorUnitario`.

## Regras de permissao e UX
- Perfil `proprietario`:
  - pode visualizar, criar, editar, excluir, compartilhar e executar acoes em lote.
- Perfil `coproprietario` (`CoProprietario` no contrato da API):
  - pode visualizar, criar, editar, excluir, compartilhar e executar acoes em lote.
- Perfil `leitor`:
  - apenas visualiza.
- Exclusao de planejamento e remocao de participante exigem confirmacao explicita em modal.
- A confirmacao de acao em lote exibe descricao contextual com o nome da acao selecionada.
- Acoes destrutivas em lote usam destaque visual de impacto e confirmacao em estilo de perigo.
- Front trata `CoProprietario` como papel oficial e mantem compatibilidade legado com retorno `Editor`, normalizando ambos para `coproprietario`.

## Padrao de confirmacao critica
- Modal padrao com:
  - titulo claro de acao critica
  - descricao contextual da entidade/acao
  - alerta de impacto irreversivel quando aplicavel
  - botoes `Cancelar` e acao confirmatoria
- Se o usuario cancelar, nenhuma chamada destrutiva e executada.

## Fonte no front
- Tela de planejamentos: `app/principal/compras/index.tsx`
- Tela de itens do planejamento: `app/principal/compras/lista.tsx`
- Servico de compras: `src/servicos/compras/index.ts`
- Tipos do modulo: `src/tipos/compras.tipos.ts`
