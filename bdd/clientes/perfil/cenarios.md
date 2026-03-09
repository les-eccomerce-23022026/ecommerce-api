# Cenários BDD – Clientes (Atualizar Perfil)

Os cenários estão separados em:

- **[Cenários de sucesso (felizes)](./cenarios-felizes.md)** – fluxos que retornam 2xx
- **[Cenários de falha](./cenarios-falhas.md)** – fluxos que retornam 4xx/5xx

Endpoint: `PATCH /api/clientes/perfil`

> Requisito: **RF0022** – Alterar dados do cliente
> Requisito: **RF0026** – Gerenciar endereços
> Regra: **RN0026** – Dados obrigatórios (Nome, Gênero, Nascimento, Telefone)

### Gerenciamento de Endereços Individuais
- `POST /api/clientes/perfil/enderecos` (Adicionar)
- `DELETE /api/clientes/perfil/enderecos/:uuid` (Remover)
