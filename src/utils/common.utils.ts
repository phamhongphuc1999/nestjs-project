import * as argon2 from 'argon2';

export async function generatePasswordHash(password: string) {
  return await argon2.hash(password, {
    type: argon2.argon2id,
  });
}
