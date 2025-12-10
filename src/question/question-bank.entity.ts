import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Test } from '../assessment/test.entity';
import { CategoryTree } from './category-tree/category-tree.entity';
import { OptionSet } from './option-set.entity';
import { QuestionOption } from './question-option.entity';
import { VersionQuestionMap } from '../assessment/version-question-map.entity';

@Entity({ name: 'question_bank' })
export class QuestionBank {
  @PrimaryColumn({ type: 'varchar' })
  id: string; // 예: 'Q_BEHAV_TASK_V1'

  @Column()
  baseCode: string; // 예: 'Q_BEHAV_TASK'

  @ManyToOne(() => Test, (test) => test.questions)
  @JoinColumn({ name: 'test_id' })
  test: Test; // 예: 'BEHAVIOR'

  @Column()
  questionType: string; // 예: 'BEHAVIOR'

  @Column({ type: 'text' })
  defaultText: string; // 예: '나는 일을 진행할 때 과제 중심으로...'

  @Column()
  optionType: string; // 예: 'SET' 또는 'UNIQUE'

  @ManyToOne(() => OptionSet, (set) => set.questions, { nullable: true })
  @JoinColumn({ name: 'option_set_id' })
  optionSet: OptionSet | null; // 예: 'LIKERT_5'

  @ManyToOne(() => CategoryTree, (cat) => cat.questions, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: CategoryTree | null; // 예: 'CAT_BEHAV_TASK'

  @Column({ type: 'jsonb', nullable: true })
  metadata: any; // 예: { "axis": "LEFT", "score_reverse": false }

  @OneToMany(() => QuestionOption, (option) => option.questionBank)
  options: QuestionOption[];
  @OneToMany(() => VersionQuestionMap, (map) => map.questionBank)
  versions: VersionQuestionMap[];
}