import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { OptionSet } from './option-set.entity';

@Entity({ name: 'set_options' })
export class SetOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => OptionSet, (set) => set.options)
  @JoinColumn({ name: 'set_id' })
  set: OptionSet; // 예: 'LIKERT_5'

  @Column()
  label: string; // 예: '매우 그렇다'

  @Column({ type: 'int' })
  score: number; // 예: 5

  @Column()
  valueCode: string; // 예: 'VERY_TRUE'
}