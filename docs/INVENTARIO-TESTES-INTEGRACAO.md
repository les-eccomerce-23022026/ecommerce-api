# Inventário de Testes de Integração - Backend

**Data da revisão:** 2026-05-19  
**Escopo validado:** `backend/src/tests/integracao/componentes/`  
**Total de arquivos:** 29  
**Total de linhas de teste:** 5.815  
**Total de cenários `it(...)`:** 270  
**Configuração:** Jest + Supertest, execução sequencial com `--runInBand` e isolamento por `configurarTesteIntegracao`.

---

## 1. Resumo Executivo

O inventário anterior estava desatualizado: considerava apenas 16 arquivos e não incluía os domínios `administrativo`, `autenticacao`, `catalogo` e `venda`. A estrutura atual está mais completa e cobre fluxos críticos de API, autenticação, permissões, catálogo, cliente, entrega, pagamento e venda.

| Domínio | Arquivos | Linhas | Cenários | Status de Cobertura |
|---------|----------|--------|----------|---------------------|
| Administrativo | 2 | 293 | 15 | ✅ Boa |
| Autenticação | 3 | 687 | 38 | ✅ Boa |
| Catálogo | 4 | 1.326 | 47 | ✅ Boa |
| Cliente | 8 | 1.339 | 61 | ✅ Boa |
| Entrega | 4 | 559 | 27 | ⚠️ Parcial |
| Geral | 2 | 376 | 20 | ✅ Boa |
| Pagamento | 4 | 754 | 37 | ✅ Boa |
| Venda | 2 | 481 | 25 | ⚠️ Parcial |
| **Total** | **29** | **5.815** | **270** | **✅ Boa com lacunas pontuais** |

### Avaliação Senior

| Aspecto | Avaliação | Observação |
|---------|-----------|------------|
| Organização por domínio | ✅ Boa | A pasta `componentes` já separa bem os contextos principais. |
| Rastreamento RF/RN/RNF | ✅ Boa | Muitos cenários usam marcações como `[RF0033]`, `[RN0069]` e `[RNF0037]`. |
| Integração HTTP real | ✅ Boa | Uso recorrente de Supertest contra `criarAplicacao()`. |
| Isolamento | ✅ Bom | O padrão `configurarTesteIntegracao(true)` centraliza escopo e rollback/limpeza. |
| Segurança/autorização | ✅ Boa | Há cobertura explícita para 401/403, papéis e multi-tenancy. |
| Lacunas de negócio | ⚠️ Parcial | Entrega final, baixa de estoque e cupom excedente ainda exigem validação mais explícita. |
| Manutenibilidade | ⚠️ Média | Alguns arquivos passam de 300 linhas e misturam múltiplas responsabilidades. |

---

## 2. Configuração Técnica Validada

| Item | Situação |
|------|----------|
| Framework | Jest 29 + ts-jest |
| Cliente HTTP | Supertest |
| Ambiente | `testEnvironment: node` |
| Descoberta | `**/*.test.ts`, `**/*.spec.ts` dentro de `src` |
| Execução | `maxWorkers: 1` no Jest e scripts com `--runInBand` |
| Setup global | `src/tests/setup/teste.setup.ts` |
| Teardown global | `src/tests/setup/global-teardown.ts` |
| Isolamento | `src/tests/utils/setup-integracao.util.ts` |
| Script principal | `npm run test:int` |

### Scripts relevantes

| Script | Comando |
|--------|---------|
| `test:int` | `jest --runInBand src/tests/integracao` |
| `test:coverage` | `jest --runInBand --coverage` |
| `test:auditoria` | `jest --runInBand src/tests/auditoria-condicionais.test.ts` |
| `db:setup:test` | `../scripts/setup-db-unificado.sh --env test` |
| `docker:up:test` | `docker compose -f docker-compose.test.yml up -d` |

---

## 3. Inventário por Domínio

### 3.1 Administrativo

| Arquivo | Linhas | Cenários | Foco Principal |
|---------|--------|----------|----------------|
| `administrativo/gestao-admin-mestre.integracao.test.ts` | 134 | 5 | Gestão de administradores por admin mestre |
| `administrativo/permissoes-listagens.integracao.test.ts` | 159 | 10 | Permissões e listagens administrativas |

**Avaliação:** ✅ Boa cobertura para papéis administrativos, criação/listagem e barreiras de permissão.

**Pontos de atenção:**

- **Atualização/inativação:** validar se fluxos de edição e inativação de administradores estão completos.
- **Multi-tenancy administrativo:** garantir que admin comum não acesse dados de outra loja.

### 3.2 Autenticação

| Arquivo | Linhas | Cenários | Foco Principal |
|---------|--------|----------|----------------|
| `autenticacao/login.integracao.test.ts` | 154 | 9 | Login de cliente/admin, credenciais inválidas e sessão |
| `autenticacao/multi-tenancy.integracao.test.ts` | 220 | 10 | Contexto de loja e isolamento multi-tenant |
| `autenticacao/seguranca-basica.integracao.test.ts` | 313 | 19 | Proteções básicas, endpoints públicos/protegidos e autorização |

**Avaliação:** ✅ Boa. O domínio cobre autenticação, autorização e isolamento de loja com cenários positivos e negativos.

**Pontos fortes:**

- **Papéis:** validação de cliente, admin comum e admin mestre.
- **Falhas:** credenciais inválidas e acesso sem token.
- **Segurança:** cobertura de endpoints protegidos e regras de acesso.

**Pontos de atenção:**

- **Cookie seguro:** confirmar explicitamente atributos `HttpOnly`, `Secure` e `SameSite` quando a autenticação usar cookie.
- **Expiração de sessão:** ampliar cenários de token expirado/inválido.

### 3.3 Catálogo

| Arquivo | Linhas | Cenários | Foco Principal |
|---------|--------|----------|----------------|
| `catalogo/acesso-produtos-admin.integracao.test.ts` | 366 | 14 | Acesso ao catálogo conforme papel administrativo |
| `catalogo/bulk-insert.integracao.test.ts` | 362 | 13 | Cadastro em lote, validações e integração com entrega |
| `catalogo/listagem-detalhes-criar-livro.integracao.test.ts` | 141 | 6 | Listagem, detalhes e criação de livro |
| `catalogo/listagem-livros-integracao.test.ts` | 457 | 14 | Listagem, filtros, detalhes, criação e atualização |

**Avaliação:** ✅ Boa. Cobre catálogo público, operações administrativas, criação individual e em lote.

**Pontos fortes:**

- **Listagem pública:** catálogo e detalhes de livro.
- **Administração:** criação e atualização por usuário autorizado.
- **Validações:** preço, estoque e dados obrigatórios aparecem em cenários de criação.

**Pontos de atenção:**

- **Arquivo grande:** `listagem-livros-integracao.test.ts` concentra muitos fluxos e pode ser dividido por intenção.
- **Regras de estoque:** a existência de estoque é validada no cadastro, mas a baixa após venda precisa de teste dedicado no domínio Venda/Pagamento.

### 3.4 Cliente

| Arquivo | Linhas | Cenários | Foco Principal |
|---------|--------|----------|----------------|
| `cliente/atualizacao-cadastral.integracao.test.ts` | 473 | 15 | Atualização cadastral completa e validações |
| `cliente/cadastro.integracao.test.ts` | 71 | 6 | Registro de cliente e validações básicas |
| `cliente/cartoes.integracao.test.ts` | 227 | 12 | CRUD de cartões e cartão principal |
| `cliente/enderecos.integracao.test.ts` | 109 | 5 | CRUD de endereços |
| `cliente/enderecos-limite.integracao.test.ts` | 89 | 1 | Limite de endereços |
| `cliente/inativacao.integracao.test.ts` | 43 | 3 | Inativação de conta |
| `cliente/perfil.integracao.test.ts` | 195 | 12 | Consulta e atualização de perfil |
| `cliente/senha.integracao.test.ts` | 132 | 7 | Alteração de senha |

**Avaliação:** ✅ Boa. O domínio Cliente possui a maior quantidade de cenários e cobre cadastro, perfil, endereços, cartões, senha e inativação.

**Cobertura validada:**

| Regra/Cenário | Situação |
|---------------|----------|
| Cadastrar cliente | ✅ Coberto |
| Atualizar perfil/cadastro | ✅ Coberto |
| Inativar cliente | ✅ Coberto |
| Gerenciar endereços | ✅ Coberto |
| Limite de endereços | ✅ Coberto |
| Gerenciar cartões | ✅ Coberto |
| Alterar senha | ✅ Coberto |
| CPF, e-mail, telefone e senha forte | ✅ Coberto também em `geral/validacao-dados.integracao.test.ts` |

**Pontos de atenção:**

- **RN0021/RN0022:** endereços obrigatórios de cobrança e entrega ainda parecem implícitos; recomenda-se teste explícito.
- **RN0025:** bandeiras permitidas em cartão devem ter teste explícito para rejeição de bandeira fora da lista.
- **Duplicidade de cobertura:** `atualizacao-cadastral` e `perfil` podem compartilhar helpers para reduzir repetição.

### 3.5 Entrega

| Arquivo | Linhas | Cenários | Foco Principal |
|---------|--------|----------|----------------|
| `entrega/agendar-consultar-entrega.integracao.test.ts` | 95 | 3 | Agendamento e consulta de entrega |
| `entrega/cotar-frete.integracao.test.ts` | 43 | 2 | Cotação de frete |
| `entrega/falha-reagendar-entrega.integracao.test.ts` | 109 | 2 | Falha e reagendamento |
| `entrega/logistica-mocks.integracao.test.ts` | 312 | 20 | Mocks logísticos, cálculo, rastreamento e falhas |

**Avaliação:** ⚠️ Parcial. A base de frete, agendamento, falha e rastreamento está boa, mas a confirmação final de entrega ainda precisa ficar mais explícita dentro deste domínio.

**Cobertura validada:**

| Regra/Cenário | Situação |
|---------------|----------|
| Cotar frete com CEP válido | ✅ Coberto |
| Rejeitar CEP inválido | ✅ Coberto |
| Agendar entrega | ✅ Coberto |
| Consultar entrega | ✅ Coberto |
| Registrar falha/reagendar | ✅ Coberto |
| Rastreamento/mocks externos | ✅ Coberto |
| Confirmar entrega como `ENTREGUE` | ⚠️ Sinal parcial em catálogo/bulk-insert, não consolidado no domínio Entrega |
| Registrar data/hora da entrega | ⚠️ Parcial |
| Autorização de confirmação/reagendamento | ⚠️ Parcial |

**Lacuna principal:** criar teste dedicado para RN0040 com confirmação de entrega, status `ENTREGUE`, data/hora preenchida e bloqueio para usuário sem permissão.

### 3.6 Geral

| Arquivo | Linhas | Cenários | Foco Principal |
|---------|--------|----------|----------------|
| `geral/reproducao-falhas.integracao.test.ts` | 35 | 3 | Regressões históricas |
| `geral/validacao-dados.integracao.test.ts` | 341 | 17 | Validações cross-domain |

**Avaliação:** ✅ Boa. A camada geral protege contra regressões e validações comuns de entrada.

**Cobertura validada:**

- **Preço:** negativo, zero e não numérico.
- **Estoque:** negativo.
- **CPF:** formato/dígito inválido.
- **Telefone:** formato inválido.
- **E-mail:** duplicidade em cliente/admin.
- **Campos obrigatórios:** validações transversais.
- **Regressões:** respostas 404 em vez de 500 e uso correto de schema.

### 3.7 Pagamento

| Arquivo | Linhas | Cenários | Foco Principal |
|---------|--------|----------|----------------|
| `pagamento/cupons.integracao.test.ts` | 150 | 10 | Listagem e aplicação de cupons |
| `pagamento/intencao-e-processar.integracao.test.ts` | 226 | 12 | Intenção e processamento |
| `pagamento/parcelamento.integracao.test.ts` | 155 | 6 | Parcelamento e limites |
| `pagamento/pix.integracao.test.ts` | 223 | 9 | Seleção e confirmação PIX |

**Avaliação:** ✅ Boa. O fluxo de intenção, processamento, parcelamento, PIX e cupons está bem representado.

**Cobertura validada:**

| Regra/Cenário | Situação |
|---------------|----------|
| Listar cupons | ✅ Coberto |
| Aplicar cupom válido/inválido | ✅ Coberto |
| Criar intenção de pagamento | ✅ Coberto |
| Processar pagamento aprovado/reprovado | ✅ Coberto |
| Validar segredo da intenção | ✅ Coberto |
| Parcelamento mínimo | ✅ Coberto |
| PIX mínimo e confirmação | ✅ Coberto |
| Expiração de intenção | ✅ Coberto |
| Apenas 1 cupom promocional | ⚠️ Necessita teste explícito |
| Prioridade de cupons | ⚠️ Necessita teste explícito |
| Cupom de troca excedente | ⚠️ Não evidenciado |

**Lacuna principal:** RN0036 precisa de cenário de integração que comprove geração de novo cupom quando o valor de cupom de troca excede o total utilizado.

### 3.8 Venda

| Arquivo | Linhas | Cenários | Foco Principal |
|---------|--------|----------|----------------|
| `venda/criacao-pedido.integracao.test.ts` | 215 | 12 | Criação, consulta e isolamento de pedido |
| `venda/regras-negocio.integracao.test.ts` | 266 | 13 | Regras de venda, troca e validações de negócio |

**Avaliação:** ⚠️ Parcial. Há boa cobertura para criação/consulta de pedido, isolamento entre clientes e regras de troca, mas ainda falta conectar de forma explícita pagamento aprovado com baixa de estoque e evolução completa de status.

**Cobertura validada:**

| Regra/Cenário | Situação |
|---------------|----------|
| Criar pedido com status inicial | ✅ Coberto |
| Consultar pedido por UUID | ✅ Coberto |
| Listar pedidos do cliente | ✅ Coberto |
| Impedir acesso de outro cliente | ✅ Coberto |
| Rejeitar pedido sem token | ✅ Coberto |
| Rejeitar pedido sem itens/valor inválido | ✅ Coberto |
| Regras de troca para venda entregue | ✅ Parcial |
| Baixa de estoque após aprovação | ⚠️ Não evidenciado como integração ponta-a-ponta |
| Evolução completa de status venda/pagamento/entrega | ⚠️ Parcial |

---

## 4. Lacunas Priorizadas

### Críticas

| ID | Lacuna | Domínio | Impacto | Status |
|----|--------|---------|---------|--------|
| L1 | Confirmar entrega com status `ENTREGUE`, data/hora e autorização | Entrega | Regra logística final sem validação explícita | ✅ Implementado |
| L2 | Baixa de estoque após pagamento aprovado | Venda/Pagamento/Catálogo | Integridade crítica de estoque | ✅ Implementado |
| L3 | Geração de cupom de troca excedente | Pagamento/Troca | Crédito do cliente pode ficar sem garantia automatizada | ⚠️ Implementado (pendente correção autenticação) |

### Altas

| ID | Lacuna | Domínio | Impacto | Status |
|----|--------|---------|---------|--------|
| L4 | Teste explícito para apenas 1 cupom promocional por compra | Pagamento | Regra financeira suscetível a regressão | ⚠️ Implementado (pendente correção autenticação) |
| L5 | Teste explícito para prioridade de cupons | Pagamento | Ordem de desconto pode alterar total cobrado | ⚠️ Implementado (pendente correção autenticação) |
| L6 | Autorização de confirmação/reagendamento de entrega | Entrega | Segurança operacional | ✅ Implementado |
| L7 | Bandeiras de cartão permitidas e rejeitadas | Cliente/Pagamento | Validação financeira incompleta | ✅ Implementado |

---

## 5. Status das Lacunas (Atualizado 2026-03-09)

### Implementadas e Validadas
- **L1** - Confirmar entrega com status ENTREGUE (5/5 testes passando)
- **L2** - Baixa de estoque após pagamento aprovado (13/13 testes passando)
- **L6** - Autorização de confirmação/reagendamento de entrega (5/5 testes passando)
- **L7** - Bandeiras de cartão permitidas e rejeitadas (14/14 testes passando)

### Implementadas (Pendente Correção Autenticação)
- **L3** - Geração de cupom de troca excedente (implementado, falha devido a problema de autenticação)
- **L4** - Apenas 1 cupom promocional por compra (implementado, falha devido a problema de autenticação)
- **L5** - Prioridade de cupons (implementado, falha devido a problema de autenticação)

**Nota:** As lacunas L3, L4 e L5 foram implementadas mas estão falhando devido ao problema de autenticação que afeta 64 testes da suíte (item 13 no TODO). Após a correção desse problema, os testes devem ser revalidados.

### Médias

| ID | Lacuna | Domínio | Impacto |
|----|--------|---------|---------|
| L8 | Endereço de cobrança e entrega obrigatórios em teste explícito | Cliente | Regra de cadastro fica apenas implícita |
| L9 | Divisão de arquivos grandes por intenção de teste | Catálogo/Cliente | Manutenibilidade |
| L10 | Helpers de alto nível para cliente, venda, pagamento e entrega | Todos | Redução de repetição e menor custo de manutenção |

---

## 5. Recomendações de Evolução

### Próxima Sprint

1. **Adicionar teste de confirmação de entrega** em `entrega`, cobrindo status `ENTREGUE`, data/hora e autorização.
2. **Adicionar teste de baixa de estoque após pagamento aprovado**, validando estoque antes/depois pelo backend.
3. **Adicionar teste de cupom de troca excedente**, cobrindo geração e persistência do novo cupom.

### Curto Prazo

4. **Adicionar testes explícitos para RN0033 e RN0035** em `pagamento/cupons.integracao.test.ts`.
5. **Adicionar teste de bandeiras permitidas/rejeitadas** em `cliente/cartoes.integracao.test.ts`.
6. **Criar helpers de fluxo de negócio** para reduzir repetição de cliente, livro, venda e pagamento.

### Médio Prazo

7. **Separar arquivos acima de 300 linhas** por intenção: listagem, criação, atualização, permissão e validação.
8. **Padronizar nomes de arquivos** para `*.integracao.test.ts`; atualmente `catalogo/listagem-livros-integracao.test.ts` foge do padrão.
9. **Criar suíte de fluxo completo** fora de `componentes` para compra completa: cliente → carrinho/venda → pagamento → entrega → troca.

---

## 6. Validação Recomendada

Antes de considerar a suíte totalmente validada em ambiente local/CI, executar:

```bash
npm run docker:up:test
npm run db:setup:test
npm run test:int
npm run test:auditoria
```

Se o objetivo for validar cobertura:

```bash
npm run test:coverage
```

**Observação:** esta revisão validou estrutura, arquivos, contagem, configuração e cobertura aparente por leitura estática. A execução completa dos testes depende do banco de teste e dos serviços Docker estarem ativos.

---

## 7. Conclusão

A suíte de integração está **mais madura do que o inventário anterior indicava**. Hoje ela possui 29 arquivos, 270 cenários e cobre domínios adicionais importantes como autenticação, catálogo, administrativo e venda.

Os principais pontos fortes são:

- **Cobertura ampla de API:** muitos testes exercitam rotas reais via Supertest.
- **Boa rastreabilidade:** marcações RF/RN/RNF estão presentes nos cenários críticos.
- **Isolamento adequado:** uso consistente de `configurarTesteIntegracao`.
- **Boa cobertura de autorização:** papéis e acessos indevidos aparecem em vários domínios.

Os principais riscos remanescentes são:

- **Entrega final:** confirmação `ENTREGUE` precisa ficar explícita no domínio correto.
- **Estoque:** baixa após pagamento aprovado é crítica e deve ser testada ponta-a-ponta.
- **Cupons de troca:** excedente ainda precisa de cenário dedicado.
- **Manutenibilidade:** arquivos grandes devem ser decompostos gradualmente.

**Recomendação senior:** priorizar L1, L2 e L3 antes de ampliar novas funcionalidades, pois essas lacunas protegem regras centrais de logística, estoque e crédito financeiro.
