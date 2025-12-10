import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Type } from 'class-transformer';
import { Statistics } from './statistics.entity';

@Module({
    imports : [
        TypeOrmModule.forFeature([
            Statistics
        ])
    ]
})
export class StatisticsModule {}
