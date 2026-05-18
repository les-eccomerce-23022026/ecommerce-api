# Documentação Técnica das Rotas Backend - 7ª Entrega

## Data do Teste
17/05/2026

## Visão Geral

Este documento documenta as rotas backend testadas na 7ª entrega, incluindo payloads de entrada/saída, fluxo de negócio e justificativa técnica. Os testes foram realizados via script BDD (`testar-cenarios-bdd-7-entrega.sh`) que simula o fluxo completo de vendas, trocas e logística.

## Contexto de Negócio

A 7ª entrega implementa o fluxo completo de e-commerce:
- **Vendas**: Cliente realiza compra, sistema registra pedido
- **Pagamentos**: Processamento de cartões e cupons
- **Trocas**: Solicitação, autorização, rejeição e conclusão de trocas
- **Logística**: Criação de entregas, despacho, confirmação e falhas

---

## 1. Rotas de Autenticação

### POST /api/auth/login - Login de Usuário

**Fluxo de Negócio:**
- Autentica usuário (cliente ou admin) usando email e senha
- Gera token JWT com informações do usuário e papel (role)
- Define cookie HttpOnly + Secure + SameSite=Strict

**Payload de Entrada:**
```json
{
  "email": "clientetest@email.com",
  "senha": "@asdfJKLÇ123"
}
```

**Payload de Saída (Sucesso):**
```json
{
  "dados": {
    "user": {
      "uuid": "123e4567-e89b-12d3-a456-426614174000",
      "email": "clientetest@email.com",
      "nome": "Cliente Teste",
      "role": "cliente"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Payload de Saída (Erro):**
```json
{
  "erro": "Credenciais inválidas."
}
```

**Status Codes:**
- `200 OK`: Login bem-sucedido
- `400 Bad Request`: Credenciais inválidas

**Por que esta rota existe:**
- RF0038: Autenticação de usuários
- RN0062: Senha deve ter mínimo 8 caracteres, maiúscula, minúscula, número e caractere especial
- Segurança: JWT em cookie HttpOnly previne XSS

**Validações:**
- Email deve ser válido e existir no banco
- Senha deve corresponder ao hash armazenado
- Usuário deve estar ativo

---

## 2. Rotas de Vendas

### POST /api/vendas - Registrar Pedido de Venda

**Fluxo de Negócio:**
- Cliente finaliza compra com itens do carrinho
- Sistema valida dados básicos (usuário, itens, valor)
- Sistema valida parcelamento (mínimo R$ 80,00 para > 1 parcela)
- Sistema valida pagamentos split (mínimo R$ 10,00 por cartão)
- Sistema cria venda com status "EM PROCESSAMENTO"
- Sistema vincula cotação de frete se fornecida

**Payload de Entrada:**
```json
{
  "enderecoUuid": "123e4567-e89b-12d3-a456-426614174000",
  "cartaoUuid": "223e4567-e89b-12d3-a456-426614174001",
  "formaPagamento": "cartao",
  "valorTotal": 114.8,
  "valorTotalItens": 99.8,
  "valorFrete": 15,
  "parcelas": 1,
  "itens": [
    {
      "livroUuid": "323e4567-e89b-12d3-a456-426614174002",
      "quantidade": 2,
      "precoUnitario": 49.9
    }
  ],
  "pagamentos": [
    {
      "tipo": "cartao",
      "valor": 114.8,
      "cartaoUuid": "223e4567-e89b-12d3-a456-426614174001"
    }
  ]
}
```

**Payload de Saída (Sucesso):**
```json
{
  "id": "423e4567-e89b-12d3-a456-426614174003",
  "uuid": "423e4567-e89b-12d3-a456-426614174003",
  "status": "EM PROCESSAMENTO",
  "valorTotal": 114.8,
  "valorFrete": 15,
  "dataHoraCriacao": "2026-05-17T10:00:00Z",
  "itens": [
    {
      "livroUuid": "323e4567-e89b-12d3-a456-426614174002",
      "quantidade": 2,
      "precoUnitario": 49.9
    }
  ]
}
```

**Payload de Saída (Erro):**
```json
{
  "erro": "RN0069: Compras abaixo de R$ 80,00 não permitem parcelamento"
}
```

**Status Codes:**
- `201 Created`: Venda criada com sucesso
- `400 Bad Request`: Dados inválidos ou validação de negócio falhou

**Por que esta rota existe:**
- RF0033: Cadastro de venda
- RF0037: Pagamento via cartão de crédito
- RN0069: Parcelamento mínimo R$ 80,00
- RN0034: Mínimo R$ 10,00 por meio de pagamento no split

**Validações:**
- Usuário deve estar autenticado
- Itens não podem estar vazios
- Valor total deve ser positivo
- Valor total = itens + frete (tolerância R$ 0,02)
- Parcelamento respeita RN0069
- Pagamentos split respeitam RN0034

---

### GET /api/vendas/:uuid - Visualizar Detalhes da Venda

**Fluxo de Negócio:**
- Cliente ou admin consulta detalhes de uma venda específica
- Admin pode ver qualquer venda
- Cliente apenas suas próprias vendas
- Retorna mensagem genérica para "não encontrado" para evitar enumeração (OWASP)

**Payload de Entrada:**
- Parâmetro de rota: `uuid` (UUID da venda)

**Payload de Saída (Sucesso):**
```json
{
  "id": "423e4567-e89b-12d3-a456-426614174003",
  "uuid": "423e4567-e89b-12d3-a456-426614174003",
  "status": "ENTREGUE",
  "valorTotal": 114.8,
  "valorFrete": 15,
  "dataHoraCriacao": "2026-05-17T10:00:00Z",
  "dataHoraEntrega": "2026-05-20T14:30:00Z",
  "usuarioUuid": "123e4567-e89b-12d3-a456-426614174000",
  "itens": [...],
  "endereco": {...}
}
```

**Payload de Saída (Erro):**
```json
{
  "erro": "Venda não encontrada"
}
```

**Status Codes:**
- `200 OK`: Detalhes retornados com sucesso
- `404 Not Found`: Venda não encontrada ou acesso negado

**Por que esta rota existe:**
- RF0042: Consulta de vendas
- Segurança: Evita oráculo de existência de UUIDs

**Validações:**
- Usuário deve estar autenticado
- Admin ou dono da venda

---

### POST /api/vendas/:uuid/troca - Solicitar Troca

**Fluxo de Negócio:**
- Cliente solicita troca de itens de uma venda entregue
- Sistema valida se status é "ENTREGUE"
- Sistema valida prazo de 7 dias após data de entrega (RN0043)
- Sistema muda status para "EM TROCA"
- Sistema registra motivo e itens da troca

**Payload de Entrada:**
```json
{
  "motivo": "Produto não atendeu expectativas",
  "itensUuids": ["523e4567-e89b-12d3-a456-426614174004"]
}
```

**Payload de Saída (Sucesso):**
```json
{
  "id": "423e4567-e89b-12d3-a456-426614174003",
  "uuid": "423e4567-e89b-12d3-a456-426614174003",
  "status": "EM TROCA",
  "motivoTroca": "Produto não atendeu expectativas",
  "itens": [
    {
      "uuid": "523e4567-e89b-12d3-a456-426614174004",
      "emTroca": true
    }
  ]
}
```

**Payload de Saída (Erro - Prazo Expirado):**
```json
{
  "erro": "Prazo de 7 dias para troca expirado"
}
```

**Status Codes:**
- `200 OK`: Troca solicitada com sucesso
- `400 Bad Request`: Venda não encontrada, não entregue, prazo expirado

**Por que esta rota existe:**
- RF0043: Solicitação de troca/devolução
- RN0043: Prazo de arrependimento de 7 dias
- RN0063: Troca apenas para pedidos entregues

**Validações:**
- Usuário deve estar autenticado
- Usuário deve ser dono da venda
- Status deve ser "ENTREGUE"
- dataHoraEntrega deve estar registrada
- Data atual deve ser ≤ 7 dias após dataHoraEntrega

---

## 3. Rotas de Trocas (Admin)

### PATCH /api/admin/pedidos/:uuid/autorizar-troca - Autorizar Troca

**Fluxo de Negócio:**
- Admin autoriza solicitação de troca
- Sistema valida se status é "EM TROCA"
- Sistema muda status para "TROCA AUTORIZADA"
- Cliente pode enviar produto de volta

**Payload de Entrada:**
- Parâmetro de rota: `uuid` (UUID da venda)
- Body vazio

**Payload de Saída (Sucesso):**
```json
{
  "id": "423e4567-e89b-12d3-a456-426614174003",
  "uuid": "423e4567-e89b-12d3-a456-426614174003",
  "status": "TROCA AUTORIZADA"
}
```

**Payload de Saída (Erro):**
```json
{
  "erro": "Pedido não está em fase de solicitação de troca"
}
```

**Status Codes:**
- `200 OK`: Troca autorizada
- `400 Bad Request`: Status inválido

**Por que esta rota existe:**
- RF0044: Aprovação de troca pelo admin
- Workflow de aprovação: Cliente solicita → Admin autoriza → Cliente envia → Admin recebe

**Validações:**
- Usuário deve ser admin
- Status deve ser "EM TROCA"

---

### PATCH /api/admin/pedidos/:uuid/rejeitar-troca - Rejeitar Troca

**Fluxo de Negócio:**
- Admin rejeita solicitação de troca
- Sistema valida se status é "EM TROCA"
- Sistema muda status para "TROCA REJEITADA"
- Sistema registra motivo da rejeição
- Não gera cupom de troca

**Payload de Entrada:**
```json
{
  "motivo": "Produto danificado"
}
```

**Payload de Saída (Sucesso):**
```json
{
  "id": "423e4567-e89b-12d3-a456-426614174003",
  "uuid": "423e4567-e89b-12d3-a456-426614174003",
  "status": "TROCA REJEITADA",
  "motivoTroca": "Produto danificado"
}
```

**Status Codes:**
- `200 OK`: Troca rejeitada
- `400 Bad Request`: Status inválido

**Por que esta rota existe:**
- RF0045: Rejeição de troca pelo admin
- RN0065: Motivo obrigatório ao rejeitar

**Validações:**
- Usuário deve ser admin
- Status deve ser "EM TROCA"
- Motivo deve ser fornecido

---

### PATCH /api/admin/pedidos/:uuid/confirmar-recebimento - Confirmar Recebimento de Troca

**Fluxo de Negócio:**
- Admin confirma recebimento do produto devolvido
- Sistema valida se status é "TROCA AUTORIZADA"
- Sistema muda status para "CONCLUÍDA"
- Sistema gera código de cupom de troca
- Sistema cria cupom no banco de pagamentos
- Sistema pode retornar itens ao estoque (opcional)

**Payload de Entrada:**
```json
{
  "retornarEstoque": true
}
```

**Payload de Saída (Sucesso):**
```json
{
  "pedido": {
    "id": "423e4567-e89b-12d3-a456-426614174003",
    "uuid": "423e4567-e89b-12d3-a456-426614174003",
    "status": "CONCLUÍDA"
  },
  "cupomGerado": {
    "codigo": "TROCA-423E4567",
    "valor": 99.8
  }
}
```

**Status Codes:**
- `200 OK`: Recebimento confirmado, cupom gerado
- `400 Bad Request`: Status inválido

**Por que esta rota existe:**
- RF0054: Geração de cupom de troca
- RF0055: Retorno ao estoque opcional
- Código do cupom: `TROCA-{primeiros 8 chars do UUID}`

**Validações:**
- Usuário deve ser admin
- Status deve ser "TROCA AUTORIZADA"
- Valor do cupom = soma dos itens em troca

---

## 4. Rotas de Entregas

### POST /api/entregas - Agendar Remessa (Entrega)

**Fluxo de Negócio:**
- Sistema agenda remessa para uma venda
- Sistema valida se venda existe
- Sistema valida se custo do frete confere com venda
- Sistema cria registro de entrega
- Sistema muda status da venda para "EM TRÂNSITO"
- Sistema envia notificação de rastreio por email

**Payload de Entrada:**
```json
{
  "vendaUuid": "423e4567-e89b-12d3-a456-426614174003",
  "tipoFrete": "PAC",
  "endereco": "Rua Teste, 123 - São Paulo - SP",
  "custo": 15,
  "entregador": "Transportadora Padrão"
}
```

**Payload de Saída (Sucesso):**
```json
{
  "uuid": "623e4567-e89b-12d3-a456-426614174005",
  "vendaUuid": "423e4567-e89b-12d3-a456-426614174003",
  "tipoFrete": "PAC",
  "endereco": "Rua Teste, 123 - São Paulo - SP",
  "custo": 15,
  "entregador": "Transportadora Padrão",
  "status": "EM TRÂNSITO"
}
```

**Payload de Saída (Erro):**
```json
{
  "erro": "Custo da entrega não confere com o frete registrado na venda."
}
```

**Status Codes:**
- `201 Created`: Entrega agendada
- `400 Bad Request`: Venda não encontrada ou custo inválido

**Por que esta rota existe:**
- RF0046: Criação de entrega
- RN0067: Custo do frete validado
- Integração com notificação por email

**Validações:**
- Usuário deve estar autenticado
- Venda deve existir
- Custo deve conferir com frete da venda (tolerância R$ 0,02)

---

### PATCH /api/entregas/:entregaUuid/confirmar - Confirmar Recebimento

**Fluxo de Negócio:**
- Sistema confirma que produto foi entregue ao cliente
- Sistema valida se entrega existe
- Sistema muda status da venda para "ENTREGUE"
- Sistema registra data/hora de entrega (ven_data_hora_entrega)
- Sistema inicia contagem de 7 dias para troca

**Payload de Entrada:**
- Parâmetro de rota: `entregaUuid` (UUID da entrega)
- Body vazio

**Payload de Saída:**
- HTTP 204 No Content (sem corpo)

**Payload de Saída (Erro):**
```json
{
  "erro": "Entrega não encontrada para finalização."
}
```

**Status Codes:**
- `204 No Content`: Recebimento confirmado
- `400 Bad Request`: Entrega não encontrada

**Por que esta rota existe:**
- RF0047: Confirmação de entrega
- RN0043: Registro de dataHoraEntrega para validação de prazo de troca
- RN0068: Status "ENTREGUE" habilita solicitações de troca

**Validações:**
- Usuário deve estar autenticado
- Entrega deve existir

---

### PATCH /api/entregas/:entregaUuid/falha - Registrar Falha na Entrega

**Fluxo de Negócio:**
- Transportador registra falha na entrega (ex: endereço não encontrado)
- Sistema valida se entrega existe
- Sistema muda status da venda para "FALHA NA ENTREGA"
- Sistema permite reagendamento

**Payload de Entrada:**
- Parâmetro de rota: `entregaUuid` (UUID da entrega)
- Body vazio

**Payload de Saída:**
- HTTP 204 No Content (sem corpo)

**Payload de Saída (Erro):**
```json
{
  "erro": "Entrega não encontrada."
}
```

**Status Codes:**
- `204 No Content`: Falha registrada
- `400 Bad Request`: Entrega não encontrada

**Por que esta rota existe:**
- RF0048: Tratamento de falhas de entrega
- RN0069: Status "FALHA NA ENTREGA" permite reagendamento

**Validações:**
- Usuário deve estar autenticado
- Entrega deve existir

---

### GET /api/entregas?vendaUuid=:uuid - Listar Entregas por Venda

**Fluxo de Negócio:**
- Sistema lista todas as entregas vinculadas a uma venda
- Usado para rastrear histórico de entregas

**Payload de Entrada:**
- Query parameter: `vendaUuid` (UUID da venda)

**Payload de Saída (Sucesso):**
```json
[
  {
    "uuid": "623e4567-e89b-12d3-a456-426614174005",
    "vendaUuid": "423e4567-e89b-12d3-a456-426614174003",
    "tipoFrete": "PAC",
    "status": "ENTREGUE",
    "dataHoraCriacao": "2026-05-17T11:00:00Z"
  }
]
```

**Payload de Saída (Erro):**
```json
{
  "erro": "Venda UUID é obrigatório na query string."
}
```

**Status Codes:**
- `200 OK`: Lista retornada
- `400 Bad Request`: Parâmetro não fornecido

**Por que esta rota existe:**
- RF0049: Consulta de entregas
- Rastreamento de histórico logístico

**Validações:**
- Usuário deve estar autenticado
- vendaUuid deve ser fornecido

---

## 5. Rotas de Pagamentos

### POST /api/pagamento/processar - Processar Pagamento

**Fluxo de Negócio:**
- Sistema processa pagamento de uma venda
- Sistema valida dados do cartão
- Sistema comunica com operadora (simulado)
- Sistema cria registro de pagamento
- Sistema atualiza status da venda

**Payload de Entrada:**
```json
{
  "vendaUuid": "423e4567-e89b-12d3-a456-426614174003",
  "pagamentos": [
    {
      "tipo": "cartao",
      "valor": 114.8,
      "cartaoUuid": "223e4567-e89b-12d3-a456-426614174001",
      "parcelas": 1
    }
  ]
}
```

**Payload de Saída (Sucesso):**
```json
{
  "pagamentoUuid": "723e4567-e89b-12d3-a456-426614174006",
  "status": "APROVADO",
  "valor": 114.8
}
```

**Payload de Saída (Erro):**
```json
{
  "erro": "Dados de pagamento inválidos"
}
```

**Status Codes:**
- `200 OK`: Pagamento processado
- `400 Bad Request`: Dados inválidos

**Por que esta rota existe:**
- RF0037: Processamento de pagamentos
- RN0034: Validação de split payment

**Validações:**
- Usuário deve estar autenticado
- Venda deve existir
- Valor total deve conferir

---

### GET /api/cupom/disponiveis - Listar Cupons Disponíveis

**Fluxo de Negócio:**
- Sistema lista cupons disponíveis para o usuário logado
- Inclui cupons de troca gerados pelo sistema

**Payload de Entrada:**
- Token de autenticação no cookie

**Payload de Saída (Sucesso):**
```json
{
  "dados": [
    {
      "uuid": "823e4567-e89b-12d3-a456-426614174007",
      "codigo": "TROCA-423E4567",
      "valor": 99.8,
      "tipo": "troca",
      "validoAte": "2026-08-17T23:59:59Z"
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Lista retornada
- `401 Unauthorized`: Token não fornecido

**Por que esta rota existe:**
- RF0050: Consulta de cupons
- RF0054: Cupons de troca visíveis ao cliente

**Validações:**
- Usuário deve estar autenticado

---

## 6. Rotas de Carrinho

### POST /api/carrinho/itens - Adicionar Item ao Carrinho

**Fluxo de Negócio:**
- Cliente adiciona livro ao carrinho
- Sistema valida se livro existe e tem estoque
- Sistema atualiza ou cria item no carrinho

**Payload de Entrada:**
```json
{
  "livroUuid": "323e4567-e89b-12d3-a456-426614174002",
  "quantidade": 2
}
```

**Payload de Saída (Sucesso):**
```json
{
  "mensagem": "Item adicionado ao carrinho",
  "itens": [
    {
      "livroUuid": "323e4567-e89b-12d3-a456-426614174002",
      "quantidade": 2,
      "precoUnitario": 49.9
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Item adicionado
- `400 Bad Request`: Estoque insuficiente ou livro não encontrado

**Por que esta rota existe:**
- RF0031: Adição de itens ao carrinho
- RN0058: Validação de estoque

**Validações:**
- Usuário deve estar autenticado
- Livro deve existir
- Estoque deve ser suficiente

---

### GET /api/clientes/perfil - Obter Perfil do Cliente

**Fluxo de Negócio:**
- Sistema retorna dados completos do cliente
- Inclui endereços e cartões cadastrados
- Usado no checkout para preencher formulários

**Payload de Entrada:**
- Token de autenticação no cookie

**Payload de Saída (Sucesso):**
```json
{
  "dados": {
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "nome": "Cliente Teste",
    "email": "clientetest@email.com",
    "enderecos": [
      {
        "uuid": "923e4567-e89b-12d3-a456-426614174008",
        "rua": "Rua Teste",
        "numero": "123",
        "cidade": "São Paulo",
        "estado": "SP",
        "cep": "01234567"
      }
    ],
    "cartoes": [
      {
        "uuid": "223e4567-e89b-12d3-a456-426614174001",
        "ultimos4": "1234",
        "titular": "Cliente Teste"
      }
    ]
  }
}
```

**Status Codes:**
- `200 OK**: Perfil retornado
- `401 Unauthorized`: Token não fornecido

**Por que esta rota existe:**
- RF0032: Consulta de perfil
- Facilita checkout com dados pré-preenchidos

**Validações:**
- Usuário deve estar autenticado

---

## Resumo dos Casos de Uso

| Caso de Uso | Rotas Envolvidas | Status |
|-------------|------------------|--------|
| 1. Cliente realizar compra | POST /api/vendas | ✅ Implementado |
| 2. Cliente pagar com combinações | POST /api/pagamento/processar | ✅ Implementado |
| 3. Registrar novo cartão/endereço | POST /api/clientes/perfil/cartoes | ✅ Implementado |
| 4. Solicitar troca/devolução | POST /api/vendas/:uuid/troca | ✅ Implementado |
| 5. Admin confirma pagamento | POST /api/pagamento/processar | ✅ Implementado |
| 6. Admin aceitar/negar troca | PATCH /api/admin/pedidos/:uuid/autorizar-troca, rejeitar-troca | ✅ Implementado |
| 7. Admin define EM TRANSPORTE | POST /api/entregas | ✅ Implementado |
| 8. Admin confirma recebimento | PATCH /api/admin/pedidos/:uuid/confirmar-recebimento | ✅ Implementado |
| 9. Sistema gerar cupom | PATCH /api/admin/pedidos/:uuid/confirmar-recebimento | ✅ Implementado |
| 10. Admin confirma ENTREGUE | PATCH /api/entregas/:uuid/confirmar | ✅ Implementado |

---

## Configuração do Ambiente

- **Backend**: http://localhost:3002
- **Banco de Dados**: PostgreSQL via Docker (localhost:5432)
- **Schema**: les
- **NODE_ENV**: development

---

## Script de Teste BDD

O script completo de teste está disponível em: `backend/testar-cenarios-bdd-7-entrega.sh`

Para executar:
```bash
cd backend
chmod +x testar-cenarios-bdd-7-entrega.sh
./testar-cenarios-bdd-7-entrega.sh
```

---

## Observações Importantes

1. **Autenticação**: Todas as rotas (exceto públicas) requerem token JWT em cookie HttpOnly
2. **Autorização**: Rotas de admin requerem role "admin"
3. **Validações**: Backend valida regras de negócio (parcelamento, split payment, prazo de troca)
4. **Segurança**: IDs internos (BIGSERIAL) não são expostos na API, apenas UUIDs
5. **Tolerância Monetária**: Valores monetários têm tolerância de R$ 0,02 para comparações
