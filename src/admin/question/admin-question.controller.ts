import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AdminQuestionService } from './admin-question.service';
import { CreateQuestionDto, UpdateQuestionDto, BulkUploadPreviewDto, BulkUploadConfirmDto } from './dto';

@Controller('api/admin/questions')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminQuestionController {
  constructor(private readonly adminQuestionService: AdminQuestionService) {}

  // 질문 목록 조회 (트리 구조)
  @Get()
  async findAll() {
    return this.adminQuestionService.findAll();
  }

  // 참조 데이터 조회 (검사유형, 카테고리, 옵션셋 이름 목록)
  @Get('reference-data')
  async getReferenceData() {
    return this.adminQuestionService.getReferenceData();
  }

  // 단일 질문 조회
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.adminQuestionService.findOne(id);
  }

  // 버전 히스토리 조회
  @Get('versions/:baseCode')
  async getVersionHistory(@Param('baseCode') baseCode: string) {
    return this.adminQuestionService.getVersionHistory(baseCode);
  }

  // 질문 생성
  @Post()
  async create(@Body() dto: CreateQuestionDto) {
    return this.adminQuestionService.create(dto);
  }

  // 엑셀 벌크 업로드 - 미리보기
  @Post('bulk-upload/preview')
  async bulkUploadPreview(@Body() dto: BulkUploadPreviewDto) {
    return this.adminQuestionService.bulkUploadPreview(dto.rows, dto.version);
  }

  // 엑셀 벌크 업로드 - 실제 등록
  @Post('bulk-upload/confirm')
  async bulkUploadConfirm(@Body() dto: BulkUploadConfirmDto) {
    return this.adminQuestionService.bulkUploadConfirm(dto.rows, dto.version, dto.skipErrors);
  }

  // 질문 수정 (새 버전 생성)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.adminQuestionService.update(id, dto);
  }

  // 질문 삭제
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.adminQuestionService.delete(id);
  }
}
