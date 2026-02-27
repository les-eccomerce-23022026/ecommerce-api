# Cenários BDD – Clientes (Registro) – Falhas

## Endpoint

- `POST /api/clientes/registro`

---

## Cenários de falha

### Campos obrigatórios ausentes

- **Dado** uma requisição com body incompleto
- **Quando** é enviado `POST /api/clientes/registro` sem um ou mais dos campos: `nome`, `cpf`, `email`, `senha`, `confirmacao_senha`
- **Então** a resposta tem status `400`
- **E** o corpo é JSON padronizado com `sucesso: false` e `mensagem` indicando os campos obrigatórios ausentes (ex.: lista dos campos faltando)

### Senha e confirmação não conferem

- **Dado** um body com todos os campos obrigatórios preenchidos
- **Quando** `senha` e `confirmacao_senha` são diferentes
- **Então** a resposta tem status `400`
- **E** o corpo é JSON padronizado com `sucesso: false` e `mensagem: "Senha e confirmação de senha não conferem."`

### Senha fraca

- **Dado** um body com senha que não atende aos critérios (menos de 8 caracteres, ou sem maiúscula, minúscula ou caractere especial)
- **Quando** é enviado `POST /api/clientes/registro` com essa senha
- **Então** a resposta tem status `400`
- **E** o corpo é JSON padronizado com `sucesso: false` e `mensagem` referente a senha fraca (ex.: "Senha fraca. É necessário pelo menos 8 caracteres...")

### E-mail já cadastrado

- **Dado** um usuário já cadastrado com um determinado email
- **Quando** é enviado `POST /api/clientes/registro` com o mesmo email (demais dados válidos)
- **Então** a resposta tem status `400`
- **E** o corpo é JSON padronizado com `sucesso: false` e `mensagem: "Já existe um usuário cadastrado com este e-mail."`

### CPF já cadastrado

- **Dado** um usuário já cadastrado com um determinado CPF
- **Quando** é enviado `POST /api/clientes/registro` com o mesmo CPF (demais dados válidos)
- **Então** a resposta tem status `400`
- **E** o corpo é JSON padronizado com `sucesso: false` e `mensagem: "Já existe um usuário cadastrado com este CPF."`
