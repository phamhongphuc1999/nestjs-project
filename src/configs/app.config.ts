import 'dotenv/config';

const AppConfigs = {
  DATABASE: {
    HOST: 'localhost',
    PORT: parseInt(process.env.POSTGRES_PORT || '5432'),
    USERNAME: process.env.POSTGRES_USER,
    PASSWORD: process.env.POSTGRES_PASSWORD,
    DATABASE: process.env.POSTGRES_DB,
  },
  PORT: 3000,
  MAIL: {
    HOST: process.env.MAIL_HOST || 'smtp.gmail.com',
    PORT: parseInt(process.env.MAIL_PORT || '587'),
    USER: process.env.MAIL_USER,
    PASSWORD: process.env.MAIL_PASSWORD,
  },
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRE_TIME: process.env.JWT_EXPIRE_TIME || '',
  EMAIL_VERIFY_SECRET: process.env.EMAIL_VERIFY_SECRET || '',
  EMAIL_VERIFY_EXPIRE_TIME: process.env.EMAIL_VERIFY_EXPIRE_TIME || '',
  FRONTEND_URL: process.env.FRONTEND_URL || '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
};

export { AppConfigs };
