import { execSync } from 'child_process';
import path from 'path';

/**
 * Auditoria de condicionais LES (U1 e U2)
 * Este teste automatiza a auditoria de 'else' no front e 'switch' no back.
 * Seguindo o plano em planos/a_fazer/auditoria_if_else_les.md
 */
describe('Auditoria de Condicionais (LES SSoT)', () => {
  const rootDir = path.resolve(__dirname, '../../../');
  const webSrc = path.join(rootDir, 'web/src');
  const backendSrc = path.join(rootDir, 'backend/src');

  describe('Frontend (web/src)', () => {
    it('NÃO deve conter "else" ou "else if" (Regra U1)', () => {
      try {
        // Usando grep para encontrar ocorrências, ignorando arquivos de teste
        const command = `grep -rE "\\belse(\\s+if)?\\b" "${webSrc}" --exclude-dir=test --exclude=*.test.ts --exclude=*.spec.ts --exclude=*.cy.ts || true`;
        const output = execSync(command).toString().trim();
        
        if (output) {
          console.log('Violações U1 encontradas no Frontend:\n', output);
          // Falha o teste se houver saída (ocorrências de else)
          throw new Error(`Regra U1 violada: 'else' encontrado no frontend.\n${output}`);
        }
      } catch (error: any) {
        if (error.message.includes('Regra U1 violada')) {
          throw error;
        }
        // Se o grep falhar por outros motivos (ex: pasta não existe), o teste falha
        throw new Error(`Falha ao executar auditoria no frontend: ${error.message}`);
      }
    });
  });

  describe('Backend (backend/src)', () => {
    it('NÃO deve conter "switch/case" (Regra U2)', () => {
      try {
        const command = `grep -r "\\bswitch\\s*(" "${backendSrc}" --exclude-dir=tests --exclude=*.test.ts --exclude=*.spec.ts || true`;
        const output = execSync(command).toString().trim();
        
        if (output) {
          console.log('Violações U2 encontradas no Backend:\n', output);
          throw new Error(`Regra U2 violada: 'switch' encontrado no backend.\n${output}`);
        }
      } catch (error: any) {
        if (error.message.includes('Regra U2 violada')) {
          throw error;
        }
        throw new Error(`Falha ao executar auditoria no backend: ${error.message}`);
      }
    });

    it('Deve preferir Early Returns em vez de aninhamento (Best Practice §2)', () => {
      // Esta parte é mais difícil de automatizar com grep simples, 
      // mas podemos buscar por else no backend para revisar se podem ser early returns.
      try {
        const command = `grep -r "\\belse\\b" "${backendSrc}" --exclude-dir=tests --exclude=*.test.ts --exclude=*.spec.ts || true`;
        const output = execSync(command).toString().trim();
        
        if (output) {
          console.warn('Sugestões de revisão de Early Return no Backend:\n', output);
          // Não falha necessariamente o teste a menos que queiramos ser rígidos, 
          // mas o plano diz "exclusões SQL/testes" e "coding-style §2".
        }
      } catch (error) {
        // ignora erros de busca
      }
    });
  });
});
