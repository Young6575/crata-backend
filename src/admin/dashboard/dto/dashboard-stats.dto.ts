import { IsOptional, IsString, IsIn } from 'class-validator';

export class PeriodStatsDto {
  total: number;
  previousTotal: number;
  changePercent: number;
}

export class DashboardStatsDto {
  completedTests: PeriodStatsDto;
  revenue: PeriodStatsDto;
  newUsers: PeriodStatsDto;
  pendingTickets: number;
  inProgressTests: number;
}

export class RecentTestDto {
  id: string;
  clientName: string;
  testName: string;
  completedAt: Date;
}

export class RecentOrderDto {
  orderId: number;
  userName: string;
  productName: string;
  amount: number;
  status: string;
  createdAt: Date;
}

export class DashboardOverviewDto {
  stats: DashboardStatsDto;
  recentTests: RecentTestDto[];
  recentOrders: RecentOrderDto[];
}

export class DateRangeQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly'])
  period?: 'daily' | 'weekly' | 'monthly';
}
