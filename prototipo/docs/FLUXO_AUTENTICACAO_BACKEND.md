# Especificação do Fluxo de Autenticação e Registro para o Backend

Este documento descreve os fluxos e a estrutura de dados (JSON) esperados para a etapa de autenticação (Login), controle de permissões (RBAC) e de registro (Create Account), servindo como guia de implementação para a equipe de Engenharia de Software Backend.

---

## 1. Fluxo e Dados de Autenticação (Login)

Quando o usuário tenta se logar ou acessar o sistema, a comunicação entre o frontend (React) e a API (Backend) funcionará da seguinte forma:

### Passo A: Frontend envia Credenciais para o Backend
O cliente irá inserir o e-mail (ou CPF) e a senha na tela (`LoginArea.tsx`).

**JSON de Envio (Request)**
`POST /api/auth/login`
```json
{
  "email": "joao.comprador@email.com",
  "senha": "password123"
}
```
*(Nota: a UI permite digitar CPF no mesmo campo. Para suportar isso formalmente, pode-se trocar a chave para `"identificador": "cpf-ou-email"` no contrato. No protótipo atual, o frontend envia sempre `email`.)*

### Passo B: Backend Valida os Dados e Retorna o Perfil de Autorização
O backend valida as credenciais no banco de dados e retorna os dados do usuário. A propriedade mais crítica é a `role` (Cargo/Perfil) ou `permissoes`, responsável por separar os compradores normais dos donos do e-commerce.

**JSON de Resposta de Sucesso (Response) (Status 200 OK) para Cliente:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "uuid": "uuid-do-cliente-1234",
    "nome": "João Comprador",
    "email": "joao.comprador@email.com",
    "cpf": "123.456.789-00",
    "role": "cliente"
  }
}
```

**JSON de Resposta de Sucesso para um Administrador:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "uuid": "uuid-do-admin-9999",
    "nome": "Administrador do Sistema",
    "email": "admin@livraria.com.br",
    "cpf": "000.111.222-33",
    "role": "admin"
  }
}
```

O Frontend lê a chave `"role"` (por exemplo, usando o `authSlice.ts` no Redux):
- **Se `role === 'cliente'`**, o usuário tem acesso apenas ao catálogo público (`/`), às rotas de compra (`/carrinho`, `/checkout`) e ao painel das próprias compras.
- **Se `role === 'admin'`**, o usuário ganha acesso para visitar a rota administrativa (`/admin`), onde as funcionalidades de backoffice (controle de estoque, gráficos, listagem e cadastro de produtos) estão abertas e ativas.

---

## 2. Fluxo e Dados de Registro do Cliente (Cadastro Real)

A funcionalidade "Criar Nova Conta" inicializa o cadastro de um comprador final.

### Passo A: Cadastro Público na Plataforma
Quando um usuário comprador finaliza o formulário público de cadastro, o React envia ao backend os dados brutos e senhas. 

**JSON de Envio do Registro (Request)**
`POST /api/clientes/registro`
```json
{
  "nome": "João Silva",
  "genero": "M",
  "data_nascimento": "1990-05-15",
  "cpf": "123.456.789-00",
  "telefone": {
    "tipo": "CELULAR",
    "ddd": "11",
    "numero": "98888-7777"
  },
  "email": "joao.comprador@email.com",
  "senha": "Password@123",
  "confirmacao_senha": "Password@123",
  "endereco_residencial": {
    "tipo_residencia": "CASA",
    "tipo_logradouro": "RUA",
    "logradouro": "Avenida Paulista",
    "numero": "1000",
    "bairro": "Bela Vista",
    "cep": "01310-100",
    "cidade": "São Paulo",
    "estado": "SP",
    "pais": "Brasil"
  }
}
```

**Observação (protótipo atual do frontend):** a tela `LoginArea` hoje envia um payload reduzido para `POST /api/clientes/registro`:
```json
{
  "nome": "João Silva",
  "cpf": "123.456.789-00",
  "email": "joao.comprador@email.com",
  "senha": "Password@123",
  "confirmacao_senha": "Password@123"
}
```
Se o backend for implementar o contrato completo (com `genero`, `data_nascimento`, `telefone`, `endereco_residencial`), o frontend precisará estender o formulário e a tipagem para cumprir os requisitos (RN0026 / RNF0031-0033).

### 🔒 Regras de Segurança e Validação (RNF0031, RNF0032, RNF0033)
- **Senha Forte (RNF0031):** O backend deve rejeitar senhas que não contenham pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas e caracteres especiais.
- **Criptografia (RNF0033):** Toda senha deve ser armazenada utilizando algoritmos de Hash (ex: BCrypt). **Nunca armazenar senhas em texto plano**.
- **Role Enforcement:** O frontend **NÃO DEVE ENVIAR** o parâmetro `"role"` pela requisição de cadastro da rota pública. O Backend deve forçar a atribuição automática da role `'cliente'`.

---

## 3. Cadastro de Perfil de Administradores

Sendo o cadastro público exclusivamente dedicado à criação de clientes, a lógica para cadastro de novos administradores é fortemente restrita.

### 🔒 Regra de Negócio Crítica de Administradores
- Um "admin" nunca poderá ser criado por rotas públicas de registro (`/api/clientes/registro`).
- **Somente o administrador logado e previamente autenticado no sistema tem a permissão de registrar e conferir privilégios a outros administradores.**
- Esta funcionalidade acontecerá em uma rota fechada (ex: `POST /api/admin/registro`) e exigirá a apresentação de um Token JWT válido com a claim de `role: "admin"` provida através do header `Authorization` na requisição.
- O frontend deve enviar `Authorization: Bearer <token>` e o backend deve validar a role via token.
- Mesmo na rota de admin, prefira que o backend **force** `role = "admin"` (não confiar em `role` enviada no body).
- Alternativamente, o primeiro admin do sistema (Administrador Mestre) será cadastrado manualmente via script de inicialização do Banco de Dados (Seeders / DML Executado na base de Produção).

---

## 4. Atualização e Exclusão de Contas (CRUD de Clientes)

A gestão dos próprios dados é um direito do cliente, no entanto, cercada por regras rígidas de segurança para garantir a autenticidade e a proteção de dados.

### 🔒 Regras de Negócio para Atualização e Exclusão (RF0022, RF0023, RF0028):
- **Atualização de Dados (RF0022):** O cliente só pode atualizar seus próprios dados se estiver autenticado.
- **Alteração de Senha (RF0028):** Deve existir uma rota específica que permita ao cliente alterar apenas a senha sem necessidade de reenviar todos os dados cadastrais.
- **Inativação vs Exclusão (RF0023):** Seguindo o requisito **RF0023**, a "exclusão" solicitada pelo cliente deve ser tratada tecnicamente como uma **Inativação de Cadastro** (Soft Delete) no banco de dados, para preservar a integridade histórica de pedidos e transações financeiras.
- **Restrição a Administradores na Exclusão:** Os administradores podem inativar clientes (bloqueio), mas não podem deletar permanentemente registros de clientes do banco de dados.

---

## 5. Resumo do Funcionamento do Fluxo Geral (Mapeamento de Requisitos)

- **Rota Pública (Sem Autenticação):** Visitantes navegam pelo catálogo e adicionam itens ao carrinho. Os IDs e dados dos itens ficam salvos localmente na sessão.
- **Exigência de Login (Tentativa de Compra):** Ao tentar iniciar o `/checkout`, o frontend realiza uma verificação condicional na store (ex: `isAuthenticated === true`).
- **Bloqueio de Rota / Direcionamento:** 
  - Se falso, há um bloqueio da Purchase Journey e o usuário é redirecionado para a tela de Auth (`/minha-conta`).
  - O usuário faz login, envia suas credenciais, recebendo em retorno o JWT (com o Role de Identificação daquela entidade logada).
- **Resolução de Páginas (Role Check Backend e Frontend):**
  - **No Frontend:** Se um usuário comum (cliente) tentar forçar uma alteração na URL do browser para entrar em `/admin/dashboard`, o roteador lerá seu `role` e barrará, o redirecionando para a Home.
  - **No Backend:** Da mesma forma, tentativas de bypass pela ferramenta de APIs (Postman/Curl) com "Token de Cliente" enviando requests para as rotas anotadas como exclusivas para Administradores (`@Secured(Administrator)`) resultarão rigorosamente na recusa imediata, com status HTTP 403 Forbidden.
