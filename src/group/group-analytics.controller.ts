import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { GroupAnalyticsService } from './group-analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/groups')
export class GroupAnalyticsController {
  constructor(private analyticsService: GroupAnalyticsService) {}

  // 그룹 종합 분석 데이터
  @Get(':id/analytics')
  @UseGuards(JwtAuthGuard)
  async getGroupAnalytics(@Param('id') id: string) {
    return this.analyticsService.getGroupAnalytics(Number(id));
  }

  // 그룹 구성원 목록 (필터링)
  @Get(':id/members')
  @UseGuards(JwtAuthGuard)
  async getGroupMembers(
    @Param('id') id: string,
    @Query('type') typeFilter?: string,
  ) {
    return this.analyticsService.getGroupMembers(Number(id), typeFilter);
  }

  // 하위 그룹 목록 조회
  @Get(':id/subgroups')
  @UseGuards(JwtAuthGuard)
  async getSubGroups(@Param('id') id: string) {
    return this.analyticsService.getSubGroups(Number(id));
  }

  // 하위 그룹 비교 분석
  @Get(':id/subgroups/comparison')
  @UseGuards(JwtAuthGuard)
  async getSubGroupComparison(@Param('id') id: string) {
    return this.analyticsService.getSubGroupComparison(Number(id));
  }
}
