# Tela de Conta Bancaria

## Objetivo
Orientar o usuario final sobre uso da tela de conta bancaria com as regras atuais.

## O que a tela permite
- listar contas
- criar conta
- editar conta
- visualizar conta
- ativar/inativar conta
- abrir extrato mensal

## Campos principais
- Descricao
- Banco
- Agencia
- Numero
- Saldo inicial
- Data de abertura

## Regras importantes
- todos os campos acima sao obrigatorios.
- no cadastro, saldo inicial define o saldo atual inicial.
- em edicao, saldo inicial e saldo atual ficam bloqueados.

## Como usar a lista
1. Preencha filtros (id, descricao, periodo) se necessario.
2. Clique em `Consultar`.
3. Use as acoes do card: `Visualizar`, `Editar`, `Ativar/Inativar`, `Extrato`.

## Como ativar/inativar
- inativar: apenas quando a conta estiver ativa e sem pendencias.
- ativar: apenas quando a conta estiver inativa.
- ao inativar, o sistema sempre abre confirmacao obrigatoria antes de concluir.
- se voce clicar em `Cancelar`, a conta nao e inativada.

## Como consultar extrato
1. Clique em `Extrato` no card da conta.
2. Navegue entre meses pelas setas.
3. Veja total do periodo e os lancamentos do mes.

## Boas praticas
- mantenha descricao clara para diferenciar contas.
- revise periodicamente o extrato mensal.
- valide status da conta antes de acionar operacoes financeiras.
