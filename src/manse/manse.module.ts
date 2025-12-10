import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Manse } from './manse.entity';
import { ManseService } from './manse.service';
import { ManseController } from './manse.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Manse])],
  providers: [ManseService],
  controllers: [ManseController],
  exports: [ManseService],
})
export class ManseModule {}
