# Proposta de Reorganização de Testes de Integração

> Documento de proposta de reorganização dos testes de integração por fluxos completos e partes menores.
> Gerado em: 19/05/2026

---

## Problemas da Organização Atual

### 1. Mistura de Tipos de Testes
- Testes de fluxo completo (E2E) misturados com testes de componentes específicos
- Testes de repositório (N+1) misturados com testes de integração de negócio
- Arquivos de helper (`pagamentos.integracao.comum.ts`) misturados com testes

### 2. Nomenclatura Inconsistente
- Alguns arquivos com prefixo `pagamentos.integracao.`
- Outros sem prefixo (`pagamentos-e2e.test.ts`, `pagamentos.pix-selecionar.integracao.test.ts`)
- Nomes não indicam se são fluxo completo ou parte menor

### 3. Arquivos Soltos na Raiz
- `fluxos-cliente.integracao.test.ts` - deveria estar em `clientes/fluxo-completo/`
- `reproducao_falhas.test.ts` - deveria estar em contexto específico

### 4. Estrutura de Pastas Confusa
- `clientes/auth.integracao.test.ts` - duplicado com `auth/auth.integracao.test.ts`
- `clientes/perfil/` - subpasta desnecessária
- `casos-uso-entrega-7/` - pasta vazia

---

## Proposta de Organização Ideal

### Princípios
1. **Separar fluxo completo de partes menores**
2. **Nomenclatura consistente**
3. **Estrutura hierárquica por domínio → tipo de teste**
4. **Separar testes de repositório (técnico) de testes de negócio**

### Estrutura Proposta

```
backend/src/tests/integracao/
├── fluxos-completos/                    # Fluxos E2E completos por domínio
│   ├── cliente/                        # Fluxo completo do cliente
│   │   ├── cadastro-login-perfil.integracao.test.ts
│   │   └── atualizacao-senha-inativacao.integracao.test.ts
│   ├── venda/                          # Fluxo completo de venda
│   │   ├── checkout-completo.integracao.test.ts
│   │   ├── pagamento-multiplos-cartoes.integracao.test.ts
│   │   └── entrega-finalizacao.integracao.test.ts
│   ├── troca/                          # Fluxo completo de troca
│   │   ├── solicitacao-autorizacao-recebimento.integracao.test.ts
│   │   └── geracao-cupom-troca.integracao.test.ts
│   ├── administrador/                  # Fluxo completo de admin
│   │   ├── gestao-admins.integracao.test.ts
│   │   ├── gestao-pedidos.integracao.test.ts
│   │   └── dashboard-integracao.test.ts
│   └── carrinho/                       # Fluxo completo de carrinho
│       └── carrinho-completo.integracao.test.ts
│
├── componentes/                        # Testes de partes menores (componentes específicos)
│   ├── autenticacao/
│   │   ├── login.integracao.test.ts
│   │   ├── sessao-cookie.integracao.test.ts
│   │   └── multi-tenancy.integracao.test.ts
│   ├── cliente/
│   │   ├── cadastro.integracao.test.ts
│   │   ├── perfil.integracao.test.ts
│   │   ├── enderecos.integracao.test.ts
│   │   ├── cartoes.integracao.test.ts
│   │   ├── senha.integracao.test.ts
│   │   └── inativacao.integracao.test.ts
│   ├── carrinho/
│   │   ├── obter-carrinho.integracao.test.ts
│   │   ├── sincronizar-item.integracao.test.ts
│   │   ├── limpar-carrinho.integracao.test.ts
│   │   └── validacao-estoque.integracao.test.ts
│   ├── venda/
│   │   ├── criacao-pedido.integracao.test.ts
│   │   ├── consulta-venda.integracao.test.ts
│   │   ├── listagem-vendas-cliente.integracao.test.ts
│   │   └── regras-negocio.integracao.test.ts
│   ├── pagamento/
│   │   ├── intencao-pagamento.integracao.test.ts
│   │   ├── vincular-venda.integracao.test.ts
│   │   ├── processar-pagamento.integracao.test.ts
│   │   ├── checkout-info.integracao.test.ts
│   │   ├── parcelamento.integracao.test.ts
│   │   ├── pix.integracao.test.ts
│   │   └── cupons.integracao.test.ts
│   ├── entrega/
│   │   ├── cotar-frete.integracao.test.ts
│   │   ├── agendar-entrega.integracao.test.ts
│   │   ├── consultar-entrega.integracao.test.ts
│   │   ├── registrar-falha.integracao.test.ts
│   │   ├── confirmar-recebimento.integracao.test.ts
│   │   └── reagendar-entrega.integracao.test.ts
│   ├── troca/
│   │   ├── solicitar-troca.integracao.test.ts
│   │   ├── autorizar-troca.integracao.test.ts
│   │   ├── rejeitar-troca.integracao.test.ts
│   │   └── confirmar-recebimento-troca.integracao.test.ts
│   ├── catalogo/
│   │   ├── listagem-livros.integracao.test.ts
│   │   ├── detalhes-livro.integracao.test.ts
│   │   ├── categorias.integracao.test.ts
│   │   ├── criar-livro.integracao.test.ts
│   │   ├── atualizar-livro.integracao.test.ts
│   │   └── bulk-insert.integracao.test.ts
│   └── administrativo/
│       ├── listar-admins.integracao.test.ts
│       ├── criar-admin.integracao.test.ts
│       ├── atualizar-admin.integracao.test.ts
│       ├── inativar-admin.integracao.test.ts
│       ├── listar-clientes.integracao.test.ts
│       └── despachar-pedido.integracao.test.ts
│
├── repositorios/                       # Testes de otimização de repositório (N+1, etc)
│   ├── vendas/
│   │   └── vendas-n1-otimizacao.test.ts
│   ├── pagamentos/
│   │   └── pagamentos-n1-otimizacao.test.ts
│   └── livros/
│       └── livros-n1-otimizacao.test.ts
│
└── helpers/                            # Helpers e utilities compartilhados
    ├── pagamentos-comum.ts
    ├── vendas-comum.ts
    └── clientes-comum.ts
```

---

## Mapeamento: Arquivo Atual → Estrutura Proposta

### Fluxos Completos (E2E)

| Arquivo Atual | Destino Proposto |
|---------------|------------------|
| `fluxos-cliente.integracao.test.ts` | `fluxos-completos/cliente/cadastro-login-perfil.integracao.test.ts` |
| `vendas/venda-completa.integracao.test.ts` | `fluxos-completos/venda/checkout-completo.integracao.test.ts` |
| `vendas/troca.integracao.test.ts` | `fluxos-completos/troca/solicitacao-autorizacao-recebimento.integracao.test.ts` |
| `vendas/vendas-e2e.test.ts` | `fluxos-completos/venda/pagamento-multiplos-cartoes.integracao.test.ts` |
| `admin/fluxos-admin.integracao.test.ts` | `fluxos-completos/administrador/gestao-admins.integracao.test.ts` |
| `carrinho/carrinho.integracao.test.ts` | `fluxos-completos/carrinho/carrinho-completo.integracao.test.ts` |
| `pagamentos/pagamentos-e2e.test.ts` | `fluxos-completos/venda/pagamento-multiplos-cartoes.integracao.test.ts` |

### Componentes (Partes Menores)

#### Autenticação
| Arquivo Atual | Destino Proposto |
|---------------|------------------|
| `auth/auth.integracao.test.ts` | `componentes/autenticacao/login.integracao.test.ts` |
| `clientes/auth.integracao.test.ts` | `componentes/autenticacao/sessao-cookie.integracao.test.ts` (mesclar) |
| `lojas/multi-tenancy-lojas.integracao.test.ts` | `componentes/autenticacao/multi-tenancy.integracao.test.ts` |

#### Cliente
| Arquivo Atual | Destino Proposto |
|---------------|------------------|
| `clientes/clientes-registro.integracao.test.ts` | `componentes/cliente/cadastro.integracao.test.ts` |
| `clientes/perfil/clientes-perfil.integracao.test.ts` | `componentes/cliente/perfil.integracao.test.ts` |
| `clientes/perfil/clientes-enderecos.integracao.test.ts` | `componentes/cliente/enderecos.integracao.test.ts` |
| `clientes/cartoes.integracao.test.ts` | `componentes/cliente/cartoes.integracao.test.ts` |
| `clientes/perfil/cartoes.integracao.test.ts | `componentes/cliente/cartoes.integracao.test.ts` (mesclar) |
| `clientes/clientes-senha.integracao.test.ts` | `componentes/cliente/senha.integracao.test.ts` |
| `clientes/clientes-inativacao.integracao.test.ts` | `componentes/cliente/inativacao.integracao.test.ts` |
| `clientes/limite-enderecos.integracao.test.ts` | `componentes/cliente/enderecos.integracao.test.ts` (mesclar) |

#### Carrinho
| Arquivo Atual | Destino Proposto |
|---------------|------------------|
| `carrinho/carrinho.integracao.test.ts` | `componentes/carrinho/obter-carrinho.integracao.test.ts` (extrair partes) |

#### Venda
| Arquivo Atual | Destino Proposto |
|---------------|------------------|
| `vendas/pedido-venda.integracao.test.ts` | `componentes/venda/criacao-pedido.integracao.test.ts` |
| `vendas/servico-vendas.integracao.test.ts` | `componentes/venda/regras-negocio.integracao.test.ts` |
| `vendas/vendas-admin-fluxo.integracao.test.ts` | `componentes/administrativo/despachar-pedido.integracao.test.ts` (extrair) |

#### Pagamento
| Arquivo Atual | Destino Proposto |
|---------------|------------------|
| `pagamentos/pagamentos.integracao.intencao-e-processar.test.ts` | `componentes/pagamento/intencao-pagamento.integracao.test.ts` (extrair) |
| `pagamentos/pagamentos.integracao.intencao-e-processar.test.ts` | `componentes/pagamento/processar-pagamento.integracao.test.ts` (extrair) |
| `pagamentos/pagamentos.integracao.intencao-e-processar.test.ts` | `componentes/pagamento/checkout-info.integracao.test.ts` (extrair) |
| `pagamentos/pagamentos.integracao.parcelas.test.ts` | `componentes/pagamento/parcelamento.integracao.test.ts` |
| `pagamentos/pagamentos.parcelamento.integracao.test.ts` | `componentes/pagamento/parcelamento.integracao.test.ts` (mesclar) |
| `pagamentos/pagamentos.pix-selecionar.integracao.test.ts` | `componentes/pagamento/pix.integracao.test.ts` |
| `pagamentos/pagamentos.integracao.selecionar-e-pix.test.ts` | `componentes/pagamento/pix.integracao.test.ts` (mesclar) |
| `cupom/cupom.integracao.test.ts` | `componentes/pagamento/cupons.integracao.test.ts` |

#### Entrega
| Arquivo Atual | Destino Proposto |
|---------------|------------------|
| `entrega/entrega.integracao.test.ts` | `componentes/entrega/agendar-entrega.integracao.test.ts` (extrair) |
| `entrega/entrega.integracao.test.ts` | `componentes/entrega/consultar-entrega.integracao.test.ts` (extrair) |
| `entrega/entrega-fluxo-falha.integracao.test.ts` | `componentes/entrega/registrar-falha.integracao.test.ts` (extrair) |
| `entrega/entrega-fluxo-falha.integracao.test.ts` | `componentes/entrega/confirmar-recebimento.integracao.test.ts` (extrair) |
| `entrega/entrega-fluxo-falha.integracao.test.ts` | `componentes/entrega/reagendar-entrega.integracao.test.ts` (extrair) |
| `frete/frete.integracao.test.ts` | `componentes/entrega/cotar-frete.integracao.test.ts` |

#### Troca
| Arquivo Atual | Destino Proposto |
|---------------|------------------|
| `vendas/troca.integracao.test.ts` | `componentes/troca/solicitar-troca.integracao.test.ts` (extrair) |
| `vendas/troca.integracao.test.ts` | `componentes/troca/autorizar-troca.integracao.test.ts` (extrair) |
| `vendas/troca.integracao.test.ts` | `componentes/troca/rejeitar-troca.integracao.test.ts` (extrair) |
| `vendas/troca.integracao.test.ts` | `componentes/troca/confirmar-recebimento-troca.integracao.test.ts` (extrair) |

#### Catálogo
| Arquivo Atual | Destino Proposto |
|---------------|------------------|
| `livros/livros-e2e.test.ts` | `componentes/catalogo/listagem-livros.integracao.test.ts` (extrair) |
| `livros/livros-e2e.test.ts` | `componentes/catalogo/detalhes-livro.integracao.test.ts` (extrair) |
| `livros/livros-multi-tenancy.integracao.test.ts` | `componentes/catalogo/listagem-livros.integracao.test.ts` (mesclar) |
| `livros/livros-bulk-insert.integracao.test.ts` | `componentes/catalogo/bulk-insert.integracao.test.ts` |
| `admin/acesso-produtos-admin.integracao.test.ts` | `componentes/catalogo/criar-livro.integracao.test.ts` (extrair) |
| `admin/acesso-produtos-admin.integracao.test.ts` | `componentes/catalogo/atualizar-livro.integracao.test.ts` (extrair) |

#### Administrativo
| Arquivo Atual | Destino Proposto |
|---------------|------------------|
| `admin/admin-mestre-gestao.integracao.test.ts` | `componentes/administrativo/listar-admins.integracao.test.ts` (extrair) |
| `admin/admin-mestre-gestao.integracao.test.ts` | `componentes/administrativo/criar-admin.integracao.test.ts` (extrair) |
| `admin/admin-mestre-gestao.integracao.test.ts` | `componentes/administrativo/inativar-admin.integracao.test.ts` (extrair) |
| `admin/admin-comum-permissoes-listagens.integracao.test.ts` | `componentes/administrativo/listar-clientes.integracao.test.ts` (extrair) |
| `admin/admin-painel.integracao.test.ts` | `fluxos-completos/administrador/dashboard-integracao.test.ts` |
| `vendas/vendas-admin-fluxo.integracao.test.ts` | `componentes/administrativo/despachar-pedido.integracao.test.ts` (extrair) |

### Repositórios (Otimização)

| Arquivo Atual | Destino Proposto |
|---------------|------------------|
| `vendas/repositorio-vendas-n1-otimizacao.repositorio.test.ts` | `repositorios/vendas/vendas-n1-otimizacao.test.ts` |
| `pagamentos/repositorio-pagamentos-n1-otimizacao.repositorio.test.ts` | `repositorios/pagamentos/pagamentos-n1-otimizacao.test.ts` |
| `livros/repositorio-livros-otimizacao.repositorio.test.ts` | `repositorios/livros/livros-n1-otimizacao.test.ts` |

### Helpers

| Arquivo Atual | Destino Proposto |
|---------------|------------------|
| `pagamentos/pagamentos.integracao.comum.ts` | `helpers/pagamentos-comum.ts` |

### Outros

| Arquivo Atual | Destino Proposto |
|---------------|------------------|
| `reproducao_falhas.test.ts` | `componentes/geral/reproducao-falhas.integracao.test.ts` |
| `atualizacao-cadastral/atualizacao-cadastral.integracao.test.ts` | `componentes/cliente/atualizacao-cadastral.integracao.test.ts` |
| `validacao-dados/validacao-dados.integracao.test.ts` | `componentes/geral/validacao-dados.integracao.test.ts` |
| `seguranca/seguranca-basica.integracao.test.ts` | `componentes/autenticacao/seguranca-basica.integracao.test.ts` |
| `logistica-mocks/logistica-mocks.integracao.test.ts` | `componentes/entrega/logistica-mocks.integracao.test.ts` |
| `casos-uso-entrega-7/` | REMOVER (pasta vazia) |

---

## Benefícios da Reorganização

### 1. Clareza
- Separação clara entre fluxos completos (E2E) e componentes específicos
- Nomes de arquivos descritivos indicando exatamente o que testam

### 2. Manutenibilidade
- Fácil encontrar teste específico de um componente
- Fácil identificar lacunas na cobertura de testes

### 3. Execução Seletiva
- Possibilidade de rodar apenas fluxos completos para validação de release
- Possibilidade de rodar apenas componentes específicos durante desenvolvimento

### 4. Consistência
- Nomenclatura padronizada
- Estrutura hierárquica consistente

---

## Plano de Migração

### Fase 1: Criar Nova Estrutura
1. Criar pastas `fluxos-completos/`, `componentes/`, `repositorios/`, `helpers/`
2. Criar subpastas por domínio

### Fase 2: Migrar Arquivos
1. Migrar fluxos completos para `fluxos-completos/`
2. Migrar testes de componentes para `componentes/`
3. Migrar testes de repositório para `repositorios/`
4. Migrar helpers para `helpers/`

### Fase 3: Consolidar e Remover Duplicados
1. Mesclar testes duplicados (ex: auth em clientes/ e auth/)
2. Remover arquivos antigos
3. Remover pastas vazias

### Fase 4: Atualizar Imports
1. Atualizar imports nos arquivos de teste
2. Atualizar paths nos arquivos de configuração

### Fase 5: Validar
1. Rodar todos os testes para garantir que nada quebrou
2. Validar cobertura de testes

---

## Conclusão

A reorganização proposta separa claramente:
- **Fluxos completos (E2E)** - testam o caminho feliz completo do negócio
- **Componentes específicos** - testam partes menores isoladas
- **Repositórios** - testes técnicos de otimização
- **Helpers** - utilities compartilhadas

Essa estrutura facilita manutenção, entendimento e execução seletiva dos testes.
