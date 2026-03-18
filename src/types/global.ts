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

export type SendEmailPayloadType = {
  to: string;
  name: string;
  token: string;
};
