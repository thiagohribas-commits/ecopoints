import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // O json-server reescreve o db.json a cada alteração; evita recarregar a página
    watch: { ignored: ['**/db.json'] },
  },
});
