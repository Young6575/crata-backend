import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ResultService } from './result.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/results')
@UseGuards(JwtAuthGuard)
export class ResultController {
  constructor(private readonly resultService: ResultService) {}

  /**
   * GET /api/results
   * 현재 사용자의 검사 결과 목록 조회
   */
  @Get()
  async getMyResults(@Request() req: any) {
    return this.resultService.findByUser(req.user.userId);
  }

  /**
   * GET /api/results/:id
   * 특정 검사 결과 상세 조회
   */
  @Get(':id')
  async getResult(@Param('id') id: string, @Request() req: any) {
    return this.resultService.findOne(id, req.user.userId);
  }
}
