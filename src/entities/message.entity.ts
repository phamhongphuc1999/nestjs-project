import { MESSAGE_TYPE } from 'src/types/global';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import type { Conversation } from './conversation.entity';
import type { User } from './user.entity';

@Entity()
@Index(['conversationId', 'createdAt'])
export class Message extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @ManyToOne('Conversation', { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column()
  conversationId: number;

  @Index()
  @ManyToOne('User', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({ nullable: true })
  senderId: number;

  @Column({ type: String })
  content: string;

  @Column({ type: Number, default: MESSAGE_TYPE.TEXT })
  type: MESSAGE_TYPE;

  @ManyToOne('Message', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'replyToId' })
  replyToMessage: Message;

  @Column({ nullable: true })
  replyToId: number;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  metadata: Record<string, any>;
}
