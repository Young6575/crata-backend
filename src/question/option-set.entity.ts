import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { SetOption } from './set-option.entity';
import { QuestionBank } from './question-bank.entity';

@Entity({ name: 'option_sets' })
export class OptionSet {
  @PrimaryColumn({ type: 'varchar' })
  id: string; // 예: 'LIKERT_5'

  @Column()
  name: string; // 예: '5점 척도'

  @Column({ type: 'text', nullable: true })
  description: string; // 예: '매우 그렇다(5) ~ 매우 아니다(1)'

  @OneToMany(() => SetOption, (option) => option.set)
  options: SetOption[];
  @OneToMany(() => QuestionBank, (qb) => qb.optionSet)
  questions: QuestionBank[];
}