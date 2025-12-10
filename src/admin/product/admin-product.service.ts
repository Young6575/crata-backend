import { Injectable, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from '../../product/product.entity';
import { ProductContents } from '../../product/product-contents.entity';
import { ProductPriceTier } from '../../product/product-price-tier.entity';
import { Test } from '../../assessment/test.entity';
import { CategoryTree } from '../../question/category-tree/category-tree.entity';
import { CreateAdminProductDto } from './dto/create-product.dto';
import { UpdateAdminProductDto, UpdateProductStatusDto } from './dto/update-product.dto';

@Injectable()
export class AdminProductService {
  private readonly logger = new Logger(AdminProductService.name);

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductContents)
    private contentsRepository: Repository<ProductContents>,
    @InjectRepository(ProductPriceTier)
    private priceTierRepository: Repository<ProductPriceTier>,
    private dataSource: DataSource,
  ) {}

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      relations: ['contents', 'contents.test', 'contents.category', 'priceTiers'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { productId: id },
      relations: ['contents', 'contents.test', 'contents.category', 'priceTiers'],
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async create(dto: CreateAdminProductDto): Promise<Product> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { contents, priceTiers, ...productData } = dto;

      // 1. Create Product
      const newProduct = queryRunner.manager.create(Product, {
        ...productData,
        status: 'ACTIVE',
      });
      await queryRunner.manager.save(newProduct);

      // 2. Create ProductContents
      if (contents && contents.length > 0) {
        for (const contentDto of contents) {
          const content = queryRunner.manager.create(ProductContents, {
            product: newProduct,
            test: { id: contentDto.testId } as Test,
            category: contentDto.categoryId ? { id: contentDto.categoryId } as CategoryTree : null,
          });
          await queryRunner.manager.save(content);
        }
      }

      // 3. Create PriceTiers
      if (priceTiers && priceTiers.length > 0) {
        for (const tierDto of priceTiers) {
          const tier = queryRunner.manager.create(ProductPriceTier, {
            product: newProduct,
            ...tierDto,
          });
          await queryRunner.manager.save(tier);
        }
      }

      await queryRunner.commitTransaction();
      this.logger.log(`Product created: ${newProduct.name}`);

      return this.findOne(newProduct.productId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create product: ${error.message}`);
      throw new InternalServerErrorException('Failed to create product');
    } finally {
      await queryRunner.release();
    }
  }


  async update(id: number, dto: UpdateAdminProductDto): Promise<Product> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await this.findOne(id);
      const { contents, priceTiers, ...productData } = dto;

      // 1. Update Product basic info
      Object.assign(product, productData);
      await queryRunner.manager.save(product);

      // 2. Update Contents (delete old, create new)
      if (contents !== undefined) {
        await queryRunner.manager.delete(ProductContents, { product: { productId: id } });
        for (const contentDto of contents) {
          const content = queryRunner.manager.create(ProductContents, {
            product: product,
            test: { id: contentDto.testId } as Test,
            category: contentDto.categoryId ? { id: contentDto.categoryId } as CategoryTree : null,
          });
          await queryRunner.manager.save(content);
        }
      }

      // 3. Update PriceTiers (delete old, create new)
      if (priceTiers !== undefined) {
        await queryRunner.manager.delete(ProductPriceTier, { product: { productId: id } });
        for (const tierDto of priceTiers) {
          const tier = queryRunner.manager.create(ProductPriceTier, {
            product: product,
            ...tierDto,
          });
          await queryRunner.manager.save(tier);
        }
      }

      await queryRunner.commitTransaction();
      this.logger.log(`Product updated: ${product.name}`);

      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to update product: ${error.message}`);
      throw new InternalServerErrorException('Failed to update product');
    } finally {
      await queryRunner.release();
    }
  }

  async updateStatus(id: number, dto: UpdateProductStatusDto): Promise<Product> {
    const product = await this.findOne(id);
    product.status = dto.status;
    await this.productRepository.save(product);
    this.logger.log(`Product status updated: ${product.name} -> ${dto.status}`);
    return product;
  }

  async delete(id: number): Promise<void> {
    const product = await this.findOne(id);
    // TODO: Check if product has orders before deleting
    await this.productRepository.remove(product);
    this.logger.log(`Product deleted: ${product.name}`);
  }
}
