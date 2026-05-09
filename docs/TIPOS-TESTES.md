# Tipos de Testes no Projeto

Este documento explica a diferença entre os tipos de testes usados no projeto e quando usar cada um.

## 1. Testes de Repositório (Infraestrutura)

**Objetivo:** Testar queries SQL, otimizações e acesso a dados.

**Características:**
- Fazem SQL direto no banco de dados
- Testam apenas a camada de repositório
- Não passam pelas regras de negócio
- Focam em performance e otimizações (ex: N+1 queries)

**Quando usar:**
- Validar otimizações de queries (N+1, índices)
- Testar conversões de tipos (string/numeric)
- Validar ORDER BY para determinismo
- Testar edge cases de SQL (LEFT JOIN, NULL handling)

**Exemplo:**
```typescript
// src/tests/integracao/vendas/repositorio-vendas-n1-otimizacao.repositorio.test.ts
describe('RepositorioVendasPostgres - N+1 Optimization', () => {
  it('deve listar vendas com itens em uma única query', async () => {
    // SQL direto para criar dados
    await contexto.db!.executar(`INSERT INTO vendas ...`);
    
    // Testa apenas o repositório
    const vendas = await repositorio.listarPorUsuario(usuarioUuid);
    
    // Valida que itens foram carregados (prova de N+1 fix)
    expect(vendas[0].itens).toHaveLength(1);
  });
});
```

**Limitações:**
- **Ignora regras de negócio** - não valida RN0069, RN0034, etc.
- **Ignora validações de domínio** - pode criar estados inconsistentes
- **Não reflete comportamento real** - a aplicação nunca faria SQL direto

---

## 2. Testes de Serviço (Integração de Negócio)

**Objetivo:** Testar regras de negócio e validações de domínio.

**Características:**
- Usam os Services (Camada de Negócio)
- Passam por todas as validações e regras
- Testam o comportamento real da aplicação
- Garantem consistência de dados

**Quando usar:**
- Validar regras de negócio (RN0069, RN0034, RN0043, etc.)
- Testar validações de entrada (DTOs)
- Testar controle de acesso (admin vs cliente)
- Testar fluxos de negócio complexos

**Exemplo:**
```typescript
// src/tests/integracao/vendas/servico-vendas.integracao.test.ts
describe('ServicoVendas - Regras de Negócio', () => {
  it('deve lançar erro RN0069: parcelamento abaixo de R$ 80,00', async () => {
    const dados: IVendaInputDto = {
      usuarioUuid: 'uuid',
      itens: [...],
      valorTotal: 60,
      parcelas: 2,
    };
    
    // Usa o serviço, que aplica todas as validações
    await expect(servico.registrarPedidoVenda(dados))
      .rejects.toThrow('RN0069: Compras abaixo de R$ 80,00 não permitem parcelamento');
  });
});
```

**Vantagens:**
- **Valida regras de negócio** - RN0069, RN0034, RN0043, etc.
- **Valida consistência de dados** - não permite estados inválidos
- **Reflete comportamento real** - igual ao que a aplicação faz

---

## 3. Testes E2E (End-to-End)

**Objetivo:** Testar o fluxo completo da aplicação via HTTP, usando rotas para setup e testes.

**Características:**
- Testam via endpoints HTTP (Controllers)
- Passam por todas as camadas (Controller → Service → Repository)
- Testam autenticação, autorização e APIs
- Simulam comportamento real do usuário
- **Setup usa rotas HTTP** (sem SQL direto)

**Quando usar:**
- Testar APIs REST
- Validar autenticação e autorização
- Testar fluxos de usuário completos
- Validar integração entre módulos
- **Testar fluxos reais de negócio**

**Exemplo:**
```typescript
// src/tests/integracao/pagamentos/pagamentos-e2e.test.ts
describe('E2E - Pagamentos (Rotas HTTP)', () => {
  it('deve criar usuário, venda e pagamento usando apenas rotas HTTP', async () => {
    // Setup: Criar usuário via HTTP (sem SQL)
    const registroRes = await registrarCliente(app, {
      cpf: cpfUnico,
      email: emailUnico,
      limparDados: true,
    });

    // Login via HTTP
    const loginRes = await realizarLogin(app, emailUnico, 'SenhaForte@123');
    tokenCliente = loginRes.body.dados.token;

    // Criar venda via HTTP
    const vendaRes = await request(app)
      .post('/api/vendas')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ itens: [...], valorTotal: 60 });

    // Criar intenção de pagamento via HTTP
    const intencaoRes = await request(app)
      .post('/api/pagamentos/intencao-pagamento')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ vendaUuid, metodoPagamento: 'pix' });

    // Listar pagamentos via HTTP
    const listaRes = await request(app)
      .get(`/api/pagamentos/venda/${vendaUuid}/resumo`)
      .set('Authorization', `Bearer ${tokenCliente}`);
  });
});
```

**Vantagens:**
- **Testa fluxo completo** - igual ao que o usuário faz
- **Valida todas as camadas** - Controller, Service, Repository
- **Valida autenticação/autorização** - JWT, cookies, middlewares
- **Setup realista** - usa as mesmas rotas que a aplicação usa
- **Sem SQL direto** - tudo via HTTP, evitando estados inconsistentes

---

## Pirâmide de Testes

```
        /\
       /  \  E2E (Cypress) - Poucos, lentos, caros
      /____\
     /      \  Serviço (Integração) - Médio número, velocidade média
    /________\
   /          \  Repositório (Unitário) - Muitos, rápidos, baratos
  /____________\
```

**Recomendação:**
- **70%** Testes de Repositório (unitários de infraestrutura)
- **20%** Testes de Serviço (integração de negócio)
- **10%** Testes E2E (fluxos críticos)

---

## Problema Anterior

Os testes de integração originais foram nomeados incorretamente como "integração", mas na verdade eram testes de repositório que faziam SQL direto no banco, ignorando completamente as camadas de serviço e as regras de negócio.

**Correção aplicada:**
1. Renomeados para `*.repositorio.test.ts` - indicam que são testes de infraestrutura
2. Criados novos testes `*.integracao.test.ts` - usam Services e testam regras de negócio
3. Testes E2E continuam em `web/cypress/` - testam fluxos via HTTP

---

## Quando usar cada tipo

| Cenário | Tipo de Teste | Motivo |
|---------|---------------|---------|
| Otimizar query N+1 | Repositório | Testa apenas SQL e performance |
| Validar RN0069 (parcelamento) | Serviço | Testa regra de negócio |
| Validar autenticação JWT | E2E | Testa fluxo HTTP completo |
| Testar conversão string/numeric | Repositório | Testa apenas mapeamento de dados |
| Testar controle de acesso admin | Serviço | Testa regra de negócio |
| Testar API REST | E2E | Testa endpoint HTTP |
| Validar ORDER BY determinístico | Repositório | Testa apenas SQL |
| Testar prazo de troca (7 dias) | Serviço | Testa regra de negócio RN0043 |

---

## Referências

- [Testing Patterns Skill](backend/.agents/skills/testing-patterns/SKILL.md)
- [AGENTS.md](backend/AGENTS.md)
- [REGRAS-NEGOCIOS.md](../../documentacao-exigida/REGRAS-NEGOCIOS.md)
