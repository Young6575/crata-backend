import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToMany, PrimaryColumn } from 'typeorm';
import { Test } from './test.entity';
import { VersionQuestionMap } from './version-question-map.entity';
import { TestResult } from '../result/test-result.entity';

@Entity({ name: 'test_versions' })
export class TestVersion {
  @PrimaryColumn({ type: 'varchar' })
  id: string; // 예: 'BEHAVIOR_V10'

  @ManyToOne(() => Test, (test) => test.versions)
  @JoinColumn({ name: 'test_id' })
  test: Test; // 예: 'BEHAVIOR'

  @Column()
  versionCode: string; // 예: 'v10'

  @Column()
  status: string; // 예: 'ACTIVE', 'INACTIVE'

  @CreateDateColumn()
  publishedAt: Date;

  @OneToMany(() => VersionQuestionMap, (map) => map.version)
  questionMap: VersionQuestionMap[];
  @OneToMany(() => TestResult, (result) => result.version)
  testResults: TestResult[];
}