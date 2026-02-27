# Registro de mudanças

Todas as alterações, inclusões e exclusões do projeto são listadas aqui, enumeradas e identificadas por data e hora no formato `[AAAAMMDD-HHMMSS]`. A entrada mais recente fica no topo.

---

[20260227-000700] 27. Criação das interfaces de repositório IRepositorioPerfilCliente, IRepositorioTelefoneUsuario e IRepositorioEnderecoUsuario com contratos CRUD preparados para Postgres.
[20260227-000600] 26. Criação das entidades IPerfilCliente, ITelefoneUsuario e IEnderecoUsuario alinhadas com as tabelas SQL ecm_perfil_cliente, ecm_telefone_usuario e ecm_endereco_usuario.
[20260227-000500] 25. Criação da entidade IPapelUsuario e constantes PAPEL_CLIENTE/PAPEL_ADMIN para representar papéis como objetos em vez de strings.
[20260227-000400] 24. Atualização da entidade IUsuario: adição do campo id (BIGSERIAL interno) e mudança de role para objeto IPapelUsuario em vez de string.
[20260227-000300] 23. Ajustes nos serviços (admin, clientes, auth) e repositório de usuários para usar objetos de papel e gerar id interno automaticamente.
[20260227-000300] 22. Criação do diagrama ER completo em PlantUML (schema_ecm.puml) mostrando todas as 14 tabelas com relacionamentos, chaves primárias, estrangeiras e restrições de unicidade.
[20260227-000200] 21. Atualização do DDL 005: removidas colunas textuais (nom_bairro, nom_cidade, nom_pais, num_cep, dsc_logradouro, num_logradouro, id_tipo_logradouro) e adicionadas FKs para tabelas normalizadas (id_logradouro, id_cidade, id_bairro, id_cep, id_pais) para maior normalização.
[20260227-000100] 20. Criação do DDL 007: tabelas de normalização extra (ecm_pais, ecm_cep, ecm_logradouro) para maior rigor na eliminação de redundância em endereços.
[20260227-000000] 19. Alteração do prefixo das tabelas de 'les_' para 'ecm_' em todos os scripts SQL (DDL, DML, migrations), docker-compose.yml e documentação para refletir as iniciais do sistema E-Commerce de Livros.
[20260226-235900] 18. Criação do sql/README.md com convenção de nomenclatura trigrama, ER textual e instruções de execução dos scripts.
[20260226-235800] 17. Criação do DML 002: seed do usuário administrador inicial com hash bcrypt (sem senha em texto plano).
[20260226-235700] 16. Criação do DML 001: seeds idempotentes das tabelas de referência (papéis, tipos de telefone, logradouro, residência e estados brasileiros).
[20260226-235600] 15. Criação do DDL 005: tabela les_endereco_usuario (N:1 com usuario, FKs para tipo_logradouro, tipo_residencia e estado_brasileiro).
[20260226-235500] 14. Criação do DDL 004: tabela les_telefone_usuario (N:1 com usuario, FK para tipo_telefone, constraint de único principal por usuario).
[20260226-235400] 13. Criação do DDL 003: tabela les_perfil_cliente (extensão 1:1 do usuario para atributos exclusivos de cliente).
[20260226-235300] 12. Criação do DDL 002: tabela les_usuario com id interno (BIGSERIAL), uuid público, trigger de dat_atualizacao automática e índices de busca.
[20260226-235200] 11. Criação do DDL 001: tabelas de referência normalizadas (les_papel_usuario, les_tipo_telefone, les_tipo_logradouro, les_tipo_residencia, les_estado_brasileiro).
[20260226-235100] 10. Criação do diretório sql/ (ddl/ e dml/) para administração da modelagem de dados do banco PostgreSQL.

[20260226-231500] 9. Implementação da RF0023 - Inativação de cadastro (soft delete).
[20260226-231000] 8. Implementação da RF0028 - Rota de alteração de senha.
[20260226-230000] 7. Implementação da RF0022 - Atualização de dados do cliente.
[20260226-225500] 6. Renomeação de arquivos de interfaces e prefixação de tipos com 'I' conforme convenção.
[20260226-113500] 5. Inclusão dos middlewares de autenticação (JWT) e autorização (admin only).
[20260226-112000] 4. Sincronização de tarefas (cards) do GitHub Projects #2 para o arquivo TASKS.md.

---

