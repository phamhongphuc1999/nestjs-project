-- ============================================================
-- DATABASE ARCHITECTURE - Chat Application (NestJS + PostgreSQL)
-- ============================================================
-- Improved version - Optimized for real-time chat
-- =========================================================
CREATE TABLE "user" (
    "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
    "deleted_at"       TIMESTAMPTZ DEFAULT NULL,

    "id"               SERIAL NOT NULL,
    CONSTRAINT "PK_user" PRIMARY KEY ("id"),

    "name"             VARCHAR NOT NULL,
    "password"         VARCHAR NOT NULL,
    "email"            VARCHAR NOT NULL,

    "avatarUrl"        VARCHAR DEFAULT NULL,                   -- Profile picture URL

    "status"           INTEGER NOT NULL DEFAULT 1,             -- 1=EMAIL_INACTIVE, 2=ACTIVE, 3=INACTIVE
    "role"             INTEGER NOT NULL DEFAULT 1,             -- 1=USER, 2=ADMIN

    "lastSeenAt"       TIMESTAMPTZ DEFAULT NULL,               -- Last online timestamp

    "refreshToken"     VARCHAR DEFAULT NULL
);

-- ============================================================
-- 2. TABLE: conversation
-- ============================================================
CREATE TABLE "conversation" (
    "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
    "deleted_at"       TIMESTAMPTZ DEFAULT NULL,

    "id"               SERIAL NOT NULL,
    CONSTRAINT "PK_conversation" PRIMARY KEY ("id"),

    "type"             INTEGER NOT NULL,                       -- 1=GROUP, 2=PRIVATE
    "name"             VARCHAR DEFAULT NULL,                   -- Nullable for Private chat
    "hash"             VARCHAR NOT NULL,                       -- Used to create unique conversation

    "lastMessageId"    INTEGER DEFAULT NULL,                   -- FK -> message.id (nullable, optional)
    "lastActivityAt"   TIMESTAMPTZ DEFAULT NULL                -- Used for sorting chat list
);

-- ============================================================
-- 3. TABLE: conversation_participants
-- ============================================================
CREATE TABLE "conversation_participants" (
    "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
    "deleted_at"       TIMESTAMPTZ DEFAULT NULL,

    "id"               SERIAL NOT NULL,
    CONSTRAINT "PK_conversation_participants" PRIMARY KEY ("id"),

    "userId"           INTEGER NOT NULL,
    "conversationId"   INTEGER NOT NULL,
    "role"             INTEGER NOT NULL,                       -- 0=MEMBER, 1=ADMIN, 2=OWNER

    "lastReadMessageId" INTEGER DEFAULT NULL,                  -- Used to calculate unread count (nullable for new members)
    "joinedAt"          TIMESTAMPTZ DEFAULT NULL,              -- When user joined the conversation

    CONSTRAINT "UQ_user_conversation" UNIQUE ("userId", "conversationId")
);

-- ============================================================
-- 4. TABLE: message
-- ============================================================
CREATE TABLE "message" (
    "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
    "deleted_at"       TIMESTAMPTZ DEFAULT NULL,

    "id"               SERIAL NOT NULL,
    CONSTRAINT "PK_message" PRIMARY KEY ("id"),

    "conversationId"   INTEGER NOT NULL,
    "senderId"         INTEGER,                              -- Can be NULL if user is deleted

    "content"          TEXT NOT NULL,                          -- Use TEXT instead of VARCHAR
    "type"             INTEGER NOT NULL DEFAULT 1,             -- 1=TEXT, 2=IMAGE, 3=VIDEO, 4=SYSTEM, 5=FILE...

    "replyToId"        INTEGER DEFAULT NULL,                   -- Supports message reply (self-reference FK)
    "metadata"         JSONB DEFAULT '{}'::jsonb               -- Stores extra info (url, file info, emoji...)

    -- NOTE: No UNIQUE(conversationId, senderId) -- a user can send multiple messages
);

-- ============================================================
-- INDEXES (Performance optimization)
-- ============================================================

CREATE INDEX "IDX_conversation_participants_userId" 
    ON "conversation_participants" ("userId");

CREATE INDEX "IDX_conversation_participants_conversationId" 
    ON "conversation_participants" ("conversationId");

CREATE INDEX "IDX_message_conversationId" 
    ON "message" ("conversationId");

CREATE INDEX "IDX_message_senderId" 
    ON "message" ("senderId");

CREATE INDEX "IDX_message_created_at" 
    ON "message" ("created_at");

CREATE INDEX "IDX_message_conversationId_created_at" 
    ON "message" ("conversationId", "created_at");

CREATE INDEX "IDX_conversation_lastActivityAt" 
    ON "conversation" ("lastActivityAt");

-- ============================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================

-- conversation_participants
ALTER TABLE "conversation_participants"
    ADD CONSTRAINT "FK_conversation_participants_userId"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;

ALTER TABLE "conversation_participants"
    ADD CONSTRAINT "FK_conversation_participants_conversationId"
    FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE CASCADE;

-- message
ALTER TABLE "message"
    ADD CONSTRAINT "FK_message_conversationId"
    FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE RESTRICT;

ALTER TABLE "message"
    ADD CONSTRAINT "FK_message_senderId"
    FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE SET NULL;

ALTER TABLE "message"
    ADD CONSTRAINT "FK_message_replyToId"
    FOREIGN KEY ("replyToId") REFERENCES "message"("id") ON DELETE SET NULL;

-- conversation (lastMessageId)
ALTER TABLE "conversation"
    ADD CONSTRAINT "FK_conversation_lastMessageId"
    FOREIGN KEY ("lastMessageId") REFERENCES "message"("id") ON DELETE SET NULL;

-- ============================================================
-- ENUMS & COMMENTS
-- ============================================================
/*
USER_STATUS:        1=EMAIL_INACTIVE, 2=ACTIVE, 3=INACTIVE
USER_ROLE:          1=USER, 2=ADMIN
CONVERSATION_TYPE:  1=GROUP, 2=PRIVATE
PARTICIPANT_ROLE:   0=MEMBER, 1=ADMIN, 2=OWNER
MESSAGE_TYPE:       1=TEXT, 2=IMAGE, 3=VIDEO, 4=SYSTEM, 5=FILE...
*/