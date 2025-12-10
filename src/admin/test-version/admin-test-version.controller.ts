import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminTestVersionService } from './admin-test-version.service';
import { CreateTestVersionDto, UpdateTestVersionDto, UpdateStatusDto } from './dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('api/admin/test-versions')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminTestVersionController {
  constructor(private readonly testVersionService: AdminTestVersionService) {}

  /**
   * GET /api/admin/test-versions
   * 모든 TestVersion 목록 조회 (Test별 그룹화)
   */
  @Get()
  async findAll() {
    return this.testVersionService.findAll();
  }

  /**
   * GET /api/admin/test-versions/questions?testId=BEHAVIOR
   * 특정 Test의 사용 가능한 질문 목록 조회
   */
  @Get('questions')
  async getAvailableQuestions(@Query('testId') testId: string) {
    return this.testVersionService.getAvailableQuestions(testId);
  }

  /**
   * GET /api/admin/test-versions/:id
   * 특정 TestVersion 상세 조회
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.testVersionService.findOne(id);
  }

  /**
   * POST /api/admin/test-versions
   * 새 TestVersion 생성
   */
  @Post()
  async create(@Body() dto: CreateTestVersionDto) {
    return this.testVersionService.create(dto);
  }

  /**
   * PATCH /api/admin/test-versions/:id
   * TestVersion 수정 (질문 구성 변경)
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTestVersionDto) {
    return this.testVersionService.update(id, dto);
  }

  /**
   * PATCH /api/admin/test-versions/:id/status
   * TestVersion 상태 변경
   */
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.testVersionService.updateStatus(id, dto);
  }

  /**
   * DELETE /api/admin/test-versions/:id
   * TestVersion 삭제
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.testVersionService.remove(id);
  }
}
