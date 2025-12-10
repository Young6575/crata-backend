import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { AdminProductService } from './admin-product.service';
import { CreateAdminProductDto } from './dto/create-product.dto';
import { UpdateAdminProductDto, UpdateProductStatusDto } from './dto/update-product.dto';

@Controller('api/admin/products')
export class AdminProductController {
  constructor(private readonly adminProductService: AdminProductService) {}

  @Get()
  async findAll() {
    return this.adminProductService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adminProductService.findOne(id);
  }

  @Post()
  async create(@Body(ValidationPipe) dto: CreateAdminProductDto) {
    return this.adminProductService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) dto: UpdateAdminProductDto,
  ) {
    return this.adminProductService.update(id, dto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) dto: UpdateProductStatusDto,
  ) {
    return this.adminProductService.updateStatus(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.adminProductService.delete(id);
    return { success: true, message: 'Product deleted' };
  }
}
