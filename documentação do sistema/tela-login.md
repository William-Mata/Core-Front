# Tela de Login

## Objetivo
Permitir que o usuario acesse o sistema com email e senha.

## Como usar
1. Informe o email.
2. Informe a senha.
3. Clique em `Entrar`.

## Regras da tela
- `Email` e `Senha` sao obrigatorios.
- O email deve estar em formato valido.
- O login e bloqueado apos `5` tentativas invalidas.
- Enquanto o login estiver carregando:
  - os campos ficam bloqueados
  - o botao fica desabilitado

## Quando o login nao pode continuar
O sistema bloqueia a entrada quando:
- o email nao foi preenchido
- a senha nao foi preenchida
- o email foi digitado em formato invalido
- o limite de tentativas invalidas foi atingido

## Resultado esperado
- Quando o login for aceito, o usuario e levado para a area principal do sistema.

## Esqueci minha senha
A tela possui a opcao:
- `Esqueci minha senha`

### Como usar
1. Informe o email no campo de login.
2. Clique em `Esqueci minha senha`.

### Regras
- o email deve estar preenchido
- o email deve estar em formato valido

### Comportamento atual
- o sistema exibe uma mensagem informando que as instrucoes de recuperacao serao enviadas se o email estiver cadastrado
- no comportamento atual da tela, essa acao tambem libera novamente o login bloqueado por tentativas

## Boas praticas para o usuario
- digite o email completo
- revise a senha antes de enviar
- aguarde o carregamento terminar antes de tentar novamente

## Mensagens que o usuario pode encontrar
- campos obrigatorios nao preenchidos
- email invalido
- credenciais invalidas com contador de tentativas restantes
- bloqueio apos 5 tentativas invalidas
- falha ao fazer login
- confirmacao de recuperacao de senha

## Observacao
- nesta etapa, a documentacao cobre apenas a tela de login
- as proximas telas devem seguir o mesmo padrao de orientacao ao usuario final
