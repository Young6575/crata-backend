import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestResult } from './test-result.entity';
import { Ticket } from '../ticket/ticket.entity';
import { ResultController } from './result.controller';
import { ResultService } from './result.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TestResult,
      Ticket,
    ]),
  ],
  controllers: [ResultController],
  providers: [ResultService],
  exports: [ResultService],
})
export class ResultModule {}