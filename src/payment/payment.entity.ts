import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Order } from '../order/order.entity';

@Entity({ name: 'payments' })
export class Payment {

  @PrimaryGeneratedColumn({ type: 'bigint' })
  paymentId: number;

  // Payment(1) : Order(1)
  // "어떤 주문에 대한 결제인가" (주문 하나당 결제 성공은 보통 하나)
  @OneToOne(() => Order)
  @JoinColumn({ name: 'order_id' }) // DB에 order_id 컬럼 생성
  order: Order;

  // PG사 거래 번호 (아임포트 imp_uid 등)
  @Column({ unique: true })
  pgTid: string; // imp_uid

  @Column({ type: 'int' })
  amount: number;

  // 결제 수단 ('CARD', 'V_BANK', 'KAKAO' ...)
  @Column({ nullable: true })
  paymentMethod: string;

  // 결제 상태 ('READY', 'PAID', 'FAILED', 'CANCELLED')
  @Column({ default: 'READY' })
  status: string;

  @Column({ nullable: true })
  receiptUrl: string;

  // 결제 승인 시각 (자동 생성 X, PG사 응답 시간 저장 추천)
  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  failedAt: Date;

  @Column({ type: 'text', nullable: true })
  failureReason: string;
}