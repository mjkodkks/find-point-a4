import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: "/find-point-a4-coordinate-system-percent",
  server: {
    port: 5454
  }
})
