import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment } from './payment.entity';
import { Order } from '../order/order.entity';
import { OrderItem } from '../order/order-item.entity';
import { Ticket } from '../ticket/ticket.entity';
import { Product } from '../product/product.entity';
import { TossPaymentService } from './toss-payment.service';
import { ConfirmPaymentDto, RefundPaymentDto, CreateOrderDto } from './dto/payment.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Ticket) private ticketRepo: Repository<Ticket>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    private tossService: TossPaymentService,
    private dataSource: DataSource,
  ) {}

  // 주문 생성
  async createOrder(userId: number, dto: CreateOrderDto) {
    const product = await this.productRepo.findOne({
      where: { productId: dto.productId },
      relations: ['priceTiers'],
    });
    if (!product) throw new HttpException('상품을 찾을 수 없습니다', HttpStatus.NOT_FOUND);

    // 가격 계산 (구간별 가격 적용)
    let unitPrice = product.price || 0;
    if (product.priceTiers?.length > 0) {
      const tier = product.priceTiers.find(
        t => dto.quantity >= t.minQuantity && 
             (t.maxQuantity === null || dto.quantity <= t.maxQuantity)
      );
      if (tier) unitPrice = tier.unitPrice;
    }
    const totalAmount = unitPrice * dto.quantity;

    // merchantUid 생성
    const merchantUid = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const order = this.orderRepo.create({
      merchantUid,
      user: { userId } as any,
      totalAmount,
      status: 'PENDING',
      productName: product.name,
    });
    await this.orderRepo.save(order);

    const orderItem = this.orderItemRepo.create({
      order,
      product,
      quantity: dto.quantity,
      price: unitPrice,
    });
    await this.orderItemRepo.save(orderItem);

    return {
      orderId: merchantUid,
      amount: totalAmount,
      orderName: product.name,
      productId: product.productId,
      quantity: dto.quantity,
    };
  }

  // 결제 승인
  async confirmPayment(dto: ConfirmPaymentDto) {
    const order = await this.orderRepo.findOne({
      where: { merchantUid: dto.orderId },
      relations: ['orderItems', 'orderItems.product', 'user'],
    });
    if (!order) throw new HttpException('주문을 찾을 수 없습니다', HttpStatus.NOT_FOUND);
    
    // 이미 결제된 주문인지 확인 (중복 결제 방지)
    if (order.status === 'PAID') {
      throw new HttpException('이미 결제가 완료된 주문입니다', HttpStatus.BAD_REQUEST);
    }
    if (order.status !== 'PENDING') {
      throw new HttpException('결제할 수 없는 주문 상태입니다', HttpStatus.BAD_REQUEST);
    }
    
    // 금액 검증 (위변조 방지)
    if (order.totalAmount !== dto.amount) {
      throw new HttpException('결제 금액이 일치하지 않습니다', HttpStatus.BAD_REQUEST);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 토스페이먼츠 결제 승인
      const tossResult = await this.tossService.confirmPayment(
        dto.paymentKey,
        dto.orderId,
        dto.amount,
      );

      // Payment 레코드 생성 (토스 전체 응답을 rawResponse에 저장)
      const payment = this.paymentRepo.create({
        order,
        pgTid: dto.paymentKey,
        amount: dto.amount,
        paymentMethod: tossResult.method,
        status: 'PAID',
        receiptUrl: tossResult.receipt?.url,
        paidAt: new Date(tossResult.approvedAt),
        rawResponse: tossResult,
      });
      await queryRunner.manager.save(payment);

      // Order 상태 업데이트
      order.status = 'PAID';
      order.paidAt = new Date();
      await queryRunner.manager.save(order);

      // Ticket 생성
      const tickets: Ticket[] = [];
      for (const item of order.orderItems) {
        for (let i = 0; i < item.quantity; i++) {
          const ticket = this.ticketRepo.create({
            code: `TKT_${uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()}`,
            status: 'AVAILABLE',
            order,
            product: item.product,
          });
          tickets.push(ticket);
        }
      }
      await queryRunner.manager.save(tickets);

      await queryRunner.commitTransaction();

      return {
        paymentId: payment.paymentId,
        status: 'PAID' as const,
        orderId: order.merchantUid,
        amount: payment.amount,
        receiptUrl: payment.receiptUrl,
        tickets: tickets.map(t => ({ ticketId: t.ticketId, code: t.code })),
      };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      // 결제 실패 기록
      const failedPayment = this.paymentRepo.create({
        order,
        pgTid: dto.paymentKey,
        amount: dto.amount,
        status: 'FAILED',
        failedAt: new Date(),
        rawResponse: {
          error: true,
          code: error.response?.code || 'UNKNOWN_ERROR',
          message: error.response?.message || error.message,
        },
      });
      await this.paymentRepo.save(failedPayment);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 환불 처리
  async refundPayment(dto: RefundPaymentDto) {
    const payment = await this.paymentRepo.findOne({
      where: { paymentId: dto.paymentId },
      relations: ['order', 'order.orderItems'],
    });
    if (!payment) throw new HttpException('결제 정보를 찾을 수 없습니다', HttpStatus.NOT_FOUND);
    if (payment.status !== 'PAID') {
      throw new HttpException('환불 가능한 결제가 아닙니다', HttpStatus.BAD_REQUEST);
    }

    // 미사용 티켓 확인
    const tickets = await this.ticketRepo.find({
      where: { order: { orderId: payment.order.orderId } },
    });
    const unusedTickets = tickets.filter(t => t.status === 'AVAILABLE');

    if (dto.ticketIds?.length) {
      // 특정 티켓만 환불
      const targetTickets = unusedTickets.filter(t => dto.ticketIds!.includes(Number(t.ticketId)));
      if (targetTickets.length !== dto.ticketIds.length) {
        throw new HttpException('환불 가능한 티켓이 아닙니다', HttpStatus.BAD_REQUEST);
      }
    }

    const refundCount = dto.ticketIds?.length || unusedTickets.length;
    if (refundCount === 0) {
      throw new HttpException('환불 가능한 티켓이 없습니다', HttpStatus.BAD_REQUEST);
    }

    // 환불 금액 계산
    const unitPrice = payment.amount / tickets.length;
    const refundAmount = dto.refundAmount || Math.floor(unitPrice * refundCount);

    // 토스페이먼츠 환불 요청
    await this.tossService.cancelPayment(payment.pgTid, dto.reason, refundAmount);

    // 티켓 상태 업데이트
    const ticketsToCancel = dto.ticketIds 
      ? unusedTickets.filter(t => dto.ticketIds!.includes(Number(t.ticketId)))
      : unusedTickets;
    
    for (const ticket of ticketsToCancel) {
      ticket.status = 'CANCELLED';
    }
    await this.ticketRepo.save(ticketsToCancel);

    // 취소 정보 저장 (rawResponse에 취소 내역 추가)
    payment.cancelledAt = new Date();
    payment.rawResponse = {
      ...payment.rawResponse,
      cancelInfo: {
        cancelledAt: new Date().toISOString(),
        cancelAmount: ((payment.rawResponse?.cancelInfo?.cancelAmount as number) || 0) + refundAmount,
        cancelReason: dto.reason,
      },
    };

    // 전체 환불인 경우 결제/주문 상태 변경
    const remainingTickets = tickets.filter(
      (t) => !ticketsToCancel.some((ct) => ct.ticketId === t.ticketId),
    );
    if (remainingTickets.every((t) => t.status !== 'AVAILABLE')) {
      payment.status = 'CANCELLED';
      payment.order.status = 'CANCELLED';
      await this.orderRepo.save(payment.order);
    }
    await this.paymentRepo.save(payment);

    return {
      success: true,
      refundAmount,
      cancelledTickets: ticketsToCancel.map((t) => t.ticketId),
    };
  }

  // 사용자 결제 내역 조회
  async getUserPayments(userId: number) {
    return this.paymentRepo.find({
      where: { order: { user: { userId } } },
      relations: ['order', 'order.orderItems', 'order.orderItems.product'],
      order: { paidAt: 'DESC' },
    });
  }
}
