# Tela de Amigos

## Objetivo
Documentar o comportamento atual da tela de amigos e a regra de confirmacao para remocao de vinculo.

## Rota do front
- `/principal/amigos`

## Endpoints consumidos
- `GET /api/financeiro/amigos`
- `GET /api/financeiro/convites-amizade`
- `POST /api/financeiro/convites-amizade/{id}/aceitar`
- `POST /api/financeiro/convites-amizade/{id}/rejeitar`
- `DELETE /api/financeiro/amigos/{id}`

## Confirmacao de acao critica
- A remocao de amigo exige confirmacao explicita antes do `DELETE`.
- A modal segue o padrao global:
  - titulo claro de exclusao
  - mensagem contextual
  - alerta de impacto irreversivel
  - botoes `Cancelar` e `Remover`
- Se o usuario cancelar, a remocao nao e executada.

## Fonte no front
- `app/principal/amigos/index.tsx`
- `src/utils/confirmacao.ts`
- `src/componentes/comuns/ModalConfirmacao/index.tsx`
