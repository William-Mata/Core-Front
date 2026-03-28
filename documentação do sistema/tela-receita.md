# Tela de Receita

## Objetivo
Orientar o usuario final sobre como usar a tela de receita.

## O que a tela permite
A tela de receita permite:
- consultar receitas cadastradas
- criar nova receita
- editar receita pendente
- visualizar receita com historico
- efetivar receita pendente
- cancelar receita pendente
- estornar receita efetivada

## Como usar a lista
A listagem possui:
- botao para nova receita
- filtro por identificador, descricao e periodo
- cards com resumo da receita e acoes disponiveis

## Campos principais do cadastro
- Descricao
- Observacao
- Data de lancamento
- Data de vencimento
- Tipo de receita
- Tipo de recebimento
- Recorrencia
- Conta bancaria
- Valor total
- Desconto
- Acrescimo
- Imposto
- Juros
- Valor liquido
- Rateio com amigos
- Valores por amigo
- Rateio por area e subarea
- Valores por area e subarea
- Anexo de documento

## Regras importantes da tela
- `Descricao`, `Data de lancamento`, `Data de vencimento`, `Tipo de receita`, `Tipo de recebimento` e `Valor total` sao obrigatorios
- `Conta bancaria` passa a ser obrigatoria quando o tipo de recebimento for `Pix` ou `Transferencia`
- `Valor liquido` e calculado automaticamente
- `Valor liquido` fica bloqueado para digitacao
- campos obrigatorios nao preenchidos ficam destacados

## Como cadastrar uma receita
1. Clique em `Nova receita`.
2. Preencha os campos obrigatorios.
3. Escolha o tipo de recebimento.
4. Se o recebimento for `Pix` ou `Transferencia`, selecione a conta bancaria.
5. Preencha os rateios, se houver.
6. Anexe documento, se necessario.
7. Clique em `Salvar`.

Resultado esperado:
- a receita entra como `Pendente`

## Como editar uma receita
A edicao so aparece para receitas com status `Pendente`.

Passos:
1. Na lista, clique em `Editar`.
2. Ajuste os dados necessarios.
3. Clique em `Confirmar`.

## Como visualizar uma receita
1. Na lista, clique em `Visualizar`.
2. Consulte os campos bloqueados da receita.
3. Consulte o historico de logs ao final da tela.
4. Revise os rateios informados.

## Como efetivar uma receita
A efetivacao so aparece para receitas com status `Pendente`.

Passos:
1. Na lista, clique em `Efetivar`.
2. Informe a data de efetivacao.
3. Revise o tipo de recebimento.
4. Se necessario, informe a conta bancaria.
5. Revise os valores.
6. Anexe documento, se necessario.
7. Clique em `Confirmar efetivacao`.

Comportamento importante:
- `Valor efetivacao` e preenchido automaticamente com o mesmo valor do `Valor liquido`
- `Valor liquido` e `Valor efetivacao` ficam bloqueados

## Como cancelar uma receita
O cancelamento so aparece para receitas com status `Pendente`.

Passos:
1. Na lista, clique em `Cancelar receita`.
2. Confirme a acao.

Resultado esperado:
- a receita passa para `Cancelada`

## Como estornar uma receita
O estorno so aparece para receitas com status `Efetivada`.

Passos:
1. Na lista, clique em `Estornar`.

Resultado esperado:
- a receita volta para `Pendente`

## Boas praticas para o usuario
- escolha corretamente o tipo de recebimento antes de preencher conta bancaria
- confira se os valores de rateio fazem sentido antes de salvar
- use o historico para acompanhar alteracoes relevantes
- anexe comprovantes ou documentos de suporte sempre que houver
