#!/usr/bin/env python3
"""
check_shadcn_usage.py — Validador de Uso Predominante de Componentes Shadcn UI

Garante que no projeto `web/src/`, desenvolvedores e agentes utilizem
componentes do catálogo Shadcn (`@/components/ui/*`) em vez de tags HTML
nativas equivalentes (<button>, <input>, <select>, <textarea>, <table>, <dialog>, <progress>).

Permite bypass explícito quando estritamente necessário via comentário:
// shadcn-ignore: <motivo>
"""

import os
import re
import sys
from pathlib import Path

# Mapeamento de tags HTML brutas para seus equivalentes Shadcn UI
TAG_REPLACEMENTS = {
    "button": {"component": "Button", "import": "@/components/ui/button"},
    "input": {"component": "Input", "import": "@/components/ui/input"},
    "textarea": {"component": "Textarea", "import": "@/components/ui/textarea"},
    "select": {"component": "Select", "import": "@/components/ui/select"},
    "dialog": {"component": "Dialog", "import": "@/components/ui/dialog"},
    "table": {"component": "Table", "import": "@/components/ui/table"},
    "progress": {"component": "Progress", "import": "@/components/ui/progress"},
}

EXCLUDED_DIRS = [
    "components/ui",      # O próprio catálogo do Shadcn
    "test-utils",         # Utilitários de teste
    "tests",              # Testes E2E / integration
]

TAG_PATTERN = re.compile(r"<\s*(" + "|".join(TAG_REPLACEMENTS.keys()) + r")\b")

def is_excluded(file_path: Path, web_src: Path) -> bool:
    rel_path = file_path.relative_to(web_src).as_posix()
    for exc in EXCLUDED_DIRS:
        if rel_path.startswith(exc):
            return True
    if file_path.name.endswith(".test.tsx") or file_path.name.endswith(".spec.tsx"):
        return True
    return False

def scan_file(file_path: Path, web_src: Path) -> list[dict]:
    violations = []
    try:
        lines = file_path.read_text(encoding="utf-8").splitlines()
    except Exception as e:
        print(f"Erro ao ler {file_path}: {e}", file=sys.stderr)
        return violations

    for line_idx, line in enumerate(lines, start=1):
        # Verifica se a linha ou a linha anterior possui bypass explícito
        if "shadcn-ignore" in line:
            continue
        if line_idx > 1 and "shadcn-ignore" in lines[line_idx - 2]:
            continue

        # Ignora type="hidden" em inputs (usado em formulários legados/tokens)
        if '<input' in line.lower() and 'type="hidden"' in line.lower():
            continue

        match = TAG_PATTERN.search(line)
        if match:
            tag_name = match.group(1).lower()
            replacement = TAG_REPLACEMENTS.get(tag_name)
            if replacement:
                violations.append({
                    "file": file_path.relative_to(web_src.parent.parent).as_posix(),
                    "line": line_idx,
                    "tag": tag_name,
                    "content": line.strip(),
                    "replacement": replacement,
                })

    return violations

def main():
    repo_root = Path(__file__).resolve().parent.parent
    web_src = repo_root / "web" / "src"

    if not web_src.exists():
        print(f"Diretório {web_src} não encontrado.")
        sys.exit(1)

    all_violations = []
    tsx_files = list(web_src.rglob("*.tsx"))

    for tsx_file in tsx_files:
        if is_excluded(tsx_file, web_src):
            continue
        violations = scan_file(tsx_file, web_src)
        all_violations.extend(violations)

    if all_violations:
        print("\033[1;31m=====================================================\033[0m")
        print("\033[1;31m  ✗ VIOLAÇÃO DA REGRA DE COMPONENTES SHADCN UI       \033[0m")
        print("\033[1;31m=====================================================\033[0m\n")
        print("Detectadas tags HTML nativas que devem usar componentes Shadcn UI:\n")

        for v in all_violations:
            print(f"  \033[1;33m{v['file']}:{v['line']}\033[0m")
            print(f"    Linha: \033[0;37m{v['content']}\033[0m")
            print(f"    Substituir: \033[1;32m<{v['tag']}> ➔ <{v['replacement']['component']}>\033[0m (import de '{v['replacement']['import']}')")
            print("    (Ou use '// shadcn-ignore: <motivo>' se for um caso especial)\n")

        print(f"\033[1;31mTotal de violações: {len(all_violations)}\033[0m")
        sys.exit(1)
    else:
        print("\033[1;32m✓ Shadcn UI Linter: Todos os componentes utilizam o catálogo Shadcn corretamente.\033[0m")
        sys.exit(0)

if __name__ == "__main__":
    main()
