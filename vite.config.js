import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/Ai-Chatbot-Restaurant/',
  envPrefix: ['VITE_', 'API_'],
  build: { chunkSizeWarningLimit: 700 }
});
