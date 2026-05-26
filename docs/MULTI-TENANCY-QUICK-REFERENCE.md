# Multi-Tenancy: Quick Reference

## Resumo Rápido

| Tipo de Usuário | Papel | Escopo | Pode Criar Lojas? |
|-----------------|-------|--------|-------------------|
| Cliente | `cliente` | Global (catálogo) | ❌ |
| Admin Tenant | `admin` | Apenas sua loja | ❌ |
| Admin Sistema | `admin_sistema` + `admin` | Global (tudo) | ✅ |

## Middlewares - Quando Usar

```typescript
// Para rotas que só admin_sistema pode acessar
import { adminSistemaOnlyMiddleware } from '@/shared/middlewares/autorizacao.middleware';

router.post('/api/admin/lojas', adminSistemaOnlyMiddleware, criarLoja);

// Para rotas que qualquer admin pode acessar
import { adminOnlyMiddleware } from '@/shared/middlewares/autorizacao.middleware';

router.get('/api/admin/livros', adminOnlyMiddleware, listarLivros);

// Para rotas que precisam validar escopo de loja
import { contextoLojaMiddleware } from '@/shared/middlewares/contextoLoja.middleware';

router.get('/api/admin/produtos', contextoLojaMiddleware, listarProdutos);

// Para rotas de produtos com controle de acesso granular
import { acessoProdutosMiddleware } from '@/shared/middlewares/acessoProdutos.middleware';

router.get('/api/produtos', acessoProdutosMiddleware, listarProdutosPublicos);
```

## Verificação de Permissões no Código

```typescript
import { usuarioEhAdminSistema, usuarioTemPapelAdmin } from '@/shared/middlewares/autorizacao.middleware';

// Verificar se é admin sistema
if (usuarioEhAdminSistema(req.usuario)) {
  // Acesso global
}

// Verificar se é admin (sistema ou tenant)
if (usuarioTemPapelAdmin(req.usuario)) {
  // Acesso administrativo
}

// Verificar se tem papel específico
if (req.usuario.papeis.includes('admin_sistema')) {
  // Acesso de sistema
}
```

## Estrutura do Token JWT

```typescript
{
  sub: "uuid-do-usuario",           // UUID público
  email: "admin@livraria.com.br",
  role: "admin",                     // Papel principal
  papeis: ["admin", "admin_sistema"], // Todos os papéis
  lojas: [                          // Lojas associadas
    {
      loj_id: 29,                  // ID interno (não expor)
      loj_uuid: "uuid-da-loja"     // UUID público
    }
  ],
  loja_uuid_principal: "uuid-da-loja", // Loja padrão
  ip: "::1",
  fingerprint: "hash-do-user-agent",
  iat: 1234567890,
  exp: 1234571490
}
```

## Queries SQL Úteis

### Buscar usuários por papel
```sql
SELECT u.usu_email, u.usu_nome, p.pap_descricao
FROM livraria_gestao.usuarios u
JOIN livraria_gestao.usuario_papeis up ON u.usu_id = up.usu_id
JOIN livraria_gestao.papeis p ON up.pap_id = p.pap_id
WHERE p.pap_descricao = 'admin_sistema'
AND up.usp_ativo = TRUE;
```

### Buscar lojas de um usuário
```sql
SELECT l.loj_uuid, l.loj_nome, al.adl_escopo
FROM livraria_gestao.lojas l
JOIN livraria_gestao.admin_lojas al ON l.loj_id = al.loj_id
WHERE al.usu_id = $1
AND al.adl_ativo = TRUE;
```

### Verificar escopo de admin
```sql
SELECT adl_escopo
FROM livraria_gestao.admin_lojas
WHERE usu_id = $1 AND loj_id = $2;
```

## Frontend: Headers Necessários

### Para Admin Tenant
```typescript
// Requisições para rotas admin precisam do header x-loja-uuid
headers: {
  'x-loja-uuid': 'uuid-da-loja-do-usuario'
}
```

### Para Admin Sistema
```typescript
// Admin sistema não precisa de x-loja-uuid (acesso global)
// Mas pode enviar para acessar uma loja específica se desejar
headers: {
  'x-loja-uuid': 'uuid-da-loja-especifica' // opcional
}
```

## Testes Rápidos com curl

### Login como admin sistema
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "admin_sistema@livraria.com.br",
    "senha": "SenhaForte@123"
  }'
```

### Criar loja como admin sistema
```bash
curl -X POST http://localhost:3000/api/admin/lojas \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "nome": "Nova Loja",
    "slug": "nova-loja",
    "cnpj": "12.345.678/0001-90"
  }'
```

### Listar produtos como admin tenant
```bash
curl -X GET http://localhost:3000/api/admin/livros \
  -H "x-loja-uuid: uuid-da-loja" \
  -b cookies_admin_tenant.txt
```

## Migrations Importantes

- **044**: Criar tabela `livraria_gestao.papeis`
- **048**: Adicionar coluna `adl_escopo` em `admin_lojas`
- **049**: Criar papel `admin_sistema`
- **050**: Seed multi-tenancy (lojas, admins, clientes)
- **051**: Sincronizar papeis entre schemas
- **052**: Corrigir FK `usuarios.papeis`
- **053**: Adicionar FK `usuario_papeis.papel`

## Problemas Comuns

### "Acesso negado. Esta rota é restrita ao Administrador do Sistema"
- **Causa**: Usuário não tem papel `admin_sistema`
- **Solução**: Verificar se usuário tem papel correto em `usuario_papeis`

### "Header x-loja-uuid é obrigatório para admin tenant"
- **Causa**: Admin tenant tentando acessar rota sem header
- **Solução**: Enviar header `x-loja-uuid` com UUID da loja do usuário

### "Token inválido ou expirado"
- **Causa**: Token não contém dados esperados ou expirou
- **Solução**: Verificar estrutura do token e tempo de expiração

### FK violation em `usuario_papeis`
- **Causa**: Papeis não sincronizados entre schemas
- **Solução**: Executar migrations 051, 052, 053

## Documentação Completa

- [Implementação Técnica Detalhada](./MULTI-TENANCY-IMPLEMENTACAO.md)
- [Usuários e Permissões (Negócio)](../../docs/contexto-negocio/multi-tenancy-usuarios-permissoes.md)
- [Personas](../../docs/contexto-negocio/personas.md)
