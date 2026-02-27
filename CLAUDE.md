# Falco App - Coffee Shop Management System

## Project Overview
Falco is a desktop POS and management system for a coffee shop, built with Tauri v2.

## Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Node.js + Express (port 3001) + SQLite (better-sqlite3)
- **Desktop**: Tauri v2 (Rust)
- **UI**: Tailwind CSS v4, Radix UI (shadcn), Tabler Icons
- **Forms**: React Hook Form + Zod validation
- **Tables**: TanStack React Table
- **Toasts**: Sonner

## Project Structure
```
src/                          # Frontend
  modules/                     # Feature modules (each has components/, pages/, hooks/, types/)
    home/                      # Dashboard
    hall/                      # POS / Salon (orders, tables, checkout)
    menu/                      # Menu management (carta)
    calibration/               # Coffee calibration
    cost-engine/               # Cost calculation engine
    reports/                   # Analytics & reporting
    resume/                    # Summary page
    commons/                   # Shared (theme provider)
  components/ui/              # Shared UI components (shadcn)
  routes/index.tsx             # Route definitions (lazy loaded)
  routes/paths.ts              # RoutePaths enum
  layouts/main-layout.tsx      # App shell with sidebar
  components/app-sidebar.tsx   # Navigation sidebar

backend/                      # Backend API
  server.ts                    # Express app, all routers mounted at /api
  controllers/<Name>Controller.ts
  models/<Name>Model.ts
  routers/<Name>Router.ts
  db.ts                        # SQLite schema & init
  app.db                       # SQLite database file
```

## Conventions

### Language
- UI text is in **Spanish** (toasts, labels, headings, placeholders)
- Code (variables, functions, comments) is in **English**

### Frontend Module Pattern
Every module in `src/modules/<name>/` follows:
1. `index.tsx` — Main page component (default export)
2. `components/` — Module-specific components
3. `types/` — TypeScript interfaces (optional)
4. `hooks/` — Custom hooks (optional)

### Backend Pattern
For each feature:
1. `routers/<Name>Router.ts` — Express router with route definitions
2. `controllers/<Name>Controller.ts` — Request handlers
3. `models/<Name>Model.ts` — SQLite queries using better-sqlite3

### API
- Base URL: `http://localhost:3001/api`
- All routers mounted at `/api` in `backend/server.ts`
- Frontend fetches use plain `fetch()` (no axios)

### Routing
- Routes defined in `src/routes/index.tsx` using react-router-dom
- Path constants in `src/routes/paths.ts` (RoutePaths enum)
- All pages lazy-loaded with `React.lazy()`
- Sidebar navigation in `src/components/app-sidebar.tsx`

### Styling
- Use Tailwind CSS utility classes
- Dark mode via CSS variables: `text-[var(--primary-text)]`, etc.
- shadcn components from `@/components/ui/`

## Commands
- `npm run dev` — Start Vite frontend (port 5173)
- `cd backend && npm run dev` — Start Express backend (port 3001)
- `npm run develop` — Run frontend + backend + Tauri together
- `npm run build` — Production build
