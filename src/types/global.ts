import { DefaultEventsMap, Socket } from 'socket.io';

export enum SEND_EMAIL_TYPE {
  VERIFY,
  LOGIN,
  RECOVER_PASSWORD,
}

export enum USER_STATUS {
  EMAIL_INACTIVE = 1,
  ACTIVE = 2,
  INACTIVE = 3,
}

export enum USER_ROLE {
  USER = 1,
  ADMIN = 2,
}

export enum CONVERSATION_TYPE {
  GROUP = 1,
  PRIVATE = 2,
}

export enum CONVERSATION_USER_ROLE {
  USER = 1,
  ADMIN = 2,
}

export enum MESSAGE_TYPE {
  TEXT = 1,
  IMAGE = 2,
  VIDEO = 3,
  SYSTEM = 4,
}

export enum TOKEN_TYPE {
  ACCESS_TOKEN = 1,
  EMAIL_VERIFY_TOKEN = 2,
  REFRESH_TOKEN = 3,
}

export type SendEmailPayloadType = {
  to: string;
  name: string;
  token?: string;
};

export enum NodeEnvType {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
}

export type JoinConversationPayload = {
  conversationId: number;
};

export type SendMessagePayload = {
  conversationId: number;
  message: string;
};

export type SocketData = {
  userId?: number;
};

export type AppSocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;
