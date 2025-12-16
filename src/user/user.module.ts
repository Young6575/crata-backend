import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TestResult } from '../result/test-result.entity';
import { Statistics } from '../statistics/statistics.entity';


@Module({
    imports: [
    TypeOrmModule.forFeature([User, TestResult, Statistics]
    )],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule {}
