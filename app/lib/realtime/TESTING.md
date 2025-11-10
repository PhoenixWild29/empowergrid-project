# Testing Real-Time Notifications

This guide explains how to test the Socket.io real-time notification system.

## Prerequisites

1. **Custom Server Running**: The Socket.io server requires the custom server (`server.js`) to be running
   ```bash
   npm run dev  # Uses custom server with Socket.io
   ```

2. **Database Setup**: Ensure your database is set up and migrations are applied
   ```bash
   npm run prisma:migrate
   ```

3. **Authentication**: You need to be authenticated (wallet connected) to receive notifications

## Testing Setup

### 1. Start the Server

```bash
cd app
npm run dev
```

You should see:
```
> Ready on http://localhost:3000
> Socket.io server running on /socket.io
```

### 2. Connect Wallet

1. Open the app in your browser: `http://localhost:3000`
2. Connect your Phantom wallet
3. Verify you're authenticated (check the top nav)

### 3. Test Milestone Verification Notifications

#### Option A: Via API (Direct)

```bash
# First, get a project ID and milestone ID from your database
# Then call the verification endpoint:

curl -X POST http://localhost:3000/api/milestones/[milestoneId]/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "verificationProof": {},
    "notes": "Test verification"
  }'
```

#### Option B: Via UI

1. Navigate to a project you've funded
2. If you're the project creator, submit a milestone verification
3. Check the notification center (bell icon) for the notification

### 4. Test Transaction Notifications

#### Option A: Via API (Direct)

```bash
# Fund a project
curl -X POST http://localhost:3000/api/projects/[projectId]/fund \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 100,
    "currency": "USDC",
    "walletAddress": "YOUR_WALLET_ADDRESS"
  }'
```

#### Option B: Via UI

1. Navigate to a project detail page
2. Click "Invest" and complete the funding flow
3. Check for:
   - Toast notification (bottom-right)
   - Notification center (bell icon)

## Expected Behavior

### Milestone Verification

When a milestone is verified:
- ✅ **Investors** receive: "Milestone Verified" notification
- ✅ **Toast** appears: Green success toast
- ✅ **Notification Center**: Shows in "milestone" filter

When a milestone is delayed:
- ⚠️ **Investors** receive: "Milestone Delayed" notification
- ⚠️ **Toast** appears: Amber warning toast
- ⚠️ **Notification Center**: Shows in "milestone" filter

### Transaction Confirmation

When a transaction succeeds:
- ✅ **Funder** receives: "Transaction Confirmed" notification
- ✅ **Project followers** receive: "Project Funded" notification
- ✅ **Toast** appears: Green success toast
- ✅ **Notification Center**: Shows in "transaction" filter

When a transaction fails:
- ❌ **Funder** receives: "Transaction Failed" notification
- ❌ **Toast** appears: Red error toast
- ❌ **Notification Center**: Shows in "transaction" filter

## Debugging

### Check Socket.io Connection

Open browser console and check for:
```
[Socket.io] Connected to server
[Socket.io] Authentication successful
```

### Check Server Logs

Look for:
```
[Server] Socket.io server initialized
[Socket.io] client connected
[Socket.io] client authenticated
```

### Common Issues

1. **No notifications appearing**
   - Check if Socket.io server is running (look for "Socket.io server running" in logs)
   - Verify you're authenticated (check top nav)
   - Check browser console for connection errors

2. **Notifications delayed**
   - Check network tab for `/api/realtime/emit` requests
   - Verify database has the correct user IDs
   - Check server logs for notification emission errors

3. **Socket.io not connecting**
   - Ensure custom server is running (`npm run dev`, not `npm run dev:next`)
   - Check CORS settings in `socketServer.ts`
   - Verify `NEXT_PUBLIC_SOCKET_URL` environment variable (if set)

## Manual Testing Checklist

- [ ] Server starts with Socket.io initialized
- [ ] Wallet connects and authenticates
- [ ] Socket.io client connects (check console)
- [ ] Milestone verification triggers notification
- [ ] Transaction confirmation triggers notification
- [ ] Toast notifications appear
- [ ] Notification center shows notifications
- [ ] Filtering works (all, unread, milestone, transaction)
- [ ] Mark as read works
- [ ] Unread count updates correctly

## Production Testing

For production, ensure:
1. Socket.io server is running on production server
2. Environment variables are set correctly
3. CORS is configured for your domain
4. Authentication is working
5. Database has proper indexes for notification queries

