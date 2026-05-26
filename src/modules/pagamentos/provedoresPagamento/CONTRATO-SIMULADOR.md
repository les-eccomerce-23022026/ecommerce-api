# Contrato do ProvedorPagamentoSimulado

**Propósito:** Documentar o contrato do simulador de pagamento para uso em testes e desenvolvimento, distinguindo entre comportamentos de domínio real e facilitadores de teste.

**Arquivo de implementação:** `ProvedorPagamentoSimulado.ts`

---

## 1. Visão Geral

O `ProvedorPagamentoSimulado` é uma implementação didática da interface `IProvedorPagamento` que simula o comportamento de um PSP (Payment Service Provider) real. Ele persiste intenções de pagamento no banco com mecanismos de segurança (HMAC, TTL) e valida regras de negócio críticas.

**Importante:** Este simulador **não** replica o contrato de PSPs reais (Stripe, Pagar.me, Cielo). Diferenças fundamentais são documentadas na seção 4.

---

## 2. Contrato de API

### 2.1 `registrarIntencaoPagamento(valor: number): Promise<ResultadoIntencaoPagamento>`

**Entrada:**
- `valor`: número positivo e finito representando o valor total da intenção

**Saída:**
```typescript
{
  idIntencao: string;        // UUID v4 gerado
  segredoConfirmacao: string; // Hex string (48 caracteres) para HMAC
}
```

**Comportamento:**
- Gera UUID v4 para `idIntencao`
- Gera segredo aleatório (24 bytes → 48 caracteres hex)
- Calcula hash HMAC do segredo para persistência
- Define TTL baseado em `obterTtlMinutosIntencaoPagamento()`
- Persiste no banco via `IRepositorioIntencaoPagamento.inserirSimulado()`

**Erros:**
- Lança `Error` se `valor <= 0` ou não for finito

---

### 2.2 `confirmarPagamento(dados: DadosConfirmacaoProvedor): Promise<ResultadoConfirmacaoPagamento>`

**Entrada:** `DadosConfirmacaoProvedor`

```typescript
{
  valorTotal: number;
  pagamentosCartao?: Array<{
    valor: number;
    parcelasCartao?: number;
    magicRecusar?: boolean;  // ← CAMPO DE TESTE (não existe em PSP real)
  }>;
  idIntencao?: string;
  segredoConfirmacao?: string;
  confirmacaoServicoInterna?: boolean;
  cartaoParaSimulacao?: {
    ultimosDigitos: string;  // ← CAMPO DE TESTE (dígitos mágicos)
  };
}
```

**Saída:**
```typescript
{
  sucesso: boolean;
  status: 'APROVADO' | 'RECUSADO' | 'FRAUDE';
}
```

---

## 3. Regras de Validação (Comportamento de Domínio)

### 3.1 Validações de Intenção Persistida

Quando `confirmacaoServicoInterna = false` (fluxo padrão):

1. **Identificadores obrigatórios:** `idIntencao` e `segredoConfirmacao` devem estar presentes
2. **Registro válido:** Intenção deve existir no banco e estar em estado `CRIADA`
3. **Expiração:** Intenção expirada (TTL) → recusa com atualização de estado para `EXPIRADA`
4. **Segredo HMAC:** Segredo deve corresponder ao hash persistido (verificação HMAC)
5. **Valor divergente:** Valor da confirmação deve coincidir com valor da intenção (tolerância 0.01)
6. **Soma de cartões:** Se `pagamentosCartao` informado, soma deve igualar `valorTotal` (tolerância 0.01)

### 3.2 Teto de Simulação

- Variável de ambiente: `SIMULACAO_TETO_PAGAMENTO` (padrão: 1000)
- Se `valorTotal > teto` → pagamento recusado
- Se `valorTotal <= teto` → pagamento aprovado

**Nota:** Este teto é um artifício de teste para simular limites de crédito/risco em ambiente de desenvolvimento.

### 3.3 Estados de Intenção

| Estado | Significado | Quando é atribuído |
|--------|-------------|-------------------|
| `CRIADA` | Intenção registrada, aguardando confirmação | Ao criar via `registrarIntencaoPagamento` |
| `CONFIRMADA` | Pagamento aprovado e confirmado | Quando validações passam e valor <= teto |
| `RECUSADA` | Pagamento recusado (valor, segredo, expirada, etc.) | Quando qualquer validação falha |
| `EXPIRADA` | Intenção expirou por TTL | Quando `Date.now() > expiraEm` |

---

## 4. Campos e Comportamentos Exclusivos de Teste

### 4.1 `magicRecusar` (em `pagamentosCartao`)

**Propósito:** Forçar recusa em cenários de teste de atomicidade multi-cartão

**Uso:**
```typescript
{
  pagamentosCartao: [
    { valor: 50, magicRecusar: false },  // 1º cartão: válido
    { valor: 50, magicRecusar: true }    // 2º cartão: forçar recusa
  ]
}
```

**Comportamento:** Se qualquer cartão tiver `magicRecusar = true`, pagamento é recusado.

**Importante:** Este campo **não existe** em APIs de PSPs reais. É um facilitador de teste para validar atomicidade no fluxo de multi-cartão.

### 4.2 `cartaoParaSimulacao.ultimosDigitos` (Dígitos Mágicos)

**Propósito:** Simular comportamentos específicos de adquirentes em testes

**Valores reservados:**
- `'0002'` → Força status `RECUSADO`
- `'0005'` → Força status `FRAUDE`

**Uso:**
```typescript
{
  cartaoParaSimulacao: { ultimosDigitos: '0002' }
}
```

**Comportamento:** Verificação ocorre antes de outras validações. Se os dígitos correspondem, retorna imediatamente o status forçado.

**Importante:** Em PSPs reais, recusas e fraudes são determinadas por regras complexas de risco, antifraude e validações de rede — não por dígitos fixos.

### 4.3 `confirmacaoServicoInterna`

**Propósito:** Permite confirmação sem intenção persistida (usado pelo serviço de domínio quando pagamento já foi registrado com UUID)

**Comportamento:** Quando `true`, pula validações de intenção persistida e aplica apenas validação de teto.

---

## 5. Diferenças vs PSPs Reais

| Aspecto | PSP Real (Stripe, Pagar.me, Cielo) | ProvedorPagamentoSimulado |
|---------|----------------------------------|---------------------------|
| **Modelo de cobrança** | Intenção por instrumento, capturas parciais, webhooks assíncronos, idempotência | Confirmação "em lote" com lista de cartões; fluxo síncrono no request HTTP |
| **Falha do 2º cartão** | Chargeback, estorno parcial, estados intermediários longos | `magicRecusar` em pagamentosCartao — campo de teste |
| **Segurança** | PCI, tokenização, sem dados sensíveis no payload de app | Adequado para lab; não replica contrato de token/network token |
| **Webhooks** | Assíncronos, retry, assinatura de evento | Não implementado |
| **Idempotência** | Chave de idempotência obrigatória em requests | Não implementado |
| **Estados intermediários** | `processing`, `requires_action`, `requires_capture` | Apenas `CRIADA`, `CONFIRMADA`, `RECUSADA`, `EXPIRADA` |

---

## 6. Variáveis de Ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `SIMULACAO_TETO_PAGAMENTO` | `1000` | Teto máximo para aprovação em simulação |
| `PROVEDOR_PAGAMENTO` | Obrigatório | Deve ser `'simulado'` para usar este provedor |

---

## 7. Uso em Testes

### 7.1 Teste de Integração (Exemplo)

```typescript
// venda-completa.integracao.test.ts
const resultado = await provedor.confirmarPagamento({
  valorTotal: 100,
  pagamentosCartao: [
    { valor: 50, magicRecusar: false },
    { valor: 50, magicRecusar: true }  // Força falha no 2º cartão
  ],
  idIntencao: intencaoId,
  segredoConfirmacao: segredo
});

expect(resultado.sucesso).toBe(false);
expect(resultado.status).toBe('RECUSADO');
```

### 7.2 Teste de Dígitos Mágicos

```typescript
const resultado = await provedor.confirmarPagamento({
  valorTotal: 100,
  cartaoParaSimulacao: { ultimosDigitos: '0005' }
});

expect(resultado.sucesso).toBe(false);
expect(resultado.status).toBe('FRAUDE');
```

---

## 8. Migração para PSP Real

Para migrar para um PSP real (ex: Stripe Sandbox):

1. Implementar `ProvedorPagamentoStripe` seguindo a interface `IProvedorPagamento`
2. Adaptar `DadosConfirmacaoProvedor` para remover campos de teste (`magicRecusar`, `cartaoParaSimulacao`)
3. Implementar webhooks para atualizações assíncronas de estado
4. Adicionar chave de idempotência para requests
5. Testar contra sandbox do PSP antes de produção

**Nota:** Os testes de integração atuais continuam válidos contra o simulador. Um job opcional de CI pode validar contra sandbox real.
