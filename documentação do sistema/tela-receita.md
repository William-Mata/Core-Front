# Tela de Receita

## O que a tela faz
A tela de receita permite:
- consultar receitas cadastradas
- filtrar por ID, descricao e periodo
- navegar por competencia mensal
- usar competencia como referencia principal de cadastro, edicao e listagem
- criar receita
- editar receita pendente
- visualizar a receita com historico
- efetivar receita pendente
- cancelar receita pendente
- estornar receita efetivada
- aprovar receita pendente de aprovacao
- rejeitar receita pendente de aprovacao

## Campos principais
- Descricao
- Observacao
- Data de lancamento
- Data de vencimento
- Tipo de receita
- Tipo de recebimento
- Conta bancaria, quando aplicavel
- Conta destino, quando o tipo for transferencia ou pix
- Modo da recorrencia
- Recorrencia
- Quantidade de recorrencias
- Valor total
- Desconto
- Acrescimo
- Imposto
- Juros
- Valor liquido
- Rateio com amigos
- Rateio por area e subarea
- Anexo de documento

## Regras importantes
- os campos obrigatorios ficam destacados quando nao sao preenchidos
- o valor liquido e calculado automaticamente
- o valor liquido fica bloqueado para digitacao
- a competencia da receita segue o formato `yyyy-MM`
- quando nao informar competencia, o sistema usa a competencia atual
- na efetivacao, a data de efetivacao nao pode ser menor que a data de lancamento
- quando o tipo de recebimento for `Pix` ou `Transferencia`, a conta bancaria passa a ser obrigatoria
- quando o tipo de recebimento for `Transferencia` ou `Pix`, o campo `Conta destino` aparece como opcional

## Regras da recorrencia
Voce escolhe:
- a frequencia: unica, diaria, semanal, quinzenal, mensal, trimestral, semestral ou anual
- se a serie e fixa ou normal

Comportamento:
- se a frequencia for `Unica`, a serie nao pode ser fixa
- se a serie for `Normal`, a quantidade e obrigatoria e deve ficar entre 1 e 100
- se a serie for `Fixa`, a quantidade nao precisa ser informada

## Rateios
### Rateio com amigos
Os amigos sao carregados pela API.

Voce pode incluir um ou mais amigos e informar quanto foi destinado para cada um.

### Rateio por area e subarea
As areas e subareas sao carregadas pela API.

Voce deve escolher uma area valida e, depois, uma subarea da propria area.

## Como cadastrar
1. Clique em `Nova receita`.
2. Preencha os campos obrigatorios.
3. Escolha o tipo de recebimento.
4. Se o tipo exigir conta bancaria, selecione a conta.
5. Se o tipo for `Transferencia` ou `Pix`, voce pode informar `Conta destino` (opcional).
6. Configure a recorrencia.
7. Preencha os rateios, se necessario.
8. Anexe documento, se houver.
9. Clique em `Salvar`.

## Como editar
- a opcao de editar so aparece para receita com status `Pendente`

## Como efetivar
- a opcao de efetivar so aparece para receita com status `Pendente`
- o valor de efetivacao acompanha o valor liquido
- se o tipo de recebimento exigir conta bancaria, ela tambem deve ser informada na efetivacao
- a observacao da efetivacao e enviada no historico como `observacaoHistorico`
- em `Transferencia` ou `Pix`, o campo `Conta destino` tambem fica disponivel e continua opcional

## Como cancelar
- a opcao de cancelar so aparece para receita com status `Pendente`

## Como estornar
- a opcao de estornar so aparece para receita com status `Efetivada`
- apos o estorno, a receita volta para `Pendente`
- `Data de estorno` e obrigatoria
- `Data de estorno` nao pode ser menor que a data de lancamento
- se existir data de efetivacao, a data de estorno nao pode ser menor que ela
- no estorno, a observacao e enviada no historico como `observacaoHistorico`
- no estorno, o campo `Ocultar efetivacao/estorno dos registros` vem marcado por padrao
- no estorno, `Conta destino` nao e enviada

## Fluxo de aprovacao
- quando a receita estiver em `Pendente de aprovacao`, a tela exibe as acoes `Aceitar` e `Rejeitar`

## Observacao para series
Quando voce cria uma receita recorrente, o sistema confirma a primeira ocorrencia e informa que as demais estao sendo geradas.
