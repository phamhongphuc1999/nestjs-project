import { USER_STATUS } from 'src/types/global';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
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
}
