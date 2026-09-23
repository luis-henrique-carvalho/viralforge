# 0001. Arquitetura de Portas e Adaptadores para Publicação Social

**Status:** Aceito  
**Data:** 2026-09-22  
**Contexto:** Publicação de Vídeos e Gestão de Fila Contínua no Viral Studio  
**Metodologia:** `/codebase-design` (Módulos Profundos, Costuras e Adaptadores)

---

## Decisão

Adotar uma arquitetura de **Portas e Adaptadores (Arquitetura Hexagonal)** para o subsistema de publicação e agendamento de vídeos nas redes sociais. 

O domínio do ViralForge passa a ser o único detentor do agendamento, da regra de fila contínua (*auto-chaining*) e das entidades de canal social (`SocialChannel`) e postagem (`PublicationJob`), isolando os provedores externos de distribuição atrás da porta abstrata `SocialPublisherPort`.

Para a **V1 (Fase 4)**, a prioridade máxima é fechar o fluxo de ponta a ponta do Viral Studio:
1. **V1:** Conexão direta do lote de vídeos ao `ViralPublishDialog`, suportando disparo imediato e agendamento em fila contínua (1 vídeo/dia sem colisão de horários) via `SocialPublisherPort` com o adaptador oficial `ZernioPublisherAdapter` e `MockPublisherAdapter` para testes. Cancelamento e visualização de status agendado diretamente no card do vídeo.
2. **V2:** Página dedicada `/publishing` com visão em calendário global cross-batch, suporte a múltiplos provedores simultâneos com fallback dinâmico e reagendamento arrasta-e-solta.

---

## Contexto e Motivação

O código legado acoplava todas as operações de postagem diretamente à API do Zernio (`ZernioClient`, rotas `/api/config/zernio` e chaves fixas `zernio.accounts`). Esse acoplamento gerava sérias restrições:
1. **Vendor Lock-in:** Impossibilidade de trocar de provedor ou adicionar provedores alternativos (ex.: Ayrshare, Upload-Post, APIs diretas da Meta/TikTok ou robôs internos).
2. **Falta de Suporte a Multi-Contas:** Cada provedor gerenciava contas de forma global e estática, impedindo estratégias de múltiplos perfis de achadinhos/promoções.
3. **Ausência de Fallback:** Se um provedor atinge limites diários de taxa (HTTP 429) ou sofre instabilidade, o sistema não tinha como redirecionar ou reprocessar os envios por um canal secundário.
4. **Testabilidade Comprometida:** Não havia como testar o fluxo de publicação no host de forma determinística sem credenciais reais do Zernio ou sem mockar requisições HTTP em baixo nível.

---

## Análise Formal de Desenho de Código (`/codebase-design`)

O subsistema de publicação é desenhado com base nos princípios de **Módulos Profundos** (*Deep Modules*):

```
┌─────────────────────────────────────────────────────────────┐
│  Interface Estrita da Porta (SocialPublisherPort)           │  ← 4 métodos simples e tipos imutáveis
├─────────────────────────────────────────────────────────────┤
│  Implementação Profunda do Adaptador (Zernio / Nativo)      │  ← Presign de mídia, PUT HTTP com streaming,
│                                                             │    conversão de payloads TikTok/Reels/Shorts,
│                                                             │    tratamento de rate-limit (HTTP 429 backoff)
└─────────────────────────────────────────────────────────────┘
```

### 1. Costura no Domínio (*Seam*)
* **Localização da Costura:** `clippyme.domain.social_publisher_port.SocialPublisherPort`.
* **Interface Pequena:**
  ```python
  class SocialPublisherPort(ABC):
      @abstractmethod
      async def publish(self, job: PublicationJob) -> PublicationReceipt: ...
      @abstractmethod
      async def schedule(self, job: PublicationJob) -> PublicationReceipt: ...
      @abstractmethod
      async def cancel(self, external_id: str) -> bool: ...
      @abstractmethod
      async def get_status(self, external_id: str) -> PublicationReceipt: ...
  ```
* **Regra dos Dois Adaptadores (*Two Adapters Rule*):** Uma costura com apenas um adaptador é hipotética. Aqui existem **dois adaptadores reais imediatos**:
  1. `ZernioPublisherAdapter`: adaptador de produção com cliente HTTP, upload pré-assinado e polling.
  2. `MockPublisherAdapter`: adaptador em memória 100% determinístico para testes e execução offline.

### 2. Alavancagem para os Chamadores (*Leverage*)
* Os chamadores (orquestrador de lote, rota HTTP `/publish`, modal `ViralPublishDialog`) interagem com uma interface compacta que oculta toda a complexidade de negociação de tokens, envio multipart de vídeo e contratos específicos de cada rede social.
* Um único comando `schedule(job)` resolve o upload, a validação de metadados e o registro do horário no provedor.

### 3. Localidade para Manutenibilidade (*Locality*)
* Regras específicas de cabeçalhos de autenticação do Zernio, limites de upload (16 GB), URLs seguras e tratamento de 429 ficam encapsuladas dentro do `ZernioPublisherAdapter`.
* Nenhuma rota da API, componente React ou regra de negócio do Viral Studio conhece a estrutura interna do payload do Zernio.

### 4. O Teste de Deleção (*The Deletion Test*)
* Se deletarmos o módulo `SocialPublisherPort` e seus adaptadores, a complexidade não desaparece: ela reaparece multiplicada em N rotas de API, no orquestrador e nos componentes visuais, que teriam que implementar upload manual, parsing de respostas HTTP e mocks específicos. O módulo ganha seu espaço com folga.

### 5. A Interface como Superfície de Teste (*Interface as Test Surface*)
* Os testes de host do Pytest cruzam a mesma costura que o código de produção utiliza:
  ```python
  publisher = MockPublisherAdapter()
  receipt = await publisher.schedule(job)
  assert receipt.status == "scheduled"
  ```
* Permite testar todo o ciclo de publicação do lote no host em milissegundos sem conexão de rede.

---

## Solução Arquitetural

1. **Porta do Domínio (`SocialPublisherPort`):**
   Contrato abstrato que define as capacidades mínimas exigidas de qualquer provedor:
   - `publish(job: PublicationJob) -> PublicationReceipt`
   - `schedule(job: PublicationJob) -> PublicationReceipt`
   - `cancel(external_id: str) -> bool`
   - `get_status(external_id: str) -> PublicationReceipt`

2. **Adaptadores (Adapters):**
   - `ZernioPublisherAdapter`: Implementa a porta consumindo a API oficial do Zernio.
   - `MockPublisherAdapter`: Implementa a porta para testes unitários, CI/CD e desenvolvimento offline sem custos de API.
   - `InternalPublisherAdapter` (V2): Implementa a porta para publicação nativa direta.

3. **Gerenciador de Fila Contínua no Store (`viral_studio_store.py`):**
   - Controla o algoritmo puro `get_next_available_slots(account_id, count, preferred_time)` sem colisões de horários no banco local do ViralForge.
   - O próximo lote continua automaticamente a partir do último horário agendado para a mesma conta.

---

## Consequências

- **Positivas:**
  - O ViralForge nunca fica refém de um único serviço terceiro.
  - Testes unitários e de integração no frontend e backend rodam 100% isolados via `MockPublisherAdapter` sem requisições de rede.
  - O fluxo do Viral Studio fecha de ponta a ponta na V1 sem depender de desenvolvimentos futuros complexos.
- **Negativas / Custos:**
  - Pequeno overhead de mapeamento entre o modelo imutável `PublicationJob` e os formatos esperados por provedores terceiros.

