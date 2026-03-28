# Tela de Despesa

## Objetivo
Orientar o usuario final sobre como usar a tela de despesa.

## O que a tela permite
A tela de despesa permite:
- consultar despesas cadastradas
- criar nova despesa
- editar despesa pendente
- visualizar despesa com historico
- efetivar despesa pendente
- cancelar despesa pendente
- estornar despesa efetivada

## Como usar a lista
A listagem possui:
- botao para nova despesa
- filtro por identificador, descricao e periodo
- cards com resumo da despesa e acoes disponiveis

## Campos principais do cadastro
- Descricao
- Observacao
- Data de lancamento
- Data de vencimento
- Tipo de despesa
- Tipo de pagamento
- Recorrencia
- Valor total
- Desconto
- Acrescimo
- Imposto
- Juros
- Valor liquido
- Rateio com amigos
- Rateio por tipo de despesa
- Anexo de documento

## Regras importantes da tela
- `Descricao`, `Data de lancamento`, `Data de vencimento`, `Tipo de despesa`, `Tipo de pagamento` e `Valor total` sao obrigatorios
- `Valor liquido` e calculado automaticamente
- `Valor liquido` fica bloqueado para digitacao
- campos obrigatorios nao preenchidos ficam destacados

## Como cadastrar uma despesa
1. Clique em `Nova despesa`.
2. Preencha os campos obrigatorios.
3. Informe valores adicionais, se existirem.
4. Vincule amigos ou tipos de rateio, se necessario.
5. Anexe documento, se houver.
6. Clique em `Salvar`.

Resultado esperado:
- a despesa entra como `Pendente`

## Como editar uma despesa
A edicao so aparece para despesas com status `Pendente`.

Passos:
1. Na lista, clique em `Editar`.
2. Ajuste os dados necessarios.
3. Clique em `Confirmar`.

## Como visualizar uma despesa
1. Na lista, clique em `Visualizar`.
2. Consulte os campos bloqueados da despesa.
3. Consulte o historico de logs exibido ao final da tela.

## Como efetivar uma despesa
A efetivacao so aparece para despesas com status `Pendente`.

Passos:
1. Na lista, clique em `Efetivar`.
2. Informe a data de efetivacao.
3. Revise o tipo de pagamento.
4. Revise os valores.
5. Anexe documento, se necessario.
6. Clique em `Confirmar efetivacao`.

Comportamento importante:
- `Valor efetivacao` e preenchido automaticamente com o mesmo valor do `Valor liquido`
- `Valor liquido` e `Valor efetivacao` ficam bloqueados

## Como cancelar uma despesa
O cancelamento so aparece para despesas com status `Pendente`.

Passos:
1. Na lista, clique em `Cancelar despesa`.
2. Confirme a acao.

Resultado esperado:
- a despesa passa para `Cancelada`

## Como estornar uma despesa
O estorno so aparece para despesas com status `Efetivada`.

Passos:
1. Na lista, clique em `Estornar`.

Resultado esperado:
- a despesa volta para `Pendente`

## Boas praticas para o usuario
- revise o valor total antes de salvar
- use observacao para registrar contexto relevante
- anexe comprovantes sempre que houver documento de suporte
- confira o status antes de procurar uma acao, porque a tela oculta acoes invalidas
