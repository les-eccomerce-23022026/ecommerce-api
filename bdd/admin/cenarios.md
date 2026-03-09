# Cenários BDD – Admin (Registro de Administrador)

Obrigatório (CRUD de Administradores):
- **[Cenários de sucesso (felizes)](./cenarios-felizes.md)** – Listagem, Registro, Inativação e Ativação
- **[Cenários de falha](./cenarios-falhas.md)** – Acessos negados e autoinativação

Endpoints: 
- `GET /api/admin/administradores`
- `POST /api/admin/registro`
- `PATCH /api/admin/administradores/:uuid/inativar`
- `PATCH /api/admin/administradores/:uuid/ativar`

> Requisito: **RF0060** – Gerenciamento de Administradores (CRUD)
> Regra: **RN0065** – Apenas admin autenticado pode criar outro admin (sem rota pública)
> RNF: **RNF0037** – Rota protegida por role (`admin`)
