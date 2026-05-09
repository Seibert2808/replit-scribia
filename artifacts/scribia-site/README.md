# ScribIA — Site

Site institucional do ScribIA (landing page + páginas secundárias).

## Stack
- React 18 + Vite + TypeScript
- TailwindCSS + shadcn/ui
- Framer Motion (animações)
- React Router (rotas client-side)
- React Helmet Async (SEO)

## Desenvolvimento

```bash
# Node 22 (use fnm/nvm)
npm install
npm run dev   # abre em http://localhost:8080
```

## Build

```bash
npm run build
npm run preview
```

## Deploy

Hospedado no **Vercel**. Push em `main` dispara deploy automático.

`vercel.json` redireciona todas as rotas para `index.html` (SPA).

## Páginas
- `/` — home
- `/participantes`
- `/organizadores`
- `/palestrantes` (também responde em `/influenciadores`)
- `/patrocinadores`

## Notas
- Botões de Login/Cadastro/CTA do tipo "Quero me inscrever" estão **inertes** (sem `onClick`/rota), marcados com `// TODO: hook up later`. Serão conectados ao novo app quando estiver pronto.
- O dialog "Agendar Sessão Estratégica" envia para o webhook n8n `sessaoestrategica` — funcional.
