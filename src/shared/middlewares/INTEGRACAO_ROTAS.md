# Guia de Integração: Middleware de Autorização por Loja em Rotas

## Padrão de Integração

O middleware deve ser aplicado em rotas que exigem acesso a uma loja específica. A ordem dos middlewares é crítica:

```
autenticacaoMiddleware → contextoLojaMiddleware → autorizacaoLojaMiddleware → Controlador
```

## Exemplo 1: Rota Individual Protegida

```typescript
// src/modules/produtos/rotas.ts
import express from 'express';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { contextoLojaMiddleware } from '@/shared/middlewares/contextoLoja.middleware';
import { autorizacaoLojaMiddleware } from '@/shared/middlewares/autorizacaoLoja.middleware';
import { controladorListarProdutos } from './controlador';

const router = express.Router();

// Rota protegida: GET /api/lojas/produtos
router.get(
  '/produtos',
  autenticacaoMiddleware,      // 1. Valida JWT
  contextoLojaMiddleware,      // 2. Define loj_id
  autorizacaoLojaMiddleware,   // 3. Valida acesso à loja
  controladorListarProdutos    // 4. Processa requisição
);

export default router;
```

## Exemplo 2: Grupo de Rotas Protegidas

```typescript
// src/modules/admin/rotas.ts
import express from 'express';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { contextoLojaMiddleware } from '@/shared/middlewares/contextoLoja.middleware';
import { autorizacaoLojaMiddleware } from '@/shared/middlewares/autorizacaoLoja.middleware';
import { adminOnlyMiddleware } from '@/shared/middlewares/autorizacao.middleware';

const rotasAdmin = express.Router();

// Aplicar middlewares a todas as rotas do grupo
rotasAdmin.use(autenticacaoMiddleware);
rotasAdmin.use(contextoLojaMiddleware);
rotasAdmin.use(autorizacaoLojaMiddleware);
rotasAdmin.use(adminOnlyMiddleware); // Validação adicional de papel

// Todas as rotas abaixo estarão protegidas
rotasAdmin.get('/dashboard', controladorDashboard);
rotasAdmin.get('/relatorios', controladorRelatorios);
rotasAdmin.post('/configuracoes', controladorAtualizarConfiguracao);

export default rotasAdmin;
```

## Exemplo 3: Rotas Mistas (Públicas e Protegidas)

```typescript
// src/modules/lojas/rotas.ts
import express from 'express';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { contextoLojaMiddleware } from '@/shared/middlewares/contextoLoja.middleware';
import { autorizacaoLojaMiddleware } from '@/shared/middlewares/autorizacaoLoja.middleware';

const router = express.Router();

// Rotas públicas (sem autenticação)
router.get('/publicas', controladorListarLojasPublicas);

// Rotas protegidas (com autenticação e autorização)
router.get(
  '/minhas-lojas',
  autenticacaoMiddleware,
  contextoLojaMiddleware,
  autorizacaoLojaMiddleware,
  controladorListarMinhasLojas
);

router.put(
  '/configuracoes',
  autenticacaoMiddleware,
  contextoLojaMiddleware,
  autorizacaoLojaMiddleware,
  controladorAtualizarConfiguracao
);

export default router;
```

## Exemplo 4: Registrar Rotas no App Principal

```typescript
// src/app.ts
import express from 'express';
import rotasProdutos from '@/modules/produtos/rotas';
import rotasAdmin from '@/modules/admin/rotas';
import rotasLojas from '@/modules/lojas/rotas';

const app = express();

app.use(express.json());

// Registrar rotas com prefixo de API
app.use('/api/lojas', rotasLojas);
app.use('/api/admin', rotasAdmin);
app.use('/api/produtos', rotasProdutos);

export default app;
```

## Exemplo 5: Controlador com Acesso ao Contexto

```typescript
// src/modules/produtos/controlador.ts
import { Request, Response } from 'express';
import { ContextoRequisicao } from '@/shared/infrastructure/contexto/ContextoRequisicao';
import { servicoProdutos } from './servico';

export async function controladorListarProdutos(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Obter loj_id do contexto (já validado pelo middleware)
    const lojId = ContextoRequisicao.obterLojId();
    const usuId = ContextoRequisicao.obterUsuId();

    if (!lojId || !usuId) {
      res.status(400).json({
        sucesso: false,
        mensagem: 'Contexto incompleto',
      });
      return;
    }

    // Listar produtos da loja
    const produtos = await servicoProdutos.listarPorLoja(lojId);

    res.json({
      sucesso: true,
      dados: produtos,
    });
  } catch (erro) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar produtos',
    });
  }
}
```

## Exemplo 6: Teste de Integração com Jest

```typescript
// src/modules/produtos/__tests__/rotas.integration.test.ts
import request from 'supertest';
import app from '@/app';
import { di } from '@/shared/infrastructure/di.container';

describe('Rotas de Produtos - Integração', () => {
  describe('GET /api/produtos', () => {
    it('deve retornar 401 sem token JWT', async () => {
      const resposta = await request(app)
        .get('/api/produtos')
        .set('x-loja-uuid', 'uuid-loja-1');

      expect(resposta.status).toBe(401);
      expect(resposta.body.mensagem).toBe('Token não fornecido.');
    });

    it('deve retornar 403 se admin não tem acesso à loja', async () => {
      // Arrange
      const token = 'token-jwt-valido';
      jest.spyOn(di.db, 'executar').mockResolvedValue([]); // Sem associação

      // Act
      const resposta = await request(app)
        .get('/api/produtos')
        .set('Authorization', `Bearer ${token}`)
        .set('x-loja-uuid', 'uuid-loja-1');

      // Assert
      expect(resposta.status).toBe(403);
      expect(resposta.body.mensagem).toContain('permissão');
    });

    it('deve retornar 200 se admin tem acesso à loja', async () => {
      // Arrange
      const token = 'token-jwt-valido';
      jest.spyOn(di.db, 'executar').mockResolvedValue([
        { adl_escopo: 'LOJA', adl_ativo: true },
      ]);

      // Act
      const resposta = await request(app)
        .get('/api/produtos')
        .set('Authorization', `Bearer ${token}`)
        .set('x-loja-uuid', 'uuid-loja-1');

      // Assert
      expect(resposta.status).toBe(200);
      expect(resposta.body.sucesso).toBe(true);
    });
  });
});
```

## Exemplo 7: Teste com Cypress (E2E)

```typescript
// web/cypress/e2e/admin/produtos.cy.ts
describe('Admin - Gerenciar Produtos', () => {
  beforeEach(() => {
    // Login como admin
    cy.login('admin@livraria.com', 'senha123');
    
    // Selecionar loja
    cy.selectLoja('Loja Centro');
  });

  it('deve listar produtos da loja', () => {
    // Arrange & Act
    cy.visit('/admin/produtos');

    // Assert
    cy.contains('Produtos').should('be.visible');
    cy.get('[data-testid="lista-produtos"]').should('exist');
  });

  it('deve negar acesso se admin não tem permissão', () => {
    // Arrange
    cy.logout();
    cy.login('admin-outra-loja@livraria.com', 'senha123');
    cy.selectLoja('Loja Centro'); // Tenta acessar loja diferente

    // Act
    cy.visit('/admin/produtos', { failOnStatusCode: false });

    // Assert
    cy.contains('permissão').should('be.visible');
  });
});
```

## Exemplo 8: Tratamento de Erros no Cliente

```typescript
// web/src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Interceptor para tratamento de erros de autorização
api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    if (erro.response?.status === 403) {
      // Acesso negado à loja
      console.error('Você não tem permissão para acessar esta loja');
      // Redirecionar para seleção de loja
      window.location.href = '/admin/selecionar-loja';
    }

    if (erro.response?.status === 401) {
      // Token inválido
      console.error('Sessão expirada, faça login novamente');
      // Redirecionar para login
      window.location.href = '/login';
    }

    return Promise.reject(erro);
  }
);

export default api;
```

## Exemplo 9: Hook React para Validar Acesso

```typescript
// web/src/hooks/useAutorizacaoLoja.ts
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';

export function useAutorizacaoLoja(lojaId: string) {
  const navigate = useNavigate();
  const [autorizado, setAutorizado] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function validarAcesso() {
      try {
        // Fazer requisição para validar acesso
        await api.get('/api/lojas/validar', {
          headers: { 'x-loja-uuid': lojaId },
        });
        setAutorizado(true);
      } catch (erro: any) {
        if (erro.response?.status === 403) {
          // Sem permissão
          navigate('/admin/lojas');
        } else if (erro.response?.status === 401) {
          // Não autenticado
          navigate('/login');
        }
        setAutorizado(false);
      } finally {
        setCarregando(false);
      }
    }

    validarAcesso();
  }, [lojaId, navigate]);

  return { autorizado, carregando };
}
```

## Checklist de Integração

- [ ] Middleware importado na rota
- [ ] Ordem correta dos middlewares (auth → contexto → autorização)
- [ ] Controlador acessa contexto com `ContextoRequisicao`
- [ ] Testes unitários criados
- [ ] Testes de integração criados
- [ ] Testes E2E com Cypress criados
- [ ] Tratamento de erros no cliente
- [ ] Documentação atualizada
- [ ] Code review realizado
- [ ] Merge para main

## Troubleshooting

### Problema: 401 Unauthorized
**Causa**: Token JWT inválido ou ausente
**Solução**: Verificar se header `Authorization: Bearer <token>` está presente

### Problema: 400 Bad Request (Loja não selecionada)
**Causa**: Header `x-loja-uuid` não enviado
**Solução**: Adicionar header `x-loja-uuid` na requisição

### Problema: 403 Forbidden (Sem permissão)
**Causa**: Admin não está associado à loja
**Solução**: Verificar tabela `admin_lojas` se associação existe e está ativa

### Problema: 500 Internal Server Error
**Causa**: Erro ao consultar banco de dados
**Solução**: Verificar logs do servidor e conexão com banco

## Performance

### Otimizações Recomendadas

1. **Cache de Associações**
```typescript
// Usar Redis para cachear associações admin-loja
const chaveCache = `admin:${usuId}:lojas`;
const associacoes = await cache.get(chaveCache);
if (!associacoes) {
  associacoes = await db.query(...);
  await cache.set(chaveCache, associacoes, 3600); // 1 hora
}
```

2. **Índices no Banco**
```sql
CREATE INDEX idx_admin_lojas_usu_loj 
ON livraria_gestao.admin_lojas(usu_id, loj_id);

CREATE INDEX idx_admin_lojas_ativo 
ON livraria_gestao.admin_lojas(adl_ativo);
```

3. **Connection Pooling**
- Já implementado em `di.container`
- Usar `di.db.executar()` para queries

## Referências

- [Middleware de Autorização por Loja](./AUTORIZACAO_LOJA.md)
- [Exemplos de Uso](./EXEMPLO_USO.md)
- [Documentação do Projeto](../AGENTS.md)
