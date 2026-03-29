import { ApiProperty } from '@nestjs/swagger';
import { CONVERSATION_TYPE } from 'src/types/global';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity()
export class Conversation extends BaseEntity {
  @ApiProperty({ type: Number, name: 'id' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: Number, name: 'type' })
  @Column({ type: Number })
  type: CONVERSATION_TYPE;

  @ApiProperty({ type: String, name: 'name' })
  @Column({ type: String })
  name: string;

  @ApiProperty({ type: String, name: 'hash' })
  @Column({ type: String })
  hash: string;
}
