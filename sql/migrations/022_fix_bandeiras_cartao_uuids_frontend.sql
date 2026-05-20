-- =============================================================================
-- Migration 022 — Alinha ban_uuid com web/src/services/api/clienteCartaoApiHelpers.ts
-- (BANDEIRA_UUID_POR_NOME). Sem isso, POST /clientes/perfil/cartoes falha com
-- "Bandeira não encontrada." em bancos onde os UUIDs foram gerados por gen_random_uuid().
-- =============================================================================

BEGIN;

UPDATE livraria_financeiro.bandeiras_cartao SET ban_uuid = 'd30d587f-8140-469d-a5fc-8e0c998c72f4'::uuid WHERE ban_descricao = 'Visa';
UPDATE livraria_financeiro.bandeiras_cartao SET ban_uuid = 'd6eac520-7651-4ae9-84d5-b0bbf269be2e'::uuid WHERE ban_descricao = 'Mastercard';
UPDATE livraria_financeiro.bandeiras_cartao SET ban_uuid = '21317eba-311d-4bb8-9054-6debff64f2da'::uuid WHERE ban_descricao = 'Elo';
UPDATE livraria_financeiro.bandeiras_cartao SET ban_uuid = '01fd90d0-0c72-4787-8667-965b2c39f75f'::uuid WHERE ban_descricao = 'American Express';
UPDATE livraria_financeiro.bandeiras_cartao SET ban_uuid = '02cacd79-1ec5-44c5-9142-486cb4bc82f1'::uuid WHERE ban_descricao = 'Hipercard';

COMMIT;
