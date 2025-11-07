# Next.js Routing Bug Report

## Summary
Next.js incorrectly reports a routing conflict between `[id]` and `[projectId]` when no such conflict exists in the file system.

## Environment
- **Next.js Version:** 14.2.32 (also tested with 16.0.1 - error persists)
- **Node.js Version:** (check with `node --version`)
- **OS:** Windows 10
- **Error Location:** `node_modules/next/dist/shared/lib/router/utils/sorted-routes.js:94:31`

## Error Message
```
Error: You cannot use different slug names for the same dynamic path ('id' !== 'projectId').
    at handleSlug (sorted-routes.js:94:31)
    at UrlNode._insert (sorted-routes.js:131:17)
    at UrlNode._insert (sorted-routes.js:142:40)
    at UrlNode._insert (sorted-routes.js:142:40)
    at UrlNode.insert (sorted-routes.js:13:14)
```

## Route Structure

### Actual File System Structure:
```
pages/api/projects/
  ├── [id]/index.ts              ✅ EXISTS
  ├── [id]/                      ✅ EXISTS (directory)
  │   ├── bookmark.ts
  │   ├── fund.ts
  │   ├── funding-progress.ts
  │   ├── milestones.ts
  │   └── governance/
  │       └── proposals.ts
  ├── index.ts
  ├── compare.ts
  └── search/
      └── suggestions.ts
```

### What Next.js Reports:
- Next.js claims there's a conflict between `[id]` and `[projectId]` at the same path level
- **NO `[projectId]` file or directory exists** in `pages/api/projects/`

## Investigation Steps Taken

1. ✅ **Manual File System Check**
   - Verified no `[projectId]` file or directory exists
   - Checked for hidden files
   - Verified file names are correct (no typos or hidden characters)

2. ✅ **Recreated Directory Structure**
   - Deleted and recreated `[id]` directory
   - Restored all files
   - Error persists

3. ✅ **Next.js Version Testing**
   - Updated to Next.js 16.0.1 - error persists
   - Downgraded to 14.2.32 - error persists

4. ✅ **Configuration Check**
   - No route rewrites/redirects in `next.config.js`
   - No route-related configuration issues found

5. ✅ **Route File Analysis**
   - No route files found that use both `[id]` and `[projectId]` patterns
   - No route files found that Next.js might be misinterpreting

6. ✅ **Isolation Testing**
   - Removed `[id].ts` file - error persists (issue is with `[id]/` directory)
   - Error occurs during route tree construction in Next.js

## Expected Behavior
Next.js should accept the route structure:
- `pages/api/projects/[id]/index.ts` - handles `/api/projects/[id]`
- `pages/api/projects/[id]/` - handles `/api/projects/[id]/...`

This is a valid Next.js route structure and should not cause conflicts.

## Actual Behavior
Next.js incorrectly detects a conflict between `[id]` and `[projectId]` and crashes during server startup, preventing the application from running.

## Workaround Attempts
- Recreating directory structure - ❌ Failed
- Removing `[id].ts` file - ❌ Error persists
- Updating/downgrading Next.js - ❌ Error persists
- Clearing all caches - ❌ Error persists

## Impact
- **Severity:** Critical
- **Impact:** Application cannot start - returns 500 Internal Server Error
- **Workaround:** None found yet

## Additional Context
The error occurs in Next.js's internal route sorting/validation logic (`sorted-routes.js`). The `handleSlug` function is detecting a conflict that doesn't exist in the actual file system.

## Reproduction Steps
1. Create `pages/api/projects/[id]/index.ts`
2. Create `pages/api/projects/[id]/` directory with nested routes
3. Run `npm run dev`
4. Next.js reports routing conflict error
5. Server fails to start

## Files Involved
- `pages/api/projects/[id]/index.ts`
- `pages/api/projects/[id]/bookmark.ts`
- `pages/api/projects/[id]/fund.ts`
- `pages/api/projects/[id]/funding-progress.ts`
- `pages/api/projects/[id]/milestones.ts`
- `pages/api/projects/[id]/governance/proposals.ts`

## Next Steps
1. Report to Next.js GitHub issues
2. Try alternative route structure (catch-all routes)
3. Check for Next.js patches or workarounds

