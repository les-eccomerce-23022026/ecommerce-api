# Documentação Backend

## Índice

### Arquitetura e Implementação
- [Multi-Tenancy: Quick Reference](./MULTI-TENANCY-QUICK-REFERENCE.md) - Guia rápido de referência para multi-tenancy
- [Multi-Tenancy: Implementação Técnica](./MULTI-TENANCY-IMPLEMENTACAO.md) - Documentação detalhada da implementação multi-tenancy

### Testes
- [Auditoria de Testes de Integração](./AUDITORIA-TESTES-INTEGRACAO.md)
- [Inventário de Testes de Integração](./INVENTARIO-TESTES-INTEGRACAO.md)
- [Organização de Testes de Integração](./ORGANIZACAO-TESTES-INTEGRACAO.md)
- [Tipos de Testes](./TIPOS-TESTES.md)

### Banco de Dados
- [Setup Banco Unificado](./SETUP-BANCO-UNIFICADO.md)

### Mapeamento e Contexto
- [Mapeamento de Contexto Backend](./MAPEAMENTO-CONTEXTO-BACKEND.md)

### Recomendações
- [Recomendações de Estrutura Pagamentos](./RECOMENDACOES-ESTRUTURA-PAGAMENTOS.md)
- [Recomendações de Nomenclatura](./RECOMENDACOES-NOMENCLATURA.md)

### Relatórios
- [Relatório Refatoração Pagamentos](./RELATORIO-REFACTORACAO-PAGAMENTOS.md)

### Project Board
- [Project Board](./PROJECT-BOARD.md) - Kanban local de tarefas

## Documentação Multi-Tenancy

A arquitetura multi-tenancy é uma das funcionalidades mais importantes do sistema, permitindo múltiplas lojas operarem na mesma plataforma com isolamento de dados e permissões granulares.

### Documentos Principais

1. **[Multi-Tenancy: Quick Reference](./MULTI-TENANCY-QUICK-REFERENCE.md)**
   - Guia rápido para desenvolvedores
   - Tabelas de permissões
   - Exemplos de código
   - Troubleshooting comum

2. **[Multi-Tenancy: Implementação Técnica](./MULTI-TENANCY-IMPLEMENTACAO.md)**
   - Arquitetura de dados completa
   - Middlewares de autorização
   - Estrutura do token JWT
   - Queries SQL úteis
   - Integração com frontend
   - Testes de integração

### Documentação de Negócio

Para entender o contexto de negócio e personas relacionadas ao multi-tenancy, consulte:

- [Multi-Tenancy: Usuários e Permissões](../../docs/contexto-negocio/multi-tenancy-usuarios-permissoes.md)
- [Personas](../../docs/contexto-negocio/personas.md)
- [Visão Geral do Negócio](../../docs/contexto-negocio/visao-geral.md)

## Fluxo Recomendado de Leitura

Para novos desenvolvedores:

1. Comece com [Multi-Tenancy: Quick Reference](./MULTI-TENANCY-QUICK-REFERENCE.md) para uma visão geral rápida
2. Leia [Multi-Tenancy: Implementação Técnica](./MULTI-TENANCY-IMPLEMENTACAO.md) para detalhes técnicos
3. Consulte [Multi-Tenancy: Usuários e Permissões](../../docs/contexto-negocio/multi-tenancy-usuarios-permissoes.md) para contexto de negócio
4. Revise [Personas](../../docs/contexto-negocio/personas.md) para entender os diferentes tipos de usuários

## Contribuindo

Ao adicionar nova documentação:
1. Crie o arquivo na pasta apropriada
2. Adicione uma entrada neste README
3. Mantenha a formatação consistente
4. Adicione referências cruzadas quando relevante
