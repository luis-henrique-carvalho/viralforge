# 0005. Cancelamento Seguro de Processamento de Lotes e Vídeos no Viral Studio

**Status:** Aceito  
**Data:** 2026-09-28  
**Contexto:** Interrupção controlada de pipelines de vídeo em lote no Viral Content Studio  
**Metodologia:** `/codebase-design` (Módulos Profundos, Seams Limpos, Alavancagem e Localidade)

---

## Decisão

Implementar o cancelamento de processamento de lotes e vídeos individuais no Viral Content Studio por meio de um **Módulo Profundo** em `clippyme.domain.viral_studio_orchestrator`, expondo uma interface mínima (`cancel_viral_item` e `cancel_viral_batch`) e desacoplando a camada HTTP (thin handlers) da gestão de processos do sistema operacional e da persistência atômica.

### Pontos Centrais da Decisão:
1. **Módulo Profundo com Alta Alavancagem:**
   A complexidade de validar o estado, localizar processos na fila ou em execução, enviar sinais do SO (`SIGTERM` com timeout e fallback para `SIGKILL` via `psutil`), expurgar arquivos parciais corrompidos e auditar o evento sob lock atômico fica 100% contida dentro do orquestrador.
2. **Máquina de Estados Resiliente:**
   O status `CANCELLED` é formalizado como estado terminal abortado pelo usuário. Um vídeo cancelado é imediatamente reversível: o endpoint existente `retry_item` aceita `CANCELLED`, permitindo reprocessar o vídeo com 1 clique.
3. **Recálculo Puro do Status do Lote:**
   A consolidação de status de um lote (`_derive_batch_status`) é uma função pura (sem I/O), deterministicamente testável com 100% de cobertura.
4. **Proteção contra Sobrescrita no Job Runner:**
   O loop de encerramento de processos em `clippyme.domain.job_runner` foi protegido para que jobs do tipo `viral_studio` marcados como cancelados não sofram transição indevida para `FAILED`.
5. **Composição 100% Shadcn no Frontend:**
   O frontend adere estritamente às diretrizes Shadcn UI, oferecendo botões de ação contextuais no card do item, cabeçalho do lote e barra de ações em massa.

---

## Contexto e Motivação

No Viral Content Studio, o processamento de lotes envolve tarefas concorrentes e assíncronas (download de mídias externas, geração de prompts e chamadas de LLM, composição de áudio/vídeo via FFmpeg). 

Anteriormente:
- Não existia rota ou botão para abortar um item ou lote em execução.
- Falhas de rede, URLs com restrições ou travamentos de subprocessos deixavam itens permanentemente em `ANALYZING` ou `DOWNLOADING`.
- Como consequência, o lote pai permanecia eternamente em `PENDING`, bloqueando semáforos de concorrência e distorcendo as métricas globais de lotes ativos no dashboard.
- A única rota de cancelamento existente era restrita ao agendamento de postagens sociais (`/api/viral-studio/publishing/{id}/cancel`).

---

## Análise de Codebase Design

### 1. Interface do Módulo Profundo
```python
async def cancel_viral_item(item_id: str, *, jobs: Optional[dict] = None) -> Dict[str, Any]
async def cancel_viral_batch(batch_id: str, *, jobs: Optional[dict] = None) -> Dict[str, Any]
```
- **Assinatura Mínima:** Recebe apenas o identificador e a dependência opcional de jobs.
- **Comportamento Rico Oculto:**
  - Validação estrita de invariantes (impede cancelar itens já aprovados ou publicados).
  - Interrupção segura de processos via árvore de processos (`psutil.Process(pid).children(recursive=True)`).
  - Remoção de arquivos parciais (`source.mp4`, `rendered.mp4`).
  - Log de auditoria estruturado.
  - Atualização atômica em disco com lock de concorrência.

### 2. Seams Estabelecidos
- **Seam 1 (HTTP REST):** Handlers finos (< 25 linhas) em `clippyme.api.viral_studio_routes`.
- **Seam 2 (Domínio):** Orquestrador `viral_studio_orchestrator`.
- **Seam 3 (Controle de Processos):** `clippyme.domain.job_control.terminate_tree`.
- **Seam 4 (Persistência):** `clippyme.domain.viral_studio_store.cancel_item_store`.

---

## Consequências

### Positivas
- **Recuperabilidade Instantânea:** Usuários e administradores podem destravar lotes presos sem precisar reiniciar a aplicação ou editar arquivos JSON manualmente.
- **Economia de Recursos:** Processos de download ou renderização pesada em segundo plano são interrompidos imediatamente, liberando CPU, GPU e memória.
- **Limpeza de Disco:** Nenhum arquivo temporário órfão ou vídeo corrompido é deixado em disco.
- **Rastreabilidade:** Cada cancelamento gera um log auditável com timestamp e motivo.

### Negativas / Mitigações
- **Possibilidade de Cancelamento Acidental:** Mitigada com diálogo de confirmação no cancelamento do lote e possibilidade de retentativa imediata (*1-Click Retry*) no card do vídeo.
