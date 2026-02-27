# Cenários BDD – Autenticação (Login)

## Endpoint

- `POST /api/auth/login`

---

## Cenários de sucesso

### Login com credenciais válidas

- **Dado** um usuário cadastrado com email e senha válidos
- **Quando** é enviado `POST /api/auth/login` com corpo `{ "email": "<email>", "senha": "<senha>" }`
- **Então** a resposta tem status `200`
- **E** o corpo é JSON padronizado com `sucesso: true` e `dados` contendo `token` e `user` (uuid, nome, email, cpf, role)

---

## Cenários de falha

### Email ou senha ausentes

- **Dado** uma requisição sem body ou com body incompleto
- **Quando** é enviado `POST /api/auth/login` sem `email` ou sem `senha`
- **Então** a resposta tem status `400`
- **E** o corpo é JSON padronizado com `sucesso: false` e `mensagem: "Email e senha são obrigatórios."`

### Credenciais inválidas (usuário inexistente ou inativo)

- **Dado** um email não cadastrado ou usuário inativo
- **Quando** é enviado `POST /api/auth/login` com esse email e qualquer senha
- **Então** a resposta tem status `401`
- **E** o corpo é JSON padronizado com `sucesso: false` e `mensagem: "Credenciais inválidas."`

### Credenciais inválidas (senha incorreta)

- **Dado** um usuário cadastrado com uma senha definida
- **Quando** é enviado `POST /api/auth/login` com o email correto e senha incorreta
- **Então** a resposta tem status `401`
- **E** o corpo é JSON padronizado com `sucesso: false` e `mensagem: "Credenciais inválidas."`

### Configuração de JWT ausente

- **Dado** que a variável de ambiente `JWT_SEGREDO` não está definida
- **Quando** é enviado `POST /api/auth/login` com credenciais válidas
- **Então** a resposta tem status `401`
- **E** o corpo é JSON padronizado com `sucesso: false` e `mensagem: "Configuração de JWT ausente."`
