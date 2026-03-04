# Cenários BDD – Admin (Registro de Administrador)

Os cenários estão separados em:

- **[Cenários de sucesso (felizes)](./cenarios-felizes.md)** – fluxos que retornam 2xx
- **[Cenários de falha](./cenarios-falhas.md)** – fluxos que retornam 4xx/5xx

Endpoint: `POST /api/admin/registrar`

> Requisito: **RF0060** – Gerenciamento de Administradores (CRUD)
> Regra: **RN0065** – Apenas admin autenticado pode criar outro admin (sem rota pública)
> RNF: **RNF0037** – Rota protegida por role (`admin`)
