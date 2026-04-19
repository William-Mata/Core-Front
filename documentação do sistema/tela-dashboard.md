# Tela de Dashboard

## Objetivo
Orientar o usuario final sobre o que a dashboard mostra hoje e como interpretar cada bloco.

## O que a tela apresenta
- Resumo Financeiro
- Grafico por Area e Subarea de Receitas
- Grafico por Area e Subarea de Despesas
- Grafico Anual
- Ultimas Transacoes
- Balanco Geral (contas e cartoes)

## Como os dados sao carregados
- ao entrar na tela, o sistema busca despesas, receitas e reembolsos automaticamente.
- tambem busca historico de transacoes, resumo consolidado, area/subarea e saldos de contas/cartoes.
- atualmente nao existe botao de filtro dentro da dashboard.

## Como usar cada widget
### 1. Resumo Financeiro
- mostra receitas, despesas, reembolsos, estornos e saldo.

### 2. Grafico por Area/Subarea (receitas e despesas)
- mostra ate 30 combinacoes por grafico.
- clique/toque na legenda lateral para destacar itens.

### 3. Grafico Anual
- permite ligar e desligar series.
- sempre fica ao menos uma serie visivel.

### 4. Ultimas Transacoes
- mostra dados principais (id, tipo, valor, descricao, data, forma de pagamento/recebimento, conta, cartao e area/subarea).
- a coluna `Cartao` so aparece preenchida quando a transacao e por cartao de credito.

### 5. Balanco Geral
- mostra saldo atual por conta e saldo disponivel por cartao.

## Reordenacao de widgets
- use as setas de mover para cima/baixo.
- na web tambem e possivel arrastar e soltar.
- a ordem vale apenas para a sessao atual da tela.

## Mensagens e comportamento esperado
- durante carregamento, os cards exibem esqueleto.
- sem dados, os widgets exibem mensagem informativa.
- valores e datas seguem o idioma selecionado.

## Boas praticas para o usuario
- consulte primeiro o resumo para leitura rapida.
- use o grafico anual para tendencia mensal.
- valide a tabela de ultimas transacoes para auditoria rapida.
- reorganize widgets conforme sua prioridade de analise.
