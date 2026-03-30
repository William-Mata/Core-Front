---
name: sdet-react-native-tests
description: Planejar, criar e manter testes de qualidade SDET para apps React Native (Web, Android e iOS), incluindo testes unitarios, integracao, contrato e regressao. Use quando Codex precisar aumentar cobertura com confiabilidade, reduzir flakiness, validar regras de negocio, hooks, servicos, navegacao, formularios, estados de tela e integracoes de API com melhores praticas.
---

# SDET React Native Tests

Use este fluxo para criar testes robustos e de alta manutencao para React Native.

## 1) Definir estrategia de teste antes de codar
- Mapear risco funcional: regra critica, fluxo financeiro, autenticacao, permissao, status e calculos.
- Escolher nivel correto por objetivo:
  - unitario: funcoes puras, utils, validadores, mapeamentos, reducers e hooks isolados
  - integracao: tela + hooks + servicos mockados + interacao do usuario
  - contrato: estrutura de payload/resposta e enums esperados do backend
  - regressao: bugs corrigidos que nao podem voltar
- Evitar escrever apenas teste de snapshot sem valor comportamental.

## 2) Priorizar testes por impacto
- Cobrir primeiro caminhos criticos de negocio.
- Garantir cenarios de sucesso, erro, vazio, loading e desabilitado.
- Validar condicoes de borda: nulo, vazio, limite numerico, data invalida e status inesperado.
- Garantir que validacoes de formulario testem mensagem e bloqueio de acao.

## 3) Padroes tecnicos obrigatorios
- Usar testes deterministas; nao depender de horario real, locale real ou rede real.
- Mockar tempo, uuid, random, Date.now e chamadas externas quando necessario.
- Isolar dependencias externas em mocks claros e com reset entre casos.
- Nao compartilhar estado global entre testes.
- Nomear casos pelo comportamento esperado, nao pela implementacao interna.

## 4) Boas praticas para React Native
- Preferir React Native Testing Library para interacao de tela.
- Testar por papel/comportamento visivel (texto, acao, feedback), nao por detalhes de implementacao.
- Cobrir navegacao relevante (entrada, retorno, params e guardas).
- Validar acessibilidade quando houver labels, hints e estados de disabled.
- Em listas, testar renderizacao minima, atualizacao e item-press sem acoplar ao layout interno.

## 5) API, servicos e contratos
- Validar mapeamento entre resposta da API e modelo usado na UI.
- Testar tratamento de erro por status (ex.: 400, 401, 403, 404, 500).
- Garantir cobertura de campos obrigatorios e enums do contrato esperado pelo front.
- Adicionar testes de regressao para falhas de integracao ja ocorridas.

## 6) Qualidade e anti-flaky
- Evitar timers reais e waits arbitrarios; usar waits orientados ao comportamento.
- Nao usar sleep fixo.
- Reduzir asserts redundantes e focar no resultado funcional.
- Garantir limpeza de mocks/spies no afterEach.
- Se um teste falhar de forma intermitente, corrigir causa raiz antes de aumentar timeout.

## 7) Cobertura minima recomendada
- Cobertura de linhas e branches deve priorizar modulos criticos, nao apenas percentual global.
- Para modulo alterado, buscar cobertura alta em regras de negocio e validacoes.
- Sempre incluir pelo menos um teste negativo para cada regra critica alterada.

## 8) Checklist de entrega
1. Testes novos/ajustados cobrem sucesso, erro e borda da mudanca.
2. Nao ha dependencia de ambiente externo imprevisivel.
3. Mocks foram limpos e nao contaminam outros testes.
4. Mensagens e validacoes estao verificadas quando aplicavel.
5. Suite relacionada roda localmente sem flakiness.
6. Riscos residuais e lacunas de cobertura foram reportados no resumo final.

## 9) Formato de resposta ao usuario
- Sempre informar:
  - o que foi testado
  - quais riscos foram mitigados
  - o que ficou fora e por que
  - proximos testes recomendados (se houver)

Se o usuario pedir para implementar testes, executar a implementacao em vez de apenas sugerir casos.
