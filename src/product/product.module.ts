import { Module } from '@nestjs/common';
import { Product } from './product.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductPriceTier } from './product-price-tier.entity';
import { ProductContents } from './product-contents.entity';

@Module({
    imports: [
    TypeOrmModule.forFeature([
        Product,
        ProductPriceTier,
        ProductContents]
    )],
    controllers: [ProductController],
    providers: [ProductService],
})
export class ProductModule {}
