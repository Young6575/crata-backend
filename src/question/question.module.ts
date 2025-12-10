import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// 1. 이 모듈이 관리할 5개의 테이블 설계도(엔티티)를 모두 가져옵니다.
import { CategoryTree } from './category-tree/category-tree.entity';
import { OptionSet } from './option-set.entity';
import { SetOption } from './set-option.entity';
import { QuestionBank } from './question-bank.entity';
import { QuestionOption } from './question-option.entity';
import { CategoryTreeService } from './category-tree/category-tree.service';
import { CategoryTreeController } from './category-tree/category-tree.controller';
import { QuestionSeedController } from './question-seed.controller';
import { QuestionSeedService } from './question-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CategoryTree,     // (계층 구조)
      OptionSet,        // (공유 보기 목록)
      SetOption,        // (공유 보기 항목)
      QuestionBank,     // (문항 은행)
      QuestionOption,   // (고유 보기)
    ]),
  ],
  
  controllers: [CategoryTreeController, QuestionSeedController],
  providers: [CategoryTreeService, QuestionSeedService],
})
export class QuestionModule {}