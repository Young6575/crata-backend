import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Ticket } from '../ticket/ticket.entity';
import { KakaoAlimtalkService } from './kakao-alimtalk.service';
import { TicketShareService } from './ticket-share.service';
import { TicketShareController } from './ticket-share.controller';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Ticket]),
  ],
  controllers: [TicketShareController],
  providers: [KakaoAlimtalkService, TicketShareService],
  exports: [KakaoAlimtalkService, TicketShareService],
})
export class KakaoModule {}
