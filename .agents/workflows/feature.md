---
name: feature
description: Inicia o ciclo de desenvolvimento de uma nova feature ou fase seguindo a esteira de subagentes da feature-factory
---

# Workflow: Feature Factory

Quando o usuário solicitar o desenvolvimento de uma feature, fase ou refatoração:

1. **Fase 1 (Pesquisa)**: Invoque o subagente `codebase-researcher` para mapear dependências e blast radius usando `graphify`.
2. **Entrevista Pré-Voo (/grill-me)**: Conduza a entrevista interativa obrigatória via `ask_question` para sanar dúvidas de regras, casos de borda e trade-offs técnicos antes de planejar.
3. **Fase 2 (Planejamento)**: Redija a especificação técnica em `docs/plans/<slug>.md` e no artefato `implementation_plan.md` com diagramas Mermaid.
4. **Gate Humano 1 & 2**: PARE e aguarde aprovação explícita do usuário.
5. **Fase 3 & 4 (Execução Concorrente)**: Invoque o subagente `feature-orchestrator` para comandar:
   - Bloco 1 (Construção Concorrente): `backend-builder` (`src/clippyme/`) e `frontend-builder` (`web/`).
   - Bloco 2 (Validação Concorrente): `test-verifier` (`./scripts/verify.sh`) e `implementation-validator` (auditoria do diff contra Spec e SOLID).
   - Loop de auto-correção iterativo se houver falhas de teste ou regressões.
6. **Gate Humano 3 & Learn**: Apresente o `walkthrough.md`, colete aprovação do usuário e execute o ritual `/learn`.
