# Tela de Conta Bancaria

## Objetivo
Orientar o usuario final sobre como usar a tela de conta bancaria.

## O que a tela permite
A tela de conta bancaria permite:
- consultar contas cadastradas
- criar nova conta
- editar conta
- visualizar dados completos da conta
- ativar e inativar conta
- acompanhar extrato da conta

## Como usar a lista
A listagem possui:
- botao para nova conta
- filtro por identificador, descricao e periodo
- cards com resumo da conta e acoes disponiveis

## Campos principais do cadastro
- Descricao
- Banco
- Agencia
- Numero
- Saldo inicial
- Data de abertura

## Regras importantes da tela
- `Descricao`, `Banco`, `Agencia`, `Numero`, `Saldo inicial` e `Data de abertura` sao obrigatorios
- no cadastro, o saldo inicial alimenta tambem o saldo atual
- na edicao, `Saldo inicial` fica bloqueado
- na edicao, `Saldo atual` tambem fica bloqueado

## Como cadastrar uma conta bancaria
1. Clique em `Nova conta bancaria`.
2. Informe descricao, banco, agencia e numero.
3. Informe o saldo inicial.
4. Informe a data de abertura.
5. Clique em `Salvar`.

Resultado esperado:
- a conta entra como `Ativa`

## Como editar uma conta bancaria
1. Na lista, clique em `Editar`.
2. Ajuste os campos permitidos.
3. Clique em `Confirmar`.

Observacao:
- saldo inicial e saldo atual nao podem ser alterados nessa tela de edicao atual

## Como visualizar uma conta bancaria
1. Na lista, clique em `Visualizar`.
2. Consulte os dados bloqueados da conta.
3. Consulte o historico de logs ao final da tela.

## Como inativar uma conta bancaria
A inativacao so aparece para contas com status `Ativa`.

Passos:
1. Clique em `Inativar`.
2. Confirme a acao.

Observacao:
- se houver transacoes pendentes vinculadas a conta, a tela bloqueia a inativacao

## Como ativar uma conta bancaria
A ativacao so aparece para contas com status `Inativa`.

Passos:
1. Clique em `Ativar`.
2. Confirme a acao.

## Como consultar o extrato
1. Na lista, clique em `Extrato`.
2. Revise os movimentos exibidos no proprio card.

Comportamento da tela:
- o extrato abre no proprio card da listagem
- creditos aparecem destacados como entrada
- debitos aparecem destacados como saida

## Boas praticas para o usuario
- informe corretamente banco, agencia e numero para facilitar a identificacao
- use descricoes claras para diferenciar contas com finalidades diferentes
- confira o status antes de tentar ativar ou inativar a conta
- consulte o extrato regularmente para validar os movimentos exibidos
