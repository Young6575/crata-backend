import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../product/product.entity';

@Entity({ name: 'order_items' })
export class OrderItem {

  @PrimaryGeneratedColumn({ type: 'bigint' })
  orderItemId: number;

  // OrderItem(N) : Order(1)
  // "이 항목은 어떤 주문서에 속해있는가"
  @ManyToOne(() => Order, (order) => order.orderItems)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  // OrderItem(N) : Product(1)
  // "이 항목은 어떤 상품인가"
  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  // 주문 수량
  @Column({ type: 'int' })
  quantity: number;

  // [중요] 주문 당시의 가격 (스냅샷)
  // 상품 가격이 나중에 올라도, 이 주문의 가격은 변하면 안 됨
  @Column({ type: 'int' })
  price: number;
}