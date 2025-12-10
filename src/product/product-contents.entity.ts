import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';
import { Test } from '../assessment/test.entity';
import { CategoryTree } from 'src/question/category-tree/category-tree.entity';


@Entity({ name: 'product_contents' })
export class ProductContents {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // [연결] 어떤 상품에 속하는 내용물인가? (예: "종합 패키지")
  @ManyToOne(() => Product, (product) => product.contents)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  // [연결] 어떤 검사지를 내용물로 포함하는가? (예: "행동 검사")
  @ManyToOne(() => Test, (test) => test.products)
  @JoinColumn({ name: 'test_id' })
  test: Test;

  @ManyToOne(() =>CategoryTree, {nullable: true})
  @JoinColumn({ name: 'category_id' })
  category: CategoryTree | null;

}