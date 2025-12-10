import { Controller, Post } from '@nestjs/common';
import { QuestionSeedService } from './question-seed.service';

@Controller('question/seed')
export class QuestionSeedController {
  constructor(private readonly questionSeedService: QuestionSeedService) {}

  @Post() // POST http://localhost:3000/question/seed
  async seed() {
    await this.questionSeedService.seedQuestions();
    return { message: '질문지 데이터 생성 작업이 완료되었습니다.' };
  }

  @Post('categories') // POST http://localhost:3000/question/seed/categories
  async seedCategories() {
    const result = await this.questionSeedService.seedCategories();
    return { 
      message: '카테고리 시딩 완료',
      ...result,
    };
  }

  @Post('colors') // POST http://localhost:3000/question/seed/colors
  async seedColorCategories() {
    const result = await this.questionSeedService.seedColorCategories();
    return { 
      message: '색채 카테고리 시딩 완료',
      ...result,
    };
  }
}