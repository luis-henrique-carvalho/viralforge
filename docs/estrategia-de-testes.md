# Estratégia da Pirâmide de Testes — ViralForge (`web/`)

> **Documento Oficial de Engenharia de Qualidade e Diretrizes de Testes**  
> **Status:** Ativo e Versionado  
> **Escopo:** Novo Frontend (`web/`)

---

## 1. Visão Geral da Pirâmide de Testes

O **ViralForge** adota a estratégia clássica da **Pirâmide de Testes** para equilibrar velocidade de feedback no desenvolvimento local, fidelidade nas interações do usuário e cobertura dos fluxos críticos de ponta a ponta:

```text
               /\
              /  \      ▲ TOPO: Testes E2E (Playwright)
             / E2E\     │ Poucos testes, alta fidelidade. Valida jornadas completas.
            /------\    │ Local: web/tests/e2e/
           / Integ. \   │
          /----------\  │ MEIO: Testes de Integração & Componentes (Testing Library + MSW v2)
         /  Unitários \ │ Quantidade moderada. Testa telas, formulários e requisições com API mockada.
        /______________\│
                        ▼ BASE: Testes Unitários (Vitest + JSDOM)
                        Muitos testes, execução ultrarrápida. Testa lógica pura, helpers e stores.
```

---

## 2. Camadas da Pirâmide

### 2.1. Base: Testes Unitários
- **Ferramentas:** [Vitest](https://vitest.dev) + [JSDOM](https://github.com/jsdom/jsdom).
- **O que testar:**
  - Funções puras, utilitários (`src/lib/utils.ts`).
  - Tratamento e parsing de erros (`src/api/handle-api-error.ts`).
  - Lógica de transformação de dados e formatters.
  - Stores globais do [Zustand](https://github.com/pmndrs/zustand).
- **Localização:** Co-localizados ao lado do arquivo de implementação (ex.: `utils.ts` → `utils.test.ts`).
- **Regra dos Schemas Zod:**
  > ⚠️ **Diretriz:** Schemas Zod (`*.schema.ts`) e definições de tipos TypeScript (`*.types.ts`) **NÃO** necessitam de arquivos de teste unitários dedicados, pois sua validação é intrinsecamente coberta pelos testes de integração dos formulários e views. Estão explicitamente excluídos do cálculo de cobertura do Vitest.

---

### 2.2. Meio: Testes de Componentes e Integração
- **Ferramentas:** [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/) + [MSW v2 (Mock Service Worker)](https://mswjs.io).
- **O que testar:**
  - Renderização correta de Views (`views/*.tsx`) e Componentes (`components/*.tsx`).
  - Comportamento de formulários ao submeter dados válidos/inválidos.
  - Exibição de estados de carregamento (`Skeleton`), sucesso e erro.
  - Sincronização e cache do [TanStack Query](https://tanstack.com/query) contra endpoints mockados pelo MSW.
- **Estrutura do MSW por Feature:**
  - Cada feature define seus próprios handlers de API em `src/features/<feature>/mocks/handlers.ts`.
  - O arquivo central [`src/test-utils/server.ts`](file:///home/luis/repositories/viralforge/web/src/test-utils/server.ts) compõe todos os handlers e inicializa o servidor de mock no Node.
  - O ciclo de vida do MSW é controlado automaticamente no [`src/test-setup.ts`](file:///home/luis/repositories/viralforge/web/src/test-setup.ts):
    ```ts
    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())
    ```
- **Helper de Renderização:**
  - Utilizar sempre o helper [`renderWithProviders`](file:///home/luis/repositories/viralforge/web/src/test-utils/render.tsx) em vez do `render` padrão do RTL. Ele envolve o componente testado em instâncias limpas e isoladas de `QueryClientProvider`, `SidebarProvider` e `TooltipProvider`.

---

### 2.3. Topo: Testes Ponta a Ponta (E2E)
- **Ferramentas:** [@playwright/test](https://playwright.dev).
- **O que testar:**
  - Jornadas completas do usuário (Happy Path).
  - Redirecionamento de rotas e navegação da Sidebar.
  - Criação de lotes no Viral Studio, alteração de parâmetros e envio para renderização.
- **Localização:** [`web/tests/e2e/`](file:///home/luis/repositories/viralforge/web/tests/e2e/).
- **Execução:** O Playwright sobe automaticamente o servidor Vite em `http://localhost:5176` conforme configurado em [`web/playwright.config.ts`](file:///home/luis/repositories/viralforge/web/playwright.config.ts).

---

## 3. Comandos e Scripts Disponíveis

Dentro do diretório `web/`:

| Comando | Função |
|---|---|
| `pnpm test` | Executa todos os testes unitários e de integração uma única vez |
| `pnpm test:watch` | Modo interativo watch que reexecuta os testes a cada alteração de código |
| `pnpm test:coverage` | Gera relatório completo de cobertura via V8 no terminal e em `coverage/` |
| `pnpm test:e2e` | Executa os testes de ponta a ponta com o Playwright |
| `pnpm lint` | Valida formatação e regras estritas do ESLint |
| `pnpm typecheck` | Executa a checagem estrita de tipos do TypeScript |

---

## 4. Política de Cobertura de Código (Code Coverage)

Configurada em [`web/vitest.config.ts`](file:///home/luis/repositories/viralforge/web/vitest.config.ts) utilizando o motor `@vitest/coverage-v8`:

- **Threshold Mínimo Global:** **75%** para Linhas, Funções e Statements; **70%** para Branches.
- **Arquivos Ignorados da Cobertura:**
  - `src/components/ui/**` (código gerado pelo catálogo do Shadcn).
  - `src/**/*.schema.ts` e `src/**/*.types.ts` (contratos Zod e tipos TypeScript).
  - `src/routeTree.gen.ts` (gerado automaticamente pelo TanStack Router).
  - `src/test-utils/**` (utilitários de teste).

---

## 5. Guia Prático: Como Criar Testes para uma Nova Feature

Ao implementar uma nova feature (ex.: `features/viral-studio`):

### Passo 1: Mock dos Endpoints (MSW)
Crie `src/features/viral-studio/mocks/handlers.ts`:
```ts
import { http, HttpResponse } from 'msw'

export const viralStudioHandlers = [
  http.get('/api/viral-studio/batches', () => {
    return HttpResponse.json([{ id: 'batch-1', name: 'Podcast Shorts', status: 'completed' }])
  }),
]
```
Adicione os handlers em [`src/test-utils/server.ts`](file:///home/luis/repositories/viralforge/web/src/test-utils/server.ts).

### Passo 2: Teste de Componente / View
Crie `src/features/viral-studio/views/viral-studio-view.test.tsx`:
```tsx
import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/render'
import { ViralStudioView } from './viral-studio-view'

describe('ViralStudioView', () => {
  it('exibe a lista de lotes retornada pela API', async () => {
    renderWithProviders(<ViralStudioView />)
    await waitFor(() => {
      expect(screen.getByText('Podcast Shorts')).toBeInTheDocument()
    })
  })
})
```

### Passo 3: Teste de Mutação ou Ação de Usuário
```tsx
import userEvent from '@testing-library/user-event'

it('abre o modal de criação de lote ao clicar no botão', async () => {
  const user = userEvent.setup()
  renderWithProviders(<ViralStudioView />)

  await user.click(screen.getByRole('button', { name: /novo lote/i }))
  expect(screen.getByText(/criar novo lote/i)).toBeInTheDocument()
})
```
