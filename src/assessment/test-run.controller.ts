import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TestRunService } from './test-run.service';
import { SubmitResultDto } from './dto/submit-result.dto';

@Controller('assessment/tests')
export class TestRunController {
  constructor(private readonly testRunService: TestRunService) {}

  @Get(':slug/questions')
  async getQuestions(@Param('slug') slug: string) {
    return this.testRunService.getQuestionsBySlug(slug);
  }

  @Post(':slug/results')
  async submitResult(
    @Param('slug') slug: string,
    @Body() dto: SubmitResultDto,
  ) {
    return this.testRunService.submitResult(slug, dto);
  }
}
