import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { Request } from 'express';
import { USER_ROLE, USER_STATUS } from 'src/types/global';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity()
export class User extends BaseEntity {
  @ApiProperty({ type: Number, name: 'id' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: String, name: 'name' })
  @Column({ type: String })
  name: string;

  @ApiProperty({ type: String, name: 'password' })
  @Column({ type: String })
  password: string;

  @ApiProperty({ type: String, name: 'email' })
  @Column({ type: String })
  @IsEmail()
  email: string;

  @ApiProperty({ type: String, name: 'avatarUrl' })
  @Column({ type: String, nullable: true })
  avatarUrl: string;

  @ApiProperty({ type: Number, name: 'status' })
  @Column({ type: Number, default: USER_STATUS.EMAIL_INACTIVE })
  status: USER_STATUS;

  @ApiProperty({ type: Number, name: 'role' })
  @Column({ type: Number, default: USER_ROLE.USER })
  role: USER_ROLE;

  @ApiProperty({ type: Date, name: 'lastSeenAt' })
  @Column({ type: 'timestamptz', nullable: true })
  lastSeenAt: Date;

  @ApiProperty({ type: String, name: 'refreshToken' })
  @Column({ type: String, nullable: true, select: false })
  refreshToken: string;
}

export interface AuthRequest extends Request {
  user?: User;
}
