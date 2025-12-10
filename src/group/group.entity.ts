import { TestResult } from "src/result/test-result.entity";
import { Ticket } from "src/ticket/ticket.entity";
import { User } from "src/user/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: "groups"})
export class Group {
    @PrimaryGeneratedColumn({ type: 'bigint'})
    groupId: number;

    // 그룹명 (예: 2025 하반기 공채 1팀)
    @Column()
    groupName: string;

    // 이 그룹을 만든 담당자 (User)
    @ManyToOne(() => User)
    @JoinColumn({ name: 'admin_id'})
    admin: User;

    // 부모 그룹 (하위 그룹 구조 지원)
    @ManyToOne(() => Group, (group) => group.subGroups, { nullable: true })
    @JoinColumn({ name: 'parent_group_id' })
    parentGroup: Group | null;

    // 하위 그룹들
    @OneToMany(() => Group, (group) => group.parentGroup)
    subGroups: Group[];

    // 서비스(워크숍 등) 진행 상태 
    // 예: 'NONE'(없음), 'PENDING'(일정조율중), 'CONFIRMED'(확정), 'COMPLETED'(완료)
    @Column({ default: 'NONE' })
    serviceStatus: string;

    // 1개 그룹 : N개 티켓
    @OneToMany(() => Ticket, (ticket) => ticket.group)
    tickets: Ticket[];

    @OneToMany(() => TestResult, (result) => result.group)
    testResults: TestResult[];

    @CreateDateColumn()
    createdAt: Date;
}