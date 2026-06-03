import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { db, DB_TOKEN } from '../../db';

@Module({
  controllers: [SessionsController],
  providers: [
    SessionsService,
    { provide: DB_TOKEN, useValue: db },
  ],
  exports: [SessionsService],
})
export class SessionsModule {}
