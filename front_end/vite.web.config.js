/**
 * Vite Web Configuration
 * Web端专用的Vite构建配置
 * ��持SPA部署和CDN优化
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const isWebBuild = process.env.BUILD_TARGET === 'web';

  return {
    // 基础路径 - 支持子目录部署
    base: isWebBuild && process.env.VITE_BASE_PATH
      ? process.env.VITE_BASE_PATH
      : '/',

    plugins: [
      react({
        // 为web构建优化JSX转换
        jsxImportSource: '@emotion/react',
        babel: {
          plugins: isProduction ? ['@emotion/babel-plugin'] : [],
        },
      }),
    ],

    // 定义环境变量
    define: {
      'process.env': {
        NODE_ENV: JSON.stringify(mode),
        BUILD_TARGET: JSON.stringify(process.env.BUILD_TARGET || 'electron'),
      },
      // 为web环境提供特殊标志
      __WEB_BUILD__: isWebBuild,
    },

    // 构建优化
    build: {
      // 输出目录
      outDir: isWebBuild ? 'dist-web' : 'dist',

      // 生成源码映射 (生产环境可选)
      sourcemap: isProduction ? false : true,

      // 设置chunk大小警告阈值
      chunkSizeWarningLimit: 1000,

      // 分包策略
      rollupOptions: {
        output: {
          // 手动分包
          manualChunks: {
            // React相关
            'react-vendor': ['react', 'react-dom'],

            // UI框架
            'mui-vendor': [
              '@mui/material',
              '@mui/icons-material',
              '@emotion/react',
              '@emotion/styled',
            ],

            // 图表库
            'charts-vendor': ['recharts'],

            // 语音相关
            'voice-vendor': ['@ricky0123/vad-web'],
          },

          // 文件命名
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name || '';
            if (name.endsWith('.css')) {
              return 'assets/css/[name]-[hash][extname]';
            }
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(name)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (/\.(woff2?|eot|ttf|otf)$/.test(name)) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
        },

        // 外部化依赖 (可选，用于CDN)
        external: isWebBuild && process.env.VITE_USE_CDN === 'true'
          ? [
              'react',
              'react-dom',
              '@mui/material',
              '@mui/icons-material',
            ]
          : [],
      },

      // 启用CSS代码分割
      cssCodeSplit: true,

      // 压缩配置
      minify: isProduction ? 'terser' : false,
      terserOptions: isProduction
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log'],
            },
            format: {
              comments: false,
            },
          }
        : {},
    },

    // 开发服务器配置
    server: {
      host: true,
      port: Number(process.env.VITE_DEV_PORT) || 3000,
      strictPort: true,

      // CORS配置
      cors: true,

      // 代理配置 - 开发环境转发API请求
      proxy: {
        '/api': {
          target: process.env.VITE_API_PROXY_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
          ws: true, // WebSocket支持
        },
        '/chat': {
          target: process.env.VITE_API_PROXY_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: 'ws://127.0.0.1:8000',
          changeOrigin: true,
          ws: true,
        },
      },

      // HMR配置
      hmr: {
        overlay: true,
      },
    },

    // 预览服务器配置
    preview: {
      port: 4173,
      host: true,
      strictPort: false,
    },

    // 依赖优化
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@mui/material',
        '@mui/icons-material',
        '@emotion/react',
        '@emotion/styled',
        'recharts',
      ],
      exclude: ['live2dcubismcore'],
    },

    // 路径解析
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@framework': path.resolve(__dirname, './src/live2d/framework/src'),
      },
      extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx'],
    },

    // CSS配置
    css: {
      modules: {
        localsConvention: 'camelCase',
      },
      preprocessorOptions: {
        css: {
          // 可选的CSS预处理器配置
        },
      },
    },
  };
});
