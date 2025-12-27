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
  theme_color: '#2563eb',
  background_color: '#f8fafc',
  display: 'standalone',
  icons: [
    {
      src: 'icon-192.png', // matches your filename
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: 'icon-512.png', // matches your filename
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable'
    }
  ]
}
    })
  ]
})