import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThan } from 'typeorm';
import { TestResult } from '../../result/test-result.entity';
import { User } from '../../user/user.entity';
import { Ticket } from '../../ticket/ticket.entity';
import { Payment } from '../../payment/payment.entity';
import { Order } from '../../order/order.entity';
import {
  DashboardStatsDto,
  DashboardOverviewDto,
  PeriodStatsDto,
  RecentTestDto,
  RecentOrderDto,
  DateRangeQueryDto,
} from './dto/dashboard-stats.dto';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(TestResult)
    private readonly testResultRepo: Repository<TestResult>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async getDashboardOverview(query: DateRangeQueryDto): Promise<DashboardOverviewDto> {
    const [stats, recentTests, recentOrders] = await Promise.all([
      this.getStats(query),
      this.getRecentTests(),
      this.getRecentOrders(),
    ]);

    return { stats, recentTests, recentOrders };
  }

  async getStats(query: DateRangeQueryDto): Promise<DashboardStatsDto> {
    const { currentStart, currentEnd, previousStart, previousEnd } = 
      this.calculateDateRange(query);

    const [completedTests, revenue, newUsers, pendingTickets, inProgressTests] = 
      await Promise.all([
        this.getCompletedTestsStats(currentStart, currentEnd, previousStart, previousEnd),
        this.getRevenueStats(currentStart, currentEnd, previousStart, previousEnd),
        this.getNewUsersStats(currentStart, currentEnd, previousStart, previousEnd),
        this.getPendingTicketsCount(),
        this.getInProgressTestsCount(),
      ]);

    return {
      completedTests,
      revenue,
      newUsers,
      pendingTickets,
      inProgressTests,
    };
  }


  private calculateDateRange(query: DateRangeQueryDto) {
    const now = new Date();
    let currentStart: Date;
    let currentEnd: Date;
    let previousStart: Date;
    let previousEnd: Date;

    if (query.startDate && query.endDate) {
      currentStart = new Date(query.startDate);
      currentEnd = new Date(query.endDate);
      currentEnd.setHours(23, 59, 59, 999);
      
      const duration = currentEnd.getTime() - currentStart.getTime();
      previousEnd = new Date(currentStart.getTime() - 1);
      previousStart = new Date(previousEnd.getTime() - duration);
    } else {
      const period = query.period || 'monthly';
      
      switch (period) {
        case 'daily':
          currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          currentEnd = now;
          previousStart = new Date(currentStart);
          previousStart.setDate(previousStart.getDate() - 1);
          previousEnd = new Date(currentStart.getTime() - 1);
          break;
        case 'weekly':
          const dayOfWeek = now.getDay();
          currentStart = new Date(now);
          currentStart.setDate(now.getDate() - dayOfWeek);
          currentStart.setHours(0, 0, 0, 0);
          currentEnd = now;
          previousStart = new Date(currentStart);
          previousStart.setDate(previousStart.getDate() - 7);
          previousEnd = new Date(currentStart.getTime() - 1);
          break;
        case 'monthly':
        default:
          currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
          currentEnd = now;
          previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          previousEnd = new Date(currentStart.getTime() - 1);
          break;
      }
    }

    return { currentStart, currentEnd, previousStart, previousEnd };
  }

  private calculateChangePercent(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  private async getCompletedTestsStats(
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date,
  ): Promise<PeriodStatsDto> {
    const [currentCount, previousCount] = await Promise.all([
      this.testResultRepo.count({
        where: { createdAt: Between(currentStart, currentEnd) },
      }),
      this.testResultRepo.count({
        where: { createdAt: Between(previousStart, previousEnd) },
      }),
    ]);

    return {
      total: currentCount,
      previousTotal: previousCount,
      changePercent: this.calculateChangePercent(currentCount, previousCount),
    };
  }

  private async getRevenueStats(
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date,
  ): Promise<PeriodStatsDto> {
    const [currentResult, previousResult] = await Promise.all([
      this.paymentRepo
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'total')
        .where('payment.status = :status', { status: 'PAID' })
        .andWhere('payment.paidAt BETWEEN :start AND :end', {
          start: currentStart,
          end: currentEnd,
        })
        .getRawOne(),
      this.paymentRepo
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'total')
        .where('payment.status = :status', { status: 'PAID' })
        .andWhere('payment.paidAt BETWEEN :start AND :end', {
          start: previousStart,
          end: previousEnd,
        })
        .getRawOne(),
    ]);

    const current = parseInt(currentResult?.total || '0', 10);
    const previous = parseInt(previousResult?.total || '0', 10);

    return {
      total: current,
      previousTotal: previous,
      changePercent: this.calculateChangePercent(current, previous),
    };
  }

  private async getNewUsersStats(
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date,
  ): Promise<PeriodStatsDto> {
    const [currentCount, previousCount] = await Promise.all([
      this.userRepo.count({
        where: { createdAt: Between(currentStart, currentEnd) },
      }),
      this.userRepo.count({
        where: { createdAt: Between(previousStart, previousEnd) },
      }),
    ]);

    return {
      total: currentCount,
      previousTotal: previousCount,
      changePercent: this.calculateChangePercent(currentCount, previousCount),
    };
  }

  private async getPendingTicketsCount(): Promise<number> {
    return this.ticketRepo.count({
      where: { status: 'AVAILABLE', isCompleted: false },
    });
  }

  private async getInProgressTestsCount(): Promise<number> {
    return this.ticketRepo.count({
      where: { status: 'USED', isCompleted: false },
    });
  }

  private async getRecentTests(limit = 5): Promise<RecentTestDto[]> {
    const results = await this.testResultRepo.find({
      relations: ['test', 'ticket'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return results.map((r) => ({
      id: r.id,
      clientName: r.userMeta?.name || '익명',
      testName: r.test?.name || '검사',
      completedAt: r.createdAt,
    }));
  }

  private async getRecentOrders(limit = 5): Promise<RecentOrderDto[]> {
    const orders = await this.orderRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return orders.map((o) => ({
      orderId: o.orderId,
      userName: o.user?.name || '익명',
      productName: o.productName,
      amount: o.totalAmount,
      status: o.status,
      createdAt: o.createdAt,
    }));
  }
}
