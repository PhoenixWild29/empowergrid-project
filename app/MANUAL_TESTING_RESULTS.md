# Manual Testing Results

**Date:** $(date)  
**Tester:** Automated Testing Checklist  
**Environment:** Development Server (localhost:3000)

## Test Execution Checklist

### ✅ Test 1: Login Flow & Wallet Authentication

**Steps to Test:**
1. Open browser and navigate to `http://localhost:3000`
2. Open DevTools (F12) → Network tab
3. Look for "Connect Wallet" button or login option
4. Click to connect wallet (Phantom wallet should be installed)
5. Sign the challenge message in the wallet popup
6. Observe the authentication flow

**Expected Results:**
- [ ] Login page/button is visible
- [ ] Wallet connection prompt appears
- [ ] Challenge message is generated (check Network tab for `/api/auth/challenge` request)
- [ ] Wallet signature is submitted (check Network tab for `POST /api/auth/login` request)
- [ ] Login request returns 201 status
- [ ] Access token and refresh token received in response
- [ ] Session saved to localStorage (`empowergrid_session` and `empowergrid_user`)
- [ ] User redirected to home page or dashboard
- [ ] User information displayed (username, wallet address, role)

**Network Tab Checks:**
- [ ] `POST /api/auth/challenge` - Returns 200 with nonce and message
- [ ] `POST /api/auth/login` - Returns 201 with tokens
- [ ] Response includes `accessToken`, `refreshToken`, `expiresIn`, `expiresAt`

**LocalStorage Checks:**
- [ ] `empowergrid_session` contains: `userId`, `walletAddress`, `token`, `expiresAt`
- [ ] `empowergrid_user` contains user profile data

---

### ✅ Test 2: Refresh Token Rotation

**Steps to Test:**
1. After successful login, wait 1-2 minutes
2. Navigate to different pages (home, profile, projects)
3. Make API requests that require authentication
4. Monitor Network tab for automatic token refresh

**Expected Results:**
- [ ] Automatic token refresh occurs before access token expires
- [ ] Refresh request: `POST /api/auth/refresh` (or similar)
- [ ] New access token received without user intervention
- [ ] No forced logout or re-authentication required
- [ ] Session remains active during active use

**Network Tab Checks:**
- [ ] Look for automatic refresh requests (may be triggered by middleware)
- [ ] New access token in response headers or response body
- [ ] Refresh token rotated (old refresh token invalidated)

**Console Checks:**
- [ ] No authentication errors
- [ ] Token refresh messages (if logged)

---

### ✅ Test 3: Admin Route Redirects

**Setup:**
- Login as a **non-admin** user (FUNDER or CREATOR role)

**Test Routes:**
1. Navigate to `/admin/users` - Should redirect to `/unauthorized`
2. Navigate to `/admin/projects` - Should redirect to `/unauthorized`
3. Navigate to `/admin/transactions` - Should redirect to `/unauthorized`
4. Navigate to `/admin/reputation` - Should redirect to `/unauthorized`
5. Navigate to `/admin/monitoring` - Should redirect to `/unauthorized`
6. Navigate to `/admin/dashboard` - Should redirect to `/unauthorized`
7. Navigate to `/admin/security` - Should redirect to `/unauthorized`
8. Navigate to `/admin/database` - Should redirect to `/unauthorized`
9. Navigate to `/admin/roles` - Should redirect to `/unauthorized`

**Expected Results:**
- [ ] All admin routes redirect non-admin users
- [ ] Redirect happens before page content loads
- [ ] User sees "Access Denied" or redirects to `/unauthorized` page
- [ ] No admin content is visible to non-admin users
- [ ] Redirect is immediate (no flash of admin content)

**Admin User Test:**
- [ ] Login as ADMIN user
- [ ] All admin routes are accessible
- [ ] Admin dashboard loads correctly
- [ ] Admin content is visible

**Network Tab Checks:**
- [ ] Admin route requests return 401/403 if not admin
- [ ] Redirect response (302 or client-side redirect)

---

### ✅ Test 4: Session Persistence

**Steps to Test:**
1. Login successfully
2. Refresh page (F5 or Ctrl+R)
3. Close browser tab
4. Reopen browser and navigate to `http://localhost:3000`

**Expected Results:**
- [ ] Session persists after page refresh
- [ ] User remains logged in after refresh
- [ ] No need to re-login after refresh
- [ ] Session persists when reopening browser tab
- [ ] User data is restored from localStorage
- [ ] Session expires after 24 hours (or configured expiry time)

**Session Expiry Test:**
1. Open DevTools → Application → Local Storage
2. Find `empowergrid_session` entry
3. Edit `expiresAt` to a past date (e.g., yesterday)
4. Refresh page
5. Verify user is logged out and redirected to login

**Expected Results:**
- [ ] Expired session detected
- [ ] User logged out automatically
- [ ] Redirected to login page
- [ ] localStorage cleared (`empowergrid_session` and `empowergrid_user` removed)

**Network Tab Checks:**
- [ ] `GET /api/auth/session` called on page load
- [ ] Session validation request returns 200 if valid
- [ ] Session validation returns 401 if expired

---

### ✅ Test 5: Logout Flow

**Steps to Test:**
1. While logged in, find and click "Logout" button
2. Check localStorage after logout
3. Try to access a protected route (e.g., `/profile`)
4. Try to make an authenticated API request

**Expected Results:**
- [ ] User logged out successfully
- [ ] LocalStorage cleared:
  - [ ] `empowergrid_session` removed
  - [ ] `empowergrid_user` removed
- [ ] Redirected to login page or home page
- [ ] Protected routes redirect to login after logout
- [ ] Token blacklisted (cannot reuse old token)
- [ ] User state cleared (no user data in memory)

**Network Tab Checks:**
- [ ] `POST /api/auth/logout` request sent (if implemented)
- [ ] Logout request returns 200/204
- [ ] Subsequent authenticated requests return 401

**Protected Route Test:**
- [ ] Try accessing `/profile` after logout → Should redirect to `/login`
- [ ] Try accessing `/admin/*` after logout → Should redirect to `/login`
- [ ] Try making API call after logout → Should return 401

---

## Additional Tests

### Protected Routes

**Test Protected Pages:**
- [ ] `/profile` - Requires authentication
- [ ] Unauthenticated users redirected to `/login`
- [ ] Authenticated users can access

**Role-Based Routes:**
- [ ] `/projects/create` - Requires CREATOR role
- [ ] `/projects/[id]/fund` - Requires FUNDER role
- [ ] `/governance/proposals/create` - Requires specific permissions

**Expected Results:**
- [ ] Unauthenticated users redirected to `/login`
- [ ] Users without required role redirected to `/unauthorized`
- [ ] Users without required permission redirected to `/unauthorized`
- [ ] Authenticated users with correct role/permissions see content

---

## Browser DevTools Checklist

### Network Tab
- [ ] Login Request: `POST /api/auth/login` - Returns 201
- [ ] Session Validation: `GET /api/auth/session` - Returns 200
- [ ] Token Refresh: Automatic refresh before expiry
- [ ] Admin Routes: Return 401/403 if not admin
- [ ] Logout Request: `POST /api/auth/logout` - Returns 200/204

### Application Tab → Local Storage
- [ ] `empowergrid_session`: Contains session data, token, expiresAt
- [ ] `empowergrid_user`: Contains user profile data
- [ ] Both cleared on logout
- [ ] Both cleared on session expiry

### Console Tab
- [ ] No authentication errors
- [ ] Session validation messages (if logged)
- [ ] Token refresh notifications (if enabled)
- [ ] No CORS errors
- [ ] No 401/403 errors after successful login

---

## Issues Found

### Issue 1: [Title]
**Description:**
**Steps to Reproduce:**
**Expected Behavior:**
**Actual Behavior:**
**Severity:** [Critical/High/Medium/Low]

### Issue 2: [Title]
**Description:**
**Steps to Reproduce:**
**Expected Behavior:**
**Actual Behavior:**
**Severity:** [Critical/High/Medium/Low]

---

## Test Summary

**Total Tests:** 5 main test scenarios + additional tests  
**Passed:** ___  
**Failed:** ___  
**Blocked:** ___  

**Overall Status:** [ ] ✅ Pass | [ ] ⚠️ Partial Pass | [ ] ❌ Fail

**Notes:**
_________________________________
_________________________________
_________________________________

