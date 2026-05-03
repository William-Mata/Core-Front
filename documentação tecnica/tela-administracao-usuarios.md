# Tela de Administracao - Usuarios

## Objetivo
Documentar o comportamento atual do front-end da tela de usuarios e o contrato de integracao com API.

Arquivo principal:
- `app/(principal)/admin/usuarios.tsx`

Servico usado:
- `src/servicos/administracao/index.ts`

## Rotas do front
- lista: `/admin/usuarios`
- novo: `/admin/usuarios?novo=1`
- edicao: `/admin/usuarios?id={id}`

## Endpoints consumidos
- `GET /api/usuarios`
- `GET /api/usuarios/{id}`
- `POST /api/usuarios`
- `PUT /api/usuarios/{id}`
- `DELETE /api/usuarios/{id}`

## Campos do formulario
- `nome` (obrigatorio)
- `email` (obrigatorio, formato valido)
- `perfil` (`USER` ou `ADMIN`)
- `status` (`true`/`false`)
- `modulosAtivos` (matriz de permissoes por modulo, tela e funcionalidade)

## Validacoes de front
- nome e email obrigatorios
- email validado por regex:
```txt
/^[^\s@]+@[^\s@]+\.[^\s@]+$/
```
- destaque visual para campos invalidos
- erros e sucessos exibidos por notificacao em tela

## Modelo de permissao esperado
```json
{
  "modulosAtivos": [
    {
      "id": "2",
      "nome": "Financeiro",
      "status": true,
      "telas": [
        {
          "id": "100",
          "nome": "Despesas",
          "status": true,
          "funcionalidades": [
            { "id": "1", "nome": "Visualizar", "status": true },
            { "id": "2", "nome": "Criar", "status": true },
            { "id": "3", "nome": "Editar", "status": true },
            { "id": "4", "nome": "Excluir", "status": false }
          ]
        }
      ]
    }
  ]
}
```

Regras no front:
- modulo inativo desativa telas e funcionalidades do modulo
- tela inativa desativa funcionalidades da tela
- o usuario consegue expandir modulo e tela para ajustar switches
- ao abrir edicao, o front busca o usuario por id e normaliza permissoes com o catalogo

## Contrato de usuario esperado pela tela
```json
{
  "id": 2,
  "nome": "William",
  "email": "william@email.com",
  "perfil": { "id": 2, "nome": "Usuario" },
  "status": true,
  "modulosAtivos": [],
  "dataCriacao": "2026-03-26T14:00:03"
}
```

Observação:
- `perfil.id` e inteiro
- `status` de modulo/tela/funcionalidade deve ser booleano

## Tratamento de erro
Padrao:
- RFC 7807

Regra do front:
- se existir `detail`, exibir `detail`
- fallback em mensagem padrao traduzida quando nao houver `detail`

## Confirmacao de acoes criticas
- A exclusao de usuario exige confirmacao explicita em modal antes da chamada `DELETE /api/usuarios/{id}`.
- A confirmacao usa:
  - titulo claro de exclusao
  - descricao contextual da entidade
  - alerta visual de impacto irreversivel
  - botoes `Cancelar` e `Excluir`
- `Cancelar` encerra o modal sem disparar requisicao de exclusao.

Escopo adicional no modulo Administracao:
- Avisos: exclusao com confirmacao antes de concluir o fluxo local da tela.
- Documentacao: exclusao com confirmacao antes de remover o registro da store.

## Filtro da listagem
- `id`: parcial textual
- `descricao`: nome e email
- `dataInicio` e `dataFim`: faixa sobre `dataCriacao`

## Testes recomendados
1. Listar usuarios via API.
2. Carregar usuario por id ao abrir edicao.
3. Bloquear salvar sem nome/email.
4. Bloquear salvar com email invalido.
5. Salvar usuario novo com payload completo, incluindo permissoes.
6. Atualizar usuario existente com payload completo.
7. Deletar usuario existente.
8. Validar propagacao de status entre modulo, tela e funcionalidade.

## Fonte no front (confirmacao critica)
- `app/(principal)/admin/usuarios.tsx`
- `app/(principal)/admin/aviso.tsx`
- `app/(principal)/admin/documento.tsx`
- `src/utils/confirmacao.ts`
- `src/componentes/comuns/ModalConfirmacao/index.tsx`

