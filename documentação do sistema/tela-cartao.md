# Tela de Cartao

## Objetivo
Orientar o usuario final sobre o uso da tela de cartao com as regras atuais.

## O que a tela permite
- listar cartoes
- criar cartao
- editar cartao
- visualizar cartao
- ativar/inativar cartao
- abrir detalhe mensal (fatura para credito, extrato para debito)

## Campos principais
- Descricao
- Bandeira
- Tipo
- Saldo disponivel
- Limite (somente credito)
- Dia de vencimento (somente credito)
- Data de vencimento do cartao (somente credito)

## Regras importantes
- no cadastro, saldo disponivel e obrigatorio.
- em edicao, saldo disponivel fica bloqueado.
- cartao de credito exige limite e vencimentos.
- cartao de debito nao usa campos de vencimento.

## Como usar a lista
1. Preencha filtros (id, descricao, periodo) se necessario.
2. Clique em `Consultar`.
3. Use as acoes do card: `Visualizar`, `Editar`, `Ativar/Inativar`, `Fatura/Extrato`.

## Como inativar/ativar
- inativar: apenas quando cartao esta ativo e sem pendencias.
- ativar: apenas quando cartao esta inativo.
- ao inativar, o sistema sempre abre confirmacao obrigatoria antes de concluir.
- se voce clicar em `Cancelar`, o cartao nao e inativado.

## Como consultar fatura ou extrato
- em credito, a tela mostra fatura mensal com status.
- em debito, mostra extrato mensal.
- use as setas para mudar o mes.

## Acoes adicionais em fatura (credito)
- se status permitir, a tela mostra `Efetivar`.
- se status estiver efetivada, a tela mostra `Estornar`.

## Boas praticas
- escolha corretamente o tipo antes de salvar.
- revise limite e vencimentos em cartao de credito.
- acompanhe mensalmente fatura/extrato para evitar divergencias.
