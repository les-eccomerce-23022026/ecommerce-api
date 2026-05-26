# Multi-Tenancy: Implementação Técnica

## Visão Geral

Este documento descreve a implementação técnica da arquitetura multi-tenancy no backend do e-commerce de livros, incluindo estrutura de banco de dados, middlewares de autorização e controle de acesso.

## Arquitetura de Dados

### Tabelas Principais

#### 1. `livraria_gestao.papeis`
Define os papéis de acesso do sistema:

```sql
CREATE TABLE livraria_gestao.papeis (
    pap_id          SERIAL          PRIMARY KEY,
    pap_descricao   VARCHAR(30)     NOT NULL,
    pap_criado_em   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_papeis_descricao UNIQUE (pap_descricao)
);
```

**Papéis disponíveis:**
- `admin`: Administrador de loja (tenant)
- `cliente`: Cliente final
- `admin_sistema`: Administrador do sistema (acesso global)

#### 2. `livraria_gestao.usuario_papeis`
Relacionamento N:M entre usuários e papéis:

```sql
CREATE TABLE livraria_gestao.usuario_papeis (
    usp_id          SERIAL          PRIMARY KEY,
    usu_id          BIGINT          NOT NULL,
    pap_id          INTEGER         NOT NULL,
    usp_ativo       BOOLEAN         NOT NULL    DEFAULT TRUE,
    usp_criado_em   TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    usp_atualizado_em TIMESTAMPTZ  NOT NULL    DEFAULT NOW(),
    
    CONSTRAINT uq_usuario_papel UNIQUE (usu_id, pap_id),
    CONSTRAINT fk_usuario_papeis_usuario FOREIGN KEY (usu_id)
        REFERENCES livraria_gestao.usuarios(usu_id) ON DELETE CASCADE,
    CONSTRAINT fk_usuario_papeis_papel FOREIGN KEY (pap_id)
        REFERENCES livraria_gestao.papeis(pap_id) ON UPDATE CASCADE ON DELETE RESTRICT
);
```

#### 3. `livraria_gestao.admin_lojas`
Define escopo de administração (SISTEMA vs LOJA):

```sql
CREATE TABLE livraria_gestao.admin_lojas (
    adl_id        BIGINT                   PRIMARY KEY,
    usu_id        BIGINT                   NOT NULL,
    loj_id        BIGINT                   NOT NULL,
    adl_papel     VARCHAR(20)              NOT NULL,
    adl_ativo     BOOLEAN                  NOT NULL    DEFAULT TRUE,
    adl_escopo    VARCHAR(20)              NOT NULL    DEFAULT 'LOJA',
    adl_criado_em TIMESTAMP WITH TIME ZONE NOT NULL    DEFAULT NOW(),
    
    CONSTRAINT uq_admin_loja UNIQUE (usu_id, loj_id),
    CONSTRAINT ck_admin_lojas_escopo_valido CHECK (adl_escopo IN ('SISTEMA', 'LOJA'))
);
```

**Escopos:**
- `SISTEMA`: Admin sistema pode acessar todas as lojas
- `LOJA`: Admin tenant pode acessar apenas sua loja

#### 4. `livraria_gestao.lojas`
Tabela de lojas (tenants):

```sql
CREATE TABLE livraria_gestao.lojas (
    loj_id        BIGINT                   PRIMARY KEY,
    loj_uuid      UUID                     NOT NULL    DEFAULT gen_random_uuid(),
    loj_nome      VARCHAR(100)             NOT NULL,
    loj_slug      VARCHAR(50)              NOT NULL,
    loj_cnpj      CHAR(18)                 NOT NULL,
    loj_ativo     BOOLEAN                  NOT NULL    DEFAULT TRUE,
    loj_criado_em TIMESTAMP WITH TIME ZONE NOT NULL    DEFAULT NOW()
);
```

---

## Middlewares de Autorização

### 1. `adminSistemaOnlyMiddleware`
Restringe acesso a administradores do sistema:

```typescript
export function adminSistemaOnlyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { usuario } = req;

  if (!usuarioEhAdminSistema(usuario)) {
    res.status(403).json({
      mensagem: 'Acesso negado. Esta rota é restrita ao Administrador do Sistema.',
      sucesso: false,
    });
    return;
  }

  next();
}
```

**Rotas protegidas:**
- `POST /api/admin/lojas` (criar lojas)
- `POST /api/admin/lojas/:id/admins` (criar admins de loja)

### 2. `adminOnlyMiddleware`
Restringe acesso a administradores (sistema ou tenant):

```typescript
export function adminOnlyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { usuario } = req;

  if (!usuarioTemPapelAdmin(usuario)) {
    res.status(403).json({
      mensagem: 'Acesso negado. Esta rota é restrita a administradores.',
      sucesso: false,
    });
    return;
  }

  next();
}
```

**Rotas protegidas:**
- `GET /api/admin/livros` (listar livros)
- `POST /api/admin/livros` (criar livros)
- `GET /api/admin/vendas` (listar vendas)

### 3. `contextoLojaMiddleware`
Valida escopo de loja para admin tenants:

```typescript
export function contextoLojaMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { usuario } = req;
  const lojaUuid = req.headers['x-loja-uuid'];

  // Admin sistema pode acessar qualquer loja
  if (usuarioEhAdminSistema(usuario)) {
    return next();
  }

  // Admin tenant só pode acessar sua loja
  if (usuario.role === 'admin' && !usuarioEhAdminSistema(usuario)) {
    if (!lojaUuid || !usuario.lojas.includes(lojaUuid)) {
      return res.status(403).json({ mensagem: 'Acesso negado' });
    }
  }

  next();
}
```

### 4. `acessoProdutosMiddleware`
Controla acesso a produtos por tipo de usuário:

```typescript
export function acessoProdutosMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { usuario } = req;
  const lojaUuid = req.headers['x-loja-uuid'];

  // Cliente: acesso total a todos os produtos (opcionalmente filtrado por loja)
  if (possuiPapel(usuario, 'cliente')) {
    return next();
  }

  // Admin sistema: acesso total a todos os produtos
  if (usuarioEhAdminSistema(usuario)) {
    return next();
  }

  // Admin tenant: acesso restrito à sua loja (filtro obrigatório)
  if (usuario.role === 'admin' && !usuarioEhAdminSistema(usuario)) {
    if (!lojaUuid) {
      return res.status(400).json({ 
        mensagem: 'Header x-loja-uuid é obrigatório para admin tenant' 
      });
    }
    if (!usuario.lojas.includes(lojaUuid)) {
      return res.status(403).json({ mensagem: 'Acesso negado a esta loja' });
    }
  }

  next();
}
```

---

## Token JWT e Escopo

### Estrutura do Token

```typescript
{
  sub: "uuid-do-usuario",
  email: "admin_centro@livraria.com.br",
  role: "admin",
  papeis: ["admin"],
  lojas: [
    {
      loj_id: 29,
      loj_uuid: "1fe9ce2c-f0f5-4675-94dc-55c14e0884f7"
    }
  ],
  loja_uuid_principal: "1fe9ce2c-f0f5-4675-94dc-55c14e0884f7",
  ip: "::1",
  fingerprint: "hash-do-user-agent",
  iat: 1234567890,
  exp: 1234571490
}
```

### Campos Importantes

- **`sub`**: UUID do usuário (identificador público)
- **`role`**: Papel principal (compatibilidade)
- **`papeis`**: Array de papéis do usuário
- **`lojas`**: Array de lojas associadas ao usuário (com IDs internos e UUIDs)
- **`loja_uuid_principal`**: UUID da loja principal (usada como padrão)

### Geração do Token

```typescript
// Buscar lojas do usuário para multi-tenancy (com UUIDs)
let lojas: Array<{ loj_id: number; loj_uuid: string }> = [];
let loja_uuid_principal: string | undefined;

try {
  lojas = await this.repositorioUsuarios.buscarLojasDoUsuarioComUuids(usuarioAutenticado.id);
  
  if (lojas.length > 0) {
    loja_uuid_principal = lojas[0].loj_uuid;
  } else {
    // Fallback para loja padrão
    const defaultLojaId = process.env.DEFAULT_LOJA_ID ? parseInt(process.env.DEFAULT_LOJA_ID) : 1;
    const defaultLojaUuid = await this.repositorioUsuarios.buscarLojaUuidPorId(defaultLojaId);
    if (defaultLojaUuid) {
      lojas = [{ loj_id: defaultLojaId, loj_uuid: defaultLojaUuid }];
      loja_uuid_principal = defaultLojaUuid;
    }
  }
} catch (erro) {
  Logger.warn('[auth.service] Falha ao buscar lojas do usuário, usando loja padrão');
}

const token = jwt.sign(
  {
    sub: usuarioAutenticado.uuid,
    email: usuarioAutenticado.email,
    role: papelLogin,
    papeis: usuarioAutenticado.papeis.map((p) => p.descricao),
    lojas: lojas,
    loja_uuid_principal: loja_uuid_principal,
    ip: ipAddress,
    fingerprint: userAgent ? crypto.createHash('sha256').update(userAgent).digest('hex') : undefined,
  },
  segredo as string,
  { expiresIn: TEMPO_EXPIRACAO_PADRAO },
);
```

---

## Queries de Banco de Dados

### Buscar Lojas do Usuário com UUIDs

```typescript
// usuario.queries.ts
SELECT_LOJAS_USUARIO_UUID: `
  SELECT l.loj_id AS "loj_id", l.loj_uuid AS "loj_uuid"
  FROM livraria_gestao.lojas l
  INNER JOIN livraria_gestao.admin_lojas al ON l.loj_id = al.loj_id
  WHERE al.usu_id = $1 AND al.adl_ativo = TRUE
`,
```

### Buscar Papéis do Usuário

```typescript
// usuario.queries.ts
SELECT_PAPEIS_USUARIO: `
  SELECT p.pap_id AS "id", p.pap_descricao AS "descricao"
  FROM livraria_gestao.papeis p
  INNER JOIN livraria_gestao.usuario_papeis up ON p.pap_id = up.pap_id
  WHERE up.usu_id = $1 AND up.usp_ativo = TRUE
`,
```

---

## Migrations Relevantes

### Migration 044: Criar tabela papeis em livraria_gestao
```sql
-- 044_criar_tabela_papeis_livraria_gestao.sql
CREATE TABLE IF NOT EXISTS livraria_gestao.papeis (
    pap_id          SERIAL          PRIMARY KEY,
    pap_descricao   VARCHAR(30)     NOT NULL,
    pap_criado_em   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_papeis_descricao UNIQUE (pap_descricao)
);
```

### Migration 048: Adicionar escopo em admin_lojas
```sql
-- 048_adicionar_escopo_admin_lojas.sql
ALTER TABLE livraria_gestao.admin_lojas
ADD COLUMN adl_escopo VARCHAR(20) NOT NULL DEFAULT 'LOJA';

ALTER TABLE livraria_gestao.admin_lojas
ADD CONSTRAINT ck_admin_lojas_escopo_valido 
CHECK (adl_escopo IN ('SISTEMA', 'LOJA'));
```

### Migration 049: Criar papel admin_sistema
```sql
-- 049_criar_papel_admin_sistema.sql
INSERT INTO livraria_gestao.papeis (pap_descricao)
VALUES ('admin_sistema')
ON CONFLICT (pap_descricao) DO NOTHING;
```

### Migration 050: Seed multi-tenancy completo
```sql
-- 050_seed_multi_tenant_completo.sql
-- Cria:
-- - 3 lojas (Centro, Norte, Sul)
-- - 1 admin sistema
-- - 3 admins tenant (um por loja)
-- - 5 clientes
```

### Migration 051: Sincronizar papeis entre schemas
```sql
-- 051_sincronizar_papeis_schemas.sql
INSERT INTO livraria_gestao.papeis (pap_descricao, pap_criado_em)
SELECT pap_descricao, pap_criado_em
FROM livraria_comercial.papeis
ON CONFLICT (pap_descricao) DO NOTHING;
```

### Migration 052: Corrigir FK usuarios.papeis
```sql
-- 052_corrigir_fk_usuarios_papeis.sql
ALTER TABLE livraria_gestao.usuarios
DROP CONSTRAINT fk_usuarios_papeis;

UPDATE livraria_gestao.usuarios u
SET pap_id = g.pap_id
FROM livraria_gestao.papeis g, livraria_comercial.papeis c
WHERE u.pap_id = c.pap_id
AND c.pap_descricao = g.pap_descricao;

ALTER TABLE livraria_gestao.usuarios
ADD CONSTRAINT fk_usuarios_papeis
FOREIGN KEY (pap_id)
REFERENCES livraria_gestao.papeis(pap_id)
ON UPDATE CASCADE
ON DELETE RESTRICT;
```

### Migration 053: Adicionar FK usuario_papeis.papel
```sql
-- 053_adicionar_fk_usuario_papeis_papel.sql
ALTER TABLE livraria_gestao.usuario_papeis
ADD CONSTRAINT fk_usuario_papeis_papel
FOREIGN KEY (pap_id)
REFERENCES livraria_gestao.papeis(pap_id)
ON UPDATE CASCADE
ON DELETE RESTRICT;
```

---

## Frontend: Integração com Multi-Tenancy

### Auto-envio de Header x-loja-uuid

```typescript
// web/src/services/apiClient.ts
apiClient.interceptors.request.use((config) => {
  // Auto-envia x-loja-uuid do cookie para requisições admin
  const lojaUuid = Cookies.get('les_loja_uuid');
  if (lojaUuid && config.url?.includes('/admin/')) {
    config.headers['x-loja-uuid'] = lojaUuid;
  }
  return config;
});
```

### Redux AuthSlice

```typescript
// web/src/store/slices/authSlice.ts
interface AuthState {
  user: {
    uuid: string;
    nome: string;
    email: string;
    role: string;
    papeis: string[];
    lojas?: Array<{ loj_id: number; loj_uuid: string }>;
    loja_uuid_principal?: string;
  };
}

// Atualizado para receber novos campos do JWT
const loginResponse = await api.post('/auth/login', credentials);
dispatch(setUser({
  ...loginResponse.user,
  lojas: decodedToken.lojas,
  loja_uuid_principal: decodedToken.loja_uuid_principal
}));
```

### Hook useSeletorLoja

```typescript
// web/src/hooks/useSeletorLoja.ts
export function useSeletorLoja() {
  const { user } = useAppSelector(state => state.auth);
  const lojaAtual = Cookies.get('les_loja_uuid');
  
  const lojas = user?.lojas || [];
  
  const selecionarLoja = (lojaUuid: string) => {
    Cookies.set('les_loja_uuid', lojaUuid);
  };
  
  return {
    lojas,
    lojaAtual,
    selecionarLoja,
    isAdminSistema: user?.papeis?.includes('admin_sistema'),
  };
}
```

### Header: Ícone de Admin por Tipo

```typescript
// web/src/components/Header/index.tsx
{user?.papeis?.includes('admin') && (
  <AdminIcon 
    type={user?.papeis?.includes('admin_sistema') ? 'sistema' : 'tenant'}
  />
)}
```

---

## Testes de Integração

### Teste: Admin Sistema Criar Loja

```typescript
describe('POST /api/admin/lojas - Admin Sistema', () => {
  it('deve permitir criar loja como admin_sistema', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin_sistema@livraria.com.br',
        senha: 'SenhaForte@123'
      });

    const token = loginResponse.body.dados.token;

    const response = await request(app)
      .post('/api/admin/lojas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nome: 'Nova Loja',
        slug: 'nova-loja',
        cnpj: '12.345.678/0001-90'
      });

    expect(response.status).toBe(200);
    expect(response.body.sucesso).toBe(true);
  });
});
```

### Teste: Admin Tenant Não Pode Criar Loja

```typescript
describe('POST /api/admin/lojas - Admin Tenant', () => {
  it('deve negar criação de loja para admin tenant', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin_centro@livraria.com.br',
        senha: 'SenhaForte@123'
      });

    const token = loginResponse.body.dados.token;

    const response = await request(app)
      .post('/api/admin/lojas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nome: 'Loja Não Autorizada',
        slug: 'loja-nao-autorizada',
        cnpj: '12.345.678/0001-90'
      });

    expect(response.status).toBe(403);
    expect(response.body.mensagem).toContain('Administrador do Sistema');
  });
});
```

---

## Boas Práticas de Segurança

### 1. Nunca Expor IDs Internos
- ✅ Use UUIDs em APIs públicas
- ❌ Nunca exponha `loj_id`, `usu_id`, `pap_id` em respostas

### 2. Validação de Escopo em Duas Camadas
- **Middleware**: Validação inicial de permissões
- **Repositório**: Validação de escopo de dados (WHERE clauses)

### 3. Token JWT com IP e Fingerprint
```typescript
{
  ip: ipAddress,
  fingerprint: crypto.createHash('sha256').update(userAgent).digest('hex')
}
```

### 4. Cookies HttpOnly + Secure + SameSite=Strict
```typescript
res.cookie(nomeCookie, token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
});
```

---

## Troubleshooting

### Problema: "Acesso negado" para admin tenant
**Solução:** Verificar se header `x-loja-uuid` está sendo enviado e se o UUID está na lista de lojas do usuário.

### Problema: FK violation em usuario_papeis
**Solução:** Executar migrations 051, 052 e 053 para sincronizar papeis entre schemas.

### Problema: Token não contém lojas
**Solução:** Verificar se `buscarLojasDoUsuarioComUuids` está retornando dados corretamente.

---

## Referências

- [Multi-Tenancy: Usuários e Permissões](../../docs/contexto-negocio/multi-tenancy-usuarios-permissoes.md)
- [Middlewares de Autorização](../src/shared/middlewares/autorizacao.middleware.ts)
- [Contexto de Loja](../src/shared/middlewares/contextoLoja.middleware.ts)
- [Acesso a Produtos](../src/shared/middlewares/acessoProdutos.middleware.md)
- [Migrations SQL](../../sql/migrations/)
