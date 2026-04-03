---
name: react-native-senior
description: Engenharia senior de React Native para Web, Android e iOS. Usar ao implementar ou revisar funcionalidades, arquitetura, integracao com API, gerenciamento de estado, navegacao, performance, confiabilidade e qualidade de testes em apps multiplataforma.
---

# React Native Senior

Seguir este fluxo para entregar implementacoes robustas em React Native + Web.

## 1) Comecar pelo contexto tecnico
- Mapear rota, arvore de componentes, hooks, servicos e dependencias de estado.
- Identificar impacto por plataforma antes de alterar arquitetura ou logica.
- Preservar regras de negocio e chaves de i18n salvo mudanca explicita.

## 2) Definir estrategia de implementacao
- Priorizar mudancas incrementais e reversiveis em vez de reescritas amplas.
- Reutilizar modulos compartilhados e evitar duplicacao de regra.
- Manter acoplamento baixo entre tela, logica e camada de dados.

## 3) Padroes de engenharia
- Usar contratos tipados para payloads de API e modelos internos.
- Isolar efeitos colaterais em hooks/servicos; telas devem orquestrar fluxo.
- Proteger fluxos assincronos contra loops, stale closures e race conditions.
- Aplicar permissoes e feature flags antes de expor acoes sensiveis.

## 4) Integracao e dados
- Validar obrigatoriedade, enums e formatos esperados pela API.
- Centralizar parse/formatacao de data, numero e moeda por locale.
- Tratar erros com feedback claro e fallback seguro de execucao.

## 5) Performance e confiabilidade
- Reduzir rerenders com props estaveis, memoizacao e particionamento.
- Virtualizar listas longas e manter latencia baixa de interacao.
- Evitar chamadas redundantes e leaks em ciclos de montagem/desmontagem.

## 6) Gates de qualidade
- Adicionar ou atualizar testes unitarios para comportamento alterado.
- Cobrir validacoes, fluxo condicional e transicoes de estado criticas.
- Verificar cobertura de i18n para novos textos.
- Validar no web e em pelo menos um alvo mobile antes de finalizar.

## 7) Checklist de entrega
- Confirmar ausencia de mocks quando a funcionalidade exigir API real.
- Confirmar aderencia a regras de negocio e contratos de integracao.
- Confirmar que mudancas nao introduzem regressao funcional.
- Fornecer resumo tecnico, riscos e proximos passos de verificacao.
