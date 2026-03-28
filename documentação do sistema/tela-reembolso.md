# Tela de Reembolso

## Para que serve
A tela de Reembolso permite registrar pedidos de reembolso vinculando despesas já cadastradas no sistema.

## O que você pode fazer
- Consultar reembolsos cadastrados.
- Filtrar por ID, descrição e período.
- Criar novo reembolso.
- Editar reembolso existente.
- Remover reembolso.

## Campos do reembolso
- `Descrição` (obrigatório)
- `Solicitante`
- `Data da Solicitação`
- `Despesas Vinculadas` (obrigatório, seleção múltipla)
- `Valor Total` (calculado automaticamente)

## Regras importantes
- Não é possível salvar sem descrição.
- Não é possível salvar sem pelo menos 1 despesa vinculada.
- Uma despesa só pode estar vinculada a **um único reembolso**.
- Se tentar vincular uma despesa já usada em outro reembolso, o sistema bloqueia e informa o conflito.

## Como cadastrar um reembolso
1. Clique em `+ Novo Reembolso`.
2. Preencha a descrição.
3. Informe o solicitante.
4. Defina a data da solicitação.
5. Selecione as despesas vinculadas.
6. Confira o valor total calculado.
7. Clique em `Salvar`.

## Como editar
1. Na lista, clique em `Editar`.
2. Altere os campos necessários.
3. Clique em `Confirmar`.

## Como remover
1. Na lista, clique em `Remover`.
2. O registro será excluído.

## Dica de uso
Use os filtros para localizar rapidamente reembolsos antigos por período ou por descrição do solicitante.

