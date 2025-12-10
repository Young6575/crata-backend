import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AlimtalkTemplateVars, AlimtalkResult } from './dto/kakao.dto';

@Injectable()
export class KakaoAlimtalkService {
  private readonly apiKey: string;
  private readonly senderId: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    // 카카오 비즈메시지 또는 NHN Cloud 알림톡 API 설정
    this.apiKey = this.configService.get<string>('KAKAO_ALIMTALK_API_KEY') || '';
    this.senderId = this.configService.get<string>('KAKAO_SENDER_ID') || '';
    this.baseUrl = this.configService.get<string>('KAKAO_ALIMTALK_URL') || 
      'https://api-alimtalk.cloud.toast.com/alimtalk/v2.2/appkeys';
  }

  // 전화번호 포맷팅 (01012345678 -> +821012345678)
  private formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      return '+82' + cleaned.substring(1);
    }
    return '+82' + cleaned;
  }

  // 전화번호 유효성 검증
  validatePhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/[^0-9]/g, '');
    return /^01[0-9]{8,9}$/.test(cleaned);
  }

  // 티켓 공유 알림톡 발송
  async sendTicketShare(
    phoneNumber: string,
    vars: AlimtalkTemplateVars,
  ): Promise<AlimtalkResult> {
    if (!this.validatePhoneNumber(phoneNumber)) {
      return { success: false, error: '유효하지 않은 전화번호입니다' };
    }

    // API 키가 없으면 개발 모드로 동작 (실제 발송 안함)
    if (!this.apiKey) {
      console.log('[DEV MODE] 알림톡 발송 시뮬레이션:', { phoneNumber, vars });
      return { success: true, messageId: `DEV_${Date.now()}` };
    }

    try {
      const message = this.buildTicketShareMessage(vars);
      
      const response = await axios.post(
        `${this.baseUrl}/${this.apiKey}/messages`,
        {
          senderKey: this.senderId,
          templateCode: 'TICKET_SHARE',
          recipientList: [{
            recipientNo: this.formatPhoneNumber(phoneNumber),
            templateParameter: {
              clientName: vars.clientName,
              ticketCode: vars.ticketCode,
              testUrl: vars.testUrl,
              productName: vars.productName,
            },
          }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Secret-Key': this.apiKey,
          },
        },
      );

      return {
        success: true,
        messageId: response.data?.messages?.[0]?.messageId,
      };
    } catch (error: any) {
      console.error('알림톡 발송 실패:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || '알림톡 발송에 실패했습니다',
      };
    }
  }

  // 메시지 템플릿 생성
  private buildTicketShareMessage(vars: AlimtalkTemplateVars): string {
    return `
[CRATA 심리검사 티켓]

안녕하세요, ${vars.clientName}님!
${vars.productName} 검사 티켓이 도착했습니다.

▶ 티켓 코드: ${vars.ticketCode}
▶ 검사 링크: ${vars.testUrl}

위 링크를 클릭하여 검사를 진행해주세요.
${vars.expiryDate ? `\n※ 유효기간: ${vars.expiryDate}까지` : ''}
    `.trim();
  }

  // 검사 완료 알림 발송
  async sendTestComplete(
    phoneNumber: string,
    clientName: string,
    resultUrl: string,
  ): Promise<AlimtalkResult> {
    if (!this.apiKey) {
      console.log('[DEV MODE] 검사 완료 알림 시뮬레이션:', { phoneNumber, clientName });
      return { success: true, messageId: `DEV_${Date.now()}` };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.apiKey}/messages`,
        {
          senderKey: this.senderId,
          templateCode: 'TEST_COMPLETE',
          recipientList: [{
            recipientNo: this.formatPhoneNumber(phoneNumber),
            templateParameter: { clientName, resultUrl },
          }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Secret-Key': this.apiKey,
          },
        },
      );

      return { success: true, messageId: response.data?.messages?.[0]?.messageId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
