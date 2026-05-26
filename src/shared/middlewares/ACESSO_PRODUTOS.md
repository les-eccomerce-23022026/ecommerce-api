# Guia de Integração: Middleware de Acesso a Produtos por Tipo de Usuário

## Visão Geral

O middleware `acessoProdutosMiddleware` controla o acesso a produtos (livros) com base no tipo de usuário autenticado. Ele define o contexto de loja apropriado para uso nos repositórios, permitindo ou restringindo o acesso a produtos de diferentes lojas.

## Regras de Acesso

| Tipo de Usuário | Acesso a Produtos | Filtro de Loja |
|----------------|------------------|----------------|
| **Cliente** | Total (todas as lojas) | Opcional (via header `x-loja-uuid`) |
| **Admin Sistema** | Total (todas as lojas) | Opcional (via header `x-loja-uuid`) |
| **Admin Tenant** | Restrito (apenas sua loja) | Obrigatório (usa loja principal) |
| **Não autenticado** | Total (todas as lojas) | Opcional (via header `x-loja-uuid`) |

## Padrão de Integração

### Para Rotas Públicas (Catálogo)

```typescript
// src/modules/livros/livros.routes.ts
import { contextoLojaMiddleware } from '@/shared/middlewares/contextoLoja.middleware';

// Rota pública: acesso sem autenticação
router.get('/livros', contextoLojaMiddleware, controller.listarCatalogo.bind(controller));
router.get('/livros/:uuid', contextoLojaMiddleware, controller.detalhes.bind(controller));
```

**Comportamento:**
- Usuários não autenticados podem acessar produtos de todas as lojas
- O header `x-loja-uuid` é opcional para filtrar por uma loja específica
- Se não houver header, usa loja padrão (loj_id = 1)

### Para Rotas de Admin

```typescript
// src/modules/livros/livros.routes.ts
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { adminOnlyMiddleware } from '@/shared/middlewares/autorizacao.middleware';
import { acessoProdutosMiddleware } from '@/shared/middlewares/acessoProdutos.middleware';

// Rota de admin: acesso controlado por tipo de usuário
router.get(
  '/admin/livros',
  autenticacaoMiddleware,      // 1. Valida JWT
  adminOnlyMiddleware,         // 2. Verifica se é admin
  acessoProdutosMiddleware,    // 3. Define contexto de loja por tipo de usuário
  controller.listarAdmin.bind(controller)
);

router.get(
  '/admin/livros/:uuid',
  autenticacaoMiddleware,
  adminOnlyMiddleware,
  acessoProdutosMiddleware,
  controller.detalhesAdmin.bind(controller)
);
```

**Comportamento:**
- **Cliente:** Pode ver produtos de todas as lojas (filtro opcional via header)
- **Admin Sistema:** Pode ver produtos de todas as lojas (filtro opcional via header)
- **Admin Tenant:** Vê apenas produtos da sua loja principal (filtro obrigatório)

## Exemplos de Uso

### Exemplo 1: Cliente Acessando Catálogo Completo

```typescript
// Requisição sem header x-loja-uuid
GET /api/livros

// Resultado: vê produtos de todas as lojas
{
  "livros": [...],
  "total": 150,
  "pagina": 1
}
```

### Exemplo 2: Cliente Acessando Catálogo de Loja Específica

```typescript
// Requisição com header x-loja-uuid
GET /api/livros
Headers: {
  "x-loja-uuid": "550e8400-e29b-41d4-a716-446655440000"
}

// Resultado: vê apenas produtos da loja especificada
{
  "livros": [...],
  "total": 50,
  "pagina": 1
}
```

### Exemplo 3: Admin Tenant Vendo Apenas Sua Loja

```typescript
// Requisição de admin tenant
GET /api/admin/livros
Headers: {
  "Authorization": "Bearer <token-admin-tenant>"
}

// Resultado: vê apenas produtos da loja principal do admin
{
  "livros": [...],
  "total": 30
}
```

### Exemplo 4: Admin Sistema Acessando Todas as Lojas

```typescript
// Requisição de admin sistema sem header
GET /api/admin/livros
Headers: {
  "Authorization": "Bearer <token-admin-sistema>"
}

// Resultado: vê produtos de todas as lojas
{
  "livros": [...],
  "total": 150
}
```

### Exemplo 5: Admin Sistema Acessando Loja Específica

```typescript
// Requisição de admin sistema com header
GET /api/admin/livros
Headers: {
  "Authorization": "Bearer <token-admin-sistema>",
  "x-loja-uuid": "550e8400-e29b-41d4-a716-446655440000"
}

// Resultado: vê apenas produtos da loja especificada
{
  "livros": [...],
  "total": 50
}
```

## Integração com Repositórios

O middleware define o contexto de loja que é usado pelos repositórios:

```typescript
// src/modules/livros/repositorioLivrosPostgres.ts
export class RepositorioLivrosPostgres {
  private obterLojId(): number | undefined {
    return ContextoRequisicao.obterLojId();
  }

  async listarCatalogo(opcoes: { ... }): Promise<IListagemCatalogoLivros> {
    const loj_id = this.obterLojId();
    
    // Se loj_id existe, filtra por loja
    // Se loj_id é undefined, não filtra (todas as lojas)
    const filtroLoja = loj_id ? ` AND e.loj_id = $${paramsCount.length + 1}` : '';
    // ...
  }
}
```

## Testes de Integração

### Teste: Cliente Acessando Catálogo

```typescript
describe('GET /api/livros', () => {
  it('deve retornar produtos de todas as lojas para cliente sem filtro', async () => {
    const resposta = await request(app)
      .get('/api/livros')
      .expect(200);

    expect(resposta.body.livros).toBeDefined();
    expect(resposta.body.total).toBeGreaterThan(0);
  });

  it('deve retornar produtos de loja específica quando header x-loja-uuid é fornecido', async () => {
    const resposta = await request(app)
      .get('/api/livros')
      .set('x-loja-uuid', '550e8400-e29b-41d4-a716-446655440000')
      .expect(200);

    expect(resposta.body.livros).toBeDefined();
  });
});
```

### Teste: Admin Tenant Acessando Produtos

```typescript
describe('GET /api/admin/livros', () => {
  it('deve retornar apenas produtos da loja do admin tenant', async () => {
    const token = await gerarTokenAdminTenant();
    const resposta = await request(app)
      .get('/api/admin/livros')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Verificar se produtos são apenas da loja do admin
    expect(resposta.body.livros).toBeDefined();
  });

  it('deve negar acesso se admin tenant não tem loja configurada', async () => {
    const token = await gerarTokenAdminSemLoja();
    const resposta = await request(app)
      .get('/api/admin/livros')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(resposta.body.mensagem).toContain('loja configurada');
  });
});
```

### Teste: Admin Sistema Acessando Produtos

```typescript
describe('GET /api/admin/livros - Admin Sistema', () => {
  it('deve retornar produtos de todas as lojas', async () => {
    const token = await gerarTokenAdminSistema();
    const resposta = await request(app)
      .get('/api/admin/livros')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(resposta.body.livros).toBeDefined();
  });

  it('deve retornar produtos de loja específica quando header é fornecido', async () => {
    const token = await gerarTokenAdminSistema();
    const resposta = await request(app)
      .get('/api/admin/livros')
      .set('Authorization', `Bearer ${token}`)
      .set('x-loja-uuid', '550e8400-e29b-41d4-a716-446655440000')
      .expect(200);

    expect(resposta.body.livros).toBeDefined();
  });
});
```

## Diferenças Entre Middlewares

| Middleware | Propósito | Quando Usar |
|------------|-----------|-------------|
| `contextoLojaMiddleware` | Define contexto de loja a partir de header/cookie | Rotas públicas ou quando não há autenticação |
| `autenticacaoMiddleware` | Valida JWT e define contexto de usuário | Rotas que exigem autenticação |
| `autorizacaoLojaMiddleware` | Valida se usuário tem acesso à loja específica | Rotas que exigem autorização por loja |
| `acessoProdutosMiddleware` | Define contexto de loja por tipo de usuário | Rotas de produtos com controle por tipo de usuário |

## Fluxo de Decisão do Middleware

```
Requisição → acessoProdutosMiddleware
    │
    ├─ Usuário não autenticado?
    │   └─ Sim → Contexto sem filtro (todas as lojas)
    │
    ├─ Usuário autenticado → Verificar tipo
    │   │
    │   ├─ Cliente?
    │   │   ├─ Tem header x-loja-uuid?
    │   │   │   ├─ Sim → Filtrar por loja do header
    │   │   │   └─ Não → Sem filtro (todas as lojas)
    │   │
    │   ├─ Admin Sistema?
    │   │   ├─ Tem header x-loja-uuid?
    │   │   │   ├─ Sim → Filtrar por loja do header
    │   │   │   └─ Não → Sem filtro (todas as lojas)
    │   │
    │   └─ Admin Tenant?
    │       └─ Usar loja principal do usuário (filtro obrigatório)
    │
    └─ Continuar para controlador
```

## Considerações de Segurança

1. **Admin Tenant:** Sempre vê apenas sua loja, não pode burlar via header
2. **Admin Sistema:** Pode acessar qualquer loja, mas deve ser validado no JWT
3. **Cliente:** Pode acessar todas as lojas, mas header deve ser validado
4. **Não autenticado:** Acesso público, sem restrições

## Logs e Debug

O middleware registra informações detalhadas para debug:

```typescript
Logger.info('[acesso-produtos] Cliente acessando catálogo completo (sem filtro de loja)');
Logger.info('[acesso-produtos] Admin sistema acessando loja específica: ${loj_uuid}');
Logger.info('[acesso-produtos] Admin tenant acessando apenas sua loja: ${loj_uuid}');
```

## Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| 403 "Administrador sem loja configurada" | Admin tenant sem loja principal | Configurar loja principal no cadastro do admin |
| 403 "Acesso não autorizado a esta loja" | Usuário tentando acessar loja não autorizada | Verificar associações de lojas no token JWT |
| 400 "loj_uuid inválido" | Header x-loja-uuid com formato inválido | Usar formato UUID válido |
