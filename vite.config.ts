import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({  
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    }
  },
  worker: {
    format: 'es',
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production',
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'echarts': ['echarts'],
          'three': ['three'],
          'vue': ['vue', 'vue-router', 'pinia', 'vue-i18n'],
        }
      }
    }
  }
})
