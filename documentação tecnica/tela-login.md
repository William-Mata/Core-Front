# Tela de Login

## Objetivo
Documentar o contrato atual do front-end da tela de login para integracao com API.

Arquivo principal:
- `app/auth/entrar.tsx`

## Rotas do front
- tela de login: `/auth/entrar`
- tela de primeiro acesso: `/auth/primeiro-acesso`
- destino apos autenticacao com sucesso: `/principal`

## Campos da tela
- `email`: obrigatorio
- `senha`: obrigatorio no modo login

## Validacoes aplicadas no front
- `email` obrigatorio
- `senha` obrigatoria no login
- `email` com validacao de formato

Regex atual:
```txt
/^[^\s@]+@[^\s@]+\.[^\s@]+$/
```

## Regras de bloqueio
- existe bloqueio por tentativas invalidas
- limite atual: `5`
- apos atingir o limite, o login fica bloqueado
- no modo recuperacao (`Esqueci minha senha`), o bloqueio e limpo

## Fluxo de login em 2 etapas
### 1) Tentativa normal de login
Endpoint:
- `POST /api/autenticacao/entrar`

Payload:
```json
{
  "email": "admin@core.com",
  "senha": "1234567890"
}
```

### 2) Primeiro acesso
Se a API retornar `400` com:
- `detail = "No primeiro acesso, voce deve criar sua senha."`

o front redireciona para `/auth/primeiro-acesso` com o email informado.

Endpoint para criar senha inicial:
- `POST /api/autenticacao/criar-primeira-senha`

Payload enviado pelo front:
```json
{
  "email": "admin@core.com",
  "senha": "NovaSenha@123",
  "confirmarSenha": "NovaSenha@123"
}
```

Regra:
- apos criar senha com sucesso, o usuario deve voltar ao login e autenticar novamente.

## Recuperacao de senha
Endpoint:
- `POST /api/autenticacao/esqueci-senha`

Payload:
```json
{
  "email": "usuario@empresa.com"
}
```

Comportamento do front:
- em caso de sucesso ou falha, exibe mensagem generica de sucesso
- ao final da acao, limpa bloqueio de tentativas

## Resposta esperada em sucesso do login
```json
{
  "accessToken": "jwt",
  "refreshToken": "jwt",
  "expiracao": "2026-03-26T12:00:00Z",
  "usuario": {
    "id": 1,
    "nome": "Nome",
    "email": "email@dominio.com",
    "status": true,
    "perfil": { "id": 1, "nome": "Administrador" },
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
              { "id": "1", "nome": "Visualizar", "status": true }
            ]
          }
        ]
      }
    ]
  }
}
```

## Regras de permissao no front
- modulo, tela e funcionalidade respeitam `status` (`true`/`false`)
- itens inativos nao sao exibidos no menu
- tela de administracao nao deve aparecer para usuario comum

## Tratamento de erros
Padrao principal:
- RFC 7807 (`application/problem+json`)

Regra do front:
- se existir `detail`, exibir `detail`
- para `401` e `403`, registrar falha de tentativa
