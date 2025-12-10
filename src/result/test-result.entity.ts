import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToOne } from 'typeorm';
import { Test } from '../assessment/test.entity';
import { TestVersion } from '../assessment/test-version.entity';
import { User } from '../user/user.entity';
import { Group } from '../group/group.entity';
import { Ticket } from '../ticket/ticket.entity';

@Entity({ name: 'test_results' })
export class TestResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @ManyToOne(() => Group, (group) => group.testResults, { nullable: true })
  @JoinColumn({ name: 'group_id' })
  group: Group | null; // 예: 101 (삼성전자 그룹)

  @ManyToOne(() => User, (user) => user.testResults, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null; // 예: 25 (개인 구매자)

  @ManyToOne(() => Test, (test) => test.testResults)
  @JoinColumn({ name: 'test_id' })
  test: Test; // 예: 'BEHAVIOR'

  @ManyToOne(() => TestVersion, (version) => version.testResults)
  @JoinColumn({ name: 'version_id' })
  version: TestVersion; // 예: 'BEHAVIOR_V10'

  @OneToOne(() => Ticket, (ticket) => ticket.testResult)
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket; // 예: 500

  @Column()
  resultVersion: string; // 예: 'ResultV3' (프론트 컴포넌트 이름)

  @Column({ type: 'jsonb' })
  userMeta: any; // 예: { "name": "홍길동", "gender": "M" }

  @Column({ type: 'jsonb' })
  answers: any; // 예: [ {"q_id": "Q_BEHAV_TASK_V1", "value": "VERY_TRUE", "score": 5}, ... ]

  @Column({ type: 'jsonb', nullable: true }) 
  resultSnapshot: any; // 예: { "mainType": "CAT_BEHAV_INNER", "scores": { ... } }

  @CreateDateColumn()
  createdAt: Date;
}