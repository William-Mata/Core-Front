# Tela de Despesa

## O que a tela faz
A tela de despesa permite:
- consultar despesas cadastradas
- criar despesa
- editar despesa pendente
- visualizar a despesa com histórico
- efetivar despesa pendente
- cancelar despesa pendente
- estornar despesa efetivada

## Campos principais
- Descrição
- Observação
- Data de lançamento
- Data de vencimento
- Tipo de despesa
- Tipo de pagamento
- Modo da recorrência
- Recorrência
- Quantidade de recorrências
- Quantidade de parcelas, quando o pagamento for com cartão
- Valor total
- Desconto
- Acréscimo
- Imposto
- Juros
- Valor líquido
- Rateio com amigos
- Rateio por área e subárea
- Anexo de documento

## Regras importantes
- os campos obrigatórios ficam destacados quando não são preenchidos
- o valor líquido é calculado automaticamente
- o valor líquido fica bloqueado para digitação
- a data de vencimento não pode ser maior que a data de lançamento
- na efetivação, a data de efetivação não pode ser maior que a data de lançamento

## Regras da recorrência
### Despesa comum
Você escolhe:
- a frequência: única, diária, semanal, quinzenal, mensal, trimestral, semestral ou anual
- se a série é fixa ou normal

Comportamento:
- se a frequência for `Única`, a série não pode ser fixa
- se a série for `Normal`, a quantidade é obrigatória e deve ficar entre 1 e 100
- se a série for `Fixa`, a quantidade não precisa ser informada

### Despesa com cartão
Quando o tipo de pagamento for cartão:
- a tela troca recorrência por `Quantidade de parcelas`
- a recorrência é tratada como mensal
- a série fixa não se aplica

## Rateios
### Rateio com amigos
Os amigos são carregados pela API.

Você pode incluir um ou mais amigos e informar quanto cabe para cada um.

### Rateio por área e subárea
As áreas e subáreas são carregadas pela API.

Você deve escolher uma área válida e, depois, uma subárea da própria área.

## Como cadastrar
1. Clique em `Nova despesa`.
2. Preencha os campos obrigatórios.
3. Escolha o tipo de pagamento.
4. Se não for cartão, configure a recorrência.
5. Se for cartão, informe a quantidade de parcelas.
6. Preencha os rateios, se necessário.
7. Anexe documento, se houver.
8. Clique em `Salvar`.

## Como editar
- a opção de editar só aparece para despesa com status `Pendente`

## Como efetivar
- a opção de efetivar só aparece para despesa com status `Pendente`
- o valor de efetivação acompanha o valor líquido

## Como cancelar
- a opção de cancelar só aparece para despesa com status `Pendente`

## Como estornar
- a opção de estornar só aparece para despesa com status `Efetivada`
- após o estorno, a despesa volta para `Pendente`

## Observação para séries
Quando você cria uma despesa recorrente ou parcelada, o sistema confirma a primeira ocorrência e informa que as demais estão sendo geradas.