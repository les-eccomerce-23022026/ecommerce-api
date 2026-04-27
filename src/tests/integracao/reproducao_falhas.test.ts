import request from 'supertest';
import { configurarTesteIntegracao } from '@/tests/utils/setup-integracao.util';
import { di } from '@/shared/infrastructure/di.container';

describe('TDD - Validação de Correções (Infra e Rotas)', () => {
  const contexto = configurarTesteIntegracao();

  it('RN0090 - Deve acessar tabela usuarios sem schema explicitamente definido (via search_path)', async () => {
    const query = 'SELECT count(*) FROM usuarios';
    const { db } = di as unknown as { db: { executar: (sql: string) => Promise<unknown[]> } }; 
    
    // Agora deve funcionar sem lançar erro de schema
    const resultado = await db.executar(query);
    expect(resultado).toBeDefined();
    expect(Array.isArray(resultado)).toBe(true);
  });

  it('Alternativa 3 - Deve retornar 404 para rota inexistente em vez de 500 por erro de sintaxe UUID', async () => {
    // Como a rota /livros/:uuid agora tem regex, 'catalogo' não casa mais nela.
    // Como /api/livros/catalogo não existe, o Express deve retornar 404.
    const resposta = await request(contexto.app).get('/api/livros/catalogo');
    
    expect(resposta.status).toBe(404);
    // Se fosse capturado, seria 500. 404 prova que a "blindagem" funcionou.
  });
});
