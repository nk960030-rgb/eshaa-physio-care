import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      
      manifest: {
  name: 'Eshaa Physio Care',
  short_name: 'EshaaPhysio',
  description: 'AI-Powered Physiotherapy Portal',
  theme_color: '#2563eb',
  background_color: '#f8fafc',
  display: 'standalone',
  icons: [
    {
      src: 'logo.png', // Change this from vite.svg
      sizes: '192x192',
      type: 'image/png'
    },
    {      src: 'logo.png', // Change this from vite.svg
      sizes: '512x512',
      type: 'image/png'
    }
  ]
}
    })
  ]
})