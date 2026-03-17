# Cenários BDD – Clientes (Atualizar Perfil) – Sucesso

## Endpoints

- `PATCH /api/clientes/perfil` (Atualizar dados e opcionalmente sincronizar endereços)
- `POST /api/clientes/perfil/enderecos` (Adicionar endereço individual)
- `PATCH /api/clientes/perfil/enderecos/:uuid` (Editar endereço individual)
- `DELETE /api/clientes/perfil/enderecos/:uuid` (Remover endereço individual)
- `POST /api/clientes/perfil/cartoes` (Adicionar cartão)
- `DELETE /api/clientes/perfil/cartoes/:uuid` (Remover cartão)

---

## Cenários de sucesso

### Atualização com dados válidos (PATCH)

- **Dado** um cliente autenticado com token JWT válido
- **E** os dados fornecidos no corpo da requisição são válidos (nome, gênero, data_nascimento, telefone)
- **Quando** é enviado `PATCH /api/clientes/perfil`
- **Então** a resposta tem status `200`
- **E** o corpo é JSON com `sucesso: true` e os dados atualizados
- **E** os dados sensíveis (CPF, Telefone) retornam mascarados para proteção de privacidade (RNF0059)

### Atualização Segura de Dados Críticos (RN0078)

- **Dado** um cliente autenticado
- **E** o corpo contém alteração de e-mail, CPF ou Telefone
- **E** o campo `senhaConfirmacao` contém a senha atual correta do usuário
- **Quando** é enviado `PATCH /api/clientes/perfil`
- **Então** a resposta tem status `200`
- **E** os dados críticos são atualizados com sucesso no banco de dados

### Adição de Novo Endereço (POST)

- **Dado** um cliente autenticado
- **E** um novo objeto de endereço válido (incluindo apelido, tipo residência, etc)
- **Quando** é enviado `POST /api/clientes/perfil/enderecos`
- **Então** a resposta tem status `201`
- **E** o novo endereço é vinculado ao cliente no banco de dados

### Remoção de Endereço com Confirmação (RN0079)

- **Dado** um cliente autenticado na interface de perfil
- **Quando** solicita a remoção de um endereço e confirma no modal
- **E** a requisição `DELETE /api/clientes/perfil/enderecos/:uuid` é enviada
- **Então** a resposta tem status `200`
- **E** o endereço é removido do perfil

### Obtenção de Perfil Unificado Mascarado (RN0077 / RNF0059)

- **Dado** um cliente autenticado
- **Quando** é enviado `GET /api/clientes/perfil`
- **Então** a resposta tem status `200`
- **E** o corpo contém `dados` com as listas de `enderecos` e `cartoes` agregadas
- **E** o `cpfMascarado`, `emailMascarado` e `telefone.numeroMascarado` são retornados ao invés dos valores puros
