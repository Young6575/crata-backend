import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './group.entity';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { GroupAnalyticsController } from './group-analytics.controller';
import { GroupAnalyticsService } from './group-analytics.service';
import { Ticket } from 'src/ticket/ticket.entity';
import { TestResult } from 'src/result/test-result.entity';
import { TicketModule } from 'src/ticket/ticket.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Group, TestResult, Ticket]),
        TicketModule,
    ],
    controllers: [GroupController, GroupAnalyticsController],
    providers: [GroupService, GroupAnalyticsService],
    exports: [GroupAnalyticsService],
})
export class GroupModule {}
