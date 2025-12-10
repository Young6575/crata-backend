import { Body, Controller, Post, UseGuards, ValidationPipe, Request } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('order') // 주소: http://localhost:3000/orde
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    @UseGuards(AuthGuard('jwt')) // 로그인된 유저만 접근 허용
    @Post()
    async createOrder(
        @Body(ValidationPipe) dto: CreateOrderDto,
        @Request() req
    ) {
        // JWT 토큰에서 유저 ID를 꺼내서 Service로 전달.
        const userId = req.user.userId;
        
        // 이제 Service에서 모든 트랙잭션 로직(가격 계산, 상품 조회, 티켓 생성)을 처리합니다.
        return this.orderService.createOrderTransaction(userId, dto.items);
    }

}
