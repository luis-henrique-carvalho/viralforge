# 0004. Descoberta Assíncrona, Fila com Semáforo Dedicado e Persistência de Buscas

**Status:** Aceito  
**Data:** 2026-09-24  
**Contexto:** Viral Studio — Mineração de Conteúdo Viral, Descoberta Multiplataforma e Criação de Lotes  
**Disciplinas Aplicadas:** `/domain-modeling`, `/grill-me` e `/codebase-design`  

---

## Decisão

1. **Agregado de Busca Persistente de Primeiro Nível (`DiscoverySearch`):**
   A busca de vídeos virais por palavra-chave ou hashtag deixa de ser uma chamada síncrona bloqueante HTTP e passa a ser uma entidade persistida em `data/discovery/{search_id}.json` (com lock atômico e permissões 0o600).
   - **Ciclo de vida:** `QUEUED` ➔ `SEARCHING` ➔ `COMPLETED` | `FAILED` | `CANCELLED`.
   - **Metadados:** Parâmetros da query (plataforma, keyword, min_views, order_by, etc.), contadores de progresso, telemetria de latência, data de criação e lista classificada de `DiscoveredVideo`.

2. **Worker Assíncrono com Semáforo Dedicado (`DiscoveryWorker`) e Cancelamento Imediato:**
   - Um worker em background acoplado ao ciclo de vida do FastAPI (`lifespan`) consome tarefas de busca a partir de uma `asyncio.Queue`.
   - O worker aplica semáforo de concorrência máxima global (ex: `MAX_CONCURRENT_DISCOVERY = 2`) e bloqueios por plataforma com backoff adaptativo para prevenir bloqueios de IP, captchas ou expiração de cookies em plataformas como TikTok e Instagram.
   - **Cancelamento em Voo (`POST /api/discovery/searches/{id}/cancel`):** O usuário pode cancelar buscas tanto na fila quanto em execução ativa; a `asyncio.Task` e subprocessos filhos de extração são encerrados, o semáforo é liberado e o status transita para `CANCELLED`.

3. **Experiência do Usuário Não-Bloqueante & Histórico Persistente:**
   - O usuário submete a busca via `POST /api/discovery/searches` e recebe imediatamente `{ search_id, status: "QUEUED" }` com HTTP 202 Accepted.
   - A interface exibe a busca no Histórico Lateral/Abas com status dinâmico (`Minerando...`, `Concluída`, `Falha`) e atualizações em tempo real via polling periódico.
   - O usuário pode sair da tela, navegar para o editor de templates ou lotes de vídeo, e retornar a qualquer momento para inspecionar resultados de buscas anteriores.

4. **Deduplicação e Proveniência de Importação (`ImportProvenance`):**
   - Cada `DiscoveredVideo` mapeia se sua URL já foi importada em algum lote anterior do sistema, exibindo um badge semântico *"Já no Lote #X"*.
   - A seleção múltipla de vídeos em uma busca concluída alimenta diretamente o fluxo de criação de lote (`BatchCreateDialog`) com distribuição multi-marca (`BrandPool` + `VisualTemplate`).

---

## Contexto e Motivação

A busca e mineração de vídeos virais em plataformas sociais exige extração remota de metadados, paginação de listas de reprodução e cálculo de taxas de engajamento via `yt-dlp` e proxies/cookies. Em chamadas síncronas:
- Requisições longas sofriam timeout de HTTP (30s–60s) em redes instáveis ou consultas volumosas.
- O usuário ficava com a interface travada em loading sem poder realizar outras ações no estúdio.
- O resultado da pesquisa se perdia ao atualizar a página ou navegar para outra aba, forçando o usuário a reexecutar a raspagem e gastar recursos de rede desnecessários.

---

## Consequências

- **Positivas:**
  - Sistema 100% responsivo e livre de travamentos ou timeouts HTTP.
  - Histórico persistente de pesquisas permite reaproveitar prospecções e acompanhar a evolução de hashtags ao longo do tempo.
  - Controle rígido de concorrência protege o IP e as sessões autenticadas contra bloqueios das plataformas sociais.
  - Transição fluida de mineração para criação de lote com marcação de vídeos já utilizados.
- **Trade-offs:**
  - Adiciona endpoints de listagem, consulta e cancelamento de buscas (`GET /api/discovery/searches`, `GET /api/discovery/searches/{id}`, `DELETE /api/discovery/searches/{id}`).
  - O frontend passa a gerenciar estado de buscas assíncronas via TanStack Query com invalidação e polling reativo.
