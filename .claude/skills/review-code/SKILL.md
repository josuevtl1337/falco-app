---
name: review-code
description: Review code for quality, security, and consistency with Falco app conventions.
argument-hint: "[file-path or module-name]"
allowed-tools: "Read, Grep, Glob"
---

# Code Review for Falco App

Review the code at `$ARGUMENTS` and check for:

## Correctness
- Does the logic work as intended?
- Are there edge cases not handled?
- Are API responses properly checked (`response.ok`)?

## Conventions
- UI text in Spanish?
- Code in English?
- Using `fetch()` (not axios)?
- Using shadcn components from `@/components/ui/`?
- Following the module pattern (index.tsx, components/, types/)?

## Security
- SQL injection risks (should use parameterized queries)?
- Sensitive data exposed in console.log?
- Missing input validation on the backend?

## Performance
- Unnecessary re-renders?
- Missing `useCallback` or `useMemo` where needed?
- N+1 query patterns in the backend?

## Output format
For each issue found:
- **File**: path and line number
- **Issue**: what's wrong
- **Fix**: specific recommendation

If everything looks good, say so briefly.
