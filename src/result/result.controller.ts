import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ResultService } from './result.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/results')
export class ResultController {
  constructor(private readonly resultService: ResultService) {}

  /**
   * POST /api/results/fortune
   * Fortune(1년 컨설팅) 결과 저장 - 인증 불필요
   */
  @Post('fortune')
  async saveFortuneResult(
    @Body() body: { ticketCode: string; userMeta: any; resultSnapshot: any },
  ) {
    return this.resultService.saveFortuneResult(body);
  }

  /**
   * GET /api/results
   * 현재 사용자의 검사 결과 목록 조회
   * admin인 경우 모든 결과 조회
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyResults(@Request() req: any) {
    if (req.user.role === 'admin') {
      return this.resultService.findAll();
    }
    return this.resultService.findByUser(req.user.userId);
  }

  /**
   * GET /api/results/:id
   * 특정 검사 결과 상세 조회
   * admin인 경우 모든 결과 접근 가능
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getResult(@Param('id') id: string, @Request() req: any) {
    return this.resultService.findOne(id, req.user.userId, req.user.role);
  }
}
