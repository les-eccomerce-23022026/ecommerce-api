# Cenários BDD – Clientes (Atualizar Perfil) – Sucesso

## Endpoint

- `PUT /api/clientes/perfil` (Requer autenticação como 'cliente')

---

## Cenários de sucesso

### Atualização com dados válidos

- **Dado** um cliente autenticado com token JWT válido
- **E** os dados fornecidos no corpo da requisição são válidos (nome, gênero, data_nascimento, telefone)
- **Quando** é enviado `PUT /api/clientes/perfil`
- **Então** a resposta tem status `200`
- **E** o corpo é JSON com `sucesso: true` e `mensagem: "Perfil atualizado com sucesso."`
- **E** os dados do cliente são persistidos corretamente no banco de dados, sem alterar e-mail ou senha (que possuem endpoints próprios)
