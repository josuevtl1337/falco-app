---
name: new-module
description: Scaffold a complete new module for the Falco coffee shop app. Creates frontend page, backend API (router, controller, model), database table, route registration, and sidebar entry.
argument-hint: "[module-name] [description-in-spanish]"
allowed-tools: "Read, Write, Edit, Grep, Glob, Bash"
---

# New Module Scaffolder

Create a complete new module named `$0` for Falco app.

## What to create

### 1. Database Table
- Add a new table in `backend/db.ts` inside the `initializeDatabase()` function
- Follow the existing pattern: `CREATE TABLE IF NOT EXISTS`
- Include `id INTEGER PRIMARY KEY AUTOINCREMENT` and `created_at DATETIME DEFAULT CURRENT_TIMESTAMP`

### 2. Backend Model (`backend/models/$0Model.ts`)
- Export functions for CRUD: `getAll`, `getById`, `create`, `update`, `delete`
- Use `better-sqlite3` with the `db` import from `../db`
- Follow the pattern from existing models

### 3. Backend Controller (`backend/controllers/$0Controller.ts`)
- Import the model
- Export request handler functions (req, res) for each CRUD operation
- Wrap in try/catch, return JSON responses
- Follow existing controller patterns

### 4. Backend Router (`backend/routers/$0Router.ts`)
- Create Express router with RESTful routes
- Mount at `/api/<module-name>`
- Import controller functions
- Follow existing router patterns

### 5. Register Router
- Add import and `app.use("/api", ...)` in `backend/server.ts`

### 6. Frontend Page (`src/modules/<module-name>/index.tsx`)
- Create main page component with default export
- Include state management with useState/useEffect
- Fetch data from `http://localhost:3001/api/<module-name>`
- Use sonner toast for notifications
- UI text in **Spanish**
- Follow the pattern from `src/modules/stock/index.tsx`

### 7. Frontend Components
- Create `src/modules/<module-name>/components/` directory
- Add a data table component if the module displays a list

### 8. Register Route
- Add lazy import in `src/routes/index.tsx`
- Add route entry in the routes array
- Add path to `RoutePaths` enum in `src/routes/paths.ts`

### 9. Add to Sidebar
- Add navigation entry in `src/components/app-sidebar.tsx`
- Choose an appropriate Tabler icon

## Important rules
- UI labels, headings, toasts, and placeholders must be in **Spanish**
- Code (variables, functions) must be in **English**
- Use existing UI components from `@/components/ui/`
- Use `fetch()` for API calls (not axios)
- Follow the exact patterns already established in the codebase
