# Cenários BDD – Clientes (Atualizar Perfil) – Falhas

## Endpoint

- `PATCH /api/clientes/perfil` (Requer autenticação como 'cliente')

---

## Cenários de falha

### Cliente não autenticado

- **Dado** uma requisição sem token JWT no header `Authorization`
- **Quando** é enviado `PATCH /api/clientes/perfil`
- **Então** a resposta tem status `401`
- **E** o corpo indica `sucesso: false` e "Token não fornecido"

### Falha na Confirmação de Senha para Dados Críticos (RN0078)

- **Dado** um cliente autenticado
- **E** o corpo contém alteração de e-mail ou CPF
- **E** o campo `senhaConfirmacao` é omitido ou contém uma senha incorreta
- **Quando** é enviado `PATCH /api/clientes/perfil`
- **Então** a resposta tem status `401`
- **E** o corpo indica `sucesso: false` e "Senha atual incorreta para atualização de dados sensíveis."

### CPF ou Telefone com Formato Inválido

- **Dado** um cliente autenticado
- **E** o corpo contém um CPF com menos de 11 dígitos ou telefone com formato inválido
- **Quando** é enviado `PATCH /api/clientes/perfil`
- **Então** a resposta tem status `400`
- **E** o corpo indica os erros de validação correspondentes

### Remoção de Endereço Inexistente ou de Outro Cliente

- **Dado** um cliente autenticado
- **E** um UUID de endereço que não pertence a ele
- **Quando** é enviado `DELETE /api/clientes/perfil/enderecos/:uuid`
- **Então** a resposta tem status `403` ou `404`
- **E** o endereço não é removido
