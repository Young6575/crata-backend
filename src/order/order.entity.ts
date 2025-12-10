import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { OrderItem } from './order-item.entity';

@Entity({ name: 'orders' })
export class Order {
  
  @PrimaryGeneratedColumn({ type: 'bigint' })
  orderId: number;

  // [매우 중요] 가맹점(우리)이 생성한 고유 주문 번호
  @Column({ unique: true, nullable: true})
  merchantUid: string;

  // User(1) : Order(N) 관계
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // 총 결제 금액 (원화는 정수)
  @Column({ type: 'int' })
  totalAmount: number;

  // 주문 상태 ('PENDING(보류 중)', 'PAID', 'CANCELLED', 'FAILED')
  @Column({ default: 'PENDING' })
  status: string;

  // 대표 상품명 (e.g. '심리상담 외 2건')
  @Column()
  productName: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  // -------------------------------------------------------
  // [관계 설정] Order(1) : OrderItem(N)
  // "이 주문서에는 여러 개의 주문 항목이 달려있다."
  // -------------------------------------------------------
  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  orderItems: OrderItem[];
}