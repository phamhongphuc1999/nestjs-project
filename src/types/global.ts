export enum SEND_EMAIL_TYPE {
  VERIFY,
  LOGIN,
  RECOVER_PASSWORD,
}

export enum EMAIL_VERIFICATION_STATUS {
  ACTIVE = 1,
  INACTIVE = 2,
}

export type SendEmailPayloadType = {
  to: string;
  name: string;
  token: string;
};
