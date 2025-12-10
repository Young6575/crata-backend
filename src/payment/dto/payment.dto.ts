import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

// 결제 승인 요청 DTO
export class ConfirmPaymentDto {
  @IsString()
  paymentKey: string;

  @IsString()
  orderId: string; // merchantUid

  @IsNumber()
  amount: number;
}

// 환불 요청 DTO
export class RefundPaymentDto {
  @IsNumber()
  paymentId: number;

  @IsString()
  reason: string;

  @IsOptional()
  @IsNumber()
  refundAmount?: number; // 부분 환불 시

  @IsOptional()
  @IsArray()
  ticketIds?: number[]; // 환불할 티켓 지정
}

// 주문 생성 요청 DTO
export class CreateOrderDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  groupId?: number;
}

// 결제 응답 DTO
export class PaymentResultDto {
  paymentId: number;
  status: 'PAID' | 'FAILED' | 'CANCELLED';
  orderId: string;
  amount: number;
  receiptUrl?: string;
  tickets?: {
    ticketId: number;
    code: string;
  }[];
}
