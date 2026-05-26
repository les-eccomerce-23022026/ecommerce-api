# Implementação: Middleware de Autorização por Loja

## Data de Implementação
25 de maio de 2025

## Resumo Executivo

Implementado middleware de autorização por loja (`autorizacaoLojaMiddleware`) que valida se um administrador autenticado tem permissão para acessar a loja solicitada. O middleware implementa controle de acesso baseado em dois escopos:

- **SISTEMA**: Administrador global com acesso a qualquer loja
- **LOJA**: Administrador de loja com acesso restrito à loja atribuída

## Arquivos Criados

### 1. Middleware Principal
**Arquivo**: `src/shared/middlewares/autorizacaoLoja.middleware.ts`

- Função exportada: `autorizacaoLojaMiddleware(req, res, next)`
- Valida autenticação, seleção de loja e permissões
- Consulta tabela `admin_lojas` para validar associação
- Retorna códigos HTTP apropriados (401, 403, 404, 500)
- Logging detalhado de eventos de segurança

### 2. Constantes de Escopo
**Arquivo**: `src/shared/types/escoposAdmin.ts`

- Interface `IEscopoAdmin`
- Constantes: `ESCOPO_SISTEMA`, `ESCOPO_LOJA`
- Mapa `ESCOPOS_ADMIN` para validação type-safe
- Tipo `TipoEscopoAdmin` para type-safety

### 3. Testes Unitários
**Arquivo**: `src/shared/middlewares/__tests__/autorizacaoLoja.middleware.test.ts`

- 10 testes cobrindo todos os cenários
- Validação de autenticação (401)
- Validação de loja selecionada (400)
- Validação de associação admin-loja (403)
- Validação de status ativo (403)
- Validação de escopos (SISTEMA, LOJA, inválido)
- Tratamento de erros de banco (500)
- Logging apropriado

**Status**: ✅ Todos os 10 testes passando

### 4. Documentação

#### AUTORIZACAO_LOJA.md
Documentação técnica completa:
- Visão geral e regras de autorização
- Fluxo de validação passo a passo
- Códigos de resposta HTTP
- Exemplos de uso em rotas
- Estrutura da tabela `admin_lojas`
- Instruções de teste
- Considerações de segurança

#### EXEMPLO_USO.md
Guia prático com exemplos:
- Proteção de rota individual
- Proteção de múltiplas rotas
- Fluxo de requisição completo
- Tratamento de erros no cliente
- Testes com cURL e Postman
- Casos de uso reais
- Integração com sistema de permissões

## Padrões Seguidos

### Código em Português (Regra U1)
✅ Todas as variáveis, funções, comentários em Português
- `autorizacaoLojaMiddleware`
- `consultarAssociacaoAdminLoja`
- `validarEscopoAcesso`

### Sem Switch/Case (Regra U2)
✅ Usa `Record<string, fn>` para despacho de escopos
```typescript
const validadores: Record<string, () => boolean> = {
  [ESCOPOS_ADMIN.SISTEMA]: () => true,
  [ESCOPOS_ADMIN.LOJA]: () => true,
};
```

### Constantes Tipadas (Regra U13)
✅ Usa constantes em vez de strings literais
```typescript
// ✅ Correto
[ESCOPOS_ADMIN.SISTEMA]

// ❌ Evitado
['SISTEMA']
```

### Validação no Backend (Regra U5)
✅ Sempre consulta banco de dados, nunca confia no cliente
```typescript
const associacao = await consultarAssociacaoAdminLoja(usuId, lojId);
```

### Logging Apropriado
✅ Registra eventos de segurança com contexto
- Info: Acessos autorizados
- Warn: Acessos negados
- Error: Erros internos

## Fluxo de Validação

```
1. Verificar autenticação (usu_id no contexto)
   ├─ Não → 401 Unauthorized
   └─ Sim → continuar

2. Verificar loja selecionada (loj_id no contexto)
   ├─ Não → 400 Bad Request
   └─ Sim → continuar

3. Consultar associação admin-loja no banco
   ├─ Não encontrada → 403 Forbidden
   └─ Encontrada → continuar

4. Validar status ativo (adl_ativo = true)
   ├─ Inativo → 403 Forbidden
   └─ Ativo → continuar

5. Validar escopo (SISTEMA ou LOJA)
   ├─ Válido → permitir
   └─ Inválido → 403 Forbidden

6. Acesso autorizado → next()
```

## Códigos de Resposta HTTP

| Código | Cenário | Mensagem |
|--------|---------|----------|
| 200 | Acesso autorizado | (continua para próximo middleware) |
| 400 | Loja não selecionada | "Loja não selecionada." |
| 401 | Usuário não autenticado | "Usuário não autenticado." |
| 403 | Sem permissão | "Você não tem permissão para acessar esta loja." |
| 404 | Loja não encontrada | "Loja não encontrada." |
| 500 | Erro interno | "Erro ao validar autorização." |

## Dependências

### Middlewares Anteriores Obrigatórios
1. `autenticacaoMiddleware` - Define `usu_id` no contexto
2. `contextoLojaMiddleware` - Define `loj_id` no contexto

### Injeção de Dependência
- `di.db` - Conexão com banco para consultar `admin_lojas`
- `di.repoLojas` - Repositório de lojas para validar existência

### Utilitários
- `ContextoRequisicao` - Acesso ao contexto da requisição
- `Logger` - Logging de eventos

## Tabela admin_lojas

```sql
CREATE TABLE livraria_gestao.admin_lojas (
    adl_id BIGSERIAL PRIMARY KEY,
    usu_id BIGINT NOT NULL,
    loj_id BIGINT NOT NULL,
    adl_papel VARCHAR(20) NOT NULL,
    adl_escopo VARCHAR(20) NOT NULL DEFAULT 'LOJA',
    adl_ativo BOOLEAN DEFAULT TRUE,
    adl_criado_em TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_admin_lojas_usuario FOREIGN KEY (usu_id) REFERENCES usuarios(usu_id),
    CONSTRAINT fk_admin_lojas_loja FOREIGN KEY (loj_id) REFERENCES lojas(loj_id),
    CONSTRAINT ck_admin_lojas_escopo_valido CHECK (adl_escopo IN ('SISTEMA', 'LOJA')),
    CONSTRAINT uq_admin_loja UNIQUE (usu_id, loj_id)
);
```

## Exemplo de Uso

```typescript
import { autorizacaoLojaMiddleware } from '@/shared/middlewares/autorizacaoLoja.middleware';

router.get(
  '/lojas/:lojaId/produtos',
  autenticacaoMiddleware,      // 1. Autentica
  contextoLojaMiddleware,      // 2. Define loja
  autorizacaoLojaMiddleware,   // 3. Valida acesso
  controladorListarProdutos    // 4. Processa
);
```

## Testes

### Executar testes
```bash
npm test -- autorizacaoLoja.middleware.test.ts
```

### Resultado
```
PASS src/shared/middlewares/__tests__/autorizacaoLoja.middleware.test.ts
  autorizacaoLojaMiddleware
    Validação de autenticação
      ✓ deve retornar 401 quando usuário não está autenticado
      ✓ deve retornar 400 quando loja não está selecionada
    Validação de associação admin-loja
      ✓ deve retornar 403 quando admin não está associado à loja
      ✓ deve retornar 403 quando associação está inativa
    Validação de escopo
      ✓ deve permitir acesso quando escopo é SISTEMA
      ✓ deve permitir acesso quando escopo é LOJA e admin está associado
      ✓ deve retornar 403 quando escopo é inválido
    Tratamento de erros
      ✓ deve retornar 500 quando ocorre erro na consulta ao banco
    Logging
      ✓ deve fazer log de acesso autorizado
      ✓ deve fazer log de acesso negado

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
```

## Considerações de Segurança

1. ✅ **Validação em Banco**: Sempre consulta banco, nunca confia em cliente
2. ✅ **Status Ativo**: Verifica `adl_ativo` para desativar sem deletar
3. ✅ **Escopo Tipado**: Usa constantes em vez de strings literais
4. ✅ **Logging Detalhado**: Registra todas as tentativas de acesso negado
5. ✅ **Tratamento de Erros**: Retorna erros genéricos ao cliente
6. ✅ **Contexto Seguro**: Usa AsyncLocalStorage para isolamento de requisições

## Próximos Passos Recomendados

1. **Cache de Associações**: Implementar cache Redis para melhorar performance
2. **Rate Limiting**: Adicionar limite de tentativas de acesso negado
3. **Auditoria Detalhada**: Registrar todas as tentativas em tabela de auditoria
4. **Grupos de Lojas**: Suportar admin de múltiplas lojas
5. **Integração com Dashboard**: Mostrar lojas acessíveis no painel do admin

## Checklist de Implementação

- ✅ Middleware criado e testado
- ✅ Constantes de escopo definidas
- ✅ Testes unitários (10/10 passando)
- ✅ Documentação técnica completa
- ✅ Exemplos de uso
- ✅ Padrões de código seguidos
- ✅ Logging implementado
- ✅ Tratamento de erros robusto
- ⏳ Integração em rotas do projeto (próximo passo)
- ⏳ Testes E2E com Cypress (próximo passo)

## Referências

- Middleware de autenticação: `src/shared/middlewares/autenticacao.middleware.ts`
- Middleware de contexto: `src/shared/middlewares/contextoLoja.middleware.ts`
- Tipos de papéis: `src/shared/types/papeis.ts`
- Contexto de requisição: `src/shared/infrastructure/contexto/ContextoRequisicao.ts`
- Regras do projeto: `backend/AGENTS.md`

## Autor

Implementado como parte do projeto de e-commerce de livros (LES).
