import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity({ name: 'product_price_tiers' })
export class ProductPriceTier {
  
  @PrimaryGeneratedColumn({ type: 'bigint' })
  tierId: number;

  // [연결] 이 가격표는 어떤 상품의 것인가? (예: "조직 소통 워크숍")
  @ManyToOne(() => Product, (product) => product.priceTiers)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  // [구간] 최소 인원 (예: 3)
  @Column({ type: 'int' })
  minQuantity: number;

  // [구간] 최대 인원 (예: 5)
  // (만약 null이면 '11명 이상'처럼 무제한을 의미)
  @Column({ type: 'int', nullable: true })
  maxQuantity: number;

  // [가격] 이 구간일 때의 1인당 단가
  @Column({ type: 'int' })
  unitPrice: number; // 예: 50000
}