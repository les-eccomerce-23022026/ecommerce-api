# Recomendações de Padronização de Nomenclatura

> **Data:** 5 de maio de 2026  
> **Contexto:** Análise de qualidade de código do backend LES  
> **Status:** ✅ Concluído

## Regra Atual (U12 - AGENTS.md)

> **Nomenclatura camelCase** — Use camelCase para nomes de arquivos, variáveis e **payloads da API** (JSON). Exceção: chaves de tabelas do banco de dados podem usar snake_case se aplicável no nível de persistência.

## Ações Realizadas

### Módulo Admin
- ✅ `controlador-admin-painel.ts` → `controladorAdminPainel.ts`
- ✅ `servico-dashboard-admin.ts` → `servicoDashboardAdmin.ts`
- ✅ `servico-dashboard-admin-consultas.ts` → `servicoDashboardAdminConsultas.ts`
- ✅ `servico-dashboard-admin-helpers.ts` → `servicoDashboardAdminHelpers.ts`
- ✅ `servico-pedidos-admin.ts` → `servicoPedidosAdmin.ts`
- ✅ Imports atualizados em `admin.routes.ts`, `servicoDashboardAdmin.ts`, `controladorAdminPainel.ts`

### Módulo Clientes
- ✅ `clientes-atualizacao.service.ts` → `clientesAtualizacao.service.ts`
- ✅ `clientes-cadastro-publico-validacao.util.ts` → `clientesCadastroPublicoValidacao.util.ts`
- ✅ `clientes-cadastro.service.ts` → `clientesCadastro.service.ts`
- ✅ `clientes-consulta.service.ts` → `clientesConsulta.service.ts`
- ✅ `clientes-endereco.service.ts` → `clientesEndereco.service.ts`
- ✅ `clientes-utils.service.ts` → `clientesUtils.service.ts`
- ✅ `consulta-clientes.controller.ts` → `consultaClientes.controller.ts`
- ✅ `consulta-clientes.service.ts` → `consultaClientes.service.ts`
- ✅ `gestao-identidade-cliente-cadastro-publico.util.ts` → `gestaoIdentidadeClienteCadastroPublico.util.ts`
- ✅ `gestao-identidade-cliente-endereco-dto.mapper.ts` → `gestaoIdentidadeClienteEndereco.dto.mapper.ts`
- ✅ `gestao-identidade-cliente-endereco-leituras.ts` → `gestaoIdentidadeClienteEndereco.leituras.ts`
- ✅ `gestao-identidade-cliente-endereco.service.ts` → `gestaoIdentidadeClienteEndereco.service.ts`
- ✅ `gestao-identidade-cliente-operacoes.service.ts` → `gestaoIdentidadeClienteOperacoes.service.ts`
- ✅ `gestao-identidade-cliente-texto.util.ts` → `gestaoIdentidadeClienteTexto.util.ts`
- ✅ Imports atualizados em 7 arquivos do módulo clientes + `di.container.ts`

### Módulo Pagamentos
- ✅ `controlador-pagamentos-obter-info.handler.ts` → `controladorPagamentosObterInfo.handler.ts`
- ✅ `servico-pagamentos-checkout-flow.util.ts` → `servicoPagamentosCheckoutFlow.util.ts`
- ✅ `servico-pagamentos-checkout.util.ts` → `servicoPagamentosCheckout.util.ts`
- ✅ `servico-pagamentos-definir-metodo.util.ts` → `servicoPagamentosDefinirMetodo.util.ts`
- ✅ `servico-pagamentos-venda.util.ts` → `servicoPagamentosVenda.util.ts`
- ✅ Imports atualizados em 5 arquivos do módulo pagamentos

## Inconsistências Identificadas (Antes da Migração)

### Padrão kebab-case (deveria ser camelCase)
Os seguintes arquivos usam kebab-case em vez de camelCase:

#### Módulo `admin/`
- `admin.controller.ts` ✅ (já correto)
- `admin.routes.ts` ✅ (já correto)
- `admin.service.ts` ✅ (já correto)
- `controlador-admin-painel.ts` ❌ → `controladorAdminPainel.ts`
- `servico-dashboard-admin.ts` ❌ → `servicoDashboardAdmin.ts`
- `servico-dashboard-admin-consultas.ts` ❌ → `servicoDashboardAdminConsultas.ts`
- `servico-dashboard-admin-helpers.ts` ❌ → `servicoDashboardAdminHelpers.ts`
- `servico-pedidos-admin.ts` ❌ → `servicoPedidosAdmin.ts`

#### Módulo `clientes/`
- `clientes.controller.ts` ✅ (já correto)
- `clientes.routes.ts` ✅ (já correto)
- `clientes.service.ts` ✅ (já correto)
- `clientes-atualizacao.service.ts` ❌ → `clientesAtualizacao.service.ts`
- `clientes-cadastro-publico-validacao.util.ts` ❌ → `clientesCadastroPublicoValidacao.util.ts`
- `clientes-cadastro.service.ts` ❌ → `clientesCadastro.service.ts`
- `clientes-consulta.service.ts` ❌ → `clientesConsulta.service.ts`
- `clientes-endereco.service.ts` ❌ → `clientesEndereco.service.ts`
- `clientes-utils.service.ts` ❌ → `clientesUtils.service.ts`
- `consulta-clientes.controller.ts` ❌ → `consultaClientes.controller.ts`
- `consulta-clientes.service.ts` ❌ → `consultaClientes.service.ts`
- `gestao-identidade-cliente-cadastro-publico.util.ts` ❌ → `gestaoIdentidadeClienteCadastroPublico.util.ts`
- `gestao-identidade-cliente-endereco-dto.mapper.ts` ❌ → `gestaoIdentidadeClienteEndereco.dto.mapper.ts`
- `gestao-identidade-cliente-endereco-leituras.ts` ❌ → `gestaoIdentidadeClienteEndereco.leituras.ts`
- `gestao-identidade-cliente-endereco.service.ts` ❌ → `gestaoIdentidadeClienteEndereco.service.ts`
- `gestao-identidade-cliente-operacoes.service.ts` ❌ → `gestaoIdentidadeClienteOperacoes.service.ts`
- `gestao-identidade-cliente-texto.util.ts` ❌ → `gestaoIdentidadeClienteTexto.util.ts`

#### Módulo `pagamentos/`
- `pagamentos.routes.ts` ✅ (já correto)
- `controlador-pagamentos-obter-info.handler.ts` ❌ → `controladorPagamentosObterInfo.handler.ts`
- `pagamentos.helper.ts` ❌ → `pagamentos.helper.ts` (já correto)
- `servico-pagamentos-checkout-flow.util.ts` ❌ → `servicoPagamentosCheckoutFlow.util.ts`
- `servico-pagamentos-checkout.util.ts` ❌ → `servicoPagamentosCheckout.util.ts`
- `servico-pagamentos-definir-metodo.util.ts` ❌ → `servicoPagamentosDefinirMetodo.util.ts`
- `servico-pagamentos-venda.util.ts` ❌ → `servicoPagamentosVenda.util.ts`

### Padrões Corretos (camelCase)
Os seguintes arquivos já seguem o padrão camelCase corretamente:

#### Módulo `auth/`
- `auth.controller.ts` ✅
- `auth.routes.ts` ✅
- `auth.service.ts` ✅

#### Módulo `carrinho/`
- `controladorCarrinho.ts` ✅
- `controladorCarrinho-parse.util.ts` ✅
- `repositorioCarrinhoPostgres.ts` ✅
- `servicoCarrinho.ts` ✅

#### Módulo `cartoes/`
- `cartoes.controller.ts` ✅
- `cartoes.controller-validacao.util.ts` ✅
- `cartoes.routes.ts` ✅
- `cartoes.service.ts` ✅

## Recomendação de Ação

### Opção 1: Migração Gradual (Recomendada)
1. Criar aliases de importação para arquivos renomeados
2. Renomear arquivos em batches por módulo
3. Atualizar imports em cada módulo
4. Executar testes após cada batch
5. Commit por módulo para facilitar rollback

### Opção 2: Aceitar Dívida Técnica Temporária
Manter os arquivos com kebab-case por enquanto, mas:
1. Documentar esta inconsistência
2. Aplicar o padrão camelCase apenas em **novos arquivos**
3. Planejar migração futura quando houver janela de refactoring

### Opção 3: Script de Refactoring Automático
Criar um script para:
1. Renomear arquivos automaticamente
2. Atualizar imports em todos os arquivos
3. Gerar relatório de mudanças
4. Executar testes para validar

## Impacto Estimado

- **Arquivos afetados:** ~25 arquivos
- **Módulos afetados:** admin, clientes, pagamentos
- **Risco:** Médio (quebra de imports, testes)
- **Esforço estimado:** 4-6 horas

## Próximos Passos

1. Decidir qual abordagem seguir (Opção 1, 2 ou 3)
2. Se Opção 1: Priorizar módulo `clientes` (mais inconsistências)
3. Se Opção 2: Adicionar regra no ESLint para validar novos arquivos
4. Se Opção 3: Desenvolver script de refactoring

## Conclusão

A padronização de nomenclatura para camelCase é importante para consistência e aderência à regra U12. No entanto, a migração deve ser planejada cuidadosamente para evitar quebras de funcionalidade.
