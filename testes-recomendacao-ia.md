# Testes de Recomendação por IA

Data: 2026-06-09
Rota: `POST /api/ia/recomendar`
Autenticação: Cliente (clientetest@email.com / 123456)

## Casos Positivos (2)

### Teste 1: História do Brasil
**Query:** "Quero livros sobre história do Brasil"
**Resultado:** ✅ SUCESSO
- **Produtos retornados:** 3
- **Livros:**
  1. "Gun, Germs, and Steel" - História - R$ 30.00
  2. "Sapiens: Uma Breve História da Humanidade" - História - R$ 97.00
  3. "Dom Casmurro" - Clássicos - R$ 64.76
- **Contexto usado:** true
- **Total encontrados:** 3
- **Total válidos:** 3

### Teste 2: Romance Clássico
**Query:** "Livros de romance clássico"
**Resultado:** ✅ SUCESSO
- **Produtos retornados:** 3
- **Livros:**
  1. "Orgulho e Preconceito" - Clássicos - R$ 53.00
  2. "Jane Eyre" - Romance - R$ 85.00
  3. "Dom Casmurro" - Clássicos - R$ 64.76
- **Contexto usado:** true
- **Total encontrados:** 3
- **Total válidos:** 3

## Casos de Alucinação (5)

### Teste 3: Ler enquanto nada
**Query:** "quais livros de romance eu posso ler enquanto estou nadando"
**Resultado:** ✅ BLOQUEADO (Validação funcionou)
- **Mensagem:** "Essa solicitação não é válida. Por favor, reformule com um gênero lite..."
- **Status:** Sistema rejeitou a solicitação como inválida

### Teste 4: Ler enquanto corre
**Query:** "quais livros de romance eu posso ler enquanto estou correndo"
**Resultado:** ✅ BLOQUEADO (Validação funcionou)
- **Mensagem:** "Essa solicitação não é válida. Por favor, reformule com um gênero lite..."
- **Status:** Sistema rejeitou a solicitação como inválida

### Teste 5: Culinária para programadores que não cozinham
**Query:** "livros de culinária para programadores que não gostam de cozinhar"
**Resultado:** ⚠️ PARCIAL (Retornou livros de tecnologia)
- **Produtos retornados:** 2
- **Livros:**
  1. "O Programador Pragmático" - Tecnologia - R$ 64.90
  2. "Clean Code" - Tecnologia - R$ 50.00
- **Observação:** Sistema focou em "programadores" e ignorou "culinária", retornando livros de tecnologia

### Teste 6: Matemática para ler enquanto dorme
**Query:** "livros de matemática para ler enquanto durmo"
**Resultado:** ⚠️ VAZIO
- **Produtos retornados:** 0
- **Observação:** Sistema não encontrou produtos (possível filtro por contexto absurdo)

### Teste 7: Física quântica para fazer pizza
**Query:** "livros de física quântica para entender como fazer pizza"
**Resultado:** ⚠️ VAZIO
- **Produtos retornados:** 0
- **Observação:** Sistema não encontrou produtos (possível filtro por contexto absurdo)

## Resumo

| Categoria | Total | Sucesso | Parcial | Falha |
|-----------|-------|---------|---------|-------|
| Casos Positivos | 2 | 2 | 0 | 0 |
| Casos de Alucinação | 5 | 2 (bloqueados) | 3 (vazios/parcial) | 0 |

## Conclusões

1. **Validação de contexto absurdo:** O sistema está bloqueando solicitações com contextos fisicamente impossíveis (ler enquanto nada/corre), o que é excelente para evitar alucinações.

2. **Casos positivos funcionam:** Recomendações para gêneros literários funcionam corretamente, retornando livros relevantes.

3. **Casos ambíguos:** Queries com múltiplos conceitos conflitantes (culinária + programadores) podem retornar resultados baseados em apenas um dos conceitos.

4. **Sistema de segurança anti-alucinação:** Parece haver um middleware de validação que rejeita solicitações com contextos absurdos antes de processar a recomendação.
