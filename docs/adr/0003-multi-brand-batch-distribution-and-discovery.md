# 0003. Distribuição Multi-Marca em Lote sob Template Unificado e Descoberta por Palavra-Chave

**Status:** Aceito  
**Data:** 2026-09-23  
**Contexto:** Viral Studio — Ingestão de Vídeos, Composição Visual Multi-Conta e Descoberta  
**Disciplinas Aplicadas:** `/domain-modeling` e `/codebase-design`  

---

## Decisão

1. **Desacoplamento de Lote e Marca Única (`BrandPool`):**
   Evoluir a entidade `ViralBatch` para que o lote compartilhe um único `VisualTemplate` (e modelo de IA), mas permita que seus itens (`ViralItem`) sejam distribuídos entre múltiplas Marcas/Contas (`BrandPool`) logo no momento da criação do lote (**Upfront Sharding**).

2. **Atribuição Visual Antecipada (*Pre-Render Branding*):**
   Como o motor de renderização (`viral_studio_renderer.py`) queima no vídeo (overlay 1080×1920) o `@handle`, o avatar e o nome da Marca, a associação do item à sua respectiva Marca (`item.brand_id`) deve ocorrer obrigatoriamente **antes da execução do pipeline de renderização**.

3. **Estratégias de Distribuição Algorítmica (`MultiBrandDistribution`):**
   Suportar estratégias puras e testáveis de distribuição:
   - **Round-Robin (Padrão):** Vídeo 1 ➔ Marca A, Vídeo 2 ➔ Marca B, ..., Vídeo N ➔ Marca A.
   - **Sequencial em Blocos:** Divide os itens em blocos contínuos entre as marcas selecionadas.

4. **Publicação Omnichannel por Marca (`BrandSyndication`):**
   A publicação é operada **por Marca**. Cada Marca possui seus canais sociais vinculados (`brand.publishing_profiles`: Instagram, TikTok, YouTube Shorts). Quando um vídeo atribuído a uma Marca é aprovado para publicação:
   - **Sincronia de Lançamento:** O vídeo é agendado para o mesmo horário simultâneo em todas as redes ativas da marca (ex: 18:00 no Instagram, TikTok e YouTube), avançando para o próximo slot livre caso alguma conta esteja ocupada.
   - **Isolamento de Falha Parcial (`PublicationFailureIsolation`):** Se uma rede falhar (ex: rate limit 429 no TikTok), as redes com sucesso (Instagram, YouTube) são preservadas e a falha fica isolada com opção de retry com 1 clique para a rede afetada sem duplicar nas demais.

5. **Módulo de Descoberta Multiplataforma (TikTok, Instagram, YouTube):**
   Criar a interface e serviço de Descoberta por palavra-chave utilizando `yt-dlp` com extração rápida de metadados (`--flat-playlist`) e cookies autenticados (`data/cookies/{platform}.txt`), calculando `viral_score` e taxa de engajamento, permitindo selecionar vídeos e enviá-los diretamente para a criação do lote com distribuição no `BrandPool`.

---

## Contexto e Motivação

Anteriormente, o `BatchCreateRequest` exigia um único `brand_id` para todo o lote. Para criadores que gerenciam redes de múltiplos perfis/marcas (ex.: 5 perfis de achadinhos no TikTok/Instagram), era necessário criar manualmente 5 lotes separados, repetindo o processo de busca e configuração para cada um.

Além disso, tentar adiar a escolha da conta de destino para a etapa final de publicação causaria um defeito visual crítico: o vídeo já teria sido renderizado com a logo e o `@handle` da Marca original queimados na imagem, resultando em publicações com identidade trocada na rede social.

---

## Consequências

- **Positivas:**
  - O criador pode minerar 30 vídeos de uma só vez na Descoberta, escolher 1 template e distribuir automaticamente para 10 contas diferentes com 1 clique.
  - Cada vídeo é renderizado com a identidade visual exata da sua conta de destino.
  - O fluxo pós-renderização fica simplificado: o usuário revisa o vídeo já pronto com a marca certa e clica para aprovar e agendar.
- **Trade-offs:**
  - O `BatchCreateRequest` passa a aceitar tanto `brand_id` (retrocompatibilidade) quanto `brand_ids: List[str]` e `distribution_strategy`.
  - A interface de criação de lote e de importação da descoberta precisa permitir a seleção múltipla de marcas (Checkboxes / Multi-select) em vez de um simples `<Select>` unitário.
