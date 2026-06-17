# Padrões e Templates para Testes E2E

## 📋 Visão Geral

Este documento estabelece padrões, templates e boas práticas para criação e manutenção de testes E2E no projeto E-Commerce de Livros, garantindo consistência, manutenibilidade e qualidade.

## 🎯 Objetivos dos Padrões

1. **Consistência:** Todos os testes seguem a mesma estrutura
2. **Manutenibilidade:** Fácil de entender e modificar
3. **Confiabilidade:** Testes estáveis e reproduzíveis
4. **Performance:** Execução rápida e eficiente

## 🏗️ Estrutura Padrão de Teste

### Template Base
```typescript
import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { 
  obterTokenCliente, 
  obterTokenAdmin,
  // outros helpers necessários
} from '@/tests/helpers/requisicoes-api.util';
import { 
  gerarPayloadPedido,
  validarConsistenciaPrecos,
  LIVRO_UUID_TESTE 
} from '@/tests/helpers/precos-catalogo.helper';

describe('Integração - [Módulo] [Funcionalidade]', () => {
  const contexto = configurarTesteIntegracao();
  let tokenCliente: string;
  let tokenAdmin: string;

  beforeAll(async () => {
    // Setup inicial (tokens, usuários, etc.)
    tokenCliente = await obterTokenCliente(contexto.app);
    tokenAdmin = await obterTokenAdmin(contexto.app);
  });

  beforeEach(async () => {
    // Validar consistência de preços antes de cada teste
    await validarConsistenciaPrecos(contexto.db!);
  });

  describe('Cenários Felizes', () => {
    it('[RFXXXX] deve [descrição clara do cenário]', async () => {
      // 1. Arrange (preparação)
      const payload = await gerarPayloadPedido(contexto.db, LIVRO_UUID_TESTE);
      
      // 2. Act (execução)
      const res = await request(contexto.app)
        .post('/api/endpoint')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send(payload);
      
      // 3. Assert (validação)
      expect(res.status).toBe(201);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.dados).toHaveProperty('id');
    });
  });

  describe('Cenários de Falha', () => {
    it('[RFXXXX] deve falhar quando [condição de falha]', async () => {
      // Arrange com dados inválidos
      const payloadInvalido = { /* dados inválidos */ };
      
      // Act
      const res = await request(contexto.app)
        .post('/api/endpoint')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send(payloadInvalido);
      
      // Assert
      expect(res.status).toBe(400);
      expect(res.body.erro).toBeDefined();
    });
  });
});
```

## 📦 Padrões Específicos

### 1. Testes de Venda
```typescript
describe('Integração - Venda Completa', () => {
  // ... setup padrão ...

  it('deve criar venda com múltiplos itens', async () => {
    // Arrange
    const payload = await gerarPayloadPedido(contexto.db, LIVRO_UUID_TESTE, {
      quantidade: 2,
      valorFrete: 15
    });
    
    // Act
    const res = await request(contexto.app)
      .post('/api/vendas')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send(payload);
    
    // Assert
    expect(res.status).toBe(201);
    expect(res.body.valorTotalItens).toBe(159.80); // 2 * 79.90
    expect(res.body.valorTotal).toBe(174.80); // 159.80 + 15
  });
});
```

### 2. Testes de Pagamento
```typescript
describe('Integração - Pagamento Múltiplos Cartões', () => {
  // ... setup padrão ...

  it('deve processar pagamento com 3 cartões', async () => {
    // Arrange
    const { vendaPayload, pagamentoPayload } = await gerarPayloadPagamentoMultiplo(
      contexto.db,
      LIVRO_UUID_TESTE,
      { numeroCartoes: 3 }
    );
    
    // Criar venda
    const vendaRes = await request(contexto.app)
      .post('/api/vendas')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send(vendaPayload);
    
    // Act
    const res = await request(contexto.app)
      .post('/api/pagamento/processar')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        vendaUuid: vendaRes.body.id,
        ...pagamentoPayload
      });
    
    // Assert
    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.pagamentos).toHaveLength(3);
  });
});
```

### 3. Testes de Troca
```typescript
describe('Integração - Troca e Devolução', () => {
  // ... setup padrão ...

  async function criarPedidoEntregue() {
    // Helper específico para criar pedido entregue
    const payload = await gerarPayloadPedido(contexto.db, LIVRO_UUID_TESTE);
    const vendaRes = await request(contexto.app)
      .post('/api/vendas')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send(payload);
    
    const vendaUuid = vendaRes.body.id;
    await mudarStatusVendaTeste(contexto.app, tokenAdmin, vendaUuid, 'ENTREGUE');
    
    return vendaUuid;
  }

  it('deve solicitar troca com sucesso', async () => {
    // Arrange
    const vendaUuid = await criarPedidoEntregue();
    
    // Act
    const res = await request(contexto.app)
      .post(`/api/vendas/${vendaUuid}/troca`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ motivo: 'Produto com defeito' });
    
    // Assert
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('EM TROCA');
  });
});
```

### 4. Testes Administrativos
```typescript
describe('Integração - Gestão Administrativa', () => {
  // ... setup padrão ...

  it('deve agendar entrega com sucesso', async () => {
    // Arrange
    const { vendaUuid } = await criarVendaPedido(contexto.app, tokenCliente);
    
    // Act
    const res = await request(contexto.app)
      .post('/api/entregas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send(corpoAgendarEntrega(vendaUuid, 10));
    
    // Assert
    expect(res.status).toBe(201);
    expect(res.body.vendaUuid).toBe(vendaUuid);
    
    // Verificar status da venda
    const vendaRes = await request(contexto.app)
      .get(`/api/vendas/${vendaUuid}`)
      .set('Authorization', `Bearer ${tokenCliente}`);
    
    expect(vendaRes.body.status).toBe('EM TRÂNSITO');
  });
});
```

## 🎭 Padrões de Nomenclatura

### Nomes de Testes
```typescript
// ✅ Bom: claro e descritivo
it('[RF0024] deve listar clientes com paginação');
it('[RF0030] deve cadastrar novo cartão com dados válidos');
it('[RF0045] deve falhar ao criar venda sem itens');

// ❌ Ruim: genérico ou ambíguo
it('deve funcionar');
it('teste de venda');
it('valida endpoint');
```

### Nomes de Arquivos
```
✅ Bom: modulo-funcionalidade.integracao.test.ts
     checkout-completo.integracao.test.ts
     solicitacao-troca.integracao.test.ts

❌ Ruim: test.ts
     integration_test.js
     arquivo_de_teste.ts
```

### Nomes de Funções Helper
```typescript
// ✅ Bom: verbos no infinitivo, descritivos
async function criarPedidoEntregue()
async function gerarPayloadPagamentoMultiplo()
async function validarStatusVenda()

// ❌ Ruim: genéricos ou ambíguos
async function setup()
async function helper()
async function test()
```

## 🔧 Helpers Reutilizáveis

### 1. Setup de Teste
```typescript
// src/tests/helpers/setup-integracao.util.ts
export function configurarTesteIntegracao(porTeste = true) {
  // Configuração padrão já existe no projeto
}
```

### 2. Requisições API
```typescript
// src/tests/helpers/requisicoes-api.util.ts
export async function obterTokenCliente(app: Application): Promise<string>
export async function obterTokenAdmin(app: Application): Promise<string>
export async function criarVendaPedido(app: Application, token: string, opcoes?: any)
```

### 3. Preços e Payloads
```typescript
// src/tests/helpers/precos-catalogo.helper.ts
export async function gerarPayloadPedido(db: IConexaoBanco, livroUuid: string, opcoes?: any)
export async function gerarPayloadPagamentoMultiplo(db: IConexaoBanco, livroUuid: string, opcoes?: any)
export function calcularDivisaoPagamento(valorTotal: number, numeroCartoes: number): number[]
```

## 📊 Padrões de Assertivas

### 1. Status Codes
```typescript
// ✅ Bom: específico
expect(res.status).toBe(201);
expect(res.status).toBe(400);
expect(res.status).toBe(404);

// ❌ Ruim: genérico
expect(res.status).toBeGreaterThanOrEqual(200);
expect(res.status).toBeLessThan(500);
```

### 2. Estrutura de Resposta
```typescript
// ✅ Bom: validação estruturada
expect(res.body.sucesso).toBe(true);
expect(res.body.dados).toHaveProperty('id');
expect(res.body.dados).toHaveProperty('status');

// ✅ Bom: validação de arrays
expect(res.body.dados.clientes).toBeInstanceOf(Array);
expect(res.body.dados.clientes).toHaveLength(5);
```

### 3. Valores Numéricos
```typescript
// ✅ Bom: precisão numérica
expect(res.body.valorTotal).toBe(89.90);
expect(res.body.valorTotal).toBeCloseTo(89.90, 2);

// ✅ Bom: range de valores
expect(res.body.pagamentos.length).toBeGreaterThan(0);
expect(res.body.pagamentos.length).toBeLessThanOrEqual(10);
```

## 🚀 Padrões de Performance

### 1. Reutilização de Contexto
```typescript
// ✅ Bom: reutilizar contexto entre testes
describe('Integração - Módulo X', () => {
  const contexto = configurarTesteIntegracao();
  
  // Reutilizar mesma conexão
  beforeEach(async () => {
    await validarConsistenciaPrecos(contexto.db!);
  });
});
```

### 2. Paralelização Segura
```typescript
// ✅ Bom: testes independentes podem rodar em paralelo
describe('Testes Independentes', () => {
  it('teste A', async () => {
    // Usa dados isolados
  });
  
  it('teste B', async () => {
    // Usa dados diferentes
  });
});
```

### 3. Cleanup Adequado
```typescript
// ✅ Bom: limpeza explícita
afterEach(async () => {
  // Limpar dados criados no teste
  await contexto.db!.executar('DELETE FROM test_table WHERE test_id = $1', [testId]);
});
```

## 🐛 Padrões de Debugging

### 1. Logs Informativos
```typescript
// ✅ Bom: logs úteis para debugging
console.log('📚 Preço do livro:', preco);
console.log('💳 Divisão pagamento:', valores);
console.log('🔍 UUID da venda:', vendaUuid);
```

### 2. Assertivas com Mensagens
```typescript
// ✅ Bom: mensagens descritivas em falhas
expect(res.status, `Status esperado 201, recebido ${res.status}`).toBe(201);
expect(res.body.sucesso, 'Resposta deve indicar sucesso').toBe(true);
```

### 3. Dados de Teste Visíveis
```typescript
// ✅ Bom: dados de teste fáceis de identificar
const LIVRO_UUID_TESTE = 'a1b2c3d4-e5f6-7890-1234-56789abcdef0';
const EMAIL_TESTE = 'teste.e2e@exemplo.com';
```

## 📋 Checklist de Qualidade

### Antes de Commitar
- [ ] Teste segue estrutura padrão?
- [ ] Nomes são descritivos e seguem convenção?
- [ ] Usa helpers de preços dinâmicos?
- [ ] Valida status codes corretamente?
- [ ] Limpa dados após execução?
- [ ] Logs são informativos mas não excessivos?
- [ ] Teste é independente e reproduzível?

### Durante Review
- [ ] Lógica do teste está clara?
- [ ] Casos de borda são cobertos?
- [ ] Performance é adequada?
- [ ] Mensagens de erro são úteis?
- [ ] Não há segredos expostos?

## 🎯 Templates Prontos

### Template para Novo Módulo
```typescript
import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/helpers/setup-integracao.util';
import { obterTokenCliente, obterTokenAdmin } from '@/tests/helpers/requisicoes-api.util';
import { gerarPayloadPedido, validarConsistenciaPrecos } from '@/tests/helpers/precos-catalogo.helper';

describe('Integração - [Nome do Módulo]', () => {
  const contexto = configurarTesteIntegracao();
  let tokenCliente: string;
  let tokenAdmin: string;

  beforeAll(async () => {
    tokenCliente = await obterTokenCliente(contexto.app);
    tokenAdmin = await obterTokenAdmin(contexto.app);
  });

  beforeEach(async () => {
    await validarConsistenciaPrecos(contexto.db!);
  });

  describe('Cenários Felizes', () => {
    it('[RFXXXX] deve [descrição]', async () => {
      // Implementar teste
    });
  });

  describe('Cenários de Falha', () => {
    it('[RFXXXX] deve falhar quando [condição]', async () => {
      // Implementar teste
    });
  });
});
```

### Template para Novo Endpoint
```typescript
it('[RFXXXX] deve [ação] com [dados válidos]', async () => {
  // Arrange
  const payload = await gerarPayloadPedido(contexto.db, LIVRO_UUID_TESTE);
  
  // Act
  const res = await request(contexto.app)
    .post('/api/novo-endpoint')
    .set('Authorization', `Bearer ${tokenCliente}`)
    .send(payload);
  
  // Assert
  expect(res.status).toBe(201);
  expect(res.body.sucesso).toBe(true);
  // Validar campos específicos do endpoint
});
```

## 📚 Referências

- [Helper de Preços do Catálogo](../helpers/precos-catalogo.md)
- [Scripts de Automação](../../scripts/)
- [Documentação de RFs](../../../documentacao-exigida/REQUISITOS-FUNCIONAIS.md)

---

**Última atualização:** 31/05/2026  
**Versão:** 1.0.0  
**Autor:** Equipe de Desenvolvimento Backend