import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ConfirmPaymentDto, RefundPaymentDto, CreateOrderDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  // 주문 생성 (결제 전)
  @Post('orders')
  @UseGuards(JwtAuthGuard)
  async createOrder(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.paymentService.createOrder(req.user.userId, dto);
  }

  // 결제 승인
  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  async confirmPayment(@Body() dto: ConfirmPaymentDto) {
    return this.paymentService.confirmPayment(dto);
  }

  // 환불 요청
  @Post('refund')
  @UseGuards(JwtAuthGuard)
  async refundPayment(@Body() dto: RefundPaymentDto) {
    return this.paymentService.refundPayment(dto);
  }

  // 내 결제 내역 조회
  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyPayments(@Req() req: any) {
    return this.paymentService.getUserPayments(req.user.userId);
  }
}
