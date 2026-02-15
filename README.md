# AlexMap Backend

A Node.js/Express backend with real-time messaging capabilities, user authentication, and conversation management.

## Features

- � **JWT Authentication** - Secure user login/registration with role-based access
- 💬 **Real-time Chat** - Socket.IO powered instant messaging
- 📝 **Message Management** - Persistent message storage with pagination
- 🗂 **Conversation Management** - User-admin conversation pairing
- 👥 **User Roles** - Support for users and admins
- 🔄 **Database Transactions** - ACID compliance for data integrity

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **Socket.IO** - Real-time communication
- **TypeScript** - Type safety
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Zod** - Data validation

## API Endpoints

### Authentication
```
POST /bleep/v1/auth/register     - User registration
POST /bleep/v1/auth/login        - User login (returns lastConversationId for admins)
POST /bleep/v1/auth/refresh     - Token refresh
POST /bleep/v1/auth/logout      - User logout
```

### Messages
```
GET  /bleep/v1/messages/:conversationId  - Get conversation messages (paginated)
POST /bleep/v1/messages              - Send new message (also emits via Socket.IO)
```

### Conversations
```
GET  /bleep/v1/conversations        - Get all conversations for admin
```

### Nodes
```
GET    /map/v1/node              - Get all locations
GET    /map/v1/node/:id          - Get specific location
POST   /map/v1/node              - Create new location
PUT    /map/v1/node/:id          - Update location
DELETE /map/v1/node/:id          - Delete location
```

## Socket.IO Events

### Client → Server
- `authenticate` - Authenticate socket connection with JWT
- `join_conversation` - Join a conversation room
- `leave_conversation` - Leave a conversation room
- `send_message` - Send a real-time message
- `typing` - Start typing indicator
- `stop_typing` - Stop typing indicator

### Server → Client
- `new_message` - New message received (with populated sender details)
- `user_typing` - User started typing
- `user_stop_typing` - User stopped typing
- `auth_error` - Authentication failed
- `error` - General socket errors

## Database Schema

### User
```typescript
{
  name: string;           // Unique username
  displayName: string;     // Display name
  email: string;           // Email (optional)
  roles: {
    user: number;          // 2001
    admin?: number;         // 2003
  };
  password: string;        // Hashed password
  isOnline: boolean;      // Online status
  lastSeen: Date;         // Last activity
}
```

### Conversation
```typescript
{
  userId: ObjectId;        // Regular user ID
  adminId: ObjectId;       // Admin user ID
  lastMessage: string;      // Most recent message
  totalMessages: number;    // Total message count
  unreadCount: number;      // Unread message count
}
```

### Message
```typescript
{
  conversationId: ObjectId;  // Conversation reference
  senderId: ObjectId;       // Message sender
  receiverId: ObjectId;     // Message receiver
  message: string;          // Message content
}
```

## Environment Variables

```bash
NODE_ENV=development
PORT=3000
JWT_SECRET=your-jwt-secret-here
MONGODB_URI=mongodb://localhost:27017/alexmap
VITE_SOCKET_URL=http://localhost:3001
```

## Test Accounts

For testing purposes, you can use these pre-configured accounts:

### Admin Account
- **Email:** `admin@gmail.com`
- **Password:** `Monkey$99`
- **Role:** Admin (2003)

### User Accounts
- **User 1:**
  - **Email:** `alice@gmail.com`
  - **Password:** `Monkey$99`
  - **Role:** User (2001)

- **User 2:**
  - **Email:** `tester@gmail.com`
  - **Password:** `Monkey$99`
  - **Role:** User (2001)

### Registration Example

To create a new user account, send a POST request to `/bleep/v1/auth/register`:

```json
{
    "name": "tester",
    "password": "Monkey$99",
    "email": "tester@gmail.com"
    "roles": {
        "user": 2001
    }
}
```

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

> **Note:** These accounts are for development and testing purposes only. In production, use secure authentication practices.

## Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt for password security
- **Role-based Access** - User vs Admin permissions
- **Input Validation** - Zod schema validation
- **Socket Authentication** - Socket connections require valid JWT
- **Conversation Access Control** - Users can only access their conversations

## Real-time Features

- **Instant Messaging** - Messages delivered in real-time via Socket.IO
- **Typing Indicators** - Live typing notifications
- **Online Status** - Track user presence
- **Room-based Broadcasting** - Efficient message delivery
- **HTTP + Socket Sync** - Messages created via API also broadcast

## Development

### Project Structure
```
src/
├── controllers/     # Route handlers
├── middleware/       # Express middleware
├── modals/          # Mongoose models
├── routes/           # API routes
├── socket/           # Socket.IO handlers
├── utils/            # Utility functions
├── validations/       # Zod schemas
├── constants/        # App constants
└── app.ts           # Express app setup
```

### Testing
```bash
# Run all tests
npm test

# Run specific test
npm test -- --testNamePattern="should maintain"

# Run with coverage
npm run test:coverage
```

## Production Deployment

1. **Environment Setup**
   ```bash
   export NODE_ENV=production
   export JWT_SECRET=your-production-secret
   export MONGODB_URI=your-production-db
   ```

2. **Build & Start**
   ```bash
   npm run build
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

---

**Built with ❤️ for real-time communication**
