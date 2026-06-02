import { Logger } from '@/shared/utils/Logger.util';

/**
 * Resultado da validação de segurança
 */
export interface ResultadoValidacaoSeguranca {
  seguro: boolean;
  motivoRejeicao?: string;
  tipoRisco?: 'injecao_prompt' | 'solicitacao_impossivel' | 'comportamento_suspeito';
}

/**
 * Tabela de despacho para mensagens de rejeição por tipo de risco
 * Substitui switch/case conforme regra U2 (OCP - SOLID)
 */
const MENSAGENS_REJEICAO: Record<string, string> = {
  injecao_prompt: 'Não posso processar comandos de sistema. Posso ajudar a recomendar livros baseados em gênero, autor ou tema.',
  solicitacao_impossivel: 'Essa solicitação não é válida. Por favor, reformule com um gênero literário, autor ou tema específico.',
  comportamento_suspeito: 'Não entendi sua solicitação. Posso ajudar a encontrar livros reais em nosso catálogo.',
  default: 'Não posso atender essa solicitação. Posso ajudar a recomendar livros de nosso catálogo.',
};

/**
 * Frases e padrões que indicam tentativa de injeção de prompt ou solicitações impossíveis
 * Baseado em análise de vulnerabilidades documentadas em ANALISE-ALUCINACOES-AVANCADAS.md
 */
const BLACKLIST_PADROES = [
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
];

/**
 * Padrões que indicam solicitações impossíveis ou fora do escopo
 * Inclui solicitações fisicamente impossíveis, absurdas ou fora do domínio de livraria
 */
const PADROES_IMPOSSIVEIS = [
  // Solicitações de listagem completa (já existentes)
  'mostrar todos os livros do banco',
  'listar todos os produtos',
  'mostrar catálogo completo',
  'mostrar catalogo completo',
  'todos os livros',
  'toda a base',
  'base completa',
  
  // Solicitações fisicamente impossíveis (habilidades sobrenaturais)
  'aprender a voar',
  'voar sem avião',
  'voar sem equipamento',
  'respirar embaixo d\'água',
  'respirar embaixo dagua',
  'respirar debaixo d\'água',
  'respirar debaixo dagua',
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
  
  // Transformações impossíveis (alquimia/magia)
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
  
  // Construções impossíveis com materiais inadequados
  'construir nave espacial com papel',
  'construir nave espacial com cola',
  'construir avião de papel que voe',
  'construir casa de cartas que não caia',
  'construir ponte de palitos',
  
  // Comunicação com seres sobrenaturais
  'conversar com fantasmas',
  'falar com fantasmas',
  'comunicar com mortos',
  'falar com mortos',
  'invocar espíritos',
  'invocar espiritos',
  'contatar alienígenas',
  'contatar alienigenas',
  
  // Habilidades mágicas sobrenaturais
  'lançar feitiços',
  'lançar feiticos',
  'magia negra',
  'magia branca',
  'poderes mágicos',
  'poderes magicos',
  'bruxaria',
  'feitiçaria',
  'feiticaria',
  
  // Objetos impossíveis/fictícios
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

  // Contextos fisicamente impossíveis de leitura
  'enquanto estou nadando',
  'enquanto estou nado',
  'durante natação',
  'durante natacao',
  'enquanto nado',
  'enquanto estou pulando de paraquedas',
  'enquanto estou pulando paraquedas',
  'durante queda livre',
  'durante salto paraquedas',
  'enquanto estou correndo',
  'durante corrida',
  'enquanto estou dirigindo',
  'durante direção',
  'durante direcao',
  'enquanto estou pilotando',
  'durante voo',
  'enquanto estou voando',
  'durante escalada',
  'enquanto estou escalando',
  'durante surf',
  'enquanto estou surfando',
  'durante mergulho',
  'enquanto estou mergulhando',
  'durante combate',
  'enquanto estou lutando',
  'durante luta',
  'enquanto estou praticando esporte',
  'durante exercício',
  'durante exercicio',
  'enquanto estou treinando',
  'durante treino',
];

/**
 * Serviço de Validação de Segurança para IA
 * 
 * Responsável por detectar e bloquear:
 * - Injeção de prompt (prompt injection)
 * - Solicitações impossíveis (produtos inventados, comandos de sistema)
 * - Comportamentos suspeitos
 * 
 * Implementa mitigações documentadas em ANALISE-ALUCINACOES-AVANCADAS.md
 */
export class ServicoValidacaoSegurancaIA {
  /**
   * Valida se a entrada do usuário é segura para processamento pela IA
   * 
   * @param entrada - Texto de entrada do usuário (query ou mensagem de chat)
   * @returns Resultado da validação com detalhes se rejeitado
   */
  validarEntrada(entrada: string): ResultadoValidacaoSeguranca {
    const textoNormalizado = entrada.toLowerCase().trim();
    
    // 1. Verifica padrões de injeção de prompt
    const resultadoInjecao = ServicoValidacaoSegurancaIA.verificarInjecaoPrompt(textoNormalizado);
    if (!resultadoInjecao.seguro) {
      Logger.warn(`[ServicoValidacaoSegurancaIA] Injeção de prompt detectada: "${entrada}"`);
      return resultadoInjecao;
    }
    
    // 2. Verifica solicitações impossíveis
    const resultadoImpossivel = ServicoValidacaoSegurancaIA.verificarSolicitacaoImpossivel(textoNormalizado);
    if (!resultadoImpossivel.seguro) {
      Logger.warn(`[ServicoValidacaoSegurancaIA] Solicitação impossível detectada: "${entrada}"`);
      return resultadoImpossivel;
    }
    
    // 3. Verifica comportamentos suspeitos (combinações de palavras)
    const resultadoSuspeito = ServicoValidacaoSegurancaIA.verificarComportamentoSuspeito(textoNormalizado);
    if (!resultadoSuspeito.seguro) {
      Logger.warn(`[ServicoValidacaoSegurancaIA] Comportamento suspeito detectado: "${entrada}"`);
      return resultadoSuspeito;
    }
    
    return { seguro: true };
  }
  
  /**
   * Verifica se a entrada contém padrões de injeção de prompt usando early return
   */
  private static verificarInjecaoPrompt(texto: string): ResultadoValidacaoSeguranca {
    const padraoEncontrado = BLACKLIST_PADROES.find((padrao) => texto.includes(padrao));
    
    if (!padraoEncontrado) {
      return { seguro: true };
    }

    return {
      seguro: false,
      motivoRejeicao: `A solicitação contém padrão não permitido: "${padraoEncontrado}"`,
      tipoRisco: 'injecao_prompt',
    };
  }
  
  /**
   * Verifica se a entrada solicita algo impossível usando early return
   * Combina blacklist de padrões com análise semântica básica
   */
  private static verificarSolicitacaoImpossivel(texto: string): ResultadoValidacaoSeguranca {
    // 1. Verifica blacklist de padrões conhecidos
    const padraoEncontrado = PADROES_IMPOSSIVEIS.find((padrao) => texto.includes(padrao));
    
    if (padraoEncontrado) {
      return {
        seguro: false,
        motivoRejeicao: MENSAGENS_REJEICAO.solicitacao_impossivel,
        tipoRisco: 'solicitacao_impossivel',
      };
    }

    // 2. Análise semântica básica: combinações suspeitas de verbo + objeto
    const resultadoSemantico = ServicoValidacaoSegurancaIA.verificarCombinacaoImpossivel(texto);
    if (!resultadoSemantico.seguro) {
      return resultadoSemantico;
    }

    return { seguro: true };
  }

  /**
   * Verifica combinações de verbo + objeto que indicam solicitações impossíveis
   * Usa análise básica de padrões linguísticos
   */
  private static verificarCombinacaoImpossivel(texto: string): ResultadoValidacaoSeguranca {
    // Verbos que indicam aprendizado/aquisição de habilidades
    const verbosAprendizado = ['aprender', 'ensinar', 'como', 'método', 'técnica', 'tecnica'];
    
    // Objetos que indicam habilidades sobrenaturais ou impossíveis
    const objetosImpossiveis = [
      'voar', 'voo', 'voar sem', 'invisibilidade', 'telepatia', 'telecinese',
      'levitação', 'levitacao', 'magia', 'feitico', 'feitico', 'poder',
      'super força', 'super forca', 'super velocidade', 'super velocidade',
      'imortalidade', 'vida eterna', 'parar tempo', 'congelar tempo',
      'viajar tempo', 'voltar tempo', 'ler mentes', 'prever futuro',
      'curar com', 'milagre', 'milagrosa', 'milagroso'
    ];

    // Verifica se há verbo de aprendizado combinado com objeto impossível
    const temVerboAprendizado = verbosAprendizado.some(v => texto.includes(v));
    const temObjetoImpossivel = objetosImpossiveis.some(o => texto.includes(o));

    if (temVerboAprendizado && temObjetoImpossivel) {
      return {
        seguro: false,
        motivoRejeicao: MENSAGENS_REJEICAO.solicitacao_impossivel,
        tipoRisco: 'solicitacao_impossivel',
      };
    }

    // Verbos de transformação + objetos biologicamente impossíveis
    const verbosTransformacao = ['transformar', 'converter', 'mudar', 'virar', 'tornar'];
    const objetosTransformacaoImpossivel = [
      'gato em', 'animal em', 'pessoa em', 'dragão', 'dragao', 'monstro',
      'pedra em', 'metal em', 'ouro', 'vida', 'morto', 'cadáver', 'cadaver'
    ];

    const temVerboTransformacao = verbosTransformacao.some(v => texto.includes(v));
    const temObjetoTransformacaoImpossivel = objetosTransformacaoImpossivel.some(o => texto.includes(o));

    if (temVerboTransformacao && temObjetoTransformacaoImpossivel) {
      return {
        seguro: false,
        motivoRejeicao: MENSAGENS_REJEICAO.solicitacao_impossivel,
        tipoRisco: 'solicitacao_impossivel',
      };
    }

    // Verbos de construção + materiais inadequados
    const verbosConstrucao = ['construir', 'fazer', 'criar', 'montar', 'fabricar'];
    const materiaisInadequados = [
      'com papel', 'com cola', 'de papel que', 'de cartas', 'de palitos',
      'com papelão', 'com papelao', 'de isopor'
    ];
    const objetosComplexos = ['nave espacial', 'avião', 'aviao', 'foguete', 'carro', 'casa'];

    const temVerboConstrucao = verbosConstrucao.some(v => texto.includes(v));
    const temMaterialInadequado = materiaisInadequados.some(m => texto.includes(m));
    const temObjetoComplexo = objetosComplexos.some(o => texto.includes(o));

    if (temVerboConstrucao && temMaterialInadequado && temObjetoComplexo) {
      return {
        seguro: false,
        motivoRejeicao: MENSAGENS_REJEICAO.solicitacao_impossivel,
        tipoRisco: 'solicitacao_impossivel',
      };
    }

    return { seguro: true };
  }
  
  /**
   * Verifica combinações de palavras que indicam comportamento suspeito usando early return
   */
  private static verificarComportamentoSuspeito(texto: string): ResultadoValidacaoSeguranca {
    const palavrasComando = ['mostrar', 'listar', 'exibir', 'ver', 'buscar'];
    const termosSuspeitos = ['inventados', 'falsos', 'teste', 'hack', 'exploit'];
    
    const temComando = palavrasComando.some((p) => texto.includes(p));
    const temSuspeito = termosSuspeitos.some((t) => texto.includes(t));
    
    if (!(temComando && temSuspeito)) {
      return { seguro: true };
    }

    return {
      seguro: false,
      motivoRejeicao: 'A solicitação parece tentar acessar funcionalidades não disponíveis. Posso ajudar a encontrar livros reais em nosso catálogo.',
      tipoRisco: 'comportamento_suspeito',
    };
  }
  
  /**
   * Gera mensagem de resposta padrão para entradas rejeitadas
   * Usa tabela de despacho em vez de switch/case (regra U2)
   */
  static gerarMensagemRejeicao(resultado: ResultadoValidacaoSeguranca): string {
    if (resultado.seguro) {
      throw new Error('Não é possível gerar mensagem de rejeição para entrada segura');
    }

    const tipoRisco = resultado.tipoRisco || 'default';
    
    if (tipoRisco === 'solicitacao_impossivel' || tipoRisco === 'comportamento_suspeito') {
      return resultado.motivoRejeicao || MENSAGENS_REJEICAO[tipoRisco];
    }

    return MENSAGENS_REJEICAO[tipoRisco] || MENSAGENS_REJEICAO.default;
  }
}
