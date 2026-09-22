# Plano de Migração e Arquitetura do Frontend — ViralForge

> **Documento de Especificação Técnica e Diretrizes Arquiteturais**  
> **Status:** Aprovado para execução faseada  
> **Referência Arquitetural:** [`/home/luis/repositories/engancha-web`](file:///home/luis/repositories/engancha-web)  
> **Tema Visual Shadcn:** [TweakCN Theme](https://tweakcn.com/r/themes/cmlva2weo000104jr85nt08re)

---

## 1. Contexto e Motivação

O frontend atual (`dashboard/`) foi concebido inicialmente como um fork do ClippyMe, acumulando dívida técnica severa que impede a escalabilidade do **ViralForge**:

1. **Monólitos de Código:** Arquivos centrais como `viralStudio.jsx` (+1.300 linhas) e `ViralEditModal.jsx` (+1.000 linhas) misturam layout, chamadas de rede, regras de negócio e manipulação de estado em um único bloco.
2. **Ausência de TypeScript:** O uso de JavaScript puro gera erros silenciosos em tempo de execução ao manipular os complexos contratos de dados do backend (transcrições, telemetria de LLM, ganchos, métricas de engajamento).
3. **Gerenciamento de Estado Frágil:** Sincronização manual via `useEffect`, `setInterval` e chaves soltas de `localStorage` sem cache centralizado.
4. **Camada Legada:** A pasta provisória `dashboard/src/redesign/` gerou duplicações com `src/lib/` e `src/hooks/`.

### Objetivo da Migração
Construir um novo frontend moderno, performático, fortemente tipado e escalável em uma pasta isolada (ex.: `web/`), mantendo o `dashboard/` legado operacional até a substituição definitiva.

---

## 2. Stack Tecnológica Oficial

A stack adota exatamente os padrões consolidados no projeto de referência `engancha-web`:

| Camada | Tecnologia | Versão / Padrão |
|---|---|---|
| **Runtime & Bundler** | React + Vite | React 19, Vite 8, TypeScript estrito |
| **Estilização** | Tailwind CSS v4 + tw-animate-css | CSS-first (`@import 'tailwindcss';`) |
| **Componentes UI** | Shadcn UI (New York style) + Radix UI | Catálogo completo sob `@/components/ui` |
| **Tema** | TweakCN | `pnpm dlx shadcn@latest add https://tweakcn.com/r/themes/cmlva2weo000104jr85nt08re` |
| **Roteamento** | TanStack Router | File-based routing com parâmetros e buscas tipadas |
| **Data Fetching** | TanStack Query (React Query) | v5 com cache, refetch reativo e polling inteligente |
| **Tabelas** | TanStack Table | v8 para listagens complexas com paginação e filtros |
| **Estado Transitório** | Zustand | v5 para stores leves (ex.: player ativo, rascunho de edições) |
| **Formulários & Schemas**| React Hook Form + Zod | Validação automática refletindo os modelos Pydantic do backend |
| **Notificações** | Sonner | Toasts modernos acessíveis e tematizados |
| **Ícones** | Lucide React | Consistência visual em todo o app |
| **Testes** | Vitest + React Testing Library | Cobertura unitária e de integração de componentes |

---

## 3. Diretrizes e Regras Arquiteturais Inegociáveis

### 3.1. Convenção Estrita de Features (Padrão `engancha-web`)
Cada funcionalidade do sistema é encapsulada em um módulo autônomo dentro de `src/features/<feature>/`:

```text
src/features/<feature>/
├── views/       # Composição da página/fluxo da feature. NÃO faz fetch, NÃO conhece apiFetch.
├── components/  # Componentes de apresentação locais. Recebem dados e callbacks via props.
├── hooks/       # TanStack Query (useQuery, useMutation), polling e orquestração de estado.
├── services/    # Chamadas HTTP (Axios), definição de queryKeys e helpers de invalidação.
└── data/        # Schemas Zod, tipos TypeScript inferidos e constantes sem efeitos colaterais.
```

#### Regras Obrigatórias de Dependência entre Camadas:
- **Rotas (`src/routes/`)** importam **exclusivamente** a `view` pública da feature. Jamais montam layout ou chamam serviços.
- **`views/`** compõe os `components/` e invoca os `hooks/`. Ela não conhece detalhes de transporte HTTP.
- **`components/`** são puramente apresentacionais ou locais. Nunca importam serviços de API diretamente.
- **`hooks/`** concentram a adaptação de dados. Toda `mutation` deve invalidar as `queryKeys` correspondentes declaradas em seu `services/`.
- **`services/`** é o **único** ponto de contato com o cliente HTTP (`api-client.ts`). Nenhuma outra camada deve fazer requisições diretas.
- **`data/`** não possui efeitos colaterais: abriga schemas Zod, tipos derivados (`z.infer`), mapeamentos e opções estáticas.

---

### 3.2. Regra Irrevogável: Shadcn-First

> **Mandato:** Todo elemento de interface deve utilizar obrigatoriamente um componente do **shadcn/ui** (`src/components/ui/`). O desenvolvimento de componentes customizados só é tolerado quando for tecnicamente impossível expressar a funcionalidade com os primitivos existentes.

#### Mapeamento de Primitivos Mandatórios:
- **Botões:** `Button` (variantes `default`, `secondary`, `destructive`, `ghost`, `outline`).
- **Formulários:** `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`.
- **Entradas:** `Input`, `Textarea`, `Select`, `RadioGroup`, `Checkbox`, `Switch`.
- **Diálogos:** `Dialog`, `AlertDialog`, `Sheet` (drawers laterais para painéis de edição/filtro).
- **Navegação & Contexto:** `DropdownMenu`, `Popover`, `Tabs`, `Tooltip`.
- **Status & Indicadores:** `Badge`, `Progress`, `Skeleton` (para estados de carregamento).
- **Containers:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
- **Feedback:** `Sonner` estilizado conforme o tema TweakCN.

#### Protocolo para Componentes Customizados (Exceções):
Aplica-se unicamente a elementos sem equivalente no shadcn, como:
- Player de vídeo vertical 9:16 com grid de guias seguras (safe zones).
- Linha do tempo interativa de trimming/corte com waveform de áudio.

**Regras para componentes customizados:**
1. **Composição interna com Shadcn:** Controles do player (play/pause, volume, timeline) **devem** ser compostos por `Button`, `Slider` e `Switch` do shadcn.
2. **Uso estrito de tokens do tema:** Proibido o uso de cores hexadecimais hardcoded. Usar sempre classes semânticas do tema (`bg-card`, `border-border`, `text-card-foreground`, `ring-ring`).
3. **Localização:** Componentes compartilhados globais ficam em `src/components/shared/`; componentes específicos de uma tela ficam em `features/<feature>/components/`.

---

## 4. Estrutura Completa de Diretórios Proposta

```text
web/
├── src/
│   ├── api/
│   │   ├── client.ts                 # Instância tipada do Axios com baseURL (/api) e interceptors
│   │   └── handle-api-error.ts       # Tratamento centralizado de erros do FastAPI e emissão de toasts
│   │
│   ├── components/
│   │   ├── ui/                       # Catálogo oficial do Shadcn UI gerado via CLI
│   │   └── shared/                   # Componentes compartilhados (AppSidebar, TopNav, SafeZoneOverlay)
│   │
│   ├── features/
│   │   ├── viral-studio/             # ⭐ MÓDULO CENTRAL DO VIRALFORGE
│   │   │   ├── views/
│   │   │   │   ├── viral-studio-view.tsx    # Dashboard principal de lotes e estatísticas
│   │   │   │   └── batch-detail-view.tsx    # Visão detalhada de um lote (grid de vídeos/itens)
│   │   │   ├── components/
│   │   │   │   ├── batch-card.tsx
│   │   │   │   ├── batch-status-badge.tsx
│   │   │   │   ├── create-batch-dialog.tsx  # Modal com upload de cookies e entrada de URLs
│   │   │   │   ├── item-card.tsx            # Card de vídeo com preview, status e badges
│   │   │   │   ├── item-telemetry-badge.tsx # Indicadores de modelo de IA, tokens e duração
│   │   │   │   └── retry-item-dialog.tsx    # Diálogo para reprocessamento com outro prompt/modelo
│   │   │   ├── hooks/
│   │   │   │   ├── use-batches.ts           # Query de listagem de lotes
│   │   │   │   ├── use-batch-detail.ts      # Query detalhada com refetchInterval inteligente
│   │   │   │   ├── use-create-batch.ts      # Mutation de ingestão de lote
│   │   │   │   └── use-retry-item.ts        # Mutation para retentar job de item falhado
│   │   │   ├── services/
│   │   │   │   ├── viral-studio.api.ts      # Endpoints: /api/viral-studio/batches, /items, /retry
│   │   │   │   └── viral-studio.keys.ts     # Query keys: ['batches'], ['batch', id]
│   │   │   └── data/
│   │   │       ├── batch.schema.ts          # Schemas Zod de validação
│   │   │       └── batch.types.ts           # Tipos TypeScript inferidos
│   │   │
│   │   ├── viral-editor/             # ✂️ EDITOR DE CONTEÚDO E GANCHO VIRAL
│   │   │   ├── views/
│   │   │   │   └── viral-edit-dialog.tsx    # Modal orquestrador da edição (substitui o arquivo de 1000 linhas)
│   │   │   ├── components/
│   │   │   │   ├── video-preview.tsx        # Player 9:16 com botões shadcn
│   │   │   │   ├── hook-selector.tsx        # Carrossel/lista dos ganchos sugeridos pela IA
│   │   │   │   ├── copy-editor-form.tsx     # Edição de legenda, CTA e link de afiliado
│   │   │   │   ├── subtitle-styler.tsx      # Configuração visual de legendas dinâmicas
│   │   │   │   └── audio-mixer.tsx          # Controle de volume original vs música de fundo
│   │   │   ├── hooks/
│   │   │   │   ├── use-item-editor.ts       # Controle de formulário com RHF + Zod
│   │   │   │   └── use-render-item.ts       # Mutation para gerar novo vídeo renderizado
│   │   │   ├── services/
│   │   │   │   └── viral-editor.api.ts      # Endpoints de preview e renderização
│   │   │   └── data/
│   │   │       └── editor.schema.ts
│   │   │
│   │   ├── discovery/                # 🔎 DESCOBERTA MULTIPLATAFORMA DE TENDÊNCIAS
│   │   │   ├── views/
│   │   │   │   └── discovery-view.tsx       # Exploração por palavra-chave e tendências
│   │   │   ├── components/
│   │   │   │   ├── discovery-search-bar.tsx
│   │   │   │   ├── platform-filter-tabs.tsx # Tabs shadcn: Todos, TikTok, Instagram, YouTube
│   │   │   │   ├── trend-video-grid.tsx
│   │   │   │   ├── trend-card.tsx           # Métricas de engajamento e cálculo de viral score
│   │   │   │   └── import-to-batch-modal.tsx# Ação para transformar vídeos descobertos em lote
│   │   │   ├── hooks/
│   │   │   │   ├── use-discovery-search.ts
│   │   │   │   └── use-import-trends.ts
│   │   │   ├── services/
│   │   │   │   └── discovery.api.ts         # Endpoint /api/discovery/search
│   │   │   └── data/
│   │   │       └── discovery.types.ts
│   │   │
│   │   ├── pipeline-clips/           # 📼 PIPELINE TRADICIONAL DE CORTES (LEGADO REFATORADO)
│   │   │   ├── views/
│   │   │   │   ├── create-clip-view.tsx     # Submissão de link longo (YouTube/upload)
│   │   │   │   └── clip-history-view.tsx    # Histórico de jobs legados
│   │   │   ├── components/
│   │   │   │   ├── source-input-form.tsx
│   │   │   │   ├── clip-recipe-card.tsx
│   │   │   │   └── clip-results-grid.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-clip-jobs.ts
│   │   │   └── services/
│   │   │       └── clip-jobs.api.ts
│   │   │
│   │   └── settings/                 # ⚙️ CONFIGURAÇÕES DO SISTEMA E IA
│   │       ├── views/
│   │       │   └── settings-view.tsx
│   │       ├── components/
│   │       │   ├── api-keys-card.tsx        # Chaves Gemini, Deepgram, ElevenLabs
│   │       │   ├── ai-models-card.tsx       # Seletor de modelos locais (Ollama) e cloud
│   │       │   ├── cookies-manager-card.tsx # Upload de cookies por plataforma
│   │       │   └── hardware-status-card.tsx # Telemetria de GPU (CUDA/ROCm) vs CPU
│   │       ├── hooks/
│   │       │   ├── use-settings.ts
│   │       │   └── use-update-settings.ts
│   │       └── services/
│   │           └── settings.api.ts          # Endpoints /api/config
│   │
│   ├── routes/                       # TanStack Router (File-based routing)
│   │   ├── __root.tsx                # Shell raiz: ThemeProvider, QueryClientProvider, Toaster
│   │   ├── _app.tsx                  # Layout padrão com Sidebar e TopNav
│   │   ├── _app/
│   │   │   ├── viral-studio/
│   │   │   │   ├── index.tsx         # Rota /viral-studio
│   │   │   │   └── $batchId.tsx      # Rota /viral-studio/:batchId
│   │   │   ├── discovery.tsx         # Rota /discovery
│   │   │   ├── clips.tsx             # Rota /clips
│   │   │   └── settings.tsx          # Rota /settings
│   │   └── index.tsx                 # Redireciona para /viral-studio
│   │
│   ├── stores/                       # Zustand Stores
│   │   ├── app-store.ts              # Preferências de interface e sidebar colapsada
│   │   └── player-store.ts           # Vídeo atualmente em reprodução ativa
│   │
│   └── styles/
│       ├── index.css                 # Importação do Tailwind v4 e resets
│       └── theme.css                 # Tokens CSS do tema TweakCN
```

---

## 5. Fases de Execução da Migração e Status Atual

```mermaid
flowchart LR
    Fase0["✅ Fase 0: Setup & Theme"] --> Fase1["✅ Fase 1: Shell, Router & Testes"]
    Fase1 --> Fase2["🎯 Fase 2: Viral Studio Core (ATUAL)"]
    Fase2 --> Fase3["⏳ Fase 3: Viral Editor"]
    Fase3 --> Fase4["⏳ Fase 4: Discovery"]
    Fase4 --> Fase5["⏳ Fase 5: Clips & Settings"]
    Fase5 --> Fase6["⏳ Fase 6: Homologação & Docker"]

    classDef completed fill:#059669,stroke:#10b981,color:#ffffff;
    classDef current fill:#2563eb,stroke:#60a5fa,color:#ffffff,stroke-width:3px;
    classDef pending fill:#374151,stroke:#4b5563,color:#9ca3af;

    class Fase0,Fase1 completed;
    class Fase2 current;
    class Fase3,Fase4,Fase5,Fase6 pending;
```

---

### ✅ Fase 0: Inicialização do Projeto & Design System [CONCLUÍDO]
- [x] Inicializar o projeto `web/` com Vite 8, React 19 e TypeScript (`vite.config.ts`, `tsconfig.json`).
- [x] Configurar o Tailwind CSS v4 (`@import 'tailwindcss';` e `@import 'tw-animate-css';`).
- [x] Injetar o tema do TweakCN em `src/styles/index.css` e `theme.css`.
- [x] Instalar o catálogo completo de **43 componentes do Shadcn UI** sob `src/components/ui/`.
- [x] Configurar `api-client.ts` com Axios e `query-client.ts` com TanStack Query v5.
- [x] Configurar ESLint 9 estrito com regras idênticas ao `engancha-web` (max 80 linhas/func, max 200 linhas/comp, `react/no-multi-comp`, `singleAttributePerLine`).

---

### ✅ Fase 1: Shell da Aplicação, Roteamento & Infra de Testes [CONCLUÍDO]
- [x] Configurar o TanStack Router com árvore de rotas automatizada (`routeTree.gen.ts`).
- [x] Implementar o layout `_app.tsx` com `AppSidebar` (Shadcn Sidebar-01 oficial, largura ícone `4.25rem` ajustada, botões quadrados `size-10`) e `TopNav` com Breadcrumbs dinâmicos.
- [x] Adicionar o `Toaster` do Sonner tematizado no `__root.tsx`.
- [x] Configurar a **Pirâmide de Testes**:
  - Vitest + JSDOM + `@vitest/coverage-v8` (threshold global 75%).
  - MSW v2 (`src/test-utils/server.ts`) e helper de renderização (`src/test-utils/render.tsx`).
  - Playwright (`tests/e2e/`) configurado na porta `5176`.
  - Documentação oficial de testes criada em [`docs/estrategia-de-testes.md`](file:///home/luis/repositories/viralforge/docs/estrategia-de-testes.md).
  - 15 testes unitários/integração passando com **94.33% de cobertura**.

---

### 🎯 Fase 2: Viral Studio Core (Lotes e Itens) [EM ANDAMENTO / PRÓXIMA]
- [ ] **Camada de Dados & Serviços:**
  - [ ] Criar schemas Zod em `features/viral-studio/data/batch.schema.ts` e tipos em `batch.types.ts`.
  - [ ] Criar client de API em `features/viral-studio/services/viral-studio.api.ts` conectando aos endpoints `/api/viral-studio/batches`, `/api/viral-studio/batches/{id}`, `/items` e `/retry`.
  - [ ] Declarar chaves de cache em `features/viral-studio/services/viral-studio.keys.ts`.
- [ ] **Hooks TanStack Query:**
  - [ ] Criar `use-batches.ts` (listagem de lotes com polling e cache).
  - [ ] Criar `use-batch-detail.ts` (detalhes do lote com auto-refetch de jobs em andamento).
  - [ ] Criar `use-create-batch.ts` (mutação com invalidação de cache).
  - [ ] Criar `use-retry-item.ts` (mutação para reprocessamento de itens com falha).
- [ ] **Componentes Shadcn da Feature:**
  - [ ] `batch-card.tsx`: Card de apresentação de cada lote com progresso e status.
  - [ ] `batch-status-badge.tsx`: Badge semântico de status (`completed`, `processing`, `failed`, `idle`).
  - [ ] `create-batch-dialog.tsx`: Modal Shadcn para criação de lote (input de URLs e upload de cookies).
  - [ ] `item-card.tsx`: Card de vídeo com preview, ganchos identificados e status.
  - [ ] `item-telemetry-badge.tsx`: Indicadores de modelo de IA, tokens e duração.
  - [ ] `retry-item-dialog.tsx`: Diálogo para reprocessar item com novo modelo/prompt.
- [ ] **Views & Rotas:**
  - [ ] Implementar `features/viral-studio/views/viral-studio-view.tsx` (Dashboard de lotes).
  - [ ] Implementar `features/viral-studio/views/batch-detail-view.tsx` (Grid de itens do lote `/viral-studio/$batchId`).
  - [ ] Conectar as rotas `src/routes/_app/viral-studio/index.tsx` e `src/routes/_app/viral-studio/$batchId.tsx`.
- [ ] **Testes de Integração & Mocks:**
  - [ ] Criar handlers MSW em `features/viral-studio/mocks/handlers.ts`.
  - [ ] Implementar testes de componentes e views com `renderWithProviders`.

---

### ⏳ Fase 3: Viral Editor (Decomposição do Modal Monolítico) [PENDENTE]
- [ ] Decompor o arquivo legado de 1.000 linhas (`ViralEditModal.jsx`) em componentes atômicos:
  - [ ] `video-preview.tsx` (player vertical 9:16 com controles Shadcn).
  - [ ] `hook-selector.tsx` (cards de seleção de ganchos virais detectados pela IA).
  - [ ] `copy-editor-form.tsx` (edição de legenda, hashtags, CTA e link de afiliado).
  - [ ] `subtitle-styler.tsx` (seletor de tipografia, cores e animação de legendas).
  - [ ] `audio-mixer.tsx` (slider de mixagem de volume original vs música de fundo).
- [ ] Implementar `use-item-editor.ts` com React Hook Form + Zod.
- [ ] Conectar mutation de renderização com feedback em tempo real via Sonner.

---

### ⏳ Fase 4: Descoberta Multiplataforma de Tendências [PENDENTE]
- [ ] Implementar `features/discovery/` com integração ao endpoint `/api/discovery/search`.
- [ ] Criar barra de busca unificada por hashtag/palavra-chave e filtros por plataforma (TikTok, Instagram, YouTube).
- [ ] Implementar card de tendências com métricas de engajamento e cálculo de viral score.
- [ ] Implementar ação de importação direta para lote do Viral Studio.

---

### ⏳ Fase 5: Pipeline Tradicional de Cortes & Configurações [PENDENTE]
- [ ] Migrar submissão de vídeos longos para cortes (`features/pipeline-clips/`).
- [ ] Implementar a tela de configurações (`features/settings/`):
  - [ ] Gerenciamento seguro de API keys (Gemini, Deepgram, ElevenLabs).
  - [ ] Seletor de modelos de IA locais (Ollama) e cloud (Gemini).
  - [ ] Upload de cookies de autenticação por plataforma.
  - [ ] Monitor de telemetria de hardware (GPU vs CPU).

---

### ⏳ Fase 6: Homologação, E2E & Substituição no Docker [PENDENTE]
- [ ] Execução completa da suíte de testes unitários, integração e E2E Playwright.
- [ ] Atualizar `docker-compose.yml` e `Dockerfile` para o build do novo `web/`.
- [ ] Validar containers em desenvolvimento e produção.
- [ ] Descomissionar e arquivar o diretório legado `dashboard/`.

---

## 6. Critérios de Aceite & Checklist Global de Qualidade

- [x] **Zero linhas de CSS global ad-hoc:** 100% Tailwind v4 e variáveis semânticas TweakCN.
- [x] **100% Shadcn-First:** 43 componentes oficiais instalados sob `@/components/ui/`.
- [x] **Infraestrutura de Testes Conforme Pirâmide:** Vitest + MSW v2 + Playwright com cobertura >75%.
- [ ] **Zero `any` em TypeScript:** Todos os contratos tipados via schemas Zod nas features.
- [ ] **Nenhum arquivo com mais de 300 linhas:** Decomposição estrita em `views/`, `components/`, `hooks/`, `services/`.
- [ ] **Cache Reativo TanStack Query:** Transições fluidas sem refetches redundantes ou telas brancas.
- [ ] **Paridade Funcional Completa:** 100% das features migradas e validadas.
