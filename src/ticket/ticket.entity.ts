import { Test } from "@nestjs/testing";
import { Group } from "src/group/group.entity";
import { Order } from "src/order/order.entity";
import { Product } from "src/product/product.entity";
import { TestResult } from "src/result/test-result.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: 'tickets'})
export class Ticket {

    @PrimaryGeneratedColumn({ type: 'bigint'})
    ticketId: number;

    @Column({ type: 'varchar', unique:true})
    code: string;

    @Column({ default: 'AVAILABLE'})
    status: string;

    // -------------------------------------------------------
    // 🔗 관계 설정 (Relations)
    // -------------------------------------------------------

    // 1. 어떤 주문에서 나왔니?
    @ManyToOne(() => Order)
    @JoinColumn({ name: 'order_id'})
    order: Order;

    // 2. 무슨 검사니?
    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product_id'})
    product: Product;

    // 3. 어느 그룹 소속이니?
    @ManyToOne(() => Group, (group) => group.tickets)
    @JoinColumn({ name: 'group_id'})
    group: Group | null;

    // -------------------------------------------------------
    // 👤 수신자 정보 & 발송 상태 (알림톡용)
    // -------------------------------------------------------

    // 수신자 이름
    @Column({ nullable: true})
    clientName: string;

    // 수신자 전화번호
    @Column({ nullable: true})
    clientPhoneNumber: string;

    // 알림톡 발송 여부
    @Column({ default: false})
    isSent: boolean;

    // 검사 완료 여부
    @Column({ default: false})
    isCompleted: boolean;

    // -------------------------------------------------------
    // 🕒 시간 기록
    // -------------------------------------------------------

    // 실제 사용(검사시작) 일시
    @Column({ type: 'timestamp', nullable: true })
    usedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToOne(() => TestResult, (result) => result.ticket)
    testResult: TestResult;

}