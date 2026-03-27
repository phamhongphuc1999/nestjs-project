import { CONVERSATION_USER_ROLE } from 'src/types/global';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Conversation } from './conversation.entity';
import { User } from './user.entity';

@Unique(['user', 'conversation'])
@Entity()
export class ConversationParticipants extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @ManyToOne(() => Conversation, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column({ type: Number })
  role: CONVERSATION_USER_ROLE;
}
