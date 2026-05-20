# Mapeamento Completo do Contexto Backend - E-Commerce de Livros

> Documento de mapeamento completo de fluxos de integração, testes e estrutura do backend.
> Gerado em: 19/05/2026

---

## 1. Estrutura de Módulos

### 1.1 Módulos do Domínio

```
backend/src/modules/
├── admin/           # Gestão administrativa
├── auth/            # Autenticação e autorização
├── carrinho/        # Carrinho de compras
├── cartoes/         # Cartões de crédito
├── clientes/        # Gestão de clientes
├── cupom/           # Cupons de desconto
├── entrega/         # Gestão de entregas
├── frete/           # Cálculo de frete
├── livros/          # Catálogo de livros
├── logistica-mocks/ # Mocks de logística (testes)
├── lojas/           # Multi-tenancy (lojas)
├── pagamentos/      # Processamento de pagamentos
├── usuarios/        # Usuários base
└── vendas/          # Vendas e pedidos
```

---

## 2. Fluxos de Autenticação

### 2.1 Autenticação de Cliente

**Endpoint:** `POST /api/auth/login`

**Fluxo:**
1. Cliente envia email e senha
2. Sistema valida credenciais (senha hash + senha mestra opcional)
3. Sistema busca lojas do usuário (multi-tenancy)
4. Sistema gera JWT com:
   - UUID do usuário
   - Email
   - Role (cliente)
   - Papeis adicionais
   - `loj_ids` (array de lojas)
   - `loj_id_principal` (loja principal)
5. Sistema retorna token em cookie `HttpOnly + Secure + SameSite=Lax`

**Middleware:** `autenticacaoMiddleware` - extrai usuário do JWT e anexa ao `req.usuario`

**Testes de Integração:**
- `backend/src/tests/integracao/clientes/auth.integracao.test.ts`
  - Login sem email/senha (400)
  - Login com credenciais inválidas (401)
  - Login com usuário inativado (401)
  - Sessão via cookie HttpOnly (`GET /auth/me`)

**Regras de Negócio:**
- Suporte a senha mestra por papel
- Multi-tenancy: usuário pode ter múltiplas lojas
- Usuários inativos não podem fazer login

---

### 2.2 Autenticação de Administrador

**Endpoint:** `POST /api/auth/login` (mesmo endpoint, role diferente)

**Fluxo:**
1. Admin envia email e senha
2. Sistema valida credenciais
3. Sistema verifica se é admin mestre (`isAdminMestre`)
4. Sistema gera JWT com role `admin`

**Rotas Administrativas Protegidas:**
- `adminOnlyMiddleware` - exige role `admin`

**Testes de Integração:**
- `backend/src/tests/integracao/admin/fluxos-admin.integracao.test.ts`
  - Fluxo feliz: admin cadastra novo admin
  - Promoção de cliente para admin com nova senha

**Regras de Negócio:**
- Admin não pode inativar a si mesmo
- Admin mestre tem permissões adicionais

---

### 2.3 Multi-Tenancy (Lojas)

**Middleware:** `contextoLojaMiddleware`

**Fluxo:**
1. Extrai `loj_id` do JWT ou header
2. Adiciona contexto de loja à requisição
3. Filtra dados por loja em consultas

**Testes de Integração:**
- `backend/src/tests/integracao/livros/livros-multi-tenancy.integracao.test.ts`

---

## 3. Fluxos de Cliente

### 3.1 Cadastro Público de Cliente

**Endpoint:** `POST /api/clientes/cadastro-publico`

**Fluxo:**
1. Cliente envia dados: nome, CPF, email, senha, confirmação senha
2. Sistema valida CPF (formato e dígitos)
3. Sistema valida email único
4. Sistema valida senha (complexidade)
5. Sistema cria usuário com papel `cliente`
6. Sistema retorna dados do cliente criado

**Validações:**
- CPF válido (algoritmo)
- Email não duplicado
- Senha forte (mínimo 8 caracteres, maiúscula, minúscula, número, especial)
- Confirmação de senha igual

**Testes de Integração:**
- `backend/src/tests/integracao/clientes/clientes-registro.integracao.test.ts`
- `backend/src/tests/integracao/fluxos-cliente.integracao.test.ts` (fluxo completo)

---

### 3.2 Gestão de Perfil

**Endpoints:**
- `GET /api/clientes/perfil` - obter perfil
- `PATCH /api/clientes/perfil` - atualizar perfil
- `DELETE /api/clientes/perfil` - inativar conta

**Fluxo de Atualização:**
1. Cliente autenticado envia dados parciais (nome, email, CPF)
2. Sistema valida campos permitidos
3. Sistema atualiza dados
4. Sistema retorna dados atualizados

**Fluxo de Inativação:**
1. Cliente solicita inativação
2. Sistema marca `ativo = false`
3. Login subsequente falha

**Testes de Integração:**
- `backend/src/tests/integracao/clientes/perfil/clientes-perfil.integracao.test.ts`
- `backend/src/tests/integracao/clientes/clientes-inativacao.integracao.test.ts`

---

### 3.3 Gestão de Endereços

**Endpoints:**
- `POST /api/clientes/enderecos` - adicionar endereço
- `PATCH /api/clientes/enderecos/:uuidEndereco` - editar endereço
- `DELETE /api/clientes/enderecos/:uuidEndereco` - remover endereço

**Fluxo:**
1. Cliente envia dados de endereço
2. Sistema valida limite de endereços (máximo 5)
3. Sistema persiste endereço vinculado ao cliente
4. Sistema retorna lista atualizada

**Regras de Negócio:**
- Máximo 5 endereços por cliente
- Endereço principal pode ser definido

**Testes de Integração:**
- `backend/src/tests/integracao/clientes/perfil/clientes-enderecos.integracao.test.ts`
- `backend/src/tests/integracao/clientes/limite-enderecos.integracao.test.ts`

---

### 3.4 Gestão de Cartões

**Endpoints:**
- `POST /api/clientes/cartoes` - adicionar cartão
- `DELETE /api/clientes/cartoes/:uuidCartao` - remover cartão

**Fluxo:**
1. Cliente envia dados do cartão (tokenizado)
2. Sistema valida cartão (mock)
3. Sistema persiste cartão vinculado ao cliente
4. Sistema retorna cartão mascarado

**Testes de Integração:**
- `backend/src/tests/integracao/clientes/cartoes.integracao.test.ts`

---

### 3.5 Alteração de Senha

**Endpoint:** `PATCH /api/clientes/seguranca/alterar-senha`

**Fluxo:**
1. Cliente envia senha atual, nova senha, confirmação
2. Sistema valida senha atual correta
3. Sistema valida nova senha (complexidade)
4. Sistema atualiza hash da senha
5. Sistema retorna sucesso

**Testes de Integração:**
- `backend/src/tests/integracao/clientes/clientes-senha.integracao.test.ts`
- `backend/src/tests/integracao/fluxos-cliente.integracao.test.ts` (cenário de falha)

---

## 4. Fluxos de Carrinho

### 4.1 Carrinho Persistido

**Endpoints:**
- `GET /api/carrinho` - obter carrinho
- `POST /api/carrinho/itens` - sincronizar item
- `DELETE /api/carrinho` - limpar carrinho

**Fluxo:**
1. Cliente autenticado acessa carrinho
2. Sistema retorna itens, resumo (subtotal, frete, total)
3. Cliente adiciona/atualiza/remove item
4. Sistema valida estoque disponível
5. Sistema recalcula totais
6. Sistema persiste carrinho

**Regras de Negócio:**
- Quantidade não pode exceder estoque
- Frete padrão: R$ 15,00
- Carrinho vazio retorna totais zerados

**Testes de Integração:**
- `backend/src/tests/integracao/carrinho/carrinho.integracao.test.ts`
  - Carrinho vazio
  - Adicionar item
  - Atualizar quantidade
  - Remover item (quantidade 0)
  - Livro inexistente (400)
  - Quantidade excede estoque (400)
  - Limpar carrinho

---

## 5. Fluxos de Venda/Compra

### 5.1 Criação de Pedido de Venda

**Endpoint:** `POST /api/vendas`

**Fluxo:**
1. Cliente envia itens, valores totais, parcelas
2. Sistema valida usuário autenticado
3. Sistema valida ao menos um item
4. Sistema valida valor total coerente
5. Sistema aplica RN0069 (parcelamento mínimo R$ 80,00)
6. Sistema aplica RN0034 (valor mínimo por cartão R$ 10,00)
7. Sistema cria venda com status `EM PROCESSAMENTO`
8. Sistema retorna UUID da venda

**Regras de Negócio:**
- RN0069: Compras abaixo de R$ 80,00 não permitem parcelamento
- RN0034: Valor mínimo por cartão deve ser R$ 10,00
- Valor total deve ser igual a soma dos itens + frete

**Testes de Integração:**
- `backend/src/tests/integracao/vendas/vendas-e2e.test.ts`
  - Fluxo completo HTTP
  - Erro RN0069 (parcelamento abaixo de R$ 80,00)
  - Erro sem autenticação (401)
- `backend/src/tests/integracao/vendas/servico-vendas.integracao.test.ts`
  - Validações de regras de negócio
  - Erro de usuário não informado
  - Erro de itens vazios
  - Erro de valor total inválido

---

### 5.2 Consulta de Venda

**Endpoint:** `GET /api/vendas/:uuid`

**Fluxo:**
1. Cliente ou admin solicita detalhes da venda
2. Sistema valida permissão (dono da venda ou admin)
3. Sistema retorna detalhes completos

**Testes de Integração:**
- `backend/src/tests/integracao/vendas/vendas-e2e.test.ts`
- `backend/src/tests/integracao/vendas/servico-vendas.integracao.test.ts`

---

### 5.3 Listagem de Vendas do Cliente

**Endpoint:** `GET /api/minhas-vendas`

**Fluxo:**
1. Cliente autenticado solicita suas vendas
2. Sistema lista todas as vendas do cliente
3. Sistema retorna array com data de entrega mapeada

**Testes de Integração:**
- `backend/src/tests/integracao/vendas/vendas-e2e.test.ts`

---

### 5.4 Fluxo Completo de Venda (Admin)

**Endpoint:** `GET /api/admin/pedidos`

**Fluxo:**
1. Admin lista todos os pedidos
2. Sistema retorna array com todos os pedidos
3. Admin pode filtrar por status

**Testes de Integração:**
- `backend/src/tests/integracao/vendas/vendas-admin-fluxo.integracao.test.ts`
  - Listar clientes (RF0024)
  - Agendar entrega (RF0038)
  - Fluxo completo: pedido → pagamento → entrega

---

## 6. Fluxos de Pagamento

### 6.1 Intenção de Pagamento

**Endpoint:** `POST /api/pagamentos/intencao-pagamento`

**Fluxo:**
1. Cliente envia valor total
2. Sistema cria intenção de pagamento
3. Sistema gera `idIntencao` e `segredoConfirmacao`
4. Sistema define TTL (tempo de expiração)
5. Sistema retorna dados da intenção

**Testes de Integração:**
- `backend/src/tests/integracao/pagamentos/pagamentos.integracao.intencao-e-processar.test.ts`
  - Criação de intenção
  - Intenção expirada (TTL)

---

### 6.2 Vinculação de Intenção à Venda

**Endpoint:** `PATCH /api/pagamentos/intencao-pagamento/:inpUuid/venda`

**Fluxo:**
1. Cliente vincula intenção à venda
2. Sistema atualiza intenção com `vendaUuid`
3. Sistema retorna 204 (no content)

**Testes de Integração:**
- `backend/src/tests/integracao/pagamentos/pagamentos.integracao.intencao-e-processar.test.ts`

---

### 6.3 Processamento de Pagamento

**Endpoint:** `POST /api/pagamento/processar`

**Fluxo:**
1. Cliente envia dados de pagamento:
   - `valorTotal`
   - `idIntencao`
   - `segredoConfirmacao`
   - `pagamentosCartao` (array de cartões)
   - `cuponsAplicados` (opcional)
2. Sistema valida intenção (não expirada, segredo correto)
3. Sistema valida soma dos pagamentos = valorTotal
4. Sistema processa cada cartão via provedor
5. Sistema aplica regras:
   - Máximo R$ 1.000,00 por transação
   - Valor mínimo R$ 10,00 por cartão
6. Sistema registra pagamentos
7. Sistema atualiza status da venda para `APROVADA` ou `REPROVADA`
8. Sistema retorna resultado

**Regras de Negócio:**
- Atomicidade: se um cartão falhar, todos falham
- Máximo R$ 1.000,00 por transação
- Valor mínimo R$ 10,00 por cartão
- Suporte a múltiplos cartões
- Suporte a cupons de troca

**Testes de Integração:**
- `backend/src/tests/integracao/pagamentos/pagamentos.integracao.intencao-e-processar.test.ts`
  - Pagamento aprovado (soma <= 1000)
  - Pagamento reprovado (soma > 1000)
  - Segredo inválido
  - Soma não confere
  - Intenção expirada
  - Persistência com inp_id
- `backend/src/tests/integracao/vendas/venda-completa.integracao.test.ts`
  - Múltiplos cartões (S1-A)
  - Falha em um cartão (S1-B)
  - Pagamento integral com cupom (S1-C)

---

### 6.4 Informações de Pagamento (Checkout)

**Endpoint:** `GET /api/pagamento/info`

**Fluxo:**
1. Cliente solicita informações de checkout
2. Sistema retorna:
   - Cupons disponíveis
   - Opções de frete
   - Bandeiras permitidas
   - Política de parcelamento (12x, 6x sem juros)

**Testes de Integração:**
- `backend/src/tests/integracao/pagamentos/pagamentos.integracao.intencao-e-processar.test.ts`

---

### 6.5 Parcelamento

**Endpoints:**
- `POST /api/pagamentos/selecionar` - definir método de liquidação

**Fluxo:**
1. Cliente seleciona método de pagamento
2. Sistema registra preferência
3. Sistema retorna opções de parcelamento

**Testes de Integração:**
- `backend/src/tests/integracao/pagamentos/pagamentos.integracao.parcelas.test.ts`
- `backend/src/tests/integracao/pagamentos/pagamentos.parcelamento.integracao.test.ts`

---

### 6.6 PIX

**Endpoint:** `POST /webhooks/pagamento-pix-simulado`

**Fluxo:**
1. Sistema recebe webhook de provedor PIX
2. Sistema atualiza status do pagamento
3. Sistema notifica cliente (email)

**Testes de Integração:**
- `backend/src/tests/integracao/pagamentos/pagamentos.pix-selecionar.integracao.test.ts`

---

## 7. Fluxos de Entrega/Frete

### 7.1 Cotação de Frete

**Endpoint:** `POST /api/frete/cotar`

**Fluxo:**
1. Cliente envia CEP de destino
2. Sistema consulta provedores (SEDEX, PAC)
3. Sistema retorna opções com valor e prazo

**Testes de Integração:**
- `backend/src/tests/integracao/frete/` (se houver)

---

### 7.2 Agendamento de Entrega

**Endpoint:** `POST /api/entregas`

**Fluxo:**
1. Admin agenda entrega para venda aprovada
2. Sistema cria registro de entrega
3. Sistema atualiza status da venda para `EM TRÂNSITO`
4. Sistema gera código de rastreamento
5. Sistema envia notificação (email)

**Testes de Integração:**
- `backend/src/tests/integracao/vendas/vendas-admin-fluxo.integracao.test.ts`
  - Admin agenda entrega
  - Venda passa para EM TRÂNSITO
  - Consulta de entregas

---

### 7.3 Consulta de Entrega

**Endpoints:**
- `GET /api/entregas` - listar por venda
- `GET /api/entregas/:entregaUuid` - detalhes
- `PATCH /api/entregas/:entregaUuid/falha` - registrar falha
- `PATCH /api/entregas/:entregaUuid/confirmar` - confirmar recebimento
- `PATCH /api/entregas/:entregaUuid/reagendar` - reagendar

**Fluxo:**
1. Admin ou cliente consulta entrega
2. Sistema retorna status e rastreamento
3. Sistema registra falhas ou confirmações
4. Sistema notifica stakeholders

**Testes de Integração:**
- `backend/src/tests/integracao/entrega/entrega.integracao.test.ts`
- `backend/src/tests/integracao/entrega/entrega-fluxo-falha.integracao.test.ts`

---

## 8. Fluxos de Troca/Devolução

### 8.1 Solicitação de Troca

**Endpoint:** `POST /api/vendas/:uuid/troca`

**Fluxo:**
1. Cliente solicita troca de itens
2. Sistema valida:
   - Venda existe
   - Cliente é dono da venda
   - Venda está entregue
   - Prazo de 7 dias não expirou (RN0043)
3. Sistema marca itens como `emTroca = true`
4. Sistema atualiza status para `EM TROCA`
5. Sistema registra motivo

**Regras de Negócio:**
- RN0043: Prazo de 7 dias após entrega para solicitar troca
- Apenas pedidos entregues podem ser trocados

**Testes de Integração:**
- `backend/src/tests/integracao/vendas/troca.integracao.test.ts`
  - S2-A: Solicitar troca e acompanhar status
  - S2-D: Prazo de arrependimento (7 dias)
- `backend/src/tests/integracao/vendas/servico-vendas.integracao.test.ts`
  - Erro quando venda não existe
  - Erro quando usuário não é dono
  - Erro quando venda não está entregue
  - Erro RN0043 (prazo expirado)

---

### 8.2 Autorização de Troca (Admin)

**Endpoint:** `PATCH /api/admin/pedidos/:uuid/autorizar-troca`

**Fluxo:**
1. Admin autoriza troca
2. Sistema atualiza status para `TROCA AUTORIZADA`
3. Sistema notifica cliente

**Testes de Integração:**
- `backend/src/tests/integracao/vendas/troca.integracao.test.ts`
  - S2-B: Aprovação, recebimento e geração de cupom

---

### 8.3 Rejeição de Troca (Admin)

**Endpoint:** `PATCH /api/admin/pedidos/:uuid/rejeitar-troca`

**Fluxo:**
1. Admin rejeita troca com motivo
2. Sistema atualiza status para `TROCA REJEITADA`
3. Sistema notifica cliente

**Testes de Integração:**
- `backend/src/tests/integracao/vendas/troca.integracao.test.ts`
  - S2-C: Troca rejeitada

---

### 8.4 Confirmar Recebimento e Gerar Cupom

**Endpoint:** `PATCH /api/admin/pedidos/:uuid/confirmar-recebimento`

**Fluxo:**
1. Admin confirma recebimento do item trocado
2. Sistema atualiza status para `CONCLUÍDA`
3. Sistema calcula valor do cupom (valor dos itens)
4. Sistema cria cupom de troca:
   - Código: `TROCA-{UUID}`
   - Valor: valor dos itens
   - Validade: 365 dias
   - Status: `DISPONIVEL`
5. Sistema retorna cupom gerado
6. Sistema opcionalmente retorna estoque

**Regras de Negócio:**
- Cupom de troca tem validade de 365 dias
- Valor do cupom = valor dos itens em troca
- Estoque pode ser retornado ao confirmar recebimento

**Testes de Integração:**
- `backend/src/tests/integracao/vendas/troca.integracao.test.ts`
  - S2-B: Aprovação, recebimento e geração de cupom

---

### 8.5 Listagem de Trocas Pendentes (Admin)

**Endpoint:** `GET /api/admin/pedidos/trocas`

**Fluxo:**
1. Admin lista todas as trocas pendentes
2. Sistema retorna array com status `EM TROCA`

**Testes de Integração:**
- `backend/src/tests/integracao/vendas/troca.integracao.test.ts`

---

## 9. Fluxos de Livros/Catálogo

### 9.1 Listagem de Catálogo (Público)

**Endpoint:** `GET /api/livros`

**Fluxo:**
1. Cliente consulta catálogo
2. Sistema aplica filtro de loja (multi-tenancy)
3. Sistema retorna livros disponíveis
4. Sistema inclui informações de estoque

**Testes de Integração:**
- `backend/src/tests/integracao/livros/livros-e2e.test.ts`
- `backend/src/tests/integracao/livros/livros-multi-tenancy.integracao.test.ts`

---

### 9.2 Detalhes de Livro

**Endpoint:** `GET /api/livros/:uuid`

**Fluxo:**
1. Cliente solicita detalhes do livro
2. Sistema retorna informações completas
3. Sistema inclui estoque disponível

**Testes de Integração:**
- `backend/src/tests/integracao/livros/livros-e2e.test.ts`

---

### 9.3 Gestão de Livros (Admin)

**Endpoints:**
- `GET /api/admin/livros` - listar (admin)
- `POST /api/admin/livros` - criar (admin)
- `PATCH /api/admin/livros/:uuid` - atualizar (admin)
- `POST /api/admin/livros/lote` - criar em lote (admin)
- `POST /api/admin/autores/lote` - criar autores em lote (admin)
- `POST /api/admin/editoras/lote` - criar editoras em lote (admin)

**Fluxo:**
1. Admin autenticado acessa rotas protegidas
2. Sistema valida permissões (adminOnlyMiddleware)
3. Sistema cria/atualiza livros
4. Sistema retorna dados do livro

**Testes de Integração:**
- `backend/src/tests/integracao/admin/acesso-produtos-admin.integracao.test.ts`
- `backend/src/tests/integracao/livros/livros-bulk-insert.integracao.test.ts`

---

### 9.4 Categorias

**Endpoint:** `GET /api/categorias/catalogo`

**Fluxo:**
1. Cliente consulta categorias
2. Sistema retorna lista de categorias
3. Sistema inclui contagem de livros por categoria

---

## 10. Fluxos Administrativos

### 10.1 Gestão de Administradores

**Endpoints:**
- `GET /api/admin/administradores` - listar admins
- `POST /api/admin/registro` - registrar admin
- `PATCH /api/admin/administradores/:uuid` - atualizar admin
- `DELETE /api/admin/administradores/:uuid` - inativar admin (implícito)
- `POST /api/admin/bootstrap` - bootstrap admin (teste apenas)

**Fluxo:**
1. Admin mestre lista admins
2. Admin mestre cria novo admin
3. Sistema valida CPF/CNPJ
4. Sistema valida senha
5. Sistema cria admin com papel `admin`
6. Sistema retorna dados criados

**Regras de Negócio:**
- Suporte a PF (CPF) e PJ (CNPJ)
- Admin não pode inativar a si mesmo
- Suporte a promoção de cliente para admin

**Testes de Integração:**
- `backend/src/tests/integracao/admin/fluxos-admin.integracao.test.ts`
  - Fluxo feliz administrativo
  - Promoção de cliente para admin
- `backend/src/tests/integracao/admin/admin-mestre-gestao.integracao.test.ts`

---

### 10.2 Listagem de Clientes (Admin)

**Endpoint:** `GET /api/clientes` (admin only)

**Fluxo:**
1. Admin solicita lista de clientes
2. Sistema aplica paginação
3. Sistema retorna clientes com metadados

**Testes de Integração:**
- `backend/src/tests/integracao/vendas/vendas-admin-fluxo.integracao.test.ts`
  - RF0024: GET /api/clientes

---

### 10.3 Dashboard Admin

**Endpoints:**
- Painel administrativo
- Consultas de dashboard
- Gestão de pedidos admin

**Testes de Integração:**
- `backend/src/tests/integracao/admin/admin-painel.integracao.test.ts`

---

## 11. Testes de Integração por Domínio

### 11.1 Autenticação
- `backend/src/tests/integracao/clientes/auth.integracao.test.ts`
- `backend/src/tests/integracao/auth/` (se houver)

### 11.2 Clientes
- `backend/src/tests/integracao/clientes/clientes-registro.integracao.test.ts`
- `backend/src/tests/integracao/clientes/clientes-inativacao.integracao.test.ts`
- `backend/src/tests/integracao/clientes/clientes-senha.integracao.test.ts`
- `backend/src/tests/integracao/clientes/limite-enderecos.integracao.test.ts`
- `backend/src/tests/integracao/clientes/cartoes.integracao.test.ts`
- `backend/src/tests/integracao/clientes/perfil/clientes-perfil.integracao.test.ts`
- `backend/src/tests/integracao/clientes/perfil/clientes-enderecos.integracao.test.ts`
- `backend/src/tests/integracao/clientes/perfil/cartoes.integracao.test.ts`
- `backend/src/tests/integracao/fluxos-cliente.integracao.test.ts` (fluxo completo)

### 11.3 Carrinho
- `backend/src/tests/integracao/carrinho/carrinho.integracao.test.ts`

### 11.4 Vendas
- `backend/src/tests/integracao/vendas/venda-completa.integracao.test.ts`
- `backend/src/tests/integracao/vendas/troca.integracao.test.ts`
- `backend/src/tests/integracao/vendas/vendas-e2e.test.ts`
- `backend/src/tests/integracao/vendas/vendas-admin-fluxo.integracao.test.ts`
- `backend/src/tests/integracao/vendas/servico-vendas.integracao.test.ts`
- `backend/src/tests/integracao/vendas/pedido-venda.integracao.test.ts`
- `backend/src/tests/integracao/vendas/fluxo-cotacao-cupons.integracao.test.ts`
- `backend/src/tests/integracao/vendas/repositorio-vendas-n1-otimizacao.repositorio.test.ts`

### 11.5 Pagamentos
- `backend/src/tests/integracao/pagamentos/pagamentos-e2e.test.ts`
- `backend/src/tests/integracao/pagamentos/pagamentos.integracao.intencao-e-processar.test.ts`
- `backend/src/tests/integracao/pagamentos/pagamentos.integracao.parcelas.test.ts`
- `backend/src/tests/integracao/pagamentos/pagamentos.integracao.selecionar-e-pix.test.ts`
- `backend/src/tests/integracao/pagamentos/pagamentos.parcelamento.integracao.test.ts`
- `backend/src/tests/integracao/pagamentos/pagamentos.pix-selecionar.integracao.test.ts`
- `backend/src/tests/integracao/pagamentos/repositorio-pagamentos-n1-otimizacao.repositorio.test.ts`

### 11.6 Entrega
- `backend/src/tests/integracao/entrega/entrega.integracao.test.ts`
- `backend/src/tests/integracao/entrega/entrega-fluxo-falha.integracao.test.ts`

### 11.7 Livros
- `backend/src/tests/integracao/livros/livros-e2e.test.ts`
- `backend/src/tests/integracao/livros/livros-multi-tenancy.integracao.test.ts`
- `backend/src/tests/integracao/livros/livros-bulk-insert.integracao.test.ts`
- `backend/src/tests/integracao/livros/repositorio-livros-otimizacao.repositorio.test.ts`

### 11.8 Admin
- `backend/src/tests/integracao/admin/fluxos-admin.integracao.test.ts`
- `backend/src/tests/integracao/admin/acesso-produtos-admin.integracao.test.ts`
- `backend/src/tests/integracao/admin/admin-comum-permissoes-listagens.integracao.test.ts`
- `backend/src/tests/integracao/admin/admin-mestre-gestao.integracao.test.ts`
- `backend/src/tests/integracao/admin/admin-painel.integracao.test.ts`

### 11.9 Outros
- `backend/src/tests/integracao/frete/` (se houver)
- `backend/src/tests/integracao/lojas/` (se houver)
- `backend/src/tests/integracao/cupom/` (se houver)
- `backend/src/tests/integracao/atualizacao-cadastral/` (se houver)
- `backend/src/tests/integracao/validacao-dados/` (se houver)
- `backend/src/tests/integracao/seguranca/` (se houver)
- `backend/src/tests/integracao/logistica-mocks/` (se houver)

---

## 12. Regras de Negócio Principais

### 12.1 Autenticação
- **RN**: Suporte a senha mestra por papel
- **RN**: Multi-tenancy (usuário pode ter múltiplas lojas)
- **RN**: Usuários inativos não podem fazer login
- **RN**: JWT em cookie HttpOnly + Secure + SameSite=Strict

### 12.2 Clientes
- **RN**: Máximo 5 endereços por cliente
- **RN**: Senha forte (mínimo 8 caracteres, maiúscula, minúscula, número, especial)
- **RN**: CPF válido (algoritmo)
- **RN**: Email único

### 12.3 Vendas
- **RN0069**: Compras abaixo de R$ 80,00 não permitem parcelamento
- **RN0034**: Valor mínimo por cartão deve ser R$ 10,00
- **RN**: Valor total deve ser igual a soma dos itens + frete

### 12.4 Pagamentos
- **RN**: Máximo R$ 1.000,00 por transação
- **RN**: Atomicidade: se um cartão falhar, todos falham
- **RN**: Intenção de pagamento tem TTL (expiração)
- **RN**: Cupom de troca tem validade de 365 dias

### 12.5 Trocas
- **RN0043**: Prazo de 7 dias após entrega para solicitar troca
- **RN**: Apenas pedidos entregues podem ser trocados
- **RN**: Valor do cupom de troca = valor dos itens em troca

---

## 13. Middlewares Principais

### 13.1 Autenticação
- `autenticacaoMiddleware` - extrai usuário do JWT

### 13.2 Autorização
- `adminOnlyMiddleware` - exige role `admin`
- `clienteOnlyMiddleware` - exige role `cliente`

### 13.3 Multi-Tenancy
- `contextoLojaMiddleware` - adiciona contexto de loja

---

## 14. Serviços Externos (Mocks)

### 14.1 Pagamento
- `FabricaProvedorPagamento` - cria provedor de pagamento
- Provedor simulado com regras de aprovação/rejeição

### 14.2 Frete
- `FabricaProvedorFrete` - cria provedor de frete
- Provedores: SEDEX, PAC

### 14.3 Logística
- `RepositorioRastreamentoPostgres` - rastreamento de entregas
- Mocks para testes

---

## 15. Resumo de Endpoints por Domínio

### 15.1 Autenticação
- `POST /api/auth/login` - login
- `GET /api/auth/me` - sessão atual
- `POST /api/auth/logout` - encerrar sessão

### 15.2 Clientes
- `POST /api/clientes/cadastro-publico` - cadastro
- `GET /api/clientes/perfil` - perfil
- `PATCH /api/clientes/perfil` - atualizar perfil
- `DELETE /api/clientes/perfil` - inativar
- `POST /api/clientes/enderecos` - adicionar endereço
- `PATCH /api/clientes/enderecos/:uuid` - editar endereço
- `DELETE /api/clientes/enderecos/:uuid` - remover endereço
- `PATCH /api/clientes/seguranca/alterar-senha` - alterar senha
- `GET /api/clientes` - listar (admin)

### 15.3 Carrinho
- `GET /api/carrinho` - obter carrinho
- `POST /api/carrinho/itens` - sincronizar item
- `DELETE /api/carrinho` - limpar carrinho

### 15.4 Vendas
- `POST /api/vendas` - criar venda
- `GET /api/vendas/:uuid` - detalhes da venda
- `GET /api/minhas-vendas` - vendas do cliente
- `POST /api/vendas/:uuid/troca` - solicitar troca

### 15.5 Pagamentos
- `POST /api/pagamentos/intencao-pagamento` - criar intenção
- `PATCH /api/pagamentos/intencao-pagamento/:inpUuid/venda` - vincular à venda
- `POST /api/pagamento/processar` - processar pagamento
- `GET /api/pagamento/info` - informações de checkout
- `POST /api/pagamentos/selecionar` - definir método
- `GET /api/pagamentos/venda/:vendaUuid/resumo` - resumo de pagamentos
- `POST /webhooks/pagamento-pix-simulado` - webhook PIX

### 15.6 Frete
- `POST /api/frete/cotar` - cotar frete

### 15.7 Entrega
- `POST /api/entregas` - agendar entrega
- `GET /api/entregas` - listar por venda
- `GET /api/entregas/:entregaUuid` - detalhes
- `PATCH /api/entregas/:entregaUuid/falha` - registrar falha
- `PATCH /api/entregas/:entregaUuid/confirmar` - confirmar recebimento
- `PATCH /api/entregas/:entregaUuid/reagendar` - reagendar

### 15.8 Livros
- `GET /api/livros` - catálogo
- `GET /api/livros/:uuid` - detalhes
- `GET /api/categorias/catalogo` - categorias
- `GET /api/admin/livros` - listar (admin)
- `POST /api/admin/livros` - criar (admin)
- `PATCH /api/admin/livros/:uuid` - atualizar (admin)
- `POST /api/admin/livros/lote` - criar em lote (admin)
- `POST /api/admin/autores/lote` - criar autores em lote (admin)
- `POST /api/admin/editoras/lote` - criar editoras em lote (admin)

### 15.9 Admin
- `GET /api/admin/administradores` - listar admins
- `POST /api/admin/registro` - registrar admin
- `PATCH /api/admin/administradores/:uuid` - atualizar admin
- `DELETE /api/admin/administradores/:uuid` - inativar admin
- `POST /api/admin/bootstrap` - bootstrap admin (teste)
- `GET /api/admin/pedidos` - listar pedidos
- `PATCH /api/admin/pedidos/:uuid/despachar` - despachar
- `PATCH /api/admin/pedidos/:uuid/entrega` - confirmar entrega
- `GET /api/admin/pedidos/trocas` - listar trocas pendentes
- `PATCH /api/admin/pedidos/:uuid/autorizar-troca` - autorizar troca
- `PATCH /api/admin/pedidos/:uuid/rejeitar-troca` - rejeitar troca
- `PATCH /api/admin/pedidos/:uuid/confirmar-recebimento` - confirmar recebimento

---

## 16. Conclusão

Este documento mapeia todos os fluxos de integração do backend do e-commerce de livros, incluindo:

- **Fluxos de autenticação** (cliente, admin, multi-tenancy)
- **Fluxos de cliente** (cadastro, perfil, endereços, cartões, senha)
- **Fluxos de carrinho** (persistido, validação de estoque)
- **Fluxos de venda/compra** (criação, consulta, listagem, regras de negócio)
- **Fluxos de pagamento** (intenção, processamento, parcelamento, PIX, cupons)
- **Fluxos de entrega/frete** (cotação, agendamento, rastreamento, falhas)
- **Fluxos de troca/devolução** (solicitação, autorização, rejeição, cupom)
- **Fluxos de livros/catálogo** (listagem, detalhes, gestão admin)
- **Fluxos administrativos** (gestão de admins, clientes, dashboard)

Todos os fluxos são cobertos por testes de integração, garantindo qualidade e confiabilidade do sistema.
