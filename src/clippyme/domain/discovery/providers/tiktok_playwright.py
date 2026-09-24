from __future__ import annotations

import asyncio
import inspect
import json
import logging
import os
import time
import urllib.parse
from typing import Any, Dict, List, Optional

logger = logging.getLogger("clippyme.discovery.tiktok_playwright")


def parse_netscape_cookies(filepath: str) -> List[Dict[str, Any]]:
    """Converte um arquivo de cookies no formato Netscape para o formato aceito pelo Playwright."""
    cookies: List[Dict[str, Any]] = []
    if not os.path.exists(filepath):
        return cookies

    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                parts = line.split("\t")
                if len(parts) >= 7:
                    domain, _flag, path, secure, expiration, name, value = parts[:7]
                    cookie_dict: Dict[str, Any] = {
                        "name": name,
                        "value": value,
                        "domain": domain,
                        "path": path,
                        "expires": int(expiration) if expiration.isdigit() else -1,
                        "httpOnly": False,
                        "secure": secure.upper() == "TRUE",
                        "sameSite": "Lax",
                    }
                    cookies.append(cookie_dict)
    except Exception as exc:
        logger.warning("Falha ao analisar cookies Netscape em %s: %s", filepath, exc)

    return cookies


class TikTokPlaywrightWorker:
    """Worker headless com Playwright para extrair vídeos de busca do TikTok."""

    def __init__(self, chrome_path: Optional[str] = "/usr/bin/google-chrome"):
        self.chrome_path = chrome_path if (chrome_path and os.path.exists(chrome_path)) else None

    async def _fetch_query_in_context(
        self,
        browser: Any,
        query: str,
        cookies: List[Dict[str, Any]],
        target_limit: int,
        extracted_items: List[Dict[str, Any]],
        captured_ids: set[str],
        lock: asyncio.Lock,
        timeout_secs: float,
    ) -> None:
        """Executa busca e scroll progressivo para uma consulta individual dentro de um contexto isolado."""
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
            ),
            locale="pt-BR",
            viewport={"width": 1920, "height": 1080},
            ignore_https_errors=True,
        )
        if cookies:
            await context.add_cookies(cookies)

        page = await context.new_page()
        pending_tasks: set[asyncio.Task] = set()

        async def handle_response(response: Any) -> None:
            url = getattr(response, "url", "")
            if "/api/search/item/full/" in url or "/api/search/general/full/" in url:
                try:
                    text_attr = getattr(response, "text", None)
                    if callable(text_attr):
                        res = text_attr()
                        raw_text = await res if inspect.isawaitable(res) else res
                        if raw_text and str(raw_text).strip().startswith("{"):
                            payload = json.loads(raw_text)
                        else:
                            payload = {}
                    else:
                        json_attr = getattr(response, "json", None)
                        if callable(json_attr):
                            res = json_attr()
                            payload = await res if inspect.isawaitable(res) else res
                        elif isinstance(json_attr, dict):
                            payload = json_attr
                        else:
                            payload = {}

                    raw_list = payload.get("item_list") or payload.get("data") or []
                    for entry in raw_list:
                        item_obj = entry.get("item", entry) if isinstance(entry, dict) else entry
                        if isinstance(item_obj, dict):
                            vid = str(item_obj.get("id") or "")
                            if vid:
                                async with lock:
                                    if vid not in captured_ids:
                                        captured_ids.add(vid)
                                        extracted_items.append(item_obj)
                except Exception as parse_exc:
                    logger.debug("Erro ao decodificar JSON da resposta do TikTok: %s", parse_exc)

        def response_listener(response: Any) -> None:
            task = asyncio.create_task(handle_response(response))
            pending_tasks.add(task)
            task.add_done_callback(pending_tasks.discard)

        page.on("response", response_listener)

        ts = int(time.time() * 1000)
        encoded_q = urllib.parse.quote(query)
        search_url = f"https://www.tiktok.com/search/video?q={encoded_q}&_t={ts}"

        try:
            try:
                await page.goto(search_url, wait_until="domcontentloaded", timeout=timeout_secs * 1000)
            except Exception as nav_exc:
                logger.warning("Navegação do Playwright falhou ou deu timeout: %s", nav_exc)

            # Aguarda a renderização inicial dos cards ou botão de retry
            for _ in range(15):
                async with lock:
                    if len(extracted_items) >= target_limit:
                        break
                retry_btn = await page.query_selector('button:has-text("Tente novamente"), button:has-text("Retry")')
                if retry_btn:
                    try:
                        await retry_btn.click()
                        await asyncio.sleep(1.5)
                        break
                    except Exception:
                        pass
                cards = await page.query_selector_all('div[data-e2e="search_video-item"]')
                if cards:
                    break
                await asyncio.sleep(0.3)

            # Executa scroll progressivo para ativar lotes adicionais
            for _ in range(2):
                async with lock:
                    if len(extracted_items) >= target_limit:
                        break
                try:
                    await page.evaluate("""() => {
                        document.querySelectorAll('[data-floating-ui-portal], .TUXModal-overlay, [class*="modal"], [class*="Modal"]').forEach(e => e.remove());
                    }""")
                    await page.keyboard.press("Escape")

                    cards = await page.query_selector_all('div[data-e2e="search_video-item"]')
                    if cards:
                        await cards[-1].scroll_into_view_if_needed(timeout=1000)

                    await page.mouse.move(960, 540)
                    await page.mouse.wheel(0, 4000)
                    await page.keyboard.press("PageDown")
                    await asyncio.sleep(1.5)
                except Exception:
                    break

            if pending_tasks:
                await asyncio.gather(*list(pending_tasks), return_exceptions=True)

            # Fallback DOM se nenhuma chamada foi interceptada
            async with lock:
                if not extracted_items:
                    dom_items = await self._extract_from_dom(page, target_limit)
                    for di in dom_items:
                        vid = str(di.get("id") or "")
                        if vid and vid not in captured_ids:
                            captured_ids.add(vid)
                            extracted_items.append(di)

        finally:
            if pending_tasks:
                await asyncio.gather(*list(pending_tasks), return_exceptions=True)
            await context.close()

    async def extract_search_videos(
        self,
        query: str,
        limit: int = 20,
        cookies_path: Optional[str] = None,
        timeout_secs: float = 15.0,
    ) -> List[Dict[str, Any]]:
        """Executa busca headless no TikTok e retorna dicionários com os nós de vídeo brutos."""
        try:
            if "PLAYWRIGHT_BROWSERS_PATH" not in os.environ:
                for candidate in ["/opt/playwright", "/app/.cache/ms-playwright", "/root/.cache/ms-playwright"]:
                    if os.path.exists(candidate):
                        os.environ["PLAYWRIGHT_BROWSERS_PATH"] = candidate
                        break
            from playwright.async_api import async_playwright
        except ImportError:
            logger.warning("Playwright não está instalado no ambiente.")
            return []

        clean_query = query.strip()
        extracted_items: List[Dict[str, Any]] = []
        captured_ids: set[str] = set()
        lock = asyncio.Lock()

        cookies = parse_netscape_cookies(cookies_path) if (cookies_path and os.path.exists(cookies_path)) else []

        # Constrói queries complementares inteligentes conforme o padrão da consulta
        words = clean_query.split()
        queries = [clean_query]
        if limit > 20:
            if len(words) >= 2:
                queries.extend([
                    f"{words[-1]} virais",
                    f"melhores {clean_query}",
                    f"{clean_query} brasil",
                ])
            else:
                queries.extend([f"{clean_query} virais", f"melhores {clean_query}", f"{clean_query} brasil"])
        if limit > 50:
            if len(words) >= 2:
                queries.extend([
                    f"top {clean_query}",
                    f"{clean_query} em alta",
                    f"{words[-1]} {words[0]}",
                    f"{words[-1]} divertidos",
                    f"{clean_query} novidades",
                    f"curiosidades {clean_query}",
                ])
            else:
                queries.extend([
                    f"top {clean_query}",
                    f"{clean_query} em alta",
                    f"curiosidades {clean_query}",
                    f"{clean_query} momentos",
                    f"{clean_query} clips",
                    f"{clean_query} gameplay",
                ])

        async with async_playwright() as p:
            launch_args = [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled",
                "--window-size=1920,1080",
            ]
            browser = await p.chromium.launch(
                executable_path=self.chrome_path,
                headless=True,
                args=launch_args,
            )
            try:
                # Dispara as buscas progressivamente com isolamento de contexto e micro-pausa
                for q in queries:
                    if len(extracted_items) >= limit:
                        break
                    try:
                        await self._fetch_query_in_context(
                            browser=browser,
                            query=q,
                            cookies=cookies,
                            target_limit=limit,
                            extracted_items=extracted_items,
                            captured_ids=captured_ids,
                            lock=lock,
                            timeout_secs=timeout_secs,
                        )
                    except Exception as query_exc:
                        logger.warning("Falha na busca individual '%s' no TikTok: %s", q, query_exc)
                    await asyncio.sleep(0.3)
            except Exception as exc:
                logger.error("Erro durante execução do worker Playwright do TikTok: %s", exc)
            finally:
                await browser.close()

        return extracted_items[:limit]

    async def _extract_from_dom(self, page: Any, limit: int) -> List[Dict[str, Any]]:
        """Extrai links de vídeo diretamente do DOM caso a API interna não responda."""
        dom_items: List[Dict[str, Any]] = []
        try:
            links = await page.query_selector_all('a[href*="/video/"]')
            for link in links[:limit]:
                href = await link.get_attribute("href")
                if not href or "/video/" not in href:
                    continue
                parts = href.split("/video/")
                video_id = parts[1].split("?")[0].strip("/")
                author_handle = parts[0].split("/")[-1].replace("@", "")
                dom_items.append({
                    "id": video_id,
                    "desc": f"TikTok Video {video_id}",
                    "author": {"uniqueId": author_handle, "nickname": author_handle},
                    "stats": {"playCount": 0, "diggCount": 0, "commentCount": 0, "shareCount": 0},
                })
        except Exception as exc:
            logger.debug("Fallback DOM do Playwright falhou: %s", exc)
        return dom_items
