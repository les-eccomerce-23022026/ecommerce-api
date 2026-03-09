# Cenários BDD – Admin (Gestão de Administradores) – Falhas

## Endpoints

- `GET /api/admin/administradores`
- `POST /api/admin/registro`
- `PATCH /api/admin/administradores/:uuid/inativar`
- `PATCH /api/admin/administradores/:uuid/ativar`

---

## Cenários de falha

### Tentativa de administração por cliente (RNF0037)

- **Dado** uma requisição autenticada com token JWT válido, porém cujo `role` seja `"cliente"`
- **Quando** tenta acessar qualquer endpoint de administração
- **Então** a rota é bloqueada pelo `adminOnlyMiddleware`
- **E** a resposta tem status `403` indicando Acesso Negado

### Tentativa anônima (sem token JWT)

- **Dado** uma requisição não-autenticada
- **Quando** tenta acessar qualquer endpoint administrativo
- **Então** a resposta tem status `401`
- **E** informa erro de Token ausente

### Administrador tenta inativar a si mesmo (Segurança)

- **Dado** uma requisição autenticada cujo JWT tenha claim `role == "admin"`
- **E** o `uuid` passado via parâmetro na rota corresponde ao `uuid` do administrador no JWT
- **Quando** é enviado `PATCH /api/admin/administradores/:uuid/inativar`
- **Então** a resposta tem status `403` indicando Proibido
- **E** o corpo da resposta informa: "um administrador não pode inativar a si mesmo"
- **E** o status do administrador no banco permanece `true`

### Registro com dados inválidos ou duplicados

- **Dado** uma requisição autenticada cujo JWT tenha claim `role == "admin"`
- **E** o e-mail ou CPF informado já existe na base de dados
- **Quando** é enviado `POST /api/admin/registro`
- **Então** a resposta tem status `400`
- **E** a mensagem informa a duplicidade ou inconsistência dos dados
