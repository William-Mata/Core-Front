---
name: react-native-uix
description: Execução de UIX para React Native no Web, Android e iOS com foco em consistência visual, experiência do usuário, responsividade, acessibilidade e compatibilidade multiplataforma. Usar ao desenhar ou revisar interface, hierarquia visual, navegação, estados de tela e formulários.
---

# React Native UIX

Seguir este fluxo para entregar experiência e interface em nível de produção para React Native + Web.

---

## 1) Começar pelo contexto

- Mapear jornada do usuário, rota, layout principal e pontos de ação
- Identificar diferenças de interação entre Web, Android e iOS antes de propor mudanças
- Preservar regras de domínio e i18n; alterar apenas apresentação e fluxo de interface

---

## 2) Definir estratégia de UIX

- Priorizar melhorias incrementais de usabilidade
- Reutilizar componentes do design system antes de criar novos
- Evitar variações desnecessárias entre telas
- Separar comportamento por plataforma apenas quando houver ganho real de UX

---

## 3) Consistência com design system (OBRIGATÓRIO)

- Utilizar tokens do projeto:
  - cores
  - tipografia
  - espaçamento
- Não criar estilos isolados sem necessidade
- Manter padrão visual entre telas similares
- Garantir consistência de:
  - botões
  - inputs
  - cards
  - headers

---

## 4) Padrões de UIX

- Construir hierarquia clara:
  - título
  - contexto
  - ação
  - feedback
- Garantir layout responsivo com:
  - espaçamento adequado
  - tipografia legível
  - áreas de toque confortáveis
- Evitar:
  - clipping
  - overflow
  - tamanhos fixos que quebrem em diferentes telas
- Garantir usabilidade de:
  - teclado
  - foco
  - inputs
- Manter estados explícitos:
  - carregando
  - vazio
  - sucesso
  - erro
  - desabilitado

---

## 5) Navegação e formulários

- Garantir fluxo claro entre:
  - lista
  - detalhe
  - edição
- Tornar validações:
  - visíveis
  - claras
  - acionáveis
- Não depender de tentativa e erro do usuário
- Evitar múltiplos passos desnecessários

---

## 6) Compatibilidade multiplataforma (OBRIGATÓRIO)

- Garantir consistência entre:
  - Web
  - Android
  - iOS

- Adaptar interface considerando:
  - touch (mobile)
  - hover (web)
  - teclado (web)
  - safe areas (notch, status bar)

- Garantir que:
  - botões são clicáveis/tocáveis corretamente
  - inputs funcionam com teclado virtual
  - navegação não quebra entre plataformas

- Evitar componentes que não funcionem em todas plataformas sem fallback

---

## 7) Performance percebida (UX) (OBRIGATÓRIO)

- Garantir feedback imediato ao usuário:
  - clique
  - toque
  - ação executada
- Evitar travamento visual durante carregamento
- Usar:
  - loading
  - skeleton
  - estados intermediários
- Evitar ações duplicadas (ex: múltiplos cliques)
- Reduzir sensação de espera com feedback visual

---

## 8) Acessibilidade básica

- Garantir contraste adequado
- Garantir área mínima de toque
- Garantir foco visível no web
- Evitar dependência exclusiva de cor para significado

---

## 9) Gates de qualidade

- Validar:
  - contraste
  - foco
  - navegação por teclado
  - área de toque
- Validar todos os estados da tela
- Verificar consistência textual (labels, placeholders, mensagens)
- Testar:
  - web responsivo
  - pelo menos 1 dispositivo mobile

---

## 10) Regras de alteração

- Não modificar regras de negócio
- Não alterar contratos de API
- Não refatorar fora do escopo
- Realizar apenas ajustes necessários de UI/UX

---

## 11) Checklist de entrega

- Confirmar consistência com design system
- Confirmar clareza do fluxo para o usuário
- Confirmar que não há quebra entre plataformas
- Confirmar responsividade adequada
- Confirmar ausência de ambiguidade na interface
- Confirmar boa percepção de performance
- Fornecer:
  - resumo das mudanças
  - riscos
  - pontos de validação

  ---