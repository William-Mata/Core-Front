# Tela de Receita

## O que a tela faz
A tela de receita permite:
- consultar receitas cadastradas
- criar receita
- editar receita pendente
- visualizar a receita com histórico
- efetivar receita pendente
- cancelar receita pendente
- estornar receita efetivada

## Campos principais
- Descrição
- Observação
- Data de lançamento
- Data de vencimento
- Tipo de receita
- Tipo de recebimento
- Conta bancária, quando aplicável
- Modo da recorrência
- Recorrência
- Quantidade de recorrências
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
- quando o tipo de recebimento for `Pix` ou `Transferência`, a conta bancária passa a ser obrigatória

## Regras da recorrência
Você escolhe:
- a frequência: única, diária, semanal, quinzenal, mensal, trimestral, semestral ou anual
- se a série é fixa ou normal

Comportamento:
- se a frequência for `Única`, a série não pode ser fixa
- se a série for `Normal`, a quantidade é obrigatória e deve ficar entre 1 e 100
- se a série for `Fixa`, a quantidade não precisa ser informada

## Rateios
### Rateio com amigos
Os amigos são carregados pela API.

Você pode incluir um ou mais amigos e informar quanto foi destinado para cada um.

### Rateio por área e subárea
As áreas e subáreas são carregadas pela API.

Você deve escolher uma área válida e, depois, uma subárea da própria área.

## Como cadastrar
1. Clique em `Nova receita`.
2. Preencha os campos obrigatórios.
3. Escolha o tipo de recebimento.
4. Se o tipo exigir conta bancária, selecione a conta.
5. Configure a recorrência.
6. Preencha os rateios, se necessário.
7. Anexe documento, se houver.
8. Clique em `Salvar`.

## Como editar
- a opção de editar só aparece para receita com status `Pendente`

## Como efetivar
- a opção de efetivar só aparece para receita com status `Pendente`
- o valor de efetivação acompanha o valor líquido
- se o tipo de recebimento exigir conta bancária, ela também deve ser informada na efetivação

## Como cancelar
- a opção de cancelar só aparece para receita com status `Pendente`

## Como estornar
- a opção de estornar só aparece para receita com status `Efetivada`
- após o estorno, a receita volta para `Pendente`

## Observação para séries
Quando você cria uma receita recorrente, o sistema confirma a primeira ocorrência e informa que as demais estão sendo geradas.