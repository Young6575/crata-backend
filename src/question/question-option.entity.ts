import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { QuestionBank } from './question-bank.entity';

@Entity({ name: 'question_options' })
export class QuestionOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => QuestionBank, (qb) => qb.options)
  @JoinColumn({ name: 'question_bank_id' })
  questionBank: QuestionBank; // 예: 'Q_EMOTE_COLOR_MAIN'

  @Column()
  label: string; // 예: '레드'

  @Column({ type: 'int', default: 0 })
  score: number; // 예: 0

  @Column()
  valueCode: string; // 예: 'RED'

  @Column({ type: 'jsonb', nullable: true })
  metadata: any; // 예: { "hex": "#FF0000" }
}