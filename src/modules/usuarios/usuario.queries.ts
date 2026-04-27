export const USUARIO_QUERIES = {
  SELECT_BASE: `
    SELECT u.usu_id AS "id", u.usu_uuid AS "uuid", u.usu_nome AS "nome", 
           u.usu_email AS "email", u.usu_cpf AS "cpf", u.usu_senha_hash AS "senhaHash", 
           u.pap_id AS "idPapel", u.usu_telefone_rapido AS "telefoneRapido", 
           u.usu_ativo AS "ativo", u.usu_is_admin_mestre AS "isAdminMestre",
           u.usu_genero AS "genero", u.usu_data_nascimento AS "dataNascimento",
           u.usu_criado_em AS "criadoEm", u.usu_atualizado_em AS "atualizadoEm",
           p.pap_descricao AS "papelDescricao"
    FROM usuarios u
    JOIN papeis p ON u.pap_id = p.pap_id
  `,
  INSERT: `
    INSERT INTO usuarios (usu_nome, usu_email, usu_cpf, usu_senha_hash, pap_id, usu_is_admin_mestre)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING usu_id AS "id", usu_uuid AS "uuid", usu_nome AS "nome", 
              usu_email AS "email", usu_cpf AS "cpf", usu_senha_hash AS "senhaHash", 
              pap_id AS "idPapel", usu_telefone_rapido AS "telefoneRapido", 
              usu_ativo AS "ativo", usu_is_admin_mestre AS "isAdminMestre",
              usu_criado_em AS "criadoEm", usu_atualizado_em AS "atualizadoEm"
  `,
  DELETE_BY_CPF: 'DELETE FROM usuarios WHERE usu_cpf = $1',
  DELETE_BY_EMAIL: 'DELETE FROM usuarios WHERE usu_email = $1',
  SELECT_ID_BY_CPF: 'SELECT usu_id FROM usuarios WHERE usu_cpf = $1',
  DELETE_CASCADE: {
    ITENS_VENDA: 'DELETE FROM itens_venda WHERE ven_id IN (SELECT ven_id FROM vendas WHERE usu_id = $1)',
    VENDAS: 'DELETE FROM vendas WHERE usu_id = $1',
    CARTOES: 'DELETE FROM cartoes WHERE usu_id = $1',
    TELEFONES: 'DELETE FROM telefones WHERE usu_id = $1',
    ENDERECOS: 'DELETE FROM enderecos WHERE usu_id = $1',
    CLIENTES: 'DELETE FROM clientes WHERE usu_id = $1',
    USUARIOS: 'DELETE FROM usuarios WHERE usu_id = $1',
  },
  SELECT_CONFIG: 'SELECT cfg_valor FROM configuracoes_app WHERE cfg_chave = $1',
};
