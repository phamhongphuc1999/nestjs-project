import { MESSAGE_TYPE } from 'src/types/global';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Conversation } from './conversation.entity';
import { User } from './user.entity';

@Entity()
export class Message extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @ManyToOne(() => Conversation, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column()
  conversationId: number;

  @Index()
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column()
  senderId: number;

  @Column({ type: String })
  content: string;

  @Column({ type: Number, default: MESSAGE_TYPE.TEXT })
  type: MESSAGE_TYPE;
}
