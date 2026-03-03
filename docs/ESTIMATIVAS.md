# Estimativas PERT — E-Commerce de Livros (LES)

> Estimativa por atividade usando a técnica **PERT** (Program Evaluation and Review Technique).
>
> **Fórmula:** `Estimativa Realista = (Otimista + 4×Mais Provável + Pessimista) / 6`
>
> **Legenda de Status:**
>
> - 🟢 **Concluído** — funcionalidade implementada no projeto
> - 🟡 **Em andamento / Parcial** — implementação iniciada, integração pendente
> - 🔴 **Não iniciado** — planejado para próximas sprints

---

## 1. Planejamento e Documentação

| ID   | Atividade                                | Otimista (h) | Realista (h) | Pessimista (h) | Status | Descrição                                                                     |
| ---- | ---------------------------------------- | :----------: | :----------: | :------------: | :----: | ----------------------------------------------------------------------------- |
| PD-1 | Levantamento e organização de requisitos |      4       |      8       |       12       |   🟢   | RFs, RNFs e RNs documentados para e-commerce de livros (livraria online)      |
| PD-2 | Documento de Visão (DVS)                 |      4       |      8       |       12       |   🟢   | DVS baseado no template do professor; escopo, stakeholders e riscos definidos |
| PD-3 | Estimativa detalhada                     |      2       |      4       |       6        |   🟢   | Estimativa PERT (otimista / realista / pessimista) por atividade              |
| PD-4 | Criação do Kanban                        |      1       |      2       |       3        |   🟢   | Kanban configurado no GitHub Projects — colunas To Do / Doing / Done          |
| PD-5 | Preparação de Slides (por entrega)       |      4       |      8       |       12       |   🟢   | Slides da 1ª entrega: tema, tecnologias, requisitos, estimativa e Kanban      |

**Subtotal Planejamento e Documentação:** Otimista **15h** · Realista **30h** · Pessimista **45h**

---

## 2. Banco de Dados

| ID   | Atividade                                   | Otimista (h) | Realista (h) | Pessimista (h) | Status | Descrição                                                                            |
| ---- | ------------------------------------------- | :----------: | :----------: | :------------: | :----: | ------------------------------------------------------------------------------------ |
| BD-1 | Modelagem do banco (DER + regras)           |     3,5      |      7       |      10,5      |   🟢   | DER planejado com entidades: Cliente, Livro, Pedido, Estoque, Cupom, Endereço        |
| BD-2 | Criação das tabelas e migrations            |      3       |      6       |       9        |   🟡   | Em andamento — DDLs criados para domínio de usuários; Livro/Pedido/Estoque pendentes |
| BD-3 | Scripts iniciais (categorias, grupos, etc.) |      2       |      4       |       6        |   🟡   | Em andamento — seeds de referência criados; categorias/grupos de livros pendentes    |

**Subtotal Banco de Dados:** Otimista **8,5h** · Realista **17h** · Pessimista **25,5h**

---

## 3. Backend

| ID   | Atividade                               | Otimista (h) | Realista (h) | Pessimista (h) | Status | Descrição                                                                                                                          |
| ---- | --------------------------------------- | :----------: | :----------: | :------------: | :----: | ---------------------------------------------------------------------------------------------------------------------------------- |
| BE-1 | Configuração do ambiente                |      3       |      6       |       9        |   🟢   | Node.js + Express + TypeScript + ESLint + Prettier + Docker configurados                                                           |
| BE-2 | Autenticação (login, JWT, criptografia) |     4,5      |      9       |      13,5      |   🟢   | JWT via HttpOnly Cookie, bcrypt, middleware de autenticação e autorização implementados                                            |
| BE-3 | API CRUD Cliente                        |     4,5      |      9       |      13,5      |   🟡   | Rotas de registro, atualização, inativação e alteração de senha implementadas; endereço/telefone/perfil em integração com Postgres |
| BE-4 | API CRUD Produto                        |     4,5      |      9       |      13,5      |   🔴   | Não iniciado — domínio `livros` aguardando DDL e implementação                                                                     |
| BE-5 | Carrinho e Checkout                     |     9,5      |      19      |      28,5      |   🔴   | Não iniciado — `CarrinhoService` e `CheckoutService` aguardam API de produto e estoque                                             |
| BE-6 | Regras de pagamento e cupons            |     6,5      |      13      |      19,5      |   🔴   | Não iniciado — regras de negócio documentadas nos requisitos (RN)                                                                  |
| BE-7 | Controle de estoque e lote              |      5       |      10      |       15       |   🔴   | Não iniciado — interface de dashboard admin define estrutura de estoque                                                            |
| BE-8 | Testes básicos backend                  |     5,5      |      11      |      16,5      |   🟡   | Em andamento — testes de integração implementados para auth e clientes; Livro/Pedido pendentes                                     |

**Subtotal Backend:** Otimista **43,5h** · Realista **86h** · Pessimista **129,5h**

---

## 4. Frontend

| ID   | Atividade                       | Otimista (h) | Realista (h) | Pessimista (h) | Status | Descrição                                                                                                                                                                                  |
| ---- | ------------------------------- | :----------: | :----------: | :------------: | :----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FE-1 | Protótipos (Figma/HTML)         |     4,5      |      9       |      13,5      |   🟢   | Protótipos em React gerados para as principais visões de cliente e dashboard admin                                                                                                         |
| FE-2 | Estrutura base e layout         |     4,5      |      9       |      13,5      |   🟢   | Criados `src/components/common` (BaseLayout, Header, Footer, ProtectedRoute). Implementados estados de Error Boundary, Empty e Loading                                                     |
| FE-3 | Front CRUD Cliente              |     5,5      |      11      |      16,5      |   🟡   | Cenário Feliz: cadastro ou login redireciona para Home com auth context. Falhas: Mensagens de erro de validação (CPF inválido, senha fraca) e erro 401 em andamento                        |
| FE-4 | Front CRUD Produto              |     5,5      |      11      |      16,5      |   🟡   | Cenário Feliz: Listagem dos livros mockados, busca funcional e admin adiciona novo livro sem erros. Falha: Feedback UI se tentar buscar/acessar um produto sem autenticação — em andamento |
| FE-5 | Tela Carrinho e Checkout        |     8,5      |      17      |      25,5      |   🟡   | Cenário Feliz: Adiciona itens, calcula total de modos, preenche frete/cartão, redireciona ao resumo de sucesso. Falhas: Tentar fechar pedido vazio — em andamento                          |
| FE-6 | Painel Admin (Pedidos/Estoque)  |     6,5      |      13      |      19,5      |   🟡   | Cenário Feliz: autenticado visualiza gráficos de desempenho geral com loading. Falhas: Acesso de login e cart não autenticado — em andamento                                               |
| FE-7 | Responsividade e ajustes finais |     6,5      |      13      |      19,5      |   🔴   | Não iniciado — adequação de cenários de edge cases e mobile (layout)                                                                                                                       |

**Subtotal Frontend:** Otimista **41,5h** · Realista **83h** · Pessimista **124,5h**

---

## 5. Deploy e Integração

| ID   | Atividade                           | Otimista (h) | Realista (h) | Pessimista (h) | Status | Descrição                                                              |
| ---- | ----------------------------------- | :----------: | :----------: | :------------: | :----: | ---------------------------------------------------------------------- |
| DI-1 | Configuração CI/CD                  |     4,5      |      9       |      13,5      |   🔴   | Não iniciado — GitHub Actions planejado para pipeline de deploy        |
| DI-2 | Deploy (frontend + backend + banco) |      3       |      6       |       9        |   🔴   | Não iniciado — Vercel (frontend) e Railway/Render (backend) planejados |

**Subtotal Deploy e Integração:** Otimista **7,5h** · Realista **15h** · Pessimista **22,5h**

---

## Totais Gerais

| Grupo                       | Otimista (h) | Realista (h) | Pessimista (h) |
| --------------------------- | :----------: | :----------: | :------------: |
| Planejamento e Documentação |      15      |      30      |       45       |
| Banco de Dados              |     8,5      |      17      |      25,5      |
| Backend                     |     43,5     |      86      |     129,5      |
| Frontend                    |     41,5     |      83      |     124,5      |
| Deploy e Integração         |     7,5      |      15      |      22,5      |
| **TOTAL**                   |   **116**    |   **231**    |    **347**     |

---

> [!NOTE]
> As estimativas foram calculadas com base na técnica PERT. O valor **Realista** é o mais provável de ser atingido em condições normais de desenvolvimento.

> [!TIP]
> Atualize o **Status** de cada atividade a cada sprint ou quando houver alteração de código relacionada ao domínio da tarefa.

> [!IMPORTANT]
> Este arquivo deve ser mantido em sincronia com o `TASKS.md` e com os commits registrados em `CHANGES.md`.
