import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../ticket/ticket.entity';
import { KakaoAlimtalkService } from './kakao-alimtalk.service';
import { SendAlimtalkDto } from './dto/kakao.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TicketShareService {
  private readonly frontendUrl: string;

  constructor(
    @InjectRepository(Ticket) private ticketRepo: Repository<Ticket>,
    private kakaoService: KakaoAlimtalkService,
    private configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
  }

  // 티켓 공유 (알림톡 발송)
  async shareTicket(dto: SendAlimtalkDto) {
    const ticket = await this.ticketRepo.findOne({
      where: { ticketId: dto.ticketId },
      relations: ['product', 'order'],
    });

    if (!ticket) {
      throw new HttpException('티켓을 찾을 수 없습니다', HttpStatus.NOT_FOUND);
    }

    if (ticket.status !== 'AVAILABLE') {
      throw new HttpException('공유할 수 없는 티켓입니다', HttpStatus.BAD_REQUEST);
    }

    // 전화번호 유효성 검증
    if (!this.kakaoService.validatePhoneNumber(dto.phoneNumber)) {
      throw new HttpException('유효하지 않은 전화번호입니다', HttpStatus.BAD_REQUEST);
    }

    const clientName = dto.clientName || '고객';
    const testUrl = `${this.frontendUrl}/test/${ticket.code}`;

    // 알림톡 발송
    const result = await this.kakaoService.sendTicketShare(dto.phoneNumber, {
      clientName,
      ticketCode: ticket.code,
      testUrl,
      productName: ticket.product?.name || '심리검사',
    });

    if (!result.success) {
      throw new HttpException(
        result.error || '알림톡 발송에 실패했습니다',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // 티켓 정보 업데이트
    ticket.isSent = true;
    ticket.clientName = clientName;
    ticket.clientPhoneNumber = dto.phoneNumber;
    await this.ticketRepo.save(ticket);

    return {
      success: true,
      ticketId: ticket.ticketId,
      ticketCode: ticket.code,
      sentTo: dto.phoneNumber,
      messageId: result.messageId,
    };
  }

  // 티켓 공유 상태 조회
  async getShareStatus(ticketId: number) {
    const ticket = await this.ticketRepo.findOne({
      where: { ticketId },
      select: ['ticketId', 'code', 'isSent', 'clientName', 'clientPhoneNumber', 'status'],
    });

    if (!ticket) {
      throw new HttpException('티켓을 찾을 수 없습니다', HttpStatus.NOT_FOUND);
    }

    return {
      ticketId: ticket.ticketId,
      code: ticket.code,
      isSent: ticket.isSent,
      clientName: ticket.clientName,
      clientPhoneNumber: ticket.clientPhoneNumber,
      status: ticket.status,
    };
  }
}
