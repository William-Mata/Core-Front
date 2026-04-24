# Tela de Reembolso

## Para que serve
Registrar reembolsos vinculando despesas ja cadastradas, com controle de status e historico.

## O que voce pode fazer
- consultar por id, descricao, periodo e competencia
- criar reembolso
- editar reembolso pendente
- efetivar reembolso pendente
- estornar reembolso efetivado
- cancelar reembolso pendente

## Campos principais
- Descricao (obrigatorio)
- Solicitante
- Data da solicitacao
- Competencia (obrigatorio)
- Tipo de recebimento
- Conta bancaria ou cartao (dependendo do tipo)
- Despesas vinculadas (obrigatorio, pelo menos uma)
- Valor total (calculado)

## Regras importantes
- a mesma despesa nao pode ser vinculada em dois reembolsos diferentes.
- efetivacao so aparece para reembolso pendente.
- estorno so aparece para reembolso efetivado.
- cancelamento so aparece para reembolso pendente.
- data de efetivacao e data de estorno nao podem ser menores que a data de solicitacao.

## Como cadastrar
1. Clique em `+ Novo Reembolso`.
2. Informe descricao, competencia e despesas vinculadas.
3. Escolha tipo de recebimento.
4. Se o tipo exigir, selecione conta bancaria ou cartao.
5. Clique em `Salvar`.

## Como efetivar
1. Abra a acao `Efetivar` de um reembolso pendente.
2. Informe a data de efetivacao.
3. Opcionalmente preencha observacao.
4. Confirme a efetivacao.

## Como estornar
1. Abra a acao `Estornar` de um reembolso efetivado.
2. Informe a data de estorno.
3. Opcionalmente preencha observacao e a opcao de ocultar no historico.
4. Confirme o estorno.

## Como cancelar
1. Clique em `Cancelar` em um reembolso pendente.
2. Confirme no modal (acao critica).
3. O status passa para `Cancelada`.

Regra importante:
- se voce escolher `Cancelar` no modal, o reembolso nao e alterado.

## Dica de uso
Use competencia e descricao para localizar rapidamente reembolsos em lotes maiores.
