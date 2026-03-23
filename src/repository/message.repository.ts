import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Message } from 'src/entities';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class MessageRepository extends Repository<Message> {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super(Message, dataSource.createEntityManager());
  }
}
