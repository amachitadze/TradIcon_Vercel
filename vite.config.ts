import path from 'path';
import { defineConfig, loadEnv } from 'vite';


export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    
    // Vercel CI/CD, Vite და ლოკალური გარემოს ცვლადების უნივერსალური ამოკითხვა
    const getVal = (...keys: string[]) => {
        for (const k of keys) {
            if (process.env[k] && process.env[k]?.trim()) return process.env[k]!.trim();
            if (env[k] && env[k]?.trim()) return env[k]!.trim();
            if (process.env[`VITE_${k}`] && process.env[`VITE_${k}`]?.trim()) return process.env[`VITE_${k}`]!.trim();
            if (env[`VITE_${k}`] && env[`VITE_${k}`]?.trim()) return env[`VITE_${k}`]!.trim();
        }
        return '';
    };

    const geminiKey = getVal('GEMINI_API_KEY', 'API_KEY');
    const groqKey = getVal('GROQ_API_KEY', 'GROQ_KEY');
    const openRouterKey = getVal('OPENROUTER_API_KEY', 'OPENROUTER_KEY');

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      preview: {
        allowedHosts: true,
      },
      plugins: [],
      define: {
        'window.__TRADICON_ENV__': JSON.stringify({
            GEMINI_API_KEY: geminiKey,
            GROQ_API_KEY: groqKey,
            OPENROUTER_API_KEY: openRouterKey
        }),
        'process.env.API_KEY': JSON.stringify(geminiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
        'process.env.GROQ_API_KEY': JSON.stringify(groqKey),
        'process.env.OPENROUTER_API_KEY': JSON.stringify(openRouterKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
