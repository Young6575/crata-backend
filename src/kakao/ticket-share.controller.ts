import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { TicketShareService } from './ticket-share.service';
import { SendAlimtalkDto } from './dto/kakao.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/tickets')
export class TicketShareController {
  constructor(private ticketShareService: TicketShareService) {}

  // 티켓 공유 (알림톡 발송)
  @Post(':id/share')
  @UseGuards(JwtAuthGuard)
  async shareTicket(
    @Param('id') id: string,
    @Body() dto: Omit<SendAlimtalkDto, 'ticketId'>,
  ) {
    return this.ticketShareService.shareTicket({
      ticketId: Number(id),
      ...dto,
    });
  }

  // 티켓 공유 상태 조회
  @Get(':id/share-status')
  @UseGuards(JwtAuthGuard)
  async getShareStatus(@Param('id') id: string) {
    return this.ticketShareService.getShareStatus(Number(id));
  }
}
