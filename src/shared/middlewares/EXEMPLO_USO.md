# Exemplo de Uso do Middleware de Autorização por Loja

## Proteção de Rota Individual

```typescript
import express from 'express';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { contextoLojaMiddleware } from '@/shared/middlewares/contextoLoja.middleware';
import { autorizacaoLojaMiddleware } from '@/shared/middlewares/autorizacaoLoja.middleware';
import { controladorListarProdutos } from '@/modules/produtos/controlador';

const router = express.Router();

// Rota protegida: autenticação → contexto → autorização
router.get(
  '/lojas/:lojaId/produtos',
  autenticacaoMiddleware,      // 1. Autentica usuário (valida JWT)
  contextoLojaMiddleware,      // 2. Define loj_id no contexto
  autorizacaoLojaMiddleware,   // 3. Valida acesso à loja
  controladorListarProdutos    // 4. Controlador da rota
);

export default router;
```

## Proteção de Múltiplas Rotas

```typescript
import express from 'express';
import { autenticacaoMiddleware } from '@/shared/middlewares/autenticacao.middleware';
import { contextoLojaMiddleware } from '@/shared/middlewares/contextoLoja.middleware';
import { autorizacaoLojaMiddleware } from '@/shared/middlewares/autorizacaoLoja.middleware';

const rotasAdminLoja = express.Router();

// Aplicar middlewares a todas as rotas do grupo
rotasAdminLoja.use(autenticacaoMiddleware);
rotasAdminLoja.use(contextoLojaMiddleware);
rotasAdminLoja.use(autorizacaoLojaMiddleware);

// Todas as rotas abaixo estarão protegidas
rotasAdminLoja.get('/produtos', controladorListarProdutos);
rotasAdminLoja.post('/produtos', controladorCriarProduto);
rotasAdminLoja.put('/produtos/:id', controladorAtualizarProduto);
rotasAdminLoja.delete('/produtos/:id', controladorDeletarProduto);

export default rotasAdminLoja;
```

## Fluxo de Requisição

```
Cliente faz requisição:
  GET /api/lojas/123/produtos
  Headers: {
    Authorization: "Bearer eyJhbGc...",
    x-loja-uuid: "550e8400-e29b-41d4-a716-446655440000"
  }
       │
       ▼
autenticacaoMiddleware
  ├─ Extrai JWT do header Authorization
  ├─ Valida assinatura do JWT
  ├─ Busca usuário no banco
  ├─ Valida IP e fingerprint
  ├─ Define req.usuario com dados do JWT
  ├─ Define contexto com usu_id e loj_id
  └─ Chama next()
       │
       ▼
contextoLojaMiddleware
  ├─ Lê header x-loja-uuid
  ├─ Converte UUID para loj_id interno
  ├─ Atualiza contexto com loj_id
  └─ Chama next()
       │
       ▼
autorizacaoLojaMiddleware
  ├─ Obtém usu_id e loj_id do contexto
  ├─ Consulta tabela admin_lojas
  ├─ Valida escopo (SISTEMA ou LOJA)
  ├─ Se autorizado: chama next()
  └─ Se negado: retorna 403
       │
       ▼
Controlador (se autorizado)
  └─ Processa a requisição
```

## Tratamento de Erros no Cliente

```typescript
// Cliente JavaScript/TypeScript
async function listarProdutos(lojaUuid: string) {
  try {
    const resposta = await fetch('/api/lojas/produtos', {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-loja-uuid': lojaUuid,
      },
    });

    if (resposta.status === 401) {
      // Usuário não autenticado
      console.error('Faça login novamente');
      // Redirecionar para login
    }

    if (resposta.status === 403) {
      // Usuário não tem acesso à loja
      console.error('Você não tem permissão para acessar esta loja');
      // Mostrar mensagem de erro
    }

    if (resposta.status === 400) {
      // Loja não selecionada
      console.error('Selecione uma loja');
    }

    if (resposta.ok) {
      const dados = await resposta.json();
      console.log('Produtos:', dados);
    }
  } catch (erro) {
    console.error('Erro ao buscar produtos:', erro);
  }
}
```

## Testando o Middleware

### Com cURL

```bash
# 1. Fazer login para obter token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@livraria.com","senha":"senha123"}'

# Resposta: { token: "eyJhbGc..." }

# 2. Usar token para acessar rota protegida
TOKEN="eyJhbGc..."
LOJA_UUID="550e8400-e29b-41d4-a716-446655440000"

curl -X GET http://localhost:3000/api/lojas/produtos \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-loja-uuid: $LOJA_UUID"

# Resposta esperada (se autorizado):
# { "sucesso": true, "dados": [...] }

# Resposta esperada (se não autorizado):
# { "sucesso": false, "mensagem": "Você não tem permissão para acessar esta loja." }
```

### Com Postman

1. **Criar requisição GET** para `http://localhost:3000/api/lojas/produtos`
2. **Aba Headers**:
   - `Authorization`: `Bearer <seu-token-jwt>`
   - `x-loja-uuid`: `<uuid-da-loja>`
3. **Enviar requisição**
4. **Verificar resposta**:
   - 200: Acesso autorizado
   - 401: Token inválido ou expirado
   - 403: Sem permissão para acessar a loja
   - 400: Loja não selecionada

## Casos de Uso Reais

### Admin de SISTEMA
```typescript
// Admin com escopo SISTEMA pode acessar qualquer loja
const admin = {
  usu_id: 100,
  email: 'super-admin@livraria.com',
  escopo: 'SISTEMA', // Acesso global
};

// Pode fazer requisições para qualquer loja
GET /api/lojas/1/produtos    // ✅ Autorizado
GET /api/lojas/2/produtos    // ✅ Autorizado
GET /api/lojas/999/produtos  // ✅ Autorizado
```

### Admin de LOJA
```typescript
// Admin com escopo LOJA só pode acessar lojas associadas
const admin = {
  usu_id: 101,
  email: 'admin-loja1@livraria.com',
  escopo: 'LOJA',
  lojas_associadas: [1, 2], // Associado apenas às lojas 1 e 2
};

// Pode fazer requisições apenas para lojas associadas
GET /api/lojas/1/produtos    // ✅ Autorizado (associado)
GET /api/lojas/2/produtos    // ✅ Autorizado (associado)
GET /api/lojas/3/produtos    // ❌ Negado (não associado)
```

## Integração com Sistema de Permissões

O middleware de autorização por loja é o **primeiro nível** de proteção. Para controle mais granular, combine com outros middlewares:

```typescript
import { adminOnlyMiddleware } from '@/shared/middlewares/autorizacao.middleware';

router.post(
  '/lojas/:lojaId/produtos',
  autenticacaoMiddleware,      // Autentica
  contextoLojaMiddleware,      // Define loja
  autorizacaoLojaMiddleware,   // Valida acesso à loja
  adminOnlyMiddleware,         // Valida papel de admin
  controladorCriarProduto      // Controlador
);
```

Neste exemplo:
1. Usuário deve estar autenticado
2. Usuário deve ter acesso à loja
3. Usuário deve ter papel de admin
4. Só então pode criar produto
