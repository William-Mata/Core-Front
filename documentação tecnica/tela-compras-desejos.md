# Tela Compras - Lista de Desejos

## Objetivo
Cadastrar itens desejados e converter selecao multipla em lista de compras.

## Endpoints utilizados
- `GET /compras/desejos`
- `POST /compras/desejos`
- `PUT /compras/desejos/{desejoId}`
- `DELETE /compras/desejos/{desejoId}`
- `POST /compras/desejos/converter`

## Regras de negocio
- Conversao exige ao menos um desejo selecionado.
- Conversao pode criar nova lista com os itens selecionados.
- Desejo pode armazenar quantidade e valor alvo para aproveitar no item convertido.
- Remocao de desejo exige confirmacao explicita antes do `DELETE /compras/desejos/{desejoId}`.

## Validacoes
- Descricao e obrigatoria no cadastro de desejo.
- Quantidade invalida e tratada com fallback para 1.

## Padrao de confirmacao critica
- A modal de remocao usa:
  - titulo de exclusao
  - descricao contextual da acao
  - alerta visual de impacto irreversivel
  - botoes `Cancelar` e `Remover`

## Fonte no front
- `app/principal/compras/desejos.tsx`
- `src/utils/confirmacao.ts`
