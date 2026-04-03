---
name: react-native-uix
description: Execucao de UIX para React Native no Web, Android e iOS. Usar ao desenhar ou revisar interface, hierarquia visual, responsividade, acessibilidade, navegacao percebida, estados de tela, formularios e consistencia de design system entre plataformas.
---

# React Native UIX

Seguir este fluxo para entregar qualidade de experiencia e interface em nivel de producao para React Native + Web.

## 1) Comecar pelo contexto
- Mapear jornada de uso, rota, layout principal e pontos de acao antes de alterar UI.
- Identificar diferencas de interacao entre Web, Android e iOS antes de propor mudancas.
- Preservar regras de dominio e i18n; ajustar apenas apresentacao e fluxo de interface.

## 2) Definir estrategia de UIX
- Priorizar melhorias incrementais de usabilidade em vez de redesign amplo.
- Reutilizar componentes compartilhados do design system antes de criar novos.
- Separar ajustes por plataforma apenas quando houver ganho real de UX nativa.

## 3) Padroes de UIX
- Construir hierarquia clara de informacao: titulo, contexto, acao e feedback.
- Preservar layout responsivo com espacamento adequado, tipografia legivel e alvos de toque confortaveis.
- Evitar clipping/overflow em telas pequenas e evitar tamanhos fixos que quebrem no web ou Android.
- Garantir que teclado, foco e interacoes de formulario sejam usaveis no web e no nativo.
- Manter estados explicitos: carregando, vazio, sucesso, erro e desabilitado.

## 4) Navegacao e formularios
- Garantir caminhos de ida e volta coerentes entre lista, detalhe e edicao.
- Tornar validacoes visiveis no campo correto com mensagem clara e acionavel.
- Evitar fluxo que dependa de tentativa e erro para o usuario concluir tarefa.

## 5) Performance e confiabilidade
- Manter interacoes fluidas com feedback imediato de toque/clique e transicao.
- Usar skeleton/loading de forma previsivel para reduzir sensacao de espera.
- Exibir erros de forma contextual na tela, evitando excesso de alertas modais.

## 6) Gates de qualidade
- Validar contraste, foco, navegacao por teclado e area de toque minima.
- Validar estados: carregando, vazio, sucesso, erro e desabilitado.
- Verificar consistencia textual de rotulos, placeholders e mensagens.
- Testar no web e em pelo menos um alvo mobile antes de finalizar.

## 7) Checklist de entrega
- Confirmar consistencia visual com paleta/tokens do projeto.
- Confirmar legibilidade e clareza dos caminhos principais de uso.
- Confirmar que o fluxo pode ser concluido sem ambiguidade pelo usuario.
- Fornecer resumo das mudancas de UIX, riscos e pontos de validacao.
