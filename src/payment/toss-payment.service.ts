import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
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
}

interface TossCancelResponse {
  paymentKey: string;
  cancels: { cancelAmount: number; canceledAt: string }[];
}

@Injectable()
export class TossPaymentService {
  private readonly secretKey: string;
  private readonly baseUrl = 'https://api.tosspayments.com/v1/payments';

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('TOSS_SECRET_KEY') || '';
  }

  private getAuthHeader(): string {
    const encoded = Buffer.from(`${this.secretKey}:`).toString('base64');
    return `Basic ${encoded}`;
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
      const message = error.response?.data?.message || '결제 승인 실패';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
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
      const message = error.response?.data?.message || '결제 취소 실패';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
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
      const message = error.response?.data?.message || '결제 조회 실패';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }
}
