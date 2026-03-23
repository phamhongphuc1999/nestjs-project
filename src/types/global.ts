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

export enum TOKEN_TYPE {
  ACCESS_TOKEN = 1,
  EMAIL_VERIFY_TOKEN = 2,
  REFRESH_TOKEN = 3,
}

export type SendEmailPayloadType = {
  to: string;
  name: string;
  token: string;
};
