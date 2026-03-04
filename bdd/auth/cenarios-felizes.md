# Cenários BDD – Autenticação (Login) – Sucesso

## Endpoint

- `POST /api/auth/login`

---

## Cenários de sucesso

### Login com credenciais válidas

- **Dado** um usuário cadastrado com email e senha válidos
- **Quando** é enviado `POST /api/auth/login` com corpo `{ "email": "<email>", "senha": "<senha>" }`
- **Então** a resposta tem status `200`
- **E** o corpo é JSON padronizado com `sucesso: true` e `dados` contendo `token` e `user` (uuid, nome, email, cpf, role)
- **E** o campo `user.role` é `"cliente"` ou `"admin"` conforme o perfil do usuário — **nunca ausente** (RNF0037)
- **E** a resposta não expõe nenhum campo `id` numérico sequencial (RNF0035)

### Login de administrador retorna role correto

- **Dado** um usuário cadastrado com `role = 'admin'`
- **Quando** é enviado `POST /api/auth/login` com credenciais válidas
- **Então** a resposta tem status `200`
- **E** `dados.user.role` é `"admin"`
- **E** o token JWT gerado, ao ser decodificado, contém o claim `role: "admin"` (necessário para autorização em rotas protegidas por `adminOnlyMiddleware`)
