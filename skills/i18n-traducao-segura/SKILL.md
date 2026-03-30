---
name: i18n-traducao-segura
description: Traduzir e manter i18n com seguranca em PT-BR, EN-US e ES-ES, corrigindo ortografia sem quebrar acentuacao nem alterar traducoes existentes sem necessidade. Use quando Codex precisar adicionar novas chaves, ajustar textos, revisar qualidade linguistica ou corrigir encoding/acentuacao em arquivos de traducao.
---

# i18n Traducao Segura

Use este fluxo para traduzir sem causar regressao de i18n.

## 1) Idiomas obrigatorios
- Sempre manter os 3 idiomas sincronizados:
  - PT-BR
  - EN-US
  - ES-ES
- Nenhuma chave nova deve ficar faltando em um dos idiomas.

## 2) Regra principal de seguranca
- Editar somente as chaves relacionadas ao pedido.
- Nao reescrever em massa arquivos inteiros de traducao.
- Nao "melhorar" chaves antigas fora do escopo sem autorizacao.
- Preservar nomes de chave, estrutura JSON/objeto e ordem logica existente.

## 3) Qualidade linguistica
- Corrigir ortografia e concordancia quando a chave estiver no escopo da tarefa.
- Manter tom e contexto funcional do sistema.
- Evitar traducao literal sem sentido de negocio.
- Em EN-US e ES-ES, preferir termos de produto consistentes com o restante do projeto.

## 4) Anti-quebra de encoding (obrigatorio)
- Salvar arquivos em UTF-8 (sem corrupcao de acentos).
- Nunca introduzir texto mojibake como: `Ã`, `Â`, `â€”`, `ï¿½`.
- Se detectar texto quebrado, corrigir para o valor legivel correto.

## 5) Processo de alteracao
1. Mapear quais chaves realmente precisam mudar.
2. Aplicar alteracao minima somente nessas chaves nos 3 idiomas.
3. Validar que nenhuma chave nao relacionada foi alterada.
4. Verificar encoding e caracteres corrompidos antes de concluir.

## 6) Validacao obrigatoria antes de finalizar
- Confirmar diff pequeno e focado no escopo.
- Confirmar inexistencia de tokens quebrados (`Ã`, `Â`, `â`, `ï¿½`).
- Confirmar que PT-BR, EN-US e ES-ES possuem as mesmas chaves para o escopo alterado.
- Confirmar que JSON/objeto continua valido.

## 7) Checklist de entrega
- Chaves alteradas listadas explicitamente.
- Traducoes apresentadas nos 3 idiomas.
- Nenhuma traducao antiga fora de escopo modificada.
- Nenhum problema de encoding introduzido.

## 8) Formato de resposta ao usuario
Sempre informar:
- quais chaves foram adicionadas/alteradas
- os novos textos em PT-BR, EN-US e ES-ES
- confirmacao de validacao anti-quebra de encoding

Se o usuario pedir traducao, executar a alteracao dos arquivos em vez de apenas sugerir texto.
