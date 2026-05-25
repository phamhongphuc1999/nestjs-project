# Technical Architecture — Real-Time Chat Application

> NestJS + PostgreSQL + TypeORM + Socket.IO + Redis

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Core Technologies](#2-core-technologies)
3. [Database Schema & Entity Relationships](#3-database-schema--entity-relationships)
4. [Authentication Flow](#4-authentication-flow)
5. [Conversation Flow](#5-conversation-flow)
6. [Message Flow](#6-message-flow)
7. [Real-Time Messaging (Socket.IO)](#7-real-time-messaging-socketio)
8. [API Endpoints](#8-api-endpoints)
9. [Full Use-Case Walkthrough](#9-full-use-case-walkthrough)
10. [Common Issues & Fixes](#10-common-issues--fixes)
11. [Development Setup](#11-development-setup)

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Client (Frontend)                            │
│  ┌─────────────┐  ┌──────────────────┐  ┌──────────────────────┐   │
│  │ REST Client  │  │ Socket.IO Client │  │   Web Browser        │   │
│  └──────┬──────┘  └────────┬─────────┘  └──────────────────────┘   │
└─────────┼──────────────────┼────────────────────────────────────────┘
          │                  │
          ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Backend (NestJS)                               │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              HTTP Layer (REST Controllers)                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │   │
│  │  │ UserController│  │Conversation  │  │MessageController  │    │   │
│  │  │  /user/*     │  │Controller    │  │  /message/*      │    │   │
│  │  └──────────────┘  │ /conversation/*│ └──────────────────┘    │   │
│  │                    └──────────────┘                           │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │           WebSocket Layer (Socket.IO Gateway)                  │   │
│  │  ┌──────────────────────────────────────────────────────┐    │   │
│  │  │              EventsGateway                            │    │   │
│  │  │  join_conversation → typing → send_message → ...    │    │   │
│  │  └──────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Service Layer (Business Logic)                   │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐   │   │
│  │  │ ConversationSvc│  │  MessageSvc     │  │  AuthService │   │   │
│  │  └────────┬───────┘  └───────┬────────┘  └──────┬───────┘   │   │
│  └──────────┼───────────────────┼──────────────────┼───────────┘   │
│             ▼                   ▼                  ▼                │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Repository Layer (Data Access)                   │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐   │   │
│  │  │ ConversationR  │  │  MessageR      │  │  UserR      │   │   │
│  │  │ ParticipantR   │  │                │  │              │   │   │
│  │  └────────────────┘  └────────────────┘  └──────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                              │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  PostgreSQL 16   │  │     Redis 7      │  │   MailHog        │  │
│  │  (Primary Store) │  │ (Cache + Pub/Sub)│  │ (Dev Email)      │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Technologies

### 2.1 Backend Framework — NestJS

- **Type**: Node.js framework built on Express
- **Architecture Pattern**: Modular (modules, controllers, services, repositories)
- **DI Container**: Built-in dependency injection via constructor
- **Decorators**: `@Module()`, `@Controller()`, `@Injectable()`, `@Entity()`

**File structure per feature:**
```
src/
├── controllers/        # HTTP route handlers (REST endpoints)
├── services/          # Business logic
├── repositories/      # Database access layer (extends TypeORM Repository)
├── entities/          # TypeORM entity definitions (mapped to DB tables)
├── events/            # Socket.IO gateway and utilities
├── dto/               # Data Transfer Objects (request/response shapes)
├── guards/            # Auth guards (TokenSecurityGuard)
├── databases/         # TypeORM DataSource configuration
├── migrations/        # Database migration files
├── configs/           # App configuration + enum configs
└── types/             # Shared TypeScript types and enums
```

### 2.2 ORM — TypeORM

- **Pattern**: Active Record (entities extend `BaseEntity`)
- **Relations**: `@ManyToOne`, `@OneToMany`, `@JoinColumn`
- **Migrations**: Generate SQL from entity changes
- **Lazy loading**: TypeORM's relation loader (`relations` option in `find`)

### 2.3 Real-Time — Socket.IO

- **Transport**: WebSocket with HTTP long-polling fallback
- **Rooms**: Scoped broadcasting (`conversation:${id}`)
- **Redis Adapter**: For horizontal scaling (multiple server instances)

### 2.4 Cache — Redis

- **Purpose**: Cache participant checks, Socket.IO pub/sub adapter
- **Data structure**: Redis Sets for `conversation:${id}:participants`

### 2.5 Authentication — JWT

- **Token types**: `ACCESS_TOKEN`, `REFRESH_TOKEN`, `EMAIL_VERIFY_TOKEN`
- **Guard**: `TokenSecurityGuard` — validates token + fetches user
- **Socket auth**: Token passed via `handshake.auth.token` or `Authorization` header

### 2.6 Docker Services

```yaml
services:
  postgres:   # PostgreSQL 16, port 5432
  mailhog:    # SMTP mock server, port 1025/8025
  redis:      # Redis 7, port 6379
```

---

## 3. Database Schema & Entity Relationships

### 3.1 Entity Relationship Diagram

```
┌──────────────────────┐       ┌──────────────────────────────────┐
│        User          │       │         Conversation             │
├──────────────────────┤       ├──────────────────────────────────┤
│ id (PK)              │       │ id (PK)                         │
│ name                 │       │ type (GROUP=1, PRIVATE=2)       │
│ email (unique)       │       │ name (nullable)                  │
│ password (hashed)    │       │ hash (unique, for private chat)  │
│ avatarUrl (nullable) │       │ lastMessageId (FK→Message.id)   │
│ status               │       │ lastActivityAt (nullable)        │
│ role                 │       └──────────┬───────────────────────┘
│ lastSeenAt           │                  │
│ refreshToken         │                  │ 1
└──────────────────────┘                  │
                                          │
         ┌────────────────────────────────┼────────────────────────┐
         │                                │                        │
         │ 1                              │ *                      │ *
         ▼                                ▼                        ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    ConversationParticipants                          │
├──────────────────────────────────────────────────────────────────────┤
│ id (PK)                                                             │
│ userId (FK→User.id)                          [UNIQUE: userId +     │
│ conversationId (FK→Conversation.id)           conversationId]      │
│ role (MEMBER=0, ADMIN=1, OWNER=2)                                 │
│ lastReadMessageId (nullable)                                       │
│ joinedAt                                                            │
│ created_at / updated_at / deleted_at                               │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                         Message                                     │
├──────────────────────────────────────────────────────────────────────┤
│ id (PK)                                                             │
│ conversationId (FK→Conversation.id)    [INDEX: (conversationId,     │
│ senderId (FK→User.id, nullable)         createdAt)]                 │
│ content (text)                                                      │
│ type (TEXT=1, IMAGE=2, VIDEO=3, SYSTEM=4, FILE=5)                  │
│ replyToId (FK→Message.id, nullable) — for reply threads             │
│ metadata (JSONB, nullable)                                          │
│ created_at / updated_at / deleted_at                               │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.2 Key Indexes

| Table | Index | Purpose |
|---|---|---|
| `Message` | `(conversationId, createdAt)` | Fast paginated message queries per conversation |
| `Message` | `senderId` | Filter messages by sender |
| `ConversationParticipants` | `userId` | Find all conversations for a user |
| `ConversationParticipants` | `conversationId` | Find all participants in a conversation |
| `Conversation` | `lastMessageId` | Load latest message for conversation preview |

### 3.3 Soft Deletes

All entities extend `BaseEntity` which provides:
```ts
createdAt: Date      // Auto-set on insert
updatedAt: Date      // Auto-updated on update
deletedAt: Date|null // Soft delete timestamp
```

The `TokenSecurityGuard` filters out soft-deleted users:
```ts
where: { id: Number(id), deletedAt: IsNull() }
```

---

## 4. Authentication Flow

### 4.1 User Registration & Login

```
User → POST /auth/register (or login)
  → Validate credentials
  → Generate JWT (access token + refresh token)
  → Return tokens + user info
  → Client stores tokens (localStorage / httpOnly cookie)
```

### 4.2 HTTP Request Authentication

```
Client → Authorization: Bearer <access_token>
  → TokenSecurityGuard.canActivate()
    → Extract token from header
    → Verify JWT signature + expiry
    → Fetch user from DB (excluding deleted)
    → Attach user to request.user
  → Controller handler executes
```

### 4.3 Socket Authentication

```
Client → socket.connect(url, { auth: { token: <access_token> }})
  → EventsGateway.handleConnection()
  → AppSocketUtil.getUserId(client)
    → Extract token from handshake.auth or Authorization header
    → Verify JWT → decode userId
    → Store userId in socket.data.userId
  → Auto-join all conversation rooms
```

---

## 5. Conversation Flow

### 5.1 Create Private Conversation

```
POST /conversation/create
Body: { partnerId: number }

ConversationService.createPrivateChat():
  1. Validate partner exists + not self
  2. Generate deterministic hash: "1_1_${minId}_${maxId}"
  3. Check if conversation with this hash already exists
  4. Create Conversation record (type=PRIVATE, name=hash)
  5. Create 2 ConversationParticipants records:
     - user (OWNER), partner (MEMBER)
  6. Return created conversation
```

### 5.2 List Conversations

```
GET /conversation/conversations?page=1&limit=10

ConversationService.getListConversations():
  1. Find all ConversationParticipants for current user
     - Loads conversation + conversation.lastMessage + sender
     - Ordered by participant.createdAt DESC
  2. For PRIVATE conversations, find the "other" participant
  3. Build response with:
     - conversationId, conversationName, groupType
     - yourParticipant info
     - anotherParticipant info (for private chats)
     - lastMessage { id, content, senderId, senderName, createdAt }
  4. Return paginated response
```

### 5.3 Join Conversation (Socket)

```
Client emits: join_conversation { conversationId }

EventsGateway.handleJoin():
  1. Extract userId from socket data
  2. Check if user is a participant (with Redis cache)
  3. Join socket room: "conversation:${id}"
  4. Emit: joined { conversationId }
```

---

## 6. Message Flow

### 6.1 Send Message

```
Client emits: send_message { conversationId, message }

EventsGateway.handleMessage():
  1. Validate conversationId + userId
  2. Check participant status
  3. Validate non-empty message
  4. Create Message record:
     { conversationId, senderId, content, type: TEXT }
  5. Save to DB
  6. UPDATE conversation SET
       lastMessageId = savedMessage.id,
       lastActivityAt = NOW()
  7. Emit to room (excluding sender):
     receive_message { conversationId, senderId, message }
  8. Emit to sender:
     message_sent { conversationId, senderId, message }
```

### 6.2 Get Message History

```
GET /message/?conversationId=X&page=1&limit=10

MessageService.getMessages():
  1. Verify user is a participant of the conversation
  2. FindAndCount messages:
     - WHERE conversationId = X
     - ORDER BY createdAt DESC, id DESC
     - Load sender relation
     - Paginated (skip + take)
  3. Map to response: { content, senderId, senderName, type, ... }
  4. Return paginated: { data, metadata }
```

### 6.3 Typing Indicator

```
Client emits: typing_message { conversationId }

EventsGateway.typingMessage():
  1. Check participant
  2. Broadcast to room (excluding sender):
     typing_message { conversationId, userId }

Client emits: stop_typing { conversationId }

EventsGateway.handleStopTyping():
  1. Check participant
  2. Broadcast to room (excluding sender):
     stop_typing { conversationId, userId }
```

---

## 7. Real-Time Messaging (Socket.IO)

### 7.1 Connection Lifecycle

```
┌──────────────┐
│  Client      │                     ┌──────────────────┐
│  Connects    │──────socket.io─────▶│  EventsGateway   │
└──────┬───────┘                     └────────┬─────────┘
       │                                      │
       │  handleConnection()                   │
       │  ├── Extract token → getUserId()      │
       │  ├── Find all participant records     │
       │  └── Auto-join to each conversation   │
       │      room: "conversation:${id}"       │
       │                                      │
       │◀───────── connected ──────────────────│
       │                                      │
       │  [User sends messages, types, etc.]   │
       │────────────────── events ────────────▶│
       │                                      │
       │◀───────── broadcast events ───────────│
       │                                      │
       │  handleDisconnect()                   │
       │  ├── Clean up resources               │
       │  └── Socket removed from rooms        │
```

### 7.2 Event Map

| Client → Server | Server → Client | Purpose |
|---|---|---|
| `join_conversation` | `joined` | Enter a conversation room |
| `send_message` | `message_sent` (+ `receive_message` to room) | Send a text message |
| — | `receive_message` | Other participants receive new message |
| `typing_message` | `typing_message` (to room) | User is typing |
| `stop_typing` | `stop_typing` (to room) | User stopped typing |

### 7.3 Socket.IO with Redis Adapter

For horizontal scaling (multiple server instances):

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Server 1     │    │ Server 2     │    │ Server 3     │
│ (Socket)     │    │ (Socket)     │    │ (Socket)     │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────▼───────┐
                    │   Redis      │
                    │ (Pub/Sub)    │
                    └──────────────┘
```

When one server emits to a room, Redis adapter broadcasts to all servers.

### 7.4 Room Naming Convention

```
conversation:${conversationId}
```

Example: `conversation:42`

---

## 8. API Endpoints

### 8.1 User

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/user/create` | No | Register new user |
| POST | `/user/login` | No | Login, returns JWT |
| GET | `/user/me` | Bearer | Get current user profile |

### 8.2 Conversation

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/conversation/create` | Bearer | Create private chat |
| GET | `/conversation/conversations` | Bearer | List user's conversations |

### 8.3 Message

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/message/` | Bearer | Get message history (paginated) |

**Query params for `GET /message/`:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `conversationId` | number | Yes | — | Conversation to fetch messages for |
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 10 | Items per page |

---

## 9. Full Use-Case Walkthrough

### Use Case: User1 sends a message, User2 receives it later

```
┌─────────┐          ┌───────────┐          ┌─────────┐          ┌────────┐
│ User1    │          │ Socket.IO │          │ User2    │          │  API   │
│ (Online) │          │  Server   │          │(Comes    │          │ Server │
│           │          │           │          │ later)   │          │        │
└────┬─────┘          └─────┬─────┘          └────┬──────┘          └───┬────┘
     │                      │                     │                     │
     │ 1. Connect socket    │                     │                     │
     │━━━━━━━━━━━━━━━━━━━━━▶│                     │                     │
     │                      │ handleConnection()  │                     │
     │                      │ - getUserId()       │                     │
     │                      │ - auto-join rooms   │                     │
     │◀━━━━━━━━━━━━━━━━━━━━━│ connected           │                     │
     │                      │                     │                     │
     │ 2. Send message      │                     │                     │
     │━━━━━━━━━━━━━━━━━━━━━▶│                     │                     │
     │ send_message()       │                     │                     │
     │ { conversationId:1,  │                     │                     │
     │   message:"Hello" }  │                     │                     │
     │                      │                     │                     │
     │ 3. Save to DB        │                     │                     │
     │                      │──── INSERT INTO ───▶│                     │
     │                      │    message (...)     │                     │
     │                      │◀──── saved ─────────│                     │
     │                      │                     │                     │
     │ 4. Update conv meta  │                     │                     │
     │                      │──── UPDATE ────────▶│                     │
     │                      │    conversation      │                     │
     │                      │    SET lastMessageId,│                     │
     │                      │    lastActivityAt    │                     │
     │                      │◀──── updated ───────│                     │
     │                      │                     │                     │
     │ 5. Emit to room      │                     │                     │
     │                      │ (User2 not in room) │                     │
     │                      │                     │                     │
     │◀── message_sent ─────│                     │                     │
     │                      │                     │                     │
     │                      │                     │ 6. User2 connects   │
     │                      │                     │ (hours later)       │
     │                      │                     │                     │
     │                      │                     │ 7. List conversations│
     │                      │                     │━━━━━━━━━━━━━━━━━━━━▶│
     │                      │                     │GET /conversations   │
     │                      │                     │                     │
     │                      │                     │◀─── response ───────│
     │                      │                     │ [ {                 │
     │                      │                     │     lastMessage: {  │
     │                      │                     │       content:"Hello"│
     │                      │                     │       senderId: 1,  │
     │                      │                     │       senderName:   │
     │                      │                     │         "User1"     │
     │                      │                     │     }               │
     │                      │                     │   } ]               │
     │                      │                     │                     │
     │                      │                     │ 8. See preview      │
     │                      │                     │ App shows:          │
     │                      │                     │ "User1: Hello"      │
     │                      │                     │                     │
     │                      │                     │ 9. Open conversation│
     │                      │                     │━━━━━━━━━━━━━━━━━━━━▶│
     │                      │                     │GET /message/        │
     │                      │                     │?conversationId=1    │
     │                      │                     │◀─── messages ────── │
     │                      │                     │ [{ content:"Hello", │
     │                      │                     │    senderId:1 }]    │
```

### Why the fix works:

| Issue | Before | After |
|---|---|---|
| User2 sees no preview | `getListConversations` didn't load `lastMessage` | Returns `lastMessage` with `sender` name |
| User2 sees stale preview | `lastMessageId` never updated | Updated on every message send |
| User2 socket doesn't get real-time | Must manually `join_conversation` | Auto-joins all rooms on connect |
| User2 has to re-join on page reload | Client must remember to re-join | Auto-join handles it automatically |

---

## 10. Common Issues & Fixes

### 10.1 Messages Not Appearing for Other User

**Symptoms:**
- User1 sends a message, it's saved to DB
- User2 opens the conversation, message is missing

**Root causes & fixes:**

| Cause | Fix | Component |
|---|---|---|
| `lastMessageId` not updated → conversation looks empty | Update `conversation.lastMessageId` + `lastActivityAt` | `events.gateway.ts` |
| `getListConversations` doesn't load `lastMessage` | Add `relations: { conversation: { lastMessage: { sender: true } } }` | `conversation.service.ts` |
| User2's socket not in room → no real-time delivery | Auto-join rooms in `handleConnection()` | `events.gateway.ts` |
| Frontend doesn't fetch messages on mount | Call `GET /message/` when conversation selected | Frontend |

### 10.2 Socket Connection Failures

**Checklist:**
1. Redis running: `docker compose ps redis`
2. JWT token valid and not expired
3. Token passed correctly in socket auth: `{ auth: { token } }`
4. User exists in DB and not soft-deleted

### 10.3 Participant Check Caching

Redis caches participant membership for 5 minutes:
```ts
cacheKey = `conversation:${conversationId}:participants`
// TTL: 300 seconds
```

If a user is removed from a conversation, the Redis cache may still allow them.  
**Fix:** Clear the cache on participant removal.

---

## 11. Development Setup

### 11.1 Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Yarn

### 11.2 Quick Start

```bash
# 1. Clone and install dependencies
git clone <repo>
cd nestjs-project
yarn install

# 2. Set up environment
cp .env.example .env
# Edit .env with your values

# 3. Start infrastructure
docker compose up -d

# 4. Run database migrations
yarn migration:run

# 5. (Optional) Seed dev data
yarn script src/scripts/create-dev-database.ts

# 6. Start the app
yarn start:dev
```

### 11.3 Useful Commands

```bash
# Generate a new migration
yarn typeorm migration:generate src/migrations/<name> -d src/databases/index.ts

# Run pending migrations
yarn migration:run

# Revert last migration
yarn migration:revert

# View current DB schema SQL
yarn migration:schema

# Generate an access token for testing
yarn script src/scripts/access-token.ts --userId 1

# Test socket connection
yarn script src/scripts/socket-test.ts \
  --url http://localhost:3002 \
  --token "your-jwt-token" \
  --conversationId 123 \
  --message "Hello World"

# Swagger UI
# http://localhost:3002/api

# MailHog UI (dev email)
# http://localhost:8025/
```

### 11.4 Docker Services

| Service | Port | Purpose |
|---|---|---|
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Cache + socket pub/sub |
| MailHog SMTP | 1025 | Dev email server |
| MailHog Web | 8025 | Dev email UI |
| App | 3002 | NestJS server |

### 11.5 Key Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@nestjs/core` | ^11 | NestJS framework |
| `@nestjs/typeorm` | ^11 | TypeORM integration |
| `typeorm` | ^0.3 | ORM |
| `pg` | ^8 | PostgreSQL driver |
| `socket.io` | — | WebSocket server |
| `@socket.io/redis-adapter` | — | Socket horizontal scaling |
| `redis` | ^5 | Redis client |
| `jsonwebtoken` | — | JWT generation/verification |
| `argon2` | — | Password hashing |
| `class-validator` | — | DTO validation |
| `@nestjs/swagger` | ^11 | API documentation |

---

*Document version: 1.0 — Last updated: 2024*
