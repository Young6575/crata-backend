import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { ProductService } from './product.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateProductDto } from './dto/create-product.dto';



@Controller('product') // 주소: http://localhost:3000/product
export class ProductController {

    constructor(private readonly productService: ProductService) {}

    @UseGuards(AuthGuard('jwt')) // 로그인된 유저만 접근 허용
    @HttpCode(HttpStatus.CREATED)
    @Post()
    async create(@Body(ValidationPipe) dto: CreateProductDto) {
        
        return this.productService.createComplexProduct(dto);
    }

    @Get()
    async findAll() {
        return this.productService.findAllProducts();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.productService.findOneProduct(parseInt(id));
    }

}
