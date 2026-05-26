# Middleware de Autorização por Loja

## Visão Geral

O middleware `autorizacaoLojaMiddleware` valida se um administrador autenticado tem permissão para acessar a loja solicitada. Implementa controle de acesso baseado em escopo (SISTEMA vs LOJA).

## Localização

- **Middleware**: `src/shared/middlewares/autorizacaoLoja.middleware.ts`
- **Constantes**: `src/shared/types/escoposAdmin.ts`
- **Testes**: `src/shared/middlewares/__tests__/autorizacaoLoja.middleware.test.ts`

## Regras de Autorização

### Escopo SISTEMA
- Administrador do sistema com acesso global
- Pode gerenciar qualquer loja sem restrições
- Não precisa estar explicitamente associado à loja

### Escopo LOJA
- Administrador de loja com acesso restrito
- Só pode gerenciar a loja específica para a qual foi associado
- Requer associação ativa na tabela `admin_lojas`

## Fluxo de Validação

```
1. Verificar se usuário está autenticado (usu_id no contexto)
   ├─ Não → 401 Unauthorized
   └─ Sim → continuar

2. Verificar se loja foi selecionada (loj_id no contexto)
   ├─ Não → 400 Bad Request
   └─ Sim → continuar

3. Consultar associação admin-loja no banco
   ├─ Não encontrada → 403 Forbidden
   └─ Encontrada → continuar

4. Validar se associação está ativa (adl_ativo = true)
   ├─ Inativa → 403 Forbidden
   └─ Ativa → continuar

5. Validar escopo de acesso
   ├─ SISTEMA → permitir
   ├─ LOJA → permitir (já validado como associado)
   └─ Inválido → 403 Forbidden

6. Acesso autorizado → next()
```

## Códigos de Resposta HTTP

| Código | Cenário |
|--------|---------|
| 200 | Acesso autorizado (continua para próximo middleware) |
| 400 | Loja não selecionada no contexto |
| 401 | Usuário não autenticado |
| 403 | Usuário não tem permissão para acessar a loja |
| 404 | Loja não encontrada |
| 500 | Erro interno ao validar autorização |

## Uso em Rotas

### Exemplo 1: Proteger rota de admin
```typescript
import { autorizacaoLojaMiddleware } from '@/shared/middlewares/autorizacaoLoja.middleware';

router.get(
  '/admin/lojas/:lojaId/produtos',
  autenticacaoMiddleware,      // Autentica usuário
  contextoLojaMiddleware,      // Define loj_id no contexto
  autorizacaoLojaMiddleware,   // Valida acesso à loja
  controladorListarProdutos    // Controlador da rota
);
```

### Exemplo 2: Proteger múltiplas rotas
```typescript
const rotasAdminLoja = express.Router();

// Aplicar middleware a todas as rotas
rotasAdminLoja.use(autenticacaoMiddleware);
rotasAdminLoja.use(contextoLojaMiddleware);
rotasAdminLoja.use(autorizacaoLojaMiddleware);

rotasAdminLoja.get('/produtos', controladorListarProdutos);
rotasAdminLoja.post('/produtos', controladorCriarProduto);
rotasAdminLoja.put('/produtos/:id', controladorAtualizarProduto);
```

## Dependências

### Middlewares Anteriores Obrigatórios
1. **autenticacaoMiddleware**: Define `req.usuario` e contexto com `usu_id`
2. **contextoLojaMiddleware**: Define `loj_id` no contexto

### Injeção de Dependência
- `di.db`: Conexão com banco de dados (para consultar `admin_lojas`)
- `di.repoLojas`: Repositório de lojas (para validar existência)

### Utilitários
- `ContextoRequisicao`: Acesso ao contexto da requisição
- `Logger`: Logging de eventos de segurança

## Constantes de Escopo

```typescript
import { ESCOPOS_ADMIN } from '@/shared/types/escoposAdmin';

// Valores válidos
ESCOPOS_ADMIN.SISTEMA  // 'SISTEMA'
ESCOPOS_ADMIN.LOJA     // 'LOJA'
```

## Logging

O middleware registra eventos importantes:

### Info (sucesso)
```
[autorizacao-loja] Acesso autorizado. usu_id=100, loj_id=1, escopo=LOJA
```

### Warn (negação de acesso)
```
[autorizacao-loja] Admin sem associação à loja. usu_id=100, loj_id=1
[autorizacao-loja] Associação admin-loja inativa. usu_id=100, loj_id=1
[autorizacao-loja] Escopo inválido ou insuficiente. usu_id=100, loj_id=1, escopo=INVALIDO
```

### Error (erro interno)
```
[autorizacao-loja] Erro ao validar autorização: Erro de conexão com banco
```

## Estrutura da Tabela admin_lojas

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

## Testes

### Executar testes unitários
```bash
npm test -- autorizacaoLoja.middleware.test.ts
```

### Executar testes de integração
```bash
npm test -- autorizacaoLoja.integration.test.ts
```

### Cobertura de testes
- ✅ Validação de autenticação (401)
- ✅ Validação de loja selecionada (400)
- ✅ Validação de associação admin-loja (403)
- ✅ Validação de status ativo (403)
- ✅ Validação de escopo SISTEMA (200)
- ✅ Validação de escopo LOJA (200)
- ✅ Validação de escopo inválido (403)
- ✅ Tratamento de erros de banco (500)
- ✅ Logging apropriado

## Considerações de Segurança

1. **Validação em Banco**: Sempre consulta o banco para validar associação, nunca confia em dados do cliente
2. **Status Ativo**: Verifica `adl_ativo` para permitir desativar acesso sem deletar registros
3. **Escopo Tipado**: Usa constantes em vez de strings literais para evitar erros de digitação
4. **Logging Detalhado**: Registra todas as tentativas de acesso negado para auditoria
5. **Tratamento de Erros**: Retorna erros genéricos ao cliente, detalhes apenas em logs

## Próximos Passos

- [ ] Implementar cache de associações admin-loja para melhorar performance
- [ ] Adicionar rate limiting para tentativas de acesso negado
- [ ] Implementar auditoria detalhada de acessos
- [ ] Adicionar suporte a grupos de lojas (admin de múltiplas lojas)
