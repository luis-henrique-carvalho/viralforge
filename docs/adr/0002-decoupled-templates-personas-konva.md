# 0002. Desacoplamento de Templates, Personas Editoriais e Editor Visual Konva

**Status:** Aceito  
**Data:** 2026-09-22  
**Contexto:** Viral Studio — Subsistema de Composição Visual e Geração de Conteúdo com IA  
**Disciplinas Aplicadas:** `/domain-modeling` e `/codebase-design`  

---

## Decisão

Unificar o **Template** como um agregador autocontido de **Layout Visual (FFmpeg/Pillow)** e **Inteligência Editorial (Persona, Prompts e Estratégia de Conversão)**, desacoplando-o rigidamente da entidade `Brand` e do nicho de "Achadinhos / Afiliados". 

No frontend, adotar o motor open-source permissivo **`react-konva` (Konva.js / MIT)** com espaço canônico de coordenadas 1080×1920 nativo para manipulação direta de elementos via `<Transformer>`, rejeitando soluções proprietárias (Polotno) ou baseadas em headless browser (Remotion).

O editor adota um **Sistema de Camadas Livres (Layer-based Canvas)** com as seguintes especificações validadas em protótipo interativo:
1. **Manipulação Livre de Textos:** Headline e Selo/Badge são camadas independentes com posições Y configuráveis e arrastáveis no canvas, com guia magnética central (*Snap Guide* em X = 540px).
2. **Geometria & Altura do Vídeo:** Suporte a ajuste vertical livre de altura (`video_height` de 400 a 1500px), proporções rápidas (`1:1 Quadrado`, `4:5 Feed Retrato`, `16:9 Widescreen` e `Livre`), atalhos de alinhamento vertical instantâneo (`Topo 260px`, `Centro 380px`, `Baixo 550px`) e estilizador de moldura (espessura de 0 a 10px, cor HEX, arredondamento de 0 a 48px e sombras/glow neon).
3. **Camada de Imagem / Banner Extra (`ExtraImageOverlay`):** Camada de rodapé configurável para upload de imagens personalizadas do usuário (PNG transparente, JPG, selos, marcas) ou cards dinâmicos prontos (comentários, CTA de seguidores, ofertas, curiosidades) para preencher lacunas visuais inferiores geradas por vídeos enquadrados.
4. **Desacoplamento de Conversão (`conversion_goal`):** Templates com objetivo de engajamento puro (`engagement`, ex.: curiosidades, ciência, fatos) geram cópias 100% focadas em debate e retenção, proibindo estritamente a alucinação de códigos de produto ou links inexistentes na bio.
5. **Contrato de Geração Dinâmica Modular (`GenerationTask`):** O template declara uma lista configurável de tarefas de IA (`generation_tasks`) com alvos (`target`), instruções com interpolação de variáveis (`{transcript}`, `{brand_name}`) e tipos de saída (`output_type`). Se um template não possui headline no canvas, a IA não gasta tokens gerando manchetes. O ecossistema também suporta tarefas do tipo `image_prompt` para geração de imagens por IA em 2 etapas para preencher o rodapé.

---

## Contexto e Motivação

O Viral Studio foi concebido originalmente com forte acoplamento ao nicho de "Achadinhos e Promoções":
1. **Templates cosméticos e rasos:** `VisualTemplate` continha apenas posições geométricas e cores; ele não participava do estágio de IA.
2. **Prompts rígidos no código:** A função de montagem de prompt exigia obrigatoriamente código de produto, chamadas de afiliados na bio e hashtags comerciais, tornando impossível produzir canais de **Curiosidades**, **Fatos Históricos**, **Notícias** ou **Tech**.
3. **Falta de liberdade visual:** O usuário não conseguia reposicionar a caixa do vídeo, alterar selos/badges de nicho ou ajustar elementos visualmente sem editar manualmente valores numéricos brutos.
4. **Espaço Inferior Desperdiçado:** Em formatos 9:16 com vídeo 1:1, a área inferior ficava vazia sem opção para o criador adicionar imagens, logotipos ou banners de retenção.

---

## Opções Consideradas e Alternativas Rejeitadas

* **Polotno SDK:** Rejeitado imediatamente devido ao licenciamento comercial fechado (US$ 249 a US$ 899/mês) e código-fonte minificado/ofuscado.
* **Remotion / Remotion Player:** Rejeitado pela licença *Source-Available* restritiva para equipes (>3 desenvolvedores) e por exigir um pipeline de renderização em Node.js com Puppeteer (captura de tela frame a frame), o que contraria o motor nativo de alta velocidade do backend em Python/FFmpeg com aceleração por hardware (CUDA/ROCm).
* **Fabric.js:** Rejeitado pela integração complexa com o ciclo reativo do React 18 / StrictMode e manipulação de matrizes com transformações baseadas em escala relativa em vez de limites absolutos.
* **react-moveable (DOM Nativo):** Considerado como forte alternativa, mas preterido em favor do `react-konva` pela facilidade de exportação de thumbnails em alta resolução diretamente no cliente (`stage.toDataURL()`) e pelo alinhamento exato de camadas com a renderização de imagens no Pillow.

---

## Validação em Protótipos Interativos

Antes da implementação em produção, a arquitetura e as decisões de UX foram testadas e validadas através de duas simulações interativas de alta fidelidade:

1. **Protótipo 1 — Canvas, Camadas e Geometria:**
   - **Artefato Original:** [`viral_studio_template_simulation.html`](file:///home/luis/.gemini/antigravity/brain/cd76f1f0-21a9-4ded-9da7-12cecce6a6a3/viral_studio_template_simulation.html)
   - **Cópia no Repositório:** [`docs/prototypes/viral-studio-template-simulation.html`](file:///home/luis/repositories/viralforge/docs/prototypes/viral-studio-template-simulation.html)
   - *Validações:* Arraste de múltiplas camadas, alças de altura vertical (400-1500px), proporções (`1:1`, `4:5`, `16:9`), upload local via `FileReader`, bordas/glow e snap central magnético.

2. **Protótipo 2 — Motor Modular de Tarefas de IA (`GenerationTask`):**
   - **Artefato Original:** [`dynamic_generation_tasks_simulation.html`](file:///home/luis/.gemini/antigravity/brain/cd76f1f0-21a9-4ded-9da7-12cecce6a6a3/dynamic_generation_tasks_simulation.html)
   - **Cópia no Repositório:** [`docs/prototypes/dynamic-generation-tasks-simulation.html`](file:///home/luis/repositories/viralforge/docs/prototypes/dynamic-generation-tasks-simulation.html)
   - *Validações:* Catálogo de tarefas com 1 clique, sincronização reativa com o canvas (desativar headline ativa modo vídeo limpo), JSON Schema gerado sob demanda apenas para tarefas ativas, e pipeline de imagens de IA em 2 etapas.

> **Diretriz de Cores e Tema:** Os protótipos servem estritamente como referência funcional, de layout e comportamento mecânico. A interface no React seguirá com fidelidade absoluta o **tema atual do projeto** (Dark Editorial Flat / Shadcn / TweakCN / `tokens.css`), utilizando classes semânticas.

---

## Consequências

- **Positivas:**
  - **Universalidade:** O mesmo pipeline produz vídeos para qualquer nicho de conteúdo curto com personas e tons de voz especializados.
  - **Conversão Flexível:** Templates de engajamento puro (curiosidades) focam em mistério e comentários sem forçar links nem códigos inexistentes.
  - **Liberdade Criativa Total:** O criador ajusta livremente a altura do vídeo, move headlines, aplica bordas/sombras e preenche o rodapé com imagens próprias ou cards de engajamento.
  - **Precisão Geométrica 1:1:** O canvas do Konva opera no mesmo espaço canônico (1080×1920) que o FFmpeg e o Pillow, eliminando discrepâncias visuais entre a prévia e o vídeo renderizado.
  - **Custo Zero de Licenças:** O editor utiliza exclusivamente componentes MIT sem royalties ou dependências externas pagas.
- **Negativas / Custos:**
  - O modelo de dados do `VisualTemplate` tornou-se mais amplo, exigindo validações refinadas de coerência entre o `conversion_goal` e a estrutura de legenda gerada.
  - O renderizador em Pillow/FFmpeg precisa desenhar a camada de imagem extra e aplicar máscaras de borda arredondada na composição do vídeo.

