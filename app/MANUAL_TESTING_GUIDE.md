# Manual Testing Guide - Auth & Admin Routes

## Quick Start

1. **Start the dev server** (if not already running):
   ```bash
   cd app
   npm run dev
   ```

2. **Open browser**: Navigate to `http://localhost:3000`

## Test Scenarios

### ✅ Test 1: Login Flow & Refresh Token Rotation

**Steps:**
1. Open browser DevTools (F12) → Network tab
2. Navigate to login page
3. Connect wallet and sign challenge
4. **Observe**: 
   - Login request succeeds
   - Access token and refresh token received
   - Session saved to localStorage

**Refresh Token Test:**
1. After login, wait 1-2 minutes
2. Make API requests (navigate pages, load projects)
3. **Check Network tab**: Look for automatic token refresh requests
4. **Verify**: New access token received without re-login

**Expected Results:**
- ✅ Login successful
- ✅ Tokens stored in localStorage
- ✅ Automatic token refresh works
- ✅ No forced re-login during active session

---

### ✅ Test 2: Admin Route Redirects

**Setup:**
- Login as a **non-admin** user (FUNDER or CREATOR role)

**Test Routes:**
1. `/admin/users` - Should redirect to `/unauthorized`
2. `/admin/projects` - Should redirect to `/unauthorized`
3. `/admin/transactions` - Should redirect to `/unauthorized`
4. `/admin/reputation` - Should redirect to `/unauthorized`
5. `/admin/monitoring` - Should redirect to `/unauthorized`

**Expected Results:**
- ✅ All admin routes redirect non-admins
- ✅ Redirect happens before page content loads
- ✅ User sees "Access Denied" or redirects to `/unauthorized`

**Admin User Test:**
- Login as ADMIN user
- **Verify**: All admin routes accessible
- **Verify**: Admin dashboard loads correctly

---

### ✅ Test 3: Session Persistence

**Steps:**
1. Login successfully
2. Refresh page (F5)
3. Close browser tab
4. Reopen browser and navigate to `http://localhost:3000`

**Expected Results:**
- ✅ Session persists after page refresh
- ✅ User remains logged in
- ✅ No need to re-login
- ✅ Session expires after 24 hours

**Session Expiry Test:**
1. Manually edit localStorage `empowergrid_session`
2. Set `expiresAt` to past date
3. Refresh page
4. **Verify**: User logged out and redirected to login

---

### ✅ Test 4: Logout Flow

**Steps:**
1. While logged in, click "Logout" button
2. Check localStorage
3. Try to access protected route

**Expected Results:**
- ✅ User logged out successfully
- ✅ LocalStorage cleared (`empowergrid_session` and `empowergrid_user` removed)
- ✅ Redirected to login page
- ✅ Protected routes redirect to login
- ✅ Token blacklisted (cannot reuse)

---

### ✅ Test 5: Protected Routes

**Test Protected Pages:**
- `/profile` - Requires authentication
- `/projects/create` - Requires CREATOR role
- `/projects/[id]/fund` - Requires FUNDER role
- `/governance/proposals/create` - Requires specific permissions

**Expected Results:**
- ✅ Unauthenticated users redirected to `/login`
- ✅ Users without required role redirected to `/unauthorized`
- ✅ Users without required permission redirected to `/unauthorized`
- ✅ Authenticated users with correct role/permissions see content

---

## Browser DevTools Checks

### Network Tab
- **Login Request**: `POST /api/auth/login` - Should return 201
- **Session Validation**: `GET /api/auth/session` - Should return 200
- **Token Refresh**: Automatic refresh before expiry
- **Admin Routes**: Should return 401/403 if not admin

### Application Tab → Local Storage
- `empowergrid_session`: Contains session data, token, expiresAt
- `empowergrid_user`: Contains user profile data

### Console Tab
- No authentication errors
- Session validation messages (if logged)
- Token refresh notifications (if enabled)

---

## Common Issues & Solutions

### Issue: "Session expired" immediately
**Solution**: Check `expiresAt` in localStorage is a valid future date

### Issue: Admin routes accessible to non-admins
**Solution**: Verify `withRole` middleware is applied to admin routes

### Issue: Refresh tokens not rotating
**Solution**: Check `handleAutomaticTokenRefresh` in `authMiddleware.ts` is enabled

### Issue: Redirects not working
**Solution**: Check `ProtectedRoute` component is properly checking auth state

---

## Success Criteria

✅ All login flows work correctly  
✅ Refresh tokens rotate automatically  
✅ Admin routes redirect non-admins  
✅ Session persists across page refreshes  
✅ Logout clears all session data  
✅ Protected routes enforce authentication and authorization  

---

## Test Results Template

```
Date: ___________
Tester: ___________

[ ] Login flow works
[ ] Refresh token rotation works
[ ] Admin routes redirect non-admins
[ ] Session persists
[ ] Logout works
[ ] Protected routes enforce auth

Notes:
_________________________________
_________________________________
```

