---
name: react-native-senior
description: Engenharia sênior de React Native para Web, Android e iOS com foco em segurança, padronização, performance e qualidade. Usar ao implementar ou revisar funcionalidades, arquitetura, integração com API, gerenciamento de estado, navegação e confiabilidade.
---

# React Native Senior

Seguir este fluxo para entregar implementações robustas, seguras, performáticas e padronizadas.

---

## 1) Começar pelo contexto técnico

- Mapear rota, árvore de componentes, hooks, serviços e dependências de estado
- Identificar impacto por plataforma antes de alterar arquitetura ou lógica
- Preservar regras de negócio e chaves de i18n, salvo mudança explícita

---

## 2) Definir estratégia de implementação

- Priorizar mudanças incrementais e reversíveis
- Reutilizar módulos compartilhados e evitar duplicação
- Manter separação clara entre:
  - UI (componentes)
  - lógica (hooks)
  - dados (services)

---

## 3) Padrões obrigatórios de engenharia

- Usar contratos tipados (DTOs) para API e modelos internos
- Não utilizar `any` sem justificativa
- Centralizar chamadas de API em services (nunca direto na tela)
- Hooks devem conter lógica; componentes apenas orquestram
- Padronizar nomes conforme o projeto (PT-BR quando aplicável)
- Não duplicar regra de negócio entre telas

---

## 4) Segurança (OBRIGATÓRIO)

- Nunca expor:
  - tokens
  - headers sensíveis
  - dados sigilosos em logs
- Remover `console.log` do código
- Validar dados antes de enviar para a API (o front não confia no usuário)
- Sanitizar entradas quando aplicável
- Tratar erros sem vazar informações sensíveis
- Não armazenar dados sensíveis em:
  - AsyncStorage
  - qualquer storage não seguro
- Aplicar validação de permissão antes de executar ações sensíveis

---

## 5) Integração e dados

- Validar obrigatoriedade, enums e formatos conforme contrato da API
- Garantir consistência entre front e back
- Centralizar:
  - formatação de data
  - número
  - moeda
- Tratar erros com:
  - mensagem clara para o usuário
  - fallback seguro

---

## 6) Fluxos assíncronos (CRÍTICO)

- Evitar:
  - race conditions
  - stale closures
  - chamadas duplicadas
- Cancelar requests ao desmontar componente quando necessário
- Garantir estado consistente mesmo em falha

---

## 7) Performance (OBRIGATÓRIO)

- Priorizar performance em toda implementação, não apenas como otimização posterior
- Reduzir re-renders com:
  - memoização (useMemo, useCallback)
  - props estáveis
- Virtualizar listas grandes
- Evitar loops de renderização
- Evitar chamadas redundantes de API
- Garantir cleanup de efeitos (`useEffect`)
- Evitar cálculos pesados dentro do render
- Controlar dependências de hooks para evitar execuções desnecessárias

---

## 8) Performance e confiabilidade

- Garantir baixa latência de interação (UI responsiva)
- Evitar bloqueios de thread principal
- Tratar estados de loading de forma eficiente
- Garantir estabilidade mesmo sob falhas de rede

---

## 9) Gates de qualidade

- Adicionar ou atualizar testes unitários
- Cobrir:
  - validações
  - fluxos condicionais
  - estados (loading, erro, sucesso)
- Validar i18n para novos textos
- Validar funcionamento:
  - web
  - pelo menos 1 plataforma mobile

---

## 10) Compatibilidade multiplataforma (OBRIGATÓRIO)

- Garantir funcionamento consistente entre:
  - Web
  - Android
  - iOS

- Validar diferenças de comportamento entre plataformas:
  - eventos (onPress, hover, teclado)
  - navegação
  - permissões nativas
  - ciclo de vida de componentes

- Evitar uso de APIs não suportadas em todas as plataformas
- Quando necessário, tratar diferenças com:
  - `Platform.select`
  - abstrações em services/hooks

- Nunca assumir que comportamento web == mobile

- Garantir que:
  - lógica de negócio funciona igual em todas as plataformas
  - chamadas de API são consistentes
  - estados não divergem entre plataformas

- Se houver limitação por plataforma:
  - documentar claramente
  - aplicar fallback seguro

- Validar pelo menos:
  - 1 navegador (web)
  - 1 dispositivo Android
  - 1 dispositivo iOS (ou simulação)

---

## 11) Regras de alteração

- Não modificar código fora do escopo
- Não refatorar sem necessidade
- Preservar comportamento existente
- Realizar apenas as alterações mínimas necessárias

---

## 12) Checklist de entrega

- Confirmar ausência de logs de debug
- Confirmar que não há exposição de dados sensíveis
- Confirmar aderência aos padrões do projeto
- Confirmar integração correta com API
- Confirmar que não há regressão funcional
- Confirmar que não há degradação de performance
- Fornecer:
  - resumo técnico
  - riscos
  - pontos de atenção

  ---