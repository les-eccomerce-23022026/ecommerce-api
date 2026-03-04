# Cenários BDD – Clientes (Inativação de Conta) – Falhas

## Endpoint

- `DELETE /api/clientes/perfil` (Requer autenticação como 'cliente')

---

## Cenários de falha

### Cliente não autenticado

- **Dado** uma requisição sem token JWT ou token inválido
- **Quando** é enviado `DELETE /api/clientes/perfil`
- **Então** a resposta tem status `401`

### Conta já está inativa

- **Dado** um cliente com conta inativada no banco de dados (`ativo = false`)
- **E** esse cliente ainda possui um token JWT não expirado ou faz-se uma chamada direta
- **Quando** é enviado `DELETE /api/clientes/perfil` (se o middleware não bloquear antes)
- **Então** a resposta tem status `400` ou `401` (dependendo da validação)
- **E** o corpo indica `sucesso: false`
