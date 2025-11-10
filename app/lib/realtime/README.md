# Real-Time Notifications with Socket.io

This directory contains the Socket.io infrastructure for real-time notifications in EmpowerGrid.

## Architecture

- **Server** (`socketServer.ts`): Socket.io server setup for emitting notifications
- **Client** (`socketClient.ts`): Client-side Socket.io connection manager
- **Context** (`../../contexts/SocketContext.tsx`): React context for Socket.io throughout the app
- **Components** (`../../components/notifications/`): UI components for displaying notifications
- **Helpers** (`notificationHelpers.ts`): Utility functions to emit notifications

## Setup

### 1. Install Dependencies

```bash
npm install socket.io socket.io-client
```

### 2. Server Setup

For Next.js, you have two options:

#### Option A: Custom Server (Recommended for Production)

Create a custom server file (`server.js`):

```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { initializeSocketServer } = require('./app/lib/realtime/socketServer');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.io server
  initializeSocketServer(server);

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});
```

Then update `package.json`:

```json
{
  "scripts": {
    "dev": "node server.js",
    "start": "NODE_ENV=production node server.js"
  }
}
```

#### Option B: API Routes (Development)

For development, notifications will be queued in the database and shown on next page load. The Socket.io server can be initialized later.

### 3. Client Setup

The client is automatically initialized via `SocketProvider` in `_app.tsx`. No additional setup needed.

## Usage

### Emitting Notifications

Use the helper functions in `notificationHelpers.ts`:

```typescript
import { emitMilestoneVerified, emitTransactionConfirmed } from '../lib/realtime/notificationHelpers';

// Emit milestone verification
await emitMilestoneVerified(
  userId,
  projectId,
  milestoneId,
  'Solar Farm Alpha',
  'Equipment Delivery'
);

// Emit transaction confirmation
await emitTransactionConfirmed(
  userId,
  transactionHash,
  1000,
  'USDC',
  'Solar Farm Alpha'
);
```

### Listening to Notifications

Use the `useSocket` hook in components:

```typescript
import { useSocket } from '../contexts/SocketContext';

function MyComponent() {
  const { notifications, unreadCount, isConnected } = useSocket();
  
  // Notifications are automatically received and stored
  // Use NotificationCenter component to display them
}
```

### Displaying Notifications

The `NotificationCenter` component is already integrated into `TopNav`. It displays:
- Real-time notification toasts
- Notification center dropdown with filtering
- Unread count badge

## Notification Types

- `milestone:verified` - Milestone verified by validators
- `milestone:delayed` - Milestone deadline delayed
- `milestone:released` - Funds released for milestone
- `transaction:confirmed` - Transaction confirmed on-chain
- `transaction:failed` - Transaction failed
- `project:funded` - Project received funding
- `project:statusChanged` - Project status updated
- `governance:proposalCreated` - New governance proposal
- `governance:voteCast` - Vote cast on proposal

## Integration Points

1. **Milestone Verification** (`pages/api/milestones/verification/`)
   - Call `emitMilestoneVerified()` when milestone is verified
   - Call `emitMilestoneDelayed()` when milestone is delayed
   - Call `emitMilestoneReleased()` when funds are released

2. **Transaction Handlers** (`pages/api/projects/[id]/fund.ts`)
   - Call `emitTransactionConfirmed()` on successful transaction
   - Call `emitTransactionFailed()` on failed transaction

3. **Project Funding** (`pages/api/projects/[id]/fund.ts`)
   - Call `emitProjectFunded()` when project receives funding

## Testing

To test notifications locally:

1. Start the Socket.io server (if using custom server)
2. Connect a wallet
3. Trigger a milestone verification or transaction
4. Check the notification center in the top nav

## Production Considerations

1. **Authentication**: Ensure Socket.io connections are authenticated
2. **Rate Limiting**: Implement rate limiting for notification emissions
3. **Scaling**: Use Redis adapter for Socket.io in multi-server setups
4. **Monitoring**: Monitor Socket.io connection counts and message rates
5. **Fallback**: Store notifications in database as fallback if Socket.io is unavailable

