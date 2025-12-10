import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminDashboardService } from './admin-dashboard.service';
import { DateRangeQueryDto, DashboardOverviewDto, DashboardStatsDto } from './dto/dashboard-stats.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('api/admin/dashboard')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get()
  async getDashboardOverview(
    @Query() query: DateRangeQueryDto,
  ): Promise<DashboardOverviewDto> {
    return this.dashboardService.getDashboardOverview(query);
  }

  @Get('stats')
  async getStats(@Query() query: DateRangeQueryDto): Promise<DashboardStatsDto> {
    return this.dashboardService.getStats(query);
  }
}
