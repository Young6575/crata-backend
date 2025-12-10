import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Test } from '../assessment/test.entity';

@Entity({ name: 'statistics' })
export class Statistics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Test, (test) => test.statistics)
  @JoinColumn({ name: 'test_id' })
  test: Test; // 예: 'BEHAVIOR'

  @Column({ nullable: true })
  ageGroup: string; // 예: '30대'

  @Column({ nullable: true })
  gender: string; // 예: 'M'

  @Column({ type: 'jsonb' })
  resultData: any; // 예: { "mainType": "CAT_BEHAV_INNER", "scores": { ... } }

  @Column({ type: 'timestamp' })
  testDate: Date; // 예: '2025-11-17 14:30:00'
}