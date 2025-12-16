import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';  
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { LicenseModule } from './license/license.module';
import { OrderModule } from './order/order.module';
import { PaymentModule } from './payment/payment.module';
import { AuthModule } from './auth/auth.module';
import { GroupModule } from './group/group.module';
import { TicketModule } from './ticket/ticket.module';
import { StatisticsModule } from './statistics/statistics.module';
import { AssessmentModule } from './assessment/assessment.module';
import { QuestionModule } from './question/question.module';
import { ResultModule } from './result/result.module';
import { ManseModule } from './manse/manse.module';
import { AdminModule } from './admin/admin.module';
import { KakaoModule } from './kakao/kakao.module';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '1234',
      database: process.env.DB_DATABASE || 'postgres',
      entities: [],
      synchronize: process.env.NODE_ENV !== 'production', // 프로덕션에서는 false
      autoLoadEntities: true,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      extra: {
        timezone: 'Asia/Seoul',
      },
    }),
    UserModule,
    ProductModule,
    LicenseModule,
    OrderModule,
    PaymentModule,
    AuthModule,
    GroupModule,
    TicketModule,
    StatisticsModule,
    AssessmentModule,
    QuestionModule,
    ResultModule,
    ManseModule,
    AdminModule,
    KakaoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})


export class AppModule {}
