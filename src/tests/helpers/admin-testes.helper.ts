import request from 'supertest';
import { Application } from 'express';
import { realizarLogin } from '@/tests/helpers/requisicoes-api.util';
import { validarCpf } from '@/shared/utils/validacao-cpf.util';

const SENHA_ADMIN_COMUM = 'SenhaAdminComum@123';

/** Gera CPF válido (dígitos verificadores) para testes de integração sem colisão. */
function gerarCpfValidoUnico(): string {
  for (let tentativa = 0; tentativa < 20; tentativa += 1) {
    const base = String(Math.floor(100000000 + Math.random() * 899999999));
    const calcDigito = (numeros: string, tamanho: number): number => {
      let soma = 0;
      for (let i = 0; i < tamanho; i += 1) {
        soma += parseInt(numeros.charAt(i), 10) * (tamanho + 1 - i);
      }
      const resto = 11 - (soma % 11);
      return resto === 10 || resto === 11 ? 0 : resto;
    };
    const d1 = calcDigito(base, 9);
    const d2 = calcDigito(`${base}${d1}`, 10);
    const numeros = `${base}${d1}${d2}`;
    const cpfFormatado = numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    if (validarCpf(cpfFormatado)) {
      return cpfFormatado;
    }
  }
  return '529.982.247-25';
}

/**
 * Cria um administrador não-mestre via API (token do mestre) e retorna token + e-mail.
 * CPF é variado para evitar colisão quando vários admins são criados na mesma suíte.
 */
export async function criarAdminComumObterToken(
  app: Application,
  tokenMestre: string,
): Promise<{ token: string; email: string }> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const email = `admin.comum.${id}@test.integracao.local`;
  const cpf = gerarCpfValidoUnico();

  const res = await request(app)
    .post('/api/admin/registro')
    .set('Authorization', `Bearer ${tokenMestre}`)
    .send({
      nome: 'Admin Comum Integração',
      email,
      cpf,
      senha: SENHA_ADMIN_COMUM,
      confirmacaoSenha: SENHA_ADMIN_COMUM,
    });

  if (res.status !== 201) {
    throw new Error(`Falha ao criar admin comum: ${res.status} ${JSON.stringify(res.body)}`);
  }

  const login = await realizarLogin(app, email, SENHA_ADMIN_COMUM);
  if (login.status !== 200 || !login.body?.dados?.token) {
    throw new Error(`Login admin comum falhou: ${login.status}`);
  }

  return { token: login.body.dados.token as string, email };
}
