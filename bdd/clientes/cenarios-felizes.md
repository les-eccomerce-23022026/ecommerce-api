# Cenários BDD – Clientes (Registro) – Sucesso

## Endpoint

- `POST /api/clientes/registro`

---

## Cenários de sucesso

### Registro de cliente com dados válidos

- **Dado** que não existe usuário com o email ou CPF informados
- **Quando** é enviado `POST /api/clientes/registro` com corpo contendo `nome`, `cpf`, `email`, `senha`, `confirmacao_senha` válidos (senha forte e confirmação igual à senha)
- **Então** a resposta tem status `201`
- **E** o corpo é JSON padronizado com `sucesso: true` e `dados` contendo `uuid`, `nome`, `email`, `cpf`, `role`
