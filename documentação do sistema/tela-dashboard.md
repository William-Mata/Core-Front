# Tela de Dashboard

## Objetivo
Orientar o usuario final sobre como usar a dashboard principal do sistema.

## O que a tela apresenta
A dashboard concentra as informacoes principais do sistema em widgets.

Widgets atuais:
- Resumo Financeiro
- Grafico por Area e Subarea de Receitas
- Grafico por Area e Subarea de Despesas
- Grafico Anual
- Ultimas Transacoes
- Balanco Geral

## Dados e filtros
- ao abrir a tela, o sistema carrega despesas, receitas e reembolsos
- todos os widgets usam esse mesmo conjunto de transacoes carregadas
- no estado atual, a dashboard nao possui filtros locais por periodo, descricao, tipo ou categoria

## Como usar cada widget

### 1. Resumo Financeiro
Exibe os valores consolidados das transacoes carregadas:
- receitas
- despesas
- reembolsos
- estornos
- saldo

Regra importante:
- o card de `Estornos` existe e entra no calculo do saldo, mas depende de transacoes do tipo `estorno`

Use este widget para obter uma leitura rapida da situacao financeira.

### 2. Grafico por Area e Subarea de Receitas
Exibe como as receitas estao distribuidas por area e subarea.

Como interpretar:
- cada fatia representa uma combinacao de area e subarea
- a lista lateral ajuda a identificar as categorias presentes no grafico
- o grafico mostra ate 30 combinacoes por volume total

### 3. Grafico por Area e Subarea de Despesas
Exibe como as despesas estao distribuidas por area e subarea.

Como interpretar:
- cada fatia representa uma combinacao de area e subarea
- a lista lateral ajuda a localizar categorias com maior impacto
- a lista possui rolagem quando houver muitas combinacoes
- o grafico mostra ate 30 combinacoes por volume total

### 4. Grafico Anual
Exibe a evolucao mensal do ano atual de:
- receitas
- despesas
- reembolsos
- estornos

Como usar:
1. toque ou clique no nome da serie para mostrar ou ocultar uma linha
2. toque no grafico para ver os dados do mes selecionado

Regra importante:
- o sistema sempre mantem pelo menos uma serie visivel

### 5. Ultimas Transacoes
Mostra as ultimas 100 transacoes carregadas.

Informacoes exibidas:
- identificador
- tipo
- valor
- descricao
- data de efetivacao
- pagamento / recebimento
- conta bancaria
- cartao
- area / subarea

Regra importante:
- a coluna `Cartao` so sera preenchida quando a transacao usar cartao de credito

### 6. Balanco Geral
Exibe os saldos calculados por conta bancaria e cartao a partir das transacoes carregadas.

Como interpretar:
- cada card representa uma conta bancaria ou cartao
- o valor principal mostra o saldo calculado para aquele item

## Reordenacao de widgets
A dashboard permite reorganizar a ordem das widgets.

Como usar:
- use a seta para cima para mover uma widget
- use a seta para baixo para mover uma widget
- na web, tambem existe suporte a arrastar e soltar

## Documentacao do modulo
A tela principal possui acesso rapido para a documentacao do modulo.

Como usar:
- clique em `Ver documentacao`

## Boas praticas para o usuario
- acompanhe o resumo financeiro antes de analisar os graficos detalhados
- confira a coluna `Cartao` na lista quando precisar identificar gastos ou recebimentos associados a cartao de credito
- use o grafico anual para verificar tendencia, nao apenas valor absoluto
- reorganize as widgets conforme sua prioridade de acompanhamento

## Mensagens e comportamentos esperados
- durante o carregamento inicial, cada widget exibe estado de carregamento
- quando nao houver dados suficientes, alguns widgets podem exibir menos informacoes
- os graficos de area e subarea exibem `Sem dados para exibir` quando nao houver itens
- os valores e datas seguem o idioma selecionado no sistema
- a ordem das widgets vale para a sessao atual da tela
