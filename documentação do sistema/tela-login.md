# Tela de Login

## Objetivo
Permitir o acesso seguro ao sistema com email e senha.

## Como usar
1. Informe o email.
2. Informe a senha.
3. Clique em `Entrar`.

## Regras da tela
- `Email` e `Senha` sao obrigatorios no login.
- O email deve estar em formato valido.
- O acesso pode ser bloqueado apos tentativas invalidas consecutivas.
- Enquanto o envio estiver carregando, campos e botoes ficam bloqueados.

## Esqueci minha senha
A tela possui a opcao `Esqueci minha senha`.

Como funciona:
1. Informe o email.
2. Clique em `Esqueci minha senha`.
3. O sistema exibe mensagem informando que as instrucoes serao enviadas se o email estiver cadastrado.

## Primeiro acesso
Quando for o primeiro acesso do usuario:
- o login direciona para a tela de criacao de senha inicial
- apos criar a senha, e necessario voltar e fazer login novamente

## Resultado esperado no login valido
- o usuario e redirecionado para a area principal do sistema
- o menu e as telas respeitam o que estiver ativo para o usuario

## Mensagens que podem aparecer
- campos obrigatorios nao preenchidos
- email invalido
- credenciais invalidas
- bloqueio temporario por tentativas
- erro de autenticacao retornado pela API
- confirmacao de recuperacao de senha