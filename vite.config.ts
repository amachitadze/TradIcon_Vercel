import path from 'path';
import { defineConfig, loadEnv } from 'vite';


export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // Vercel-ის CI/CD და ლოკალურ გარემოში ცვლადების უნივერსალური წაკითხვა
    const geminiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || process.env.API_KEY || env.API_KEY || '';
    const groqKey = process.env.GROQ_API_KEY || env.GROQ_API_KEY || '';
    const openRouterKey = process.env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY || '';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: true,
      },
      preview: {
        allowedHosts: true,
      },
      plugins: [],
      define: {
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
