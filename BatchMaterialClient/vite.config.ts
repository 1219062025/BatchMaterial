import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import path from 'path';

export default defineConfig({
  server: {
    host: '0.0.0.0'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@utils': path.resolve(__dirname, 'src/utils')
    }
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg']
  },
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue'],
      dts: true,
      resolvers: [
        ElementPlusResolver(),
        IconsResolver({
          prefix: 'Icon'
        })
      ]
    }),
    Components({
      dts: true,
      resolvers: [
        IconsResolver({
          enabledCollections: ['ep']
        }),
        ElementPlusResolver()
      ]
    }),
    Icons({
      autoInstall: true
    })
  ]
});
