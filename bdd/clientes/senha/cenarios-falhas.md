# Cenários BDD – Clientes (Alteração de Senha) – Falhas

## Endpoint

- `PATCH /api/clientes/seguranca/alterar-senha` (Requer autenticação como 'cliente')

---

## Cenários de falha

### Senha atual incorreta

- **Dado** um cliente autenticado com token válido
- **Quando** a `senha_atual` fornecida no corpo da requisição for diferente da salva no banco (após comparar os hashes)
- **Então** a resposta tem status `400`
- **E** a requisição não prossegue

### Nova senha fraca (RNF0031)

- **Dado** que a `nova_senha` não atende às regras de complexidade (mínimo 8 caracteres, maiúsculas, minúsculas, numerais e símbolos)
- **Quando** é enviado `PATCH /api/clientes/seguranca/alterar-senha`
- **Então** a resposta tem status `400`
- **E** o corpo indica `sucesso: false` relatando que a senha fornecida é muito fraca

### Erro de confirmação de senha (RNF0032)

- **Dado** que a `nova_senha` difere da `confirmacao_senha` no body da requisição
- **Quando** é enviada essa alteração de senha
- **Então** a resposta tem status `400`
- **E** a senha não é atualizada

### Nova senha igual à senha antiga

- **Dado** que a `nova_senha` informada for idêntica à `senha_atual`
- **Quando** é requisição recebida
- **Então** a resposta tem status `400`
- **E** o corpo indica que a nova senha deve ser diferente da antiga
