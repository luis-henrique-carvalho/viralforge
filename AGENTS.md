# Diretrizes do projeto — ViralForge

Este arquivo é a fonte autoritativa de regras do repositório para agentes no Codex e no Gemini/Antigravity. O `GEMINI.md` da raiz encaminha o Gemini para estas mesmas regras, mantendo o `CLAUDE.md` em sincronia técnica. Aplique as regras do projeto independentemente do nome das ferramentas oferecidas pelo ambiente; use apenas ferramentas realmente disponíveis na sessão.

## Referências do projeto

- [CLAUDE.md](CLAUDE.md): guia técnico detalhado com arquitetura de runtime, comandos, endpoints e detalhes operacionais.
- [Linguagem Ubíqua e Modelo de Domínio](CONTEXT.md): glossário canônico de termos de domínio (`ViralBatch`, `ViralItem`, `SocialChannel`, `SocialPublisherPort`, etc.) e termos a evitar.
- [Fluxos do Sistema](docs/fluxos-do-sistema.md): mapa unificado de ponta a ponta: do discovery à ingestão, templates Konva, renderização FFmpeg, revisão e agendamento contínuo.
- [Arquitetura de Migração Frontend](docs/plano-migracao-frontend.md): arquitetura do frontend em React 19 + Vite + TanStack Router + Shadcn UI.
- [Publicação e Fila Contínua](docs/publicacao-e-fila-continua.md): fila contínua auto-chaining sem colisão e arquitetura Ports & Adapters para publicação social.
- [Arquitetura de Templates Konva](docs/viral-studio-template-architecture.md): templates universais desacoplados, Konva 9:16 e motor dinâmico de `GenerationTasks`.
- [Integração de Publicação Postiz](docs/integracao-publicacao-postiz.md): arquitetura e especificação funcional da integração ViralForge ↔ Postiz.
- [Workspace de Marcas](docs/gestao-de-marcas-workspace.md): catálogo global e workspace de marcas (`/viral-studio/brands/$brandId`).
- [Descoberta Assíncrona e Mineração](docs/descoberta-assincrona-e-mineracao.md): especificação do `DiscoveryWorker`, cancelamento e persistência.
- [Cancelamento de Processamento](docs/cancelamento-processamento-viral-studio.md): encerramento seguro de lotes e vídeos via árvore de processos psutil.
- [Grafo do codebase](graphify-out/GRAPH_REPORT.md): mapa de módulos e relações, quando disponível e atualizado.

## Invariantes de arquitetura e qualidade

1. **Separação Estrita entre Backend e Frontend (Zero Shared Package)**:
   Preserve o isolamento total entre `src/clippyme` (API Python) e `web/` (Frontend React 19). O contrato entre eles é a rede HTTP/REST. Não crie pacotes compartilhados e declare contratos de consumo locais no frontend.
2. **Handlers Finos no FastAPI**:
   Rotas em `src/clippyme/api/` devem ser finas (< 25 linhas): validar payload Pydantic → invocar helper de domínio em `src/clippyme/domain/` → retornar JSON. Módulos de domínio nunca importam FastAPI; lançam subclasses de `errors.ClippyMeError` (`ValidationError` 400, `NotFoundError` 404, `ConflictError` 409), tratadas globalmente.
3. **Módulos Puros e Testáveis no Host**:
   Lógicas puras (cálculo de enquadramento, timestamps, parsing de JSON da LLM, agendamento de slots) DEVEM ser extraídas para módulos livres de imports pesados de OpenCV (`cv2`) ou PyTorch (`torch`). Isso garante execução rápida da suíte host com `pytest -m "not integration"`. Testes que exigem visão computacional são marcados como `integration` e rodam exclusivamente via Docker.
4. **Isolamento de Testes Unitários de Estado em Disco**:
   Testes unitários host que verificam resolução de ambientes ou provedores padrão (ex: `get_social_publisher`) devem isolar-se do disco mockando `load_persistent_config` e `load_zernio_config` para `{}` ou fixtures de teste, evitando vazamento do `data/config.json` local.
5. **Gravações Atômicas em Disco**:
   Toda escrita de arquivo de estado (`data/jobs_journal.json`, metadados de jobs, `data/discovery/*.json`, lotes) DEVE ser atômica (padrão `job_artifacts.save_job_metadata`: arquivo temporário + `os.replace`, permissões `0o600`), prevenindo corrupção em caso de crash.
6. **Integração com Provedores Externos via API HTTP Oficial (Ports & Adapters)**:
   É estritamente proibido manipular bancos de dados externos (`psql`, SQLite) ou containers via Docker CLI para interagir com serviços como Postiz ou Zernio. Toda mutação de estado DEVE ocorrer exclusivamente através das APIs HTTP oficiais autenticadas via `SocialPublisherPort`.
7. **Isolamento 1:1 de Redes Sociais por Marca**:
   Cada conta social (`SocialChannel`) pertence exclusivamente a uma única Marca no ViralForge. Ao vincular um canal a uma nova marca em `bind_brand_channels`, o sistema desvincula-o de marcas anteriores no domínio e sincroniza a movimentação de grupo/perfil no provedor ativo via API HTTP oficial.
8. **Worker de Descoberta Assíncrono (`DiscoveryWorker`)**:
   Buscas de vídeos respondem imediatamente com HTTP 202 (`QUEUED`). A execução ocorre em background no event loop com limite global de concorrência (`asyncio.Semaphore(2)`) e travas isoladas por plataforma (`_platform_locks[platform]`), prevenindo bloqueios de IP e captchas. O cancelamento em voo (`POST /api/discovery/searches/{id}/cancel`) interrompe o scraper e libera o semáforo imediatamente.
9. **Conformidade Shadcn 100% no Frontend (`web/`)**:
   Toda interface no frontend DEVE ser composta exclusivamente a partir dos primitivos oficiais do Shadcn UI em `@/components/ui/*` (`Typography`, `Button`, `Input`, `Badge`, `Card`, `Switch`, `Select`, `Dialog`, `Sheet`, `ScrollArea`, `Separator`). É estritamente proibido usar elementos HTML crus (`<button>`, `<input>`, `<h1>`-`<h6>`, `<p>`). Todo código de frontend DEVE passar no `./scripts/check_shadcn_usage.py` com **0 avisos**.
10. **Tipagem Estrita e Regras de Componentes no Frontend**:
    TypeScript em modo estrito com **zero `any`**. Máximo de 80 linhas por função e 200 linhas por componente. Listas e tooltips de gráficos devem usar chaves de string únicas (`key={key}`) em vez de índices numéricos de array. Separação clara entre `views/`, `components/`, `hooks/`, `services/` e `data/`.
11. **Paridade Visual 1:1 no Motor de Renderização**:
    O renderizador de vídeo FFmpeg/Pillow (`viral_studio_renderer.py`) deve replicar matematicamente o preview do canvas interativo 9:16 do Konva (`react-konva`) em geometria, fontes, posições (`badge_y`, `headline_y`), alinhamentos, bordas e cores de fundo (`#0D1117`). Emojis coloridos DEVEM ser renderizados via `pilmoji` + `Twemoji` com cache local em `data/cache/emojis/`.
12. **Segurança e Origens de Loopback Agnósticas de Porta**:
    Validação de regex para `job_id` em todos os endpoints. No `security.py`, `is_trusted_origin()` aceita dinamicamente qualquer porta em hostnames de loopback (`localhost`, `127.0.0.1`, `::1`), prevenindo bloqueios falsos de CSRF 403 quando o dev server roda em portas alternativas (5173, 5174, 5180).
13. **Imutabilidade de Configurações de Qualidade**:
    NUNCA afrouxe ou desative regras de linter, opções do `tsconfig.json`, `eslint.config.*`, ou scripts de validação para silenciar falhas. Corrija o código-fonte ou o teste.
14. **Desenvolvimento em Branch Dedicada**:
    Desenvolva novas fases e features em branches dedicadas (`feat/<nome-da-feature>`), mantendo a branch principal sempre íntegra.
15. **Recarregamento de Backend no Docker**:
    Como o `uvicorn` dentro do container roda sem `--reload`, sempre execute `docker restart clippyme-backend` após modificar arquivos Python do backend caso esteja testando o container em execução.

## Fluxo de trabalho para qualquer agente

1. **Grafo de Conhecimento em Primeiro Lugar (Graphify-First)**:
   Antes de recorrer a grep ou varreduras manuais, consulte a arquitetura através do grafo: `graphify query "<pergunta>"`, `graphify explain "<módulo>"` ou `graphify path "<A>" "<B>"`. Confirme os detalhes lendo apenas os arquivos relevantes.
2. **Gate 0 Mandatório — Entrevista Pré-Voo (`/grill-me` via `ask_question`)**:
   Antes de elaborar planos técnicos ou implementar features não triviais, o agente do Chat Canvas formula perguntas interativas para sanar casos de borda, regras de negócio e trade-offs de dados, sempre indicando a opção recomendada com o prefixo `(Recommended)`.
3. **Mínima Mudança Viável (Ponytail / YAGNI)**:
   Faça a menor mudança que satisfaça a tarefa com excelência. Evite abstrações especulativas, classes genéricas desnecessárias e pacotes redundantes.
4. **Ativação Obrigatória de Skills (Passo 0)**:
   Todo agente e subagente DEVE invocar `view_file` nos arquivos `SKILL.md` de seus respectivos playbooks no início de sua execução para carregar o contexto completo.
5. **Esteira Feature Factory em 2 Níveis**:
   Para features que envolvam backend e frontend, utilize os papéis em `.agents/agents/` e a esteira `feature-factory`:
   - **Nível 1 (Chat Canvas)**: Conduz o Gate 0 (`/grill-me`), redige o plano técnico com diagramas Mermaid em `docs/plans/<slug>.md` e `implementation_plan.md`, obtém aprovação do usuário (Gate Humano 1 & 2), e delega ao `feature-orchestrator`.
   - **Nível 2 (`feature-orchestrator`)**: Comanda os blocos concorrentes:
     - **Bloco 1 (Construção Concorrente)**: Despacha simultaneamente `backend-builder` (`src/clippyme`) e `frontend-builder` (`web/`).
     - **Bloco 2 (Validação & Auditoria Concorrentes)**: Despacha simultaneamente `test-verifier` (`./scripts/verify.sh`) e `implementation-validator` (auditoria do diff contra Spec e SOLID).
     - **Loop de Auto-Correção**: Re-injeta diagnósticos de falha nos builders até aprovação total.
   - **Homologação (Gate Humano 3)**: Apresenta o resultado consolidado no `walkthrough.md`.
6. **Validação Rigorosa com `./scripts/verify.sh`**:
   Toda entrega de código deve passar no validador do repositório:
   - `./scripts/verify.sh` (validação completa: Ruff + Pytest host + Shadcn check + Typecheck TS + ESLint + Vitest + Vite build).
   - Use `--backend` ou `--web` para validações rápidas localizadas durante o ciclo TDD.
   - Atualize o grafo de conhecimento após modificações estruturais com `graphify update .`.
7. **Fechamento e Aprendizado Contínuo (`/learn`)**:
   Ao concluir a entrega e obter aprovação final, registre aprendizados e novas regras em documentação persistente e atualize este arquivo se novos padrões forem definidos.

## Comandos do repositório

```bash
# Validação e Qualidade
./scripts/verify.sh                  # Validação completa (Backend Python + Web Frontend)
./scripts/verify.sh --backend        # Apenas backend Python (Ruff + Pytest host)
./scripts/verify.sh --web            # Apenas frontend Web (Shadcn + TS + ESLint + Vitest + Build)
./scripts/verify.sh --e2e            # Inclui testes Playwright E2E

# Backend Python (Host)
uv run --extra host-tests --with ruff ruff check src/clippyme tests --select E9,F63,F7,F82
uv run --extra host-tests --with pytest --with pytest-mock python -m pytest -m "not integration" -q

# Testes de Integração Pesados de Visão Computacional (Docker)
docker compose run --rm -u root backend sh -lc "pip install -q pytest && pytest -m integration"

# Frontend Web (web/)
./scripts/check_shadcn_usage.py     # Auditoria de conformidade Shadcn UI (0 avisos)
pnpm --dir web typecheck            # Verificação de tipos TypeScript
pnpm --dir web lint                 # ESLint do frontend
pnpm --dir web test:coverage        # Vitest com cobertura V8
pnpm --dir web build                # Build de produção Vite

# Grafo de Conhecimento (Graphify)
graphify query "<pergunta ou conceito>"
graphify explain "<símbolo ou módulo>"
graphify path "<Módulo A>" "<Módulo B>"
graphify update .

# Execução Local e Containers
docker compose up --build            # Subir backend (:8000) e frontend (:5176) em CPU
docker restart clippyme-backend      # Recarregar backend em execução no Docker após edição de código
./scripts/start_tunnels.sh status    # Tunnels Cloudflare (Postiz, API, Dashboard)
```
