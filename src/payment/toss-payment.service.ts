import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface TossConfirmResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  method: string;
  requestedAt: string;
  approvedAt: string;
  receipt: { url: string };
  easyPay?: { provider: string; amount: number };
  card?: { company: string; number: string; installmentPlanMonths: number };
}

interface TossCancelResponse {
  paymentKey: string;
  cancels: { cancelAmount: number; canceledAt: string; cancelReason: string }[];
  status: string;
}

interface TossErrorResponse {
  code: string;
  message: string;
}

// 토스페이먼츠 에러 코드별 사용자 친화적 메시지
const TOSS_ERROR_MESSAGES: Record<string, string> = {
  // 공통 에러
  UNAUTHORIZED_KEY: '인증되지 않은 키입니다. 관리자에게 문의해주세요.',
  FORBIDDEN_REQUEST: '허용되지 않은 요청입니다.',
  NOT_FOUND_PAYMENT: '결제 정보를 찾을 수 없습니다.',
  NOT_FOUND_PAYMENT_SESSION: '결제 세션이 만료되었습니다. 다시 시도해주세요.',
  
  // 결제 승인 에러
  ALREADY_PROCESSED_PAYMENT: '이미 처리된 결제입니다.',
  PROVIDER_ERROR: '결제사 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  EXCEED_MAX_CARD_INSTALLMENT_PLAN: '할부 개월 수가 초과되었습니다.',
  INVALID_CARD_EXPIRATION: '카드 유효기간이 올바르지 않습니다.',
  INVALID_STOPPED_CARD: '정지된 카드입니다.',
  INVALID_CARD_LOST_OR_STOLEN: '분실 또는 도난 카드입니다.',
  RESTRICTED_CARD: '사용이 제한된 카드입니다.',
  EXCEED_MAX_DAILY_PAYMENT_COUNT: '일일 결제 한도를 초과했습니다.',
  EXCEED_MAX_PAYMENT_AMOUNT: '결제 금액 한도를 초과했습니다.',
  INVALID_CARD_NUMBER: '카드 번호가 올바르지 않습니다.',
  INVALID_CARD_COMPANY: '지원하지 않는 카드사입니다.',
  BELOW_MINIMUM_AMOUNT: '최소 결제 금액 미만입니다.',
  
  // 취소/환불 에러
  ALREADY_CANCELED_PAYMENT: '이미 취소된 결제입니다.',
  NOT_CANCELABLE_PAYMENT: '취소할 수 없는 결제입니다.',
  NOT_CANCELABLE_AMOUNT: '취소 가능 금액을 초과했습니다.',
  INVALID_REFUND_ACCOUNT_INFO: '환불 계좌 정보가 올바르지 않습니다.',
  
  // 가상계좌 에러
  INVALID_BANK: '지원하지 않는 은행입니다.',
  NOT_AVAILABLE_BANK: '현재 이용할 수 없는 은행입니다.',
};

@Injectable()
export class TossPaymentService {
  private readonly logger = new Logger(TossPaymentService.name);
  private readonly secretKey: string;
  private readonly baseUrl = 'https://api.tosspayments.com/v1/payments';

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('TOSS_SECRET_KEY') || '';
  }

  private getAuthHeader(): string {
    const encoded = Buffer.from(`${this.secretKey}:`).toString('base64');
    return `Basic ${encoded}`;
  }

  // 토스 에러 처리
  private handleTossError(error: any, defaultMessage: string): never {
    const tossError: TossErrorResponse = error.response?.data;
    const errorCode = tossError?.code || 'UNKNOWN_ERROR';
    const errorMessage = tossError?.message || defaultMessage;
    
    // 로깅 (디버깅용)
    this.logger.error(`Toss Payment Error: ${errorCode} - ${errorMessage}`);
    
    // 사용자 친화적 메시지 반환
    const userMessage = TOSS_ERROR_MESSAGES[errorCode] || errorMessage;
    
    // HTTP 상태 코드 매핑
    let httpStatus = HttpStatus.BAD_REQUEST;
    if (errorCode === 'UNAUTHORIZED_KEY') {
      httpStatus = HttpStatus.UNAUTHORIZED;
    } else if (errorCode === 'FORBIDDEN_REQUEST') {
      httpStatus = HttpStatus.FORBIDDEN;
    } else if (errorCode.startsWith('NOT_FOUND')) {
      httpStatus = HttpStatus.NOT_FOUND;
    }
    
    throw new HttpException(
      { code: errorCode, message: userMessage },
      httpStatus,
    );
  }

  // 결제 승인
  async confirmPayment(
    paymentKey: string,
    orderId: string,
    amount: number,
  ): Promise<TossConfirmResponse> {
    try {
      const response = await axios.post<TossConfirmResponse>(
        `${this.baseUrl}/confirm`,
        { paymentKey, orderId, amount },
        {
          headers: {
            Authorization: this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error: any) {
      this.handleTossError(error, '결제 승인에 실패했습니다.');
    }
  }

  // 결제 취소 (환불)
  async cancelPayment(
    paymentKey: string,
    cancelReason: string,
    cancelAmount?: number,
  ): Promise<TossCancelResponse> {
    try {
      const body: any = { cancelReason };
      if (cancelAmount) body.cancelAmount = cancelAmount;

      const response = await axios.post<TossCancelResponse>(
        `${this.baseUrl}/${paymentKey}/cancel`,
        body,
        {
          headers: {
            Authorization: this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error: any) {
      this.handleTossError(error, '결제 취소에 실패했습니다.');
    }
  }

  // 결제 조회
  async getPayment(paymentKey: string): Promise<TossConfirmResponse> {
    try {
      const response = await axios.get<TossConfirmResponse>(
        `${this.baseUrl}/${paymentKey}`,
        {
          headers: { Authorization: this.getAuthHeader() },
        },
      );
      return response.data;
    } catch (error: any) {
      this.handleTossError(error, '결제 정보 조회에 실패했습니다.');
    }
  }
}
