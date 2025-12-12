import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Order } from '../order/order.entity';

@Entity({ name: 'payments' })
export class Payment {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  paymentId: number;

  // Payment(1) : Order(1)
  @OneToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  // PG사 거래 고유 ID (토스페이먼츠의 paymentKey)
  // 결제 승인, 취소, 조회 시 사용되는 식별자
  @Column({ unique: true })
  pgTid: string;

  @Column({ type: 'int' })
  amount: number;

  // 결제 수단 ('카드', '가상계좌', '계좌이체', '휴대폰' 등)
  @Column({ nullable: true })
  paymentMethod: string;

  // 결제 상태 ('READY', 'PAID', 'FAILED', 'CANCELLED')
  @Column({ default: 'READY' })
  status: string;

  @Column({ nullable: true })
  receiptUrl: string;

  // 결제 승인 시각
  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  // 실패 시각
  @Column({ type: 'timestamp', nullable: true })
  failedAt: Date;

  // 취소 시각
  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  // 토스페이먼츠 전체 응답 (카드정보, 간편결제, 취소내역 등 모든 정보 포함)
  @Column({ type: 'jsonb', nullable: true })
  rawResponse: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}