import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Conversation } from 'src/entities';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class ConversationRepository extends Repository<Conversation> {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super(Conversation, dataSource.createEntityManager());
  }
}
