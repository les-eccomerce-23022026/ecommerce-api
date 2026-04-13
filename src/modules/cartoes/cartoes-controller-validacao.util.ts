import type { ICriarCartaoDto } from '@/modules/cartoes/cartoes.service';

export function listarCamposObrigatoriosCartaoFaltantes(dados: ICriarCartaoDto): string[] {
  const { uuidBandeira, token, ultimosDigitosCartao, nomeImpresso, validade } = dados;
  const faltando: string[] = [];
  if (!uuidBandeira) faltando.push('uuidBandeira');
  if (!token) faltando.push('token');
  if (!ultimosDigitosCartao) faltando.push('ultimosDigitosCartao');
  if (!nomeImpresso) faltando.push('nomeImpresso');
  if (!validade) faltando.push('validade');
  return faltando;
}
