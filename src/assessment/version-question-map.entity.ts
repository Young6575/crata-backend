import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TestVersion } from './test-version.entity';
import { QuestionBank } from '../question/question-bank.entity';



@Entity({ name: 'version_question_map' })
export class VersionQuestionMap {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TestVersion, (version) => version.questionMap)
  @JoinColumn({ name: 'version_id' })
  version: TestVersion; // 예: 'BEHAVIOR_V10'

  @ManyToOne(() => QuestionBank)
  @JoinColumn({ name: 'question_bank_id' })
  questionBank: QuestionBank; // 예: 'Q_BEHAV_TASK_V1'

  @Column({ type: 'int' })
  displayOrder: number; // 예: 1 (첫 번째 질문)
}