// src/question/category-tree.controller.ts

import { Controller, Post } from '@nestjs/common';
import { CategoryTreeService } from './category-tree.service';

@Controller('question/seed') // 주소: http://localhost:3000/question/seed
export class CategoryTreeController {
  constructor(private readonly categoryTreeService: CategoryTreeService) {}

  @Post('categories') // POST http://localhost:3000/question/seed/categories
  async seedCategories() {
    const count = await this.categoryTreeService.seedCategories();
    return { success: true, message: `카테고리 계층 구조 ${count}개 삽입 완료.` };
  }
}