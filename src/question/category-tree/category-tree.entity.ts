import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { QuestionBank } from '../question-bank.entity';

@Entity({ name: 'category_tree' })
export class CategoryTree {
  @PrimaryColumn({ type: 'varchar' })
  id: string; // 예: 'CAT_BEHAV_INNER'

  @Column({ unique: true })
  code: string; // 예: 'INNER_STIM'

  @Column()
  name: string; // 예: '내적자극형(I)'

  @ManyToOne(() => CategoryTree, (category) => category.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: CategoryTree | null; // 예: 'CAT_BEHAV_MOTIV_POS'
  
  @OneToMany(() => CategoryTree, (category) => category.parent)
  children: CategoryTree[];
  @OneToMany(() => QuestionBank, (qb) => qb.category)
  questions: QuestionBank[];
}