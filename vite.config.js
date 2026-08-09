import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        prelaunch: resolve(process.cwd(), 'prelaunch.html'),
        contact: resolve(process.cwd(), 'contact.html'),
        membershipApply: resolve(process.cwd(), 'membership-apply.html'),
        donate: resolve(process.cwd(), 'donate.html'),
        trustCenter: resolve(process.cwd(), 'trust-center.html')
      }
    }
  }
})
