import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { ConversationParticipants } from 'src/entities';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class ConversationParticipantRepository extends Repository<ConversationParticipants> {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super(ConversationParticipants, dataSource.createEntityManager());
  }
}
