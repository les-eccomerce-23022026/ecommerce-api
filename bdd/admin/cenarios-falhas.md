# Cenários BDD – Admin (Registro) – Falhas

## Endpoint

- `POST /api/admin/registrar` (Requer autenticação como 'admin')

---

## Cenários de falha

### Tentativa de registro por cliente (RF0061)

- **Dado** uma requisição autenticada com token JWT válido, porém cujo `role` seja `"cliente"`
- **Quando** é enviado `POST /api/admin/registrar`
- **Então** a rota é bloqueada pelo `adminOnlyMiddleware`
- **E** a resposta tem status `403` indicando Acesso Negado

### Tentativa anônima de cadastro (sem token JWT)

- **Dado** uma requisição não-autenticada
- **Quando** tenta acessar o endpoint de registro de admin
- **Então** a resposta tem status `401`
- **E** informa erro de Token ausente
