import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base = '/amor-de-bicho/' so asset URLs resolve under the GitHub Pages project path.
export default defineConfig({ base: '/amor-de-bicho/', plugins: [react(), tailwindcss()] })
