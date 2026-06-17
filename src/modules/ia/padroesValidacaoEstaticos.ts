/**
 * Padrões estáticos de validação de segurança da IA.
 *
 * Servem como seed inicial da tabela padroes_validacao_ia e como
 * fallback quando o banco não está disponível.
 */

export const BLACKLIST_PADROES_ESTATICOS: readonly string[] = [
  // Comandos de sistema explícitos
  'sistema:',
  'administrador:',
  'admin:',
  'ignore todas as regras',
  'ignore regras',
  'desative segurança',
  'desative filtros',

  // Solicitações de produtos falsos/inventados
  'inventados',
  'falsos',
  'não existem',
  'nao existem',
  'produtos que não existem',
  'produtos que nao existem',
  'criar produtos',
  'inventar produtos',
  'gerar produtos',

  // Tentativas de manipulação de contexto
  'como administrador',
  'como admin',
  'como sistema',
  'modo administrador',
  'modo admin',
  'modo sistema',

  // Tentativas de bypass de segurança
  'bypass',
  'contornar',
  'evitar filtros',
  'ignorar validação',
  'ignorar validacao',

  // Injeção via histórico / roleplay adversarial
  'ignore filtros',
  'ignorar filtros',
  'modo irrestrito',
  'sem filtros',
  'sem restrições',
  'sem restricoes',
  'sem limitações',
  'sem limitacoes',
  'instrucao interna',
  'instrução interna',
  'system override',
  'system prompt',
  'prompt interno',
  'regras anteriores',
  'instruções anteriores',
  'instrucoes anteriores',
  'modo sem restrições',
  'modo sem restricoes',
  'responda qualquer',
  'responda tudo',
  'pode tudo',
  'sem bloqueios',
  'sem censura',
  'desative todas',
  'desative todos',
  'libere acesso',
  'acesso irrestrito',
  'acesso root',
  'acesso total',
  'dump_all',
  'dump all',
];

export const PADROES_IMPOSSIVEIS_ESTATICOS: readonly string[] = [
  // Solicitações de listagem completa
  'mostrar todos os livros do banco',
  'listar todos os produtos',
  'mostrar catálogo completo',
  'mostrar catalogo completo',
  'todos os livros',
  'toda a base',
  'base completa',

  // Habilidades sobrenaturais genéricas (bloqueios amplos)
  'aprender a voar',
  'voar sem',
  'respirar embaixo',
  'respirar debaixo',
  'invisibilidade',
  'ficar invisível',
  'ficar invisivel',
  'telepatia',
  'ler mentes',
  'telecinese',
  'mover objetos com a mente',
  'curar com as mãos',
  'cura milagrosa',
  'imortalidade',
  'viver para sempre',
  'parar o tempo',
  'congelar o tempo',
  'viajar no tempo',
  'voltar no tempo',
  'ir para o futuro',
  'ir para o passado',

  // Transformações impossíveis
  'transformar pedras em ouro',
  'transformar metal em ouro',
  'transformar em ouro',
  'transmutação',
  'transmutacao',
  'transformar gato em',
  'transformar animal em',
  'transformar pessoa em',
  'transformar em dragão',
  'transformar em monstro',
  'criar vida',
  'reviver mortos',
  'trazer de volta à vida',
  'trazer de volta a vida',
  'ressuscitar',

  // Construções impossíveis
  'construir nave espacial com papel',
  'construir nave espacial com cola',
  'construir avião de papel que voe',

  // Comunicação sobrenatural
  'conversar com fantasmas',
  'falar com fantasmas',
  'comunicar com mortos',
  'falar com mortos',
  'invocar espíritos',
  'invocar espiritos',

  // Habilidades mágicas genéricas
  'lançar feitiços',
  'lançar feiticos',
  'magia negra',
  'magia branca',
  'poderes mágicos',
  'poderes magicos',
  'bruxaria',
  'feitiçaria',
  'feiticaria',

  // Objetos fictícios
  'varinha mágica',
  'varinha magica',
  'poção mágica',
  'pocao magica',
  'anel do poder',
  'espada mágica',
  'espada magica',
  'pedra filosofal',

  // Ações biologicamente impossíveis
  'mudar de cor',
  'mudar de forma',
  'transformar-se em',
  'crescer asas',
  'ter olhos laser',
  'super força',
  'super forca',
  'velocidade supersônica',
  'velocidade supersonica',
];
