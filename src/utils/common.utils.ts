import * as argon2 from 'argon2';

export async function generatePasswordHash(password: string) {
  return await argon2.hash(password, {
    type: argon2.argon2id,
  });
}

export async function verifyPasswordHash(passwordHash: string, password: string) {
  return await argon2.verify(passwordHash, password);
}

export function getPaginationData(
  limit: number,
  itemsLen: number,
  total: number,
  currentPage: number,
) {
  return {
    totalItems: total,
    itemCount: itemsLen,
    itemsPerPage: limit,
    totalPages: Math.ceil(total / limit),
    currentPage,
  };
}

export function createPrivateConversationHash(user1Id: number, user2Id: number) {
  const hash = user1Id < user2Id ? `1_1_${user1Id}_${user2Id}` : `1_1_${user2Id}_${user1Id}`;
  return hash;
}
