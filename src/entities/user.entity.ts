import { Request } from 'express';
import { USER_ROLE, USER_STATUS } from 'src/types/global';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  password: string;

  @Column()
  email: string;

  @Column({ type: 'int', default: USER_STATUS.EMAIL_INACTIVE })
  status: USER_STATUS;

  @Column({ type: 'int', default: USER_ROLE.USER })
  role: USER_ROLE;
}

export interface AuthRequest extends Request {
  user?: User;
}
