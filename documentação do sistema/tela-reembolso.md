# Tela de Reembolso

## Para que serve
A tela de Reembolso permite registrar pedidos de reembolso vinculando despesas ja cadastradas no sistema.

## O que voce pode fazer
- consultar reembolsos cadastrados
- filtrar por ID, descricao e periodo
- criar novo reembolso
- editar reembolso pendente
- efetivar reembolso pendente
- estornar reembolso efetivado
- cancelar reembolso pendente

## Campos do reembolso
- `Descricao` (obrigatorio)
- `Solicitante`
- `Data da Solicitacao`
- `Despesas Vinculadas` (obrigatorio, selecao multipla)
- `Valor Total` (calculado automaticamente)
- `Valor Efetivacao` (bloqueado na efetivacao)

## Regras importantes
- nao e possivel salvar sem descricao
- nao e possivel salvar sem pelo menos 1 despesa vinculada
- uma despesa so pode estar vinculada a um unico reembolso
- se tentar vincular uma despesa ja usada em outro reembolso, o sistema bloqueia e informa o conflito
- apenas reembolso `Pendente` pode ser editado
- apenas reembolso `Pendente` pode ser efetivado
- apenas reembolso `Efetivada` pode ser estornado
- apenas reembolso `Pendente` pode ser cancelado

## Como cadastrar um reembolso
1. Clique em `+ Novo Reembolso`.
2. Preencha a descricao.
3. Informe o solicitante.
4. Defina a data da solicitacao.
5. Selecione as despesas vinculadas.
6. Confira o valor total calculado.
7. Clique em `Salvar`.

## Como editar
1. Na lista, clique em `Editar`.
2. Altere os campos necessarios.
3. Clique em `Confirmar`.

## Como efetivar
1. Na lista, clique em `Efetivar`.
2. Revise data, valor total e valor de efetivacao.
3. Clique em `Confirmar efetivacao`.

## Como estornar
1. Na lista, clique em `Estornar`.
2. O status volta para `Pendente`.

## Como cancelar
1. Na lista, clique em `Cancelar`.
2. Confirme a acao no modal exibido.
3. O status do reembolso passa para `Cancelada`.

## Dica de uso
Use os filtros para localizar rapidamente reembolsos por periodo, descricao ou solicitante.
