import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Product } from './product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductContents } from './product-contents.entity';
import { Test } from 'src/assessment/test.entity';
import { ProductPriceTier } from './product-price-tier.entity';

@Injectable()
export class ProductService {
    private readonly logger = new Logger(ProductService.name);

    constructor(
        @InjectRepository(Product)
        private productRepository: Repository<Product>,

        private dataSource: DataSource
    ) {}

    // 모든 상품 목록 조회
    async findAllProducts(): Promise<Product[]> {
        return this.productRepository.find({
            relations: ['priceTiers'],
        });
    }

    // 단일 상품 조회
    async findOneProduct(productId: number): Promise<Product | null> {
        return this.productRepository.findOne({
            where: { productId },
            relations: ['contents', 'priceTiers'],
        });
    }

    //(POST) "종합 패키지" 또는 "구간별 가격" 상품을 등록합니다.  
    // [트랜잭션]을 사용하여 여러 테이블에 데이터를 동시에 저장합니다.
    async createComplexProduct(dto: CreateProductDto): Promise<Product> {

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 2. DTO에서 상품 기본 정보와 '관계' 정보를 분리
            // [참고] priceTiers와 contents를 분리하고 나머지를 productData에 담습니다.
            const { contents, priceTiers, ...productData} = dto; // contents에는 해당 상품의 검사 목록들이 있음.

            // 3. (1단계) 'Product' 저장
            // manager.create: 엔티티 객체를 '생성' (아직 DB 저장 X)
            const newProduct = queryRunner.manager.create(Product, productData);
            // manager.save: DB에 '저장' (INSERT)
            await queryRunner.manager.save(newProduct);

            // 4. (2단계) 'ProductContents' 저장
            // 예시: 이 상품은 'BEHAVIOR'와 'EMOTION' 검사지로 구성됨
            if (contents && contents.length > 0) {
                for (const contentDto of contents) {

                    const categoryRefernce = contentDto.categoryId
                        ? { id: contentDto.categoryId }
                        : null;


                    const link = queryRunner.manager.create(ProductContents, {
                        product: newProduct, // 3단계에서 만든 새 상품과 연결
                        test: { id: contentDto.testId} as Test, // 'testId'로 'Test' 객체를 참조
                        category: categoryRefernce,
                    });
                    await queryRunner.manager.save(link);
                }
            }

            // 5. (3단계) 'ProductPriceTier' 저장
            if (priceTiers && priceTiers.length > 0) {
                for (const tierDto of priceTiers) {
                    const tier = queryRunner.manager.create(ProductPriceTier, {
                        product: newProduct, // 3단계에서 만든 새 상품과 연결
                        ...tierDto, //  minQuantity, maxQuantity, unitPrice
                    });
                    await queryRunner.manager.save(tier);
                }
            }

            // 6. [성공] 모든 저장이 성공했으면 트랜잭션을 '확정(Commit)'
            await queryRunner.commitTransaction();

            this.logger.log(`새 상품 등록 성공: ${newProduct.name}`);

            // 7. 완성된 상품 정보 반환 (relations를 통해 관계된 정보까지 로드)
            const finalProduct = await this.productRepository.findOne({
                where: { productId: newProduct.productId },
                // [수정 6] 'priceTier' (단수)가 아닌 'priceTiers' (복수)로 수정해야 합니다!
                relations: ['contents', 'priceTiers'], 
            });

            return finalProduct!;

        } catch(error) {
            // 7. [실패] 하나라도 실패하면 모든 작업을 되돌림(Rollback)
            await queryRunner.rollbackTransaction();
            this.logger.error(`상품 등록 실패: ${error.message}`);
            throw new InternalServerErrorException('상품 등록 중 오류가 발생했습니다.');
        
        } finally {
            // 8. [마무리] DB 연결 해제
            await queryRunner.release();
        }


    
    }
   


}
