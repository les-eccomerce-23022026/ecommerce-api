# Cenários BDD – Admin (Registro) – Sucesso

## Endpoint

- `POST /api/admin/registrar` (Requer autenticação como 'admin')

---

## Cenários de sucesso

### Cadastro de novo administrador por um admin logado (RN0065 / RNF0037)

- **Dado** uma requisição autenticada cujo JWT tenha claim `role == "admin"`
- **E** os dados de entrada para o novo usuário são válidos (nome, email, cpf forte, senha, confirmacao_senha, etc.)
- **Quando** é enviado `POST /api/admin/registrar`
- **Então** a resposta tem status `201`
- **E** um novo usuário é criado na base de dados com campo `role = 'admin'`
- **E** a resposta retorna sucesso e o UUID do novo admin
