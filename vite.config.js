import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: '../htdocs',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // AWS SDK - largest dependency (~400KB)
          'aws-sdk': ['@aws-sdk/client-s3'],
          // Supabase - auth and database (~150KB)
          'supabase': ['@supabase/supabase-js'],
          // React ecosystem
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI utilities
          'ui-vendor': ['lucide-react', 'date-fns', 'clsx', 'tailwind-merge'],
        },
      },
    },
  },
})