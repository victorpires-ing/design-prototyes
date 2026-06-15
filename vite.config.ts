import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  // O export para Figma (src/lib/figma-export) detecta os componentes do design
  // system lendo o `.name` da função na fiber do React. Em produção o esbuild
  // mangla esses nomes (Button → "e"), quebrando a detecção. keepNames preserva
  // os nomes de função/classe mesmo com minificação — sem isso o import na
  // Vercel cai em frames genéricos em vez de instâncias do DS.
  esbuild: {
    keepNames: true,
  },
})
