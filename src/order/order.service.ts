import { 
  BadRequestException, 
  Injectable, 
  InternalServerErrorException, 
  Logger, 
  NotFoundException, 
  UnauthorizedException 
} from '@nestjs/common';
import { DataSource, Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateOrderItemDto } from './dto/create-order.dto'; 

// 엔티티 임포트
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Ticket } from '../ticket/ticket.entity'; 
import { Product } from '../product/product.entity'; 
import { ProductPriceTier } from '../product/product-price-tier.entity'; 
import { ProductContents } from '../product/product-contents.entity'; 
import { User } from '../user/user.entity'; 
import { Test } from '../assessment/test.entity'; 

interface FinalOrderItem {
  product: Product;
  quantity: number;
  price: number;   // 최종 단가 스냅샷
  subTotal: number; // 임시 계산용 (DB 저장 안됨)
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private datasource: DataSource, 
    @InjectRepository(Product)
    private productRepository: Repository<Product>, // 상품 정보 조회용
    @InjectRepository(User)
    private userRepository: Repository<User>, // 유저 정보 조회용
  ) {}

  /**
   * [핵심 기능] 주문 생성 및 트랜잭션 처리 (원자성 보장)
   */
  async createOrderTransaction(userId: number, items: CreateOrderItemDto[]): Promise<Order> {
    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalAmount = 0;
      const finalOrderItems: FinalOrderItem[] = [];
      
      // 0. 유저 정보 조회 및 검증
      const user = await this.userRepository.findOneBy({ userId });
      if (!user) {
        throw new UnauthorizedException('유효하지 않은 사용자 ID입니다.');
      }

      // 1. 상품 정보 로드
      const productIds = items.map((i) => i.productId);
      const products = await this.productRepository.find({
        where: { productId: In(productIds) },
        relations: ['priceTiers', 'contents', 'contents.test'], // 필요한 모든 관계 로드
      });

      if (products.length !== productIds.length) {
        throw new NotFoundException('요청된 상품 중 일부를 찾을 수 없습니다.');
      }

      // 2. 가격 유효성 검사 및 최종 금액 계산
      for (const itemDto of items) {
        // 2-1. 로드된 상품 정보 사용 (타입 차이 방지를 위해 Number(...)로 비교)
        const product = products.find(
          (p) => Number(p.productId) === Number(itemDto.productId),
        );

        if (!product) {
          // 여기서 바로 에러 던져서 undefined가 calculateUnitPrice로 넘어가지 않게 막음
          throw new NotFoundException( `상품 ID ${itemDto.productId}에 해당하는 상품을 찾을 수 없습니다. (내부 매칭 실패)`);
        }

        // 2-2. 단가 계산 (구간별 가격 적용)
        const unitPrice = this.calculateUnitPrice(product, itemDto.quantity);
        const subTotal = unitPrice * itemDto.quantity;
        totalAmount += subTotal;

        // OrderItem 생성을 위한 데이터를 미리 저장
        finalOrderItems.push({
          product,
          quantity: itemDto.quantity,
          price: unitPrice,
          subTotal,
        });
      }

      // 3. 주문(Order) 테이블에 데이터 저장
      const newOrder = queryRunner.manager.create(Order, {
        user: user, 
        totalAmount: totalAmount,
        status: 'PENDING',
        productName: this.generateOrderName(products), // 대표 상품명 생성
      });
      const savedOrder = await queryRunner.manager.save(newOrder);

      // 4. 주문 항목(OrderItem) 및 티켓(Ticket) 생성
      for (const item of finalOrderItems) {
        // 4-1. OrderItem 저장
        const newOrderItem = queryRunner.manager.create(OrderItem, {
          order: savedOrder,
          product: item.product,
          quantity: item.quantity,
          price: item.price, // DB에 저장되는 주문 당시의 단가
        });
        await queryRunner.manager.save(newOrderItem);

        // 4-2. Ticket 생성 (ProductContents 배열 순회)
        if (
          item.product.type === 'TEST' && 
          item.product.contents && 
          item.product.contents.length > 0
        ) {
          for (const contentLink of item.product.contents) {
            const testId = contentLink.test.id; // 연결된 Test ID 획득

            for (let i = 0; i < item.quantity; i++) {
              const ticketCode = this.generateRandomCode(); 

              this.logger.debug(`Generated ticket code: ${ticketCode} (len=${ticketCode.length})`);
              
              const newTicket = queryRunner.manager.create(Ticket, {
                order: savedOrder,
                product: item.product,
                test: { id: testId } as Test, // FK Shortcut
                code: ticketCode,
                status: 'AVAILABLE',
              });
              await queryRunner.manager.save(newTicket);
            }
          }
        }
      }

      // 5. 성공: 커밋
      await queryRunner.commitTransaction();
      this.logger.log(`주문 성공: ${savedOrder.orderId}, 총 금액: ${totalAmount}`);
      return savedOrder;

    } catch (err: any) {
      // 6. 실패: 롤백
      await queryRunner.rollbackTransaction();
      this.logger.error(`주문 생성 실패 (Rollback): ${err.message}`, err.stack);
      
      // 400, 404, 401 에러는 그대로 던지고, 나머지는 500으로 래핑
      if (
        err instanceof NotFoundException || 
        err instanceof BadRequestException || 
        err instanceof UnauthorizedException
      ) {
        throw err;
      }
      throw new InternalServerErrorException('주문 처리 중 예상치 못한 오류가 발생했습니다.');
      
    } finally {
      // 7. 연결 해제
      await queryRunner.release();
    }
  }

  // ----------------------------------------------------------------------
  // [Helper Functions] 유틸리티 함수
  // ----------------------------------------------------------------------

  /**
   * [Helper] 구간별 가격표를 보고 최종 단가를 계산합니다.
   */
  private calculateUnitPrice(product: Product, quantity: number): number {
    // 1. Service: Tiered Pricing 적용
    if (product.type === 'SERVICE' && product.priceTiers && product.priceTiers.length > 0) {
      const tier = product.priceTiers.find(
        (t) =>
          t.minQuantity <= quantity && (!t.maxQuantity || t.maxQuantity >= quantity),
      );
      if (tier) return tier.unitPrice;
      throw new BadRequestException(
        `[${product.name}] 상품의 수량 ${quantity}에 맞는 구간 가격 정책이 없습니다.`,
      );
    }

    // 2. Test: Fixed Price 적용
    if (
      product.type === 'TEST' &&
      product.price !== null &&
      product.price !== undefined
    ) {
      return product.price;
    }

    // 3. 가격 정보가 아예 없는 경우
    throw new BadRequestException(
      `[${product.name}] 상품의 가격 정보가 설정되지 않았거나 유효하지 않습니다.`,
    );
  }
    
  /**
   * [Helper] 주문명 (대표 상품명)을 생성합니다.
   */
  private generateOrderName(products: Product[]): string {
    if (products.length === 0) return '빈 주문';
    const representativeProduct =
      products.find((p) => p.type === 'TEST') || products[0];
    
    return `${representativeProduct.name} 외 ${products.length - 1}건`;
  }

  /**
   * [Helper] 티켓용 랜덤 코드 생성 (8자리)
   */
  private generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const groupLength = 4;  // 각 그룹 글자 수
    const groupCount = 4;   // 그룹 개수

    const groups: string[] = [];

    for (let g = 0; g < groupCount; g++) {
      let group = '';
      for (let i = 0; i < groupLength; i++) {
        const index = Math.floor(Math.random() * chars.length);
        group += chars.charAt(index);
      }
      groups.push(group);
    }

    return groups.join('-'); // 예: 'AB9D-X0P1-QWER-7Z3K'
  }

}
