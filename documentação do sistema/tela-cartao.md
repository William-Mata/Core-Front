# Tela de Cartao

## Objetivo
Orientar o usuario final sobre como usar a tela de cartao.

## O que a tela permite
A tela de cartao permite:
- consultar cartoes cadastrados
- criar novo cartao
- editar cartao
- visualizar dados completos do cartao
- ativar e inativar cartao
- acompanhar fatura de cartao de credito
- acompanhar extrato de gastos do cartao de debito

## Como usar a lista
A listagem possui:
- botao para novo cartao
- filtro por identificador, descricao e periodo
- cards com resumo do cartao e acoes disponiveis

## Campos principais do cadastro
- Descricao
- Bandeira
- Tipo
- Limite
- Saldo disponivel
- Dia de vencimento
- Data de vencimento do cartao

## Regras importantes por tipo

### Cartao de credito
- exibe `Limite`
- exibe `Dia de vencimento`
- exibe `Data de vencimento do cartao`
- exibe `Fatura`

### Cartao de debito
- oculta os campos de vencimento
- oculta `Limite`
- exibe `Extrato`

## Regras importantes da tela
- `Descricao`, `Bandeira` e `Tipo` sao obrigatorios
- para `Credito`, `Limite`, `Dia de vencimento` e `Data de vencimento do cartao` tambem sao obrigatorios
- no cadastro, `Saldo disponivel` pode ser informado
- na edicao, `Saldo disponivel` fica bloqueado

## Como cadastrar um cartao
1. Clique em `Novo cartao`.
2. Informe descricao, bandeira e tipo.
3. Se o cartao for de credito, preencha limite e vencimentos.
4. Informe o saldo disponivel.
5. Clique em `Salvar`.

Resultado esperado:
- o cartao entra como `Ativo`

## Como editar um cartao
1. Na lista, clique em `Editar`.
2. Ajuste os campos permitidos.
3. Clique em `Confirmar`.

Observacao:
- o saldo disponivel nao pode ser alterado pela tela de edicao atual

## Como visualizar um cartao
1. Na lista, clique em `Visualizar`.
2. Consulte os dados bloqueados do cartao.
3. Consulte o historico de logs ao final da tela.

## Como inativar um cartao
A inativacao so aparece para cartoes com status `Ativo`.

Passos:
1. Clique em `Inativar`.
2. Confirme a acao.

Observacao:
- se houver transacoes pendentes vinculadas ao cartao, a tela bloqueia a inativacao

## Como ativar um cartao
A ativacao so aparece para cartoes com status `Inativo`.

Passos:
1. Clique em `Ativar`.
2. Confirme a acao.

## Como consultar fatura ou extrato
- para cartao de `Credito`, use o botao `Fatura`
- para cartao de `Debito`, use o botao `Extrato`

Comportamento da tela:
- o detalhe abre no proprio card da listagem
- existe navegacao mensal com setas
- o total do periodo e recalculado conforme o mes exibido

## Boas praticas para o usuario
- escolha corretamente entre credito e debito antes de salvar
- revise a bandeira do cartao para facilitar a identificacao posterior
- use a navegacao mensal para analisar a fatura ou o extrato por periodo
- confira o status antes de procurar as acoes de ativacao ou inativacao
