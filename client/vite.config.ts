import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0', // Allow access from any IP
    port: 3000,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})