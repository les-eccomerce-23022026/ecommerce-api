# Cenários BDD – Clientes (Atualizar Perfil) – Sucesso

## Endpoints

- `PATCH /api/clientes/perfil` (Atualizar dados e opcionalmente sincronizar endereços)
- `POST /api/clientes/perfil/enderecos` (Adicionar endereço individual)
- `DELETE /api/clientes/perfil/enderecos/:uuid` (Remover endereço individual)

---

## Cenários de sucesso

### Atualização com dados válidos (PATCH)

- **Dado** um cliente autenticado com token JWT válido
- **E** os dados fornecidos no corpo da requisição são válidos (nome, gênero, data_nascimento, telefone, enderecos)
- **Quando** é enviado `PATCH /api/clientes/perfil`
- **Então** a resposta tem status `200`
- **E** o corpo é JSON com `sucesso: true` e os dados atualizados
- **E** os novos endereços (se fornecidos) substituem a lista anterior no perfil principal

### Adição de Novo Endereço (POST)

- **Dado** um cliente autenticado
- **E** um novo objeto de endereço válido
- **Quando** é enviado `POST /api/clientes/perfil/enderecos`
- **Então** a resposta tem status `201`
- **E** o novo endereço é vinculado ao cliente no banco de dados

### Remoção de Endereço (DELETE)

- **Dado** um cliente autenticado
- **E** o UUID de um endereço pertencente a esse cliente
- **Quando** é enviado `DELETE /api/clientes/perfil/enderecos/:uuid`
- **Então** a resposta tem status `200`
- **E** o endereço é removido permanentemente do perfil do cliente
