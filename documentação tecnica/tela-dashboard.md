# Tela de Dashboard

## Objetivo
Documentar o comportamento atual do front-end da dashboard e o contrato de dados necessario para integrar a tela com API.

Arquivo principal:
- `app/principal/index.tsx`

## Rota do front
- tela principal da dashboard: `/principal`
- documentacao do modulo: `/principal/documentacao`

## Estrategia atual da tela
No estado atual do front, a dashboard monta os widgets a partir de:
- lista de despesas (`GET /financeiro/despesas`)
- lista de receitas (`GET /financeiro/receitas`)
- lista de reembolsos (`GET /financeiro/reembolsos`)

Nao existe chamada para endpoint consolidado de dashboard no estado atual.
Nao existe carga dedicada de estornos no estado atual.
Nao existe carga de saldo pronto de conta/cartao no estado atual.

## Estrutura esperada de transacao
Campos consumidos no mapeamento atual (`mapearTransacoesApiParaDashboard`):
- `id` (fallback para indice)
- `valor` (fallback: `valorLiquido` ou `valorTotal`, senao `0`)
- `descricao` (fallback: `titulo`)
- `dataEfetivacao` (fallback: `dataLancamento` ou `data`)
- `tipoPagamento` / `tipoRecebimento` (normalizado para codigo interno)
- `contaBancaria` (opcional)
- `cartao` (opcional)
- `area` (fallback: `categoria`)
- `subarea` (fallback: `descricao` ou `titulo`)

Campos derivados no front:
- `tipo`: definido pelo endpoint de origem (`despesa`, `receita` ou `reembolso`)
- `codigoPagamento`: mapeado para `CARTAO_CREDITO`, `PIX`, `TRANSFERENCIA`, `BOLETO` ou `DINHEIRO`
- `tipoPagamento`: texto i18n a partir do `codigoPagamento`

## Regras do front para pagamento e cartao
- a coluna `Cartao` da widget `Ultimas Transacoes` so deve exibir valor quando `codigoPagamento = CARTAO_CREDITO`
- para outros tipos de pagamento / recebimento, a coluna deve exibir `-`
- `tipoPagamento` e exibido como texto diretamente na grid

## Estrutura do balanco no front
O balanco geral e calculado localmente a partir de `transacoes`:
- para `contaBancaria`: soma por nome da conta
- para `cartao`: soma por nome do cartao
- regra de sinal: `despesa` subtrai, demais tipos somam

Regras de exibicao:
- `tipo = conta` usa traducao de conta bancaria no card
- `tipo = cartao` usa traducao de cartao no card
- saldo positivo e destacado como sucesso
- saldo negativo e destacado como erro

## Widgets e regras atuais da dashboard

### 1. Resumo Financeiro
Calculado pelo front a partir de todas as transacoes carregadas.

Valores exibidos:
- total de receitas
- total de despesas
- total de reembolsos
- total de estornos
- saldo

Formula do saldo atual:

```txt
saldo = receitas + reembolsos + estornos - despesas
```

### 2. Grafico por Area e Subarea - Receitas
Calculado pelo front a partir das transacoes com `tipo = receita`.

Regras:
- agrupa por `area + subarea`
- ordena por maior volume total
- exibe no maximo 30 combinacoes
- o grafico usa `PieChart`
- a lista lateral e apenas visual no estado atual

### 3. Grafico por Area e Subarea - Despesas
Calculado pelo front a partir das transacoes com `tipo = despesa`.

Regras:
- agrupa por `area + subarea`
- ordena por maior volume total
- exibe no maximo 30 combinacoes
- o grafico usa `PieChart`
- a lista lateral e apenas visual no estado atual

### 4. Grafico Anual
Calculado pelo front a partir das transacoes do ano atual.

Series exibidas:
- receitas
- despesas
- reembolsos
- estornos

Regras:
- o grafico ocupa toda a largura util da widget
- o usuario pode ativar e desativar series individualmente
- o front nao permite desligar todas as series ao mesmo tempo
- o tooltip do ponto usa os dados do mes selecionado
- como nao ha carga dedicada de estornos na tela, a serie de estornos tende a permanecer zerada

### 5. Ultimas Transacoes
Regras atuais:
- exibe no maximo 100 transacoes
- ordenacao atual: data mais recente primeiro
- colunas atuais:
  - `ID`
  - `Tipo`
  - `Valor`
  - `Descricao`
  - `Data`
  - `Pagamento / Recebimento`
  - `Conta Bancaria`
  - `Cartao`
  - `Area / Subarea`

### 6. Balanco Geral
Regras atuais:
- exibe contas e cartoes no mesmo bloco
- saldo e recalculado no front a partir das transacoes carregadas
- itens sem `contaBancaria` e sem `cartao` nao entram no balanco

## Reordenacao de widgets
A dashboard permite reordenacao de widgets por dois meios:
- botoes de mover para cima e para baixo
- drag and drop na web

Regras do front:
- a ordem e mantida apenas em memoria na tela no estado atual
- ainda nao existe persistencia em API da ordenacao do usuario

## Regras de formatacao
- valores devem chegar como numero e o front aplica formatacao por idioma
- datas devem chegar em ISO `yyyy-MM-dd` e o front aplica formatacao por idioma
- a tela suporta `pt-BR`, `en` e `es`

## Regras importantes para integracao
- evitar enviar valores monetarios formatados como string
- evitar enviar datas em formato local como `24/03/2026`
- `descricao`, `tipoPagamento`, `area` e `subarea` podem vir como texto final de exibicao
- se optar por enviar codigos em vez de texto final, o front precisara de dicionario de traducao adicional

## Fora do escopo atual da tela
- filtros locais na dashboard
- persistencia da ordem das widgets por usuario
- drill-down de pontos do grafico anual
- clique funcional nas legendas da widget de area e subarea
