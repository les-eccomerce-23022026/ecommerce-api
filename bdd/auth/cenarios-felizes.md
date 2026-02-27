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
