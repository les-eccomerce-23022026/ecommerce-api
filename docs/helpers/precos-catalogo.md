# Helper de Preços do Catálogo

## 📚 Visão Geral

O helper `precos-catalogo.helper.ts` foi criado para centralizar e automatizar a gestão de preços nos testes E2E, eliminando valores fixos e garantindo consistência com o banco de dados.

## 🎯 Problema Resolvido

### Antes
```typescript
// ❌ Valores fixos e inconsistentes
const preco = 50; // Hardcoded
const total = 89.90; // Não corresponde ao catálogo
```

### Depois
```typescript
// ✅ Preços dinâmicos do catálogo
const preco = await obterPrecoCatalogo(db, livroUuid);
const payload = await gerarPayloadPedido(db, livroUuid);
```

## 🛠️ API Completa

### Funções Principais

#### `obterPrecoCatalogo(db, livroUuid?)`
Obtém o preço real do livro no catálogo.

```typescript
const preco = await obterPrecoCatalogo(db, 'a1b2c3d4-e5f6-7890-1234-56789abcdef0');
// Retorna: 79.90
```

**Parâmetros:**
- `db: IConexaoBanco` - Conexão com o banco
- `livroUuid?: string` - UUID do livro (padrão: LIVRO_UUID_TESTE)

**Retorno:** `Promise<number>` - Preço do livro

#### `gerarPayloadPedido(db, livroUuid?, opcoes?)`
Gera payload completo para criação de venda.

```typescript
const payload = await gerarPayloadPedido(db, livroUuid, {
  quantidade: 2,
  valorFrete: 15
});
```

**Retorno:**
```typescript
{
  itens: [{ livroUuid, quantidade: 2, precoUnitario: 79.90 }],
  valorTotalItens: 159.80,
  valorFrete: 15,
  valorTotal: 174.80
}
```

#### `calcularDivisaoPagamento(valorTotal, numeroCartoes?)`
Calcula divisão precisa para múltiplos cartões.

```typescript
const valores = calcularDivisaoPagamento(89.90, 2);
// Retorna: [44.95, 44.95]
```

#### `gerarPayloadPagamentoMultiplo(db, livroUuid?, opcoes?)`
Gera payload completo para pagamento com múltiplos cartões.

```typescript
const { vendaPayload, pagamentoPayload } = await gerarPayloadPagamentoMultiplo(
  db, 
  livroUuid, 
  { numeroCartoes: 3 }
);
```

#### `validarConsistenciaPrecos(db)`
Valida se preços no banco correspondem aos esperados.

```typescript
const consistente = await validarConsistenciaPrecos(db);
// Retorna: true/false com logs informativos
```

### Constantes

```typescript
export const LIVRO_UUID_TESTE = 'a1b2c3d4-e5f6-7890-1234-56789abcdef0';
export const PRECO_CATALOGO_PADRAO = 79.90;
export const FRETE_PADRAO = 10;
```

## 📋 Exemplos de Uso

### Teste Simples de Venda
```typescript
import { gerarPayloadPedido } from '@/tests/helpers/precos-catalogo.helper';

it('deve criar venda com preço dinâmico', async () => {
  const payload = await gerarPayloadPedido(contexto.db, LIVRO_UUID_TESTE);
  
  const res = await request(app)
    .post('/api/vendas')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
    
  expect(res.status).toBe(201);
  expect(res.body.valorTotal).toBe(89.90); // 79.90 + 10 frete
});
```

### Pagamento com Múltiplos Cartões
```typescript
import { gerarPayloadPagamentoMultiplo } from '@/tests/helpers/precos-catalogo.helper';

it('deve processar pagamento com 2 cartões', async () => {
  const { vendaPayload, pagamentoPayload } = await gerarPayloadPagamentoMultiplo(
    contexto.db,
    LIVRO_UUID_TESTE,
    { numeroCartoes: 2 }
  );
  
  // Criar venda
  const vendaRes = await request(app)
    .post('/api/vendas')
    .send(vendaPayload);
    
  // Processar pagamento
  const pagamentoRes = await request(app)
    .post('/api/pagamento/processar')
    .send({
      vendaUuid: vendaRes.body.id,
      ...pagamentoPayload
    });
    
  expect(pagamentoRes.body.sucesso).toBe(true);
});
```

### Validação Antes dos Testes
```typescript
beforeEach(async () => {
  // Validar consistência de preços antes de cada teste
  await validarConsistenciaPrecos(contexto.db!);
});
```

## 🔧 Scripts de Automação

### Validação de Preços
```bash
# Validar consistência de preços
npx tsx scripts/validar-precos-teste.ts

# Saída esperada:
# 📚 Preço do livro a1b2c3d4-e5f6-7890-1234-56789abcdef0: R$ 79.9
# ✅ Preços consistentes: R$ 79.9
# ✅ Todos os preços estão consistentes!
```

### Alinhamento de Preços
```bash
# Verificar o que precisa ser alinhado
npx tsx scripts/alinhar-precos-teste.ts

# Forçar alinhamento
npx tsx scripts/alinhar-precos-teste.ts --forçar
```

## 📊 Logs e Debugging

O helper gera logs informativos para facilitar debugging:

```
📚 Preço do livro a1b2c3d4-e5f6-7890-1234-56789abcdef0: R$ 79.9
✅ Preços consistentes: R$ 79.9
💳 Divisão pagamento 2 cartões: [44.95, 44.95]
```

### Logs de Erro
```
⚠️ Livro uuid-inexistente não encontrado no catálogo. Usando preço padrão: R$ 79.90
❌ Inconsistência de preços detectada:
   Catálogo: R$ 50.00
   Esperado: R$ 79.90
```

## 🚀 Boas Práticas

### 1. Sempre usar preços dinâmicos
```typescript
// ❌ Ruim
const precoFixo = 50;

// ✅ Bom
const preco = await obterPrecoCatalogo(db);
```

### 2. Validar antes dos testes
```typescript
beforeEach(async () => {
  await validarConsistenciaPrecos(contexto.db!);
});
```

### 3. Usar helpers para payloads
```typescript
// ❌ Ruim
const payload = {
  itens: [{ livroUuid, quantidade: 1, precoUnitario: 50 }],
  valorTotalItens: 50,
  valorFrete: 10,
  valorTotal: 60
};

// ✅ Bom
const payload = await gerarPayloadPedido(db, livroUuid);
```

### 4. Tratar múltiplos cartões
```typescript
// ❌ Ruim
const valor1 = 44.95;
const valor2 = 44.95;

// ✅ Bom
const [valor1, valor2] = calcularDivisaoPagamento(total, 2);
```

## 🔧 Integração CI/CD

### Package.json
```json
{
  "scripts": {
    "test:validar-precos": "npx tsx scripts/validar-precos-teste.ts",
    "test:alinhar-precos": "npx tsx scripts/alinhar-precos-teste.ts --forçar",
    "test:e2e:completo": "npm run test:validar-precos && npm test -- --testPathPattern=integracao"
  }
}
```

### GitHub Actions
```yaml
- name: Validar Preços
  run: npm run test:validar-precos

- name: Testes E2E
  run: npm run test:e2e:completo
```

## 📈 Extensão Futura

### Suporte a Múltiplos Livros
```typescript
const livros = [
  { uuid: 'livro-1-uuid', quantidade: 2 },
  { uuid: 'livro-2-uuid', quantidade: 1 }
];

const payload = await gerarPayloadMultiplosLivros(db, livros);
```

### Cache de Preços
```typescript
// Implementar cache para evitar queries repetidas
const preco = await obterPrecoCatalogoComCache(db, livroUuid);
```

### Validação em Lote
```typescript
const resultados = await validarLotePrecos(db, [
  'livro-1-uuid',
  'livro-2-uuid'
]);
```

## 🐛 Troubleshooting

### Problema: Preços inconsistentes
**Sintoma:** Testes falham com valores diferentes
**Solução:** Execute `npx tsx scripts/alinhar-precos-teste.ts --forçar`

### Problema: Livro não encontrado
**Sintoma:** "Livro não encontrado no catálogo"
**Solução:** Verifique se o UUID existe no banco ou se os seeds foram executados

### Problema: Conexão com banco
**Sintoma:** Erro de conexão PostgreSQL
**Solução:** Verifique variáveis de ambiente `DB_HOST`, `DB_PORT`, etc.

### Problema: Arredondamento
**Sintoma:** Diferença de centavos em cálculos
**Solução:** Use `calcularDivisaoPagamento()` que trata arredondamento corretamente

## 📚 Referências

- [Documentação de Testes E2E](../testes/padroes-e2e.md)
- [Scripts de Automação](../../scripts/)
- [Relatórios de Validação](../../../relatorios/)

---

**Última atualização:** 31/05/2026  
**Versão:** 1.0.0  
**Autor:** Equipe de Desenvolvimento Backend