-- Migration 036: Tipos de frete para cenários BDD de entrega/logística

INSERT INTO livraria_comercial.tipo_frete (tfr_descricao)
VALUES ('PAC'), ('SEDEX'), ('SEDEX 10'), ('SEDEX 12')
ON CONFLICT (tfr_descricao) DO NOTHING;
