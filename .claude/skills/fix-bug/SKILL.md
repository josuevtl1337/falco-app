---
name: fix-bug
description: Investigate and fix a bug in the Falco app. Use when something is broken, throwing errors, or behaving unexpectedly.
argument-hint: "[description of the bug]"
allowed-tools: "Read, Edit, Grep, Glob, Bash"
---

# Bug Fix Workflow

Fix this bug: $ARGUMENTS

## Steps to follow

### 1. Understand the bug
- Read the error message or description carefully
- Identify which module/feature is affected
- Determine if it's frontend, backend, or both

### 2. Locate the source
- Search for related files using Grep and Glob
- Read the relevant code to understand the flow
- Check both frontend (`src/modules/`) and backend (`backend/`) if needed

### 3. Identify root cause
- Trace the data flow from UI to API to database
- Check for common issues: typos, wrong endpoints, missing fields, type mismatches
- Look at recent git changes if relevant

### 4. Fix the bug
- Make the minimal change needed to fix the issue
- Do NOT refactor surrounding code
- Do NOT add features while fixing
- Keep the fix focused

### 5. Verify
- Explain what was wrong and what the fix does
- List all files changed
- Note if the user needs to restart the backend or frontend

## Rules
- Do NOT over-engineer the fix
- Do NOT add error handling beyond what's needed for this specific bug
- UI text stays in Spanish, code stays in English
