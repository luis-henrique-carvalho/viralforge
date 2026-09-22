# Fase 5: Painel de Configurações, Gestão de Provedores e Telemetria de Sistema (`/settings`)

**Status:** Especificação Arquitetural e Desenho de Domínio  
**Data:** 2026-09-22  
**Metodologias:** `/codebase-design` (Módulos Profundos, Costuras e Adaptadores) e `/domain-modeling` (Modelagem de Domínio e Linguagem Ubíqua)  
**Contexto:** Central de Governança, Credenciais de IA, Publicação Social, Cookies de Plataforma e Telemetria de Hardware

---

## 1. Visão Geral e Objetivos da Fase 5

A **Fase 5** da migração do ViralForge consolida a governança operacional e o controle de infraestrutura da aplicação sob a rota `/settings`. O objetivo é entregar um painel moderno, seguro e desacoplado, seguindo as diretrizes visuais do **Shadcn UI Settings** (menu lateral hierárquico à esquerda e painel modular à direita), conectando-se diretamente às garantias atômicas de persistência do backend (`data/config.json`).

### Escopo Funcional:
1. **Gestão de Provedores de Publicação Social (`PublishingProvider`)**:
   - Alternância entre provedores suportados (`zernio` | `mock`).
   - Gerenciamento seguro de chave de API (`ZERNIO_API_KEY`).
   - Descoberta automatizada de contas conectadas (`SocialChannel`) via API do provedor e mapeamento de identificadores de canal (TikTok, Instagram, YouTube).
2. **Modelos de IA & Credenciais Cloud (`AI & LLM Configuration`)**:
   - Chave de API do Google Gemini (`GEMINI_API_KEY`).
   - Seletor dinâmico do modelo padrão da IA (`gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-2.5-pro`).
   - Conexão e telemetria de LLMs locais: endpoints de base para Ollama (`OLLAMA_BASE_URL`) e LM Studio (`LM_STUDIO_BASE_URL`) com sondagem em tempo real de status online/offline e catálogo de modelos locais.
3. **Provedores de Transcrição & STT (`STT Providers`)**:
   - Seletor de provedor ativo (`deepgram` | `elevenlabs` | `whisper`).
   - Chaves de API dedicadas (`DEEPGRAM_API_KEY`, `ELEVENLABS_API_KEY`).
   - Token de autenticação HuggingFace (`HF_TOKEN`) para diarização pyannote no Whisper.
4. **Gerenciador de Cookies de Sessão (`PlatformSessionCookie`)**:
   - Upload atômico e validação de formato Netscape para plataformas de vídeo (YouTube, TikTok, Instagram) para mitigar *rate-limiting* e *captchas*.
   - Verificação e exibição do estado de configuração de cada plataforma com opção de remoção segura.
5. **Telemetria de Aceleração e Hardware (`HardwareTelemetry`)**:
   - Sondagem de aceleração computacional no backend (NVIDIA CUDA / AMD ROCm/HIP / CPU).
   - Diagnóstico de VRAM disponível, RAM do sistema e seleção dinâmica de tamanho do modelo Whisper (`large-v3`, `medium`, `small`, `base`).
6. **Identidade de Marca e Customização (`BrandAsset`)**:
   - Upload e validação de logotipo d'água PNG transparente com canal alfa para a camada de composição.
   - Upload de fontes tipográficas customizadas (.ttf / .otf) com validação de assinatura sfnt.

---

## 2. Análise de Desenho de Código (`/codebase-design`)

Seguindo o vocabulário e os princípios do `/codebase-design`, o sistema de configurações é projetado em torno de **Módulos Profundos** (*Deep Modules*): interfaces compactas com comportamento substancial encapsulado, posicionadas em **Costuras** (*Seams*) limpas e altamente testáveis.

```
┌─────────────────────────────────────────────────────────────┐
│  Pequena Interface (Small Interface)                       │
│  - useSettings(): { config, hardware, cookies, zernio }     │
│  - useUpdateSettings(): { saveConfig, saveZernio, ... }     │
├─────────────────────────────────────────────────────────────┤
│  Implementação Profunda (Deep Implementation)               │
│  - Mascaramento e proteção contra vazamento de segredos     │
│  - Escrita atômica em disco (mkstemp + fsync + chmod 0600)  │
│  - Validação estrutural de arquivos (Netscape, PNG, SFNT)   │
│  - Resolução dinâmica de adaptadores de publicação e áudio  │
│  - Sondagem não-bloqueante de GPUs e LLMs locais            │
└─────────────────────────────────────────────────────────────┘
```

### 2.1. Definição das Costuras (*Seams*)

O sistema é dividido em 4 costuras principais:

#### Costura 1: O Contrato do Store de Configuração (`config_store.py`)
- **Localização:** `clippyme.storage.config_store`.
- **Interface:**
  ```python
  def load_persistent_config() -> dict[str, Any]: ...
  def save_persistent_config(new_config: dict[str, Any]) -> bool: ...
  def load_zernio_config() -> dict[str, Any]: ...
  def save_zernio_config(api_key: str = None, accounts: dict = None, timezone: str = None) -> bool: ...
  ```
- **Profundidade:** O chamador simplesmente passa um dicionário de pares chave/valor. Internamente, o módulo:
  - Gerencia concorrência com `threading.RLock()`.
  - Escreve em arquivo temporário irmão com `os.fsync` antes do `os.replace` atômico para evitar corrupção em caso de crash.
  - Garante permissões restritas `0o600` para o arquivo e `0o700` para o diretório `data/`.
  - Normaliza variáveis legadas (`HUGGINGFACE_TOKEN` → `HF_TOKEN`).
  - Atualiza o `os.environ` em tempo real para sincronia com processos concorrentes.

#### Costura 2: Resolução de Provedor de Publicação (`SocialPublisherPort`)
- **Localização:** `clippyme.domain.social_publisher_port.get_social_publisher`.
- **Interface:**
  ```python
  def get_social_publisher(provider: Optional[str] = None) -> SocialPublisherPort: ...
  ```
- **Profundidade & Regra dos Dois Adaptadores (*Two Adapters Rule*):**
  A costura suporta dois adaptadores intercambiáveis:
  1. `ZernioPublisherAdapter`: Conecta à API externa com autenticação Bearer, upload assinado e verificação de status.
  2. `MockPublisherAdapter`: Adaptador em memória com execução determinística para testes e desenvolvimento offline.
  A adição de `PUBLISHING_PROVIDER` em `config.json` permite ao usuário no frontend escolher qual adaptador governa o sistema sem alterar uma linha do código dos orquestradores de lote.

#### Costura 3: Superfície de API e Segurança de Credenciais (`config_routes.py`)
- **Localização:** `clippyme.api.config_routes`.
- **Interface:**
  - `GET /api/config` (retorna chaves com mascaramento `AIza...4xyz`).
  - `POST /api/config` (atualiza chaves sanitizadas).
  - `GET /api/config/hardware` (expõe telemetria limpa de aceleração).
  - `GET /api/config/cookies/status`, `POST /api/config/cookies/{platform}`, `DELETE /api/config/cookies/{platform}`.
  - `GET /api/config/zernio`, `POST /api/config/zernio`, `GET /api/zernio/accounts`.
- **Profundidade:** Protegido pelo guard `require_trusted_config_request` (bloqueia origens não confiáveis e requisições CSRF), valida buffers e assinaturas mágicas antes de persistir em disco.

#### Costura 4: Consumo do Frontend no Web (`settings.api.ts` e Hooks)
- **Localização:** `web/src/features/settings/services/settings.api.ts` e `hooks/use-settings.ts`.
- **Interface:**
  - `settingsApi`: Objeto estático tipado com métodos assíncronos (`fetchConfig`, `updateConfig`, etc.).
  - `useSettings()`: Query agregada com cache inteligente do TanStack React Query.
  - `useUpdateSettings()`: Conjunto de mutações com tratamento de erros centralizado e feedback visual via Sonner.
- **Profundidade:** Oculta das telas e cards detalhes como endpoints de axios, headers HTTP, serialização de `FormData`, mapeamento de exceções e invalidação manual de chaves de cache.

### 2.2. O Teste de Deleção (*The Deletion Test*)
Se deletarmos o módulo `settings.api.ts` e seus hooks associados:
- A complexidade desaparece? **Não.**
- A complexidade reapareceria espalhada em cada card da interface: manipulação de `FormData`, endpoints literais `/api/config`, parsing de respostas de cookies e tratamento repetitivo de erros HTTP em 6 componentes visuais distintos.
- **Conclusão:** O módulo justifica amplamente sua existência oferecendo alta **Alavancagem** (*Leverage*) para as views e **Localidade** (*Locality*) para manutenções futuras.

---

## 3. Modelagem de Domínio (`/domain-modeling`)

O vocabulário operacional em torno das configurações de infraestrutura foi refinado e integrado ao [CONTEXT.md](file:///home/luis/repositories/viralforge/CONTEXT.md).

### 3.1. Glossário Ubíquo Adicionado

| Termo Canônico | Definição no Domínio | Termos a Evitar |
| :--- | :--- | :--- |
| **`SystemConfiguration`** | O agregado de dados operacionais persistido em disco (`data/config.json`) contendo chaves de provedores, seletores de motor e URLs base do ambiente. | AppSettings, EnvVars, GlobalPreferences |
| **`CredentialVault`** | A barreira de segurança e política de mascaramento que garante que segredos (tokens, API keys) nunca sejam expostos em texto pleno para clientes web e sejam lidos/gravados de forma atômica. | KeyStore, PasswordManager, SecretHolder |
| **`ProviderSelector`** | A diretiva de configuração que define o adaptador de provedor em execução ativa no sistema para uma capacidade específica (`PublishingProvider`, `TranscriptionProvider`, `AIModel`). | ActiveEngine, DriverToggle, ServiceSwitch |
| **`PlatformSessionCookie`** | Arquivo de credenciais de sessão em formato Netscape atribuído a uma plataforma de mídia externa (YouTube, TikTok, Instagram) para downloads de alta fidelidade sem throttling. | LoginToken, AuthFile, YtCookie |
| **`HardwareTelemetry`** | Mecanismo de diagnóstico do host que avalia o dispositivo computacional disponível (CUDA, ROCm, CPU), mede a VRAM e define a geometria de execução do Whisper. | SystemStats, DeviceProbe, GpuMonitor |
| **`BrandAsset`** | Artefatos visuais ou tipográficos complementares (logotipo PNG transparente com canal alfa ou fontes de subtítulo TTF/OTF) injetados nos filtros de renderização. | MediaAsset, CustomFile, SubtitleFont |

### 3.2. Cenários Concretos de Estresse do Domínio

1. **Cenário de Chave Pré-Existente vs Nova Chave:**
   - *Situação:* O usuário abre a aba de Modelos de IA. A chave do Gemini já está configurada no backend como `"AIza...4xyz"`. O usuário deseja apenas mudar o modelo padrão de `gemini-2.5-flash` para `gemini-2.5-pro`.
   - *Invariante do Domínio:* O formulário não envia a chave mascarada de volta para a API (o que corromperia o segredo). Se o campo de texto da chave estiver em branco ou inalterado, apenas `GEMINI_MODEL` é enviado no payload de atualização. A chave original permanece intacta no `CredentialVault`.
   - *Remoção Explícita:* Se o usuário clicar em "Remover Chave", uma ação intencional envia `""` para o campo `GEMINI_API_KEY`, limpando o registro tanto do JSON quanto do `os.environ`.

2. **Cenário de Descoberta de Contas Zernio:**
   - *Situação:* O usuário insere uma nova chave Zernio e clica em "Descobrir Contas".
   - *Invariante do Domínio:* A descoberta requer uma chave persistida. O sistema primeiro salva atomicamente a nova chave informada e somente depois dispara a busca na API do Zernio. Se a API responder com sucesso, os canais identificados (`tiktok`, `instagram`, `youtube`) são mapeados automaticamente nos campos correspondentes e salvos no estado.

3. **Cenário de Falha ou Ausência de GPU:**
   - *Situação:* A aplicação é iniciada em um ambiente sem placa de vídeo compatível ou com VRAM insuficiente (< 6 GB).
   - *Invariante do Domínio:* `HardwareTelemetry` detecta a ausência de CUDA/ROCm, classifica o dispositivo ativo como `CPU` e rebaixa dinamicamente o modelo padrão do Whisper para `base` ou `small`, preservando a memória RAM do sistema e evitando falhas de alocação de memória (OOM).

---

## 4. Arquitetura da Interface (`web/src/features/settings/`)

### 4.1. Estrutura de Arquivos

```
web/src/features/settings/
├── components/
│   ├── ai-models-card.tsx
│   ├── api-key-input.tsx
│   ├── brand-assets-card.tsx
│   ├── cookies-manager-card.tsx
│   ├── hardware-status-card.tsx
│   ├── publishing-provider-card.tsx
│   ├── settings-components.test.tsx
│   ├── settings-sidebar-nav.tsx
│   └── transcription-provider-card.tsx
├── data/
│   ├── settings.schema.ts
│   └── settings.types.ts
├── hooks/
│   ├── use-settings.test.tsx
│   ├── use-settings.ts
│   └── use-update-settings.ts
├── services/
│   ├── settings.api.ts
│   └── settings.keys.ts
└── views/
    ├── settings-view.test.tsx
    └── settings-view.tsx
```

### 4.2. Padrão Visual Oficial (Shadcn UI Settings)

O layout da `SettingsView` adota o padrão canônico do Shadcn:
- **Header:**
  - Título H1: `Configurações`
  - Descrição: `Gerencie as credenciais de IA, provedores de publicação, cookies de extração e recursos de aceleração.`
  - `<Separator className="my-6" />`
- **Grid de 2 Colunas (`lg:grid-cols-12`):**
  - **Menu Lateral (`lg:col-span-3`):** `<SettingsSidebarNav />` com itens verticais contendo ícones temáticos do Lucide (`Share2`, `Bot`, `Mic`, `Cookie`, `Cpu`, `Palette`), badge de status quando aplicável e destaque visual da aba selecionada (`bg-secondary` / `text-foreground`).
  - **Painel de Conteúdo (`lg:col-span-9`):** Renderiza o card correspondente à aba ativa com transição suave, cabeçalho de seção, inputs tipados, badges informativos e botão de submissão individual com feedback sonner.

---

## 5. Estratégia de Testes e Validação

1. **Testes do Backend (Pytest):**
   - Validação da persistência de `PUBLISHING_PROVIDER` em `config_store.py`.
   - Validação do retorno e cálculo da rota `GET /api/config/hardware`.
   - Teste de idempotência e não-vazamento de chaves secretas no endpoint `/api/config`.
2. **Testes do Frontend (Vitest + React Testing Library):**
   - Testes unitários para `ApiKeyInput` (revelação/ocultação de senha, estado mascarado, ação de limpar).
   - Testes dos cards de configuração (`PublishingProviderCard`, `AiModelsCard`, etc.).
   - Teste de integração da `SettingsView` (navegação entre abas via sidebar, preenchimento de campos e disparo de mutações).
3. **Pipeline de Verificação Integrada:**
   - Sucesso incondicional em `./scripts/verify.sh` cobrindo linting, typechecking, testes com cobertura mínima e build de produção Vite.
