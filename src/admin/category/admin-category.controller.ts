import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AdminCategoryService } from './admin-category.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller('api/admin/categories')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminCategoryController {
  constructor(private readonly adminCategoryService: AdminCategoryService) {}

  // 카테고리 트리 조회
  @Get('tree')
  async getTree() {
    return this.adminCategoryService.getTree();
  }

  // 모든 카테고리 목록
  @Get()
  async findAll() {
    return this.adminCategoryService.findAll();
  }

  // 카테고리 생성
  @Post()
  async create(@Body() dto: CreateCategoryDto) {
    return this.adminCategoryService.create(dto);
  }
}
