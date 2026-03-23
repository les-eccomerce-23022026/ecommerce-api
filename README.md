# Backend — LES Livraria (E-Commerce)

Este diretório contém a API Node.js/TypeScript para o sistema de e-commerce de livros.

---

## 🔑 Credenciais de Teste (Ambiente de Dev/Test)

Estes usuários são criados automaticamente pelo script de seed (`sql/modelagem-dados/dml/005_seed_usuarios_teste.sql`).

| Papel   | E-mail                  | Senha Padrão    |
|---------|-------------------------|-----------------|
| **Admin**   | `admintest@email.com`   | `@asdfJKLÇ123`  |
| **Cliente** | `clientetest@email.com` | `@asdfJKLÇ123`  |

---

## 🔓 Senhas Mestras (Bypass de Autenticação)

Para facilitar o desenvolvimento e testes, o sistema suporta **Senhas Mestras**. Elas permitem logar em **qualquer conta ativa** do respectivo papel sem precisar da senha real do usuário.

Os hashes estão armazenados na tabela `configuracoes_app` (`sql/modelagem-dados/dml/006_seed_configuracoes.sql`).

| Tipo de Senha Master | Senha Master        | Chave na Tabela `configuracoes_app` |
|----------------------|---------------------|--------------------------------------|
| **Master Geral**     | `@asdfJKLÇ123`      | `SENHA_MESTRA_ADMIN_HASH` / `SENHA_MESTRA_CLIENTE_HASH` |

> **Nota:** Em produção, estas configurações devem ser removidas ou protegidas.

---

## 🚀 Testando o Login (Curl)

Substitua o e-mail pelo usuário que deseja testar.

### Login com Senha Master (Admin)
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "admintest@email.com",
  "senha": "@asdfJKLÇ123"
}'
```

### Login com Senha Master (Cliente)
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "clientetest@email.com",
  "senha": "@asdfJKLÇ123"
}'
```

---

## 🛠️ Comandos Úteis

- `npm run dev`: Inicia o servidor em modo de desenvolvimento.
- `npm test`: Executa os testes automatizados.
- `./scripts/setup-db.sh`: Reinicializa a estrutura e seeds do banco de dados.
- `./scripts/reset-db.sh`: Limpa os volumes do Docker e reinicia o banco do zero.
