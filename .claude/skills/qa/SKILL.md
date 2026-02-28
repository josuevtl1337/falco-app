---
name: qa
description: Run QA tests on a Falco module or recent changes. Checks TypeScript types, tests API endpoints (happy path + errors), runs a full integration flow, and cleans up test data automatically.
argument-hint: "[module-name] (optional — auto-detects from git diff if omitted)"
allowed-tools: "Read, Grep, Glob, Bash"
---

# QA Test Workflow

Target: `$ARGUMENTS` (if empty, auto-detect from recent git diff)

---

## Step 1 — Identify what to test

If `$ARGUMENTS` is provided:
- Use it as the module name (e.g. `stock`, `orders`, `menu`)

If `$ARGUMENTS` is empty:
- Run `git diff --name-only HEAD` to find uncommitted changed files
- If nothing uncommitted, run `git diff --name-only HEAD~1` for the last commit
- Map changed files to module names:
  - `backend/models/StockModel.ts` or `src/modules/stock/` → `stock`
  - `backend/models/OrderModel.ts` or `src/modules/hall/` → `orders`
  - `backend/models/MenuModel.ts` or `src/modules/menu/` → `menu`
  - etc.
- If multiple modules changed, test all of them

Once you have the module name(s):
- Read `backend/routers/<Name>Router.ts` to discover all endpoints
- Note which endpoints are GET (safe) vs POST/PATCH/DELETE (mutating)

---

## Step 2 — Verify backend is running

```bash
curl -s http://localhost:3001/api/get-orders
```

- If it responds → continue
- If it fails → stop and tell the user to run `cd backend && npm run dev` first

---

## Step 3 — TypeScript type check

```bash
cd backend && npx tsc --noEmit 2>&1
```

- Report every error with file + line number
- If there are errors: mark this step as ❌ FAIL but continue with the other steps
- If clean: mark as ✅ PASS

---

## Step 4 — API endpoint tests

For each endpoint discovered in Step 1, run these checks with `curl`:

### 4a. Happy path (GET endpoints)
- Call the endpoint with valid params
- Verify: HTTP 200, response is valid JSON, shape matches expectations

### 4b. Happy path (POST/PATCH/DELETE endpoints)
- Use test data prefixed with `QA_TEST_` so it's identifiable
- Verify: correct HTTP status (201 for create, 200 for update), response contains expected fields

### 4c. Validation errors
- Call with missing required fields → expect 400
- Call with an invalid/nonexistent ID → expect 404
- Verify the response contains an error message (not a 500)

### 4d. Report each endpoint result:
| Endpoint | Check | Status |
|----------|-------|--------|
| GET /api/... | Returns 200 + valid JSON | ✅ / ❌ |
| POST /api/... | Creates with valid body | ✅ / ❌ |
| POST /api/... | 400 on missing fields | ✅ / ❌ |

---

## Step 5 — Full integration flow

Run the complete business flow for the module end-to-end. Examples:

**stock module:**
1. Create a stock product (`POST /api/stock-products`, name prefixed `QA_TEST_`)
2. Create a menu mapping linking it to an existing menu item
3. Create a test order (`POST /api/orders`)
4. Pay the order (`PATCH /api/orders/:id/status` → `paid`)
5. Verify stock was deducted (`GET /api/stock-products/:id` → `current_stock` decreased)
6. Verify a movement was recorded (`GET /api/stock-movements`)

**orders module:**
1. Create an order with items (`POST /api/orders`)
2. Verify it appears in get-orders
3. Update its status to paid
4. Verify it appears in history

**menu module:**
1. Create a category and item (`POST`)
2. Fetch the item (`GET`)
3. Update it (`PATCH`)
4. Verify changes persisted

Adapt the flow to whatever module is being tested based on what the Router exposes.

---

## Step 6 — Cleanup

Delete every piece of test data created in Step 4b and Step 5:
- Call the appropriate DELETE endpoints
- If no DELETE endpoint exists, use `Bash` to run a direct SQLite delete:
  ```bash
  cd backend && npx tsx -e "import {db} from './db.ts'; db.prepare(\"DELETE FROM table WHERE name LIKE 'QA_TEST_%'\").run();"
  ```
- Verify cleanup: re-fetch and confirm the test records are gone
- If cleanup partially fails, list exactly what remains and how to remove it manually

---

## Step 7 — Final report

Output a clean summary table:

```
## QA Report — [module name] — [date]

| Check                        | Status | Detail                          |
|------------------------------|--------|---------------------------------|
| TypeScript (tsc --noEmit)    | ✅     | No errors                       |
| GET /api/...                 | ✅     | 200, shape correct              |
| POST /api/... (valid)        | ✅     | 201, ID returned                |
| POST /api/... (missing body) | ✅     | 400, error message present      |
| Integration flow             | ✅     | Full flow passed                |
| Test data cleanup            | ✅     | All QA_TEST_ records removed    |
```

If any check failed:
- Show the actual response received
- Show the expected response
- Give a brief diagnosis of what likely caused it

---

## Rules

- NEVER modify source code during QA — this skill is read + test only
- NEVER leave test data in the database (always clean up, even if tests fail)
- If the backend is down, stop immediately and say so — do NOT try to start it
- Test data must always use the `QA_TEST_` prefix in name/description fields
- UI text in the app is Spanish — but QA output/reports are in whatever language the user is using
