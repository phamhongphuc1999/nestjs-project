import { PostgresDataSource } from 'src/databases';
import { Conversation, ConversationParticipants, User } from 'src/entities';
import {
  CONVERSATION_TYPE,
  CONVERSATION_USER_ROLE,
  USER_ROLE,
  USER_STATUS,
} from 'src/types/global';
import { createPrivateConversationHash, generatePasswordHash } from 'src/utils/common.utils';

const users: Array<Partial<User>> = [
  {
    name: 'peter1',
    password: 'July@321',
    email: 'peter1@gmail.com',
    status: USER_STATUS.ACTIVE,
    role: USER_ROLE.USER,
  },
  {
    name: 'peter2',
    password: 'July@321',
    email: 'peter2@gmail.com',
    status: USER_STATUS.ACTIVE,
    role: USER_ROLE.USER,
  },
];

async function bootstrap() {
  try {
    await PostgresDataSource.initialize();
    await PostgresDataSource.runMigrations();

    // create new users
    const userRepository = PostgresDataSource.getRepository(User);
    const newUser1 = userRepository.create({
      ...users[0],
      password: await generatePasswordHash(users[0].password || ''),
    });
    const newUser2 = userRepository.create({
      ...users[1],
      password: await generatePasswordHash(users[1].password || ''),
    });
    const user1 = await userRepository.save(newUser1);
    const user2 = await userRepository.save(newUser2);

    // create new conversation
    const conversationRepository = PostgresDataSource.getRepository(Conversation);
    const newConversation = conversationRepository.create({
      type: CONVERSATION_TYPE.PRIVATE,
      name: 'example conversation',
      hash: createPrivateConversationHash(user1.id, user2.id),
    });
    const conversation = await conversationRepository.save(newConversation);

    // create conversation participant
    const participantRepository = PostgresDataSource.getRepository(ConversationParticipants);
    const newParticipant1 = participantRepository.create({
      userId: user1.id,
      conversationId: conversation.id,
      role: CONVERSATION_USER_ROLE.ADMIN,
    });
    const newParticipant2 = participantRepository.create({
      userId: user2.id,
      conversationId: conversation.id,
      role: CONVERSATION_USER_ROLE.MEMBER,
    });
    await participantRepository.save(newParticipant1);
    await participantRepository.save(newParticipant2);
  } finally {
    if (PostgresDataSource.isInitialized) {
      await PostgresDataSource.destroy();
    }
  }
}

bootstrap().catch(console.error);
