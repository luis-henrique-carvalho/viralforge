import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

const sourceDir = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.VITE_BACKEND_PROXY_TARGET || env.BACKEND_URL || 'http://127.0.0.1:8000'

  return {
    plugins: [
      TanStackRouterVite({
        routesDirectory: './src/routes',
        generatedRouteTree: './src/routeTree.gen.ts',
      }),
      tailwindcss(),
      viteReact(),
    ],
    resolve: {
      alias: {
        '@': sourceDir,
      },
    },
    server: {
      port: 5176,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/videos': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/thumbnails': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/fonts': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
