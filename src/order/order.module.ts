import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderItem } from './order-item.entity';
import { Order } from './order.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Ticket } from 'src/ticket/ticket.entity';
import { Product } from 'src/product/product.entity';
import { User } from 'src/user/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Order,
            OrderItem,
            Ticket,
            Product,
            User
        ]),
    ],
    providers: [OrderService],
    controllers: [OrderController]
})
export class OrderModule {}
