# Cenários BDD – Clientes (Alteração de Senha) – Sucesso

## Endpoint

- `PATCH /api/clientes/seguranca/alterar-senha` (Requer autenticação como 'cliente')

---

## Cenários de sucesso

### Alteração de senha válida

- **Dado** um cliente autenticado
- **E** ele informa sua senha atual corretamente (`senha_atual`)
- **E** informa uma nova senha forte (`nova_senha`) e sua confirmação (`confirmacao_senha`), sendo ambas idênticas
- **Quando** é enviado `PATCH /api/clientes/seguranca/alterar-senha`
- **Então** a resposta tem status `200`
- **E** a nova senha substitui a antiga no banco de dados, sendo hasheada com BCrypt (custo >= 12) antes de salva
- **E** o corpo indica `sucesso: true` e `mensagem: "Senha alterada com sucesso."`
