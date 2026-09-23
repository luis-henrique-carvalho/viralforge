# Mapa de Fluxos de Ponta a Ponta — ViralForge

> **Documento de Arquitetura Unificada de Fluxos e Jornadas do Usuário**  
> **Fontes & Referências:**  
> - [`docs/plano-migracao-frontend.md`](plano-migracao-frontend.md) (Arquitetura React 19 + TanStack Router + Shadcn)  
> - [`docs/publicacao-e-fila-continua.md`](publicacao-e-fila-continua.md) (Fila Contínua & Ports and Adapters)  
> - [`docs/viral-studio-template-architecture.md`](viral-studio-template-architecture.md) (Templates Desacoplados, Konva & GenerationTasks)  
> - [`docs/adr/0001-ports-and-adapters-publishing.md`](adr/0001-ports-and-adapters-publishing.md)  
> - [`docs/adr/0002-decoupled-templates-personas-konva.md`](adr/0002-decoupled-templates-personas-konva.md)  
> - [`CONTEXT.md`](../CONTEXT.md) (Vocabulário Ubíquo de Domínio)  
> **Status:** Aprovado  
> **Data:** Setembro de 2026  

---

## 1. Visão Holística do Sistema: O Ciclo de Vida do Conteúdo

O **ViralForge** é uma plataforma automatizada de ponta a ponta para produção e distribuição de vídeos curtos verticais (9:16). O fluxo operacional une inteligência multimodal de IA, composição gráfica precisa (Pillow + FFmpeg), curadoria visual humana e agendamento contínuo em redes sociais (TikTok, Instagram Reels e YouTube Shorts).

```mermaid
flowchart TD
    subgraph F1["1. DESCOBERTA & INGESTÃO"]
        D1["Busca Multiplataforma (/discovery)"] --> D2["Cálculo de Viral Score"]
        D2 --> D3["Criação de Lote (/viral-studio)"]
        D3 --> D4["Download yt-dlp + Transcrição + Keyframes"]
    end

    subgraph F2["2. TEMPLATE & IA MODULAR"]
        T1["Seleção de VisualTemplate"] --> T2["Geometria do Canvas (Konva 9:16)"]
        T1 --> T3["Lista de GenerationTasks Ativas"]
        T3 --> T4["CopyEngine: JSON Schema Sob Demanda"]
    end

    subgraph F3["3. RENDERIZAÇÃO & COMPOSIÇÃO"]
        R1["Pillow: Overlay 1080x1920 (Avatar, Badge, Headline)"]
        R2["FFmpeg: Enquadramento, Bordas Arredondadas & Extra Image"]
        R1 & R2 --> R3["Mídia Renderizada (1080x1920 MP4, YUV420p)"]
    end

    subgraph F4["4. CURADORIA & REVISÃO"]
        E1["Visão do Lote (/viral-studio/:batchId)"] --> E2["ViralEditDialog (Hero-First)"]
        E2 --> E3["Escolha de Headline / Edição de Legenda / Trimming"]
        E3 --> E4["Aprovação Individual ou em Massa (APPROVED)"]
    end

    subgraph F5["5. PUBLICAÇÃO & FILA CONTÍNUA"]
        P1["BulkActionsBar ('Publicar')"] --> P2["ViralPublishDialog"]
        P2 --> P3["Auto-Chaining Slots (Sem Colisão de Horários)"]
        P3 --> P4["Despacho SocialPublisherPort (Zernio / Nativo / Mock)"]
        P4 --> P5["Painel de Gestão da Fila (/publishing)"]
    end

    F1 --> F2 --> F3 --> F4 --> F5
```

---

## 2. Detalhamento dos 5 Grandes Fluxos de Ponta a Ponta

---

### FLUXO 1: Descoberta de Tendências & Ingestão de Lotes

**Objetivo:** Capturar mídias de alto potencial viral das redes ou permitir uploads locais, gerando um `ViralBatch` com contexto auditável.

```mermaid
sequenceDiagram
    autonumber
    actor Criador as Criador de Conteúdo
    participant Discovery as /discovery (DiscoveryView)
    participant Studio as /viral-studio (BatchView)
    participant API as FastAPI Ingestion Router
    participant Worker as Download & Context Pipeline

    Criador->>Discovery: Pesquisa por palavra-chave ou hashtag em tendências
    Discovery-->>Criador: Grid de vídeos com métricas (views, likes) e Viral Score
    Criador->>Discovery: Seleciona vídeos e clica em "Importar para Lote"
    Discovery->>Studio: Abre CreateBatchDialog com URLs pré-preenchidas
    Criador->>Studio: Define Brand, VisualTemplate e Modelo de IA (Gemini / Ollama)
    Criador->>Studio: Confirma criação do lote
    Studio->>API: POST /api/viral-studio/batches (URLs, brand_id, template_id, model)
    API->>Worker: Dispara background job de ingestão assíncrona
    Worker->>Worker: Download via yt-dlp (preservando metadados originais)
    Worker->>Worker: Extração de áudio mono-16kHz FLAC + Transcrição (Whisper/Deepgram)
    Worker->>Worker: Extração de keyframes JPEG (amostras visuais a ~512px)
    Worker-->>Studio: Atualiza status dos itens de DOWNLOADING para ANALYZING
```

* **Protótipos & Telas Relacionadas:**
  - `web/src/features/discovery/views/discovery-view.tsx`
  - `web/src/features/viral-studio/components/create-batch-dialog.tsx`
* **Invariantes do Fluxo:**
  - Modelos locais (Ollama / LM Studio) utilizam transcrição Whisper em CPU para evitar esgotamento de VRAM da GPU.
  - As URLs recebem validação estrita anti-SSRF antes do disparo do yt-dlp.

---

### FLUXO 2: Design de Templates & Contrato de IA (`TemplateStudio`)

**Objetivo:** Permitir ao criador configurar visualmente o layout 9:16 (vídeo, molduras, rodapé) e definir exatamente o que a IA deve gerar através de tarefas modulares (`GenerationTask`).

```mermaid
flowchart TD
    subgraph UI["TemplateStudio (Modal de Edição de Templates)"]
        Tab1["Aba 1: Visual & Layout (Konva 9:16)"]
        Tab2["Aba 2: Persona & Tarefas de IA"]
    end

    subgraph VisualEngine["Configuração Visual (Espaço Canônico 1080x1920)"]
        V1["Posição e Altura do Vídeo (400-1500px com Handles)"]
        V2["Proporções Rápidas (1:1, 4:5, 16:9, Livre)"]
        V3["Bordas (0-48px), Espessura e Efeitos de Sombra/Glow"]
        V4["Camada Extra de Imagem / Rodapé (Upload PNG ou 4 Cards)"]
        V5["Headline e Selo: Camadas Móveis com Snap Guide (X=540px)"]
    end

    subgraph AIEngine["Configuração Editorial & GenerationTasks"]
        A1["Nicho e Objetivo de Conversão (engagement vs affiliate)"]
        A2["Persona Role e Tom de Voz"]
        A3["Catálogo de Tarefas (+ Adicionar Tarefa de IA)"]
        A4["Headline no Vídeo, Legenda Completa, Título, Enquete, Imagem IA"]
        A5["Interpolação de Tags ({transcript}, {brand_name}, {cta})"]
    end

    Tab1 --> VisualEngine
    Tab2 --> AIEngine
    VisualEngine & AIEngine --> Contract["Contrato VisualTemplate Salvo no Store"]
```

* **Protótipos de Validação:**
  - **Mecânica Visual:** [`docs/prototypes/viral-studio-template-simulation.html`](prototypes/viral-studio-template-simulation.html)
  - **Tarefas Modulares de IA:** [`docs/prototypes/dynamic-generation-tasks-simulation.html`](prototypes/dynamic-generation-tasks-simulation.html)
* **Invariantes do Fluxo:**
  - Se a tarefa `canvas_headline` for desativada, o vídeo entra no modo limpo e a IA não gasta tokens gerando manchetes.
  - Se `conversion_goal == "engagement"`, códigos de afiliados e links de bio são terminantemente proibidos no prompt.

---

### FLUXO 3: Execução de IA & Composição de Mídia (`CopyEngine` + `Renderer`)

**Objetivo:** Transformar a transcrição e os keyframes do vídeo em conteúdo de alta conversão e renderizar o arquivo final 1080×1920 com paridade matemática.

```mermaid
sequenceDiagram
    autonumber
    participant Orch as ViralStudioOrchestrator
    participant Copy as CopyEngine (viral_studio_copy.py)
    participant LLM as Provedor de IA (Gemini / Ollama)
    participant Renderer as VisualRenderer (viral_studio_renderer.py)
    participant FFmpeg as Motor FFmpeg + Pillow

    Orch->>Copy: generate_viral_copy(template, brand, item, context)
    Copy->>Copy: Inspeciona template.generation_tasks
    Copy->>Copy: Monta prompt dinâmico interpolando {transcript} e contexto
    Copy->>Copy: Constrói JSON Schema exigindo apenas tarefas ativas
    Copy->>LLM: Envia prompt + keyframes JPEG multimodal
    LLM-->>Copy: Resposta JSON bruta
    Copy->>Copy: Executa cadeia de JSON Repair em 5 níveis
    Copy->>Copy: Mapeia saídas para AICopyData (headlines, caption, custom_outputs)
    Copy-->>Orch: Retorna AICopyData estruturado
    
    Orch->>Renderer: render_viral_video(source, brand, template, headline, output)
    Renderer->>FFmpeg: Pillow desenha overlay transparente (Avatar, Selo em badge_y, Headline em headline_y)
    Renderer->>FFmpeg: FFmpeg processa máscara arredondada do vídeo e borda colorida
    Renderer->>FFmpeg: Sobrepõe card/imagem de rodapé em (extra_image_x, extra_image_y)
    Renderer->>FFmpeg: Encodamento final: libx264, YUV420p (macroblocks pares), áudio AAC
    FFmpeg-->>Renderer: Arquivo final .mp4 gerado
    Renderer-->>Orch: Sucesso (Atualiza status para READY_FOR_REVIEW)
```

* **Costuras do Backend:**
  - `clippyme.domain.viral_studio_copy.generate_viral_copy`
  - `clippyme.domain.viral_studio_renderer.render_viral_video`
* **Invariantes do Fluxo:**
  - Todas as coordenadas de corte e escala geradas no FFmpeg passam pela correção par mandatória: `coord - (coord % 2)`.
  - Falhas de execução da IA ou do subprocesso FFmpeg transitam o item para `FAILED` com telemetria detalhada de erro, evitando itens congelados.

---

### FLUXO 4: Curadoria, Edição de Gancho & Revisão (`ViralEditDialog`)

**Objetivo:** Permitir ao criador inspecionar o vídeo final, selecionar entre as 5 manchetes geradas pela IA, ajustar a legenda e aprovar o item.

```mermaid
flowchart TD
    subgraph Grid["Visão do Lote (/viral-studio/:batchId)"]
        Card["ItemCard (Vídeo Hero-First com status pill e frosted-glass badges)"]
    end

    subgraph Dialog["ViralEditDialog (Substituição Modular do Monólito)"]
        P1["Player de Vídeo 9:16 com Safe Zones"]
        P2["Carrossel de Ganchos/Headlines Sugeridos pela IA"]
        P3["Editor de Legenda, CTA e Hashtags"]
        P4["Abas de Observabilidade (Sinais, Telemetria LLM, Linha do Tempo)"]
        P5["Trimming Interativo de Silêncios (SmartCut)"]
    end

    subgraph Actions["Ações de Decisão"]
        ActApprove["Aprovar Vídeo (Transita para APPROVED)"]
        ActRerender["Editar Headline & Re-renderizar (Rápido, sem nova chamada de IA)"]
        ActRetry["Retentar Item com Outro Modelo/Prompt"]
    end

    Card -->|Clique para inspecionar| Dialog
    Dialog --> ActApprove
    Dialog --> ActRerender
    Dialog --> ActRetry
    ActApprove --> BatchReady["Item pronto para publicação"]
```

* **Diretrizes de Interface:**
  - **Vídeo como Hero:** Mídia sempre visível e sem sobrecarga de cabeçalhos duplos.
  - **Alinhamento Anti-Gap:** Grades de itens alinhadas ao topo (`items-start`), com botões e badges de ação ocupando slots simétricos de altura fixa (`h-8`).
* **Invariantes do Fluxo:**
  - Re-renderizar o vídeo para trocar de headline ou alterar o template não baixa o vídeo original novamente nem gasta créditos com a IA.

---

### FLUXO 5: Agendamento Inteligente com Fila Contínua & Publicação

**Objetivo:** Publicar vídeos aprovados nas redes sociais de forma contínua, sem colisões de horários e com desacoplamento de fornecedores externos.

```mermaid
sequenceDiagram
    autonumber
    actor User as Criador de Conteúdo
    participant BatchView as BatchDetailView (/viral-studio/:batchId)
    participant PubDialog as ViralPublishDialog
    participant Router as PublishingRouter (Domínio)
    participant Store as ViralStudioStore
    participant Adapter as SocialPublisherPort (Zernio / Nativo / Mock)
    participant QueueView as /publishing (Fila de Postagens)

    User->>BatchView: Seleciona N vídeos aprovados e clica em "Publicar (N)"
    BatchView->>PubDialog: Abre diálogo com lista de vídeos selecionados
    PubDialog->>Router: GET /api/viral-studio/publishing/preview-slots?channel_id=...&count=N
    Router->>Store: get_next_available_slots(channel_id, count)
    Store->>Store: Calcula próximos horários livres (Auto-Chaining sem colisão)
    Store-->>Router: Retorna slots (ex: Seg 18:00, Ter 18:00, Qua 18:00)
    Router-->>PubDialog: Projeção transparente de datas/horários e canal
    User->>PubDialog: Revisa cronograma e clica em "Confirmar Agendamento"
    PubDialog->>Router: POST /api/viral-studio/publish (itens, channel_id)
    
    loop Para cada vídeo do lote
        Router->>Adapter: schedule(job) ou publish(job)
        Adapter-->>Router: Retorna PublicationReceipt imutável (com post_id externo)
        Router->>Store: Salva PublicationJob e marca item como SCHEDULED
        Router-->>PubDialog: Atualiza progresso em tempo real item a item
    end

    PubDialog-->>User: Sucesso com links dos agendamentos
    User->>QueueView: Navega para /publishing para gerenciar a fila consolidada
    QueueView->>Router: GET /api/viral-studio/publishing/queue
    Router-->>QueueView: Lista unificada de agendamentos com opções de reagendar e cancelar
```

* **Arquitetura de Portas e Adaptadores:**
  - **Porta:** `SocialPublisherPort` (definida no domínio).
  - **Adaptadores:** `ZernioPublisherAdapter` (oficial), `InternalPublisherAdapter` (futuro nativo), `MockPublisherAdapter` (testes offline).
* **Invariantes do Fluxo:**
  - Se um lote de 3 vídeos for agendado hoje (Seg, Ter, Qua às 18:00), o próximo lote para a mesma conta continuará automaticamente na Quinta às 18:00 (*Zero colisão*).
  - Em caso de esgotamento de quota ou HTTP 429 no provedor, o sistema reporta o erro transparente por item e oferece canal de fallback.

---

## 3. Matriz de Telas & Rotas do Novo Frontend (`web/src/routes/`)

A navegação entre os fluxos é unificada e tipada com **TanStack Router**:

| Rota | View / Feature | Papel no Fluxo | Ações Principais |
| :--- | :--- | :--- | :--- |
| **`/discovery`** | `DiscoveryView` | Fluxo 1: Descoberta de tendências | Busca por palavras/tags, filtro por rede, importar para lote. |
| **`/viral-studio`** | `ViralStudioView` | Fluxo 1 & 4: Gestão de lotes | Criar lote, visualizar cards de lotes com métricas agregadas. |
| **`/viral-studio/:batchId`** | `BatchDetailView` | Fluxo 4: Curadoria do lote | Grid hero-first de vídeos, filtro por status, seleção múltipla, abrir editor, botão "Publicar (N)". |
| **Modal / Dialog** | `ViralEditDialog` | Fluxo 4: Edição fina do item | Seleção de ganchos de IA, edição de cópia, trimming SmartCut, observabilidade de tokens. |
| **Modal / Dialog** | `TemplateStudio` | Fluxo 2: Estúdio de Templates | Canvas Konva 9:16 interativo, ajuste de altura e bordas, catálogo de tarefas de IA. |
| **Modal / Dialog** | `ViralPublishDialog`| Fluxo 5: Agendamento | Seletor de canal social, projeção de slots contínuos, disparo em tempo real. |
| **`/publishing`** | `PublishingQueueView`| Fluxo 5: Central da Fila | Histórico e calendário de agendamentos, filtros por canal, reagendamento e cancelamento. |
| **`/settings`** | `SettingsView` | Suporte Global | Configuração de chaves de IA (Gemini), provedores locais (Ollama), cookies e telemetria. |

---

## 4. Tabela de Estados do Vídeo (`ViralItem.status`)

Cada vídeo no sistema transita por uma máquina de estados estrita:

```
[DOWNLOADING] ──► [ANALYZING] ──► [READY_FOR_REVIEW] ──► [APPROVED] ──► [SCHEDULED] ──► [PUBLISHED]
       │                 │                  ▲                  │
       ▼                 ▼                  │                  ▼
    [FAILED]          [FAILED]         [Re-render]          [FAILED]
```

1. **`DOWNLOADING`**: yt-dlp realizando o download da mídia original em disco e salvando metadados.
2. **`ANALYZING`**: Transcrição de áudio, extração de keyframes, chamada ao `CopyEngine` e renderização preliminar no `VisualRenderer`.
3. **`READY_FOR_REVIEW`**: Vídeo renderizado com a headline inicial da IA, aguardando curadoria humana.
4. **`APPROVED`**: Vídeo revisado e aprovado pelo criador; habilitado para compor lotes de publicação.
5. **`SCHEDULED`**: Post agendado com data e hora reservada no algoritmo de fila contínua e registrado no provedor (`PublicationReceipt` emitido).
6. **`PUBLISHED`**: Post publicado com sucesso na plataforma social de destino.
7. **`FAILED`**: Falha com erro detalhado gravado na telemetria, habilitado para reprocessamento via `RetryItemDialog`.

---

## 5. Invariantes de Negócio & Qualidade de Código

1. **Invariante de Isolamento do Domínio:** Nenhuma classe de interface ou rota HTTP comunica diretamente com o SDK do Zernio ou APIs de redes sociais. Toda a publicação passa pelo `PublishingRouter` e pela porta `SocialPublisherPort`.
2. **Invariante de Pureza de Testes:** As regras de cálculo de slots de agendamento (`get_next_available_slots`) e a montagem de prompts (`build_viral_copy_prompt`) são puras e 100% testáveis no host via Vitest e Pytest sem acesso à internet.
3. **Invariante de Fidelidade Visual 1:1:** O que o criador vê no canvas 9:16 do `TemplateStudio` (coordenadas, moldura, escala, textos) é matematicamente equivalente à matriz de pixels processada pelo Pillow e FFmpeg no vídeo exportado.
4. **Invariante de Conformidade de Tema:** Todos os novos componentes de interface utilizam rigorosamente o catálogo Shadcn UI com variáveis semânticas do tema TweakCN (`tokens.css` + `app.css`). Proibido estilos inline ad-hoc com cores fora da paleta do projeto.

---

## 6. Fases de Execução e Roadmap de Implementação de Ponta a Ponta

Para materializar todos os fluxos com estabilidade, manutenibilidade e cobertura rigorosa de testes, a esteira de desenvolvimento é dividida em **Fases Sequenciais Coesas**, com distinção formal entre **V1 (Fechamento do Fluxo Essencial)** e **V2 (Evoluções Posteriores)**:

```mermaid
flowchart LR
    Fase0["✅ F0: Setup & Theme"] --> Fase1["✅ F1: Shell & Testes"]
    Fase1 --> Fase2["✅ F2: Batch Ingestion"]
    Fase2 --> Fase3["✅ F3: Viral Editor"]
    Fase3 --> Fase4["🎯 F4: Fila & Pub (FECHA V1)"]
    Fase4 -.-> Fase5["⏳ F5: Templates Konva (V2)"]
    Fase5 -.-> Fase6["⏳ F6: Fila Global /publishing (V2)"]
    Fase6 -.-> Fase7["⏳ F7: Discovery (V2)"]
    Fase7 -.-> Fase8["⏳ F8: Clips & Settings (V2)"]
    Fase8 -.-> Fase9["⏳ F9: Docker & Homolog (V2)"]

    classDef completed fill:#059669,stroke:#10b981,color:#ffffff;
    classDef current fill:#2563eb,stroke:#60a5fa,color:#ffffff,stroke-width:3px;
    classDef pending fill:#374151,stroke:#4b5563,color:#9ca3af;

    class Fase0,Fase1,Fase2,Fase3 completed;
    class Fase4 current;
    class Fase5,Fase6,Fase7,Fase8,Fase9 pending;
```

---

### ✅ Fases Concluídas (Fundação Sólida)

* **Fase 0 — Setup & Design System:** Vite 8, React 19, TypeScript estrito, Tailwind v4 e os 43 componentes do Shadcn UI integrados ao tema Dark Editorial Flat / TweakCN (`tokens.css` + `app.css`).
* **Fase 1 — Shell da Aplicação & Infraestrutura de Testes:** TanStack Router (`_app.tsx`), `AppSidebar`, `TopNav`, pirâmide de testes com Vitest, MSW v2 e Playwright (>90% de cobertura).
* **Fase 2 — Viral Studio Core (Ingestão de Lotes & Marcas):** Endpoints e hooks para `/batches`, `/items`, `CreateBatchDialog`, grid de lotes e persistência atômica com retrocompatibilidade garantida.
* **Fase 3 — Viral Editor Widescreen:** Desacoplamento do monólito em página dedicada (`/viral-studio/$id/items/$itemId`), hub de observabilidade em 3 abas, galeria de keyframes e seletor de ganchos da IA.

---

### 🎯 Fase 4: Publicação Inteligente & Fila Contínua (Zernio) [FASE ATUAL / EM EXECUÇÃO — FECHA V1]
> **Objetivo da Fase:** Fechar o fluxo do Viral Studio 100% de ponta a ponta na V1, conectando os vídeos aprovados à publicação imediata e agendamento em fila contínua sem colisões.  
> **Especificação Detalhada:** [`docs/publicacao-e-fila-continua.md`](publicacao-e-fila-continua.md)  
> **ADR de Decisão:** [`docs/adr/0001-ports-and-adapters-publishing.md`](adr/0001-ports-and-adapters-publishing.md)  
> **Metodologia:** `/codebase-design` (Módulos Profundos, Costuras e Dois Adaptadores)

* **Subfase 4.1: Arquitetura Hexagonal & Costura no Domínio (`SocialPublisherPort`)**
  - [ ] Implementar a porta abstrata `SocialPublisherPort` em `clippyme.domain.social_publisher_port`:
    - `publish(job: PublicationJob) -> PublicationReceipt`
    - `schedule(job: PublicationJob) -> PublicationReceipt`
    - `cancel(external_id: str) -> bool`
    - `get_status(external_id: str) -> PublicationReceipt`
  - [ ] Implementar a **Regra dos Dois Adaptadores (*Two Adapters Rule*)**:
    1. `ZernioPublisherAdapter`: adaptador de produção integrando `ZernioClient`, upload pré-assinado via streaming, conversão de payloads (TikTok, Instagram, YouTube) e tratamento de erros 429 com backoff.
    2. `MockPublisherAdapter`: adaptador determinístico em memória para testes offline e execução sem chave configurada.

* **Subfase 4.2: Motor Algorítmico de Fila Contínua (*Auto-Chaining Queue Engine*)**
  - [ ] Implementar a função pura `get_next_available_slots(account_id, count, preferred_time="18:00")` em `viral_studio_store.py`:
    - Consultar slots ocupados (`status == "SCHEDULED"`) para a conta social indicada.
    - Projetar slots futuros consecutivamente a partir do último horário ocupado sem colisão (ex: Seg 18:00, Ter 18:00; próximo lote começa na Qua 18:00).
    - Tratar viradas de mês, anos bissextos e preferências de dias da semana.
  - [ ] Implementar `cancel_item_schedule(item_id)` no store para cancelar o agendamento no provedor e retornar o item com segurança para `APPROVED`.

* **Subfase 4.3: Roteador e Endpoints da API Backend (`viral_studio_routes.py`)**
  - [ ] `GET /api/viral-studio/publishing/preview-slots?channel_id=...&count=N`: prévia em tempo real das datas/horários calculados antes da confirmação do usuário.
  - [ ] `POST /api/viral-studio/publish`: disparo transacional do lote para publicação ou agendamento via `SocialPublisherPort`.
  - [ ] `POST /api/viral-studio/publishing/{item_id}/cancel`: cancelamento no provedor externo e reversão do status para `APPROVED`.

* **Subfase 4.4: Interface do Usuário no Frontend (React 19 + Shadcn UI)**
  - [ ] Modal de Disparo `ViralPublishDialog.tsx`:
    - Seletor visual de contas conectadas (TikTok, Instagram, YouTube).
    - Modos: "Publicar Agora" (imediato) ou "Fila Inteligente Contínua" (1 post/dia às 18:00 sem colisão).
    - Tabela de projeção com preview transparente das datas e horários calculados para cada vídeo selecionado.
    - Painel em tempo real de disparo item a item com feedback de sucesso/falha e links gerados.
  - [ ] Pontos de Disparo no Lote e Editor:
    - `BulkActionsBar` (`batch-results-view.tsx`): botão "Publicar ({approvedCount})" ativado ao selecionar itens aprovados.
    - `ItemCard`: botão rápido de publicação individual para itens aprovados.
    - `ViralEditorBottomBar`: botão "Publicar Vídeo" para itens já aprovados.
  - [ ] Visualização de Status & Cancelamento no Lote:
    - Status pill `Agendado`: exibe *"Agendado para DD/MM às HH:MM"* com botão rápido para *"Cancelar Agendamento"*.
    - Status pill `Publicado`: exibe *"Publicado"* com link direto para o post.
    - `BatchFilterToolbar`: nova aba "Agendados / Publicados".

* **Subfase 4.5: Verificação e Testes de Host**
  - [ ] Testes unitários do backend (Pytest): `test_publishing_ports.py`, `test_auto_chaining.py` e `test_viral_studio_orchestrator.py`.
  - [ ] Testes de componentes no frontend (Vitest): `viral-publish-dialog.test.tsx`, `bulk-actions-bar.test.tsx` e `item-card.test.tsx`.

---

### ⏳ Fase 5: Estúdio de Templates Universais & IA Modular (Konva 9:16) [V2 — POSTERGADO]
> **Especificação Detalhada:** [`docs/viral-studio-template-architecture.md`](viral-studio-template-architecture.md)  
> **ADR de Decisão:** [`docs/adr/0002-decoupled-templates-personas-konva.md`](adr/0002-decoupled-templates-personas-konva.md)  
> **Protótipos Validados:** [`docs/prototypes/viral-studio-template-simulation.html`](prototypes/viral-studio-template-simulation.html) e [`docs/prototypes/dynamic-generation-tasks-simulation.html`](prototypes/dynamic-generation-tasks-simulation.html)

* **Backend (Schemas, Store, CopyEngine & Renderer):**
  - [ ] Implementar `GenerationTask` e atualizar `VisualTemplate` com 35+ campos (geometria 1080x1920, altura 400-1500px, bordas, rodapé e lista de `generation_tasks`).
  - [ ] Atualizar `AICopyData` com `custom_outputs: Dict[str, Any]` preservando retrocompatibilidade total.
  - [ ] Inicializar os 4 templates de fábrica universais no `viral_studio_store.py` (`curiosities-viral`, `classic-affiliate`, `quick-facts-news`, `tech-review`).
  - [ ] Refatorar `viral_studio_copy.py` (`CopyEngine`): montagem dinâmica de prompt por tarefas ativas, JSON Schema dinâmico sob demanda e desativação de manchetes em templates de vídeo limpo (*Clean Video Mode*).
  - [ ] Refatorar `viral_studio_renderer.py`: desenhar selo em `badge_y`, headline em `headline_y`, máscara de cantos arredondados (`video_radius`), moldura colorida e sobreposição do card/imagem extra de rodapé.
* **Frontend (TemplateStudio Workstation com `react-konva`):**
  - [ ] Criar o modal `TemplateEditorModal.tsx` dual-pane integrado aos componentes Shadcn e `react-konva`.
  - [ ] Implementar o canvas 1080×1920 com manipulação livre de camadas, alças verticais de altura do vídeo e guia magnética central (*Snap Guide*).
  - [ ] Implementar a aba "Persona & Tarefas de IA" com catálogo de blocos (+ Adicionar Tarefa de IA) e inserção de tags dinâmicas.

---

### ⏳ Fase 6: Central Dedicada de Fila e Calendário (`/publishing`) [V2 — POSTERGADO]
- [ ] Nova rota TanStack Router `_app/publishing.tsx` com link no menu `AppSidebar`.
- [ ] Painel gerencial com abas de status (Agendados, Publicados, Falhas) e filtros por canal/rede social.
- [ ] Visão em calendário mensal/semanal cross-batch com suporte a drag-and-drop para reagendamento manual.
- [ ] Endpoint `PATCH /api/viral-studio/publishing/{item_id}/reschedule`.

---

### ⏳ Fase 7: Descoberta Multiplataforma de Tendências (`/discovery`) [V2 — POSTERGADO]
- [ ] Endpoints `/api/discovery/search` e `/api/discovery/trending` (TikTok, Instagram Reels, YouTube Shorts).
- [ ] Cálculo algorítmico do **Viral Score**.
- [ ] Interface `DiscoveryView` com busca, filtros de engajamento e ação "Importar Selecionados para Lote".

---

### ⏳ Fase 8: Pipeline Tradicional de Cortes & Configurações Globais [V2 — POSTERGADO]
- [ ] Submissão de vídeos longos do YouTube para cortes automáticos 9:16 (`/clips`).
- [ ] Central de configurações `/settings` (gestão segura de API keys, IA local Ollama, cookies e telemetria de GPU).

---

### ⏳ Fase 9: Homologação Final, E2E & Substituição no Docker [V2 — POSTERGADO]
- [ ] Execução completa da suíte de testes automatizados (Pytest + Vitest).
- [ ] Testes E2E Playwright cobrindo a jornada completa: $\text{Lote} \longrightarrow \text{Editor} \longrightarrow \text{Aprovação} \longrightarrow \text{Publicação}$.
- [ ] Atualização do `Dockerfile` e `docker-compose.yml` para o build de produção do novo `web/`.
- [ ] Descomissionamento definitivo e arquivamento do diretório legado `dashboard/`.



