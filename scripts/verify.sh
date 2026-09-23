#!/usr/bin/env bash
# ==============================================================================
# verify.sh — Validador Completo de Qualidade (Backend Python + Frontend Web)
# 
# Garante:
#  1. Backend (Python/clippyme): Ruff Lint + Suíte de Testes Host (Pytest)
#  2. Frontend (web): TypeScript Typecheck + ESLint + Vitest Coverage + Vite Build
#
# Uso:
#   ./scripts/verify.sh          # Executa todas as validações padrão
#   ./scripts/verify.sh --backend # Apenas backend Python
#   ./scripts/verify.sh --web     # Apenas frontend Web
#   ./scripts/verify.sh --e2e     # Inclui testes Playwright E2E do frontend Web
# ==============================================================================

set -eo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Cores para feedback visual no terminal
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

run_backend=true
run_web=true
run_e2e=false

for arg in "$@"; do
  case $arg in
    --backend)
      run_backend=true
      run_web=false
      ;;
    --web)
      run_backend=false
      run_web=true
      ;;
    --e2e)
      run_e2e=true
      ;;
    -h|--help)
      echo -e "${BOLD}Uso:${RESET} ./scripts/verify.sh [--backend | --web] [--e2e]"
      exit 0
      ;;
  esac
done

step() {
  echo -e "\n${BLUE}${BOLD}==>${RESET} ${BOLD}$1${RESET}"
}

success() {
  echo -e "${GREEN}✓ $1${RESET}"
}

error() {
  echo -e "${RED}✗ $1${RESET}" >&2
}

START_TIME=$(date +%s)

# ==============================================================================
# 1. BACKEND PYTHON (src/clippyme)
# ==============================================================================
if [ "$run_backend" = true ]; then
  echo -e "\n${YELLOW}${BOLD}=====================================================${RESET}"
  echo -e "${YELLOW}${BOLD}  1. BACKEND PYTHON (clippyme & tests)               ${RESET}"
  echo -e "${YELLOW}${BOLD}=====================================================${RESET}"

  step "[Backend 1/2] Ruff Lint (verificando sintaxe e regras de qualidade)..."
  if uv run --extra host-tests --with ruff ruff check src/clippyme tests --select E9,F63,F7,F82; then
    success "Ruff Lint passou sem erros."
  else
    error "Falha no Ruff Lint do Backend."
    exit 1
  fi

  step "[Backend 2/2] Pytest Host Suite (1400+ testes unitários e de domínio)..."
  if uv run --extra host-tests --with pytest --with pytest-mock python -m pytest -m "not integration" -q; then
    success "Testes do Backend passaram com sucesso."
  else
    error "Falha nos testes do Backend (pytest)."
    exit 1
  fi
fi

# ==============================================================================
# 2. FRONTEND WEB (web/ — Estratégia de Testes & Build)
# ==============================================================================
if [ "$run_web" = true ]; then
  echo -e "\n${YELLOW}${BOLD}=====================================================${RESET}"
  echo -e "${YELLOW}${BOLD}  2. FRONTEND WEB (web/ — Pirâmide de Testes & Build)${RESET}"
  echo -e "${YELLOW}${BOLD}=====================================================${RESET}"

  step "[Web 1/5] Shadcn UI Compliance Check (garantindo uso prioritário de @/components/ui/*)..."
  if ./scripts/check_shadcn_usage.py; then
    success "Componentes Shadcn UI validados com sucesso."
  else
    error "Falha no uso de componentes Shadcn UI."
    exit 1
  fi

  step "[Web 2/5] TypeScript Typecheck (TanStack Router + Strict TS)..."
  if pnpm --dir web typecheck; then
    success "Typecheck do Web passou sem erros."
  else
    error "Falha no Typecheck do Web."
    exit 1
  fi

  step "[Web 3/5] ESLint..."
  if pnpm --dir web lint; then
    success "ESLint do Web passou sem erros."
  else
    error "Falha no ESLint do Web."
    exit 1
  fi

  step "[Web 4/5] Vitest com Cobertura V8 (Unitários + Integração MSW v2)..."
  if pnpm --dir web test:coverage; then
    success "Testes e Thresholds de Cobertura do Web validados com sucesso."
  else
    error "Falha nos testes ou thresholds de cobertura do Web."
    exit 1
  fi

  step "[Web 5/5] Vite Production Build..."
  if pnpm --dir web build; then
    success "Build de produção do Web gerado com sucesso."
  else
    error "Falha no Build do Web."
    exit 1
  fi

  if [ "$run_e2e" = true ]; then
    step "[Web E2E] Playwright End-to-End Tests..."
    if pnpm --dir web test:e2e; then
      success "Testes E2E do Playwright passaram com sucesso."
    else
      error "Falha nos testes E2E do Playwright."
      exit 1
    fi
  fi
fi

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo -e "\n${GREEN}${BOLD}=====================================================${RESET}"
echo -e "${GREEN}${BOLD}  ✓ TODAS AS VALIDAÇÕES PASSARAM COM SUCESSO! (${ELAPSED}s) ${RESET}"
echo -e "${GREEN}${BOLD}=====================================================${RESET}\n"
