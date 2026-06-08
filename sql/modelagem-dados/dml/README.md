# Seeds do Sistema E-Commerce de Livros (LES)

Este diretório contém os scripts de seed (dados iniciais) para o sistema de e-commerce de livros.

## Visão Geral

As seeds são responsáveis por criar dados iniciais para desenvolvimento e testes, incluindo:
- Usuários (clientes e administradores)
- Lojas (multi-tenancy)
- Livros e estoques
- Dados de referência (papeis, categorias, etc.)

## Seeds Atuais

### 1. 001_seeds_tipos_referencia.sql
**Descrição:** Cria os tipos de referência básicos do sistema (papeis, categorias, etc.)
**Dependências:** Nenhuma
**Entidades criadas:**
- Papeis (admin, cliente, admin_sistema)
- Categorias de livros
- Editoras
- Autores
- Gêneros de livros
- Tipos de telefone, residência, logradouro
- Países, estados, cidades, bairros, CEPs, logradouros
- Bandeiras de cartão

**Execução:** Primeiro script a ser executado

---

### 2. 002_seed_usuario_admin_inicial.sql
**Descrição:** ⚠️ **DESATIVADO** - Script antigo de admin mestre
**Status:** Desativado (conceito de admin mestre removido)
**Motivo:** O sistema agora usa modelo multi-tenant onde cada admin gerencia sua própria loja
**Substituto:** Use `003_seed_multi_tenant_completo.sql`

---

### 3. 003_seed_multi_tenant_completo.sql
**Descrição:** Seed multi-tenant completo com 3 lojas, 3 administradores, 15 livros e 9 clientes
**Dependências:** `001_seeds_tipos_referencia.sql`
**Entidades criadas:**
- **3 Lojas:**
  - Livraria São Paulo (livraria-sao-paulo)
  - Livraria Rio de Janeiro (livraria-rio)
  - Livraria Belo Horizonte (livraria-belo-horizonte)

- **3 Administradores (1 por loja):**
  - Carlos Silva (carlos.silva@livrariasp.com.br) - São Paulo
  - Ana Oliveira (ana.oliveira@livrariario.com.br) - Rio de Janeiro
  - Roberto Costa (roberto.costa@livrariabh.com.br) - Belo Horizonte
  - **Senha:** Admin@123
  - **Papel:** admin
  - **Escopo:** LOJA

- **15 Livros (5 por loja):**
  - São Paulo: Fantasia e Aventura (O Senhor dos Anéis, Nárnia, O Hobbit, Harry Potter, Percy Jackson)
  - Rio de Janeiro: Ficção Científica e Distopia (Duna, 1984, Admirável Mundo Novo, Fahrenheit 451, Neuromancer)
  - Belo Horizonte: Clássicos, Literatura Brasileira e Negócios (Dom Casmurro, Memórias Póstumas, O Alienista, Como Fazer Amigos, O Poder do Hábito)

- **9 Clientes (3 por loja):**
  - São Paulo: Fernanda Santos, Lucas Pereira, Juliana Lima
  - Rio de Janeiro: Marcos Almeida, Carla Rodrigues, Rafael Gomes
  - Belo Horizonte: Patricia Martins, André Souza, Mariana Ferreira
  - **Senha:** Cliente@123
  - **Papel:** cliente
  - **Datas de nascimento:** Realistas (variam entre 1985-1995)
  - **Telefones:** Celulares com DDD de cada cidade
  - **Endereços:** Endereços de entrega básicos

- **Estoques:** 5 livros por loja com preços variados por livro

**Credenciais de Teste:**
- Admin SP: carlos.silva@livrariasp.com.br / Admin@123
- Admin RJ: ana.oliveira@livrariario.com.br / Admin@123
- Admin BH: roberto.costa@livrariabh.com.br / Admin@123
- Clientes: [nome].[sobrenome]@email.com / Cliente@123

**Observações:**
- ✅ Clientes têm datas de nascimento realistas
- ✅ Clientes têm telefones com DDD correto
- ✅ Clientes têm endereços básicos
- ✅ Preços variados por livro (não genéricos)
- ⚠️ Clientes não têm cartões de crédito (use 004)

---

### 4. 004_seed_cartoes_clientes.sql
**Descrição:** Cria cartões de crédito de teste para os clientes do 003
**Dependências:** `003_seed_multi_tenant_completo.sql`
**Entidades criadas:**
- **9 Cartões (1 por cliente):**
  - Bandeiras: Visa, Mastercard, Elo
  - Tokens de teste (não são cartões reais)
  - Validade: 1-3 anos a partir de hoje
  - Todos marcados como principal

**Observações:**
- Tokens são de teste para ambiente de desenvolvimento
- Cada cliente tem um cartão com bandeira variada

---

### 5. 005_seed_vendas_teste.sql
**Descrição:** Cria vendas/pedidos de teste com diferentes status
**Dependências:** `003_seed_multi_tenant_completo.sql`, `004_seed_cartoes_clientes.sql`
**Entidades criadas:**
- **4 Vendas com diferentes status:**
  - ENTREGUE (Fernanda - 2 livros) - para testar troca
  - EM PROCESSAMENTO (Lucas - 1 livro)
  - CANCELADA (Marcos - 1 livro)
  - EM TRÂNSITO (Fernanda - 1 livro)
- **Itens de venda** para cada venda
- **Status de venda** (requer 067 ou pré-existente)

**Observações:**
- Venda ENTREGUE é usada para testar solicitação de troca
- Datas realistas (vendas de dias/horas diferentes)

---

### 6. 006_seed_trocas_teste.sql
**Descrição:** Cria solicitação de troca para testar fluxo de trocas/devoluções
**Dependências:** `005_seed_vendas_teste.sql`
**Entidades criadas:**
- **Venda atualizada** para status EM TROCA
- **Item marcado** como em troca
- **Cupom de troca** gerado para o cliente
- **Motivo de troca** informado

**Observações:**
- Usa a venda ENTREGUE da Fernanda
- Cupom de troca com validade de 6 meses
- Valor do cupom igual ao valor do item trocado

---

### 7. 007_seed_cupons_promocionais.sql
**Descrição:** Cria cupons promocionais de teste com suporte multi-tenant
**Dependências:** `003_seed_multi_tenant_completo.sql`, migration `068_adicionar_loj_id_cupons.sql`
**Entidades criadas:**
- **5 Cupons:**
  - **GLOBAIS (2):** PRIMEIRA10 (10%), FIXO20 (R$20) - admin_sistema
  - **POR LOJA (2):** SP-PROMO15 (15% - São Paulo), RJ-PROMO12 (12% - Rio) - admin_loja
  - **EXPIRADO (1):** EXPIRADO10 (para teste)

**Observações:**
- ✅ **SUPORTE MULTI-TENANCY:** A partir da migration 068, as tabelas de cupons têm campo `loj_id`
- Cupons com `loj_id = NULL` são GLOBAIS (admin_sistema)
- Cupons com `loj_id` preenchido são ESPECÍFICOS DA LOJA (admin_loja)
- Endpoints disponíveis:
  - `POST /admin/cupom/promocional` - Criar cupom promocional (admin)
  - `POST /admin/cupom/troca` - Criar cupom de troca (admin)

---

### 8. 008_seed_pagamentos_teste.sql
**Descrição:** Cria pagamentos para vendas existentes, múltiplos cartões por cliente e cenários adicionais de troca
**Dependências:** `003_seed_multi_tenant_completo.sql`, `004_seed_cartoes_clientes.sql`, `005_seed_vendas_teste.sql`
**Entidades criadas:**
- **Pagamentos para 4 vendas existentes:**
  - Venda ENTREGUE (Fernanda): Pagamento APROVADO
  - Venda EM PROCESSAMENTO (Lucas): Pagamento PENDENTE
  - Venda CANCELADA (Marcos): Pagamento RECUSADO
  - Venda EM TRÂNSITO (Fernanda): Pagamento APROVADO
- **Registros em cartao_pagamento:** Vincula pagamentos aos cartões do 004
- **Múltiplos cartões por cliente:** Adiciona 2-3 cartões por cliente (extensão do 004)
  - Fernanda: 3 cartões (Visa, Mastercard, Elo)
  - Lucas: 3 cartões (Mastercard, Visa, Elo)
  - Juliana: 3 cartões (Elo, Visa, Mastercard)
- **Venda adicional com múltiplos pagamentos:** Juliana (cartão + cupom promocional)
- **Cenários adicionais de troca:**
  - Devolução de pedido completo (Carla)
  - Admin negando troca (Juliana)

**Observações:**
- ✅ **IDEMPOTENTE:** Pode ser executado múltiplas vezes (usa ON CONFLICT e idempotency_key)
- ✅ **PAPEIS DE AUTENTICAÇÃO:** Considera papéis (admin vs cliente) nos cenários
- ✅ **DADOS REALISTAS:** Valores consistentes com vendas, datas realistas
- ✅ **NÃO QUEBRA ENTREGAS:** Usa ON CONFLICT DO NOTHING/UPDATE para não duplicar dados
- ✅ **TESTES REPETÍVEIS:** Idempotency_key garante reexecução segura

**Cobertura de Cenários da Entrega 7 (Venda Completa):**
- Cenário 2: ✅ Combinações de pagamento (cartão + cupom)
- Cenário 5: ✅ Admin confirma pagamento (status PENDENTE → APROVADO)
- Cenário 6: ✅ Admin aceita/nega troca (TROCA REJEITADA)
- Cenário 8: ✅ Devolução de pedido completo

---

### 9. 005_seed_usuarios_teste.sql
**Descrição:** Cria usuários de teste básicos (1 admin + 1 cliente)
**Dependências:** `001_seeds_tipos_referencia.sql`, lojas devem existir
**Entidades criadas:**
- **Admin Teste:**
  - Email: admintest@email.com
  - Senha: @asdfJKLÇ123
  - Papel: admin
  - Escopo: LOJA

- **Cliente Teste:**
  - Email: clientetest@email.com
  - Senha: @asdfJKLÇ123
  - Papel: cliente

**Observações:**
- Usado principalmente para testes automatizados
- Vinculado à primeira loja ativa encontrada

---

### 6. 006_seed_configuracoes.sql
**Descrição:** Cria configurações do sistema
**Dependências:** Nenhuma
**Entidades criadas:**
- Configurações de sistema (chave-valor)

---

### 7. 007_seed_livros_mock.sql
**Descrição:** Cria livros mock para testes
**Dependências:** `001_seeds_tipos_referencia.sql`
**Entidades criadas:**
- Livros de teste com dados variados

---

### 8. 008_seed_dados_teste_bdd.sql.old
**Descrição:** ⚠️ **ARQUIVO ANTIGO** - Dados de teste BDD
**Status:** Descontinuado (sufixo .old)

---

## Seeds em Migrations

### 063_seed_admin_mestre_livraria.sql
**Descrição:** Cria admin de sistema para desenvolvimento e testes manuais
**Localização:** `sql/migrations/`
**Dependências:** Nenhuma (cria papéis se não existirem)
**Entidades criadas:**
- **Admin de Sistema:**
  - Email: admin.sistema@les.demo.br
  - Senha: AdminSistema@123
  - Papel: admin_sistema (apenas)
  - Escopo: SISTEMA
  - Loja: Livraria Padrão (livraria-padrao)

**Observações:**
- ✅ Admin de sistema tem APENAS papel admin_sistema
- ✅ Não tem papel admin de loja nem cliente
- ✅ Escopo SISTEMA (acesso a todas as lojas)
- Para admins de loja, use 003_seed_multi_tenant_completo.sql

---

### 065_seed_demo_30_clientes_100_livros.sql
**Descrição:** Cria 30 clientes sintéticos com dados completos e expande catálogo até 100 livros
**Localização:** `sql/migrations/`
**Dependências:** Papeis e lojas devem existir
**Entidades criadas:**
- **30 Clientes:**
  - Emails: demo.cliente01@les.demo.br até demo.cliente30@les.demo.br
  - Senha: Cliente@123
  - Dados completos: endereços, telefones, datas de nascimento realistas
  - Distribuídos em diferentes cidades do Brasil

- **Categorias adicionais:** História, Biografia, Infantil, Filosofia, Ciência, Romance, Aventura
- **Editoras adicionais:** Globo Livros, Objetiva, Novatec, Aleph, Agir, Gen LTC, Pearson, Bookman, Galera Record, L&PM, Nova Fronteira, Arqueiro, Suma, Gente, Leya

**Observações:**
- Dados mais realistas que 003
- Clientes têm endereços completos
- Clientes têm telefones
- Ainda não têm cartões de crédito

---

### 067_seed_dados_referencia_e2e.sql
**Descrição:** Dados de referência mínimos para testes E2E
**Localização:** `sql/migrations/`
**Dependências:** Nenhuma
**Entidades criadas:**
- **Status de venda:** EM PROCESSAMENTO, APROVADA, CANCELADA, ENTREGUE, EM TROCA, TROCA CONCLUÍDA, EM TRÂNSITO, FALHA NA ENTREGA, TROCA AUTORIZADA, TROCA REJEITADA, CONCLUÍDA, REPROVADA, AGUARDANDO PAGAMENTO
- **Status de pagamento:** PENDENTE, APROVADO, RECUSADO, CANCELADO
- **Tipos de pagamento:** cartao_credito, cupom_troca, cupom_promocional, pix
- **Vínculo admintest ↔ loja** (espelha 066)

**Observações:**
- Idempotente (pode ser executado múltiplas vezes)
- Focado em testes E2E automatizados

---

## Modelo de Dados Multi-Tenant

### Escopos de Administrador

**SISTEMA:**
- Acesso a todas as lojas
- Papel: admin_sistema
- Usuário: admin@livraria.com.br (seed 063)

**LOJA:**
- Acesso apenas à loja vinculada
- Papel: admin
- Usuários: admins criados em 003 (1 por loja)

### Tabelas Principais

- `livraria_gestao.usuarios` - Tabela principal (clientes e admins)
- `livraria_gestao.clientes` - Extensão 1:1 para clientes
- `livraria_gestao.lojas` - Lojas (multi-tenancy)
- `livraria_gestao.admin_lojas` - Vínculo admins-lojas (escopo SISTEMA/LOJA)
- `livraria_comercial.papeis` - Papéis (admin, cliente, admin_sistema)
- `livraria_financeiro.cartoes` - Cartões de crédito
- `livraria_comercial.vendas` - Vendas/pedidos
- `livraria_comercial.estoques` - Estoques por loja

---

## Problemas Identificados

### 1. ✅ Inconsistência no papel admin_sistema - RESOLVIDO
- O arquivo 063 foi refatorado para criar apenas admin_sistema
- Admin de sistema não tem papel admin de loja nem cliente
- Diferença clara: admin_sistema (escopo SISTEMA) vs admin (escopo LOJA)

### 2. ✅ Dados não são realistas o suficiente - RESOLVIDO
- Clientes do 003 agora têm datas de nascimento realistas
- Clientes do 003 agora têm telefones com DDD correto
- Clientes do 003 agora têm endereços básicos
- Preços variados por livro (não genéricos)
- Cartões de crédito criados em 004

### 3. ✅ Faltam dados para testar fluxos completos - RESOLVIDO
- ✅ Vendas/pedidos criados em 005 (4 vendas com status diferentes)
- ✅ Trocas/devoluções criadas em 006
- ✅ Cupons promocionais criados em 007
- Itens de venda criados em 005

### 4. ✅ Relações entre entidades não são exploradas - RESOLVIDO
- Clientes têm endereços básicos
- Clientes têm telefones
- Clientes têm cartões de crédito
- Estoques têm preços variados
- Vendas relacionadas a clientes e itens

---

## Ordem de Execução Recomendada

Para ambiente de desenvolvimento completo:

1. `001_seeds_tipos_referencia.sql`
2. `003_seed_multi_tenant_completo.sql`
3. `004_seed_cartoes_clientes.sql`
4. `005_seed_vendas_teste.sql`
5. `006_seed_trocas_teste.sql`
6. **Migration `068_adicionar_loj_id_cupons.sql`** (obrigatório para cupons por loja)
7. `007_seed_cupons_promocionais.sql`
8. `008_seed_pagamentos_teste.sql` (NOVO - pagamentos, múltiplos cartões, cenários de troca)
9. `005_seed_usuarios_teste.sql` (opcional, para testes automatizados)
10. `065_seed_demo_30_clientes_100_livros.sql` (opcional, para mais dados)
11. `067_seed_dados_referencia_e2e.sql` (para testes E2E)
12. `063_seed_admin_mestre_livraria.sql` (opcional, para admin de sistema)

Para ambiente de produção:

1. `001_seeds_tipos_referencia.sql`
2. `033_seed_lojas_producao.sql` (apenas estrutura, sem dados sintéticos)

---

## Melhorias Implementadas

1. ✅ Documentação (este README)
2. ✅ Refatorar 003 com dados mais realistas (datas de nascimento, telefones, endereços, preços variados)
3. ✅ Refatorar 063 para separar admin_sistema de admin loja
4. ✅ Criar seed de cartões de crédito (004)
5. ✅ Criar seed de vendas/pedidos (005)
6. ✅ Criar seed de trocas/devoluções (006)
7. ✅ Criar seed de cupons promocionais (007)

---

## Contato

Para dúvidas sobre as seeds, consulte a documentação do projeto ou abra uma issue no repositório.
