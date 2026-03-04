# Cenários BDD – Clientes (Atualizar Perfil) – Falhas

## Endpoint

- `PUT /api/clientes/perfil` (Requer autenticação como 'cliente')

---

## Cenários de falha

### Cliente não autenticado

- **Dado** uma requisição sem token JWT no header `Authorization`
- **Quando** é enviado `PUT /api/clientes/perfil`
- **Então** a resposta tem status `401`
- **E** o corpo indica `sucesso: false` e "Token não fornecido"

### Token de admin ao invés de cliente

- **Dado** um token JWT válido, mas cujo `role` é "admin"
- **Quando** é enviado `PUT /api/clientes/perfil`
- **Então** a resposta tem status `403`
- **E** o corpo indica `sucesso: false` e "Acesso negado: Perfil insuficiente"

### Campos obrigatórios recebendo nulo ou vazio

- **Dado** um cliente autenticado
- **E** o corpo contém um nome, gênero, data_nascimento ou telefone vazio/nulo
- **Quando** é enviado `PUT /api/clientes/perfil`
- **Então** a resposta tem status `400`
- **E** o corpo indica os erros de validação correspondentes
