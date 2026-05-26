export const USUARIO_QUERIES = {
  SELECT_BASE: `
    SELECT u.usu_id AS "id", u.usu_uuid AS "uuid", u.usu_nome AS "nome", 
           u.usu_email AS "email", u.usu_cpf AS "cpf", u.usu_cnpj AS "cnpj", u.usu_tipo_pessoa AS "tipoPessoa",
           u.usu_senha_hash AS "senhaHash", 
           u.pap_id AS "idPapel", u.usu_telefone_rapido AS "telefoneRapido", 
           u.usu_ativo AS "ativo",
           u.usu_genero AS "genero", u.usu_data_nascimento AS "dataNascimento",
           u.usu_criado_em AS "criadoEm", u.usu_atualizado_em AS "atualizadoEm"
    FROM livraria_gestao.usuarios u
 `,
  SELECT_PAPEIS_USUARIO: `
    SELECT p.pap_id AS "id", p.pap_descricao AS "descricao"
    FROM livraria_gestao.papeis p
    INNER JOIN livraria_gestao.usuario_papeis up ON p.pap_id = up.pap_id
    WHERE up.usu_id = $1 AND up.usp_ativo = TRUE
  `,
  INSERT_USUARIO_PAPEL: `
    INSERT INTO livraria_gestao.usuario_papeis (usu_id, pap_id, usp_ativo)
    VALUES ($1, $2, TRUE)
    ON CONFLICT (usu_id, pap_id) DO UPDATE SET usp_ativo = TRUE
  `,
  REMOVER_USUARIO_PAPEL: `
    UPDATE livraria_gestao.usuario_papeis
    SET usp_ativo = FALSE, usp_atualizado_em = NOW()
    WHERE usu_id = $1 AND pap_id = $2
  `,
  DELETAR_USUARIO_PAPEL: `
    DELETE FROM livraria_gestao.usuario_papeis
    WHERE usu_id = $1 AND pap_id = $2
  `,
  INSERT: `
    INSERT INTO livraria_gestao.usuarios (usu_nome, usu_email, usu_cpf, usu_cnpj, usu_tipo_pessoa, usu_senha_hash, pap_id, loj_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING usu_id AS "id", usu_uuid AS "uuid", usu_nome AS "nome", 
              usu_email AS "email", usu_cpf AS "cpf", usu_cnpj AS "cnpj", usu_tipo_pessoa AS "tipoPessoa",
              usu_senha_hash AS "senhaHash", 
              pap_id AS "idPapel", usu_telefone_rapido AS "telefoneRapido", 
              usu_ativo AS "ativo",
              usu_criado_em AS "criadoEm", usu_atualizado_em AS "atualizadoEm"
  `,
  SELECT_USUARIOS_POR_PAPEL: `
    SELECT u.usu_id AS "id", u.usu_uuid AS "uuid", u.usu_nome AS "nome", 
           u.usu_email AS "email", u.usu_cpf AS "cpf", u.usu_cnpj AS "cnpj", u.usu_tipo_pessoa AS "tipoPessoa",
           u.usu_senha_hash AS "senhaHash", 
           u.pap_id AS "idPapel", u.usu_telefone_rapido AS "telefoneRapido", 
           u.usu_ativo AS "ativo",
           u.usu_genero AS "genero", u.usu_data_nascimento AS "dataNascimento",
           u.usu_criado_em AS "criadoEm", u.usu_atualizado_em AS "atualizadoEm",
           p.pap_descricao AS "papelDescricao"
    FROM livraria_gestao.usuarios u
    JOIN livraria_gestao.papeis p ON u.pap_id = p.pap_id
    INNER JOIN livraria_gestao.usuario_papeis up ON u.usu_id = up.usu_id
    WHERE up.pap_id = $1 AND up.usp_ativo = TRUE
 `,
  DELETE_BY_CPF: 'DELETE FROM livraria_gestao.usuarios WHERE usu_cpf = $1',
  DELETE_BY_EMAIL: 'DELETE FROM livraria_gestao.usuarios WHERE usu_email = $1',
  SELECT_ID_BY_CPF: 'SELECT usu_id FROM livraria_gestao.usuarios WHERE usu_cpf = $1',
  DELETE_CASCADE: {
    ITENS_VENDA: 'DELETE FROM livraria_comercial.itens_venda WHERE ven_id IN (SELECT ven_id FROM livraria_comercial.vendas WHERE usu_id = $1)',
    VENDAS: 'DELETE FROM livraria_comercial.vendas WHERE usu_id = $1',
    CARTOES: 'DELETE FROM livraria_financeiro.cartoes WHERE usu_id = $1',
    TELEFONES: 'DELETE FROM livraria_gestao.telefones WHERE usu_id = $1',
    ENDERECOS: 'DELETE FROM livraria_gestao.enderecos WHERE usu_id = $1',
    CLIENTES: 'DELETE FROM livraria_gestao.clientes WHERE usu_id = $1',
    USUARIOS: 'DELETE FROM livraria_gestao.usuarios WHERE usu_id = $1',
  },
  SELECT_CONFIG: 'SELECT cfg_valor FROM livraria_gestao.configuracoes_app WHERE cfg_chave = $1',
};
