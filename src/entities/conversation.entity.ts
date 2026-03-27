import { CONVERSATION_TYPE } from 'src/types/global';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity()
export class Conversation extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: Number })
  type: CONVERSATION_TYPE;

  @Column({ type: String })
  name: string;

  @Column({ type: String })
  hash: string;
}
