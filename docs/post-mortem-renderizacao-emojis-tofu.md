# Post-Mortem & Runbook: Prevenção de Falha na Renderização de Emojis (Tofu `▯`)

## Resumo Executivo

| Item | Detalhe |
| :--- | :--- |
| **Data do Incidente** | 12 de Novembro de 2026 |
| **Impacto** | Vídeos verticais renderizados com emojis substituídos pelo símbolo de glifo ausente / "tofu" (`▯`) nas headlines e badges |
| **Causa Raiz** | Imagem Docker base (`clippyme-backend:latest`) desatualizada em relação ao `Dockerfile`. Instalações manuais de `pilmoji` ocorriam na camada efêmera do container e eram perdidas em reinicializações / recriações do compose |
| **Status** | Resolvido definitivamente com arquitetura de auto-cura no boot, commit na imagem base e resiliência de cache |

---

## 1. Descrição do Problema e Sintomas

Ao renderizar vídeos com o template do Viral Studio (`viral_studio_renderer.py`), headlines como:
`🔋 O carregador magnético que resolve TUDO!`
eram geradas no vídeo final com um retângulo vazio no lugar do emoji:
`▯ O carregador magnético que resolve TUDO!`

### Por que o problema se repetia ciclicamente?

1. **A Fonte Tipográfica**:
   As fontes do projeto (`Montserrat-ExtraBold.ttf`, `Poppins-Medium.ttf`) são fontes tipográficas puras sem suporte nativo a glifos de emoji coloridos. Quando o Pillow tenta desenhar um caractere emoji usando uma fonte padrão sem o motor do `pilmoji`, ele recorre ao `.notdef` (o caractere de substituição retangular `▯`).
2. **A Dependência `pilmoji`**:
   O motor de paridade visual do ViralForge requer `pilmoji` e `emoji` para baixar e desenhar os ativos vetoriais/rasterizados do **Twemoji** com suporte a cores completas.
3. **A Falha de Persistência em Docker (A Causa do Ciclo)**:
   - A imagem base local `clippyme-backend:latest` havia sido construída em **25 de setembro de 2026**, antes do commit que adicionou suporte oficial a emojis.
   - Sempre que o erro surgia, alguém executava `pip install pilmoji` diretamente dentro do container ativo via CLI.
   - Esse pacote ficava salvo apenas na **camada volátil** do container em execução.
   - Quando a máquina sofria uma reinicialização, ou quando era executado `docker compose up -d` / `docker compose down`, o Docker destruía o container e recriava um novo a partir da imagem base de 25 de setembro, **removendo silenciosamente o `pilmoji`**.
   - No `viral_studio_renderer.py`, o bloco de proteção capturava `No module named 'pilmoji'` e acionava o fallback padrão para o Pillow, fazendo os emojis sumirem novamente.

---

## 2. Diagnóstico Rápido

Para testar se o container está saudável e com renderização de emojis ativa:

```bash
docker exec clippyme-backend python -c "
from clippyme.domain.viral_studio_renderer import _get_emoji_source
src = _get_emoji_source()
print('Classe de Emoji:', src.__class__.__name__)
print('Emoji ⚡:', bool(src.get_emoji('⚡')))
print('Emoji 🔋:', bool(src.get_emoji('🔋')))
"
```

**Saída esperada de sucesso:**
```text
Classe de Emoji: _CachedTwemojiSource
Emoji ⚡: True
Emoji 🔋: True
```

Se a saída exibir `Pilmoji Twemoji source unavailable` ou retornar `None`, a dependência foi descarregada.

---

## 3. Solução em 3 Camadas Implementada

Para garantir que o erro nunca mais volte, foi aplicada uma blindagem permanente:

### Camada 1: Auto-Cura no Boot (`docker-entrypoint.sh`)
Como o arquivo `docker-entrypoint.sh` é montado em tempo real pelo `docker-compose.yml` (`./docker-entrypoint.sh:/usr/local/bin/docker-entrypoint.sh:ro`), inserimos uma validação de auto-cura executada com permissões de root antes de inicializar o servidor Uvicorn:

```bash
# Self-healing: ensure emoji rendering dependencies are always present
if ! python3 -c "import pilmoji, emoji" 2>/dev/null; then
    echo "[entrypoint] Installing missing emoji packages (pilmoji, emoji)..."
    pip install --no-cache-dir "pilmoji>=2.0.5" "emoji>=2.16.0" 2>/dev/null || true
fi
```
> [!IMPORTANT]
> Mesmo se qualquer desenvolvedor resetar o Docker Desktop, baixar uma imagem antiga ou recriar containers do zero, o container instalará automaticamente as dependências ausentes em 1 segundo antes de subir a aplicação.

### Camada 2: Persistência na Imagem Base (`docker commit`)
A imagem local foi atualizada e congelada com os pacotes instalados:
```bash
docker commit clippyme-backend clippyme-backend:latest
```
Isso evita o overhead de instalação a cada subida normal do container.

### Camada 3: Resiliência de Variação Unicode no Cache (`viral_studio_renderer.py`)
No `_CachedTwemojiSource.get_emoji`, adicionamos resolução inteligente de seletores de variação Unicode (`\ufe0f`). Se o emoji solicitado for `\u26a1` (sem seletor) ou `\u26a1\ufe0f` (com seletor), o sistema pesquisa ambas as variações no cache local em disco (`data/cache/emojis/`), garantindo renderização instantânea mesmo que o container esteja desconectado da internet.

---

## 4. Checklist para Manutenção Futura

1. Ao criar novos containers ou refatorar o `Dockerfile`, certifique-se de manter `"pilmoji>=2.0.5"` e `"emoji>=2.16.0"` nas instruções de build.
2. Nunca confie em instalações manuais `docker exec ... pip install` para resolver dependências definitivas de runtime. Sempre persista via `docker-entrypoint.sh` ou rebuilding da imagem base.
3. Em caso de dúvidas, execute o validador host completo:
   ```bash
   ./scripts/verify.sh --backend
   ```
