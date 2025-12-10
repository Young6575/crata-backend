import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Payment } from './payment.entity';
import { Order } from '../order/order.entity';
import { OrderItem } from '../order/order-item.entity';
import { Ticket } from '../ticket/ticket.entity';
import { Product } from '../product/product.entity';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { TossPaymentService } from './toss-payment.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Payment, Order, OrderItem, Ticket, Product]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, TossPaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
