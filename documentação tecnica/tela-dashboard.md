# Tela de Dashboard

## Objetivo
Documentar o comportamento atual da dashboard e os contratos de API realmente consumidos pelo front.

## Rota do front
- tela principal: `/dashboard`
- atalho de documentacao do modulo: `/documentacao`

## Endpoints consumidos
Carga principal de transacoes:
- `GET /api/financeiro/despesas?desconsiderarCancelados=true`
- `GET /api/financeiro/receitas?desconsiderarCancelados=true`
- `GET /api/financeiro/reembolsos?desconsiderarCancelados=true`

Carga da tabela de ultimas transacoes:
- `GET /api/financeiro/historico-transacoes?quantidadeRegistros=50&ordemRegistros=MaisRecentes`

Carga do resumo financeiro:
- `GET /api/financeiro/historico-transacoes/resumo`

Carga do grafico por area e subarea:
- `GET /api/financeiro/areas-subareas/soma-rateio?tipo=Despesa`
- `GET /api/financeiro/areas-subareas/soma-rateio?tipo=Receita`

Carga do balanco geral:
- `GET /api/financeiro/contas-bancarias`
- `GET /api/financeiro/cartoes`

## Regras de montagem dos widgets
1. Resumo Financeiro
- usa prioridade do endpoint `historico-transacoes/resumo`.
- fallback local: soma de `transacoesApi`.

2. Grafico por Area/Subarea (receitas e despesas)
- usa `areas-subareas/soma-rateio`.
- consolida por par `area + subarea`.
- exibe no maximo 30 itens por grafico.

3. Grafico Anual
- monta series `receitas`, `despesas`, `reembolsos`, `estornos`.
- usuario pode ocultar/exibir series, mas o front impede ocultar todas ao mesmo tempo.

4. Ultimas Transacoes
- usa endpoint de historico e renderiza no maximo 100 linhas na UI.
- coluna `Cartao` so exibe valor quando o tipo de pagamento mapeado e cartao de credito.

5. Balanco Geral
- usa dados de contas e cartoes.
- conta usa `saldoAtual` (fallback `saldoInicial`).
- cartao usa `saldoDisponivel` (fallback `limiteDisponivel`/`limite`).

## Reordenacao de widgets
- suporta setas (todas as plataformas) e drag-and-drop na web.
- ordem e mantida apenas em memoria da tela (nao persiste em API nem storage local).

## Regras de formatacao
- datas esperadas em ISO e formatadas por locale no front.
- valores monetarios esperados como numero e formatados por locale no front.

## Regras importantes para integracao
- a dashboard ainda nao usa endpoint unico consolidado.
- para evitar inconsistencias, API deve manter semantica de tipos (`despesa`, `receita`, `reembolso`, `estorno`) entre endpoints de lista e historico.

## Fora do escopo atual da tela
- persistencia da ordem de widgets por usuario.
- filtros interativos locais por periodo/tipo diretamente na dashboard.

## Rastreabilidade no codigo
- `app/(principal)/dashboard.tsx:395`
- `app/(principal)/dashboard.tsx:434`
- `app/(principal)/dashboard.tsx:493`
- `app/(principal)/dashboard.tsx:536`
- `app/(principal)/dashboard.tsx:607`
- `src/servicos/financeiro/index.ts:505`
- `src/servicos/financeiro/index.ts:752`
- `src/servicos/financeiro/index.ts:770`
- `src/servicos/financeiro/index.ts:838`
- `src/servicos/financeiro/index.ts:892`

