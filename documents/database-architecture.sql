-- ============================================================
-- KIẾN TRÚC DATABASE - Chat Application (NestJS + PostgreSQL)
-- ============================================================
-- Phiên bản cải tiến - Tối ưu cho real-time chat
-- ============================================================

-- ============================================================
-- 1. BẢNG: user
-- ============================================================
CREATE TABLE "user" (
    "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
    "deleted_at"       TIMESTAMPTZ DEFAULT NULL,

    "id"               SERIAL NOT NULL,
    CONSTRAINT "PK_user" PRIMARY KEY ("id"),

    "name"             VARCHAR NOT NULL,
    "password"         VARCHAR NOT NULL,
    "email"            VARCHAR NOT NULL,

    "status"           INTEGER NOT NULL DEFAULT 1,     -- 1=EMAIL_INACTIVE, 2=ACTIVE, 3=INACTIVE
    "role"             INTEGER NOT NULL DEFAULT 1,     -- 1=USER, 2=ADMIN

    "refreshToken"     VARCHAR DEFAULT NULL
);

-- ============================================================
-- 2. BẢNG: conversation
-- ============================================================
CREATE TABLE "conversation" (
    "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
    "deleted_at"       TIMESTAMPTZ DEFAULT NULL,

    "id"               SERIAL NOT NULL,
    CONSTRAINT "PK_conversation" PRIMARY KEY ("id"),

    "type"             INTEGER NOT NULL,                     -- 1=GROUP, 2=PRIVATE
    "name"             VARCHAR,                               -- Nullable cho Private chat
    "hash"             VARCHAR NOT NULL,

    "lastMessageId"    INTEGER,                               -- Tin nhắn mới nhất
    "lastActivityAt"   TIMESTAMPTZ                            -- Dùng để sort danh sách chat
);

-- ============================================================
-- 3. BẢNG: conversation_participants
-- ============================================================
CREATE TABLE "conversation_participants" (
    "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
    "deleted_at"       TIMESTAMPTZ DEFAULT NULL,

    "id"               SERIAL NOT NULL,
    CONSTRAINT "PK_conversation_participants" PRIMARY KEY ("id"),

    "userId"           INTEGER NOT NULL,
    "conversationId"   INTEGER NOT NULL,
    "role"             INTEGER NOT NULL,                     -- 0=MEMBER, 1=ADMIN, 2=OWNER

    "lastReadMessageId" INTEGER,                             -- Dùng để tính unread count

    CONSTRAINT "UQ_user_conversation" UNIQUE ("userId", "conversationId")
);

-- ============================================================
-- 4. BẢNG: message
-- ============================================================
CREATE TABLE "message" (
    "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
    "deleted_at"       TIMESTAMPTZ DEFAULT NULL,

    "id"               SERIAL NOT NULL,
    CONSTRAINT "PK_message" PRIMARY KEY ("id"),

    "conversationId"   INTEGER NOT NULL,
    "senderId"         INTEGER,                              -- Có thể NULL nếu user bị xóa

    "content"          TEXT NOT NULL,
    "type"             INTEGER NOT NULL DEFAULT 1,           -- 1=TEXT, 2=IMAGE, 3=VIDEO, 4=SYSTEM, 5=FILE...

    "replyToId"        INTEGER,                               -- Hỗ trợ trả lời tin nhắn
    "metadata"         JSONB                                  -- Lưu thêm thông tin (url, file info, emoji...)
);

-- ============================================================
-- INDEXES (Tối ưu hiệu suất)
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