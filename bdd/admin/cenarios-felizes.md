# Cenários BDD – Admin (Gestão de Administradores) – Sucesso

## Endpoints

- `GET /api/admin/administradores` (Listagem)
- `POST /api/admin/registro` (Criação)
- `PATCH /api/admin/administradores/:uuid/inativar` (Inativação)
- `PATCH /api/admin/administradores/:uuid/ativar` (Ativação)

---

## Cenários de sucesso

### Listagem de administradores por um admin logado (RF0060 / RNF0037)

- **Dado** uma requisição autenticada cujo JWT tenha claim `role == "admin"`
- **Quando** é enviado `GET /api/admin/administradores`
- **Então** a resposta tem status `200`
- **E** o corpo da resposta contém uma lista de objetos com `uuid`, `nome`, `email` e `ativo`
- **E** apenas usuários com papel de administrador são retornados

### Cadastro de novo administrador por um admin logado (RN0065 / RNF0037)

- **Dado** uma requisição autenticada cujo JWT tenha claim `role == "admin"`
- **E** os dados de entrada para o novo usuário são válidos (nome, email, cpf, senha, confirmacaoSenha)
- **Quando** é enviado `POST /api/admin/registro`
- **Então** a resposta tem status `201`
- **E** um novo usuário é criado na base de dados com campo `role = 'admin'`
- **E** a resposta retorna o DTO do novo admin criado

### Promoção de Cliente para Administrador com mesma senha (RN0074 / RN0075)

- **Dado** que já existe um usuário com o papel de `cliente` e e-mail `cliente@email.com`
- **E** uma requisição autenticada de um `admin` logado
- **E** o payload de registro de admin contém o mesmo e-mail e `usarMesmaSenha: true`
- **Quando** é enviado `POST /api/admin/registro`
- **Então** a resposta tem status `201`
- **E** um NOVO registro de usuário é criado com `role = 'admin'` e o mesmo e-mail
- **E** o hash da senha do novo registro é IDÊNTICO ao registro do cliente original

### Promoção de Cliente para Administrador com senha nova (RN0074 / RN0075)

- **Dado** que já existe um usuário com o papel de `cliente` e e-mail `cliente@email.com`
- **E** uma requisição autenticada de um `admin` logado
- **E** o payload de registro de admin contém o mesmo e-mail e `usarMesmaSenha: false`
- **E** uma nova senha válida é fornecida
- **Quando** é enviado `POST /api/admin/registro`
- **Então** a resposta tem status `201`
- **E** um NOVO registro de usuário é criado com `role = 'admin'` e o mesmo e-mail
- **E** o hash da senha do novo registro é baseado na nova senha fornecida, sendo independente do registro de cliente

### Inativar outro administrador (RF0060)

- **Dado** uma requisição autenticada cujo JWT tenha claim `role == "admin"`
- **E** o UUID fornecido pertence a outro administrador que está atualmente `ativo`
- **Quando** é enviado `PATCH /api/admin/administradores/:uuid/inativar`
- **Então** a resposta tem status `200`
- **E** o campo `ativo` do administrador alvo é alterado para `false` no banco de dados

### Ativar administrador inativo (RF0060)

- **Dado** uma requisição autenticada cujo JWT tenha claim `role == "admin"`
- **E** o UUID fornecido pertence a um administrador que está atualmente `inativo`
- **Quando** é enviado `PATCH /api/admin/administradores/:uuid/ativar`
- **Então** a resposta tem status `200`
- **E** o campo `ativo` do administrador alvo é alterado para `true` no banco de dados
