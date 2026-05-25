import { ApiProperty } from '@nestjs/swagger';
import { CONVERSATION_TYPE } from 'src/types/global';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import type { Message } from './message.entity';

@Entity()
export class Conversation extends BaseEntity {
  @ApiProperty({ type: Number, name: 'id' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: Number, name: 'type' })
  @Column({ type: Number })
  type: CONVERSATION_TYPE;

  @ApiProperty({ type: String, name: 'name' })
  @Column({ type: String, nullable: true })
  name: string;

  @ApiProperty({ type: String, name: 'hash' })
  @Column({ type: String })
  hash: string;

  @Index()
  @ManyToOne('Message', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lastMessageId' })
  lastMessage: Message;

  @Column({ nullable: true })
  lastMessageId: number;

  @Index()
  @Column({ type: 'timestamptz', nullable: true })
  lastActivityAt: Date;
}
