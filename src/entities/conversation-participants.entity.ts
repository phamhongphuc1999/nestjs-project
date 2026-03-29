import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ type: Number, name: 'id' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: User, name: 'user' })
  @Index()
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ApiProperty({ type: Conversation, name: 'conversation' })
  @Index()
  @ManyToOne(() => Conversation, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column()
  conversationId: number;

  @ApiProperty({ type: Number, name: 'role' })
  @Column({ type: Number })
  role: CONVERSATION_USER_ROLE;
}
