import {  Entity,  PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany} from 'typeorm';
import { ProductPriceTier } from './product-price-tier.entity';
import { ProductContents } from './product-contents.entity'; // 'ProductTestLink' 대신 'ProductContents'

@Entity({ name: 'products' })
export class Product {
  
  @PrimaryGeneratedColumn({ type: 'bigint' })
  productId: number;

  // 'TEST'(검사지), 'SERVICE'(워크샵)
  @Column({ default: 'TEST'})
  type : string;

  @Column({ nullable: false })
  name: string;

  // [수정] nullable: true로 변경 (구간별 가격이 있을 수 있으므로)
  @Column({ type: 'int', nullable: true }) 
  price: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: false, default: 'ACTIVE' })
  status: string;

  @Column({ nullable: true })
  imageUrl: string;

  // 결과지 페이지 조합 (behavior 검사용)
  // 예: [1, 2, 6, 7, 8] - 개인수준, [1, 3, 6, 7, 8] - 집단수준
  @Column({ type: 'jsonb', nullable: true })
  resultPages: number[];

  // 색채유형 결과지 페이지 조합
  // 예: [1, 2, 3] - 전체, [2, 3] - 기본
  @Column({ type: 'jsonb', nullable: true })
  colorResultPages: number[];

  // -------------------------------------------------------
  // [추가] 1. "종합 패키지"용 연결 (1:N)
  // (이 상품이 어떤 검사지들로 구성되어 있는지)
  // -------------------------------------------------------
  @OneToMany(() => ProductContents, (content) => content.product, { cascade: true })
  contents: ProductContents[];

  // -------------------------------------------------------
  // [추가] 2. "구간별 가격"용 연결 (1:N)
  // (이 상품의 가격 정책은?)
  // -------------------------------------------------------
  @OneToMany(() => ProductPriceTier, (tier) => tier.product, { cascade: true })
  priceTiers: ProductPriceTier[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}