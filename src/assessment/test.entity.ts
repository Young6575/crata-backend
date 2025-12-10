import { Entity, Column, OneToMany, PrimaryColumn } from 'typeorm';
import { TestVersion } from './test-version.entity';
import { QuestionBank } from '../question/question-bank.entity';
import { Product } from '../product/product.entity';
import { TestResult } from '../result/test-result.entity';
import { Statistics } from '../statistics/statistics.entity';
import { ProductContents } from 'src/product/product-contents.entity';

@Entity({ name: 'tests' })
export class Test {
  @PrimaryColumn({ type: 'varchar' })
  id: string; // 예: 'BEHAVIOR'

  @Column({ unique: true })
  slug: string; // 예: 'behavior-type'

  @Column()
  name: string; // 예: '행동방식유형검사'

  @Column({ type: 'text', nullable: true })
  description: string; // 예: '개인 및 조직의 행동 방식을...'


  // 1. "하나의 검사(Test)는 여러 개의 버전(TestVersion)을 가질 수 있다."
  // (예: '행동 검사'는 'BEHAVIOR_V10', 'BEHAVIOR_V11' 등을 가짐)
  @OneToMany(() => TestVersion, (version) => version.test)
  versions: TestVersion[];

  // 2. "하나의 검사(Test)는 여러 개의 문항(QuestionBank)을 포함할 수 있다."
  // (예: '행동 검사'는 'Q_BEHAV_TASK_V1', 'Q_BEHAV_REL_V1' 등 수백 개의 문항 부품을 가짐)
  @OneToMany(() => QuestionBank, (qb) => qb.test)
  questions: QuestionBank[];

  // 3. "하나의 검사(Test)는 여러 상품(ProductContents)에 포함될 수 있다."
  // (예: '행동 검사'는 '단일 상품', '종합 패키지' 등 여러 상품의 '내용물'이 될 수 있음)
  @OneToMany(() => ProductContents, (content) => content.test)
  products: ProductContents[]; // (변수명을 contents로 해도 좋습니다)

  // 4. "하나의 검사(Test)는 여러 개의 결과지(TestResult)를 생성할 수 있다."
  // (예: '행동 검사'는 홍길동의 결과지, 김철수의 결과지 등 수천 개의 결과지를 가짐)
  @OneToMany(() => TestResult, (result) => result.test)
  testResults: TestResult[];

  // 5. "하나의 검사(Test)는 여러 개의 익명 통계(Statistics)를 가질 수 있다."
  // (예: '행동 검사'는 '20대 남성 통계', '30대 여성 통계' 등 수만 개의 통계 데이터를 가짐)
  @OneToMany(() => Statistics, (stat) => stat.test)
  statistics: Statistics[];
}