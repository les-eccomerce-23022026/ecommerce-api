# Cenários BDD – Clientes (Inativação de Conta) – Sucesso

## Endpoint

- `DELETE /api/clientes/perfil` (Requer autenticação como 'cliente')

---

## Cenários de sucesso

### Inativação de conta com sucesso

- **Dado** um cliente autenticado com token JWT válido e ativo no banco de dados (`ativo = true`)
- **Quando** é enviado `DELETE /api/clientes/perfil`
- **Então** a resposta tem status `200` ou `204`
- **E** o banco de dados marca o registro com `ativo = false` (soft delete)
- **E** os dados do usuário NÃO são removidos fisicamente do banco de dados
